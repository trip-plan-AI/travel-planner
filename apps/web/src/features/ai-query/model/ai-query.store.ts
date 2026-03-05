import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/shared/api';
import { useTripStore } from '@/entities/trip';
import type { RoutePoint } from '@/entities/route-point/model/route-point.types';
import type { ChatMessage, ChatMeta, ChatRoutePlan } from '@/shared/types/ai-chat';

interface AiPlanResponse {
  session_id: string;
  route_plan: ChatRoutePlan;
  meta: ChatMeta;
}

interface HttpError {
  status?: number;
  message?: string;
}

interface AiQueryStore {
  messages: ChatMessage[];
  isLoading: boolean;
  sessionId: string | null;
  lastAppliedPlanMessageId: string | null;
  sendQuery: (query: string, tripId?: string) => Promise<void>;
  applyPlanToCurrentTrip: (messageId: string) => void;
  clearChat: () => void;
}

const MAX_QUERY_LENGTH = 1000;

function sanitizeQuery(query: string) {
  const withoutControlChars = Array.from(query)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 || char === '\n' || char === '\r' || char === '\t';
    })
    .join('');

  return withoutControlChars.replace(/\s+/g, ' ').trim().slice(0, MAX_QUERY_LENGTH);
}

function mapErrorToUserMessage(error: HttpError) {
  if (error.status === 401) return 'Сессия истекла. Выполните вход повторно.';
  if (error.status === 422)
    return 'Не удалось построить маршрут по запросу. Уточните город и предпочтения.';
  if (error.status === 429) return 'Слишком много запросов. Подождите немного и повторите.';
  if (error.status === 504) return 'AI сервис отвечает слишком долго. Попробуйте повторить запрос.';
  return error.message ?? 'Неизвестная ошибка. Попробуйте еще раз.';
}

function toRoutePoints(routePlan: ChatRoutePlan, tripId: string): RoutePoint[] {
  return routePlan.days.flatMap((day) =>
    day.points.map((point) => ({
      id: point.poi.id,
      tripId,
      title: point.poi.name,
      lat: point.poi.coordinates.lat,
      lon: point.poi.coordinates.lon,
      budget: point.estimated_cost ?? null,
      visitDate: day.date,
      imageUrl: point.poi.image_url ?? null,
      address: point.poi.address,
      order: point.order,
      createdAt: new Date().toISOString(),
    })),
  );
}

function fallbackHint(meta: ChatMeta) {
  if (!meta.fallbacks_triggered.length) return '';

  return `\n⚠️ Режим деградации: ${meta.fallbacks_triggered.join(', ')}`;
}

export const useAiQueryStore = create<AiQueryStore>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      sessionId: null,
      lastAppliedPlanMessageId: null,

      sendQuery: async (query, tripId) => {
        const normalized = sanitizeQuery(query);
        if (!normalized || get().isLoading) return;

        const requestId = crypto.randomUUID();

        set((state) => ({
          isLoading: true,
          messages: [
            ...state.messages,
            {
              id: requestId,
              role: 'user',
              content: normalized,
              timestamp: new Date().toISOString(),
            },
          ],
        }));

        try {
          const response = await api.post<AiPlanResponse>('/ai/plan', {
            user_query: normalized,
            trip_id: tripId,
            session_id: get().sessionId,
          });

          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content:
              `Составил маршрут по городу ${response.route_plan.city} ` +
              `на ${response.route_plan.days.length} дн.${fallbackHint(response.meta)}`,
            routePlan: response.route_plan,
            meta: response.meta,
            timestamp: new Date().toISOString(),
          };

          set((state) => ({
            isLoading: false,
            sessionId: response.session_id,
            messages: [...state.messages, assistantMessage],
          }));
        } catch (rawError) {
          const error = rawError as HttpError;

          set((state) => ({
            isLoading: false,
            messages: [
              ...state.messages,
              {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: mapErrorToUserMessage(error),
                timestamp: new Date().toISOString(),
                isError: true,
              },
            ],
          }));
        }
      },

      applyPlanToCurrentTrip: (messageId) => {
        const message = get().messages.find((item) => item.id === messageId);
        const currentTrip = useTripStore.getState().currentTrip;

        if (!message?.routePlan || !currentTrip) return;

        const points = toRoutePoints(message.routePlan, currentTrip.id);
        useTripStore.getState().setPoints(points);

        set({ lastAppliedPlanMessageId: messageId });
      },

      clearChat: () => {
        set({ messages: [], sessionId: null, isLoading: false, lastAppliedPlanMessageId: null });
      },
    }),
    {
      name: 'ai-query-store',
      partialize: (state) => ({
        messages: state.messages,
        sessionId: state.sessionId,
        lastAppliedPlanMessageId: state.lastAppliedPlanMessageId,
      }),
    },
  ),
);

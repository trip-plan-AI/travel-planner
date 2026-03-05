import { create } from 'zustand';
import { api } from '@/shared/api';

interface ApiPoi {
  name?: string;
  title?: string;
  description?: string;
}

interface ApiPlannedPoint {
  poi_id?: string;
  title?: string;
  description?: string;
  poi?: ApiPoi;
}

interface ApiRoutePlanDay {
  points: ApiPlannedPoint[];
}

interface ApiRoutePlan {
  days: ApiRoutePlanDay[];
}

interface AiPlanResponse {
  session_id: string;
  route_plan: ApiRoutePlan;
}

interface ChatRoutePlanPoint {
  poi_id: string;
  title: string;
  description?: string;
}

interface ChatRoutePlanDay {
  points: ChatRoutePlanPoint[];
}

interface ChatRoutePlan {
  days: ChatRoutePlanDay[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  routePlan?: ChatRoutePlan;
  timestamp: Date;
}

interface AiQueryStore {
  messages: ChatMessage[];
  isLoading: boolean;
  sessionId: string | null;
  sendQuery: (query: string, tripId?: string) => Promise<void>;
}

function mapRoutePlan(input: ApiRoutePlan): ChatRoutePlan {
  return {
    days: input.days.map((day, dayIndex) => ({
      points: day.points.map((point, pointIndex) => ({
        poi_id: point.poi_id ?? `${dayIndex}-${pointIndex}`,
        title: point.title ?? point.poi?.title ?? point.poi?.name ?? 'Точка маршрута',
        description: point.description ?? point.poi?.description,
      })),
    })),
  };
}

export const useAiQueryStore = create<AiQueryStore>((set, get) => ({
  messages: [],
  isLoading: false,
  sessionId: null,

  sendQuery: async (query, tripId) => {
    set((s) => ({
      isLoading: true,
      messages: [
        ...s.messages,
        { id: crypto.randomUUID(), role: 'user', content: query, timestamp: new Date() },
      ],
    }));

    try {
      const resp = await api.post<AiPlanResponse>('/ai/plan', {
        user_query: query,
        trip_id: tripId,
        session_id: get().sessionId,
      });

      set((s) => ({
        isLoading: false,
        sessionId: resp.session_id,
        messages: [
          ...s.messages,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Составил план на ${resp.route_plan.days.length} дн.`,
            routePlan: mapRoutePlan(resp.route_plan),
            timestamp: new Date(),
          },
        ],
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Неизвестная ошибка';
      set((s) => ({
        isLoading: false,
        messages: [
          ...s.messages,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Ошибка: ${message}`,
            timestamp: new Date(),
          },
        ],
      }));
    }
  },
}));

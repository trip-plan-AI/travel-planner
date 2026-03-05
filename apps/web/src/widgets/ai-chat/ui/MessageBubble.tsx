'use client';

interface RoutePlanPoint {
  poi_id: string;
  title: string;
  description?: string;
}

interface RoutePlanDay {
  points: RoutePlanPoint[];
}

interface RoutePlan {
  days: RoutePlanDay[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  routePlan?: RoutePlan;
}

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div
        className={[
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm',
          isAssistant
            ? 'bg-white text-slate-800 border border-slate-100'
            : 'bg-brand-indigo text-white',
        ].join(' ')}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {message.routePlan && isAssistant && (
          <div className="mt-3 flex flex-col gap-2">
            {message.routePlan.days
              .flatMap((day) => day.points)
              .map((point) => (
                <div
                  key={point.poi_id}
                  className="rounded-xl bg-slate-50 p-3 border border-slate-100"
                >
                  <p className="font-medium text-slate-800">{point.title}</p>
                  {point.description && (
                    <p className="mt-1 text-xs text-slate-500">{point.description}</p>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { MessageBubble, type ChatMessage } from './MessageBubble';

interface AiChatProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onSend: (query: string) => void;
  quickActions?: string[];
}

const DEFAULT_QUICK_ACTIONS = [
  'Добавь ресторан',
  'Сократи маршрут',
  'Что посмотреть?',
  'Смени город',
];

export function AiChat({
  messages,
  isLoading = false,
  onSend,
  quickActions = DEFAULT_QUICK_ACTIONS,
}: AiChatProps) {
  const [query, setQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = () => {
    const trimmed = query.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setQuery('');
  };

  return (
    <div className="flex h-full min-h-[560px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <h2 className="text-base font-bold text-brand-indigo">AI Ассистент</h2>
        <p className="mt-1 text-xs text-slate-500">
          Спросите про маршрут, бюджет и идеи для путешествия
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <p className="max-w-sm text-sm text-slate-500">
              Напишите первый запрос, чтобы сгенерировать план поездки.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex w-16 gap-1 rounded-2xl bg-white p-3">
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => onSend(action)}
              disabled={isLoading}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-brand-sky hover:text-brand-sky disabled:cursor-not-allowed disabled:opacity-50"
            >
              {action}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Например: 2 дня в Казани с бюджетом 10000"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="brand"
            size="icon"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

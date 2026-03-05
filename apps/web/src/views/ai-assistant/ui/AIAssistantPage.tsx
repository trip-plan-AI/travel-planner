'use client';

import { useState } from 'react';
import { AiChat, type ChatMessage } from '@/widgets/ai-chat';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-message',
    role: 'assistant',
    content: 'Привет! Я AI-помощник по путешествиям. Напиши город, даты и бюджет — соберу маршрут.',
  },
];

export function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);

  const handleSend = (query: string) => {
    // TRI-32: UI-only режим, без интеграции API
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: query,
      },
    ]);
  };

  return (
    <div className="bg-brand-bg min-h-full w-full">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 md:py-10">
        <AiChat messages={messages} onSend={handleSend} />
      </div>
    </div>
  );
}

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiChat } from './AiChat';

describe('AiChat', () => {
  it('renders skeleton while loading', () => {
    render(
      <AiChat
        isLoading
        messages={[
          { id: '1', role: 'assistant', content: 'loading', timestamp: new Date().toISOString() },
        ]}
        onSend={vi.fn()}
      />,
    );

    expect(screen.getByText('AI Ассистент')).toBeInTheDocument();
    expect(screen.getAllByText(/loading/i).length).toBeGreaterThan(0);
  });

  it('calls onSend on enter', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();

    render(<AiChat messages={[]} onSend={onSend} />);

    const input = screen.getByPlaceholderText(/2 дня в Казани/i);
    await user.type(input, 'Тестовый запрос{enter}');

    expect(onSend).toHaveBeenCalledWith('Тестовый запрос');
  });

  it('shows validation for query over 1000 chars', () => {
    const onSend = vi.fn();

    render(<AiChat messages={[]} onSend={onSend} />);

    const input = screen.getByPlaceholderText(/2 дня в Казани/i);
    fireEvent.change(input, { target: { value: 'a'.repeat(1000) } });

    const submitButton = screen.getAllByRole('button')[4];
    fireEvent.click(submitButton!);

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend.mock.calls[0]?.[0]).toHaveLength(1000);
  });
});

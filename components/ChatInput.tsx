// =============================================================================
// MaaSwara — Chat Input Component
// Text input with send button. Enter to send, Shift+Enter for newline.
// =============================================================================

'use client';

import { useState, useRef, useCallback } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Type your message...',
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setValue('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  return (
    <div
      className="flex items-end gap-3 p-4 border-t"
      style={{
        backgroundColor: 'var(--ivory)',
        borderColor: 'var(--line)',
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        id="chat-input"
        className="flex-1 resize-none rounded-xl px-4 py-3 text-sm font-body
                   focus:outline-none focus:ring-2 transition-all duration-200"
        style={{
          backgroundColor: 'var(--cream)',
          color: 'var(--ink)',
          border: '1px solid var(--line)',
        }}
      />

      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        id="send-button"
        className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center
                   transition-all duration-200 hover:scale-105 active:scale-95
                   disabled:opacity-40 disabled:hover:scale-100"
        style={{
          backgroundColor:
            disabled || !value.trim()
              ? 'var(--line)'
              : 'var(--terracotta)',
          color: 'var(--ivory)',
        }}
        aria-label="Send message"
      >
        {/* Send arrow icon */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  );
}

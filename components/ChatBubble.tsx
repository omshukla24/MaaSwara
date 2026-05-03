// =============================================================================
// MaaSwara — Chat Bubble Component
// Bot: cream-warm bg, terracotta left border, left-aligned
// User: ivory bg, emerald right border, right-aligned
// =============================================================================

'use client';

import { motion } from 'framer-motion';
import { ChatMessage } from '@/lib/types';

interface ChatBubbleProps {
  message: ChatMessage;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isBot = message.role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-3`}
    >
      <div
        className={`
          max-w-[85%] md:max-w-[75%] px-4 py-3
          ${isBot ? 'chat-bubble-bot' : 'chat-bubble-user'}
        `}
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        {/* Sender label */}
        <p
          className="text-xs font-medium mb-1"
          style={{ color: isBot ? 'var(--terracotta-deep)' : 'var(--emerald-soft)' }}
        >
          {isBot ? 'MaaSwara' : 'You'}
        </p>

        {/* Message content */}
        <p
          className="font-display font-medium text-sm md:text-base leading-relaxed whitespace-pre-wrap"
          style={{ color: 'var(--ink)' }}
        >
          {message.content}
        </p>

        {/* Timestamp */}
        <p
          className="text-xs mt-2 text-right"
          style={{ color: 'var(--ink-muted)' }}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  );
}

/**
 * Typing indicator shown while waiting for bot response
 */
export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start mb-3"
    >
      <div
        className="chat-bubble-bot px-4 py-3"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <p
          className="text-xs font-medium mb-1"
          style={{ color: 'var(--terracotta-deep)' }}
        >
          MaaSwara
        </p>
        <div className="flex items-center gap-1 py-1">
          <span
            className="typing-dot w-2 h-2 rounded-full"
            style={{ backgroundColor: 'var(--terracotta)' }}
          />
          <span
            className="typing-dot w-2 h-2 rounded-full"
            style={{ backgroundColor: 'var(--terracotta)' }}
          />
          <span
            className="typing-dot w-2 h-2 rounded-full"
            style={{ backgroundColor: 'var(--terracotta)' }}
          />
        </div>
      </div>
    </motion.div>
  );
}

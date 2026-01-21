/**
 * ChatMessage - Individual message component
 * 
 * Optimizations:
 * 1. React.memo with custom comparison
 * 2. Only re-renders when content actually changes
 * 3. Minimal DOM structure for fast paint
 * 4. GPU-accelerated animations
 */

import React, { memo } from 'react';
import { Message } from '@/stores/chatStore';
import { MessageContent } from './MessageContent';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  /** Measured height from virtualizer - for smooth scrolling */
  style?: React.CSSProperties;
}

/**
 * Avatar component - memoized separately
 */
const Avatar = memo(function Avatar({ role }: { role: 'user' | 'assistant' }) {
  const isUser = role === 'user';
  
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
        isUser
          ? 'bg-primary text-primary-foreground'
          : 'bg-secondary text-secondary-foreground'
      }`}
    >
      {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
    </div>
  );
});

/**
 * Streaming indicator dots
 */
const StreamingIndicator = memo(function StreamingIndicator() {
  return (
    <div className="flex items-center gap-1 py-2">
      <div className="streaming-dot h-2 w-2 rounded-full bg-[hsl(var(--streaming-dot))]" />
      <div className="streaming-dot h-2 w-2 rounded-full bg-[hsl(var(--streaming-dot))]" />
      <div className="streaming-dot h-2 w-2 rounded-full bg-[hsl(var(--streaming-dot))]" />
    </div>
  );
});

/**
 * Main message component
 * Uses React.memo with content-based comparison
 */
export const ChatMessage = memo(
  function ChatMessage({ message, style }: ChatMessageProps) {
    const { meta, content } = message;
    const isUser = meta.role === 'user';
    const isStreaming = meta.status === 'streaming';
    const isEmpty = content.length === 0;

    return (
      <div
        style={style}
        className={`gpu-accelerate animate-message-in px-4 py-6 ${
          isUser ? 'bg-[hsl(var(--chat-user-bg))]' : 'bg-[hsl(var(--chat-assistant-bg))]'
        }`}
      >
        <div className="mx-auto flex max-w-3xl gap-4">
          <Avatar role={meta.role} />
          
          <div className="min-w-0 flex-1">
            {/* Role label */}
            <div className="mb-1 text-sm font-medium text-muted-foreground">
              {isUser ? 'You' : 'Assistant'}
            </div>
            
            {/* Content */}
            <div className="text-foreground">
              {isEmpty && isStreaming ? (
                <StreamingIndicator />
              ) : (
                <MessageContent content={content} isStreaming={isStreaming} />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
  // Custom comparison: only re-render if content or status changed
  (prevProps, nextProps) => {
    return (
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.meta.status === nextProps.message.meta.status
    );
  }
);

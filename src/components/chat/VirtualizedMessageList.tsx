/**
 * VirtualizedMessageList - High-performance message rendering
 * 
 * Core architecture for handling 5MB+ history:
 * 
 * 1. VIRTUALIZATION (react-virtual)
 *    - Only renders ~10-15 visible messages
 *    - 100+ messages = same performance as 10
 *    - Dynamic height measurement for variable content
 * 
 * 2. AUTO-SCROLL LOGIC
 *    - Scrolls to bottom during streaming
 *    - Detects user scroll-up → disables auto-scroll
 *    - Re-enables when user scrolls back to bottom
 * 
 * 3. RENDER OPTIMIZATION
 *    - Messages use React.memo with content comparison
 *    - Virtualizer only triggers re-render when scroll changes
 *    - No full list re-render on new message
 */

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useChatStore, selectIsStreaming } from '@/stores/chatStore';
import { ChatMessage } from './ChatMessage';

// Threshold for "at bottom" detection (pixels from bottom)
const SCROLL_THRESHOLD = 100;

export function VirtualizedMessageList() {
  // Refs for scroll management
  const parentRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const wasAtBottomRef = useRef(true);
  
  // Get messages and streaming state
  // Using selector for minimal re-renders
  const messages = useChatStore((state) => state.messages);
  const isStreaming = useChatStore(selectIsStreaming);
  
  /**
   * Estimate item size for virtualization
   * Rough estimate based on content length
   * Actual size is measured dynamically
   * 
   * Improved estimation for large messages
   */
  const estimateSize = useCallback((index: number) => {
    const message = messages[index];
    if (!message) return 100;
    
    const contentLength = message.content.length;
    const hasCodeBlock = message.content.includes('```');
    
    // More accurate height estimation for large content
    // Use diminishing returns formula for very long content
    // (content is truncated in display anyway past 200KB)
    const effectiveLength = Math.min(contentLength, 200000);
    const textLines = Math.ceil(effectiveLength / 80);
    const baseHeight = 80; // Avatar + padding
    
    // Use logarithmic scaling for very large messages
    // This prevents the virtualizer from allocating insane heights
    let textHeight: number;
    if (textLines > 500) {
      // Large content: use log scale after 500 lines
      textHeight = 500 * 24 + Math.log10(textLines - 499) * 1000;
    } else {
      textHeight = textLines * 24;
    }
    
    const codeBlockCount = (message.content.match(/```/g) || []).length / 2;
    const codeBlockBonus = Math.min(codeBlockCount, 10) * 150; // Cap at 10 code blocks
    
    return Math.min(12000, Math.max(100, baseHeight + textHeight + codeBlockBonus));
  }, [messages]);
  
  /**
   * Virtual list configuration
   */
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 5, // Render 5 extra items above/below viewport
    getItemKey: (index) => messages[index]?.meta.id ?? index,
  });
  
  /**
   * Check if scrolled to bottom
   */
  const isAtBottom = useCallback(() => {
    const parent = parentRef.current;
    if (!parent) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = parent;
    return scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD;
  }, []);
  
  /**
   * Scroll to bottom
   * Uses virtualizer for accurate positioning
   */
  const scrollToBottom = useCallback(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, {
        align: 'end',
        behavior: 'auto', // Instant for streaming
      });
    }
  }, [virtualizer, messages.length]);
  
  /**
   * Handle user scroll events
   * Detects intentional scroll-up to disable auto-scroll
   */
  const handleScroll = useCallback(() => {
    const atBottom = isAtBottom();
    
    // User scrolled up - disable auto-scroll
    if (!atBottom && wasAtBottomRef.current) {
      isUserScrollingRef.current = true;
    }
    
    // User scrolled back to bottom - re-enable auto-scroll
    if (atBottom && isUserScrollingRef.current) {
      isUserScrollingRef.current = false;
    }
    
    wasAtBottomRef.current = atBottom;
  }, [isAtBottom]);
  
  /**
   * Auto-scroll during streaming
   * Only if user hasn't scrolled up
   * Throttled to prevent excessive updates with large content
   */
  useEffect(() => {
    if (isStreaming && !isUserScrollingRef.current) {
      // Throttle scroll updates for large content
      const lastMessage = messages[messages.length - 1];
      const contentSize = lastMessage?.content.length || 0;
      
      // Less frequent scrolls for large content to reduce overhead
      const shouldScroll = contentSize < 50000 || contentSize % 1000 < 100;
      
      if (shouldScroll) {
        const rafId = requestAnimationFrame(() => {
          scrollToBottom();
        });
        return () => cancelAnimationFrame(rafId);
      }
    }
  }, [isStreaming, messages.length, messages[messages.length - 1]?.content.length, scrollToBottom]);
  
  /**
   * Scroll to bottom on new user message
   */
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.meta.role === 'user') {
      isUserScrollingRef.current = false;
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);
  
  // Get virtual items
  const virtualItems = virtualizer.getVirtualItems();
  
  // Empty state
  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">💬</div>
          <h2 className="mb-2 text-xl font-semibold">Start a conversation</h2>
          <p className="text-muted-foreground">
            Type a message or click "Generate" for a demo
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div
      ref={parentRef}
      onScroll={handleScroll}
      className="chat-scrollbar h-full overflow-y-auto"
      style={{ contain: 'strict' }} // CSS containment for performance
    >
      {/* Total height wrapper for scroll */}
      <div
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {/* Rendered items - positioned absolutely */}
        {virtualItems.map((virtualItem) => {
          const message = messages[virtualItem.index];
          if (!message) return null;
          
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement} // Dynamic height measurement
              className="absolute left-0 top-0 w-full"
              style={{
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <ChatMessage message={message} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

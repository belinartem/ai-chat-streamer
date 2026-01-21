import React, { useRef, useEffect, useCallback, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useChatStore, selectIsStreaming } from "@/stores/chatStore";
import { ChatMessage } from "./ChatMessage";

const SCROLL_THRESHOLD = 100;

export function VirtualizedMessageList() {
  const parentRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const wasAtBottomRef = useRef(true);

  const messages = useChatStore((state) => state.messages);
  const isStreaming = useChatStore(selectIsStreaming);

  const estimateSize = useCallback(
    (index: number) => {
      const message = messages[index];
      if (!message) return 100;

      const contentLength = message.content.length;
      const hasCodeBlock = message.content.includes("```");

      const effectiveLength = Math.min(contentLength, 200000);
      const textLines = Math.ceil(effectiveLength / 80);
      const baseHeight = 80;

      let textHeight: number;
      if (textLines > 500) {
        textHeight = 500 * 24 + Math.log10(textLines - 499) * 1000;
      } else {
        textHeight = textLines * 24;
      }

      const codeBlockCount = (message.content.match(/```/g) || []).length / 2;
      const codeBlockBonus = Math.min(codeBlockCount, 10) * 150;

      return Math.min(
        12000,
        Math.max(100, baseHeight + textHeight + codeBlockBonus),
      );
    },
    [messages],
  );

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 5,
    getItemKey: (index) => messages[index]?.meta.id ?? index,
  });

  const isAtBottom = useCallback(() => {
    const parent = parentRef.current;
    if (!parent) return true;

    const { scrollTop, scrollHeight, clientHeight } = parent;
    return scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD;
  }, []);

  const scrollToBottom = useCallback(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, {
        align: "end",
        behavior: "auto",
      });
    }
  }, [virtualizer, messages.length]);

  const handleScroll = useCallback(() => {
    const atBottom = isAtBottom();
    if (!atBottom && wasAtBottomRef.current) {
      isUserScrollingRef.current = true;
    }

    if (atBottom && isUserScrollingRef.current) {
      isUserScrollingRef.current = false;
    }

    wasAtBottomRef.current = atBottom;
  }, [isAtBottom]);

  useEffect(() => {
    if (isStreaming && !isUserScrollingRef.current) {
      const lastMessage = messages[messages.length - 1];
      const contentSize = lastMessage?.content.length || 0;

      const shouldScroll = contentSize < 50000 || contentSize % 1000 < 100;

      if (shouldScroll) {
        const rafId = requestAnimationFrame(() => {
          scrollToBottom();
        });
        return () => cancelAnimationFrame(rafId);
      }
    }
  }, [
    isStreaming,
    messages.length,
    messages[messages.length - 1]?.content.length,
    scrollToBottom,
  ]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.meta.role === "user") {
      isUserScrollingRef.current = false;
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  const virtualItems = virtualizer.getVirtualItems();

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
      style={{ contain: "strict" }}
    >
      <div
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualItems.map((virtualItem) => {
          const message = messages[virtualItem.index];
          if (!message) return null;

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
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

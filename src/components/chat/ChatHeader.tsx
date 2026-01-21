import React from "react";
import { useChatStore } from "@/stores/chatStore";
import { MessageSquare, Cpu } from "lucide-react";

export function ChatHeader() {
  const messageCount = useChatStore((state) => state.messages.length);
  const isStreaming = useChatStore((state) => state.streaming.isStreaming);

  const messages = useChatStore((state) => state.messages);
  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
  const memorySizeKB = Math.round(totalChars / 1024);

  return (
    <header className="flex items-center justify-between border-b border-[hsl(var(--chat-border))] bg-[hsl(var(--chat-bg))] px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">AI Chat</h1>
          <p className="text-xs text-muted-foreground">
            High-Performance Streaming Interface
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{messageCount}</span>
          <span className="text-xs text-muted-foreground">messages</span>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5">
          <Cpu className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{memorySizeKB} KB</span>
          <span className="text-xs text-muted-foreground">content</span>
        </div>

        {isStreaming && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[hsl(var(--streaming-dot))] animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        )}
      </div>
    </header>
  );
}

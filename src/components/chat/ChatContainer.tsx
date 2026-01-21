import React from "react";
import { ChatHeader } from "./ChatHeader";
import { VirtualizedMessageList } from "./VirtualizedMessageList";
import { ChatInput } from "./ChatInput";

export function ChatContainer() {
  return (
    <div className="flex h-screen flex-col bg-[hsl(var(--chat-bg))]">
      <ChatHeader />
      <main className="flex-1 overflow-hidden">
        <VirtualizedMessageList />
      </main>
      <ChatInput />
    </div>
  );
}

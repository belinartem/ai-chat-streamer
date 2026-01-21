/**
 * ChatContainer - Main chat layout component
 * 
 * Layout structure:
 * - Fixed header
 * - Flexible message list (virtualized)
 * - Fixed input area
 * 
 * Uses flex layout for proper sizing
 */

import React from 'react';
import { ChatHeader } from './ChatHeader';
import { VirtualizedMessageList } from './VirtualizedMessageList';
import { ChatInput } from './ChatInput';

export function ChatContainer() {
  return (
    <div className="flex h-screen flex-col bg-[hsl(var(--chat-bg))]">
      {/* Header - fixed height */}
      <ChatHeader />
      
      {/* Message list - fills remaining space */}
      <main className="flex-1 overflow-hidden">
        <VirtualizedMessageList />
      </main>
      
      {/* Input area - fixed height */}
      <ChatInput />
    </div>
  );
}

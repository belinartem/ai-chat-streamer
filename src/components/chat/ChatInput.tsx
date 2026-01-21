/**
 * ChatInput - Message input and controls
 * 
 * Features:
 * 1. Auto-resize textarea
 * 2. Generate/Stop streaming controls
 * 3. Keyboard shortcuts (Enter to send)
 * 4. Disabled states during streaming
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useChatStore, selectIsStreaming } from '@/stores/chatStore';
import { createMockStreamingController, StreamingController } from '@/lib/streamingEngine';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Square, Sparkles, Trash2 } from 'lucide-react';

export function ChatInput() {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamingControllerRef = useRef<StreamingController | null>(null);
  
  // Zustand state
  const isStreaming = useChatStore(selectIsStreaming);
  const addUserMessage = useChatStore((state) => state.addUserMessage);
  const clearMessages = useChatStore((state) => state.clearMessages);
  
  /**
   * Auto-resize textarea based on content
   */
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);
  
  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);
  
  /**
   * Send user message
   */
  const handleSend = useCallback(() => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isStreaming) return;
    
    addUserMessage(trimmedInput);
    setInput('');
    
    // Start streaming response after user message
    const controller = createMockStreamingController({
      chunkInterval: 15, // 15ms between chunks
      wordsPerChunk: 2,
      totalWords: 500, // Generate ~500 words per response
    });
    
    streamingControllerRef.current = controller;
    controller.start();
  }, [input, isStreaming, addUserMessage]);
  
  /**
   * Start demo streaming (Generate button)
   */
  const handleGenerate = useCallback(() => {
    if (isStreaming) return;
    
    // Add a demo user message
    addUserMessage('Generate a demo response with markdown, code blocks, and various formatting to test streaming performance.');
    
    // Start with extreme settings for stress test
    const controller = createMockStreamingController({
      chunkInterval: 12, // Very fast chunks
      wordsPerChunk: 3,
      totalWords: 2000, // Generate a long response (~10k characters)
    });
    
    streamingControllerRef.current = controller;
    controller.start();
  }, [isStreaming, addUserMessage]);
  
  /**
   * Stop streaming
   */
  const handleStop = useCallback(() => {
    streamingControllerRef.current?.stop();
    streamingControllerRef.current = null;
  }, []);
  
  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );
  
  /**
   * Clear chat
   */
  const handleClear = useCallback(() => {
    handleStop();
    clearMessages();
  }, [handleStop, clearMessages]);
  
  return (
    <div className="border-t border-[hsl(var(--chat-border))] bg-[hsl(var(--chat-input-bg))] p-4">
      <div className="mx-auto max-w-3xl">
        {/* Input area */}
        <div className="relative flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={isStreaming}
              rows={1}
              className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 pr-12 text-sm 
                         placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring
                         disabled:cursor-not-allowed disabled:opacity-50"
              style={{ maxHeight: '200px' }}
            />
            
            {/* Send button - inside textarea */}
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="absolute bottom-2 right-2 h-8 w-8 rounded-lg"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Controls row */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isStreaming ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleStop}
                className="gap-2"
              >
                <Square className="h-3 w-3 fill-current" />
                Stop Generating
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleGenerate}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Generate Demo
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={isStreaming}
              className="gap-2 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          </div>
          
          {/* Status indicator */}
          {isStreaming && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Streaming...</span>
            </div>
          )}
        </div>
        
        {/* Hint */}
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

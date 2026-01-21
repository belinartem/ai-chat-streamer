import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { nanoid } from "nanoid";

export type MessageRole = "user" | "assistant";
export type MessageStatus = "complete" | "streaming" | "error";

export interface MessageMeta {
  id: string;
  role: MessageRole;
  status: MessageStatus;
  timestamp: number;
}

export interface Message {
  meta: MessageMeta;
  content: string;
}

export interface StreamingState {
  isStreaming: boolean;
  streamingMessageId: string | null;
  pendingContent: string;
}

export interface ChatStore {
  messages: Message[];
  streaming: StreamingState;

  addUserMessage: (content: string) => string;
  startAssistantMessage: () => string;
  appendToStream: (chunk: string) => void;
  flushStreamBuffer: () => void;
  completeStream: () => void;
  stopStream: () => void;
  clearMessages: () => void;

  getMessageById: (id: string) => Message | undefined;
  getMessageCount: () => number;
}

export const useChatStore = create<ChatStore>()(
  subscribeWithSelector((set, get) => ({
    messages: [],
    streaming: {
      isStreaming: false,
      streamingMessageId: null,
      pendingContent: "",
    },

    addUserMessage: (content: string) => {
      const id = nanoid();
      const message: Message = {
        meta: {
          id,
          role: "user",
          status: "complete",
          timestamp: Date.now(),
        },
        content,
      };

      set((state) => ({
        messages: [...state.messages, message],
      }));

      return id;
    },

    startAssistantMessage: () => {
      const id = nanoid();
      const message: Message = {
        meta: {
          id,
          role: "assistant",
          status: "streaming",
          timestamp: Date.now(),
        },
        content: "",
      };

      set((state) => ({
        messages: [...state.messages, message],
        streaming: {
          isStreaming: true,
          streamingMessageId: id,
          pendingContent: "",
        },
      }));

      return id;
    },

    appendToStream: (chunk: string) => {
      const { streaming, messages } = get();

      const MAX_BUFFER_SIZE = 50000;
      if (streaming.pendingContent.length > MAX_BUFFER_SIZE) {
        get().flushStreamBuffer();
      }

      set((state) => ({
        streaming: {
          ...state.streaming,
          pendingContent: state.streaming.pendingContent + chunk,
        },
      }));
    },

    flushStreamBuffer: () => {
      const { streaming, messages } = get();

      if (!streaming.streamingMessageId || !streaming.pendingContent) {
        return;
      }

      const messageIndex = messages.findIndex(
        (m) => m.meta.id === streaming.streamingMessageId,
      );

      if (messageIndex === -1) return;

      const pendingContent = streaming.pendingContent;

      set((state) => {
        const newMessages = [...state.messages];
        const message = newMessages[messageIndex];
        const currentContent = message.content;

        const newContent =
          currentContent.length > 100000
            ? [currentContent, pendingContent].join("")
            : currentContent + pendingContent;

        newMessages[messageIndex] = {
          ...message,
          content: newContent,
        };

        return {
          messages: newMessages,
          streaming: {
            ...state.streaming,
            pendingContent: "",
          },
        };
      });
    },

    completeStream: () => {
      const { streaming, messages } = get();

      get().flushStreamBuffer();

      if (!streaming.streamingMessageId) return;

      const messageIndex = messages.findIndex(
        (m) => m.meta.id === streaming.streamingMessageId,
      );

      if (messageIndex === -1) return;

      set((state) => {
        const newMessages = [...state.messages];
        newMessages[messageIndex] = {
          ...newMessages[messageIndex],
          meta: {
            ...newMessages[messageIndex].meta,
            status: "complete",
          },
        };

        return {
          messages: newMessages,
          streaming: {
            isStreaming: false,
            streamingMessageId: null,
            pendingContent: "",
          },
        };
      });
    },

    stopStream: () => {
      get().completeStream();
    },

    clearMessages: () => {
      set({
        messages: [],
        streaming: {
          isStreaming: false,
          streamingMessageId: null,
          pendingContent: "",
        },
      });
    },

    getMessageById: (id: string) => {
      return get().messages.find((m) => m.meta.id === id);
    },

    getMessageCount: () => {
      return get().messages.length;
    },
  })),
);

export const selectStreaming = (state: ChatStore) => state.streaming;

export const selectMessageIds = (state: ChatStore) =>
  state.messages.map((m) => m.meta.id);

export const selectIsStreaming = (state: ChatStore) =>
  state.streaming.isStreaming;

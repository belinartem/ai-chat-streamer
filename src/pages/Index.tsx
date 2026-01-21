/**
 * Index Page - Chat Application Entry
 * 
 * This is a high-performance AI chat interface designed to handle:
 * - 5MB+ message history
 * - 100+ messages with long content
 * - Streaming at 10-20ms chunk intervals
 * - Zero UI freezes at 60 FPS
 */

import { ChatContainer } from '@/components/chat/ChatContainer';

const Index = () => {
  return <ChatContainer />;
};

export default Index;

/**
 * Streaming Engine
 * 
 * Handles text generation with extreme performance requirements:
 * - Chunks every 10-20ms (50-100 updates/second)
 * - Must not block main thread
 * - RAF-scheduled flushes for 60fps UI
 * 
 * Architecture:
 * 1. Generator produces chunks into store buffer
 * 2. RAF loop flushes buffer to UI at 60fps
 * 3. Decoupled producer/consumer prevents UI blocking
 */

import { useChatStore } from '@/stores/chatStore';

// ============================================
// Types
// ============================================

export interface StreamingConfig {
  /** Interval between chunks in ms (10-20 for stress test) */
  chunkInterval: number;
  /** Number of words per chunk */
  wordsPerChunk: number;
  /** Total words to generate (0 = infinite until stopped) */
  totalWords: number;
}

export interface StreamingController {
  start: () => void;
  stop: () => void;
  isActive: () => boolean;
}

// ============================================
// Sample Content Generator
// ============================================

/**
 * Generates realistic mixed content:
 * - Regular text paragraphs
 * - Code blocks (various languages)
 * - Bold/italic markdown
 * - Lists and headers
 * 
 * This creates a stress test scenario with varied content
 */

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'performance', 'optimization',
  'streaming', 'virtual', 'render', 'component', 'architecture', 'design', 'pattern',
  'algorithm', 'complexity', 'efficiency', 'memory', 'throughput', 'latency',
];

const CODE_SAMPLES = [
  `\`\`\`typescript
function processStream(data: string[]): void {
  const buffer: string[] = [];
  for (const chunk of data) {
    buffer.push(chunk);
    if (buffer.length > 100) {
      flush(buffer);
    }
  }
}
\`\`\``,
  `\`\`\`python
async def stream_handler(request):
    async for chunk in request.stream():
        yield process_chunk(chunk)
        await asyncio.sleep(0)
\`\`\``,
  `\`\`\`javascript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        loadContent(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);
\`\`\``,
  `\`\`\`rust
fn main() {
    let mut buffer = Vec::with_capacity(1024);
    loop {
        match stream.read(&mut buffer) {
            Ok(0) => break,
            Ok(n) => process(&buffer[..n]),
            Err(e) => eprintln!("Error: {}", e),
        }
    }
}
\`\`\``,
];

class ContentGenerator {
  private wordIndex = 0;
  private sectionCount = 0;
  
  /**
   * Get next N words as a chunk
   * Occasionally inserts markdown formatting
   */
  getNextChunk(wordCount: number): string {
    const words: string[] = [];
    
    for (let i = 0; i < wordCount; i++) {
      const word = LOREM_WORDS[this.wordIndex % LOREM_WORDS.length];
      this.wordIndex++;
      
      // Occasionally add formatting
      const rand = Math.random();
      if (rand < 0.02) {
        words.push(`**${word}**`);
      } else if (rand < 0.04) {
        words.push(`\`${word}\``);
      } else if (rand < 0.06) {
        words.push(`*${word}*`);
      } else {
        words.push(word);
      }
    }
    
    // Add punctuation occasionally
    if (Math.random() < 0.15) {
      words[words.length - 1] += '.';
    } else if (Math.random() < 0.1) {
      words[words.length - 1] += ',';
    }
    
    return words.join(' ') + ' ';
  }
  
  /**
   * Get a section break (paragraph, header, code, list)
   */
  getSectionBreak(): string {
    this.sectionCount++;
    const rand = Math.random();
    
    if (rand < 0.1 && this.sectionCount > 3) {
      // Insert code block
      const code = CODE_SAMPLES[Math.floor(Math.random() * CODE_SAMPLES.length)];
      return `\n\n${code}\n\n`;
    } else if (rand < 0.15) {
      // Insert header
      const level = Math.random() < 0.5 ? '##' : '###';
      return `\n\n${level} Section ${this.sectionCount}\n\n`;
    } else if (rand < 0.25) {
      // Insert list
      return '\n\n- ' + this.getNextChunk(3).trim() + '\n- ' + 
             this.getNextChunk(4).trim() + '\n- ' + 
             this.getNextChunk(3).trim() + '\n\n';
    } else {
      // Regular paragraph break
      return '\n\n';
    }
  }
  
  reset(): void {
    this.wordIndex = 0;
    this.sectionCount = 0;
  }
}

// ============================================
// Streaming Engine
// ============================================

/**
 * Creates a streaming controller for mock data generation
 * 
 * Performance strategy:
 * 1. setInterval produces chunks at high frequency (10-20ms)
 * 2. Chunks go into Zustand buffer (fast, no re-render)
 * 3. RAF loop flushes buffer to UI (60fps max)
 * 
 * This decoupling allows:
 * - 50-100 chunks/sec from generator
 * - Only 60 UI updates/sec max
 * - Zero main thread blocking
 */
export function createMockStreamingController(
  config: StreamingConfig = {
    chunkInterval: 15,
    wordsPerChunk: 3,
    totalWords: 0, // Infinite
  }
): StreamingController {
  let isRunning = false;
  let chunkTimer: ReturnType<typeof setInterval> | null = null;
  let rafId: number | null = null;
  let wordsGenerated = 0;
  let chunksSinceBreak = 0;
  
  const generator = new ContentGenerator();
  const store = useChatStore.getState();
  
  /**
   * RAF loop for flushing buffer to UI
   * Runs at 60fps, only updates when there's pending content
   */
  const rafLoop = () => {
    if (!isRunning) return;
    
    useChatStore.getState().flushStreamBuffer();
    rafId = requestAnimationFrame(rafLoop);
  };
  
  /**
   * Chunk generation interval
   * Runs at configured interval (10-20ms)
   */
  const startChunkGeneration = () => {
    chunkTimer = setInterval(() => {
      if (!isRunning) return;
      
      // Check word limit
      if (config.totalWords > 0 && wordsGenerated >= config.totalWords) {
        stop();
        return;
      }
      
      // Generate chunk
      let chunk: string;
      
      // Insert section breaks periodically
      if (chunksSinceBreak > 30 + Math.random() * 20) {
        chunk = generator.getSectionBreak();
        chunksSinceBreak = 0;
      } else {
        chunk = generator.getNextChunk(config.wordsPerChunk);
        chunksSinceBreak++;
        wordsGenerated += config.wordsPerChunk;
      }
      
      // Append to buffer (fast, no re-render)
      useChatStore.getState().appendToStream(chunk);
      
    }, config.chunkInterval);
  };
  
  const start = () => {
    if (isRunning) return;
    
    isRunning = true;
    wordsGenerated = 0;
    chunksSinceBreak = 0;
    generator.reset();
    
    // Start the assistant message
    store.startAssistantMessage();
    
    // Start chunk generation
    startChunkGeneration();
    
    // Start RAF flush loop
    rafId = requestAnimationFrame(rafLoop);
  };
  
  const stop = () => {
    if (!isRunning) return;
    
    isRunning = false;
    
    // Clear timers
    if (chunkTimer) {
      clearInterval(chunkTimer);
      chunkTimer = null;
    }
    
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    
    // Complete the stream
    useChatStore.getState().completeStream();
  };
  
  return {
    start,
    stop,
    isActive: () => isRunning,
  };
}

// ============================================
// Real API Streaming (SSE)
// ============================================

/**
 * Creates a streaming controller for real API calls
 * Uses ReadableStream for efficient chunk processing
 * 
 * Compatible with:
 * - OpenAI API
 * - OpenRouter
 * - Any SSE-compatible endpoint
 */
export function createApiStreamingController(
  endpoint: string,
  apiKey: string,
  messages: Array<{ role: string; content: string }>
): StreamingController {
  let isRunning = false;
  let abortController: AbortController | null = null;
  let rafId: number | null = null;
  
  const rafLoop = () => {
    if (!isRunning) return;
    useChatStore.getState().flushStreamBuffer();
    rafId = requestAnimationFrame(rafLoop);
  };
  
  const start = async () => {
    if (isRunning) return;
    
    isRunning = true;
    abortController = new AbortController();
    
    // Start assistant message
    useChatStore.getState().startAssistantMessage();
    
    // Start RAF loop
    rafId = requestAnimationFrame(rafLoop);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          messages,
          stream: true,
        }),
        signal: abortController.signal,
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process SSE lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const json = JSON.parse(data);
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                useChatStore.getState().appendToStream(content);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
      
      useChatStore.getState().completeStream();
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Streaming error:', error);
      }
      useChatStore.getState().completeStream();
    } finally {
      isRunning = false;
      if (rafId) cancelAnimationFrame(rafId);
    }
  };
  
  const stop = () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    isRunning = false;
  };
  
  return {
    start,
    stop,
    isActive: () => isRunning,
  };
}

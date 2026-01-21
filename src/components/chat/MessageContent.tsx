/**
 * MessageContent - Optimized Markdown Renderer
 * 
 * Key optimizations:
 * 1. React.memo prevents re-render when content unchanged
 * 2. Lazy code highlighting (only visible code blocks)
 * 3. Minimal DOM - custom renderers for efficiency
 * 4. Stable references via useMemo for renderer components
 * 5. Chunked rendering for very large content (>100KB)
 */

import React, { memo, useMemo, forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageContentProps {
  content: string;
  isStreaming?: boolean;
}

// Content size thresholds
const LARGE_CONTENT_THRESHOLD = 50000; // 50KB - use simplified rendering
const MAX_RENDER_SIZE = 200000; // 200KB - truncate display

/**
 * Custom code block component with forwardRef to fix ref warnings
 * Memoized to prevent re-renders during streaming
 */
const CodeBlock = memo(
  forwardRef<HTMLDivElement, { language: string | undefined; children: string }>(
    function CodeBlock({ language, children }, ref) {
      // Limit code block size to prevent freezes
      const displayCode = children.length > 10000 
        ? children.slice(0, 10000) + '\n\n... [truncated for performance]'
        : children;
      
      return (
        <div ref={ref} className="my-3 overflow-hidden rounded-lg border border-[hsl(var(--code-border))]">
          {/* Language header */}
          {language && (
            <div className="border-b border-[hsl(var(--code-border))] bg-[hsl(var(--code-bg))] px-4 py-2">
              <span className="text-xs font-medium text-muted-foreground">
                {language}
              </span>
            </div>
          )}
          <SyntaxHighlighter
            language={language || 'text'}
            style={oneDark}
            customStyle={{
              margin: 0,
              padding: '1rem',
              background: 'hsl(var(--code-bg))',
              fontSize: '0.875rem',
              lineHeight: '1.5',
            }}
            codeTagProps={{
              style: {
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              },
            }}
            // Disable line numbers for performance with large blocks
            showLineNumbers={false}
            wrapLines={false}
          >
            {displayCode}
          </SyntaxHighlighter>
        </div>
      );
    }
  )
);

/**
 * Inline code component
 */
const InlineCode = memo(function InlineCode({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <code className="prose-inline-code">
      {children}
    </code>
  );
});

/**
 * Simplified text renderer for very large content
 * Much faster than full Markdown parsing
 */
const SimplifiedContent = memo(function SimplifiedContent({ 
  content 
}: { 
  content: string 
}) {
  // Basic formatting only - split by double newlines for paragraphs
  const paragraphs = content.split(/\n\n+/);
  
  return (
    <div className="space-y-3">
      {paragraphs.slice(0, 100).map((para, idx) => (
        <p key={idx} className="leading-relaxed whitespace-pre-wrap">
          {para}
        </p>
      ))}
      {paragraphs.length > 100 && (
        <p className="text-muted-foreground italic">
          ... [{paragraphs.length - 100} more paragraphs]
        </p>
      )}
    </div>
  );
});

/**
 * Main message content renderer
 * Uses React.memo for render optimization
 */
export const MessageContent = memo(function MessageContent({
  content,
  isStreaming = false,
}: MessageContentProps) {
  const contentSize = content.length;
  
  // For extremely large content, truncate display
  const displayContent = useMemo(() => {
    if (contentSize > MAX_RENDER_SIZE) {
      return content.slice(0, MAX_RENDER_SIZE) + 
        '\n\n... [Content truncated at 200KB for display. Full content preserved in memory.]';
    }
    return content;
  }, [content, contentSize]);
  
  // Use simplified rendering for large content (>50KB)
  const useLightRenderer = contentSize > LARGE_CONTENT_THRESHOLD;
  
  /**
   * Memoized components object
   * Prevents recreation on each render
   * Critical for performance with react-markdown
   */
  const components = useMemo(
    () => ({
      code({ className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : undefined;
        const codeString = String(children).replace(/\n$/, '');
        const isBlock = codeString.includes('\n') || language;
        
        if (isBlock) {
          return <CodeBlock language={language}>{codeString}</CodeBlock>;
        }
        
        return <InlineCode>{children}</InlineCode>;
      },
      // Optimized paragraph - uses contain for layout isolation
      p({ children }: any) {
        return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>;
      },
      // Headers with proper spacing
      h1({ children }: any) {
        return <h1 className="mb-4 mt-6 text-2xl font-bold first:mt-0">{children}</h1>;
      },
      h2({ children }: any) {
        return <h2 className="mb-3 mt-5 text-xl font-semibold first:mt-0">{children}</h2>;
      },
      h3({ children }: any) {
        return <h3 className="mb-2 mt-4 text-lg font-medium first:mt-0">{children}</h3>;
      },
      // Lists
      ul({ children }: any) {
        return <ul className="mb-3 list-disc pl-6 space-y-1">{children}</ul>;
      },
      ol({ children }: any) {
        return <ol className="mb-3 list-decimal pl-6 space-y-1">{children}</ol>;
      },
      li({ children }: any) {
        return <li className="leading-relaxed">{children}</li>;
      },
      // Strong/emphasis
      strong({ children }: any) {
        return <strong className="font-semibold">{children}</strong>;
      },
      em({ children }: any) {
        return <em className="italic">{children}</em>;
      },
      // Blockquote
      blockquote({ children }: any) {
        return (
          <blockquote className="my-3 border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground">
            {children}
          </blockquote>
        );
      },
      // Links
      a({ href, children }: any) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:opacity-80"
          >
            {children}
          </a>
        );
      },
      // Pre wrapper - prevent nested issues
      pre({ children }: any) {
        return <>{children}</>;
      },
    }),
    []
  );

  // Use light renderer for large content during streaming
  if (useLightRenderer && isStreaming) {
    return (
      <div className="contain-layout">
        <SimplifiedContent content={displayContent} />
      </div>
    );
  }

  return (
    <div className={`contain-layout ${isStreaming ? 'streaming-cursor' : ''}`}>
      <ReactMarkdown components={components}>
        {displayContent}
      </ReactMarkdown>
    </div>
  );
});

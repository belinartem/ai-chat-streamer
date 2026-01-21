import React, { memo, useMemo, forwardRef } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface MessageContentProps {
  content: string;
  isStreaming?: boolean;
}

const LARGE_CONTENT_THRESHOLD = 50000;
const MAX_RENDER_SIZE = 200000;

const CodeBlock = memo(
  forwardRef<
    HTMLDivElement,
    { language: string | undefined; children: string }
  >(function CodeBlock({ language, children }, ref) {
    const displayCode =
      children.length > 10000
        ? children.slice(0, 10000) + "\n\n... [truncated for performance]"
        : children;

    return (
      <div
        ref={ref}
        className="my-3 overflow-hidden rounded-lg border border-[hsl(var(--code-border))]"
      >
        {language && (
          <div className="border-b border-[hsl(var(--code-border))] bg-[hsl(var(--code-bg))] px-4 py-2">
            <span className="text-xs font-medium text-muted-foreground">
              {language}
            </span>
          </div>
        )}
        <SyntaxHighlighter
          language={language || "text"}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: "1rem",
            background: "hsl(var(--code-bg))",
            fontSize: "0.875rem",
            lineHeight: "1.5",
          }}
          codeTagProps={{
            style: {
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            },
          }}
          showLineNumbers={false}
          wrapLines={false}
        >
          {displayCode}
        </SyntaxHighlighter>
      </div>
    );
  }),
);

const InlineCode = memo(function InlineCode({
  children,
}: {
  children: React.ReactNode;
}) {
  return <code className="prose-inline-code">{children}</code>;
});

const SimplifiedContent = memo(function SimplifiedContent({
  content,
}: {
  content: string;
}) {
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

export const MessageContent = memo(function MessageContent({
  content,
  isStreaming = false,
}: MessageContentProps) {
  const contentSize = content.length;

  const displayContent = useMemo(() => {
    if (contentSize > MAX_RENDER_SIZE) {
      return (
        content.slice(0, MAX_RENDER_SIZE) +
        "\n\n... [Content truncated at 200KB for display. Full content preserved in memory.]"
      );
    }
    return content;
  }, [content, contentSize]);

  const useLightRenderer = contentSize > LARGE_CONTENT_THRESHOLD;

  const components = useMemo(
    () => ({
      code({ className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || "");
        const language = match ? match[1] : undefined;
        const codeString = String(children).replace(/\n$/, "");
        const isBlock = codeString.includes("\n") || language;

        if (isBlock) {
          return <CodeBlock language={language}>{codeString}</CodeBlock>;
        }

        return <InlineCode>{children}</InlineCode>;
      },
      p({ children }: any) {
        return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>;
      },
      h1({ children }: any) {
        return (
          <h1 className="mb-4 mt-6 text-2xl font-bold first:mt-0">
            {children}
          </h1>
        );
      },
      h2({ children }: any) {
        return (
          <h2 className="mb-3 mt-5 text-xl font-semibold first:mt-0">
            {children}
          </h2>
        );
      },
      h3({ children }: any) {
        return (
          <h3 className="mb-2 mt-4 text-lg font-medium first:mt-0">
            {children}
          </h3>
        );
      },
      ul({ children }: any) {
        return <ul className="mb-3 list-disc pl-6 space-y-1">{children}</ul>;
      },
      ol({ children }: any) {
        return <ol className="mb-3 list-decimal pl-6 space-y-1">{children}</ol>;
      },
      li({ children }: any) {
        return <li className="leading-relaxed">{children}</li>;
      },
      strong({ children }: any) {
        return <strong className="font-semibold">{children}</strong>;
      },
      em({ children }: any) {
        return <em className="italic">{children}</em>;
      },
      blockquote({ children }: any) {
        return (
          <blockquote className="my-3 border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground">
            {children}
          </blockquote>
        );
      },
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
      pre({ children }: any) {
        return <>{children}</>;
      },
    }),
    [],
  );

  if (useLightRenderer && isStreaming) {
    return (
      <div className="contain-layout">
        <SimplifiedContent content={displayContent} />
      </div>
    );
  }

  return (
    <div className={`contain-layout ${isStreaming ? "streaming-cursor" : ""}`}>
      <ReactMarkdown components={components}>{displayContent}</ReactMarkdown>
    </div>
  );
});

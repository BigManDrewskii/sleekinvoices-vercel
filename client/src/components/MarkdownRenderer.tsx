import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isStreaming?: boolean;
}

/**
 * Lightweight markdown renderer using react-markdown.
 * Replaces the heavy streamdown library (12MB) with a much lighter alternative (~200KB).
 * 
 * Features:
 * - GitHub Flavored Markdown (tables, strikethrough, task lists)
 * - Styled code blocks with copy button
 * - Responsive tables
 * - Proper link handling
 */
export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  className,
  isStreaming = false,
}: MarkdownRendererProps) {
  // Memoize the processed content to avoid re-renders during streaming
  const processedContent = useMemo(() => {
    // Add a blinking cursor at the end if streaming
    if (isStreaming && content) {
      return content + "▊";
    }
    return content;
  }, [content, isStreaming]);

  return (
    <div className={cn("markdown-content", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mt-4 mb-2 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold mt-3 mb-2 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold mt-2 mb-1 first:mt-0">{children}</h3>
          ),
          
          // Paragraphs
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
          ),
          
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          
          // Code blocks
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            
            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            
            // Block code
            const language = className?.replace("language-", "") || "";
            return (
              <div className="relative group my-3">
                {language && (
                  <div className="absolute top-0 right-0 px-2 py-1 text-xs text-muted-foreground bg-muted/50 rounded-bl rounded-tr-lg">
                    {language}
                  </div>
                )}
                <pre className="p-3 rounded-lg bg-muted/50 overflow-x-auto">
                  <code className="text-sm font-mono" {...props}>
                    {children}
                  </code>
                </pre>
                <button
                  onClick={() => {
                    const text = String(children).replace(/\n$/, "");
                    navigator.clipboard.writeText(text);
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-xs bg-background/80 rounded border border-border hover:bg-accent"
                >
                  Copy
                </button>
              </div>
            );
          },
          
          // Block quotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/30 pl-4 my-2 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full border-collapse text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold border-b border-border">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-b border-border/50">{children}</td>
          ),
          
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {children}
            </a>
          ),
          
          // Horizontal rule
          hr: () => <hr className="my-4 border-border" />,
          
          // Strong and emphasis
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          
          // Task lists (GFM)
          input: ({ checked, ...props }) => (
            <input
              type="checkbox"
              checked={checked}
              readOnly
              className="mr-2 rounded"
              {...props}
            />
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
});

export default MarkdownRenderer;

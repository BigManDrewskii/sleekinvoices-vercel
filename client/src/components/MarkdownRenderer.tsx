import { memo, useMemo, useState, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { AIActionButton, parseAIResponse, AIAction } from "./AIActionButton";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isStreaming?: boolean;
}

/**
 * Pre-process content to convert action markers to placeholder tokens
 * that won't be affected by markdown parsing
 */
function extractActions(content: string): {
  processedContent: string;
  actions: Map<string, AIAction>;
} {
  const actionRegex = /\[\[action:(\w+)\|([^|\]]+)(?:\|([^\]]+))?\]\]/g;
  const actions = new Map<string, AIAction>();
  let counter = 0;

  const processedContent = content.replace(actionRegex, (_, type, label, dataStr) => {
    let data: Record<string, string | number | boolean> | undefined;

    if (dataStr) {
      try {
        data = JSON.parse(dataStr);
      } catch {
        data = {};
        dataStr.split(",").forEach((pair: string) => {
          const [key, value] = pair.split("=");
          if (key && value) {
            data![key.trim()] = value.trim();
          }
        });
      }
    }

    const placeholder = `__ACTION_${counter}__`;
    actions.set(placeholder, { type, label, data });
    counter++;

    return placeholder;
  });

  return { processedContent, actions };
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
 * - Inline action buttons
 * - Refined typography for AI assistant responses
 */
export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  className,
  isStreaming = false,
}: MarkdownRendererProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Extract actions and create placeholders
  const { processedContent: contentWithPlaceholders, actions } = useMemo(() => {
    if (isStreaming) {
      return { processedContent: content, actions: new Map<string, AIAction>() };
    }
    return extractActions(content);
  }, [content, isStreaming]);

  // Add blinking cursor if streaming
  const displayContent = useMemo(() => {
    if (isStreaming && contentWithPlaceholders) {
      return contentWithPlaceholders + "▊";
    }
    return contentWithPlaceholders;
  }, [contentWithPlaceholders, isStreaming]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  /**
   * Process text nodes to replace action placeholders with actual buttons
   */
  const processTextWithActions = (text: string): ReactNode => {
    if (!text || actions.size === 0) return text;

    const parts: ReactNode[] = [];
    let lastIndex = 0;
    const regex = /__ACTION_(\d+)__/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the placeholder
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // Add the action button
      const placeholder = match[0];
      const action = actions.get(placeholder);
      if (action) {
        parts.push(
          <AIActionButton
            key={placeholder}
            action={action}
            className="inline-flex mx-1 my-0.5 align-middle"
          />
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className={cn("markdown-content text-sm leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings - refined sizing and spacing
          h1: ({ children }) => (
            <h1 className="text-base font-semibold mt-4 mb-2 first:mt-0 text-foreground">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-semibold mt-3 mb-1.5 first:mt-0 text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-medium mt-2.5 mb-1 first:mt-0 text-foreground">
              {children}
            </h3>
          ),
          
          // Paragraphs - improved line height and spacing
          p: ({ children }) => {
            // Process children to handle action placeholders
            const processedChildren = Array.isArray(children)
              ? children.map((child, i) =>
                  typeof child === "string" ? (
                    <span key={i}>{processTextWithActions(child)}</span>
                  ) : (
                    child
                  )
                )
              : typeof children === "string"
              ? processTextWithActions(children)
              : children;

            return (
              <p className="mb-3 last:mb-0 leading-[1.7] text-foreground/90">
                {processedChildren}
              </p>
            );
          },
          
          // Lists - better visual hierarchy
          ul: ({ children }) => (
            <ul className="mb-3 space-y-1.5 pl-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 space-y-1.5 pl-0 list-decimal list-inside">
              {children}
            </ol>
          ),
          li: ({ children }) => {
            // Process children to handle action placeholders
            const processedChildren = Array.isArray(children)
              ? children.map((child, i) =>
                  typeof child === "string" ? (
                    <span key={i}>{processTextWithActions(child)}</span>
                  ) : (
                    child
                  )
                )
              : typeof children === "string"
              ? processTextWithActions(children)
              : children;

            return (
              <li className="leading-[1.7] text-foreground/90 flex items-start gap-2">
                <span className="text-primary/70 mt-1.5 shrink-0">•</span>
                <span className="flex-1">{processedChildren}</span>
              </li>
            );
          },
          
          // Code blocks - enhanced styling with better copy button
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            const codeString = String(children).replace(/\n$/, "");
            
            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[13px] font-mono font-medium"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            
            // Block code
            const language = className?.replace("language-", "") || "";
            const isCopied = copiedCode === codeString;
            
            return (
              <div className="relative group my-3 rounded-lg overflow-hidden border border-border/50">
                {/* Header with language badge */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-muted/70 border-b border-border/50">
                  <span className="text-xs text-muted-foreground font-medium">
                    {language || "code"}
                  </span>
                  <button
                    onClick={() => handleCopyCode(codeString)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 text-xs rounded-md transition-all duration-200",
                      isCopied 
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                        : "hover:bg-accent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                {/* Code content */}
                <pre className="p-3 bg-muted/30 overflow-x-auto">
                  <code className="text-[13px] font-mono leading-relaxed" {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          
          // Block quotes - refined styling
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/40 pl-3 my-3 text-foreground/80 italic">
              {children}
            </blockquote>
          ),
          
          // Tables - improved styling
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-lg border border-border/50">
              <table className="min-w-full text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50 border-b border-border/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-medium text-foreground text-xs uppercase tracking-wide">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-b border-border/30 text-foreground/90">{children}</td>
          ),
          
          // Links - styled with primary color
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/30 hover:decoration-primary/60 transition-colors"
            >
              {children}
            </a>
          ),
          
          // Horizontal rule
          hr: () => <hr className="my-4 border-border/50" />,
          
          // Strong and emphasis - more prominent styling
          strong: ({ children }) => {
            // Process children to handle action placeholders
            const processedChildren = typeof children === "string"
              ? processTextWithActions(children)
              : children;

            return (
              <strong className="font-semibold text-foreground">{processedChildren}</strong>
            );
          },
          em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
          
          // Task lists (GFM)
          input: ({ checked, ...props }) => (
            <input
              type="checkbox"
              checked={checked}
              readOnly
              className="mr-2 rounded border-border accent-primary"
              {...props}
            />
          ),

          // Text nodes - process for action placeholders
          text: ({ children }) => {
            if (typeof children === "string") {
              return <>{processTextWithActions(children)}</>;
            }
            return <>{children}</>;
          },
        }}
      >
        {displayContent}
      </ReactMarkdown>
    </div>
  );
});

export default MarkdownRenderer;

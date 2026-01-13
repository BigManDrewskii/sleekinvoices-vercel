import { memo, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";

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
 * - Refined typography for AI assistant responses
 */
export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  className,
  isStreaming = false,
}: MarkdownRendererProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Memoize the processed content to avoid re-renders during streaming
  const processedContent = useMemo(() => {
    // Add a blinking cursor at the end if streaming
    if (isStreaming && content) {
      return content + "▊";
    }
    return content;
  }, [content, isStreaming]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className={cn("markdown-content text-sm", className)}>
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
          p: ({ children }) => (
            <p className="mb-2.5 last:mb-0 leading-relaxed text-foreground/90">
              {children}
            </p>
          ),
          
          // Lists - better visual hierarchy
          ul: ({ children }) => (
            <ul className="mb-2.5 space-y-1.5 pl-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2.5 space-y-1.5 pl-0 list-decimal list-inside">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed text-foreground/90 flex items-start gap-2">
              <span className="text-primary/70 mt-1.5 shrink-0">•</span>
              <span className="flex-1">{children}</span>
            </li>
          ),
          
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
            <blockquote className="border-l-2 border-primary/40 pl-3 my-2.5 text-foreground/80 italic">
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
          
          // Strong and emphasis
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
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
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
});

export default MarkdownRenderer;

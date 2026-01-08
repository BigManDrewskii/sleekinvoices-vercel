import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Eye, EyeOff, Code, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Placeholder {
  key: string;
  label: string;
  sampleValue: string;
}

interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  content: string;
}

interface PlaceholderTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  label?: string;
  description?: string;
  placeholders: Placeholder[];
  presets?: TemplatePreset[];
  className?: string;
}

export function PlaceholderTextarea({
  value,
  onChange,
  placeholder,
  disabled,
  rows = 10,
  label,
  description,
  placeholders,
  presets,
  className,
}: PlaceholderTextareaProps) {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Sync scroll between textarea and highlight overlay
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Insert placeholder at cursor position
  const insertPlaceholder = (placeholderKey: string) => {
    if (!textareaRef.current || disabled) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = `{{${placeholderKey}}}`;
    
    const newValue = value.substring(0, start) + text + value.substring(end);
    onChange(newValue);
    
    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  // Generate highlighted HTML with placeholders styled
  const highlightedHtml = useMemo(() => {
    if (!value) return "";
    
    // Escape HTML entities first
    let html = value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Highlight valid placeholders
    const validKeys = placeholders.map(p => p.key);
    html = html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const isValid = validKeys.includes(key);
      const className = isValid 
        ? "bg-primary/20 text-primary px-1 rounded font-medium"
        : "bg-destructive/20 text-destructive px-1 rounded font-medium";
      return `<span class="${className}">${match}</span>`;
    });
    
    // Preserve newlines
    html = html.replace(/\n/g, "<br>");
    
    return html;
  }, [value, placeholders]);

  // Generate preview with sample values
  const previewHtml = useMemo(() => {
    if (!value) return "<em class='text-muted-foreground'>No template content</em>";
    
    let preview = value;
    
    // Replace placeholders with sample values
    for (const p of placeholders) {
      const regex = new RegExp(`\\{\\{${p.key}\\}\\}`, "g");
      preview = preview.replace(regex, `<strong class="text-primary">${p.sampleValue}</strong>`);
    }
    
    // Escape remaining HTML
    preview = preview
      .replace(/&(?!amp;|lt;|gt;)/g, "&amp;")
      .replace(/<(?!strong|\/strong)/g, "&lt;")
      .replace(/(?<!strong)>/g, "&gt;");
    
    // Preserve newlines
    preview = preview.replace(/\n/g, "<br>");
    
    return preview;
  }, [value, placeholders]);

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {/* Presets Dropdown */}
        {presets && presets.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={disabled}>
                <FileText className="h-4 w-4 mr-2" />
                Use Template
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              {presets.map((preset) => (
                <DropdownMenuItem
                  key={preset.id}
                  onClick={() => onChange(preset.content)}
                  className="flex flex-col items-start py-3"
                >
                  <span className="font-medium">{preset.name}</span>
                  <span className="text-xs text-muted-foreground">{preset.description}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {/* Placeholder Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={disabled}>
              <Code className="h-4 w-4 mr-2" />
              Insert Placeholder
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {placeholders.map((p) => (
              <DropdownMenuItem
                key={p.key}
                onClick={() => insertPlaceholder(p.key)}
              >
                <div className="flex flex-col">
                  <span className="font-mono text-sm">{`{{${p.key}}}`}</span>
                  <span className="text-xs text-muted-foreground">{p.label}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          disabled={disabled}
        >
          {showPreview ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Hide Preview
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Show Preview
            </>
          )}
        </Button>
      </div>

      {/* Editor with syntax highlighting */}
      {!showPreview ? (
        <div className="relative">
          {/* Highlight overlay */}
          <div
            ref={highlightRef}
            className="absolute inset-0 p-3 font-mono text-sm whitespace-pre-wrap break-words overflow-hidden pointer-events-none border border-transparent rounded-md"
            style={{ 
              lineHeight: "1.5",
              wordBreak: "break-word",
            }}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
          
          {/* Actual textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={cn(
              "w-full p-3 font-mono text-sm rounded-md border border-input bg-transparent resize-none",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "text-transparent caret-foreground",
              "placeholder:text-muted-foreground"
            )}
            style={{ 
              lineHeight: "1.5",
              wordBreak: "break-word",
              WebkitTextFillColor: "transparent",
            }}
          />
        </div>
      ) : (
        /* Preview mode */
        <div
          className="p-4 rounded-md border border-input bg-muted/30 min-h-[200px] font-sans text-sm"
          style={{ lineHeight: "1.6" }}
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      )}

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      
      {/* Placeholder legend */}
      <div className="flex flex-wrap gap-2 pt-2">
        {placeholders.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => insertPlaceholder(p.key)}
            disabled={disabled}
            className={cn(
              "inline-flex items-center px-2 py-1 rounded text-xs font-mono",
              "bg-primary/10 text-primary hover:bg-primary/20 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {`{{${p.key}}}`}
          </button>
        ))}
      </div>
    </div>
  );
}

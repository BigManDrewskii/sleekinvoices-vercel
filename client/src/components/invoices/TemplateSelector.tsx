import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

interface TemplateSelectorProps {
  value: number | null;
  onChange: (templateId: number | null) => void;
  error?: string;
}

/**
 * Template Selector Component
 *
 * Allows users to select which invoice template to use for an invoice.
 * Shows all available templates with visual indicators (colors).
 * Falls back to default template if none selected.
 */
export function TemplateSelector({
  value,
  onChange,
  error,
}: TemplateSelectorProps) {
  const { data: templates, isLoading } = trpc.templates.list.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Invoice Template</Label>
        <div className="h-10 bg-muted animate-pulse rounded-md"></div>
      </div>
    );
  }

  const defaultTemplate = templates?.find(t => t.isDefault);
  const selectedTemplate = value
    ? templates?.find(t => t.id === value)
    : defaultTemplate;

  return (
    <div className="space-y-2">
      <Label htmlFor="template">Invoice Template</Label>
      <Select
        value={value?.toString() || "default"}
        onValueChange={val =>
          onChange(val === "default" ? null : parseInt(val))
        }
      >
        <SelectTrigger
          id="template"
          className={error ? "border-destructive" : ""}
        >
          <SelectValue>
            {selectedTemplate ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-sm"
                  style={{
                    backgroundColor: selectedTemplate.primaryColor || "#5f6fff",
                  }}
                />
                <span>{selectedTemplate.name}</span>
                {selectedTemplate.isDefault && !value && (
                  <span className="text-xs text-muted-foreground">
                    (Default)
                  </span>
                )}
              </div>
            ) : (
              "Select template"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {/* Default option */}
          <SelectItem value="default">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-sm"
                style={{
                  backgroundColor: defaultTemplate?.primaryColor || "#5f6fff",
                }}
              />
              <span>{defaultTemplate?.name || "Default"}</span>
              <span className="text-xs text-muted-foreground">(Default)</span>
            </div>
          </SelectItem>

          {/* All available templates */}
          {templates?.map(template => (
            <SelectItem key={template.id} value={template.id.toString()}>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-sm"
                  style={{
                    backgroundColor: template.primaryColor || "#5f6fff",
                  }}
                />
                <span>{template.name}</span>
                {template.isDefault && (
                  <span className="text-xs text-muted-foreground">★</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Choose a template for this invoice. Leave as default to use your default
        template.
      </p>
    </div>
  );
}

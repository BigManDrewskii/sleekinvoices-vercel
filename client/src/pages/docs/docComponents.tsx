import { Play } from "lucide-react";
import { ReactNode } from "react";

// Video Placeholder Component
export const VideoPlaceholder = ({ title }: { title: string }) => (
  <div className="relative w-full rounded-xl overflow-hidden bg-card border border-border my-6">
    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background via-background/95 to-primary/5">
        <img
          src="/sleeky.svg"
          alt="Sleeky"
          className="h-24 sm:h-32 mb-4 opacity-90"
          loading="lazy"
        />
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
          <Play className="h-3 w-3" />
          Video Coming Soon
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Video tutorial for "{title}" will be available soon
        </p>
      </div>
    </div>
  </div>
);

// Section Heading
export const SectionHeading = ({ children }: { children: ReactNode }) => (
  <h2 className="text-3xl font-bold text-foreground mb-4">{children}</h2>
);

// Subsection Heading
export const SubsectionHeading = ({ children }: { children: ReactNode }) => (
  <h3 className="text-xl font-bold text-foreground mb-3">{children}</h3>
);

// Paragraph
export const P = ({ children }: { children: ReactNode }) => (
  <p className="text-muted-foreground mb-6">{children}</p>
);

// Unordered List
export const UL = ({ children }: { children: ReactNode }) => (
  <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">{children}</ul>
);

// Ordered List
export const OL = ({ children }: { children: ReactNode }) => (
  <ol className="list-decimal list-inside space-y-3 text-foreground mb-6">{children}</ol>
);

// List Item
export const LI = ({ children }: { children: ReactNode }) => (
  <li className="space-y-2">{children}</li>
);

// Strong/Bold Text
export const Strong = ({ children }: { children: ReactNode }) => (
  <strong className="text-foreground font-semibold">{children}</strong>
);

// Inline Code
export const Code = ({ children }: { children: ReactNode }) => (
  <code className="font-mono bg-muted px-2 py-1 rounded text-sm text-foreground">{children}</code>
);

// Code Block
export const CodeBlock = ({ children }: { children: ReactNode }) => (
  <pre className="font-mono bg-muted p-4 rounded text-sm text-foreground overflow-x-auto mb-6">
    <code>{children}</code>
  </pre>
);

// Callout Box (Pro Tips, Notes)
export const CalloutBox = ({
  icon = "💡",
  title,
  children,
}: {
  icon?: string;
  title: string;
  children: ReactNode;
}) => (
  <div className="bg-card border border-border rounded-lg p-4 mb-6">
    <h4 className="font-semibold text-foreground mb-2">
      {icon} {title}
    </h4>
    <div className="text-sm text-muted-foreground">{children}</div>
  </div>
);

// Table Component
export const Table = ({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | ReactNode)[][];
}) => (
  <div className="overflow-x-auto mb-6">
    <table className="w-full border border-border">
      <thead className="bg-muted">
        <tr>
          {headers.map((header, i) => (
            <th key={i} className="border border-border p-3 text-left font-semibold text-foreground">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="hover:bg-muted/50 transition-colors">
            {row.map((cell, j) => (
              <td key={j} className="border border-border p-3 text-muted-foreground">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Keyboard Shortcut
export const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border border-border">
    {children}
  </kbd>
);

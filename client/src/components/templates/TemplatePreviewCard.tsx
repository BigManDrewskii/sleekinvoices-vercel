import { useEffect } from "react";

interface TemplatePreviewCardProps {
  template: {
    name: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor?: string;
    headingFont: string;
    bodyFont: string;
    headingFontWeight?: string;
    bodyFontWeight?: string;
  };
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

/**
 * Minimal template preview card showing colors and typography
 * Displays key colors as swatches and "Aa" to demonstrate typography
 */
export function TemplatePreviewCard({ 
  template, 
  size = "md",
  onClick 
}: TemplatePreviewCardProps) {
  const bgColor = template.backgroundColor || "#ffffff";
  const headingWeight = template.headingFontWeight || "600";
  const bodyWeight = template.bodyFontWeight || "400";
  
  // Load Google Font for preview
  useEffect(() => {
    const fonts = [template.headingFont, template.bodyFont].filter(Boolean);
    const uniqueFonts = Array.from(new Set(fonts));
    
    uniqueFonts.forEach(font => {
      const fontFamily = font.replace(/\s+/g, '+');
      const linkId = `font-${fontFamily}`;
      
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@300;400;500;600;700&display=swap`;
        document.head.appendChild(link);
      }
    });
  }, [template.headingFont, template.bodyFont]);

  const sizeClasses = {
    sm: "h-32 w-full",
    md: "h-48 w-full",
    lg: "h-64 w-full"
  };

  const typographySizes = {
    sm: { heading: "text-3xl", body: "text-xs" },
    md: { heading: "text-5xl", body: "text-sm" },
    lg: { heading: "text-6xl", body: "text-base" }
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group relative bg-card border border-border`}
      onClick={onClick}
    >
      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-6">
        {/* Top - Typography showcase */}
        <div className="flex flex-col items-center justify-center flex-1">
          {/* Large "Aa" typography demo */}
          <div
            className={`${typographySizes[size].heading} leading-none mb-3`}
            style={{
              fontFamily: `"${template.headingFont}", sans-serif`,
              fontWeight: headingWeight,
              color: template.primaryColor
            }}
          >
            Aa
          </div>

          {/* Color Palette - Horizontal circles */}
          <div className="flex items-center gap-2">
            {/* Background color (white) */}
            <div
              className="w-8 h-8 rounded-full shadow-sm ring-2 ring-border/50"
              style={{ backgroundColor: bgColor }}
            />
            {/* Primary color */}
            <div
              className="w-8 h-8 rounded-full shadow-sm ring-1 ring-border/30"
              style={{ backgroundColor: template.primaryColor }}
            />
            {/* Accent color */}
            <div
              className="w-8 h-8 rounded-full shadow-sm ring-1 ring-border/30"
              style={{ backgroundColor: template.accentColor }}
            />
          </div>
        </div>

        {/* Bottom - Template info */}
        <div className="flex flex-col gap-1 text-center">
          <div className="font-medium text-sm text-foreground">
            {template.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {template.headingFont}
          </div>
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors rounded-xl" />
    </div>
  );
}

/**
 * Compact template preview for grid layouts
 * Shows colors and typography in a condensed format
 */
export function CompactTemplatePreview({ 
  template,
  onClick 
}: TemplatePreviewCardProps) {
  const bgColor = template.backgroundColor || "#ffffff";
  const headingWeight = template.headingFontWeight || "600";
  
  // Load Google Font for preview
  useEffect(() => {
    const fontFamily = template.headingFont.replace(/\s+/g, '+');
    const linkId = `font-${fontFamily}`;
    
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@300;400;500;600;700&display=swap`;
      document.head.appendChild(link);
    }
  }, [template.headingFont]);

  return (
    <div
      className="h-32 w-full rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group relative bg-card border border-border"
      onClick={onClick}
    >
      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center p-4 gap-3">
        {/* Typography showcase */}
        <div
          className="text-4xl leading-none"
          style={{
            fontFamily: `"${template.headingFont}", sans-serif`,
            fontWeight: headingWeight,
            color: template.primaryColor
          }}
        >
          Aa
        </div>

        {/* Color palette - Horizontal circles */}
        <div className="flex items-center gap-2">
          {/* Background color (white) */}
          <div
            className="w-6 h-6 rounded-full shadow-sm ring-2 ring-border/50"
            style={{ backgroundColor: bgColor }}
          />
          {/* Primary color */}
          <div
            className="w-6 h-6 rounded-full shadow-sm ring-1 ring-border/30"
            style={{ backgroundColor: template.primaryColor }}
          />
          {/* Accent color */}
          <div
            className="w-6 h-6 rounded-full shadow-sm ring-1 ring-border/30"
            style={{ backgroundColor: template.accentColor }}
          />
        </div>

        {/* Template name */}
        <div className="text-xs text-muted-foreground font-medium">
          {template.name}
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors rounded-lg" />
    </div>
  );
}

/**
 * Pre-designed invoice template presets
 * Focused on a single, highly customizable "Sleek - Default" template
 */

/**
 * Default values for invoice templates
 * Centralized to ensure consistency between preview and PDF generation
 */
export const INVOICE_TEMPLATE_DEFAULTS = {
  // Default colors - neutral dark gray and emerald green
  primaryColor: "#18181b", // zinc-900
  accentColor: "#10b981", // emerald-500

  // Classic style uses blue accent
  classicAccentColor: "#5f6fff", // indigo-500

  // Status colors (for PDF generation)
  statusColors: {
    paid: "#10b981", // emerald-500
    overdue: "#dc2626", // red-600
    pending: "#d97706", // amber-600
    sent: "#d97706", // amber-600
    draft: "#71717a", // zinc-500
  },

  // Typography
  headingFont: "IBM Plex Mono",
  bodyFont: "IBM Plex Mono",
  fontSize: 14,

  // Layout
  logoWidth: 120,
  logoPosition: "left" as const,
  dateFormat: "MMM DD, YYYY",

  // Field visibility
  showCompanyAddress: true,
  showPaymentTerms: true,
  showTaxField: true,
  showDiscountField: true,
  showNotesField: true,
} as const;

export interface TemplatePreset {
  name: string;
  templateType: "sleek" | "modern" | "classic" | "minimal" | "bold" | "professional" | "creative";
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  headingFont: string;
  headingFontWeight: string;
  bodyFont: string;
  bodyFontWeight: string;
  fontSize: number;
  logoPosition: "left" | "center" | "right";
  logoWidth: number;
  headerLayout: "standard" | "centered" | "split";
  footerLayout: "simple" | "detailed" | "minimal";
  showCompanyAddress: boolean;
  showPaymentTerms: boolean;
  showTaxField: boolean;
  showDiscountField: boolean;
  showNotesField: boolean;
  footerText: string;
  language: string;
  dateFormat: string;
}

/**
 * The single "Sleek - Default" template
 * A minimalist, professional design that matches the SleekInvoices brand identity
 */
export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    name: "Sleek - Default",
    templateType: "sleek",
    description: "A minimalist, professional invoice template that matches the SleekInvoices brand identity. Fully customizable with Google Fonts and brand colors.",
    primaryColor: "#5f6fff",
    secondaryColor: "#1e293b",
    accentColor: "#10b981",
    backgroundColor: "#ffffff",
    headingFont: "Inter",
    headingFontWeight: "600",
    bodyFont: "Inter",
    bodyFontWeight: "400",
    fontSize: 14,
    logoPosition: "left",
    logoWidth: 120,
    headerLayout: "split",
    footerLayout: "simple",
    showCompanyAddress: true,
    showPaymentTerms: true,
    showTaxField: true,
    showDiscountField: true,
    showNotesField: true,
    footerText: "Thank you for your business!",
    language: "en",
    dateFormat: "MM/DD/YYYY",
  },
];

/**
 * Get a template preset by name
 */
export function getTemplatePreset(name: string): TemplatePreset | undefined {
  return TEMPLATE_PRESETS.find(preset => preset.name === name);
}

/**
 * Get the default template preset (Sleek - Default)
 */
export function getDefaultTemplatePreset(): TemplatePreset {
  return TEMPLATE_PRESETS[0];
}

/**
 * Get all available template presets
 */
export function getAllTemplatePresets(): TemplatePreset[] {
  return TEMPLATE_PRESETS;
}

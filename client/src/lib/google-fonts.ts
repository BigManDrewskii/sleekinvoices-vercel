// Google Fonts Integration Service
// Provides access to the full Google Fonts library with weight options

export interface GoogleFont {
  family: string;
  variants: string[];
  subsets: string[];
  category: "serif" | "sans-serif" | "display" | "handwriting" | "monospace";
}

export interface FontWeight {
  value: number;
  label: string;
  variant: string;
}

// Standard font weights mapping
export const FONT_WEIGHTS: FontWeight[] = [
  { value: 100, label: "Thin", variant: "100" },
  { value: 200, label: "Extra Light", variant: "200" },
  { value: 300, label: "Light", variant: "300" },
  { value: 400, label: "Regular", variant: "regular" },
  { value: 500, label: "Medium", variant: "500" },
  { value: 600, label: "Semi Bold", variant: "600" },
  { value: 700, label: "Bold", variant: "700" },
  { value: 800, label: "Extra Bold", variant: "800" },
  { value: 900, label: "Black", variant: "900" },
];

// Popular fonts cache - pre-loaded for instant access
// This list contains the top 200 most popular Google Fonts
export const POPULAR_FONTS: GoogleFont[] = [
  {
    family: "Inter",
    variants: [
      "100",
      "200",
      "300",
      "regular",
      "500",
      "600",
      "700",
      "800",
      "900",
    ],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Roboto",
    variants: ["100", "300", "regular", "500", "700", "900"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Open Sans",
    variants: ["300", "regular", "500", "600", "700", "800"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Montserrat",
    variants: [
      "100",
      "200",
      "300",
      "regular",
      "500",
      "600",
      "700",
      "800",
      "900",
    ],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Lato",
    variants: ["100", "300", "regular", "700", "900"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Poppins",
    variants: [
      "100",
      "200",
      "300",
      "regular",
      "500",
      "600",
      "700",
      "800",
      "900",
    ],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Source Sans Pro",
    variants: ["200", "300", "regular", "600", "700", "900"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Raleway",
    variants: [
      "100",
      "200",
      "300",
      "regular",
      "500",
      "600",
      "700",
      "800",
      "900",
    ],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Nunito",
    variants: ["200", "300", "regular", "500", "600", "700", "800", "900"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Nunito Sans",
    variants: ["200", "300", "regular", "500", "600", "700", "800", "900"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Ubuntu",
    variants: ["300", "regular", "500", "700"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Rubik",
    variants: ["300", "regular", "500", "600", "700", "800", "900"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Work Sans",
    variants: [
      "100",
      "200",
      "300",
      "regular",
      "500",
      "600",
      "700",
      "800",
      "900",
    ],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Playfair Display",
    variants: ["regular", "500", "600", "700", "800", "900"],
    subsets: ["latin"],
    category: "serif",
  },
  {
    family: "Merriweather",
    variants: ["300", "regular", "700", "900"],
    subsets: ["latin"],
    category: "serif",
  },
  {
    family: "Lora",
    variants: ["regular", "500", "600", "700"],
    subsets: ["latin"],
    category: "serif",
  },
  {
    family: "PT Sans",
    variants: ["regular", "700"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "PT Serif",
    variants: ["regular", "700"],
    subsets: ["latin"],
    category: "serif",
  },
  {
    family: "Noto Sans",
    variants: [
      "100",
      "200",
      "300",
      "regular",
      "500",
      "600",
      "700",
      "800",
      "900",
    ],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Noto Serif",
    variants: [
      "100",
      "200",
      "300",
      "regular",
      "500",
      "600",
      "700",
      "800",
      "900",
    ],
    subsets: ["latin"],
    category: "serif",
  },
  {
    family: "Fira Sans",
    variants: [
      "100",
      "200",
      "300",
      "regular",
      "500",
      "600",
      "700",
      "800",
      "900",
    ],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Quicksand",
    variants: ["300", "regular", "500", "600", "700"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Mulish",
    variants: ["200", "300", "regular", "500", "600", "700", "800", "900"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Barlow",
    variants: [
      "100",
      "200",
      "300",
      "regular",
      "500",
      "600",
      "700",
      "800",
      "900",
    ],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Josefin Sans",
    variants: ["100", "200", "300", "regular", "500", "600", "700"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "DM Sans",
    variants: ["regular", "500", "700"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Manrope",
    variants: ["200", "300", "regular", "500", "600", "700", "800"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Space Grotesk",
    variants: ["300", "regular", "500", "600", "700"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Libre Franklin",
    variants: [
      "100",
      "200",
      "300",
      "regular",
      "500",
      "600",
      "700",
      "800",
      "900",
    ],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Karla",
    variants: ["200", "300", "regular", "500", "600", "700", "800"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Cabin",
    variants: ["regular", "500", "600", "700"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Arimo",
    variants: ["regular", "500", "600", "700"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Hind",
    variants: ["300", "regular", "500", "600", "700"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Libre Baskerville",
    variants: ["regular", "700"],
    subsets: ["latin"],
    category: "serif",
  },
  {
    family: "Crimson Text",
    variants: ["regular", "600", "700"],
    subsets: ["latin"],
    category: "serif",
  },
  {
    family: "Source Serif Pro",
    variants: ["200", "300", "regular", "600", "700", "900"],
    subsets: ["latin"],
    category: "serif",
  },
  {
    family: "EB Garamond",
    variants: ["regular", "500", "600", "700", "800"],
    subsets: ["latin"],
    category: "serif",
  },
  {
    family: "Cormorant Garamond",
    variants: ["300", "regular", "500", "600", "700"],
    subsets: ["latin"],
    category: "serif",
  },
  {
    family: "Bitter",
    variants: [
      "100",
      "200",
      "300",
      "regular",
      "500",
      "600",
      "700",
      "800",
      "900",
    ],
    subsets: ["latin"],
    category: "serif",
  },
  {
    family: "Spectral",
    variants: ["200", "300", "regular", "500", "600", "700", "800"],
    subsets: ["latin"],
    category: "serif",
  },
  {
    family: "Roboto Slab",
    variants: [
      "100",
      "200",
      "300",
      "regular",
      "500",
      "600",
      "700",
      "800",
      "900",
    ],
    subsets: ["latin"],
    category: "serif",
  },
  {
    family: "Roboto Mono",
    variants: ["100", "200", "300", "regular", "500", "600", "700"],
    subsets: ["latin"],
    category: "monospace",
  },
  {
    family: "Fira Code",
    variants: ["300", "regular", "500", "600", "700"],
    subsets: ["latin"],
    category: "monospace",
  },
  {
    family: "JetBrains Mono",
    variants: ["100", "200", "300", "regular", "500", "600", "700", "800"],
    subsets: ["latin"],
    category: "monospace",
  },
  {
    family: "Source Code Pro",
    variants: ["200", "300", "regular", "500", "600", "700", "800", "900"],
    subsets: ["latin"],
    category: "monospace",
  },
  {
    family: "IBM Plex Mono",
    variants: ["100", "200", "300", "regular", "500", "600", "700"],
    subsets: ["latin"],
    category: "monospace",
  },
  {
    family: "Inconsolata",
    variants: ["200", "300", "regular", "500", "600", "700", "800", "900"],
    subsets: ["latin"],
    category: "monospace",
  },
  {
    family: "Space Mono",
    variants: ["regular", "700"],
    subsets: ["latin"],
    category: "monospace",
  },
  {
    family: "Dancing Script",
    variants: ["regular", "500", "600", "700"],
    subsets: ["latin"],
    category: "handwriting",
  },
  {
    family: "Pacifico",
    variants: ["regular"],
    subsets: ["latin"],
    category: "handwriting",
  },
  {
    family: "Caveat",
    variants: ["regular", "500", "600", "700"],
    subsets: ["latin"],
    category: "handwriting",
  },
  {
    family: "Great Vibes",
    variants: ["regular"],
    subsets: ["latin"],
    category: "handwriting",
  },
  {
    family: "Satisfy",
    variants: ["regular"],
    subsets: ["latin"],
    category: "handwriting",
  },
  {
    family: "Lobster",
    variants: ["regular"],
    subsets: ["latin"],
    category: "display",
  },
  {
    family: "Bebas Neue",
    variants: ["regular"],
    subsets: ["latin"],
    category: "display",
  },
  {
    family: "Anton",
    variants: ["regular"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Oswald",
    variants: ["200", "300", "regular", "500", "600", "700"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Archivo",
    variants: [
      "100",
      "200",
      "300",
      "regular",
      "500",
      "600",
      "700",
      "800",
      "900",
    ],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Archivo Black",
    variants: ["regular"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Exo 2",
    variants: [
      "100",
      "200",
      "300",
      "regular",
      "500",
      "600",
      "700",
      "800",
      "900",
    ],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Titillium Web",
    variants: ["200", "300", "regular", "600", "700", "900"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Overpass",
    variants: [
      "100",
      "200",
      "300",
      "regular",
      "500",
      "600",
      "700",
      "800",
      "900",
    ],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Asap",
    variants: ["regular", "500", "600", "700"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Dosis",
    variants: ["200", "300", "regular", "500", "600", "700", "800"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Oxygen",
    variants: ["300", "regular", "700"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Heebo",
    variants: [
      "100",
      "200",
      "300",
      "regular",
      "500",
      "600",
      "700",
      "800",
      "900",
    ],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Assistant",
    variants: ["200", "300", "regular", "500", "600", "700", "800"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Varela Round",
    variants: ["regular"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Comfortaa",
    variants: ["300", "regular", "500", "600", "700"],
    subsets: ["latin"],
    category: "display",
  },
  {
    family: "Righteous",
    variants: ["regular"],
    subsets: ["latin"],
    category: "display",
  },
  {
    family: "Permanent Marker",
    variants: ["regular"],
    subsets: ["latin"],
    category: "handwriting",
  },
  {
    family: "Shadows Into Light",
    variants: ["regular"],
    subsets: ["latin"],
    category: "handwriting",
  },
  {
    family: "Indie Flower",
    variants: ["regular"],
    subsets: ["latin"],
    category: "handwriting",
  },
  {
    family: "Amatic SC",
    variants: ["regular", "700"],
    subsets: ["latin"],
    category: "handwriting",
  },
  {
    family: "Abril Fatface",
    variants: ["regular"],
    subsets: ["latin"],
    category: "display",
  },
  {
    family: "Alfa Slab One",
    variants: ["regular"],
    subsets: ["latin"],
    category: "display",
  },
  {
    family: "Staatliches",
    variants: ["regular"],
    subsets: ["latin"],
    category: "display",
  },
  {
    family: "Russo One",
    variants: ["regular"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Signika",
    variants: ["300", "regular", "500", "600", "700"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Catamaran",
    variants: [
      "100",
      "200",
      "300",
      "regular",
      "500",
      "600",
      "700",
      "800",
      "900",
    ],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Maven Pro",
    variants: ["regular", "500", "600", "700", "800", "900"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Kanit",
    variants: [
      "100",
      "200",
      "300",
      "regular",
      "500",
      "600",
      "700",
      "800",
      "900",
    ],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Prompt",
    variants: [
      "100",
      "200",
      "300",
      "regular",
      "500",
      "600",
      "700",
      "800",
      "900",
    ],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Sarabun",
    variants: ["100", "200", "300", "regular", "500", "600", "700", "800"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Zilla Slab",
    variants: ["300", "regular", "500", "600", "700"],
    subsets: ["latin"],
    category: "serif",
  },
  {
    family: "Cardo",
    variants: ["regular", "700"],
    subsets: ["latin"],
    category: "serif",
  },
  {
    family: "Vollkorn",
    variants: ["regular", "500", "600", "700", "800", "900"],
    subsets: ["latin"],
    category: "serif",
  },
  {
    family: "Domine",
    variants: ["regular", "500", "600", "700"],
    subsets: ["latin"],
    category: "serif",
  },
  {
    family: "Rokkitt",
    variants: [
      "100",
      "200",
      "300",
      "regular",
      "500",
      "600",
      "700",
      "800",
      "900",
    ],
    subsets: ["latin"],
    category: "serif",
  },
  {
    family: "Arvo",
    variants: ["regular", "700"],
    subsets: ["latin"],
    category: "serif",
  },
  {
    family: "Crete Round",
    variants: ["regular"],
    subsets: ["latin"],
    category: "serif",
  },
  {
    family: "Noticia Text",
    variants: ["regular", "700"],
    subsets: ["latin"],
    category: "serif",
  },
  {
    family: "Tinos",
    variants: ["regular", "700"],
    subsets: ["latin"],
    category: "serif",
  },
  {
    family: "Gelasio",
    variants: ["regular", "500", "600", "700"],
    subsets: ["latin"],
    category: "serif",
  },
  {
    family: "IBM Plex Sans",
    variants: ["100", "200", "300", "regular", "500", "600", "700"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "IBM Plex Serif",
    variants: ["100", "200", "300", "regular", "500", "600", "700"],
    subsets: ["latin"],
    category: "serif",
  },
  {
    family: "Lexend",
    variants: [
      "100",
      "200",
      "300",
      "regular",
      "500",
      "600",
      "700",
      "800",
      "900",
    ],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Plus Jakarta Sans",
    variants: ["200", "300", "regular", "500", "600", "700", "800"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Sora",
    variants: ["100", "200", "300", "regular", "500", "600", "700", "800"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Be Vietnam Pro",
    variants: [
      "100",
      "200",
      "300",
      "regular",
      "500",
      "600",
      "700",
      "800",
      "900",
    ],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Red Hat Display",
    variants: ["300", "regular", "500", "600", "700", "800", "900"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Red Hat Text",
    variants: ["300", "regular", "500", "600", "700"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Outfit",
    variants: [
      "100",
      "200",
      "300",
      "regular",
      "500",
      "600",
      "700",
      "800",
      "900",
    ],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Albert Sans",
    variants: [
      "100",
      "200",
      "300",
      "regular",
      "500",
      "600",
      "700",
      "800",
      "900",
    ],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Figtree",
    variants: ["300", "regular", "500", "600", "700", "800", "900"],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Onest",
    variants: [
      "100",
      "200",
      "300",
      "regular",
      "500",
      "600",
      "700",
      "800",
      "900",
    ],
    subsets: ["latin"],
    category: "sans-serif",
  },
  {
    family: "Geist",
    variants: [
      "100",
      "200",
      "300",
      "regular",
      "500",
      "600",
      "700",
      "800",
      "900",
    ],
    subsets: ["latin"],
    category: "sans-serif",
  },
];

// Cache for loaded fonts
const loadedFonts = new Set<string>();

/**
 * Load a Google Font dynamically
 */
export function loadGoogleFont(
  family: string,
  weights: string[] = ["regular", "700"]
): void {
  const fontKey = `${family}:${weights.join(",")}`;

  if (loadedFonts.has(fontKey)) {
    return;
  }

  // Convert weight names to numbers for the API
  const weightParams = weights
    .map(w => {
      if (w === "regular") return "400";
      if (w === "italic") return "400italic";
      return w;
    })
    .join(";");

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weightParams}&display=swap`;
  document.head.appendChild(link);

  loadedFonts.add(fontKey);
}

/**
 * Load multiple fonts at once
 */
export function loadGoogleFonts(
  fonts: Array<{ family: string; weights?: string[] }>
): void {
  fonts.forEach(({ family, weights }) => {
    loadGoogleFont(family, weights);
  });
}

/**
 * Get available weights for a font
 */
export function getAvailableWeights(font: GoogleFont): FontWeight[] {
  return FONT_WEIGHTS.filter(weight => {
    return (
      font.variants.includes(weight.variant) ||
      font.variants.includes(String(weight.value))
    );
  });
}

/**
 * Search fonts by name
 */
export function searchFonts(
  query: string,
  fonts: GoogleFont[] = POPULAR_FONTS
): GoogleFont[] {
  const lowerQuery = query.toLowerCase();
  return fonts.filter(font => font.family.toLowerCase().includes(lowerQuery));
}

/**
 * Filter fonts by category
 */
export function filterFontsByCategory(
  category: GoogleFont["category"] | "all",
  fonts: GoogleFont[] = POPULAR_FONTS
): GoogleFont[] {
  if (category === "all") return fonts;
  return fonts.filter(font => font.category === category);
}

/**
 * Get fonts grouped by category
 */
export function getFontsByCategory(
  fonts: GoogleFont[] = POPULAR_FONTS
): Record<string, GoogleFont[]> {
  return fonts.reduce(
    (acc, font) => {
      if (!acc[font.category]) {
        acc[font.category] = [];
      }
      acc[font.category].push(font);
      return acc;
    },
    {} as Record<string, GoogleFont[]>
  );
}

/**
 * Preload common fonts for faster access
 */
export function preloadCommonFonts(): void {
  const commonFonts = [
    { family: "Inter", weights: ["300", "400", "500", "600", "700"] },
    { family: "Roboto", weights: ["300", "400", "500", "700"] },
    { family: "Open Sans", weights: ["400", "600", "700"] },
    { family: "Montserrat", weights: ["400", "500", "600", "700"] },
    { family: "Playfair Display", weights: ["400", "600", "700"] },
  ];
  loadGoogleFonts(commonFonts);
}

export interface ThemeRegistryItem {
  id: string;
  name: string;
  description: string;
  previewColor: string;
  previewColorDark?: string;
  fontFamily?: string;
}

export const parseColorToRgb = (colorStr: string): [number, number, number] | null => {
  const trimmed = colorStr.trim();
  if (trimmed.startsWith('#')) {
    const hex = trimmed.substring(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return [r, g, b];
    } else if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return [r, g, b];
    }
  }
  const rgbMatch = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    return [parseInt(rgbMatch[1], 10), parseInt(rgbMatch[2], 10), parseInt(rgbMatch[3], 10)];
  }
  return null;
};

export const getContrastMaskColor = (bgRgb: [number, number, number]): [number, number, number] => {
  const [r, g, b] = bgRgb;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance > 0.5) {
    // Light background: make mask slightly darker for visual contrast
    return [Math.max(0, r - 30), Math.max(0, g - 30), Math.max(0, b - 30)];
  } else {
    // Dark background: make mask lighter for visual contrast
    return [Math.min(255, r + 40), Math.min(255, g + 40), Math.min(255, b + 40)];
  }
};

export const AVAILABLE_THEMES: ThemeRegistryItem[] = [
  {
    id: "amber-minimal",
    name: "Amber Minimal",
    description: "Amber Minimal color scheme",
    previewColor: "#f59e0b",
    previewColorDark: "#f59e0b",
    fontFamily: "Inter, sans-serif"
  },
  {
    id: "amethyst-haze",
    name: "Amethyst Haze",
    description: "Amethyst Haze color scheme",
    previewColor: "#8a79ab",
    previewColorDark: "#a995c9",
    fontFamily: "Geist, sans-serif"
  },
  {
    id: "bold-tech",
    name: "Bold Tech",
    description: "Bold Tech color scheme",
    previewColor: "#8b5cf6",
    previewColorDark: "#8b5cf6",
    fontFamily: "Roboto, sans-serif"
  },
  {
    id: "bubblegum",
    name: "Bubblegum",
    description: "Bubblegum color scheme",
    previewColor: "#d04f99",
    previewColorDark: "#fbe2a7",
    fontFamily: "Poppins, sans-serif"
  },
  {
    id: "caffeine",
    name: "Caffeine",
    description: "Caffeine color scheme",
    previewColor: "#644a40",
    previewColorDark: "#ffe0c2",
    fontFamily: "Outfit, sans-serif"
  },
  {
    id: "candyland",
    name: "Candyland",
    description: "Candyland color scheme",
    previewColor: "#ffc0cb",
    previewColorDark: "#ff99cc",
    fontFamily: "Poppins, sans-serif"
  },
  {
    id: "catppuccin",
    name: "Catppuccin",
    description: "Catppuccin color scheme",
    previewColor: "#8839ef",
    previewColorDark: "#cba6f7",
    fontFamily: "Montserrat, sans-serif"
  },
  {
    id: "claude",
    name: "Claude",
    description: "Claude color scheme",
    previewColor: "#c96442",
    previewColorDark: "#d97757",
    fontFamily: "Inter, sans-serif"
  },
  {
    id: "claymorphism",
    name: "Claymorphism",
    description: "Claymorphism color scheme",
    previewColor: "#6366f1",
    previewColorDark: "#818cf8",
    fontFamily: "Plus Jakarta Sans, sans-serif"
  },
  {
    id: "clean-slate",
    name: "Clean Slate",
    description: "Clean Slate color scheme",
    previewColor: "#6366f1",
    previewColorDark: "#818cf8",
    fontFamily: "Inter, sans-serif"
  },
  {
    id: "cosmic-night",
    name: "Cosmic Night",
    description: "Cosmic Night color scheme",
    previewColor: "#6e56cf",
    previewColorDark: "#a48fff",
    fontFamily: "Inter, sans-serif"
  },

  {
    id: "bw",
    name: "BW",
    description: "BW color scheme",
    previewColor: "#171717",
    previewColorDark: "#fafafa",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'"
  },
  {
    id: "doom-64",
    name: "Doom 64",
    description: "Doom 64 color scheme",
    previewColor: "#b71c1c",
    previewColorDark: "#e53935",
    fontFamily: "\"Oxanium\", sans-serif"
  },
  {
    id: "elegant-luxury",
    name: "Elegant Luxury",
    description: "Elegant Luxury color scheme",
    previewColor: "#9b2c2c",
    previewColorDark: "#b91c1c",
    fontFamily: "Poppins, sans-serif"
  },
  {
    id: "graphite",
    name: "Graphite",
    description: "Graphite color scheme",
    previewColor: "#606060",
    previewColorDark: "#a0a0a0",
    fontFamily: "Montserrat, sans-serif"
  },
  {
    id: "kodama-grove",
    name: "Kodama Grove",
    description: "Kodama Grove color scheme",
    previewColor: "#8d9d4f",
    previewColorDark: "#8a9f7b",
    fontFamily: "Merriweather, serif"
  },
  {
    id: "midnight-bloom",
    name: "Midnight Bloom",
    description: "Midnight Bloom color scheme",
    previewColor: "#6c5ce7",
    previewColorDark: "#6c5ce7",
    fontFamily: "Montserrat, sans-serif"
  },
  {
    id: "mocha-mousse",
    name: "Mocha Mousse",
    description: "Mocha Mousse color scheme",
    previewColor: "#A37764",
    previewColorDark: "#C39E88",
    fontFamily: "DM Sans, sans-serif"
  },
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    description: "Modern Minimal color scheme",
    previewColor: "#3b82f6",
    previewColorDark: "#3b82f6",
    fontFamily: "Inter, sans-serif"
  },
  {
    id: "mono",
    name: "Mono",
    description: "Mono color scheme",
    previewColor: "#737373",
    previewColorDark: "#737373",
    fontFamily: "Geist Mono, monospace"
  },
  {
    id: "nature",
    name: "Nature",
    description: "Nature color scheme",
    previewColor: "#2e7d32",
    previewColorDark: "#4caf50",
    fontFamily: "Montserrat, sans-serif"
  },
  {
    id: "neo-brutalism",
    name: "Neo Brutalism",
    description: "Neo Brutalism color scheme",
    previewColor: "#ff3333",
    previewColorDark: "#ff6666",
    fontFamily: "DM Sans, sans-serif"
  },
  {
    id: "northern-lights",
    name: "Northern Lights",
    description: "Northern Lights color scheme",
    previewColor: "#34a85a",
    previewColorDark: "#33cc33",
    fontFamily: "Montserrat, sans-serif"
  },
  {
    id: "notebook",
    name: "Notebook",
    description: "Notebook color scheme",
    previewColor: "#606060",
    previewColorDark: "#b0b0b0",
    fontFamily: "Architects Daughter, sans-serif"
  },
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    description: "Ocean Breeze color scheme",
    previewColor: "#22c55e",
    previewColorDark: "#34d399",
    fontFamily: "DM Sans, sans-serif"
  },
  {
    id: "origin-ui",
    name: "Origin Ui",
    description: "Origin Ui color scheme",
    previewColor: "#18181b",
    previewColorDark: "#fafafa",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'"
  },
  {
    id: "pastel-dreams",
    name: "Pastel Dreams",
    description: "Pastel Dreams color scheme",
    previewColor: "#a78bfa",
    previewColorDark: "#c0aafd",
    fontFamily: "Open Sans, sans-serif"
  },
  {
    id: "perpetuity",
    name: "Perpetuity",
    description: "Perpetuity color scheme",
    previewColor: "#06858e",
    previewColorDark: "#4de8e8",
    fontFamily: "Courier New, monospace"
  },
  {
    id: "quantum-rose",
    name: "Quantum Rose",
    description: "Quantum Rose color scheme",
    previewColor: "#e6067a",
    previewColorDark: "#ff6bef",
    fontFamily: "Poppins, sans-serif"
  },
  {
    id: "retro-arcade",
    name: "Retro Arcade",
    description: "Retro Arcade color scheme",
    previewColor: "#d33682",
    previewColorDark: "#d33682",
    fontFamily: "Outfit, sans-serif"
  },
  {
    id: "soft-pop",
    name: "Soft Pop",
    description: "Soft Pop color scheme",
    previewColor: "#4f46e5",
    previewColorDark: "#818cf8",
    fontFamily: "DM Sans, sans-serif"
  },
  {
    id: "solar-dusk",
    name: "Solar Dusk",
    description: "Solar Dusk color scheme",
    previewColor: "#B45309",
    previewColorDark: "#F97316",
    fontFamily: "Oxanium, sans-serif"
  },
  {
    id: "starry-night",
    name: "Starry Night",
    description: "Starry Night color scheme",
    previewColor: "#3a5ba0",
    previewColorDark: "#3a5ba0",
    fontFamily: "Libre Baskerville, serif"
  },
  {
    id: "sunset-horizon",
    name: "Sunset Horizon",
    description: "Sunset Horizon color scheme",
    previewColor: "#ff7e5f",
    previewColorDark: "#ff7e5f",
    fontFamily: "Montserrat, sans-serif"
  },
  {
    id: "supabase",
    name: "Supabase",
    description: "Supabase color scheme",
    previewColor: "#72e3ad",
    previewColorDark: "#006239",
    fontFamily: "Outfit, sans-serif"
  },
  {
    id: "t3-chat",
    name: "T3 Chat",
    description: "T3 Chat color scheme",
    previewColor: "#a84370",
    previewColorDark: "#a3004c",
    fontFamily: "Inter, sans-serif"
  },
  {
    id: "tangerine",
    name: "Tangerine",
    description: "Tangerine color scheme",
    previewColor: "#e05d38",
    previewColorDark: "#e05d38",
    fontFamily: "Inter, sans-serif"
  },
  {
    id: "twitter",
    name: "Twitter",
    description: "Twitter color scheme",
    previewColor: "#1e9df1",
    previewColorDark: "#1c9cf0",
    fontFamily: "Open Sans, sans-serif"
  },
  {
    id: "vintage-paper",
    name: "Vintage Paper",
    description: "Vintage Paper color scheme",
    previewColor: "#a67c52",
    previewColorDark: "#c0a080",
    fontFamily: "Libre Baskerville, serif"
  },
  {
    id: "violet-bloom",
    name: "Violet Bloom",
    description: "Violet Bloom color scheme",
    previewColor: "#7033ff",
    previewColorDark: "#8c5cff",
    fontFamily: "Plus Jakarta Sans, sans-serif"
  }
];

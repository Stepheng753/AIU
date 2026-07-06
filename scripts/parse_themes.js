const fs = require('fs');
const path = require('path');

const THEMES_DIR = path.join(__dirname, '../aiu-web/public/themes');
const OUTPUT_FILE = path.join(__dirname, '../aiu-mobile/src/themes/themeColors.ts');

function parseCssVariables(cssContent, selector) {
  // Find block matching the selector (e.g. :root or .dark)
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`${escapedSelector}\\s*\\{([^}]+)\\}`, 'i');
  const match = cssContent.match(regex);
  if (!match) return null;

  const blockContent = match[1];
  const variables = {};
  
  // Extract double dash variables
  const varRegex = /--([a-zA-Z0-9-]+)\s*:\s*([^;\n]+)/g;
  let varMatch;
  while ((varMatch = varRegex.exec(blockContent)) !== null) {
    const key = varMatch[1].trim();
    const val = varMatch[2].trim();
    
    // Camelcase key
    const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    variables[camelKey] = val;
  }
  
  return variables;
}

function processThemes() {
  const files = fs.readdirSync(THEMES_DIR);
  const themeMap = {};

  for (const file of files) {
    if (!file.endsWith('.css')) continue;
    const themeId = path.basename(file, '.css');
    const filePath = path.join(THEMES_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Parse light variables from :root
    const lightVars = parseCssVariables(content, ':root') || {};
    // Parse dark variables from .dark
    const darkVars = parseCssVariables(content, '.dark') || {};

    const cleanVars = (vars) => {
      return {
        background: vars.background || '#ffffff',
        foreground: vars.foreground || '#000000',
        card: vars.card || '#ffffff',
        cardForeground: vars.cardForeground || '#000000',
        primary: vars.primary || '#000000',
        primaryForeground: vars.primaryForeground || '#ffffff',
        secondary: vars.secondary || '#cccccc',
        secondaryForeground: vars.secondaryForeground || '#000000',
        muted: vars.muted || '#f3f4f6',
        mutedForeground: vars.mutedForeground || '#6b7280',
        accent: vars.accent || '#e5e7eb',
        accentForeground: vars.accentForeground || '#111827',
        border: vars.border || '#e5e7eb',
      };
    };

    themeMap[themeId] = {
      light: cleanVars(lightVars),
      dark: cleanVars(darkVars)
    };
  }

  // Ensure directories exist
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const tsContent = `// Automatically compiled from web application themes
export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
}

export interface ThemeSet {
  light: ThemeColors;
  dark: ThemeColors;
}

export const THEME_COLOR_MAP: Record<string, ThemeSet> = ${JSON.stringify(themeMap, null, 2)};
`;

  fs.writeFileSync(OUTPUT_FILE, tsContent, 'utf-8');
  console.log(`Successfully compiled ${Object.keys(themeMap).length} themes into ${OUTPUT_FILE}`);
}

processThemes();

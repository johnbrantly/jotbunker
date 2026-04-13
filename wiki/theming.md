# Palette Theming

HSL-based accent color with a grayscale desaturation slider. One theme system shared across phone and computer.

---

## How it works

Two sliders in settings control the entire color palette:

- **Hue** (0-360) — the accent color around the HSL wheel
- **Grayscale** (0-100) — desaturation level. 0 = full color, 100 = monochrome

The function `buildTheme(hue, grayscale)` generates a complete theme object: background, primary color, text variants, borders, accents, and component-specific colors. Both platforms use the same function from the shared package.

## Default

Desaturated steel blue — hue 205, grayscale 75. Dark mode only (no light mode).

## Fonts

- **DMSans** — sans-serif, weights 300-900. Used for UI text and list items.
- **DMMono** — monospace. Used for scratchpad text and code-like content.

Both are loaded via `@expo-google-fonts` on mobile and CSS imports on the computer.

## Platform differences

- **Mobile:** `useTheme()` hook returns the theme via `useMemo` over the settings store's hue and grayscale values.
- **Desktop:** Same hook with overrides. A `cssFont()` utility maps React Native font family names to CSS font-family values.

---

See also: [Phone App](phone-app-overview.md) | [Computer App](computer-app-overview.md)

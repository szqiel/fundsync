# FundSync Design System

## Palette
- **Background (Base):** `#F3EFE7` (Muted, editorial Anthropic Beige)
- **Primary Accent:** `#269755` (Deep, trusted Primary Green)
- **Secondary Accent:** `#CFEE91` (Electric/Neon Secondary Green for highlights and glows)
- **Neutrals:** Zinc scale (`#FAFAFA` to `#111111`) for text, borders, and deep surfaces.

## Typography
- **Primary Font:** `Geist Sans` (for all structural UI, headers, and body text).
- **Monospace:** `Geist Mono` (for data labels, character counts, metrics, logs, and micro-copy).
- **Rule:** Absolute ban on Serif fonts (`Playfair Display` was removed).

## UI Architecture
- **Layout:** Bento 2.0 grids. Asymmetrical alignments.
- **Surfaces:** Liquid Glass styling (backdrop blurs with inner refraction borders `border-white/40`, `shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]`). High border radii (`rounded-[2rem]`, `rounded-[2.5rem]`).
- **Elevation:** "Diffusion shadows" rather than harsh drop shadows. 
- **Motion:** Perpetual micro-interactions using Framer Motion with Spring physics (`stiffness: 300, damping: 30`).

## Component Guidelines
- **Empty States:** Beautiful, centered, descriptive, lacking heavy borders.
- **Buttons:** Tactile. They must depress (`scale: 0.98`) on click.
- **Loaders:** Replace standard spinners with concentric, pulsing, or staggered waterfall indicators.

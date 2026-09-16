---
name: Industrial Precision Light
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#584237'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#8c7164'
  outline-variant: '#e0c0b1'
  surface-tint: '#9d4300'
  primary: '#9d4300'
  on-primary: '#ffffff'
  primary-container: '#f97316'
  on-primary-container: '#582200'
  inverse-primary: '#ffb690'
  secondary: '#006591'
  on-secondary: '#ffffff'
  secondary-container: '#39b8fd'
  on-secondary-container: '#004666'
  tertiary: '#006398'
  on-tertiary: '#ffffff'
  tertiary-container: '#00a2f4'
  on-tertiary-container: '#003554'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbca'
  primary-fixed-dim: '#ffb690'
  on-primary-fixed: '#341100'
  on-primary-fixed-variant: '#783200'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#cde5ff'
  tertiary-fixed-dim: '#93ccff'
  on-tertiary-fixed: '#001d32'
  on-tertiary-fixed-variant: '#004b74'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  surface-slate: '#E2E8F0'
  text-heading: '#0F172A'
  text-body: '#475569'
  border-subtle: '#CBD5E1'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  technical-sm:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  technical-xs:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  unit-1: 4px
  unit-2: 8px
  unit-4: 16px
  unit-6: 24px
  unit-8: 32px
  unit-12: 48px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  max-width: 1440px
---

## Brand & Style

This design system translates high-level engineering discipline into a refined, light-themed digital workspace. It is designed for engineers, logistics specialists, and technical operators who require clarity and absolute focus.

The design style is a hybrid of **Modern Corporate** and **Glassmorphism**, leaning heavily into a "technical blueprint" aesthetic. The interface should feel like a high-precision instrument: calibrated, lightweight, and transparent. By utilizing light slate surfaces and subtle frosted glass effects, the system maintains its industrial roots while providing a modern, airy workspace that reduces cognitive load during long periods of data analysis.

The emotional response should be one of "Absolute Clarity and Command."

## Colors

The palette transitions the original industrial dark mode into a professional light theme, emphasizing legibility and structural hierarchy.

- **Canvas:** The primary background is `#F8FAFC`, a clean, cool white that provides a neutral foundation for technical overlays.
- **Surfaces:** Use `#E2E8F0` with variable opacity (typically 70-80%) to create glassmorphic layers.
- **Primary Accent (Industrial Precision Orange):** Reserved for primary calls to action, critical alerts, and active states.
- **Secondary Accent (Engineering Cyan):** Used for technical data visualizations, measurements, and CAD-related UI elements.
- **Typography:** Headings utilize Deep Slate (`#0F172A`) for maximum contrast, while body text uses Slate Gray (`#475569`) to ensure a comfortable reading experience.

## Typography

The system employs a dual-font strategy to distinguish between narrative interface elements and raw technical data.

- **Interface & Headers:** `Plus Jakarta Sans` provides a modern, approachable geometric structure for all navigation and structural labeling.
- **Technical Data:** `JetBrains Mono` is mandatory for all coordinates, serial numbers, SKU codes, and log outputs. The monospaced nature ensures that numerical values align vertically, aiding in rapid data comparison.
- **Hierarchy:** Use bold weights sparingly for emphasis in headers; technical data should maintain a medium weight to ensure legibility against glassmorphic backgrounds.

## Layout & Spacing

The layout is governed by a rigid 12-column grid system, reflecting engineering precision.

- **Fixed Grid:** Content is housed within a 1440px container. On larger screens, the container centers itself, maintaining the integrity of the information density.
- **Blueprint Grid:** A subtle background pattern of 32px squares (using `#E2E8F0` at 3-5% opacity) must be present globally. This reinforces the "technical drawing" aesthetic.
- **Rhythm:** All spacing—padding, margins, and component heights—must be multiples of the 4px base unit. 
- **Reflow:** On mobile devices, margins compress to 16px. Glassmorphic panels should lose their backdrop blur on low-power mobile devices but retain their 1px borders to maintain structural definition.

## Elevation & Depth

In this design system, depth is achieved through translucency and edge definition rather than traditional heavy shadows.

- **Tonal Layers:** The hierarchy is established by stacking semi-transparent surfaces. 
- **Backdrop Blur:** Primary panels and modals utilize `backdrop-filter: blur(16px)` with a light slate tint (`#E2E8F0` at 70% opacity). This creates a "frosted engineering glass" effect.
- **Hairline Borders:** Every elevated element must be defined by a 1px solid border (`#CBD5E1`). For a "light source" effect, apply a slightly lighter top-border to simulate a physical edge.
- **Ambient Shadows:** Shadows are rarely used. When necessary (e.g., for detached modals), use a very large, soft spread with low opacity: `0 20px 50px rgba(15, 23, 42, 0.08)`.

## Shapes

The shape language is rational and geometric. To maintain an industrial feel, roundedness is kept to a minimum (4px / 0.25rem).

- **Standard Elements:** Buttons, input fields, and cards use the base 4px radius.
- **Technical Accents:** Do not use fully rounded "pill" shapes for buttons; keep them rectangular with the 4px radius to maintain the architectural feel.
- **Iconography:** Use 2px stroke weight icons. Avoid rounded terminals; icons should have mitered or square caps to mimic technical CAD drawings.

## Components

- **Buttons:** 
    - *Primary:* Solid `#F97316` fill with white text. No gradient. 
    - *Secondary:* Transparent background with a 1px `#CBD5E1` border and Deep Slate text.
- **Input Fields:** 
    - Background is a very pale version of the canvas (`#F1F5F9`). 
    - On focus, the border transitions to Engineering Cyan (`#0EA5E9`) with a subtle 2px outer glow in the same color. 
    - Labels must use `JetBrains Mono` at `technical-xs` size.
- **Technical Cards:** 
    - Glassmorphic panels with `#E2E8F0` at 80% opacity and 1px border.
    - Headers within cards should have a subtle bottom border to separate technical metadata from the content.
- **Data Tables:**
    - High-density layouts. 
    - Row separators use `#E2E8F0` at 1px width. 
    - Numerical data columns must use `JetBrains Mono` and be right-aligned for comparative analysis.
- **Status Chips:** 
    - Small, rectangular indicators with a 2px radius. 
    - Use low-saturation background tints of the status color (e.g., light green for 'Active') with a solid 4px circle indicator.
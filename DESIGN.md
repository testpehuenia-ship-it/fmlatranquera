---
name: Estancia Heritage
colors:
  surface: '#fdf9f4'
  surface-dim: '#ddd9d5'
  surface-bright: '#fdf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3ee'
  surface-container: '#f1ede8'
  surface-container-high: '#ebe8e3'
  surface-container-highest: '#e6e2dd'
  on-surface: '#1c1c19'
  on-surface-variant: '#504441'
  inverse-surface: '#31302d'
  inverse-on-surface: '#f4f0eb'
  outline: '#827470'
  outline-variant: '#d4c3be'
  surface-tint: '#77574d'
  primary: '#442a22'
  on-primary: '#ffffff'
  primary-container: '#5d4037'
  on-primary-container: '#d4ada1'
  inverse-primary: '#e7bdb1'
  secondary: '#78582f'
  on-secondary: '#ffffff'
  secondary-container: '#fed39f'
  on-secondary-container: '#795930'
  tertiary: '#1e3623'
  on-tertiary: '#ffffff'
  tertiary-container: '#354d38'
  on-tertiary-container: '#a1bda3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd0'
  primary-fixed-dim: '#e7bdb1'
  on-primary-fixed: '#2c160e'
  on-primary-fixed-variant: '#5d4037'
  secondary-fixed: '#ffddb7'
  secondary-fixed-dim: '#eabf8d'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#5e411a'
  tertiary-fixed: '#cdeace'
  tertiary-fixed-dim: '#b2ceb3'
  on-tertiary-fixed: '#08200f'
  on-tertiary-fixed-variant: '#344c38'
  background: '#fdf9f4'
  on-background: '#1c1c19'
  surface-variant: '#e6e2dd'
typography:
  display-lg:
    fontFamily: Domine
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Domine
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Domine
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Source Sans 3
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Source Sans 3
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Source Sans 3
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

The design system is rooted in the "Estancia Heritage" aesthetic, capturing the soul of the Argentine countryside. It prioritizes authenticity and warmth, moving away from cold digital trends toward a tactile, professional, and traditional experience. 

The visual style is **Rustic-Modern**, blending the structured reliability of a classic newspaper with the organic textures of leather and wood. It avoids flat minimalism in favor of subtle depth and rich, sun-washed tones that evoke the feeling of a trusted community radio station broadcasting from the heart of the campo. The UI should feel established, like a well-worn leather saddle—functional, beautiful, and built to last.

## Colors

The palette is derived from the natural elements of the rural landscape.

*   **Primary (Ombú Brown):** A deep, chocolate brown used for primary branding, navigation bars, and strong structural elements. It provides the grounding force of the UI.
*   **Secondary (Cuero Tan):** A warm leather tone used for interactive elements, highlights, and icons. It adds a touch of craftsmanship.
*   **Tertiary (Monte Green):** A muted forest green used for status indicators, secondary call-outs, and environmental accents.
*   **Neutral (Pampa Cream):** A sun-washed, off-white background color that reduces eye strain and provides a "paper-like" reading experience compared to pure white.
*   **Accent (Poncho Red):** (Optional/Functional) Use a muted clay red (#A04035) sparingly for urgent alerts or "On Air" indicators.

## Typography

This design system utilizes a high-contrast pairing to balance tradition with legibility.

*   **Headlines:** **Domine** provides a sturdy, authoritative serif presence. Its classic proportions evoke the feel of traditional Argentine press and ranch signage.
*   **Body & UI:** **Source Sans 3** is used for all functional text. It is a workhorse typeface that remains highly legible at small sizes, ensuring that weather updates, community news, and grain prices are easily readable for all demographics.
*   **Hierarchy:** Use large serif displays for program titles and news headers. Use all-caps sans-serif for labels and navigation categories to maintain a disciplined, professional structure.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy on desktop to maintain the organized feel of a traditional broadsheet. 

*   **Desktop:** A 12-column grid with a maximum width of 1200px. Large gutters (24px) provide significant "breathing room," reinforcing the calm, unhurried vibe of the countryside.
*   **Mobile:** A single-column flow with generous 16px side margins. 
*   **Rhythm:** Use an 8px base unit. Vertical rhythm should be loose; don't crowd elements. Content sections should be separated by clear thematic breaks or subtle horizontal rules reminiscent of newspaper dividers.

## Elevation & Depth

To maintain the "Rustic" feel, avoid heavy shadows and high-tech blurs. Instead, use:

*   **Tonal Layering:** Use slightly darker shades of the Pampa Cream or very light Cuero Tans to define card areas.
*   **Fine Outlines:** Use 1px borders in a low-contrast "Saddle Brown" (#D7CCC8) instead of shadows to define containers. This mimics the look of paper edges or embossed leather.
*   **Inner Depths:** For input fields and "On Air" status boxes, use a subtle inner shadow to create a "pressed" effect, giving the UI a tactile, physical quality.

## Shapes

The shape language is **Soft (0.25rem)**. 

While the brand is traditional, "Sharp" corners feel too aggressive and "Pill-shaped" feels too modern/tech-heavy. A small radius (4px to 8px) softens the interface, making it feel approachable and friendly while maintaining a rectangular structure that fits the "Signage" and "Newspaper" narrative.

## Components

*   **Buttons:** Primary buttons use the Cuero Tan background with white text. They should have a subtle 1px bottom border of a darker brown to simulate a physical button.
*   **The "Now Playing" Card:** A signature component. Use a Monte Green background with Pampa Cream text. It should be the most prominent element on the screen, potentially using a slightly larger corner radius (8px) to stand out.
*   **Input Fields:** Use the Pampa Cream background with a 1px border. Focus states should switch the border to Monte Green.
*   **Chips/Tags:** Use for music genres (e.g., "Folklore", "Chamame"). These should have a light tan background and no border, appearing like small leather labels.
*   **Dividers:** Use horizontal rules with a decorative "diamond" or "dot" in the center to separate news articles, mimicking vintage editorial styling.
*   **Audio Player:** The progress bar should use the primary brown for the track and the secondary tan for the progress, avoiding bright "neon" colors entirely.
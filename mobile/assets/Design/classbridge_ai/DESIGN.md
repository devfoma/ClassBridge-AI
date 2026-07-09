---
name: ClassBridge AI
colors:
  surface: '#f9f9fc'
  surface-dim: '#dadadc'
  surface-bright: '#f9f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f6'
  surface-container: '#eeeef0'
  surface-container-high: '#e8e8ea'
  surface-container-highest: '#e2e2e5'
  on-surface: '#1a1c1e'
  on-surface-variant: '#444650'
  inverse-surface: '#2f3133'
  inverse-on-surface: '#f0f0f3'
  outline: '#757681'
  outline-variant: '#c5c6d1'
  surface-tint: '#455c9a'
  primary: '#000e32'
  on-primary: '#ffffff'
  primary-container: '#00215e'
  on-primary-container: '#748bcd'
  inverse-primary: '#b3c5ff'
  secondary: '#0059bb'
  on-secondary: '#ffffff'
  secondary-container: '#0070ea'
  on-secondary-container: '#fefcff'
  tertiary: '#260600'
  on-tertiary: '#ffffff'
  tertiary-container: '#4a1200'
  on-tertiary-container: '#cc7658'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae1ff'
  primary-fixed-dim: '#b3c5ff'
  on-primary-fixed: '#001849'
  on-primary-fixed-variant: '#2c4481'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc7ff'
  on-secondary-fixed: '#001a41'
  on-secondary-fixed-variant: '#004493'
  tertiary-fixed: '#ffdbd0'
  tertiary-fixed-dim: '#ffb59d'
  on-tertiary-fixed: '#390c00'
  on-tertiary-fixed-variant: '#76321a'
  background: '#f9f9fc'
  on-background: '#1a1c1e'
  surface-variant: '#e2e2e5'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  margin-mobile: 1.25rem
  gutter-mobile: 1rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 1.5rem
  safe-area: 1rem
---

## Brand & Style

The design system for ClassBridge AI is built on the pillars of **reliability, accessibility, and focus**. As an application designed for offline classroom environments, it prioritizes utilitarian clarity while maintaining a professional, high-trust educational aesthetic. 

The visual style is **Corporate / Modern** with a slight "Soft Tech" influence. It balances the authoritative nature of institutional education with the approachability of AI-assisted learning. The interface utilizes a high-contrast foundation to ensure legibility in varied lighting conditions, common in rural or under-resourced schools.

- **Target Audience:** Educators requiring robust offline tools and students seeking clear, structured learning paths.
- **Tone:** Methodical, encouraging, and dependable.
- **Style:** Clean layouts, generous tap targets, and meaningful color shifts to define user context.

## Colors

The palette is derived directly from the brand’s core identity, utilizing deep navy for structural authority and vibrant azure for interactive elements. 

### Contextual Modes
To differentiate the user experience without fracturing the brand identity, this design system employs "Role-Based Accents":
- **Teacher Mode:** Uses a more saturated, deeper blue profile for headers and primary actions, evoking a sense of administrative control and stability.
- **Student Mode:** Utilizes a brighter, more energetic azure to signify a space for active learning and participation.

### High-Contrast Utility
The system uses a 95% black for primary text to reduce eye strain while maintaining a high contrast ratio (minimum 7:1) against the white background, ensuring visibility in low-light classrooms.

## Typography

The design system exclusively uses **Inter** to ensure maximum legibility and a systematic, utilitarian feel across all screen types. 

- **Weight Usage:** Bold and Semibold weights are reserved for structural wayfinding (headings, card titles). Regular weights are used for instructional body text to maintain a clean, breathable reading experience.
- **Scale:** The type scale is slightly larger than standard mobile apps to accommodate for accessibility in dynamic classroom environments where the device might be resting on a desk or held at a distance.
- **Vertical Rhythm:** Line heights are set generously (1.5x for body text) to prevent visual crowding of educational content.

## Layout & Spacing

This design system uses a **Fluid Grid** model optimized for handheld mobile devices and tablets. 

- **Grid:** A 4-column grid for mobile and an 8-column grid for tablets. 
- **Tap Targets:** In alignment with the "offline classroom" use case, all interactive elements must maintain a minimum height of 48px to ensure ease of use during high-activity sessions.
- **Spacing Rhythm:** An 8px base unit system is used. Margins are fixed at 20px (1.25rem) to provide a "frame" that separates the app content from the physical hardware, increasing focus.

## Elevation & Depth

To maintain a "high-trust" and modern feel, the design system avoids heavy shadows. Instead, it utilizes **Tonal Layers** and **Low-Contrast Outlines**.

1.  **Surfaces:** The primary background is pure white. Secondary content (like card containers or inactive sections) sits on a light grey-blue surface (#F8FAFC).
2.  **Borders:** Subtle 1px borders (#E2E8F0) are used to define card boundaries.
3.  **Active Elevation:** Only the most critical interactive elements (Primary Buttons and Active Modals) receive a soft, ambient shadow (8px blur, 10% opacity of the Primary Navy) to suggest "press-ability" without creating visual noise.

## Shapes

The shape language is defined as **Rounded**, striking a balance between professional geometry and friendly approachability.

- **Base Corner Radius:** 0.5rem (8px) for small components like tags and input fields.
- **Container Radius (rounded-lg):** 1rem (16px) for cards, modals, and main navigation containers. This significant rounding creates the "friendly educational feel" requested.
- **Interactive Elements:** Buttons and prominent action chips use the `rounded-lg` setting to feel soft and inviting to touch.

## Components

### Buttons
- **Primary:** Solid fill (Navy for Teacher, Azure for Student). 16px corner radius. High-contrast white text.
- **Secondary:** Outlined with 1.5px stroke in the role-specific accent color. White background.

### Input Fields
- **Styling:** 1px border (#CBD5E1) that thickens and changes to the Primary color on focus. 
- **Labels:** Always persistent above the field in `label-sm` for accessibility; never rely solely on placeholder text.

### Cards
- **Structure:** White background, 1px light border, 16px corner radius. 
- **Contextual Cue:** A 4px vertical "accent bar" on the left side of the card indicates the status or role (e.g., Azure for Student assignments, Navy for Teacher resources).

### Chips & Tags
- **Appearance:** Small, low-saturation backgrounds (e.g., 10% opacity of primary color) with high-saturation text. Used for status indicators like "Offline Sync Complete" or "Graded."

### Mode Switcher
- A prominent, accessible toggle or profile-level switch that clearly transitions the app's accent colors, providing immediate visual feedback on which "Bridge" (Teacher or Student) the user is currently crossing.
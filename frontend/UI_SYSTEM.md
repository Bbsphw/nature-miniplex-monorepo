# UI System & Design

The application uses a custom "Premium Dark Cinema" theme.

## 1. Tailwind CSS v4
We use the latest Tailwind v4 engine which relies on CSS Variables and `@theme` directives instead of a traditional `tailwind.config.ts`.
- Configuration is centralized in `src/app/globals.css`.
- **Design Tokens:**
  - `brand-red`: `#E31837` (Primary Accent)
  - `surface-base`: `#0A0A0F` (App Background)
  - `surface-elevated`: `#1C1C27` (Cards, Modals)
  - `surface-border`: `#2A2A3E` (Dividers, Borders)

## 2. Radix UI (shadcn/ui approach)
We use Radix UI primitives for accessible, unstyled UI components, and style them manually with Tailwind CSS.
- **Primitives:** Dialog, Select, Label, Slot.
- **Location:** `src/components/ui/`
- **Why?** Radix provides full WAI-ARIA accessibility (keyboard navigation, screen reader support) while letting us completely control the visual output (Glassmorphism, gradients).

## 3. Custom Utilities (`globals.css`)
We define custom utilities in `@layer utilities` for complex effects that are tedious to write inline:
- `.text-gradient-brand`: Text with a red-to-pink gradient.
- `.glass`: Blur backdrop filters with semi-transparent backgrounds.
- `.seat-available`, `.seat-selected`, `.seat-booked`: Interactive states for the Seat Grid buttons with hover effects and glowing shadows.

# Icon & Focal Frame Design System

When we use icons as focal points on screens, we use **two distinct UI elements** together.

---

## 1. Center Icon

- **Style:** Minimal **line icon**
- **Stroke:** White stroke
- **Fill:** No fill (outline only)
- **Weight:** Thin stroke weight
- **Look:** Clean, outline style
- **Asset:** Prefer SVG-based (or vector/outline icon sets like Ionicons outline), not raster images

Use this for the main focal content (e.g. camera, scan, drone, document icon) so it stays clear and readable on dark backgrounds.

---

## 2. Corner Frame Overlay

- **Shape:** Four separate **L-shaped corner markers**
- **Color:** Bright “wizards” theme accent (e.g. `ACCENT_BRACKET` / orange)
- **Border:** Not a full border — only the four corners
- **Position:** Absolutely positioned around the focal content
- **Effect:** Creates a “targeting” or “scanner” feel — tactical, drone, camera, or HUD-style UI

Implementation: use the **`FocalBrackets`** component (`app/src/components/ui/FocalBrackets.tsx`) to wrap the center icon (or focal view). It renders four inward-pointing L-shaped brackets; accent color and size are configurable.

---

## Summary

| Element           | Center icon              | Corner frame overlay        |
|------------------|---------------------------|-----------------------------|
| Role             | Main focal content        | Emphasis / targeting frame |
| Visual           | White, thin outline icon  | Bright accent L-corners     |
| Implementation   | Outline icon (e.g. Ionicons) | `FocalBrackets` component   |

Use this pairing for scanner, camera, drone, or tactical-style screens where a clear focal point and HUD-like frame are needed.

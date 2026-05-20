/**
 * Layout spacing constants for consistent padding and margins
 * Based on 4px grid system
 */
export const SPACING = {
  // Base spacing units
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  
  // Semantic spacing (info-dense screens)
  sectionGap: 10,        // Space between major sections
  sectionTitleBottom: 4, // Space below section titles
  cardPadding: 8,        // Padding inside cards
  containerPadding: 12,  // Horizontal padding for containers
  headerPadding: 8,      // Vertical padding for headers
  stackGap: 6,           // Vertical stacks (label → value)
  inlineGap: 4,          // Icon + label in buttons
  gridRowGap: 8,         // Card grid rows
  gridColumnGap: 6,      // Card grid columns
  screenBottom: 16,      // ScrollView content bottom inset

  // Compact UI (pills, inline stats, profile chrome)
  pillHeight: 18,
  pillPaddingH: 6,
  avatarProfile: 72,
} as const

/**
 * Typography sizes for consistent text hierarchy
 */
export const TYPOGRAPHY = {
  // Headings
  h1: 24,
  h2: 20,
  h3: 18,
  h4: 16,
  
  // Body text
  body: 14,
  bodySmall: 13,
  caption: 12,
  label: 11,
  
  // Line heights (relative to font size)
  lineHeightTight: 1.2,
  lineHeightNormal: 1.4,
  lineHeightRelaxed: 1.6,
} as const

/**
 * Border radius values
 */
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const

/** Listing tiles on dark screens — visible stroke around card */
export const LISTING_TILE_BORDER = 'rgba(255, 255, 255, 0.22)'

/** Solid white tile stroke (search tiles, store edit modal shell, etc.) */
export const TILE_BORDER_WHITE = '#FFFFFF'
export const TILE_BORDER_WIDTH = 1.5

/** Light grey stroke for fields inside a white-bordered modal */
export const MODAL_INNER_TILE_BORDER = 'rgba(255, 255, 255, 0.32)'

/** Extra horizontal inset for listing card grids (tile width stays full column) */
export const LISTING_GRID_EDGE_PAD = 4

/** Inner Pokémon/card art inset inside the black tile (not the tile box) */
export const LISTING_CARD_IMAGE_INSET_H = 6
export const LISTING_CARD_IMAGE_WIDTH = '90%'

/** Profile portfolio chart line / focal accent (green) */
export const PROFILE_CHART_ACCENT = '#73EC8B'

/** Profile “Add Card” CTA — green fill + visible stroke, light label for contrast */
export const BUTTON_ACCENT = {
  background: PROFILE_CHART_ACCENT,
  /** Outer stroke ring (solid so it shows on Android + light/dark backgrounds) */
  border: '#FFFFFF',
  borderWidth: 2,
  foreground: '#FFFFFF',
} as const

/**
 * Fixed colors for black listing/product tiles (do not follow light-theme text/button tokens).
 */
export const CARD_SURFACE = {
  background: '#000000',
  border: LISTING_TILE_BORDER,
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.88)',
  textMuted: 'rgba(255, 255, 255, 0.45)',
  price: '#FFFFFF',
  buttonFilledBg: '#FFFFFF',
  buttonFilledFg: '#000000',
  buttonOutlineBorder: 'rgba(255, 255, 255, 0.85)',
  buttonOutlineFg: '#FFFFFF',
} as const

/**
 * Store-specific colors for verification rings and badges
 */
export const STORE_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#BFDBFE', // Very light blue (Level 5) - slightly more blue
  diamond: '#87CEEB', // Light blue (Level 6)
  vaulted: '#10B981',      // Green for vaulted
  sellerHas: '#F59E0B',    // Yellow/Orange for seller has
  unverified: '#EF4444',   // Red for unverified
  vaultingInProcess: '#FFA500', // Orange for vaulting in process
} as const

/**
 * Verification ring thresholds (sales count)
 */
export const VERIFICATION_THRESHOLDS = {
  bronze: 1,
  silver: 6,
  gold: 16,
  platinum: 31,
  diamond: 50,
} as const

/**
 * Accent color for focal-point bracket frames (L-shaped corners around icons)
 */
export const ACCENT_BRACKET = '#FF8C42' as const

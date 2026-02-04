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
  
  // Semantic spacing
  sectionGap: 24,        // Space between major sections
  sectionTitleBottom: 12, // Space below section titles
  cardPadding: 16,       // Padding inside cards
  containerPadding: 16,   // Horizontal padding for containers
  headerPadding: 12,     // Vertical padding for headers
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

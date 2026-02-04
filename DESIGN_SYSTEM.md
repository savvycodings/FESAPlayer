# Design System Documentation

This document outlines the design system used throughout the SA Player app to maintain consistency in spacing, typography, and component usage.

## Table of Contents
- [Layout Constants](#layout-constants)
- [Section Component](#section-component)
- [Typography Guidelines](#typography-guidelines)
- [Spacing Guidelines](#spacing-guidelines)
- [Component Organization](#component-organization)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

---

## Layout Constants

All layout constants are defined in `app/src/constants/layout.ts`. **Always use these constants instead of hardcoded values.**

### Import
```typescript
import { SPACING, TYPOGRAPHY, RADIUS } from '../constants/layout'
```

### SPACING

Based on a 4px grid system for consistent spacing throughout the app.

```typescript
SPACING = {
  // Base spacing units
  xs: 4,      // Minimal spacing (rarely used)
  sm: 8,      // Small spacing
  md: 12,     // Medium spacing
  lg: 16,     // Standard spacing (most common)
  xl: 20,     // Large spacing
  '2xl': 24,  // Extra large spacing
  '3xl': 32,  // Very large spacing
  '4xl': 40,  // Maximum spacing
  
  // Semantic spacing (use these for specific purposes)
  sectionGap: 24,        // Space between major sections
  sectionTitleBottom: 12, // Space below section titles
  cardPadding: 16,       // Padding inside cards
  containerPadding: 16,   // Horizontal padding for containers
  headerPadding: 12,     // Vertical padding for headers
}
```

**When to use:**
- `SPACING.containerPadding` - For horizontal padding in ScrollView containers
- `SPACING.cardPadding` - For padding inside cards/components
- `SPACING.sectionGap` - For spacing between major sections (handled by Section component)
- `SPACING.lg` - For general spacing between elements
- `SPACING.md` - For tighter spacing (e.g., between grid items)

### TYPOGRAPHY

Consistent font sizes for text hierarchy.

```typescript
TYPOGRAPHY = {
  // Headings
  h1: 24,  // Main page titles (rarely used)
  h2: 20,  // Section titles (most common)
  h3: 18,  // Subsection titles
  h4: 16,  // Card titles
  
  // Body text
  body: 14,      // Standard body text
  bodySmall: 13, // Smaller body text
  caption: 12,   // Captions, labels
  label: 11,     // Very small labels
}
```

**When to use:**
- `TYPOGRAPHY.h2` - Section titles (used by Section component)
- `TYPOGRAPHY.h3` - Promo card titles, important text
- `TYPOGRAPHY.body` - Standard paragraph text
- `TYPOGRAPHY.bodySmall` - Secondary text, "See all" links
- `TYPOGRAPHY.caption` - Labels, badges, small text

### RADIUS

Consistent border radius values.

```typescript
RADIUS = {
  sm: 8,    // Small elements (buttons, small badges)
  md: 12,   // Medium elements
  lg: 16,   // Cards, containers (most common)
  xl: 20,   // Large cards
  full: 9999, // Pills, circular elements
}
```

**When to use:**
- `RADIUS.lg` - Cards, containers, main UI elements
- `RADIUS.md` - Buttons, smaller cards
- `RADIUS.full` - Pill-shaped buttons, badges, circular avatars

---

## Section Component

The `Section` component provides consistent section headers and spacing throughout the app.

### Import
```typescript
import { Section } from '../components/layout/Section'
```

### Basic Usage

```typescript
<Section title="Section Title">
  {/* Your content here */}
</Section>
```

### With "See all" Link

```typescript
<Section 
  title="Categories" 
  showSeeAll 
  onSeeAllPress={() => navigation.navigate('Search')}
>
  {/* Your content here */}
</Section>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | **required** | Section title text |
| `showSeeAll` | `boolean` | `false` | Show "See all" link on the right |
| `onSeeAllPress` | `() => void` | - | Callback when "See all" is pressed |
| `children` | `React.ReactNode` | **required** | Section content |
| `style` | `ViewStyle` | - | Additional styles for the container |

### What It Handles

- ✅ Consistent section title styling (`TYPOGRAPHY.h2`, 20px)
- ✅ Automatic spacing between sections (`SPACING.sectionGap`, 24px)
- ✅ Consistent "See all" link styling
- ✅ Proper header layout with title and optional "See all" link

### When to Use

**✅ DO use Section component for:**
- Any major content section (Users Profiles, Categories, Recent Listings, etc.)
- Sections that need a title
- Sections that should have consistent spacing

**❌ DON'T use Section component for:**
- Inline content without a title
- Content that's part of a larger component
- Headers that need custom styling

---

## Typography Guidelines

### Font Sizes

Always use `TYPOGRAPHY` constants for font sizes:

```typescript
// ✅ Good
fontSize: TYPOGRAPHY.body

// ❌ Bad
fontSize: 14
```

### Font Weights

Use consistent font weights:
- `'600'` (semi-bold) - For headings, important text
- `'400'` (regular) - For body text (default)
- Avoid `'700'` (bold) unless absolutely necessary

### Letter Spacing

- Headings: `-0.3` to `-0.2` (tighter)
- Body text: `0` to `0.1` (normal)
- Uppercase labels: `1.5` (wider)

---

## Spacing Guidelines

### Container Padding

```typescript
// ✅ Good - Use semantic constant
paddingHorizontal: SPACING.containerPadding

// ❌ Bad - Hardcoded value
paddingHorizontal: 16
```

### Section Spacing

```typescript
// ✅ Good - Use Section component (handles spacing automatically)
<Section title="My Section">
  <Content />
</Section>

// ❌ Bad - Manual spacing
<View style={{ marginTop: 24 }}>
  <Text>My Section</Text>
  <Content />
</View>
```

### Card Padding

```typescript
// ✅ Good
padding: SPACING.cardPadding

// ❌ Bad
padding: 16
```

---

## Usage Examples

### Example 1: Basic Section

```typescript
<Section title="Users Profiles">
  <Carousel
    items={usersProfilesItems}
    renderItem={(item) => <ProfileCard item={item} />}
    itemWidth={120}
    itemHeight={160}
    itemSpacing={12}
  />
</Section>
```

### Example 2: Section with "See all"

```typescript
<Section 
  title="Categories" 
  showSeeAll 
  onSeeAllPress={() => navigation.navigate('Search')}
>
  <View style={styles.categoriesContainer}>
    {categories.map(category => (
      <CategoryBadge key={category.id} category={category} />
    ))}
  </View>
</Section>
```

### Example 3: Card with Consistent Styling

```typescript
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.cardPadding,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.boldFont,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  cardText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: 'rgba(0, 0, 0, 0.8)',
  },
})
```

### Example 4: ScrollView Container

```typescript
const styles = StyleSheet.create({
  scrollContentContainer: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING['4xl'],
  },
})
```

---

## Best Practices

### ✅ DO

1. **Always import and use layout constants**
   ```typescript
   import { SPACING, TYPOGRAPHY, RADIUS } from '../constants/layout'
   ```

2. **Use Section component for major sections**
   ```typescript
   <Section title="My Section">...</Section>
   ```

3. **Use semantic spacing constants**
   ```typescript
   padding: SPACING.cardPadding
   marginTop: SPACING.sectionGap
   ```

4. **Keep spacing consistent**
   - Use the same spacing values for similar elements
   - Prefer semantic constants over base units when available

5. **Use TYPOGRAPHY constants for all font sizes**
   ```typescript
   fontSize: TYPOGRAPHY.body
   ```

### ❌ DON'T

1. **Don't hardcode spacing values**
   ```typescript
   // ❌ Bad
   padding: 16
   marginTop: 24
   
   // ✅ Good
   padding: SPACING.cardPadding
   marginTop: SPACING.sectionGap
   ```

2. **Don't create custom section headers**
   ```typescript
   // ❌ Bad
   <View style={styles.sectionHeader}>
     <Text style={styles.sectionTitle}>My Section</Text>
   </View>
   
   // ✅ Good
   <Section title="My Section">...</Section>
   ```

3. **Don't add extra margins to Carousel components**
   - The Section component handles spacing
   - Carousel should have `marginBottom: 0`

4. **Don't mix spacing systems**
   - Stick to the 4px grid system
   - Use constants, not arbitrary values

5. **Don't use font sizes outside TYPOGRAPHY constants**
   ```typescript
   // ❌ Bad
   fontSize: 15
   
   // ✅ Good
   fontSize: TYPOGRAPHY.body
   ```

---

## Migration Guide

If you're updating existing code to use the design system:

1. **Replace hardcoded spacing**
   ```typescript
   // Before
   padding: 16
   
   // After
   padding: SPACING.cardPadding
   ```

2. **Replace section headers with Section component**
   ```typescript
   // Before
   <Text style={styles.sectionTitle}>My Section</Text>
   <Content />
   
   // After
   <Section title="My Section">
     <Content />
   </Section>
   ```

3. **Update font sizes to use TYPOGRAPHY**
   ```typescript
   // Before
   fontSize: 20
   
   // After
   fontSize: TYPOGRAPHY.h2
   ```

4. **Update border radius to use RADIUS**
   ```typescript
   // Before
   borderRadius: 16
   
   // After
   borderRadius: RADIUS.lg
   ```

---

## Component Organization

### Feature-Based Component Folders

For complex screens with multiple nested components, create feature-specific folders under `components/` to keep the codebase organized and maintainable.

**Structure:**
```
app/src/
├── components/
│   ├── shop/              # Shop-specific components
│   │   ├── ShopHeader.tsx
│   │   ├── PromoCarousel.tsx
│   │   ├── UserProfilesCarousel.tsx
│   │   ├── CategoryBadges.tsx
│   │   ├── RecentListings.tsx
│   │   ├── VaultingSection.tsx
│   │   ├── BlogCarousel.tsx
│   │   └── index.ts       # Barrel export
│   ├── layout/
│   │   └── Section.tsx
│   └── ui/                # Shared UI components
└── screens/
    └── shop.tsx           # Clean, focused screen component
```

### When to Extract Components

**✅ DO extract components when:**
- A screen file exceeds ~200-300 lines
- You have nested JSX structures that are hard to read
- The same UI pattern is used multiple times
- A section has its own complex logic and styling
- You want to improve code maintainability

**Example:**
```typescript
// ❌ Before: 800+ lines, hard to read
export function Shop() {
  // ... 800 lines of nested components and styles
}

// ✅ After: Clean, focused screen
export function Shop() {
  return (
    <View>
      <ShopHeader userName={userName} />
      <PromoCarousel items={promoItems} />
      <Section title="Users Profiles">
        <UserProfilesCarousel items={usersProfilesItems} />
      </Section>
      {/* ... more sections */}
    </View>
  )
}
```

### Component Extraction Guidelines

1. **Create a feature folder** under `components/` (e.g., `components/shop/`)
2. **Extract logical sections** into separate component files
3. **Each component should:**
   - Be self-contained with its own styles
   - Use design system constants (`SPACING`, `TYPOGRAPHY`, `RADIUS`)
   - Accept props for data and callbacks
   - Be focused on a single responsibility
4. **Create an `index.ts`** barrel export for easy imports:
   ```typescript
   export { ShopHeader } from './ShopHeader'
   export { PromoCarousel } from './PromoCarousel'
   // ... etc
   ```
5. **Keep the screen file focused** on:
   - Data management (state, filtering, etc.)
   - Component composition
   - Minimal styling (only container-level styles)

### Benefits

- **Readability**: Screen files are much shorter and easier to understand
- **Maintainability**: Each component can be updated independently
- **Reusability**: Components can be reused in other screens if needed
- **Testability**: Easier to test individual components
- **Organization**: Clear structure makes it easy to find related code

### Example: Shop Screen Refactoring

**Before**: 828 lines with deeply nested components
**After**: 178 lines in `shop.tsx` + 7 focused component files

**Component Breakdown:**
- `ShopHeader`: 60 lines - Header with welcome and search
- `PromoCarousel`: 90 lines - Promotional cards carousel
- `UserProfilesCarousel`: 50 lines - User profiles display
- `CategoryBadges`: 70 lines - Category filter badges
- `RecentListings`: 100 lines - Listings grid
- `VaultingSection`: 90 lines - Vaulting service section
- `BlogCarousel`: 90 lines - Blog posts carousel

Each component is now:
- Easy to find (`components/shop/`)
- Easy to understand (single responsibility)
- Easy to modify (isolated changes)
- Uses design system constants consistently

---

## File Structure

```
app/src/
├── constants/
│   └── layout.ts          # SPACING, TYPOGRAPHY, RADIUS constants
├── components/
│   ├── shop/              # Feature-specific components
│   │   ├── ShopHeader.tsx
│   │   ├── PromoCarousel.tsx
│   │   ├── UserProfilesCarousel.tsx
│   │   ├── CategoryBadges.tsx
│   │   ├── RecentListings.tsx
│   │   ├── VaultingSection.tsx
│   │   ├── BlogCarousel.tsx
│   │   └── index.ts
│   ├── layout/
│   │   └── Section.tsx    # Section component
│   └── ui/                # Shared UI components
└── screens/
    └── shop.tsx           # Clean, focused screen component
```

---

## Questions?

If you're unsure about which constant or component to use:
1. Check this documentation
2. Look at `shop.tsx` for examples
3. Follow the "When to use" guidelines above
4. When in doubt, use the semantic constants (`SPACING.cardPadding` over `SPACING.lg`)

---

**Last Updated:** 2024
**Maintained by:** Development Team

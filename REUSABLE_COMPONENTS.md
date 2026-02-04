# Reusable Components Guide

## Overview

We've created reusable components following the same pattern as the Settings screen. These components use the theme system and eliminate code duplication.

## Available Reusable Components

### 1. **ThemedCard** (`app/src/components/ui/ThemedCard.tsx`)

Replaces duplicated card styling everywhere.

**Before (duplicated in every component):**
```typescript
card: {
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  borderRadius: RADIUS.md,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.08)',
  overflow: 'hidden',
}
```

**After (reusable component):**
```typescript
import { ThemedCard } from '../ui/ThemedCard'

<ThemedCard padding={SPACING.sm}>
  {/* Your content */}
</ThemedCard>
```

**Props:**
- `children` - Content inside the card
- `style?` - Additional styles
- `padding?` - Padding inside card (default: `SPACING.sm`)
- `variant?` - `'default'` | `'elevated'` | `'outlined'`

### 2. **ThemedButton** (`app/src/components/ui/ThemedButton.tsx`)

Replaces duplicated button styling everywhere.

**Before (duplicated):**
```typescript
buyButton: {
  backgroundColor: '#F59E0B',
  paddingVertical: SPACING.xs,
  paddingHorizontal: SPACING.sm,
  borderRadius: RADIUS.sm,
  alignItems: 'center',
}
```

**After (reusable component):**
```typescript
import { ThemedButton } from '../ui/ThemedButton'

<ThemedButton
  title="Buy Now"
  onPress={handleBuy}
  variant="primary"
  size="md"
/>
```

**Props:**
- `title` - Button text
- `onPress` - Press handler
- `variant?` - `'primary'` | `'secondary'` | `'outline'` | `'ghost'`
- `size?` - `'sm'` | `'md'` | `'lg'`
- `fullWidth?` - Make button full width
- `disabled?` - Disable button

### 3. **TitleContainer** (`app/src/components/layout/TitleContainer.tsx`)

Replaces duplicated title sections (like Settings screen).

**Before (duplicated):**
```typescript
<View style={styles.titleContainer}>
  <Text style={styles.mainText}>Section Title</Text>
</View>
```

**After (reusable component):**
```typescript
import { TitleContainer } from '../layout/TitleContainer'

<TitleContainer title="Section Title" />
```

**Props:**
- `title` - Title text
- `style?` - Additional styles

### 4. **ButtonContainer** (`app/src/components/layout/ButtonContainer.tsx`)

Groups buttons consistently (like Settings screen).

**Before:**
```typescript
<View style={styles.buttonContainer}>
  {/* buttons */}
</View>
```

**After (reusable component):**
```typescript
import { ButtonContainer } from '../layout/ButtonContainer'

<ButtonContainer gap={SPACING.sm}>
  <ThemedButton title="Button 1" onPress={...} />
  <ThemedButton title="Button 2" onPress={...} />
</ButtonContainer>
```

**Props:**
- `children` - Buttons inside
- `style?` - Additional styles
- `gap?` - Gap between buttons

## Migration Examples

### Example 1: Replace Card Styling

**Before:**
```typescript
<Card style={styles.card}>
  <CardContent style={styles.cardContent}>
    {/* content */}
  </CardContent>
</Card>

// In styles:
card: {
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  borderRadius: RADIUS.md,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.08)',
  overflow: 'hidden',
}
```

**After:**
```typescript
<ThemedCard padding={SPACING.sm}>
  {/* content */}
</ThemedCard>
```

### Example 2: Replace Button Styling

**Before:**
```typescript
<TouchableOpacity style={styles.buyButton} onPress={handleBuy}>
  <Text style={styles.buyButtonText}>Buy Now</Text>
</TouchableOpacity>

// In styles:
buyButton: {
  backgroundColor: '#F59E0B',
  paddingVertical: SPACING.xs,
  paddingHorizontal: SPACING.sm,
  borderRadius: RADIUS.sm,
  alignItems: 'center',
}
buyButtonText: {
  fontSize: TYPOGRAPHY.caption,
  fontFamily: theme.semiBoldFont,
  color: '#FFFFFF',
}
```

**After:**
```typescript
<ThemedButton
  title="Buy Now"
  onPress={handleBuy}
  variant="primary"
  size="sm"
/>
```

### Example 3: Replace Title Sections

**Before:**
```typescript
<View style={styles.titleContainer}>
  <Text style={styles.mainText}>Theme</Text>
</View>
```

**After:**
```typescript
<TitleContainer title="Theme" />
```

## Benefits

✅ **Less Code** - No more duplicated styles  
✅ **Consistency** - All cards/buttons look the same  
✅ **Theme Support** - Automatically uses theme colors  
✅ **Easy Updates** - Change one component, updates everywhere  
✅ **Maintainability** - Single source of truth  

## Where to Use

### Use ThemedCard for:
- Product cards
- Listing cards
- Info cards
- Any container that needs card styling

### Use ThemedButton for:
- Action buttons
- Primary/secondary buttons
- Any button that needs consistent styling

### Use TitleContainer for:
- Section titles
- Page headers
- Settings sections

### Use ButtonContainer for:
- Grouping multiple buttons
- Settings sections
- Action groups

## Current Duplication

These components currently duplicate card/button styles and should be migrated:

- `ListingCard.tsx` - Card styling
- `ProductGrid.tsx` - Card styling
- `OrderCard.tsx` - Card styling
- `BidModal.tsx` - Button styling
- `VerifiedStoreModal.tsx` - Button styling
- Many more...

## Next Steps

1. **Start using reusable components** in new code
2. **Gradually migrate** existing components
3. **Remove duplicated styles** as you migrate
4. **Update theme colors** in one place, affects all components

---

**Last Updated:** 2024  
**Maintained by:** Development Team

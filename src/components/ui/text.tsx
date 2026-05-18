import { cn } from '@/src/utils';
import * as Slot from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Platform, StyleSheet, Text as RNText, type Role, type TextStyle } from 'react-native';
import { STABLE_TEXT_PROPS } from '@/src/utils/layoutHelpers';
import { ThemeContext } from '@/src/context';

const textVariants = cva(
  cn(
    Platform.select({
      web: 'select-text text-foreground text-base',
      default: '',
    })
  ),
  {
    variants: {
      variant: {
        default: '',
        h1: cn(
          'text-center text-4xl font-extrabold tracking-tight',
          Platform.select({ web: 'scroll-m-20 text-balance' })
        ),
        h2: cn(
          'border-border border-b pb-2 text-3xl font-semibold tracking-tight',
          Platform.select({ web: 'scroll-m-20 first:mt-0' })
        ),
        h3: cn('text-2xl font-semibold tracking-tight', Platform.select({ web: 'scroll-m-20' })),
        h4: cn('text-xl font-semibold tracking-tight', Platform.select({ web: 'scroll-m-20' })),
        p: 'mt-3 leading-7 sm:mt-6',
        blockquote: 'mt-4 border-l-2 pl-3 italic sm:mt-6 sm:pl-6',
        code: cn(
          'bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold'
        ),
        lead: 'text-muted-foreground text-xl',
        large: 'text-lg font-semibold',
        small: 'text-sm font-medium leading-none',
        muted: 'text-muted-foreground text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

type TextVariantProps = VariantProps<typeof textVariants>;

type TextVariant = NonNullable<TextVariantProps['variant']>;

const ROLE: Partial<Record<TextVariant, Role>> = {
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  blockquote: Platform.select({ web: 'blockquote' as Role }),
  code: Platform.select({ web: 'code' as Role }),
};

const ARIA_LEVEL: Partial<Record<TextVariant, string>> = {
  h1: '1',
  h2: '2',
  h3: '3',
  h4: '4',
};

const TextClassContext = React.createContext<string | undefined>(undefined);

const DEFAULT_FONTS = {
  regular: 'GoogleSans_400Regular',
  medium: 'GoogleSans_500Medium',
  semiBold: 'GoogleSans_600SemiBold',
  bold: 'GoogleSans_700Bold',
} as const;

function flattenTextStyle(style: TextStyle | TextStyle[] | undefined): TextStyle {
  if (!style) return {};
  return StyleSheet.flatten(style) as TextStyle;
}

/** True when callers pass StyleSheet theme typography (shop header, sections, etc.) */
function hasCustomTypography(style: TextStyle | TextStyle[] | undefined): boolean {
  const flat = flattenTextStyle(style);
  return !!(
    flat.fontFamily ||
    flat.color !== undefined ||
    flat.fontSize !== undefined ||
    flat.fontWeight !== undefined ||
    flat.letterSpacing !== undefined ||
    flat.lineHeight !== undefined
  );
}

/** Custom font files include weight; fontWeight on Android forces system font. */
function resolveNativeTextStyle(style: TextStyle | TextStyle[] | undefined): TextStyle | TextStyle[] | undefined {
  if (!style) return style;
  if (Platform.OS === 'web') return style;
  const flat = flattenTextStyle(style);
  if (!flat.fontFamily) return style;
  if (flat.fontWeight == null) return style;
  if (Array.isArray(style)) {
    return [...style, { fontWeight: 'normal' as const }];
  }
  return [style, { fontWeight: 'normal' as const }];
}

function Text({
  className,
  style,
  asChild = false,
  variant = 'default',
  allowFontScaling = STABLE_TEXT_PROPS.allowFontScaling,
  maxFontSizeMultiplier = STABLE_TEXT_PROPS.maxFontSizeMultiplier,
  ...props
}: React.ComponentProps<typeof RNText> &
  TextVariantProps &
  React.RefAttributes<RNText> & {
    asChild?: boolean;
  }) {
  const { theme } = React.useContext(ThemeContext);
  const textClass = React.useContext(TextClassContext);
  const Component = asChild ? Slot.Text : RNText;
  const customTypography = hasCustomTypography(style);

  const themeDefaults: TextStyle = {
    color: theme?.textColor ?? '#FFFFFF',
    fontFamily: theme?.regularFont ?? DEFAULT_FONTS.regular,
    fontSize: 14,
  };

  const tailwindClasses = customTypography
    ? cn(textClass, className)
    : cn(textVariants({ variant }), textClass, className);

  const resolvedStyle = customTypography
    ? resolveNativeTextStyle(style)
    : [themeDefaults, style];

  // StyleSheet theme styles: skip NativeWind entirely so fontFamily/color are not overridden on Android.
  if (customTypography && !asChild) {
    return (
      <RNText
        style={resolvedStyle}
        allowFontScaling={allowFontScaling}
        maxFontSizeMultiplier={maxFontSizeMultiplier}
        {...props}
      />
    );
  }

  return (
    <Component
      className={tailwindClasses}
      style={resolvedStyle}
      role={variant ? ROLE[variant] : undefined}
      aria-level={variant ? ARIA_LEVEL[variant] : undefined}
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      {...props}
    />
  );
}

export { Text, TextClassContext };

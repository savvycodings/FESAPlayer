import { useContext, type ReactNode } from 'react'
import {
  View,
  StyleSheet,
  Image,
  useWindowDimensions,
  type ImageSourcePropType,
  type TextStyle,
} from 'react-native'
import { Text } from '../ui/text'
import { ThemedCard } from '../ui/themed/ThemedCard'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'
import {
  ONBOARDING_HORIZONTAL,
  ONBOARDING_SECTION_GAP,
} from './onboardingLayout'
import { useOnboardingLayout } from './OnboardingLayoutContext'

export { ONBOARDING_HORIZONTAL, ONBOARDING_SECTION_GAP } from './onboardingLayout'

type OnboardingSlideProps = {
  image: ImageSourcePropType
  title: ReactNode
  subtitle: string
  children?: ReactNode
}

export function useOnboardingAccentStyle(): TextStyle {
  const { theme } = useContext(ThemeContext)
  return { color: theme.tintColor || '#0281ff' }
}

export function OnboardingSlide({ image, title, subtitle, children }: OnboardingSlideProps) {
  const { theme } = useContext(ThemeContext)
  const { width, height } = useWindowDimensions()
  const { footerReservedHeight } = useOnboardingLayout()
  const compact = height < 720
  const bodyReserve = compact ? 320 : 360
  const maxHeroHeight = Math.max(140, height - footerReservedHeight - bodyReserve)
  const imageHeight = Math.min(
    Math.round(height * (compact ? 0.26 : 0.3)),
    maxHeroHeight,
  )
  const heroWidth = width - ONBOARDING_HORIZONTAL * 2
  const styles = getStyles(theme, compact)

  return (
    <View style={styles.root}>
      <View style={[styles.heroWrap, { width: heroWidth, height: imageHeight }]}>
        <View style={styles.hero}>
          <Image source={image} style={styles.heroImage} resizeMode="cover" />
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={compact ? 3 : 4}>
          {subtitle}
        </Text>
        {children ? <View style={styles.children}>{children}</View> : null}
      </View>
    </View>
  )
}

export function OnboardingBullet({ text }: { text: string }) {
  const { theme } = useContext(ThemeContext)
  const { height } = useWindowDimensions()
  const compact = height < 720
  const styles = bulletStyles(theme, compact)

  return (
    <ThemedCard variant="outlined" padding={SPACING.cardPadding} style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: theme.tintColor || '#0281ff' }]} />
        <Text style={styles.text} numberOfLines={2}>
          {text}
        </Text>
      </View>
    </ThemedCard>
  )
}

export function OnboardingGridItem({ title, description }: { title: string; description?: string }) {
  const { theme } = useContext(ThemeContext)
  const { width, height } = useWindowDimensions()
  const compact = height < 720
  const gap = SPACING.md
  const cardWidth = (width - ONBOARDING_HORIZONTAL * 2 - gap) / 2
  const styles = gridStyles(theme, compact, cardWidth)

  return (
    <ThemedCard variant="outlined" padding={SPACING.cardPadding} style={styles.card}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {description ? (
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      ) : null}
    </ThemedCard>
  )
}

export function OnboardingGrid({ children }: { children: ReactNode }) {
  return <View style={gridContainerStyles.container}>{children}</View>
}

const gridContainerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
})

const getStyles = (theme: any, compact: boolean) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    heroWrap: {
      alignSelf: 'center',
      marginTop: compact ? SPACING.md : SPACING.lg,
    },
    hero: {
      flex: 1,
      overflow: 'hidden',
      borderRadius: RADIUS.xl,
      backgroundColor: theme.cardBackground || '#111',
    },
    heroImage: {
      ...StyleSheet.absoluteFillObject,
      width: '100%',
      height: '100%',
    },
    body: {
      flex: 1,
      paddingHorizontal: ONBOARDING_HORIZONTAL,
      paddingTop: SPACING['2xl'],
      paddingBottom: SPACING.md,
      justifyContent: 'flex-start',
    },
    title: {
      fontSize: compact ? TYPOGRAPHY.h1 + 2 : TYPOGRAPHY.h1 + 6,
      fontFamily: theme.boldFont,
      color: theme.textColor,
      textAlign: 'center',
      letterSpacing: -0.5,
      marginBottom: ONBOARDING_SECTION_GAP,
    },
    subtitle: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor,
      textAlign: 'center',
      lineHeight: TYPOGRAPHY.body * TYPOGRAPHY.lineHeightRelaxed,
      marginBottom: ONBOARDING_SECTION_GAP,
    },
    children: {
      flex: 1,
      justifyContent: 'center',
      gap: SPACING.lg,
    },
  })

const bulletStyles = (theme: any, compact: boolean) =>
  StyleSheet.create({
    card: {
      marginBottom: 0,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: SPACING.md,
    },
    text: {
      flex: 1,
      fontSize: compact ? TYPOGRAPHY.body : TYPOGRAPHY.h4,
      fontFamily: theme.mediumFont,
      color: theme.textColor,
    },
  })

const gridStyles = (theme: any, compact: boolean, cardWidth: number) =>
  StyleSheet.create({
    card: {
      width: cardWidth,
      marginBottom: 0,
    },
    title: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.semiboldFont || theme.mediumFont,
      color: theme.textColor,
      marginBottom: 2,
    },
    description: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor,
    },
  })

import { View, StyleSheet, Image, Dimensions, ScrollView } from 'react-native'
import { Text } from '../../components/ui/text'
import { ThemeContext } from '../../context'
import { useContext } from 'react'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'
import { Card, CardContent } from '../../components/ui/card'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

interface OnboardingScreenProps {
  onNext: () => void
  onSkip: () => void
}

export function OnboardingScreen3({ onNext, onSkip }: OnboardingScreenProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <View style={styles.container}>
      {/* Image Card - Fills top with rounded bottom corners */}
      <Card style={styles.imageCard}>
        <CardContent style={styles.imageCardContent}>
          <View style={styles.imageContainer}>
            <Image
              source={require('../../../assets/onbordingimgs/onbording5.webp')}
              style={styles.topImage}
              resizeMode="cover"
            />
          </View>
        </CardContent>
      </Card>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>
          Track Your Collection <Text style={styles.titleGreen}>Value</Text>
        </Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Monitor the value of your entire trading card collection in real-time. See how your portfolio grows and track market trends
        </Text>
        
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Track portfolio value</Text>
          </View>
          <View style={[styles.statCard, styles.statCardMiddle]}>
            <Text style={styles.statLabel}>Track card price</Text>
          </View>
          <View style={[styles.statCard, styles.statCardLast]}>
            <Text style={styles.statLabel}>Monthly profit</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  scrollContent: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SCREEN_HEIGHT * 0.28 + SPACING.lg,
    paddingBottom: 200,
  },
  imageCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    shadowColor: '#73EC8B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  imageCardContent: {
    padding: 0,
  },
  imageContainer: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.28,
    overflow: 'hidden',
  },
  topImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: TYPOGRAPHY.h1 + 10,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.containerPadding,
  },
  titleGreen: {
    color: '#73EC8B',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.body + 2,
    fontFamily: theme.regularFont,
    color: theme.mutedForegroundColor,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.body * 1.6,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  statsContainer: {
    width: '100%',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-evenly',
    paddingTop: 0,
    paddingBottom: SPACING.xl,
  },
  statCard: {
    width: '100%',
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.xl,
    padding: SPACING['2xl'],
    paddingVertical: SPACING.xl + SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(115, 236, 139, 0.2)',
    shadowColor: '#73EC8B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: SPACING['2xl'],
  },
  statCardMiddle: {
    marginBottom: SPACING['2xl'],
  },
  statCardLast: {
    marginBottom: 0,
  },
  statValue: {
    fontSize: TYPOGRAPHY.h3,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.h4,
    fontFamily: theme.semiboldFont || theme.mediumFont,
    color: theme.textColor,
    textAlign: 'center',
    letterSpacing: 0.3,
    fontWeight: '600',
  },
})

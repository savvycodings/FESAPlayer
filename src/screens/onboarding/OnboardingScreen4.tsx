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

export function OnboardingScreen4({ onNext, onSkip }: OnboardingScreenProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <View style={styles.container}>
      {/* Image Card - Fills top with rounded bottom corners */}
      <Card style={styles.imageCard}>
        <CardContent style={styles.imageCardContent}>
          <View style={styles.imageContainer}>
            <Image
              source={require('../../../assets/onbordingimgs/onbording2.webp')}
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
          <Text style={styles.titleGreen}>Buy</Text>, Sell & Trade
        </Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Connect with collectors worldwide. List your cards for sale, make offers, and trade with confidence using our secure marketplace
        </Text>
        
        {/* Features */}
        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Your Store</Text>
            <Text style={styles.featureDescription}>Create your own storefront</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Secure Payments</Text>
            <Text style={styles.featureDescription}>Safe transactions guaranteed</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Verified Sellers</Text>
            <Text style={styles.featureDescription}>Trusted community members</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Easy Shipping</Text>
            <Text style={styles.featureDescription}>Track your orders</Text>
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
    marginBottom: SPACING['2xl'],
    paddingHorizontal: SPACING.lg,
  },
  featuresGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  featureCard: {
    width: (SCREEN_WIDTH - SPACING.containerPadding * 2 - SPACING.lg) / 2,
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.xl,
    padding: SPACING['2xl'],
    paddingVertical: SPACING.xl + SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: 'rgba(115, 236, 139, 0.2)',
    shadowColor: '#73EC8B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  featureTitle: {
    fontSize: TYPOGRAPHY.h4,
    fontFamily: theme.semiboldFont || theme.boldFont,
    color: theme.textColor,
    marginBottom: SPACING.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  featureDescription: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: theme.mutedForegroundColor,
    textAlign: 'center',
  },
})

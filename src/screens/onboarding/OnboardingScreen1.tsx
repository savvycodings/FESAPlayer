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

export function OnboardingScreen1({ onNext, onSkip }: OnboardingScreenProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <View style={styles.container}>
      {/* Image Card - Fills top half with rounded bottom corners */}
      <Card style={styles.imageCard}>
        <CardContent style={styles.imageCardContent}>
          <View style={styles.imageContainer}>
            <Image
              source={require('../../../assets/onbordingimgs/onbording1.jpg')}
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
          Welcome{'\n'}to <Text style={styles.titleGreen}>SAPLAYER</Text>
        </Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Your ultimate companion for{'\n'}trading cards, grading, and trading
        </Text>
        
        {/* Feature List */}
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>AI-Powered Card Recognition</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>Real-Time Market Prices</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>Buy, Sell & Trade Cards</Text>
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
    paddingBottom: 120,
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
    width: '120%',
    height: '120%',
    alignSelf: 'center',
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
  featureList: {
    width: '100%',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  featureItem: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    padding: SPACING['2xl'],
    paddingVertical: SPACING.xl + SPACING.md,
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    borderColor: 'rgba(115, 236, 139, 0.2)',
    shadowColor: '#73EC8B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  featureText: {
    fontSize: TYPOGRAPHY.h4,
    fontFamily: theme.semiboldFont || theme.mediumFont,
    color: theme.textColor,
    textAlign: 'center',
    letterSpacing: 0.3,
    fontWeight: '600',
  },
})

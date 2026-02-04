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

export function OnboardingScreen2({ onNext, onSkip }: OnboardingScreenProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <View style={styles.container}>
      {/* Image Card - Fills top with rounded bottom corners */}
      <Card style={styles.imageCard}>
        <CardContent style={styles.imageCardContent}>
          <View style={styles.imageContainer}>
            <Image
              source={require('../../../assets/onbordingimgs/onbording3.jpg')}
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
          Smart <Text style={styles.titleGreen}>Card</Text> Recognition
        </Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Simply take a photo of your trading card and our AI will instantly identify it, providing you with detailed information and current market value
        </Text>
        
        {/* Steps */}
        <View style={styles.stepContainer}>
          <View style={styles.step}>
            <Text style={styles.stepText}>Take a photo of your card</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepText}>AI identifies the card instantly</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepText}>Get pricing and condition analysis</Text>
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
  stepContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  step: {
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
  stepText: {
    fontSize: TYPOGRAPHY.h4,
    fontFamily: theme.semiboldFont || theme.mediumFont,
    color: theme.textColor,
    textAlign: 'center',
    letterSpacing: 0.3,
    fontWeight: '600',
  },
})

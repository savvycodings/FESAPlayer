import { View, StyleSheet, TouchableOpacity, Image, Dimensions, ScrollView } from 'react-native'
import { Text } from '../../components/ui/text'
import { ThemeContext } from '../../context'
import { useContext } from 'react'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'
import { Card, CardContent } from '../../components/ui/card'
import { LinearGradient } from 'expo-linear-gradient'
import Ionicons from '@expo/vector-icons/Ionicons'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// Helper function to get gradient colors based on theme
const getButtonGradientColors = (theme: any): string[] => {
  const tintColor = theme.tintColor || '#0281ff'
  if (tintColor === '#0281ff') {
    return ['#0281ff', '#0051a5']
  } else if (tintColor === '#F7B5CD') {
    return ['#F7B5CD', '#d89bb0']
  } else if (tintColor === '#73EC8B') {
    return ['#73EC8B', '#5bc973']
  } else {
    return [tintColor, tintColor]
  }
}

interface OnboardingScreenProps {
  onNext: () => void
  onSkip: () => void
}

export function OnboardingScreen5({ onNext, onSkip }: OnboardingScreenProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <View style={styles.container}>
      {/* Image Card - Fills top with rounded bottom corners */}
      <Card style={styles.imageCard}>
        <CardContent style={styles.imageCardContent}>
          <View style={styles.imageContainer}>
            <Image
              source={require('../../../assets/onbordingimgs/onbording6.jpeg')}
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
          You're All <Text style={styles.titleGreen}>Set</Text>!
        </Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Start your trading card collecting journey today. Join thousands of collectors already using SAplayer
        </Text>
        
        {/* Benefits */}
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitText}>Free to get started</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitText}>No credit card required</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitText}>Instant card recognition</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitText}>Real-time market prices</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.getStartedButton}
          onPress={onNext}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={getButtonGradientColors(theme)}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color={theme.tintTextColor || "#fff"} style={styles.buttonIcon} />
          </LinearGradient>
        </TouchableOpacity>
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
  benefitsList: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    marginBottom: SPACING['2xl'],
  },
  benefitItem: {
    width: (SCREEN_WIDTH - SPACING.containerPadding * 2 - SPACING.lg) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    padding: SPACING['2xl'],
    paddingVertical: SPACING.xl + SPACING.md,
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.xl,
    minHeight: 140,
    borderWidth: 2,
    borderColor: 'rgba(115, 236, 139, 0.2)',
    shadowColor: '#73EC8B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  benefitText: {
    fontSize: TYPOGRAPHY.h4,
    fontFamily: theme.semiboldFont || theme.mediumFont,
    color: theme.textColor,
    textAlign: 'center',
    letterSpacing: 0.3,
    fontWeight: '600',
  },
  getStartedButton: {
    width: '100%',
    marginTop: SPACING['2xl'],
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    paddingHorizontal: SPACING.lg,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING['2xl'],
  },
  getStartedText: {
    fontSize: TYPOGRAPHY.h4,
    fontFamily: theme.boldFont,
    color: '#fff',
    marginRight: SPACING.sm,
  },
  buttonIcon: {
    marginLeft: SPACING.xs,
  },
})

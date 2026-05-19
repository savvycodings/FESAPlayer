import { Text } from '../../components/ui/text'
import {
  OnboardingSlide,
  OnboardingBullet,
  useOnboardingAccentStyle,
} from '../../components/onboarding/OnboardingSlide'
import { ONBOARDING_IMAGES } from '../../constants/onboardingImages'

export function OnboardingScreen1() {
  const accentStyle = useOnboardingAccentStyle()

  return (
    <OnboardingSlide
      image={ONBOARDING_IMAGES.slide1}
      title={
        <>
          Welcome{'\n'}to <Text style={accentStyle}>SA Player</Text>
        </>
      }
      subtitle="Your companion for trading cards, grading, and buying and selling."
    >
      <OnboardingBullet text="AI-powered card recognition" />
      <OnboardingBullet text="Real-time market prices" />
      <OnboardingBullet text="Buy, sell and trade cards" />
    </OnboardingSlide>
  )
}

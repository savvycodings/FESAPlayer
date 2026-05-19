import { Text } from '../../components/ui/text'
import {
  OnboardingSlide,
  OnboardingBullet,
  useOnboardingAccentStyle,
} from '../../components/onboarding/OnboardingSlide'
import { ONBOARDING_IMAGES } from '../../constants/onboardingImages'

export function OnboardingScreen3() {
  const accentStyle = useOnboardingAccentStyle()

  return (
    <OnboardingSlide
      image={ONBOARDING_IMAGES.slide3}
      title={
        <>
          Track your collection <Text style={accentStyle}>value</Text>
        </>
      }
      subtitle="Monitor portfolio value and price trends in one place."
    >
      <OnboardingBullet text="Portfolio value over time" />
      <OnboardingBullet text="Per-card market prices" />
      <OnboardingBullet text="Profit and trend insights" />
    </OnboardingSlide>
  )
}

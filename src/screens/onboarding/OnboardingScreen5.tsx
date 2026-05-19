import { Text } from '../../components/ui/text'
import {
  OnboardingSlide,
  OnboardingBullet,
  useOnboardingAccentStyle,
} from '../../components/onboarding/OnboardingSlide'
import { ONBOARDING_IMAGES } from '../../constants/onboardingImages'

export function OnboardingScreen5() {
  const accentStyle = useOnboardingAccentStyle()

  return (
    <OnboardingSlide
      image={ONBOARDING_IMAGES.slide5}
      title={
        <>
          {"You're all "}
          <Text style={accentStyle}>set</Text>
        </>
      }
      subtitle="Join collectors using SA Player to manage and trade cards."
    >
      <OnboardingBullet text="Free to get started" />
      <OnboardingBullet text="No credit card required" />
      <OnboardingBullet text="Instant card recognition" />
    </OnboardingSlide>
  )
}

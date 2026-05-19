import { Text } from '../../components/ui/text'
import {
  OnboardingSlide,
  OnboardingBullet,
  useOnboardingAccentStyle,
} from '../../components/onboarding/OnboardingSlide'
import { ONBOARDING_IMAGES } from '../../constants/onboardingImages'

export function OnboardingScreen2() {
  const accentStyle = useOnboardingAccentStyle()

  return (
    <OnboardingSlide
      image={ONBOARDING_IMAGES.slide2}
      title={
        <>
          Smart <Text style={accentStyle}>card</Text> recognition
        </>
      }
      subtitle="Photograph a card and get identification, details, and market value."
    >
      <OnboardingBullet text="Take a photo of your card" />
      <OnboardingBullet text="AI identifies the card instantly" />
      <OnboardingBullet text="See pricing and condition insights" />
    </OnboardingSlide>
  )
}

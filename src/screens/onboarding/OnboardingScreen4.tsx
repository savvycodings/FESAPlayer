import { Text } from '../../components/ui/text'
import {
  OnboardingSlide,
  OnboardingGrid,
  OnboardingGridItem,
  useOnboardingAccentStyle,
} from '../../components/onboarding/OnboardingSlide'
import { ONBOARDING_IMAGES } from '../../constants/onboardingImages'

export function OnboardingScreen4() {
  const accentStyle = useOnboardingAccentStyle()

  return (
    <OnboardingSlide
      image={ONBOARDING_IMAGES.slide4}
      title={
        <>
          <Text style={accentStyle}>Buy</Text>, sell and trade
        </>
      }
      subtitle="List cards, connect with collectors, and trade with confidence."
    >
      <OnboardingGrid>
        <OnboardingGridItem title="Your store" description="Your storefront" />
        <OnboardingGridItem title="Secure payments" description="Safe checkout" />
        <OnboardingGridItem title="Verified sellers" description="Trusted members" />
        <OnboardingGridItem title="Easy shipping" description="Track orders" />
      </OnboardingGrid>
    </OnboardingSlide>
  )
}

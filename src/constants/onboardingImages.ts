import type { ImageSourcePropType } from 'react-native'

/**
 * Onboarding hero art — remote placeholders until files exist under assets/onbordingimgs/.
 * Replace each entry with require('../../../assets/onbordingimgs/onbordingN.jpg') when ready.
 */
export const ONBOARDING_IMAGES = {
  slide1: { uri: 'https://images.pokemontcg.io/swsh4/25_hires.png' },
  slide2: { uri: 'https://images.pokemontcg.io/sv3/215_hires.png' },
  slide3: { uri: 'https://images.pokemontcg.io/base1/4_hires.png' },
  slide4: { uri: 'https://images.pokemontcg.io/swsh12/186_hires.png' },
  slide5: { uri: 'https://images.pokemontcg.io/sv2/245_hires.png' },
} satisfies Record<string, ImageSourcePropType>

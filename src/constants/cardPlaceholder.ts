import type { ImageSourcePropType } from 'react-native'

/** Fallback when no card image URL is available (local singles asset is not in repo). */
export const CARD_PLACEHOLDER_IMAGE: ImageSourcePropType = {
  uri: 'https://images.pokemontcg.io/swsh4/25_hires.png',
}

/**
 * Card artwork from images.pokemontcg.io (no API — direct image URLs).
 * Used for profile/collection display. Store listings use Cloudinary (user photos of physical cards).
 */

import { setToSetCode } from './pokemonTcgSetCodes'

const POKEMON_TCG_IMAGE_BASE = 'https://images.pokemontcg.io'

/**
 * Build high-res card image URL from set (name, id, or code) + card number.
 * Resolves set name / Pokedata set_id to images.pokemontcg.io set code via hardcoded mapping.
 */
export function getPokemonTcgImageUrlFromSetNumber(
  set: string | number | null | undefined,
  number: string | null | undefined
): string | null {
  const setCode = setToSetCode(set)
  const n = number != null ? String(number).trim() : ''
  if (!setCode || !n) return null
  return `${POKEMON_TCG_IMAGE_BASE}/${encodeURIComponent(setCode)}/${encodeURIComponent(n)}_hires.png`
}

/**
 * Build high-res card image URL from Pokedata card ID only when ID is in "set-number" format.
 * Card IDs from Pokedata are often numeric (81678, 73121); for those use setId+number from API instead.
 */
export function getPokemonTcgImageUrl(cardId: string | null | undefined): string | null {
  if (!cardId || typeof cardId !== 'string') return null
  const trimmed = cardId.trim()
  if (!trimmed) return null
  const lastDash = trimmed.lastIndexOf('-')
  if (lastDash <= 0 || lastDash === trimmed.length - 1) return null
  const set = trimmed.slice(0, lastDash)
  const number = trimmed.slice(lastDash + 1)
  if (!set || !number) return null
  return `${POKEMON_TCG_IMAGE_BASE}/${encodeURIComponent(set)}/${encodeURIComponent(number)}_hires.png`
}

/**
 * Build small card image URL (for thumbnails if needed).
 */
export function getPokemonTcgImageUrlSmall(cardId: string | null | undefined): string | null {
  const hires = getPokemonTcgImageUrl(cardId)
  if (!hires) return null
  return hires.replace('_hires.png', '.png')
}

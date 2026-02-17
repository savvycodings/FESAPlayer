/**
 * Card artwork from images.pokemontcg.io (no API — direct image URLs).
 * Used for profile/collection display. Store listings use Cloudinary (user photos of physical cards).
 */

import { setToSetCode, SET_CODES_NOT_ON_CDN } from './pokemonTcgSetCodes'

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
 * Same as getPokemonTcgImageUrlFromSetNumber but returns null for set codes not on the CDN
 * (e.g. Ascended Heroes "asc") so we don't use a URL that 404s. Use server cardImageUrl for those.
 */
export function getPokemonTcgImageUrlFromSetNumberIfOnCdn(
  set: string | number | null | undefined,
  number: string | number | null | undefined
): string | null {
  const setCode = setToSetCode(set)
  if (setCode && SET_CODES_NOT_ON_CDN.has(setCode)) return null
  return getPokemonTcgImageUrlFromSetNumber(set, number)
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

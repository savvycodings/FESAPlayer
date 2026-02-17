/**
 * IMAGE SET CODES — where card image URLs come from
 *
 * Card artwork is loaded from: https://images.pokemontcg.io/{setId}/{number}_hires.png
 * The setId must match the official Pokémon TCG API set id: https://docs.pokemontcg.io/api-reference/sets/set-object
 *
 * Codes are kept in TWO places (keep in sync):
 *   • App:  app/src/utils/pokemonTcgSetCodes.ts   (this file)
 *   • Server: server/src/pokedata/setCodeMap.ts
 *
 * Optional: run `npx tsx server/scripts/fetch-pokemon-tcg-sets.ts` (with POKEMON_TCG_API_KEY if needed)
 * to fetch the official set list from the API. That writes pokemonTcgSets.json here; we use its nameToId first.
 */

let OFFICIAL_NAME_TO_ID: Record<string, string> = {}
try {
  const official = require('./pokemonTcgSets.json')
  if (official?.nameToId && typeof official.nameToId === 'object') {
    OFFICIAL_NAME_TO_ID = official.nameToId
  }
} catch {
  // No generated file; use static maps only
}

// Set name (as from Pokedata or user) -> images.pokemontcg.io set code (fallback when no pokemonTcgSets.json)
const SET_NAME_TO_CODE: Record<string, string> = {
  // Scarlet & Violet / Mega Evolution era
  'ascended heroes': 'asc',
  'mega evolution ascended heroes': 'asc',
  'mega evolution—ascended heroes': 'asc',
  'phantasmal flames': 'pfl',
  'mega evolution phantasmal flames': 'pfl',
  'mega evolution—phantasmal flames': 'pfl',
  'prismatic evolutions': 'sv8pt5',
  'surging sparks': 'sv8',
  'stellar crown': 'sv7',
  'twilight masquerade': 'sv6',
  'temporal forces': 'sv5',
  'paldean fates': 'sv4pt5',
  'paradox rift': 'sv4',
  'obsidian flames': 'sv3',
  'paldea evolved': 'sv2',
  'scarlet & violet': 'sv1',
  'scarlet and violet': 'sv1',
  '151': 'mew',
  'scarlet & violet—151': 'mew',

  // Sword & Shield era
  'crown zenith': 'swsh12pt5',
  'silver tempest': 'swsh12',
  'lost origin': 'swsh11',
  'pokémon go': 'swsh11pt5',
  'astral radiance': 'swsh10',
  'brilliant stars': 'swsh9',
  'fusion strike': 'swsh8',
  'celebrations': 'swsh7',
  'evolving skies': 'swsh7pt5',
  'chilling reign': 'swsh6',
  'battle styles': 'swsh5',
  'shining fates': 'swsh4',
  'vivid voltage': 'swsh3',
  'champion\'s path': 'swsh3pt5',
  'darkness ablaze': 'swsh2',
  'rebel clash': 'swsh2pt5',
  'sword & shield': 'swsh1',
  'sword and shield': 'swsh1',

  // Sun & Moon era (common)
  'cosmic eclipse': 'sm12',
  'hidden fates': 'sm11',
  'unified minds': 'sm10',
  'unbroken bonds': 'sm9',
  'team up': 'sm8',
  'lost thunder': 'sm7',
  'dragon majesty': 'sm6',
  'celestial storm': 'sm5',
  'forbidden light': 'sm4',
  'ultra prism': 'sm3',
  'crimson invasion': 'sm2',
  'shining legends': 'sm2pt5',
  'burning shadows': 'sm2pt6',
  'guardians rising': 'sm1pt5',
  'sun & moon': 'sm1',
  'sun and moon': 'sm1',
}

// Pokedata numeric set_id -> images.pokemontcg.io set code (when API doesn't return set_code)
const SET_ID_TO_CODE: Record<number, string> = {
  557: 'sv8pt5', // Prismatic Evolutions
  558: 'asc',    // Ascended Heroes (add/update if your Pokedata API uses a different id)
}

// Pokedata short set codes (e.g. "PRE") -> images.pokemontcg.io set code
const POKEDATA_SET_CODE_TO_TCG: Record<string, string> = {
  asc: 'asc',   // Ascended Heroes
  pfl: 'pfl',   // Phantasmal Flames
  pre: 'sv8pt5', // Prismatic Evolutions
}

/** Set codes that are not yet on images.pokemontcg.io (URL would 404). For these we use Pokedata API image or placeholder. See https://docs.pokemontcg.io/api-reference/sets — run server/scripts/fetch-pokemon-tcg-sets.ts to refresh from official API. */
export const SET_CODES_NOT_ON_CDN = new Set<string>(['asc', 'pfl'])

function normalizeKey(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ')
}

/**
 * Resolve set name or numeric set ID to the set code used by images.pokemontcg.io.
 * Returns the input if it already looks like a set code (lowercase letters + numbers, no spaces).
 */
export function setToSetCode(set: string | number | null | undefined): string | null {
  if (set == null || set === '') return null
  const str = String(set).trim()
  if (!str) return null

  const num = parseInt(str, 10)
  if (!Number.isNaN(num) && SET_ID_TO_CODE[num]) {
    return SET_ID_TO_CODE[num]
  }

  const key = normalizeKey(str)
  if (OFFICIAL_NAME_TO_ID[key]) return OFFICIAL_NAME_TO_ID[key]
  const byName = SET_NAME_TO_CODE[key]
  if (byName) return byName

  const pokedataCode = POKEDATA_SET_CODE_TO_TCG[str.toLowerCase()]
  if (pokedataCode) return pokedataCode

  // If it already looks like a set code (e.g. sv8pt5, swsh12), use as-is
  if (/^[a-z0-9]+$/i.test(str) && str.length <= 12) {
    return str.toLowerCase()
  }

  return null
}

/**
 * UI kit entry point.
 *
 * - `primitives/` — shadcn / NativeWind base (import by path, e.g. `ui/text` or `ui/primitives`)
 * - `themed/`     — SA Player themed wrappers
 * - `brand/`      — badges and focal accents
 *
 * Prefer direct imports (`../ui/text`, `../ui/themed/ThemedCard`) in hot paths to avoid
 * loading every primitive at startup.
 */
export * from './themed'
export * from './brand'
export { AppButton, type AppButtonProps, type AppButtonVariant, type AppButtonSize } from './AppButton'
export { ListingTile, type ListingTileProps } from './ListingTile'

/**
 * @deprecated Import `Pill` from `./Pill` instead. Kept for existing call sites.
 */
import { Pill, type PillProps, type PillPreset } from './Pill'

export type CompactPillVariant =
  | 'outline'
  | 'filled'
  | 'listed'
  | 'changePositive'
  | 'changeNegative'

const VARIANT_TO_PRESET: Record<CompactPillVariant, PillPreset> = {
  outline: 'outline',
  filled: 'filled',
  listed: 'listed',
  changePositive: 'positive',
  changeNegative: 'negative',
}

export interface CompactPillProps extends Omit<PillProps, 'preset'> {
  variant?: CompactPillVariant
}

export function CompactPill({ variant = 'outline', ...props }: CompactPillProps) {
  return <Pill preset={VARIANT_TO_PRESET[variant]} {...props} />
}

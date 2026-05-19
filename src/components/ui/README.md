# UI components

Layered structure — import from the barrel when you can:

```ts
import { ThemedCard, PrimaryGradientButton, TrustedBadge } from '@/src/components/ui'
import { Text } from '@/src/components/ui/text'
import { Card } from '@/src/components/ui/card'
```

## Layers

| Folder | Purpose | Examples |
|--------|---------|----------|
| `primitives/` | shadcn / NativeWind base building blocks | `Text`, `Button`, `Input`, `Card`, `Dialog` |
| `themed/` | SA Player theme + layout tokens | `ThemedCard`, `ThemedButton`, `PrimaryGradientButton` |
| `brand/` | Product badges and accents | `TrustedBadge`, `FocalBrackets` |

## Related

- `components/form/` — keyboard-aware forms (`FormScreen`, `ThemedTextField`)
- `components/layout/` — screen shells (`ScreenSafeArea`, `Section`)

Legacy paths like `@/src/components/ui/text` still work via thin re-exports at the `ui/` root.

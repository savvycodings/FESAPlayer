type ThemeWithTint = {
  tintColor?: string
}

export function getButtonGradientColors(theme: ThemeWithTint): [string, string] {
  const tintColor = theme.tintColor || '#0281ff'
  if (tintColor === '#0281ff') return ['#0281ff', '#0051a5']
  if (tintColor === '#F7B5CD') return ['#F7B5CD', '#d89bb0']
  if (tintColor === '#73EC8B') return ['#73EC8B', '#5bc973']
  return [tintColor, tintColor]
}

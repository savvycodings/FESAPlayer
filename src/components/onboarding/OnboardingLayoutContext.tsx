import { createContext, useContext, type ReactNode } from 'react'

type OnboardingLayoutContextValue = {
  /** Space reserved above the fixed footer (px). */
  footerReservedHeight: number
}

const OnboardingLayoutContext = createContext<OnboardingLayoutContextValue>({
  footerReservedHeight: 0,
})

export function OnboardingLayoutProvider({
  footerReservedHeight,
  children,
}: {
  footerReservedHeight: number
  children: ReactNode
}) {
  return (
    <OnboardingLayoutContext.Provider value={{ footerReservedHeight }}>
      {children}
    </OnboardingLayoutContext.Provider>
  )
}

export function useOnboardingLayout() {
  return useContext(OnboardingLayoutContext)
}

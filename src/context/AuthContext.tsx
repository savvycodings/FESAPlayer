import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { authClient } from '../lib/auth-client'

type AuthContextValue = {
  isAuthenticated: boolean
  hasSeenOnboarding: boolean
  isLoading: boolean
  checkAuth: () => Promise<void>
  logout: () => Promise<void>
  setAuthenticated: (value: boolean) => void
  setHasSeenOnboarding: (value: boolean) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasSeenOnboarding, setHasSeenOnboardingState] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      const [onboarding, authToken] = await Promise.all([
        AsyncStorage.getItem('hasSeenOnboarding'),
        AsyncStorage.getItem('authToken'),
      ])
      setHasSeenOnboardingState(onboarding === 'true')

      // Use Better Auth session as source of truth when possible
      const session = await authClient.getSession()
      const hasSession = !!(session?.data?.session)

      if (hasSession) {
        setIsAuthenticated(true)
        if (!authToken) await AsyncStorage.setItem('authToken', 'better-auth-session')
      } else {
        // No session: ensure we're logged out (handles logout, expired session, cleared cache)
        setIsAuthenticated(false)
        await AsyncStorage.removeItem('authToken')
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    console.log('[AuthContext] logout() called')
    setIsAuthenticated(false)
    console.log('[AuthContext] setIsAuthenticated(false) done')
    try {
      console.log('[AuthContext] removing authToken from AsyncStorage...')
      await AsyncStorage.removeItem('authToken')
      console.log('[AuthContext] authToken removed')
      console.log('[AuthContext] calling authClient.signOut()...')
      await authClient.signOut()
      console.log('[AuthContext] authClient.signOut() done')
    } catch (error) {
      console.error('[AuthContext] Error signing out:', error)
    }
    try {
      await AsyncStorage.removeItem('authToken')
    } catch (_) {}
    console.log('[AuthContext] logout() finished')
  }, [])

  const setAuthenticated = useCallback((value: boolean) => {
    setIsAuthenticated(value)
  }, [])

  const setHasSeenOnboarding = useCallback((value: boolean) => {
    setHasSeenOnboardingState(value)
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // When app is "authenticated", re-verify session on resume (catches cleared cache / expired session)
  useEffect(() => {
    if (!isAuthenticated) return
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state !== 'active') return
      authClient.getSession().then((session) => {
        if (!session?.data?.session) {
          setIsAuthenticated(false)
          AsyncStorage.removeItem('authToken').catch(() => {})
        }
      })
    })
    return () => sub.remove()
  }, [isAuthenticated])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        hasSeenOnboarding,
        isLoading,
        checkAuth,
        logout,
        setAuthenticated,
        setHasSeenOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

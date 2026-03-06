import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useEffect, useState } from 'react'
import { Onboarding, Login } from '../screens'
import { Main } from '../main'
import { View } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { authClient } from '../lib/auth-client'

const Stack = createNativeStackNavigator()

/** Verify session before showing Main. If no session, send to login so non-logged-in users never get stuck in the app. */
function MainWithAuthCheck() {
  const { setAuthenticated } = useAuth()
  const [sessionChecked, setSessionChecked] = useState(false)

  useEffect(() => {
    authClient.getSession().then((session) => {
      if (!session?.data?.session) {
        setAuthenticated(false)
        return
      }
      setSessionChecked(true)
    })
  }, [setAuthenticated])

  // Don't render Main until we've verified session; if no session we already called setAuthenticated(false) above
  if (!sessionChecked) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />
  }

  return <Main />
}

export function RootNavigator() {
  const { isAuthenticated, hasSeenOnboarding, isLoading } = useAuth()
  console.log('[RootNavigator] render', { isAuthenticated, hasSeenOnboarding, isLoading })

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />
  }

  // Not seen onboarding → show onboarding only
  if (!hasSeenOnboarding) {
    return (
      <Stack.Navigator key="onboarding" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={Onboarding} />
      </Stack.Navigator>
    )
  }

  // Not authenticated → show auth only (so logout always lands here)
  if (!isAuthenticated) {
    console.log('[RootNavigator] showing Auth (Login) stack')
    return (
      <Stack.Navigator key="auth" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={Login} />
      </Stack.Navigator>
    )
  }

  // Authenticated → show main app (with session check so stale cache redirects to login)
  return (
    <Stack.Navigator key="main" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainWithAuthCheck} />
    </Stack.Navigator>
  )
}

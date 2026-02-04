import { useState, useEffect, useCallback } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Onboarding, Login } from '../screens'
import { Main } from '../main'
import { View } from 'react-native'

const Stack = createNativeStackNavigator()

export function RootNavigator() {
  const [isLoading, setIsLoading] = useState(true)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const checkOnboardingAndAuth = useCallback(async () => {
    try {
      const [onboarding, authToken] = await Promise.all([
        AsyncStorage.getItem('hasSeenOnboarding'),
        AsyncStorage.getItem('authToken'),
      ])
      
      setHasSeenOnboarding(onboarding === 'true')
      setIsAuthenticated(!!authToken)
    } catch (error) {
      console.error('Error checking onboarding/auth:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkOnboardingAndAuth()
  }, [checkOnboardingAndAuth])

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} /> // Loading screen
  }

  // Determine initial route based on state
  const getInitialRoute = () => {
    if (!hasSeenOnboarding) return 'Onboarding'
    if (!isAuthenticated) return 'Auth'
    return 'Main'
  }

  return (
    <Stack.Navigator
      initialRouteName={getInitialRoute()}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Onboarding" component={Onboarding} />
      <Stack.Screen name="Auth" component={Login} />
      <Stack.Screen name="Main" component={Main} />
    </Stack.Navigator>
  )
}

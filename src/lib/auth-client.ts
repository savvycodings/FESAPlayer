import { createAuthClient } from "better-auth/react"
import { expoClient } from "@better-auth/expo/client"
import * as SecureStore from "expo-secure-store"
import { Platform } from 'react-native'
import Constants from 'expo-constants'

// Get backend URL - same pattern as PayFastPayment and DOMAIN
const getBackendUrl = () => {
  // Check EXPO_PUBLIC_BACKEND_URL first (can be ngrok URL)
  if (process.env.EXPO_PUBLIC_BACKEND_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_URL
  }
  
  // Check Better Auth specific env var
  if (process.env.EXPO_PUBLIC_BETTER_AUTH_URL) {
    return process.env.EXPO_PUBLIC_BETTER_AUTH_URL
  }
  
  // For web, use localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:3050'
  }
  
  // For mobile, use IP from app.json (same as PayFastPayment)
  try {
    const devIp = Constants.expoConfig?.extra?.backendIp || '192.168.1.9'
    return `http://${devIp}:3050`
  } catch (error) {
    console.warn('Could not get backend IP from Constants, using default:', error)
    return 'http://192.168.1.9:3050'
  }
}

export const authClient = createAuthClient({
  baseURL: getBackendUrl(),
  fetchOptions: {
    // Add ngrok bypass header to skip warning page
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
  },
  plugins: [
    expoClient({
      scheme: "saplayer",  // From app.json
      storagePrefix: "saplayer",
      storage: SecureStore,
    })
  ],
})

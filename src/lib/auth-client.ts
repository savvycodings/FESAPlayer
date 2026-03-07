import { createAuthClient } from "better-auth/react"
import { expoClient } from "@better-auth/expo/client"
import * as SecureStore from "expo-secure-store"
import Constants from 'expo-constants'

// Get backend URL - Prefer env vars, then Constants/backendIp, then localhost. No platform-specific branch.
const getBackendUrl = () => {
  const devUrl = process.env.EXPO_PUBLIC_DEV_API_URL?.replace(/\/$/, '')
  const prodUrl = (process.env.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BETTER_AUTH_URL)?.replace(/\/$/, '')
  if (process.env.EXPO_PUBLIC_ENV === 'DEVELOPMENT' && devUrl) return devUrl
  if (prodUrl) return prodUrl
  if (devUrl) return devUrl
  try {
    const devIp = Constants.expoConfig?.extra?.backendIp || '192.168.1.9'
    return `http://${devIp}:3050`
  } catch (error) {
    console.warn('Could not get backend IP from Constants, using default:', error)
    return 'http://localhost:3050'
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

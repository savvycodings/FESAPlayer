import { createAuthClient } from "better-auth/react"
import { expoClient } from "@better-auth/expo/client"
import * as SecureStore from "expo-secure-store"
import { getApiBaseUrl } from '../utils/apiBaseUrl'

export const authClient = createAuthClient({
  baseURL: getApiBaseUrl(),
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

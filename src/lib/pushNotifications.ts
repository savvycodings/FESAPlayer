import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { DOMAIN } from '../../constants'
import { authClient } from './auth-client'

/**
 * Request notification permission, get Expo push token, and send it to the backend.
 * Call when the user is logged in (e.g. after auth). On web/simulator we skip.
 */
export async function registerPushTokenAndSaveToBackend(): Promise<boolean> {
  if (Platform.OS === 'web') return false
  if (!Device.isDevice) return false

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    if (finalStatus !== 'granted') return false

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined
    const tokenResult = await Notifications.getExpoPushTokenAsync({
      projectId: projectId ?? undefined,
    })
    const token = tokenResult?.data
    if (!token) return false

    const session = await authClient.getSession()
    if (!session?.data?.session?.token) return false

    const baseUrl = DOMAIN?.replace(/\/$/, '') || ''
    if (!baseUrl) return false

    const res = await fetch(`${baseUrl}/api/profile/push-token`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.data.session.token}`,
      },
      body: JSON.stringify({ expoPushToken: token }),
    })
    if (!res.ok) {
      console.warn('[Push] Failed to save token:', res.status)
      return false
    }
    return true
  } catch (e) {
    console.warn('[Push] Register error:', e)
    return false
  }
}

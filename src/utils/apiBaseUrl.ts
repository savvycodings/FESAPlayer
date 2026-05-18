import { Platform } from 'react-native'
import Constants from 'expo-constants'

/** Metro / Expo Go host (e.g. 192.168.68.86 from debuggerHost) — same machine as the dev server. */
function getLanHostFromExpo(): string | null {
  const expoGo = Constants.expoGoConfig as { debuggerHost?: string } | undefined
  const debuggerHost =
    expoGo?.debuggerHost ??
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost ??
    Constants.expoConfig?.hostUri
  if (!debuggerHost) return null
  const host = String(debuggerHost).split(':')[0]
  if (!host || host === 'localhost' || host === '127.0.0.1') return null
  return host
}

/** On device/emulator, localhost in env points at the phone — swap for the dev machine LAN IP. */
function rewriteLocalhostForNative(url: string): string {
  if (Platform.OS === 'web') return url
  if (!/localhost|127\.0\.0\.1/i.test(url)) return url

  const lan = getLanHostFromExpo()
  const backendIp = Constants.expoConfig?.extra?.backendIp as string | undefined
  const host = lan || backendIp
  if (!host) return url

  try {
    const parsed = new URL(url.includes('://') ? url : `http://${url}`)
    parsed.hostname = host
    return parsed.origin.replace(/\/$/, '')
  } catch {
    const portMatch = url.match(/:(\d+)/)
    const port = portMatch?.[1] ?? '3050'
    return `http://${host}:${port}`
  }
}

/**
 * Base URL for API calls (store, PUDO lockers, profile, etc.).
 * Web dev: localhost. Native dev: LAN IP from Expo so the phone can reach your PC on :3050.
 */
export function getApiBaseUrl(): string {
  const devUrl = process.env.EXPO_PUBLIC_DEV_API_URL?.replace(/\/$/, '')
  const prodUrl =
    process.env.EXPO_PUBLIC_BACKEND_URL?.replace(/\/$/, '') ||
    process.env.EXPO_PUBLIC_PROD_API_URL?.replace(/\/$/, '')

  if (process.env.EXPO_PUBLIC_ENV === 'DEVELOPMENT' && devUrl) {
    return rewriteLocalhostForNative(devUrl)
  }
  if (prodUrl) return prodUrl
  if (Platform.OS === 'web' && devUrl) return devUrl

  const lan = getLanHostFromExpo()
  const backendIp = Constants.expoConfig?.extra?.backendIp as string | undefined
  const host = lan || backendIp || '192.168.1.9'
  return `http://${host}:3050`
}

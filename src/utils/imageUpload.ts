import { DOMAIN } from '../../constants'
import * as FileSystem from 'expo-file-system/legacy'
import { authClient } from '../lib/auth-client'

/**
 * Upload an image to Cloudinary via the server
 * @param imageUri - Local file URI from ImagePicker (e.g., "file:///..." or "blob:...")
 * @param folder - Optional folder name in Cloudinary (default: 'gradeit')
 * @returns The secure URL of the uploaded image
 */
// Helper to convert ArrayBuffer to base64 (React Native compatible)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  // Use Buffer if available (Node.js/Expo), otherwise use manual conversion
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(binary, 'binary').toString('base64')
  }
  // Fallback for environments without Buffer
  // This is a simple base64 encoder (not as efficient but works)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  let i = 0
  while (i < binary.length) {
    const a = binary.charCodeAt(i++)
    const b = i < binary.length ? binary.charCodeAt(i++) : 0
    const c = i < binary.length ? binary.charCodeAt(i++) : 0
    
    const bitmap = (a << 16) | (b << 8) | c
    
    result += chars.charAt((bitmap >> 18) & 63)
    result += chars.charAt((bitmap >> 12) & 63)
    result += i - 2 < binary.length ? chars.charAt((bitmap >> 6) & 63) : '='
    result += i - 1 < binary.length ? chars.charAt(bitmap & 63) : '='
  }
  return result
}

export async function uploadImage(imageUri: string, folder?: string): Promise<string> {
  try {
    let base64: string

    // Handle blob URLs - fetch and convert to base64
    if (imageUri.startsWith('blob:')) {
      try {
        const response = await fetch(imageUri)
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.statusText}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        base64 = arrayBufferToBase64(arrayBuffer)
      } catch (error: any) {
        console.error('Blob URL conversion error:', error)
        throw new Error(`Failed to process image: ${error.message || 'Unknown error'}`)
      }
    } else {
      // Handle file:// URLs - use FileSystem directly (React Native)
      try {
        // Use FileSystem.readAsStringAsync with Base64 encoding
        // Try with EncodingType enum first (if available)
        const EncodingType = (FileSystem as any).EncodingType
        if (EncodingType && EncodingType.Base64) {
          base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: EncodingType.Base64,
          })
        } else {
          // Fallback: use string 'base64' directly (works in some Expo versions)
          base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: 'base64' as any,
          })
        }
      } catch (error: any) {
        console.error('File read error:', error)
        // For web environments, try FileReader as fallback
        if (typeof FileReader !== 'undefined') {
          try {
            const response = await fetch(imageUri)
            if (!response.ok) {
              throw new Error(`Failed to fetch file: ${response.statusText}`)
            }
            const blob = await response.blob()
            base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onloadend = () => {
                const result = reader.result as string
                const base64Data = result.includes(',') ? result.split(',')[1] : result
                resolve(base64Data)
              }
              reader.onerror = reject
              reader.readAsDataURL(blob)
            })
          } catch (fallbackError: any) {
            throw new Error(`Failed to read image file: ${fallbackError.message || error.message || 'Unknown error'}`)
          }
        } else {
          throw new Error(`Failed to read image file: ${error.message || 'Unknown error'}`)
        }
      }
    }

    // Get session from Better Auth
    const session = await authClient.getSession()
    if (!session?.data?.session) {
      throw new Error('Not authenticated')
    }

    // Get session token for API calls
    const sessionToken = session.data.session.token

    const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
    
    console.log(`Uploading image to ${baseUrl}/images/upload-base64 (base64 length: ${base64.length})`)
    
    // Upload to server
    const response = await fetch(`${baseUrl}/images/upload-base64`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`, // Use Better Auth session token
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for web
      body: JSON.stringify({
        image: base64,
        folder: folder || 'gradeit',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Upload failed:', {
        status: response.status,
        statusText: response.statusText,
        data,
      })
      throw new Error(data.message || data.error || `Upload failed: ${response.statusText}`)
    }

    if (!data.success) {
      throw new Error(data.message || 'Upload failed')
    }

    return data.secureUrl || data.url
  } catch (error: any) {
    console.error('Image upload error:', {
      message: error.message,
      stack: error.stack,
      imageUri: imageUri.substring(0, 50) + '...',
    })
    throw new Error(error.message || 'Failed to upload image')
  }
}

/**
 * Check if a URL is already a Cloudinary URL (or any external URL)
 * @param url - URL to check
 * @returns true if it's already an external URL (excludes blob URLs and file URIs which are temporary/local)
 */
export function isExternalUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }
  
  // Blob URLs are temporary and need to be uploaded to Cloudinary
  if (url.startsWith('blob:')) {
    return false
  }
  
  // File URIs (file://) are local and MUST be uploaded to Cloudinary
  if (url.startsWith('file://')) {
    return false
  }
  
  // Only consider HTTP/HTTPS URLs as external (permanent, already uploaded)
  // This includes Cloudinary URLs (res.cloudinary.com) and any other external URLs
  return url.startsWith('http://') || url.startsWith('https://')
}

/**
 * Ensure an image URL is a Cloudinary/external URL
 * If it's a local file or blob, upload it to Cloudinary first
 * @param imageUri - Image URI (can be file://, blob:, or https://)
 * @param folder - Cloudinary folder (default: 'gradeit')
 * @returns Promise<string> - Always returns a Cloudinary/external URL
 */
export async function ensureCloudinaryUrl(imageUri: string, folder?: string): Promise<string> {
  // If already external (Cloudinary or other CDN), return as-is
  if (isExternalUrl(imageUri)) {
    return imageUri
  }
  
  // Otherwise, upload to Cloudinary
  return await uploadImage(imageUri, folder)
}

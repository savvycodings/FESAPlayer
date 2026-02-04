import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { AnthropicIcon } from './src/components/AnthropicIcon'
import { CohereIcon } from './src/components/CohereIcon'
import { OpenAIIcon } from './src/components/OpenAIIcon'
import { MistralIcon } from './src/components/MistralIcon'
import { GeminiIcon } from './src/components/GeminiIcon'

// Backend API URL - Same pattern as PayFastPayment and Better Auth client
// Production/TestFlight: use EXPO_PUBLIC_BACKEND_URL (Railway). Never use local IP in production.
const getDomain = () => {
  // 1) Explicit production URL (Railway) - no local network
  const backend = process.env.EXPO_PUBLIC_BACKEND_URL
  if (backend && (backend.startsWith('https://') || backend.startsWith('http://'))) {
    return backend.replace(/\/$/, '')
  }
  // 2) Production env with prod API URL
  if (process.env.EXPO_PUBLIC_ENV === 'PRODUCTION' && process.env.EXPO_PUBLIC_PROD_API_URL) {
    return process.env.EXPO_PUBLIC_PROD_API_URL.replace(/\/$/, '')
  }
  // 3) Web dev: localhost
  if (Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_DEV_API_URL || 'http://localhost:3050'
  }
  // 4) Mobile dev only: local IP (triggers local network prompt - not used in TestFlight when 1 is set)
  try {
    const devIp = Constants.expoConfig?.extra?.backendIp || '192.168.1.9'
    return `http://${devIp}:3050`
  } catch (error) {
    console.warn('Could not get backend IP from Constants, using default:', error)
    return 'http://192.168.1.9:3050'
  }
}

export const DOMAIN = getDomain()

export const MODELS = {
  gpt: { name: 'GPT 4', label: 'gpt', icon: OpenAIIcon },
  gptTurbo: { name: 'GPT Turbo', label: 'gptTurbo', icon: OpenAIIcon },
  claude: { name: 'Claude', label: 'claude', icon: AnthropicIcon },
  claudeInstant: { name: 'Claude Instant', label: 'claudeInstant', icon: AnthropicIcon },
  cohere: { name: 'Cohere', label: 'cohere', icon: CohereIcon },
  cohereWeb: { name: 'Cohere Web', label: 'cohereWeb', icon: CohereIcon },
  mistral: { name: 'Mistral', label: 'mistral', icon: MistralIcon },
  gemini: { name: 'Gemini', label: 'gemini', icon: GeminiIcon },
}

export const IMAGE_MODELS = {
  fastImage: { name: 'Fast Image (LCM)', label: 'fastImage' },
  stableDiffusionXL: { name: 'Stable Diffusion XL', label: 'stableDiffusionXL' },
  removeBg:  { name: 'Remove Background', label: 'removeBg' },
  upscale: { name: 'Upscale', label: 'upscale' },
  illusionDiffusion: { name: 'Illusion Diffusion', label: 'illusionDiffusion' },
}

export const ILLUSION_DIFFUSION_IMAGES = {
  tinyCheckers: {
    label: 'tinyCheckers',
    image: 'https://storage.googleapis.com/falserverless/illusion-examples/ultra_checkers.png',
  },
  smallSquares: {
    label: "smallSquares",
    image: 'https://storage.googleapis.com/falserverless/illusion-examples/checkers_mid.jpg'
  },
  mediumSquares: {
    label: "mediumSquares",
    image: 'https://storage.googleapis.com/falserverless/illusion-examples/pattern.png',
  },
  largeSquares: {
    label: 'largeSquares',
    image: 'https://storage.googleapis.com/falserverless/illusion-examples/checkers.png',
  },
  funky: {
    label: 'funky',
    image:  'https://storage.googleapis.com/falserverless/illusion-examples/funky.jpeg',
  },
  stairs: {
    label: 'stairs',
    image: 'https://storage.googleapis.com/falserverless/illusion-examples/cubes.jpeg',
  },
  turkeyFlag: {
    label: 'turkeyFlag',
    image: 'https://storage.googleapis.com/falserverless/illusion-examples/turkey-flag.png'
  },
  indiaFlag: {
    label: 'indiaFlag',
    image: 'https://storage.googleapis.com/falserverless/illusion-examples/india-flag.png'
  },
  usaFlag: {
    label: 'usaFlag',
    image: 'https://storage.googleapis.com/falserverless/illusion-examples/usa-flag.png'
  }
}
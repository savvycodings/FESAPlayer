import { useState, useContext } from 'react'
import { View, StyleSheet, TextInput, TouchableOpacity, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native'
import { Text } from '../../components/ui/text'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'
import { LinearGradient } from 'expo-linear-gradient'
import Ionicons from '@expo/vector-icons/Ionicons'
import { authClient } from '../../lib/auth-client'
import { useAuth } from '../../context/AuthContext'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DOMAIN } from '../../../constants'

const isWeb = Platform.OS === 'web'
function showAlert(title: string, message?: string) {
  if (isWeb && typeof window !== 'undefined') {
    window.alert(message ? `${title}\n\n${message}` : title)
    return
  }
  Alert.alert(title, message ?? undefined)
}

// Helper function to get gradient colors based on theme
const getButtonGradientColors = (theme: any): string[] => {
  const tintColor = theme.tintColor || '#0281ff'
  // Create a darker version for the gradient
  if (tintColor === '#0281ff') {
    return ['#0281ff', '#0051a5']
  } else if (tintColor === '#F7B5CD') {
    return ['#F7B5CD', '#d89bb0']
  } else if (tintColor === '#73EC8B') {
    return ['#73EC8B', '#5bc973']
  } else {
    return [tintColor, tintColor]
  }
}

export function Login() {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const { setAuthenticated, setHasSeenOnboarding } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [pudoAddress, setPudoAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const handleAuth = async () => {
    if (!email || !password) {
      showAlert('Error', 'Please fill in all fields')
      return
    }

    if (isSignUp) {
      if (!name.trim()) {
        showAlert('Error', 'Please enter your name')
        return
      }
      if (!phone.trim()) {
        showAlert('Error', 'Please enter your phone number')
        return
      }
      if (!pudoAddress.trim()) {
        showAlert('Error', 'Please enter your PUDO address')
        return
      }
      // On web, Alert.alert() with multiple buttons is not supported — use confirm so sign up works
      const pudoMessage = 'Did you enter your PUDO address (parcel drop-off location), not your home address? Packages will be sent to this address.'
      if (isWeb && typeof window !== 'undefined') {
        if (window.confirm(pudoMessage)) {
          doSignUp()
        }
        return
      }
      Alert.alert(
        'Confirm PUDO address',
        pudoMessage,
        [
          { text: 'Back', style: 'cancel', onPress: () => {} },
          { text: 'Continue', onPress: () => doSignUp() },
        ]
      )
      return
    }

    setLoading(true)
    setAuthError(null)
    try {
      const result = await Promise.race([
        authClient.signIn.email({ email, password }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out. Please check that your backend is running and try again.')), 15000)
        ),
      ]) as any
      if (result?.error) {
        const message = result.error.message || 'Sign in failed'
        setAuthError(message)
        showAlert('Error', message)
        return
      }
      await finishAuth(isSignUp, result)
    } catch (error: any) {
      const message = error?.message || 'Something went wrong. Please check your internet connection and that the backend is reachable.'
      setAuthError(message)
      showAlert('Error', message)
    } finally {
      setLoading(false)
    }
  }

  const doSignUp = async () => {
    setLoading(true)
    setAuthError(null)
    try {
      const result = await Promise.race([
        authClient.signUp.email({ email, password, name }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out. Please check that your backend is running and try again.')), 15000)
        ),
      ]) as any
      if (result?.error) {
        const message = result.error.message || 'Sign up failed'
        setAuthError(message)
        showAlert('Error', message)
        return
      }
      await finishAuth(true, result)
    } catch (error: any) {
      const message = error?.message || 'Something went wrong. Please check your internet connection and that the backend is reachable.'
      setAuthError(message)
      showAlert('Error', message)
    } finally {
      setLoading(false)
    }
  }

  const finishAuth = async (wasSignUp: boolean, result: any) => {
    if (wasSignUp && (phone.trim() || pudoAddress.trim())) {
      try {
        const session = await authClient.getSession()
        const token = session?.data?.session?.token
        if (token) {
          const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
          await fetch(`${baseUrl}/api/profile/user`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              phone: phone.trim() || undefined,
              pudoAddress: pudoAddress.trim() || undefined,
            }),
          })
        }
      } catch (e) {
        console.warn('Failed to save phone / Pudo address:', e)
      }
    }
    try {
      await AsyncStorage.setItem('authToken', 'better-auth-session')
      await AsyncStorage.setItem('hasSeenOnboarding', 'true')
      setHasSeenOnboarding(true)
      setAuthenticated(true)
    } catch (storageError) {
      console.warn('Failed to persist auth state:', storageError)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.headerTextBlock}>
                <Text style={styles.headerEyebrow}>
                  {isSignUp ? 'Create account' : 'Sign in'}
                </Text>
                <Text style={styles.title}>
                  {isSignUp ? 'Welcome to SA Player' : 'Welcome Back'}
                </Text>
              </View>
              <Text style={styles.subtitle}>
                {isSignUp
                  ? 'Create your profile, track your portfolio and list cards to sell.'
                  : 'Sign in to manage your collection, portfolio and store.'}
              </Text>
            </View>

            <View style={styles.form}>
              {isSignUp && (
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color={theme.mutedForegroundColor} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor={theme.mutedForegroundColor}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoComplete="name"
                  />
                </View>
              )}

              {isSignUp && (
                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={20} color={theme.mutedForegroundColor} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone number"
                    placeholderTextColor={theme.mutedForegroundColor}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                  />
                </View>
              )}

              {isSignUp && (
                <View style={styles.inputContainer}>
                  <Ionicons name="location-outline" size={20} color={theme.mutedForegroundColor} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="PUDO address (parcel drop-off, not home)"
                    placeholderTextColor={theme.mutedForegroundColor}
                    value={pudoAddress}
                    onChangeText={setPudoAddress}
                    autoCapitalize="none"
                    autoComplete="street-address"
                  />
                </View>
              )}
              {isSignUp && (
                <Text style={styles.pudoHint}>
                  Use your PUDO parcel drop-off location address. Do not use your home address.
                </Text>
              )}

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={theme.mutedForegroundColor} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={theme.mutedForegroundColor}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.mutedForegroundColor} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={theme.mutedForegroundColor}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={theme.mutedForegroundColor}
                  />
                </TouchableOpacity>
              </View>

              {!isSignUp && (
                <Pressable style={({ pressed }) => [styles.forgotPassword, pressed && { opacity: 0.8 }]}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </Pressable>
              )}

              <Pressable
                style={({ pressed }) => [styles.authButton, pressed && styles.authButtonPressed]}
                onPress={handleAuth}
                disabled={loading}
              >
                <LinearGradient
                  colors={getButtonGradientColors(theme)}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.authButtonText}>
                    {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                  </Text>
                </LinearGradient>
              </Pressable>

              {authError && (
                <Text style={styles.errorText}>
                  {authError}
                </Text>
              )}

              <View style={styles.switchAuth}>
                <Text style={styles.switchAuthText}>
                  {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                </Text>
                <Pressable onPress={() => setIsSignUp(!isSignUp)} style={({ pressed }) => pressed && styles.switchAuthLinkPressed}>
                  <Text style={styles.switchAuthLink}>
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
    </KeyboardAvoidingView>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: SPACING.containerPadding * 2,
    paddingVertical: SPACING['4xl'],
  },
  header: {
    marginBottom: SPACING['4xl'],
    alignItems: 'flex-start',
  },
  headerTextBlock: {
    flex: 1,
    marginBottom: SPACING.sm,
  },
  logoContainer: {
    width: 0,
    height: 0,
  },
  title: {
    fontSize: TYPOGRAPHY.h1 + 4,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: theme.mutedForegroundColor,
    textAlign: 'left',
  },
  headerEyebrow: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.semiBoldFont,
    color: theme.tintColor || '#73EC8B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground || 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.1)',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
    height: 52,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  pudoHint: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.5)',
    marginBottom: SPACING.lg,
    marginTop: -SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: theme.textColor,
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: SPACING.xs,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.xl,
    cursor: 'pointer',
  },
  forgotPasswordText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.mediumFont,
    color: theme.tintColor || '#0281ff',
  },
  authButton: {
    width: '100%',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    cursor: 'pointer',
  },
  authButtonPressed: {
    opacity: 0.9,
  },
  buttonGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authButtonText: {
    fontSize: TYPOGRAPHY.h4,
    fontFamily: theme.boldFont,
    color: theme.tintTextColor || '#fff',
  },
  switchAuthLinkPressed: {
    opacity: 0.8,
  },
  switchAuth: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  switchAuthText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: theme.mutedForegroundColor,
  },
  switchAuthLink: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.boldFont,
    color: theme.tintColor || '#0281ff',
    cursor: 'pointer',
  },
  errorText: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: '#ff6b6b',
    textAlign: 'center',
  },
})

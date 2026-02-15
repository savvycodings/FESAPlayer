import { useState, useContext } from 'react'
import { View, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native'
import { Text } from '../../components/ui/text'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'
import { LinearGradient } from 'expo-linear-gradient'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useNavigation } from '@react-navigation/native'
import { authClient } from '../../lib/auth-client'
import AsyncStorage from '@react-native-async-storage/async-storage'

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
  const navigation = useNavigation()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    if (isSignUp && !name) {
      Alert.alert('Error', 'Please enter your name')
      return
    }

    setLoading(true)
    setAuthError(null)

    try {
      let result

      // Wrap auth call in a timeout so web doesn't hang forever
      const authPromise = isSignUp
        ? authClient.signUp.email({ email, password, name })
        : authClient.signIn.email({ email, password })

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request timed out. Please check that your backend is running and try again.'))
        }, 15000)
      })

      result = await Promise.race([authPromise, timeoutPromise]) as any

      if (result?.error) {
        console.log('❌ Auth error result:', result.error)
        const message = result.error.message || (isSignUp ? 'Sign up failed' : 'Sign in failed')
        setAuthError(message)
        Alert.alert('Error', message)
        return
      }
      
      console.log(isSignUp ? '✅ Sign up successful:' : '✅ Sign in successful:', result?.data?.user?.email)
      
      // Mark user as authenticated for RootNavigator (used on all platforms)
      try {
        await AsyncStorage.setItem('authToken', 'better-auth-session')
        await AsyncStorage.setItem('hasSeenOnboarding', 'true')
      } catch (storageError) {
        console.warn('Failed to persist auth state:', storageError)
      }
      
      // Navigate to main app
      // @ts-ignore
      navigation.replace('Main')
    } catch (error: any) {
      console.error('❌ Auth error:', error)
      const message = error?.message || 'Something went wrong. Please check your internet connection and that the backend is reachable.'
      setAuthError(message)
      Alert.alert('Error', message)
    } finally {
      setLoading(false)
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
              <View style={styles.logoContainer}>
                <Text style={styles.logoEmoji}>🎴</Text>
              </View>
              <Text style={styles.title}>
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </Text>
              <Text style={styles.subtitle}>
                {isSignUp 
                  ? 'Join GradeIt and start your collecting journey'
                  : 'Sign in to continue to GradeIt'
                }
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
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.authButton}
                onPress={handleAuth}
                disabled={loading}
                activeOpacity={0.8}
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
              </TouchableOpacity>

              {authError && (
                <Text style={styles.errorText}>
                  {authError}
                </Text>
              )}

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.socialButton}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-google" size={20} color={theme.textColor} />
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              <View style={styles.switchAuth}>
                <Text style={styles.switchAuthText}>
                  {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                </Text>
                <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
                  <Text style={styles.switchAuthLink}>
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </Text>
                </TouchableOpacity>
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
    alignItems: 'center',
    marginBottom: SPACING['4xl'],
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.cardBackground || 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 2,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.2)',
  },
  logoEmoji: {
    fontSize: 40,
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
    textAlign: 'center',
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.borderColor || 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.regularFont,
    color: theme.mutedForegroundColor,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.cardBackground || 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.1)',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.xl,
  },
  socialButtonText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.mediumFont,
    color: theme.textColor,
    marginLeft: SPACING.sm,
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
  },
  errorText: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: '#ff6b6b',
    textAlign: 'center',
  },
})

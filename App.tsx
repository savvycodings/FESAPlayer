import 'react-native-gesture-handler'
import './global.css'
import { useState, useEffect, useRef } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { RootNavigator } from './src/navigation/RootNavigator'
import { useAuth } from './src/context/AuthContext'
import { useFonts } from 'expo-font'
import {
  GoogleSans_400Regular,
  GoogleSans_500Medium,
  GoogleSans_600SemiBold,
  GoogleSans_700Bold,
  GoogleSans_400Regular_Italic,
  GoogleSans_500Medium_Italic,
  GoogleSans_600SemiBold_Italic,
  GoogleSans_700Bold_Italic,
} from '@expo-google-fonts/google-sans'
import { ThemeContext, AppContext } from './src/context'
import { AuthProvider } from './src/context/AuthContext'
import * as themes from './src/theme'
import { IMAGE_MODELS, MODELS, ILLUSION_DIFFUSION_IMAGES } from './constants'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { ChatModelModal } from './src/components/index'
import { Model } from './types'
import { ActionSheetProvider } from '@expo/react-native-action-sheet'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import { StyleSheet, LogBox } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { PortalHost } from '@rn-primitives/portal'
import { applyStableTextDefaults } from './src/utils/layoutHelpers'
import { getApiBaseUrl } from './src/utils/apiBaseUrl'

applyStableTextDefaults()

function AuthNavigationGate() {
  const { isAuthenticated, hasSeenOnboarding } = useAuth()
  const navKey = `nav-${String(hasSeenOnboarding)}-${String(isAuthenticated)}`
  console.log('[AuthNavigationGate] render', { isAuthenticated, hasSeenOnboarding, navKey })
  return (
    <NavigationContainer key={navKey}>
      <RootNavigator />
    </NavigationContainer>
  )
}

LogBox.ignoreLogs([
  'Key "cancelled" in the image picker result is deprecated and will be removed in SDK 48, use "canceled" instead',
  'No native splash screen registered'
])

export default function App() {
  const [theme, setTheme] = useState<string>('wizards')
  const [chatType, setChatType] = useState<Model>(MODELS.gemini)
  const [imageModel, setImageModel] = useState<string>(IMAGE_MODELS.fastImage.label)
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const [illusionImage, setIllusionImage] = useState<string>(ILLUSION_DIFFUSION_IMAGES.mediumSquares.label)
  const [fontsLoaded] = useFonts({
    'Geist-Regular': require('./assets/fonts/Geist-Regular.otf'),
    'Geist-Light': require('./assets/fonts/Geist-Light.otf'),
    'Geist-Bold': require('./assets/fonts/Geist-Bold.otf'),
    'Geist-Medium': require('./assets/fonts/Geist-Medium.otf'),
    'Geist-Black': require('./assets/fonts/Geist-Black.otf'),
    'Geist-SemiBold': require('./assets/fonts/Geist-SemiBold.otf'),
    'Geist-Thin': require('./assets/fonts/Geist-Thin.otf'),
    'Geist-UltraLight': require('./assets/fonts/Geist-UltraLight.otf'),
    'Geist-UltraBlack': require('./assets/fonts/Geist-UltraBlack.otf'),
    GoogleSans_400Regular,
    GoogleSans_500Medium,
    GoogleSans_600SemiBold,
    GoogleSans_700Bold,
    GoogleSans_400Regular_Italic,
    GoogleSans_500Medium_Italic,
    GoogleSans_600SemiBold_Italic,
    GoogleSans_700Bold_Italic,
  })

  useEffect(() => {
    if (__DEV__) {
      console.log('[FASAPlayer] API base URL:', getApiBaseUrl())
    }
    configureStorage()
  }, [])

  async function configureStorage() {
    try {
      const _theme = await AsyncStorage.getItem('rnai-theme')
      if (_theme) {
        setTheme(_theme)
      } else {
        // Set default theme to wizards for new users
        setTheme('wizards')
        await AsyncStorage.setItem('rnai-theme', 'wizards')
      }
      const _chatType = await AsyncStorage.getItem('rnai-chatType')
      if (_chatType) {
        try {
          const parsed = JSON.parse(_chatType)
          if (parsed?.label === 'gemini') setChatType(parsed)
          else setChatType(MODELS.gemini)
        } catch {
          setChatType(MODELS.gemini)
        }
      } else {
        setChatType(MODELS.gemini)
        await AsyncStorage.setItem('rnai-chatType', JSON.stringify(MODELS.gemini))
      }
      const _imageModel = await AsyncStorage.getItem('rnai-imageModel')
      if (_imageModel) setImageModel(_imageModel)
    } catch (err) {
      console.log('error configuring storage', err)
    }
  }

  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  function closeModal() {
    bottomSheetModalRef.current?.dismiss()
    setModalVisible(false)
  }

  function handlePresentModalPress() {
    if (modalVisible) {
      closeModal()
    } else {
      bottomSheetModalRef.current?.present()
      setModalVisible(true)
    }
  }

  function _setChatType(type) {
    setChatType(type)
    AsyncStorage.setItem('rnai-chatType', JSON.stringify(type))
  }

  function _setImageModel(model) {
    setImageModel(model)
    AsyncStorage.setItem('rnai-imageModel', model)
  }

  function _setTheme(theme) {
    setTheme(theme)
    AsyncStorage.setItem('rnai-theme', theme)
  }

  const bottomSheetStyles = getBottomsheetStyles(theme)

  if (!fontsLoaded) return null
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider preload={false}>
      <SafeAreaProvider>
      <AppContext.Provider
        value={{
          chatType,
          setChatType: _setChatType,
          handlePresentModalPress,
          imageModel,
          setImageModel: _setImageModel,
          closeModal,
          illusionImage,
          setIllusionImage
        }}
      >
        <ThemeContext.Provider value={{
          theme: getTheme(theme),
          themeName: theme,
          setTheme: _setTheme
          }}>
          <ActionSheetProvider>
            <AuthProvider>
              <AuthNavigationGate />
            </AuthProvider>
          </ActionSheetProvider>
          <BottomSheetModalProvider>
            <BottomSheetModal
                handleIndicatorStyle={bottomSheetStyles.handleIndicator}
                handleStyle={bottomSheetStyles.handle}
                backgroundStyle={bottomSheetStyles.background}
                ref={bottomSheetModalRef}
                enableDynamicSizing={true}
                backdropComponent={(props) => <BottomSheetBackdrop {...props}  disappearsOnIndex={-1}/>}
                enableDismissOnClose
                enablePanDownToClose
                onDismiss={() => setModalVisible(false)}
              >
                <BottomSheetView>
                  <ChatModelModal
                    handlePresentModalPress={handlePresentModalPress}
                  />
                </BottomSheetView>
              </BottomSheetModal>
            </BottomSheetModalProvider>
          <PortalHost />
        </ThemeContext.Provider>
      </AppContext.Provider>
      </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  )
}

const getBottomsheetStyles = theme => StyleSheet.create({
  background: {
    paddingHorizontal: 24,
    backgroundColor: theme.backgroundColor
  },
  handle: {
    marginHorizontal: 15,
    backgroundColor: theme.backgroundColor,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: 'rgba(255, 255, 255, .3)'
  }
})

function getTheme(theme: any) {
  let current
  Object.keys(themes).forEach(_theme => {
    if (_theme.includes(theme)) {
      current = themes[_theme]
    }
  })
  return current
}

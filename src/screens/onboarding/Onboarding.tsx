import { useState, useRef, useContext } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  Pressable,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native'
import { Text } from '../../components/ui/text'
import { PrimaryGradientButton } from '../../components/ui/PrimaryGradientButton'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY } from '../../constants/layout'
import { ONBOARDING_HORIZONTAL, ONBOARDING_FOOTER_BASE_HEIGHT } from '../../components/onboarding/onboardingLayout'
import { OnboardingLayoutProvider } from '../../components/onboarding/OnboardingLayoutContext'
import { OnboardingScreen1 } from './OnboardingScreen1'
import { OnboardingScreen2 } from './OnboardingScreen2'
import { OnboardingScreen3 } from './OnboardingScreen3'
import { OnboardingScreen4 } from './OnboardingScreen4'
import { OnboardingScreen5 } from './OnboardingScreen5'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '../../context/AuthContext'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const screens = [
  { id: '1', component: OnboardingScreen1 },
  { id: '2', component: OnboardingScreen2 },
  { id: '3', component: OnboardingScreen3 },
  { id: '4', component: OnboardingScreen4 },
  { id: '5', component: OnboardingScreen5 },
]

export function Onboarding() {
  const { theme } = useContext(ThemeContext)
  const { setHasSeenOnboarding } = useAuth()
  const insets = useSafeAreaInsets()
  const footerReservedHeight = ONBOARDING_FOOTER_BASE_HEIGHT + Math.max(insets.bottom, SPACING.lg)
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)
  const styles = getStyles(theme, insets.bottom)

  const isLast = currentIndex === screens.length - 1

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true')
      setHasSeenOnboarding(true)
    } catch (error) {
      console.error('Error saving onboarding status:', error)
    }
  }

  const goToIndex = (index: number) => {
    if (index < 0 || index >= screens.length) return
    setCurrentIndex(index)
    flatListRef.current?.scrollToIndex({ index, animated: true })
  }

  const handleNext = () => {
    if (currentIndex < screens.length - 1) {
      goToIndex(currentIndex + 1)
    } else {
      handleFinish()
    }
  }

  const handleSkip = () => {
    handleFinish()
  }

  const updateIndexFromOffset = (offsetX: number) => {
    const index = Math.round(offsetX / SCREEN_WIDTH)
    if (index >= 0 && index < screens.length) {
      setCurrentIndex((prev) => (prev === index ? prev : index))
    }
  }

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    updateIndexFromOffset(event.nativeEvent.contentOffset.x)
  }

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    updateIndexFromOffset(event.nativeEvent.contentOffset.x)
  }

  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: { itemVisiblePercentThreshold: 50 },
      onViewableItemsChanged: ({
        viewableItems,
      }: {
        viewableItems: Array<{ index: number | null; isViewable?: boolean }>
      }) => {
        const primary = viewableItems.find((v) => v.isViewable) ?? viewableItems[0]
        if (primary?.index != null && primary.index >= 0 && primary.index < screens.length) {
          setCurrentIndex((prev) => (prev === primary.index ? prev : primary.index!))
        }
      },
    },
  ]).current

  const renderItem = ({ item }: { item: (typeof screens)[0] }) => {
    const ScreenComponent = item.component
    return (
      <View style={styles.slide}>
        <ScreenComponent />
      </View>
    )
  }

  return (
    <OnboardingLayoutProvider footerReservedHeight={footerReservedHeight}>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {!isLast ? (
          <Pressable
            style={[styles.skipTop, { top: insets.top + SPACING.sm }]}
            onPress={handleSkip}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text style={styles.skipTopText}>Skip</Text>
          </Pressable>
        ) : null}

        <FlatList
          ref={flatListRef}
          data={screens}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumScrollEnd}
          style={styles.list}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({ index: info.index, animated: true })
            }, 300)
          }}
        />

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {screens.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, index === currentIndex && styles.dotActive]}
              />
            ))}
          </View>

          <PrimaryGradientButton
            title={isLast ? 'Sign up / Log in' : 'Continue'}
            onPress={handleNext}
            accessibilityLabel={isLast ? 'Sign up or log in' : 'Continue to next slide'}
          />
        </View>
      </SafeAreaView>
    </OnboardingLayoutProvider>
  )
}

const getStyles = (theme: any, bottomInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    list: {
      flex: 1,
    },
    slide: {
      width: SCREEN_WIDTH,
      height: '100%',
    },
    skipTop: {
      position: 'absolute',
      right: ONBOARDING_HORIZONTAL,
      zIndex: 10,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
    },
    skipTopText: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.mediumFont,
      color: theme.tintColor || theme.mutedForegroundColor,
    },
    footer: {
      paddingHorizontal: ONBOARDING_HORIZONTAL,
      paddingTop: SPACING.lg,
      paddingBottom: Math.max(bottomInset, SPACING.lg),
      backgroundColor: theme.backgroundColor,
    },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: SPACING.xl,
      gap: SPACING.sm,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    dotActive: {
      width: 24,
      backgroundColor: theme.tintColor || '#73EC8B',
    },
  })

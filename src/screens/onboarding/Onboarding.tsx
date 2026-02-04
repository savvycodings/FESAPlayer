import { useState, useRef, useCallback } from 'react'
import { View, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native'
import { Text } from '../../components/ui/text'
import { ThemeContext } from '../../context'
import { useContext } from 'react'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'
import { OnboardingScreen1 } from './OnboardingScreen1'
import { OnboardingScreen2 } from './OnboardingScreen2'
import { OnboardingScreen3 } from './OnboardingScreen3'
import { OnboardingScreen4 } from './OnboardingScreen4'
import { OnboardingScreen5 } from './OnboardingScreen5'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Ionicons from '@expo/vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'

// Helper function to get gradient colors based on theme
const getButtonGradientColors = (theme: any): string[] => {
  const tintColor = theme.tintColor || '#0281ff'
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
  const navigation = useNavigation()
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)
  const styles = getStyles(theme)

  const handleNext = () => {
    if (currentIndex < screens.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true })
    } else {
      handleFinish()
    }
  }

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      const index = viewableItems[0].index
      if (index >= 0 && index < screens.length) {
        setCurrentIndex(index)
      }
    }
  }, [])

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current

  const handleMomentumScrollEnd = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH)
    if (index >= 0 && index < screens.length) {
      setCurrentIndex(index)
    }
  }

  const handleSkip = () => {
    handleFinish()
  }

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true')
      // Use navigate instead of replace - the navigator will handle the transition
      // @ts-ignore
      navigation.navigate('Auth')
    } catch (error) {
      console.error('Error saving onboarding status:', error)
    }
  }

  const renderItem = ({ item, index }: { item: typeof screens[0], index: number }) => {
    const ScreenComponent = item.component
    return (
      <View style={styles.screenContainer}>
        <ScreenComponent onNext={handleNext} onSkip={handleSkip} />
      </View>
    )
  }

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {screens.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={screens}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEnabled={true}
        getItemLayout={(data, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          const wait = new Promise(resolve => setTimeout(resolve, 500))
          wait.then(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true })
          })
        }}
      />
      {renderPagination()}
      
      {/* Skip Button */}
      {currentIndex < screens.length - 1 && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Next Button - Hide on last screen (it has its own button) */}
      {currentIndex < screens.length - 1 && (
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={getButtonGradientColors(theme)}
            style={styles.nextButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.nextButtonText}>NEXT</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  screenContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: SPACING['4xl'],
    left: 0,
    right: 0,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: theme.tintColor || '#0281ff',
  },
  skipButton: {
    position: 'absolute',
    bottom: SPACING['4xl'] - 4,
    right: SPACING.containerPadding * 2,
    padding: SPACING.sm,
    zIndex: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.mediumFont,
    color: theme.mutedForegroundColor,
  },
  nextButton: {
    position: 'absolute',
    bottom: SPACING['4xl'] + 40,
    left: SPACING.containerPadding * 2,
    right: SPACING.containerPadding * 2,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    shadowColor: theme.tintColor || '#0281ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonGradient: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 56,
  },
  nextButtonText: {
    fontSize: TYPOGRAPHY.body + 2,
    fontFamily: theme.boldFont,
    color: theme.tintTextColor || "#fff",
    letterSpacing: 1,
  },
})

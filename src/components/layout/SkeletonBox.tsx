import { View, StyleSheet, ViewStyle, Animated } from 'react-native'
import { useContext, useEffect, useRef } from 'react'
import { ThemeContext } from '../../context'

interface SkeletonBoxProps {
  width?: number | string
  height?: number | string
  borderRadius?: number
  style?: ViewStyle
}

/**
 * Reusable skeleton placeholder for loading states.
 * Uses a subtle pulse animation so it's clear content is loading.
 */
export function SkeletonBox({
  width,
  height,
  borderRadius = 8,
  style,
}: SkeletonBoxProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const opacity = useRef(new Animated.Value(0.35)).current

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.12,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[
        styles.box,
        width != null && { width } as ViewStyle,
        height != null && { height } as ViewStyle,
        { borderRadius },
        style,
        { opacity },
      ]}
    />
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    box: {
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
  })

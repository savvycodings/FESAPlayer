import { useContext, useEffect, useState, useMemo } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemedText } from '../ui/ThemedText'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, PROFILE_CHART_ACCENT } from '../../constants/layout'
import { Pill } from '../ui/Pill'
import { computePortfolioChange } from '../../utils/portfolioChange'

const STORAGE_KEY = 'portfolioValueVisible'

/** Same line box as username (28/34) so glyphs sit on the same bottom edge */
const SHOP_NAME_LINE_HEIGHT = 34
const SHOP_VALUE_FONT = 22

export type PortfolioHistoryPoint = { x: number; y: number }

type PortfolioValueInlineProps = {
  portfolioValue: number
  portfolioHistory?: PortfolioHistoryPoint[]
  /** Shop header: larger type, vertically centered with username */
  variant?: 'default' | 'shop'
}

export function PortfolioValueInline({
  portfolioValue,
  portfolioHistory = [],
  variant = 'default',
}: PortfolioValueInlineProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme, variant)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'false') setVisible(false)
    })
  }, [])

  const toggleVisible = () => {
    const next = !visible
    setVisible(next)
    AsyncStorage.setItem(STORAGE_KEY, String(next))
  }

  const valueLabel = useMemo(() => {
    if (portfolioValue <= 0) return 'R0'
    return `R${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }, [portfolioValue])

  const { change, changePercent, hasHistory } = useMemo(
    () => computePortfolioChange(portfolioHistory, portfolioValue),
    [portfolioHistory, portfolioValue],
  )

  const showChange = hasHistory && change !== 0

  return (
    <View style={styles.row}>
      <View style={styles.valueCluster}>
        <ThemedText style={[styles.value, { color: PROFILE_CHART_ACCENT }]}>
          {visible ? valueLabel : 'R •••••'}
        </ThemedText>
        {visible && showChange ? (
          <Pill
            label={`${Math.abs(parseFloat(changePercent))}%`}
            preset={change >= 0 ? 'positive' : 'negative'}
            icon={change >= 0 ? 'arrow-up' : 'arrow-down'}
            align="center"
          />
        ) : null}
      </View>
      <TouchableOpacity
        onPress={toggleVisible}
        style={styles.eyeButton}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide portfolio value' : 'Show portfolio value'}
      >
        <Ionicons
          name={visible ? 'eye-outline' : 'eye-off-outline'}
          size={variant === 'shop' ? 22 : 20}
          color={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.55)'}
        />
      </TouchableOpacity>
    </View>
  )
}

const getStyles = (theme: any, variant: 'default' | 'shop') =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: variant === 'shop' ? SPACING.sm : SPACING.xs,
      flexShrink: 0,
      ...(variant === 'shop' ? { height: SHOP_NAME_LINE_HEIGHT } : {}),
    },
    valueCluster: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
      flexShrink: 0,
    },
    eyeButton: {
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      ...(variant === 'shop' ? { height: SHOP_NAME_LINE_HEIGHT } : {}),
    },
    value: {
      fontSize: variant === 'shop' ? SHOP_VALUE_FONT : TYPOGRAPHY.h4,
      lineHeight: variant === 'shop' ? SHOP_VALUE_FONT * 1.1 : TYPOGRAPHY.h4 * 1.2,
      fontFamily: theme.boldFont,
      fontWeight: '700',
      letterSpacing: variant === 'shop' ? -0.3 : -0.2,
      includeFontPadding: false,
      ...(variant === 'shop'
        ? {
            textAlignVertical: 'center' as const,
            height: SHOP_NAME_LINE_HEIGHT,
          }
        : { textAlignVertical: 'center' as const }),
    },
  })

import { useContext, useEffect, useState, useMemo } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemedText } from '../ui/ThemedText'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS, PROFILE_CHART_ACCENT } from '../../constants/layout'

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

  const { change, changePercent, hasHistory } = useMemo(() => {
    const hasHist = portfolioHistory.length > 1
    const latest = hasHist ? portfolioHistory[portfolioHistory.length - 1]?.y ?? 0 : portfolioValue
    const previous = hasHist ? portfolioHistory[portfolioHistory.length - 2]?.y ?? 0 : 0
    const delta = latest - previous
    const pct = previous !== 0 ? ((delta / previous) * 100).toFixed(1) : '0.0'
    return { change: delta, changePercent: pct, hasHistory: hasHist }
  }, [portfolioHistory, portfolioValue])

  const showChange = hasHistory && change !== 0

  return (
    <View style={styles.row}>
      <View style={styles.valueCluster}>
        <ThemedText style={[styles.value, { color: PROFILE_CHART_ACCENT }]}>
          {visible ? valueLabel : 'R •••••'}
        </ThemedText>
        {visible && showChange && (
          <View style={[styles.changeBadge, change >= 0 ? styles.changePositive : styles.changeNegative]}>
            <Ionicons
              name={change >= 0 ? 'arrow-up' : 'arrow-down'}
              size={10}
              color={change >= 0 ? '#10B981' : '#EF4444'}
            />
            <ThemedText style={[styles.changeText, change >= 0 ? styles.changeTextPositive : styles.changeTextNegative]}>
              {Math.abs(parseFloat(changePercent))}%
            </ThemedText>
          </View>
        )}
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
      gap: variant === 'shop' ? SPACING.md : SPACING.xs,
      flexShrink: 0,
      ...(variant === 'shop' ? { minHeight: SHOP_NAME_LINE_HEIGHT } : {}),
    },
    valueCluster: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: SPACING.xs,
      flexShrink: 0,
      ...(variant === 'shop' ? { alignSelf: 'flex-end' } : {}),
    },
    eyeButton: {
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
    },
    value: {
      fontSize: variant === 'shop' ? SHOP_VALUE_FONT : TYPOGRAPHY.h4,
      lineHeight: variant === 'shop' ? SHOP_NAME_LINE_HEIGHT : TYPOGRAPHY.h4 * 1.2,
      fontFamily: theme.boldFont,
      fontWeight: '700',
      letterSpacing: variant === 'shop' ? -0.3 : -0.2,
      includeFontPadding: false,
      ...(variant === 'shop'
        ? { textAlignVertical: 'bottom' as const, height: SHOP_NAME_LINE_HEIGHT }
        : {}),
    },
    changeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: RADIUS.full,
    },
    changePositive: {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    changeNegative: {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    changeText: {
      fontSize: TYPOGRAPHY.label,
      fontFamily: theme.semiBoldFont,
      fontWeight: '600',
    },
    changeTextPositive: {
      color: '#10B981',
    },
    changeTextNegative: {
      color: '#EF4444',
    },
  })

import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

interface ProfileTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  const tabs = ['STATS', 'MY STORE', 'ORDERS']

  return (
    <View style={styles.tabsContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tabButton,
            activeTab === tab && styles.tabButtonActive,
          ]}
          onPress={() => onTabChange(tab)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab && styles.tabTextActive,
            ]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.backgroundColor,
    borderRadius: RADIUS.sm,
    padding: SPACING.xs,
    marginBottom: SPACING['2xl'],
    borderWidth: 1,
    borderColor: theme.textColor,
    width: '100%',
  },
  tabButton: {
    flex: 1,
    borderRadius: RADIUS.sm - 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  tabButtonActive: {
    backgroundColor: theme.textColor,
  },
  tabText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: theme.backgroundColor,
  },
})

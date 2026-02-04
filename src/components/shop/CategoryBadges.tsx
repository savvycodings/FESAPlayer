import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { useContext } from 'react'
import { Text } from '../ui/text'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

interface Category {
  id: string
  label: string
}

interface CategoryBadgesProps {
  categories: Category[]
  selectedCategory: string
  onCategorySelect: (categoryId: string) => void
}

export function CategoryBadges({ 
  categories, 
  selectedCategory, 
  onCategorySelect 
}: CategoryBadgesProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <View style={styles.categoriesContainer}>
      {categories.map((category) => {
        const isSelected = selectedCategory === category.id
        return (
          <TouchableOpacity
            key={category.id}
            onPress={() => onCategorySelect(category.id)}
            activeOpacity={0.6}
            style={styles.badgeWrapper}
          >
            <View style={[
              styles.categoryBadge,
              isSelected && styles.categoryBadgeActive
            ]}>
              <Text
                style={[
                  styles.badgeText,
                  isSelected && styles.badgeTextActive
                ]}
              >
                {category.label}
              </Text>
            </View>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badgeWrapper: {
    marginRight: 10,
    marginBottom: 10,
  },
  categoryBadge: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadgeActive: {
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgeText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontFamily: theme.regularFont,
    color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.1,
  },
  badgeTextActive: {
    color: theme.textColor,
    fontFamily: theme.semiBoldFont,
    fontWeight: '600',
  },
})

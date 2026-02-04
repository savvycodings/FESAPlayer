import { View, StyleSheet, TouchableOpacity, TextInput, Animated, TouchableWithoutFeedback } from 'react-native'
import { useContext, useEffect, useRef } from 'react'
import { Text } from '../ui/text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'
import { Platform } from 'react-native'

interface ShopHeaderProps {
  userName: string
  isSearchExpanded: boolean
  searchQuery: string
  onSearchToggle: () => void
  onSearchChange: (text: string) => void
  onSearchClear: () => void
}

export function ShopHeader({ 
  userName, 
  isSearchExpanded, 
  searchQuery, 
  onSearchToggle, 
  onSearchChange,
  onSearchClear 
}: ShopHeaderProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const searchInputRef = useRef<TextInput>(null)
  const expandAnimation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(expandAnimation, {
      toValue: isSearchExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start()

    if (isSearchExpanded && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [isSearchExpanded, expandAnimation])

  const searchBarWidth = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [40, '100%'],
  })

  const welcomeOpacity = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  })

  return (
    <View style={styles.headerContainer}>
      <Animated.View 
        style={[
          styles.welcomeContainer,
          { opacity: welcomeOpacity }
        ]}
      >
        <Text style={styles.welcomeText}>Welcome back</Text>
        <Text style={styles.userNameText}>{userName}</Text>
      </Animated.View>
      
      <Animated.View style={[styles.searchContainer, { width: searchBarWidth }]}>
        {isSearchExpanded ? (
          <View style={styles.searchBar}>
            <Ionicons
              name="search-outline"
              size={20}
              color={theme.textColor || '#E5E5E5'}
              style={styles.searchIcon}
            />
            <View style={styles.textInputWrapper}>
              <TextInput
                ref={searchInputRef}
                style={styles.searchText}
                placeholder="Search"
                placeholderTextColor={theme.placeholderTextColor || theme.mutedForegroundColor || '#E5E5E5'}
                underlineColorAndroid="transparent"
                value={searchQuery}
                onChangeText={onSearchChange}
                autoFocus={true}
                selectionColor={theme.tintColor || '#E5E5E5'}
                caretHidden={false}
                {...(Platform.OS === 'web' ? {
                  outline: 'none',
                  outlineWidth: 0,
                  outlineStyle: 'none',
                  border: 'none',
                } : {})}
              />
            </View>
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={onSearchClear}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color={theme.textColor || '#E5E5E5'} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={onSearchToggle}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={theme.textColor || '#E5E5E5'} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={onSearchToggle}
            style={styles.searchIconButton}
            activeOpacity={0.7}
          >
            <View style={styles.searchIconCircle}>
              <Ionicons
                name="search-outline"
                size={22}
                color={theme.textColor || '#FFFFFF'}
              />
            </View>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.headerPadding,
    paddingBottom: SPACING.headerPadding,
    backgroundColor: theme.backgroundColor,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
    zIndex: 9999,
  },
  welcomeContainer: {
    justifyContent: 'center',
    flex: 1,
  },
  welcomeText: {
    fontSize: 13,
    fontFamily: theme.regularFont,
    color: theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  userNameText: {
    fontSize: 18,
    fontFamily: theme.boldFont,
    color: theme.textColor,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  searchContainer: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  searchIconButton: {
    borderRadius: 20,
  },
  searchIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground || '#000000',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.1)',
    flex: 1,
    minHeight: 40,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  textInputWrapper: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginLeft: SPACING.xs,
    overflow: 'hidden',
    borderRadius: 0,
  },
  searchText: {
    flex: 1,
    color: theme.textColor || '#E5E5E5',
    fontFamily: theme.regularFont,
    fontSize: TYPOGRAPHY.body,
    backgroundColor: 'transparent',
    padding: 0,
    margin: 0,
    borderWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    ...(Platform.OS === 'android' && {
      backgroundColor: 'transparent',
      borderWidth: 0,
      paddingVertical: 0,
      paddingHorizontal: 0,
    }),
    ...(Platform.OS === 'ios' && {
      borderWidth: 0,
      paddingVertical: 0,
      paddingHorizontal: 0,
    }),
  },
  clearButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  closeButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
})

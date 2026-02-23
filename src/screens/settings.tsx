import {
  View,
  Text,
  StyleSheet,
  TouchableHighlight,
  ScrollView,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native'
import { useContext, useState, useEffect, useCallback } from 'react'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { ThemeContext } from '../context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { SPACING, TYPOGRAPHY, RADIUS } from '../constants/layout'
import { authClient } from '../lib/auth-client'
import { DOMAIN } from '../../constants'

const { width } = Dimensions.get('window')

const SETTINGS_ITEMS = [
  { label: 'Edit profile', icon: 'person-outline' as const },
  { label: 'Pudo address', icon: 'location-outline' as const },
  { label: 'Phone number', icon: 'call-outline' as const },
  { label: 'Change password', icon: 'lock-closed-outline' as const },
  { label: 'Billing', icon: 'card-outline' as const },
]

export function Settings() {
  const { theme } = useContext(ThemeContext)
  const navigation = useNavigation()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const styles = getStyles(theme)

  const fetchUser = useCallback(async () => {
    try {
      const session = await authClient.getSession()
      if (!session?.data?.session) {
        setLoading(false)
        return
      }
      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const res = await fetch(`${baseUrl}/api/profile/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.data.session.token}`,
        },
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok && data.user) setUser(data.user)
      else setUser(null)
    } catch (_) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      fetchUser()
    }, [fetchUser])
  )

  // Display name: "FirstName LastName" if both set, else firstName, lastName, or name
  const first = user?.firstName?.trim()
  const last = user?.lastName?.trim()
  const fallbackName = user?.name?.trim()
  const userName = [first, last].filter(Boolean).join(' ') || fallbackName || 'User'
  const userLevel = user?.level ?? 0
  const profileImage = user?.avatar ? { uri: user.avatar } : require('../../assets/Avatars/guy1.jpg')

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Same profile block as Profile tab: picture, Trusted, name, level */}
      <View style={styles.headerSection}>
        {loading ? (
          <View style={styles.headerLoader}>
            <ActivityIndicator size="small" color={theme.tintColor || '#73EC8B'} />
          </View>
        ) : (
          <View style={styles.profileRow}>
            <View style={styles.avatarWrapper}>
              <Image source={profileImage} style={styles.avatar} resizeMode="cover" />
              <View style={styles.trustedBadge}>
                <Ionicons name="shield-checkmark" size={18} color={theme.tintColor || '#73EC8B'} />
                <Text style={styles.trustedText}>Trusted</Text>
              </View>
            </View>
            <View style={styles.nameAndLevel}>
              <Text style={styles.userName}>{userName}</Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>Lv {userLevel}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {SETTINGS_ITEMS.map((item, index) => (
        <TouchableHighlight
          key={index}
          underlayColor="transparent"
          onPress={() => {
            if (item.label === 'Edit profile') navigation.navigate('EditProfile' as never)
            if (item.label === 'Phone number') navigation.navigate('EditPhone' as never)
            if (item.label === 'Pudo address') navigation.navigate('EditPudoAddress' as never)
          }}
        >
          <View style={styles.row}>
            <Ionicons
              name={item.icon}
              size={22}
              color={theme.tintColor || '#73EC8B'}
              style={styles.rowIcon}
            />
            <Text style={styles.rowText}>{item.label}</Text>
            <Ionicons
              name="chevron-forward"
              size={22}
              color={theme.tintColor || '#73EC8B'}
              style={styles.rowArrow}
            />
          </View>
        </TouchableHighlight>
      ))}
    </ScrollView>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    contentContainer: {
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING.md,
      paddingBottom: 40,
    },
    headerSection: {
      marginBottom: SPACING.xl,
      paddingVertical: SPACING.xl,
      paddingHorizontal: SPACING.sm,
    },
    headerLoader: {
      paddingVertical: SPACING.xl,
      alignItems: 'center',
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xl,
    },
    avatarWrapper: {
      position: 'relative',
      width: 130,
      height: 130,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatar: {
      width: 112,
      height: 112,
      borderRadius: RADIUS.full,
      borderWidth: 3,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      backgroundColor: theme.textColor,
    },
    trustedBadge: {
      position: 'absolute',
      bottom: -4,
      left: '50%',
      transform: [{ translateX: -42 }],
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      paddingHorizontal: SPACING.sm,
      paddingVertical: 4,
      borderRadius: RADIUS.full,
      gap: 6,
      borderWidth: 1,
      borderColor: theme.tintColor || '#73EC8B',
      zIndex: 1,
    },
    trustedText: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.semiBoldFont,
      color: theme.tintColor || '#73EC8B',
      fontWeight: '600',
    },
    nameAndLevel: {
      flex: 1,
    },
    userName: {
      fontSize: 28,
      fontFamily: theme.boldFont,
      color: theme.textColor,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    levelBadge: {
      backgroundColor: theme.tintColor || '#73EC8B',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.sm,
      marginTop: SPACING.sm,
      alignSelf: 'flex-start',
    },
    levelText: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.boldFont,
      color: '#000000',
      fontWeight: '600',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
      gap: SPACING.md,
    },
    rowIcon: {
      marginRight: 4,
    },
    rowArrow: {
      marginLeft: 'auto',
    },
    rowText: {
      fontFamily: theme.semiBoldFont,
      fontSize: 16,
      color: theme.textColor,
    },
  })

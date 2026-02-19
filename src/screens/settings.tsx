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
import { useContext, useState, useEffect } from 'react'
import { ThemeContext } from '../context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { SPACING, TYPOGRAPHY, RADIUS } from '../constants/layout'
import { authClient } from '../lib/auth-client'
import { DOMAIN } from '../../constants'

const { width } = Dimensions.get('window')

const TEST_ITEMS = ['Test', 'Test', 'Test', 'Test']

export function Settings() {
  const { theme } = useContext(ThemeContext)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const styles = getStyles(theme)

  useEffect(() => {
    let cancelled = false
    async function fetchUser() {
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
        if (!cancelled && res.ok && data.user) setUser(data.user)
      } catch (_) {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchUser()
    return () => { cancelled = true }
  }, [])

  const userName = user?.firstName || user?.name || 'User'
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
                <Ionicons name="shield-checkmark" size={12} color={theme.tintColor || '#73EC8B'} />
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

      {TEST_ITEMS.map((label, index) => (
        <TouchableHighlight
          key={index}
          underlayColor="transparent"
          onPress={() => {}}
        >
          <View style={styles.row}>
            <Text style={styles.rowText}>{label}</Text>
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
      paddingVertical: SPACING.lg,
      paddingHorizontal: SPACING.sm,
    },
    headerLoader: {
      paddingVertical: SPACING.xl,
      alignItems: 'center',
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
    },
    avatarWrapper: {
      position: 'relative',
      width: 72,
      height: 72,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: RADIUS.full,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      backgroundColor: theme.textColor,
    },
    trustedBadge: {
      position: 'absolute',
      bottom: -2,
      left: '50%',
      transform: [{ translateX: -28 }],
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      paddingHorizontal: SPACING.xs,
      paddingVertical: 2,
      borderRadius: RADIUS.full,
      gap: 4,
      borderWidth: 1,
      borderColor: theme.tintColor || '#73EC8B',
      zIndex: 1,
    },
    trustedText: {
      fontSize: TYPOGRAPHY.label,
      fontFamily: theme.semiBoldFont,
      color: theme.tintColor || '#73EC8B',
      fontWeight: '600',
    },
    nameAndLevel: {
      flex: 1,
    },
    userName: {
      fontSize: TYPOGRAPHY.h2,
      fontFamily: theme.boldFont,
      color: theme.textColor,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    levelBadge: {
      backgroundColor: theme.tintColor || '#73EC8B',
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      borderRadius: RADIUS.sm,
      marginTop: SPACING.xs,
      alignSelf: 'flex-start',
    },
    levelText: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.boldFont,
      color: '#000000',
      fontWeight: '600',
    },
    row: {
      padding: 15,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    },
    rowText: {
      fontFamily: theme.semiBoldFont,
      fontSize: 16,
      color: theme.textColor,
    },
  })

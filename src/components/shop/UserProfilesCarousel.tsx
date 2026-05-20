import { View, StyleSheet, Image, TouchableOpacity } from 'react-native'
import { useContext } from 'react'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Text } from '../ui/text'
import { Carousel } from '../Carousel'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS, STORE_COLORS } from '../../constants/layout'

export interface VerifiedStore {
  first: string
  last: string
  image: any
  verified: boolean
  /** Real user/store from API; when set, navigation uses these instead of first/last */
  userId?: string
  storeId?: number
  /** Store verification level from API: bronze | silver | gold | platinum | diamond – used for shield color */
  verificationLevel?: string
}

interface VerifiedStoresCarouselProps {
  items: VerifiedStore[]
}

type ShopStackParamList = {
  ShopMain: undefined
  ViewProfile: {
    userId: string
    userName: string
    userImage?: any
    userInitials?: string
    verified?: boolean
    storeId?: number
  }
}

type VerifiedStoresCarouselNavigationProp = NativeStackNavigationProp<ShopStackParamList, 'ShopMain'>

/** Compact avatars so more stores peek on screen at once */
const VERIFIED_STORE_AVATAR = 84
const VERIFIED_STORE_ITEM_WIDTH = VERIFIED_STORE_AVATAR
const VERIFIED_STORE_ITEM_HEIGHT = VERIFIED_STORE_AVATAR + 26
const VERIFIED_STORE_ITEM_GAP = 8

// Shield color from store verification level (bronze → silver → gold → platinum → diamond)
const getShieldColorForLevel = (verificationLevel: string | undefined): string => {
  if (!verificationLevel) return STORE_COLORS.bronze
  const level = verificationLevel.toLowerCase()
  if (level === 'diamond') return STORE_COLORS.diamond
  if (level === 'platinum') return STORE_COLORS.platinum
  if (level === 'gold') return STORE_COLORS.gold
  if (level === 'silver') return STORE_COLORS.silver
  if (level === 'bronze') return STORE_COLORS.bronze
  return STORE_COLORS.bronze
}

export function VerifiedStoresCarousel({ items }: VerifiedStoresCarouselProps) {
  const { theme } = useContext(ThemeContext)
  const navigation = useNavigation<VerifiedStoresCarouselNavigationProp>()
  const styles = getStyles(theme)

  return (
    <View>
      <Carousel
        items={items}
        renderItem={(item) => (
          <TouchableOpacity
            style={styles.storeWrapper}
            onPress={() => {
              const displayName = [item.first, item.last].filter(Boolean).join(' ') || item.first
              navigation.navigate('ViewProfile', {
                userId: item.userId ?? `${item.first.toLowerCase()}-${item.last.toLowerCase()}`,
                userName: displayName,
                userImage: item.image,
                userInitials: `${(item.first || '')[0]}${(item.last || '')[0]}`.toUpperCase() || '?',
                verified: item.verified,
                ...(item.storeId != null && { storeId: item.storeId }),
              })
            }}
            activeOpacity={0.8}
          >
            <View style={styles.storeImageContainer}>
              <Image
                source={item.image}
                style={styles.storeImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.storeNameContainer}>
              {item.verified && (
                <Ionicons
                  name="shield-checkmark-outline"
                  size={12}
                  color={getShieldColorForLevel(item.verificationLevel)}
                  style={styles.verifiedIconLeft}
                />
              )}
              <Text style={styles.storeNameText} numberOfLines={1}>
                {item.first}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        itemWidth={VERIFIED_STORE_ITEM_WIDTH}
        itemHeight={VERIFIED_STORE_ITEM_HEIGHT}
        itemSpacing={VERIFIED_STORE_ITEM_GAP}
      />
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  storeWrapper: {
    alignItems: 'center',
  },
  storeImageContainer: {
    width: VERIFIED_STORE_AVATAR,
    height: VERIFIED_STORE_AVATAR,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.15)',
  },
  storeImage: {
    width: '120%',
    height: '120%',
    borderRadius: RADIUS.full,
    marginLeft: '-10%',
    marginTop: '-10%',
  },
  verifiedIconLeft: {
    marginRight: SPACING.xs,
  },
  storeNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
    maxWidth: VERIFIED_STORE_ITEM_WIDTH,
  },
  storeNameText: {
    fontSize: TYPOGRAPHY.caption,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    textAlign: 'center',
    letterSpacing: 0.1,
    fontWeight: '600',
  },
})

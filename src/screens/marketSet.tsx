import { useCallback, useContext, useEffect, useState } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../context'
import { Text } from '../components/ui/text'
import { Card, CardContent } from '../components/ui/card'
import { SPACING, TYPOGRAPHY, RADIUS } from '../constants/layout'
import { DOMAIN } from '../../constants'

type MarketSetRoute = RouteProp<{ MarketSet: { setId: number; setName: string } }, 'MarketSet'>

type CatalogCard = {
  id: number
  name: string
  number: string
  secret?: boolean
  set?: string
  marketPrice?: number | null
  imageUrl?: string | null
}

export function MarketSet() {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const navigation = useNavigation()
  const route = useRoute<MarketSetRoute>()
  const { setId, setName } = route.params

  const [cards, setCards] = useState<CatalogCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const fetchCards = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const base = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      const qs = params.toString()
      const res = await fetch(`${base}/api/market/sets/${setId}/cards${qs ? `?${qs}` : ''}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Failed (${res.status})`)
      setCards(data.cards ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load cards')
      setCards([])
    } finally {
      setLoading(false)
    }
  }, [setId, searchQuery])

  useFocusEffect(
    useCallback(() => {
      fetchCards()
    }, [fetchCards]),
  )

  const USD_TO_ZAR = Number(process.env.EXPO_PUBLIC_USD_TO_ZAR) || 17

  const renderCard = ({ item }: { item: CatalogCard }) => {
    const priceZar =
      item.marketPrice != null && item.marketPrice > 0
        ? Math.round(item.marketPrice * USD_TO_ZAR)
        : undefined
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() =>
          (navigation as { navigate: (name: string, params: object) => void }).navigate('Product', {
            cardId: String(item.id),
            name: item.name,
            set: item.set || setName,
            setName: item.set || setName,
            cardNumber: item.number,
            price: priceZar,
            image: item.imageUrl ? { uri: item.imageUrl } : undefined,
            category: 'single',
          })
        }
      >
        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            <View style={styles.cardRow}>
              <View style={styles.numBadge}>
                <Text style={styles.numText}>#{item.number}</Text>
              </View>
              <View style={styles.cardTitleCol}>
                <Text style={styles.cardName} numberOfLines={2}>
                  {item.name}
                  {item.secret ? ' ★' : ''}
                </Text>
                {priceZar != null ? (
                  <Text style={styles.cardPrice}>R{priceZar.toLocaleString('en-ZA')}</Text>
                ) : null}
              </View>
            </View>
          </CardContent>
        </Card>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.textColor || '#fff'} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {setName}
          </Text>
          {!loading && !error ? (
            <Text style={styles.headerCount}>{cards.length} cards</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.searchBarWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#E5E5E5" style={styles.searchIcon} />
          <TextInput
            style={styles.searchText}
            placeholder="Search cards"
            placeholderTextColor="#E5E5E5"
            value={searchInput}
            onChangeText={setSearchInput}
            returnKeyType="search"
            underlineColorAndroid="transparent"
          />
          {searchInput.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchInput('')} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color="#E5E5E5" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.tintColor || '#73EC8B'} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={36} color="rgba(255,255,255,0.35)" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchCards}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {searchQuery ? 'No cards match your search.' : 'No cards in this set yet.'}
            </Text>
          }
        />
      )}
    </View>
  )
}

const getStyles = (theme: {
  textColor?: string
  tintColor?: string
  backgroundColor?: string
  cardBackground?: string
  regularFont?: string
}) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor || '#0c0f14',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: SPACING.lg,
      paddingHorizontal: SPACING.containerPadding,
      paddingBottom: SPACING.sm,
      gap: SPACING.sm,
    },
    backBtn: {
      padding: 4,
    },
    headerTitles: {
      flex: 1,
      minWidth: 0,
    },
    headerTitle: {
      fontSize: TYPOGRAPHY.h2,
      fontWeight: '700',
      color: theme.textColor || '#fff',
    },
    headerCount: {
      fontSize: TYPOGRAPHY.caption,
      color: 'rgba(255, 255, 255, 0.5)',
      marginTop: 2,
    },
    searchBarWrap: {
      paddingHorizontal: SPACING.containerPadding,
      paddingBottom: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBackground || '#000000',
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    searchIcon: {
      marginRight: SPACING.xs,
    },
    searchText: {
      flex: 1,
      color: '#E5E5E5',
      fontFamily: theme.regularFont,
      fontSize: TYPOGRAPHY.body,
      marginLeft: SPACING.xs,
      paddingVertical: Platform.OS === 'ios' ? 4 : 2,
    },
    listContent: {
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING.md,
      paddingBottom: SPACING['4xl'],
      gap: SPACING.sm,
    },
    card: {
      backgroundColor: theme.cardBackground || '#000000',
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    cardContent: {
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
    },
    numBadge: {
      minWidth: 48,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 6,
      borderRadius: RADIUS.md,
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      alignItems: 'center',
    },
    numText: {
      fontSize: TYPOGRAPHY.caption,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.55)',
      fontVariant: ['tabular-nums'],
    },
    cardTitleCol: {
      flex: 1,
      minWidth: 0,
    },
    cardName: {
      fontSize: TYPOGRAPHY.body,
      fontWeight: '500',
      color: theme.textColor || '#fff',
    },
    cardPrice: {
      fontSize: TYPOGRAPHY.caption,
      color: theme.tintColor || '#73EC8B',
      marginTop: 4,
      fontWeight: '600',
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.xl,
      gap: SPACING.md,
    },
    errorText: {
      color: 'rgba(255,255,255,0.65)',
      textAlign: 'center',
      fontSize: TYPOGRAPHY.body,
    },
    retryBtn: {
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.full,
      backgroundColor: theme.tintColor || '#73EC8B',
    },
    retryText: {
      color: '#000',
      fontWeight: '600',
    },
    empty: {
      color: 'rgba(255,255,255,0.45)',
      textAlign: 'center',
      marginTop: SPACING['2xl'],
      fontSize: TYPOGRAPHY.body,
    },
  })

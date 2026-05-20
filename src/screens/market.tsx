import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
  Platform,
} from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../context'
import { Text } from '../components/ui/text'
import { Card, CardContent } from '../components/ui/card'
import { SPACING, TYPOGRAPHY, RADIUS } from '../constants/layout'
import { DOMAIN } from '../../constants'
import { AppButton } from '../components/ui/AppButton'

type MarketSet = {
  id: number
  name: string
  code: string | null
  language: string
  releaseDate: string | null
  tcg: string | null
  cardCount: number
  tcgSetId: string | null
}

type MarketResponse = {
  sets: MarketSet[]
}

function formatReleaseDate(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
    })
  } catch {
    return ''
  }
}

export function Market() {
  const { theme } = useContext(ThemeContext)
  const insets = useSafeAreaInsets()
  const styles = getStyles(theme, insets.top)
  const navigation = useNavigation<any>()
  const [sets, setSets] = useState<MarketSet[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const fetchSets = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    setError(null)
    try {
      const base = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const params = new URLSearchParams({ language: 'ENGLISH' })
      if (searchQuery) params.set('q', searchQuery)
      const res = await fetch(`${base}/api/market/sets?${params}`)
      const data = (await res.json()) as MarketResponse & { error?: string }
      if (!res.ok) {
        throw new Error(data.error || `Failed to load sets (${res.status})`)
      }
      setSets(data.sets ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load sets')
      setSets([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [searchQuery])

  useFocusEffect(
    useCallback(() => {
      fetchSets()
    }, [fetchSets]),
  )

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchSets({ silent: true })
  }, [fetchSets])

  const sortedSets = useMemo(() => {
    return [...sets].sort((a, b) => {
      const aSynced = (a.cardCount ?? 0) > 0 ? 1 : 0
      const bSynced = (b.cardCount ?? 0) > 0 ? 1 : 0
      if (bSynced !== aSynced) return bSynced - aSynced
      const da = a.releaseDate ? new Date(a.releaseDate).getTime() : 0
      const db = b.releaseDate ? new Date(b.releaseDate).getTime() : 0
      return db - da
    })
  }, [sets])

  const renderItem = ({ item }: { item: MarketSet }) => {
    const hasCards = item.cardCount > 0
    const meta = [item.code, formatReleaseDate(item.releaseDate)].filter(Boolean).join(' · ')

    return (
      <Pressable
        onPress={() =>
          navigation.navigate('MarketSet', { setId: item.id, setName: item.name })
        }
        disabled={!hasCards}
        style={({ pressed }) => [pressed && hasCards && styles.rowPressed]}
      >
        <Card style={[styles.setCard, !hasCards && styles.setCardDisabled]}>
          <CardContent style={styles.setCardContent}>
            <View style={styles.setRow}>
              <View style={styles.setIconWrap}>
                <Ionicons
                  name="albums-outline"
                  size={22}
                  color={hasCards ? theme.tintColor || '#73EC8B' : 'rgba(255,255,255,0.25)'}
                />
              </View>
              <View style={styles.setTextCol}>
                <Text style={styles.setName} numberOfLines={2}>
                  {item.name}
                </Text>
                {meta ? (
                  <Text style={styles.setMeta} numberOfLines={1}>
                    {meta}
                  </Text>
                ) : null}
              </View>
              <View style={styles.setTrailing}>
                {hasCards ? (
                  <View style={styles.countPill}>
                    <Text style={styles.countPillText}>{item.cardCount}</Text>
                  </View>
                ) : (
                  <Text style={styles.soonLabel}>Soon</Text>
                )}
                {hasCards ? (
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.35)" />
                ) : null}
              </View>
            </View>
          </CardContent>
        </Card>
      </Pressable>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#E5E5E5" style={styles.searchIcon} />
          <TextInput
            style={styles.searchText}
            placeholder="Search sets"
            placeholderTextColor="#E5E5E5"
            value={searchInput}
            onChangeText={setSearchInput}
            returnKeyType="search"
            underlineColorAndroid="transparent"
          />
          {searchInput.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchInput('')} hitSlop={8} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={20} color="#E5E5E5" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {loading && sets.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.textColor} />
        </View>
      ) : error && sets.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={40} color="rgba(255,255,255,0.35)" />
          <Text style={styles.errorText}>{error}</Text>
          <AppButton variant="outline" size="sm" label="Try again" onPress={() => fetchSets()} />
        </View>
      ) : (
        <FlatList
          data={sortedSets}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
            refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.textColor} />
          }
          ItemSeparatorComponent={() => <View style={{ height: SPACING.stackGap }} />}
          ListEmptyComponent={
            !loading ? <Text style={styles.emptyText}>No sets match your search.</Text> : null
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
}, topInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor || '#0c0f14',
    },
    topBar: {
      paddingTop: topInset + SPACING.sm,
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
      ...(Platform.OS === 'web'
        ? { outlineStyle: 'none' as const, outlineWidth: 0 }
        : {}),
    },
    clearBtn: {
      marginLeft: SPACING.xs,
    },
    listContent: {
      paddingHorizontal: SPACING.containerPadding,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.screenBottom,
      gap: SPACING.stackGap,
    },
    setCard: {
      backgroundColor: theme.cardBackground || '#000000',
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    setCardDisabled: {
      opacity: 0.55,
    },
    setCardContent: {
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.xs,
    },
    setRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    rowPressed: {
      opacity: 0.85,
    },
    setIconWrap: {
      width: 32,
      height: 32,
      borderRadius: RADIUS.sm,
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    setTextCol: {
      flex: 1,
      minWidth: 0,
    },
    setName: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontWeight: '600',
      color: theme.textColor || '#fff',
      marginBottom: 0,
    },
    setMeta: {
      fontSize: TYPOGRAPHY.caption,
      color: 'rgba(255, 255, 255, 0.5)',
    },
    setTrailing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    countPill: {
      minWidth: 32,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 4,
      borderRadius: RADIUS.full,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      alignItems: 'center',
    },
    countPillText: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontWeight: '700',
      color: theme.textColor,
    },
    soonLabel: {
      fontSize: TYPOGRAPHY.caption,
      color: 'rgba(255, 255, 255, 0.35)',
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
    emptyText: {
      color: 'rgba(255,255,255,0.45)',
      textAlign: 'center',
      marginTop: SPACING['2xl'],
      fontSize: TYPOGRAPHY.body,
    },
  })

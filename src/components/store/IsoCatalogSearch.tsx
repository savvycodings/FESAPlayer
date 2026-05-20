import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native'
import { useContext, useState, useEffect, useCallback } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Text } from '../ui/text'
import { ThemeContext } from '../../context'
import { AppButton } from '../ui/AppButton'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'
import { searchCatalogCards, type CatalogCardHit } from '../../utils/isoCatalogSearch'
import type { IsoCardPick } from '../profile/AddISOModal'

type IsoCatalogSearchProps = {
  apiBaseUrl: string
  onAdd: (pick: IsoCardPick) => void | Promise<void>
  addingCardId?: string | null
}

export function IsoCatalogSearch({ apiBaseUrl, onAdd, addingCardId }: IsoCatalogSearchProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<CatalogCardHit[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const runSearch = useCallback(
    async (q: string) => {
      if (q.trim().length < 2) {
        setResults([])
        setSearchError(null)
        return
      }
      setSearchLoading(true)
      setSearchError(null)
      const { hits, error } = await searchCatalogCards(apiBaseUrl, q, 20)
      setResults(hits)
      setSearchError(error ?? null)
      setSearchLoading(false)
    },
    [apiBaseUrl],
  )

  useEffect(() => {
    const t = setTimeout(() => runSearch(searchQuery), 400)
    return () => clearTimeout(t)
  }, [searchQuery, runSearch])

  const handleAdd = (item: CatalogCardHit) => {
    onAdd({
      cardName: item.name,
      cardNumber: item.number,
      set: item.set,
      image: item.imageUrl || undefined,
      catalogId: item.id,
    })
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#E5E5E5" style={styles.searchIcon} />
        <TextInput
          style={styles.searchText}
          placeholder="Search cards in catalog…"
          placeholderTextColor="rgba(255, 255, 255, 0.45)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          underlineColorAndroid="transparent"
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={20} color="#E5E5E5" />
          </TouchableOpacity>
        ) : null}
      </View>

      {searchLoading ? (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color={theme.tintColor || '#73EC8B'} />
          <Text style={styles.statusText}>Searching…</Text>
        </View>
      ) : null}

      {!searchLoading && searchError ? (
        <Text style={styles.errorText}>{searchError}</Text>
      ) : null}

      {!searchLoading && searchQuery.trim().length > 0 && searchQuery.trim().length < 2 ? (
        <Text style={styles.hintText}>Type at least 2 characters</Text>
      ) : null}

      {results.length > 0 ? (
        <View style={styles.results}>
          {results.map((item) => {
            const meta = [item.set, item.number ? `#${item.number}` : null].filter(Boolean).join(' · ')
            const isAdding = addingCardId === item.id
            return (
              <View key={item.id} style={styles.resultRow}>
                <View style={styles.thumb}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.thumbImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.thumbEmpty}>
                      <Ionicons name="image-outline" size={16} color="rgba(255,255,255,0.35)" />
                    </View>
                  )}
                </View>
                <View style={styles.resultTextCol}>
                  <Text style={styles.resultName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {meta ? (
                    <Text style={styles.resultMeta} numberOfLines={1}>
                      {meta}
                    </Text>
                  ) : null}
                </View>
                <AppButton
                  variant="outline"
                  size="sm"
                  label={isAdding ? 'Adding…' : 'Add'}
                  onPress={() => handleAdd(item)}
                  disabled={Boolean(addingCardId)}
                  onDarkSurface
                />
              </View>
            )
          })}
        </View>
      ) : null}
    </View>
  )
}

function getStyles(theme: {
  textColor?: string
  cardBackground?: string
  regularFont?: string
  semiBoldFont?: string
  tintColor?: string
}) {
  return StyleSheet.create({
    wrap: {
      marginBottom: SPACING.md,
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
      marginBottom: SPACING.sm,
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
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      marginBottom: SPACING.sm,
    },
    statusText: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.regularFont,
      color: 'rgba(255, 255, 255, 0.55)',
    },
    errorText: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.regularFont,
      color: 'rgba(255, 200, 200, 0.9)',
      marginBottom: SPACING.sm,
    },
    hintText: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.regularFont,
      color: 'rgba(255, 255, 255, 0.45)',
      marginBottom: SPACING.sm,
    },
    results: {
      gap: SPACING.xs,
    },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.xs,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
    thumb: {
      width: 40,
      height: 54,
      borderRadius: RADIUS.sm,
      overflow: 'hidden',
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    thumbImage: {
      width: '100%',
      height: '100%',
    },
    thumbEmpty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resultTextCol: {
      flex: 1,
      minWidth: 0,
    },
    resultName: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
      fontWeight: '600',
    },
    resultMeta: {
      fontSize: TYPOGRAPHY.label,
      fontFamily: theme.regularFont,
      color: 'rgba(255, 255, 255, 0.5)',
      marginTop: 2,
    },
  })
}

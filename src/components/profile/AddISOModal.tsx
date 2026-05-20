import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Image,
} from 'react-native'
import { useContext, useState, useEffect, useCallback } from 'react'
import { Text } from '../ui/text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { AppButton } from '../ui/AppButton'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'
import { searchCatalogCards, type CatalogCardHit } from '../../utils/isoCatalogSearch'

export type IsoCardPick = {
  cardName: string
  cardNumber?: string
  set?: string
  image?: string
  catalogId?: string
}

interface AddISOModalProps {
  visible: boolean
  onClose: () => void
  onAdd: (data: IsoCardPick) => void
  apiBaseUrl?: string
}

export function AddISOModal({ visible, onClose, onAdd, apiBaseUrl }: AddISOModalProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<CatalogCardHit[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selected, setSelected] = useState<CatalogCardHit | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    setSearchQuery('')
    setResults([])
    setSelected(null)
    setSearchError(null)
  }, [visible])

  const runSearch = useCallback(
    async (q: string) => {
      if (!apiBaseUrl || q.trim().length < 2) {
        setResults([])
        setSearchError(null)
        return
      }
      setSearchLoading(true)
      setSearchError(null)
      const { hits, error } = await searchCatalogCards(apiBaseUrl, q, 24)
      setResults(hits)
      setSearchError(error ?? null)
      setSearchLoading(false)
    },
    [apiBaseUrl],
  )

  useEffect(() => {
    if (!visible || !apiBaseUrl) return
    const t = setTimeout(() => runSearch(searchQuery), 400)
    return () => clearTimeout(t)
  }, [searchQuery, visible, apiBaseUrl, runSearch])

  const handleSelect = (item: CatalogCardHit) => {
    setSelected(item)
  }

  const handleAdd = () => {
    if (!selected) return
    onAdd({
      cardName: selected.name,
      cardNumber: selected.number,
      set: selected.set,
      image: selected.imageUrl || undefined,
      catalogId: selected.id,
    })
    onClose()
  }

  const handleClose = () => {
    onClose()
  }

  const renderResult = ({ item }: { item: CatalogCardHit }) => {
    const isSelected = selected?.id === item.id
    const meta = [item.set, item.number ? `#${item.number}` : null].filter(Boolean).join(' · ')
    return (
      <TouchableOpacity
        style={[styles.resultRow, isSelected && styles.resultRowSelected]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.resultThumb}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.resultThumbImage} resizeMode="cover" />
          ) : (
            <View style={styles.resultThumbEmpty}>
              <Ionicons name="image-outline" size={18} color="rgba(255, 255, 255, 0.35)" />
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
        {isSelected ? (
          <Ionicons name="checkmark-circle" size={22} color={theme.tintColor || '#73EC8B'} />
        ) : (
          <Ionicons name="chevron-forward" size={18} color="rgba(255, 255, 255, 0.35)" />
        )}
      </TouchableOpacity>
    )
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayTouchable} activeOpacity={1} onPress={handleClose} />
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Add to ISO</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.textColor} />
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>Search cards from the catalog</Text>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="rgba(255, 255, 255, 0.5)" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Card name, set, or number…"
              placeholderTextColor="rgba(255, 255, 255, 0.35)"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color="rgba(255, 255, 255, 0.45)" />
              </TouchableOpacity>
            ) : null}
          </View>

          {searchLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={theme.tintColor || '#73EC8B'} />
              <Text style={styles.loadingText}>Searching catalog…</Text>
            </View>
          ) : null}

          {!searchLoading && searchError ? (
            <Text style={styles.errorText}>{searchError}</Text>
          ) : null}

          {!searchLoading && searchQuery.trim().length < 2 ? (
            <Text style={styles.emptyHint}>Type at least 2 characters to search</Text>
          ) : null}

          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderResult}
            style={styles.resultsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              !searchLoading && searchQuery.trim().length >= 2 && !searchError ? (
                <Text style={styles.emptyHint}>No matches</Text>
              ) : null
            }
          />

          {selected ? (
            <View style={styles.previewRow}>
              <View style={styles.previewThumb}>
                {selected.imageUrl ? (
                  <Image source={{ uri: selected.imageUrl }} style={styles.previewImage} resizeMode="cover" />
                ) : (
                  <Ionicons name="image-outline" size={20} color="rgba(255, 255, 255, 0.35)" />
                )}
              </View>
              <Text style={styles.previewLabel} numberOfLines={2}>
                {selected.name}
              </Text>
            </View>
          ) : null}

          <AppButton
            variant="filled"
            size="lg"
            icon="add-circle-outline"
            label="Add to ISO"
            fullWidth
            onPress={handleAdd}
            disabled={!selected}
          />
        </View>
      </View>
    </Modal>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    overlayTouchable: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    modalContainer: {
      backgroundColor: theme.backgroundColor,
      borderRadius: RADIUS.lg,
      width: '90%',
      maxWidth: 400,
      maxHeight: '85%',
      padding: SPACING.containerPadding,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.sm,
    },
    title: {
      fontSize: TYPOGRAPHY.h2,
      fontFamily: theme.boldFont,
      color: theme.textColor,
      fontWeight: '600',
      flex: 1,
    },
    closeButton: {
      padding: SPACING.xs,
      marginLeft: SPACING.sm,
    },
    hint: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.regularFont,
      color: 'rgba(255, 255, 255, 0.55)',
      marginBottom: SPACING.sm,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      backgroundColor: theme.cardBackground || '#000000',
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      marginBottom: SPACING.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.regularFont,
      color: theme.textColor,
      paddingVertical: SPACING.xs,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      marginBottom: SPACING.sm,
    },
    loadingText: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.regularFont,
      color: 'rgba(255, 255, 255, 0.6)',
    },
    errorText: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.regularFont,
      color: 'rgba(255, 200, 200, 0.9)',
      marginBottom: SPACING.sm,
    },
    emptyHint: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.regularFont,
      color: 'rgba(255, 255, 255, 0.45)',
      textAlign: 'center',
      paddingVertical: SPACING.lg,
    },
    resultsList: {
      maxHeight: 280,
      marginBottom: SPACING.md,
    },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.xs,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      marginBottom: SPACING.xs,
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
    resultRowSelected: {
      borderColor: theme.tintColor || '#73EC8B',
      backgroundColor: 'rgba(115, 236, 139, 0.12)',
    },
    resultThumb: {
      width: 40,
      height: 54,
      borderRadius: RADIUS.sm,
      overflow: 'hidden',
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    resultThumbImage: {
      width: '100%',
      height: '100%',
    },
    resultThumbEmpty: {
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
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      marginBottom: SPACING.md,
      padding: SPACING.sm,
      borderRadius: RADIUS.md,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    previewThumb: {
      width: 44,
      height: 60,
      borderRadius: RADIUS.sm,
      overflow: 'hidden',
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewImage: {
      width: '100%',
      height: '100%',
    },
    previewLabel: {
      flex: 1,
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
    },
  })

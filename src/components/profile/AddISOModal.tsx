import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, FlatList, Image } from 'react-native'
import { useContext, useState, useEffect, useMemo } from 'react'
import { Text } from '../ui/text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'
import { getPokemonTcgImageUrlFromSetNumberIfOnCdn } from '../../utils/pokemonTcgImages'

let TCG_SETS: { id: string; name: string }[] = []
try {
  const data = require('../../utils/pokemonTcgSets.json') as { sets?: { id: string; name: string }[] }
  TCG_SETS = Array.isArray(data.sets) ? data.sets : []
} catch {
  TCG_SETS = []
}

interface AddISOModalProps {
  visible: boolean
  onClose: () => void
  onAdd: (cardName: string, cardNumber: string, set: string) => void
  apiBaseUrl?: string
}

export function AddISOModal({
  visible,
  onClose,
  onAdd,
  apiBaseUrl,
}: AddISOModalProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [set, setSet] = useState('')
  const [setPickerVisible, setSetPickerVisible] = useState(false)
  const [setSearch, setSetSearch] = useState('')
  const [lookupResults, setLookupResults] = useState<{ id: string; name: string; set?: string; number?: string }[]>([])
  const [lookupLoading, setLookupLoading] = useState(false)

  const filteredSets = useMemo(() => {
    if (!setSearch.trim()) return TCG_SETS
    const q = setSearch.toLowerCase().trim()
    return TCG_SETS.filter((s) => s.name.toLowerCase().includes(q))
  }, [setSearch])

  useEffect(() => {
    if (visible) {
      setCardName('')
      setCardNumber('')
      setSet('')
      setSetPickerVisible(false)
      setSetSearch('')
      setLookupResults([])
    }
  }, [visible])

  const isValid = () => {
    return cardName.trim().length > 0
  }

  const handleLookupCard = async () => {
    const query = [cardName.trim(), cardNumber.trim(), set.trim()].filter(Boolean).join(' ')
    if (!query) {
      Alert.alert('Enter name or set', 'Type the card name (and optionally card number and set) first, then tap Look up card.')
      return
    }
    if (!apiBaseUrl) {
      Alert.alert('Not available', 'API URL not configured for card lookup.')
      return
    }
    setLookupLoading(true)
    setLookupResults([])
    try {
      const base = apiBaseUrl.replace(/\/$/, '')
      const url = `${base}/pokedata/search?query=${encodeURIComponent(query)}&asset_type=CARD`
      const res = await fetch(url)
      const data = await res.json()
      const results = data.results || []
      if (results.length === 0) {
        Alert.alert('No results', `No cards found for "${query}". Try a different name or set.`)
      } else {
        const list = results.map((r: any) => ({
          id: String(r.id),
          name: r.name || '',
          set: r.set,
          number: r.number ?? r.num ?? undefined,
        }))
        const num = cardNumber.trim()
        if (num) {
          list.sort((a, b) => {
            const aMatch = a.number?.toLowerCase() === num.toLowerCase() ? 1 : 0
            const bMatch = b.number?.toLowerCase() === num.toLowerCase() ? 1 : 0
            return bMatch - aMatch
          })
        }
        setLookupResults(list)
      }
    } catch (e: any) {
      Alert.alert('Lookup failed', e?.message || 'Could not search cards.')
    } finally {
      setLookupLoading(false)
    }
  }

  const handleSelectLookupCard = async (item: { id: string; name: string; set?: string; number?: string }) => {
    setCardName(item.name)
    if (item.number) setCardNumber(item.number)
    if (item.set && item.set.length > 6 && !/^[A-Z0-9]{2,5}$/i.test(item.set.trim())) setSet(item.set)
    setLookupResults([])
    if (!apiBaseUrl) return
    try {
      const base = apiBaseUrl.replace(/\/$/, '')
      const res = await fetch(`${base}/pokedata/card/${encodeURIComponent(item.id)}?asset_type=CARD`)
      const data = await res.json()
      if (data.setName != null || data.setId != null) setSet(String(data.setName ?? data.setId ?? ''))
      if (data.cardNumber != null) setCardNumber(String(data.cardNumber))
    } catch (_) {
      // keep form values from search result
    }
  }

  const handleAdd = () => {
    if (isValid()) {
      onAdd(cardName.trim(), cardNumber.trim(), set.trim())
      setCardName('')
      setCardNumber('')
      setSet('')
      setLookupResults([])
      onClose()
    }
  }

  const handleClose = () => {
    setCardName('')
    setCardNumber('')
    setSet('')
    setSetSearch('')
    setLookupResults([])
    setSetPickerVisible(false)
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Card to ISO</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {/* Card Name */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Card Name *</Text>
              <TextInput
                style={styles.textInput}
                value={cardName}
                onChangeText={setCardName}
                placeholder="e.g., Charizard ex"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                autoFocus
              />
            </View>

            {/* Card Number */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <TextInput
                style={styles.textInput}
                value={cardNumber}
                onChangeText={setCardNumber}
                placeholder="e.g., 223/165 or 172"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
              />
            </View>

            {/* Set: searchable picker (same as Add Card in Profile) */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Set</Text>
              <TouchableOpacity
                style={[styles.textInput, styles.setSelectorButton]}
                onPress={() => setSetPickerVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={set ? styles.setSelectorText : styles.setSelectorPlaceholder} numberOfLines={1}>
                  {set || 'Select set...'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="rgba(255, 255, 255, 0.5)" />
              </TouchableOpacity>
            </View>

            {/* Set picker modal */}
            <Modal visible={setPickerVisible} transparent animationType="slide">
              <View style={styles.setPickerBackdrop}>
                <TouchableOpacity
                  style={StyleSheet.absoluteFill}
                  activeOpacity={1}
                  onPress={() => { setSetPickerVisible(false); setSetSearch('') }}
                />
                <View style={styles.setPickerSheet}>
                  <View style={styles.setPickerHeader}>
                    <Text style={styles.setPickerTitle}>Select set</Text>
                    <TouchableOpacity onPress={() => { setSetPickerVisible(false); setSetSearch('') }} hitSlop={12}>
                      <Ionicons name="close" size={24} color={theme.textColor} />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={[styles.textInput, styles.setSearchInput]}
                    value={setSearch}
                    onChangeText={setSetSearch}
                    placeholder="Search sets..."
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  />
                  <FlatList
                    data={filteredSets}
                    keyExtractor={(item) => item.id}
                    style={styles.setPickerList}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.setPickerItem, set === item.name && styles.setPickerItemActive]}
                        onPress={() => {
                          setSet(item.name)
                          setSetPickerVisible(false)
                          setSetSearch('')
                        }}
                      >
                        <Text style={styles.setPickerItemText} numberOfLines={1}>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </View>
            </Modal>

            {/* Card image showcase – below Set */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Card preview</Text>
              {(() => {
                const displayUri = getPokemonTcgImageUrlFromSetNumberIfOnCdn(set, cardNumber)
                if (!displayUri) {
                  return (
                    <View style={styles.cardImageBox}>
                      <Ionicons name="image-outline" size={32} color="rgba(255, 255, 255, 0.3)" />
                      <Text style={styles.noImageText}>Select set & number or look up a card</Text>
                    </View>
                  )
                }
                return (
                  <View style={styles.cardImageBox}>
                    <Image
                      source={{ uri: displayUri }}
                      style={styles.cardImage}
                      resizeMode="contain"
                    />
                  </View>
                )
              })()}
            </View>

            {/* Look up card – same as Add Card in Profile */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Find the correct card</Text>
              <TouchableOpacity
                style={[styles.lookupButton, lookupLoading && styles.lookupButtonDisabled]}
                onPress={handleLookupCard}
                disabled={lookupLoading}
              >
                {lookupLoading ? (
                  <ActivityIndicator size="small" color={theme.textColor} />
                ) : (
                  <Text style={styles.lookupButtonText}>Look up card</Text>
                )}
              </TouchableOpacity>
              {lookupResults.length > 0 && (
                <View style={styles.lookupResults}>
                  <Text style={styles.lookupHint}>Tap to select (match # to your card)</Text>
                  {lookupResults.slice(0, 8).map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.lookupRow}
                      onPress={() => handleSelectLookupCard(item)}
                    >
                      {item.number ? (
                        <View style={styles.lookupNumberBadge}>
                          <Text style={styles.lookupNumberBadgeText}>#{item.number}</Text>
                        </View>
                      ) : null}
                      <View style={styles.lookupRowMain}>
                        <Text style={styles.lookupRowText} numberOfLines={1}>{item.name}</Text>
                        {item.set ? <Text style={styles.lookupRowSet} numberOfLines={1}>{item.set}</Text> : null}
                      </View>
                      <Text style={styles.lookupRowId}>ID: {item.id}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.addButton, !isValid() && styles.addButtonDisabled]}
              onPress={handleAdd}
              activeOpacity={0.8}
              disabled={!isValid()}
            >
              <Text style={styles.addButtonText}>Add to ISO</Text>
            </TouchableOpacity>
          </ScrollView>
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
      width: '85%',
      maxWidth: 400,
      maxHeight: '85%',
      padding: SPACING.containerPadding,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: SPACING.xs,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.lg,
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
    inputSection: {
      marginBottom: SPACING.lg,
    },
    inputLabel: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
      fontWeight: '600',
      marginBottom: SPACING.md,
    },
    textInput: {
      backgroundColor: theme.cardBackground || '#000000',
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      padding: SPACING.md,
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.regularFont,
      color: theme.textColor,
    },
    setSelectorButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    setSelectorText: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.regularFont,
      color: theme.textColor,
      flex: 1,
      marginRight: SPACING.sm,
    },
    setSelectorPlaceholder: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.regularFont,
      color: 'rgba(255, 255, 255, 0.3)',
      flex: 1,
      marginRight: SPACING.sm,
    },
    setPickerBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    setPickerSheet: {
      maxHeight: '70%',
      borderTopLeftRadius: RADIUS.lg,
      borderTopRightRadius: RADIUS.lg,
      backgroundColor: theme.backgroundColor,
      paddingBottom: SPACING.lg,
    },
    setPickerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    setPickerTitle: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
    },
    setSearchInput: {
      marginHorizontal: SPACING.md,
      marginTop: SPACING.sm,
    },
    setPickerList: {
      maxHeight: 320,
      marginTop: SPACING.sm,
      paddingHorizontal: SPACING.md,
    },
    setPickerItem: {
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.sm,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    setPickerItemActive: {
      backgroundColor: 'rgba(115, 236, 139, 0.15)',
      borderColor: theme.tintColor || '#73EC8B',
    },
    setPickerItemText: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.regularFont,
      color: theme.textColor,
    },
    cardImageBox: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      minHeight: 140,
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACING.sm,
    },
    cardImage: {
      width: '100%',
      height: 200,
      maxWidth: 180,
    },
    noImageText: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.regularFont,
      color: 'rgba(255, 255, 255, 0.5)',
      marginTop: SPACING.sm,
    },
    lookupButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: RADIUS.md,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    lookupButtonDisabled: {
      opacity: 0.6,
    },
    lookupButtonText: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
    },
    lookupHint: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.regularFont,
      color: 'rgba(255, 255, 255, 0.6)',
      marginTop: SPACING.sm,
      marginBottom: SPACING.xs,
    },
    lookupResults: {
      marginTop: SPACING.sm,
      gap: SPACING.xs,
    },
    lookupRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: SPACING.sm,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      gap: SPACING.sm,
    },
    lookupNumberBadge: {
      backgroundColor: theme.tintColor || '#73EC8B',
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
      borderRadius: RADIUS.sm,
      minWidth: 36,
      alignItems: 'center',
    },
    lookupNumberBadgeText: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.semiBoldFont,
      color: '#000',
    },
    lookupRowMain: {
      flex: 1,
      minWidth: 0,
    },
    lookupRowText: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
    },
    lookupRowSet: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.regularFont,
      color: 'rgba(255, 255, 255, 0.6)',
      marginTop: 2,
    },
    lookupRowId: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.regularFont,
      color: 'rgba(255, 255, 255, 0.5)',
    },
    addButton: {
      backgroundColor: theme.tintColor || '#73EC8B',
      borderRadius: RADIUS.md,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: SPACING.lg,
    },
    addButtonDisabled: {
      backgroundColor: 'rgba(115, 236, 139, 0.3)',
      opacity: 0.5,
    },
    addButtonText: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.semiBoldFont,
      color: '#000000',
      fontWeight: '600',
    },
  })

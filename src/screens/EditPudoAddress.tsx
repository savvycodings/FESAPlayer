import React, { useContext, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { ThemeContext } from '../context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { SPACING, TYPOGRAPHY, RADIUS } from '../constants/layout'
import { authClient } from '../lib/auth-client'
import { DOMAIN } from '../../constants'

export function EditPudoAddress() {
  const { theme } = useContext(ThemeContext)
  const navigation = useNavigation()
  const [pudoAddress, setPudoAddress] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const styles = getStyles(theme)

  const fetchData = async () => {
    try {
      const session = await authClient.getSession()
      if (!session?.data?.session) {
        setLoading(false)
        return
      }
      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const res = await fetch(`${baseUrl}/api/profile/user`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.data.session.token}` },
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok && data.user) setPudoAddress(data.user.pudoAddress || '')
    } catch (_) {
      setPudoAddress('')
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(useCallback(() => { fetchData() }, []))

  const handleSave = async () => {
    const session = await authClient.getSession()
    if (!session?.data?.session) {
      Alert.alert('Error', 'Please log in')
      return
    }
    setSaving(true)
    const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
    try {
      const res = await fetch(`${baseUrl}/api/profile/user`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.data.session.token}` },
        credentials: 'include',
        body: JSON.stringify({ pudoAddress: pudoAddress.trim() || undefined }),
      })
      const data = await res.json()
      if (res.ok) {
        Alert.alert('Saved', 'Pudo address updated.')
        navigation.goBack()
      } else {
        Alert.alert('Error', data.message || 'Failed to save')
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.tintColor || '#73EC8B'} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pudo address</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.formSection}>
        <Text style={styles.label}>Pudo address</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your Pudo address"
          placeholderTextColor={theme.mutedForegroundColor}
          value={pudoAddress}
          onChangeText={setPudoAddress}
          autoCapitalize="none"
        />
      </View>
    </View>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.backgroundColor },
    centered: { justifyContent: 'center', alignItems: 'center' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    },
    backButton: { padding: SPACING.xs },
    headerTitle: {
      fontSize: TYPOGRAPHY.h4,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
    },
    saveButton: {},
    saveButtonText: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.semiBoldFont,
      color: theme.tintColor || '#73EC8B',
    },
    formSection: { padding: SPACING.containerPadding },
    label: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.semiBoldFont,
      color: theme.mutedForegroundColor,
      marginBottom: SPACING.xs,
    },
    input: {
      backgroundColor: theme.cardBackground || 'rgba(255, 255, 255, 0.05)',
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.1)',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.regularFont,
      color: theme.textColor,
    },
  })

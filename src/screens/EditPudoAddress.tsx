import React, { useContext, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { ThemeContext } from '../context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { SPACING, TYPOGRAPHY } from '../constants/layout'
import { authClient } from '../lib/auth-client'
import { DOMAIN } from '../../constants'
import { FormScreen, ThemedTextField } from '../components/form'
import { ScreenSafeArea } from '../components/layout/ScreenSafeArea'

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
      <ScreenSafeArea style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.tintColor || '#73EC8B'} />
        </View>
      </ScreenSafeArea>
    )
  }

  return (
    <ScreenSafeArea style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pudo address</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
      <FormScreen contentContainerStyle={styles.formSection}>
        <ThemedTextField
          label="Pudo address"
          placeholder="Enter your Pudo address"
          value={pudoAddress}
          onChangeText={setPudoAddress}
          autoCapitalize="none"
          icon="location-outline"
        />
      </FormScreen>
    </ScreenSafeArea>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.backgroundColor },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.containerPadding * 2,
      paddingVertical: SPACING.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    },
    backButton: { padding: SPACING.xs },
    headerTitle: {
      flex: 1,
      fontSize: TYPOGRAPHY.h3,
      fontFamily: theme.boldFont,
      color: theme.textColor,
      textAlign: 'center',
    },
    saveButton: { padding: SPACING.xs },
    saveButtonText: {
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.semiBoldFont,
      color: theme.tintColor || '#73EC8B',
    },
    formSection: {
      paddingHorizontal: SPACING.containerPadding * 2,
      paddingTop: SPACING['2xl'],
    },
  })

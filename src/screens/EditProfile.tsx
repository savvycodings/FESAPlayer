import React, { useContext, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker'
import { ThemeContext } from '../context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { SPACING, TYPOGRAPHY, RADIUS } from '../constants/layout'
import { authClient } from '../lib/auth-client'
import { DOMAIN } from '../../constants'
import { uploadImage } from '../utils/imageUpload'
import { FormScreen, ThemedTextField } from '../components/form'

const { width } = Dimensions.get('window')
const BANNER_HEIGHT = 120

export function EditProfile() {
  const { theme } = useContext(ThemeContext)
  const navigation = useNavigation()
  const [user, setUser] = useState<any>(null)
  const [store, setStore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [name, setName] = useState('')
  const [storeName, setStoreName] = useState('')
  const [twitchUrl, setTwitchUrl] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const styles = getStyles(theme)

  const fetchData = async () => {
    try {
      const session = await authClient.getSession()
      if (!session?.data?.session) {
        setLoading(false)
        return
      }
      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const token = session.data.session.token
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

      const [userRes, storeRes] = await Promise.all([
        fetch(`${baseUrl}/api/profile/user`, { method: 'GET', headers, credentials: 'include' }),
        fetch(`${baseUrl}/api/store`, { method: 'GET', headers, credentials: 'include' }),
      ])
      const userData = await userRes.json()
      const storeData = await storeRes.json()

      if (userRes.ok && userData.user) {
        setUser(userData.user)
        setName(userData.user.firstName || userData.user.name || '')
      }
      if (storeRes.ok && storeData.store) {
        setStore(storeData.store)
        setStoreName(storeData.store.storeName || '')
        setTwitchUrl(storeData.store.twitchUrl || '')
        setYoutubeUrl(storeData.store.youtubeUrl || '')
      } else {
        setStoreName('')
        setTwitchUrl('')
        setYoutubeUrl('')
      }
    } catch (_) {
      setUser(null)
      setStore(null)
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchData()
    }, [])
  )

  const handleChangeAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required to change your profile picture.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
    })
    if (result.canceled || !result.assets[0]) return
    setAvatarUploading(true)
    try {
      const session = await authClient.getSession()
      if (!session?.data?.session) {
        Alert.alert('Error', 'Please log in')
        return
      }
      const imageUrl = await uploadImage(result.assets[0].uri, 'gradeit/avatars')
      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const res = await fetch(`${baseUrl}/api/profile/user`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.data.session.token}` },
        credentials: 'include',
        body: JSON.stringify({ avatar: imageUrl }),
      })
      if (res.ok) {
        await fetchData()
        Alert.alert('Saved', 'Profile picture updated. It will update everywhere your profile is shown.')
      } else {
        const data = await res.json()
        Alert.alert('Error', data.message || 'Failed to update profile picture')
      }
    } catch (e: any) {
      Alert.alert('Upload Error', e?.message || 'Failed to upload image')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleChangeBanner = async () => {
    if (!store) {
      Alert.alert('No store', 'Create your store from the My Store tab first, then you can set a banner here.')
      return
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required to change your store banner.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [3, 1],
    })
    if (result.canceled || !result.assets[0]) return
    setBannerUploading(true)
    try {
      const session = await authClient.getSession()
      if (!session?.data?.session) {
        Alert.alert('Error', 'Please log in')
        return
      }
      const imageUrl = await uploadImage(result.assets[0].uri, 'gradeit/banners')
      const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
      const res = await fetch(`${baseUrl}/api/store`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.data.session.token}` },
        credentials: 'include',
        body: JSON.stringify({ bannerUrl: imageUrl }),
      })
      if (res.ok) {
        await fetchData()
        Alert.alert('Saved', 'Store banner updated. It will update on your store page.')
      } else {
        const data = await res.json()
        Alert.alert('Error', data.message || 'Failed to update banner')
      }
    } catch (e: any) {
      Alert.alert('Upload Error', e?.message || 'Failed to upload image')
    } finally {
      setBannerUploading(false)
    }
  }

  const handleSave = async () => {
    const session = await authClient.getSession()
    if (!session?.data?.session) {
      Alert.alert('Error', 'Please log in')
      return
    }
    setSaving(true)
    const baseUrl = DOMAIN?.endsWith('/') ? DOMAIN.slice(0, -1) : DOMAIN
    const token = session.data.session.token
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

    try {
      await fetch(`${baseUrl}/api/profile/user`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim() || undefined,
          firstName: name.trim() || undefined,
        }),
      })
      if (store) {
        await fetch(`${baseUrl}/api/store`, {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            storeName: storeName.trim() || undefined,
            twitchUrl: twitchUrl.trim() || undefined,
            youtubeUrl: youtubeUrl.trim() || undefined,
          }),
        })
      }
      Alert.alert('Saved', 'Name and store name updated. They will update everywhere in the app.')
      await fetchData()
      navigation.goBack()
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const hasAvatar = !!user?.avatar
  const bannerUri = store?.bannerUrl ? { uri: store.bannerUrl } : null

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
        <Text style={styles.headerTitle}>Edit profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <FormScreen contentContainerStyle={styles.scrollContent}>
        {/* Profile picture centered on top – tap to change (updates everywhere your profile picture appears) */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleChangeAvatar} disabled={avatarUploading} activeOpacity={0.8}>
            {avatarUploading ? (
              <View style={[styles.avatar, styles.avatarUploading]}>
                <ActivityIndicator size="large" color={theme.tintColor || '#73EC8B'} />
              </View>
            ) : hasAvatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <View style={styles.avatarEmpty}>
                <Ionicons name="person-outline" size={48} color={theme.mutedForegroundColor} />
                <Text style={styles.avatarEmptyText}>Tap to add photo</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.tapHint}>Tap to change photo</Text>
        </View>

        {/* Name and store name above the banner */}
        <View style={styles.formSection}>
          <ThemedTextField
            label="Name"
            placeholder="Your name"
            value={name}
            onChangeText={setName}
            icon="person-outline"
          />
          <ThemedTextField
            label="Store name"
            placeholder="Store name"
            value={storeName}
            onChangeText={setStoreName}
            icon="storefront-outline"
          />
          {store && (
            <>
              <ThemedTextField
                label="Twitch URL"
                placeholder="https://twitch.tv/yourchannel"
                value={twitchUrl}
                onChangeText={setTwitchUrl}
                autoCapitalize="none"
                keyboardType="url"
                icon="logo-twitch"
              />
              <ThemedTextField
                label="YouTube URL"
                placeholder="https://youtube.com/@yourchannel"
                value={youtubeUrl}
                onChangeText={setYoutubeUrl}
                autoCapitalize="none"
                keyboardType="url"
                icon="logo-youtube"
              />
            </>
          )}
        </View>

        {/* Store banner below – tap to change (updates on My Store page) */}
        <View style={styles.bannerSection}>
          <Text style={styles.bannerLabel}>Store banner</Text>
          <TouchableOpacity onPress={handleChangeBanner} disabled={bannerUploading} activeOpacity={0.8}>
            {bannerUploading ? (
              <View style={[styles.bannerPlaceholder, styles.bannerUploading]}>
                <ActivityIndicator size="large" color={theme.tintColor || '#73EC8B'} />
              </View>
            ) : bannerUri ? (
              <Image source={bannerUri} style={styles.bannerImage} resizeMode="cover" />
            ) : (
              <View style={styles.bannerPlaceholder}>
                <Ionicons name="image-outline" size={40} color={theme.mutedForegroundColor} />
                <Text style={styles.bannerPlaceholderText}>Tap to add banner</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </FormScreen>
    </View>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor || 'rgba(255, 255, 255, 0.08)',
    },
    backButton: {
      padding: SPACING.xs,
    },
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
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: SPACING['4xl'],
    },
    avatarSection: {
      alignItems: 'center',
      paddingVertical: SPACING['2xl'],
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 3,
      borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.2)',
      backgroundColor: theme.cardBackground || '#1a1a1a',
    },
    avatarUploading: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarEmpty: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 2,
      borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.15)',
      borderStyle: 'dashed',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarEmptyText: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor,
      marginTop: SPACING.xs,
    },
    tapHint: {
      marginTop: SPACING.xs,
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor,
    },
    formSection: {
      paddingHorizontal: SPACING.containerPadding,
      marginBottom: SPACING.xl,
    },
    inputWrap: {
      marginBottom: SPACING.lg,
    },
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
    bannerSection: {
      paddingHorizontal: SPACING.containerPadding,
    },
    bannerLabel: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.semiBoldFont,
      color: theme.mutedForegroundColor,
      marginBottom: SPACING.sm,
    },
    bannerImage: {
      width: width - SPACING.containerPadding * 2,
      height: BANNER_HEIGHT,
      borderRadius: RADIUS.md,
      backgroundColor: theme.cardBackground || '#1a1a1a',
    },
    bannerPlaceholder: {
      width: width - SPACING.containerPadding * 2,
      height: BANNER_HEIGHT,
      borderRadius: RADIUS.md,
      backgroundColor: theme.cardBackground || 'rgba(255, 255, 255, 0.05)',
      borderWidth: 1,
      borderColor: theme.borderColor || 'rgba(255, 255, 255, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    bannerUploading: {
      minHeight: BANNER_HEIGHT,
    },
    bannerPlaceholderText: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor,
      marginTop: SPACING.xs,
    },
  })

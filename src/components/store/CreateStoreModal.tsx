import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native'
import { useContext } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Text } from '../ui/text'
import { AppButton } from '../ui/AppButton'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS, LISTING_TILE_BORDER } from '../../constants/layout'
import { isIOS } from '../../utils/platformHelpers'

export interface CreateStoreModalProps {
  visible: boolean
  storeName: string
  twitchUrl: string
  youtubeUrl: string
  creating: boolean
  onStoreNameChange: (value: string) => void
  onTwitchUrlChange: (value: string) => void
  onYoutubeUrlChange: (value: string) => void
  onCreate: () => void
  /** When true, user must create a store (no dismiss). */
  required?: boolean
}

export function CreateStoreModal({
  visible,
  storeName,
  twitchUrl,
  youtubeUrl,
  creating,
  onStoreNameChange,
  onTwitchUrlChange,
  onYoutubeUrlChange,
  onCreate,
}: CreateStoreModalProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const canCreate = storeName.trim().length > 0

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={isIOS ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Create Your Store</Text>

            <TextInput
              style={styles.input}
              placeholder="Store name (required)"
              placeholderTextColor={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.5)'}
              value={storeName}
              onChangeText={onStoreNameChange}
              autoCapitalize="words"
            />

            <View style={styles.inputRow}>
              <Ionicons
                name="logo-twitch"
                size={20}
                color={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.5)'}
              />
              <TextInput
                style={[styles.input, styles.inputFlex]}
                placeholder="Twitch URL (optional)"
                placeholderTextColor={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.5)'}
                value={twitchUrl}
                onChangeText={onTwitchUrlChange}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            <View style={styles.inputRow}>
              <Ionicons
                name="logo-youtube"
                size={20}
                color={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.5)'}
              />
              <TextInput
                style={[styles.input, styles.inputFlex]}
                placeholder="YouTube URL (optional)"
                placeholderTextColor={theme.mutedForegroundColor || 'rgba(255, 255, 255, 0.5)'}
                value={youtubeUrl}
                onChangeText={onYoutubeUrlChange}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            <View style={styles.createButtonRow}>
              <AppButton
                variant="accent"
                size="md"
                icon="storefront-outline"
                label={creating ? 'Creating…' : 'Create Store'}
                disabled={creating || !canCreate}
                onPress={onCreate}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function getStyles(theme: {
  textColor?: string
  cardBackground?: string
  mutedForegroundColor?: string
  boldFont?: string
  regularFont?: string
  semiBoldFont?: string
}) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'center',
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: SPACING.lg,
    },
    card: {
      width: '100%',
      maxWidth: 400,
      alignSelf: 'center',
      backgroundColor: theme.cardBackground || '#000000',
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: LISTING_TILE_BORDER,
      padding: SPACING.xl,
    },
    title: {
      fontSize: TYPOGRAPHY.h3,
      fontFamily: theme.boldFont,
      color: theme.textColor,
      textAlign: 'center',
      marginBottom: SPACING.lg,
    },
    input: {
      borderWidth: 1,
      borderColor: LISTING_TILE_BORDER,
      borderRadius: RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      fontSize: TYPOGRAPHY.body,
      fontFamily: theme.regularFont,
      color: theme.textColor,
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      marginBottom: SPACING.sm,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      marginBottom: SPACING.sm,
    },
    inputFlex: {
      flex: 1,
      marginBottom: 0,
    },
    createButtonRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: SPACING.md,
    },
  })
}

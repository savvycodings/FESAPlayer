import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { useContext, useState } from 'react'
import { Text } from '../ui/text'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { SPACING, TYPOGRAPHY, RADIUS } from '../../constants/layout'

interface StoreCustomizationProps {
  storeName: string
  description: string
  bannerUrl?: string
  onSave: (data: { name: string; description: string; bannerUrl?: string }) => void
  onCancel: () => void
}

export function StoreCustomization({
  storeName: initialName,
  description: initialDescription,
  bannerUrl: initialBannerUrl,
  onSave,
  onCancel,
}: StoreCustomizationProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [storeName, setStoreName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [bannerUrl, setBannerUrl] = useState(initialBannerUrl)

  const handleSave = () => {
    onSave({ name: storeName, description, bannerUrl })
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Store Name</Text>
        <Input
          placeholder="Enter store name"
          value={storeName}
          onChangeText={setStoreName}
          style={styles.input}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Store Description</Text>
        <Textarea
          placeholder="Describe what you're selling..."
          value={description}
          onChangeText={setDescription}
          style={styles.textarea}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Store Banner</Text>
        <TouchableOpacity
          style={styles.bannerUpload}
          activeOpacity={0.7}
          onPress={() => {
            // TODO: Implement image picker
          }}
        >
          {bannerUrl ? (
            <Text style={styles.bannerText}>Banner Image Set</Text>
          ) : (
            <>
              <Ionicons
                name="image-outline"
                size={32}
                color="rgba(255, 255, 255, 0.5)"
              />
              <Text style={styles.bannerText}>Upload Banner</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <Button
          variant="outline"
          onPress={onCancel}
          style={styles.cancelButton}
        >
          <Text>Cancel</Text>
        </Button>
        <Button
          onPress={handleSave}
          style={styles.saveButton}
        >
          <Text>Save Changes</Text>
        </Button>
      </View>
    </ScrollView>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: SPACING['2xl'],
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.h4,
    fontFamily: theme.semiBoldFont,
    color: theme.textColor,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  input: {
    marginBottom: 0,
  },
  textarea: {
    minHeight: 100,
    marginBottom: 0,
  },
  bannerUpload: {
    height: 120,
    borderRadius: RADIUS.md,
    backgroundColor: theme.cardBackground || '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerText: {
    fontSize: TYPOGRAPHY.body,
    fontFamily: theme.regularFont,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: SPACING.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING['2xl'],
    marginBottom: SPACING['4xl'],
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
})

import { View, StyleSheet, Modal, ScrollView, Pressable, TouchableOpacity } from 'react-native'
import { useContext } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext } from '../../context'
import { Text } from '../ui/text'
import {
  VERIFICATION_TERMS_TITLE,
  VERIFICATION_TERMS_SECTIONS,
} from '../../data/verificationTerms'
import { SPACING, TYPOGRAPHY, RADIUS, LISTING_TILE_BORDER } from '../../constants/layout'

type Props = {
  visible: boolean
  onClose: () => void
}

export function VerificationTermsSheet({ visible, onClose }: Props) {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayTouchable} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {VERIFICATION_TERMS_TITLE}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={theme.textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {VERIFICATION_TERMS_SECTIONS.map((section, sIdx) => (
              <View key={`section-${sIdx}`} style={styles.section}>
                {section.heading ? (
                  <Text style={styles.sectionHeading}>{section.heading}</Text>
                ) : null}
                {section.paragraphs.map((p, pIdx) => (
                  <Text key={`p-${sIdx}-${pIdx}`} style={styles.paragraph}>
                    {p}
                  </Text>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const getStyles = (theme: {
  textColor?: string
  cardBackground?: string
  boldFont?: string
  semiBoldFont?: string
  regularFont?: string
}) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.containerPadding,
    },
    overlayTouchable: {
      ...StyleSheet.absoluteFillObject,
    },
    sheet: {
      width: '100%',
      maxWidth: 440,
      maxHeight: '88%',
      backgroundColor: theme.cardBackground || '#1a1a1a',
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: LISTING_TILE_BORDER,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.cardPadding,
      paddingTop: SPACING.cardPadding,
      paddingBottom: SPACING.sm,
      gap: SPACING.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerTitle: {
      flex: 1,
      fontSize: TYPOGRAPHY.h4,
      fontFamily: theme.boldFont,
      color: theme.textColor,
      fontWeight: '600',
    },
    closeButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: {
      flexShrink: 1,
    },
    scrollContent: {
      padding: SPACING.cardPadding,
      paddingBottom: SPACING.xl,
    },
    section: {
      marginBottom: SPACING.md,
    },
    sectionHeading: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
      fontWeight: '600',
      marginBottom: SPACING.xs,
    },
    paragraph: {
      fontSize: TYPOGRAPHY.caption,
      fontFamily: theme.regularFont,
      color: 'rgba(255, 255, 255, 0.75)',
      lineHeight: Math.round(TYPOGRAPHY.caption * 1.45),
      marginBottom: SPACING.sm,
    },
  })

import { useContext, type ReactNode } from 'react'
import { View, TextInput, type TextInputProps, type ViewStyle } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Text } from '../ui/text'
import { ThemeContext } from '../../context'
import { getFormFieldStyles } from '../../constants/formField'

type ThemedTextFieldProps = TextInputProps & {
  label?: string
  hint?: string
  icon?: keyof typeof Ionicons.glyphMap
  rightAccessory?: ReactNode
  containerStyle?: ViewStyle
  multiline?: boolean
}

export function ThemedTextField({
  label,
  hint,
  icon,
  rightAccessory,
  containerStyle,
  multiline,
  style,
  ...textInputProps
}: ThemedTextFieldProps) {
  const { theme } = useContext(ThemeContext)
  const styles = getFormFieldStyles(theme)

  return (
    <View style={[styles.fieldWrap, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputRow, multiline && styles.inputRowMultiline]}>
        {icon ? (
          <Ionicons
            name={icon}
            size={20}
            color={theme.mutedForegroundColor}
            style={[styles.inputIcon, multiline && { marginTop: 2 }]}
          />
        ) : null}
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline, style]}
          placeholderTextColor={theme.mutedForegroundColor}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...textInputProps}
        />
        {rightAccessory}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  )
}

import {
  StyleSheet, View
} from 'react-native'
import { useContext } from 'react'
import { Icon } from './Icon'
import { ThemeContext, AppContext } from '../context'
import FontAwesome from '@expo/vector-icons/FontAwesome5'
import { Button } from './ui/button'

export function Header() {
  const { theme } = useContext(ThemeContext)
  const {
    handlePresentModalPress
  } = useContext(AppContext)
  const styles = getStyles(theme)

  return (
    <View style={styles.container}>
      <Icon size={34} fill={theme.textColor} />
      <Button
        variant="ghost"
        size="icon"
        onPress={handlePresentModalPress}
        className="absolute right-0 p-4"
      >
        <FontAwesome
          name="ellipsis-h"
          size={20}
          color={theme.textColor}
        />
      </Button>
    </View>
  )
}

function getStyles(theme:any) {
  return StyleSheet.create({
    container: {
      paddingVertical: 15,
      backgroundColor: theme.backgroundColor,
      justifyContent: 'center',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor
    }
  })
}
import { useContext } from 'react'
import { ThemeContext, AppContext } from '../context'
import { MODELS } from '../../constants'
import { View, StyleSheet } from 'react-native'
import { Text } from './ui/text'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function ChatModelModal({ handlePresentModalPress }) {
  const { theme } = useContext(ThemeContext)
  const { setChatType, chatType } = useContext(AppContext)
  const styles = getStyles(theme)
  const options = Object.values(MODELS)

  function _setChatType(v) {
    setChatType(v)
    handlePresentModalPress()
  }

  return (
    <Card className="mx-3.5 mb-6 rounded-[20px] border" style={styles.bottomSheetContainer}>
      <CardHeader className="pb-0">
        <CardTitle className="text-center">
          <Text variant="h4" style={styles.chatOptionsText}>
            Language Models
          </Text>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {
          options.map((option, index) => (
            <Button
              key={index}
              variant={chatType.label === option.label ? "default" : "ghost"}
              className="mb-2.5 flex-row items-center justify-center"
              style={optionContainer(theme, chatType.label, option.label)}
              onPress={() => _setChatType(option)}
            >
              <option.icon
                size={20}
                theme={theme}
                selected={chatType.label === option.label}
              />
              <Text style={optionText(theme, chatType.label, option.label)}>
                {option.name}
              </Text>
            </Button>
          ))
        }
      </CardContent>
    </Card>
  )
}

function getStyles(theme) {
  return StyleSheet.create({
    chatOptionsText: {
      color: theme.textColor,
      textAlign: 'center',
      fontSize: 16,
      fontFamily: theme.semiBoldFont,
    },
    bottomSheetContainer: {
      borderColor: theme.borderColor,
      backgroundColor: theme.backgroundColor,
    }
  })
}

function optionContainer(theme, baseType, type) {
  const selected = baseType === type
  return {
    backgroundColor: selected ? theme.tintColor : theme.backgroundColor,
    padding: 12,
    borderRadius: 8,
    marginBottom: 9,
    flexDirection: 'row' as 'row',
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
  }
}

function optionText(theme, baseType, type) {
  const selected = baseType === type
  return {
    color: selected ? theme.tintTextColor : theme.textColor,
    fontFamily: theme.boldFont,
    fontSize: 15,
    shadowColor: 'rgba(0, 0, 0, .2)',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 2,
    marginLeft: 5
  }
}
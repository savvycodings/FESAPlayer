import { Alert } from 'react-native'
import { AppButton } from '../ui/AppButton'

interface ShareLinkButtonProps {
  storeLink: string
}

export function ShareLinkButton({ storeLink }: ShareLinkButtonProps) {
  const handleCopy = () => {
    Alert.alert('Link Copied!', `Store link: ${storeLink}`)
  }

  return (
    <AppButton
      variant="outline"
      size="sm"
      icon="link-outline"
      onPress={handleCopy}
    />
  )
}

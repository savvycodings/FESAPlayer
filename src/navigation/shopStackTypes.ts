import type { BlogStackParams } from '../screens/blogPost'

/** Shop tab stack routes */
export type ShopStackParamList = {
  ShopMain: undefined
  BlogList: undefined
  BlogPost: BlogStackParams['BlogPost']
  Product: {
    id?: string
    name: string
    image: any
    category?: 'product' | 'set' | 'single' | 'featured' | 'listing'
    price?: number
    description?: string
    listingId?: number
    storeId?: number
    sellerId?: string
  }
  SetProducts: {
    setName: string
    setImage: any
  }
  ViewProfile: {
    userId: string
    userName: string
    userImage?: any
    userInitials?: string
    verified?: boolean
    storeId?: number
  }
}

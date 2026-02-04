# My Store Feature - Design Document

## Overview
Transform the "Settings" tab into a comprehensive "My Store" feature that allows users to create, customize, and manage their own card store with advanced features like bidding, vaulting status, user levels, and trust indicators.

---

## Core Features

### 1. Store Customization
- **Store Title**: Custom name for the store
- **Store Banner**: Upload custom banner image (header image)
- **Store Description**: Text description of what they're selling
- **Shareable Link**: Unique URL that can be copied and shared
  - Format: `saplayer.app/store/[username]` or `saplayer.app/store/[store-id]`
  - Copy button with toast notification

### 2. Product Listings
- **Card Image**: Photo of the card
- **Card Name**: Title/name of the card
- **Price**: Listing price
- **Vaulting Status Badge**: 
  - 🟢 "Vaulted by SA Player" - Card is in our vault (highest trust)
  - 🟡 "Seller Has Card" - User has the card (medium trust)
  - 🔴 "No Verification" - Unverified (lowest trust)
- **Condition**: Card condition (if applicable)
- **Set Information**: Which set the card is from

### 3. Purchase Options

#### Instant Buy
- Fixed price that buyers can purchase immediately
- "Buy Now" button
- One-click purchase flow

#### Bidding System
- Users can place bids on cards
- Show current highest bid
- Bid history visible to seller
- Seller can:
  - Accept a bid (sells immediately to that bidder)
  - Let auction run (auto-accept highest bid at end time)
  - Reject bids
- Buyers can:
  - Place new bid
  - Increase existing bid
  - See bid count and highest bidder (anonymized or visible)

### 4. User Levels & Progress System

#### Vertical Progress Bar
- Shows overall store level (e.g., Level 1, 2, 3...)
- Visual progress bar on side of profile/store
- Unlocks features at certain levels

#### Horizontal Progress Bar
- Shows progress toward next level
- XP points from:
  - Successful sales
  - Positive reviews
  - Cards vaulted
  - Store engagement

#### Level Benefits
- **Level 1**: Basic store, 5 listings
- **Level 2**: 10 listings, custom banner
- **Level 3**: 20 listings, priority in search
- **Level 4**: 50 listings, verified badge
- **Level 5+**: Unlimited listings, featured store placement

### 5. Trust & Verification Indicators

#### Verification Rings Around Profile Icon
- **Bronze Ring**: 1-5 successful sales
- **Silver Ring**: 6-15 successful sales
- **Gold Ring**: 16-30 successful sales
- **Platinum Ring**: 31-50 successful sales
- **Diamond Ring**: 50+ successful sales
- Animated glow effect for higher tiers

#### Store Badges
- "Verified Seller" badge
- "Vaulted Store" badge (if all cards are vaulted)
- "Top Seller" badge
- "Fast Shipper" badge
- Achievement badges for milestones

### 6. Vaulting Status System

#### Card Status Indicators
- **Vaulted Icon**: Shield with checkmark (green)
  - Card is in SA Player vault
  - Highest level of protection
  - Buyers can filter to only see vaulted cards
- **Seller Has Card Icon**: Card icon (yellow)
  - Seller has the card
  - Medium trust level
- **No Verification Icon**: Warning icon (red)
  - Unverified status
  - Lowest trust level

#### Safety Filter
- Toggle: "Only show vaulted cards"
- For buyers who want maximum safety
- Only displays cards that are in SA Player vault

### 7. Store Analytics & Stats
- Total sales count
- Total revenue
- Average sale price
- Response time
- Positive review percentage
- Cards currently listed
- Active bids count

### 8. Discord Integration
- Link Discord account
- Show Discord username/avatar
- Option to contact via Discord
- Discord verification badge

### 9. Store Items/Upgrades (In-App Purchases)
- **Store Themes**: Different color schemes
- **Premium Banners**: Animated or premium banner templates
- **Listing Boosts**: Feature store in search results
- **Analytics Pro**: Advanced analytics dashboard
- **Custom Domain**: Custom store URL
- **Priority Support**: Faster customer support

---

## UI/UX Design

### Store Header Section
```
┌─────────────────────────────────────┐
│  [Custom Banner Image]              │
│                                     │
│  [Profile Icon with Rings]  Store   │
│                      Name           │
│  [Level Badge] [Verified Badge]    │
│  [Share Link Button]                │
└─────────────────────────────────────┘
```

### Product Card Design
```
┌─────────────────────┐
│  [Card Image]       │
│  [Vault Status]     │
│                     │
│  Card Name          │
│  $XX.XX             │
│                     │
│  [Bid: $XX] or      │
│  [Buy Now]          │
└─────────────────────┘
```

### Progress Indicators
- **Vertical**: Side bar showing level with XP progress
- **Horizontal**: Under store name showing progress to next level

### Store Customization Panel
- Banner upload
- Store title input
- Description textarea
- Color scheme selector
- Preview mode

---

## User Flows

### Creating a Store
1. User clicks "My Store" tab
2. If no store exists, show onboarding:
   - "Create Your Store"
   - Enter store name
   - Upload banner (optional)
   - Add description
   - Set up payment info
3. Store is created with unique link

### Adding a Product
1. Click "Add Listing" button
2. Upload card image(s)
3. Enter card details (name, set, condition)
4. Set price or enable bidding
5. Choose vaulting status
6. Publish listing

### Bidding Flow
1. Buyer views card
2. Sees current highest bid or starting price
3. Enters bid amount
4. Confirms bid
5. Seller receives notification
6. Seller can accept/reject or wait

### Purchase Flow (Instant Buy)
1. Buyer clicks "Buy Now"
2. Confirmation screen with card details
3. Payment processing
4. Order confirmation
5. Seller notified
6. Shipping/tracking (if applicable)

---

## Technical Considerations

### Data Structure
```typescript
interface Store {
  id: string
  userId: string
  name: string
  bannerUrl?: string
  description: string
  shareableLink: string
  level: number
  xp: number
  totalSales: number
  totalRevenue: number
  verified: boolean
  discordUsername?: string
  createdAt: Date
  updatedAt: Date
}

interface StoreListing {
  id: string
  storeId: string
  cardImage: string
  cardName: string
  price: number
  vaultingStatus: 'vaulted' | 'seller-has' | 'unverified'
  condition?: string
  set?: string
  purchaseType: 'instant' | 'bid' | 'both'
  currentBid?: number
  bidEndDate?: Date
  bids: Bid[]
  status: 'active' | 'sold' | 'ended'
  createdAt: Date
}

interface Bid {
  id: string
  listingId: string
  userId: string
  amount: number
  status: 'pending' | 'accepted' | 'rejected' | 'outbid'
  createdAt: Date
}
```

### Components Needed
1. `StoreHeader.tsx` - Customizable header with banner
2. `StoreStats.tsx` - Analytics and stats display
3. `StoreListings.tsx` - Grid/list of products
4. `ListingCard.tsx` - Individual product card
5. `BidModal.tsx` - Bidding interface
6. `StoreCustomization.tsx` - Settings for store
7. `ProgressBars.tsx` - Vertical and horizontal progress
8. `VerificationRings.tsx` - Animated rings around profile
9. `VaultingBadge.tsx` - Status indicators
10. `ShareLinkButton.tsx` - Copy shareable link

---

## Design System Integration

### Colors
- Use existing design system colors
- Add store-specific accent colors for levels:
  - Bronze: `#CD7F32`
  - Silver: `#C0C0C0`
  - Gold: `#FFD700`
  - Platinum: `#E5E4E2`
  - Diamond: `#B9F2FF`

### Typography
- Use `TYPOGRAPHY` constants from design system
- Store names: `TYPOGRAPHY.h2`
- Product names: `TYPOGRAPHY.h4`
- Prices: `TYPOGRAPHY.h3` (bold)

### Spacing
- Use `SPACING` constants
- Product grid: `SPACING.md` between items
- Section gaps: `SPACING.sectionGap`

### Components
- Use `Section` component for major sections
- Use `Text` component from `ui/text`
- Use `Button` component for actions
- Use `Card` component for product cards

---

## Implementation Phases

### Phase 1: Basic Store (MVP)
- [ ] Rename "Settings" to "My Store"
- [ ] Store header with customizable name
- [ ] Basic product listing grid
- [ ] Add/Edit listing functionality
- [ ] Shareable link generation

### Phase 2: Purchase System
- [ ] Instant buy functionality
- [ ] Bidding system
- [ ] Bid management (accept/reject)
- [ ] Purchase confirmation flow

### Phase 3: Trust & Verification
- [ ] Vaulting status badges
- [ ] Verification rings
- [ ] Safety filter (vaulted only)
- [ ] User level system

### Phase 4: Advanced Features
- [ ] Progress bars (vertical & horizontal)
- [ ] Store customization (banners, themes)
- [ ] Analytics dashboard
- [ ] Discord integration
- [ ] Store upgrades/purchases

### Phase 5: Polish & Enhancements
- [ ] Animations for rings and badges
- [ ] Achievement system
- [ ] Notifications for bids/sales
- [ ] Search and filter within store
- [ ] Store reviews/ratings

---

## Creative Elements

### Profile Icon Rings
- Animated glow effect
- Pulsing animation for active sales
- Color transitions when leveling up
- Particle effects for major milestones

### Store Banner
- Support for animated GIFs (optional)
- Gradient overlays
- Custom positioning
- Parallax effect on scroll

### Product Cards
- Hover effects (web)
- Swipe actions (mobile)
- Quick view modal
- Image zoom on tap

### Progress Animations
- Smooth XP gain animations
- Level up celebration modal
- Progress bar fill animations
- Achievement unlock notifications

---

## Safety & Trust Features

### Vaulting Priority
- Always show vaulted status prominently
- Filter option: "Vaulted Only"
- Visual distinction for vaulted cards
- Trust score based on vaulting percentage

### Verification System
- Email verification
- Phone verification (optional)
- Identity verification (for high-value stores)
- Payment method verification

### Dispute Resolution
- Report system for issues
- Escrow for high-value transactions
- SA Player mediation
- Refund policies

---

## Future Enhancements

1. **Store Templates**: Pre-designed store layouts
2. **Social Features**: Follow stores, favorites
3. **Store Reviews**: Customer reviews and ratings
4. **Inventory Management**: Bulk upload, CSV import
5. **Shipping Integration**: Label printing, tracking
6. **Multi-Currency**: Support different currencies
7. **Store Analytics Pro**: Advanced insights
8. **Marketing Tools**: Promotions, discounts
9. **Store Widgets**: Embed store on external sites
10. **API Access**: For power users

---

## Questions to Consider

1. Should bidding be time-limited (auctions) or open-ended?
2. What percentage does SA Player take from sales?
3. How do we handle shipping for physical cards?
4. Should stores be public by default or private?
5. What's the minimum level to create a store?
6. How do we prevent fake listings?
7. What happens to bids if seller accepts another?
8. Can users have multiple stores?

---

**Last Updated**: 2024
**Status**: Design Phase
**Priority**: High

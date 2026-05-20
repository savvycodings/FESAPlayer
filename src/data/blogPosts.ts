export interface BlogPost {
  id: string
  title: string
  description: string
  buttonText: string
  image: number
  category: string
  publishedAt: string
  readTimeMinutes: number
  body: string[]
  /** Extra upward nudge for transparent PNG artwork */
  imageOffsetTop?: number
  /** Size multiplier for transparent PNG artwork (default 1) */
  imageScale?: number
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'grade-your-cards',
    title: 'How to Grade Your Cards',
    description: 'Learn the essential tips for getting your cards professionally graded.',
    buttonText: 'Read More',
    image: require('../../assets/blogs/mysteryslab_a57b6e03-b9ff-4b74-83fb-6a0134751d92-removebg-preview.png'),
    category: 'Grading',
    imageOffsetTop: -10,
    publishedAt: '12 Mar 2026',
    readTimeMinutes: 5,
    body: [
      'Professional grading protects your cards and helps buyers trust condition claims. Start by inspecting surface, corners, edges, and centering under good lighting before you submit.',
      'Clean cards gently; never use harsh chemicals. Sleeve raw cards and use semi-rigid holders for shipping. Document the card with photos before it leaves your hands.',
      'Choose a grading tier that matches your card’s value. High-value chase cards often justify premium service levels; bulk tiers work well for mid-range inventory you move regularly.',
      'On FASAPlayer, verified listings and vaulting work together: grading gives buyers confidence, and our verification flow supports high-value singles when you are ready to sell.',
    ],
  },
  {
    id: 'investment-guide-rare-cards',
    title: 'Investment Guide: Rare Cards',
    description: 'Discover which cards are worth investing in.',
    buttonText: 'Read More',
    image: require('../../assets/blogs/qM2uygul690ab1d9c2026_1762308569-removebg-preview.png'),
    category: 'Investment',
    imageOffsetTop: -10,
    publishedAt: '8 Mar 2026',
    readTimeMinutes: 7,
    body: [
      'Card investing is driven by scarcity, demand, and condition, not hype alone. Focus on proven chase cards, sealed products with thin print runs, and sets with lasting collector interest.',
      'Track sold comps and market trends instead of asking prices alone. A card is only worth what someone will pay today; use recent sales to set realistic buy and sell targets.',
      'Diversify: mix singles, sealed, and graded slabs so you are not overexposed to one set rotation. Liquidity matters: popular modern chase cards often sell faster than obscure promos.',
      'Buy with an exit plan. Decide whether you are flipping, holding sealed, or building a graded portfolio, and factor grading fees and shipping into your margin before you list on the marketplace.',
    ],
  },
  {
    id: 'card-storage-best-practices',
    title: 'Card Storage Best Practices',
    description: 'Protect your collection with proper storage techniques.',
    buttonText: 'Read More',
    image: require('../../assets/blogs/pokebox-removebg-preview.png'),
    category: 'Storage',
    imageScale: 1.12,
    imageOffsetTop: -14,
    publishedAt: '1 Mar 2026',
    readTimeMinutes: 4,
    body: [
      'Humidity and temperature swings are the biggest long-term risks. Store cards in a cool, dry room away from direct sunlight; avoid attics, garages, and window sills.',
      'Use penny sleeves plus top loaders or semi-rigids for raw cards. For valuable singles, consider magnetic holders or early grading to lock in condition.',
      'Keep sealed product in original shrink when possible. Stack booster boxes flat, not on edge, to reduce warping and corner pressure over time.',
      'Organize by set or value tier so you can pull inventory quickly when listing. A consistent system saves time when you photograph, price, and ship orders from your store.',
    ],
  },
]

export function getBlogPostById(id: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.id === id)
}

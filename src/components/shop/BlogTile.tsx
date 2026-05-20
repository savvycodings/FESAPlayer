import { BlogTileCard } from './BlogTileCard'
import type { BlogPost } from '../../data/blogPosts'

type BlogTileProps = {
  item: BlogPost
  onReadMorePress: (blogId: string) => void
}

/** Full-width blog tile on the Blogs (See all) screen — same layout as Shop carousel */
export function BlogTile({ item, onReadMorePress }: BlogTileProps) {
  return (
    <BlogTileCard
      item={item}
      variant="list"
      onReadMorePress={() => onReadMorePress(item.id)}
    />
  )
}

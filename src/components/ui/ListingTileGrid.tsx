import { View, StyleSheet, useWindowDimensions } from 'react-native'
import { SPACING, LISTING_GRID_EDGE_PAD } from '../../constants/layout'
import { listingTileWidth } from '../../utils/listingGrid'

export interface ListingTileGridProps<T> {
  data: T[]
  columns?: number
  keyExtractor: (item: T) => string
  renderItem: (item: T) => React.ReactNode
  emptyComponent?: React.ReactNode
}

/** Profile-style listing grid: 3 columns (4–5 on wider), row wrap, shared tile width. */
export function ListingTileGrid<T>({
  data,
  columns,
  keyExtractor,
  renderItem,
  emptyComponent = null,
}: ListingTileGridProps<T>) {
  const { width } = useWindowDimensions()
  const tileWidth = listingTileWidth(width, columns)
  const styles = getStyles(tileWidth)

  if (data.length === 0) {
    return emptyComponent ? <>{emptyComponent}</> : null
  }

  return (
    <View style={styles.container}>
      {data.map((item) => (
        <View key={keyExtractor(item)} style={styles.tileWrap}>
          {renderItem(item)}
        </View>
      ))}
    </View>
  )
}

function getStyles(tileWidth: number) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: SPACING.gridColumnGap,
      rowGap: SPACING.gridRowGap,
      width: '100%',
      paddingHorizontal: LISTING_GRID_EDGE_PAD,
    },
    tileWrap: {
      width: tileWidth,
      maxWidth: tileWidth,
      minWidth: 0,
      flexGrow: 0,
      flexShrink: 0,
    },
  })
}

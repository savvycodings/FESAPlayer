import React from 'react'
import { ScrollView, View, StyleSheet, ViewStyle, Dimensions, TouchableOpacity } from 'react-native'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface CarouselProps {
  items: any[]
  renderItem: (item: any, index: number) => React.ReactNode
  itemWidth?: number
  itemHeight?: number
  itemSpacing?: number
  style?: ViewStyle
  onItemPress?: (item: any, index: number) => void
}

export function Carousel({
  items,
  renderItem,
  itemWidth = 280,
  itemHeight = 200,
  itemSpacing = 12,
  style,
  onItemPress,
}: CarouselProps) {
  const snapInterval = itemWidth + itemSpacing
  // Calculate total width needed: all items + spacing between them + padding
  const totalWidth = (itemWidth * items.length) + (itemSpacing * (items.length - 1)) + itemSpacing

  return (
    <View style={[styles.wrapper, { height: itemHeight }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.container,
          { 
            paddingRight: itemSpacing,
            width: Math.max(totalWidth, SCREEN_WIDTH),
          }
        ]}
        style={[styles.scrollView, { height: itemHeight }, style]}
        nestedScrollEnabled={true}
        scrollEnabled={true}
        bounces={true}
        decelerationRate={0.9}
        snapToInterval={snapInterval}
        snapToAlignment="start"
        pagingEnabled={false}
        directionalLockEnabled={true}
        alwaysBounceHorizontal={true}
        alwaysBounceVertical={false}
        removeClippedSubviews={false}
        scrollEventThrottle={16}
        overScrollMode="auto"
      >
        {items.map((item, index) => {
          const content = renderItem(item, index)
          return (
            <View
              key={item?.id || index}
              style={[
                styles.item,
                {
                  width: itemWidth,
                  height: itemHeight,
                  marginRight: index < items.length - 1 ? itemSpacing : 0,
                }
              ]}
            >
              {onItemPress ? (
                <TouchableOpacity
                  style={{ width: '100%', height: '100%' }}
                  onPress={() => onItemPress(item, index)}
                  activeOpacity={0.8}
                >
                  {content}
                </TouchableOpacity>
              ) : (
                content
              )}
            </View>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 0,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingLeft: 0,
    alignItems: 'center',
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})


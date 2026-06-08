import { useMemo, useRef } from 'react'
import { View, PanResponder, StyleSheet } from 'react-native'
import Svg, { Rect, Line } from 'react-native-svg'
import {
  BrushSelection,
  CHART_PADDING_LEFT,
  MIN_BRUSH_POINTS,
  clampSelection,
  indexToX,
  xToIndex,
} from './chartBrushUtils'
import { CHART_LAYOUT, useChartTheme } from './chartTheme'

type DragMode = 'left' | 'right' | 'pan' | null

export interface ChartBrushProps {
  dataLength: number
  selection: BrushSelection
  onSelectionChange: (selection: BrushSelection) => void
  accentColor?: string
  height: number
  graphWidth: number
  paddingLeft?: number
}

function BrushHandle({
  x,
  height,
  handleW,
  handleH,
  handleTop,
  fill,
  border,
}: {
  x: number
  height: number
  handleW: number
  handleH: number
  handleTop: number
  fill: string
  border: string
}) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x - handleW / 2,
        top: handleTop,
        width: handleW,
        height: handleH,
        borderRadius: handleW / 2,
        backgroundColor: fill,
        borderWidth: 1,
        borderColor: border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.35,
        shadowRadius: 2,
        elevation: 3,
      }}
    />
  )
}

/** Diagonal hatch lines inside the selection window (bklit diagonal preset) */
function BrushHatch({
  left,
  top,
  width,
  height,
  color,
}: {
  left: number
  top: number
  width: number
  height: number
  color: string
}) {
  if (width <= 0 || height <= 0) return null
  const step = 7
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = []
  for (let i = -height; i < width + height; i += step) {
    lines.push({ x1: i, y1: 0, x2: i + height, y2: height })
  }
  return (
    <Svg
      pointerEvents="none"
      style={{ position: 'absolute', left, top, width, height }}
      width={width}
      height={height}
    >
      {lines.map((l, i) => (
        <Line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={color}
          strokeWidth={1}
          opacity={0.35}
        />
      ))}
    </Svg>
  )
}

export function ChartBrush({
  dataLength,
  selection,
  onSelectionChange,
  accentColor,
  height,
  graphWidth,
  paddingLeft = CHART_PADDING_LEFT,
}: ChartBrushProps) {
  const tokens = useChartTheme(accentColor)
  const selectionRef = useRef(selection)
  selectionRef.current = selection

  const dragModeRef = useRef<DragMode>(null)
  const panStartRef = useRef<{ x: number; startIndex: number; endIndex: number } | null>(null)

  const handleW = CHART_LAYOUT.handleWidth
  const handleH = Math.max(28, Math.round(height * CHART_LAYOUT.handleHeightRatio))
  const handleTop = (height - handleH) / 2
  const hit = CHART_LAYOUT.handleHit

  const leftX = indexToX(selection.startIndex, dataLength, graphWidth, paddingLeft)
  const rightX = indexToX(selection.endIndex, dataLength, graphWidth, paddingLeft)
  const selectionWidth = Math.max(0, rightX - leftX)

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => dataLength > MIN_BRUSH_POINTS,
        onMoveShouldSetPanResponder: () => dataLength > MIN_BRUSH_POINTS,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: (evt) => {
          const x = evt.nativeEvent.locationX
          const sel = selectionRef.current
          const lx = indexToX(sel.startIndex, dataLength, graphWidth, paddingLeft)
          const rx = indexToX(sel.endIndex, dataLength, graphWidth, paddingLeft)
          let mode: DragMode = null
          if (Math.abs(x - lx) <= hit) mode = 'left'
          else if (Math.abs(x - rx) <= hit) mode = 'right'
          else if (x >= lx - hit / 2 && x <= rx + hit / 2) mode = 'pan'
          dragModeRef.current = mode
          panStartRef.current = {
            x,
            startIndex: selectionRef.current.startIndex,
            endIndex: selectionRef.current.endIndex,
          }
        },
        onPanResponderMove: (evt) => {
          const mode = dragModeRef.current
          const start = panStartRef.current
          if (!mode || !start || dataLength <= MIN_BRUSH_POINTS) return

          const x = evt.nativeEvent.locationX
          const deltaIndex =
            xToIndex(x, dataLength, graphWidth, paddingLeft) -
            xToIndex(start.x, dataLength, graphWidth, paddingLeft)

          if (mode === 'left') {
            onSelectionChange(
              clampSelection(
                { startIndex: start.startIndex + deltaIndex, endIndex: start.endIndex },
                dataLength,
              ),
            )
            return
          }

          if (mode === 'right') {
            onSelectionChange(
              clampSelection(
                { startIndex: start.startIndex, endIndex: start.endIndex + deltaIndex },
                dataLength,
              ),
            )
            return
          }

          if (mode === 'pan') {
            const span = start.endIndex - start.startIndex
            let nextStart = start.startIndex + deltaIndex
            let nextEnd = start.endIndex + deltaIndex
            if (nextStart < 0) {
              nextStart = 0
              nextEnd = span
            }
            if (nextEnd > dataLength - 1) {
              nextEnd = dataLength - 1
              nextStart = nextEnd - span
            }
            onSelectionChange(
              clampSelection({ startIndex: nextStart, endIndex: nextEnd }, dataLength),
            )
          }
        },
        onPanResponderRelease: () => {
          dragModeRef.current = null
          panStartRef.current = null
        },
      }),
    [dataLength, graphWidth, paddingLeft, onSelectionChange, hit],
  )

  if (dataLength <= MIN_BRUSH_POINTS) return null

  const trackRight = paddingLeft + graphWidth

  return (
    <View style={[StyleSheet.absoluteFill, { height, zIndex: 20 }]} {...panResponder.panHandlers}>
      {leftX > paddingLeft ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: paddingLeft,
            top: 0,
            width: leftX - paddingLeft,
            height,
            backgroundColor: tokens.brushDim[0],
            opacity: 0.55,
          }}
        />
      ) : null}

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: leftX,
          top: 0,
          width: selectionWidth,
          height,
          backgroundColor: tokens.brushSelection,
        }}
      />

      <BrushHatch
        left={leftX}
        top={0}
        width={selectionWidth}
        height={height}
        color={tokens.brushSelectionBorder}
      />

      <Svg
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        width={trackRight + 8}
        height={height}
      >
        <Rect
          x={leftX}
          y={1}
          width={Math.max(0, selectionWidth)}
          height={Math.max(0, height - 2)}
          stroke={tokens.brushSelectionBorder}
          strokeWidth={1}
          strokeDasharray="5 4"
          fill="transparent"
        />
      </Svg>

      {rightX < trackRight ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: rightX,
            top: 0,
            width: trackRight - rightX,
            height,
            backgroundColor: tokens.brushDim[0],
            opacity: 0.55,
          }}
        />
      ) : null}

      <BrushHandle
        x={leftX}
        height={height}
        handleW={handleW}
        handleH={handleH}
        handleTop={handleTop}
        fill={tokens.brushHandle}
        border={tokens.brushHandleBorder}
      />
      <BrushHandle
        x={rightX}
        height={height}
        handleW={handleW}
        handleH={handleH}
        handleTop={handleTop}
        fill={tokens.brushHandle}
        border={tokens.brushHandleBorder}
      />
    </View>
  )
}

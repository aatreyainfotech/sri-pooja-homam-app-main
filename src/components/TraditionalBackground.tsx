import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, Pattern, Path, Circle, G, Rect, LinearGradient, Stop } from 'react-native-svg';

/**
 * Traditional temple-themed background with subtle mandala/lotus motifs.
 * Renders absolutely behind the screen content — drop it as the FIRST child
 * of any top-level screen <View>.
 *
 * Design:
 * - Cream/ivory base with a very soft warm gradient
 * - Seamless tile of an 8-petal mandala (gold @ ~6% opacity)
 * - Four corner lotus medallions (slightly more visible)
 * - Top strip of diya/bell silhouettes (very faint)
 * - Fully SVG — crisp on every DPR, no image assets to ship
 */

const CREAM_TOP = '#FDF5E4';
const CREAM_BOTTOM = '#F7E9CF';
const GOLD = '#C9922A';
const MAROON = '#7A3020';

// ---------- Small motif primitives ----------

// 8-petal mandala flower — used in the tiled pattern
function PetalMandala({ size = 60, color = GOLD, opacity = 0.18 }: any) {
  const r = size / 2;
  const petals = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * 360) / 8;
    petals.push(
      <Path
        key={i}
        d={`M ${r} ${r} C ${r + size * 0.12} ${r - size * 0.12}, ${r + size * 0.35} ${r - size * 0.35}, ${r} ${r - size * 0.45} C ${r - size * 0.35} ${r - size * 0.35}, ${r - size * 0.12} ${r - size * 0.12}, ${r} ${r} Z`}
        fill={color}
        opacity={opacity}
        transform={`rotate(${angle} ${r} ${r})`}
      />,
    );
  }
  return (
    <G>
      {petals}
      <Circle cx={r} cy={r} r={size * 0.08} fill={MAROON} opacity={opacity + 0.12} />
    </G>
  );
}

// Detailed corner lotus — bigger, more visible at the 4 corners
function CornerLotus({ size = 110, rotate = 0, opacity = 0.14 }: any) {
  const r = size / 2;
  return (
    <G transform={`rotate(${rotate} ${r} ${r})`}>
      {/* Outer ring */}
      <Circle cx={r} cy={r} r={r * 0.96} stroke={GOLD} strokeWidth={1.2} fill="none" opacity={opacity} />
      <Circle cx={r} cy={r} r={r * 0.78} stroke={MAROON} strokeWidth={0.8} fill="none" opacity={opacity * 0.8} />
      {/* 12 petals */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 360) / 12;
        return (
          <Path
            key={i}
            d={`M ${r} ${r} Q ${r + 4} ${r - r * 0.4} ${r} ${r - r * 0.75} Q ${r - 4} ${r - r * 0.4} ${r} ${r} Z`}
            fill={GOLD}
            opacity={opacity + 0.04}
            transform={`rotate(${a} ${r} ${r})`}
          />
        );
      })}
      {/* Inner rosette */}
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i * 360) / 6;
        return (
          <Circle
            key={i}
            cx={r}
            cy={r - r * 0.3}
            r={r * 0.06}
            fill={MAROON}
            opacity={opacity * 1.5}
            transform={`rotate(${a} ${r} ${r})`}
          />
        );
      })}
      <Circle cx={r} cy={r} r={r * 0.08} fill={GOLD} opacity={opacity + 0.2} />
    </G>
  );
}

// ---------- Main export ----------

export default function TraditionalBackground() {
  const { width, height } = Dimensions.get('window');
  const tile = 120; // mandala tile size
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 0 }]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="warmBg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={CREAM_TOP} />
            <Stop offset="1" stopColor={CREAM_BOTTOM} />
          </LinearGradient>

          {/* Seamless 8-petal mandala tile */}
          <Pattern id="mandalaTile" patternUnits="userSpaceOnUse" width={tile} height={tile}>
            <Rect width={tile} height={tile} fill="transparent" />
            {/* Mandala at 0,0 */}
            <G transform={`translate(${tile / 2 - 30} ${tile / 2 - 30})`}>
              <PetalMandala size={60} color={GOLD} opacity={0.085} />
            </G>
            {/* Small accent circles */}
            <Circle cx={0} cy={0} r={1.6} fill={MAROON} opacity={0.12} />
            <Circle cx={tile} cy={0} r={1.6} fill={MAROON} opacity={0.12} />
            <Circle cx={0} cy={tile} r={1.6} fill={MAROON} opacity={0.12} />
            <Circle cx={tile} cy={tile} r={1.6} fill={MAROON} opacity={0.12} />
          </Pattern>
        </Defs>

        {/* Base warm gradient */}
        <Rect width={width} height={height} fill="url(#warmBg)" />
        {/* Seamless mandala tile */}
        <Rect width={width} height={height} fill="url(#mandalaTile)" />

        {/* Corner lotus medallions — larger accents at screen corners */}
        <G transform={`translate(-30, -30)`}>
          <CornerLotus size={140} rotate={0} opacity={0.10} />
        </G>
        <G transform={`translate(${width - 110}, -30)`}>
          <CornerLotus size={140} rotate={30} opacity={0.09} />
        </G>
        <G transform={`translate(-30, ${height - 110})`}>
          <CornerLotus size={140} rotate={-30} opacity={0.09} />
        </G>
        <G transform={`translate(${width - 110}, ${height - 110})`}>
          <CornerLotus size={140} rotate={60} opacity={0.10} />
        </G>
      </Svg>
    </View>
  );
}

import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface AutoCarouselProps<T> {
  items: T[];
  renderItem: (item: T, index: number, cardWidth: number) => ReactNode;
  containerWidth: number;
  visibleCount: number;
  gap?: number;
  autoAdvanceMs?: number | null;
  duration?: number;
  accentColor?: string;
  keyExtractor?: (item: T, index: number) => string;
}

// Generic version of the identical idx/Animated.Value/goTo()/setInterval/
// dots/arrows pattern shared by the Home tab's translateX-scrolling
// carousels. Card sizing/markup and breakpoint math stay caller-owned via
// `renderItem`/`containerWidth`/`visibleCount` — this component only owns
// the scroll animation and the prev/next/dot controls.
export default function AutoCarousel<T>({
  items,
  renderItem,
  containerWidth,
  visibleCount,
  gap = 14,
  autoAdvanceMs = 3200,
  duration = 650,
  accentColor = theme.colors.secondary,
  keyExtractor,
}: AutoCarouselProps<T>) {
  const [idx, setIdx] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  const cardW = Math.max(0, Math.floor((containerWidth - gap * (visibleCount - 1)) / visibleCount));
  const step = cardW + gap;
  const maxIdx = Math.max(0, items.length - visibleCount);

  const goTo = useCallback((next: number) => {
    const n = ((next % (maxIdx + 1)) + (maxIdx + 1)) % (maxIdx + 1);
    setIdx(n);
    Animated.timing(anim, { toValue: -n * step, duration, useNativeDriver: false }).start();
  }, [maxIdx, step, anim, duration]);

  useEffect(() => {
    if (!autoAdvanceMs || items.length <= visibleCount) return;
    const t = setInterval(() => goTo(idx + 1), autoAdvanceMs);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, items.length, visibleCount, goTo, autoAdvanceMs]);

  if (items.length === 0) return null;

  return (
    <View>
      <View style={styles.viewport}>
        <Animated.View
          style={[
            styles.track,
            { gap, transform: [{ translateX: anim }], width: (cardW + gap) * items.length },
          ]}
        >
          {items.map((item, i) => (
            <View key={keyExtractor ? keyExtractor(item, i) : i} style={{ width: cardW }}>
              {renderItem(item, i, cardW)}
            </View>
          ))}
        </Animated.View>
      </View>

      {maxIdx > 0 && (
        <View style={styles.controls}>
          <TouchableOpacity onPress={() => goTo(idx - 1)} style={[styles.arrow, { borderColor: `${accentColor}30` }]}>
            <Ionicons name="chevron-back" size={18} color={accentColor} />
          </TouchableOpacity>
          <View style={styles.dots}>
            {Array.from({ length: maxIdx + 1 }).map((_, i) => (
              <TouchableOpacity key={i} onPress={() => goTo(i)}>
                <View
                  style={[
                    styles.dot,
                    { width: i === idx ? 22 : 8, backgroundColor: i === idx ? accentColor : `${accentColor}33` },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={() => goTo(idx + 1)} style={[styles.arrow, { borderColor: `${accentColor}30` }]}>
            <Ionicons name="chevron-forward" size={18} color={accentColor} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    overflow: 'hidden',
  },
  track: {
    flexDirection: 'row',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  arrow: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.colors.white,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 2px 10px rgba(0,0,0,0.12)', cursor: 'pointer' } as any) : {}),
  },
  dots: {
    flexDirection: 'row',
    gap: theme.spacing.xs + 2,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});

import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeContext';

const ITEM_H = 44;

interface Props {
  items: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  width?: number;
}

export default function WheelPicker({ items, selectedIndex, onChange, width = 72 }: Props) {
  const { theme: t } = useTheme();
  const ref = useRef<ScrollView>(null);
  const internalIdx = useRef(selectedIndex);
  const hasMomentum = useRef(false);

  // Scroll to position on mount only
  useEffect(() => {
    setTimeout(() => {
      ref.current?.scrollTo({ y: internalIdx.current * ITEM_H, animated: false });
    }, 50);
  }, []);

  // Scroll when parent changes selectedIndex externally (e.g. loading from storage)
  useEffect(() => {
    if (selectedIndex === internalIdx.current) return;
    internalIdx.current = selectedIndex;
    ref.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: false });
  }, [selectedIndex]);

  const settle = (y: number) => {
    const idx = Math.max(0, Math.min(items.length - 1, Math.round(y / ITEM_H)));
    if (idx !== internalIdx.current) {
      internalIdx.current = idx;
      onChange(idx);
    }
  };

  return (
    <View style={[styles.wrapper, { width }]}>
      <View pointerEvents="none" style={[styles.selBoxTop, { borderColor: t.blue + '60' }]} />
      <View pointerEvents="none" style={[styles.selBoxBottom, { borderColor: t.blue + '60' }]} />
      <ScrollView
        ref={ref}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: ITEM_H }}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        bounces={false}
        overScrollMode="never"
        onScrollBeginDrag={() => { hasMomentum.current = false; }}
        onMomentumScrollBegin={() => { hasMomentum.current = true; }}
        onMomentumScrollEnd={(e) => {
          hasMomentum.current = false;
          settle(e.nativeEvent.contentOffset.y);
        }}
        onScrollEndDrag={(e) => {
          // Only settle here if no momentum scroll is coming
          if (!hasMomentum.current) {
            settle(e.nativeEvent.contentOffset.y);
          }
        }}
      >
        {items.map((label, i) => (
          <View key={i} style={styles.item}>
            <Text
              style={[
                styles.itemText,
                { color: i === selectedIndex ? t.textPrimary : t.textTertiary },
                i === selectedIndex && styles.itemTextSelected,
              ]}
            >
              {label}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: ITEM_H * 3,
    overflow: 'hidden',
  },
  selBoxTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: ITEM_H,
    height: 1,
    borderTopWidth: 1,
    zIndex: 1,
  },
  selBoxBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: ITEM_H * 2,
    height: 1,
    borderTopWidth: 1,
    zIndex: 1,
  },
  item: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 20,
    fontWeight: '500',
  },
  itemTextSelected: {
    fontSize: 26,
    fontWeight: '700',
  },
});

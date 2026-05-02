import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../lib/gameData';

// Simple progress ring using border tricks (no SVG dep needed)
export default function StatRing({ value, max, label, color = COLORS.gold, size = 70 }: { value: number; max: number; label: string; color?: string; size?: number; }) {
  const pct = Math.min(1, value / max);
  // Approximate ring with stacked borders
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View style={[styles.ringBg, { width: size, height: size, borderRadius: size / 2, borderColor: 'rgba(212,175,55,0.15)' }]} />
      <View style={[
        styles.ringFg,
        {
          width: size, height: size, borderRadius: size / 2,
          borderColor: color,
          borderTopColor: pct > 0 ? color : 'transparent',
          borderRightColor: pct > 0.25 ? color : 'transparent',
          borderBottomColor: pct > 0.5 ? color : 'transparent',
          borderLeftColor: pct > 0.75 ? color : 'transparent',
          transform: [{ rotate: `${pct * 360 - 90}deg` }],
        },
      ]} />
      <View style={styles.center}>
        <Text style={[styles.val, { color }]}>{value}</Text>
        <Text style={styles.lbl}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  ringBg: { position: 'absolute', borderWidth: 4 },
  ringFg: { position: 'absolute', borderWidth: 4 },
  center: { alignItems: 'center', justifyContent: 'center' },
  val: { fontSize: 18, fontWeight: '600' },
  lbl: { color: COLORS.silver, fontSize: 9, letterSpacing: 1.5, opacity: 0.7 },
});

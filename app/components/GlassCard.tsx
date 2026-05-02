import React, { ReactNode } from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { COLORS } from '../lib/gameData';

export function GlassCard({ children, style, glow }: { children: ReactNode; style?: ViewStyle | ViewStyle[]; glow?: string }) {
  return (
    <View style={[styles.card, glow ? { borderColor: glow, shadowColor: glow } : null, style]}>
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    backgroundColor: 'rgba(45, 27, 78, 0.35)',
    overflow: 'hidden',
    shadowColor: COLORS.gold,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  inner: {
    backgroundColor: 'rgba(10, 17, 40, 0.55)',
    padding: 16,
  },
});

export default GlassCard;

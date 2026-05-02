import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../lib/gameData';

export default function RuneDivider({ label }: { label?: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      {label ? <Text style={styles.label}>✦ {label} ✦</Text> : <Text style={styles.label}>✦</Text>}
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, paddingHorizontal: 8 },
  line: { flex: 1, height: 1, backgroundColor: COLORS.gold, opacity: 0.4 },
  label: { color: COLORS.gold, marginHorizontal: 12, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '600' },
});

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

export type FloatingNum = {
  id: string;
  x: number; y: number;
  text: string;
  color: string;
  big?: boolean;
};

export default function FloatingNumber({ num, onDone }: { num: FloatingNum; onDone: (id: string) => void }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 1100, useNativeDriver: true }).start(() => onDone(num.id));
  }, []);

  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -50] });
  const opacity = t.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] });
  const scale = t.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.6, 1.2, 1] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { left: num.x - 30, top: num.y - 20, opacity, transform: [{ translateY }, { scale }] }]}
    >
      <Text style={[styles.text, { color: num.color, fontSize: num.big ? 26 : 20 }]}>{num.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', width: 60, alignItems: 'center', zIndex: 100 },
  text: { fontWeight: '900', textShadowColor: '#000', textShadowRadius: 4, textShadowOffset: { width: 1, height: 1 }, letterSpacing: 1 },
});

import React, { useEffect, useRef } from 'react';
import { View, Text, ImageBackground, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Animated, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './lib/gameData';
import { useGame } from './lib/gameStore';
import GlassCard from './components/GlassCard';
import RuneDivider from './components/RuneDivider';

const { width, height } = Dimensions.get('window');

export default function Landing() {
  const { character } = useGame();
  const fade = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 1400, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 3500, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 3500, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  const glowOp = glow.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.85] });

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgDeep }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <View style={styles.hero}>
          <ImageBackground
            source={{ uri: 'https://d64gsuwffb70l.cloudfront.net/69f61b1fe8b27f6d8e673495_1777736570922_43083666.jpg' }}
            style={styles.bg}
            resizeMode="cover"
          >
            <View style={styles.overlay} />
            <View style={styles.particles}>
              {[...Array(14)].map((_, i) => (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    left: (i * 31) % width,
                    top: (i * 47) % (height * 0.85),
                    width: 3, height: 3, borderRadius: 2,
                    backgroundColor: i % 2 ? COLORS.gold : COLORS.arcane,
                    opacity: 0.6,
                  }}
                />
              ))}
            </View>

            <Animated.View style={[styles.silhouetteWrap, { transform: [{ translateY }], opacity: fade }]}>
              <Animated.View style={[styles.glowCircle, { opacity: glowOp }]} />
              <Image
                source={{ uri: 'https://d64gsuwffb70l.cloudfront.net/69f61b1fe8b27f6d8e673495_1777736588728_214e2066.jpg' }}
                style={styles.silhouette}
                resizeMode="cover"
              />
            </Animated.View>

            <Animated.View style={[styles.heroText, { opacity: fade }]}>
              <Text style={styles.kicker}>✦  A CHRONICLE OF THE SUNDERED REALM  ✦</Text>
              <Text style={styles.title}>AETHERYN</Text>
              <Text style={styles.subtitle}>
                Forge a hero with no class but the one your choices carve.
              </Text>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.push(character ? '/game' : '/create')}
                activeOpacity={0.85}
              >
                <Ionicons name={character ? 'play' : 'sparkles'} size={18} color={COLORS.bgDeep} />
                <Text style={styles.primaryBtnText}>
                  {character ? `Continue as ${character.name}` : 'Begin Your Saga'}
                </Text>
              </TouchableOpacity>

              {character && (
                <TouchableOpacity onPress={() => router.push('/create')} style={styles.secondaryBtn}>
                  <Text style={styles.secondaryBtnText}>Forge a New Hero</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          </ImageBackground>
        </View>

        {/* PILLARS */}
        <View style={styles.section}>
          <RuneDivider label="The Five Pillars" />

          <GlassCard style={{ marginBottom: 12 }}>
            <View style={styles.pillarRow}>
              <View style={[styles.pillarIcon, { backgroundColor: 'rgba(139,92,246,0.25)' }]}>
                <Ionicons name="git-branch" size={22} color={COLORS.arcane} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pillarTitle}>Classless Becoming</Text>
                <Text style={styles.pillarDesc}>Skills awaken through use, not selection. Cast a spell often, become a mage. Pick a hundred locks, become a ghost.</Text>
              </View>
            </View>
          </GlassCard>

          <GlassCard style={{ marginBottom: 12 }}>
            <View style={styles.pillarRow}>
              <View style={[styles.pillarIcon, { backgroundColor: 'rgba(220,38,38,0.25)' }]}>
                <Ionicons name="flame" size={22} color={COLORS.ember} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pillarTitle}>Tactical Weave</Text>
                <Text style={styles.pillarDesc}>Turn-based combat where elements collide. Frost on oil. Lightning on water. The grid remembers.</Text>
              </View>
            </View>
          </GlassCard>

          <GlassCard style={{ marginBottom: 12 }}>
            <View style={styles.pillarRow}>
              <View style={[styles.pillarIcon, { backgroundColor: 'rgba(252,211,77,0.2)' }]}>
                <Ionicons name="book" size={22} color={COLORS.divine} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pillarTitle}>Choices that Cut</Text>
                <Text style={styles.pillarDesc}>15 woven story missions. Every choice is remembered — by the realm, by the dead, by the gods.</Text>
              </View>
            </View>
          </GlassCard>

          <GlassCard style={{ marginBottom: 12 }}>
            <View style={styles.pillarRow}>
              <View style={[styles.pillarIcon, { backgroundColor: 'rgba(16,185,129,0.2)' }]}>
                <Ionicons name="leaf" size={22} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pillarTitle}>Nine Living Realms</Text>
                <Text style={styles.pillarDesc}>From the ash of Caelhorn to the singing Moonglade — each region tells its own quiet story.</Text>
              </View>
            </View>
          </GlassCard>

          <GlassCard style={{ marginBottom: 12 }}>
            <View style={styles.pillarRow}>
              <View style={[styles.pillarIcon, { backgroundColor: 'rgba(212,175,55,0.25)' }]}>
                <Ionicons name="diamond" size={22} color={COLORS.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pillarTitle}>Artifacts of Lore</Text>
                <Text style={styles.pillarDesc}>50+ items, each with histories that may matter. The Mournstone hums when corpses are near. They hum back.</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* LORE */}
        <View style={styles.section}>
          <RuneDivider label="The Sundering" />
          <GlassCard>
            <Text style={styles.loreText}>
              "The world was whole, once. Then the gods spoke a single word too many, and the Veil split — letting through what had only been dreamed."
            </Text>
            <Text style={[styles.loreText, { marginTop: 12, fontStyle: 'italic', opacity: 0.75 }]}>
              — From the Codex of the Voiceless, recovered, partially burned
            </Text>
          </GlassCard>
        </View>

        <View style={{ alignItems: 'center', marginTop: 30 }}>
          <Text style={{ color: COLORS.silver, opacity: 0.4, fontSize: 11, letterSpacing: 2 }}>AETHERYN  ·  v1.0  ·  ✦</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: height * 0.95, position: 'relative' },
  bg: { flex: 1, justifyContent: 'flex-end' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5, 8, 23, 0.55)' },
  particles: { ...StyleSheet.absoluteFillObject },
  silhouetteWrap: { position: 'absolute', top: '15%', alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  glowCircle: {
    position: 'absolute',
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: COLORS.arcane,
    opacity: 0.4,
    shadowColor: COLORS.gold, shadowOpacity: 1, shadowRadius: 60,
  },
  silhouette: { width: 220, height: 320, borderRadius: 12, opacity: 0.92 },
  heroText: { padding: 28, paddingBottom: 50 },
  kicker: { color: COLORS.gold, fontSize: 10, letterSpacing: 2.5, textAlign: 'center', marginBottom: 12, opacity: 0.85 },
  title: { color: COLORS.parchment, fontSize: 48, fontWeight: '300', textAlign: 'center', letterSpacing: 6, marginBottom: 14, textShadowColor: COLORS.arcane, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 },
  subtitle: { color: COLORS.silver, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 28, paddingHorizontal: 12, fontStyle: 'italic' },
  primaryBtn: {
    backgroundColor: COLORS.gold,
    paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 10,
    shadowColor: COLORS.gold, shadowOpacity: 0.5, shadowRadius: 16,
  },
  primaryBtnText: { color: COLORS.bgDeep, fontSize: 16, fontWeight: '700', letterSpacing: 1.5 },
  secondaryBtn: { marginTop: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', borderRadius: 12 },
  secondaryBtnText: { color: COLORS.gold, fontSize: 13, letterSpacing: 1.5 },
  section: { paddingHorizontal: 18, marginTop: 8 },
  pillarRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pillarIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' },
  pillarTitle: { color: COLORS.gold, fontSize: 15, fontWeight: '600', marginBottom: 4, letterSpacing: 0.5 },
  pillarDesc: { color: COLORS.silver, fontSize: 12.5, lineHeight: 18, opacity: 0.85 },
  loreText: { color: COLORS.parchment, fontSize: 14, lineHeight: 22, fontStyle: 'italic', textAlign: 'center' },
});

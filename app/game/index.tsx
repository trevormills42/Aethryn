import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, ATTRIBUTES, ACHIEVEMENTS } from '../lib/gameData';
import { useGame } from '../lib/gameStore';
import GlassCard from '../components/GlassCard';
import RuneDivider from '../components/RuneDivider';
import StatRing from '../components/StatRing';

export default function CharacterSheet() {
  const { character, resetCharacter, gainXP } = useGame();
  if (!character) return null;

  const xpForNext = character.level * 100;
  const xpPct = character.xp / xpForNext;

  const onRest = () => {
    Alert.alert('Rest by the fire?', 'You will recover fully and gain a small reflection.', [
      { text: 'Stay watchful', style: 'cancel' },
      { text: 'Rest', onPress: () => gainXP(15) },
    ]);
  };

  const onLeave = () => {
    Alert.alert('Leave this saga?', 'Your hero will be unmade. The realm will forget your name.', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Forsake', style: 'destructive', onPress: () => { resetCharacter(); router.replace('/'); } },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgDeep }}>
      <ScrollView contentContainerStyle={{ paddingTop: 56, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* HERO HEADER */}
        <View style={styles.header}>
          <View style={styles.portraitWrap}>
            <Image source={{ uri: character.race.image }} style={styles.portrait} />
            <View style={styles.portraitGlow} />
            <View style={styles.lvlBadge}>
              <Text style={styles.lvlText}>{character.level}</Text>
            </View>
          </View>
          <Text style={styles.name}>{character.name}</Text>
          <Text style={styles.race}>{character.race.title} · {character.race.name}</Text>

          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: `${xpPct * 100}%` }]} />
            <Text style={styles.xpText}>{character.xp} / {xpForNext} XP</Text>
          </View>
        </View>

        {/* VITALS */}
        <View style={{ paddingHorizontal: 18 }}>
          <View style={styles.vitalsRow}>
            <GlassCard style={styles.vitalCard} glow={COLORS.blood}>
              <View style={styles.vitalHeader}>
                <Ionicons name="heart" size={14} color={COLORS.blood} />
                <Text style={[styles.vitalLabel, { color: COLORS.blood }]}>VITAE</Text>
              </View>
              <Text style={styles.vitalValue}>{character.hp}<Text style={styles.vitalMax}>/{character.hpMax}</Text></Text>
              <View style={styles.miniBar}>
                <View style={[styles.miniFill, { backgroundColor: COLORS.blood, width: `${(character.hp / character.hpMax) * 100}%` }]} />
              </View>
            </GlassCard>

            <GlassCard style={styles.vitalCard} glow={COLORS.arcane}>
              <View style={styles.vitalHeader}>
                <Ionicons name="sparkles" size={14} color={COLORS.arcane} />
                <Text style={[styles.vitalLabel, { color: COLORS.arcane }]}>AETHER</Text>
              </View>
              <Text style={styles.vitalValue}>{character.mp}<Text style={styles.vitalMax}>/{character.mpMax}</Text></Text>
              <View style={styles.miniBar}>
                <View style={[styles.miniFill, { backgroundColor: COLORS.arcane, width: `${(character.mp / character.mpMax) * 100}%` }]} />
              </View>
            </GlassCard>

            <GlassCard style={styles.vitalCard} glow={COLORS.gold}>
              <View style={styles.vitalHeader}>
                <Ionicons name="cash" size={14} color={COLORS.gold} />
                <Text style={[styles.vitalLabel, { color: COLORS.gold }]}>GOLD</Text>
              </View>
              <Text style={styles.vitalValue}>{character.gold}</Text>
              <Text style={[styles.vitalMax, { fontSize: 10, marginTop: 4 }]}>marks of Veliryn</Text>
            </GlassCard>
          </View>
        </View>

        <RuneDivider label="Attributes" />

        {/* ATTRIBUTES */}
        <View style={styles.attrGrid}>
          {ATTRIBUTES.map(a => {
            const val = character.attributes[a.name] || a.base;
            return (
              <View key={a.name} style={styles.attrCard}>
                <StatRing value={val} max={20} label={a.short} color={COLORS.gold} size={64} />
                <Text style={styles.attrName}>{a.name}</Text>
                <Text style={styles.attrDesc} numberOfLines={2}>{a.desc}</Text>
              </View>
            );
          })}
        </View>

        <RuneDivider label="Honors" />

        {/* ACHIEVEMENTS */}
        <View style={{ paddingHorizontal: 18 }}>
          {ACHIEVEMENTS.map(ach => (
            <GlassCard key={ach.id} style={{ marginBottom: 10 }}>
              <View style={styles.achRow}>
                <View style={[styles.achIcon, { backgroundColor: ach.unlocked ? 'rgba(212,175,55,0.25)' : 'rgba(100,100,100,0.15)' }]}>
                  <Ionicons name={ach.unlocked ? 'trophy' : 'lock-closed'} size={20} color={ach.unlocked ? COLORS.gold : '#6B7280'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.achName, !ach.unlocked && { opacity: 0.5 }]}>{ach.name}</Text>
                  <Text style={styles.achDesc}>{ach.desc}</Text>
                </View>
              </View>
            </GlassCard>
          ))}
        </View>

        <RuneDivider />

        <View style={{ paddingHorizontal: 18, gap: 10 }}>
          <TouchableOpacity onPress={onRest} style={styles.actionBtn}>
            <Ionicons name="moon" size={16} color={COLORS.gold} />
            <Text style={styles.actionText}>Rest by the fire</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onLeave} style={[styles.actionBtn, { borderColor: 'rgba(220,38,38,0.4)' }]}>
            <Ionicons name="exit-outline" size={16} color={COLORS.blood} />
            <Text style={[styles.actionText, { color: COLORS.blood }]}>Forsake the Saga</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingHorizontal: 18, marginBottom: 24 },
  portraitWrap: { width: 130, height: 130, borderRadius: 65, marginBottom: 14, position: 'relative' },
  portrait: { width: 130, height: 130, borderRadius: 65, borderWidth: 2, borderColor: COLORS.gold },
  portraitGlow: { position: 'absolute', width: 130, height: 130, borderRadius: 65, shadowColor: COLORS.gold, shadowOpacity: 0.7, shadowRadius: 20 },
  lvlBadge: { position: 'absolute', bottom: -6, right: -6, width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.bgDeep },
  lvlText: { color: COLORS.bgDeep, fontWeight: '800', fontSize: 14 },
  name: { color: COLORS.parchment, fontSize: 26, fontWeight: '300', letterSpacing: 2, marginBottom: 4 },
  race: { color: COLORS.gold, fontSize: 11, letterSpacing: 3, marginBottom: 16 },
  xpBar: { width: '100%', height: 8, borderRadius: 4, backgroundColor: 'rgba(45,27,78,0.6)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', overflow: 'hidden', marginTop: 6 },
  xpFill: { height: '100%', backgroundColor: COLORS.gold },
  xpText: { position: 'absolute', alignSelf: 'center', top: -18, color: COLORS.silver, fontSize: 10, letterSpacing: 1.5 },
  vitalsRow: { flexDirection: 'row', gap: 8 },
  vitalCard: { flex: 1 },
  vitalHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  vitalLabel: { fontSize: 9, letterSpacing: 2, fontWeight: '700' },
  vitalValue: { color: COLORS.parchment, fontSize: 22, fontWeight: '300' },
  vitalMax: { color: COLORS.silver, fontSize: 13, opacity: 0.6 },
  miniBar: { height: 3, backgroundColor: 'rgba(45,27,78,0.6)', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  miniFill: { height: '100%' },
  attrGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 18, gap: 12 },
  attrCard: { width: '47%', backgroundColor: 'rgba(45,27,78,0.3)', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)', marginBottom: 6 },
  attrName: { color: COLORS.gold, fontSize: 12, fontWeight: '600', letterSpacing: 1.5, marginTop: 8 },
  attrDesc: { color: COLORS.silver, fontSize: 10, textAlign: 'center', marginTop: 4, opacity: 0.7, lineHeight: 14 },
  achRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  achIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' },
  achName: { color: COLORS.parchment, fontSize: 14, fontWeight: '500', marginBottom: 2 },
  achDesc: { color: COLORS.silver, fontSize: 11, opacity: 0.7 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', backgroundColor: 'rgba(45,27,78,0.3)' },
  actionText: { color: COLORS.gold, fontSize: 13, letterSpacing: 1.5, fontWeight: '600' },
});

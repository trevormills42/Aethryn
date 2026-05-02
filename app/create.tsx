import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, StyleSheet, Dimensions, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RACES, ATTRIBUTES, Race } from './lib/gameData';
import { useGame } from './lib/gameStore';
import GlassCard from './components/GlassCard';
import RuneDivider from './components/RuneDivider';

const { width } = Dimensions.get('window');

export default function CreateCharacter() {
  const { createCharacter } = useGame();
  const [name, setName] = useState('');
  const [selectedRace, setSelectedRace] = useState<Race>(RACES[0]);

  const onConfirm = () => {
    if (!name.trim()) {
      Alert.alert('A hero needs a name', 'Whisper one to the wind and try again.');
      return;
    }
    createCharacter(name.trim(), selectedRace);
    router.replace('/game');
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgDeep }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={COLORS.gold} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FORGE A HERO</Text>
          <View style={{ width: 36 }} />
        </View>

        <RuneDivider label="Name Thyself" />

        <View style={{ paddingHorizontal: 18 }}>
          <GlassCard>
            <Text style={styles.label}>True Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Whisper a name..."
              placeholderTextColor="rgba(192,199,209,0.4)"
              style={styles.input}
              maxLength={24}
            />
          </GlassCard>
        </View>

        <RuneDivider label="Choose Thy Bloodline" />

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 18, gap: 12 }}
        >
          {RACES.map(race => {
            const isSel = selectedRace.id === race.id;
            return (
              <TouchableOpacity
                key={race.id}
                onPress={() => setSelectedRace(race)}
                activeOpacity={0.8}
                style={[styles.raceCard, isSel && styles.raceCardSelected]}
              >
                <Image source={{ uri: race.image }} style={styles.racePortrait} resizeMode="cover" />
                <View style={styles.raceOverlay} />
                {isSel && <View style={styles.raceSelectedGlow} />}
                <View style={styles.raceContent}>
                  <Text style={styles.raceTitle}>{race.title}</Text>
                  <Text style={styles.raceName}>{race.name}</Text>
                  <View style={styles.bonusRow}>
                    {race.bonuses.map((b, i) => (
                      <View key={i} style={styles.bonusBadge}>
                        <Text style={styles.bonusText}>+{b.val} {b.attr.slice(0, 3).toUpperCase()}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Selected race details */}
        <View style={{ paddingHorizontal: 18, marginTop: 18 }}>
          <GlassCard glow={COLORS.gold}>
            <Text style={styles.detailHeader}>{selectedRace.name.toUpperCase()} · {selectedRace.title}</Text>
            <Text style={styles.detailLore}>{selectedRace.lore}</Text>

            <View style={styles.divider} />

            <Text style={styles.smallLabel}>STARTING GIFT</Text>
            <Text style={styles.giftText}>✦ {selectedRace.startingSkill}</Text>

            <Text style={[styles.smallLabel, { marginTop: 14 }]}>YOUR HOOK</Text>
            <Text style={styles.hookText}>{selectedRace.storyHook}</Text>
          </GlassCard>
        </View>

        {/* Attributes preview */}
        <View style={{ paddingHorizontal: 18, marginTop: 18 }}>
          <Text style={styles.sectionTitle}>Starting Attributes</Text>
          <View style={styles.attrGrid}>
            {ATTRIBUTES.map(a => {
              const bonus = selectedRace.bonuses.find(b => b.attr === a.name);
              const val = a.base + (bonus?.val || 0);
              return (
                <View key={a.name} style={styles.attrCell}>
                  <Text style={styles.attrShort}>{a.short}</Text>
                  <Text style={styles.attrVal}>{val}</Text>
                  {bonus && <Text style={styles.attrBonus}>+{bonus.val}</Text>}
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ paddingHorizontal: 18, marginTop: 24 }}>
          <TouchableOpacity onPress={onConfirm} style={styles.confirmBtn} activeOpacity={0.85}>
            <Ionicons name="sparkles" size={18} color={COLORS.bgDeep} />
            <Text style={styles.confirmText}>Begin the Saga</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 56, paddingBottom: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)' },
  headerTitle: { color: COLORS.gold, fontSize: 13, letterSpacing: 4, fontWeight: '600' },
  label: { color: COLORS.gold, fontSize: 11, letterSpacing: 3, marginBottom: 8 },
  input: { color: COLORS.parchment, fontSize: 22, fontWeight: '300', letterSpacing: 1, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(212,175,55,0.3)' },
  raceCard: { width: width * 0.7, height: 380, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)' },
  raceCardSelected: { borderColor: COLORS.gold, borderWidth: 2 },
  racePortrait: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  raceOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,8,23,0.45)' },
  raceSelectedGlow: { ...StyleSheet.absoluteFillObject, borderRadius: 18, shadowColor: COLORS.gold, shadowOpacity: 0.6, shadowRadius: 24 },
  raceContent: { ...StyleSheet.absoluteFillObject, padding: 18, justifyContent: 'flex-end' },
  raceTitle: { color: COLORS.gold, fontSize: 11, letterSpacing: 3, marginBottom: 4 },
  raceName: { color: COLORS.parchment, fontSize: 32, fontWeight: '300', letterSpacing: 2, marginBottom: 12 },
  bonusRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  bonusBadge: { backgroundColor: 'rgba(212,175,55,0.2)', borderWidth: 1, borderColor: COLORS.gold, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  bonusText: { color: COLORS.gold, fontSize: 11, fontWeight: '600' },
  detailHeader: { color: COLORS.gold, fontSize: 13, letterSpacing: 3, fontWeight: '600', marginBottom: 10 },
  detailLore: { color: COLORS.parchment, fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: 'rgba(212,175,55,0.25)', marginVertical: 14 },
  smallLabel: { color: COLORS.silver, fontSize: 10, letterSpacing: 2.5, opacity: 0.7, marginBottom: 6 },
  giftText: { color: COLORS.arcane, fontSize: 16, fontWeight: '500' },
  hookText: { color: COLORS.parchment, fontSize: 13, lineHeight: 20, opacity: 0.9 },
  sectionTitle: { color: COLORS.gold, fontSize: 14, letterSpacing: 2, marginBottom: 12, fontWeight: '600' },
  attrGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  attrCell: { width: (width - 36 - 24) / 4, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(45,27,78,0.4)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)', borderRadius: 12 },
  attrShort: { color: COLORS.silver, fontSize: 10, letterSpacing: 2, marginBottom: 4 },
  attrVal: { color: COLORS.parchment, fontSize: 22, fontWeight: '300' },
  attrBonus: { color: COLORS.gold, fontSize: 9, marginTop: 2 },
  confirmBtn: { backgroundColor: COLORS.gold, paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, shadowColor: COLORS.gold, shadowOpacity: 0.5, shadowRadius: 16 },
  confirmText: { color: COLORS.bgDeep, fontSize: 16, fontWeight: '700', letterSpacing: 1.5 },
});

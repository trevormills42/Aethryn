import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, REGIONS, QUESTS } from '../lib/gameData';
import { ENCOUNTERS, ENEMIES } from '../lib/combatData';
import { useGame } from '../lib/gameStore';
import GlassCard from '../components/GlassCard';
import RuneDivider from '../components/RuneDivider';

const { width } = Dimensions.get('window');
const MAP_W = width - 36;
const MAP_H = MAP_W * 1.1;

export default function WorldScreen() {
  const { character, visitRegion, gainXP, startEncounter } = useGame();
  const [openRegion, setOpenRegion] = useState<string | null>(null);


  if (!character) return null;

  const region = REGIONS.find(r => r.id === openRegion);
  const visited = (id: string) => character.visitedRegions.includes(id);

  const onTravel = (id: string) => {
    visitRegion(id);
    setOpenRegion(id);
  };

  const onEncounter = () => {
    const outcomes = [
      { txt: 'A starving wolf bars your path. You spare it. It leaves you a bone.', xp: 20 },
      { txt: 'You find a shrine half-buried. The carving is fresh, though the stone is old.', xp: 15 },
      { txt: 'A merchant trades in stories. You give her one. She gives you a coin that hums.', xp: 25 },
      { txt: 'A figure watches from the trees and does not look away. You walk on.', xp: 10 },
      { txt: 'The wind speaks a name you almost remember.', xp: 30 },
    ];
    const o = outcomes[Math.floor(Math.random() * outcomes.length)];
    gainXP(o.xp);
    Alert.alert('Encounter', `${o.txt}\n\n+${o.xp} XP`);
  };

  const onHunt = (regionId: string) => {
    const tables = ENCOUNTERS[regionId] || [['bandit']];
    const enemies = tables[Math.floor(Math.random() * tables.length)];
    const names = enemies.map(eid => ENEMIES[eid]?.name || eid).join(', ');
    Alert.alert(
      'You are not alone.',
      `${names} bar your path.\n\nReady your blade?`,
      [
        { text: 'Withdraw', style: 'cancel' },
        {
          text: 'Engage',
          onPress: () => {
            startEncounter({ regionId, enemyIds: enemies });
            setOpenRegion(null);
            router.push('/combat');
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgDeep }}>
      <ScrollView contentContainerStyle={{ paddingTop: 56, paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: 18 }}>
          <Text style={styles.heading}>THE SUNDERED REALM</Text>
          <Text style={styles.subheading}>Nine regions. Each remembers you.</Text>
        </View>

        {/* Map */}
        <View style={styles.mapWrap}>
          <View style={styles.map}>
            {/* faux land masses */}
            <View style={[styles.landmass, { top: '10%', left: '8%', width: '60%', height: '45%' }]} />
            <View style={[styles.landmass, { top: '50%', left: '30%', width: '55%', height: '40%' }]} />
            <View style={[styles.landmass, { top: '5%', left: '60%', width: '35%', height: '30%' }]} />

            {/* connecting lines (paths) */}
            {REGIONS.map((r, i) => {
              if (i === 0) return null;
              const prev = REGIONS[i - 1];
              return (
                <View
                  key={`line-${r.id}`}
                  style={{
                    position: 'absolute',
                    left: `${Math.min(prev.x, r.x)}%`,
                    top: `${Math.min(prev.y, r.y) + 2}%`,
                    width: `${Math.abs(r.x - prev.x) || 1}%`,
                    height: `${Math.abs(r.y - prev.y) || 1}%`,
                    borderTopWidth: 1,
                    borderColor: 'rgba(212,175,55,0.2)',
                    borderStyle: 'dashed',
                  }}
                />
              );
            })}

            {REGIONS.map(r => {
              const isVisited = visited(r.id);
              return (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => onTravel(r.id)}
                  style={[styles.pin, { left: `${r.x}%`, top: `${r.y}%` }]}
                >
                  <View style={[styles.pinDot, { backgroundColor: isVisited ? COLORS.gold : 'rgba(192,199,209,0.4)', borderColor: isVisited ? COLORS.gold : COLORS.silver }]}>
                    <Ionicons name={isVisited ? 'flag' : 'help'} size={10} color={COLORS.bgDeep} />
                  </View>
                  <Text style={[styles.pinLabel, { color: isVisited ? COLORS.gold : COLORS.silver }]} numberOfLines={1}>{r.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <RuneDivider label={`${character.visitedRegions.length} of ${REGIONS.length} Discovered`} />

        {/* Region list */}
        <View style={{ paddingHorizontal: 18 }}>
          {REGIONS.map(r => {
            const isVisited = visited(r.id);
            const questHere = QUESTS.find(q => q.region === r.name);
            return (
              <TouchableOpacity key={r.id} onPress={() => onTravel(r.id)} style={{ marginBottom: 10 }} activeOpacity={0.85}>
                <GlassCard glow={isVisited ? COLORS.gold : undefined}>
                  <View style={styles.regionRow}>
                    <View style={[styles.dangerBadge, { borderColor: getDangerColor(r.danger) }]}>
                      <Text style={[styles.dangerText, { color: getDangerColor(r.danger) }]}>{'★'.repeat(r.danger)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.regionName}>{r.name}</Text>
                      <Text style={styles.regionDesc}>{r.desc}</Text>
                      {questHere && (
                        <View style={styles.questHint}>
                          <Ionicons name="bookmark" size={10} color={COLORS.gold} />
                          <Text style={styles.questHintText}>{questHere.title}</Text>
                        </View>
                      )}
                    </View>
                    <Ionicons name={isVisited ? 'checkmark-circle' : 'chevron-forward'} size={20} color={isVisited ? '#10B981' : COLORS.gold} />
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Region modal */}
      <Modal visible={!!region} transparent animationType="fade" onRequestClose={() => setOpenRegion(null)}>
        {region && (
          <View style={styles.modalBg}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalRegion}>DANGER {'★'.repeat(region.danger)}</Text>
                <TouchableOpacity onPress={() => setOpenRegion(null)}>
                  <Ionicons name="close" size={22} color={COLORS.gold} />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalTitle}>{region.name}</Text>
              <Text style={styles.modalDesc}>{region.desc}</Text>

              <View style={{ height: 14 }} />

              <TouchableOpacity onPress={() => onHunt(region.id)} style={[styles.encounterBtn, { backgroundColor: COLORS.blood }]}>
                <Ionicons name="skull" size={18} color={COLORS.parchment} />
                <Text style={[styles.encounterText, { color: COLORS.parchment }]}>Hunt for foes</Text>
              </TouchableOpacity>

              <View style={{ height: 8 }} />

              <TouchableOpacity onPress={onEncounter} style={[styles.encounterBtn, { backgroundColor: 'rgba(45,27,78,0.6)', borderWidth: 1, borderColor: COLORS.gold }]}>
                <Ionicons name="footsteps" size={18} color={COLORS.gold} />
                <Text style={[styles.encounterText, { color: COLORS.gold }]}>Wander the region</Text>
              </TouchableOpacity>

              <Text style={styles.modalNote}>Hunting yields combat, XP, gold, and rare drops. Wandering yields lore.</Text>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}


function getDangerColor(d: number) {
  if (d <= 1) return '#10B981';
  if (d <= 2) return COLORS.gold;
  if (d <= 3) return '#F97316';
  if (d <= 4) return COLORS.ember;
  return COLORS.blood;
}

const styles = StyleSheet.create({
  heading: { color: COLORS.gold, fontSize: 22, fontWeight: '300', letterSpacing: 4 },
  subheading: { color: COLORS.silver, fontSize: 11, fontStyle: 'italic', opacity: 0.7, marginTop: 4 },
  mapWrap: { paddingHorizontal: 18, marginTop: 18 },
  map: { width: MAP_W, height: MAP_H, borderRadius: 16, backgroundColor: COLORS.bgDark, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', overflow: 'hidden', position: 'relative' },
  landmass: { position: 'absolute', backgroundColor: 'rgba(45,27,78,0.5)', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(212,175,55,0.15)' },
  pin: { position: 'absolute', alignItems: 'center', transform: [{ translateX: -14 }, { translateY: -14 }] },
  pinDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.gold, shadowOpacity: 0.6, shadowRadius: 8 },
  pinLabel: { fontSize: 9, marginTop: 4, fontWeight: '600', maxWidth: 90, textAlign: 'center', textShadowColor: COLORS.bgDeep, textShadowRadius: 4 },
  regionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dangerBadge: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,17,40,0.6)' },
  dangerText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  regionName: { color: COLORS.parchment, fontSize: 15, fontWeight: '500', marginBottom: 3 },
  regionDesc: { color: COLORS.silver, fontSize: 12, fontStyle: 'italic', opacity: 0.8 },
  questHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  questHintText: { color: COLORS.gold, fontSize: 10, fontStyle: 'italic' },
  modalBg: { flex: 1, backgroundColor: 'rgba(5,8,23,0.85)', justifyContent: 'center', padding: 18 },
  modalCard: { backgroundColor: COLORS.ink, borderRadius: 18, borderWidth: 1, borderColor: COLORS.gold, padding: 22 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalRegion: { color: COLORS.gold, fontSize: 10, letterSpacing: 2.5 },
  modalTitle: { color: COLORS.parchment, fontSize: 24, fontWeight: '300', letterSpacing: 1, marginBottom: 8 },
  modalDesc: { color: COLORS.parchment, fontSize: 14, lineHeight: 21, fontStyle: 'italic' },
  encounterBtn: { flexDirection: 'row', backgroundColor: COLORS.gold, paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 8 },
  encounterText: { color: COLORS.bgDeep, fontWeight: '700', letterSpacing: 1.5, fontSize: 13 },
  modalNote: { color: COLORS.silver, fontSize: 11, fontStyle: 'italic', textAlign: 'center', marginTop: 10, opacity: 0.7 },
});

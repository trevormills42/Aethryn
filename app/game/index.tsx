import React, { useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, ATTRIBUTES, ACHIEVEMENTS } from '../lib/gameData';
import { useGame } from '../lib/gameStore';
import GlassCard from '../components/GlassCard';
import RuneDivider from '../components/RuneDivider';
import StatRing from '../components/StatRing';

export default function CharacterSheet() {
  const { character, resetCharacter, spendAttributePoint, rest } = useGame();
  // Modal state for rest feedback. Shows the lyrical confirmation on success
  // and a "no rations" message when the player tries to rest empty-handed.
  const [restModal, setRestModal] = useState<
    | null
    | { kind: 'no_rations' }
    | { kind: 'rested'; pool: number }
  >(null);

  if (!character) return null;

  const xpForNext = character.level * 100;
  const xpPct = character.xp / xpForNext;
  const unspent = character.unspentAttributePoints ?? 0;
  const restedXP = character.restedXP ?? 0;
  // Rested pool is rendered as a second segment on the XP bar, starting from
  // current XP and extending by restedXP worth of width (capped at the bar).
  const restedPct = Math.min(1 - xpPct, restedXP / xpForNext);
  const rationCount = character.inventory.filter(id => id === 'i26').length;

  const onRest = () => {
    const result = rest();
    setRestModal(result);
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
            {/* Rested pool overlay — sits next to current XP fill, in arcane purple. */}
            {restedXP > 0 && (
              <View style={[styles.xpRestedFill, { left: `${xpPct * 100}%`, width: `${restedPct * 100}%` }]} />
            )}
            <Text style={styles.xpText}>{character.xp} / {xpForNext} XP</Text>
          </View>
          {restedXP > 0 && (
            <Text style={styles.restedLabel}>✦ Rested: {restedXP} XP at 1.5×</Text>
          )}
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

        {/* Attribute-points-available banner. Only renders when there are unspent points. */}
        {unspent > 0 && (
          <View style={{ paddingHorizontal: 18, marginBottom: 12 }}>
            <GlassCard glow={COLORS.gold}>
              <View style={styles.attrPointsRow}>
                <Ionicons name="add-circle" size={20} color={COLORS.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.attrPointsTitle}>
                    {unspent} {unspent === 1 ? 'attribute point' : 'attribute points'} available
                  </Text>
                  <Text style={styles.attrPointsHint}>
                    Tap an attribute to invest. Each point raises that attribute by 1, and adjusts your pools accordingly.
                  </Text>
                </View>
              </View>
            </GlassCard>
          </View>
        )}

        {/* ATTRIBUTES — same layout, but each card becomes a tappable +1 button when points are available. */}
        <View style={styles.attrGrid}>
          {ATTRIBUTES.map(a => {
            const val = character.attributes[a.name] ?? a.base;
            const canSpend = unspent > 0;
            const Wrapper: any = canSpend ? TouchableOpacity : View;
            return (
              <Wrapper
                key={a.name}
                onPress={canSpend ? () => spendAttributePoint(a.name) : undefined}
                activeOpacity={canSpend ? 0.7 : 1}
                style={[styles.attrCard, canSpend && styles.attrCardSpendable]}
              >
                <StatRing value={val} max={20} label={a.short} color={canSpend ? COLORS.gold : COLORS.gold} size={64} />
                <Text style={styles.attrName}>{a.name}</Text>
                <Text style={styles.attrDesc} numberOfLines={2}>{a.desc}</Text>
                {canSpend && (
                  <View style={styles.attrPlusBadge}>
                    <Ionicons name="add" size={14} color={COLORS.bgDeep} />
                  </View>
                )}
              </Wrapper>
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
            <Text style={styles.actionText}>Rest by the fire ({rationCount} rations)</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onLeave} style={[styles.actionBtn, { borderColor: 'rgba(220,38,38,0.4)' }]}>
            <Ionicons name="exit-outline" size={16} color={COLORS.blood} />
            <Text style={[styles.actionText, { color: COLORS.blood }]}>Forsake the Saga</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Rest outcome modal: works on web (Alert.alert callbacks don't fire there). */}
      <Modal visible={!!restModal} transparent animationType="fade" onRequestClose={() => setRestModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {restModal?.kind === 'no_rations' ? (
              <>
                <Text style={styles.modalTitle}>No Provisions</Text>
                <Text style={styles.modalDesc}>
                  You have no rations to share with the fire. Rest requires food and a little salt — you cannot earn it from nothing.
                </Text>
              </>
            ) : restModal?.kind === 'rested' ? (
              <>
                <Text style={[styles.modalTitle, { color: COLORS.gold }]}>The Fire Settles</Text>
                <Text style={styles.modalDesc}>
                  You eat. You sleep. You wake with the realm a little clearer in your mind.
                </Text>
                {restModal.pool > 0 ? (
                  <Text style={styles.modalRested}>
                    ✦ Rested: {restModal.pool} XP at 1.5× until earned
                  </Text>
                ) : (
                  <Text style={styles.modalRested}>
                    ✦ You are nearly to the next mark. The fire offers little to learn.
                  </Text>
                )}
              </>
            ) : null}
            <TouchableOpacity onPress={() => setRestModal(null)} style={[styles.actionBtn, { marginTop: 16 }]}>
              <Text style={styles.actionText}>Go on</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  // Rested overlay sits adjacent to the gold XP fill, in arcane purple, so the
  // player can read at a glance how much "bonus" runway they've got.
  xpRestedFill: { position: 'absolute', height: '100%', backgroundColor: COLORS.arcane, opacity: 0.65, top: 0 },
  xpText: { position: 'absolute', alignSelf: 'center', top: -18, color: COLORS.silver, fontSize: 10, letterSpacing: 1.5 },
  restedLabel: { color: COLORS.arcane, fontSize: 10, letterSpacing: 1, marginTop: 8, opacity: 0.85, fontStyle: 'italic' },
  vitalsRow: { flexDirection: 'row', gap: 8 },
  vitalCard: { flex: 1 },
  vitalHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  vitalLabel: { fontSize: 9, letterSpacing: 2, fontWeight: '700' },
  vitalValue: { color: COLORS.parchment, fontSize: 22, fontWeight: '300' },
  vitalMax: { color: COLORS.silver, fontSize: 13, opacity: 0.6 },
  miniBar: { height: 3, backgroundColor: 'rgba(45,27,78,0.6)', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  miniFill: { height: '100%' },
  attrPointsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  attrPointsTitle: { color: COLORS.gold, fontSize: 13, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  attrPointsHint: { color: COLORS.silver, fontSize: 11, opacity: 0.85, lineHeight: 15 },
  attrGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 18, gap: 12 },
  attrCard: { width: '47%', backgroundColor: 'rgba(45,27,78,0.3)', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)', marginBottom: 6 },
  attrCardSpendable: { borderColor: COLORS.gold, backgroundColor: 'rgba(212,175,55,0.08)' },
  attrName: { color: COLORS.gold, fontSize: 12, fontWeight: '600', letterSpacing: 1.5, marginTop: 8 },
  attrDesc: { color: COLORS.silver, fontSize: 10, textAlign: 'center', marginTop: 4, opacity: 0.7, lineHeight: 14 },
  attrPlusBadge: { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  achRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  achIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' },
  achName: { color: COLORS.parchment, fontSize: 14, fontWeight: '500', marginBottom: 2 },
  achDesc: { color: COLORS.silver, fontSize: 11, opacity: 0.7 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', backgroundColor: 'rgba(45,27,78,0.3)' },
  actionText: { color: COLORS.gold, fontSize: 13, letterSpacing: 1.5, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(5,8,23,0.85)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  modalCard: { width: '100%', maxWidth: 400, backgroundColor: COLORS.bgDeep, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(212,175,55,0.4)', padding: 22 },
  modalTitle: { color: COLORS.parchment, fontSize: 18, fontWeight: '300', letterSpacing: 3, marginBottom: 12, textAlign: 'center' },
  modalDesc: { color: COLORS.parchment, fontSize: 13, lineHeight: 21, fontStyle: 'italic', textAlign: 'center' },
  modalRested: { color: COLORS.arcane, fontSize: 11, letterSpacing: 1, marginTop: 14, textAlign: 'center', fontStyle: 'italic' },
});

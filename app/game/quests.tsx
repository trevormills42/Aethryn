import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, QUESTS } from '../lib/gameData';
import { useGame } from '../lib/gameStore';
import GlassCard from '../components/GlassCard';
import RuneDivider from '../components/RuneDivider';

export default function QuestsScreen() {
  const { character, toggleQuest, makeChoice } = useGame();
  const [filter, setFilter] = useState<'active' | 'available' | 'completed'>('active');
  const [openQuest, setOpenQuest] = useState<string | null>(null);

  if (!character) return null;

  const getStatus = (id: string) => character.quests[id] || 'available';

  const filtered = QUESTS.filter(q => getStatus(q.id) === filter);
  const counts = {
    active: QUESTS.filter(q => getStatus(q.id) === 'active').length,
    available: QUESTS.filter(q => getStatus(q.id) === 'available').length,
    completed: QUESTS.filter(q => getStatus(q.id) === 'completed').length,
  };

  const opening = QUESTS.find(q => q.id === openQuest);
  const openingStatus = opening ? getStatus(opening.id) : 'available';
  const chosen = opening ? character.questChoices[opening.id] : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgDeep }}>
      <ScrollView contentContainerStyle={{ paddingTop: 56, paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: 18 }}>
          <Text style={styles.heading}>QUEST JOURNAL</Text>
          <Text style={styles.subheading}>The chronicle remembers every choice</Text>
        </View>

        <View style={styles.tabs}>
          {(['active', 'available', 'completed'] as const).map(f => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.tab, filter === f && styles.tabActive]}>
              <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>
                {f.toUpperCase()} · {counts[f]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ paddingHorizontal: 18 }}>
          {filtered.length === 0 && (
            <GlassCard><Text style={styles.empty}>No tales of this kind, yet.</Text></GlassCard>
          )}
          {filtered.map(quest => (
            <TouchableOpacity key={quest.id} onPress={() => setOpenQuest(quest.id)} activeOpacity={0.85} style={{ marginBottom: 10 }}>
              <GlassCard glow={filter === 'active' ? COLORS.gold : undefined}>
                <View style={styles.questHeader}>
                  <Ionicons name={filter === 'completed' ? 'checkmark-circle' : 'bookmark'} size={16} color={filter === 'completed' ? '#10B981' : COLORS.gold} />
                  <Text style={styles.questRegion}>{quest.region.toUpperCase()}</Text>
                </View>
                <Text style={styles.questTitle}>{quest.title}</Text>
                <Text style={styles.questBrief} numberOfLines={2}>{quest.brief}</Text>
                <View style={styles.questFooter}>
                  <Text style={styles.giver}>given by {quest.giver}</Text>
                  <View style={styles.rewardChip}>
                    <Ionicons name="gift" size={10} color={COLORS.gold} />
                    <Text style={styles.rewardText}>{quest.reward}</Text>
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        <RuneDivider label="The Codex Listens" />
        <View style={{ paddingHorizontal: 18 }}>
          <GlassCard>
            <Text style={styles.codex}>
              "Every quest taken is a thread woven into the Loom of Aetheryn. Pull one, and another tightens elsewhere. Cut one, and something unravels."
            </Text>
          </GlassCard>
        </View>
      </ScrollView>

      {/* Quest detail modal */}
      <Modal visible={!!opening} transparent animationType="fade" onRequestClose={() => setOpenQuest(null)}>
        {opening && (
          <View style={styles.modalBg}>
            <View style={styles.modalCard}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalRegion}>{opening.region}</Text>
                  <TouchableOpacity onPress={() => setOpenQuest(null)}>
                    <Ionicons name="close" size={22} color={COLORS.gold} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalTitle}>{opening.title}</Text>
                <Text style={styles.modalGiver}>given by {opening.giver}</Text>

                <View style={styles.modalDivider} />

                <Text style={styles.modalLabel}>THE TALE</Text>
                <Text style={styles.modalBody}>{opening.brief}</Text>

                <Text style={[styles.modalLabel, { marginTop: 16 }]}>OBJECTIVE</Text>
                <Text style={styles.modalBody}>{opening.objective}</Text>

                <Text style={[styles.modalLabel, { marginTop: 16 }]}>REWARD</Text>
                <Text style={[styles.modalBody, { color: COLORS.gold }]}>{opening.reward}</Text>

                {opening.choices && (
                  <>
                    <Text style={[styles.modalLabel, { marginTop: 18 }]}>YOUR PATH</Text>
                    {opening.choices.map((c, i) => {
                      const isChosen = chosen === i;
                      return (
                        <TouchableOpacity
                          key={i}
                          onPress={() => makeChoice(opening.id, i)}
                          style={[styles.choiceBtn, isChosen && styles.choiceChosen]}
                        >
                          <Ionicons name={isChosen ? 'radio-button-on' : 'radio-button-off'} size={18} color={isChosen ? COLORS.gold : COLORS.silver} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.choiceLabel}>{c.label}</Text>
                            {isChosen && <Text style={styles.choiceConsequence}>{c.consequence}</Text>}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </>
                )}

                <View style={{ height: 14 }} />

                <TouchableOpacity onPress={() => { toggleQuest(opening.id); }} style={styles.modalAction}>
                  <Ionicons
                    name={openingStatus === 'available' ? 'play' : openingStatus === 'active' ? 'checkmark' : 'arrow-undo'}
                    size={18} color={COLORS.bgDeep}
                  />
                  <Text style={styles.modalActionText}>
                    {openingStatus === 'available' ? 'Accept Quest' : openingStatus === 'active' ? 'Mark Complete' : 'Reopen Quest'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { color: COLORS.gold, fontSize: 22, fontWeight: '300', letterSpacing: 4 },
  subheading: { color: COLORS.silver, fontSize: 11, fontStyle: 'italic', opacity: 0.7, marginTop: 4 },
  tabs: { flexDirection: 'row', paddingHorizontal: 18, gap: 6, marginVertical: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)', backgroundColor: 'rgba(45,27,78,0.3)' },
  tabActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  tabText: { color: COLORS.silver, fontSize: 10, letterSpacing: 1.5, fontWeight: '600' },
  tabTextActive: { color: COLORS.bgDeep },
  questHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  questRegion: { color: COLORS.gold, fontSize: 9, letterSpacing: 2, opacity: 0.9 },
  questTitle: { color: COLORS.parchment, fontSize: 17, fontWeight: '500', letterSpacing: 0.5, marginBottom: 6 },
  questBrief: { color: COLORS.silver, fontSize: 12.5, lineHeight: 18, fontStyle: 'italic', opacity: 0.85 },
  questFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  giver: { color: COLORS.silver, fontSize: 10, opacity: 0.6 },
  rewardChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(212,175,55,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  rewardText: { color: COLORS.gold, fontSize: 10, fontWeight: '600' },
  empty: { color: COLORS.silver, textAlign: 'center', fontStyle: 'italic', opacity: 0.6, paddingVertical: 14 },
  codex: { color: COLORS.parchment, fontSize: 13, fontStyle: 'italic', textAlign: 'center', lineHeight: 20 },
  modalBg: { flex: 1, backgroundColor: 'rgba(5,8,23,0.85)', justifyContent: 'center', padding: 18 },
  modalCard: { backgroundColor: COLORS.ink, borderRadius: 18, borderWidth: 1, borderColor: COLORS.gold, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalRegion: { color: COLORS.gold, fontSize: 10, letterSpacing: 2.5 },
  modalTitle: { color: COLORS.parchment, fontSize: 24, fontWeight: '300', letterSpacing: 1, marginBottom: 4 },
  modalGiver: { color: COLORS.silver, fontSize: 11, fontStyle: 'italic', opacity: 0.7 },
  modalDivider: { height: 1, backgroundColor: 'rgba(212,175,55,0.3)', marginVertical: 14 },
  modalLabel: { color: COLORS.gold, fontSize: 10, letterSpacing: 2.5, marginBottom: 6, fontWeight: '600' },
  modalBody: { color: COLORS.parchment, fontSize: 13.5, lineHeight: 21 },
  choiceBtn: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)', marginTop: 8 },
  choiceChosen: { borderColor: COLORS.gold, backgroundColor: 'rgba(212,175,55,0.08)' },
  choiceLabel: { color: COLORS.parchment, fontSize: 13, fontWeight: '500' },
  choiceConsequence: { color: COLORS.gold, fontSize: 11, fontStyle: 'italic', marginTop: 4, lineHeight: 16 },
  modalAction: { flexDirection: 'row', backgroundColor: COLORS.gold, paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  modalActionText: { color: COLORS.bgDeep, fontWeight: '700', letterSpacing: 1.5, fontSize: 13 },
});

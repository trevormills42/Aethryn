import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SKILLS, SCHOOLS } from '../lib/gameData';
import { useGame } from '../lib/gameStore';
import GlassCard from '../components/GlassCard';
import RuneDivider from '../components/RuneDivider';

// Skills are now use-based exclusively. There is no Practice button — that was
// a free-XP cookie that undermined the whole philosophy. Instead, each skill
// shows uses accumulated and the threshold to unlock the next-tier skill (its
// "child") if any. Players see what they're working toward and how close they
// are. Skills awaken through use in combat (and certain wander outcomes), full
// stop.

export default function SkillsScreen() {
  const { character } = useGame();
  const [activeSchool, setActiveSchool] = useState(SCHOOLS[0].id);

  if (!character) return null;

  const schoolSkills = SKILLS.filter(s => s.school === activeSchool);
  const school = SCHOOLS.find(s => s.id === activeSchool)!;

  // Group by tier for display
  const byTier: Record<number, typeof SKILLS> = {};
  schoolSkills.forEach(s => {
    if (!byTier[s.tier]) byTier[s.tier] = [];
    byTier[s.tier].push(s);
  });

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgDeep }}>
      <ScrollView contentContainerStyle={{ paddingTop: 56, paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: 18, marginBottom: 8 }}>
          <Text style={styles.heading}>THE SCHOOLS</Text>
          <Text style={styles.subheading}>Skills awaken through use, not selection</Text>
        </View>

        {/* School tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, gap: 8, paddingVertical: 14 }}>
          {SCHOOLS.map(s => {
            const isActive = activeSchool === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                onPress={() => setActiveSchool(s.id)}
                style={[styles.schoolTab, isActive && { backgroundColor: s.color, borderColor: s.color }]}
              >
                <Text style={[styles.schoolTabText, isActive && { color: COLORS.bgDeep }]}>{s.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={{ paddingHorizontal: 18 }}>
          <GlassCard glow={school.color}>
            <Text style={[styles.schoolName, { color: school.color }]}>{school.name.toUpperCase()}</Text>
            <Text style={styles.schoolDesc}>{school.desc}</Text>
          </GlassCard>
        </View>

        {[1, 2, 3, 4].map(tier => {
          const skills = byTier[tier];
          if (!skills || skills.length === 0) return null;
          return (
            <View key={tier}>
              <RuneDivider label={`Tier ${tier}`} />
              <View style={{ paddingHorizontal: 18 }}>
                {skills.map(skill => {
                  const unlocked = character.unlockedSkills.includes(skill.id);
                  const uses = character.skillUses[skill.id] || 0;
                  // The "next" skill is one that names this skill as its prereq — if
                  // any. The progress bar runs against THAT skill's unlockUses.
                  const next = SKILLS.find(s => s.prereq === skill.id);
                  const target = next?.unlockUses ?? null;
                  const pct = target ? Math.min(1, uses / target) : 1;
                  const prereq = skill.prereq ? SKILLS.find(s => s.id === skill.prereq) : null;

                  return (
                    <View key={skill.id} style={{ marginBottom: 10 }}>
                      <GlassCard style={!unlocked ? { opacity: 0.55 } : {}} glow={unlocked ? school.color : undefined}>
                        <View style={styles.skillRow}>
                          <View style={[styles.skillIcon, { borderColor: school.color }]}>
                            <Ionicons
                              name={unlocked ? 'flash' : 'lock-closed'}
                              size={18}
                              color={unlocked ? school.color : COLORS.silver}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={styles.skillHeaderRow}>
                              <Text style={styles.skillName}>{skill.name}</Text>
                              {unlocked && (
                                <Text style={[styles.skillUses, { color: school.color }]}>
                                  {uses} {uses === 1 ? 'use' : 'uses'}
                                </Text>
                              )}
                            </View>
                            <Text style={styles.skillDesc}>{skill.desc}</Text>

                            {/* Progress: only show when unlocked AND a next-tier exists. */}
                            {unlocked && next && target !== null && (
                              <>
                                <View style={styles.skillBar}>
                                  <View style={[styles.skillFill, { backgroundColor: school.color, width: `${pct * 100}%` }]} />
                                </View>
                                <Text style={styles.progressText}>
                                  {uses >= target
                                    ? `✦ ${next.name} awakens — use ${skill.name} once more`
                                    : `${uses} / ${target} toward ${next.name}`}
                                </Text>
                              </>
                            )}

                            {/* Terminal-tier skill (no next): show "mastery" line. */}
                            {unlocked && !next && (
                              <Text style={styles.masteryText}>✦ Mastery — no further tier in this line</Text>
                            )}

                            {/* Locked: show the path that opens it. */}
                            {!unlocked && prereq && (
                              <Text style={styles.locked}>
                                Awakens when {prereq.name} reaches {skill.unlockUses} uses
                              </Text>
                            )}
                          </View>
                        </View>
                      </GlassCard>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

        <View style={{ paddingHorizontal: 18, marginTop: 16 }}>
          <Text style={styles.tip}>
            ✦ Skills train through use. Cast, strike, sneak — the realm teaches what it sees you do.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { color: COLORS.gold, fontSize: 22, fontWeight: '300', letterSpacing: 4 },
  subheading: { color: COLORS.silver, fontSize: 11, fontStyle: 'italic', opacity: 0.7, marginTop: 4 },
  schoolTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', backgroundColor: 'rgba(45,27,78,0.4)' },
  schoolTabText: { color: COLORS.silver, fontSize: 11, letterSpacing: 1.5, fontWeight: '600' },
  schoolName: { fontSize: 14, letterSpacing: 3, fontWeight: '700', marginBottom: 6 },
  schoolDesc: { color: COLORS.parchment, fontSize: 13, fontStyle: 'italic', lineHeight: 19 },
  skillRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  skillHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skillIcon: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,17,40,0.6)' },
  skillName: { color: COLORS.parchment, fontSize: 14, fontWeight: '600', flex: 1 },
  skillUses: { fontSize: 10, fontWeight: '600', letterSpacing: 1 },
  skillDesc: { color: COLORS.silver, fontSize: 12, marginTop: 3, opacity: 0.85, lineHeight: 17 },
  skillBar: { height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  skillFill: { height: '100%' },
  progressText: { color: COLORS.silver, fontSize: 10, fontStyle: 'italic', marginTop: 6, opacity: 0.85, letterSpacing: 0.3 },
  masteryText: { color: COLORS.gold, fontSize: 10, fontStyle: 'italic', marginTop: 6, opacity: 0.7, letterSpacing: 0.3 },
  locked: { color: COLORS.silver, fontSize: 10, fontStyle: 'italic', marginTop: 6, opacity: 0.6 },
  tip: { color: COLORS.gold, fontSize: 11, textAlign: 'center', opacity: 0.7, fontStyle: 'italic', lineHeight: 16, paddingHorizontal: 12 },
});

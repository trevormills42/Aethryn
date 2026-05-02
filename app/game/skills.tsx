import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SKILLS, SCHOOLS } from '../lib/gameData';
import { useGame } from '../lib/gameStore';
import GlassCard from '../components/GlassCard';
import RuneDivider from '../components/RuneDivider';

export default function SkillsScreen() {
  const { character, trainSkill } = useGame();
  const [activeSchool, setActiveSchool] = useState(SCHOOLS[0].id);

  if (!character) return null;

  const schoolSkills = SKILLS.filter(s => s.school === activeSchool);
  const school = SCHOOLS.find(s => s.id === activeSchool)!;

  const onTrain = (skillId: string) => {
    if (!character.unlockedSkills.includes(skillId)) {
      Alert.alert('Not yet awakened', 'Practice its prerequisite first to awaken this art.');
      return;
    }
    trainSkill(skillId, 5);
  };

  // Group by tier
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
                  const next = SKILLS.find(s => s.prereq === skill.id);
                  const target = next ? next.unlockUses : 100;
                  const pct = Math.min(1, uses / target);

                  return (
                    <TouchableOpacity
                      key={skill.id}
                      onPress={() => onTrain(skill.id)}
                      activeOpacity={0.85}
                      style={{ marginBottom: 10 }}
                    >
                      <GlassCard style={!unlocked ? { opacity: 0.5 } : {}} glow={unlocked ? school.color : undefined}>
                        <View style={styles.skillRow}>
                          <View style={[styles.skillIcon, { borderColor: school.color }]}>
                            <Ionicons name={unlocked ? 'flash' : 'lock-closed'} size={18} color={unlocked ? school.color : COLORS.silver} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text style={styles.skillName}>{skill.name}</Text>
                              {unlocked && <Text style={[styles.skillUses, { color: school.color }]}>{uses} uses</Text>}
                            </View>
                            <Text style={styles.skillDesc}>{skill.desc}</Text>
                            {unlocked && next && (
                              <View style={styles.skillBar}>
                                <View style={[styles.skillFill, { backgroundColor: school.color, width: `${pct * 100}%` }]} />
                              </View>
                            )}
                            {!unlocked && skill.prereq && (
                              <Text style={styles.locked}>Requires mastery of {SKILLS.find(s => s.id === skill.prereq)?.name}</Text>
                            )}
                          </View>
                        </View>
                      </GlassCard>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        <View style={{ paddingHorizontal: 18, marginTop: 16 }}>
          <Text style={styles.tip}>✦ Tap an awakened skill to practice (+5 uses, +10 XP)</Text>
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
  skillIcon: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,17,40,0.6)' },
  skillName: { color: COLORS.parchment, fontSize: 14, fontWeight: '600', flex: 1 },
  skillUses: { fontSize: 10, fontWeight: '600', letterSpacing: 1 },
  skillDesc: { color: COLORS.silver, fontSize: 12, marginTop: 3, opacity: 0.85, lineHeight: 17 },
  skillBar: { height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  skillFill: { height: '100%' },
  locked: { color: COLORS.silver, fontSize: 10, fontStyle: 'italic', marginTop: 6, opacity: 0.6 },
  tip: { color: COLORS.gold, fontSize: 11, textAlign: 'center', opacity: 0.7, fontStyle: 'italic' },
});

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ATTRIBUTES, RACES, SKILLS, QUESTS, ITEMS, Race, Quest } from './gameData';
import { pickWanderOutcome, WanderOutcome } from './wanderData';

// Bump this if you ever change the Character shape in a breaking way —
// old saves with a different key are simply ignored (no migration logic yet).
const STORAGE_KEY = 'aetheryn:character:v1';

type Character = {
  name: string;
  race: Race;
  attributes: Record<string, number>;
  level: number;
  xp: number;
  hp: number;
  hpMax: number;
  mp: number;
  mpMax: number;
  unlockedSkills: string[];
  skillUses: Record<string, number>;
  inventory: string[];
  equipped: { weapon?: string; armor?: string; artifact?: string };
  gold: number;
  quests: Record<string, 'available' | 'active' | 'completed'>;
  questChoices: Record<string, number>;
  visitedRegions: string[];
  wanderCounts: Record<string, number>;
  lastWanderedRegion: string | null;
  journalEntries: string[];
};

export type PendingEncounter = {
  regionId: string;
  enemyIds: string[];
  canFlee?: boolean;
};

type GameContextType = {
  character: Character | null;
  hydrated: boolean;
  createCharacter: (name: string, race: Race) => void;
  resetCharacter: () => void;
  trainSkill: (skillId: string, uses: number) => void;
  toggleQuest: (questId: string) => void;
  makeChoice: (questId: string, choiceIdx: number) => void;
  visitRegion: (regionId: string) => void;
  equipItem: (itemId: string, slot: 'weapon' | 'armor' | 'artifact') => void;
  usePotion: (itemId: string) => void;
  addItem: (itemId: string) => void;
  gainXP: (amount: number) => void;
  setHpMp: (hp: number, mp: number) => void;
  addGold: (amount: number) => void;
  wander: (regionId: string) => WanderResult;
  addJournalEntry: (text: string) => void;
  pendingEncounter: PendingEncounter | null;
  startEncounter: (encounter: PendingEncounter) => void;
  clearEncounter: () => void;
};

// What the wander() action returns to the UI so it can display the outcome.
export type WanderResult =
  | { kind: 'too_weary' }
  | { kind: 'outcome'; outcome: WanderOutcome; combatTriggered: boolean };


const GameContext = createContext<GameContextType | null>(null);

const buildAttrs = (race: Race) => {
  const attrs: Record<string, number> = {};
  ATTRIBUTES.forEach(a => { attrs[a.name] = a.base; });
  race.bonuses.forEach(b => { attrs[b.attr] = (attrs[b.attr] || 10) + b.val; });
  return attrs;
};

export function GameProvider({ children }: { children: ReactNode }) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [pendingEncounter, setPendingEncounter] = useState<PendingEncounter | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Load saved character on first mount.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setCharacter(JSON.parse(raw) as Character);
      } catch (e) {
        console.warn('[gameStore] Failed to hydrate:', e);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Persist character on every change (after initial hydration so we never
  // overwrite a real save with the empty initial state).
  useEffect(() => {
    if (!hydrated) return;
    (async () => {
      try {
        if (character) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(character));
        } else {
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        console.warn('[gameStore] Failed to save:', e);
      }
    })();
  }, [character, hydrated]);

  const createCharacter = useCallback((name: string, race: Race) => {
    const attrs = buildAttrs(race);
    const hpMax = 50 + attrs.Constitution * 5;
    const mpMax = 30 + attrs.Intellect * 4;
    setCharacter({
      name,
      race,
      attributes: attrs,
      level: 1,
      xp: 0,
      hp: hpMax,
      hpMax,
      mp: mpMax,
      mpMax,
      unlockedSkills: SKILLS.filter(s => s.tier === 1).map(s => s.id),
      skillUses: {},
      inventory: ['i1', 'i6', 'i11', 'i11', 'i13'],
      equipped: { weapon: 'i1', armor: 'i6' },
      gold: 50,
      quests: { q1: 'active' },
      questChoices: {},
      visitedRegions: ['r6'],
      wanderCounts: {},
      lastWanderedRegion: null,
      journalEntries: [],
    });
  }, []);

  const resetCharacter = useCallback(() => { setCharacter(null); setPendingEncounter(null); }, []);

  const trainSkill = useCallback((skillId: string, uses: number) => {
    setCharacter(prev => {
      if (!prev) return prev;
      const newUses = { ...prev.skillUses, [skillId]: (prev.skillUses[skillId] || 0) + uses };
      const unlocked = [...prev.unlockedSkills];
      SKILLS.forEach(s => {
        if (!unlocked.includes(s.id) && s.prereq && unlocked.includes(s.prereq)) {
          if ((newUses[s.prereq] || 0) >= s.unlockUses) {
            unlocked.push(s.id);
          }
        }
      });
      const xpGain = uses * 2;
      return { ...prev, skillUses: newUses, unlockedSkills: unlocked, xp: prev.xp + xpGain };
    });
  }, []);

  const toggleQuest = useCallback((questId: string) => {
    setCharacter(prev => {
      if (!prev) return prev;
      const cur = prev.quests[questId];
      let next: 'available' | 'active' | 'completed' = 'active';
      if (cur === 'active') next = 'completed';
      else if (cur === 'completed') next = 'available';
      else next = 'active';
      const newQuests = { ...prev.quests, [questId]: next };
      let xp = prev.xp;
      // Quest completion = passing time. Clear region exhaustion.
      // (Toggling backward to 'available' or 'active' is cosmetic, no time pass.)
      const wanderCounts = next === 'completed' ? {} : prev.wanderCounts;
      const lastWanderedRegion = next === 'completed' ? null : prev.lastWanderedRegion;
      if (next === 'completed') xp += 100;
      return { ...prev, quests: newQuests, xp, wanderCounts, lastWanderedRegion };
    });
  }, []);

  const makeChoice = useCallback((questId: string, choiceIdx: number) => {
    setCharacter(prev => prev ? { ...prev, questChoices: { ...prev.questChoices, [questId]: choiceIdx } } : prev);
  }, []);

  const visitRegion = useCallback((regionId: string) => {
    setCharacter(prev => {
      if (!prev) return prev;
      if (prev.visitedRegions.includes(regionId)) return prev;
      return { ...prev, visitedRegions: [...prev.visitedRegions, regionId], xp: prev.xp + 25 };
    });
  }, []);

  const equipItem = useCallback((itemId: string, slot: 'weapon' | 'armor' | 'artifact') => {
    setCharacter(prev => prev ? { ...prev, equipped: { ...prev.equipped, [slot]: itemId } } : prev);
  }, []);

  const usePotion = useCallback((itemId: string) => {
    setCharacter(prev => {
      if (!prev) return prev;
      const idx = prev.inventory.indexOf(itemId);
      if (idx === -1) return prev;
      const newInv = [...prev.inventory];
      newInv.splice(idx, 1);
      let hp = prev.hp;
      let mp = prev.mp;
      if (itemId === 'i11') hp = Math.min(prev.hpMax, hp + 25);
      if (itemId === 'i12') hp = Math.min(prev.hpMax, hp + 80);
      if (itemId === 'i13') mp = Math.min(prev.mpMax, mp + 30);
      return { ...prev, inventory: newInv, hp, mp };
    });
  }, []);

  const addItem = useCallback((itemId: string) => {
    setCharacter(prev => prev ? { ...prev, inventory: [...prev.inventory, itemId] } : prev);
  }, []);

  const gainXP = useCallback((amount: number) => {
    setCharacter(prev => {
      if (!prev) return prev;
      let xp = prev.xp + amount;
      let level = prev.level;
      let hpMax = prev.hpMax;
      let mpMax = prev.mpMax;
      let hp = prev.hp;
      let mp = prev.mp;
      while (xp >= level * 100) {
        xp -= level * 100;
        level += 1;
        hpMax += 8;
        mpMax += 5;
        hp = hpMax;
        mp = mpMax;
      }
      return { ...prev, xp, level, hpMax, mpMax, hp, mp };
    });
  }, []);

  const setHpMp = useCallback((hp: number, mp: number) => {
    setCharacter(prev => {
      if (!prev) return prev;
      const newHp = Math.max(0, Math.min(prev.hpMax, hp));
      const newMp = Math.max(0, Math.min(prev.mpMax, mp));
      // Treat a full-vitals restore (i.e. Rest) as passing time.
      const isRest = newHp === prev.hpMax && newMp === prev.mpMax;
      return {
        ...prev,
        hp: newHp,
        mp: newMp,
        wanderCounts: isRest ? {} : prev.wanderCounts,
        lastWanderedRegion: isRest ? null : prev.lastWanderedRegion,
      };
    });
  }, []);

  const addGold = useCallback((amount: number) => {
    setCharacter(prev => prev ? { ...prev, gold: Math.max(0, prev.gold + amount) } : prev);
  }, []);

  const startEncounter = useCallback((encounter: PendingEncounter) => setPendingEncounter(encounter), []);
  const clearEncounter = useCallback(() => setPendingEncounter(null), []);

  const addJournalEntry = useCallback((text: string) => {
    setCharacter(prev => prev ? { ...prev, journalEntries: [...(prev.journalEntries ?? []), text] } : prev);
  }, []);

  // The wander action. Returns a WanderResult so the UI can display the outcome
  // (or a "too weary" message). All side effects happen inside this single setter
  // so the persisted save is consistent — no half-applied wanders if something
  // throws downstream.
  const wander = useCallback((regionId: string): WanderResult => {
    const c = character;
    if (!c) return { kind: 'outcome', outcome: { id: 'noop', scope: 'exhausted', weight: 1, text: '', effects: {} }, combatTriggered: false };

    // 2% of max HP toll, rounded up, with a minimum of 2 so an exploit-level
    // tiny wanderer can't reduce the cost below the original baseline.
    // (At hpMax 100 → 2; hpMax 150 → 3; hpMax 200 → 4. Scales with the player.)
    const toll = Math.max(2, Math.ceil(c.hpMax * 0.02));

    // If the toll would drop us to 0 or below, refuse the wander.
    // We require strictly more HP than toll, so a successful wander always leaves at least 1 HP.
    if (c.hp <= toll) return { kind: 'too_weary' };

    // Defensive defaults for old saves that pre-date these fields.
    const wanderCounts = c.wanderCounts ?? {};
    const lastWanderedRegion = c.lastWanderedRegion ?? null;
    const journalEntries = c.journalEntries ?? [];

    // Wandering a different region than last time = passing time. All region
    // exhaustion clears.
    const passedTime = lastWanderedRegion !== null && lastWanderedRegion !== regionId;
    const effectiveCounts = passedTime ? {} : wanderCounts;
    const currentCount = effectiveCounts[regionId] ?? 0;

    const outcome = pickWanderOutcome(regionId, c, currentCount);
    const eff = outcome.effects;

    // Apply effects in a single setCharacter so persistence saves once with everything.
    let combatTriggered = false;
    setCharacter(prev => {
      if (!prev) return prev;

      // Start from the post-time-pass counts.
      const counts = passedTime ? {} : { ...(prev.wanderCounts ?? {}) };
      counts[regionId] = (counts[regionId] ?? 0) + 1;

      // Vitals: percentage toll first, then any outcome HP delta. Clamp at end.
      let hp = prev.hp - toll + (eff.hp ?? 0);
      hp = Math.max(0, Math.min(prev.hpMax, hp));

      let mp = prev.mp + (eff.mp ?? 0);
      mp = Math.max(0, Math.min(prev.mpMax, mp));

      // Gold: clamp >= 0 so a theft on a broke character doesn't go negative.
      const gold = Math.max(0, prev.gold + (eff.gold ?? 0));

      // Inventory mutations.
      let inventory = prev.inventory;
      if (eff.itemRemove) {
        const idx = inventory.indexOf(eff.itemRemove);
        if (idx !== -1) {
          inventory = [...inventory];
          inventory.splice(idx, 1);
        }
      }
      if (eff.itemId) inventory = [...inventory, eff.itemId];

      // Journal append (defensive against undefined for old saves).
      const newJournal = eff.journal
        ? [...(prev.journalEntries ?? []), eff.journal]
        : (prev.journalEntries ?? journalEntries);

      // XP and level-up logic, mirrored from gainXP. Done inline to keep this
      // a single state transition rather than chaining setters.
      let xp = prev.xp + (eff.xp ?? 0);
      let level = prev.level;
      let hpMax = prev.hpMax;
      let mpMax = prev.mpMax;
      let hpAfterLevel = hp;
      let mpAfterLevel = mp;
      while (xp >= level * 100) {
        xp -= level * 100;
        level += 1;
        hpMax += 8;
        mpMax += 5;
        hpAfterLevel = hpMax;
        mpAfterLevel = mpMax;
      }

      // Skill training, if any.
      let skillUses = prev.skillUses;
      let unlockedSkills = prev.unlockedSkills;
      if (eff.trainSkill) {
        const { skillId, uses } = eff.trainSkill;
        skillUses = { ...skillUses, [skillId]: (skillUses[skillId] ?? 0) + uses };
        const unlocked = [...unlockedSkills];
        SKILLS.forEach(s => {
          if (!unlocked.includes(s.id) && s.prereq && unlocked.includes(s.prereq)) {
            if ((skillUses[s.prereq] ?? 0) >= s.unlockUses) unlocked.push(s.id);
          }
        });
        unlockedSkills = unlocked;
      }

      return {
        ...prev,
        hp: hpAfterLevel, mp: mpAfterLevel, hpMax, mpMax,
        xp, level,
        gold,
        inventory,
        skillUses, unlockedSkills,
        wanderCounts: counts,
        lastWanderedRegion: regionId,
        journalEntries: newJournal,
      };
    });

    // Combat is set as a side effect (not part of character state).
    if (eff.combat) {
      // Roll enemy count: 1-3 weighted toward 1. ~60% one, ~30% two, ~10% three.
      const r = Math.random();
      const count = r < 0.6 ? 1 : r < 0.9 ? 2 : 3;
      const enemyId = eff.combat.enemyIds[0] ?? 'bandit';
      const enemyIds = Array.from({ length: count }, () => enemyId);
      setPendingEncounter({ regionId, enemyIds, canFlee: eff.combat.canFlee });
      combatTriggered = true;
    }

    return { kind: 'outcome', outcome, combatTriggered };
  }, [character]);

  return (
    <GameContext.Provider value={{
      character, hydrated, createCharacter, resetCharacter, trainSkill, toggleQuest, makeChoice, visitRegion,
      equipItem, usePotion, addItem, gainXP, setHpMp, addGold,
      wander, addJournalEntry,
      pendingEncounter, startEncounter, clearEncounter,
    }}>
      {children}
    </GameContext.Provider>
  );
}


export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
};

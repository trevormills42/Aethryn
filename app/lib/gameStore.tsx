import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ATTRIBUTES, RACES, SKILLS, QUESTS, ITEMS, Race, Quest } from './gameData';

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
};

export type PendingEncounter = {
  regionId: string;
  enemyIds: string[];
};

type GameContextType = {
  character: Character | null;
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
  pendingEncounter: PendingEncounter | null;
  startEncounter: (encounter: PendingEncounter) => void;
  clearEncounter: () => void;
};


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
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ATTRIBUTES, RACES, SKILLS, QUESTS, ITEMS, Race, Quest } from './gameData';

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
};

export type PendingEncounter = {
  regionId: string;
  enemyIds: string[];
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
  pendingEncounter: PendingEncounter | null;
  startEncounter: (encounter: PendingEncounter) => void;
  clearEncounter: () => void;
};


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
      if (next === 'completed') xp += 100;
      return { ...prev, quests: newQuests, xp };
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
    setCharacter(prev => prev ? { ...prev, hp: Math.max(0, Math.min(prev.hpMax, hp)), mp: Math.max(0, Math.min(prev.mpMax, mp)) } : prev);
  }, []);

  const addGold = useCallback((amount: number) => {
    setCharacter(prev => prev ? { ...prev, gold: Math.max(0, prev.gold + amount) } : prev);
  }, []);

  const startEncounter = useCallback((encounter: PendingEncounter) => setPendingEncounter(encounter), []);
  const clearEncounter = useCallback(() => setPendingEncounter(null), []);

  return (
    <GameContext.Provider value={{
      character, hydrated, createCharacter, resetCharacter, trainSkill, toggleQuest, makeChoice, visitRegion,
      equipItem, usePotion, addItem, gainXP, setHpMp, addGold,
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

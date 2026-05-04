import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ATTRIBUTES, RACES, SKILLS, QUESTS, ITEMS, Race, Quest } from './gameData';
import { pickWanderOutcome, WanderOutcome, getCombatCountDistribution } from './wanderData';
import { rollRotation, getItemPrice, applyCharismaDiscount, getSellPrice } from './shopData';

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
  unspentAttributePoints: number;
  // Rested-bonus pool: XP credited at this counter is multiplied by 1.5 when
  // gainXP runs. Granted by the Rest action (which also costs 1 ration). Pool
  // size is calculated from "remaining XP to next level" so resting near a
  // level-up gives diminishing returns and prevents stacking exploits.
  restedXP: number;
  // Hesta's current rotation slots. Rerolled on Rest (the same time-pass trigger
  // that clears region exhaustion). Stays stable between rests so a player who
  // sees a rare item knows it'll still be there when they come back from a fight.
  shopRotation: string[];
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
  spendAttributePoint: (attrName: string) => void;
  rest: () => RestResult;
  buyItem: (itemId: string) => BuyResult;
  sellItem: (itemId: string) => SellResult;
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

// What the rest() action returns to the UI. 'no_rations' lets the UI show a
// proper modal instead of doing nothing silently. 'rested' carries the granted
// pool size so we can render confirmation feedback.
export type RestResult =
  | { kind: 'no_rations' }
  | { kind: 'rested'; pool: number };

// Buy returns either success with the gold spent, or a soft-failure code so
// the UI can show appropriate feedback ("not enough gold", "no longer in stock").
export type BuyResult =
  | { kind: 'bought'; goldSpent: number }
  | { kind: 'cant_afford' }
  | { kind: 'out_of_stock' };

// Sell always succeeds if you own the item — the merchant will buy anything.
export type SellResult =
  | { kind: 'sold'; goldGained: number }
  | { kind: 'not_owned' };


const GameContext = createContext<GameContextType | null>(null);

const buildAttrs = (race: Race) => {
  const attrs: Record<string, number> = {};
  ATTRIBUTES.forEach(a => { attrs[a.name] = a.base; });
  race.bonuses.forEach(b => { attrs[b.attr] = (attrs[b.attr] || 10) + b.val; });
  return attrs;
};

// Hybrid HP/MP formula. Both pools blend an attribute floor with a flat baseline
// and a per-level growth, so even pure-mage builds stay viable while attribute
// investment still meaningfully changes survivability/casting capacity.
//
//   HP_max = 50 + (STR + CON + AGI) × 1.5 + level × 5
//   MP_max = 30 + (INT + WIL + CHA) × 1.2 + level × 3
//
// At creation (10/10/10, level 1): HP=100, MP=66.
// At level 10 with 10 points into a single physical attr: HP=160. Mage at lvl 10
// with no physical investment: HP=145 — fragile but functional.
//
// PER and LCK don't feed pools; they're check-modifiers (detection, crit, drops).
const calcMaxVitals = (attrs: Record<string, number>, level: number) => {
  const str = attrs.Strength ?? 10;
  const con = attrs.Constitution ?? 10;
  const agi = attrs.Agility ?? 10;
  const int = attrs.Intellect ?? 10;
  const wil = attrs.Willpower ?? 10;
  const cha = attrs.Charisma ?? 10;
  const hpMax = Math.floor(50 + (str + con + agi) * 1.5 + level * 5);
  const mpMax = Math.floor(30 + (int + wil + cha) * 1.2 + level * 3);
  return { hpMax, mpMax };
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
    const { hpMax, mpMax } = calcMaxVitals(attrs, 1);
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
      inventory: ['i1', 'i6', 'i11', 'i11', 'i13', 'i26', 'i26', 'i26', 'i26', 'i26'],
      equipped: { weapon: 'i1', armor: 'i6' },
      gold: 50,
      quests: { q1: 'active' },
      questChoices: {},
      visitedRegions: ['r6'],
      wanderCounts: {},
      lastWanderedRegion: null,
      journalEntries: [],
      unspentAttributePoints: 0,
      restedXP: 0,
      shopRotation: rollRotation(),
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
      // Rested-pool draining: any portion of the incoming amount that fits
      // within the current rested pool counts as 1.5x. Once the pool is dry,
      // the rest is at 1x. Pool is reduced by the *raw* amount drained, not
      // the multiplied amount.
      const restedAvail = prev.restedXP ?? 0;
      const restedDraw = Math.min(amount, restedAvail);
      const normalDraw = amount - restedDraw;
      const effective = Math.floor(restedDraw * 1.5) + normalDraw;
      const newRested = restedAvail - restedDraw;

      let xp = prev.xp + effective;
      let level = prev.level;
      let unspent = prev.unspentAttributePoints ?? 0;
      let levelsGained = 0;
      while (xp >= level * 100) {
        xp -= level * 100;
        level += 1;
        levelsGained += 1;
        unspent += 1;
      }
      const { hpMax, mpMax } = calcMaxVitals(prev.attributes, level);
      const hp = levelsGained > 0 ? hpMax : Math.min(prev.hp, hpMax);
      const mp = levelsGained > 0 ? mpMax : Math.min(prev.mp, mpMax);
      return { ...prev, xp, level, hpMax, mpMax, hp, mp, unspentAttributePoints: unspent, restedXP: newRested };
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

  // Spend one unspent attribute point on the named attribute. Recomputes HP/MP
  // pools so any new max kicks in immediately. Refuses silently if no points
  // are available or the attribute name is invalid (defensive — the UI gates this
  // already, but we don't want a bug elsewhere to corrupt state).
  const spendAttributePoint = useCallback((attrName: string) => {
    setCharacter(prev => {
      if (!prev) return prev;
      if ((prev.unspentAttributePoints ?? 0) <= 0) return prev;
      if (!ATTRIBUTES.find(a => a.name === attrName)) return prev;
      const newAttrs = { ...prev.attributes, [attrName]: (prev.attributes[attrName] ?? 10) + 1 };
      const { hpMax, mpMax } = calcMaxVitals(newAttrs, prev.level);
      // Don't auto-heal on a stat point spend — only on level-up. But do raise
      // the cap, and clamp current to new max if max somehow shrank (shouldn't).
      return {
        ...prev,
        attributes: newAttrs,
        hpMax,
        mpMax,
        hp: Math.min(prev.hp, hpMax),
        mp: Math.min(prev.mp, mpMax),
        unspentAttributePoints: prev.unspentAttributePoints - 1,
      };
    });
  }, []);

  // The rest action. Consumes 1 ration (i26), restores HP/MP to max, and grants  // a rested-XP pool of 10% of *remaining* XP to next level (floored). Resting
  // near a level-up gives a small pool — diminishing returns prevent the player
  // from gaming the system by stacking rests right before leveling up. A new
  // rest *overwrites* any existing pool rather than adding to it; otherwise a
  // careful player could drain to 1 and rest indefinitely.
  //
  // Also: setting HP/MP to max here uses the same passes-time semantics as the
  // old setHpMp(hpMax, mpMax) call did — wander exhaustion clears as a side
  // effect of the rest. Worth knowing if that ever surprises us in playtest.
  const rest = useCallback((): RestResult => {
    const c = character;
    if (!c) return { kind: 'no_rations' };
    const rationIdx = c.inventory.indexOf('i26');
    if (rationIdx === -1) return { kind: 'no_rations' };

    const xpForNext = c.level * 100;
    const remaining = Math.max(0, xpForNext - c.xp);
    const newPool = Math.floor(remaining * 0.1);

    setCharacter(prev => {
      if (!prev) return prev;
      const idx = prev.inventory.indexOf('i26');
      if (idx === -1) return prev;
      const newInv = [...prev.inventory];
      newInv.splice(idx, 1);
      return {
        ...prev,
        inventory: newInv,
        hp: prev.hpMax,
        mp: prev.mpMax,
        // Rest passes time: clear region exhaustion, same as the old
        // setHpMp(full, full) path did.
        wanderCounts: {},
        lastWanderedRegion: null,
        // Rested pool overwrites — stacking is the exploit we're avoiding.
        restedXP: newPool,
        // Reroll Hesta's rare slots. Most rests yield none; sometimes one or two.
        shopRotation: rollRotation(),
      };
    });

    return { kind: 'rested', pool: newPool };
  }, [character]);

  // Purchase from Hesta. Validates: item is currently in stock (staple OR
  // current rotation), player can afford the charisma-discounted price. On
  // success: deducts gold, grants the item, removes it from rotation if it was
  // a rotation slot (so each rotation roll yields a finite "this rest's items").
  const buyItem = useCallback((itemId: string): BuyResult => {
    const c = character;
    if (!c) return { kind: 'out_of_stock' };

    const item = ITEMS.find(i => i.id === itemId);
    if (!item) return { kind: 'out_of_stock' };

    // Is this item currently for sale? Either a staple (always available) or
    // present in today's rotation.
    const isStaple = item.rarity === 'common' || item.rarity === 'uncommon';
    const inRotation = (c.shopRotation ?? []).includes(itemId);
    if (!isStaple && !inRotation) return { kind: 'out_of_stock' };

    const cha = c.attributes.Charisma ?? 10;
    const finalPrice = applyCharismaDiscount(getItemPrice(item), cha);
    if (c.gold < finalPrice) return { kind: 'cant_afford' };

    setCharacter(prev => {
      if (!prev) return prev;
      const newRotation = inRotation
        ? prev.shopRotation.filter(id => id !== itemId)
        : prev.shopRotation;
      return {
        ...prev,
        gold: prev.gold - finalPrice,
        inventory: [...prev.inventory, itemId],
        shopRotation: newRotation,
      };
    });

    return { kind: 'bought', goldSpent: finalPrice };
  }, [character]);

  // Sell to Hesta at 40% of buy price. No charisma bonus on sell. Equipped items
  // are silently un-equipped if sold (defensive — UI should prevent this but
  // we don't want a phantom equipped reference).
  const sellItem = useCallback((itemId: string): SellResult => {
    const c = character;
    if (!c) return { kind: 'not_owned' };

    const idx = c.inventory.indexOf(itemId);
    if (idx === -1) return { kind: 'not_owned' };

    const item = ITEMS.find(i => i.id === itemId);
    if (!item) return { kind: 'not_owned' };

    const goldGained = getSellPrice(item);

    setCharacter(prev => {
      if (!prev) return prev;
      const newInv = [...prev.inventory];
      newInv.splice(newInv.indexOf(itemId), 1);
      // Un-equip if needed.
      const equipped = { ...prev.equipped };
      if (equipped.weapon === itemId) equipped.weapon = undefined;
      if (equipped.armor === itemId) equipped.armor = undefined;
      if (equipped.artifact === itemId) equipped.artifact = undefined;
      return {
        ...prev,
        inventory: newInv,
        equipped,
        gold: prev.gold + goldGained,
      };
    });

    return { kind: 'sold', goldGained };
  }, [character]);

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

      // XP and level-up logic, mirrored from gainXP. Drains rested pool first
      // at 1.5x (same as gainXP) so wander XP benefits from a recent Rest.
      const xpGain = eff.xp ?? 0;
      const restedAvail = prev.restedXP ?? 0;
      const restedDraw = Math.min(xpGain, restedAvail);
      const normalDraw = xpGain - restedDraw;
      const effectiveXP = Math.floor(restedDraw * 1.5) + normalDraw;
      const newRested = restedAvail - restedDraw;

      let xp = prev.xp + effectiveXP;
      let level = prev.level;
      let unspent = prev.unspentAttributePoints ?? 0;
      let levelsGained = 0;
      while (xp >= level * 100) {
        xp -= level * 100;
        level += 1;
        levelsGained += 1;
        unspent += 1;
      }
      // Recompute pools from current attributes + new level. On level-up, heal
      // to the new max so the increase is felt immediately.
      const { hpMax, mpMax } = calcMaxVitals(prev.attributes, level);
      const hpAfterLevel = levelsGained > 0 ? hpMax : Math.min(hp, hpMax);
      const mpAfterLevel = levelsGained > 0 ? mpMax : Math.min(mp, mpMax);

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
        unspentAttributePoints: unspent,
        restedXP: newRested,
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
      // Three-layer fallback: outcome's countDistribution > region default > universal.
      const dist = getCombatCountDistribution(outcome, regionId);
      const r = Math.random();
      // dist is [p(1), p(2), p(3)]. Cumulative thresholds.
      const count = r < dist[0] ? 1 : r < dist[0] + dist[1] ? 2 : 3;
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
      equipItem, usePotion, addItem, gainXP, setHpMp, addGold, spendAttributePoint, rest, buyItem, sellItem,
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

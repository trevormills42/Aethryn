// Wander system: a region's quiet face, as opposed to Hunt's loud one.
//
// Every wander costs 2 HP (a small toll for walking the realm). Each region
// tracks how many times you've wandered it; after 3, the well runs dry and
// you draw from the EXHAUSTED pool — minor or empty outcomes — until you
// pass time. Time passes when you rest, advance a quest, or wander somewhere
// else. The store handles those resets.
//
// Outcomes have weights (higher = more common) and optional conditions
// (stat/skill gates). The picker filters by conditions, then weighted-randoms.

export type WanderEffect = {
  xp?: number;
  hp?: number;            // delta; clamped to [0, hpMax] in the store
  mp?: number;            // delta; clamped to [0, mpMax]
  gold?: number;          // delta; clamped to >= 0
  itemId?: string;        // grant a single item by id
  itemRemove?: string;    // remove a specific item (theft / loss)
  journal?: string;       // append a lore line to character.journalEntries
  trainSkill?: { skillId: string; uses: number };
  combat?: { enemyIds: string[]; canFlee: boolean };
};

export type WanderCondition = {
  attribute?: { name: string; min: number };  // e.g. { name: 'Perception', min: 12 }
  skillUnlocked?: string;                      // skill id must be in unlockedSkills
  hasItem?: string;                            // item id must be in inventory
};

export type WanderOutcome = {
  id: string;
  scope: 'universal' | 'region' | 'gated' | 'exhausted';
  regionId?: string;
  conditions?: WanderCondition[];   // ALL must match
  weight: number;                   // relative likelihood within its eligible pool
  text: string;
  effects: WanderEffect;
};

// ---------- UNIVERSAL (12) ----------------------------------------------------
// Available in any region. Light atmosphere, small grants, occasional bite.

export const UNIVERSAL_OUTCOMES: WanderOutcome[] = [
  {
    id: 'u1', scope: 'universal', weight: 10,
    text: 'A roadside shrine, barely a foot tall. Someone has left a coin and a tooth. You leave nothing. The air is colder for a moment after.',
    effects: { xp: 8 },
  },
  {
    id: 'u2', scope: 'universal', weight: 10,
    text: 'You find a glove. Just one, fine leather, embroidered with a sigil you do not know. You leave it where it lay.',
    effects: { xp: 6, journal: 'A glove with an unknown sigil — left undisturbed on the road.' },
  },
  {
    id: 'u3', scope: 'universal', weight: 9,
    text: 'A traveling tinker barters for stories. You give one. He gives you a coin he says is older than the kingdom. It might even be true.',
    effects: { xp: 12, gold: 8 },
  },
  {
    id: 'u4', scope: 'universal', weight: 8,
    text: 'You stop to drink at a stream. Something else is drinking on the far bank. Neither of you looks up.',
    effects: { mp: 8, xp: 5 },
  },
  {
    id: 'u5', scope: 'universal', weight: 7,
    text: 'You find a cache half-buried under a stone — a draught wrapped in cloth, tasting of moss and copper.',
    effects: { itemId: 'i11', xp: 4 },
  },
  {
    id: 'u6', scope: 'universal', weight: 8,
    text: 'A loose stone in the path turns your ankle. You walk on, but slower.',
    effects: { hp: -4 },
  },
  {
    id: 'u7', scope: 'universal', weight: 6,
    text: 'A hooded figure watches from the trees and does not look away. You walk on. They are not there when you turn back.',
    effects: { xp: 14, journal: 'A watcher in the trees. Did not follow.' },
  },
  {
    id: 'u8', scope: 'universal', weight: 5,
    text: 'You wake in the grass not remembering lying down. Your purse is lighter. Nothing else is taken.',
    effects: { gold: -10, xp: 3 },
  },
  {
    id: 'u9', scope: 'universal', weight: 7,
    text: 'The wind speaks a name you almost remember. You answer it under your breath.',
    effects: { xp: 18, journal: 'The wind speaks a name. Almost mine. Almost not.' },
  },
  {
    id: 'u10', scope: 'universal', weight: 6,
    text: 'A dog with no master walks beside you for half a mile. It leaves at a fork in the road, taking the path you did not.',
    effects: { xp: 10 },
  },
  {
    id: 'u11', scope: 'universal', weight: 4,
    text: 'You catch the sound of footsteps that match yours. They stop when you stop. You do not turn around.',
    effects: { xp: 16, hp: -2, journal: 'Footsteps in pace with mine. They stopped when I did.' },
  },
  {
    id: 'u12', scope: 'universal', weight: 3,
    // Combat — universal bandit ambush. Enemy count picked at runtime by store.
    text: 'Three figures step from the brush, knives already drawn. There is no preamble.',
    effects: { combat: { enemyIds: ['bandit'], canFlee: true } },
  },
];

// ---------- VELIRYN PLAINS (r6) — 12 region + 6 gated -----------------------
// "Wheat, kingdoms, and the Hollow King." Pastoral, haunted by absent royalty,
// the soft melancholy of a country where the crown stopped meaning anything.

export const VELIRYN_OUTCOMES: WanderOutcome[] = [
  // 12 region-specific
  {
    id: 'v6_r1', scope: 'region', regionId: 'r6', weight: 10,
    text: 'A field of wheat ripens around you, though no one tends it and no village is in sight. You take a handful. It tastes like bread already buttered.',
    effects: { xp: 10, hp: 4 },
  },
  {
    id: 'v6_r2', scope: 'region', regionId: 'r6', weight: 9,
    text: 'A farmstead, abandoned. The hearth is cold but the table is set for four. The plates are clean.',
    effects: { xp: 12, journal: 'In the Plains: a table set for four in an empty house. The plates were clean.' },
  },
  {
    id: 'v6_r3', scope: 'region', regionId: 'r6', weight: 8,
    text: 'A king\'s tomb, half-swallowed by the soil. The carving on the lid is too worn to read. You can hear, faintly, something inside breathing.',
    effects: { xp: 20, hp: -3, journal: 'A breathing tomb in the Plains. The king inside was not named.' },
  },
  {
    id: 'v6_r4', scope: 'region', regionId: 'r6', weight: 9,
    text: 'A minstrel on the road, lute slung low. He sings of the Hollow King — the verses you do not know, the ones the bards stopped teaching.',
    effects: { xp: 18, journal: 'The Hollow King: the bards stopped teaching the third verse. The minstrel sang it anyway.' },
  },
  {
    id: 'v6_r5', scope: 'region', regionId: 'r6', weight: 8,
    text: 'A crows\' parliament squabbles over an old battlefield. You find a coin where they had been, the face worn smooth.',
    effects: { gold: 14, xp: 6 },
  },
  {
    id: 'v6_r6', scope: 'region', regionId: 'r6', weight: 7,
    text: 'A plowman is plowing a field with no village near it. You ask whose land. He keeps plowing. He does not look up.',
    effects: { xp: 12, hp: -2, journal: 'A plowman in the Plains who did not look up. Could not, perhaps.' },
  },
  {
    id: 'v6_r7', scope: 'region', regionId: 'r6', weight: 8,
    text: 'A boy with a wooden sword steps into your path and demands the road. You let him have it. He thanks you, very seriously.',
    effects: { xp: 8 },
  },
  {
    id: 'v6_r8', scope: 'region', regionId: 'r6', weight: 7,
    text: 'You find a wedding ring in the dirt. Inside, the inscription has been filed away — carefully, by someone who took their time.',
    effects: { gold: 22, xp: 6, journal: 'A wedding ring with the names filed off. Carefully. Slowly.' },
  },
  {
    id: 'v6_r9', scope: 'region', regionId: 'r6', weight: 9,
    text: 'Woodsmoke from somewhere you cannot find. You walk toward it. It stays the same distance ahead. Eventually you stop.',
    effects: { xp: 14 },
  },
  {
    id: 'v6_r10', scope: 'region', regionId: 'r6', weight: 6,
    text: 'You walk an old kings\' road, paving stones cracked but still true. It led, once, to a capital no one has named in three generations.',
    effects: { xp: 22, journal: 'A kings\' road in the Plains. Its capital has had no name since my grandfather\'s grandfather.' },
  },
  {
    id: 'v6_r11', scope: 'region', regionId: 'r6', weight: 8,
    text: 'A pair of honey-merchants share their road with you. One offers a comb dripping gold; the other charges for it. You take it from whichever you prefer.',
    effects: { itemId: 'i11', gold: -6, xp: 8 },
  },
  {
    id: 'v6_r12', scope: 'region', regionId: 'r6', weight: 5,
    text: 'A woman waits at a crossroads. She has the look of waiting a long time. She does not speak when you greet her, and she is gone when you look back.',
    effects: { xp: 24, hp: -4, journal: 'The waiting woman at the Plains crossroads. She does not speak. She does not stay.' },
  },

  // 6 stat/skill-gated — rare, exceptional, region-specific
  {
    id: 'v6_g1', scope: 'gated', regionId: 'r6', weight: 4,
    conditions: [{ attribute: { name: 'Perception', min: 12 } }],
    text: 'You notice tracks leaving the road — fresh, careful, leading nowhere a careful person should go. You follow. At the end, a strongbox in the hollow of an oak.',
    effects: { gold: 60, xp: 30, journal: 'A strongbox in an oak. The careful tracks led to it. Whose were they?' },
  },
  {
    id: 'v6_g2', scope: 'gated', regionId: 'r6', weight: 4,
    conditions: [{ attribute: { name: 'Charisma', min: 13 } }],
    text: 'A noble\'s herald rides past. You hail him with the right bow. He leans down, shares a rumor he should not have, and rides on. You will know what to do with it.',
    effects: { xp: 35, gold: 25, journal: 'A herald\'s rumor: the lord of the Plains has not been seen in his keep for sixty days.' },
  },
  {
    id: 'v6_g3', scope: 'gated', regionId: 'r6', weight: 3,
    conditions: [{ attribute: { name: 'Strength', min: 13 } }],
    text: 'A toppled stone in a forgotten field is heavier than any one man should lift. You lift it. Beneath, a sword sleeps in the soil, point down. The grip still fits a hand.',
    effects: { itemId: 'i1', xp: 25, journal: 'A buried sword in the Plains. Point-down, as a king\'s might be planted to mark a grave.' },
  },
  {
    id: 'v6_g4', scope: 'gated', regionId: 'r6', weight: 4,
    conditions: [{ skillUnlocked: 'v2' }], // Foraging
    text: 'Your eye finds the right kind of bruised stem at the right kind of slant. A handful of nettles for the brewing, and beneath, a vein of pale ore the wheat has hidden a long time.',
    effects: { itemId: 'i22', xp: 18, trainSkill: { skillId: 'v2', uses: 1 } },
  },
  {
    id: 'v6_g5', scope: 'gated', regionId: 'r6', weight: 3,
    conditions: [{ skillUnlocked: 'c1' }], // Bladework
    text: 'A knight in old colors offers a sparring bout in the long grass. You accept. He is better than he looks, and you are better when you leave.',
    effects: { xp: 22, hp: -8, trainSkill: { skillId: 'c1', uses: 3 } },
  },
  {
    id: 'v6_g6', scope: 'gated', regionId: 'r6', weight: 3,
    conditions: [{ skillUnlocked: 'd1' }], // Mend Wounds
    text: 'A traveler bleeding by the roadside, robbed and left. You knit him together. He has nothing to give you but a name to remember, and he gives it.',
    effects: { xp: 28, trainSkill: { skillId: 'd1', uses: 2 }, journal: 'A name a dying man gave me in the Plains: Aelis Voren.' },
  },
];

// ---------- EXHAUSTED (universal) -------------------------------------------
// When a region has been wandered too many times since you last passed time,
// these dominate the pool. Small or no rewards. Always cost the 2 HP wander toll.

export const EXHAUSTED_OUTCOMES: WanderOutcome[] = [
  {
    id: 'ex1', scope: 'exhausted', weight: 10,
    text: 'You have walked these paths today. They have shown you what they wished. Rest, or take a different road.',
    effects: {},
  },
  {
    id: 'ex2', scope: 'exhausted', weight: 10,
    text: 'The same crows. The same wind. Even the light is beginning to repeat itself.',
    effects: {},
  },
  {
    id: 'ex3', scope: 'exhausted', weight: 8,
    text: 'Your boots ache. You have asked enough of the realm for one stretch.',
    effects: {},
  },
  {
    id: 'ex4', scope: 'exhausted', weight: 6,
    text: 'A familiar stone. A familiar bend. A familiar nothing.',
    effects: { xp: 1 },
  },
];

// ---------- PICKER ----------------------------------------------------------

type CharacterShape = {
  attributes: Record<string, number>;
  unlockedSkills: string[];
  inventory: string[];
};

const matchesConditions = (outcome: WanderOutcome, character: CharacterShape): boolean => {
  if (!outcome.conditions || outcome.conditions.length === 0) return true;
  for (const c of outcome.conditions) {
    if (c.attribute) {
      const v = character.attributes[c.attribute.name] ?? 0;
      if (v < c.attribute.min) return false;
    }
    if (c.skillUnlocked) {
      if (!character.unlockedSkills.includes(c.skillUnlocked)) return false;
    }
    if (c.hasItem) {
      if (!character.inventory.includes(c.hasItem)) return false;
    }
  }
  return true;
};

const REGIONAL_POOLS: Record<string, WanderOutcome[]> = {
  r6: VELIRYN_OUTCOMES,
  // r1, r2, r3, r4, r5, r7, r8, r9 — to be written next session
};

export function pickWanderOutcome(
  regionId: string,
  character: CharacterShape,
  regionWanderCount: number,
): WanderOutcome {
  // Exhaustion threshold: after 3 wanders in the region without passing time,
  // draw exclusively from the exhausted pool.
  if (regionWanderCount >= 3) {
    return weightedPick(EXHAUSTED_OUTCOMES);
  }

  const regional = REGIONAL_POOLS[regionId] ?? [];
  const pool = [...UNIVERSAL_OUTCOMES, ...regional].filter(o => matchesConditions(o, character));

  // Defensive fallback: if filtering somehow produced an empty pool (e.g. an
  // unwritten region with all gated universals failing), fall back to exhausted.
  if (pool.length === 0) return weightedPick(EXHAUSTED_OUTCOMES);

  return weightedPick(pool);
}

function weightedPick(pool: WanderOutcome[]): WanderOutcome {
  const total = pool.reduce((a, o) => a + o.weight, 0);
  let r = Math.random() * total;
  for (const o of pool) {
    r -= o.weight;
    if (r <= 0) return o;
  }
  return pool[pool.length - 1];
}

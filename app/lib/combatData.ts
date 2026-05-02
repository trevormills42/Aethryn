// Combat-specific data: enemies, combat abilities, encounter tables

export type ElementType = 'physical' | 'fire' | 'frost' | 'lightning' | 'shadow' | 'holy' | 'arcane';
export type StatusType = 'burning' | 'frozen' | 'wet' | 'oiled' | 'shocked' | 'stunned' | 'shielded' | 'fearful' | 'bleeding';
export type TileEffect = 'oil' | 'water' | 'fire' | 'frost' | null;

export type CombatAbility = {
  id: string;
  name: string;
  desc: string;
  element: ElementType;
  damage: number;            // base damage (0 for support skills)
  heal?: number;
  range: number;             // 1 = melee
  aoe?: 'single' | 'splash' | 'line' | 'self';
  apCost: number;
  mpCost?: number;
  hpCost?: number;
  applies?: { status: StatusType; turns: number; chance?: number };
  tileEffect?: TileEffect;   // creates a tile effect at target
  requiresSkill?: string;    // unlocked skill id required (player only)
  icon: string;
};

// Player-usable combat abilities, gated by unlocked skills
export const PLAYER_ABILITIES: CombatAbility[] = [
  { id: 'basic_attack', name: 'Strike', desc: 'A measured blow with your equipped weapon.', element: 'physical', damage: 8, range: 1, apCost: 1, icon: 'flash' },
  { id: 'bladework', name: 'Bladework', desc: '+50% damage. Trained edge finds the gap.', element: 'physical', damage: 14, range: 1, apCost: 1, requiresSkill: 'c1', icon: 'cut' },
  { id: 'heavy_strike', name: 'Heavy Strike', desc: 'Crushing blow that stuns for 1 turn.', element: 'physical', damage: 18, range: 1, apCost: 2, applies: { status: 'stunned', turns: 1 }, requiresSkill: 'c3', icon: 'hammer' },
  { id: 'firebolt', name: 'Firebolt', desc: 'A dart of flame. Ignites oil. Burns deeper on the oiled.', element: 'fire', damage: 12, range: 3, apCost: 1, mpCost: 8, applies: { status: 'burning', turns: 2 }, requiresSkill: 'a1', icon: 'flame' },
  { id: 'frost_ward', name: 'Frost Ward', desc: 'Coat self in rime. Absorbs 18 damage. Freezes water nearby.', element: 'frost', damage: 0, range: 0, aoe: 'self', apCost: 1, mpCost: 6, applies: { status: 'shielded', turns: 3 }, requiresSkill: 'a2', icon: 'snow' },
  { id: 'chain_lightning', name: 'Chain Lightning', desc: 'Arcs to wet targets. Devastating in a storm.', element: 'lightning', damage: 14, range: 3, aoe: 'splash', apCost: 2, mpCost: 14, applies: { status: 'shocked', turns: 1 }, requiresSkill: 'a3', icon: 'thunderstorm' },
  { id: 'mend', name: 'Mend Wounds', desc: 'Light knits flesh. Restores 18 HP.', element: 'holy', damage: 0, heal: 18, range: 2, apCost: 1, mpCost: 10, requiresSkill: 'd1', icon: 'medkit' },
  { id: 'smite', name: 'Smite', desc: 'Pillar of judgement. Extra damage to undead.', element: 'holy', damage: 13, range: 2, apCost: 1, mpCost: 8, requiresSkill: 'd2', icon: 'sunny' },
  { id: 'backstab', name: 'Backstab', desc: 'Massive damage if attacking from behind/flank.', element: 'physical', damage: 22, range: 1, apCost: 1, requiresSkill: 's3', icon: 'eye-off' },
];

export type Enemy = {
  id: string;
  name: string;
  title: string;
  hp: number;
  atk: number;
  def: number;
  speed: number;            // tiles per turn
  range: number;            // attack range
  abilities: CombatAbility[];
  resistances?: ElementType[];
  weaknesses?: ElementType[];
  loot: { itemId: string; chance: number }[];
  xp: number;
  gold: [number, number];   // min/max
  flavor: string;
  color: string;
  icon: string;
};

export const ENEMIES: Record<string, Enemy> = {
  bandit: {
    id: 'bandit',
    name: 'Highway Bandit',
    title: 'desperate, dangerous',
    hp: 35, atk: 7, def: 1, speed: 1, range: 1,
    abilities: [
      { id: 'b_slash', name: 'Rusted Blade', desc: '', element: 'physical', damage: 7, range: 1, apCost: 1, icon: 'cut' },
      { id: 'b_oil', name: 'Oil Flask', desc: '', element: 'physical', damage: 0, range: 3, apCost: 1, tileEffect: 'oil', applies: { status: 'oiled', turns: 3 }, icon: 'water' },
    ],
    loot: [{ itemId: 'i1', chance: 0.4 }, { itemId: 'i11', chance: 0.5 }, { itemId: 'i21', chance: 0.7 }],
    xp: 30, gold: [8, 16],
    flavor: 'Once a soldier of Veliryn. The crown forgot to pay.',
    color: '#9CA3AF', icon: 'man',
  },
  wolf: {
    id: 'wolf',
    name: 'Frostmere Wolf',
    title: 'pack-hungry',
    hp: 28, atk: 9, def: 0, speed: 2, range: 1,
    abilities: [
      { id: 'w_bite', name: 'Bite', desc: '', element: 'physical', damage: 9, range: 1, apCost: 1, applies: { status: 'bleeding', turns: 2 }, icon: 'paw' },
      { id: 'w_frenzy', name: 'Frenzy', desc: '', element: 'physical', damage: 13, range: 1, apCost: 2, icon: 'flash' },
    ],
    loot: [{ itemId: 'i24', chance: 0.2 }, { itemId: 'i21', chance: 0.4 }],
    xp: 25, gold: [3, 8],
    flavor: 'Its eyes hold winters older than your blood.',
    color: '#6B7280', icon: 'paw',
  },
  warden: {
    id: 'warden',
    name: 'Elven Warden',
    title: 'of the Moonglade',
    hp: 42, atk: 8, def: 2, speed: 2, range: 3,
    abilities: [
      { id: 'e_arrow', name: 'Whisperleaf Arrow', desc: '', element: 'physical', damage: 10, range: 4, apCost: 1, icon: 'send' },
      { id: 'e_frost_arrow', name: 'Frost Arrow', desc: '', element: 'frost', damage: 9, range: 4, apCost: 2, applies: { status: 'wet', turns: 3 }, icon: 'snow' },
    ],
    weaknesses: ['fire'],
    loot: [{ itemId: 'i2', chance: 0.15 }, { itemId: 'i22', chance: 0.3 }, { itemId: 'i12', chance: 0.4 }],
    xp: 65, gold: [12, 25],
    flavor: 'Sworn to silence. The Court does not forgive trespass.',
    color: '#10B981', icon: 'leaf',
  },
  golem: {
    id: 'golem',
    name: 'Dwarven Stoneguard',
    title: 'forged, awakened, furious',
    hp: 70, atk: 12, def: 6, speed: 1, range: 1,
    abilities: [
      { id: 'g_slam', name: 'Stone Slam', desc: '', element: 'physical', damage: 14, range: 1, apCost: 1, icon: 'hammer' },
      { id: 'g_quake', name: 'Quake', desc: '', element: 'physical', damage: 10, range: 2, aoe: 'splash', apCost: 2, applies: { status: 'stunned', turns: 1 }, icon: 'pulse' },
    ],
    resistances: ['physical', 'fire'],
    weaknesses: ['lightning'],
    loot: [{ itemId: 'i9', chance: 0.4 }, { itemId: 'i3', chance: 0.1 }, { itemId: 'i22', chance: 0.5 }],
    xp: 90, gold: [25, 45],
    flavor: 'Khar-Duun stone, shaped by oaths older than crowns.',
    color: '#A78BFA', icon: 'cube',
  },
  hollow_knight: {
    id: 'hollow_knight',
    name: 'Hollow Knight',
    title: 'sworn to a king who is not',
    hp: 55, atk: 11, def: 3, speed: 1, range: 1,
    abilities: [
      { id: 'h_strike', name: 'Shadow Strike', desc: '', element: 'shadow', damage: 12, range: 1, apCost: 1, icon: 'cut' },
      { id: 'h_fear', name: 'Fearbringer', desc: '', element: 'shadow', damage: 4, range: 3, apCost: 2, applies: { status: 'fearful', turns: 2 }, icon: 'skull' },
    ],
    resistances: ['shadow', 'physical'],
    weaknesses: ['holy', 'fire'],
    loot: [{ itemId: 'i18', chance: 0.15 }, { itemId: 'i6', chance: 0.5 }, { itemId: 'i12', chance: 0.3 }],
    xp: 110, gold: [30, 55],
    flavor: 'It rides at midnight. It does not breathe.',
    color: '#475569', icon: 'shield',
  },
  veil_touched: {
    id: 'veil_touched',
    name: 'Veil-Touched',
    title: 'spoken to by the Voice',
    hp: 38, atk: 6, def: 2, speed: 2, range: 3,
    abilities: [
      { id: 'v_flay', name: 'Mind Flay', desc: '', element: 'arcane', damage: 11, range: 3, apCost: 1, icon: 'eye' },
      { id: 'v_phase', name: 'Veilstep', desc: '', element: 'arcane', damage: 7, range: 4, apCost: 2, applies: { status: 'shocked', turns: 1 }, icon: 'sparkles' },
    ],
    resistances: ['arcane', 'shadow'],
    weaknesses: ['holy'],
    loot: [{ itemId: 'i23', chance: 0.25 }, { itemId: 'i20', chance: 0.05 }, { itemId: 'i13', chance: 0.5 }],
    xp: 120, gold: [20, 40],
    flavor: 'Its mouth moves out of time with its words.',
    color: '#8B5CF6', icon: 'eye',
  },
  stormblood: {
    id: 'stormblood',
    name: 'Stormblooded Raider',
    title: 'kissed by the sky-poison',
    hp: 48, atk: 10, def: 2, speed: 2, range: 2,
    abilities: [
      { id: 's_spear', name: 'Lightning Spear', desc: '', element: 'lightning', damage: 11, range: 3, apCost: 1, applies: { status: 'shocked', turns: 1 }, icon: 'flash' },
      { id: 's_call', name: 'Stormcall', desc: '', element: 'lightning', damage: 8, range: 4, apCost: 2, tileEffect: 'water', applies: { status: 'wet', turns: 3 }, icon: 'rainy' },
    ],
    resistances: ['lightning'],
    weaknesses: ['frost'],
    loot: [{ itemId: 'i8', chance: 0.2 }, { itemId: 'i12', chance: 0.4 }, { itemId: 'i21', chance: 0.5 }],
    xp: 95, gold: [22, 42],
    flavor: 'Their skalds said the sky owed them a debt. They are collecting.',
    color: '#06B6D4', icon: 'flash',
  },
  lich: {
    id: 'lich',
    name: 'Ancient Lich',
    title: 'bone-king of the eighth deep',
    hp: 110, atk: 14, def: 4, speed: 1, range: 4,
    abilities: [
      { id: 'l_drain', name: 'Life Drain', desc: '', element: 'shadow', damage: 14, range: 4, apCost: 1, icon: 'skull' },
      { id: 'l_meteor', name: 'Bone Meteor', desc: '', element: 'arcane', damage: 18, range: 5, aoe: 'splash', apCost: 2, applies: { status: 'burning', turns: 2 }, tileEffect: 'fire', icon: 'planet' },
      { id: 'l_curse', name: 'Curse of Hollow', desc: '', element: 'shadow', damage: 8, range: 5, apCost: 1, applies: { status: 'fearful', turns: 3 }, icon: 'eye' },
    ],
    resistances: ['shadow', 'frost', 'arcane'],
    weaknesses: ['holy', 'fire'],
    loot: [{ itemId: 'i17', chance: 0.6 }, { itemId: 'i5', chance: 0.1 }, { itemId: 'i14', chance: 0.3 }, { itemId: 'i23', chance: 0.5 }],
    xp: 250, gold: [80, 160],
    flavor: 'It has waited centuries to hear its true name. Do not say it.',
    color: '#EC4899', icon: 'skull',
  },
};

// Encounter tables per region
export const ENCOUNTERS: Record<string, string[][]> = {
  r1: [['bandit', 'bandit'], ['hollow_knight'], ['bandit', 'wolf']],          // Caelhorn Ruins
  r2: [['warden'], ['warden', 'wolf'], ['veil_touched']],                       // Sylvarin Wood
  r3: [['golem'], ['lich'], ['golem', 'bandit']],                               // Khar-Duun Deeps
  r4: [['stormblood'], ['stormblood', 'wolf'], ['stormblood', 'stormblood']],   // Grokhai Steppe
  r5: [['bandit', 'bandit', 'wolf'], ['stormblood']],                            // Saltreach Coast
  r6: [['bandit'], ['wolf'], ['bandit', 'bandit']],                              // Veliryn Plains
  r7: [['veil_touched', 'veil_touched'], ['lich']],                              // Sundered Tower
  r8: [['wolf', 'wolf'], ['wolf', 'wolf', 'wolf']],                              // Frostmere
  r9: [['lich'], ['veil_touched', 'lich']],                                       // The Veil
};

// Damage modifier given attacker element vs defender weaknesses/resistances and statuses
export function computeElementalDamage(
  base: number,
  element: ElementType,
  defenderResistances: ElementType[] = [],
  defenderWeaknesses: ElementType[] = [],
  defenderStatuses: StatusType[] = [],
): { damage: number; note?: string } {
  let dmg = base;
  let note: string | undefined;

  if (defenderResistances.includes(element)) {
    dmg = Math.floor(dmg * 0.5);
    note = 'resisted';
  } else if (defenderWeaknesses.includes(element)) {
    dmg = Math.floor(dmg * 1.6);
    note = 'weakness!';
  }

  // Elemental interactions
  if (element === 'fire' && defenderStatuses.includes('oiled')) {
    dmg = Math.floor(dmg * 1.8);
    note = 'oil ignites!';
  }
  if (element === 'lightning' && defenderStatuses.includes('wet')) {
    dmg = Math.floor(dmg * 1.7);
    note = 'water conducts!';
  }
  if (element === 'frost' && defenderStatuses.includes('wet')) {
    dmg = Math.floor(dmg * 1.4);
    note = 'shatter!';
  }
  if (element === 'fire' && defenderStatuses.includes('frozen')) {
    dmg = Math.floor(dmg * 1.5);
    note = 'thawed!';
  }

  return { damage: Math.max(1, dmg), note };
}

export function statusFromTile(effect: TileEffect): StatusType | null {
  if (effect === 'oil') return 'oiled';
  if (effect === 'water') return 'wet';
  if (effect === 'fire') return 'burning';
  if (effect === 'frost') return 'frozen';
  return null;
}

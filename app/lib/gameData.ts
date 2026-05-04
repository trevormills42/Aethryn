// Core game data for Aetheryn: Chronicles of the Sundered Realm

export const COLORS = {
  bgDark: '#0A1128',
  bgDeep: '#050817',
  purple: '#2D1B4E',
  purpleLight: '#4A2C7A',
  gold: '#D4AF37',
  goldBright: '#F5D76E',
  silver: '#C0C7D1',
  ember: '#E76F51',
  arcane: '#8B5CF6',
  divine: '#FCD34D',
  nature: '#10B981',
  blood: '#DC2626',
  ink: '#1A1F3A',
  parchment: '#F4E8D0',
};

export type Race = {
  id: string;
  name: string;
  title: string;
  image: string;
  lore: string;
  bonuses: { attr: string; val: number }[];
  startingSkill: string;
  storyHook: string;
};

export const RACES: Race[] = [
  {
    id: 'human',
    name: 'Human',
    title: 'The Adaptive',
    image: 'https://d64gsuwffb70l.cloudfront.net/69f61b1fe8b27f6d8e673495_1777736618202_5c092072.png',
    lore: 'Born of the warring kingdoms of Veliryn, humans are versatile and ambitious. Their short lives drive them to greatness — or ruin.',
    bonuses: [
      { attr: 'Willpower', val: 2 },
      { attr: 'Charisma', val: 2 },
    ],
    startingSkill: 'Diplomacy',
    storyHook: 'You are a survivor of the burning of Caelhorn, sworn to uncover who orchestrated its fall.',
  },
  {
    id: 'elf',
    name: 'Elf',
    title: 'The Starwoven',
    image: 'https://d64gsuwffb70l.cloudfront.net/69f61b1fe8b27f6d8e673495_1777736683844_a29359bb.png',
    lore: 'The Sylvarin elves trace their bloodline to the first dreamers. They speak with rivers and remember songs older than mountains.',
    bonuses: [
      { attr: 'Intellect', val: 3 },
      { attr: 'Agility', val: 1 },
    ],
    startingSkill: 'Arcane Weaving',
    storyHook: 'Cast out from the Moonglade Court for forbidden study of the Veil, you seek the truth your kin would silence.',
  },
  {
    id: 'dwarf',
    name: 'Dwarf',
    title: 'The Ironborn',
    image: 'https://d64gsuwffb70l.cloudfront.net/69f61b1fe8b27f6d8e673495_1777736716988_8ad6cef2.jpg',
    lore: 'Forged in the deep halls of Khar-Duun, dwarves carve memory into stone. Their oaths are unbreakable as the bedrock.',
    bonuses: [
      { attr: 'Strength', val: 2 },
      { attr: 'Constitution', val: 2 },
    ],
    startingSkill: 'Smithing',
    storyHook: 'Your clan was buried alive by something that should not exist. You are the last witness — and the last avenger.',
  },
  {
    id: 'orc',
    name: 'Orc',
    title: 'The Stormblooded',
    image: 'https://d64gsuwffb70l.cloudfront.net/69f61b1fe8b27f6d8e673495_1777736734677_aff3c592.jpg',
    lore: 'The Grokhai orcs are not the savages of legend. Their skalds remember the day the sky was poisoned, and they march to heal it.',
    bonuses: [
      { attr: 'Strength', val: 3 },
      { attr: 'Constitution', val: 1 },
    ],
    startingSkill: 'Berserker Stance',
    storyHook: 'Marked by the storm-spirit at birth, you walk the Greenpath to find why the gods have stopped answering.',
  },
];

export type Attribute = {
  name: string;
  short: string;
  desc: string;
  icon: string;
  base: number;
};

export const ATTRIBUTES: Attribute[] = [
  { name: 'Strength', short: 'STR', desc: 'Raw physical might. Affects melee damage and carry weight.', icon: 'flame', base: 10 },
  { name: 'Agility', short: 'AGI', desc: 'Speed and finesse. Affects dodge and ranged accuracy.', icon: 'flash', base: 10 },
  { name: 'Constitution', short: 'CON', desc: 'Endurance of the flesh. Affects health and poison resistance.', icon: 'shield', base: 10 },
  { name: 'Intellect', short: 'INT', desc: 'Sharpness of mind. Affects mana pool and spell power.', icon: 'sparkles', base: 10 },
  { name: 'Willpower', short: 'WIL', desc: 'Mastery of self. Affects resistance to fear and mind magic.', icon: 'eye', base: 10 },
  { name: 'Perception', short: 'PER', desc: 'Awareness of the world. Affects detection and critical chance.', icon: 'compass', base: 10 },
  { name: 'Charisma', short: 'CHA', desc: 'Force of presence. Affects persuasion and prices.', icon: 'rose', base: 10 },
  { name: 'Luck', short: 'LCK', desc: 'Whispers of fate. Affects rare drops and unexpected fortunes.', icon: 'star', base: 10 },
];

export type Skill = {
  id: string;
  name: string;
  school: string;
  desc: string;
  tier: number;
  prereq?: string;
  unlockUses: number;
};

export const SCHOOLS = [
  { id: 'combat', name: 'Combat', color: '#DC2626', desc: 'The art of the blade and the shield.' },
  { id: 'stealth', name: 'Stealth', color: '#6B7280', desc: 'Walk between shadows, strike from silence.' },
  { id: 'arcane', name: 'Arcane Magic', color: '#8B5CF6', desc: 'Bend the Veil, weave raw thought into flame.' },
  { id: 'divine', name: 'Divine Magic', color: '#FCD34D', desc: 'Channel the will of slumbering gods.' },
  { id: 'crafting', name: 'Crafting', color: '#E76F51', desc: 'Forge, brew, enchant.' },
  { id: 'survival', name: 'Survival', color: '#10B981', desc: 'Read the wind, name every leaf.' },
];

export const SKILLS: Skill[] = [
  // Combat
  { id: 'c1', name: 'Bladework', school: 'combat', desc: '+10% damage with one-handed weapons.', tier: 1, unlockUses: 0 },
  { id: 'c2', name: 'Shield Wall', school: 'combat', desc: 'Block reduces damage by 40%.', tier: 1, unlockUses: 0 },
  { id: 'c3', name: 'Heavy Strike', school: 'combat', desc: 'Charged attack stuns foe for 1 turn.', tier: 2, prereq: 'c1', unlockUses: 25 },
  { id: 'c4', name: 'Riposte', school: 'combat', desc: 'Counter after a successful block.', tier: 2, prereq: 'c2', unlockUses: 25 },
  { id: 'c5', name: 'Whirlwind', school: 'combat', desc: 'Strike all adjacent enemies.', tier: 3, prereq: 'c3', unlockUses: 60 },
  { id: 'c6', name: 'Bloodfury', school: 'combat', desc: 'Below 30% HP: +50% damage.', tier: 3, prereq: 'c4', unlockUses: 60 },
  { id: 'c7', name: 'Sundering Blow', school: 'combat', desc: 'Ignores 50% armor.', tier: 4, prereq: 'c5', unlockUses: 120 },
  // Stealth
  { id: 's1', name: 'Sneak', school: 'stealth', desc: 'Move undetected at half speed.', tier: 1, unlockUses: 0 },
  { id: 's2', name: 'Lockpicking', school: 'stealth', desc: 'Open locks of common difficulty.', tier: 1, unlockUses: 0 },
  { id: 's3', name: 'Backstab', school: 'stealth', desc: '3x damage from stealth.', tier: 2, prereq: 's1', unlockUses: 30 },
  { id: 's4', name: 'Poisoncraft', school: 'stealth', desc: 'Coat blades with brewed venoms.', tier: 2, prereq: 's2', unlockUses: 30 },
  { id: 's5', name: 'Shadowstep', school: 'stealth', desc: 'Teleport behind a target once per battle.', tier: 3, prereq: 's3', unlockUses: 80 },
  { id: 's6', name: 'Veilwalker', school: 'stealth', desc: 'Brief invisibility after a kill.', tier: 4, prereq: 's5', unlockUses: 150 },
  // Arcane
  { id: 'a1', name: 'Firebolt', school: 'arcane', desc: 'Ranged spell, 8 fire damage.', tier: 1, unlockUses: 0 },
  { id: 'a2', name: 'Frost Ward', school: 'arcane', desc: 'Shield absorbing 20 damage.', tier: 1, unlockUses: 0 },
  { id: 'a3', name: 'Chain Lightning', school: 'arcane', desc: 'Arcs to 3 nearby foes.', tier: 2, prereq: 'a1', unlockUses: 35 },
  { id: 'a4', name: 'Mage Armor', school: 'arcane', desc: '+15 magical armor for 1 hour.', tier: 2, prereq: 'a2', unlockUses: 35 },
  { id: 'a5', name: 'Veilrend', school: 'arcane', desc: 'Tear reality. Banish summoned foes.', tier: 3, prereq: 'a3', unlockUses: 90 },
  { id: 'a6', name: 'Stormcaller', school: 'arcane', desc: 'Summon a thunderhead. AoE 3 turns.', tier: 4, prereq: 'a5', unlockUses: 160 },
  // Divine
  { id: 'd1', name: 'Mend Wounds', school: 'divine', desc: 'Restore 15 HP.', tier: 1, unlockUses: 0 },
  { id: 'd2', name: 'Smite', school: 'divine', desc: 'Holy strike, 12 radiant damage.', tier: 1, unlockUses: 0 },
  { id: 'd3', name: 'Blessing of Vael', school: 'divine', desc: '+2 to all attributes for 10 turns.', tier: 2, prereq: 'd1', unlockUses: 35 },
  { id: 'd4', name: 'Turn Undead', school: 'divine', desc: 'Force undead to flee.', tier: 2, prereq: 'd2', unlockUses: 35 },
  { id: 'd5', name: 'Sanctuary', school: 'divine', desc: 'Allies in radius regen 5 HP/turn.', tier: 3, prereq: 'd3', unlockUses: 90 },
  { id: 'd6', name: 'Wrath of Heaven', school: 'divine', desc: 'Pillar of light, massive damage.', tier: 4, prereq: 'd5', unlockUses: 160 },
  // Crafting
  { id: 'r1', name: 'Smithing', school: 'crafting', desc: 'Forge basic weapons and armor.', tier: 1, unlockUses: 0 },
  { id: 'r2', name: 'Alchemy', school: 'crafting', desc: 'Brew minor potions.', tier: 1, unlockUses: 0 },
  { id: 'r3', name: 'Enchanting', school: 'crafting', desc: 'Imbue gear with minor runes.', tier: 2, prereq: 'r1', unlockUses: 30 },
  { id: 'r4', name: 'Master Brewing', school: 'crafting', desc: 'Craft greater elixirs.', tier: 2, prereq: 'r2', unlockUses: 30 },
  { id: 'r5', name: 'Runesmith', school: 'crafting', desc: 'Forge weapons of legend.', tier: 3, prereq: 'r3', unlockUses: 100 },
  // Survival
  { id: 'v1', name: 'Tracking', school: 'survival', desc: 'Follow tracks across any terrain.', tier: 1, unlockUses: 0 },
  { id: 'v2', name: 'Foraging', school: 'survival', desc: 'Gather herbs and ingredients.', tier: 1, unlockUses: 0 },
  { id: 'v3', name: 'Beast Lore', school: 'survival', desc: 'Reveal weaknesses of creatures.', tier: 2, prereq: 'v1', unlockUses: 30 },
  { id: 'v4', name: 'Tame Beast', school: 'survival', desc: 'Befriend a wild creature companion.', tier: 3, prereq: 'v3', unlockUses: 80 },
  { id: 'v5', name: 'Stormwarden', school: 'survival', desc: 'Immune to weather. Animals heed you.', tier: 4, prereq: 'v4', unlockUses: 150 },
];

export type Quest = {
  id: string;
  title: string;
  region: string;
  giver: string;
  status: 'available' | 'active' | 'completed';
  brief: string;
  objective: string;
  reward: string;
  choices?: { label: string; consequence: string }[];
};

export const QUESTS: Quest[] = [
  {
    id: 'q1',
    title: 'The Ember Vow',
    region: 'Caelhorn Ruins',
    giver: 'Magister Halen',
    status: 'available',
    brief: 'A black smoke clings to the ruins of your homeland. Halen swears it remembers names.',
    objective: 'Investigate the cathedral cellar.',
    reward: '120 XP, Ember Sigil',
    choices: [
      { label: 'Burn the cellar shut.', consequence: 'The smoke is sealed. Something inside screams.' },
      { label: 'Speak the name it whispers.', consequence: 'It calls you "kin." Arcane skill +20 uses.' },
    ],
  },
  {
    id: 'q2',
    title: 'Beneath the Moonglade',
    region: 'Sylvarin Wood',
    giver: 'Archivist Lirae',
    status: 'available',
    brief: 'The Moonglade Court has not sung the Dusk Hymn in seven nights. The trees are listening.',
    objective: 'Find the silenced cantor.',
    reward: '180 XP, Whisperleaf Cloak',
  },
  {
    id: 'q3',
    title: 'The Buried Hall',
    region: 'Khar-Duun Deeps',
    giver: 'Thane Vorrik',
    status: 'available',
    brief: 'A clan vanished beneath the eighth deep. Vorrik will pay in old gold for any who return.',
    objective: 'Descend the eighth deep. Return.',
    reward: '250 XP, Stoneoath Hammer',
    choices: [
      { label: 'Honor the clan with fire.', consequence: 'Dwarven kinship +1. Their ghosts rest.' },
      { label: 'Take the relic they died guarding.', consequence: 'You gain the Mournstone. The deeps will remember.' },
    ],
  },
  { id: 'q4', title: 'The Stormpath', region: 'Grokhai Steppe', giver: 'Skald Murr', status: 'available', brief: 'The sky-poison spreads. Walk the Greenpath and ask the Old One why.', objective: 'Reach the Bone Cairn.', reward: '200 XP, Stormtotem' },
  { id: 'q5', title: 'Glass and Bone', region: 'Saltreach Coast', giver: 'Captain Yara', status: 'available', brief: 'Ships return with crews of glass-eyed silence. Yara wants the source.', objective: 'Dive the wreck of the Iron Lily.', reward: '220 XP, Saltforged Blade' },
  { id: 'q6', title: 'The Hollow King', region: 'Veliryn Plains', giver: 'Sister Adelis', status: 'available', brief: 'A king who should be dead rides at midnight, recruiting.', objective: 'Confront the Hollow King at the crossroads.', reward: '300 XP, Crown Shard' },
  { id: 'q7', title: 'The Veil Thins', region: 'Sundered Tower', giver: 'The Voice', status: 'available', brief: 'Something is reading you back. The Voice asks you to climb.', objective: 'Ascend the Sundered Tower.', reward: '400 XP, Voice-Touched (passive)' },
  { id: 'q8', title: 'A Debt of Wolves', region: 'Frostmere', giver: 'Hunter Ilse', status: 'available', brief: 'The Frostmere wolves walk on two legs again. Old debts, older blood.', objective: 'Find the Wolf-Mother.', reward: '180 XP, Wolfsbane Charm' },
  { id: 'q9', title: 'The Cartographer\'s Lie', region: 'Veliryn Plains', giver: 'Mapmaker Tobias', status: 'available', brief: 'A village exists on Tobias\' map that exists on no other. Yet smoke rises from it.', objective: 'Reach the village that should not be.', reward: '160 XP, Truesight Lens' },
  { id: 'q10', title: 'The Last Bell', region: 'Caelhorn Ruins', giver: 'Bellringer\'s Ghost', status: 'available', brief: 'The cathedral bell wants to be rung once more. It will cost you.', objective: 'Ring the bell at midnight.', reward: '350 XP, Permanent +1 Willpower' },
  { id: 'q11', title: 'Children of the Long Dark', region: 'Khar-Duun Deeps', giver: 'Nameless Child', status: 'available', brief: 'A child you do not remember calls you "father" in the deep dark.', objective: 'Decide what they are.', reward: '?' },
  { id: 'q12', title: 'The God Beneath', region: 'Sylvarin Wood', giver: 'Root-Speaker', status: 'available', brief: 'There is a god buried under the Moonglade. It is waking. The Court is glad.', objective: 'Choose: wake it, kill it, or become its voice.', reward: 'Story-defining', choices: [
    { label: 'Wake the god.', consequence: 'The Sylvarin sing your name in fear.' },
    { label: 'Slay the god in its sleep.', consequence: 'The Moonglade dies. You are hunted forever.' },
    { label: 'Become its voice.', consequence: 'You gain divine magic mastery. You are no longer entirely you.' },
  ]},
];

export type Item = {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'potion' | 'artifact' | 'material';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  desc: string;
  lore: string;
  stat?: string;
};

export const RARITY_COLOR: Record<string, string> = {
  common: '#9CA3AF',
  uncommon: '#10B981',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
};

export const ITEMS: Item[] = [
  { id: 'i1', name: 'Iron Shortsword', type: 'weapon', rarity: 'common', desc: '+5 damage', lore: 'A common blade, faithfully sharpened.', stat: '+5 ATK' },
  { id: 'i2', name: 'Whisperleaf Bow', type: 'weapon', rarity: 'rare', desc: '+12 damage, +10% crit', lore: 'Bowstrung from a dryad\'s last sigh.', stat: '+12 ATK' },
  { id: 'i3', name: 'Stoneoath Hammer', type: 'weapon', rarity: 'epic', desc: '+22 damage, stuns on crit', lore: 'Forged in the buried halls. It hums when held by Ironborn.', stat: '+22 ATK' },
  { id: 'i4', name: 'Saltforged Blade', type: 'weapon', rarity: 'rare', desc: '+15 damage vs aquatic foes', lore: 'Quenched in the Iron Lily\'s last storm.', stat: '+15 ATK' },
  { id: 'i5', name: 'Veilrender', type: 'weapon', rarity: 'legendary', desc: 'Cuts through invisibility and illusion.', lore: 'The blade that first wounded a god.', stat: '+30 ATK' },
  { id: 'i6', name: 'Padded Leather', type: 'armor', rarity: 'common', desc: '+8 armor', lore: 'Honest work, honest hide.', stat: '+8 DEF' },
  { id: 'i7', name: 'Moonglade Plate', type: 'armor', rarity: 'epic', desc: '+25 armor, +5 INT', lore: 'Plates of moonsilver scaled like leaves.', stat: '+25 DEF' },
  { id: 'i8', name: 'Stormtotem Mantle', type: 'armor', rarity: 'rare', desc: '+18 armor, immune to lightning', lore: 'Worn by skalds who survived the sky-poison.', stat: '+18 DEF' },
  { id: 'i9', name: 'Khar-Duun Helm', type: 'armor', rarity: 'uncommon', desc: '+10 armor, +2 CON', lore: 'Stone-set steel that remembers the deep.', stat: '+10 DEF' },
  { id: 'i10', name: 'Robe of the Veilwoven', type: 'armor', rarity: 'legendary', desc: '+15 armor, +30% spell power', lore: 'Spun from a dream the Sylvarin refuse to remember.', stat: '+15 DEF' },
  { id: 'i11', name: 'Minor Healing Draught', type: 'potion', rarity: 'common', desc: 'Restore 25 HP', lore: 'Tastes of moss and copper.', stat: '+25 HP' },
  { id: 'i12', name: 'Greater Healing Elixir', type: 'potion', rarity: 'uncommon', desc: 'Restore 80 HP', lore: 'Brewed in the high passes when the moon is right.', stat: '+80 HP' },
  { id: 'i13', name: 'Mana Tincture', type: 'potion', rarity: 'common', desc: 'Restore 30 MP', lore: 'Bitter as a forgotten name.', stat: '+30 MP' },
  { id: 'i14', name: 'Phoenix Tear', type: 'potion', rarity: 'legendary', desc: 'Revive at full HP once', lore: 'Wept by the last phoenix as it forgave the world.', stat: 'Revive' },
  { id: 'i15', name: 'Elixir of Stoneblood', type: 'potion', rarity: 'rare', desc: 'Half damage for 5 turns', lore: 'Drink it and your veins forget they are flesh.', stat: 'Defense' },
  { id: 'i16', name: 'Ember Sigil', type: 'artifact', rarity: 'rare', desc: '+15% fire damage', lore: 'Pulled from the throat of a screaming smoke.', stat: '+15% Fire' },
  { id: 'i17', name: 'Mournstone', type: 'artifact', rarity: 'epic', desc: 'See the dead. They see you.', lore: 'It hums when corpses are near. They hum back.', stat: 'Spectral Sight' },
  { id: 'i18', name: 'Crown Shard', type: 'artifact', rarity: 'epic', desc: '+5 CHA, NPCs fear or revere you', lore: 'A fragment of a crown that should not exist.', stat: '+5 CHA' },
  { id: 'i19', name: 'Truesight Lens', type: 'artifact', rarity: 'rare', desc: 'Reveals hidden paths and lies', lore: 'Ground from the eye of a sleeping oracle.', stat: 'Truesight' },
  { id: 'i20', name: 'Voice-Touched Locket', type: 'artifact', rarity: 'legendary', desc: 'A whisper guides you. It is not always wrong.', lore: 'You no longer dream alone.', stat: '+10% XP' },
  { id: 'i21', name: 'Iron Ingot', type: 'material', rarity: 'common', desc: 'Smithing component.', lore: 'Honest metal.' },
  { id: 'i22', name: 'Moonsilver Ore', type: 'material', rarity: 'rare', desc: 'Refined for elven gear.', lore: 'It glows softly when no one is watching.' },
  { id: 'i23', name: 'Veilthread', type: 'material', rarity: 'epic', desc: 'Used in legendary enchanting.', lore: 'Cut from the seam between worlds.' },
  { id: 'i24', name: 'Wolfsbane Charm', type: 'artifact', rarity: 'uncommon', desc: 'Lycanthropes cannot smell you.', lore: 'A child\'s whittling, somehow potent.', stat: 'Stealth+' },
  { id: 'i25', name: 'Bellringer\'s Token', type: 'artifact', rarity: 'rare', desc: 'Once per day, undo your last action.', lore: 'The bell remembers. The token forgets so you may.', stat: 'Rewind' },
  { id: 'i26', name: 'Trail Rations', type: 'material', rarity: 'common', desc: 'Consumed when resting. Hard bread, dried meat, a little salt.', lore: 'Enough for a night\'s camp. The realm asks something for the sleep it gives.' },
];

export const REGIONS = [
  { id: 'r1', name: 'Caelhorn Ruins', danger: 2, desc: 'A city of ash and unanswered prayers.', x: 30, y: 40 },
  { id: 'r2', name: 'Sylvarin Wood', danger: 3, desc: 'The Moonglade sings only at dusk.', x: 60, y: 25 },
  { id: 'r3', name: 'Khar-Duun Deeps', danger: 4, desc: 'Eight deeps. Only seven are mapped.', x: 20, y: 65 },
  { id: 'r4', name: 'Grokhai Steppe', danger: 3, desc: 'The sky-poison drifts low here.', x: 75, y: 60 },
  { id: 'r5', name: 'Saltreach Coast', danger: 2, desc: 'Glass-eyed crews and the Iron Lily\'s ghost.', x: 50, y: 80 },
  { id: 'r6', name: 'Veliryn Plains', danger: 1, desc: 'Wheat, kingdoms, and the Hollow King.', x: 45, y: 50 },
  { id: 'r7', name: 'Sundered Tower', danger: 5, desc: 'The Voice still calls from inside.', x: 80, y: 35 },
  { id: 'r8', name: 'Frostmere', danger: 4, desc: 'Wolves walk on two legs in winter.', x: 15, y: 20 },
  { id: 'r9', name: 'The Veil', danger: 5, desc: 'Reachable only through the Tower.', x: 90, y: 15 },
];

export const ACHIEVEMENTS = [
  { id: 'ach1', name: 'First Blood', desc: 'Win your first battle.', unlocked: true },
  { id: 'ach2', name: 'Wanderer', desc: 'Visit 3 regions.', unlocked: true },
  { id: 'ach3', name: 'Skill Awakened', desc: 'Unlock a tier-2 skill.', unlocked: false },
  { id: 'ach4', name: 'The Reader', desc: 'Read 10 lore entries.', unlocked: false },
  { id: 'ach5', name: 'Hidden in Plain Sight', desc: 'Discover a secret region.', unlocked: false },
  { id: 'ach6', name: 'Voice-Touched', desc: 'Complete the Sundered Tower.', unlocked: false },
];

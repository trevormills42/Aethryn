// Wander system: a region's quiet face, as opposed to Hunt's loud one.
//
// Cost: a percentage of max HP (handled in the store, currently ~2%, min 2).
// Each region tracks how many times you've wandered it; after 3, the well runs
// dry and you draw from the EXHAUSTED pool until you pass time. Time passes
// when you rest, advance a quest, or wander a different region.
//
// Outcomes have weights (higher = more common in their pool) and optional
// conditions (stat/skill gates). The picker filters by conditions, then
// weighted-randoms.
//
// Each combat outcome can optionally specify its own enemy-count distribution
// (the [p1, p2, p3] probabilities of fighting 1, 2, or 3 enemies). When absent,
// the region's default is used. When the region has none, the universal
// 60/30/10 split applies. Resolution happens in getCombatCountDistribution().

export type CountDistribution = readonly [number, number, number]; // [p(1), p(2), p(3)] — should sum to 1

export type WanderEffect = {
  xp?: number;
  hp?: number;
  mp?: number;
  gold?: number;
  itemId?: string;
  itemRemove?: string;
  journal?: string;
  trainSkill?: { skillId: string; uses: number };
  combat?: {
    enemyIds: string[];
    canFlee: boolean;
    countDistribution?: CountDistribution; // overrides region default
  };
};

export type WanderCondition = {
  attribute?: { name: string; min: number };
  skillUnlocked?: string;
  hasItem?: string;
};

export type WanderOutcome = {
  id: string;
  scope: 'universal' | 'region' | 'gated' | 'exhausted';
  regionId?: string;
  conditions?: WanderCondition[];
  weight: number;
  text: string;
  effects: WanderEffect;
};

// ---------- REGION DEFAULTS ---------------------------------------------------
// Each region's *default* enemy-count distribution for combat outcomes that
// don't override. Tuned to danger tier — wilder places tend to ambush in packs.

const UNIVERSAL_DISTRIBUTION: CountDistribution = [0.6, 0.3, 0.1];

export const REGION_COMBAT_DEFAULTS: Record<string, CountDistribution> = {
  r6: [0.7, 0.25, 0.05],   // Veliryn Plains (1) — settled, mostly lone bandits
  r5: [0.7, 0.25, 0.05],   // Saltreach Coast (2)
  r1: [0.7, 0.25, 0.05],   // Caelhorn Ruins (2) — empty more than dangerous
  r2: [0.6, 0.3, 0.1],     // Sylvarin Wood (3) — universal
  r4: [0.5, 0.35, 0.15],   // Grokhai Steppe (3) — clan-warbands roam
  r3: [0.4, 0.35, 0.25],   // Khar-Duun Deeps (4) — things gather in the dark
  r8: [0.4, 0.4, 0.2],     // Frostmere (4) — wolves rarely come alone
  r7: [0.3, 0.4, 0.3],     // Sundered Tower (5) — the Voice does not send singletons
  r9: [0.25, 0.4, 0.35],   // The Veil (5) — almost nothing here is alone
};

// Resolve the count distribution for a given outcome+region. Outcome > region > universal.
export function getCombatCountDistribution(
  outcome: WanderOutcome,
  regionId: string,
): CountDistribution {
  if (outcome.effects.combat?.countDistribution) return outcome.effects.combat.countDistribution;
  if (REGION_COMBAT_DEFAULTS[regionId]) return REGION_COMBAT_DEFAULTS[regionId];
  return UNIVERSAL_DISTRIBUTION;
}

// ---------- UNIVERSAL (12) ---------------------------------------------------
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
    id: 'u12', scope: 'universal', weight: 5,
    text: 'Three figures step from the brush, knives already drawn. There is no preamble.',
    effects: { combat: { enemyIds: ['bandit'], canFlee: true } },
  },
];

// =============================================================================
// VELIRYN PLAINS (r6) — danger 1
// "Wheat, kingdoms, and the Hollow King." Pastoral, melancholic, the country
// where the crown stopped meaning anything.
// =============================================================================

export const VELIRYN_OUTCOMES: WanderOutcome[] = [
  {
    id: 'v6_r1', scope: 'region', regionId: 'r6', weight: 10,
    text: 'A field of wheat ripens around you, though no one tends it and no village is in sight. You take a handful, and bind enough to carry. It tastes like bread already buttered.',
    effects: { xp: 10, hp: 4, itemId: 'i26' },
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
    id: 'v6_r12', scope: 'region', regionId: 'r6', weight: 3,
    text: 'A woman waits at a crossroads. She has the look of waiting a long time. She does not speak when you greet her, and she is gone when you look back.',
    effects: { xp: 24, hp: -4, journal: 'The waiting woman at the Plains crossroads. She does not speak. She does not stay.' },
  },

  // 6 stat/skill-gated
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
    conditions: [{ skillUnlocked: 'v2' }],
    text: 'Your eye finds the right kind of bruised stem at the right kind of slant. A handful of nettles for the brewing, and beneath, a vein of pale ore the wheat has hidden a long time.',
    effects: { itemId: 'i22', xp: 18, trainSkill: { skillId: 'v2', uses: 1 } },
  },
  {
    id: 'v6_g5', scope: 'gated', regionId: 'r6', weight: 3,
    conditions: [{ skillUnlocked: 'c1' }],
    text: 'A knight in old colors offers a sparring bout in the long grass. You accept. He is better than he looks, and you are better when you leave.',
    effects: { xp: 22, hp: -8, trainSkill: { skillId: 'c1', uses: 3 } },
  },
  {
    id: 'v6_g6', scope: 'gated', regionId: 'r6', weight: 3,
    conditions: [{ skillUnlocked: 'd1' }],
    text: 'A traveler bleeding by the roadside, robbed and left. You knit him together. He has nothing to give you but a name to remember, and he gives it.',
    effects: { xp: 28, trainSkill: { skillId: 'd1', uses: 2 }, journal: 'A name a dying man gave me in the Plains: Aelis Voren.' },
  },
];

// =============================================================================
// CAELHORN RUINS (r1) — danger 2
// "A city of ash and unanswered prayers." Devotional grief, abandoned faith.
// Saints whose names are forgotten. Prayers half-spoken into empty stone.
// =============================================================================

export const CAELHORN_OUTCOMES: WanderOutcome[] = [
  {
    id: 'v1_r1', scope: 'region', regionId: 'r1', weight: 10,
    text: 'A nave open to the sky, pews still arranged in patient rows. The dust on them is undisturbed. Whoever left, left long enough ago that no one came back to sit.',
    effects: { xp: 14, journal: 'A nave at Caelhorn, pews dusted but unbroken. No one returned to sit.' },
  },
  {
    id: 'v1_r2', scope: 'region', regionId: 'r1', weight: 9,
    text: 'A mendicant walks the rubble in robes too clean for the road. He blesses you in a tongue you almost recognize and asks nothing.',
    effects: { xp: 12, mp: 6 },
  },
  {
    id: 'v1_r3', scope: 'region', regionId: 'r1', weight: 8,
    text: 'A stone saint stands without a face. Someone has chiseled it carefully off, leaving the rest. You set down a coin out of habit.',
    effects: { gold: -3, xp: 15, journal: 'A faceless saint at Caelhorn. The work was patient and exact.' },
  },
  {
    id: 'v1_r4', scope: 'region', regionId: 'r1', weight: 8,
    text: 'A confessional, half-collapsed. You stand near it and the air pressure changes, as if someone had been about to speak. You step back and the moment passes.',
    effects: { hp: -3, xp: 18, journal: 'A confessional at Caelhorn that almost spoke. To me. To anyone.' },
  },
  {
    id: 'v1_r5', scope: 'region', regionId: 'r1', weight: 9,
    text: 'You find a sack of ashes in a temple cellar. Tied with twine, labeled in spidery script: For when she returns. The seal has not been broken.',
    effects: { xp: 16, journal: 'A sack of ashes labeled For when she returns. Caelhorn knows who she is. I do not.' },
  },
  {
    id: 'v1_r6', scope: 'region', regionId: 'r1', weight: 7,
    text: 'A rosary dropped in the dust, beads of blackened bone. You pocket it. The next prayer you nearly say comes out wrong.',
    effects: { mp: -4, xp: 12 },
  },
  {
    id: 'v1_r7', scope: 'region', regionId: 'r1', weight: 9,
    text: 'A bell-tower with no bell. You climb it anyway. From the top you can see another tower, identical, on a hill where no hill should be.',
    effects: { xp: 22, journal: 'From a bell-tower at Caelhorn, I saw a second one. It was not there before. It was not there after.' },
  },
  {
    id: 'v1_r8', scope: 'region', regionId: 'r1', weight: 8,
    text: 'A child plays alone in a courtyard, pushing a wooden boat through dust. She does not look up. When you pass through later, the courtyard is empty and the boat sits in the same trail of dust.',
    effects: { xp: 16, hp: -2 },
  },
  {
    id: 'v1_r9', scope: 'region', regionId: 'r1', weight: 7,
    text: 'A reliquary, looted long ago — but in the dust beneath it, a tooth set in silver. A saint\'s, a sinner\'s. Someone\'s. You take it.',
    effects: { gold: 28, xp: 8 },
  },
  {
    id: 'v1_r10', scope: 'region', regionId: 'r1', weight: 8,
    text: 'A choir-stall stands intact in a roofless chapel. As you cross the floor, your footsteps fall in time with a rhythm that is not your own. You stop. The rhythm stops a beat later.',
    effects: { hp: -4, mp: -3, xp: 20, journal: 'Footsteps not mine in a Caelhorn chapel. They followed my pattern, lagging by a heartbeat.' },
  },
  {
    id: 'v1_r11', scope: 'region', regionId: 'r1', weight: 6,
    text: 'A pilgrim sits at the threshold of an empty cathedral, refusing to enter. He has been there long enough that the moss has begun on his pack. He will not say what he is waiting for.',
    effects: { xp: 18, journal: 'A pilgrim at Caelhorn who would not enter. He had become part of the doorway.' },
  },
  {
    id: 'v1_r12', scope: 'region', regionId: 'r1', weight: 5,
    text: 'A wraith of ash and old incense rises from a cracked sarcophagus. It looks at you a long time before it dissolves into shape, and then into intent.',
    effects: { combat: { enemyIds: ['hollow_knight'], canFlee: true, countDistribution: [0.85, 0.15, 0] } },
  },

  // 6 stat/skill-gated
  {
    id: 'v1_g1', scope: 'gated', regionId: 'r1', weight: 4,
    conditions: [{ attribute: { name: 'Willpower', min: 13 } }],
    text: 'You sit alone in a gutted reliquary and let the silence do its work. By the time you stand, you understand a verse you had only ever read.',
    effects: { mp: 25, xp: 35, journal: 'A verse I understood in Caelhorn that I had only read before: "The faith does not survive the priest. The priest survives the faith."' },
  },
  {
    id: 'v1_g2', scope: 'gated', regionId: 'r1', weight: 4,
    conditions: [{ attribute: { name: 'Perception', min: 12 } }],
    text: 'You see what others miss — a door behind a fall of curtain that has not been a curtain in years. Behind it, a chest. Inside, robes folded by careful hands, and beneath them, gold.',
    effects: { gold: 75, xp: 30, journal: 'A hidden door in Caelhorn behind what I had taken for ruin.' },
  },
  {
    id: 'v1_g3', scope: 'gated', regionId: 'r1', weight: 3,
    conditions: [{ skillUnlocked: 'd2' }],
    text: 'You speak a smiting word in a place that has heard too few of them. Something in the rafters scatters and is not seen again.',
    effects: { xp: 32, trainSkill: { skillId: 'd2', uses: 2 }, journal: 'I cleansed something at Caelhorn. I did not see what it was. The air admitted a relief.' },
  },
  {
    id: 'v1_g4', scope: 'gated', regionId: 'r1', weight: 3,
    conditions: [{ skillUnlocked: 'd1' }],
    text: 'You find the chapel of a saint you do not know and sit in the empty pews. Whatever heard you needed it more than you did. You leave lighter, in body and in coin.',
    effects: { hp: -10, gold: -20, mp: 30, xp: 28, trainSkill: { skillId: 'd1', uses: 2 } },
  },
  {
    id: 'v1_g5', scope: 'gated', regionId: 'r1', weight: 3,
    conditions: [{ skillUnlocked: 's1' }],
    text: 'A locked sacristy, an old brass ward. You take your time. Inside, an ember sigil set in dust, still warm.',
    effects: { itemId: 'i16', xp: 30, trainSkill: { skillId: 's1', uses: 2 } },
  },
  {
    id: 'v1_g6', scope: 'gated', regionId: 'r1', weight: 3,
    conditions: [{ attribute: { name: 'Intellect', min: 13 } }],
    text: 'A hymn-book on a lectern, pages stuck with old wax. You free a marked page. The hymn is for a god whose name you have never heard, and the margin gives instructions for the singing.',
    effects: { mp: 20, xp: 40, journal: 'A god whose name I learned at Caelhorn from a marginal note. I will not write it.' },
  },
];

// =============================================================================
// SYLVARIN WOOD (r2) — danger 3
// "The Moonglade sings only at dusk." Elven, alien, beautiful but wrong-time.
// Time moves differently. The trees have opinions. The Sylvarin are the silent
// older country and resent being asked.
// =============================================================================

export const SYLVARIN_OUTCOMES: WanderOutcome[] = [
  {
    id: 'v2_r1', scope: 'region', regionId: 'r2', weight: 10,
    text: 'A clearing where the light arrives slightly late, as if the sun were hesitating to be sure it was welcome. You stand in it. Nothing changes. Eventually you walk on.',
    effects: { xp: 16, mp: 5 },
  },
  {
    id: 'v2_r2', scope: 'region', regionId: 'r2', weight: 9,
    text: 'You pass beneath a tree whose bark has grown around an arrow, and through it. The arrow is still feathered. The tree looks much older than the arrow could possibly be.',
    effects: { xp: 18, journal: 'A Sylvarin tree grown around an arrow that should have rotted before it was bark.' },
  },
  {
    id: 'v2_r3', scope: 'region', regionId: 'r2', weight: 8,
    text: 'A Sylvarin watches you from a branch above the path. She does not speak. When you greet her in your own language, she answers in your dead grandmother\'s.',
    effects: { xp: 22, hp: -4, journal: 'A Sylvarin who answered me in my grandmother\'s tongue. I had not spoken it in years. She had no reason to know it.' },
  },
  {
    id: 'v2_r4', scope: 'region', regionId: 'r2', weight: 9,
    text: 'You sleep an hour beneath a moonglade in bloom. You wake feeling rested but the light has not changed. When you reach the wood\'s edge, three days have gone elsewhere.',
    effects: { mp: 30, xp: 24, journal: 'I lost three days under a Sylvarin moonglade. I do not know where they went.' },
  },
  {
    id: 'v2_r5', scope: 'region', regionId: 'r2', weight: 9,
    text: 'A song without a singer threads through the leaves. The melody is one your mother sang. It cannot be — but it is.',
    effects: { mp: 12, xp: 18 },
  },
  {
    id: 'v2_r6', scope: 'region', regionId: 'r2', weight: 8,
    text: 'A Sylvarin merchant, if that is the word, offers a vial of pale liquid for a kept memory. You give him one. He takes only as much as he needed.',
    effects: { itemId: 'i13', mp: 15, xp: 6, journal: 'I sold a memory in the Sylvarin Wood. I do not remember which.' },
  },
  {
    id: 'v2_r7', scope: 'region', regionId: 'r2', weight: 8,
    text: 'You find a circle of mushrooms perfectly placed. You step over it. Behind you, you hear a polite cough that has no one attached to it.',
    effects: { hp: -5, xp: 14 },
  },
  {
    id: 'v2_r8', scope: 'region', regionId: 'r2', weight: 7,
    text: 'A fawn with a man\'s eyes follows you for a quarter mile. You do not look back at it more than once.',
    effects: { hp: -3, mp: 8, xp: 16, journal: 'A fawn in Sylvarin had a man\'s eyes. I did not look twice.' },
  },
  {
    id: 'v2_r9', scope: 'region', regionId: 'r2', weight: 6,
    text: 'You drink at a stream and find a coin in your hand you did not put there. Silver, light as a leaf, and warm.',
    effects: { gold: 40, xp: 8, mp: -3 },
  },
  {
    id: 'v2_r10', scope: 'region', regionId: 'r2', weight: 7,
    text: 'A glade hung with strips of cloth, each marked with a name. Most are old. Yours is among the newer ones. You did not write it.',
    effects: { hp: -6, xp: 26, journal: 'My name in the Sylvarin Wood, written on a strip of cloth, in ink not yet dry.' },
  },
  {
    id: 'v2_r11', scope: 'region', regionId: 'r2', weight: 6,
    text: 'A great stag steps onto the path, regards you, and bows once before walking off. You feel briefly, inexplicably, sovereign.',
    effects: { xp: 32, mp: 10, journal: 'A stag in Sylvarin bowed to me. I do not know what it took me for.' },
  },
  {
    id: 'v2_r12', scope: 'region', regionId: 'r2', weight: 7,
    text: 'A Sylvarin warden steps from between two trees. Whatever you have done lately, it appears to have been the wrong thing.',
    effects: { combat: { enemyIds: ['warden'], canFlee: true, countDistribution: [0.7, 0.3, 0] } },
  },

  // 6 stat/skill-gated
  {
    id: 'v2_g1', scope: 'gated', regionId: 'r2', weight: 4,
    conditions: [{ attribute: { name: 'Charisma', min: 13 } }],
    text: 'You ask the right question to a Sylvarin who does not particularly want to answer it. She does anyway. You leave with a phrase you did not know you needed.',
    effects: { xp: 40, mp: 15, journal: 'A Sylvarin phrase I was given: "Iren-ai serah." Spoken aloud, it has done nothing yet.' },
  },
  {
    id: 'v2_g2', scope: 'gated', regionId: 'r2', weight: 4,
    conditions: [{ attribute: { name: 'Perception', min: 13 } }],
    text: 'A pattern in the leaves catches you — old, deliberate. You follow it half a mile before it ends in a hollow stump. Inside, woven thread the color of nothing in particular.',
    effects: { itemId: 'i23', xp: 35, journal: 'Veilthread in the Sylvarin Wood. The pattern that led me to it had been left for someone.' },
  },
  {
    id: 'v2_g3', scope: 'gated', regionId: 'r2', weight: 3,
    conditions: [{ skillUnlocked: 'v1' }],
    text: 'You read the wood\'s own record of itself in disturbed moss, broken twig-ends, scuffed bark. Someone passed here recently who should not exist any longer. You make note.',
    effects: { xp: 38, trainSkill: { skillId: 'v1', uses: 3 }, journal: 'Someone moves through Sylvarin who is not supposed to. I have their stride and the hour.' },
  },
  {
    id: 'v2_g4', scope: 'gated', regionId: 'r2', weight: 3,
    conditions: [{ skillUnlocked: 'v2' }],
    text: 'You find the moonsilver vein the Sylvarin do not advertise. You take only what you can carry. They will know you took it but not, perhaps, that you knew not to take more.',
    effects: { itemId: 'i22', xp: 32, trainSkill: { skillId: 'v2', uses: 3 } },
  },
  {
    id: 'v2_g5', scope: 'gated', regionId: 'r2', weight: 3,
    conditions: [{ skillUnlocked: 'a1' }],
    text: 'You light a candle of arcane fire in a Sylvarin shrine and the wood permits it. The flame lasts longer than any candle should, and shows you the inside of the shrine you would not have otherwise seen.',
    effects: { xp: 36, mp: 20, trainSkill: { skillId: 'a1', uses: 2 } },
  },
  {
    id: 'v2_g6', scope: 'gated', regionId: 'r2', weight: 2,
    conditions: [{ attribute: { name: 'Willpower', min: 14 } }],
    text: 'A Sylvarin elder asks you a question that is also a test. You give the slowest answer you can think of. He says nothing for a long time, then nods. He is gone before you have finished thanking him.',
    effects: { mp: 35, xp: 50, journal: 'A Sylvarin elder accepted my answer. I do not know what the question was for.' },
  },
];

// =============================================================================
// KHAR-DUUN DEEPS (r3) — danger 4
// "Eight deeps. Only seven are mapped." Dwarven, claustrophobic, weight of
// stone. Echoes of older kings. The eighth deep is hinted at, never described.
// =============================================================================

export const KHARDUUN_OUTCOMES: WanderOutcome[] = [
  {
    id: 'v3_r1', scope: 'region', regionId: 'r3', weight: 9,
    text: 'A hall of pillars, each carved with a name in dwarven script. Most are scoured smooth. The first three you can read are kings of the same line, generations apart.',
    effects: { xp: 22, journal: 'In Khar-Duun: a hall of named pillars. The kings on them shared a line. Most names had been worn off, gently.' },
  },
  {
    id: 'v3_r2', scope: 'region', regionId: 'r3', weight: 8,
    text: 'A vein of ore in the wall, just visible where a torch would catch it. You chip at it. The metal is honest. The vein is not as deep as you would have hoped.',
    effects: { itemId: 'i21', xp: 14 },
  },
  {
    id: 'v3_r3', scope: 'region', regionId: 'r3', weight: 7,
    text: 'A passage opens onto a chasm that has no bottom you can see by the torch you carry. A bridge crosses it, made of stone, carved as a single span. You cross. It does not echo.',
    effects: { hp: -5, xp: 25, journal: 'A bridge in Khar-Duun that did not echo. The chasm beneath swallowed sound the way the dark swallows light.' },
  },
  {
    id: 'v3_r4', scope: 'region', regionId: 'r3', weight: 8,
    text: 'A side-passage marked with a cairn — three stones, deliberate. The dwarven word for "do not." You honor it.',
    effects: { xp: 18, journal: 'A cairn in Khar-Duun. Three stones. The word was do-not. I did not.' },
  },
  {
    id: 'v3_r5', scope: 'region', regionId: 'r3', weight: 7,
    text: 'A forge, abandoned, embers cold for centuries. The hammer rests on the anvil where someone set it down. Nothing has shifted since.',
    effects: { hp: -3, xp: 20, journal: 'A Khar-Duun forge with the hammer set down at the end of a workday that has lasted three hundred years.' },
  },
  {
    id: 'v3_r6', scope: 'region', regionId: 'r3', weight: 8,
    text: 'You hear hammer-strikes from somewhere deeper in. Steady, three-and-pause, three-and-pause. You walk toward the sound an hour and the sound walks the same hour ahead.',
    effects: { hp: -7, mp: -3, xp: 22, journal: 'Hammer-strikes in Khar-Duun keeping the rhythm of work. They stayed an hour ahead of me however long I walked.' },
  },
  {
    id: 'v3_r7', scope: 'region', regionId: 'r3', weight: 7,
    text: 'A statue of a dwarf-king, face fierce, hands extended palms-up, holding nothing. The plinth bears a single rune: WAIT. You leave him to it.',
    effects: { xp: 16, journal: 'A king of Khar-Duun, hands held to receive. The rune on the plinth said WAIT.' },
  },
  {
    id: 'v3_r8', scope: 'region', regionId: 'r3', weight: 9,
    text: 'A guardroom long since stripped, but a helm remains on a peg, polished by no one. You take it. It fits as if it had been waiting.',
    effects: { itemId: 'i9', xp: 24 },
  },
  {
    id: 'v3_r9', scope: 'region', regionId: 'r3', weight: 6,
    text: 'You find a jar of ale in a tavern carved straight from the rock. Sealed with wax. The wax bears a thumbprint, large and dwarven. You leave it sealed.',
    effects: { xp: 14, journal: 'An unbroken seal on a jar in a Khar-Duun tavern. Whose thirst was it left for?' },
  },
  {
    id: 'v3_r10', scope: 'region', regionId: 'r3', weight: 6,
    text: 'A door at the end of a passage, banded in iron, set with locks of types you have never seen. There is no handle. Whatever is on the other side, it is not for going to.',
    effects: { hp: -4, xp: 28, journal: 'A doorless door in Khar-Duun. Made to be opened from one side only. The other side.' },
  },
  {
    id: 'v3_r11', scope: 'region', regionId: 'r3', weight: 5,
    text: 'A drift of bones in a side-chamber, dwarven and otherwise, well-mingled. Your light catches a brooch. You take it. The bones do not seem to mind.',
    effects: { gold: 65, xp: 22 },
  },
  {
    id: 'v3_r12', scope: 'region', regionId: 'r3', weight: 11,
    text: 'A stone-shape in the dark resolves itself into more than stone. It rises slowly, the way old things do.',
    effects: { combat: { enemyIds: ['golem'], canFlee: true, countDistribution: [0.6, 0.3, 0.1] } },
  },

  // 6 stat/skill-gated
  {
    id: 'v3_g1', scope: 'gated', regionId: 'r3', weight: 4,
    conditions: [{ attribute: { name: 'Strength', min: 14 } }],
    text: 'A toppled column blocks a passage no one has come through in a hundred years. You set your back to it. Behind: a vault, opened by no other thief, holding the kind of gold that was never meant to be spent.',
    effects: { gold: 120, xp: 50, journal: 'A vault in Khar-Duun behind a column moved only by stubbornness. The gold inside had never been meant to leave.' },
  },
  {
    id: 'v3_g2', scope: 'gated', regionId: 'r3', weight: 4,
    conditions: [{ attribute: { name: 'Constitution', min: 13 } }],
    text: 'You take the deeper passage where the air goes wrong. Most would turn back. You walk through it. On the other side: a hammer set in a stone hand, and the hand lets it go when you ask.',
    effects: { itemId: 'i3', hp: -15, xp: 60, journal: 'The Stoneoath Hammer was given to me by Khar-Duun on a request. The hand that held it let go. I do not know what I asked.' },
  },
  {
    id: 'v3_g3', scope: 'gated', regionId: 'r3', weight: 3,
    conditions: [{ skillUnlocked: 'r1' }],
    text: 'An old forge speaks to you in the way old work always speaks to a smith. You bank a fire there. The work that comes off it is yours, but the form was not your idea.',
    effects: { itemId: 'i21', xp: 40, mp: -5, trainSkill: { skillId: 'r1', uses: 4 } },
  },
  {
    id: 'v3_g4', scope: 'gated', regionId: 'r3', weight: 3,
    conditions: [{ skillUnlocked: 's2' }],
    text: 'A lock of dwarven make, more puzzle than mechanism. You sit with it an hour. It opens, eventually, by being understood. Behind it: the kind of trinket that was buried because it was wanted too much.',
    effects: { itemId: 'i25', xp: 50, trainSkill: { skillId: 's2', uses: 4 } },
  },
  {
    id: 'v3_g5', scope: 'gated', regionId: 'r3', weight: 3,
    conditions: [{ attribute: { name: 'Willpower', min: 13 } }],
    text: 'You stand a long time at the lip of a passage that goes down further than seven, and you do not go down. There is a kind of going that is also a kind of leaving. You leave.',
    effects: { mp: 25, xp: 55, journal: 'I stood at the eighth deep. I did not descend. The decision was the lesson.' },
  },
  {
    id: 'v3_g6', scope: 'gated', regionId: 'r3', weight: 2,
    conditions: [{ skillUnlocked: 'v3' }],
    text: 'A creature drinks at a black underground pool — not hostile yet, not aware of you. You read its weaknesses from its breathing alone. Whatever you do with the knowledge is up to you. You leave it drinking.',
    effects: { xp: 45, trainSkill: { skillId: 'v3', uses: 3 }, journal: 'I learned a deep-creature\'s weak places by its breath. I left it to its water.' },
  },
];

// =============================================================================
// GROKHAI STEPPE (r4) — danger 3
// "The sky-poison drifts low here." Orcish, vast, an open sky that hurts.
// Clan-warbands, weathered shrines, things that should not be falling from
// the sky.
// =============================================================================

export const GROKHAI_OUTCOMES: WanderOutcome[] = [
  {
    id: 'v4_r1', scope: 'region', regionId: 'r4', weight: 10,
    text: 'A sea of grass in every direction, the wind carrying the smell of woodsmoke from a fire you cannot find. You walk into it. The smell stays at the same distance the whole afternoon.',
    effects: { hp: -3, xp: 16 },
  },
  {
    id: 'v4_r2', scope: 'region', regionId: 'r4', weight: 9,
    text: 'A clan-shrine of three stacked stones, painted with old blood. The paint is fresh. You leave nothing — that is the right offering when you do not belong.',
    effects: { xp: 18, journal: 'A Grokhai shrine. The blood was not old. The right offering was none.' },
  },
  {
    id: 'v4_r3', scope: 'region', regionId: 'r4', weight: 8,
    text: 'You find a length of fallen sky — a strip of metal too smooth for any forge, half-buried where it landed. You leave it. Whoever buries them has not gotten to this one.',
    effects: { xp: 22, hp: -4, journal: 'Sky-fallen metal on the Steppe. Smooth as no work I have seen. The Grokhai bury them. This one was not yet buried.' },
  },
  {
    id: 'v4_r4', scope: 'region', regionId: 'r4', weight: 9,
    text: 'A Grokhai rider crests a rise, surveys you a long moment, and rides off without challenge. You are not worth the trouble. There is a kind of mercy in that.',
    effects: { xp: 14 },
  },
  {
    id: 'v4_r5', scope: 'region', regionId: 'r4', weight: 7,
    text: 'A sky-poison cloud drifts past, low and slow, the color of old verdigris. You hold your breath. It passes. Your eyes water for an hour after.',
    effects: { hp: -10, xp: 24, journal: 'I breathed sky-poison on the Steppe and was lucky. My eyes ran for an hour. Some have run forever.' },
  },
  {
    id: 'v4_r6', scope: 'region', regionId: 'r4', weight: 8,
    text: 'A circle of horse-skulls staked into the ground, all facing inward. You do not enter the circle. Nothing in it stirs. Nothing has, perhaps, in a very long time.',
    effects: { hp: -3, xp: 20, journal: 'A skull-circle on the Steppe. The skulls watched the center. The center watched back, I think.' },
  },
  {
    id: 'v4_r7', scope: 'region', regionId: 'r4', weight: 8,
    text: 'A young Grokhai, separated from his band, asks the road north in passable common. You point. He thanks you with a coin no Grokhai should carry. You ask. He shrugs.',
    effects: { gold: 18, xp: 12, journal: 'A Grokhai with foreign coin he could not explain. He went north. I did not follow.' },
  },
  {
    id: 'v4_r8', scope: 'region', regionId: 'r4', weight: 7,
    text: 'A skald sings to no one over a barrow long after the burial. The song is for the wind, mostly. You stand a respectful distance and learn a verse.',
    effects: { xp: 22, mp: 10, journal: 'A Grokhai burial-song. Most of it was for the wind. The wind was the audience.' },
  },
  {
    id: 'v4_r9', scope: 'region', regionId: 'r4', weight: 6,
    text: 'A storm climbs the horizon, blue-black and slow. It does not move closer for an hour. Then it is on top of you, then past, in the time of three breaths. You are dry. The grass around you is not.',
    effects: { mp: 20, hp: -4, xp: 26 },
  },
  {
    id: 'v4_r10', scope: 'region', regionId: 'r4', weight: 7,
    text: 'A scavenger-bird drops something at your feet — a bead of glass, melted by a heat no fire on the Steppe knows. You pocket it. The bird waits, perhaps for a tribute. You give it nothing. It leaves disappointed.',
    effects: { xp: 18, journal: 'A glass bead on the Steppe melted by heat that does not belong here.' },
  },
  {
    id: 'v4_r11', scope: 'region', regionId: 'r4', weight: 6,
    text: 'You find a totem mantle in a cairn, wrapped well against the weather. The clan that buried it is no longer on this part of the Steppe. You take it. They left it to be found.',
    effects: { itemId: 'i8', xp: 32, journal: 'A Grokhai totem-mantle in a cairn. The clan had moved on. The mantle had not.' },
  },
  {
    id: 'v4_r12', scope: 'region', regionId: 'r4', weight: 11,
    text: 'Stormblooded raiders crest a rise on a fast-moving line. They have already chosen their angle. There is no negotiation in their riding.',
    effects: { combat: { enemyIds: ['stormblood'], canFlee: true, countDistribution: [0.4, 0.4, 0.2] } },
  },

  // 6 stat/skill-gated
  {
    id: 'v4_g1', scope: 'gated', regionId: 'r4', weight: 4,
    conditions: [{ attribute: { name: 'Constitution', min: 13 } }],
    text: 'You walk through a low band of sky-poison rather than around — saving a day, costing what it costs. On the far side, you find a cairn left for those who choose the line: a flask of stoneblood, sealed.',
    effects: { itemId: 'i15', hp: -18, xp: 50, journal: 'I crossed sky-poison on the Steppe. There was a cairn for those who do.' },
  },
  {
    id: 'v4_g2', scope: 'gated', regionId: 'r4', weight: 4,
    conditions: [{ attribute: { name: 'Strength', min: 13 } }],
    text: 'A Grokhai veteran offers a wrestle. The grass around the contest is flattened in a perfect circle. You give him a good account. He gives you a tooth from his belt — a token, valuable to certain ears.',
    effects: { gold: 50, xp: 40, hp: -12, trainSkill: { skillId: 'c1', uses: 2 }, journal: 'A Grokhai tooth-token. Worn at the belt, it is heard among certain bands.' },
  },
  {
    id: 'v4_g3', scope: 'gated', regionId: 'r4', weight: 3,
    conditions: [{ skillUnlocked: 'v1' }],
    text: 'You read a warband\'s passage in the grass — direction, count, carrying-weight, hours since. The information is not for you, but you will know what to do with it later.',
    effects: { xp: 38, trainSkill: { skillId: 'v1', uses: 3 }, journal: 'A Grokhai warband\'s tracks: thirty riders, west by north, four hours ahead. Carrying captives.' },
  },
  {
    id: 'v4_g4', scope: 'gated', regionId: 'r4', weight: 3,
    conditions: [{ attribute: { name: 'Charisma', min: 13 } }],
    text: 'You hail a passing rider in the right cadence and the right humility. He shares fire and millet bread with you for an hour. He tells you the name of the storm coming next month. He sends you off with a parcel for the road.',
    effects: { xp: 38, gold: 15, itemId: 'i26', journal: 'The Grokhai have a name for the storm coming next month. I will not write it. Naming it brings it nearer.' },
  },
  {
    id: 'v4_g5', scope: 'gated', regionId: 'r4', weight: 3,
    conditions: [{ skillUnlocked: 'a2' }],
    text: 'A sky-poison cloud is sliding toward an unguarded shrine. You set a frost-ward on the air itself. The cloud divides around it. The clan will never know. The shrine remains.',
    effects: { mp: -20, xp: 45, trainSkill: { skillId: 'a2', uses: 3 }, journal: 'I warded a Grokhai shrine from sky-poison. They will not know. That is part of the gift.' },
  },
  {
    id: 'v4_g6', scope: 'gated', regionId: 'r4', weight: 2,
    conditions: [{ skillUnlocked: 'v3' }],
    text: 'You spend a quiet hour observing a storm-touched aurochs from downwind. You note where it bleeds when struck wrong, and where its eye does not quite see. Knowledge for some other day.',
    effects: { xp: 42, trainSkill: { skillId: 'v3', uses: 3 }, journal: 'A storm-touched aurochs has a blind quarter on its left. Bleeds at the joint of jaw and throat. I have not used this yet.' },
  },
];

// =============================================================================
// SALTREACH COAST (r5) — danger 2
// "Glass-eyed crews and the Iron Lily's ghost." Maritime, drowned, salt-eaten.
// Wrecks. Sailors who came back wrong. The Iron Lily haunts as both legend and
// presence — the ship and the woman who captained her have blurred together.
// =============================================================================

export const SALTREACH_OUTCOMES: WanderOutcome[] = [
  {
    id: 'v5_r1', scope: 'region', regionId: 'r5', weight: 10,
    text: 'A wreck breaches at low tide, half a hull standing where the keel went. The barnacles on it are old. The rope still tied to the rail is new.',
    effects: { xp: 16, journal: 'A wreck on Saltreach. Old timbers, fresh rope. Someone is still using her.' },
  },
  {
    id: 'v5_r2', scope: 'region', regionId: 'r5', weight: 9,
    text: 'A glass-eyed crewman sits mending a net on the dunes. He greets you in a sailor\'s common but his hands tie knots no living rigger uses. You leave him to it.',
    effects: { xp: 14, hp: -2, journal: 'A glass-eyed mender on Saltreach. He used a knot the manuals stopped teaching at the war.' },
  },
  {
    id: 'v5_r3', scope: 'region', regionId: 'r5', weight: 9,
    text: 'You walk the tideline and find a sea-chest, half-eaten by salt, lock seized but the hinges gone soft. You force it. Inside: nothing but a single dry feather and a coin.',
    effects: { gold: 18, xp: 12, journal: 'A chest on Saltreach contained a feather and a coin. The feather was dry. It should not have been.' },
  },
  {
    id: 'v5_r4', scope: 'region', regionId: 'r5', weight: 8,
    text: 'A bell rings somewhere offshore — slow, deliberate. The fog answers. Three rings, a pause. Three rings again. You count to twenty and stop.',
    effects: { hp: -3, mp: -2, xp: 20, journal: 'A bell off Saltreach in fog. Three and three. Old code for a captain calling her crew.' },
  },
  {
    id: 'v5_r5', scope: 'region', regionId: 'r5', weight: 8,
    text: 'You find a strip of sailcloth on the rocks, painted with a black flower. The Iron Lily\'s mark, but rougher than any she gave. A copy. Or a remembering.',
    effects: { xp: 22, journal: 'The Iron Lily\'s mark on Saltreach, hand-painted. A crew that wanted to be hers, or thought it was.' },
  },
  {
    id: 'v5_r6', scope: 'region', regionId: 'r5', weight: 9,
    text: 'A widow walks the cliff path daily, the locals say. You pass her at sunset. She nods once, not at you, but past you, at someone walking your stride.',
    effects: { hp: -3, xp: 18, journal: 'A Saltreach widow nodded past me. There was someone walking with me she could see.' },
  },
  {
    id: 'v5_r7', scope: 'region', regionId: 'r5', weight: 7,
    text: 'A drowned man washes up gentle as wreckage, eyes already glassed over. In his fist: a ring of brass keys, none for any door this side of the water.',
    effects: { gold: 22, xp: 16, journal: 'A drowned man on Saltreach holding keys. Not for doors here. Could only be doors there.' },
  },
  {
    id: 'v5_r8', scope: 'region', regionId: 'r5', weight: 8,
    text: 'You take shelter in a sea-cave during a squall. The walls are scratched with names — captains, crew, lovers. The most recent are dated this year. You add nothing.',
    effects: { mp: 8, xp: 18, journal: 'A Saltreach sea-cave of scratched names. The recent ones were dated. The dates were after the war ended.' },
  },
  {
    id: 'v5_r9', scope: 'region', regionId: 'r5', weight: 7,
    text: 'A fisherman pulls a saltforged blade from his catch — wedged in a fish that should not have been carrying one. He hands it to you without a word, as if relieved.',
    effects: { itemId: 'i4', xp: 28, journal: 'A Saltreach fisherman gave me a blade pulled from a fish. He was glad to be rid of it.' },
  },
  {
    id: 'v5_r10', scope: 'region', regionId: 'r5', weight: 6,
    text: 'You eat at a tavern on the harbor. The fish is good. The cook will not say where it was caught. Three other patrons will not eat it.',
    effects: { hp: 8, xp: 10, gold: -8, journal: 'I ate the fish at a Saltreach tavern. Three locals would not. I cannot say if I should have.' },
  },
  {
    id: 'v5_r11', scope: 'region', regionId: 'r5', weight: 6,
    text: 'A child sits at the end of a pier counting the boats coming in. There are no boats. She tells you cheerfully which one is her father\'s. You agree, gently, that it has fine sails.',
    effects: { xp: 22, hp: -4, journal: 'A child on a Saltreach pier counting boats not there. She named her father\'s. I agreed.' },
  },
  {
    id: 'v5_r12', scope: 'region', regionId: 'r5', weight: 5,
    text: 'A boarding party rises from the surf — drowned, courteous in the way drowned men are. They want passage past you, not battle, but they will fight to take it.',
    effects: { combat: { enemyIds: ['hollow_knight'], canFlee: true, countDistribution: [0.55, 0.35, 0.1] } },
  },

  // 6 stat/skill-gated
  {
    id: 'v5_g1', scope: 'gated', regionId: 'r5', weight: 4,
    conditions: [{ attribute: { name: 'Charisma', min: 13 } }],
    text: 'You buy a round at a harbor tavern and listen well. By the third round, an old hand tells you where the Lily anchors when she feels watched. You commit it to memory.',
    effects: { gold: -25, xp: 45, journal: 'The Iron Lily\'s anchorage when watched: north of the Reach by a half-day, behind the small island shaped like a fist.' },
  },
  {
    id: 'v5_g2', scope: 'gated', regionId: 'r5', weight: 4,
    conditions: [{ attribute: { name: 'Perception', min: 13 } }],
    text: 'You read the rocks at low tide as a captain would — channels, shoals, the safe passage no chart marks. You memorize it. Some night you may need it. Some night someone will pay for it.',
    effects: { xp: 50, journal: 'The Saltreach safe passage at low tide. I have it now. Charts do not. Lord-harbormasters do not.' },
  },
  {
    id: 'v5_g3', scope: 'gated', regionId: 'r5', weight: 3,
    conditions: [{ skillUnlocked: 'v2' }],
    text: 'You harvest sea-poppy from the cliff base — the variety that only blooms after a ship goes down. The locals have stopped picking them. You know enough to gather them gently.',
    effects: { itemId: 'i12', xp: 38, trainSkill: { skillId: 'v2', uses: 3 }, journal: 'Sea-poppy after a wreck. The locals do not pick them now. They used to. Something changed.' },
  },
  {
    id: 'v5_g4', scope: 'gated', regionId: 'r5', weight: 3,
    conditions: [{ skillUnlocked: 's1' }],
    text: 'You shadow a smuggler\'s crew up the cliff steps. They never see you. You see their cargo. You will know when to mention it and when not to.',
    effects: { xp: 42, gold: 35, trainSkill: { skillId: 's1', uses: 3 }, journal: 'A Saltreach smuggling cargo: arms, in oilcloth, marked with a sigil from the Plains. Worth holding.' },
  },
  {
    id: 'v5_g5', scope: 'gated', regionId: 'r5', weight: 3,
    conditions: [{ attribute: { name: 'Willpower', min: 13 } }],
    text: 'A glass-eyed sailor sits down across from you and begins a conversation as if you owe him answers. You answer none. You let the silence be his. Eventually he leaves. You find a coin where he sat. Old salt-tarnished gold.',
    effects: { gold: 65, xp: 40, journal: 'A glass-eyed sailor tested me with questions on Saltreach. I gave him only quiet. He left a coin. He did not need it where he was going.' },
  },
  {
    id: 'v5_g6', scope: 'gated', regionId: 'r5', weight: 2,
    conditions: [{ skillUnlocked: 'd2' }],
    text: 'You stand at the cliff above where the Lily went down and speak words of consecration. The water below settles, briefly, like a held breath. Whether the Lily heard, or only the drowned crew, you cannot say.',
    effects: { mp: -15, xp: 55, trainSkill: { skillId: 'd2', uses: 3 }, journal: 'I gave a consecration to the Iron Lily\'s wreck. The water settled. Saltreach was, for a moment, still.' },
  },
];

// =============================================================================
// FROSTMERE (r8) — danger 4
// "Wolves walk on two legs in winter." Northern, cold-folkloric. Werewolves
// implied but never said outright. Long nights. Things that look almost human.
// The cold is a character — it has opinions and patience.
// =============================================================================

export const FROSTMERE_OUTCOMES: WanderOutcome[] = [
  {
    id: 'v8_r1', scope: 'region', regionId: 'r8', weight: 10,
    text: 'Snow falling slowly enough that you can choose which flakes to walk between. The cold has the texture of old silk against the back of your neck.',
    effects: { hp: -4, xp: 18 },
  },
  {
    id: 'v8_r2', scope: 'region', regionId: 'r8', weight: 9,
    text: 'You find a track in fresh snow — barefoot, large, the toes spread wide as a beast\'s. It walks upright for fifty paces, then drops to four. Then upright again.',
    effects: { hp: -3, xp: 24, journal: 'A Frostmere track. Two legs to four to two. The shifting was unhurried. It had been doing this a long time.' },
  },
  {
    id: 'v8_r3', scope: 'region', regionId: 'r8', weight: 8,
    text: 'A trapper\'s cabin, smoke at the chimney. You knock. A woman answers. Her smile is careful — too careful. She offers tea. You accept the tea and decline the night. She thanks you for the decision.',
    effects: { hp: 6, xp: 22, journal: 'A Frostmere cabin. The woman thanked me for not staying. I do not know yet who I would have woken up as.' },
  },
  {
    id: 'v8_r4', scope: 'region', regionId: 'r8', weight: 9,
    text: 'A child stands in the road, no coat, no fear. You wrap her in your cloak. She thanks you politely and walks back into the trees. The cloak is on the road behind you when you turn around.',
    effects: { hp: -6, xp: 28, journal: 'A Frostmere child. No cold for her. My cloak came back. Folded.' },
  },
  {
    id: 'v8_r5', scope: 'region', regionId: 'r8', weight: 8,
    text: 'You find the remains of a horse, killed clean — throat-first, no struggle. The tracks leaving the kill are human. The tracks arriving were not.',
    effects: { hp: -4, mp: -3, xp: 22, journal: 'A Frostmere kill. The killer arrived as wolf. Left as man. Walked east, slow, satisfied.' },
  },
  {
    id: 'v8_r6', scope: 'region', regionId: 'r8', weight: 7,
    text: 'A mead-hall sits empty in a village whose chimneys still smoke. The benches are pushed back. A song was being sung. The singer is somewhere in the trees now, you think.',
    effects: { hp: -2, xp: 20, journal: 'A Frostmere mead-hall mid-song. The benches were the way they leave them when something interesting happens outside.' },
  },
  {
    id: 'v8_r7', scope: 'region', regionId: 'r8', weight: 8,
    text: 'A skald greets you at a crossroads in the white. He sings four verses — old ones, of the long winter, of the kings who learned to run on four legs. You give him a coin. He gives you his silence the rest of the way.',
    effects: { gold: -8, xp: 26, mp: 10, journal: 'A Frostmere skald sang me four verses. The third verse named kings. I will not write their names.' },
  },
  {
    id: 'v8_r8', scope: 'region', regionId: 'r8', weight: 6,
    text: 'You shelter in an abandoned hunter\'s blind. Inside, dried meat, water, kindling — all fresh. A note: For who needs it. Take only what you will use. You take exactly that.',
    effects: { hp: 12, xp: 18, itemId: 'i26', journal: 'A Frostmere blind stocked for strangers. The note set the rule. The cold here keeps people honest about it.' },
  },
  {
    id: 'v8_r9', scope: 'region', regionId: 'r8', weight: 7,
    text: 'A hunting horn winds through the trees, distant and patient. Not coming for you. Coming for someone. You choose another path. You do not look back to see if they are also choosing one.',
    effects: { hp: -5, mp: -3, xp: 24 },
  },
  {
    id: 'v8_r10', scope: 'region', regionId: 'r8', weight: 6,
    text: 'A frozen pond, the ice clear as glass. Beneath it, a man stands upright on the bottom, arms at his sides. He is not drowned. He is waiting. You walk on, on the bank, and do not run.',
    effects: { hp: -8, mp: -5, xp: 32, journal: 'A man standing under Frostmere ice. He was waiting. He did not see me. I think he was waiting for spring.' },
  },
  {
    id: 'v8_r11', scope: 'region', regionId: 'r8', weight: 5,
    text: 'You find a child\'s wolfsbane charm in the snow, well-whittled. You pocket it. The weight of it in your pocket is more than wood should manage.',
    effects: { itemId: 'i24', xp: 28, journal: 'A wolfsbane charm in Frostmere snow. The whittling was a child\'s. The protection is not.' },
  },
  {
    id: 'v8_r12', scope: 'region', regionId: 'r8', weight: 12,
    text: 'They come from the trees together, two or three or four, depending on what the snow chooses to let you see. They are not in any hurry.',
    effects: { combat: { enemyIds: ['wolf'], canFlee: true, countDistribution: [0.25, 0.45, 0.3] } },
  },

  // 6 stat/skill-gated
  {
    id: 'v8_g1', scope: 'gated', regionId: 'r8', weight: 4,
    conditions: [{ attribute: { name: 'Constitution', min: 14 } }],
    text: 'You walk a high pass in deep cold most would have turned back from. On the far side: a frozen warden\'s cache, untouched in a long time, holding a frost-warded mantle older than the trade road.',
    effects: { itemId: 'i8', hp: -25, xp: 60, journal: 'A frozen cache on a Frostmere pass. The mantle inside had been waiting. The cold had kept it.' },
  },
  {
    id: 'v8_g2', scope: 'gated', regionId: 'r8', weight: 4,
    conditions: [{ attribute: { name: 'Willpower', min: 13 } }],
    text: 'A two-legged wolf walks the road beside you, three paces back, hour upon hour. You do not turn. You do not run. You do not feed it any of the small fears it is testing for. By dusk it is gone. You are colder than you were and richer for it.',
    effects: { hp: -10, mp: -8, xp: 65, journal: 'A two-legged wolf walked Frostmere with me an afternoon. It was looking for fear. It found none. It will remember.' },
  },
  {
    id: 'v8_g3', scope: 'gated', regionId: 'r8', weight: 3,
    conditions: [{ skillUnlocked: 'v1' }],
    text: 'You read a wolf-pack\'s passage and find what they were tracking — not prey, but a small group of travelers, three days ahead. The pack abandoned the trail. You make note of why.',
    effects: { xp: 50, trainSkill: { skillId: 'v1', uses: 4 }, journal: 'A Frostmere pack abandoned a trail of travelers. The travelers wore no scent. They were not the right kind of prey.' },
  },
  {
    id: 'v8_g4', scope: 'gated', regionId: 'r8', weight: 3,
    conditions: [{ skillUnlocked: 'v3' }],
    text: 'You spend an hour observing a lone wolf at distance — too lone, too poised. You read what it is between cycles. Its weak hour, its strong one. You will not need this knowledge soon, perhaps. But you will need it.',
    effects: { xp: 55, trainSkill: { skillId: 'v3', uses: 3 }, journal: 'A Frostmere shifter\'s cycle: weakest at first frost-light, strongest at the second hour after moonrise.' },
  },
  {
    id: 'v8_g5', scope: 'gated', regionId: 'r8', weight: 3,
    conditions: [{ skillUnlocked: 'a2' }],
    text: 'You find a child lost in the white, half-frozen. You set a frost-ward on her bones — backwards, holding the cold *out* — and carry her to the nearest smoke. The mother does not ask how you knew the trick. She knew you must.',
    effects: { mp: -25, hp: -10, xp: 70, trainSkill: { skillId: 'a2', uses: 3 }, journal: 'I saved a child in Frostmere by inverting a frost-ward. The mother understood without me explaining. She wept and was quick about it.' },
  },
  {
    id: 'v8_g6', scope: 'gated', regionId: 'r8', weight: 2,
    conditions: [{ attribute: { name: 'Charisma', min: 14 } }],
    text: 'You sit a long evening at a Frostmere hearth and earn the right to a story not told to outsiders. The teller does not look at you while she tells it. You do not ask questions. By the end, you understand what the long winter was for.',
    effects: { xp: 80, mp: 20, journal: 'I learned what the long winter was for in Frostmere. I will not write it. The teller did not look at me. She had to. She had her reasons.' },
  },
];

// =============================================================================
// SUNDERED TOWER (r7) — danger 5
// "The Voice still calls from inside." Broken arcane site. Reality-thin.
// The Voice is a presence, not a person. Hostile to the casual wanderer —
// but tests whether you are worth letting through to the Veil beyond.
// =============================================================================

export const SUNDERED_OUTCOMES: WanderOutcome[] = [
  {
    id: 'v7_r1', scope: 'region', regionId: 'r7', weight: 9,
    text: 'The Tower\'s wreckage walks differently than other ruins. Stones lean by an inch the wrong way. You take a step and find you have taken three. The Voice has not yet spoken. It is waiting to see if you are interesting.',
    effects: { hp: -5, mp: -3, xp: 24, journal: 'The Sundered Tower. Geometry off by inches. The Voice was patient. I do not know yet if that is good.' },
  },
  {
    id: 'v7_r2', scope: 'region', regionId: 'r7', weight: 8,
    text: 'A door stands in the rubble that has no wall around it. You walk past it. You consider walking through it. You consider what *through* would mean. You walk past it again.',
    effects: { hp: -4, mp: -5, xp: 28, journal: 'A doorway at the Tower with nothing on either side. The choice not to enter felt like passing a test.' },
  },
  {
    id: 'v7_r3', scope: 'region', regionId: 'r7', weight: 8,
    text: 'You find a notebook in a recess, the writing yours. Not yours-now — yours-someday. You read three pages. You stop on the fourth. You leave it for a future self to finish or to never reach.',
    effects: { mp: -8, xp: 32, journal: 'A notebook in the Tower in my own future hand. I read three pages. I stopped before the fourth. I do not yet know what I knew.' },
  },
  {
    id: 'v7_r4', scope: 'region', regionId: 'r7', weight: 7,
    text: 'The Voice speaks. Once. A name. Not yours, but someone the Voice expects you to know. You do not. Yet.',
    effects: { mp: -10, xp: 30, journal: 'The Voice gave me a name today: Kaelen of the Eighth. The Voice expects me to know it. I do not.' },
  },
  {
    id: 'v7_r5', scope: 'region', regionId: 'r7', weight: 8,
    text: 'A flight of stairs leads up where there is nothing to go up to. You climb three steps. From there you can see the tower as it was — a moment, only — before the steps remember they have nowhere to go.',
    effects: { hp: -6, mp: -5, xp: 35, journal: 'I climbed three Tower steps and saw it whole. It had been beautiful. It had been mistaken about what beautiful was for.' },
  },
  {
    id: 'v7_r6', scope: 'region', regionId: 'r7', weight: 7,
    text: 'You find a sigil chalked on a piece of standing wall. You recognize none of it, except in the way you recognize a song someone is singing in the next room. You write it down. The page is blank when you check it later.',
    effects: { mp: -6, xp: 28, journal: 'A Tower sigil I tried to copy. The page came back blank. The sigil came back to me in a dream three days later, and stayed.' },
  },
  {
    id: 'v7_r7', scope: 'region', regionId: 'r7', weight: 6,
    text: 'A circle of stones, small, deliberate. You step into it. Inside the circle, the Tower is intact. You step out. It is not. You step back in. It is. The third time, you step out and stay out.',
    effects: { mp: -10, xp: 36, journal: 'A circle at the Tower. Inside it, the Tower stood. Outside, it did not. I left it standing in the small space allowed.' },
  },
  {
    id: 'v7_r8', scope: 'region', regionId: 'r7', weight: 7,
    text: 'A robe lies on a bench, folded as if its wearer had just stepped out. The fabric pulses faintly when the light is right. It does not feel offered. You leave it.',
    effects: { hp: -3, mp: -5, xp: 22, journal: 'A Tower robe folded on a bench. It pulsed in light. It was not for me. Maybe it was not for anyone yet.' },
  },
  {
    id: 'v7_r9', scope: 'region', regionId: 'r7', weight: 6,
    text: 'You hear yourself laughing in another corridor. The laugh is older than yours, tired. You do not go look for it. You think you will laugh that way someday and you do not need to know when.',
    effects: { hp: -4, mp: -6, xp: 32, journal: 'I heard my future laugh at the Tower. It was not a happy sound. I did not look for it.' },
  },
  {
    id: 'v7_r10', scope: 'region', regionId: 'r7', weight: 5,
    text: 'A fragment of moonsilver ore lies clean of dust on a workbench. The bench has been waiting for it for a while. You take it. The bench remembers it leaving.',
    effects: { itemId: 'i22', mp: -4, xp: 30 },
  },
  {
    id: 'v7_r11', scope: 'region', regionId: 'r7', weight: 5,
    text: 'You find a length of veilthread snagged on a broken finial. The thread is warm. It came from the right side of the seam between worlds. You take it. The wrong side notices.',
    effects: { itemId: 'i23', mp: -8, xp: 38, journal: 'A length of veilthread at the Tower. From the right side. The wrong side noticed me take it.' },
  },
  {
    id: 'v7_r12', scope: 'region', regionId: 'r7', weight: 17,
    text: 'A lich rises from a sigil-cracked plinth. It does not introduce itself. It does not need to. The Voice has decided you are interesting after all.',
    effects: { combat: { enemyIds: ['lich'], canFlee: true, countDistribution: [0.7, 0.25, 0.05] } },
  },

  // 6 stat/skill-gated
  {
    id: 'v7_g1', scope: 'gated', regionId: 'r7', weight: 4,
    conditions: [{ attribute: { name: 'Willpower', min: 14 } }],
    text: 'The Voice asks. You do not answer. The Voice asks again. You do not answer. The Voice waits. You wait longer. The Voice withdraws, satisfied with a different answer than it came for. You leave with a name you can use someday in extremity.',
    effects: { mp: -15, xp: 80, journal: 'I withheld speech from the Voice. It withdrew. It gave me a name to use in extremity: KAEL-ITH-VEN. I have not yet needed it.' },
  },
  {
    id: 'v7_g2', scope: 'gated', regionId: 'r7', weight: 3,
    conditions: [{ attribute: { name: 'Intellect', min: 14 } }],
    text: 'You sit with a half-cracked sigil long enough to read what it was meant to do before it broke. It was a binding for a thing that has since been bound by other means. Knowing this changes nothing. Knowing this is everything.',
    effects: { mp: 25, xp: 75, journal: 'A Tower sigil I read whole: a binding for a thing now bound otherwise. The first binding had failed. The thing inside is no longer where it was kept.' },
  },
  {
    id: 'v7_g3', scope: 'gated', regionId: 'r7', weight: 3,
    conditions: [{ skillUnlocked: 'a2' }],
    text: 'You ward yourself in frost against the Tower\'s suggestions and walk a corridor that does not always exist. At the far end: a robe of veilwoven silk, folded as though it had been waiting for someone exactly your size. It had.',
    effects: { itemId: 'i10', mp: -25, hp: -15, xp: 100, trainSkill: { skillId: 'a2', uses: 3 }, journal: 'A robe waiting at the Tower in my exact measure. It had been waiting. I do not know how long.' },
  },
  {
    id: 'v7_g4', scope: 'gated', regionId: 'r7', weight: 3,
    conditions: [{ skillUnlocked: 'd2' }],
    text: 'You speak a smiting word in a place that has heard mostly the wrong ones. Something old, low, listening, decides not to interfere with you today. You feel its decision settle like weather. You will be remembered.',
    effects: { mp: -20, xp: 90, trainSkill: { skillId: 'd2', uses: 4 }, journal: 'A presence at the Tower decided not to oppose me. I felt the decision. I am marked by it now. I do not yet know how.' },
  },
  {
    id: 'v7_g5', scope: 'gated', regionId: 'r7', weight: 2,
    conditions: [{ attribute: { name: 'Perception', min: 14 } }],
    text: 'You see the seam. Most do not. It runs from a sundered keystone down through three floors and out into the Veil itself. You memorize the geometry of it. You will know how to find it again. You will know how to enter through it without warning.',
    effects: { xp: 110, mp: -10, journal: 'The seam at the Tower is fixed in my memory now. It runs through three floors. It opens to the Veil without ritual. I have a back way.' },
  },
  {
    id: 'v7_g6', scope: 'gated', regionId: 'r7', weight: 2,
    conditions: [{ skillUnlocked: 'a1' }, { attribute: { name: 'Willpower', min: 13 } }],
    text: 'You take a sliver of the Tower\'s broken light and shape it, slowly, into a flame you can carry. It is small. It is not friendly. It is yours. It will burn brighter wherever the Veil thins. You write a verse for it that no one else will read.',
    effects: { itemId: 'i16', mp: -30, xp: 120, trainSkill: { skillId: 'a1', uses: 5 }, journal: 'A flame I shaped from the Tower\'s broken light. Mine. It brightens where the Veil is thin. I wrote it a verse. The verse is not for sharing.' },
  },
];

// =============================================================================
// THE VEIL (r9) — danger 5
// "Reachable only through the Tower." The otherworld. Almost no normal-coded
// outcomes — the rules of place do not apply, only the rules of dreaming.
// The wanderer is assumed to have crossed the Tower already. Outcomes can be
// direct about reality being thin. When the Veil gives, it gives big.
// =============================================================================

export const VEIL_OUTCOMES: WanderOutcome[] = [
  {
    id: 'v9_r1', scope: 'region', regionId: 'r9', weight: 9,
    text: 'You walk a corridor of grass that the wind moves the wrong direction through. You arrive somewhere. It is the place you had been thinking about a moment before. It is precise.',
    effects: { mp: 15, xp: 30, journal: 'In the Veil, I went where I was thinking. The thinking had to be exact. I have been practicing.' },
  },
  {
    id: 'v9_r2', scope: 'region', regionId: 'r9', weight: 8,
    text: 'A figure approaches from the far middle distance and is, when it arrives, you. Older. You ask one thing. It answers truthfully. It walks on without asking you anything. You do not blame it.',
    effects: { hp: -8, mp: -10, xp: 50, journal: 'I met myself in the Veil. I asked one thing. The answer was: yes. I will not write the question.' },
  },
  {
    id: 'v9_r3', scope: 'region', regionId: 'r9', weight: 8,
    text: 'A river of names runs past, audible. Most are not yours. One is. You do not reach. You do not call out. You let it pass and feel the absence afterward as a kind of blessing.',
    effects: { mp: -8, xp: 38, journal: 'My name in a river in the Veil. I let it pass. The relief afterward is still working its way through me.' },
  },
  {
    id: 'v9_r4', scope: 'region', regionId: 'r9', weight: 7,
    text: 'You find a coin you lost as a child. It is in the dust where dust does not exist. You pick it up. You feel six years old for a moment, in your hand, in your mouth, in the way your shoes do not fit.',
    effects: { gold: 50, hp: -3, xp: 42, journal: 'A coin from my childhood, found in the Veil. I was six years old for a moment. I did not stay.' },
  },
  {
    id: 'v9_r5', scope: 'region', regionId: 'r9', weight: 8,
    text: 'A door in nothing opens onto a kitchen. You smell what your mother cooked when she was tired. You do not enter. The door closes politely. You think it understood.',
    effects: { hp: 10, mp: 8, xp: 36, journal: 'A doorway in the Veil onto the smell of my mother\'s tired cooking. I did not go in. I knew not to.' },
  },
  {
    id: 'v9_r6', scope: 'region', regionId: 'r9', weight: 7,
    text: 'You are walking on the underside of a sky. Looking up, you see fields. You walk up to a stream and drink without disturbing the surface, which is over your head and made of light.',
    effects: { mp: 25, xp: 44, journal: 'I drank from a Veil-stream above me. The water was light. It tasted of the way certain afternoons taste.' },
  },
  {
    id: 'v9_r7', scope: 'region', regionId: 'r9', weight: 6,
    text: 'A market without buyers. Stalls of objects you have never seen. A vendor watches you patiently. He does not call out. You leave with nothing. He nods. You owe him that, somehow.',
    effects: { mp: -6, xp: 36, journal: 'A Veil-market. The vendor was patient. I bought nothing. The owing afterward is real.' },
  },
  {
    id: 'v9_r8', scope: 'region', regionId: 'r9', weight: 7,
    text: 'You find a phoenix tear cooling in the cup of a leaf. It is not yet for using. You set it carefully in your pack. The leaf, without it, drifts. You do not watch where it lands.',
    effects: { itemId: 'i14', mp: -10, xp: 60, journal: 'A phoenix tear in a leaf-cup in the Veil. I have it now. The leaf drifted. I did not look.' },
  },
  {
    id: 'v9_r9', scope: 'region', regionId: 'r9', weight: 6,
    text: 'A library of one book, open to one page. You read the page. The page is the moment in your life you have most regretted, written in the language you think in but did not learn from anyone. You close the book gently. You do not look for the index.',
    effects: { hp: -10, mp: -10, xp: 70, journal: 'A book in the Veil that read me back. The page was the worst thing I have done. I closed it. The book accepted being closed.' },
  },
  {
    id: 'v9_r10', scope: 'region', regionId: 'r9', weight: 5,
    text: 'You find Veilrender lying flat on a stone, hilt toward you. The stone is the kind of stone the Veil makes when it wants to look like a stone. The blade is warm. It chooses to be picked up.',
    effects: { itemId: 'i5', mp: -20, hp: -10, xp: 120, journal: 'Veilrender chose me at a stone in the Veil. I have it. I do not know yet what it expects.' },
  },
  {
    id: 'v9_r11', scope: 'region', regionId: 'r9', weight: 5,
    text: 'A locket warms in your pocket that you did not know was a locket. You take it out. It is voice-touched. It opens when it pleases. It is pleased now. A whisper begins. You let it.',
    effects: { itemId: 'i20', mp: -15, xp: 90, journal: 'A voice-touched locket appeared in my pocket in the Veil. I do not own it. It owns being-with-me. The whisper has already begun.' },
  },
  {
    id: 'v9_r12', scope: 'region', regionId: 'r9', weight: 20,
    text: 'A veil-touched thing notices you across a field of soft white static. It does not approach. It begins to be where you are, by inches, without crossing the distance.',
    effects: { combat: { enemyIds: ['veil_touched'], canFlee: true, countDistribution: [0.3, 0.4, 0.3] } },
  },

  // 6 stat/skill-gated
  {
    id: 'v9_g1', scope: 'gated', regionId: 'r9', weight: 3,
    conditions: [{ attribute: { name: 'Willpower', min: 15 } }],
    text: 'The Veil offers you what you most want. You do not name it. You do not turn from it. You let it sit in front of you a long minute, looked at honestly, and then you walk past it. It dissolves. Something settles in you that has not had a name. The rest of the day, things go correctly without you having to nudge them.',
    effects: { mp: 40, xp: 200, journal: 'I refused what the Veil offered. The thing that settled in me afterward is still without a name. I am being given correct days for now. I expect a bill.' },
  },
  {
    id: 'v9_g2', scope: 'gated', regionId: 'r9', weight: 3,
    conditions: [{ attribute: { name: 'Intellect', min: 15 } }],
    text: 'You read the Veil\'s grammar — not its language, its grammar. You understand how it makes sentences out of moments. You make one sentence yourself. It is small. It survives. You leave it where you put it.',
    effects: { mp: -30, xp: 180, journal: 'I made a sentence in the Veil\'s grammar. It survived. It is small and somewhere I will not return to. It will not be missed because it has not yet been noticed.' },
  },
  {
    id: 'v9_g3', scope: 'gated', regionId: 'r9', weight: 3,
    conditions: [{ skillUnlocked: 'a3' }],
    text: 'You raise chain-lightning between two points the Veil had not connected. The Veil notes it. The Veil corrects elsewhere, quietly, to balance. You have made an exchange you cannot undo. The lightning hangs an extra second. You earned that second.',
    effects: { mp: -35, hp: -15, xp: 160, trainSkill: { skillId: 'a3', uses: 5 }, journal: 'I forced a connection in the Veil with chain-lightning. The Veil corrected elsewhere. I do not know what I traded. The trade was witnessed and accepted.' },
  },
  {
    id: 'v9_g4', scope: 'gated', regionId: 'r9', weight: 2,
    conditions: [{ skillUnlocked: 'd5' }],
    text: 'You set a sanctuary in a place that should not allow them. It holds. It draws other things to its edge that did not know they could come there. They stand in your light a long minute and are healed of something none of them can name. You are tired afterward in a way sleep will not fix.',
    effects: { mp: -40, hp: -20, xp: 220, trainSkill: { skillId: 'd5', uses: 4 }, journal: 'I set a sanctuary in the Veil. Things came that should not exist. They were healed of something. I am tired in a place I do not know the name of.' },
  },
  {
    id: 'v9_g5', scope: 'gated', regionId: 'r9', weight: 2,
    conditions: [{ attribute: { name: 'Perception', min: 15 } }],
    text: 'You see the structure under the seeming. The Veil is not chaos. It is order, organized along axes the waking world does not have. You memorize one axis. You will read the world differently from now on. You will lose friends.',
    effects: { mp: -25, xp: 250, journal: 'I learned an axis the Veil organizes itself along. The waking world has it too. I see it now. I cannot un-see it. It will cost me people.' },
  },
  {
    id: 'v9_g6', scope: 'gated', regionId: 'r9', weight: 2,
    conditions: [{ attribute: { name: 'Willpower', min: 14 }, skillUnlocked: 'd1' }],
    text: 'You find someone in the Veil who was not supposed to make it across. They are older than they should be. They are still themselves, mostly. You knit them together with what you have. You walk them to the edge. They return through. You stay a few minutes longer than you needed to. The Veil thanks you, in its way, by letting you leave easily.',
    effects: { hp: -25, mp: -30, xp: 240, trainSkill: { skillId: 'd1', uses: 5 }, journal: 'I brought someone out of the Veil who had been lost there. They were mostly themselves. The Veil let me go easily afterward, which is its own kind of payment, and a warning.' },
  },
];


// ---------- EXHAUSTED (universal) -------------------------------------------
// When a region has been wandered too many times since you last passed time,
// these dominate the pool. Small or no rewards. The wander toll still applies.

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
  r1: CAELHORN_OUTCOMES,
  r2: SYLVARIN_OUTCOMES,
  r3: KHARDUUN_OUTCOMES,
  r4: GROKHAI_OUTCOMES,
  r5: SALTREACH_OUTCOMES,
  r6: VELIRYN_OUTCOMES,
  r7: SUNDERED_OUTCOMES,
  r8: FROSTMERE_OUTCOMES,
  r9: VEIL_OUTCOMES,
};

export function pickWanderOutcome(
  regionId: string,
  character: CharacterShape,
  regionWanderCount: number,
): WanderOutcome {
  if (regionWanderCount >= 3) {
    return weightedPick(EXHAUSTED_OUTCOMES);
  }

  const regional = REGIONAL_POOLS[regionId] ?? [];
  const pool = [...UNIVERSAL_OUTCOMES, ...regional].filter(o => matchesConditions(o, character));

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

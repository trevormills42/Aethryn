// The shop system — Hesta of the Long Wagon, Veliryn Plains.
//
// Stock has two shapes. The STAPLE pool is everything common + uncommon (and a
// few utility items like Trail Rations) — it's always there, always priced the
// same. The ROTATION pool is the spicy slot: a curated set of rare items that
// rolls fresh every time the player Rests. Most rests yield nothing rare;
// occasionally one item appears, very occasionally two.
//
// Rares like epics, legendaries, and lore-locked items are deliberately NOT in
// the rotation pool. Those should come from quests, wander-gates, or crafting
// — not from grinding gold and resting.

import { ITEMS, Item } from './gameData';

// ---------- PRICING ---------------------------------------------------------
// Type × rarity grid. Materials cheap (their value is in being crafted into
// things). Potions higher per-unit (consumables shouldn't be spammed). Weapons
// and armor scale aggressively (transformative purchases). Artifacts top tier.
//
// Trail Rations override the material formula because they're a sustainable-use
// item — keeping them cheap so a player rarely runs out.

const TYPE_PRICES: Record<string, Record<string, number>> = {
  material: { common: 12, uncommon: 35, rare: 100, epic: 250, legendary: 600 },
  potion:   { common: 30, uncommon: 75, rare: 220, epic: 500, legendary: 1200 },
  armor:    { common: 50, uncommon: 130, rare: 350, epic: 800, legendary: 2000 },
  weapon:   { common: 60, uncommon: 150, rare: 400, epic: 900, legendary: 2500 },
  artifact: { common: 80, uncommon: 200, rare: 600, epic: 1400, legendary: 3500 },
};

// Hand-tuned overrides for items where the formula doesn't quite fit.
const PRICE_OVERRIDES: Record<string, number> = {
  i26: 8, // Trail Rations — sustainable utility, deliberately below mat-common
};

// Public helper: returns the buy price for an item, accounting for type/rarity
// formula and any hand-tuned override. Used by both the shop UI (display) and
// the buy action (validation).
export function getItemPrice(item: Item): number {
  if (PRICE_OVERRIDES[item.id] !== undefined) return PRICE_OVERRIDES[item.id];
  const tier = TYPE_PRICES[item.type];
  if (!tier) return 100;
  return tier[item.rarity] ?? 100;
}

// Charisma flat discount: 5% off per 2 points above 10. Capped at 50% so even
// a maxed-out CHA character can't get items free.
export function applyCharismaDiscount(basePrice: number, charisma: number): number {
  const discount = Math.min(0.5, Math.max(0, (charisma - 10) / 2 * 0.05));
  return Math.floor(basePrice * (1 - discount));
}

// Sell price is a flat 40% of buy price (no charisma bonus on sell — the
// merchant's not paying you full just because you smiled).
export function getSellPrice(item: Item): number {
  return Math.floor(getItemPrice(item) * 0.4);
}

// ---------- INVENTORY POOLS -------------------------------------------------

// Always-stocked items at Hesta's: every common + uncommon, plus a handful of
// utility items (rations, common potions). Computed once from ITEMS so future
// item additions automatically appear if they qualify.
export const STAPLE_ITEM_IDS: string[] = ITEMS
  .filter(i => i.rarity === 'common' || i.rarity === 'uncommon')
  .map(i => i.id);

// The curated rotation pool — rares the merchant might have on a given day.
// NOT all rares; specifically ones that aren't lore-locked to a region's wander
// chain or a quest reward. Epics and legendaries are deliberately absent.
export const ROTATION_POOL: string[] = [
  'i2',  // Whisperleaf Bow (rare weapon)
  'i4',  // Saltforged Blade (rare weapon)
  'i8',  // Stormtotem Mantle (rare armor)
  'i9',  // Ironroot Helm (rare armor)
  'i12', // Greater Healing Elixir (rare potion)
  'i15', // Stoneblood Flask (rare potion)
  'i25', // Bellringer's Token (rare artifact)
];

// Rotation rolling logic. Returns the IDs of rare items the shop has today.
// 65% no rares, 35% rare; of those, 90% one rare and 10% two. So ~3.5% chance
// per Rest of seeing two simultaneously, which makes "two rare day" feel like a
// real thing when it happens.
export function rollRotation(): string[] {
  if (Math.random() >= 0.35) return [];
  // We have at least one rare. Pick distinct items.
  const pool = [...ROTATION_POOL];
  const first = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
  if (Math.random() >= 0.1) return [first];
  const second = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
  return [first, second];
}

// ---------- HESTA'S VOICE ---------------------------------------------------
// Rotated randomly each time the player opens the shop. Six lines so it takes
// a while before a wanderer hears the same one twice. Same register as
// gameData.ts and wanderData.ts — terse, world-weary, trusts the reader.

export const HESTA_LINES: string[] = [
  'You\'re back. Coin first, then we\'ll see what\'s worth the looking.',
  'Half my stock changes with the moon. The other half changes with what people will pay for it.',
  'I\'d say it\'s good to see you, but I make a point of not lying to wanderers. Sit. Look.',
  'Wagon\'s been on this road since before the bards stopped teaching the third verse. So has half my stock, near as I can tell.',
  'Buy what you need. Sell what you don\'t. The realm decides which is which after.',
  'No haggling. There used to be. Then I stopped having time for the people who liked it.',
];

export function pickHestaLine(): string {
  return HESTA_LINES[Math.floor(Math.random() * HESTA_LINES.length)];
}

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, REGIONS, QUESTS, ITEMS } from '../lib/gameData';
import { ENCOUNTERS, ENEMIES } from '../lib/combatData';
import { useGame } from '../lib/gameStore';
import { STAPLE_ITEM_IDS, getItemPrice, applyCharismaDiscount, getSellPrice, pickHestaLine } from '../lib/shopData';
import GlassCard from '../components/GlassCard';
import RuneDivider from '../components/RuneDivider';

const { width } = Dimensions.get('window');
const MAP_W = width - 36;
const MAP_H = MAP_W * 1.1;

export default function WorldScreen() {
  const { character, visitRegion, startEncounter, wander, buyItem, sellItem } = useGame();
  const [openRegion, setOpenRegion] = useState<string | null>(null);
  // Outcome modal: shows the lyrical text and any rewards from the last wander.
  // null = no modal showing. 'too_weary' = HP-too-low message.
  const [wanderModal, setWanderModal] = useState<
    | null
    | { kind: 'too_weary' }
    | { kind: 'outcome'; text: string; effects: any }
  >(null);
  // Shop modal state. shopOpen toggles the whole modal; shopTab switches Buy/Sell.
  // hestaLine is set when the modal opens and stays put until next visit.
  // shopFeedback briefly shows transaction outcomes ("Bought!", "Not enough gold").
  const [shopOpen, setShopOpen] = useState(false);
  const [shopTab, setShopTab] = useState<'buy' | 'sell'>('buy');
  const [hestaLine, setHestaLine] = useState<string>('');
  const [shopFeedback, setShopFeedback] = useState<string>('');


  if (!character) return null;

  const region = REGIONS.find(r => r.id === openRegion);
  const visited = (id: string) => character.visitedRegions.includes(id);

  const onTravel = (id: string) => {
    visitRegion(id);
    setOpenRegion(id);
  };

  const onWander = (regionId: string) => {
    const result = wander(regionId);
    if (result.kind === 'too_weary') {
      setWanderModal({ kind: 'too_weary' });
      return;
    }
    if (result.combatTriggered) {
      // Wander triggered combat — close the region modal and route to combat.
      // Skip showing the outcome modal since combat is the consequence.
      setOpenRegion(null);
      router.push('/combat');
      return;
    }
    setWanderModal({
      kind: 'outcome',
      text: result.outcome.text,
      effects: result.outcome.effects,
    });
  };

  const onHunt = (regionId: string) => {
    // No confirmation dialog — Alert.alert callbacks don't fire reliably on web,
    // and tapping "Hunt" is itself the affirmative action. If the player wants to
    // bail, they can flee from the combat screen.
    const tables = ENCOUNTERS[regionId] || [['bandit']];
    const enemies = tables[Math.floor(Math.random() * tables.length)];
    startEncounter({ regionId, enemyIds: enemies });
    setOpenRegion(null);
    router.push('/combat');
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgDeep }}>
      <ScrollView contentContainerStyle={{ paddingTop: 56, paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: 18 }}>
          <Text style={styles.heading}>THE SUNDERED REALM</Text>
          <Text style={styles.subheading}>Nine regions. Each remembers you.</Text>
        </View>

        {/* Map */}
        <View style={styles.mapWrap}>
          <View style={styles.map}>
            {/* faux land masses */}
            <View style={[styles.landmass, { top: '10%', left: '8%', width: '60%', height: '45%' }]} />
            <View style={[styles.landmass, { top: '50%', left: '30%', width: '55%', height: '40%' }]} />
            <View style={[styles.landmass, { top: '5%', left: '60%', width: '35%', height: '30%' }]} />

            {/* connecting lines (paths) */}
            {REGIONS.map((r, i) => {
              if (i === 0) return null;
              const prev = REGIONS[i - 1];
              return (
                <View
                  key={`line-${r.id}`}
                  style={{
                    position: 'absolute',
                    left: `${Math.min(prev.x, r.x)}%`,
                    top: `${Math.min(prev.y, r.y) + 2}%`,
                    width: `${Math.abs(r.x - prev.x) || 1}%`,
                    height: `${Math.abs(r.y - prev.y) || 1}%`,
                    borderTopWidth: 1,
                    borderColor: 'rgba(212,175,55,0.2)',
                    borderStyle: 'dashed',
                  }}
                />
              );
            })}

            {REGIONS.map(r => {
              const isVisited = visited(r.id);
              return (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => onTravel(r.id)}
                  style={[styles.pin, { left: `${r.x}%`, top: `${r.y}%` }]}
                >
                  <View style={[styles.pinDot, { backgroundColor: isVisited ? COLORS.gold : 'rgba(192,199,209,0.4)', borderColor: isVisited ? COLORS.gold : COLORS.silver }]}>
                    <Ionicons name={isVisited ? 'flag' : 'help'} size={10} color={COLORS.bgDeep} />
                  </View>
                  <Text style={[styles.pinLabel, { color: isVisited ? COLORS.gold : COLORS.silver }]} numberOfLines={1}>{r.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <RuneDivider label={`${character.visitedRegions.length} of ${REGIONS.length} Discovered`} />

        {/* Region list */}
        <View style={{ paddingHorizontal: 18 }}>
          {REGIONS.map(r => {
            const isVisited = visited(r.id);
            const questHere = QUESTS.find(q => q.region === r.name);
            return (
              <TouchableOpacity key={r.id} onPress={() => onTravel(r.id)} style={{ marginBottom: 10 }} activeOpacity={0.85}>
                <GlassCard glow={isVisited ? COLORS.gold : undefined}>
                  <View style={styles.regionRow}>
                    <View style={[styles.dangerBadge, { borderColor: getDangerColor(r.danger) }]}>
                      <Text style={[styles.dangerText, { color: getDangerColor(r.danger) }]}>{'★'.repeat(r.danger)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.regionName}>{r.name}</Text>
                      <Text style={styles.regionDesc}>{r.desc}</Text>
                      {questHere && (
                        <View style={styles.questHint}>
                          <Ionicons name="bookmark" size={10} color={COLORS.gold} />
                          <Text style={styles.questHintText}>{questHere.title}</Text>
                        </View>
                      )}
                    </View>
                    <Ionicons name={isVisited ? 'checkmark-circle' : 'chevron-forward'} size={20} color={isVisited ? '#10B981' : COLORS.gold} />
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Region modal */}
      <Modal visible={!!region} transparent animationType="fade" onRequestClose={() => setOpenRegion(null)}>
        {region && (
          <View style={styles.modalBg}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalRegion}>DANGER {'★'.repeat(region.danger)}</Text>
                <TouchableOpacity onPress={() => setOpenRegion(null)}>
                  <Ionicons name="close" size={22} color={COLORS.gold} />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalTitle}>{region.name}</Text>
              <Text style={styles.modalDesc}>{region.desc}</Text>

              <View style={{ height: 14 }} />

              <TouchableOpacity onPress={() => onHunt(region.id)} style={[styles.encounterBtn, { backgroundColor: COLORS.blood }]}>
                <Ionicons name="skull" size={18} color={COLORS.parchment} />
                <Text style={[styles.encounterText, { color: COLORS.parchment }]}>Hunt for foes</Text>
              </TouchableOpacity>

              <View style={{ height: 8 }} />

              <TouchableOpacity onPress={() => onWander(region.id)} style={[styles.encounterBtn, { backgroundColor: 'rgba(45,27,78,0.6)', borderWidth: 1, borderColor: COLORS.gold }]}>
                <Ionicons name="footsteps" size={18} color={COLORS.gold} />
                <Text style={[styles.encounterText, { color: COLORS.gold }]}>Wander the region</Text>
              </TouchableOpacity>

              {/* Hesta only sets up shop in the Plains. v1 keeps it singular —
                  multi-shop expansion is on the to-do list. */}
              {region.id === 'r6' && (
                <>
                  <View style={{ height: 8 }} />
                  <TouchableOpacity
                    onPress={() => { setOpenRegion(null); setShopOpen(true); setHestaLine(pickHestaLine()); }}
                    style={[styles.encounterBtn, { backgroundColor: 'rgba(212,175,55,0.15)', borderWidth: 1, borderColor: COLORS.gold }]}
                  >
                    <Ionicons name="storefront" size={18} color={COLORS.gold} />
                    <Text style={[styles.encounterText, { color: COLORS.gold }]}>Visit Hesta of the Long Wagon</Text>
                  </TouchableOpacity>
                </>
              )}

              <Text style={styles.modalNote}>Hunting yields combat. Wandering yields lore — and sometimes worse. Costs a small toll of vitality. Regions tire of you; rest or move on to refresh them.</Text>
            </View>
          </View>
        )}
      </Modal>

      {/* Wander outcome modal: works on web (Alert.alert callbacks don't). */}
      <Modal visible={!!wanderModal} transparent animationType="fade" onRequestClose={() => setWanderModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 360 }]}>
            {wanderModal?.kind === 'too_weary' ? (
              <>
                <Text style={styles.modalTitle}>Too Weary</Text>
                <Text style={[styles.modalDesc, { marginTop: 10, lineHeight: 22 }]}>
                  You are too worn to wander further. Rest first, or take to the roads with sterner business.
                </Text>
              </>
            ) : wanderModal?.kind === 'outcome' ? (
              <>
                <Text style={[styles.modalRegion, { marginBottom: 12 }]}>✦ THE ROAD ✦</Text>
                <Text style={[styles.modalDesc, { lineHeight: 22, fontStyle: 'italic', color: COLORS.parchment }]}>
                  {wanderModal.text}
                </Text>
                {renderEffectsSummary(wanderModal.effects)}
              </>
            ) : null}
            <View style={{ height: 16 }} />
            <TouchableOpacity onPress={() => setWanderModal(null)} style={[styles.encounterBtn, { backgroundColor: 'rgba(45,27,78,0.6)', borderWidth: 1, borderColor: COLORS.gold }]}>
              <Text style={[styles.encounterText, { color: COLORS.gold }]}>Walk on</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Hesta's shop. Buy tab = staples + today's rotation. Sell tab = the
          player's inventory, anything sellable for gold. Equipped items are
          auto-unequipped on sell (the store handles that defensively). */}
      <Modal visible={shopOpen} transparent animationType="fade" onRequestClose={() => { setShopOpen(false); setShopFeedback(''); }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 380, maxHeight: '85%' }]}>
            <Text style={styles.modalRegion}>✦ HESTA'S WAGON ✦</Text>
            <Text style={[styles.modalDesc, { fontStyle: 'italic', textAlign: 'center', marginBottom: 4 }]}>
              {hestaLine}
            </Text>
            <Text style={[styles.modalNote, { textAlign: 'center', color: COLORS.gold, marginTop: 4 }]}>
              Your purse: {character.gold} gold
            </Text>

            {/* Buy / Sell tabs */}
            <View style={shopStyles.tabRow}>
              <TouchableOpacity
                onPress={() => { setShopTab('buy'); setShopFeedback(''); }}
                style={[shopStyles.tab, shopTab === 'buy' && shopStyles.tabActive]}
              >
                <Text style={[shopStyles.tabText, shopTab === 'buy' && { color: COLORS.bgDeep }]}>BUY</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setShopTab('sell'); setShopFeedback(''); }}
                style={[shopStyles.tab, shopTab === 'sell' && shopStyles.tabActive]}
              >
                <Text style={[shopStyles.tabText, shopTab === 'sell' && { color: COLORS.bgDeep }]}>SELL</Text>
              </TouchableOpacity>
            </View>

            {!!shopFeedback && (
              <Text style={shopStyles.feedback}>{shopFeedback}</Text>
            )}

            <ScrollView style={{ maxHeight: 380, marginTop: 10 }}>
              {shopTab === 'buy' ? (
                <BuyList
                  rotation={character.shopRotation ?? []}
                  charisma={character.attributes.Charisma ?? 10}
                  gold={character.gold}
                  onBuy={(itemId) => {
                    const r = buyItem(itemId);
                    if (r.kind === 'bought') setShopFeedback(`✦ Purchased — ${r.goldSpent} gold spent.`);
                    else if (r.kind === 'cant_afford') setShopFeedback('Not enough gold. The wagon does not extend credit.');
                    else setShopFeedback('That stock has moved on.');
                  }}
                />
              ) : (
                <SellList
                  inventory={character.inventory}
                  onSell={(itemId) => {
                    const r = sellItem(itemId);
                    if (r.kind === 'sold') setShopFeedback(`✦ Sold — ${r.goldGained} gold received.`);
                    else setShopFeedback('You do not own that.');
                  }}
                />
              )}
            </ScrollView>

            <View style={{ height: 12 }} />
            <TouchableOpacity
              onPress={() => { setShopOpen(false); setShopFeedback(''); }}
              style={[styles.encounterBtn, { backgroundColor: 'rgba(45,27,78,0.6)', borderWidth: 1, borderColor: COLORS.gold }]}
            >
              <Text style={[styles.encounterText, { color: COLORS.gold }]}>Take your leave</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ---------- BuyList -------------------------------------------------------
// Renders the staples first, then today's rotation under a small banner so the
// player understands which items are "today only."
function BuyList({
  rotation,
  charisma,
  gold,
  onBuy,
}: {
  rotation: string[];
  charisma: number;
  gold: number;
  onBuy: (itemId: string) => void;
}) {
  const stapleItems = STAPLE_ITEM_IDS
    .map(id => ITEMS.find(i => i.id === id)!)
    .filter(Boolean);
  const rotationItems = rotation
    .map(id => ITEMS.find(i => i.id === id)!)
    .filter(Boolean);

  return (
    <View>
      {rotationItems.length > 0 && (
        <>
          <Text style={shopStyles.sectionLabel}>✦ TODAY'S WAGON</Text>
          {rotationItems.map(item => {
            const price = applyCharismaDiscount(getItemPrice(item), charisma);
            const canAfford = gold >= price;
            return (
              <ShopRow key={`rot-${item.id}`} item={item} price={price} canAfford={canAfford} onPress={() => onBuy(item.id)} action="Buy" highlight />
            );
          })}
          <View style={{ height: 8 }} />
        </>
      )}
      <Text style={shopStyles.sectionLabel}>STAPLES</Text>
      {stapleItems.map(item => {
        const price = applyCharismaDiscount(getItemPrice(item), charisma);
        const canAfford = gold >= price;
        return (
          <ShopRow key={`stp-${item.id}`} item={item} price={price} canAfford={canAfford} onPress={() => onBuy(item.id)} action="Buy" />
        );
      })}
    </View>
  );
}

// ---------- SellList ------------------------------------------------------
// Lists the player's inventory with sell prices. Stacks duplicates with a
// count badge to keep the list readable for ration-heavy inventories.
function SellList({
  inventory,
  onSell,
}: {
  inventory: string[];
  onSell: (itemId: string) => void;
}) {
  // Stack duplicates: { itemId: count }
  const counts: Record<string, number> = {};
  inventory.forEach(id => { counts[id] = (counts[id] ?? 0) + 1; });
  const entries = Object.entries(counts);

  if (entries.length === 0) {
    return <Text style={{ color: COLORS.silver, fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>You carry nothing the wagon would buy.</Text>;
  }

  return (
    <View>
      {entries.map(([itemId, count]) => {
        const item = ITEMS.find(i => i.id === itemId);
        if (!item) return null;
        const price = getSellPrice(item);
        return (
          <ShopRow
            key={`sell-${itemId}`}
            item={item}
            price={price}
            canAfford={true}
            onPress={() => onSell(itemId)}
            action="Sell"
            count={count > 1 ? count : undefined}
          />
        );
      })}
    </View>
  );
}

// ---------- ShopRow -------------------------------------------------------
function ShopRow({
  item,
  price,
  canAfford,
  onPress,
  action,
  highlight,
  count,
}: {
  item: any;
  price: number;
  canAfford: boolean;
  onPress: () => void;
  action: 'Buy' | 'Sell';
  highlight?: boolean;
  count?: number;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!canAfford}
      activeOpacity={0.7}
      style={[
        shopStyles.row,
        highlight && shopStyles.rowHighlight,
        !canAfford && { opacity: 0.4 },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={shopStyles.rowName}>
          {item.name}
          {count ? <Text style={{ color: COLORS.silver }}>{`  ×${count}`}</Text> : null}
        </Text>
        <Text style={shopStyles.rowDesc} numberOfLines={2}>{item.desc}</Text>
      </View>
      <View style={shopStyles.rowAction}>
        <Text style={shopStyles.rowPrice}>{price}g</Text>
        <Text style={shopStyles.rowActionText}>{action}</Text>
      </View>
    </TouchableOpacity>
  );
}

const shopStyles = StyleSheet.create({
  tabRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', alignItems: 'center', backgroundColor: 'rgba(45,27,78,0.4)' },
  tabActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  tabText: { color: COLORS.silver, fontSize: 12, letterSpacing: 2, fontWeight: '700' },
  feedback: { color: COLORS.gold, fontSize: 11, fontStyle: 'italic', textAlign: 'center', marginTop: 10, opacity: 0.9 },
  sectionLabel: { color: COLORS.gold, fontSize: 10, letterSpacing: 2, fontWeight: '700', marginTop: 6, marginBottom: 6, opacity: 0.85 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)', backgroundColor: 'rgba(10,17,40,0.5)', marginBottom: 6 },
  rowHighlight: { borderColor: COLORS.gold, backgroundColor: 'rgba(212,175,55,0.1)' },
  rowName: { color: COLORS.parchment, fontSize: 13, fontWeight: '600' },
  rowDesc: { color: COLORS.silver, fontSize: 11, marginTop: 2, opacity: 0.8, lineHeight: 14 },
  rowAction: { alignItems: 'flex-end', minWidth: 60 },
  rowPrice: { color: COLORS.gold, fontSize: 13, fontWeight: '700' },
  rowActionText: { color: COLORS.silver, fontSize: 9, letterSpacing: 1.5, marginTop: 2 },
});

// Translate effect deltas to human-readable lines under the outcome text.
// Skips zero/empty values; small flourish for items and journal entries.
function renderEffectsSummary(effects: any) {
  if (!effects) return null;
  const lines: string[] = [];
  if (effects.xp) lines.push(`+${effects.xp} XP`);
  if (effects.hp && effects.hp > 0) lines.push(`+${effects.hp} HP`);
  if (effects.hp && effects.hp < 0) lines.push(`${effects.hp} HP`);
  // Note: the 2 HP wander toll is paid silently — only outcome-specific HP shows.
  if (effects.mp && effects.mp > 0) lines.push(`+${effects.mp} MP`);
  if (effects.mp && effects.mp < 0) lines.push(`${effects.mp} MP`);
  if (effects.gold && effects.gold > 0) lines.push(`+${effects.gold} gold`);
  if (effects.gold && effects.gold < 0) lines.push(`${effects.gold} gold`);
  if (effects.itemId) lines.push('You take what was given.');
  if (effects.itemRemove) lines.push('Something was lost.');
  if (effects.trainSkill) lines.push('Your hands remember.');
  if (effects.journal) lines.push('A line for the journal.');
  if (lines.length === 0) return null;
  return (
    <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(212,175,55,0.2)' }}>
      {lines.map((l, i) => (
        <Text key={i} style={{ color: COLORS.gold, fontSize: 12, letterSpacing: 1, marginBottom: 3 }}>
          {l}
        </Text>
      ))}
    </View>
  );
}


function getDangerColor(d: number) {
  if (d <= 1) return '#10B981';
  if (d <= 2) return COLORS.gold;
  if (d <= 3) return '#F97316';
  if (d <= 4) return COLORS.ember;
  return COLORS.blood;
}

const styles = StyleSheet.create({
  heading: { color: COLORS.gold, fontSize: 22, fontWeight: '300', letterSpacing: 4 },
  subheading: { color: COLORS.silver, fontSize: 11, fontStyle: 'italic', opacity: 0.7, marginTop: 4 },
  mapWrap: { paddingHorizontal: 18, marginTop: 18 },
  map: { width: MAP_W, height: MAP_H, borderRadius: 16, backgroundColor: COLORS.bgDark, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', overflow: 'hidden', position: 'relative' },
  landmass: { position: 'absolute', backgroundColor: 'rgba(45,27,78,0.5)', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(212,175,55,0.15)' },
  pin: { position: 'absolute', alignItems: 'center', transform: [{ translateX: -14 }, { translateY: -14 }] },
  pinDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.gold, shadowOpacity: 0.6, shadowRadius: 8 },
  pinLabel: { fontSize: 9, marginTop: 4, fontWeight: '600', maxWidth: 90, textAlign: 'center', textShadowColor: COLORS.bgDeep, textShadowRadius: 4 },
  regionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dangerBadge: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,17,40,0.6)' },
  dangerText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  regionName: { color: COLORS.parchment, fontSize: 15, fontWeight: '500', marginBottom: 3 },
  regionDesc: { color: COLORS.silver, fontSize: 12, fontStyle: 'italic', opacity: 0.8 },
  questHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  questHintText: { color: COLORS.gold, fontSize: 10, fontStyle: 'italic' },
  modalBg: { flex: 1, backgroundColor: 'rgba(5,8,23,0.85)', justifyContent: 'center', padding: 18 },
  modalCard: { backgroundColor: COLORS.ink, borderRadius: 18, borderWidth: 1, borderColor: COLORS.gold, padding: 22 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalRegion: { color: COLORS.gold, fontSize: 10, letterSpacing: 2.5 },
  modalTitle: { color: COLORS.parchment, fontSize: 24, fontWeight: '300', letterSpacing: 1, marginBottom: 8 },
  modalDesc: { color: COLORS.parchment, fontSize: 14, lineHeight: 21, fontStyle: 'italic' },
  encounterBtn: { flexDirection: 'row', backgroundColor: COLORS.gold, paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 8 },
  encounterText: { color: COLORS.bgDeep, fontWeight: '700', letterSpacing: 1.5, fontSize: 13 },
  modalNote: { color: COLORS.silver, fontSize: 11, fontStyle: 'italic', textAlign: 'center', marginTop: 10, opacity: 0.7 },
});

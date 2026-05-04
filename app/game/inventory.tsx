import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, ITEMS, RARITY_COLOR, Item } from '../lib/gameData';
import { useGame } from '../lib/gameStore';
import GlassCard from '../components/GlassCard';
import RuneDivider from '../components/RuneDivider';

const FILTERS = ['all', 'weapon', 'armor', 'potion', 'artifact', 'material'] as const;
type Filter = typeof FILTERS[number];

export default function InventoryScreen() {
  const { character, equipItem, usePotion } = useGame();
  const [filter, setFilter] = useState<Filter>('all');
  const [openItem, setOpenItem] = useState<Item | null>(null);

  if (!character) return null;

  const counts = character.inventory.reduce<Record<string, number>>((acc, id) => {
    acc[id] = (acc[id] || 0) + 1; return acc;
  }, {});

  const ownedIds = Object.keys(counts);

  const ownedItems = useMemo(() => {
    return ownedIds
      .map(id => ITEMS.find(i => i.id === id)!)
      .filter(Boolean)
      .filter(i => filter === 'all' || i.type === filter);
  }, [ownedIds, filter]);

  const equippedWeapon = ITEMS.find(i => i.id === character.equipped.weapon);
  const equippedArmor = ITEMS.find(i => i.id === character.equipped.armor);
  const equippedArtifact = ITEMS.find(i => i.id === character.equipped.artifact);

  const onUse = (item: Item) => {
    if (item.type === 'potion') {
      usePotion(item.id);
      setOpenItem(null);
    } else if (item.type === 'weapon') {
      equipItem(item.id, 'weapon');
      Alert.alert('Equipped', `${item.name} is now in hand.`);
    } else if (item.type === 'armor') {
      equipItem(item.id, 'armor');
      Alert.alert('Equipped', `${item.name} is now worn.`);
    } else if (item.type === 'artifact') {
      equipItem(item.id, 'artifact');
      Alert.alert('Attuned', `${item.name} hums in agreement.`);
    } else {
      Alert.alert('Material', 'Best saved for crafting.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgDeep }}>
      <ScrollView contentContainerStyle={{ paddingTop: 56, paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: 18 }}>
          <Text style={styles.heading}>THE PACK</Text>
          <Text style={styles.subheading}>Every relic remembers where it came from</Text>
        </View>

        {/* Equipped */}
        <View style={{ paddingHorizontal: 18, marginTop: 18 }}>
          <Text style={styles.sectionLabel}>EQUIPPED</Text>
          <View style={styles.equippedRow}>
            <EquipSlot label="Blade" item={equippedWeapon} icon="cut" />
            <EquipSlot label="Garb" item={equippedArmor} icon="shield" />
            <EquipSlot label="Relic" item={equippedArtifact} icon="diamond" />
          </View>
        </View>

        <RuneDivider label={`${ownedIds.length} Relics Owned`} />

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, gap: 6 }}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.filterChip, filter === f && styles.filterActive]}>
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.grid}>
          {ownedItems.map(item => {
            const c = RARITY_COLOR[item.rarity];
            return (
              <TouchableOpacity key={item.id} onPress={() => setOpenItem(item)} style={[styles.itemCard, { borderColor: c }]} activeOpacity={0.85}>
                <View style={[styles.rarityStripe, { backgroundColor: c }]} />
                <View style={[styles.itemIcon, { backgroundColor: `${c}22` }]}>
                  <Ionicons
                    name={item.type === 'weapon' ? 'flash' : item.type === 'armor' ? 'shield' : item.type === 'potion' ? 'flask' : item.type === 'artifact' ? 'diamond' : 'cube'}
                    size={22} color={c}
                  />
                </View>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                {item.stat && <Text style={[styles.itemStat, { color: c }]}>{item.stat}</Text>}
                {counts[item.id] > 1 && (
                  <View style={styles.qty}><Text style={styles.qtyText}>×{counts[item.id]}</Text></View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={!!openItem} transparent animationType="fade" onRequestClose={() => setOpenItem(null)}>
        {openItem && (
          <View style={styles.modalBg}>
            <View style={[styles.modalCard, { borderColor: RARITY_COLOR[openItem.rarity] }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalRarity, { color: RARITY_COLOR[openItem.rarity] }]}>{openItem.rarity.toUpperCase()}</Text>
                <TouchableOpacity onPress={() => setOpenItem(null)}>
                  <Ionicons name="close" size={22} color={COLORS.gold} />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalTitle}>{openItem.name}</Text>
              {openItem.stat && <Text style={[styles.modalStat, { color: RARITY_COLOR[openItem.rarity] }]}>{openItem.stat}</Text>}
              <Text style={styles.modalDesc}>{openItem.desc}</Text>
              <View style={styles.modalDivider} />
              <Text style={styles.loreLabel}>LORE</Text>
              <Text style={styles.modalLore}>"{openItem.lore}"</Text>

              <TouchableOpacity onPress={() => onUse(openItem)} style={styles.useBtn}>
                <Text style={styles.useText}>
                  {openItem.type === 'potion' ? 'DRINK' : openItem.type === 'material' ? 'KEEP' : 'EQUIP'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

function EquipSlot({ label, item, icon }: { label: string; item?: Item; icon: any }) {
  const c = item ? RARITY_COLOR[item.rarity] : 'rgba(212,175,55,0.3)';
  return (
    <View style={[styles.slot, { borderColor: c }]}>
      <Ionicons name={icon} size={20} color={item ? c : COLORS.silver} />
      <Text style={styles.slotLabel}>{label}</Text>
      <Text style={[styles.slotItem, { color: item ? COLORS.parchment : COLORS.silver, opacity: item ? 1 : 0.5 }]} numberOfLines={1}>
        {item ? item.name : 'empty'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { color: COLORS.gold, fontSize: 22, fontWeight: '300', letterSpacing: 4 },
  subheading: { color: COLORS.silver, fontSize: 11, fontStyle: 'italic', opacity: 0.7, marginTop: 4 },
  sectionLabel: { color: COLORS.gold, fontSize: 10, letterSpacing: 2.5, marginBottom: 10 },
  equippedRow: { flexDirection: 'row', gap: 8 },
  slot: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, backgroundColor: 'rgba(45,27,78,0.3)' },
  slotLabel: { color: COLORS.gold, fontSize: 9, letterSpacing: 2, marginTop: 6 },
  slotItem: { fontSize: 11, marginTop: 4, textAlign: 'center' },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)', backgroundColor: 'rgba(45,27,78,0.3)' },
  filterActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  filterText: { color: COLORS.silver, fontSize: 10, letterSpacing: 1.5, fontWeight: '600' },
  filterTextActive: { color: COLORS.bgDeep },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 18, marginTop: 14 },
  itemCard: { width: '47%', borderWidth: 1, borderRadius: 14, padding: 12, backgroundColor: 'rgba(10,17,40,0.6)', alignItems: 'center', overflow: 'hidden', position: 'relative' },
  rarityStripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  itemIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 8 },
  itemName: { color: COLORS.parchment, fontSize: 12, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  itemStat: { fontSize: 10, fontWeight: '600', letterSpacing: 1 },
  qty: { position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.bgDeep, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: COLORS.gold },
  qtyText: { color: COLORS.gold, fontSize: 10, fontWeight: '700' },
  modalBg: { flex: 1, backgroundColor: 'rgba(5,8,23,0.85)', justifyContent: 'center', padding: 18 },
  modalCard: { backgroundColor: COLORS.ink, borderRadius: 18, borderWidth: 2, padding: 22 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalRarity: { fontSize: 10, letterSpacing: 2.5, fontWeight: '700' },
  modalTitle: { color: COLORS.parchment, fontSize: 24, fontWeight: '300', letterSpacing: 1, marginBottom: 6 },
  modalStat: { fontSize: 14, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  modalDesc: { color: COLORS.silver, fontSize: 13, lineHeight: 19 },
  modalDivider: { height: 1, backgroundColor: 'rgba(212,175,55,0.25)', marginVertical: 14 },
  loreLabel: { color: COLORS.gold, fontSize: 9, letterSpacing: 2.5, marginBottom: 6 },
  modalLore: { color: COLORS.parchment, fontSize: 13, fontStyle: 'italic', lineHeight: 19 },
  useBtn: { backgroundColor: COLORS.gold, paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 18 },
  useText: { color: COLORS.bgDeep, fontWeight: '700', letterSpacing: 2, fontSize: 13 },
});

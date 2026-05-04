import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Modal, Image, Animated as RNAnimated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, ITEMS, RARITY_COLOR } from './lib/gameData';
import {
  ENEMIES, PLAYER_ABILITIES, computeElementalDamage, statusFromTile,
  CombatAbility, Enemy, ElementType, StatusType, TileEffect,
} from './lib/combatData';
import { useGame } from './lib/gameStore';
import FloatingNumber, { FloatingNum } from './components/FloatingNumber';

const { width } = Dimensions.get('window');
const GRID_SIZE = 5;
const GRID_PAD = 12;
const GRID_W = width - 24;
const TILE = (GRID_W - GRID_PAD * 2) / GRID_SIZE;

type Unit = {
  uid: string;
  side: 'player' | 'enemy';
  enemyKey?: string;
  name: string;
  x: number; y: number;
  hp: number; hpMax: number;
  mp: number; mpMax: number;
  atk: number; def: number;
  speed: number; range: number;
  statuses: { type: StatusType; turns: number }[];
  abilities: CombatAbility[];
  resistances: ElementType[];
  weaknesses: ElementType[];
  color: string;
  icon: string;
  alive: boolean;
  shieldHp?: number;
};

type Mode = 'idle' | 'move' | 'target';

export default function CombatScreen() {
  const { character, hydrated, pendingEncounter, clearEncounter, setHpMp, addGold, addItem, gainXP, usePotion, trainSkill } = useGame();

  useEffect(() => {
    if (hydrated && !character) router.replace('/');
  }, [character, hydrated]);

  const params = useLocalSearchParams<{ enemies?: string; regionId?: string }>();

  const enemyIds = useMemo(() => {
    if (pendingEncounter?.enemyIds) return pendingEncounter.enemyIds;
    if (params.enemies) return String(params.enemies).split(',');
    return ['bandit'];
  }, []);

  // Build initial units
  const [units, setUnits] = useState<Unit[]>(() => {
    if (!character) return [];
    const playerWeapon = ITEMS.find(i => i.id === character.equipped.weapon);
    const playerArmor = ITEMS.find(i => i.id === character.equipped.armor);
    const weaponBonus = playerWeapon ? parseInt(playerWeapon.stat?.replace(/[^0-9]/g, '') || '0') : 0;
    const armorBonus = playerArmor ? parseInt(playerArmor.stat?.replace(/[^0-9]/g, '') || '0') : 0;

    const player: Unit = {
      uid: 'p1',
      side: 'player',
      name: character.name,
      x: 0, y: 4,
      hp: character.hp, hpMax: character.hpMax,
      mp: character.mp, mpMax: character.mpMax,
      atk: 5 + Math.floor((character.attributes.Strength || 10) / 2) + weaponBonus,
      def: armorBonus,
      speed: 2 + Math.floor((character.attributes.Agility || 10) / 8),
      range: 1,
      statuses: [],
      abilities: PLAYER_ABILITIES.filter(a => !a.requiresSkill || character.unlockedSkills.includes(a.requiresSkill)),
      resistances: [],
      weaknesses: [],
      color: COLORS.gold,
      icon: 'person',
      alive: true,
    };

    const enemyUnits: Unit[] = enemyIds.map((eid, i) => {
      const e = ENEMIES[eid];
      const slots = [{ x: 4, y: 0 }, { x: 3, y: 1 }, { x: 4, y: 2 }, { x: 2, y: 0 }];
      const pos = slots[i] || { x: 4, y: i };
      return {
        uid: `e${i}`,
        side: 'enemy',
        enemyKey: eid,
        name: e.name,
        x: pos.x, y: pos.y,
        hp: e.hp, hpMax: e.hp,
        mp: 50, mpMax: 50,
        atk: e.atk, def: e.def,
        speed: e.speed, range: e.range,
        statuses: [],
        abilities: e.abilities,
        resistances: e.resistances || [],
        weaknesses: e.weaknesses || [],
        color: e.color,
        icon: e.icon,
        alive: true,
      };
    });

    return [player, ...enemyUnits];
  });

  const [tiles, setTiles] = useState<TileEffect[][]>(() => Array(5).fill(0).map(() => Array(5).fill(null)));
  const [turn, setTurn] = useState<'player' | 'enemy'>('player');
  const [ap, setAp] = useState(2);
  const [mode, setMode] = useState<Mode>('idle');
  const [selectedAbility, setSelectedAbility] = useState<CombatAbility | null>(null);
  const [log, setLog] = useState<string[]>(['The air tightens. Combat begins.']);
  const [floats, setFloats] = useState<FloatingNum[]>([]);
  const [result, setResult] = useState<'ongoing' | 'victory' | 'defeat'>('ongoing');
  const [rewards, setRewards] = useState<{ xp: number; gold: number; items: string[] } | null>(null);
  const floatId = useRef(0);

  const player = units.find(u => u.side === 'player');
  const enemiesAlive = units.filter(u => u.side === 'enemy' && u.alive);

  const addLog = useCallback((s: string) => setLog(prev => [...prev.slice(-15), s]), []);

  const popFloat = useCallback((x: number, y: number, text: string, color: string, big?: boolean) => {
    floatId.current += 1;
    const id = `f${floatId.current}`;
    const px = GRID_PAD + x * TILE + TILE / 2;
    const py = GRID_PAD + y * TILE + TILE / 2;
    setFloats(prev => [...prev, { id, x: px, y: py, text, color, big }]);
  }, []);

  const removeFloat = useCallback((id: string) => setFloats(prev => prev.filter(f => f.id !== id)), []);

  // Check victory/defeat
  useEffect(() => {
    if (result !== 'ongoing') return;
    if (player && !player.alive) {
      setResult('defeat');
      return;
    }
    if (enemiesAlive.length === 0 && units.length > 0) {
      // Victory! Roll rewards
      const totalXp = units.filter(u => u.side === 'enemy').reduce((s, u) => s + (ENEMIES[u.enemyKey!]?.xp || 0), 0);
      const totalGold = units.filter(u => u.side === 'enemy').reduce((s, u) => {
        const e = ENEMIES[u.enemyKey!];
        return s + Math.floor(e.gold[0] + Math.random() * (e.gold[1] - e.gold[0]));
      }, 0);
      const drops: string[] = [];
      units.filter(u => u.side === 'enemy').forEach(u => {
        const e = ENEMIES[u.enemyKey!];
        e.loot.forEach(l => { if (Math.random() < l.chance) drops.push(l.itemId); });
      });
      setRewards({ xp: totalXp, gold: totalGold, items: drops });
      setResult('victory');
    }
  }, [units, player, enemiesAlive.length, result]);

  // Distance helper
  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

  // Determine valid tiles for movement (orthogonal, within speed)
  const validMoveTiles = useMemo(() => {
    if (mode !== 'move' || !player || turn !== 'player') return [];
    const tilesArr: { x: number; y: number }[] = [];
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
      if (x === player.x && y === player.y) continue;
      const d = dist(player, { x, y });
      if (d === 0 || d > 2) continue;
      // Don't allow stepping onto another unit
      if (units.some(u => u.alive && u.x === x && u.y === y)) continue;
      tilesArr.push({ x, y });
    }
    return tilesArr;
  }, [mode, player?.x, player?.y, turn, units]);

  const validTargetTiles = useMemo(() => {
    if (mode !== 'target' || !selectedAbility || !player) return [];
    const arr: { x: number; y: number; targetUid?: string }[] = [];
    if (selectedAbility.range === 0 || selectedAbility.aoe === 'self') {
      arr.push({ x: player.x, y: player.y });
      return arr;
    }
    // Healing on allies (player only, just self)
    if (selectedAbility.heal) {
      arr.push({ x: player.x, y: player.y });
      return arr;
    }
    // Damage abilities target enemies in range
    units.forEach(u => {
      if (u.side === 'enemy' && u.alive && dist(player, u) <= selectedAbility.range) {
        arr.push({ x: u.x, y: u.y, targetUid: u.uid });
      }
    });
    return arr;
  }, [mode, selectedAbility, player?.x, player?.y, units]);

  // === ACTIONS ===
  const consumeAP = (cost: number) => setAp(prev => Math.max(0, prev - cost));

  const applyDamage = useCallback((target: Unit, amount: number, attackerSide: 'player' | 'enemy', element: ElementType, sourceName: string) => {
    setUnits(prev => prev.map(u => {
      if (u.uid !== target.uid) return u;
      let dmg = Math.max(1, amount - (u.def || 0));
      // Shield absorb
      let shield = u.shieldHp || 0;
      if (shield > 0) {
        const absorbed = Math.min(shield, dmg);
        shield -= absorbed;
        dmg -= absorbed;
      }
      const newHp = Math.max(0, u.hp - dmg);
      popFloat(u.x, u.y, `-${dmg}`, attackerSide === 'player' ? '#FBBF24' : '#F87171', dmg >= 15);
      return { ...u, hp: newHp, alive: newHp > 0, shieldHp: shield };
    }));
    addLog(`${sourceName} hits ${target.name} for ${amount}.`);
  }, [popFloat, addLog]);

  const applyStatus = (uid: string, status: StatusType, turns: number) => {
    setUnits(prev => prev.map(u => {
      if (u.uid !== uid) return u;
      const filtered = u.statuses.filter(s => s.type !== status);
      return { ...u, statuses: [...filtered, { type: status, turns }] };
    }));
  };

  const setTile = (x: number, y: number, eff: TileEffect) => {
    setTiles(prev => {
      const next = prev.map(r => [...r]);
      next[y][x] = eff;
      return next;
    });
  };

  // Resolve an ability: source -> target tile
  const resolveAbility = useCallback((source: Unit, ab: CombatAbility, tx: number, ty: number) => {
    addLog(`${source.name} uses ${ab.name}.`);

    if (ab.heal && ab.heal > 0) {
      const targets = source.side === 'player' ? [source] : [source];
      targets.forEach(t => {
        const heal = ab.heal!;
        setUnits(prev => prev.map(u => u.uid === t.uid ? { ...u, hp: Math.min(u.hpMax, u.hp + heal) } : u));
        popFloat(t.x, t.y, `+${heal}`, '#10B981');
      });
    }

    if (ab.applies && (ab.aoe === 'self' || ab.range === 0)) {
      // self buff (e.g. Frost Ward)
      if (ab.applies.status === 'shielded') {
        setUnits(prev => prev.map(u => u.uid === source.uid ? { ...u, shieldHp: 18, statuses: [...u.statuses.filter(s => s.type !== 'shielded'), { type: 'shielded', turns: ab.applies!.turns }] } : u));
        popFloat(source.x, source.y, 'WARD', '#60A5FA');
      } else {
        applyStatus(source.uid, ab.applies.status, ab.applies.turns);
      }
    }

    if (ab.tileEffect) {
      setTile(tx, ty, ab.tileEffect);
      addLog(`A patch of ${ab.tileEffect} spreads.`);
    }

    if (ab.damage > 0) {
      // Determine targets
      let targetUnits: Unit[] = [];
      const direct = units.find(u => u.alive && u.x === tx && u.y === ty && u.side !== source.side);
      if (direct) targetUnits.push(direct);
      if (ab.aoe === 'splash') {
        units.forEach(u => {
          if (u.alive && u.side !== source.side && u.uid !== direct?.uid && Math.abs(u.x - tx) + Math.abs(u.y - ty) <= 1) {
            targetUnits.push(u);
          }
        });
      }
      // Lightning chains to wet
      if (ab.element === 'lightning') {
        units.forEach(u => {
          if (u.alive && u.side !== source.side && !targetUnits.includes(u) && u.statuses.some(s => s.type === 'wet')) {
            targetUnits.push(u);
          }
        });
      }

      targetUnits.forEach(t => {
        const statuses = t.statuses.map(s => s.type);
        // Wet from water tile
        if (tiles[t.y][t.x] === 'water' && !statuses.includes('wet')) statuses.push('wet');
        if (tiles[t.y][t.x] === 'oil' && !statuses.includes('oiled')) statuses.push('oiled');
        const { damage, note } = computeElementalDamage(ab.damage + Math.floor(source.atk / 3), ab.element, t.resistances, t.weaknesses, statuses);
        applyDamage(t, damage, source.side, ab.element, ab.name);
        if (note) {
          setTimeout(() => popFloat(t.x, t.y, note.toUpperCase(), '#F472B6'), 200);
          addLog(`✦ ${note}`);
        }
        // Apply status effects from ability
        if (ab.applies && ab.applies.status !== 'shielded') {
          if (Math.random() < (ab.applies.chance ?? 1)) {
            applyStatus(t.uid, ab.applies.status, ab.applies.turns);
          }
        }
        // Tile reactions
        if (ab.element === 'fire' && tiles[t.y][t.x] === 'oil') {
          setTile(t.x, t.y, 'fire');
          applyStatus(t.uid, 'burning', 2);
          addLog('The oil ignites!');
        }
        if (ab.element === 'frost' && tiles[t.y][t.x] === 'water') {
          setTile(t.x, t.y, 'frost');
          applyStatus(t.uid, 'frozen', 2);
          addLog('The water freezes solid.');
        }
      });
    }
  }, [units, tiles, popFloat, applyDamage, addLog]);

  // === PLAYER ACTIONS ===
  const onTilePress = (x: number, y: number) => {
    if (turn !== 'player' || !player || result !== 'ongoing') return;

    if (mode === 'move') {
      const valid = validMoveTiles.find(t => t.x === x && t.y === y);
      if (!valid) return;
      setUnits(prev => prev.map(u => u.uid === player.uid ? { ...u, x, y } : u));
      // Pick up tile status effect on stepping onto hazard
      const eff = tiles[y][x];
      if (eff) {
        const st = statusFromTile(eff);
        if (st) applyStatus(player.uid, st, 2);
      }
      consumeAP(1);
      setMode('idle');
      addLog(`${player.name} moves.`);
      return;
    }

    if (mode === 'target' && selectedAbility) {
      const ok = validTargetTiles.find(t => t.x === x && t.y === y);
      if (!ok) return;
      // Pay costs
      const ab = selectedAbility;
      if ((ab.mpCost || 0) > player.mp) { addLog('Not enough aether.'); return; }
      setUnits(prev => prev.map(u => u.uid === player.uid ? { ...u, mp: u.mp - (ab.mpCost || 0), hp: u.hp - (ab.hpCost || 0) } : u));
      resolveAbility(player, ab, x, y);
      // Use-based progression: each skill-gated ability trains its underlying skill.
      // trainSkill also auto-unlocks any prerequisite-chained skill once threshold is met.
      if (ab.requiresSkill) trainSkill(ab.requiresSkill, 1);
      consumeAP(ab.apCost);
      setMode('idle');
      setSelectedAbility(null);
    }
  };

  const startMove = () => {
    if (turn !== 'player' || ap < 1) return;
    setMode(prev => prev === 'move' ? 'idle' : 'move');
    setSelectedAbility(null);
  };

  const selectAbility = (ab: CombatAbility) => {
    if (turn !== 'player' || result !== 'ongoing') return;
    if (ap < ab.apCost) { addLog('Not enough actions.'); return; }
    if ((ab.mpCost || 0) > (player?.mp || 0)) { addLog('Not enough aether.'); return; }
    setSelectedAbility(ab);
    setMode('target');
  };

  const endTurn = useCallback(() => {
    if (result !== 'ongoing') return;
    setMode('idle');
    setSelectedAbility(null);
    // Tick player statuses, take DOT
    setUnits(prev => prev.map(u => {
      if (u.side !== 'player' || !u.alive) return u;
      let hp = u.hp;
      const newStatuses = u.statuses.map(s => ({ ...s, turns: s.turns - 1 })).filter(s => s.turns > 0);
      if (u.statuses.some(s => s.type === 'burning')) { hp = Math.max(0, hp - 4); popFloat(u.x, u.y, '-4', '#F87171'); }
      if (u.statuses.some(s => s.type === 'bleeding')) { hp = Math.max(0, hp - 3); popFloat(u.x, u.y, '-3', '#DC2626'); }
      return { ...u, hp, alive: hp > 0, statuses: newStatuses };
    }));
    setTurn('enemy');
  }, [popFloat, result]);

  // === ENEMY AI ===
  useEffect(() => {
    if (turn !== 'enemy' || result !== 'ongoing') return;
    const aliveEnemies = units.filter(u => u.side === 'enemy' && u.alive);
    if (aliveEnemies.length === 0) {
      setTurn('player'); setAp(2); return;
    }

    let i = 0;
    const tickEnemy = () => {
      if (i >= aliveEnemies.length) {
        // Tick enemy statuses + restore player AP
        setUnits(prev => prev.map(u => {
          if (u.side !== 'enemy' || !u.alive) return u;
          let hp = u.hp;
          const newStatuses = u.statuses.map(s => ({ ...s, turns: s.turns - 1 })).filter(s => s.turns > 0);
          if (u.statuses.some(s => s.type === 'burning')) { hp = Math.max(0, hp - 4); popFloat(u.x, u.y, '-4', '#F87171'); }
          if (u.statuses.some(s => s.type === 'bleeding')) { hp = Math.max(0, hp - 3); popFloat(u.x, u.y, '-3', '#DC2626'); }
          return { ...u, hp, alive: hp > 0, statuses: newStatuses };
        }));
        setTurn('player');
        setAp(2);
        // Regen 2 MP per turn
        setUnits(prev => prev.map(u => u.side === 'player' ? { ...u, mp: Math.min(u.mpMax, u.mp + 3) } : u));
        return;
      }
      const enemy = aliveEnemies[i];
      // Re-fetch live unit
      setUnits(currentUnits => {
        const e = currentUnits.find(u => u.uid === enemy.uid);
        const p = currentUnits.find(u => u.side === 'player');
        if (!e || !e.alive || !p || !p.alive) return currentUnits;

        // Skip if stunned/frozen
        if (e.statuses.some(s => s.type === 'stunned' || s.type === 'frozen')) {
          addLog(`${e.name} is incapacitated.`);
          return currentUnits;
        }
        if (e.statuses.some(s => s.type === 'fearful') && Math.random() < 0.4) {
          addLog(`${e.name} hesitates in fear.`);
          return currentUnits;
        }

        // Pick best ability that's in range; otherwise move
        const reachable = e.abilities.filter(ab => Math.abs(e.x - p.x) + Math.abs(e.y - p.y) <= ab.range);
        if (reachable.length > 0) {
          const ab = reachable[Math.floor(Math.random() * reachable.length)];
          // Defer the resolve (need fresh state)
          setTimeout(() => resolveAbility(e, ab, p.x, p.y), 80);
          return currentUnits;
        }
        // Move toward player
        const moves: { x: number; y: number; d: number }[] = [];
        const candidates = [
          { x: e.x + 1, y: e.y }, { x: e.x - 1, y: e.y },
          { x: e.x, y: e.y + 1 }, { x: e.x, y: e.y - 1 },
        ];
        candidates.forEach(c => {
          if (c.x < 0 || c.x >= 5 || c.y < 0 || c.y >= 5) return;
          if (currentUnits.some(u => u.alive && u.x === c.x && u.y === c.y)) return;
          moves.push({ ...c, d: Math.abs(c.x - p.x) + Math.abs(c.y - p.y) });
        });
        moves.sort((a, b) => a.d - b.d);
        if (moves.length > 0) {
          const m = moves[0];
          addLog(`${e.name} advances.`);
          return currentUnits.map(u => u.uid === e.uid ? { ...u, x: m.x, y: m.y } : u);
        }
        return currentUnits;
      });
      i += 1;
      setTimeout(tickEnemy, 700);
    };

    setTimeout(tickEnemy, 500);
  }, [turn, result]);

  // Auto-end if no AP and no useful actions
  useEffect(() => {
    if (turn === 'player' && ap === 0 && result === 'ongoing') {
      const t = setTimeout(() => endTurn(), 600);
      return () => clearTimeout(t);
    }
  }, [ap, turn, result, endTurn]);

  // Sync HP/MP/gold/items back to character on victory or defeat
  useEffect(() => {
    if (result === 'victory' && rewards) {
      if (player) setHpMp(player.hp, player.mp);
      addGold(rewards.gold);
      gainXP(rewards.xp);
      rewards.items.forEach(id => addItem(id));
    }
    if (result === 'defeat' && player) {
      setHpMp(1, player.mp); // Survive at 1 HP
    }
  }, [result]);

  const onLeave = () => { clearEncounter(); router.replace('/game/world'); };

  // For wander-triggered encounters (canFlee), Flee is a real action: 80% chance
  // of clean exit. On the 20% failure, the player's turn ends (enemies attack)
  // and a small log entry shows the slip-up.
  const canFlee = pendingEncounter?.canFlee === true;
  const tryFlee = useCallback(() => {
    if (Math.random() < 0.8) {
      onLeave();
    } else {
      addLog('You break for the trees and fail to find them.');
      endTurn();
    }
  }, [endTurn]);

  if (!hydrated || !character) return null;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgDeep }}>
      <ScrollView contentContainerStyle={{ paddingTop: 50, paddingBottom: 220 }} showsVerticalScrollIndicator={false}>
        {/* Top: enemies status */}
        <View style={styles.enemyBar}>
          {units.filter(u => u.side === 'enemy').map(e => (
            <View key={e.uid} style={[styles.enemyChip, !e.alive && { opacity: 0.3 }]}>
              <View style={[styles.enemyChipDot, { backgroundColor: e.color }]}>
                <Ionicons name={e.icon as any} size={12} color={COLORS.bgDeep} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.enemyChipName} numberOfLines={1}>{e.name}</Text>
                <View style={styles.enemyHpBar}>
                  <View style={[styles.enemyHpFill, { width: `${(e.hp / e.hpMax) * 100}%`, backgroundColor: e.color }]} />
                </View>
              </View>
              {e.statuses.length > 0 && (
                <View style={styles.statusRow}>
                  {e.statuses.slice(0, 3).map((s, i) => (
                    <Text key={i} style={[styles.statusBadge, { color: statusColor(s.type) }]}>{s.type[0].toUpperCase()}</Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Turn indicator */}
        <View style={styles.turnRow}>
          <View style={[styles.turnPill, { backgroundColor: turn === 'player' ? COLORS.gold : 'rgba(220,38,38,0.7)' }]}>
            <Ionicons name={turn === 'player' ? 'person' : 'skull'} size={12} color={COLORS.bgDeep} />
            <Text style={styles.turnText}>{turn === 'player' ? 'YOUR TURN' : 'FOES MOVE'}</Text>
          </View>
          {turn === 'player' && (
            <View style={styles.apRow}>
              {[0, 1].map(i => (
                <View key={i} style={[styles.apDot, { backgroundColor: i < ap ? COLORS.gold : 'rgba(212,175,55,0.2)' }]} />
              ))}
              <Text style={styles.apLabel}>AP</Text>
            </View>
          )}
        </View>

        {/* Grid */}
        <View style={styles.gridWrap}>
          <View style={styles.grid}>
            {/* Tile grid */}
            {Array.from({ length: 5 }).map((_, y) => (
              <View key={y} style={{ flexDirection: 'row' }}>
                {Array.from({ length: 5 }).map((_, x) => {
                  const eff = tiles[y][x];
                  const isMoveOpt = mode === 'move' && validMoveTiles.some(t => t.x === x && t.y === y);
                  const isTargetOpt = mode === 'target' && validTargetTiles.some(t => t.x === x && t.y === y);
                  return (
                    <TouchableOpacity
                      key={x}
                      activeOpacity={0.7}
                      onPress={() => onTilePress(x, y)}
                      style={[
                        styles.tile,
                        { width: TILE, height: TILE },
                        eff && { backgroundColor: tileColor(eff) },
                        isMoveOpt && styles.tileMove,
                        isTargetOpt && styles.tileTarget,
                      ]}
                    >
                      {eff && <Text style={styles.tileEffLabel}>{eff[0].toUpperCase()}</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            {/* Units overlay */}
            {units.filter(u => u.alive).map(u => (
              <View
                key={u.uid}
                style={[
                  styles.unit,
                  {
                    left: GRID_PAD + u.x * TILE + TILE * 0.1,
                    top: GRID_PAD + u.y * TILE + TILE * 0.1,
                    width: TILE * 0.8, height: TILE * 0.8,
                    borderColor: u.color,
                    backgroundColor: u.side === 'player' ? 'rgba(212,175,55,0.18)' : 'rgba(45,27,78,0.7)',
                  },
                ]}
              >
                <Ionicons name={u.icon as any} size={TILE * 0.32} color={u.color} />
                <View style={styles.unitHpBar}>
                  <View style={[styles.unitHpFill, { width: `${(u.hp / u.hpMax) * 100}%`, backgroundColor: u.side === 'player' ? COLORS.gold : COLORS.blood }]} />
                </View>
                {u.shieldHp && u.shieldHp > 0 && <View style={styles.shieldRing} />}
                {u.statuses.length > 0 && (
                  <View style={styles.unitStatuses}>
                    {u.statuses.slice(0, 2).map((s, i) => (
                      <Text key={i} style={[styles.statusBadgeSmall, { backgroundColor: statusColor(s.type) }]}>{s.type[0].toUpperCase()}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}

            {/* Floating numbers */}
            {floats.map(f => <FloatingNumber key={f.id} num={f} onDone={removeFloat} />)}
          </View>
        </View>

        {/* Player vitals */}
        {player && (
          <View style={styles.vitals}>
            <View style={styles.vitalCol}>
              <View style={styles.vitalHeader}>
                <Ionicons name="heart" size={12} color={COLORS.blood} />
                <Text style={[styles.vitalLabel, { color: COLORS.blood }]}>HP {player.hp}/{player.hpMax}</Text>
              </View>
              <View style={styles.vitalBar}>
                <View style={[styles.vitalFill, { backgroundColor: COLORS.blood, width: `${(player.hp / player.hpMax) * 100}%` }]} />
              </View>
            </View>
            <View style={styles.vitalCol}>
              <View style={styles.vitalHeader}>
                <Ionicons name="sparkles" size={12} color={COLORS.arcane} />
                <Text style={[styles.vitalLabel, { color: COLORS.arcane }]}>MP {player.mp}/{player.mpMax}</Text>
              </View>
              <View style={styles.vitalBar}>
                <View style={[styles.vitalFill, { backgroundColor: COLORS.arcane, width: `${(player.mp / player.mpMax) * 100}%` }]} />
              </View>
            </View>
          </View>
        )}

        {/* Combat log */}
        <View style={styles.logBox}>
          {log.slice(-3).map((l, i) => (
            <Text key={i} style={[styles.logLine, i === log.slice(-3).length - 1 && { color: COLORS.gold, opacity: 1 }]}>· {l}</Text>
          ))}
        </View>
      </ScrollView>

      {/* ACTION BAR (fixed) */}
      <View style={styles.actionBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
          <ActionBtn
            icon="walk"
            label="Move"
            sub={`speed ${player?.speed || 0}`}
            active={mode === 'move'}
            disabled={turn !== 'player' || ap < 1 || result !== 'ongoing'}
            onPress={startMove}
            color={COLORS.silver}
          />
          {player?.abilities.map(ab => {
            const cantPay = (ab.mpCost || 0) > (player?.mp || 0) || ap < ab.apCost;
            return (
              <ActionBtn
                key={ab.id}
                icon={ab.icon}
                label={ab.name}
                sub={`${ab.apCost}AP${ab.mpCost ? ` · ${ab.mpCost}MP` : ''}`}
                active={selectedAbility?.id === ab.id}
                disabled={turn !== 'player' || cantPay || result !== 'ongoing'}
                onPress={() => selectAbility(ab)}
                color={elementColor(ab.element)}
              />
            );
          })}
          <ActionBtn
            icon="flask"
            label="Heal"
            sub="+25 HP"
            disabled={turn !== 'player' || result !== 'ongoing' || !character.inventory.includes('i11')}
            onPress={() => {
              if (!player) return;
              if (!character.inventory.includes('i11')) { addLog('No healing draughts left.'); return; }
              setUnits(prev => prev.map(u => u.uid === player.uid ? { ...u, hp: Math.min(u.hpMax, u.hp + 25) } : u));
              popFloat(player.x, player.y, '+25', '#10B981');
              addLog('You drink a healing draught.');
              usePotion('i11');
            }}
            color={'#10B981'}
          />

          <ActionBtn
            icon="play-skip-forward"
            label="End Turn"
            sub="·"
            disabled={turn !== 'player' || result !== 'ongoing'}
            onPress={endTurn}
            color={COLORS.gold}
          />
          <ActionBtn
            icon="exit-outline"
            label="Flee"
            sub={canFlee ? '80% clean' : 'lose battle'}
            disabled={result !== 'ongoing'}
            onPress={canFlee ? tryFlee : onLeave}
            color={COLORS.blood}
          />
        </ScrollView>
        {selectedAbility && (
          <Text style={styles.hint}>✦ {selectedAbility.desc}</Text>
        )}
        {mode === 'move' && <Text style={styles.hint}>Tap a glowing tile to move.</Text>}
      </View>

      {/* RESULT MODAL */}
      <Modal visible={result !== 'ongoing'} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { borderColor: result === 'victory' ? COLORS.gold : COLORS.blood }]}>
            <Text style={[styles.modalTitle, { color: result === 'victory' ? COLORS.gold : COLORS.blood }]}>
              {result === 'victory' ? '✦ VICTORY ✦' : '✦ DEFEATED ✦'}
            </Text>
            <Text style={styles.modalFlavor}>
              {result === 'victory'
                ? 'The realm remembers your blade.'
                : 'You fall — but the road remembers you, too. (Survive at 1 HP.)'}
            </Text>

            {result === 'victory' && rewards && (
              <View style={styles.rewardBox}>
                <View style={styles.rewardRow}>
                  <Ionicons name="star" size={14} color={COLORS.gold} />
                  <Text style={styles.rewardText}>+{rewards.xp} XP</Text>
                </View>
                <View style={styles.rewardRow}>
                  <Ionicons name="cash" size={14} color={COLORS.gold} />
                  <Text style={styles.rewardText}>+{rewards.gold} gold</Text>
                </View>
                {rewards.items.length === 0 && <Text style={styles.lootEmpty}>No relics dropped.</Text>}
                {rewards.items.length > 0 && (
                  <>
                    <Text style={styles.lootLabel}>RELICS RECOVERED</Text>
                    {rewards.items.map((id, i) => {
                      const it = ITEMS.find(it => it.id === id);
                      if (!it) return null;
                      return (
                        <View key={i} style={[styles.lootRow, { borderColor: RARITY_COLOR[it.rarity] }]}>
                          <Text style={[styles.lootName, { color: RARITY_COLOR[it.rarity] }]}>{it.name}</Text>
                          {it.stat && <Text style={styles.lootStat}>{it.stat}</Text>}
                        </View>
                      );
                    })}
                  </>
                )}
              </View>
            )}

            <TouchableOpacity onPress={onLeave} style={styles.modalBtn}>
              <Text style={styles.modalBtnText}>Return to the Realm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ActionBtn({ icon, label, sub, active, disabled, onPress, color }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.actionBtn,
        active && { borderColor: color, backgroundColor: `${color}22` },
        disabled && { opacity: 0.35 },
      ]}
    >
      <Ionicons name={icon as any} size={18} color={color} />
      <Text style={[styles.actionLabel, { color }]} numberOfLines={1}>{label}</Text>
      <Text style={styles.actionSub}>{sub}</Text>
    </TouchableOpacity>
  );
}

function elementColor(el: ElementType): string {
  switch (el) {
    case 'fire': return COLORS.ember;
    case 'frost': return '#60A5FA';
    case 'lightning': return '#FBBF24';
    case 'shadow': return '#7C3AED';
    case 'holy': return COLORS.divine;
    case 'arcane': return COLORS.arcane;
    default: return COLORS.silver;
  }
}

function tileColor(eff: TileEffect): string {
  switch (eff) {
    case 'oil': return 'rgba(120,80,40,0.55)';
    case 'water': return 'rgba(96,165,250,0.4)';
    case 'fire': return 'rgba(231,111,81,0.5)';
    case 'frost': return 'rgba(186,230,253,0.4)';
    default: return 'transparent';
  }
}

function statusColor(s: StatusType): string {
  switch (s) {
    case 'burning': return COLORS.ember;
    case 'frozen': return '#60A5FA';
    case 'wet': return '#3B82F6';
    case 'oiled': return '#92400E';
    case 'shocked': return '#FBBF24';
    case 'stunned': return '#9CA3AF';
    case 'shielded': return '#60A5FA';
    case 'fearful': return '#7C3AED';
    case 'bleeding': return COLORS.blood;
  }
}

const styles = StyleSheet.create({
  enemyBar: { paddingHorizontal: 12, gap: 6 },
  enemyChip: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, backgroundColor: 'rgba(45,27,78,0.4)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' },
  enemyChipDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  enemyChipName: { color: COLORS.parchment, fontSize: 12, fontWeight: '600' },
  enemyHpBar: { height: 4, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 2, marginTop: 4, overflow: 'hidden' },
  enemyHpFill: { height: '100%' },
  statusRow: { flexDirection: 'row', gap: 2 },
  statusBadge: { fontSize: 9, fontWeight: '700', letterSpacing: 1, paddingHorizontal: 4, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 3 },
  turnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, marginTop: 12, marginBottom: 6 },
  turnPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  turnText: { color: COLORS.bgDeep, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  apRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  apDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: COLORS.gold },
  apLabel: { color: COLORS.gold, fontSize: 10, marginLeft: 4, letterSpacing: 1.5, fontWeight: '700' },
  gridWrap: { paddingHorizontal: 12, marginTop: 8, alignItems: 'center' },
  grid: { width: GRID_W, height: GRID_W, padding: GRID_PAD, backgroundColor: COLORS.bgDark, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', position: 'relative' },
  tile: { borderWidth: 1, borderColor: 'rgba(212,175,55,0.1)', alignItems: 'center', justifyContent: 'center' },
  tileMove: { backgroundColor: 'rgba(212,175,55,0.18)', borderColor: COLORS.gold },
  tileTarget: { backgroundColor: 'rgba(220,38,38,0.18)', borderColor: COLORS.blood, borderWidth: 2 },
  tileEffLabel: { color: COLORS.parchment, fontSize: 10, fontWeight: '700', opacity: 0.6 },
  unit: { position: 'absolute', borderWidth: 2, borderRadius: 999, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 4 },
  unitHpBar: { position: 'absolute', bottom: -7, left: 4, right: 4, height: 3, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 1.5, overflow: 'hidden' },
  unitHpFill: { height: '100%' },
  shieldRing: { position: 'absolute', top: -3, left: -3, right: -3, bottom: -3, borderRadius: 999, borderWidth: 2, borderColor: '#60A5FA', opacity: 0.7 },
  unitStatuses: { position: 'absolute', top: -8, left: -8, flexDirection: 'row', gap: 1 },
  statusBadgeSmall: { color: '#fff', fontSize: 8, fontWeight: '900', paddingHorizontal: 3, paddingVertical: 1, borderRadius: 3, overflow: 'hidden' },
  vitals: { flexDirection: 'row', paddingHorizontal: 18, marginTop: 14, gap: 12 },
  vitalCol: { flex: 1 },
  vitalHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  vitalLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  vitalBar: { height: 6, backgroundColor: 'rgba(45,27,78,0.5)', borderRadius: 3, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)', overflow: 'hidden' },
  vitalFill: { height: '100%' },
  logBox: { paddingHorizontal: 18, marginTop: 14 },
  logLine: { color: COLORS.silver, fontSize: 11, fontStyle: 'italic', opacity: 0.6, lineHeight: 16 },
  actionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.bgDeep, borderTopWidth: 1, borderColor: 'rgba(212,175,55,0.3)', paddingVertical: 10, paddingBottom: 18 },
  actionBtn: { width: 78, padding: 8, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)', backgroundColor: 'rgba(45,27,78,0.4)', alignItems: 'center', gap: 3 },
  actionLabel: { fontSize: 11, fontWeight: '700' },
  actionSub: { color: COLORS.silver, fontSize: 9, opacity: 0.7 },
  hint: { color: COLORS.gold, fontSize: 11, textAlign: 'center', paddingHorizontal: 18, marginTop: 8, fontStyle: 'italic' },
  modalBg: { flex: 1, backgroundColor: 'rgba(5,8,23,0.92)', justifyContent: 'center', padding: 18 },
  modalCard: { backgroundColor: COLORS.ink, borderRadius: 18, borderWidth: 2, padding: 24, alignItems: 'center' },
  modalTitle: { fontSize: 26, fontWeight: '300', letterSpacing: 4, marginBottom: 8 },
  modalFlavor: { color: COLORS.parchment, fontSize: 13, fontStyle: 'italic', textAlign: 'center', lineHeight: 19, marginBottom: 18 },
  rewardBox: { width: '100%', backgroundColor: 'rgba(212,175,55,0.08)', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', gap: 6 },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rewardText: { color: COLORS.gold, fontSize: 14, fontWeight: '700' },
  lootLabel: { color: COLORS.gold, fontSize: 10, letterSpacing: 2, marginTop: 8 },
  lootEmpty: { color: COLORS.silver, fontSize: 11, fontStyle: 'italic', opacity: 0.6, marginTop: 4 },
  lootRow: { padding: 8, borderWidth: 1, borderRadius: 6, marginTop: 4 },
  lootName: { fontSize: 13, fontWeight: '700' },
  lootStat: { color: COLORS.silver, fontSize: 11, marginTop: 2 },
  modalBtn: { backgroundColor: COLORS.gold, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, marginTop: 18 },
  modalBtnText: { color: COLORS.bgDeep, fontWeight: '700', letterSpacing: 1.5 },
});

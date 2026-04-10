import type { PlayerData } from './inventory';

export type SkillTreeId = 'power' | 'speed' | 'technique' | 'control' | 'special';

export type SkillNodeId =
  | 'power_n01' | 'power_n02' | 'power_n03' | 'power_n04' | 'power_n05' | 'power_n06' | 'power_n07' | 'power_n08'
  | 'speed_n01' | 'speed_n02' | 'speed_n03' | 'speed_n04' | 'speed_n05' | 'speed_n06' | 'speed_n07' | 'speed_n08'
  | 'technique_n01' | 'technique_n02' | 'technique_n03' | 'technique_n04' | 'technique_n05' | 'technique_n06' | 'technique_n07' | 'technique_n08'
  | 'control_n01' | 'control_n02' | 'control_n03' | 'control_n04' | 'control_n05' | 'control_n06' | 'control_n07' | 'control_n08'
  | 'special_n01' | 'special_n02' | 'special_n03' | 'special_n04' | 'special_n05' | 'special_n06' | 'special_n07' | 'special_n08';

export type SkillAbilityId =
  | 'abil_power_cast_finesse'
  | 'abil_power_fight_steady'
  | 'abil_speed_opening_surge'
  | 'abil_speed_last_push'
  | 'abil_control_smooth_drag'
  | 'abil_control_nearmiss_save'
  | 'abil_control_lock_on'
  | 'abil_luck_junk_ward'
  | 'abil_spec_first_sell_boost'
  | 'abil_spec_pedia_bonus';

export type SkillNodeKind = 'stat' | 'ability';

export interface SkillNodeDef {
  id: SkillNodeId;
  treeId: SkillTreeId;
  slot: string;
  costSp: number;
  requires: SkillNodeId[];
  name: string;
  description: string;
  kind: SkillNodeKind;
  abilityId?: SkillAbilityId;
  statBonus?: Partial<SkillStatBonuses>;
}

export interface SkillStatBonuses {
  castDistSkillAdd: number;
  gaugeSpeedSkillAdd: number;
  barRangeSkillAdd: number;
  fightBarDragSkillAdd: number;
  sellPriceSkillMul: number;
  junkRateSkillMul: number;
}

export const SKILL_TREE_IDS: SkillTreeId[] = ['power', 'speed', 'technique', 'control', 'special'];

export const SKILL_TREE_LABELS: Record<SkillTreeId, string> = {
  power: 'パワー',
  speed: 'スピード',
  technique: 'テクニック',
  control: 'コントロール',
  special: '特殊',
};

const SLOT_ORDER = ['n01', 'n02', 'n03', 'n04', 'n05', 'n06', 'n07', 'n08'] as const;
type Slot = (typeof SLOT_ORDER)[number];

const COST_BY_SLOT: Record<Slot, number> = {
  n01: 1,
  n02: 2,
  n03: 3,
  n04: 2,
  n05: 2,
  n06: 5,
  n07: 3,
  n08: 3,
};

function nid(tree: SkillTreeId, slot: string): SkillNodeId {
  return `${tree}_${slot}` as SkillNodeId;
}

function requiresFor(tree: SkillTreeId, slot: Slot): SkillNodeId[] {
  switch (slot) {
    case 'n01':
      return [];
    case 'n02':
      return [nid(tree, 'n01')];
    case 'n03':
      return [nid(tree, 'n02')];
    case 'n04':
      return [nid(tree, 'n03')];
    case 'n05':
      return [nid(tree, 'n04')];
    case 'n06':
      return [nid(tree, 'n04'), nid(tree, 'n05')];
    case 'n07':
      return [nid(tree, 'n06')];
    case 'n08':
      return [nid(tree, 'n07')];
    default:
      return [];
  }
}

/** ツリー×スロットごとの表示・効果（仕様 10.10 準拠） */
const NODE_META: Record<
  SkillTreeId,
  Record<Slot, { name: string; description: string; kind: SkillNodeKind; abilityId?: SkillAbilityId; statBonus?: Partial<SkillStatBonuses> }>
> = {
  power: {
    n01: { name: 'パワー強化1', description: 'キャスト距離がわずかに伸びる。', kind: 'stat', statBonus: { castDistSkillAdd: 0.02 } },
    n02: { name: 'パワー強化2', description: 'キャスト距離がわずかに伸びる。', kind: 'stat', statBonus: { castDistSkillAdd: 0.02 } },
    n03: {
      name: '追い風キャスト',
      description: 'キャストゲージが最大付近で投げると、飛距離ボーナスが付く。',
      kind: 'ability',
      abilityId: 'abil_power_cast_finesse',
    },
    n04: { name: 'パワー強化3', description: 'キャスト距離が伸びる。', kind: 'stat', statBonus: { castDistSkillAdd: 0.03 } },
    n05: { name: 'パワー強化4', description: 'キャスト距離が伸びる。', kind: 'stat', statBonus: { castDistSkillAdd: 0.03 } },
    n06: {
      name: 'スタッガー',
      description: 'ファイト中「↑」で発動（1回まで）。短時間、魚の動きを止める。',
      kind: 'ability',
      abilityId: 'abil_power_fight_steady',
    },
    n07: { name: 'パワー強化5', description: 'キャスト距離が大きく伸びる。', kind: 'stat', statBonus: { castDistSkillAdd: 0.04 } },
    n08: { name: 'パワーマスター', description: 'キャスト距離がさらに伸びる。', kind: 'stat', statBonus: { castDistSkillAdd: 0.06 } },
  },
  speed: {
    n01: { name: 'スピード強化1', description: 'ヒット時のゲージ上昇がわずかに速くなる。', kind: 'stat', statBonus: { gaugeSpeedSkillAdd: 0.02 } },
    n02: { name: 'スピード強化2', description: 'ヒット時のゲージ上昇がわずかに速くなる。', kind: 'stat', statBonus: { gaugeSpeedSkillAdd: 0.02 } },
    n03: {
      name: '一点集中',
      description: 'ヒットゲージ中央に狭いクリティカル帯が出現。取り込むと上昇が速くなる。',
      kind: 'ability',
      abilityId: 'abil_speed_opening_surge',
    },
    n04: { name: 'スピード強化3', description: 'ゲージ上昇が速くなる。', kind: 'stat', statBonus: { gaugeSpeedSkillAdd: 0.03 } },
    n05: { name: 'スピード強化4', description: 'ゲージ上昇が速くなる。', kind: 'stat', statBonus: { gaugeSpeedSkillAdd: 0.03 } },
    n06: {
      name: '追い込み上手',
      description: 'ヒットを続けるほどゲージ上昇ボーナスが増える。外れるとリセット。',
      kind: 'ability',
      abilityId: 'abil_speed_last_push',
    },
    n07: { name: 'スピード強化5', description: 'ゲージ上昇が大きく速くなる。', kind: 'stat', statBonus: { gaugeSpeedSkillAdd: 0.04 } },
    n08: { name: 'スピードマスター', description: 'ゲージ上昇がさらに速くなる。', kind: 'stat', statBonus: { gaugeSpeedSkillAdd: 0.06 } },
  },
  technique: {
    n01: { name: 'テクニック強化1', description: 'ヒット判定帯がわずかに広がる。', kind: 'stat', statBonus: { barRangeSkillAdd: 0.01 } },
    n02: { name: 'テクニック強化2', description: 'ヒット判定帯がわずかに広がる。', kind: 'stat', statBonus: { barRangeSkillAdd: 0.01 } },
    n03: {
      name: 'フィッシャーズハイ',
      description: 'ファイト中「→」で発動（1回まで）。しばらく判定帯が大きくなる。',
      kind: 'ability',
      abilityId: 'abil_control_smooth_drag',
    },
    n04: { name: 'テクニック強化3', description: '判定帯が広がる。', kind: 'stat', statBonus: { barRangeSkillAdd: 0.015 } },
    n05: { name: 'テクニック強化4', description: '判定帯が広がる。', kind: 'stat', statBonus: { barRangeSkillAdd: 0.015 } },
    n06: {
      name: '不屈の構え',
      description: 'ファイトが長引くほど判定帯が少しずつ広がる（上限あり）。',
      kind: 'ability',
      abilityId: 'abil_control_nearmiss_save',
    },
    n07: { name: 'テクニック強化5', description: '判定帯が大きく広がる。', kind: 'stat', statBonus: { barRangeSkillAdd: 0.02 } },
    n08: { name: 'テクニックマスター', description: '判定帯がさらに広がる。', kind: 'stat', statBonus: { barRangeSkillAdd: 0.03 } },
  },
  control: {
    n01: { name: 'コントロール強化1', description: 'バーの慣性がわずかに抑えられる。', kind: 'stat', statBonus: { fightBarDragSkillAdd: 0.02 } },
    n02: { name: 'コントロール強化2', description: 'バーの慣性がわずかに抑えられる。', kind: 'stat', statBonus: { fightBarDragSkillAdd: 0.02 } },
    n03: {
      name: 'ロックオン',
      description: 'ファイト中「←」で発動（1回まで）。短時間、魚へバーが寄る。',
      kind: 'ability',
      abilityId: 'abil_control_lock_on',
    },
    n04: { name: 'コントロール強化3', description: '慣性がさらに抑えられる。', kind: 'stat', statBonus: { fightBarDragSkillAdd: 0.03 } },
    n05: { name: 'コントロール強化4', description: '慣性がさらに抑えられる。', kind: 'stat', statBonus: { fightBarDragSkillAdd: 0.03 } },
    n06: {
      name: 'シルクタッチ',
      description: 'ファイト開始時に魚が動き出すまでの時間が少し伸びる。',
      kind: 'ability',
      abilityId: 'abil_luck_junk_ward',
    },
    n07: { name: 'コントロール強化5', description: '慣性が大きく抑えられる。', kind: 'stat', statBonus: { fightBarDragSkillAdd: 0.04 } },
    n08: { name: 'コントロールマスター', description: '慣性がさらに抑えられる。', kind: 'stat', statBonus: { fightBarDragSkillAdd: 0.06 } },
  },
  special: {
    n01: { name: '話術強化1', description: '売却価格がわずかに上がる。', kind: 'stat', statBonus: { sellPriceSkillMul: 0.02 } },
    n02: { name: '話術強化2', description: '売却価格がわずかに上がる。', kind: 'stat', statBonus: { sellPriceSkillMul: 0.02 } },
    n03: {
      name: '研究熱心',
      description: '同じ魚を多く釣っているほど、その魚の経験値ボーナス（上限あり）。',
      kind: 'ability',
      abilityId: 'abil_spec_first_sell_boost',
    },
    n04: { name: '話術強化3', description: '売却価格が上がる。', kind: 'stat', statBonus: { sellPriceSkillMul: 0.03 } },
    n05: { name: '話術強化4', description: '売却価格が上がる。', kind: 'stat', statBonus: { sellPriceSkillMul: 0.03 } },
    n06: {
      name: 'サングラス',
      description: 'ファイト中、釣り上げ前の魚のレアリティが色でわかるようになる。',
      kind: 'ability',
      abilityId: 'abil_spec_pedia_bonus',
    },
    n07: { name: '話術強化5', description: '売却価格が大きく上がる。', kind: 'stat', statBonus: { sellPriceSkillMul: 0.04 } },
    n08: { name: '特殊マスター', description: '売却価格がさらに上がる。', kind: 'stat', statBonus: { sellPriceSkillMul: 0.05 } },
  },
};

function buildSkillNodes(): Record<SkillNodeId, SkillNodeDef> {
  const out = {} as Record<SkillNodeId, SkillNodeDef>;
  for (const tree of SKILL_TREE_IDS) {
    for (const slot of SLOT_ORDER) {
      const meta = NODE_META[tree][slot];
      const id = nid(tree, slot);
      out[id] = {
        id,
        treeId: tree,
        slot,
        costSp: COST_BY_SLOT[slot],
        requires: requiresFor(tree, slot),
        name: meta.name,
        description: meta.description,
        kind: meta.kind,
        abilityId: meta.abilityId,
        statBonus: meta.statBonus,
      };
    }
  }
  return out;
}

export const SKILL_NODES: Record<SkillNodeId, SkillNodeDef> = buildSkillNodes();

export function getSkillNodesForTree(treeId: SkillTreeId): SkillNodeDef[] {
  return SLOT_ORDER.map((slot) => SKILL_NODES[nid(treeId, slot)]);
}

export function getSkillNodeDef(nodeId: string): SkillNodeDef | undefined {
  return SKILL_NODES[nodeId as SkillNodeId];
}

export function getSkillStatBonuses(playerData: PlayerData): SkillStatBonuses {
  const bonuses: SkillStatBonuses = {
    castDistSkillAdd: 0,
    gaugeSpeedSkillAdd: 0,
    barRangeSkillAdd: 0,
    fightBarDragSkillAdd: 0,
    sellPriceSkillMul: 0,
    junkRateSkillMul: 1,
  };

  for (const nodeId of playerData.unlockedSkillNodes) {
    const def = SKILL_NODES[nodeId as SkillNodeId];
    if (!def?.statBonus) continue;
    const s = def.statBonus;
    bonuses.castDistSkillAdd += s.castDistSkillAdd || 0;
    bonuses.gaugeSpeedSkillAdd += s.gaugeSpeedSkillAdd || 0;
    bonuses.barRangeSkillAdd += s.barRangeSkillAdd || 0;
    bonuses.fightBarDragSkillAdd += s.fightBarDragSkillAdd || 0;
    bonuses.sellPriceSkillMul += s.sellPriceSkillMul || 0;
    if (s.junkRateSkillMul !== undefined) {
      bonuses.junkRateSkillMul *= s.junkRateSkillMul;
    }
  }

  return bonuses;
}

export function hasSkillAbility(playerData: PlayerData, abilityId: SkillAbilityId): boolean {
  for (const nodeId of playerData.unlockedSkillNodes) {
    const def = SKILL_NODES[nodeId as SkillNodeId];
    if (def?.abilityId === abilityId) return true;
  }
  return false;
}

export function getSellPriceMultiplier(playerData: PlayerData): number {
  return 1 + getSkillStatBonuses(playerData).sellPriceSkillMul;
}

export function getExpMultiplierForFish(playerData: PlayerData, fishId: string): number {
  if (!hasSkillAbility(playerData, 'abil_spec_first_sell_boost')) return 1;
  const caught = playerData.fishCaughtCounts.get(fishId) || 0;
  const bonus = Math.min(0.5, caught * 0.02);
  return 1 + bonus;
}

export function canUnlockSkillNode(playerData: PlayerData, nodeId: SkillNodeId): { ok: boolean; reason?: string } {
  const def = SKILL_NODES[nodeId];
  if (!def) return { ok: false, reason: '不明なスキルです。' };
  if (playerData.unlockedSkillNodes.has(nodeId)) {
    return { ok: false, reason: 'すでに解放済みです。' };
  }
  for (const req of def.requires) {
    if (!playerData.unlockedSkillNodes.has(req)) {
      return { ok: false, reason: '前提スキルが未解放です。' };
    }
  }
  if (playerData.skillPoints < def.costSp) {
    return { ok: false, reason: `SPが足りません（必要: ${def.costSp}）。` };
  }
  return { ok: true };
}

export function tryUnlockSkillNode(playerData: PlayerData, nodeId: SkillNodeId): { ok: boolean; reason?: string } {
  const check = canUnlockSkillNode(playerData, nodeId);
  if (!check.ok) return check;
  const def = SKILL_NODES[nodeId];
  playerData.skillPoints -= def.costSp;
  playerData.unlockedSkillNodes.add(nodeId);
  return { ok: true };
}

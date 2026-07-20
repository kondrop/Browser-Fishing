// 📋 動的クエスト生成

import { fishDatabase, getFishImagePath } from './fish';
import type { FishConfig } from './fishConfig';
import { Habitat, Rarity } from './fishTypes';
import type { PlayerData } from './inventory';
import {
  BOARD_QUEST_COUNT,
  type QuestConfig,
  type QuestTemplateId,
} from './questConfig';
import {
  rodConfigs,
  getBaitById,
  getItemImagePath,
  getLureById,
  getRodById,
} from './shopConfig';

const HABITAT_LABELS: Record<Habitat, string> = {
  [Habitat.FRESHWATER]: '淡水',
  [Habitat.SALTWATER]: '海水',
  [Habitat.STREAM]: '渓流',
};

interface TemplateDef {
  id: QuestTemplateId;
  emoji: string;
  weight: number;
  minLevel?: number;
}

const TEMPLATE_DEFS: TemplateDef[] = [
  { id: 'catch_junk', emoji: '🗑️', weight: 18 },
  { id: 'catch_fish', emoji: '🐟', weight: 22 },
  { id: 'catch_size_min', emoji: '📏', weight: 18 },
  { id: 'catch_rarity', emoji: '⭐', weight: 12, minLevel: 3 },
  { id: 'catch_size_max', emoji: '🐠', weight: 12 },
  { id: 'tension_max', emoji: '🔥', weight: 10, minLevel: 5 },
  { id: 'fight_duration', emoji: '⏱️', weight: 8, minLevel: 7 },
  { id: 'equipment', emoji: '🎒', weight: 14, minLevel: 2 },
  { id: 'environment', emoji: '🌊', weight: 16 },
];

const CATCH_TARGET_COUNT_RANGE: [number, number] = [1, 3];
const QUEST_COUNT_RANGE: [number, number] = [1, 3];
const RARITY_COUNT_RANGE: [number, number] = [3, 5];
const BOARD_QUEST_REWARD_MULTIPLIER = 1.5;
const MIN_SIZE_CM = 22;
const MAX_SIZE_CM = 11;
const QUEST_RARITY = Rarity.UNCOMMON;
const QUEST_RARITY_MAX = Rarity.EPIC;
const FIGHT_DURATION_SEC = 12;
const TENSION_MAX_TARGET = 2;
const REWARD_MONEY_PER_BASE = 75;
const REWARD_MONEY_FLAT = 80;
const REWARD_EXP_PER_BASE = 18;
const REWARD_EXP_FLAT = 25;

function getRealFish(): FishConfig[] {
  return fishDatabase.filter((f) => !f.id.startsWith('junk_'));
}

/** 特定魚クエスト用（レジェンダリーは未発見ネタバレ防止のため除外） */
function getQuestTargetFish(): FishConfig[] {
  return getRealFish().filter((f) => f.rarity !== Rarity.LEGENDARY);
}

function getJunkItems(): FishConfig[] {
  return fishDatabase.filter((f) => f.id.startsWith('junk_'));
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickTemplate(playerLevel: number): TemplateDef {
  const eligible = TEMPLATE_DEFS.filter((t) => (t.minLevel ?? 1) <= playerLevel);
  const total = eligible.reduce((sum, t) => sum + t.weight, 0);
  let roll = Math.random() * total;
  for (const t of eligible) {
    roll -= t.weight;
    if (roll <= 0) return t;
  }
  return eligible[0];
}

type EquipmentPick = { type: 'rod' | 'bait' | 'lure'; id: string; name: string };

function pickEquipment(playerData: PlayerData): EquipmentPick | null {
  const candidates: EquipmentPick[] = [];
  for (const rodId of playerData.ownedRods) {
    const rod = getRodById(rodId);
    if (rod) candidates.push({ type: 'rod', id: rodId, name: rod.name });
  }
  for (const bait of playerData.baits) {
    if (bait.count <= 0) continue;
    const cfg = getBaitById(bait.baitId);
    if (cfg) candidates.push({ type: 'bait', id: bait.baitId, name: cfg.name });
  }
  for (const lureId of playerData.ownedLures) {
    const lure = getLureById(lureId);
    if (lure) candidates.push({ type: 'lure', id: lureId, name: lure.name });
  }
  if (candidates.length === 0) {
    const basic = getRodById('rod_basic');
    if (basic) return { type: 'rod', id: 'rod_basic', name: basic.name };
  }
  return candidates.length > 0 ? pickRandom(candidates) : null;
}

function pickFishImage(fishes: FishConfig[]): string | undefined {
  return fishes.length > 0 ? getFishImagePath(pickRandom(fishes).id) : undefined;
}

function resolveQuestThumbnailImage(
  templateId: QuestTemplateId,
  options: {
    fish: FishConfig;
    realFish: FishConfig[];
    junkItems: FishConfig[];
    specificJunk: FishConfig | null;
    habitat: Habitat;
    equipment: EquipmentPick;
  },
): string | undefined {
  switch (templateId) {
    case 'catch_junk':
      return options.specificJunk
        ? getFishImagePath(options.specificJunk.id)
        : pickFishImage(options.junkItems);
    case 'catch_fish':
      return getFishImagePath(options.fish.id);
    case 'equipment':
      return getItemImagePath(options.equipment.id);
    case 'environment':
      return pickFishImage(options.realFish.filter((fish) => fish.habitat === options.habitat));
    case 'catch_size_min':
    case 'catch_size_max':
    case 'catch_rarity':
    case 'tension_max':
    case 'fight_duration':
      return pickFishImage(options.realFish);
    default:
      return undefined;
  }
}

function calcReward(
  templateId: QuestTemplateId,
  target: number,
): { money: number; exp: number } {
  const typeMul: Record<QuestTemplateId, number> = {
    catch_junk: 0.95,
    catch_fish: 1.2,
    catch_size_min: 1.4,
    catch_rarity: 2,
    catch_size_max: 1.1,
    tension_max: 2.2,
    fight_duration: 2.4,
    equipment: 1.3,
    environment: 1.15,
  };
  const base = target * 1.6 * typeMul[templateId];
  return {
    money: Math.round((base * REWARD_MONEY_PER_BASE + REWARD_MONEY_FLAT) * BOARD_QUEST_REWARD_MULTIPLIER),
    exp: Math.round((base * REWARD_EXP_PER_BASE + REWARD_EXP_FLAT) * BOARD_QUEST_REWARD_MULTIPLIER),
  };
}

function buildTitle(templateId: QuestTemplateId, ctx: Record<string, string>): string {
  const titles: Record<QuestTemplateId, string[]> = {
    catch_junk: ['環境美化', 'ゴミ拾い', '釣り場の清掃', '片付けボランティア', 'ゴミゼロ作戦'],
    catch_fish: [
      `${ctx.fishName}が欲しい`,
      `${ctx.fishName}の依頼`,
      `${ctx.fishName}狙い`,
      `${ctx.fishName}を求めて`,
      `${ctx.fishName}ハンター`,
    ],
    catch_size_min: ['大きめが欲しい', 'サイズアップ', '大物狙い', 'サイズの依頼', '大物ハンター'],
    catch_rarity: ['珍しい魚を', 'レアな一匹', 'レア釣りチャレンジ', '珍魚の依頼', '幻の魚を求めて'],
    catch_size_max: ['小さな魚でいい', 'ちびっ子釣り', '小物狙い', 'ミニマムチャレンジ', 'スモールフィッシュ'],
    tension_max: ['テンション入門', 'テンション管理', '限界ギリギリ', 'テンションMAXの達人'],
    fight_duration: ['じっくりファイト', '長丁場の釣り', '粘りの依頼', 'ファイトの極意'],
    equipment: [
      `${ctx.itemName}で釣って`,
      '道具の練習',
      `${ctx.itemName}の腕試し`,
      '装備チャレンジ',
      `${ctx.itemName}マスター`,
    ],
    environment: [
      `${ctx.environmentName}の魚`,
      '環境別の練習',
      `${ctx.environmentName}の依頼`,
      '釣り場の探索',
      `${ctx.environmentName}の達人`,
    ],
  };
  return pickRandom(titles[templateId]);
}

function buildDescription(templateId: QuestTemplateId, ctx: Record<string, string | number>): string {
  switch (templateId) {
    case 'catch_junk':
      return ctx.junkName
        ? `${ctx.junkName}を${ctx.count}個回収しよう`
        : `ゴミを${ctx.count}個片付けよう`;
    case 'catch_fish':
      return `${ctx.fishName}を${ctx.count}匹釣り上げよう`;
    case 'catch_size_min':
      return `${ctx.size}cm以上の魚を${ctx.count}匹釣り上げよう`;
    case 'catch_rarity':
      return `レア度${ctx.rarity}〜${ctx.maxRarity}の魚を${ctx.count}匹釣り上げよう`;
    case 'catch_size_max':
      return `${ctx.size}cm以下の魚を${ctx.count}匹釣り上げよう`;
    case 'tension_max':
      return `テンションMAXの状態で魚を${ctx.count}匹釣り上げよう`;
    case 'fight_duration':
      return `${ctx.duration}秒以上ファイトしてから魚を釣り上げよう`;
    case 'equipment':
      return `${ctx.itemName}を使って魚を${ctx.count}匹釣り上げよう`;
    case 'environment':
      return `${ctx.environmentName}の魚を${ctx.count}匹釣り上げよう`;
    default:
      return '魚を釣り上げよう';
  }
}

function createQuestId(): string {
  return `dyn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function generateDynamicQuest(playerData: PlayerData): QuestConfig {
  const template = pickTemplate(playerData.level);
  const countRange =
    template.id === 'catch_junk' ||
    template.id === 'catch_fish' ||
    template.id === 'equipment'
      ? CATCH_TARGET_COUNT_RANGE
      : template.id === 'catch_rarity'
        ? RARITY_COUNT_RANGE
        : QUEST_COUNT_RANGE;
  const [countMin, countMax] = countRange;
  const count = randomInt(countMin, countMax);

  const realFish = getRealFish();
  const questTargetFish = getQuestTargetFish();
  const fish = template.id === 'catch_fish'
    ? pickRandom(questTargetFish)
    : pickRandom(realFish);
  const junkItems = getJunkItems();
  const specificJunk = junkItems.length > 0 && Math.random() < 0.35 ? pickRandom(junkItems) : null;
  const habitat = pickRandom([Habitat.FRESHWATER, Habitat.SALTWATER, Habitat.STREAM]);
  const equipment = pickEquipment(playerData) ?? { type: 'rod' as const, id: 'rod_basic', name: '木の釣り竿' };
  const thumbnailImage = resolveQuestThumbnailImage(template.id, {
    fish,
    realFish,
    junkItems,
    specificJunk,
    habitat,
    equipment,
  });

  const rarityLabel = {
    [Rarity.COMMON]: '★',
    [Rarity.UNCOMMON]: '★★',
    [Rarity.RARE]: '★★★',
    [Rarity.EPIC]: '★★★★',
    [Rarity.LEGENDARY]: '★★★★★',
  };
  const minRarityLabel = rarityLabel[QUEST_RARITY];
  const maxRarityLabel = rarityLabel[QUEST_RARITY_MAX];

  const ctx: Record<string, string | number> = {
    count,
    fishName: fish.name,
    junkName: specificJunk?.name ?? '',
    size: template.id === 'catch_size_min' ? MIN_SIZE_CM : MAX_SIZE_CM,
    rarity: minRarityLabel,
    maxRarity: maxRarityLabel,
    duration: FIGHT_DURATION_SEC,
    itemName: equipment.name,
    environmentName: HABITAT_LABELS[habitat],
  };

  let condition: QuestConfig['condition'];
  let target = count;

  switch (template.id) {
    case 'catch_junk':
      condition = specificJunk
        ? { type: 'quest_catch_junk', target: count, fishId: specificJunk.id }
        : { type: 'quest_catch_junk', target: count };
      break;
    case 'catch_fish':
      condition = { type: 'quest_catch_fish', target: count, fishId: fish.id };
      break;
    case 'catch_size_min':
      condition = { type: 'quest_catch_size_min', target: count, minSize: MIN_SIZE_CM };
      break;
    case 'catch_rarity':
      condition = {
        type: 'quest_catch_rarity',
        target: count,
        rarity: QUEST_RARITY,
        maxRarity: QUEST_RARITY_MAX,
      };
      break;
    case 'catch_size_max':
      condition = { type: 'quest_catch_size_max', target: count, maxSize: MAX_SIZE_CM };
      break;
    case 'tension_max':
      target = TENSION_MAX_TARGET;
      condition = { type: 'quest_tension_max', target };
      ctx.count = target;
      break;
    case 'fight_duration':
      target = 1;
      condition = { type: 'quest_fight_duration', target: 1, minDuration: FIGHT_DURATION_SEC };
      ctx.count = 1;
      break;
    case 'equipment': {
      condition = {
        type: 'quest_equipment',
        target: count,
        equipmentType: equipment.type,
        equipmentId: equipment.id,
      };
      break;
    }
    case 'environment':
      condition = { type: 'quest_environment', target: count, habitat };
      break;
    default:
      condition = { type: 'quest_catch_fish', target: count, fishId: fish.id };
  }

  const reward = calcReward(template.id, target);

  return {
    id: createQuestId(),
    name: buildTitle(template.id, ctx as Record<string, string>),
    description: buildDescription(template.id, ctx),
    emoji: template.emoji,
    thumbnailImage,
    condition,
    reward,
    templateId: template.id,
    isDynamic: true,
  };
}

export const BOARD_QUEST_GENERATION_VERSION = 3;

const BOARD_QUEST_GEN_MAX_ATTEMPTS = 48;

/** 掲示板・進行中と内容が被らないよう、テンプレ＋条件の主要パラメータで一意キーを作る */
export function getQuestContentSignature(quest: QuestConfig): string {
  const templateKey = quest.templateId ?? quest.condition.type;
  const c = quest.condition;
  const parts: (string | number)[] = [templateKey, c.target];

  switch (c.type) {
    case 'quest_catch_junk':
      parts.push(c.fishId ?? '');
      break;
    case 'quest_catch_fish':
      parts.push(c.fishId ?? '');
      break;
    case 'quest_catch_rarity':
      parts.push(c.rarity ?? '', c.maxRarity ?? '');
      break;
    case 'quest_catch_size_min':
      parts.push(c.minSize ?? '');
      break;
    case 'quest_catch_size_max':
      parts.push(c.maxSize ?? '');
      break;
    case 'quest_fight_duration':
      parts.push(c.minDuration ?? '');
      break;
    case 'quest_equipment':
      parts.push(c.equipmentType ?? '', c.equipmentId ?? '');
      break;
    case 'quest_environment':
      parts.push(c.habitat ?? '');
      break;
    default:
      break;
  }

  return parts.join('|');
}

function collectBoardQuestContentSignatures(playerData: PlayerData): Set<string> {
  const sigs = new Set<string>();
  const ids = [...playerData.boardQuestIds, ...playerData.activeQuests];
  for (const id of ids) {
    const quest = playerData.questRegistry.get(id);
    if (quest) sigs.add(getQuestContentSignature(quest));
  }
  return sigs;
}

function generateUniqueDynamicQuest(
  playerData: PlayerData,
  usedSignatures: Set<string>,
): QuestConfig {
  for (let attempt = 0; attempt < BOARD_QUEST_GEN_MAX_ATTEMPTS; attempt++) {
    const quest = generateDynamicQuest(playerData);
    const sig = getQuestContentSignature(quest);
    if (!usedSignatures.has(sig)) {
      usedSignatures.add(sig);
      return quest;
    }
  }

  const fallback = generateDynamicQuest(playerData);
  usedSignatures.add(getQuestContentSignature(fallback));
  return fallback;
}

export function registerDynamicQuest(playerData: PlayerData, quest: QuestConfig): void {
  playerData.questRegistry.set(quest.id, quest);
}

/** 掲示板のクエストを全件差し替え（受注中・完了済みは保持） */
export function resetBoardQuests(playerData: PlayerData): void {
  const preserveIds = new Set<string>([
    ...playerData.activeQuests,
    ...playerData.completedQuestIds,
  ]);

  for (const id of playerData.boardQuestIds) {
    if (!preserveIds.has(id)) {
      playerData.questRegistry.delete(id);
    }
  }

  playerData.boardQuestIds = [];
  ensureBoardQuests(playerData);
  playerData.boardQuestGenerationVersion = BOARD_QUEST_GENERATION_VERSION;
}

export function migrateBoardQuestsIfNeeded(playerData: PlayerData): boolean {
  const version = playerData.boardQuestGenerationVersion ?? 1;
  if (version < BOARD_QUEST_GENERATION_VERSION) {
    resetBoardQuests(playerData);
    return true;
  }
  return false;
}

export function ensureBoardQuests(playerData: PlayerData): void {
  const activeAndBoardIds = new Set([
    ...playerData.boardQuestIds,
    ...playerData.activeQuests,
  ]);

  playerData.boardQuestIds = playerData.boardQuestIds.filter((id) => {
    const quest = playerData.questRegistry.get(id);
    return (
      quest &&
      !playerData.activeQuests.includes(id) &&
      !playerData.completedQuestIds.has(id)
    );
  });

  const usedSignatures = collectBoardQuestContentSignatures(playerData);

  while (playerData.boardQuestIds.length < BOARD_QUEST_COUNT) {
    const quest = generateUniqueDynamicQuest(playerData, usedSignatures);
    registerDynamicQuest(playerData, quest);
    if (!activeAndBoardIds.has(quest.id)) {
      playerData.boardQuestIds.push(quest.id);
      activeAndBoardIds.add(quest.id);
    }
  }
}

export function getHabitatLabel(habitat: string): string {
  return HABITAT_LABELS[habitat as Habitat] ?? habitat;
}

export function getEquipmentName(type: 'rod' | 'bait' | 'lure', id: string): string {
  if (type === 'rod') return getRodById(id)?.name ?? rodConfigs.find((r) => r.id === id)?.name ?? id;
  if (type === 'bait') return getBaitById(id)?.name ?? id;
  return getLureById(id)?.name ?? id;
}

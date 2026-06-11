// 📋 動的クエスト生成

import { fishDatabase } from './fish';
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

const QUEST_COUNT_RANGE: [number, number] = [4, 7];
const JUNK_COUNT_RANGE: [number, number] = [4, 6];
const MIN_SIZE_CM = 22;
const MAX_SIZE_CM = 11;
const QUEST_RARITY = Rarity.RARE;
const FIGHT_DURATION_SEC = 12;
const TENSION_MAX_TARGET = 2;

function getRealFish(): FishConfig[] {
  return fishDatabase.filter((f) => !f.id.startsWith('junk_'));
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
    money: Math.round(base * 35 + 30),
    exp: Math.round(base * 12 + 15),
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
      return `レア度${ctx.rarity}以上の魚を${ctx.count}匹釣り上げよう`;
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
  const useJunkCount = template.id === 'catch_junk';
  const [countMin, countMax] = useJunkCount ? JUNK_COUNT_RANGE : QUEST_COUNT_RANGE;
  const count = randomInt(countMin, countMax);

  const fish = pickRandom(getRealFish());
  const junkItems = getJunkItems();
  const specificJunk = junkItems.length > 0 && Math.random() < 0.35 ? pickRandom(junkItems) : null;
  const habitat = pickRandom([Habitat.FRESHWATER, Habitat.SALTWATER, Habitat.STREAM]);
  const equipment = pickEquipment(playerData);

  const rarityLabel = {
    [Rarity.COMMON]: '★',
    [Rarity.UNCOMMON]: '★★',
    [Rarity.RARE]: '★★★',
    [Rarity.EPIC]: '★★★★',
    [Rarity.LEGENDARY]: '★★★★★',
  }[QUEST_RARITY];

  const ctx: Record<string, string | number> = {
    count,
    fishName: fish.name,
    junkName: specificJunk?.name ?? '',
    size: template.id === 'catch_size_min' ? MIN_SIZE_CM : MAX_SIZE_CM,
    rarity: rarityLabel,
    duration: FIGHT_DURATION_SEC,
    itemName: equipment?.name ?? '木の釣り竿',
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
      condition = { type: 'quest_catch_rarity', target: count, rarity: QUEST_RARITY };
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
      const eq = equipment ?? { type: 'rod' as const, id: 'rod_basic', name: '木の釣り竿' };
      condition = {
        type: 'quest_equipment',
        target: count,
        equipmentType: eq.type,
        equipmentId: eq.id,
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
    condition,
    reward,
    templateId: template.id,
    isDynamic: true,
  };
}

export function registerDynamicQuest(playerData: PlayerData, quest: QuestConfig): void {
  playerData.questRegistry.set(quest.id, quest);
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

  while (playerData.boardQuestIds.length < BOARD_QUEST_COUNT) {
    const quest = generateDynamicQuest(playerData);
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

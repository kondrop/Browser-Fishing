// 📋 クエスト進行ロジック

import type { FishConfig } from './fishConfig';
import { Rarity } from './fishTypes';
import type { PlayerData } from './inventory';
import { addExp } from './inventory';
import {
  MAX_ACTIVE_QUESTS,
  type QuestCondition,
  type QuestConfig,
  getStaticQuestById,
} from './questConfig';
import { ensureBoardQuests } from './questGenerator';

const RARITY_ORDER: Rarity[] = [
  Rarity.COMMON,
  Rarity.UNCOMMON,
  Rarity.RARE,
  Rarity.EPIC,
  Rarity.LEGENDARY,
];

const TENSION_MAX_THRESHOLD = 0.92;

export interface QuestCatchContext {
  fishSize?: number;
  tensionAtCatch: number;
  fightDurationSec: number;
  equippedRodId: string;
  equippedBaitId: string | null;
  equippedLureId: string | null;
}

function rarityMeetsMinimum(fishRarity: Rarity, minimum: string): boolean {
  const fishIdx = RARITY_ORDER.indexOf(fishRarity);
  const minIdx = RARITY_ORDER.indexOf(minimum as Rarity);
  if (fishIdx < 0 || minIdx < 0) return false;
  return fishIdx >= minIdx;
}

function rarityMeetsMaximum(fishRarity: Rarity, maximum: string): boolean {
  const fishIdx = RARITY_ORDER.indexOf(fishRarity);
  const maxIdx = RARITY_ORDER.indexOf(maximum as Rarity);
  if (fishIdx < 0 || maxIdx < 0) return false;
  return fishIdx <= maxIdx;
}

export function resolveQuest(playerData: PlayerData, questId: string): QuestConfig | undefined {
  return playerData.questRegistry.get(questId) ?? getStaticQuestById(questId);
}

export function getQuestProgressValue(playerData: PlayerData, questId: string): number {
  const quest = resolveQuest(playerData, questId);
  if (!quest) return 0;
  if (playerData.completedQuestIds.has(questId)) {
    return quest.condition.target;
  }
  if (quest.condition.type === 'quest_level') {
    return playerData.level;
  }
  if (quest.condition.type === 'quest_consecutive_success') {
    return playerData.consecutiveSuccesses;
  }
  return playerData.questProgress.get(questId) ?? 0;
}

export function getQuestProgressRatio(playerData: PlayerData, quest: QuestConfig): number {
  const target = quest.condition.target;
  if (!target || target <= 0) return 1;
  const current = getQuestProgressValue(playerData, quest.id);
  return Math.min(1, current / target);
}

export function getQuestProgressDisplay(
  playerData: PlayerData,
  quest: QuestConfig,
): { current: number; target: number; unit: string } {
  const target = quest.condition.target > 0 ? quest.condition.target : 1;
  const current = Math.min(target, getQuestProgressValue(playerData, quest.id));
  const unitMap: Record<string, string> = {
    quest_catch: '匹',
    quest_catch_junk: '個',
    quest_catch_fish: '匹',
    quest_catch_rarity: '匹',
    quest_catch_size_min: '匹',
    quest_catch_size_max: '匹',
    quest_tension_max: '匹',
    quest_fight_duration: '匹',
    quest_equipment: '匹',
    quest_environment: '匹',
    quest_sell_count: '匹',
    quest_earn_money: 'G',
    quest_level: '',
    quest_consecutive_success: '回',
  };
  return {
    current,
    target,
    unit: unitMap[quest.condition.type] ?? '',
  };
}

function isQuestObjectiveMet(playerData: PlayerData, quest: QuestConfig): boolean {
  const current = getQuestProgressValue(playerData, quest.id);
  return current >= quest.condition.target;
}

function grantQuestReward(playerData: PlayerData, quest: QuestConfig): void {
  if (!quest.reward) return;
  if (quest.reward.money) {
    playerData.money += quest.reward.money;
  }
  if (quest.reward.exp) {
    addExp(playerData, quest.reward.exp);
  }
}

function finalizeQuest(playerData: PlayerData, quest: QuestConfig): void {
  grantQuestReward(playerData, quest);
  playerData.activeQuests = playerData.activeQuests.filter((id) => id !== quest.id);
  playerData.completedQuestIds.add(quest.id);
  playerData.questProgress.delete(quest.id);
  playerData.boardQuestIds = playerData.boardQuestIds.filter((id) => id !== quest.id);
}

function checkAndCompleteQuests(playerData: PlayerData): QuestConfig[] {
  const completed: QuestConfig[] = [];
  for (const questId of [...playerData.activeQuests]) {
    const quest = resolveQuest(playerData, questId);
    if (!quest) continue;
    if (isQuestObjectiveMet(playerData, quest)) {
      finalizeQuest(playerData, quest);
      completed.push(quest);
    }
  }
  return completed;
}

export function getAvailableQuests(playerData: PlayerData): QuestConfig[] {
  ensureBoardQuests(playerData);
  return playerData.boardQuestIds
    .map((id) => resolveQuest(playerData, id))
    .filter((q): q is QuestConfig => q !== undefined);
}

export function getActiveQuests(playerData: PlayerData): QuestConfig[] {
  return playerData.activeQuests
    .map((id) => resolveQuest(playerData, id))
    .filter((q): q is QuestConfig => q !== undefined);
}

export function getCompletedQuests(playerData: PlayerData): QuestConfig[] {
  const completed: QuestConfig[] = [];
  for (const id of playerData.completedQuestIds) {
    const quest = resolveQuest(playerData, id);
    if (quest) completed.push(quest);
  }
  return completed.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
}

export function canAcceptQuest(playerData: PlayerData, questId: string): { ok: boolean; reason?: string } {
  if (playerData.activeQuests.length >= MAX_ACTIVE_QUESTS) {
    return { ok: false, reason: '同時に受けられるクエストは3つまでです' };
  }
  if (playerData.activeQuests.includes(questId)) {
    return { ok: false, reason: 'すでに受注しています' };
  }
  if (playerData.completedQuestIds.has(questId)) {
    return { ok: false, reason: 'すでに完了しています' };
  }
  if (!playerData.boardQuestIds.includes(questId)) {
    return { ok: false, reason: 'このクエストは掲示板にありません' };
  }
  if (!resolveQuest(playerData, questId)) {
    return { ok: false, reason: 'クエストが見つかりません' };
  }
  return { ok: true };
}

export function acceptQuest(playerData: PlayerData, questId: string): { ok: boolean; reason?: string } {
  const check = canAcceptQuest(playerData, questId);
  if (!check.ok) return check;
  playerData.activeQuests.push(questId);
  playerData.boardQuestIds = playerData.boardQuestIds.filter((id) => id !== questId);
  const quest = resolveQuest(playerData, questId)!;
  if (quest.condition.type === 'quest_level') {
    playerData.questProgress.set(questId, playerData.level);
  } else if (quest.condition.type === 'quest_consecutive_success') {
    playerData.questProgress.set(questId, playerData.consecutiveSuccesses);
  } else {
    playerData.questProgress.set(questId, 0);
  }
  ensureBoardQuests(playerData);
  return { ok: true };
}

function incrementQuestProgress(playerData: PlayerData, questId: string, amount: number): void {
  if (amount <= 0) return;
  const current = playerData.questProgress.get(questId) ?? 0;
  playerData.questProgress.set(questId, current + amount);
}

function matchesEquipment(
  condition: QuestCondition,
  ctx: QuestCatchContext,
): boolean {
  if (!condition.equipmentType || !condition.equipmentId) return false;
  switch (condition.equipmentType) {
    case 'rod':
      return ctx.equippedRodId === condition.equipmentId;
    case 'bait':
      return ctx.equippedBaitId === condition.equipmentId;
    case 'lure':
      return ctx.equippedLureId === condition.equipmentId;
    default:
      return false;
  }
}

function matchesFishCondition(
  condition: QuestCondition,
  fish: FishConfig,
  ctx?: QuestCatchContext,
): boolean {
  switch (condition.type) {
    case 'quest_catch_junk':
      if (condition.fishId) return fish.id === condition.fishId;
      return fish.id.startsWith('junk_');
    case 'quest_catch':
      return !fish.id.startsWith('junk_');
    case 'quest_catch_fish':
      return !fish.id.startsWith('junk_') && condition.fishId === fish.id;
    case 'quest_catch_rarity':
      return !fish.id.startsWith('junk_') &&
        (condition.rarity ? rarityMeetsMinimum(fish.rarity, condition.rarity) : false) &&
        (condition.maxRarity ? rarityMeetsMaximum(fish.rarity, condition.maxRarity) : true);
    case 'quest_catch_size_min':
      return !fish.id.startsWith('junk_') &&
        ctx?.fishSize !== undefined && condition.minSize !== undefined
        ? ctx.fishSize >= condition.minSize
        : false;
    case 'quest_catch_size_max':
      return !fish.id.startsWith('junk_') &&
        ctx?.fishSize !== undefined && condition.maxSize !== undefined
        ? ctx.fishSize <= condition.maxSize
        : false;
    case 'quest_tension_max':
      return !fish.id.startsWith('junk_') &&
        ctx !== undefined && ctx.tensionAtCatch >= TENSION_MAX_THRESHOLD;
    case 'quest_fight_duration':
      return !fish.id.startsWith('junk_') &&
        ctx !== undefined &&
        condition.minDuration !== undefined &&
        ctx.fightDurationSec >= condition.minDuration;
    case 'quest_equipment':
      return !fish.id.startsWith('junk_') && ctx !== undefined && matchesEquipment(condition, ctx);
    case 'quest_environment':
      return !fish.id.startsWith('junk_') &&
        condition.habitat !== undefined && fish.habitat === condition.habitat;
    default:
      return false;
  }
}

export function onQuestFishCaught(
  playerData: PlayerData,
  fish: FishConfig,
  ctx: QuestCatchContext,
): QuestConfig[] {
  for (const questId of playerData.activeQuests) {
    const quest = resolveQuest(playerData, questId);
    if (!quest) continue;
    if (matchesFishCondition(quest.condition, fish, ctx)) {
      incrementQuestProgress(playerData, questId, 1);
    }
  }
  return checkAndCompleteQuests(playerData);
}

export function onQuestFishSold(playerData: PlayerData, count: number, earnings: number): QuestConfig[] {
  for (const questId of playerData.activeQuests) {
    const quest = resolveQuest(playerData, questId);
    if (!quest) continue;
    if (quest.condition.type === 'quest_sell_count') {
      incrementQuestProgress(playerData, questId, count);
    } else if (quest.condition.type === 'quest_earn_money') {
      incrementQuestProgress(playerData, questId, earnings);
    }
  }
  return checkAndCompleteQuests(playerData);
}

export function onQuestLevelUp(playerData: PlayerData): QuestConfig[] {
  for (const questId of playerData.activeQuests) {
    const quest = resolveQuest(playerData, questId);
    if (!quest || quest.condition.type !== 'quest_level') continue;
    playerData.questProgress.set(questId, playerData.level);
  }
  return checkAndCompleteQuests(playerData);
}

export function onQuestConsecutiveSuccess(playerData: PlayerData): QuestConfig[] {
  for (const questId of playerData.activeQuests) {
    const quest = resolveQuest(playerData, questId);
    if (!quest || quest.condition.type !== 'quest_consecutive_success') continue;
    playerData.questProgress.set(questId, playerData.consecutiveSuccesses);
  }
  return checkAndCompleteQuests(playerData);
}

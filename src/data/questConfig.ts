// 📋 クエスト設定

import { Rarity } from './fishTypes';

export const MAX_ACTIVE_QUESTS = 3;
export const BOARD_QUEST_COUNT = 9;

export type QuestTemplateId =
  | 'catch_junk'
  | 'catch_fish'
  | 'catch_size_min'
  | 'catch_rarity'
  | 'catch_size_max'
  | 'tension_max'
  | 'fight_duration'
  | 'equipment'
  | 'environment';

export type QuestConditionType =
  | 'quest_catch'
  | 'quest_catch_junk'
  | 'quest_catch_fish'
  | 'quest_catch_rarity'
  | 'quest_catch_size_min'
  | 'quest_catch_size_max'
  | 'quest_tension_max'
  | 'quest_fight_duration'
  | 'quest_equipment'
  | 'quest_environment'
  | 'quest_sell_count'
  | 'quest_earn_money'
  | 'quest_level'
  | 'quest_consecutive_success';

export interface QuestCondition {
  type: QuestConditionType;
  target: number;
  fishId?: string;
  rarity?: string;
  maxRarity?: string;
  minSize?: number;
  maxSize?: number;
  minDuration?: number;
  equipmentType?: 'rod' | 'bait' | 'lure';
  equipmentId?: string;
  habitat?: string;
}

export interface QuestReward {
  money?: number;
  exp?: number;
}

export interface QuestConfig {
  id: string;
  name: string;
  description: string;
  emoji: string;
  condition: QuestCondition;
  reward?: QuestReward;
  templateId?: QuestTemplateId;
  isDynamic?: boolean;
}

export const RARITY_QUEST_LABELS: Record<string, string> = {
  [Rarity.COMMON]: '★',
  [Rarity.UNCOMMON]: '★★',
  [Rarity.RARE]: '★★★',
  [Rarity.EPIC]: '★★★★',
  [Rarity.LEGENDARY]: '★★★★★',
};

/** 旧セーブ互換用の固定クエスト（掲示板には出さない） */
export const questConfigs: QuestConfig[] = [
  {
    id: 'request_catch_5',
    name: '初心者の依頼',
    description: '魚を5匹釣って持ってきてください',
    emoji: '📋',
    condition: { type: 'quest_catch', target: 5 },
    reward: { money: 200, exp: 50 },
  },
  {
    id: 'request_sell_3',
    name: '商人の依頼',
    description: '魚を3匹売却してください',
    emoji: '💰',
    condition: { type: 'quest_sell_count', target: 3 },
    reward: { money: 150, exp: 30 },
  },
  {
    id: 'request_earn_300',
    name: '納金の依頼',
    description: '売却で300G稼いでください',
    emoji: '🪙',
    condition: { type: 'quest_earn_money', target: 300 },
    reward: { money: 250, exp: 40 },
  },
  {
    id: 'challenge_catch_10',
    name: '釣り名人への道',
    description: '10匹の魚を釣り上げよう',
    emoji: '🎣',
    condition: { type: 'quest_catch', target: 10 },
    reward: { money: 300, exp: 80 },
  },
  {
    id: 'challenge_rare',
    name: 'レア釣りチャレンジ',
    description: 'レア以上の魚を1匹釣ろう',
    emoji: '⭐',
    condition: { type: 'quest_catch_rarity', rarity: Rarity.RARE, target: 1 },
    reward: { money: 500, exp: 100 },
  },
  {
    id: 'challenge_consecutive_3',
    name: '連続成功',
    description: '釣りに3回連続で成功しよう',
    emoji: '🔥',
    condition: { type: 'quest_consecutive_success', target: 3 },
    reward: { money: 400, exp: 70 },
  },
];

export function getStaticQuestById(id: string): QuestConfig | undefined {
  return questConfigs.find((q) => q.id === id);
}

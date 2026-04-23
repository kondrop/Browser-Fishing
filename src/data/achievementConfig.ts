// 🏆 実績システム設定ファイル

import { Rarity } from './fishTypes';
import { rodConfigs, baitConfigs, lureConfigs } from './shopConfig';

// ============================================
// 型定義
// ============================================

export interface AchievementCondition {
  type: string;                 // 条件タイプ（"total_caught", "level", "money", etc.）
  target: number;               // 目標値
  fishId?: string;              // 特定の魚ID（オプション）
  rarity?: string;              // 特定のレア度（オプション）
}

export interface AchievementReward {
  money?: number;               // 報酬のお金
  exp?: number;                 // 報酬の経験値
  item?: {                      // 報酬のアイテム
    type: string;                // "rod", "bait", "lure"
    id: string;
  };
}

export interface AchievementConfig {
  id: string;                    // 実績ID（例: "catch_10"）
  category: string;              // カテゴリ（"catch", "rarity", "collection", etc.）
  name: string;                  // 実績名（例: "10匹達成"）
  description: string;           // 説明文
  emoji: string;                 // 表示用絵文字
  condition: AchievementCondition; // 達成条件
  reward?: AchievementReward;   // 報酬（オプション）
}

// ============================================
// 実績定義
// ============================================

export const achievementConfigs: AchievementConfig[] = [
  // ============================
  // 1-1. 釣果系（Catch）
  // ============================
  {
    id: 'catch_first',
    category: 'catch',
    name: '初めての一匹',
    description: '初めて魚を釣る',
    emoji: '🎣',
    condition: { type: 'total_caught', target: 1 },
    reward: { money: 50, exp: 10 },
  },
  {
    id: 'catch_10',
    category: 'catch',
    name: '10匹達成',
    description: '合計10匹の魚を釣る',
    emoji: '🐟',
    condition: { type: 'total_caught', target: 10 },
    reward: { money: 100, exp: 20 },
  },
  {
    id: 'catch_100',
    category: 'catch',
    name: '100匹達成',
    description: '合計100匹の魚を釣る',
    emoji: '🐠',
    condition: { type: 'total_caught', target: 100 },
    reward: { money: 500, exp: 50 },
  },
  {
    id: 'catch_500',
    category: 'catch',
    name: '500匹達成',
    description: '合計500匹の魚を釣る',
    emoji: '🐡',
    condition: { type: 'total_caught', target: 500 },
    reward: { money: 2000, exp: 200 },
  },
  {
    id: 'catch_1000',
    category: 'catch',
    name: '1000匹達成',
    description: '合計1000匹の魚を釣る',
    emoji: '🌊',
    condition: { type: 'total_caught', target: 1000 },
    reward: { money: 5000, exp: 500 },
  },
  {
    id: 'catch_5000',
    category: 'catch',
    name: '5000匹達成',
    description: '合計5000匹の魚を釣る',
    emoji: '🏆',
    condition: { type: 'total_caught', target: 5000 },
    reward: { money: 20000, exp: 2000 },
  },

  // ============================
  // 1-2. レア度系（Rarity）
  // ============================
  {
    id: 'rarity_rare_first',
    category: 'rarity',
    name: 'レア魚ゲッター',
    description: 'レア度「rare」の魚を初めて釣る',
    emoji: '⭐',
    condition: { type: 'first_rarity', rarity: Rarity.RARE, target: 1 },
    reward: { money: 300, exp: 100 },
  },
  {
    id: 'rarity_epic_first',
    category: 'rarity',
    name: 'エピックハンター',
    description: 'レア度「epic」の魚を初めて釣る',
    emoji: '⭐⭐',
    condition: { type: 'first_rarity', rarity: Rarity.EPIC, target: 1 },
    reward: { money: 1000, exp: 300 },
  },
  {
    id: 'rarity_legendary_first',
    category: 'rarity',
    name: 'レジェンダリー',
    description: 'レア度「legendary」の魚を初めて釣る',
    emoji: '⭐⭐⭐',
    condition: { type: 'first_rarity', rarity: Rarity.LEGENDARY, target: 1 },
    reward: { money: 5000, exp: 1000 },
  },
  {
    id: 'rarity_common_master',
    category: 'rarity',
    name: 'コモンマスター',
    description: 'レア度「common」の全種類を釣る',
    emoji: '🐟',
    condition: { type: 'all_rarity', rarity: Rarity.COMMON, target: 13 }, // ゴミを除く
    reward: { money: 500, exp: 150 },
  },
  {
    id: 'rarity_uncommon_master',
    category: 'rarity',
    name: 'アンコモンマスター',
    description: 'レア度「uncommon」の全種類を釣る',
    emoji: '🐠',
    condition: { type: 'all_rarity', rarity: Rarity.UNCOMMON, target: 14 },
    reward: { money: 1500, exp: 400 },
  },
  {
    id: 'rarity_rare_master',
    category: 'rarity',
    name: 'レアマスター',
    description: 'レア度「rare」の全種類を釣る',
    emoji: '⭐',
    condition: { type: 'all_rarity', rarity: Rarity.RARE, target: 5 },
    reward: { money: 3000, exp: 800 },
  },
  {
    id: 'rarity_epic_master',
    category: 'rarity',
    name: 'エピックマスター',
    description: 'レア度「epic」の全種類を釣る',
    emoji: '⭐⭐',
    condition: { type: 'all_rarity', rarity: Rarity.EPIC, target: 4 },
    reward: { money: 8000, exp: 2000 },
  },
  {
    id: 'rarity_legendary_master',
    category: 'rarity',
    name: 'レジェンダリーマスター',
    description: 'レア度「legendary」の全種類を釣る',
    emoji: '⭐⭐⭐',
    condition: { type: 'all_rarity', rarity: Rarity.LEGENDARY, target: 3 },
    reward: { money: 20000, exp: 5000 },
  },

  // ============================
  // 1-3. 図鑑系（Collection）
  // ============================
  {
    id: 'collection_5',
    category: 'collection',
    name: '図鑑スタート',
    description: '図鑑に5種類の魚を登録',
    emoji: '📖',
    condition: { type: 'collection_count', target: 5 },
    reward: { money: 200, exp: 50 },
  },
  {
    id: 'collection_10',
    category: 'collection',
    name: '図鑑コレクター',
    description: '図鑑に10種類の魚を登録',
    emoji: '📚',
    condition: { type: 'collection_count', target: 10 },
    reward: { money: 500, exp: 150 },
  },
  {
    id: 'collection_15',
    category: 'collection',
    name: '図鑑マスター',
    description: '図鑑に15種類の魚を登録',
    emoji: '📘',
    condition: { type: 'collection_count', target: 15 },
    reward: { money: 2000, exp: 500 },
  },
  {
    id: 'collection_all',
    category: 'collection',
    name: '完全制覇',
    description: '図鑑に全種類の魚を登録',
    emoji: '🏅',
    condition: { type: 'all_collection', target: 0 }, // targetは使用されない（動的に全種類数をチェック）
    reward: { money: 10000, exp: 3000 },
  },

  // ============================
  // 1-4. レベル系（Level）
  // ============================
  {
    id: 'level_5',
    category: 'level',
    name: 'レベル5達成',
    description: 'レベル5に到達',
    emoji: '⭐',
    condition: { type: 'level', target: 5 },
    reward: { money: 300, exp: 100 },
  },
  {
    id: 'level_10',
    category: 'level',
    name: 'レベル10達成',
    description: 'レベル10に到達',
    emoji: '⭐⭐',
    condition: { type: 'level', target: 10 },
    reward: { money: 1000, exp: 300 },
  },
  {
    id: 'level_20',
    category: 'level',
    name: 'レベル20達成',
    description: 'レベル20に到達',
    emoji: '⭐⭐⭐',
    condition: { type: 'level', target: 20 },
    reward: { money: 3000, exp: 1000 },
  },
  {
    id: 'level_30',
    category: 'level',
    name: 'レベル30達成',
    description: 'レベル30に到達',
    emoji: '🌟',
    condition: { type: 'level', target: 30 },
    reward: { money: 8000, exp: 2500 },
  },
  {
    id: 'level_50',
    category: 'level',
    name: 'レベル50達成',
    description: 'レベル50に到達',
    emoji: '🌟🌟',
    condition: { type: 'level', target: 50 },
    reward: { money: 20000, exp: 5000 },
  },

  // ============================
  // 1-5. 経済系（Money）
  // ============================
  {
    id: 'money_100',
    category: 'money',
    name: '初めての収益',
    description: '合計100Gを獲得',
    emoji: '💰',
    condition: { type: 'total_money_earned', target: 100 },
    reward: { money: 50, exp: 20 },
  },
  {
    id: 'money_10000',
    category: 'money',
    name: '小金持ち',
    description: '合計10,000Gを獲得',
    emoji: '💰💰',
    condition: { type: 'total_money_earned', target: 10000 },
    reward: { money: 500, exp: 200 },
  },
  {
    id: 'money_100000',
    category: 'money',
    name: '富豪',
    description: '合計100,000Gを獲得',
    emoji: '💰💰💰',
    condition: { type: 'total_money_earned', target: 100000 },
    reward: { money: 5000, exp: 2000 },
  },
  {
    id: 'money_500000',
    category: 'money',
    name: '大富豪',
    description: '合計500,000Gを獲得',
    emoji: '💰💰💰💰',
    condition: { type: 'total_money_earned', target: 500000 },
    reward: { money: 20000, exp: 8000 },
  },
  {
    id: 'money_1000000',
    category: 'money',
    name: '億万長者',
    description: '合計1,000,000Gを獲得',
    emoji: '💎',
    condition: { type: 'total_money_earned', target: 1000000 },
    reward: { money: 50000, exp: 20000 },
  },

  // ============================
  // 1-6. 釣り竿・装備系（Equipment）
  // ============================
  {
    id: 'equipment_all_rods',
    category: 'equipment',
    name: '釣り竿コレクター',
    description: '全種類の釣り竿を購入（5種類）',
    emoji: '🎣',
    condition: { type: 'all_rods', target: rodConfigs.length },
    reward: { money: 2000, exp: 500 },
  },
  {
    id: 'equipment_all_baits',
    category: 'equipment',
    name: 'エサマスター',
    description: '全種類のエサを購入（4種類）',
    emoji: '🪱',
    condition: { type: 'all_baits', target: baitConfigs.length },
    reward: { money: 1000, exp: 300 },
  },
  {
    id: 'equipment_all_lures',
    category: 'equipment',
    name: 'ルアーマスター',
    description: '全種類のルアーを購入（4種類）',
    emoji: '🪝',
    condition: { type: 'all_lures', target: lureConfigs.length },
    reward: { money: 5000, exp: 1000 },
  },
  {
    id: 'equipment_complete',
    category: 'equipment',
    name: '装備コンプリート',
    description: '全種類の釣り竿・エサ・ルアーを購入',
    emoji: '⚔️',
    condition: { type: 'all_equipment', target: rodConfigs.length + baitConfigs.length + lureConfigs.length },
    reward: { money: 10000, exp: 3000 },
  },

  // ============================
  // 1-7. 特殊系（Special）
  // ============================
  {
    id: 'special_consecutive_5',
    category: 'special',
    name: '連続成功',
    description: '連続5回成功で魚を釣る',
    emoji: '🔥',
    condition: { type: 'consecutive_success', target: 5 },
    reward: { money: 300, exp: 100 },
  },
  {
    id: 'special_perfect_10',
    category: 'special',
    name: 'パーフェクト',
    description: '連続10回成功で魚を釣る',
    emoji: '✨',
    condition: { type: 'consecutive_success', target: 10 },
    reward: { money: 1000, exp: 500 },
  },
  {
    id: 'special_junk_first',
    category: 'special',
    name: '不運の始まり',
    description: '初めてゴミを釣る',
    emoji: '🗑️',
    condition: { type: 'junk_caught', target: 1 },
    reward: { money: 10, exp: 5 },
  },
  {
    id: 'special_junk_10',
    category: 'special',
    name: 'ゴミハンター',
    description: 'ゴミを10個釣る',
    emoji: '🗑️🗑️',
    condition: { type: 'junk_caught', target: 10 },
    reward: { money: 100, exp: 50 },
  },
];

// ============================================
// ヘルパー関数
// ============================================

/** UI では実績アイコンを 1 絵文字にそろえる（例: ⭐⭐⭐ → ⭐） */
export function displayAchievementEmoji(emoji: string): string {
  if (!emoji) return '';
  try {
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
      const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
      for (const { segment } of seg.segment(emoji)) {
        return segment;
      }
    }
  } catch {
    /* noop */
  }
  const first = [...emoji][0];
  return first ?? '';
}

export function getAchievementById(id: string): AchievementConfig | undefined {
  return achievementConfigs.find(a => a.id === id);
}

export function getAchievementsByCategory(category: string): AchievementConfig[] {
  return achievementConfigs.filter(a => a.category === category);
}

export function getAllCategories(): string[] {
  const categories = new Set<string>();
  achievementConfigs.forEach(a => categories.add(a.category));
  return Array.from(categories);
}


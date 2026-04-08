// 🐟 魚データ管理
// 設定は fishConfig.ts で編集してください

import { Rarity, Habitat } from './fishTypes';
import type { FishConfig } from './fishConfig';
import { fishConfigs, raritySettings } from './fishConfig';

// 型のエクスポート
export type { FishConfig as Fish };
export { Rarity, Habitat };

// 魚データベース（設定ファイルから読み込み）
export const fishDatabase = fishConfigs;

// レア度による星表示
export const rarityStars: Record<Rarity, string> = {
  [Rarity.COMMON]: raritySettings[Rarity.COMMON].stars,
  [Rarity.UNCOMMON]: raritySettings[Rarity.UNCOMMON].stars,
  [Rarity.RARE]: raritySettings[Rarity.RARE].stars,
  [Rarity.EPIC]: raritySettings[Rarity.EPIC].stars,
  [Rarity.LEGENDARY]: raritySettings[Rarity.LEGENDARY].stars,
};

// レア度による星の数（1-5）
export const rarityStarCount: Record<Rarity, number> = {
  [Rarity.COMMON]: 1,
  [Rarity.UNCOMMON]: 2,
  [Rarity.RARE]: 3,
  [Rarity.EPIC]: 4,
  [Rarity.LEGENDARY]: 5,
};

// レア度による色
export const rarityColors: Record<Rarity, number> = {
  [Rarity.COMMON]: raritySettings[Rarity.COMMON].color,
  [Rarity.UNCOMMON]: raritySettings[Rarity.UNCOMMON].color,
  [Rarity.RARE]: raritySettings[Rarity.RARE].color,
  [Rarity.EPIC]: raritySettings[Rarity.EPIC].color,
  [Rarity.LEGENDARY]: raritySettings[Rarity.LEGENDARY].color,
};

// レア度による出現確率
export const rarityWeights: Record<Rarity, number> = {
  [Rarity.COMMON]: raritySettings[Rarity.COMMON].weight,
  [Rarity.UNCOMMON]: raritySettings[Rarity.UNCOMMON].weight,
  [Rarity.RARE]: raritySettings[Rarity.RARE].weight,
  [Rarity.EPIC]: raritySettings[Rarity.EPIC].weight,
  [Rarity.LEGENDARY]: raritySettings[Rarity.LEGENDARY].weight,
};

// レア度ボーナスの型定義
export interface RarityBonuses {
  commonBonus?: number;
  uncommonBonus?: number;
  rareBonus?: number;
  epicBonus?: number;
  legendaryBonus?: number;
}

export interface FishRollOptions {
  junkWeightMultiplier?: number;
}

// ランダムに魚を取得（レア度と個別weightの重み付き）
export function getRandomFish(bonuses?: RarityBonuses, options?: FishRollOptions): FishConfig {
  // ボーナス適用後のレア度ウェイトを計算
  const adjustedWeights: Record<Rarity, number> = {
    [Rarity.COMMON]: rarityWeights[Rarity.COMMON] * (bonuses?.commonBonus || 1.0),
    [Rarity.UNCOMMON]: rarityWeights[Rarity.UNCOMMON] * (bonuses?.uncommonBonus || 1.0),
    [Rarity.RARE]: rarityWeights[Rarity.RARE] * (bonuses?.rareBonus || 1.0),
    [Rarity.EPIC]: rarityWeights[Rarity.EPIC] * (bonuses?.epicBonus || 1.0),
    [Rarity.LEGENDARY]: rarityWeights[Rarity.LEGENDARY] * (bonuses?.legendaryBonus || 1.0),
  };

  // 1. まずレア度を決定
  const totalRarityWeight = Object.values(adjustedWeights).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalRarityWeight;
  
  let selectedRarity: Rarity = Rarity.COMMON;
  for (const [rarity, weight] of Object.entries(adjustedWeights)) {
    random -= weight;
    if (random <= 0) {
      selectedRarity = rarity as Rarity;
      break;
    }
  }
  
  // 2. 選ばれたレア度の魚から、個別weightで重み付けして選ぶ
  const fishOfRarity = fishDatabase.filter(f => f.rarity === selectedRarity);
  const junkWeightMul = Math.max(0, options?.junkWeightMultiplier ?? 1);
  const getWeight = (f: FishConfig) => f.id.startsWith('junk_') ? f.weight * junkWeightMul : f.weight;
  const totalFishWeight = fishOfRarity.reduce((sum, f) => sum + getWeight(f), 0);
  
  let fishRandom = Math.random() * totalFishWeight;
  for (const fish of fishOfRarity) {
    fishRandom -= getWeight(fish);
    if (fishRandom <= 0) {
      return fish;
    }
  }
  
  // フォールバック
  return fishOfRarity[0];
}

// IDから魚を取得
export function getFishById(id: string): FishConfig | undefined {
  return fishDatabase.find(f => f.id === id);
}

// ゴミ以外の魚の数を取得
export function getRealFishCount(): number {
  return fishDatabase.filter(f => !f.id.startsWith('junk')).length;
}

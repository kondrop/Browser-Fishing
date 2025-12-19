// 📦 インベントリ管理

import type { FishConfig } from './fishConfig';
import { getFishById } from './fish';

export interface InventoryItem {
  fishId: string;
  count: number;
}

export interface BaitItem {
  baitId: string;
  count: number;
}

export interface PlayerData {
  inventory: InventoryItem[];
  caughtFishIds: Set<string>;  // 図鑑用：一度でも釣った魚のID
  money: number;
  totalCaught: number;         // 総釣果数
  // ショップ関連
  equippedRodId: string;       // 装備中の竿ID
  ownedRods: string[];        // 所有している竿ID一覧
  baits: BaitItem[];           // 所持しているエサ
  equippedBaitId: string | null; // 装備中のエサID（null = エサなし）
  ownedLures: string[];        // 所有しているルアーID一覧
  equippedLureId: string | null; // 装備中のルアーID（null = ルアーなし）
  maxInventorySlots: number;   // 最大インベントリスロット数
  // レベルシステム
  exp: number;                 // 経験値
  level: number;               // 現在のレベル
}

// プレイヤーデータの初期値
export function createInitialPlayerData(): PlayerData {
  return {
    inventory: [],
    caughtFishIds: new Set(),
    money: 0,
    totalCaught: 0,
    // ショップ関連の初期値
    equippedRodId: 'rod_basic',
    ownedRods: ['rod_basic'],  // 初期装備の竿を所持リストに追加
    baits: [],
    equippedBaitId: null,
    ownedLures: [],
    equippedLureId: null,
    maxInventorySlots: 9,
    // レベルシステムの初期値
    exp: 0,
    level: 1,
  };
}

// インベントリに魚を追加
export function addFishToInventory(playerData: PlayerData, fish: FishConfig): boolean {
  // 図鑑に登録
  playerData.caughtFishIds.add(fish.id);
  playerData.totalCaught++;
  
  // 経験値を追加
  const expGained = getExpByRarity(fish.rarity);
  const leveledUp = addExp(playerData, expGained);
  
  // インベントリに追加
  const existingItem = playerData.inventory.find(item => item.fishId === fish.id);
  if (existingItem) {
    existingItem.count++;
  } else {
    playerData.inventory.push({ fishId: fish.id, count: 1 });
  }
  
  // レベルアップしたかどうかを返す
  return leveledUp;
}

// インベントリから魚を削除（売却時など）
export function removeFishFromInventory(playerData: PlayerData, fishId: string, count: number = 1): boolean {
  const item = playerData.inventory.find(item => item.fishId === fishId);
  if (!item || item.count < count) {
    return false;
  }
  
  item.count -= count;
  if (item.count <= 0) {
    playerData.inventory = playerData.inventory.filter(i => i.fishId !== fishId);
  }
  return true;
}

// 魚を売却
export function sellFish(playerData: PlayerData, fishId: string, count: number = 1): number {
  const fish = getFishById(fishId);
  if (!fish) return 0;
  
  if (removeFishFromInventory(playerData, fishId, count)) {
    const earnings = fish.price * count;
    playerData.money += earnings;
    return earnings;
  }
  return 0;
}

// 全ての魚を売却
export function sellAllFish(playerData: PlayerData): number {
  let totalEarnings = 0;
  
  for (const item of [...playerData.inventory]) {
    const fish = getFishById(item.fishId);
    if (fish) {
      totalEarnings += fish.price * item.count;
    }
  }
  
  playerData.inventory = [];
  playerData.money += totalEarnings;
  return totalEarnings;
}

// インベントリの合計金額を計算
export function calculateInventoryValue(playerData: PlayerData): number {
  let total = 0;
  for (const item of playerData.inventory) {
    const fish = getFishById(item.fishId);
    if (fish) {
      total += fish.price * item.count;
    }
  }
  return total;
}

// インベントリの合計アイテム数
export function getInventoryCount(playerData: PlayerData): number {
  return playerData.inventory.reduce((sum, item) => sum + item.count, 0);
}

// 図鑑の登録率を計算
export function getCollectionProgress(playerData: PlayerData, totalFishCount: number): number {
  return playerData.caughtFishIds.size / totalFishCount;
}

// LocalStorageに保存
export function savePlayerData(playerData: PlayerData): void {
  const dataToSave = {
    ...playerData,
    caughtFishIds: Array.from(playerData.caughtFishIds),
  };
  localStorage.setItem('fishingGame_playerData', JSON.stringify(dataToSave));
}

// LocalStorageから読み込み
export function loadPlayerData(): PlayerData {
  const saved = localStorage.getItem('fishingGame_playerData');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // 既存データとの互換性を保つためにデフォルト値をマージ
      const initial = createInitialPlayerData();
      return {
        ...initial,
        ...parsed,
        caughtFishIds: new Set(parsed.caughtFishIds || []),
        // 新しいフィールドが存在しない場合はデフォルト値を使用
        equippedRodId: parsed.equippedRodId || initial.equippedRodId,
        ownedRods: parsed.ownedRods || (parsed.equippedRodId ? [parsed.equippedRodId] : initial.ownedRods),  // 互換性: 既存データの場合は装備中の竿を所持リストに追加
        baits: parsed.baits || initial.baits,
        equippedBaitId: parsed.equippedBaitId !== undefined ? parsed.equippedBaitId : initial.equippedBaitId,
        ownedLures: parsed.ownedLures || initial.ownedLures,
        equippedLureId: parsed.equippedLureId !== undefined ? parsed.equippedLureId : initial.equippedLureId,
        maxInventorySlots: parsed.maxInventorySlots || initial.maxInventorySlots,
        // レベルシステム（互換性のため）
        exp: parsed.exp !== undefined ? parsed.exp : initial.exp,
        level: parsed.level !== undefined ? parsed.level : initial.level,
      };
    } catch {
      console.error('Failed to load player data');
    }
  }
  return createInitialPlayerData();
}

// エサを追加
export function addBait(playerData: PlayerData, baitId: string, count: number): void {
  const existing = playerData.baits.find(b => b.baitId === baitId);
  if (existing) {
    existing.count += count;
  } else {
    playerData.baits.push({ baitId, count });
  }
}

// エサを消費（1回の釣りで1個消費）
export function consumeBait(playerData: PlayerData): boolean {
  if (!playerData.equippedBaitId) return false;
  
  const baitItem = playerData.baits.find(b => b.baitId === playerData.equippedBaitId);
  if (!baitItem || baitItem.count <= 0) {
    playerData.equippedBaitId = null;
    return false;
  }
  
  baitItem.count--;
  if (baitItem.count <= 0) {
    playerData.baits = playerData.baits.filter(b => b.baitId !== playerData.equippedBaitId);
    playerData.equippedBaitId = null;
  }
  return true;
}

// エサの所持数を取得
export function getBaitCount(playerData: PlayerData, baitId: string): number {
  const baitItem = playerData.baits.find(b => b.baitId === baitId);
  return baitItem?.count || 0;
}

// ============================================
// レベルシステム
// ============================================

// レア度に応じた経験値を取得
export function getExpByRarity(rarity: string): number {
  switch (rarity) {
    case 'common':
      return 10;
    case 'uncommon':
      return 25;
    case 'rare':
      return 50;
    case 'epic':
      return 100;
    case 'legendary':
      return 200;
    default:
      return 10;
  }
}

// レベルに必要な累積経験値を計算
export function getRequiredExp(level: number): number {
  // レベル1: 0, レベル2: 100, レベル3: 250, レベル4: 450, ...
  // 式: 50 * level * (level - 1) + 50
  if (level <= 1) return 0;
  return 50 * level * (level - 1) + 50;
}

// 経験値からレベルを計算
export function calculateLevel(exp: number): number {
  let level = 1;
  while (getRequiredExp(level + 1) <= exp) {
    level++;
  }
  return level;
}

// 現在のレベルでの経験値進捗を取得（0.0〜1.0）
export function getExpProgress(playerData: PlayerData): number {
  const currentLevelExp = getRequiredExp(playerData.level);
  const nextLevelExp = getRequiredExp(playerData.level + 1);
  const expInCurrentLevel = playerData.exp - currentLevelExp;
  const expNeededForNextLevel = nextLevelExp - currentLevelExp;
  
  if (expNeededForNextLevel === 0) return 1.0;
  return Math.min(1.0, expInCurrentLevel / expNeededForNextLevel);
}

// 経験値を追加し、レベルアップをチェック
export function addExp(playerData: PlayerData, exp: number): boolean {
  const oldLevel = playerData.level;
  playerData.exp += exp;
  playerData.level = calculateLevel(playerData.exp);
  
  // レベルアップしたかどうか
  return playerData.level > oldLevel;
}

// ============================================
// レベルボーナス
// ============================================

// レベルに応じたバー判定範囲のボーナスを取得
// レベル1: +0.00, レベル2: +0.01, レベル3: +0.02, ...
export function getLevelBarRangeBonus(level: number): number {
  if (level <= 1) return 0;
  return (level - 1) * 0.01;
}

// レベルに応じたゲージ増加速度のボーナスを取得
// レベル1: +0.000, レベル2: +0.005, レベル3: +0.010, ...
export function getLevelGaugeSpeedBonus(level: number): number {
  if (level <= 1) return 0;
  return (level - 1) * 0.005;
}


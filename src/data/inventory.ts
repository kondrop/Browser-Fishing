// 📦 インベントリ管理

import type { FishConfig } from './fishConfig';
import { getFishById, getRealFishCount } from './fish';
import type { AchievementConfig, AchievementCondition } from './achievementConfig';
import { achievementConfigs } from './achievementConfig';
import { fishConfigs } from './fishConfig';
import { getExpMultiplierForFish, getSellPriceMultiplier } from './skills';
import { config } from '../config';

/** バッグ内の1匹（入手順で inventory 配列に格納） */
export interface InventoryEntry {
  fishId: string;
  size?: number; // cm。ゴミは未設定
}

/** @deprecated InventoryEntry を使用 */
export type InventoryItem = InventoryEntry;

export interface BaitItem {
  baitId: string;
  count: number;
}

export interface PlayerData {
  inventory: InventoryEntry[];
  caughtFishIds: Set<string>;  // 図鑑用：一度でも釣った魚のID
  money: number;
  totalCaught: number;         // 総釣果数
  // ショップ関連
  equippedRodId: string;       // 装備中の釣り竿ID
  ownedRods: string[];        // 所有している釣り竿ID一覧
  baits: BaitItem[];           // 所持しているエサ
  equippedBaitId: string | null; // 装備中のエサID（null = エサなし）
  ownedLures: string[];        // 所有しているルアーID一覧
  equippedLureId: string | null; // 装備中のルアーID（null = ルアーなし）
  maxInventorySlots: number;   // 最大インベントリスロット数
  // レベルシステム
  exp: number;                 // 経験値
  level: number;               // 現在のレベル
  // サイズ記録
  fishSizes: Record<string, number>; // 各魚IDの最大サイズ記録（cm）
  // 実績システム
  achievements: Set<string>;           // 獲得済み実績IDのセット
  achievementProgress: Map<string, number>; // 実績の進捗（key: 実績ID, value: 現在の値）
  totalMoneyEarned: number;            // 累計獲得金額（売却した金額の合計）
  consecutiveSuccesses: number;        // 連続成功回数
  fishCaughtCounts: Map<string, number>; // 魚種ごとの釣果数（key: 魚ID, value: 釣果数）
  junkCaughtCount: number;             // ゴミを釣った回数
  // スキルツリー
  skillPoints: number;                 // 未使用SP
  unlockedSkillNodes: Set<string>;     // 解放済みノードID
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
    ownedRods: ['rod_basic'],  // 初期装備の釣り竿を所持リストに追加
    baits: [],
    equippedBaitId: null,
    ownedLures: [],
    equippedLureId: null,
    maxInventorySlots: 9,
    // レベルシステムの初期値
    exp: 0,
    level: 1,
    // サイズ記録の初期値
    fishSizes: {},
    // 実績システムの初期値
    achievements: new Set(),
    achievementProgress: new Map(),
    totalMoneyEarned: 0,
    consecutiveSuccesses: 0,
    fishCaughtCounts: new Map(),
    junkCaughtCount: 0,
    skillPoints: 0,
    unlockedSkillNodes: new Set(),
  };
}

/** 実投擲距離を 0〜1（基準最大距離基準、超過は1で丸め）に正規化 */
export function getCastDistanceRatio(distance: number): number {
  const waitCfg = config.waiting;
  const minDist = waitCfg['3-3_最小投擲距離'];
  const maxDist = waitCfg['3-4_最大投擲距離'];
  const span = Math.max(0, maxDist - minDist);
  if (span <= 0) return 0;
  return Math.max(0, Math.min(1, (distance - minDist) / span));
}

// ランダムサイズを生成（最大サイズに対する比率で抽選）
// castDistanceRatio: 投擲距離比率 0〜1。指定時は遠いほど下限が引き上がる（大きい個体になりやすい）
export function generateRandomSize(maxSize: number, castDistanceRatio?: number): number {
  const waitCfg = config.waiting;
  const baseMinRatio = waitCfg['3-7_投擲サイズ_最小比率ベース'];
  const fullCastMinRatio = waitCfg['3-8_投擲サイズ_最小比率_フル投擲'];
  const t =
    castDistanceRatio !== undefined
      ? Math.max(0, Math.min(1, castDistanceRatio))
      : 0;
  const minRatio = baseMinRatio + (fullCastMinRatio - baseMinRatio) * t;
  const maxRatio = 1.0;
  const randomSize = maxSize * minRatio + Math.random() * maxSize * (maxRatio - minRatio);
  return Math.round(randomSize * 10) / 10; // 小数点第一位まで
}

// サイズ記録を更新（新しいサイズが大きい場合のみ更新）
export function updateFishSizeRecord(playerData: PlayerData, fishId: string, size: number): void {
  const currentRecord = playerData.fishSizes[fishId];
  if (!currentRecord || size > currentRecord) {
    playerData.fishSizes[fishId] = size;
  }
}

// サイズによる価格ボーナスを計算（基本価格以上に上乗せ）
// sizeRatio: サイズ/最大サイズ (0.5〜1.0)
// bonusCoefficient: ボーナス係数（例：0.5 = 最大50%上乗せ）
export function calculatePriceWithSizeBonus(basePrice: number, sizeRatio: number, bonusCoefficient: number = 0.5): number {
  // 基本価格 + (サイズ比率 × ボーナス係数 × 基本価格)
  // 例：基本価格80G、サイズ比率0.8、係数0.5 → 80 + (0.8 × 0.5 × 80) = 80 + 32 = 112G
  const bonus = sizeRatio * bonusCoefficient * basePrice;
  return Math.round(basePrice + bonus);
}

// サイズによるcatchRate調整を計算（粘り強さ）
// sizeRatio: サイズ/最大サイズ (0.5〜1.0)
// difficultyCoefficient: 難易度係数（例：0.3 = 最大30%減少）
export function calculateCatchRateWithSize(baseCatchRate: number, sizeRatio: number, difficultyCoefficient: number = 0.3): number {
  // 基本catchRate × (1 - サイズ比率 × 難易度係数)
  // 例：基本catchRate 1.0、サイズ比率0.8、係数0.3 → 1.0 × (1 - 0.8 × 0.3) = 1.0 × 0.76 = 0.76
  const adjustedRate = baseCatchRate * (1 - sizeRatio * difficultyCoefficient);
  return Math.max(0.1, adjustedRate); // 最低0.1は保証
}

// インベントリに魚を追加
// 戻り値: { leveledUp: boolean, size?: number } - レベルアップしたかどうかと生成されたサイズ
export function addFishToInventory(playerData: PlayerData, fish: FishConfig, size?: number): { leveledUp: boolean; size?: number } {
  // 図鑑に登録
  playerData.caughtFishIds.add(fish.id);
  playerData.totalCaught++;
  
  // 魚種ごとの釣果数を更新
  const currentCount = playerData.fishCaughtCounts.get(fish.id) || 0;
  playerData.fishCaughtCounts.set(fish.id, currentCount + 1);
  
  // ゴミの場合はサイズを生成しない
  const isJunk = fish.id.startsWith('junk_');
  let fishSize: number | undefined;
  
  // ゴミの場合はカウントを更新
  if (isJunk) {
    playerData.junkCaughtCount++;
  }
  
  if (!isJunk) {
    // サイズを生成（指定されていない場合）
    fishSize = size !== undefined ? size : generateRandomSize(fish.maxSize);
    
    // サイズ記録を更新
    updateFishSizeRecord(playerData, fish.id, fishSize);
  }
  
  // 経験値を追加
  const expGainedBase = getExpByRarity(fish.rarity);
  const expMul = getExpMultiplierForFish(playerData, fish.id);
  const expGained = Math.max(1, Math.round(expGainedBase * expMul));
  const leveledUp = addExp(playerData, expGained);
  
  // インベントリに追加（配列末尾＝最新。表示時は先頭が最新）
  playerData.inventory.push({
    fishId: fish.id,
    ...(fishSize !== undefined ? { size: fishSize } : {}),
  });
  
  // レベルアップしたかどうかと生成されたサイズを返す
  return { leveledUp, size: fishSize };
}

// インベントリから魚を削除（売却時など。同種は入手が古い順に削除）
export function removeFishFromInventory(playerData: PlayerData, fishId: string, count: number = 1): boolean {
  const owned = playerData.inventory.filter((e) => e.fishId === fishId).length;
  if (owned < count) {
    return false;
  }

  let removed = 0;
  for (let i = 0; i < playerData.inventory.length && removed < count; ) {
    if (playerData.inventory[i].fishId === fishId) {
      playerData.inventory.splice(i, 1);
      removed++;
    } else {
      i++;
    }
  }
  return true;
}

// 魚を売却（サイズを考慮した価格で売却）
export function sellFish(playerData: PlayerData, fishId: string, count: number = 1): number {
  const fish = getFishById(fishId);
  if (!fish) return 0;
  const sizePriceBonusCoef = config.fighting['5-12f_サイズ売価ボーナス係数'];
  
  const owned = playerData.inventory.filter((e) => e.fishId === fishId).length;
  if (owned < count) return 0;

  const isJunk = fishId.startsWith('junk_');
  let totalEarnings = 0;
  const skillSellMul = getSellPriceMultiplier(playerData);
  let sold = 0;

  for (let i = 0; i < playerData.inventory.length && sold < count; ) {
    const entry = playerData.inventory[i];
    if (entry.fishId !== fishId) {
      i++;
      continue;
    }

    let price = fish.price;
    if (!isJunk && entry.size !== undefined) {
      const sizeRatio = entry.size / fish.maxSize;
      price = calculatePriceWithSizeBonus(fish.price, sizeRatio, sizePriceBonusCoef);
    }
    totalEarnings += Math.round(price * skillSellMul);
    playerData.inventory.splice(i, 1);
    sold++;
  }

  if (sold === count) {
    playerData.money += totalEarnings;
    // 累計獲得金額を更新
    playerData.totalMoneyEarned += totalEarnings;
    return totalEarnings;
  }
  return 0;
}

// 全ての魚を売却（サイズを考慮した価格で売却）
export function sellAllFish(playerData: PlayerData): number {
  let totalEarnings = 0;
  const skillSellMul = getSellPriceMultiplier(playerData);
  const sizePriceBonusCoef = config.fighting['5-12f_サイズ売価ボーナス係数'];
  
  for (const entry of playerData.inventory) {
    const fish = getFishById(entry.fishId);
    if (!fish) continue;

    const isJunk = entry.fishId.startsWith('junk_');
    let price = fish.price;
    if (!isJunk && entry.size !== undefined) {
      const sizeRatio = entry.size / fish.maxSize;
      price = calculatePriceWithSizeBonus(fish.price, sizeRatio, sizePriceBonusCoef);
    }
    totalEarnings += Math.round(price * skillSellMul);
  }
  
  playerData.inventory = [];
  playerData.money += totalEarnings;
  // 累計獲得金額を更新
  playerData.totalMoneyEarned += totalEarnings;
  return totalEarnings;
}

// インベントリの合計金額を計算（サイズを考慮した価格）
export function calculateInventoryValue(playerData: PlayerData): number {
  let total = 0;
  const skillSellMul = getSellPriceMultiplier(playerData);
  const sizePriceBonusCoef = config.fighting['5-12f_サイズ売価ボーナス係数'];
  for (const entry of playerData.inventory) {
    const fish = getFishById(entry.fishId);
    if (!fish) continue;

    const isJunk = entry.fishId.startsWith('junk_');
    let price = fish.price;
    if (!isJunk && entry.size !== undefined) {
      const sizeRatio = entry.size / fish.maxSize;
      price = calculatePriceWithSizeBonus(fish.price, sizeRatio, sizePriceBonusCoef);
    }
    total += Math.round(price * skillSellMul);
  }
  return total;
}

// インベントリの合計アイテム数
export function getInventoryCount(playerData: PlayerData): number {
  return playerData.inventory.length;
}

/** UI表示用：入手が新しい順（左上が最新） */
export function getInventoryDisplayOrder(playerData: PlayerData): InventoryEntry[] {
  return [...playerData.inventory].reverse();
}

function normalizeInventoryFromSave(raw: unknown[]): InventoryEntry[] {
  if (!raw.length) return [];

  const first = raw[0] as Record<string, unknown>;
  if (typeof first.count === 'number') {
    const entries: InventoryEntry[] = [];
    for (const item of raw as Array<{ fishId: string; count: number; sizes?: number[]; size?: number }>) {
      const sizes =
        item.sizes ??
        (item.size !== undefined ? Array(item.count).fill(item.size) : []);
      for (let j = 0; j < item.count; j++) {
        const size = sizes[j];
        entries.push({
          fishId: item.fishId,
          ...(size !== undefined ? { size } : {}),
        });
      }
    }
    return entries;
  }

  return (raw as InventoryEntry[]).map((e) => ({
    fishId: e.fishId,
    ...(e.size !== undefined ? { size: e.size } : {}),
  }));
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
    achievements: Array.from(playerData.achievements),
    achievementProgress: Array.from(playerData.achievementProgress.entries()),
    fishCaughtCounts: Array.from(playerData.fishCaughtCounts.entries()),
    unlockedSkillNodes: Array.from(playerData.unlockedSkillNodes),
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
      
      const inventory = normalizeInventoryFromSave(parsed.inventory || []);
      
      return {
        ...initial,
        ...parsed,
        inventory,
        caughtFishIds: new Set(parsed.caughtFishIds || []),
        // 新しいフィールドが存在しない場合はデフォルト値を使用
        equippedRodId: parsed.equippedRodId || initial.equippedRodId,
        ownedRods: parsed.ownedRods || (parsed.equippedRodId ? [parsed.equippedRodId] : initial.ownedRods),  // 互換性: 既存データの場合は装備中の釣り竿を所持リストに追加
        baits: parsed.baits || initial.baits,
        equippedBaitId: parsed.equippedBaitId !== undefined ? parsed.equippedBaitId : initial.equippedBaitId,
        ownedLures: parsed.ownedLures || initial.ownedLures,
        equippedLureId: parsed.equippedLureId !== undefined ? parsed.equippedLureId : initial.equippedLureId,
        maxInventorySlots: parsed.maxInventorySlots || initial.maxInventorySlots,
        // レベルシステム（互換性のため）
        exp: parsed.exp !== undefined ? parsed.exp : initial.exp,
        level: parsed.level !== undefined ? parsed.level : initial.level,
        // サイズ記録（互換性のため）
        fishSizes: parsed.fishSizes || initial.fishSizes,
        // 実績システム（互換性のため）
        achievements: new Set(parsed.achievements || []),
        achievementProgress: new Map(parsed.achievementProgress || []),
        totalMoneyEarned: parsed.totalMoneyEarned || initial.totalMoneyEarned,
        consecutiveSuccesses: parsed.consecutiveSuccesses || initial.consecutiveSuccesses,
        fishCaughtCounts: new Map(parsed.fishCaughtCounts || []),
        junkCaughtCount: parsed.junkCaughtCount || initial.junkCaughtCount,
        skillPoints: parsed.skillPoints !== undefined ? parsed.skillPoints : Math.max(0, (parsed.level ?? initial.level) - 1) * 3,
        unlockedSkillNodes: new Set(parsed.unlockedSkillNodes || []),
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
// Lv1: 0。Lv2〜10 までは従来どおり 50*L*(L-1)+50（区間増分は Lv1→2 が150、以降 k→k+1 が 100*k）。
// Lv10 以降の区間（k>=10 の k→k+1）だけ増分を 50*k に緩和する。
export function getRequiredExp(level: number): number {
  if (level <= 1) return 0;
  if (level <= 10) {
    return 50 * level * (level - 1) + 50;
  }
  const baseAt10 = 50 * 10 * 9 + 50;
  const m = level - 1;
  const sum10ToM = (m * (m + 1)) / 2 - 45;
  return baseAt10 + 50 * sum10ToM;
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
  const levelDiff = Math.max(0, playerData.level - oldLevel);
  if (levelDiff > 0) {
    playerData.skillPoints += levelDiff * 3;
  }
  
  // レベルアップしたかどうか
  return playerData.level > oldLevel;
}

// 戦闘能力はスキル解放と装備のみで強化（レベルアップでは能力値は上がらない。SP付与のみ）。

// ============================================
// 実績システム
// ============================================

// 実績の進捗を更新
export function updateAchievementProgress(playerData: PlayerData, achievementId: string, value: number): void {
  playerData.achievementProgress.set(achievementId, value);
}

// 実績の進捗率を取得（0.0〜1.0）
export function getAchievementProgress(playerData: PlayerData, achievement: AchievementConfig): number {
  const currentValue = playerData.achievementProgress.get(achievement.id) || 0;
  const targetValue = achievement.condition.target;
  
  // all_collectionの場合は動的に全種類数を取得
  if (achievement.condition.type === 'all_collection') {
    const totalFishCount = getRealFishCount();
    const caughtCount = Array.from(playerData.caughtFishIds).filter(id => !id.startsWith('junk_')).length;
    if (totalFishCount === 0) return 1.0;
    return Math.min(1.0, caughtCount / totalFishCount);
  }
  
  // all_rarityの場合は動的に全種類数を取得
  if (achievement.condition.type === 'all_rarity' && achievement.condition.rarity) {
    const fishOfRarity = fishConfigs.filter(f => 
      f.rarity === achievement.condition.rarity && !f.id.startsWith('junk_')
    );
    const totalCount = fishOfRarity.length;
    if (totalCount === 0) return 1.0;
    return Math.min(1.0, currentValue / totalCount);
  }
  
  // first_rarityの場合は、targetが1なのでそのまま使用
  if (achievement.condition.type === 'first_rarity') {
    const target = achievement.condition.target || 1;
    return Math.min(1.0, currentValue / target);
  }
  
  // targetValueが0または未定義の場合は1.0を返す
  if (!targetValue || targetValue === 0) return 1.0;
  return Math.min(1.0, currentValue / targetValue);
}

/** UI用: 進捗の分子・分母と単位（実績タブの「6 / 10 匹」表示互換） */
export function getAchievementProgressDisplay(
  playerData: PlayerData,
  achievement: AchievementConfig
): { current: number; target: number; unit: string } {
  const c = achievement.condition;
  if (c.type === 'all_collection') {
    const totalFishCount = Math.max(1, getRealFishCount());
    const caughtCount = Array.from(playerData.caughtFishIds).filter((id) => !id.startsWith('junk_')).length;
    return { current: caughtCount, target: totalFishCount, unit: '種' };
  }
  if (c.type === 'first_rarity') {
    const v = checkCondition(playerData, c);
    return { current: v, target: 1, unit: '' };
  }
  if (c.type === 'all_rarity' && c.rarity) {
    const fishOfRarity = fishConfigs.filter((f) => f.rarity === c.rarity && !f.id.startsWith('junk_'));
    const target = Math.max(1, fishOfRarity.length);
    const current = Math.min(target, checkCondition(playerData, c));
    return { current, target, unit: '種' };
  }
  const currentRaw = checkCondition(playerData, c);
  const target = c.target && c.target > 0 ? c.target : 1;
  const current = Math.min(currentRaw, target);
  const unitMap: Record<string, string> = {
    total_caught: '匹',
    junk_caught: '匹',
    level: '',
    total_money_earned: 'G',
    collection_count: '種',
    all_rods: '種',
    all_baits: '種',
    all_lures: '種',
    all_equipment: '種',
    consecutive_success: '回',
  };
  return { current, target, unit: unitMap[c.type] ?? '' };
}

// 条件をチェックして進捗を更新
function checkCondition(playerData: PlayerData, condition: AchievementCondition): number {
  switch (condition.type) {
    case 'total_caught':
      return playerData.totalCaught;
    
    case 'level':
      return playerData.level;
    
    case 'total_money_earned':
      return playerData.totalMoneyEarned;
    
    case 'collection_count':
      return playerData.caughtFishIds.size;
    
    case 'all_collection':
      // 全種類の魚を釣ったかチェック（ゴミを除く）
      const totalFishCount = getRealFishCount();
      const caughtCount = Array.from(playerData.caughtFishIds).filter(id => !id.startsWith('junk_')).length;
      return caughtCount === totalFishCount ? 1 : 0;
    
    case 'first_rarity':
      // 特定のレア度の魚を一度でも釣ったかチェック
      if (condition.rarity) {
        for (const fishId of playerData.caughtFishIds) {
          const fish = getFishById(fishId);
          if (fish && fish.rarity === condition.rarity) {
            return 1;
          }
        }
      }
      return 0;
    
    case 'all_rarity':
      // 特定のレア度の全種類を釣ったかチェック（進捗を返す）
      if (condition.rarity) {
        const fishOfRarity = fishConfigs.filter(f => 
          f.rarity === condition.rarity && !f.id.startsWith('junk_')
        );
        let caughtCount = 0;
        for (const fish of fishOfRarity) {
          if (playerData.caughtFishIds.has(fish.id)) {
            caughtCount++;
          }
        }
        // 進捗を返す（目標値は全種類数）
        return caughtCount;
      }
      return 0;
    
    case 'all_rods':
      return playerData.ownedRods.length;
    
    case 'all_baits':
      return playerData.baits.length;
    
    case 'all_lures':
      return playerData.ownedLures.length;
    
    case 'all_equipment':
      return playerData.ownedRods.length + playerData.baits.length + playerData.ownedLures.length;
    
    case 'consecutive_success':
      return playerData.consecutiveSuccesses;
    
    case 'junk_caught':
      return playerData.junkCaughtCount;
    
    default:
      return 0;
  }
}

// 実績を解除
export function unlockAchievement(playerData: PlayerData, achievement: AchievementConfig): void {
  if (playerData.achievements.has(achievement.id)) {
    return; // 既に解除済み
  }
  
  playerData.achievements.add(achievement.id);
  
  // 報酬を付与
  if (achievement.reward) {
    if (achievement.reward.money) {
      playerData.money += achievement.reward.money;
    }
    if (achievement.reward.exp) {
      addExp(playerData, achievement.reward.exp);
    }
    // アイテム報酬は後で実装（必要に応じて）
  }
}

// 実績をチェックして、達成したものを返す
export function checkAchievements(playerData: PlayerData, categories?: string[]): AchievementConfig[] {
  const unlocked: AchievementConfig[] = [];
  
  // カテゴリでフィルタリング
  const achievementsToCheck = categories
    ? achievementConfigs.filter(a => categories.includes(a.category))
    : achievementConfigs;
  
  for (const achievement of achievementsToCheck) {
    // 既に解除済みの場合はスキップ
    if (playerData.achievements.has(achievement.id)) {
      continue;
    }
    
    // 条件をチェック
    const currentValue = checkCondition(playerData, achievement.condition);
    
    // 進捗を更新
    updateAchievementProgress(playerData, achievement.id, currentValue);
    
    // 達成条件を満たしているかチェック
    // all_collectionの場合は、currentValueが1（全種類達成）の場合に達成
    if (achievement.condition.type === 'all_collection') {
      if (currentValue >= 1) {
        unlockAchievement(playerData, achievement);
        unlocked.push(achievement);
      }
    } else {
      const targetValue = achievement.condition.target;
      if (currentValue >= targetValue) {
        unlockAchievement(playerData, achievement);
        unlocked.push(achievement);
      }
    }
  }
  
  return unlocked;
}

// 連続成功を更新（成功時）
export function incrementConsecutiveSuccess(playerData: PlayerData): void {
  playerData.consecutiveSuccesses++;
}

// 連続成功をリセット（失敗時）
export function resetConsecutiveSuccess(playerData: PlayerData): void {
  playerData.consecutiveSuccesses = 0;
}


import type { PlayerData } from './inventory';
import { getFishById } from './fish';
import {
  AQUARIUM_CAPACITY,
  AQUARIUM_GROWTH_STAGES,
  AQUARIUM_SATIETY_DURATION_MS,
  AQUARIUM_FOOD_TIERS,
  AQUARIUM_RARITY_BONUS_BASE,
  AQUARIUM_HABITAT_STAT,
  AQUARIUM_STAT_OVERRIDES,
  type AquariumFoodTier,
  type AquariumGrowthStage,
  type AquariumStatKey,
} from './aquariumConfig';

/** 水槽内の1匹 */
export interface AquariumFishEntry {
  fishId: string;
  size?: number;      // バッグから引き継いだcm。表示用
  feedCount: number;  // 累計摂食回数（成長値）
  addedAt: number;    // Date.now()
  lastFedAt: number;  // Date.now()。0 = 未摂食
  /** 直近の摂食で適用した満腹時間。未設定時は通常エサの時間 */
  lastFedSatietyMs?: number;
}

export function getAquariumFoodCount(playerData: PlayerData, tier: AquariumFoodTier): number {
  if (tier === 'premium') return playerData.aquariumPremiumFoodCount ?? 0;
  return playerData.aquariumFoodCount ?? 0;
}

export function setAquariumFoodCount(playerData: PlayerData, tier: AquariumFoodTier, count: number): void {
  const next = Math.max(0, count);
  if (tier === 'premium') playerData.aquariumPremiumFoodCount = next;
  else playerData.aquariumFoodCount = next;
}

export function addAquariumFoodCount(playerData: PlayerData, tier: AquariumFoodTier, delta: number): void {
  setAquariumFoodCount(playerData, tier, getAquariumFoodCount(playerData, tier) + delta);
}

export function hasAquarium(playerData: PlayerData): boolean {
  return playerData.ownedTools.includes('tool_aquarium');
}

export function getGrowthStage(feedCount: number): AquariumGrowthStage {
  for (let i = AQUARIUM_GROWTH_STAGES.length - 1; i >= 0; i--) {
    const stage = AQUARIUM_GROWTH_STAGES[i];
    if (feedCount >= stage.requiredFeeds) return stage;
  }
  return AQUARIUM_GROWTH_STAGES[0];
}

export function getNextGrowthStage(feedCount: number): AquariumGrowthStage | null {
  const current = getGrowthStage(feedCount);
  const next = AQUARIUM_GROWTH_STAGES.find((s) => s.level === current.level + 1);
  return next ?? null;
}

function getEntrySatietyMs(entry: AquariumFishEntry): number {
  return entry.lastFedSatietyMs ?? AQUARIUM_SATIETY_DURATION_MS;
}

export function isSatiated(entry: AquariumFishEntry, now: number): boolean {
  if (!entry.lastFedAt) return false;
  return now - entry.lastFedAt < getEntrySatietyMs(entry);
}

export function getSatietyRemainingMs(entry: AquariumFishEntry, now: number): number {
  if (!entry.lastFedAt) return 0;
  return Math.max(0, getEntrySatietyMs(entry) - (now - entry.lastFedAt));
}

export function getAquariumStatKeyForFish(fishId: string): AquariumStatKey {
  const override = AQUARIUM_STAT_OVERRIDES[fishId];
  if (override) return override;
  const fish = getFishById(fishId);
  if (fish) return AQUARIUM_HABITAT_STAT[fish.habitat];
  return 'power';
}

export function getAquariumBonusForEntry(entry: AquariumFishEntry): { stat: AquariumStatKey; value: number } {
  const fish = getFishById(entry.fishId);
  const stat = getAquariumStatKeyForFish(entry.fishId);
  if (!fish) return { stat, value: 0 };
  const stage = getGrowthStage(entry.feedCount);
  const base = AQUARIUM_RARITY_BONUS_BASE[fish.rarity] ?? 0;
  return { stat, value: base * stage.level };
}

/**
 * 4ステ合計。skills.ts から呼ばれる。
 * 同一 fishId の2匹目以降を逓減する余地あり（初期実装では行わない）。
 */
export function getAquariumStatBonuses(playerData: PlayerData): {
  powerAdd: number;
  speedAdd: number;
  techniqueAdd: number;
  controlAdd: number;
} {
  const result = { powerAdd: 0, speedAdd: 0, techniqueAdd: 0, controlAdd: 0 };
  if (!hasAquarium(playerData) || !playerData.aquarium?.length) return result;

  for (const entry of playerData.aquarium) {
    const { stat, value } = getAquariumBonusForEntry(entry);
    if (stat === 'power') result.powerAdd += value;
    else if (stat === 'speed') result.speedAdd += value;
    else if (stat === 'technique') result.techniqueAdd += value;
    else result.controlAdd += value;
  }
  return result;
}

export function addFishToAquarium(playerData: PlayerData, inventoryIndex: number): boolean {
  if (!hasAquarium(playerData)) return false;
  if (!playerData.aquarium) playerData.aquarium = [];
  if (playerData.aquarium.length >= AQUARIUM_CAPACITY) return false;
  if (inventoryIndex < 0 || inventoryIndex >= playerData.inventory.length) return false;

  const entry = playerData.inventory[inventoryIndex];
  if (!entry || entry.fishId.startsWith('junk_')) return false;

  playerData.inventory.splice(inventoryIndex, 1);
  playerData.aquarium.push({
    fishId: entry.fishId,
    ...(entry.size !== undefined ? { size: entry.size } : {}),
    feedCount: 0,
    addedAt: Date.now(),
    lastFedAt: 0,
  });
  return true;
}

export function removeFishFromAquarium(playerData: PlayerData, aquariumIndex: number): boolean {
  if (!playerData.aquarium) return false;
  if (aquariumIndex < 0 || aquariumIndex >= playerData.aquarium.length) return false;
  if (playerData.inventory.length >= playerData.maxInventorySlots) return false;

  const entry = playerData.aquarium[aquariumIndex];
  playerData.aquarium.splice(aquariumIndex, 1);
  playerData.inventory.push({
    fishId: entry.fishId,
    ...(entry.size !== undefined ? { size: entry.size } : {}),
  });
  return true;
}

/** 水槽の魚とバッグの魚を1:1で入れかえる（バッグ満杯でも可。成長はリセット） */
export function swapAquariumFish(
  playerData: PlayerData,
  aquariumIndex: number,
  inventoryIndex: number,
): boolean {
  if (!hasAquarium(playerData) || !playerData.aquarium) return false;
  if (aquariumIndex < 0 || aquariumIndex >= playerData.aquarium.length) return false;
  if (inventoryIndex < 0 || inventoryIndex >= playerData.inventory.length) return false;

  const inv = playerData.inventory[inventoryIndex];
  if (!inv || inv.fishId.startsWith('junk_')) return false;
  if (!getFishById(inv.fishId)) return false;

  const aqua = playerData.aquarium[aquariumIndex];
  playerData.inventory[inventoryIndex] = {
    fishId: aqua.fishId,
    ...(aqua.size !== undefined ? { size: aqua.size } : {}),
  };
  playerData.aquarium[aquariumIndex] = {
    fishId: inv.fishId,
    ...(inv.size !== undefined ? { size: inv.size } : {}),
    feedCount: 0,
    addedAt: Date.now(),
    lastFedAt: 0,
  };
  return true;
}

export function feedAquariumFish(
  playerData: PlayerData,
  aquariumIndex: number,
  now: number,
  tier: AquariumFoodTier = 'normal',
): { ok: boolean; leveledUp: boolean } {
  if (!playerData.aquarium || aquariumIndex < 0 || aquariumIndex >= playerData.aquarium.length) {
    return { ok: false, leveledUp: false };
  }
  if (getAquariumFoodCount(playerData, tier) <= 0) {
    return { ok: false, leveledUp: false };
  }

  const entry = playerData.aquarium[aquariumIndex];
  if (isSatiated(entry, now)) {
    return { ok: false, leveledUp: false };
  }

  const food = AQUARIUM_FOOD_TIERS[tier];
  const beforeLevel = getGrowthStage(entry.feedCount).level;
  addAquariumFoodCount(playerData, tier, -1);
  entry.feedCount += food.feedGain;
  entry.lastFedAt = now;
  entry.lastFedSatietyMs = food.satietyMs;
  const afterLevel = getGrowthStage(entry.feedCount).level;
  return { ok: true, leveledUp: afterLevel > beforeLevel };
}

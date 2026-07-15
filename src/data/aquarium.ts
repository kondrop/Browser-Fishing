import type { PlayerData } from './inventory';
import { getFishById } from './fish';
import {
  AQUARIUM_CAPACITY,
  AQUARIUM_GROWTH_STAGES,
  AQUARIUM_SATIETY_DURATION_MS,
  AQUARIUM_RARITY_BONUS_BASE,
  AQUARIUM_HABITAT_STAT,
  AQUARIUM_STAT_OVERRIDES,
  type AquariumGrowthStage,
  type AquariumStatKey,
} from './aquariumConfig';

/** 水槽内の1匹 */
export interface AquariumFishEntry {
  fishId: string;
  size?: number;      // バッグから引き継いだcm。表示用
  feedCount: number;  // 累計摂食回数
  addedAt: number;    // Date.now()
  lastFedAt: number;  // Date.now()。0 = 未摂食
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

export function isSatiated(entry: AquariumFishEntry, now: number): boolean {
  if (!entry.lastFedAt) return false;
  return now - entry.lastFedAt < AQUARIUM_SATIETY_DURATION_MS;
}

export function getSatietyRemainingMs(entry: AquariumFishEntry, now: number): number {
  if (!entry.lastFedAt) return 0;
  return Math.max(0, AQUARIUM_SATIETY_DURATION_MS - (now - entry.lastFedAt));
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

export function feedAquariumFish(
  playerData: PlayerData,
  aquariumIndex: number,
  now: number,
): { ok: boolean; leveledUp: boolean } {
  if (!playerData.aquarium || aquariumIndex < 0 || aquariumIndex >= playerData.aquarium.length) {
    return { ok: false, leveledUp: false };
  }
  if ((playerData.aquariumFoodCount ?? 0) <= 0) {
    return { ok: false, leveledUp: false };
  }

  const entry = playerData.aquarium[aquariumIndex];
  if (isSatiated(entry, now)) {
    return { ok: false, leveledUp: false };
  }

  const beforeLevel = getGrowthStage(entry.feedCount).level;
  playerData.aquariumFoodCount -= 1;
  entry.feedCount += 1;
  entry.lastFedAt = now;
  const afterLevel = getGrowthStage(entry.feedCount).level;
  return { ok: true, leveledUp: afterLevel > beforeLevel };
}

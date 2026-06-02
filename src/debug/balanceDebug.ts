import { config } from '../config';
import type { PlayerData } from '../data/inventory';
import { getRequiredExp } from '../data/inventory';
import { getRodById } from '../data/shopConfig';
import { getSkillStatBonuses, type SkillStatBonuses } from '../data/skills';
import { getControlDisplayIndex, sumControlBonus } from '../fight/fightControl';

export type BalanceDebugStatKey = 'power' | 'speed' | 'technique' | 'control';

export interface BalanceDebugOverrides {
  statBonusAdd: Partial<SkillStatBonuses>;
}

const EMPTY_SKILL_BONUSES: SkillStatBonuses = {
  castDistSkillAdd: 0,
  gaugeSpeedSkillAdd: 0,
  barRangeSkillAdd: 0,
  fightBarDragSkillAdd: 0,
  sellPriceSkillMul: 0,
  junkRateSkillMul: 1,
};

export const balanceDebugOverrides: BalanceDebugOverrides = {
  statBonusAdd: {},
};

export function resetBalanceDebugOverrides(): void {
  balanceDebugOverrides.statBonusAdd = {};
}

function mergeSkillBonuses(base: SkillStatBonuses, add: Partial<SkillStatBonuses>): SkillStatBonuses {
  return {
    castDistSkillAdd: base.castDistSkillAdd + (add.castDistSkillAdd ?? 0),
    gaugeSpeedSkillAdd: base.gaugeSpeedSkillAdd + (add.gaugeSpeedSkillAdd ?? 0),
    barRangeSkillAdd: base.barRangeSkillAdd + (add.barRangeSkillAdd ?? 0),
    fightBarDragSkillAdd: base.fightBarDragSkillAdd + (add.fightBarDragSkillAdd ?? 0),
    sellPriceSkillMul: base.sellPriceSkillMul + (add.sellPriceSkillMul ?? 0),
    junkRateSkillMul: base.junkRateSkillMul * (add.junkRateSkillMul ?? 1),
  };
}

export function getEffectiveSkillStatBonuses(playerData: PlayerData): SkillStatBonuses {
  return mergeSkillBonuses(getSkillStatBonuses(playerData), balanceDebugOverrides.statBonusAdd);
}

/** レベルアップで付与される累計SP（Lv1=0, 以降レベルごとに+3） */
export function getSkillPointsGrantedByLevel(level: number): number {
  return Math.max(0, Math.floor(level) - 1) * 3;
}

/** 解放済みスキルをすべて解除し、SPをレベル由来分に戻す */
export function resetUnlockedSkills(playerData: PlayerData): void {
  playerData.unlockedSkillNodes.clear();
  playerData.skillPoints = getSkillPointsGrantedByLevel(playerData.level);
}

/** 未使用SPをレベル由来分に再設定（取得スキルはそのまま） */
export function resetSkillPointsToLevelGrant(playerData: PlayerData): void {
  playerData.skillPoints = getSkillPointsGrantedByLevel(playerData.level);
}

export function setPlayerLevelForDebug(playerData: PlayerData, level: number): void {
  const clamped = Math.max(1, Math.floor(level));
  playerData.level = clamped;
  playerData.exp = getRequiredExp(clamped);
}

export function syncPlayerLevelFromExp(playerData: PlayerData): void {
  let level = 1;
  while (getRequiredExp(level + 1) <= playerData.exp) {
    level++;
  }
  playerData.level = level;
}

export type DisplayStatIndices = Record<BalanceDebugStatKey, number>;

export function calculateDisplayStatIndices(playerData: PlayerData, rodId: string): DisplayStatIndices {
  const rod = getRodById(rodId);
  const skillBonuses = getEffectiveSkillStatBonuses(playerData);
  const fightCfg = config.fighting;

  const fmtBookStatIndex = (v: number) => Math.round(Math.max(0, v) * 100);

  const baseBarHeight = fightCfg['5-9_バー判定範囲'];
  const effectiveBarHeight = Math.min(
    1.0,
    baseBarHeight + skillBonuses.barRangeSkillAdd + (rod?.techniqueStatAdd ?? 0),
  );
  const controlBonus = sumControlBonus(
    skillBonuses.fightBarDragSkillAdd,
    rod?.controlStatAdd ?? 0,
  );

  return {
    power: fmtBookStatIndex(1 + (rod?.powerStatAdd ?? 0) + skillBonuses.castDistSkillAdd),
    speed: fmtBookStatIndex(
      1 + (rod?.speedStatAdd ?? 0) + skillBonuses.gaugeSpeedSkillAdd,
    ),
    technique: fmtBookStatIndex(effectiveBarHeight),
    control: getControlDisplayIndex(controlBonus),
  };
}

/** ステータス画面と同じ基準100の表示値を指定し、デバッグ加算を逆算する */
export function setDebugStatTargetIndex(
  playerData: PlayerData,
  rodId: string,
  key: BalanceDebugStatKey,
  targetIndex: number,
): void {
  const rod = getRodById(rodId);
  const skill = getSkillStatBonuses(playerData);
  const fightCfg = config.fighting;
  const target = Math.max(0, targetIndex);

  switch (key) {
    case 'power': {
      const base = 1 + (rod?.powerStatAdd ?? 0) + skill.castDistSkillAdd;
      balanceDebugOverrides.statBonusAdd.castDistSkillAdd = target / 100 - base;
      break;
    }
    case 'speed': {
      const base = 1 + (rod?.speedStatAdd ?? 0) + skill.gaugeSpeedSkillAdd;
      balanceDebugOverrides.statBonusAdd.gaugeSpeedSkillAdd = target / 100 - base;
      break;
    }
    case 'technique': {
      const baseBarHeight = fightCfg['5-9_バー判定範囲'];
      const withoutDebug = baseBarHeight + skill.barRangeSkillAdd + (rod?.techniqueStatAdd ?? 0);
      balanceDebugOverrides.statBonusAdd.barRangeSkillAdd = target / 100 - withoutDebug;
      break;
    }
    case 'control': {
      const baseControl = sumControlBonus(skill.fightBarDragSkillAdd, rod?.controlStatAdd ?? 0);
      balanceDebugOverrides.statBonusAdd.fightBarDragSkillAdd = (target - 100) / 100 - baseControl;
      break;
    }
    default:
      break;
  }
}

export function getEmptySkillBonuses(): SkillStatBonuses {
  return { ...EMPTY_SKILL_BONUSES };
}

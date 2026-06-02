import { config } from '../config';
import type { FishConfig } from '../data/fishConfig';
import type { PlayerData } from '../data/inventory';
import { calculateCatchRateWithSize } from '../data/inventory';
import { getRodById } from '../data/shopConfig';
import { getSkillStatBonuses, hasSkillAbility, type SkillStatBonuses } from '../data/skills';
import { stepFightBarVelocity, sumControlBonus } from './fightControl';

/** バランスプレビュー用の参照魚（本番の「標準的な魚」に近い値。config.fighting から読む） */
export function getBalanceReferenceFishParams(): Pick<
  FishConfig,
  'catchRate' | 'escapeRate' | 'fishSpeed' | 'fishErratic' | 'moveInterval' | 'maxSize'
> {
  const cfg = config.fighting;
  return {
    catchRate: cfg['5-22_参照魚_catchRate'],
    escapeRate: cfg['5-23_参照魚_escapeRate'],
    fishSpeed: cfg['5-24_参照魚_fishSpeed'],
    fishErratic: cfg['5-25_参照魚_fishErratic'],
    moveInterval: [cfg['5-13_魚の移動間隔_最短'], cfg['5-14_魚の移動間隔_最長']],
    maxSize: cfg['5-26_参照魚_maxSize'],
  };
}

export interface FightSimFishParams {
  catchRate: number;
  escapeRate: number;
  fishSpeed: number;
  fishErratic: number;
  moveInterval: [number, number];
  maxSize: number;
  /** サイズ補正用。未指定ならサイズ補正なし */
  sizeCm?: number;
}

export interface FightSimState {
  fishBarPosition: number;
  fishTargetPosition: number;
  fishMoveTimer: number;
  fishDriftIntent: number;
  fishDriftVelocity: number;
  playerBarPosition: number;
  playerBarVelocity: number;
  catchProgress: number;
  fishFreezeRemainingSec: number;
  lockOnRemainingSec: number;
  smoothDragRemainingSec: number;
  speedComboMultiplier: number;
  fightStaggerUsed: boolean;
  fightSmoothDragUsed: boolean;
  fightLockOnUsed: boolean;
  isCatching: boolean;
}

export interface FightSimStepInput {
  dt: number;
  spaceHeld: boolean;
  playerData: PlayerData;
  equippedRodId: string;
  fish: FightSimFishParams;
  /** デバッグ加算込み。省略時は getSkillStatBonuses のみ */
  skillBonuses?: SkillStatBonuses;
  /** true: 勝敗なし（ゲージを範囲内にクランプ） */
  sandbox?: boolean;
  /** スキル入力（JustDown 相当）。skipSkillTriggers 時は無視 */
  triggerLockOn?: boolean;
  triggerStagger?: boolean;
  triggerSmoothDrag?: boolean;
  /** true ならスキル発動を step 内で処理しない（本番 GameScene 側で tryUse* 済み） */
  skipSkillTriggers?: boolean;
}

const SPEED_COMBO_GROW_PER_SECOND = 0.25;

export function createFightSimState(playerData: PlayerData, initialGauge?: number): FightSimState {
  const fightCfg = config.fighting;
  const fightStartMoveDelaySec = hasSkillAbility(playerData, 'abil_luck_junk_ward')
    ? fightCfg['5-12b_開始時魚移動待機秒_シルクタッチ']
    : fightCfg['5-12a_開始時魚移動待機秒'];
  return {
    fishBarPosition: 0.4,
    fishTargetPosition: 0.4,
    fishMoveTimer: fightStartMoveDelaySec,
    fishDriftIntent: 0,
    fishDriftVelocity: 0,
    playerBarPosition: 0.3,
    playerBarVelocity: 0,
    catchProgress: initialGauge ?? fightCfg['5-12_初期ゲージ'],
    fishFreezeRemainingSec: 0,
    lockOnRemainingSec: 0,
    smoothDragRemainingSec: 0,
    speedComboMultiplier: 0,
    fightStaggerUsed: false,
    fightSmoothDragUsed: false,
    fightLockOnUsed: false,
    isCatching: false,
  };
}

function floatBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function linear(current: number, target: number, t: number): number {
  return current + (target - current) * t;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function resolveSkillBonuses(playerData: PlayerData, override?: SkillStatBonuses): SkillStatBonuses {
  return override ?? getSkillStatBonuses(playerData);
}

function tryTriggerSkills(state: FightSimState, playerData: PlayerData, input: FightSimStepInput): void {
  if (input.skipSkillTriggers) return;
  if (input.triggerLockOn && !state.fightLockOnUsed && hasSkillAbility(playerData, 'abil_control_lock_on')) {
    state.lockOnRemainingSec = 1.0;
    state.fightLockOnUsed = true;
  }
  if (input.triggerStagger && !state.fightStaggerUsed && hasSkillAbility(playerData, 'abil_power_fight_steady')) {
    state.fishFreezeRemainingSec = 1.5;
    state.fightStaggerUsed = true;
  }
  if (input.triggerSmoothDrag && !state.fightSmoothDragUsed && hasSkillAbility(playerData, 'abil_control_smooth_drag')) {
    state.smoothDragRemainingSec = 3.0;
    state.fightSmoothDragUsed = true;
  }
}

/** 本番ファイトと同一ロジックで1フレーム進める */
export function stepFightSimulation(state: FightSimState, input: FightSimStepInput): void {
  const { dt, spaceHeld, playerData, equippedRodId, fish } = input;
  const cfg = config.fighting;
  const skillBonuses = resolveSkillBonuses(playerData, input.skillBonuses);
  const equippedRod = getRodById(equippedRodId);

  tryTriggerSkills(state, playerData, input);

  const controlBonus = sumControlBonus(
    skillBonuses.fightBarDragSkillAdd,
    equippedRod?.controlStatAdd ?? 0,
  );
  state.playerBarVelocity = stepFightBarVelocity(state.playerBarVelocity, spaceHeld, controlBonus, dt);
  state.playerBarPosition += state.playerBarVelocity * dt;

  if (state.playerBarPosition < 0) {
    state.playerBarPosition = 0;
    state.playerBarVelocity = 0;
  } else if (state.playerBarPosition > 0.8) {
    state.playerBarPosition = 0.8;
    state.playerBarVelocity = -state.playerBarVelocity * 0.3;
  }

  const moveIntervalMin = fish.moveInterval[0] ?? cfg['5-13_魚の移動間隔_最短'];
  const moveIntervalMax = fish.moveInterval[1] ?? cfg['5-14_魚の移動間隔_最長'];
  const minRange = cfg['5-16_魚の移動範囲_下'];
  const maxRange = cfg['5-17_魚の移動範囲_上'];
  const center = (minRange + maxRange) * 0.5;
  const rangeWidth = maxRange - minRange;

  state.fishMoveTimer -= dt;
  state.fishFreezeRemainingSec = Math.max(0, state.fishFreezeRemainingSec - dt);

  // 一定間隔で「進みたい方向」を更新し、位置は毎フレーム連続的にドリフトさせる
  if (state.fishMoveTimer <= 0 && state.fishFreezeRemainingSec <= 0) {
    // 意図更新の間隔スケール。小さいほど頻繁に進行方向が変わる
    const intervalScale = clamp(
      cfg['5-30_方向更新間隔スケール_基準'] + fish.fishSpeed * cfg['5-31_方向更新間隔スケール_魚速度寄与'],
      cfg['5-32_方向更新間隔スケール_下限'],
      cfg['5-33_方向更新間隔スケール_上限'],
    );
    // 次回更新までの最短秒数（下限を設けて過剰なガチャつきを防ぐ）
    const nextIntervalMin = Math.max(cfg['5-34_方向更新最短秒_下限'], moveIntervalMin * intervalScale);
    // 次回更新までの最長秒数（Minとの差を確保してランダム幅を維持）
    const nextIntervalMax = Math.max(
      nextIntervalMin + cfg['5-35_方向更新最長秒_最小差分'],
      moveIntervalMax * intervalScale,
    );
    // 「次に向きたい方向」を更新するまでの待ち時間
    state.fishMoveTimer = floatBetween(nextIntervalMin, nextIntervalMax);

    // 新しい方向意図の候補（-1:下方向 / 1:上方向）
    const randomIntent = floatBetween(-1, 1);
    // 方向意図の混ぜ率。上げると意図変化が強くなり動きが読みにくくなる
    const intentBlend = clamp(
      cfg['5-36_方向意図ブレンド_基準'] + fish.fishErratic * cfg['5-37_方向意図ブレンド_魚暴れ寄与'],
      cfg['5-38_方向意図ブレンド_下限'],
      cfg['5-39_方向意図ブレンド_上限'],
    );
    // 現在意図と新規意図を補間して、急激な方向反転を避ける
    state.fishDriftIntent = linear(state.fishDriftIntent, randomIntent, intentBlend);
  }

  if (state.fishFreezeRemainingSec <= 0) {
    // 連続移動のまま難易度を上げるため、ドリフト速度と追従性を強化
    // ベース巡航速度。全魚共通で効く値（上げると全体難易度が上がる）
    const maxDriftSpeed =
      rangeWidth * (cfg['5-40_ドリフト速度_基準'] + fish.fishSpeed * cfg['5-41_ドリフト速度_魚速度寄与']);
    // 目標速度への追従性。上げると方向転換がキビキビし、揺れが細かくなる
    const driftResponse =
      cfg['5-42_速度追従性_基準'] + fish.fishErratic * cfg['5-43_速度追従性_魚暴れ寄与'];
    // その瞬間に向かいたい速度（意図方向 × 速度上限）
    const driftTargetVelocity = state.fishDriftIntent * maxDriftSpeed;
    // フレーム時間考慮の補間係数（0〜1）。大きいほど追従が速い
    const driftVelT = Math.min(1, driftResponse * dt);
    // 実速度を目標速度へ滑らかに寄せる（無段階の動きの中核）
    state.fishDriftVelocity = linear(state.fishDriftVelocity, driftTargetVelocity, driftVelT);

    // 中央への復元力。上げると中央寄りになり、下げると端側まで泳ぎやすい
    const centerPull =
      (center - state.fishTargetPosition) *
      (cfg['5-44_中央復元力_基準'] + fish.fishErratic * cfg['5-45_中央復元力_魚暴れ寄与']);
    // ドリフト速度と復元力を合成してターゲット位置を更新
    state.fishTargetPosition += (state.fishDriftVelocity + centerPull) * dt;
    // UIレンジ外に出ないようにクランプ
    state.fishTargetPosition = clamp(state.fishTargetPosition, minRange, maxRange);
  }

  const baseLerpSpeed = cfg['5-15_魚のなめらかさ'];
  const lerpSpeed =
    baseLerpSpeed * (cfg['5-46_魚追従倍率_基準'] + fish.fishSpeed * cfg['5-47_魚追従倍率_魚速度寄与']);
  const fishFollowT = Math.min(1, lerpSpeed * dt * cfg['5-48_魚追従_フレーム基準']);
  if (state.fishFreezeRemainingSec <= 0) {
    state.fishBarPosition = linear(state.fishBarPosition, state.fishTargetPosition, fishFollowT);
  }

  state.lockOnRemainingSec = Math.max(0, state.lockOnRemainingSec - dt);
  if (state.lockOnRemainingSec > 0) {
    state.playerBarPosition = linear(state.playerBarPosition, state.fishBarPosition - 0.05, 0.25);
  }

  const baseBarHeight = cfg['5-9_バー判定範囲'];
  const elapsedFightSec = Math.max(0, (1 - state.catchProgress) * 8);
  const nearmissBonus = hasSkillAbility(playerData, 'abil_control_nearmiss_save')
    ? Math.min(0.08, elapsedFightSec * 0.01)
    : 0;
  state.smoothDragRemainingSec = Math.max(0, state.smoothDragRemainingSec - dt);
  const smoothDragBonus = state.smoothDragRemainingSec > 0 ? 0.12 : 0;
  const barHeight = Math.min(
    1.0,
    baseBarHeight +
      skillBonuses.barRangeSkillAdd +
      (equippedRod?.techniqueStatAdd || 0) +
      nearmissBonus +
      smoothDragBonus,
  );

  state.isCatching =
    state.fishBarPosition >= state.playerBarPosition &&
    state.fishBarPosition <= state.playerBarPosition + barHeight;

  const criticalZoneHeight = hasSkillAbility(playerData, 'abil_speed_opening_surge') ? 0.08 : 0;
  const playerHitBarCenter = state.playerBarPosition + barHeight / 2;
  const criticalZoneTop = playerHitBarCenter + criticalZoneHeight / 2;
  const criticalZoneBottom = playerHitBarCenter - criticalZoneHeight / 2;
  const isInCriticalZone =
    criticalZoneHeight > 0 &&
    state.fishBarPosition >= criticalZoneBottom &&
    state.fishBarPosition <= criticalZoneTop &&
    state.isCatching;

  const rodSpeedStatAdd = equippedRod?.speedStatAdd || 0;
  let adjustedCatchRate = fish.catchRate;
  if (fish.sizeCm !== undefined && fish.maxSize > 0) {
    const sizeRatio = fish.sizeCm / fish.maxSize;
    adjustedCatchRate = calculateCatchRateWithSize(
      fish.catchRate,
      sizeRatio,
      cfg['5-12e_サイズ難易度係数'],
    );
  }

  if (state.isCatching) {
    const baseGaugeSpeed = cfg['5-10_ゲージ増加速度'];
    const rodCatchAdd = baseGaugeSpeed * rodSpeedStatAdd;
    if (hasSkillAbility(playerData, 'abil_speed_last_push')) {
      state.speedComboMultiplier = Math.min(
        0.5,
        state.speedComboMultiplier + SPEED_COMBO_GROW_PER_SECOND * dt,
      );
    }
    const critAdd = isInCriticalZone ? 0.035 : 0;
    const skillGaugeAdd = baseGaugeSpeed * skillBonuses.gaugeSpeedSkillAdd;
    const equipAndFishGain = baseGaugeSpeed * adjustedCatchRate + rodCatchAdd;
    const comboAdd = baseGaugeSpeed * state.speedComboMultiplier;
    state.catchProgress += (equipAndFishGain + skillGaugeAdd + critAdd + comboAdd) * dt;
  } else {
    const controlForDecayT = clamp(
      controlBonus / Math.max(0.01, cfg['5-12d_減少倍率補正が最大になるコントロール値']),
      0,
      1,
    );
    const lowControlDecayMultiplier = linear(
      cfg['5-12c_低コントロール時減少倍率_最小'],
      1,
      controlForDecayT,
    );
    state.catchProgress -= cfg['5-11_ゲージ減少速度'] * fish.escapeRate * lowControlDecayMultiplier * dt;
    state.speedComboMultiplier = 0;
  }

  if (input.sandbox) {
    const minP = cfg['5-27_サンドボックス_ゲージ下限'];
    const maxP = cfg['5-28_サンドボックス_ゲージ上限'];
    state.catchProgress = Math.max(minP, Math.min(maxP, state.catchProgress));
  } else {
    state.catchProgress = Math.max(0, Math.min(1, state.catchProgress));
  }
}

export function getFightBarHeight(
  state: FightSimState,
  playerData: PlayerData,
  equippedRodId: string,
  skillBonuses?: SkillStatBonuses,
): number {
  const cfg = config.fighting;
  const bonuses = resolveSkillBonuses(playerData, skillBonuses);
  const equippedRod = getRodById(equippedRodId);
  const elapsedFightSec = Math.max(0, (1 - state.catchProgress) * 8);
  const nearmissBonus = hasSkillAbility(playerData, 'abil_control_nearmiss_save')
    ? Math.min(0.08, elapsedFightSec * 0.01)
    : 0;
  const smoothDragBonus = state.smoothDragRemainingSec > 0 ? 0.12 : 0;
  return Math.min(
    1.0,
    cfg['5-9_バー判定範囲'] +
      bonuses.barRangeSkillAdd +
      (equippedRod?.techniqueStatAdd || 0) +
      nearmissBonus +
      smoothDragBonus,
  );
}

export function fishParamsFromConfig(fish: FishConfig, sizeCm?: number): FightSimFishParams {
  const cfg = config.fighting;
  return {
    catchRate: fish.catchRate ?? 1.0,
    escapeRate: fish.escapeRate ?? 1.0,
    fishSpeed: fish.fishSpeed ?? 0.3,
    fishErratic: fish.fishErratic ?? 0.3,
    moveInterval: fish.moveInterval ?? [cfg['5-13_魚の移動間隔_最短'], cfg['5-14_魚の移動間隔_最長']],
    maxSize: fish.maxSize,
    sizeCm,
  };
}

export function balanceReferenceFishParams(): FightSimFishParams {
  const ref = getBalanceReferenceFishParams();
  const sizeRatio = config.fighting['5-29_参照魚_サイズ比率'];
  return {
    ...ref,
    sizeCm: ref.maxSize * sizeRatio,
  };
}

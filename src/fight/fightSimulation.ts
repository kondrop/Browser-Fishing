import { config } from '../config';
import type { FishConfig } from '../data/fishConfig';
import type { PlayerData } from '../data/inventory';
import { calculateCatchRateWithSize } from '../data/inventory';
import { getRodById } from '../data/shopConfig';
import { getSkillStatBonuses, hasSkillAbility, type SkillStatBonuses } from '../data/skills';
import { FIGHT_SKILL_DURATIONS } from '../ui/fishingGaugeOverlay';
import { stepFightBarVelocity, stepTension, sumControlBonus } from './fightControl';

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

export type FishFightState = 'running' | 'tired';

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
  /** 直前フレームのバー判定幅（テンション等で幅が変わるとき中心を維持する） */
  prevBarRange: number;
  catchProgress: number;
  tension: number;
  tensionVelocity: number;
  fishFatigue: number;
  fishState: FishFightState;
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
  leftHeld: boolean;
  rightHeld: boolean;
  tensionUpHeld: boolean;
  tensionDownHeld: boolean;
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
/** ファイトトラック上の中央位置（魚・プレイヤーバー初期位置の基準） */
export const FIGHT_TRACK_CENTER = 0.5;

/** プレイヤーバー左端の最大値（右端がトラック 1.0 を超えないようにする） */
export function getMaxPlayerBarPosition(barRange: number): number {
  return Math.max(0, 1 - barRange);
}

function createFightBarLayoutSeedState(initialGauge?: number): FightSimState {
  const fightCfg = config.fighting;
  return {
    fishBarPosition: FIGHT_TRACK_CENTER,
    fishTargetPosition: FIGHT_TRACK_CENTER,
    fishMoveTimer: 0,
    fishDriftIntent: 0,
    fishDriftVelocity: 0,
    playerBarPosition: 0,
    playerBarVelocity: 0,
    prevBarRange: fightCfg['5-9_バー判定範囲'],
    catchProgress: initialGauge ?? fightCfg['5-12_初期ゲージ'],
    tension: 0,
    tensionVelocity: 0,
    fishFatigue: 0,
    fishState: 'running',
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

/** 装備・スキル込みのバー幅と、トラック中央に揃えた左端位置 */
export function resolveFightStartBarLayout(
  playerData: PlayerData,
  equippedRodId: string,
  skillBonuses?: SkillStatBonuses,
  playerBarCenter: number = FIGHT_TRACK_CENTER,
): { playerBarPosition: number; prevBarRange: number } {
  const seed = createFightBarLayoutSeedState();
  const prevBarRange = getFightBarHeight(seed, playerData, equippedRodId, skillBonuses);
  const playerBarPosition = clamp(
    playerBarCenter - prevBarRange / 2,
    0,
    getMaxPlayerBarPosition(prevBarRange),
  );
  return { playerBarPosition, prevBarRange };
}

export function createFightSimState(playerData: PlayerData, initialGauge?: number): FightSimState {
  const fightCfg = config.fighting;
  const fightStartMoveDelaySec = hasSkillAbility(playerData, 'abil_luck_junk_ward')
    ? fightCfg['5-12b_開始時魚移動待機秒_シルクタッチ']
    : fightCfg['5-12a_開始時魚移動待機秒'];
  const startLayout = resolveFightStartBarLayout(playerData, playerData.equippedRodId);
  return {
    fishBarPosition: FIGHT_TRACK_CENTER,
    fishTargetPosition: FIGHT_TRACK_CENTER,
    fishMoveTimer: fightStartMoveDelaySec,
    fishDriftIntent: 0,
    fishDriftVelocity: 0,
    playerBarPosition: startLayout.playerBarPosition,
    playerBarVelocity: 0,
    prevBarRange: startLayout.prevBarRange,
    catchProgress: initialGauge ?? fightCfg['5-12_初期ゲージ'],
    tension: 0,
    tensionVelocity: 0,
    fishFatigue: 0,
    fishState: 'running',
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
    state.lockOnRemainingSec = FIGHT_SKILL_DURATIONS.z;
    state.fightLockOnUsed = true;
  }
  if (input.triggerStagger && !state.fightStaggerUsed && hasSkillAbility(playerData, 'abil_power_fight_steady')) {
    state.fishFreezeRemainingSec = 1.5;
    state.fightStaggerUsed = true;
  }
  if (input.triggerSmoothDrag && !state.fightSmoothDragUsed && hasSkillAbility(playerData, 'abil_control_smooth_drag')) {
    state.smoothDragRemainingSec = 4.0;
    state.fightSmoothDragUsed = true;
  }
}

function stepFishFatigue(state: FightSimState, isCatching: boolean, dt: number): void {
  const cfg = config.fighting;
  // running 中に捕獲している間だけ疲れを蓄積。tired 中は捕獲していても増えない
  if (isCatching && state.fishState === 'running') {
    state.fishFatigue += cfg['5-56_疲れ値_増加速度'] * dt;
  }
  const decayRate =
    state.fishState === 'tired'
      ? cfg['5-64_tired時疲れ回復速度']
      : cfg['5-57_疲れ値_自然減少速度'];
  state.fishFatigue = Math.max(0, state.fishFatigue - decayRate * dt);

  if (state.fishState === 'running' && state.fishFatigue >= cfg['5-58_疲れ値_tired閾値']) {
    state.fishState = 'tired';
  } else if (state.fishState === 'tired' && state.fishFatigue <= cfg['5-59_疲れ値_running復帰閾値']) {
    state.fishState = 'running';
  }
}

function computeBaseBarRange(
  state: FightSimState,
  playerData: PlayerData,
  equippedRodId: string,
  skillBonuses: SkillStatBonuses,
): number {
  const cfg = config.fighting;
  const equippedRod = getRodById(equippedRodId);
  const elapsedFightSec = Math.max(0, (1 - state.catchProgress) * 8);
  const nearmissBonus = hasSkillAbility(playerData, 'abil_control_nearmiss_save')
    ? Math.min(0.08, elapsedFightSec * 0.01)
    : 0;
  const smoothDragBonus = state.smoothDragRemainingSec > 0 ? 0.12 : 0;
  return Math.min(
    1.0,
    cfg['5-9_バー判定範囲'] +
      skillBonuses.barRangeSkillAdd +
      (equippedRod?.techniqueStatAdd || 0) +
      nearmissBonus +
      smoothDragBonus,
  );
}

/** バー幅が変わったとき、中心位置を維持するよう左端を補正する */
function keepPlayerBarCenterWhenRangeChanges(state: FightSimState, nextBarRange: number): void {
  if (state.prevBarRange === nextBarRange) return;
  const center = state.playerBarPosition + state.prevBarRange / 2;
  state.playerBarPosition = clamp(
    center - nextBarRange / 2,
    0,
    getMaxPlayerBarPosition(nextBarRange),
  );
  state.prevBarRange = nextBarRange;
}

/** テンションによるバー範囲縮小を適用した当たり判定幅 */
export function getFightBarHeight(
  state: FightSimState,
  playerData: PlayerData,
  equippedRodId: string,
  skillBonuses?: SkillStatBonuses,
): number {
  const cfg = config.fighting;
  const bonuses = resolveSkillBonuses(playerData, skillBonuses);
  const baseRange = computeBaseBarRange(state, playerData, equippedRodId, bonuses);
  const tensionShrink = state.tension * cfg['5-53_テンションによるバー縮小幅'];
  return Math.max(0.05, baseRange * (1 - tensionShrink));
}

/** 本番ファイトと同一ロジックで1フレーム進める */
export function stepFightSimulation(state: FightSimState, input: FightSimStepInput): void {
  const { dt, leftHeld, rightHeld, tensionUpHeld, tensionDownHeld, playerData, equippedRodId, fish } = input;
  const cfg = config.fighting;
  const skillBonuses = resolveSkillBonuses(playerData, input.skillBonuses);
  const equippedRod = getRodById(equippedRodId);

  tryTriggerSkills(state, playerData, input);

  const controlBonus = sumControlBonus(
    skillBonuses.fightBarDragSkillAdd,
    equippedRod?.controlStatAdd ?? 0,
  );
  state.playerBarVelocity = stepFightBarVelocity(
    state.playerBarVelocity,
    leftHeld,
    rightHeld,
    controlBonus,
    dt,
  );
  state.playerBarPosition += state.playerBarVelocity * dt;

  const tensionStep = stepTension(
    state.tension,
    state.tensionVelocity,
    tensionUpHeld,
    tensionDownHeld,
    dt,
  );
  state.tension = tensionStep.tension;
  state.tensionVelocity = tensionStep.tensionVelocity;

  const moveIntervalMin = fish.moveInterval[0] ?? cfg['5-13_魚の移動間隔_最短'];
  const moveIntervalMax = fish.moveInterval[1] ?? cfg['5-14_魚の移動間隔_最長'];
  const minRange = cfg['5-16_魚の移動範囲_下'];
  const maxRange = cfg['5-17_魚の移動範囲_上'];
  const center = (minRange + maxRange) * 0.5;
  const rangeWidth = maxRange - minRange;

  state.fishMoveTimer -= dt;
  state.fishFreezeRemainingSec = Math.max(0, state.fishFreezeRemainingSec - dt);

  const isTired = state.fishState === 'tired';
  const tiredSpeedMul = isTired ? cfg['5-60_tired時速度倍率'] : 1.0;
  const tiredIntervalMul = isTired ? cfg['5-61_tired時方向更新間隔倍率'] : 1.0;
  const tiredIntentMul = isTired ? cfg['5-62_tired時意図ブレンド倍率'] : 1.0;
  const tiredResponseMul = isTired ? cfg['5-63_tired時速度追従性倍率'] : 1.0;

  if (state.fishMoveTimer <= 0 && state.fishFreezeRemainingSec <= 0) {
    const intervalScale = clamp(
      cfg['5-30_方向更新間隔スケール_基準'] + fish.fishSpeed * cfg['5-31_方向更新間隔スケール_魚速度寄与'],
      cfg['5-32_方向更新間隔スケール_下限'],
      cfg['5-33_方向更新間隔スケール_上限'],
    );
    const nextIntervalMin =
      Math.max(cfg['5-34_方向更新最短秒_下限'], moveIntervalMin * intervalScale) * tiredIntervalMul;
    const nextIntervalMax = Math.max(
      nextIntervalMin + cfg['5-35_方向更新最長秒_最小差分'],
      moveIntervalMax * intervalScale * tiredIntervalMul,
    );
    state.fishMoveTimer = floatBetween(nextIntervalMin, nextIntervalMax);

    const randomIntent = floatBetween(-1, 1);
    const intentBlend = clamp(
      (cfg['5-36_方向意図ブレンド_基準'] + fish.fishErratic * cfg['5-37_方向意図ブレンド_魚暴れ寄与']) *
        tiredIntentMul,
      cfg['5-38_方向意図ブレンド_下限'],
      cfg['5-39_方向意図ブレンド_上限'],
    );
    state.fishDriftIntent = linear(state.fishDriftIntent, randomIntent, intentBlend);
  }

  if (state.fishFreezeRemainingSec <= 0) {
    const maxDriftSpeed =
      rangeWidth *
      (cfg['5-40_ドリフト速度_基準'] + fish.fishSpeed * cfg['5-41_ドリフト速度_魚速度寄与']) *
      tiredSpeedMul;
    const driftResponse =
      (cfg['5-42_速度追従性_基準'] + fish.fishErratic * cfg['5-43_速度追従性_魚暴れ寄与']) *
      tiredResponseMul;
    const driftTargetVelocity = state.fishDriftIntent * maxDriftSpeed;
    const driftVelT = Math.min(1, driftResponse * dt);
    state.fishDriftVelocity = linear(state.fishDriftVelocity, driftTargetVelocity, driftVelT);

    const centerPull =
      (center - state.fishTargetPosition) *
      (cfg['5-44_中央復元力_基準'] + fish.fishErratic * cfg['5-45_中央復元力_魚暴れ寄与']);
    state.fishTargetPosition += (state.fishDriftVelocity + centerPull) * dt;
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
  state.smoothDragRemainingSec = Math.max(0, state.smoothDragRemainingSec - dt);
  const barHeightForLockOn = getFightBarHeight(state, playerData, equippedRodId, skillBonuses);
  if (state.lockOnRemainingSec > 0) {
    const currentCenter = state.playerBarPosition + barHeightForLockOn / 2;
    const newCenter = linear(currentCenter, state.fishBarPosition, 0.25);
    state.playerBarPosition = newCenter - barHeightForLockOn / 2;
  }

  const barHeight = getFightBarHeight(state, playerData, equippedRodId, skillBonuses);
  keepPlayerBarCenterWhenRangeChanges(state, barHeight);

  const maxPlayerBarPosition = getMaxPlayerBarPosition(barHeight);
  const wallBounceRestitution = 0.3;
  if (state.playerBarPosition < 0) {
    state.playerBarPosition = 0;
    state.playerBarVelocity = -state.playerBarVelocity * wallBounceRestitution;
  } else if (state.playerBarPosition > maxPlayerBarPosition) {
    state.playerBarPosition = maxPlayerBarPosition;
    state.playerBarVelocity = -state.playerBarVelocity * wallBounceRestitution;
  }

  state.isCatching =
    state.fishBarPosition >= state.playerBarPosition &&
    state.fishBarPosition <= state.playerBarPosition + barHeight;

  stepFishFatigue(state, state.isCatching, dt);

  const criticalZoneHeight = hasSkillAbility(playerData, 'abil_speed_opening_surge') ? 0.08 : 0;
  const playerHitBarCenter = state.playerBarPosition + barHeight / 2;
  const criticalZoneTop = playerHitBarCenter + criticalZoneHeight / 2;
  const criticalZoneBottom = playerHitBarCenter - criticalZoneHeight / 2;
  const isInCriticalZone =
    criticalZoneHeight > 0 &&
    state.fishBarPosition >= criticalZoneBottom &&
    state.fishBarPosition <= criticalZoneTop &&
    state.isCatching;

  const tensionGainMul = 1 + state.tension * cfg['5-54_テンションによるゲージ増加倍率'];
  const tensionDecayMul = 1 + state.tension * cfg['5-55_テンションによるゲージ減少倍率'];

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
    state.catchProgress +=
      (equipAndFishGain + skillGaugeAdd + critAdd + comboAdd) * tensionGainMul * dt;
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
    state.catchProgress -=
      cfg['5-11_ゲージ減少速度'] *
      fish.escapeRate *
      lowControlDecayMultiplier *
      tensionDecayMul *
      dt;
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

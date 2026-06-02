import { config } from '../config';

/** スキル fightBarDragSkillAdd + 竿 controlStatAdd の合算（コントロールボーナス） */
export function sumControlBonus(skillFightBarDragAdd: number, rodControlStatAdd: number): number {
  return skillFightBarDragAdd + (rodControlStatAdd || 0);
}

/** 目標速度へ追従する速さ（1/秒）。高いほど慣性が弱く素直に動く */
export function getFightBarResponse(controlBonus: number): number {
  const cfg = config.fighting;
  return cfg['5-18_基本レスポンス'] + controlBonus * cfg['5-19_コントロールレスポンス倍率'];
}

/** SPACE押下時 / 離した時の目標速度（トラック位置 0〜1 / 秒） */
export function getFightTargetVelocity(spaceHeld: boolean): number {
  const cfg = config.fighting;
  if (spaceHeld) {
    return cfg['5-8_上昇力'] * cfg['5-20_上昇目標速度係数'];
  }
  return -cfg['5-7_重力'] * cfg['5-21_下降目標速度係数'];
}

/** 目標速度へリニア追従（方向A: 抵抗ではなくレスポンスで慣性を弱める） */
export function stepFightBarVelocity(
  velocity: number,
  spaceHeld: boolean,
  controlBonus: number,
  dt: number,
): number {
  const vTarget = getFightTargetVelocity(spaceHeld);
  const response = getFightBarResponse(controlBonus);
  const t = Math.min(1, response * dt);
  return velocity + (vTarget - velocity) * t;
}

/** ステータス画面表示（基準100）。他能力値と同様、加算値×100で表示 */
export function getControlDisplayIndex(controlBonus: number): number {
  return Math.round(100 + Math.max(0, controlBonus) * 100);
}

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

/** 左右キー押下時の目標速度（トラック位置 0〜1 / 秒） */
export function getFightTargetVelocity(leftHeld: boolean, rightHeld: boolean): number {
  const cfg = config.fighting;
  const moveForce = cfg['5-8_横移動力'] * cfg['5-20_移動目標速度係数'];
  if (leftHeld && !rightHeld) return -moveForce;
  if (rightHeld && !leftHeld) return moveForce;
  return 0;
}

/** 目標速度へリニア追従（抵抗ではなくレスポンスで慣性を弱める） */
export function stepFightBarVelocity(
  velocity: number,
  leftHeld: boolean,
  rightHeld: boolean,
  controlBonus: number,
  dt: number,
): number {
  const vTarget = getFightTargetVelocity(leftHeld, rightHeld);
  const response = getFightBarResponse(controlBonus);
  const t = Math.min(1, response * dt);
  return velocity + (vTarget - velocity) * t;
}

/** テンション目標速度（0〜1 / 秒） */
export function getTensionTargetVelocity(tensionUpHeld: boolean, tensionDownHeld: boolean): number {
  const cfg = config.fighting;
  if (tensionUpHeld && !tensionDownHeld) {
    return cfg['5-49_テンション上昇力'] * cfg['5-50_テンション速度係数'];
  }
  if (tensionDownHeld && !tensionUpHeld) {
    return -cfg['5-51_テンション下降力'] * cfg['5-50_テンション速度係数'];
  }
  return 0;
}

/** テンション値を慣性付きで更新 */
export function stepTension(
  tension: number,
  tensionVelocity: number,
  tensionUpHeld: boolean,
  tensionDownHeld: boolean,
  dt: number,
): { tension: number; tensionVelocity: number } {
  const cfg = config.fighting;
  const vTarget = getTensionTargetVelocity(tensionUpHeld, tensionDownHeld);
  const response = cfg['5-52_テンション基本レスポンス'];
  const t = Math.min(1, response * dt);
  const newVelocity = tensionVelocity + (vTarget - tensionVelocity) * t;
  let newTension = tension + newVelocity * dt;
  if (newTension < 0) {
    newTension = 0;
    return { tension: 0, tensionVelocity: 0 };
  }
  if (newTension > 1) {
    newTension = 1;
    return { tension: 1, tensionVelocity: newVelocity > 0 ? 0 : newVelocity };
  }
  return { tension: newTension, tensionVelocity: newVelocity };
}

/** ステータス画面表示（基準100）。他能力値と同様、加算値×100で表示 */
export function getControlDisplayIndex(controlBonus: number): number {
  return Math.round(100 + Math.max(0, controlBonus) * 100);
}

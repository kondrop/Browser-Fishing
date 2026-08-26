import { AQUARIUM_CRUISE_BASE_SPEED } from '../data/aquariumConfig';

/** 停止時のわずかな呼吸振幅 */
const IDLE_AMP_X = 0.012;
/** クルーズ速度での追加振幅。停止＋移動で伸び幅 3% */
const MOVE_AMP_X = 0.018;
/** ダッシュでも暴れすぎない上限（クルーズ比） */
const SPEED_NORM_MAX = 1.1;
/** Y は左右伸縮の逆方向に弱く潰す */
const Y_RATIO = 0.28;
/** 尾びれサイクル（Hz） */
const HZ = 0.5;
/** 2倍波で戻りの弾みを足す */
const SNAP = 0.12;

/**
 * 遊泳中の左右ボヨン伸縮。
 * 移動が速いほど大きく、止まると呼吸程度まで小さくなる。
 */
export function getFishSwimBoyon(
  timeSec: number,
  phase: number,
  speed: number,
): { stretchX: number; stretchY: number } {
  const speedNorm = Math.min(SPEED_NORM_MAX, Math.max(0, speed / AQUARIUM_CRUISE_BASE_SPEED));
  const amp = IDLE_AMP_X + MOVE_AMP_X * speedNorm;
  const t = timeSec * Math.PI * 2 * HZ + phase;
  const wave = Math.sin(t) + SNAP * Math.sin(t * 2);
  const boyon = wave / (1 + SNAP);
  return {
    stretchX: 1 + boyon * amp,
    stretchY: 1 - boyon * amp * Y_RATIO,
  };
}

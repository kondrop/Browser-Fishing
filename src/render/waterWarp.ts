import {
  AQUARIUM_BG_WARP_AMP,
  AQUARIUM_BG_WARP_SPEED,
  AQUARIUM_BG_WARP_STEP,
  AQUARIUM_BG_WARP_Y_FREQ,
} from '../data/aquariumConfig';

export type WaterWarpRegion = {
  width: number;
  height: number;
  insetL?: number;
  insetR?: number;
  insetT?: number;
  insetB?: number;
};

/** 水槽と同じ横帯ずらしの水中ゆらぎ。source を dest へ描き、内側だけワープする。 */
export function drawWaterWarpPostEffect(
  dest: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  timeSec: number,
  region: WaterWarpRegion,
): void {
  dest.drawImage(source, 0, 0);
  const insetL = region.insetL ?? 0;
  const insetR = region.insetR ?? 0;
  const insetT = region.insetT ?? 0;
  const insetB = region.insetB ?? 0;
  const amp = AQUARIUM_BG_WARP_AMP;
  const step = AQUARIUM_BG_WARP_STEP;
  const innerW = region.width - insetL - insetR;
  const yEnd = region.height - insetB;
  if (innerW <= 0 || yEnd <= insetT) return;

  dest.save();
  dest.beginPath();
  dest.rect(insetL, insetT, innerW, yEnd - insetT);
  dest.clip();
  for (let y = insetT; y < yEnd; y += step) {
    const ox = Math.sin(timeSec * AQUARIUM_BG_WARP_SPEED + y * AQUARIUM_BG_WARP_Y_FREQ) * amp;
    const oy =
      Math.sin(timeSec * AQUARIUM_BG_WARP_SPEED * 0.65 + y * AQUARIUM_BG_WARP_Y_FREQ * 0.55) *
      amp *
      0.35;
    const srcY = Math.max(insetT, Math.min(yEnd - step, y + oy));
    const sliceH = Math.min(step, yEnd - y);
    dest.drawImage(
      source,
      insetL - amp,
      srcY,
      innerW + amp * 2,
      sliceH,
      insetL - amp + ox,
      y,
      innerW + amp * 2,
      sliceH,
    );
  }
  dest.restore();
}

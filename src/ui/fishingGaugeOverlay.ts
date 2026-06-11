import { config } from '../config';
import type { FishFightState } from '../fight/fightSimulation';

/** 本番ファイトUIと同じスケール（キャストゲージ等） */
export const FISHING_GAUGE_UI_SCALE = 1.25;

/** ファイトHUD全体の表示倍率（Figma 1x寸法に対する等倍縮小） */
export const FIGHT_UI_DISPLAY_SCALE = 0.85;

const FIGHT_FISH_IMAGE = '/images/ui/fight-fish.png';
const FIGHT_FISH_TIRED_IMAGE = '/images/ui/fight-fish-tired.png';

/** Figma fight bar（1x表示。画像アセットは2x） */
const FIGHT_BAR_DESIGN = {
  barWidth: 586,
  barHeight: 95,
  gridWidth: 574,
  contentLeft: 19,
  contentWidth: 549,
  /** プレイヤーバーが端まで行かない内側余白（左右それぞれ） */
  playerContentInset: 8,
  playerBarTop: 28,
  playerBarHeight: 41,
  progressTop: 9,
  /** 外側高さ（内側9px + 上下ボーダー2pxずつ） */
  progressHeight: 13,
  progressBorder: 2,
  /** 捕獲ポップを先端の塗りに隠れないよう左へずらす量 */
  catchFloatTipOffsetX: 22,
  /** fight-fish.png 表示高さ（幅はアスペクト比 232:136 で算出） */
  fishHeight: 34,
  fishImageAspect: 232 / 136,
} as const;

export interface FishingGaugeDimensions {
  castStepCount: number;
  castStepWidth: number;
  castStepGap: number;
  castMaxStepHeight: number;
  castMinStepHeight: number;
  castStepBorder: number;
  castStepBorderColor: string;
  fightBarWidth: number;
  fightBarHeight: number;
  fightGridWidth: number;
  fightContentLeft: number;
  fightContentWidth: number;
  fightPlayerContentInset: number;
  fightPlayerBarTop: number;
  fightPlayerBarHeight: number;
  fightProgressTop: number;
  fightProgressHeight: number;
  fightProgressBorder: number;
  fishWidth: number;
  fishHeight: number;
}

/** 段階ごとの色（左=低パワー/緑 → 右=最大/赤） */
export function getCastStepColors(stepCount: number): string[] {
  const palette8 = [
    '#52c452',
    '#6cbc4a',
    '#88b444',
    '#a8a83c',
    '#c89838',
    '#d88040',
    '#d06048',
    '#c04848',
  ];
  if (stepCount === palette8.length) return [...palette8];
  const colors: string[] = [];
  for (let i = 0; i < stepCount; i++) {
    const t = stepCount === 1 ? 1 : i / (stepCount - 1);
    const hue = 118 * (1 - t);
    const sat = 52;
    const lightness = 46 + t * 8;
    colors.push(`hsl(${hue}, ${sat}%, ${lightness}%)`);
  }
  return colors;
}

export function getCastStepHeightPx(stepIndex: number, stepCount: number, dims: FishingGaugeDimensions): number {
  const t = stepCount === 1 ? 1 : stepIndex / (stepCount - 1);
  return Math.round(dims.castMinStepHeight + (dims.castMaxStepHeight - dims.castMinStepHeight) * t);
}

export function getFishingGaugeDimensions(): FishingGaugeDimensions {
  const cast = config.casting;
  const d = FIGHT_BAR_DESIGN;
  const s = FISHING_GAUGE_UI_SCALE;
  return {
    castStepCount: cast['2-6_ゲージ段数'],
    castStepWidth: Math.round(cast['2-7_ゲージ段幅'] * s),
    castStepGap: Math.round(cast['2-10_ゲージ段間隔'] * s),
    castMaxStepHeight: Math.round(cast['2-8_ゲージ最大段高'] * s),
    castMinStepHeight: Math.round(cast['2-9_ゲージ最小段高'] * s),
    castStepBorder: Math.max(1, Math.round(cast['2-11_ゲージ段枠幅'] * s)),
    castStepBorderColor: cast['2-12_ゲージ段枠色'],
    fightBarWidth: d.barWidth,
    fightBarHeight: d.barHeight,
    fightGridWidth: d.gridWidth,
    fightContentLeft: d.contentLeft,
    fightContentWidth: d.contentWidth,
    fightPlayerContentInset: d.playerContentInset,
    fightPlayerBarTop: d.playerBarTop,
    fightPlayerBarHeight: d.playerBarHeight,
    fightProgressTop: d.progressTop,
    fightProgressHeight: d.progressHeight,
    fightProgressBorder: d.progressBorder,
    fishHeight: d.fishHeight,
    fishWidth: Math.round(d.fishHeight * d.fishImageAspect),
  };
}

export interface CastGaugeRenderInput {
  power: number;
}

export interface FightGaugeRenderInput {
  fishBarPosition: number;
  playerBarPosition: number;
  barHeight: number;
  catchProgress: number;
  isCatching: boolean;
  criticalZoneHeight: number;
  playerHitBarCenter: number;
  fishDriftVelocity: number;
  tension: number;
  fishState: FishFightState;
}

export interface FightSkillHudSlot {
  text: string;
  visible: boolean;
}

/** 本番 HUD のキャンバス上レイアウト */
export interface FishingGaugeGameLayout {
  /** 投擲ゲージ中心（viewport 座標） */
  castCenterX: number;
  castCenterY: number;
  /** ファイトUI下端中央（viewport 座標・浮きの上） */
  fightAnchorX: number;
  fightAnchorY: number;
}

const FIGHT_HINT_GAME =
  '←→でバー移動 ↑↓でテンション<br>Zロックオン Xスタッガー Cハイ';

function mapTrackX(pos: number, contentLeft: number, contentWidth: number): number {
  return contentLeft + pos * contentWidth;
}

function mapPlayerTrackX(
  pos: number,
  contentLeft: number,
  contentWidth: number,
  inset: number,
): number {
  const innerWidth = Math.max(0, contentWidth - inset * 2);
  return contentLeft + inset + pos * innerWidth;
}

function barRangeToPx(barRange: number, contentWidth: number): number {
  return Math.max(8, barRange * contentWidth);
}

export function phaserColorToCss(color: number): string {
  return `#${(color & 0xffffff).toString(16).padStart(6, '0')}`;
}

/** テンション0=プレイヤーバー既定グリーン、1=レッド */
const FIGHT_PLAYER_BAR_COLOR_LOW = 0x7cb86c;
const FIGHT_PLAYER_BAR_COLOR_HIGH = 0xc04848;

function mixChannel(low: number, high: number, t: number): number {
  return Math.round(low + (high - low) * t);
}

export function getFightPlayerBarColor(tension: number): string {
  const t = Math.max(0, Math.min(1, tension));
  const r = mixChannel(
    (FIGHT_PLAYER_BAR_COLOR_LOW >> 16) & 0xff,
    (FIGHT_PLAYER_BAR_COLOR_HIGH >> 16) & 0xff,
    t,
  );
  const g = mixChannel(
    (FIGHT_PLAYER_BAR_COLOR_LOW >> 8) & 0xff,
    (FIGHT_PLAYER_BAR_COLOR_HIGH >> 8) & 0xff,
    t,
  );
  const b = mixChannel(FIGHT_PLAYER_BAR_COLOR_LOW & 0xff, FIGHT_PLAYER_BAR_COLOR_HIGH & 0xff, t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * 投擲・ファイトゲージの HTML オーバーレイ（本番・バランスプレビュー共通）
 */
export class FishingGaugeOverlay {
  private root: HTMLElement | null = null;
  /** preview 時のマウント先（CSS 変数・クエリ用） */
  private previewHost: HTMLElement | null = null;
  private mode: 'game' | 'preview' = 'game';
  private dims = getFishingGaugeDimensions();

  private castEl: HTMLElement | null = null;
  private castStepsEl: HTMLElement | null = null;
  private castStepEls: HTMLElement[] = [];

  private fightEl: HTMLElement | null = null;
  private fightBarEl: HTMLElement | null = null;
  private floatLayerEl: HTMLElement | null = null;
  private criticalEl: HTMLElement | null = null;
  private playerBarEl: HTMLElement | null = null;
  private fishEl: HTMLImageElement | null = null;
  private sweatEl: HTMLElement | null = null;
  private progressFillEl: HTMLElement | null = null;
  private progressSweepEl: HTMLElement | null = null;
  private tensionFillEl: HTMLElement | null = null;
  private tensionValueEl: HTMLElement | null = null;
  private catchValueEl: HTMLElement | null = null;
  private fishStateEl: HTMLElement | null = null;
  private skillZEl: HTMLElement | null = null;
  private skillXEl: HTMLElement | null = null;
  private skillCEl: HTMLElement | null = null;

  private lastFishBarPosition: number | null = null;
  private fishFacing: 'left' | 'right' = 'right';

  /** 捕獲バー上昇マイクロ演出の状態（見た目専用・ロジックには影響しない） */
  private lastCatchProgress: number | null = null;
  private lastCatchPct: number | null = null;
  private lastSweepAt = 0;
  private lastPopAt = 0;
  private sweepAnim: Animation | null = null;
  private barPopAnim: Animation | null = null;

  /** tired 中の汗エフェクトのクールタイム管理（見た目専用） */
  private lastSweatAt = 0;

  /** 本番: body 直下に固定配置 */
  mountGame(): HTMLElement {
    this.mode = 'game';
    this.dims = getFishingGaugeDimensions();
    const el = document.createElement('div');
    el.className = 'fishing-gauge-overlay fishing-gauge-overlay--game';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = this.buildGameHtml();
    document.body.appendChild(el);
    this.root = el;
    this.bindElements();
    this.applyDimensionVars();
    return el;
  }

  /** バランス画面: コンテナ内にファイトのみ */
  mountPreview(container: HTMLElement): void {
    this.mode = 'preview';
    this.dims = getFishingGaugeDimensions();
    container.innerHTML = `
      <div class="balance-fight-preview__inner">
        <p class="balance-fight-preview__title">テストファイト</p>
        <p class="balance-fight-preview__badge">本番同一ロジック・勝敗なし</p>
        ${this.buildFightBlockHtml('preview')}
        <p class="balance-fight-preview__hint">←→バー ↑↓テンション<br>Z X C スキル（本番同様1回）</p>
      </div>
    `;
    this.previewHost = container;
    this.root = container;
    this.bindElements();
    this.applyDimensionVars();
    if (this.fightEl) this.fightEl.hidden = false;
  }

  unmount(): void {
    if (this.mode === 'game' && this.root?.parentElement) {
      this.root.parentElement.removeChild(this.root);
    } else if (this.previewHost) {
      this.previewHost.innerHTML = '';
    }
    this.root = null;
    this.previewHost = null;
    this.castEl = null;
    this.castStepsEl = null;
    this.castStepEls = [];
    this.fightEl = null;
    this.fightBarEl = null;
    this.floatLayerEl = null;
    this.criticalEl = null;
    this.playerBarEl = null;
    this.fishEl = null;
    this.sweatEl = null;
    this.progressFillEl = null;
    this.progressSweepEl = null;
    this.tensionFillEl = null;
    this.tensionValueEl = null;
    this.catchValueEl = null;
    this.fishStateEl = null;
    this.sweepAnim?.cancel();
    this.barPopAnim?.cancel();
    this.sweepAnim = null;
    this.barPopAnim = null;
    this.lastCatchProgress = null;
    this.lastCatchPct = null;
    this.skillZEl = null;
    this.skillXEl = null;
    this.skillCEl = null;
  }

  layoutGame(layout: FishingGaugeGameLayout): void {
    if (!this.castEl || !this.fightEl || this.mode !== 'game') return;

    const { castCenterX, castCenterY, fightAnchorX, fightAnchorY } = layout;
    this.castEl.style.left = `${castCenterX}px`;
    this.castEl.style.top = `${castCenterY}px`;

    this.fightEl.style.left = `${fightAnchorX}px`;
    this.fightEl.style.top = `${fightAnchorY}px`;
    this.fightEl.style.right = 'auto';
  }

  setCastVisible(visible: boolean): void {
    if (this.castEl) this.castEl.hidden = !visible;
  }

  updateCast({ power }: CastGaugeRenderInput): void {
    if (this.castStepEls.length === 0) return;
    const clamped = Math.max(0, Math.min(1, power));
    const stepCount = this.castStepEls.length;
    const litCount =
      clamped <= 0 ? 0 : Math.min(stepCount, Math.ceil(clamped * stepCount - 1e-6));

    this.castStepEls.forEach((el, i) => {
      el.classList.toggle('is-lit', i < litCount);
    });

    if (this.castStepsEl) {
      const pct = Math.round(clamped * 100);
      this.castStepsEl.setAttribute('aria-valuenow', String(pct));
      this.castStepsEl.setAttribute('aria-valuetext', `${pct}%`);
    }
  }

  setFightVisible(visible: boolean): void {
    if (!this.fightEl) return;
    if (visible) {
      this.lastFishBarPosition = null;
      this.fishFacing = 'right';
      this.lastCatchProgress = null;
      this.lastCatchPct = null;
      this.lastSweepAt = 0;
      this.lastPopAt = 0;
      this.sweepAnim?.cancel();
      this.barPopAnim?.cancel();
      this.floatLayerEl?.replaceChildren();
      this.sweatEl?.replaceChildren();
      this.lastSweatAt = 0;
      this.fishEl?.classList.remove('is-facing-left', 'is-tired');
      this.fishEl?.setAttribute('src', FIGHT_FISH_IMAGE);
      this.fightEl.classList.add('is-fight-instant');
      this.fightEl.hidden = false;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.fightEl?.classList.remove('is-fight-instant');
        });
      });
      return;
    }
    this.fightEl.classList.add('is-fight-instant');
    this.fightEl.hidden = true;
  }

  private updateFishFacing(position: number, driftVelocity: number): void {
    const velocityThreshold = 0.002;
    const positionThreshold = 0.0004;

    if (Math.abs(driftVelocity) > velocityThreshold) {
      this.fishFacing = driftVelocity > 0 ? 'right' : 'left';
    } else if (this.lastFishBarPosition !== null) {
      const delta = position - this.lastFishBarPosition;
      if (delta > positionThreshold) this.fishFacing = 'right';
      else if (delta < -positionThreshold) this.fishFacing = 'left';
    }
    this.lastFishBarPosition = position;
    this.fishEl?.classList.toggle('is-facing-left', this.fishFacing === 'left');
  }

  updateFight(input: FightGaugeRenderInput): void {
    if (!this.fightBarEl || !this.playerBarEl || !this.fishEl || !this.progressFillEl) return;

    const {
      fightContentLeft,
      fightContentWidth,
      fightPlayerContentInset,
      fightPlayerBarTop,
      fightPlayerBarHeight,
      fishWidth,
      fishHeight,
    } = this.dims;
    const mapX = (pos: number) => mapTrackX(pos, fightContentLeft, fightContentWidth);
    const mapPlayerX = (pos: number) =>
      mapPlayerTrackX(pos, fightContentLeft, fightContentWidth, fightPlayerContentInset);
    const playerTrackWidth = Math.max(0, fightContentWidth - fightPlayerContentInset * 2);

    const barPx = barRangeToPx(input.barHeight, playerTrackWidth);
    this.playerBarEl.style.left = `${mapPlayerX(input.playerHitBarCenter)}px`;
    this.playerBarEl.style.width = `${barPx}px`;
    this.playerBarEl.style.height = `${fightPlayerBarHeight}px`;
    this.playerBarEl.style.top = `${fightPlayerBarTop}px`;
    this.playerBarEl.style.transform = 'translateX(-50%)';
    this.playerBarEl.classList.toggle('is-catching', input.isCatching);
    const tensionT = Math.max(0, Math.min(1, input.tension));
    this.playerBarEl.style.backgroundColor = getFightPlayerBarColor(tensionT);
    this.playerBarEl.style.borderColor = input.isCatching
      ? 'rgba(250, 221, 180, 0.75)'
      : 'rgba(250, 221, 180, 0.5)';
    this.playerBarEl.style.boxShadow =
      tensionT > 0.02 ? `0 0 ${tensionT * 6}px rgba(255, 100, 60, ${tensionT * 0.55})` : '';

    this.fishEl.style.width = `${fishWidth}px`;
    this.fishEl.style.height = `${fishHeight}px`;
    const fishCenterX = mapX(input.fishBarPosition);
    const fishTop = fightPlayerBarTop + (fightPlayerBarHeight - fishHeight) / 2;
    this.fishEl.style.left = `${fishCenterX - fishWidth / 2}px`;
    this.fishEl.style.top = `${fishTop}px`;
    this.updateFishFacing(input.fishBarPosition, input.fishDriftVelocity);
    this.fishEl.classList.toggle('is-catching', input.isCatching);
    const isTired = input.fishState === 'tired';
    this.fishEl.classList.toggle('is-tired', isTired);
    const fishSrc = isTired ? FIGHT_FISH_TIRED_IMAGE : FIGHT_FISH_IMAGE;
    if (this.fishEl.getAttribute('src') !== fishSrc) {
      this.fishEl.setAttribute('src', fishSrc);
    }
    this.updateTiredSweat(isTired, fishCenterX, fishTop, fishWidth);

    if (this.criticalEl) {
      if (input.criticalZoneHeight > 0) {
        const critPx = barRangeToPx(input.criticalZoneHeight, playerTrackWidth);
        this.criticalEl.hidden = false;
        this.criticalEl.style.width = `${critPx}px`;
        this.criticalEl.style.height = `${fightPlayerBarHeight}px`;
        this.criticalEl.style.top = `${fightPlayerBarTop}px`;
        this.criticalEl.style.left = `${mapPlayerX(input.playerHitBarCenter)}px`;
        this.criticalEl.style.transform = 'translateX(-50%)';
      } else {
        this.criticalEl.hidden = true;
      }
    }

    const progress01 = Math.max(0, Math.min(1, input.catchProgress));
    const progressPct = progress01 * 100;
    this.progressFillEl.style.width = `${progressPct}%`;
    this.progressFillEl.style.height = '100%';

    const displayPct = Math.round(progressPct);
    if (this.catchValueEl) {
      this.catchValueEl.textContent = `${displayPct}%`;
    }
    this.playCatchGainEffects(progress01, displayPct);

    if (this.tensionFillEl) {
      const tensionPct = Math.max(0, Math.min(100, input.tension * 100));
      this.tensionFillEl.style.width = `${tensionPct}%`;
    }
    if (this.tensionValueEl) {
      this.tensionValueEl.textContent = `${Math.round(input.tension * 100)}%`;
    }
    if (this.fishStateEl) {
      this.fishStateEl.textContent = input.fishState === 'tired' ? 'TIRED' : 'RUN';
      this.fishStateEl.classList.toggle('is-tired', input.fishState === 'tired');
    }
  }

  /**
   * 捕獲バー上昇時のマイクロ演出（見た目専用）。
   * - 増加中はバー内にハイライトを一定間隔で流す
   * - 表示%が増えたらバー先端から数字を浮かせ、バー塗りを軽くポップさせる
   */
  private playCatchGainEffects(progress01: number, displayPct: number): void {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();

    const increasing =
      this.lastCatchProgress !== null && progress01 > this.lastCatchProgress + 1e-4;
    if (increasing && now - this.lastSweepAt > 240) {
      this.playProgressSweep();
      this.lastSweepAt = now;
    }

    if (this.lastCatchPct !== null && displayPct > this.lastCatchPct) {
      const delta = displayPct - this.lastCatchPct;
      // 連続上昇時の連打を抑えつつ、大きいジャンプは必ず反応させる
      if (delta >= 3 || now - this.lastPopAt > 120) {
        this.playCatchPop(progress01, delta);
        this.lastPopAt = now;
      }
    }

    this.lastCatchProgress = progress01;
    this.lastCatchPct = displayPct;
  }

  private prefersReducedMotion(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  /**
   * tired 中の魚に汗エフェクトを出す（見た目専用）。
   * - 汗レイヤーを魚の上部に追従させ、向いている方向の上側に配置する
   * - 短い間隔で 1〜2 個の汗しずくがぴょこっと出て、外側へ動いて消える
   */
  private updateTiredSweat(
    isTired: boolean,
    fishCenterX: number,
    fishTop: number,
    fishWidth: number,
  ): void {
    const layer = this.sweatEl;
    if (!layer) return;

    if (!isTired) {
      layer.style.opacity = '0';
      return;
    }
    layer.style.opacity = '1';

    // 向いている方向の上側（右上 / 左上）に寄せる
    const facingRight = this.fishFacing !== 'left';
    const dir = facingRight ? 1 : -1;
    const anchorX = fishCenterX + dir * fishWidth * 0.28;
    layer.style.left = `${anchorX}px`;
    layer.style.top = `${fishTop}px`;

    if (typeof layer.animate !== 'function' || this.prefersReducedMotion()) return;

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    // 短い間隔でランダムに出す（毎フレーム出さないようクールタイム）
    if (now - this.lastSweatAt < 620) return;
    this.lastSweatAt = now + Math.random() * 220;

    const dropletCount = Math.random() < 0.35 ? 2 : 1;
    for (let i = 0; i < dropletCount; i++) {
      this.spawnSweatDroplet(layer, dir, i);
    }
  }

  private spawnSweatDroplet(layer: HTMLElement, dir: number, index: number): void {
    const drop = document.createElement('span');
    drop.className = 'fishing-fight-gauge__sweat-drop';
    layer.appendChild(drop);

    const spread = (4 + Math.random() * 6) * (index === 0 ? 1 : 0.6);
    const riseY = -(3 + Math.random() * 3);
    const driftX = dir * (6 + Math.random() * 7);
    const fallY = 8 + Math.random() * 6;

    const anim = drop.animate(
      [
        { transform: `translate(${dir * spread}px, 0) scale(0.4)`, opacity: 0 },
        {
          transform: `translate(${dir * spread + driftX * 0.4}px, ${riseY}px) scale(1)`,
          opacity: 1,
          offset: 0.3,
        },
        {
          transform: `translate(${dir * spread + driftX}px, ${fallY}px) scale(0.85)`,
          opacity: 0,
        },
      ],
      { duration: 560 + Math.random() * 160, easing: 'cubic-bezier(0.4, 0.1, 0.7, 1)' },
    );
    const cleanup = () => drop.remove();
    anim.onfinish = cleanup;
    anim.oncancel = cleanup;
  }

  private playProgressSweep(): void {
    const el = this.progressSweepEl;
    if (!el || typeof el.animate !== 'function' || this.prefersReducedMotion()) return;
    this.sweepAnim?.cancel();
    this.sweepAnim = el.animate(
      [
        { backgroundPosition: '150% 0', opacity: 0 },
        { backgroundPosition: '60% 0', opacity: 0.9, offset: 0.35 },
        { backgroundPosition: '-60% 0', opacity: 0 },
      ],
      { duration: 520, easing: 'ease-out' },
    );
  }

  private playCatchPop(progress01: number, strengthPct: number): void {
    if (this.prefersReducedMotion()) return;
    const clampedStrength = Math.min(Math.max(strengthPct, 1), 8);

    this.spawnCatchFloat(progress01, clampedStrength);

    const fillEl = this.progressFillEl;
    if (fillEl && typeof fillEl.animate === 'function') {
      const fillPeak = Math.min(1.4, 1.16 + clampedStrength * 0.03);
      this.barPopAnim?.cancel();
      this.barPopAnim = fillEl.animate(
        [
          { transform: 'scaleY(1)', filter: 'brightness(1)' },
          { transform: `scaleY(${fillPeak})`, filter: 'brightness(1.5)', offset: 0.3 },
          { transform: 'scaleY(1)', filter: 'brightness(1)' },
        ],
        { duration: 240, easing: 'ease-out' },
      );
    }
  }

  /**
   * 捕獲バーの先端（塗りの右端）から増加量の数字を浮かせ、
   * 少し上昇しながらフェードアウトさせる。fight-bar は overflow:hidden のため、
   * 非クリップの float レイヤー（arena 直下）に配置する。
   */
  private spawnCatchFloat(progress01: number, strengthPct: number): void {
    const layer = this.floatLayerEl;
    const barEl = this.fightBarEl;
    if (!layer || !barEl || typeof layer.animate !== 'function') return;

    const d = this.dims;
    const fillWidthPx = Math.max(0, Math.min(1, progress01)) * d.fightContentWidth;
    const tipX =
      barEl.offsetLeft +
      d.fightContentLeft +
      fillWidthPx -
      FIGHT_BAR_DESIGN.catchFloatTipOffsetX;
    const tipY = barEl.offsetTop + d.fightProgressTop + d.fightProgressHeight / 2;

    const el = document.createElement('span');
    el.className = 'fishing-fight-gauge__catch-float';
    const num = Math.round(strengthPct);
    el.innerHTML =
      `<span class="fishing-fight-gauge__catch-float-num">+${num}</span>` +
      `<span class="fishing-fight-gauge__catch-float-pct">%</span>`;
    el.style.left = `${tipX}px`;
    el.style.top = `${tipY}px`;
    layer.appendChild(el);

    // 増加量が大きいほど少しだけ大きく（控えめ）
    const scale = Math.min(1.35, 1 + (strengthPct - 1) * 0.05);

    const rise = 26 + Math.min(strengthPct, 8) * 1.5;
    const anim = el.animate(
      [
        { transform: `translate(-50%, 4px) scale(${scale * 0.88})`, opacity: 0 },
        { transform: `translate(-50%, -8%) scale(${scale})`, opacity: 1, offset: 0.12 },
        { transform: `translate(-50%, -${rise * 0.55}px) scale(${scale})`, opacity: 1, offset: 0.55 },
        { transform: `translate(-50%, -${rise}px) scale(${scale * 0.96})`, opacity: 0 },
      ],
      { duration: 1100, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)' },
    );
    const cleanup = () => el.remove();
    anim.onfinish = cleanup;
    anim.oncancel = cleanup;
  }

  updateFightSkillHud(z: FightSkillHudSlot, x: FightSkillHudSlot, c: FightSkillHudSlot): void {
    if (this.skillZEl) {
      this.skillZEl.textContent = z.text;
      this.skillZEl.hidden = !z.visible;
    }
    if (this.skillXEl) {
      this.skillXEl.textContent = x.text;
      this.skillXEl.hidden = !x.visible;
    }
    if (this.skillCEl) {
      this.skillCEl.textContent = c.text;
      this.skillCEl.hidden = !c.visible;
    }
  }

  private buildCastGaugeHtml(): string {
    const d = this.dims;
    const colors = getCastStepColors(d.castStepCount);
    const steps = Array.from({ length: d.castStepCount }, (_, i) => {
      const height = getCastStepHeightPx(i, d.castStepCount, d);
      const color = colors[i] ?? colors[colors.length - 1];
      return `<div class="fishing-cast-gauge__step" data-step="${i}" style="--step-height:${height}px" aria-hidden="true"><div class="fishing-cast-gauge__step-fill" style="--step-color:${color}"></div></div>`;
    }).join('');
    return `
      <div class="fishing-cast-gauge" hidden>
        <div
          class="fishing-cast-gauge__steps"
          role="meter"
          aria-label="投擲パワー"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow="0"
        >${steps}</div>
      </div>
    `;
  }

  private buildGameHtml(): string {
    return `
      ${this.buildCastGaugeHtml()}
      ${this.buildFightBlockHtml('game')}
    `;
  }

  private buildFightBlockHtml(variant: 'game' | 'preview'): string {
    const hint =
      variant === 'game'
        ? `<p class="fishing-fight-gauge__hint">${FIGHT_HINT_GAME}</p>`
        : '';
    const skills =
      variant === 'game'
        ? `
        <div class="fishing-fight-gauge__skills" aria-hidden="true">
          <span class="fishing-fight-gauge__skill" data-skill="z"></span>
          <span class="fishing-fight-gauge__skill" data-skill="x"></span>
          <span class="fishing-fight-gauge__skill" data-skill="c"></span>
        </div>`
        : '';
    const statusHud =
      variant === 'game'
        ? `
        <div class="fishing-fight-gauge__status" aria-hidden="true">
          <span class="fishing-fight-gauge__fish-state" data-fish-state>RUN</span>
          <div class="fishing-fight-gauge__catch" aria-label="捕獲率">
            <span class="fishing-fight-gauge__catch-label">CATCH</span>
            <span class="fishing-fight-gauge__catch-value">0%</span>
          </div>
          <div class="fishing-fight-gauge__tension" aria-label="テンション">
            <span class="fishing-fight-gauge__tension-label">TEN</span>
            <div class="fishing-fight-gauge__tension-track">
              <div class="fishing-fight-gauge__tension-fill"></div>
            </div>
            <span class="fishing-fight-gauge__tension-value">0%</span>
          </div>
        </div>`
        : `
        <div class="fishing-fight-gauge__status fishing-fight-gauge__status--preview" aria-hidden="true">
          <span class="fishing-fight-gauge__fish-state" data-fish-state>RUN</span>
          <div class="fishing-fight-gauge__catch" aria-label="捕獲率">
            <span class="fishing-fight-gauge__catch-label">CATCH</span>
            <span class="fishing-fight-gauge__catch-value">0%</span>
          </div>
          <div class="fishing-fight-gauge__tension" aria-label="テンション">
            <span class="fishing-fight-gauge__tension-label">TEN</span>
            <div class="fishing-fight-gauge__tension-track">
              <div class="fishing-fight-gauge__tension-fill"></div>
            </div>
            <span class="fishing-fight-gauge__tension-value">0%</span>
          </div>
        </div>`;
    const hidden = variant === 'game';
    return `
      <div class="fishing-fight-gauge fishing-fight-gauge--${variant}"${hidden ? ' hidden' : ''}>
        ${hint}
        ${statusHud}
        <div class="fishing-fight-gauge__arena">
          <div class="fishing-fight-gauge__float-layer" aria-hidden="true"></div>
          <div class="fishing-fight-gauge__fight-bar" aria-hidden="true">
            <img
              class="fishing-fight-gauge__fish"
              src="${FIGHT_FISH_IMAGE}"
              alt=""
              decoding="async"
            />
            <div class="fishing-fight-gauge__sweat" aria-hidden="true"></div>
            <img class="fishing-fight-gauge__fight-bg" src="/images/ui/fight-bg.png" alt="" decoding="async" />
            <div class="fishing-fight-gauge__critical" hidden></div>
            <div class="fishing-fight-gauge__player-bar"></div>
            <img class="fishing-fight-gauge__fight-grid" src="/images/ui/fight-grid.png" alt="" decoding="async" />
            <div class="fishing-fight-gauge__progress" aria-label="捕獲ゲージ">
              <div class="fishing-fight-gauge__progress-fill">
                <div class="fishing-fight-gauge__progress-sweep" aria-hidden="true"></div>
              </div>
            </div>
          </div>
        </div>
        ${skills}
      </div>
    `;
  }

  private getQueryScope(): ParentNode | null {
    return this.root;
  }

  private bindElements(): void {
    const scope = this.getQueryScope();
    if (!scope) return;

    this.castEl = scope.querySelector('.fishing-cast-gauge');
    this.castStepsEl = scope.querySelector('.fishing-cast-gauge__steps');
    this.castStepEls = Array.from(scope.querySelectorAll<HTMLElement>('.fishing-cast-gauge__step'));
    this.fightEl = scope.querySelector('.fishing-fight-gauge');
    this.fightBarEl = scope.querySelector('.fishing-fight-gauge__fight-bar');
    this.floatLayerEl = scope.querySelector('.fishing-fight-gauge__float-layer');
    this.criticalEl = scope.querySelector('.fishing-fight-gauge__critical');
    this.playerBarEl = scope.querySelector('.fishing-fight-gauge__player-bar');
    this.fishEl = scope.querySelector<HTMLImageElement>('.fishing-fight-gauge__fish');
    this.sweatEl = scope.querySelector('.fishing-fight-gauge__sweat');
    this.progressFillEl = scope.querySelector('.fishing-fight-gauge__progress-fill');
    this.progressSweepEl = scope.querySelector('.fishing-fight-gauge__progress-sweep');
    this.tensionFillEl = scope.querySelector('.fishing-fight-gauge__tension-fill');
    this.tensionValueEl = scope.querySelector('.fishing-fight-gauge__tension-value');
    this.catchValueEl = scope.querySelector('.fishing-fight-gauge__catch-value');
    this.fishStateEl = scope.querySelector('[data-fish-state]');
    this.skillZEl = scope.querySelector('[data-skill="z"]');
    this.skillXEl = scope.querySelector('[data-skill="x"]');
    this.skillCEl = scope.querySelector('[data-skill="c"]');
  }

  private applyDimensionVars(): void {
    const scope = this.root as HTMLElement | null;
    if (!scope) return;
    const d = this.dims;
    (scope as HTMLElement).style.setProperty('--fishing-cast-step-width', `${d.castStepWidth}px`);
    (scope as HTMLElement).style.setProperty('--fishing-cast-step-gap', `${d.castStepGap}px`);
    (scope as HTMLElement).style.setProperty('--fishing-cast-step-overlap', `${-d.castStepBorder}px`);
    (scope as HTMLElement).style.setProperty('--fishing-cast-step-border', `${d.castStepBorder}px`);
    (scope as HTMLElement).style.setProperty('--fishing-cast-border-color', d.castStepBorderColor);
    (scope as HTMLElement).style.setProperty('--fishing-cast-max-step-height', `${d.castMaxStepHeight}px`);
    (scope as HTMLElement).style.setProperty('--fishing-bar-width', `${d.fightBarWidth}px`);
    (scope as HTMLElement).style.setProperty('--fishing-bar-height', `${d.fightBarHeight}px`);
    (scope as HTMLElement).style.setProperty('--fishing-grid-width', `${d.fightGridWidth}px`);
    (scope as HTMLElement).style.setProperty('--fishing-content-left', `${d.fightContentLeft}px`);
    (scope as HTMLElement).style.setProperty('--fishing-content-width', `${d.fightContentWidth}px`);
    (scope as HTMLElement).style.setProperty('--fishing-player-bar-top', `${d.fightPlayerBarTop}px`);
    (scope as HTMLElement).style.setProperty('--fishing-player-bar-height', `${d.fightPlayerBarHeight}px`);
    (scope as HTMLElement).style.setProperty('--fishing-progress-top', `${d.fightProgressTop}px`);
    (scope as HTMLElement).style.setProperty('--fishing-progress-height', `${d.fightProgressHeight}px`);
    (scope as HTMLElement).style.setProperty('--fishing-progress-border', `${d.fightProgressBorder}px`);
    (scope as HTMLElement).style.setProperty('--fishing-fish-width', `${d.fishWidth}px`);
    (scope as HTMLElement).style.setProperty('--fishing-fish-height', `${d.fishHeight}px`);
    (scope as HTMLElement).style.setProperty('--fishing-ui-scale', String(FIGHT_UI_DISPLAY_SCALE));
  }
}

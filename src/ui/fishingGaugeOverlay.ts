import { config } from '../config';
import type { FishFightState } from '../fight/fightSimulation';

/** 本番ファイトUIと同じスケール */
export const FISHING_GAUGE_UI_SCALE = 1.25;

export interface FishingGaugeDimensions {
  castStepCount: number;
  castStepWidth: number;
  castStepGap: number;
  castMaxStepHeight: number;
  castMinStepHeight: number;
  castStepBorder: number;
  castStepBorderColor: string;
  trackWidth: number;
  trackHeight: number;
  barWidth: number;
  fishSize: number;
  progressWidth: number;
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
  const fight = config.fighting;
  const s = FISHING_GAUGE_UI_SCALE;
  return {
    castStepCount: cast['2-6_ゲージ段数'],
    castStepWidth: Math.round(cast['2-7_ゲージ段幅'] * s),
    castStepGap: Math.round(cast['2-10_ゲージ段間隔'] * s),
    castMaxStepHeight: Math.round(cast['2-8_ゲージ最大段高'] * s),
    castMinStepHeight: Math.round(cast['2-9_ゲージ最小段高'] * s),
    castStepBorder: Math.max(1, Math.round(cast['2-11_ゲージ段枠幅'] * s)),
    castStepBorderColor: cast['2-12_ゲージ段枠色'],
    trackWidth: Math.round(fight['5-2_背景幅'] * s),
    trackHeight: Math.round(fight['5-2_背景高さ'] * s),
    barWidth: Math.round(fight['5-3_バー高さ'] * s),
    fishSize: Math.round(fight['5-4_魚サイズ'] * s),
    progressWidth: Math.round(10 * s),
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
  fishColor: string;
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
  /** ファイトUI上端中央（viewport 座標・プレイヤー直下） */
  fightAnchorX: number;
  fightAnchorY: number;
}

const FIGHT_HINT_GAME =
  '←→でバー移動 ↑↓でテンション<br>Zロックオン Xスタッガー Cハイ';

/** トラック枠線（style.css の border と一致） */
export const FIGHT_TRACK_BORDER_PX = 2;

function mapTrackX(pos: number, trackWidth: number, borderPx = FIGHT_TRACK_BORDER_PX): number {
  const contentWidth = Math.max(0, trackWidth - borderPx * 2);
  return borderPx + pos * contentWidth;
}

function barRangeToPx(barRange: number, trackWidth: number, borderPx = FIGHT_TRACK_BORDER_PX): number {
  const contentWidth = Math.max(0, trackWidth - borderPx * 2);
  return Math.max(8, barRange * contentWidth);
}

export function phaserColorToCss(color: number): string {
  return `#${(color & 0xffffff).toString(16).padStart(6, '0')}`;
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
  private trackEl: HTMLElement | null = null;
  private criticalEl: HTMLElement | null = null;
  private playerBarEl: HTMLElement | null = null;
  private fishEl: HTMLElement | null = null;
  private progressFillEl: HTMLElement | null = null;
  private tensionFillEl: HTMLElement | null = null;
  private tensionValueEl: HTMLElement | null = null;
  private fishStateEl: HTMLElement | null = null;
  private skillZEl: HTMLElement | null = null;
  private skillXEl: HTMLElement | null = null;
  private skillCEl: HTMLElement | null = null;

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
    this.trackEl = null;
    this.criticalEl = null;
    this.playerBarEl = null;
    this.fishEl = null;
    this.progressFillEl = null;
    this.tensionFillEl = null;
    this.tensionValueEl = null;
    this.fishStateEl = null;
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

  setFishColor(color: string): void {
    if (this.fishEl) this.fishEl.style.backgroundColor = color;
  }

  updateFight(input: FightGaugeRenderInput): void {
    if (!this.trackEl || !this.playerBarEl || !this.fishEl || !this.progressFillEl) return;

    const trackW = this.dims.trackWidth;
    const trackH = this.dims.trackHeight;
    const mapX = (pos: number) => mapTrackX(pos, trackW);

    const barPx = barRangeToPx(input.barHeight, trackW);
    const barThickness = this.dims.barWidth;
    this.playerBarEl.style.left = `${mapX(input.playerHitBarCenter)}px`;
    this.playerBarEl.style.width = `${barPx}px`;
    this.playerBarEl.style.height = `${barThickness}px`;
    this.playerBarEl.style.top = `${trackH / 2}px`;
    this.playerBarEl.style.transform = 'translate(-50%, -50%)';
    this.playerBarEl.classList.toggle('is-catching', input.isCatching);
    this.playerBarEl.classList.toggle('is-high-tension', input.tension >= 0.55);

    const fishPx = this.dims.fishSize;
    this.fishEl.style.width = `${fishPx}px`;
    this.fishEl.style.height = `${fishPx}px`;
    this.fishEl.style.left = `${mapX(input.fishBarPosition) - fishPx / 2}px`;
    this.fishEl.style.top = `${(trackH - fishPx) / 2}px`;
    this.fishEl.style.backgroundColor = input.fishColor;
    this.fishEl.classList.toggle('is-tired', input.fishState === 'tired');

    if (this.criticalEl) {
      if (input.criticalZoneHeight > 0) {
        const critPx = barRangeToPx(input.criticalZoneHeight, trackW);
        this.criticalEl.hidden = false;
        this.criticalEl.style.width = `${critPx}px`;
        this.criticalEl.style.left = `${mapX(input.playerHitBarCenter) - critPx / 2}px`;
      } else {
        this.criticalEl.hidden = true;
      }
    }

    const progressPct = Math.max(0, Math.min(100, input.catchProgress * 100));
    this.progressFillEl.style.height = `${progressPct}%`;

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
          <div class="fishing-fight-gauge__track" aria-hidden="true">
            <div class="fishing-fight-gauge__critical" hidden></div>
            <div class="fishing-fight-gauge__player-bar"></div>
            <div class="fishing-fight-gauge__fish"></div>
          </div>
          <div class="fishing-fight-gauge__progress" aria-label="捕獲ゲージ">
            <div class="fishing-fight-gauge__progress-fill"></div>
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
    this.trackEl = scope.querySelector('.fishing-fight-gauge__track');
    this.criticalEl = scope.querySelector('.fishing-fight-gauge__critical');
    this.playerBarEl = scope.querySelector('.fishing-fight-gauge__player-bar');
    this.fishEl = scope.querySelector('.fishing-fight-gauge__fish');
    this.progressFillEl = scope.querySelector('.fishing-fight-gauge__progress-fill');
    this.tensionFillEl = scope.querySelector('.fishing-fight-gauge__tension-fill');
    this.tensionValueEl = scope.querySelector('.fishing-fight-gauge__tension-value');
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
    (scope as HTMLElement).style.setProperty('--fishing-track-width', `${d.trackWidth}px`);
    (scope as HTMLElement).style.setProperty('--fishing-track-height', `${d.trackHeight}px`);
    (scope as HTMLElement).style.setProperty('--fishing-bar-width', `${d.barWidth}px`);
    (scope as HTMLElement).style.setProperty('--fishing-fish-size', `${d.fishSize}px`);
    (scope as HTMLElement).style.setProperty('--fishing-progress-width', `${d.progressWidth}px`);
  }
}

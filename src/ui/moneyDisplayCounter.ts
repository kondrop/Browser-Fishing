/** HUD 所持金の桁数（金額表示.png の7スロット） */
export const HUD_MONEY_DIGIT_COUNT = 7;
export const HUD_MONEY_MAX = 9_999_999;

const COUNT_MIN_MS = 360;
const COUNT_MAX_MS = 2200;
/** この変動量でアニメ時間の上限に達する（対数スケール） */
const COUNT_DELTA_AT_MAX = 100_000;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function easeOutCubic(t: number): number {
  const inv = 1 - t;
  return 1 - inv * inv * inv;
}

export function clampHudMoney(n: number): number {
  return Math.max(0, Math.min(HUD_MONEY_MAX, Math.floor(n)));
}

/** 変動量が大きいほど長い。1G で最短、10万G付近で上限。 */
export function moneyCountDurationMs(delta: number): number {
  const mag = Math.abs(delta);
  if (mag <= 0) return 0;
  const t = Math.min(1, Math.log10(Math.max(mag, 1)) / Math.log10(COUNT_DELTA_AT_MAX));
  return Math.round(COUNT_MIN_MS + (COUNT_MAX_MS - COUNT_MIN_MS) * t);
}

function applyCountingShake(el: HTMLElement | null, counting: boolean, delta: number): void {
  if (!el) return;
  if (!counting) {
    el.classList.remove('is-counting');
    el.style.removeProperty('--money-shake-px');
    el.style.removeProperty('--money-shake-rot');
    return;
  }
  const mag = Math.abs(delta);
  const amp = mag >= 10_000 ? 2.25 : mag >= 1_000 ? 1.75 : mag >= 100 ? 1.35 : 1;
  el.style.setProperty('--money-shake-px', `${amp}px`);
  el.style.setProperty('--money-shake-rot', `${(amp * 0.42).toFixed(2)}deg`);
  el.classList.add('is-counting');
}

type AnimatorHooks = {
  onUpdate: (value: number) => void;
  onCountingChange: (counting: boolean, delta: number) => void;
};

class MoneyCountAnimator {
  private displayed = 0;
  private from = 0;
  private to = 0;
  private startTs = 0;
  private duration = 0;
  private rafId = 0;
  private ready = false;
  private hooks: AnimatorHooks;

  constructor(hooks: AnimatorHooks) {
    this.hooks = hooks;
  }

  get target(): number {
    return this.to;
  }

  destroy(): void {
    this.cancelRaf();
    this.hooks.onCountingChange(false, 0);
  }

  go(value: number, immediate = false): void {
    const next = value;
    if (immediate || !this.ready || prefersReducedMotion()) {
      this.snap(next);
      return;
    }
    if (next === this.to) return;

    this.from = this.displayed;
    this.to = next;
    const delta = this.to - this.from;
    if (delta === 0) {
      this.snap(next);
      return;
    }
    this.duration = moneyCountDurationMs(delta);
    this.startTs = performance.now();
    this.hooks.onCountingChange(true, delta);
    if (this.rafId === 0) {
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  private snap(value: number): void {
    this.cancelRaf();
    this.displayed = value;
    this.from = value;
    this.to = value;
    this.ready = true;
    this.hooks.onUpdate(value);
    this.hooks.onCountingChange(false, 0);
  }

  private cancelRaf(): void {
    if (this.rafId !== 0) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private tick = (now: number): void => {
    const u = this.duration <= 0 ? 1 : Math.min(1, (now - this.startTs) / this.duration);
    const eased = easeOutCubic(u);
    this.displayed = this.from + (this.to - this.from) * eased;
    this.hooks.onUpdate(this.displayed);
    if (u < 1) {
      this.rafId = requestAnimationFrame(this.tick);
      return;
    }
    this.rafId = 0;
    this.displayed = this.to;
    this.hooks.onUpdate(this.to);
    this.hooks.onCountingChange(false, 0);
  };
}

function renderHudDigits(digitEls: HTMLElement[], value: number): void {
  const n = Math.max(0, Math.min(HUD_MONEY_MAX, Math.round(value)));
  const padded = String(n).padStart(HUD_MONEY_DIGIT_COUNT, ' ');
  digitEls.forEach((el, i) => {
    const ch = padded[i] ?? ' ';
    el.textContent = ch === ' ' ? '' : ch;
  });
}

/** HUD 所持金: 元の桁スロットに数値を描き、カウント＋枠揺れ */
export class HudMoneyDisplay {
  private displayEl: HTMLElement | null = null;
  private digitEls: HTMLElement[] = [];
  private readonly animator: MoneyCountAnimator;

  constructor() {
    this.animator = new MoneyCountAnimator({
      onUpdate: (value) => this.render(value),
      onCountingChange: (counting, delta) => applyCountingShake(this.displayEl, counting, delta),
    });
  }

  attach(root: HTMLElement): void {
    this.displayEl = root.querySelector('#money-display');
    this.digitEls = Array.from(root.querySelectorAll('#money-digits .money-display__digit'));
  }

  setMoney(money: number, immediate = false): void {
    const clamped = clampHudMoney(money);
    if (this.displayEl) {
      this.displayEl.setAttribute('aria-label', `所持金 ${clamped.toLocaleString('ja-JP')} G`);
    }
    this.animator.go(clamped, immediate);
  }

  destroy(): void {
    this.animator.destroy();
  }

  private render(value: number): void {
    if (this.digitEls.length !== HUD_MONEY_DIGIT_COUNT) return;
    renderHudDigits(this.digitEls, value);
  }
}

/** ショップ所持金など、単一テキストのカウンター */
export class TextMoneyDisplay {
  private rootEl: HTMLElement | null = null;
  private valueEl: HTMLElement | null = null;
  private readonly animator: MoneyCountAnimator;

  constructor() {
    this.animator = new MoneyCountAnimator({
      onUpdate: (value) => this.render(value),
      onCountingChange: (counting, delta) => applyCountingShake(this.rootEl, counting, delta),
    });
  }

  attach(root: HTMLElement, valueSelector: string): void {
    this.rootEl = root;
    this.valueEl = root.querySelector(valueSelector);
  }

  setMoney(money: number, immediate = false): void {
    this.animator.go(Math.max(0, Math.floor(money)), immediate);
  }

  destroy(): void {
    this.animator.destroy();
  }

  private render(value: number): void {
    if (!this.valueEl) return;
    this.valueEl.textContent = Math.round(value).toLocaleString();
  }
}

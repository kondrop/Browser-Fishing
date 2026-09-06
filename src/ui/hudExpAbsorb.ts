export type Point = { x: number; y: number };

export type HudExpHold = {
  fromExp: number;
  toExp: number;
};

export type HudExpAbsorbHandle = {
  cancel: () => void;
};

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

function easeOutQuad(t: number): number {
  const inv = 1 - t;
  return 1 - inv * inv;
}

function easeOutCubic(t: number): number {
  const inv = 1 - t;
  return 1 - inv * inv * inv;
}

function quadBezier(p0: Point, p1: Point, p2: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

export function getElementCenter(el: Element | null | undefined): Point | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width <= 0 && r.height <= 0) return null;
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function ensureOrbLayer(): HTMLElement {
  let layer = document.getElementById('hud-exp-orb-layer');
  if (layer) return layer;
  layer = document.createElement('div');
  layer.id = 'hud-exp-orb-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);
  return layer;
}

export function clearHudExpOrbs(): void {
  document.getElementById('hud-exp-orb-layer')?.replaceChildren();
}

const EXP_ORB_SRC = '/images/Fishing Result UI/orb.svg';

function createExpOrb(): HTMLImageElement {
  const orb = document.createElement('img');
  orb.className = 'hud-exp-orb';
  orb.src = EXP_ORB_SRC;
  orb.alt = '';
  orb.draggable = false;
  return orb;
}

function orbCountForGain(gain: number): number {
  return Math.max(5, Math.min(14, 4 + Math.round(Math.log2(Math.max(gain, 1) + 1) * 1.35)));
}

/** リザルトの経験値チップから HUD バーへ、曲線＋イージングで緑スフィアを飛ばす */
export function playExpOrbFlight(options: {
  origin: Point;
  target: Point;
  gain: number;
  onAbsorbed: () => void;
}): HudExpAbsorbHandle {
  const layer = ensureOrbLayer();
  layer.replaceChildren();

  if (prefersReducedMotion()) {
    options.onAbsorbed();
    return { cancel: () => undefined };
  }

  const count = orbCountForGain(options.gain);
  const orbs: HTMLElement[] = [];
  const animations: Animation[] = [];
  let cancelled = false;
  let finished = 0;
  let absorbed = false;

  const finishOne = () => {
    if (cancelled || absorbed) return;
    finished += 1;
    if (finished < count) return;
    absorbed = true;
    options.onAbsorbed();
  };

  for (let i = 0; i < count; i++) {
    const orb = createExpOrb();
    layer.appendChild(orb);
    orbs.push(orb);

    const sizeMul = 0.42 + Math.random() * 0.58;
    const jitter = (Math.random() - 0.5) * 18;
    const start: Point = {
      x: options.origin.x + (Math.random() - 0.5) * 10,
      y: options.origin.y + (Math.random() - 0.5) * 8,
    };
    const mid: Point = {
      x: (start.x + options.target.x) / 2 + jitter,
      y: Math.min(start.y, options.target.y) - (70 + Math.random() * 50),
    };
    const appearMs = 100;
    const duration = appearMs + 400 + Math.round(Math.random() * 80);
    const appearEnd = appearMs / duration;
    const settleEnd = appearEnd + 80 / duration;
    const steps = 24;
    const keyframes: Keyframe[] = [];
    for (let s = 0; s <= steps; s++) {
      const linear = s / steps;
      const t = easeOutQuad(linear);
      const p = quadBezier(start, mid, options.target, t);
      let appearScale = 1;
      let appearOpacity = 1;
      if (linear <= appearEnd) {
        const a = easeOutCubic(linear / appearEnd);
        appearScale = (0.08 + a * 1.04) * sizeMul;
        appearOpacity = a;
      } else if (linear <= settleEnd) {
        const settle = (linear - appearEnd) / Math.max(0.001, settleEnd - appearEnd);
        appearScale = (1.12 - settle * 0.12) * sizeMul;
      } else {
        appearScale = sizeMul;
      }
      const absorb = linear > 0.78 ? (linear - 0.78) / 0.22 : 0;
      const scale = Math.max(0.08, appearScale * (1 - absorb * 0.88));
      const opacity = appearOpacity * (1 - absorb * 0.35);
      keyframes.push({
        offset: linear,
        transform: `translate(${p.x}px, ${p.y}px) scale(${scale})`,
        opacity: String(opacity),
      });
    }

    const anim = orb.animate(keyframes, {
      duration,
      delay: i * 52,
      easing: 'linear',
      fill: 'both',
    });
    animations.push(anim);
    anim.finished.then(() => {
      orb.remove();
      finishOne();
    }).catch(() => {
      orb.remove();
      finishOne();
    });
  }

  return {
    cancel: () => {
      cancelled = true;
      animations.forEach((anim) => anim.cancel());
      orbs.forEach((orb) => orb.remove());
    },
  };
}

export function expDisplayForTotal(
  totalExp: number,
  getRequiredExp: (level: number) => number,
  calculateLevel: (exp: number) => number,
): { level: number; current: number; needed: number; progress: number } {
  const level = calculateLevel(totalExp);
  const currentLevelExp = getRequiredExp(level);
  const nextLevelExp = getRequiredExp(level + 1);
  const needed = Math.max(1, nextLevelExp - currentLevelExp);
  const current = Math.max(0, totalExp - currentLevelExp);
  return {
    level,
    current,
    needed,
    progress: Math.min(1, current / needed),
  };
}

function segmentDurationMs(progressDelta: number): number {
  const mag = clamp01(Math.abs(progressDelta));
  return Math.round(750 + mag * 1050);
}

export function setExpBarLabel(root: ParentNode | null | undefined, current: number, needed: number): void {
  if (!root) return;
  const currentEl = root.querySelector('.exp-bar-current');
  const neededEl = root.querySelector('.exp-bar-needed');
  if (currentEl && neededEl) {
    currentEl.textContent = String(current);
    neededEl.textContent = String(needed);
    return;
  }
  const text = root.querySelector('#exp-bar-text') as HTMLElement | null;
  if (text) text.textContent = `${current} / ${needed}`;
}

export function setExpBarCounting(root: ParentNode | null | undefined, counting: boolean): void {
  const text = root?.querySelector('#exp-bar-text') as HTMLElement | null;
  if (!text) return;
  text.classList.toggle('is-counting', counting);
}

/** バー塗りと数値を、レベルアップ跨ぎも含めてアニメーションする */
export function playExpBarCountUp(options: {
  fromExp: number;
  toExp: number;
  getRequiredExp: (level: number) => number;
  calculateLevel: (exp: number) => number;
  setLevel: (level: number) => void;
  setFill: (progress01: number) => void;
  setText: (current: number, needed: number) => void;
  setCounting?: (counting: boolean) => void;
  onDone: () => void;
}): HudExpAbsorbHandle {
  const apply = (totalExp: number) => {
    const d = expDisplayForTotal(totalExp, options.getRequiredExp, options.calculateLevel);
    options.setLevel(d.level);
    options.setFill(d.progress);
    options.setText(Math.floor(d.current), Math.floor(d.needed));
  };

  if (options.toExp <= options.fromExp || prefersReducedMotion()) {
    apply(options.toExp);
    options.setCounting?.(false);
    options.onDone();
    return { cancel: () => undefined };
  }

  let cancelled = false;
  let raf = 0;
  let chain = Promise.resolve();
  options.setCounting?.(true);

  const wait = (ms: number) => new Promise<void>((resolve) => {
    if (cancelled) {
      resolve();
      return;
    }
    window.setTimeout(resolve, ms);
  });

  const tween = (duration: number, onT: (t: number) => void) =>
    new Promise<void>((resolve) => {
      if (cancelled || duration <= 0) {
        onT(1);
        resolve();
        return;
      }
      const start = performance.now();
      const tick = (now: number) => {
        if (cancelled) {
          resolve();
          return;
        }
        const t = clamp01((now - start) / duration);
        onT(easeOutCubic(t));
        if (t < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          resolve();
        }
      };
      raf = requestAnimationFrame(tick);
    });

  const run = async () => {
    let cursor = options.fromExp;
    let shownLevel = options.calculateLevel(cursor);
    apply(cursor);

    while (!cancelled && cursor < options.toExp - 1e-6) {
      const levelStart = options.getRequiredExp(shownLevel);
      const levelEnd = options.getRequiredExp(shownLevel + 1);
      const span = Math.max(1, levelEnd - levelStart);
      const segEnd = Math.min(options.toExp, levelEnd);
      const startProg = clamp01((cursor - levelStart) / span);
      const endProg = clamp01((segEnd - levelStart) / span);

      await tween(segmentDurationMs(endProg - startProg), (t) => {
        const p = startProg + (endProg - startProg) * t;
        const current = p * span;
        options.setFill(p);
        options.setText(Math.floor(current), Math.floor(span));
      });
      if (cancelled) return;

      cursor = segEnd;
      if (cursor >= levelEnd - 1e-6 && cursor < options.toExp) {
        shownLevel += 1;
        options.setLevel(shownLevel);
        options.setFill(0);
        const nextSpan = Math.max(1, options.getRequiredExp(shownLevel + 1) - options.getRequiredExp(shownLevel));
        options.setText(0, Math.floor(nextSpan));
        await wait(70);
      }
    }

    if (!cancelled) {
      apply(options.toExp);
      options.setCounting?.(false);
      options.onDone();
    }
  };

  chain = run();
  void chain;

  return {
    cancel: () => {
      cancelled = true;
      options.setCounting?.(false);
      if (raf) cancelAnimationFrame(raf);
    },
  };
}

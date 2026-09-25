import { explorationConfig, getExplorationCamera, getExplorationViewSize, setExplorationViewSizeFromCss, stepExplorationCamera } from './explorationConfig';
import { drawExplorationFrame, loadFishShadowImages, loadGearImage } from './explorationRenderer';
import {
  applySpaceAppeal,
  failFish,
  getBitingFish,
  moveHook,
  stepExplorationWorld,
  succeedHook,
  tickHookFx,
  tickHookIntro,
} from './explorationFishAI';
import {
  createHook,
  createInitialFish,
  evaluateHookInput,
  getHookDepthRatio,
  getHookDrawPos,
  isHookIntroDropping,
  isHookIntroPlaying,
  endHookIntro,
} from './explorationFish';
import {
  createInitialPickups,
  findCollectiblePickup,
  getPickupDrawPos,
  loadPickupImages,
  markPickupCollected,
  pruneFinishedPickups,
  tickPickups,
  worldToExplorationScreen,
} from './explorationPickups';
import type {
  ExplorationFish,
  ExplorationHook,
  ExplorationPickup,
  ExplorationResult,
  ExplorationStartOptions,
} from './explorationTypes';
import {
  createUnderwaterState,
  seedUnderwater,
  spawnHookIntroBubbles,
  tickUnderwater,
  type ExplorationUnderwaterState,
} from './explorationUnderwater';

export class ExplorationController {
  private root: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private rafId = 0;
  private lastFrameAt = 0;
  private active = false;
  private closed = false;
  private fishes: ExplorationFish[] = [];
  private pickups: ExplorationPickup[] = [];
  private hook: ExplorationHook = createHook();
  private underwater: ExplorationUnderwaterState = createUnderwaterState();
  private camera = getExplorationCamera(0, 0);
  private options: ExplorationStartOptions | null = null;
  private keys = {
    left: false,
    right: false,
    up: false,
    down: false,
  };
  private shadowImages = loadFishShadowImages();
  private baitImage: HTMLImageElement | null = null;
  private lureImage: HTMLImageElement | null = null;
  private onKeyDown = (e: KeyboardEvent) => this.handleKeyDown(e);
  private onKeyUp = (e: KeyboardEvent) => this.handleKeyUp(e);
  private onPointerMove = (e: PointerEvent) => this.handlePointerMove(e);
  private onPointerDown = () => this.setKeyboardCursorHidden(false);

  private lastSpaceAt = 0;
  private successHold = false;
  private pendingResult: ExplorationResult | null = null;
  private successTimer = 0;
  private hitStampEl: HTMLElement | null = null;
  private onResize = () => this.syncLayoutSafeAreas();

  isActive(): boolean {
    return this.active;
  }

  start(options: ExplorationStartOptions): void {
    this.stop();
    this.options = options;
    this.closed = false;
    this.successHold = false;
    this.pendingResult = null;
    this.active = true;
    this.lastFrameAt = 0;
    this.keys = { left: false, right: false, up: false, down: false };
    this.hook = createHook();
    this.underwater = createUnderwaterState();
    const timeSec = performance.now() / 1000;
    this.camera = getExplorationCamera(this.hook.x, this.hook.restY);
    seedUnderwater(this.underwater, timeSec, this.camera);
    this.fishes = createInitialFish({
      rarityBonuses: options.rarityBonuses,
      junkWeightMultiplier: options.junkWeightMultiplier,
      castDistanceRatio: options.castDistanceRatio,
      habitat: options.habitat,
      timeSec,
    });
    loadPickupImages();
    this.pickups = createInitialPickups();
    this.baitImage = loadGearImage(options.baitId);
    this.lureImage = loadGearImage(options.lureId);
    this.mount();
    window.addEventListener('keydown', this.onKeyDown, true);
    window.addEventListener('keyup', this.onKeyUp, true);
    document.addEventListener('pointermove', this.onPointerMove, true);
    document.addEventListener('pointerdown', this.onPointerDown, true);
    window.addEventListener('resize', this.onResize);
    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  stop(): void {
    this.active = false;
    this.successHold = false;
    this.pendingResult = null;
    if (this.successTimer) {
      window.clearTimeout(this.successTimer);
      this.successTimer = 0;
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    window.removeEventListener('keydown', this.onKeyDown, true);
    window.removeEventListener('keyup', this.onKeyUp, true);
    document.removeEventListener('pointermove', this.onPointerMove, true);
    document.removeEventListener('pointerdown', this.onPointerDown, true);
    window.removeEventListener('resize', this.onResize);
    this.setKeyboardCursorHidden(false);
    this.unmount();
    this.fishes = [];
    this.pickups = [];
    this.options = null;
  }

  cancel(): void {
    if (this.closed) return;
    this.closed = true;
    const onCancel = this.options?.onCancel;
    this.stop();
    onCancel?.();
  }

  handleSpace(): void {
    if (!this.active || this.closed || this.successHold) return;
    if (isHookIntroPlaying(this.hook)) endHookIntro(this.hook);
    const now = performance.now();
    if (now - this.lastSpaceAt < 40) return;
    this.lastSpaceAt = now;
    const biting = getBitingFish(this.fishes);
    if (biting) {
      const result = evaluateHookInput({
        fish: biting,
        canIgnoreFalseHook: false,
      });
      if (result === 'success') {
        this.completeHook(biting);
      } else if (result === 'fail') {
        failFish(biting, this.hook);
      }
      return;
    }
    const timeSec = now / 1000;
    if (this.tryCollectPickup(timeSec)) return;
    applySpaceAppeal(this.fishes, this.hook);
  }

  private tryCollectPickup(timeSec: number): boolean {
    const target = findCollectiblePickup(this.pickups, this.hook, timeSec);
    if (!target) return false;
    const pos = getPickupDrawPos(target, timeSec);
    markPickupCollected(target);
    const canvas = this.canvas;
    const onCollect = this.options?.onPickupCollect;
    if (canvas && onCollect) {
      const screen = worldToExplorationScreen(pos.x, pos.y, this.camera, canvas);
      onCollect({
        kind: target.kind,
        amount: target.amount,
        screenX: screen.x,
        screenY: screen.y,
      });
    }
    return true;
  }

  private completeHook(fish: ExplorationFish): void {
    if (this.closed) return;
    this.closed = true;
    this.successHold = true;
    succeedHook(fish, this.hook);
    this.pendingResult = {
      fish: fish.fish,
      size: fish.size,
      hookDepth: this.hook.y,
      hookDepthRatio: getHookDepthRatio(this.hook.y),
    };
    this.showHitStamp();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stampMs = reduced ? 180 : explorationConfig.hookToFightIntro.stampHoldSec * 1000;
    this.successTimer = window.setTimeout(() => this.beginSuccessLeave(), stampMs);
  }

  private showHitStamp(): void {
    if (!this.hitStampEl) return;
    this.layoutHitStamp();
    this.hitStampEl.hidden = false;
    this.hitStampEl.classList.remove('is-in');
    void this.hitStampEl.offsetWidth;
    this.hitStampEl.classList.add('is-in');
  }

  private layoutHitStamp(): void {
    if (!this.hitStampEl) return;
    const pos = getHookDrawPos(this.hook);
    const { canvasW, canvasH } = getExplorationViewSize();
    const sx = ((pos.x - this.camera.x) / canvasW) * 100;
    const sy = ((pos.y - this.camera.y) / canvasH) * 100;
    this.hitStampEl.style.left = `${sx}%`;
    this.hitStampEl.style.top = `${sy}%`;
  }

  private beginSuccessLeave(): void {
    this.root?.classList.add('is-leaving');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fadeMs = reduced ? 0 : explorationConfig.hookToFightIntro.overlayFadeSec * 1000;
    this.successTimer = window.setTimeout(() => this.finishSuccess(), fadeMs);
  }

  private finishSuccess(): void {
    const onSuccess = this.options?.onHookSuccess;
    const result = this.pendingResult;
    this.stop();
    if (result) onSuccess?.(result);
  }

  private mount(): void {
    const root = document.createElement('div');
    root.id = 'exploration-overlay';
    root.className = 'exploration-overlay';
    root.innerHTML = `
      <div class="exploration-modal ui-frame-box">
        <div class="exploration-canvas-wrap">
          <canvas id="exploration-canvas" width="${explorationConfig.canvasW}" height="${explorationConfig.canvasH}"></canvas>
          <div class="exploration-hit-stamp" hidden>
            <img src="/images/ui/hit.png" alt="" decoding="async" />
          </div>
        </div>
        <div class="exploration-hint">
          <span>←↑↓→ 針を動かす</span>
          <span>SPACE アピール / フッキング / 回収</span>
          <span>ESC やめる</span>
        </div>
      </div>
    `;
    root.style.setProperty('--exploration-fade-sec', `${explorationConfig.modalFadeInSec}s`);
    root.style.setProperty('--exploration-leave-sec', `${explorationConfig.hookToFightIntro.overlayFadeSec}s`);
    root.style.setProperty('--exploration-hit-shake-sec', `${explorationConfig.hookToFightIntro.stampShakeSec}s`);
    document.body.appendChild(root);
    document.body.classList.add('ui-exploration-open');
    this.root = root;
    this.canvas = root.querySelector('#exploration-canvas');
    this.hitStampEl = root.querySelector('.exploration-hit-stamp');
    // レイアウト確定後に視野サイズを合わせる
    requestAnimationFrame(() => this.syncLayoutSafeAreas());
    this.syncLayoutSafeAreas();
  }

  private unmount(): void {
    document.body.classList.remove('ui-exploration-open');
    this.root?.remove();
    this.root = null;
    this.canvas = null;
    this.hitStampEl = null;
  }

  /** 装備UI〜クエストUIの実寸を測り、上下に同じ gap でモーダルを置く */
  private syncLayoutSafeAreas(): void {
    if (!this.root) return;
    const topUi = document.getElementById('top-ui');
    const questHud = document.getElementById('quest-hud');
    const topHud = topUi
      ? Math.ceil(topUi.getBoundingClientRect().bottom)
      : 120;
    const bottomHud = questHud
      ? Math.ceil(window.innerHeight - questHud.getBoundingClientRect().top)
      : 90;
    this.root.style.setProperty('--exploration-hud-top', `${Math.max(72, topHud)}px`);
    this.root.style.setProperty('--exploration-hud-bottom', `${Math.max(72, bottomHud)}px`);
    this.syncCanvasViewSize();
  }

  /** 表示枠の縦横比にバッファを合わせ、CSS 非等方ストレッチで絵が潰れるのを防ぐ */
  private syncCanvasViewSize(): void {
    const wrap = this.root?.querySelector('.exploration-canvas-wrap') as HTMLElement | null;
    const canvas = this.canvas;
    if (!wrap || !canvas) return;
    const rect = wrap.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    const { canvasW, canvasH } = setExplorationViewSizeFromCss(rect.width, rect.height);
    if (canvas.width !== canvasW) canvas.width = canvasW;
    if (canvas.height !== canvasH) canvas.height = canvasH;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.active) return;
    const key = e.key;
    if (
      key === 'ArrowLeft' ||
      key === 'ArrowRight' ||
      key === 'ArrowUp' ||
      key === 'ArrowDown' ||
      key === ' ' ||
      key === 'Spacebar' ||
      e.code === 'Space'
    ) {
      e.preventDefault();
      this.setKeyboardCursorHidden(true);
    }
    if (key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this.cancel();
      return;
    }
    if (key === 'ArrowLeft') this.keys.left = true;
    if (key === 'ArrowRight') this.keys.right = true;
    if (key === 'ArrowUp') this.keys.up = true;
    if (key === 'ArrowDown') this.keys.down = true;
    if (key === ' ' || key === 'Spacebar' || e.code === 'Space') {
      if (!e.repeat) this.handleSpace();
    }
  }

  private handlePointerMove(e: PointerEvent): void {
    if (e.movementX === 0 && e.movementY === 0) return;
    this.setKeyboardCursorHidden(false);
  }

  private setKeyboardCursorHidden(hidden: boolean): void {
    document.body.classList.toggle('ui-exploration-cursor-hide', hidden);
  }

  private handleKeyUp(e: KeyboardEvent): void {
    if (e.key === 'ArrowLeft') this.keys.left = false;
    if (e.key === 'ArrowRight') this.keys.right = false;
    if (e.key === 'ArrowUp') this.keys.up = false;
    if (e.key === 'ArrowDown') this.keys.down = false;
  }

  private loop(now: number): void {
    if (!this.active) return;
    const dt = this.lastFrameAt ? Math.min(0.05, (now - this.lastFrameAt) / 1000) : 0.016;
    this.lastFrameAt = now;
    const timeSec = now / 1000;
    const options = this.options;
    if (!options) return;

    if (!this.successHold) {
      moveHook(this.hook, this.keys, dt);
      tickHookIntro(this.hook, dt);
      const cameraFocusY = isHookIntroPlaying(this.hook) ? this.hook.restY : this.hook.y;
      stepExplorationCamera(this.camera, this.hook.x, cameraFocusY, dt);
      spawnHookIntroBubbles(
        this.underwater,
        this.hook.x,
        Math.max(this.hook.y, this.camera.y + 20),
        dt,
        timeSec,
        isHookIntroDropping(this.hook),
      );
      stepExplorationWorld({
        fishes: this.fishes,
        hook: this.hook,
        dt,
        timeSec,
        options,
      });
      tickPickups(this.pickups, dt);
      this.pickups = pruneFinishedPickups(this.pickups);
    } else {
      this.layoutHitStamp();
      tickPickups(this.pickups, dt);
    }
    tickHookFx(this.hook, dt);
    const camera = this.camera;
    tickUnderwater(this.underwater, dt, timeSec, camera);

    this.syncCanvasViewSize();
    const ctx = this.canvas?.getContext('2d');
    if (ctx) {
      drawExplorationFrame({
        ctx,
        underwater: this.underwater,
        fishes: this.fishes,
        pickups: this.pickups,
        hook: this.hook,
        gear: {
          shadowImages: this.shadowImages,
          baitImage: this.baitImage,
          lureImage: this.lureImage,
        },
        camera,
        timeSec,
      });
    }
    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }
}

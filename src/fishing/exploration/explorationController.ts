import { explorationConfig, getExplorationCamera, stepExplorationCamera } from './explorationConfig';
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
  isHookIntroDropping,
  isHookIntroPlaying,
} from './explorationFish';
import type {
  ExplorationFish,
  ExplorationHook,
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

  private lastSpaceAt = 0;

  isActive(): boolean {
    return this.active;
  }

  start(options: ExplorationStartOptions): void {
    this.stop();
    this.options = options;
    this.closed = false;
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
      timeSec,
    });
    this.baitImage = loadGearImage(options.baitId);
    this.lureImage = loadGearImage(options.lureId);
    this.mount();
    window.addEventListener('keydown', this.onKeyDown, true);
    window.addEventListener('keyup', this.onKeyUp, true);
    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  stop(): void {
    this.active = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    window.removeEventListener('keydown', this.onKeyDown, true);
    window.removeEventListener('keyup', this.onKeyUp, true);
    this.unmount();
    this.fishes = [];
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
    if (!this.active || this.closed) return;
    if (isHookIntroPlaying(this.hook)) return;
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
    applySpaceAppeal(this.fishes, this.hook);
  }

  private completeHook(fish: ExplorationFish): void {
    if (this.closed) return;
    this.closed = true;
    succeedHook(fish, this.hook);
    const onSuccess = this.options?.onHookSuccess;
    const result: ExplorationResult = {
      fish: fish.fish,
      size: fish.size,
      hookDepth: this.hook.y,
      hookDepthRatio: getHookDepthRatio(this.hook.y),
    };
    this.stop();
    onSuccess?.(result);
  }

  private mount(): void {
    const root = document.createElement('div');
    root.id = 'exploration-overlay';
    root.className = 'exploration-overlay';
    root.innerHTML = `
      <div class="exploration-modal ui-frame-box">
        <div class="exploration-canvas-wrap">
          <canvas id="exploration-canvas" width="${explorationConfig.canvasW}" height="${explorationConfig.canvasH}"></canvas>
        </div>
        <div class="exploration-hint">
          <span>←↑↓→ 針を動かす</span>
          <span>SPACE アピール / フッキング</span>
          <span>ESC やめる</span>
        </div>
      </div>
    `;
    root.style.setProperty('--exploration-fade-sec', `${explorationConfig.modalFadeInSec}s`);
    document.body.appendChild(root);
    this.root = root;
    this.canvas = root.querySelector('#exploration-canvas');
  }

  private unmount(): void {
    this.root?.remove();
    this.root = null;
    this.canvas = null;
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

    moveHook(this.hook, this.keys, dt);
    tickHookIntro(this.hook, dt);
    tickHookFx(this.hook, dt);
    const cameraFocusY = isHookIntroPlaying(this.hook) ? this.hook.restY : this.hook.y;
    stepExplorationCamera(this.camera, this.hook.x, cameraFocusY, dt);
    const camera = this.camera;
    tickUnderwater(this.underwater, dt, timeSec, camera);
    spawnHookIntroBubbles(
      this.underwater,
      this.hook.x,
      Math.max(this.hook.y, camera.y + 20),
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

    const ctx = this.canvas?.getContext('2d');
    if (ctx) {
      drawExplorationFrame({
        ctx,
        underwater: this.underwater,
        fishes: this.fishes,
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

import type { PlayerData } from '../data/inventory';
import { getEffectiveSkillStatBonuses } from './balanceDebug';
import {
  balanceReferenceFishParams,
  createFightSimState,
  getFightBarHeight,
  stepFightSimulation,
  type FightSimState,
} from '../fight/fightSimulation';
import { FishingGaugeOverlay } from '../ui/fishingGaugeOverlay';

export interface BalanceFightPreviewHost {
  getPlayerData: () => PlayerData;
}

export class BalanceFightPreview {
  private overlay = new FishingGaugeOverlay();
  private host: BalanceFightPreviewHost | null = null;

  private rafId: number | null = null;
  private lastTs = 0;
  private keys = { space: false, left: false, up: false, right: false };
  private sim!: FightSimState;
  private skillTriggers = { lockOn: false, stagger: false, smoothDrag: false };

  mount(container: HTMLElement, host: BalanceFightPreviewHost): void {
    this.host = host;
    this.overlay.mountPreview(container);
    this.resetState();
    this.render();
  }

  start(): void {
    if (this.rafId !== null) return;
    this.resetState();
    this.lastTs = performance.now();
    this.bindKeys(true);
    const tick = (ts: number) => {
      const dt = Math.min(0.05, (ts - this.lastTs) / 1000);
      this.lastTs = ts;
      this.step(dt);
      this.render();
      this.skillTriggers = { lockOn: false, stagger: false, smoothDrag: false };
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.bindKeys(false);
  }

  unmount(): void {
    this.stop();
    this.overlay.unmount();
    this.host = null;
  }

  private resetState(): void {
    if (!this.host) return;
    this.sim = createFightSimState(this.host.getPlayerData());
  }

  private bindKeys(on: boolean): void {
    const add = on ? window.addEventListener.bind(window) : window.removeEventListener.bind(window);
    add('keydown', this.onKeyDown);
    add('keyup', this.onKeyUp);
  }

  private readonly onKeyDown = (e: KeyboardEvent) => {
    if (this.shouldIgnoreKeyTarget(e.target)) return;
    if (e.code === 'Space') {
      e.preventDefault();
      this.keys.space = true;
    }
    if (e.code === 'ArrowLeft' && !e.repeat) {
      e.preventDefault();
      this.keys.left = true;
      this.skillTriggers.lockOn = true;
    }
    if (e.code === 'ArrowUp' && !e.repeat) {
      e.preventDefault();
      this.keys.up = true;
      this.skillTriggers.stagger = true;
    }
    if (e.code === 'ArrowRight' && !e.repeat) {
      e.preventDefault();
      this.keys.right = true;
      this.skillTriggers.smoothDrag = true;
    }
  };

  private readonly onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') this.keys.space = false;
    if (e.code === 'ArrowLeft') this.keys.left = false;
    if (e.code === 'ArrowUp') this.keys.up = false;
    if (e.code === 'ArrowRight') this.keys.right = false;
  };

  private shouldIgnoreKeyTarget(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  private getHost(): BalanceFightPreviewHost {
    if (!this.host) throw new Error('BalanceFightPreview host is not set');
    return this.host;
  }

  private step(dt: number): void {
    const pd = this.getHost().getPlayerData();
    stepFightSimulation(this.sim, {
      dt,
      spaceHeld: this.keys.space,
      playerData: pd,
      equippedRodId: pd.equippedRodId,
      fish: balanceReferenceFishParams(),
      skillBonuses: getEffectiveSkillStatBonuses(pd),
      sandbox: true,
      triggerLockOn: this.skillTriggers.lockOn,
      triggerStagger: this.skillTriggers.stagger,
      triggerSmoothDrag: this.skillTriggers.smoothDrag,
    });
  }

  private render(): void {
    const pd = this.getHost().getPlayerData();
    const skillBonuses = getEffectiveSkillStatBonuses(pd);
    const barHeight = getFightBarHeight(this.sim, pd, pd.equippedRodId, skillBonuses);
    const playerHitBarCenter = this.sim.playerBarPosition + barHeight / 2;

    this.overlay.updateFight({
      fishBarPosition: this.sim.fishBarPosition,
      playerBarPosition: this.sim.playerBarPosition,
      barHeight,
      catchProgress: this.sim.catchProgress,
      isCatching: this.sim.isCatching,
      criticalZoneHeight: 0,
      playerHitBarCenter,
      fishColor: '#ffaa00',
    });
  }
}

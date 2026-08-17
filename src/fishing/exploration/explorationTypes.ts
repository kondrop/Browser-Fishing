import type { FishConfig } from '../../data/fishConfig';
import type { RarityBonuses } from '../../data/fish';

export type FishExplorationState =
  | 'swimming'
  | 'bite'
  | 'hookWindow'
  | 'escaping'
  | 'hooked';

export type BiteKind = 'feint' | 'real';

/** hold=待機, windup/lunge=共通予備〜アタック, contact=接触, recover=フェイント後の離脱 */
export type BiteAnimPhase = 'hold' | 'windup' | 'lunge' | 'contact' | 'recover';

export type SwimMode = 'cruise' | 'idle' | 'dash';

export type ExplorationFish = {
  id: string;
  fish: FishConfig;
  size: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  facing: 'left' | 'right';
  pitch: number;
  phase: number;
  speedMul: number;
  homeY: number;
  swimMode: SwimMode;
  swimUntil: number;
  state: FishExplorationState;
  appeal: number;
  appealThreshold: number;
  biteAttemptCount: number;
  biteKind: BiteKind | null;
  biteAnim: BiteAnimPhase;
  biteAnimT: number;
  biteDelay: number;
  biteAnchorX: number;
  biteAnchorY: number;
  alpha: number;
  spriteSize: number;
  entering: boolean;
};

export type ExplorationHook = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 糸の先端（水上）が引っ張る目標位置 */
  leadX: number;
  leadY: number;
  leadVx: number;
  leadVy: number;
  /** 糸の中腹。先端と針のあいだを遅れて追う */
  lineCurveX: number;
  /** 衝突揺れの残り秒 */
  shakeT: number;
  shakeDur: number;
  shakeAmp: number;
  shakeFreq: number;
  shakeSustain: boolean;
  shakeDirX: number;
  shakeDirY: number;
  /** 衝突で糸中腹へ足すキック（減衰） */
  lineShakeX: number;
  lineShakeY: number;
  twitchT: number;
  pullT: number;
  tautT: number;
  /** 出現アニメの経過秒。delay+duration 以上で完了 */
  introElapsed: number;
  restY: number;
};

export type ExplorationResult = {
  fish: FishConfig;
  size: number;
  hookDepth: number;
  hookDepthRatio: number;
};

export type ExplorationStartOptions = {
  rarityBonuses: RarityBonuses;
  junkWeightMultiplier: number;
  castDistanceRatio: number;
  baitId: string | null;
  lureId: string | null;
  onHookSuccess: (result: ExplorationResult) => void;
  onCancel: () => void;
};

export type HookInputResult = 'success' | 'fail' | 'noop';

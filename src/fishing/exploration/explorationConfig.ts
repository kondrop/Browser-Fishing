// 水中探索の調整値。仕様の確定値ではない。プレイテストで変える前提。

export const explorationConfig = {
  canvasW: 960,
  canvasH: 640,
  /** 横方向のワールド幅（画面何枚分か） */
  worldScreensX: 1.5,
  /** 深度方向のワールド高さ（画面何枚分か） */
  worldScreensY: 1.5,

  /** ウキ着水後、探索モーダルを出すまでの待ち秒 */
  modalDelayAfterSplashSec: 0.3,
  /** 探索モーダルのフェードイン秒 */
  modalFadeInSec: 0.35,
  /** 針出現アニメ開始までの待ち秒（フェードと少し重ねる） */
  hookIntroDelaySec: 0.12,
  /** 針が上部から着位置へ降りる秒 */
  hookIntroDurationSec: 0.72,
  /** 出現開始時のワールド Y（画面上端のすぐ外） */
  hookIntroStartY: -12,
  /** 降下中に針から出す泡の秒あたり個数 */
  hookIntroBubblePerSec: 18,
  /** 降下開始時にまとめて出す泡 */
  hookIntroBurstCount: 6,
  /** 入水後の初期深度（遊泳上端からのオフセット） */
  hookStartOffsetY: 140,

  /** 淡水レイヤー。parallaxX: 0=画面固定 1=ワールド固定。riseY: 水面まで上がったときの上方向ずれ（px）。底では0 */
  freshLayerDir: '/images/ui/fresh',
  freshLayers: {
    bg: { file: '背景.png', parallaxX: 0.12, riseY: 340 },
    far: { file: '遠景.png', parallaxX: 0.32, riseY: 280 },
    mid: { file: '中景.png', parallaxX: 0.58, riseY: 140 },
    fg: { file: '前景.png', parallaxX: 1.18, riseY: 0 },
  },

  /** 遠景・背景の装飾魚影。ゲームプレイの魚とは独立 */
  decoFish: {
    bgCount: 7,
    farCount: 8,
    bgAlpha: 0.1,
    farAlpha: 0.2,
    /** 背景レイヤーの表示スケール（ネイティブ128pxに対して） */
    bgScale: [0.22, 0.32],
    /** 遠景レイヤー。背景より少し大きい */
    farScale: [0.3, 0.44],
    /** 水平速度 px/s */
    speed: [10, 20],
    yPadding: 36,
  },

  // 魚
  minFishCount: 3,
  initialFishCount: 8,
  /** 水中では種別を隠す魚影。キャンバスはどれも 128px、絵の大きさで差をつける */
  fishShadowNativeSize: 128,
  fishShadowPaths: {
    sm: '/images/ui/sm.png',
    md: '/images/ui/md.png',
    lg: '/images/ui/lg.png',
  },
  /** この cm 未満は sm */
  fishShadowSmMaxCm: 35,
  /** この cm 未満は md。以上は lg */
  fishShadowMdMaxCm: 90,
  /** 等倍表示時の魚本体のおおよその幅。バイト距離用 */
  fishShadowBodyW: {
    sm: 75,
    md: 105,
    lg: 128,
  },
  /** 同一帯内の表示スケール（実寸で補間）。素材の切り替えを活かしつつ差を出す */
  fishShadowScale: {
    sm: [0.7, 1.0],
    md: [0.82, 1.08],
    lg: [0.9, 1.22],
  },
  /** lg 帯で最大スケールに達する目安 cm */
  fishShadowLgRefCm: 220,

  // 調整用可視化
  debugShowSenseAndAppeal: true,

  // 針
  hookRadius: 10,
  appealMotionDuration: 0.15,
  appealMotionAmp: 10,
  /** 針の操作目標の最高速 */
  hookMaxSpeed: 250,
  /** 入力中の加速度（px/s^2） */
  hookAccel: 820,
  /** 入力なし時の減速度。大きいほど慣性が短い */
  hookCoastDecel: 340,
  /** 針が糸の目標へ追従するばね */
  hookFollowSpring: 18,
  /** 針追従の減衰。ばねに対してやや過減衰にして揺れを抑える */
  hookFollowDamp: 9.2,
  /** 糸の中腹カーブが目標へ寄る速さ */
  lineCurveFollow: 9,
  /** カメラが針へ寄る速さ。大きいほどキビキビ、小さいほど余韻 */
  cameraFollow: 5.5,

  // アピール
  baseAppealPerSecond: 10,
  spaceAppealBonus: 15,
  appealDecayPerSecond: 4,
  defaultAppealThreshold: 30,
  appealThresholdJitter: 0,

  // 感知（前方矩形）
  senseForward: 92,
  senseBackTolerance: 10,
  senseHalfHeight: 64,

  // バイト
  maxBiteAttempts: 5,
  /**
   * 本食い率。index 0 が1回目。
   * 1回目は低め、以降段階的に上げて、最後は必ず本食い。
   */
  biteRealRates: [0.15, 0.3, 0.5, 0.75, 1],
  minBiteInterval: 0.4,
  maxBiteInterval: 1.8,
  /** バイト開始から最初の食いつきまでの待ち秒 */
  biteFirstDelaySec: 1.0,
  biteStandbyExtra: 16,
  biteApproachSpeed: 160,
  biteFollowLerp: 6,
  biteWindupDuration: 0.28,
  biteLungeDuration: 0.16,
  biteFeintContactDuration: 0.12,
  biteRealContactDuration: 0.18,
  /** 魚中心から口元までの距離（スプライト比） */
  biteMouthOffsetMul: 0.4,
  /** フェイント時、口元から針までの余白 */
  biteFeintMouthGap: 12,
  /** 本食い時、口元から針までの余白 */
  biteRealMouthGap: 3,
  biteRecoverDuration: 0.34,
  hookWindowDuration: 0.6,
  hookPullAmp: 14,
  lineTautDuration: 0.35,

  // 衝突揺れ（フェイントは短く弱く、本食いは合わせ窓のあいだ持続）
  hookHitShakeDurFeint: 0.16,
  hookHitShakeFreqFeint: 44,
  hookHitShakeFreqBite: 72,
  hookHitShakeAmpFeint: 5.5,
  hookHitShakeAmpBite: 6.5,
  hookHitImpulseFeint: 38,
  hookHitImpulseBite: 88,
  hookHitNudgeFeint: 2,
  hookHitNudgeBite: 5,
  lineHitKickFeint: 9,
  lineHitKickBite: 20,
  hookHitSustainFadeSec: 0.14,

  // 逃走
  escapeSpeed: 240,
  escapeFadeDuration: 0.85,

  // リポップ
  respawnMargin: 48,
  respawnSwimInSpeed: 90,

  // 深度→ファイト補正（仮）
  shallowCatchRateMul: 1.12,
  deepCatchRateMul: 0.82,
  shallowEscapeRateMul: 0.88,
  deepEscapeRateMul: 1.18,
  shallowFishSpeedMul: 0.94,
  deepFishSpeedMul: 1.12,
} as const;

export type ExplorationConfig = typeof explorationConfig;

export type ExplorationCamera = {
  x: number;
  y: number;
};

export function getExplorationWorldSize(): { worldW: number; worldH: number } {
  return {
    worldW: explorationConfig.canvasW * explorationConfig.worldScreensX,
    worldH: explorationConfig.canvasH * explorationConfig.worldScreensY,
  };
}

export function getExplorationCamera(focusX: number, focusY: number): ExplorationCamera {
  const { canvasW, canvasH } = explorationConfig;
  const { worldW, worldH } = getExplorationWorldSize();
  const maxX = Math.max(0, worldW - canvasW);
  const maxY = Math.max(0, worldH - canvasH);
  return {
    x: Math.max(0, Math.min(maxX, focusX - canvasW / 2)),
    y: Math.max(0, Math.min(maxY, focusY - canvasH / 2)),
  };
}

export function stepExplorationCamera(
  camera: ExplorationCamera,
  focusX: number,
  focusY: number,
  dt: number,
): void {
  const target = getExplorationCamera(focusX, focusY);
  const t = 1 - Math.exp(-explorationConfig.cameraFollow * dt);
  camera.x += (target.x - camera.x) * t;
  camera.y += (target.y - camera.y) * t;
}

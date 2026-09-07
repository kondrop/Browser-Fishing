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
  hookIntroDurationSec: 1.65,
  /** 出現開始時のワールド Y（画面上端のすぐ外） */
  hookIntroStartY: -12,
  /** 降下中に針から出す泡の秒あたり個数 */
  hookIntroBubblePerSec: 14,
  /** 降下開始時にまとめて出す泡 */
  hookIntroBurstCount: 6,
  /** 入水後の初期深度（遊泳上端からのオフセット） */
  hookStartOffsetY: 250,

  /** 合わせ成功 → ファイト開始までの導入演出（秒）。ここを一括で調整する */
  hookToFightIntro: {
    /** スタンプ表示（震え込み含む） */
    stampHoldSec: 0.65,
    /** スタンプの震えアニメ */
    stampShakeSec: 0.5,
    /** 水中画面を閉じるフェード */
    overlayFadeSec: 0.3,
    /** ファイトバーの上昇フェードイン */
    barInSec: 0.3,
    /** 魚アイコンのジャンプフェードイン */
    fishInSec: 0.4,
  },

  /** 淡水レイヤー。parallaxX: 0=画面固定 1=ワールド固定。riseY: 水面まで上がったときの上方向ずれ（px）。底では0 */
  freshLayerDir: '/images/ui/fresh',
  freshLayers: {
    bg: { file: '背景.png', parallaxX: 0.12, riseY: 380 },
    far: { file: '遠景.png', parallaxX: 0.32, riseY: 330 },
    mid: { file: '中景.png', parallaxX: 0.58, riseY: 250 },
    fg: { file: '前景.png', parallaxX: 1.18, riseY: 0 },
  },

  /**
   * 水中の塵パーティクル。ワールド（レイヤー）座標に固定し、カメラには追従しない。
   * 視差は freshLayers の far / mid / fg と同じ。漂いはその場の超低速ゆらぎのみ。
   */
  dust: {
    far: {
      count: 210,
      radius: [0.5, 1.15],
      alpha: [0.3, 0.5],
      driftAmp: [1.5, 5],
      driftFreq: [0.06, 0.18],
    },
    mid: {
      count: 170,
      radius: [1.0, 2.0],
      alpha: [0.35, 0.8],
      driftAmp: [2, 7],
      driftFreq: [0.08, 0.22],
    },
    fg: {
      count: 236,
      radius: [1.6, 2.8],
      alpha: [0.2, 0.5],
      driftAmp: [3, 9],
      driftFreq: [0.1, 0.28],
    },
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
  /**
   * 出現・遊泳目標のばらけ方。
   * 初期の針は中央・浅めなので、魚は左右と深部へ寄せる。
   */
  fishSpread: {
    /** 横。0=均一、1=左右端へ強く寄せる */
    edgeBias: 0.78,
    /** 中央を空ける幅（ワールド横幅に対する割合） */
    centerGap: 0.24,
    /** 縦。0=均一、1=深部へ寄せる */
    deepBias: 0.9,
    /** 初期配置で他の魚と離す目安（px） */
    minSeparation: 170,
  },
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

  // 調整用可視化（感知範囲の枠とアピール数値）
  debugShowSenseAndAppeal: false,

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
  /** この速さ以上の横移動で向きを変える */
  hookFaceVxThreshold: 22,
  /** 横移動による最大の傾き（ラジアン） */
  hookPitchFromX: 0.52,
  /** 縦移動による傾き */
  hookPitchFromY: 0.32,
  hookPitchMax: 0.62,
  /** 傾きの追従。大きいほどキビキビ */
  hookPitchFollow: 10,

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

  /**
   * 水中の回収シンボル。ワールドにばら撒き、針を近づけて SPACE で取る。
   * kind ごとに増やす前提。
   */
  pickups: {
    /** 針中心からの回収距離 */
    collectRange: 76,
    /** 回収後の消滅演出秒 */
    collectAnimSec: 0.9,
    exp: {
      count: 5,
      /** 1個あたりの経験値候補 */
      amounts: [5, 8, 10, 12],
      radius: 16,
      drawSize: 30,
      imagePath: '/images/Fishing Result UI/orb.svg',
      minSeparation: 140,
      /** 針の初期着水付近は空ける */
      avoidHookStartDist: 200,
      bobAmp: 3.5,
      bobFreq: 0.58,
      glowAlpha: 0.35,
      glowRgb: '118, 248, 97',
      nearRingRgba: '238, 251, 236, 0.85',
      fallbackFill: '#76F861',
      labelFill: '#EEFBEC',
    },
    gold: {
      count: 5,
      /** 1個あたりの所持金候補 */
      amounts: [10, 15, 20, 30],
      radius: 16,
      drawSize: 28,
      imagePath: '/images/ui/ゴールド.png',
      minSeparation: 140,
      avoidHookStartDist: 200,
      bobAmp: 3.5,
      bobFreq: 0.58,
      glowAlpha: 0.4,
      glowRgb: '255, 200, 64',
      nearRingRgba: '255, 236, 170, 0.9',
      fallbackFill: '#F0C040',
      labelFill: '#FFE9A8',
    },
  },
} as const;

export type ExplorationConfig = typeof explorationConfig;

export type ExplorationCamera = {
  x: number;
  y: number;
};

/** 表示バッファ（＝カメラ視野）。CSS 枠の縦横比に合わせて更新し、非等方ストレッチを避ける */
let liveViewW: number = explorationConfig.canvasW;
let liveViewH: number = explorationConfig.canvasH;

export function getExplorationViewSize(): { canvasW: number; canvasH: number } {
  return { canvasW: liveViewW, canvasH: liveViewH };
}

/**
 * CSS 表示枠のサイズから視野を決める。
 * 設計高さ 640 を基準に横幅を合わせ、ワールド内に収まるようクランプ。
 * バッファ縦横比＝表示枠縦横比になるので、CSS で引き伸ばしても円が潰れない。
 */
export function setExplorationViewSizeFromCss(cssW: number, cssH: number): { canvasW: number; canvasH: number } {
  const { worldW, worldH } = getExplorationWorldSize();
  const aspect = cssW / Math.max(1, cssH);
  let canvasH: number = explorationConfig.canvasH;
  let canvasW: number = Math.round(canvasH * aspect);
  if (canvasW > worldW) {
    canvasW = Math.floor(worldW);
    canvasH = Math.max(2, Math.round(canvasW / aspect));
  }
  if (canvasH > worldH) {
    canvasH = Math.floor(worldH);
    canvasW = Math.max(2, Math.round(canvasH * aspect));
  }
  liveViewW = Math.max(2, canvasW);
  liveViewH = Math.max(2, canvasH);
  return { canvasW: liveViewW, canvasH: liveViewH };
}

export function getExplorationWorldSize(): { worldW: number; worldH: number } {
  return {
    worldW: explorationConfig.canvasW * explorationConfig.worldScreensX,
    worldH: explorationConfig.canvasH * explorationConfig.worldScreensY,
  };
}

export function getExplorationCamera(focusX: number, focusY: number): ExplorationCamera {
  const { canvasW, canvasH } = getExplorationViewSize();
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

const KIRA_SRCS = [
  '/images/Fishing Result UI/kira01.svg',
  '/images/Fishing Result UI/kira02.svg',
] as const;

export type KiraFieldHandle = {
  stop: () => void;
  destroy: () => void;
};

export type KiraFieldOptions = {
  count: number;
  sizes: readonly number[];
  durationMs: readonly [number, number];
  startDelayMs: readonly [number, number];
  loopDelayMs: readonly [number, number];
  sparkClassName?: string;
  loop: boolean;
  place: (spark: HTMLImageElement) => void;
};

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickSrc(): string {
  return KIRA_SRCS[Math.random() < 0.55 ? 0 : 1];
}

export function placeKiraOnEllipse(spark: HTMLImageElement, rx: number, ry: number): void {
  const angle = Math.random() * Math.PI * 2;
  const ring = 0.9 + Math.random() * 0.18;
  spark.style.setProperty('--kira-x', `${50 + Math.cos(angle) * rx * ring}%`);
  spark.style.setProperty('--kira-y', `${50 + Math.sin(angle) * ry * ring}%`);
}

/** ホスト矩形内のランダム位置（所持金UI用の広めの長方形） */
export function placeKiraInRect(spark: HTMLImageElement): void {
  spark.style.setProperty('--kira-x', `${4 + Math.random() * 92}%`);
  spark.style.setProperty('--kira-y', `${6 + Math.random() * 88}%`);
}

export function startKiraField(host: Element, options: KiraFieldOptions): KiraFieldHandle {
  host.replaceChildren();
  let stopped = false;
  const sparkClass = options.sparkClassName ?? 'kira-spark';

  const placeSpark = (spark: HTMLImageElement, index: number, first: boolean) => {
    spark.src = pickSrc();
    spark.style.setProperty(
      '--kira-size',
      `${options.sizes[Math.floor(Math.random() * options.sizes.length)]}px`,
    );
    spark.style.setProperty(
      '--kira-dur',
      `${randRange(options.durationMs[0], options.durationMs[1]) / 1000}s`,
    );
    let delay: number;
    if (first) {
      const span = Math.max(0, options.startDelayMs[1] - options.startDelayMs[0]);
      const slot = span / Math.max(options.count, 1);
      delay = options.startDelayMs[0] + index * slot + randRange(0, slot * 0.5);
    } else {
      delay = randRange(options.loopDelayMs[0], options.loopDelayMs[1]);
    }
    spark.style.setProperty('--kira-delay', `${delay / 1000}s`);
    options.place(spark);
  };

  for (let i = 0; i < options.count; i++) {
    const spark = document.createElement('img');
    spark.className = sparkClass;
    spark.alt = '';
    spark.draggable = false;
    placeSpark(spark, i, true);
    spark.addEventListener('animationend', () => {
      if (stopped || !options.loop) return;
      placeSpark(spark, i, false);
      spark.style.animation = 'none';
      void spark.offsetWidth;
      spark.style.animation = '';
    });
    host.appendChild(spark);
  }

  return {
    stop() {
      stopped = true;
    },
    destroy() {
      stopped = true;
      host.replaceChildren();
    },
  };
}

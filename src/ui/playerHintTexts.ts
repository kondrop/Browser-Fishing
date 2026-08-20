export type PlayerHintContent = {
  key?: string;
  label: string;
};

/** ワールド上のプレイヤーヒント文言 */
export const PLAYER_HINTS = {
  changeRod: { label: '竿を変更' },
  changeBaitOrLure: { label: 'エサ・ルアーを変更' },
  recast: { key: 'space', label: 'をもう一度押して投げる！' },
  bite: { key: 'space', label: 'を押せ！' },
  bulletinBoard: { key: 'F', label: '掲示板を見る' },
  cast: { key: 'space', label: 'でキャスト' },
} as const satisfies Record<string, PlayerHintContent>;

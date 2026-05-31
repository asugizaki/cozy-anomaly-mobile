export type Reward =
  | { type: 'coins'; amount: number }
  | { type: 'avatar'; avatarId: string }
  | { type: 'title'; titleId: string };

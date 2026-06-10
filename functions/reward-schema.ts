export interface RewardTransaction {
  id: string;
  userId: string;
  source:
    | 'puzzle_complete'
    | 'daily_mission'
    | 'event_reward'
    | 'crate_open'
    | 'energy_refill';

  xp: number;
  coins: number;
  crates: number;

  createdAt: number;
}

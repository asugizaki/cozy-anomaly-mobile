export type RemoteMission = {
  id: string;
  title: string;
  target: number;
  reward: {
    xp?: number;
    coins?: number;
    lootBoxes?: number;
  };
};

export async function loadRemoteMissions() {
  return [];
}

export type RestorationStage = {
  stage: 0 | 1 | 2 | 3 | 4;
  title: string;
  description: string;
};

export function restorationStage(completed: number) {
  if (completed >= 80) {
    return { stage: 4, title: "Fully Restored", description: "The chapter has been completely restored." };
  }
  if (completed >= 60) {
    return { stage: 3, title: "Nearly Restored", description: "Only a few repairs remain." };
  }
  if (completed >= 40) {
    return { stage: 2, title: "Half Restored", description: "The room is starting to feel alive again." };
  }
  if (completed >= 20) {
    return { stage: 1, title: "First Repairs", description: "Tanuki has started fixing the location." };
  }
  return { stage: 0, title: "Abandoned", description: "This location still needs lots of work." };
}

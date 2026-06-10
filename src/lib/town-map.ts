
export type TownChapter = {
  id: string;
  title: string;
  emoji: string;
  chapterOrder: number;
  unlocked: boolean;
  completed: boolean;
  stars: number;
};

export function buildTownMap(chapters: TownChapter[]) {
  return [...chapters].sort((a, b) => a.chapterOrder - b.chapterOrder);
}

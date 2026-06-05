
export const CHAPTER_COMPLETION_REWARDS = {
  coins: 1000,
  lootBoxes: 3,
  title: "Chapter Master",
};

export function chapterCompletionMessage(chapterName: string) {
  return `You restored ${chapterName}! Tanuki is thrilled and a new chapter is unlocked.`;
}


export type ChapterMapNode = {
  id: string;
  title: string;
  emoji: string;
  unlocked: boolean;
  completed: boolean;
};

export const SAMPLE_CHAPTERS: ChapterMapNode[] = [
  { id: "matcha_cafe", title: "Matcha Cafe", emoji: "🍵", unlocked: true, completed: false },
  { id: "retro_kissaten", title: "Retro Kissaten", emoji: "☕", unlocked: false, completed: false },
  { id: "festival_street", title: "Festival Street", emoji: "🏮", unlocked: false, completed: false },
];

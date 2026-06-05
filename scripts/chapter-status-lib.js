const fs = require("fs");
const path = require("path");

function extractJsonArray(source, constName) {
  const marker = `export const ${constName}`;
  const start = source.indexOf(marker);
  if (start < 0) return [];

  const equals = source.indexOf("=", start);
  const semi = source.indexOf(";", equals);
  if (equals < 0 || semi < 0) return [];

  const raw = source.slice(equals + 1, semi).trim();

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function loadChapterPackStatus(repoRoot) {
  const chaptersFile = path.join(repoRoot, "src", "data", "generatedChapters.ts");
  const puzzlesFile = path.join(repoRoot, "src", "data", "generatedPuzzles.ts");

  if (!fs.existsSync(chaptersFile) || !fs.existsSync(puzzlesFile)) {
    return [];
  }

  const chaptersSource = fs.readFileSync(chaptersFile, "utf8");
  const puzzlesSource = fs.readFileSync(puzzlesFile, "utf8");

  const chapters = extractJsonArray(chaptersSource, "GENERATED_CHAPTERS");
  const puzzleChapterMatches = [...puzzlesSource.matchAll(/chapter_id:\s*"([^"]+)"/g)];

  const counts = {};
  for (const match of puzzleChapterMatches) {
    counts[match[1]] = (counts[match[1]] || 0) + 1;
  }

  return chapters.map((chapter) => {
    const available = counts[chapter.id] || 0;
    const target = chapter.targetPuzzleCount || 80;
    const warn = chapter.warnRemaining ?? 20;
    const critical = chapter.criticalRemaining ?? 10;
    const buffer = available - target;

    let status = "OK";

    if (available <= 0) status = "EXHAUSTED";
    else if (buffer <= critical) status = "CRITICAL";
    else if (buffer <= warn) status = "WARNING";

    return {
      chapterId: chapter.id,
      title: chapter.title,
      available,
      target,
      buffer,
      warn,
      critical,
      status,
    };
  });
}

function formatChapterStatusLine(item) {
  return `${item.status.padEnd(9)} ${item.chapterId.padEnd(22)} available=${String(item.available).padStart(4)} target=${String(item.target).padStart(4)} buffer=${String(item.buffer).padStart(4)}`;
}

function alertableStatuses(items) {
  return items.filter((item) =>
    ["WARNING", "CRITICAL", "EXHAUSTED"].includes(item.status)
  );
}

module.exports = {
  loadChapterPackStatus,
  formatChapterStatusLine,
  alertableStatuses,
};

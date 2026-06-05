const fs = require("fs");
const path = require("path");

const repoRoot = process.cwd();
const inputArg = process.argv[2];

if (!inputArg) {
  console.error("Usage: npm run import:bonus-tanuki -- /path/to/bonus_scene_folder_or_zip_extracted_folder");
  process.exit(1);
}

const inputPath = path.resolve(repoRoot, inputArg);

if (!fs.existsSync(inputPath)) {
  console.error(`Bonus Tanuki bundle not found: ${inputPath}`);
  process.exit(1);
}

function findManifest(startPath) {
  const stat = fs.statSync(startPath);

  if (stat.isFile() && path.basename(startPath) === "manifest.json") {
    return startPath;
  }

  if (!stat.isDirectory()) {
    throw new Error("Input must be a bonus scene folder or manifest.json");
  }

  const direct = path.join(startPath, "manifest.json");
  if (fs.existsSync(direct)) return direct;

  const candidates = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const entryStat = fs.statSync(full);

      if (entryStat.isDirectory()) walk(full);
      else if (entry === "manifest.json") candidates.push(full);
    }
  }

  walk(startPath);

  if (!candidates.length) {
    throw new Error("No manifest.json found in bonus scene bundle.");
  }

  return candidates[0];
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

function relativeRequire(fromFile, assetPath) {
  const abs = path.join(repoRoot, assetPath);
  let rel = path.relative(path.dirname(fromFile), abs).replace(/\\/g, "/");

  if (!rel.startsWith(".")) rel = `./${rel}`;

  return rel;
}

const manifestPath = findManifest(inputPath);
const sourceDir = path.dirname(manifestPath);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

if (!manifest.id) {
  throw new Error("Bonus scene manifest missing id.");
}

const sceneId = manifest.id;
const destDir = path.join(repoRoot, "assets", "bonus-tanuki", sceneId);

if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}

copyDir(sourceDir, destDir);

const copiedManifestPath = path.join(destDir, "manifest.json");
const copiedManifest = JSON.parse(fs.readFileSync(copiedManifestPath, "utf8"));

function normalizePath(assetPath) {
  if (!assetPath) return null;
  return `assets/bonus-tanuki/${sceneId}/${path.basename(assetPath)}`;
}

copiedManifest.background = normalizePath(copiedManifest.background);
fs.writeFileSync(copiedManifestPath, JSON.stringify(copiedManifest, null, 2) + "\n");

const outputFile = path.join(repoRoot, "src", "data", "generatedBonusTanukiScenes.ts");
const bonusRoot = path.join(repoRoot, "assets", "bonus-tanuki");

const sceneDirs = fs.existsSync(bonusRoot)
  ? fs.readdirSync(bonusRoot).filter((entry) =>
      fs.existsSync(path.join(bonusRoot, entry, "manifest.json"))
    )
  : [];

const entries = sceneDirs.map((id) => {
  const data = JSON.parse(fs.readFileSync(path.join(bonusRoot, id, "manifest.json"), "utf8"));
  const backgroundRequire = data.background
    ? `require(${JSON.stringify(relativeRequire(outputFile, data.background))})`
    : "undefined";

  return `  {
    ...${JSON.stringify(data, null, 4).replace(/\n/g, "\n    ")},
    backgroundSource: ${backgroundRequire},
  }`;
});

const ts = `import { ImageSourcePropType } from "react-native";

export type BonusTanukiRewardConfig = {
  xp: number;
  coins: number;
  energy: number;
  lootBoxChance: number;
  rareAvatarChance: number;
};

export type BonusTanukiScene = {
  id: string;
  title: string;
  chapter_id?: string;
  background: string;
  backgroundSource: ImageSourcePropType;
  canvas?: {
    width: number;
    height: number;
  };
  target: {
    x: number;
    y: number;
    radius: number;
  };
  attempts: number;
  reward: BonusTanukiRewardConfig;
};

export const BONUS_TANUKI_SCENES: BonusTanukiScene[] = [
${entries.join(",\n")}
];

export function bonusTanukiScenesForChapter(chapterId?: string) {
  const matches = BONUS_TANUKI_SCENES.filter(
    (scene) => !chapterId || scene.chapter_id === chapterId
  );

  return matches.length ? matches : BONUS_TANUKI_SCENES;
}

export function randomBonusTanukiScene(chapterId?: string) {
  const scenes = bonusTanukiScenesForChapter(chapterId);

  if (!scenes.length) return undefined;

  return scenes[Math.floor(Math.random() * scenes.length)];
}
`;

fs.writeFileSync(outputFile, ts);

console.log(`Imported Bonus Tanuki scene: ${sceneId}`);
console.log(`Copied files to: ${path.relative(repoRoot, destDir)}`);
console.log(`Generated: ${path.relative(repoRoot, outputFile)}`);

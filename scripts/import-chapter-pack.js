const fs = require("fs");
const path = require("path");

const repoRoot = process.cwd();
const inputArg = process.argv[2];

if (!inputArg) {
  console.error("Usage: npm run import:chapter-pack -- /path/to/chapter-pack-folder");
  process.exit(1);
}

const inputPath = path.resolve(repoRoot, inputArg);

if (!fs.existsSync(inputPath)) {
  console.error(`Chapter pack not found: ${inputPath}`);
  process.exit(1);
}

function findChapterJson(startPath) {
  const stat = fs.statSync(startPath);

  if (stat.isFile() && path.basename(startPath) === "chapter.json") {
    return startPath;
  }

  if (!stat.isDirectory()) {
    throw new Error("Input must be a chapter pack folder or chapter.json");
  }

  const direct = path.join(startPath, "chapter.json");

  if (fs.existsSync(direct)) return direct;

  const candidates = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const entryStat = fs.statSync(full);

      if (entryStat.isDirectory()) walk(full);
      else if (entry === "chapter.json") candidates.push(full);
    }
  }

  walk(startPath);

  if (!candidates.length) {
    throw new Error("No chapter.json found.");
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

function removeDirIfExists(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function readPngSize(filePath) {
  const buffer = fs.readFileSync(filePath);

  if (buffer.length >= 24 && buffer.toString("ascii", 1, 4) === "PNG") {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  return null;
}

function relativeRequire(fromFile, assetPath) {
  const abs = path.join(repoRoot, assetPath);
  let rel = path.relative(path.dirname(fromFile), abs).replace(/\\/g, "/");
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel;
}

function tsString(value) {
  return JSON.stringify(value, null, 2);
}

function safePuzzleIdPart(value) {
  return String(value || "")
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .join("__")
    .replace(/[^a-zA-Z0-9_-]/g, "_");
}

function resolvePackAssetPath(packDir, manifest, assetRef, legacyPath) {
  const assetRoot = manifest.asset_root || "central_assets";

  if (assetRef) {
    const centralSource = path.join(packDir, assetRoot, assetRef);
    if (fs.existsSync(centralSource)) return centralSource;
  }

  if (legacyPath) {
    const legacySource = path.join(packDir, legacyPath);
    if (fs.existsSync(legacySource)) return legacySource;
  }

  throw new Error(`Cannot resolve asset '${assetRef || legacyPath}' in ${packDir}`);
}

function normalizeRendering(puzzle, normalAssetPath) {
  const size = readPngSize(normalAssetPath);
  if (!size) return puzzle;

  const objectSize = Number(puzzle.object_size || puzzle.item_size || size.width) || size.width;
  const itemWidth = objectSize;
  const itemHeight = Math.round(objectSize * (size.height / size.width));

  return {
    ...puzzle,
    item_size: objectSize,
    object_size: objectSize,
    rendering: {
      ...(puzzle.rendering || {}),
      anchor: puzzle.rendering?.anchor || "bottom_center",
      foot_overlap: puzzle.rendering?.foot_overlap ?? 10,
      source_width: size.width,
      source_height: size.height,
      item_width: itemWidth,
      item_height: itemHeight,
    },
  };
}

function normalizeRestorationManifest(chapterId, destDir) {
  const manifestPath = path.join(destDir, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  function normalizePath(assetPath) {
    if (!assetPath) return null;
    return `assets/restoration/${chapterId}/${path.basename(assetPath)}`;
  }

  manifest.chapter_id = chapterId;
  manifest.dirty_background = normalizePath(manifest.dirty_background);
  manifest.clean_background = normalizePath(manifest.clean_background);
  manifest.overlays = (manifest.overlays || []).map((overlay) => ({
    ...overlay,
    image: normalizePath(overlay.image),
  }));

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  return manifest;
}

function installedChapterDirs() {
  const root = path.join(repoRoot, "assets", "chapter-packs");
  if (!fs.existsSync(root)) return [];

  return fs.readdirSync(root)
    .filter((entry) => fs.existsSync(path.join(root, entry, "chapter.json")));
}

function collectInstalledPuzzles() {
  const chapterPackRoot = path.join(repoRoot, "assets", "chapter-packs");
  const targetAssetDir = path.join(repoRoot, "assets", "composable");
  const imported = [];

  for (const chapterId of installedChapterDirs()) {
    const installedRoot = path.join(chapterPackRoot, chapterId);
    const chapterJson = JSON.parse(fs.readFileSync(path.join(installedRoot, "chapter.json"), "utf8"));
    const puzzlePaths = chapterJson.puzzles?.paths || [];

    for (const relPackPath of puzzlePaths) {
      const packDir = path.join(installedRoot, relPackPath);
      const manifest = JSON.parse(fs.readFileSync(path.join(packDir, "manifest.json"), "utf8"));

      for (const puzzlePath of manifest.puzzles || []) {
        const rawPuzzle = JSON.parse(fs.readFileSync(path.join(packDir, puzzlePath), "utf8"));

        const backgroundRef = rawPuzzle.background_ref || rawPuzzle.background;
        const normalItemRef = rawPuzzle.normal_item_ref || rawPuzzle.normal_item;
        const anomalyItemRef = rawPuzzle.anomaly_item_ref || rawPuzzle.anomaly_item;
        const normalMetaRef = rawPuzzle.normal_item_meta_ref || rawPuzzle.normal_item_meta;
        const anomalyMetaRef = rawPuzzle.anomaly_item_meta_ref || rawPuzzle.anomaly_item_meta;

        const backgroundSource = resolvePackAssetPath(packDir, manifest, rawPuzzle.background_ref, rawPuzzle.background);
        const normalSource = resolvePackAssetPath(packDir, manifest, rawPuzzle.normal_item_ref, rawPuzzle.normal_item);
        const anomalySource = resolvePackAssetPath(packDir, manifest, rawPuzzle.anomaly_item_ref, rawPuzzle.anomaly_item);

        const assetsToCopy = [
          [backgroundSource, backgroundRef],
          [normalSource, normalItemRef],
          [anomalySource, anomalyItemRef],
        ];

        if (normalMetaRef) {
          assetsToCopy.push([
            resolvePackAssetPath(packDir, manifest, rawPuzzle.normal_item_meta_ref, rawPuzzle.normal_item_meta),
            normalMetaRef,
          ]);
        }

        if (anomalyMetaRef) {
          assetsToCopy.push([
            resolvePackAssetPath(packDir, manifest, rawPuzzle.anomaly_item_meta_ref, rawPuzzle.anomaly_item_meta),
            anomalyMetaRef,
          ]);
        }

        for (const [src, ref] of assetsToCopy) {
          const dest = path.join(targetAssetDir, ref);
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          if (!fs.existsSync(dest)) fs.copyFileSync(src, dest);
        }

        const normalizedPuzzle = normalizeRendering(
          {
            ...rawPuzzle,
            id: `${chapterId}/${safePuzzleIdPart(relPackPath)}/${rawPuzzle.id}`,
            source_puzzle_id: rawPuzzle.id,
            source_pack_path: relPackPath,
            chapter_id: chapterId,
            import_pack: chapterId,
            collection: chapterId,
            tags: Array.from(new Set([...(rawPuzzle.tags || []), chapterId])),
            background: backgroundRef,
            background_ref: backgroundRef,
            normal_item: normalItemRef,
            normal_item_ref: normalItemRef,
            anomaly_item: anomalyItemRef,
            anomaly_item_ref: anomalyItemRef,
            normal_item_meta: normalMetaRef,
            normal_item_meta_ref: normalMetaRef,
            anomaly_item_meta: anomalyMetaRef,
            anomaly_item_meta_ref: anomalyMetaRef,
          },
          normalSource
        );

        imported.push({
          puzzle: normalizedPuzzle,
          backgroundRequire: `../../assets/composable/${backgroundRef.replace(/\\/g, "/")}`,
          normalRequire: `../../assets/composable/${normalItemRef.replace(/\\/g, "/")}`,
          anomalyRequire: `../../assets/composable/${anomalyItemRef.replace(/\\/g, "/")}`,
        });
      }
    }
  }

  return imported;
}

function regenerateGeneratedPuzzles() {
  const generatedFile = path.join(repoRoot, "src", "data", "generatedPuzzles.ts");
  const imported = collectInstalledPuzzles();

  const contents = `import { ComposablePuzzle } from "@/types/puzzle";

export const PUZZLES: ComposablePuzzle[] = [
${imported.map(({ puzzle, backgroundRequire, normalRequire, anomalyRequire }) => `  {
    ...${JSON.stringify(puzzle, null, 4).replace(/\n/g, "\n    ")},
    backgroundSource: require("${backgroundRequire}"),
    normalItemSource: require("${normalRequire}"),
    anomalyItemSource: require("${anomalyRequire}"),
  }`).join(",\n")}
];
`;

  fs.writeFileSync(generatedFile, contents);
  return imported.length;
}

function regenerateGeneratedRestorations() {
  const outputFile = path.join(repoRoot, "src", "data", "generatedRestorations.ts");
  const restorationRoot = path.join(repoRoot, "assets", "restoration");

  const chapterDirs = fs.existsSync(restorationRoot)
    ? fs.readdirSync(restorationRoot).filter((id) =>
        fs.existsSync(path.join(restorationRoot, id, "manifest.json"))
      )
    : [];

  const entries = chapterDirs.map((id) => {
    const manifest = JSON.parse(fs.readFileSync(path.join(restorationRoot, id, "manifest.json"), "utf8"));
    const dirty = manifest.dirty_background;
    const clean = manifest.clean_background;

    const overlayLines = (manifest.overlays || [])
      .map((overlay) => {
        return `      ${JSON.stringify(overlay.id)}: require(${JSON.stringify(relativeRequire(outputFile, overlay.image))}),`;
      })
      .join("\n");

    return `  {
    manifest: ${tsString(manifest)},
    sources: {
      dirtyBackground: ${dirty ? `require(${JSON.stringify(relativeRequire(outputFile, dirty))})` : "undefined"},
      cleanBackground: ${clean ? `require(${JSON.stringify(relativeRequire(outputFile, clean))})` : "undefined"},
      overlays: {
${overlayLines}
      },
    },
  }`;
  });

  const ts = `import { RestorationBundle } from "@/lib/restoration-runtime";

export const RESTORATION_BUNDLES: RestorationBundle[] = [
${entries.join(",\n")}
];

export function restorationBundleByChapterId(chapterId: string) {
  return RESTORATION_BUNDLES.find(
    (bundle) => bundle.manifest.chapter_id === chapterId
  );
}
`;

  fs.writeFileSync(outputFile, ts);
}

function regenerateGeneratedChapters() {
  const outputFile = path.join(repoRoot, "src", "data", "generatedChapters.ts");

  const chapters = installedChapterDirs().map((id) => {
    const installedRoot = path.join(repoRoot, "assets", "chapter-packs", id);
    const chapterJson = JSON.parse(fs.readFileSync(path.join(installedRoot, "chapter.json"), "utf8"));
    const chapter = chapterJson.chapter;
    const restorationManifestPath = path.join(repoRoot, "assets", "restoration", id, "manifest.json");
    const restorationManifest = fs.existsSync(restorationManifestPath)
      ? JSON.parse(fs.readFileSync(restorationManifestPath, "utf8"))
      : { milestones: [] };

    const milestoneRepairs = (restorationManifest.milestones || []).map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      description: milestone.next_text || milestone.tanuki_text || milestone.title,
      completedAt: milestone.unlock_at,
      beforeEmoji: "⬜",
      afterEmoji: "✨",
    }));

    const repairs = (chapter.repairs && chapter.repairs.length)
      ? chapter.repairs
      : milestoneRepairs;

    return {
      id: chapter.id,
      title: chapter.title,
      subtitle: chapter.subtitle,
      theme: chapter.theme,
      emoji: chapter.emoji || "🦝",
      collectionIds: [chapter.id],
      targetPuzzleCount: chapter.targetPuzzleCount || chapterJson.puzzles?.count || 100,
      warnRemaining: chapterJson.exhaustion?.warnRemaining ?? 20,
      criticalRemaining: chapterJson.exhaustion?.criticalRemaining ?? 10,
      intro: chapter.intro || `${chapter.title} needs your sharp eyes.`,
      completionText: chapter.completionText || `${chapter.title} is complete!`,
      sortOrder: chapter.sortOrder || 1,
      unlockAfterChapterId: chapter.unlockAfterChapterId || "",
      repairs,
    };
  }).sort((a, b) => (a.sortOrder || 1) - (b.sortOrder || 1));

  const ts = `import { ChapterDefinition } from "@/lib/chapters";

export const GENERATED_CHAPTERS: ChapterDefinition[] = ${JSON.stringify(chapters, null, 2)};
`;

  fs.writeFileSync(outputFile, ts);
}


function normalizeBonusManifest(sceneId, destDir) {
  const manifestPath = path.join(destDir, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  if (manifest.background) {
    manifest.background = `assets/bonus-tanuki/${sceneId}/${path.basename(manifest.background)}`;
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  return manifest;
}

function regenerateGeneratedBonusTanukiScenes() {
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
}

const chapterJsonPath = findChapterJson(inputPath);
const packRoot = path.dirname(chapterJsonPath);
const chapterPack = JSON.parse(fs.readFileSync(chapterJsonPath, "utf8"));
const chapterId = chapterPack.chapter?.id;

if (!chapterId) {
  throw new Error("chapter.json missing chapter.id");
}

const installedRoot = path.join(repoRoot, "assets", "chapter-packs", chapterId);
removeDirIfExists(installedRoot);
copyDir(packRoot, installedRoot);

const restorationSource = path.join(installedRoot, chapterPack.restoration?.path || "restoration");
const restorationDest = path.join(repoRoot, "assets", "restoration", chapterId);
removeDirIfExists(restorationDest);
copyDir(restorationSource, restorationDest);
normalizeRestorationManifest(chapterId, restorationDest);

for (const bonusRelPath of chapterPack.bonus_tanuki?.paths || []) {
  const bonusSource = path.join(installedRoot, bonusRelPath);
  const bonusManifestPath = path.join(bonusSource, "manifest.json");

  if (!fs.existsSync(bonusManifestPath)) {
    throw new Error(`Bonus Tanuki scene missing manifest.json: ${bonusSource}`);
  }

  const bonusManifest = JSON.parse(fs.readFileSync(bonusManifestPath, "utf8"));
  const sceneId = bonusManifest.id;

  if (!sceneId) {
    throw new Error(`Bonus Tanuki scene missing id: ${bonusSource}`);
  }

  const bonusDest = path.join(repoRoot, "assets", "bonus-tanuki", sceneId);
  removeDirIfExists(bonusDest);
  copyDir(bonusSource, bonusDest);
  normalizeBonusManifest(sceneId, bonusDest);
}

regenerateGeneratedChapters();
regenerateGeneratedRestorations();
regenerateGeneratedBonusTanukiScenes();
const puzzleCount = regenerateGeneratedPuzzles();

console.log(`Imported chapter pack: ${chapterId}`);
console.log(`Installed to: ${path.relative(repoRoot, installedRoot)}`);
console.log(`Generated puzzles total: ${puzzleCount}`);
console.log("Generated src/data/generatedChapters.ts");
console.log("Generated src/data/generatedRestorations.ts");
console.log("Generated src/data/generatedBonusTanukiScenes.ts");
console.log("Generated src/data/generatedPuzzles.ts");

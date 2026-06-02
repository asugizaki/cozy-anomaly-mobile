const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const sourceRoot = process.argv[2];

if (!sourceRoot) {
  console.error("Usage:");
  console.error("  npm run import:puzzle-folder -- /path/to/export/YYYY-MM-DD");
  process.exit(1);
}

const absoluteSourceRoot = path.resolve(sourceRoot);
const targetAssetDir = path.join(repoRoot, "assets", "composable");
const generatedFile = path.join(repoRoot, "src", "data", "generatedPuzzles.ts");

function copyFileIfMissing(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`Missing asset source: ${src}`);
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });

  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
    return true;
  }

  return false;
}

function readPngSize(filePath) {
  const buffer = fs.readFileSync(filePath);

  if (
    buffer.length >= 24 &&
    buffer.toString("ascii", 1, 4) === "PNG"
  ) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  return null;
}

function findManifestPaths(dir) {
  const results = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...findManifestPaths(fullPath));
    } else if (entry.name === "manifest.json") {
      results.push(fullPath);
    }
  }

  return results;
}

function safePackKey(manifestPath) {
  const packDir = path.dirname(manifestPath);
  const relative = path.relative(absoluteSourceRoot, packDir);

  if (!relative || relative === ".") {
    return path.basename(packDir);
  }

  return relative.replace(/\\/g, "/");
}

function toRequirePath(relativePath) {
  return `../../assets/composable/${relativePath.replace(/\\/g, "/")}`;
}

function centralAssetRootForManifest(manifest) {
  return manifest.asset_root || "central_assets";
}

function resolveSourceAssetPath(packDir, manifest, assetRef, legacyPath) {
  const assetRoot = centralAssetRootForManifest(manifest);

  if (assetRef) {
    const centralSource = path.join(packDir, assetRoot, assetRef);

    if (fs.existsSync(centralSource)) {
      return centralSource;
    }
  }

  if (legacyPath) {
    const legacySource = path.join(packDir, legacyPath);

    if (fs.existsSync(legacySource)) {
      return legacySource;
    }
  }

  const requested = assetRef || legacyPath;
  throw new Error(`Cannot resolve asset '${requested}' in ${packDir}`);
}

function normalizeAssetRef(puzzle, key, legacyKey, packKey) {
  const direct = puzzle[key] || puzzle[legacyKey];

  if (puzzle[key]) {
    return direct;
  }

  // Legacy exports had asset paths relative to the pack folder. Keep them
  // namespaced so old imports remain safe and don't collide.
  return `${packKey}/${direct}`.replace(/\\/g, "/");
}

function normalizePuzzleRendering(puzzle, normalAssetPath) {
  const size = readPngSize(normalAssetPath);

  if (!size) {
    return puzzle;
  }

  const objectSize =
    Number(puzzle.object_size || puzzle.item_size || size.width) || size.width;

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

function importPuzzlePack(packDir, packKey) {
  const manifestPath = path.join(packDir, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  const imported = [];
  let copiedAssetCount = 0;
  let skippedAssetCount = 0;

  for (const puzzlePath of manifest.puzzles || []) {
    const fullPuzzlePath = path.join(packDir, puzzlePath);
    const rawPuzzle = JSON.parse(fs.readFileSync(fullPuzzlePath, "utf8"));

    const backgroundSource = resolveSourceAssetPath(
      packDir,
      manifest,
      rawPuzzle.background_ref,
      rawPuzzle.background
    );

    const normalSource = resolveSourceAssetPath(
      packDir,
      manifest,
      rawPuzzle.normal_item_ref,
      rawPuzzle.normal_item
    );

    const anomalySource = resolveSourceAssetPath(
      packDir,
      manifest,
      rawPuzzle.anomaly_item_ref,
      rawPuzzle.anomaly_item
    );

    const backgroundRef = normalizeAssetRef(
      rawPuzzle,
      "background_ref",
      "background",
      packKey
    );

    const normalItemRef = normalizeAssetRef(
      rawPuzzle,
      "normal_item_ref",
      "normal_item",
      packKey
    );

    const anomalyItemRef = normalizeAssetRef(
      rawPuzzle,
      "anomaly_item_ref",
      "anomaly_item",
      packKey
    );

    const normalMetaRef = rawPuzzle.normal_item_meta_ref
      ? rawPuzzle.normal_item_meta_ref
      : rawPuzzle.normal_item_meta
        ? `${packKey}/${rawPuzzle.normal_item_meta}`.replace(/\\/g, "/")
        : undefined;

    const anomalyMetaRef = rawPuzzle.anomaly_item_meta_ref
      ? rawPuzzle.anomaly_item_meta_ref
      : rawPuzzle.anomaly_item_meta
        ? `${packKey}/${rawPuzzle.anomaly_item_meta}`.replace(/\\/g, "/")
        : undefined;

    const assetsToCopy = [
      [backgroundSource, backgroundRef],
      [normalSource, normalItemRef],
      [anomalySource, anomalyItemRef],
    ];

    if (normalMetaRef) {
      const normalMetaSource = resolveSourceAssetPath(
        packDir,
        manifest,
        rawPuzzle.normal_item_meta_ref,
        rawPuzzle.normal_item_meta
      );
      assetsToCopy.push([normalMetaSource, normalMetaRef]);
    }

    if (anomalyMetaRef) {
      const anomalyMetaSource = resolveSourceAssetPath(
        packDir,
        manifest,
        rawPuzzle.anomaly_item_meta_ref,
        rawPuzzle.anomaly_item_meta
      );
      assetsToCopy.push([anomalyMetaSource, anomalyMetaRef]);
    }

    for (const [src, ref] of assetsToCopy) {
      const copied = copyFileIfMissing(
        src,
        path.join(targetAssetDir, ref)
      );

      if (copied) {
        copiedAssetCount += 1;
      } else {
        skippedAssetCount += 1;
      }
    }

    const normalizedPuzzle = normalizePuzzleRendering(
      {
        ...rawPuzzle,
        id: `${packKey}/${rawPuzzle.id}`,
        import_pack: packKey,
        background: backgroundRef,
        background_ref: backgroundRef,
        normal_item: normalItemRef,
        normal_item_ref: normalItemRef,
        normal_item_meta: normalMetaRef,
        normal_item_meta_ref: normalMetaRef,
        anomaly_item: anomalyItemRef,
        anomaly_item_ref: anomalyItemRef,
        anomaly_item_meta: anomalyMetaRef,
        anomaly_item_meta_ref: anomalyMetaRef,
      },
      normalSource
    );

    imported.push({
      puzzle: normalizedPuzzle,
      backgroundRequire: toRequirePath(backgroundRef),
      normalRequire: toRequirePath(normalItemRef),
      anomalyRequire: toRequirePath(anomalyItemRef),
    });
  }

  return {
    imported,
    copiedAssetCount,
    skippedAssetCount,
  };
}

const manifestPaths = findManifestPaths(absoluteSourceRoot);

if (!manifestPaths.length) {
  console.error(`No manifest.json files found under: ${absoluteSourceRoot}`);
  process.exit(1);
}

fs.mkdirSync(targetAssetDir, { recursive: true });

const imported = [];
let copiedAssetCount = 0;
let skippedAssetCount = 0;

for (const manifestPath of manifestPaths.sort()) {
  const packDir = path.dirname(manifestPath);
  const packKey = safePackKey(manifestPath);
  const result = importPuzzlePack(packDir, packKey);

  imported.push(...result.imported);
  copiedAssetCount += result.copiedAssetCount;
  skippedAssetCount += result.skippedAssetCount;
}

fs.mkdirSync(path.dirname(generatedFile), { recursive: true });

const fileContents = `import { ComposablePuzzle } from "@/types/puzzle";

export const PUZZLES: ComposablePuzzle[] = [
${imported
  .map(({ puzzle, backgroundRequire, normalRequire, anomalyRequire }) => {
    return `  {
    ...${JSON.stringify(puzzle, null, 4).replace(/\n/g, "\n    ")},
    backgroundSource: require("${backgroundRequire}"),
    normalItemSource: require("${normalRequire}"),
    anomalyItemSource: require("${anomalyRequire}"),
  }`;
  })
  .join(",\n")}
];
`;

fs.writeFileSync(generatedFile, fileContents);

console.log(`Imported ${imported.length} puzzle(s) from ${manifestPaths.length} pack(s).`);
console.log(`Central assets copied: ${copiedAssetCount}`);
console.log(`Central assets already present: ${skippedAssetCount}`);
console.log(`Assets root: ${targetAssetDir}`);
console.log(`Generated: ${generatedFile}`);

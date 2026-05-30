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

function rmrf(target) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
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

function toRequirePath(packKey, relativePath) {
  return `../../assets/composable/${packKey}/${relativePath.replace(/\\/g, "/")}`;
}

const manifestPaths = findManifestPaths(absoluteSourceRoot);

if (!manifestPaths.length) {
  console.error(`No manifest.json files found under: ${absoluteSourceRoot}`);
  process.exit(1);
}

rmrf(targetAssetDir);
fs.mkdirSync(targetAssetDir, { recursive: true });

const imported = [];

for (const manifestPath of manifestPaths.sort()) {
  const packDir = path.dirname(manifestPath);
  const packKey = safePackKey(manifestPath);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  const targetPackDir = path.join(targetAssetDir, packKey);
  copyDir(packDir, targetPackDir);

  for (const puzzlePath of manifest.puzzles || []) {
    const fullPuzzlePath = path.join(packDir, puzzlePath);
    const puzzle = JSON.parse(fs.readFileSync(fullPuzzlePath, "utf8"));

    imported.push({
      puzzle: {
        ...puzzle,
        id: `${packKey}/${puzzle.id}`,
        import_pack: packKey,
      },
      backgroundRequire: toRequirePath(packKey, puzzle.background),
      normalRequire: toRequirePath(packKey, puzzle.normal_item),
      anomalyRequire: toRequirePath(packKey, puzzle.anomaly_item),
    });
  }
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
console.log(`Copied assets to: ${targetAssetDir}`);
console.log(`Generated: ${generatedFile}`);
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const sourceExportDir = process.argv[2];

if (!sourceExportDir) {
  console.error("Usage:");
  console.error("  npm run import:puzzles -- /path/to/export/YYYY-MM-DD");
  process.exit(1);
}

const absoluteSource = path.resolve(sourceExportDir);
const manifestPath = path.join(absoluteSource, "manifest.json");

if (!fs.existsSync(manifestPath)) {
  console.error(`Missing manifest.json: ${manifestPath}`);
  process.exit(1);
}

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

function toRequirePath(relativePath) {
  return `../../assets/composable/${relativePath.replace(/\\/g, "/")}`;
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

function normalizePuzzleRendering(puzzle, exportRoot) {
  const normalPath = path.join(exportRoot, puzzle.normal_item || "");
  const size = fs.existsSync(normalPath) ? readPngSize(normalPath) : null;

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


rmrf(targetAssetDir);
copyDir(absoluteSource, targetAssetDir);

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const puzzles = manifest.puzzles.map((puzzlePath) => {
  const fullPath = path.join(absoluteSource, puzzlePath);
  const rawPuzzle = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  const puzzle = normalizePuzzleRendering(rawPuzzle, absoluteSource);

  for (const assetPath of [
    puzzle.background,
    puzzle.normal_item,
    puzzle.anomaly_item,
  ]) {
    const fullAssetPath = path.join(absoluteSource, assetPath);

    if (!fs.existsSync(fullAssetPath)) {
      throw new Error(`Missing puzzle asset: ${fullAssetPath}`);
    }
  }

  return {
    puzzle,
    backgroundRequire: toRequirePath(puzzle.background),
    normalRequire: toRequirePath(puzzle.normal_item),
    anomalyRequire: toRequirePath(puzzle.anomaly_item),
  };
});

fs.mkdirSync(path.dirname(generatedFile), { recursive: true });

const fileContents = `import { ComposablePuzzle } from "@/types/puzzle";

export const PUZZLES: ComposablePuzzle[] = [
${puzzles
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

console.log(`Imported ${puzzles.length} puzzle(s).`);
console.log(`Copied assets to: ${targetAssetDir}`);
console.log(`Generated: ${generatedFile}`);
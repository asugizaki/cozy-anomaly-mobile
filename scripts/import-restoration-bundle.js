const fs = require("fs");
const path = require("path");

const repoRoot = process.cwd();
const inputArg = process.argv[2];

if (!inputArg) {
  console.error("Usage: npm run import:restoration -- /path/to/chapter_restoration_bundle");
  process.exit(1);
}

const inputPath = path.resolve(repoRoot, inputArg);

if (!fs.existsSync(inputPath)) {
  console.error(`Restoration bundle not found: ${inputPath}`);
  process.exit(1);
}

function findManifest(startPath) {
  const stat = fs.statSync(startPath);

  if (stat.isFile() && path.basename(startPath) === "manifest.json") {
    return startPath;
  }

  if (!stat.isDirectory()) {
    throw new Error("Input must be a restoration bundle folder or manifest.json");
  }

  const direct = path.join(startPath, "manifest.json");

  if (fs.existsSync(direct)) return direct;

  const candidates = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const entryStat = fs.statSync(full);

      if (entryStat.isDirectory()) {
        walk(full);
      } else if (entry === "manifest.json") {
        candidates.push(full);
      }
    }
  }

  walk(startPath);

  if (!candidates.length) {
    throw new Error("No manifest.json found in restoration bundle.");
  }

  return candidates[0];
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function tsString(value) {
  return JSON.stringify(value, null, 2);
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

if (!manifest.chapter_id) {
  throw new Error("Restoration manifest is missing chapter_id.");
}

const chapterId = manifest.chapter_id;
const destDir = path.join(repoRoot, "assets", "restoration", chapterId);
copyDir(sourceDir, destDir);

const mobileManifestPath = path.join(destDir, "manifest.json");
const copiedManifest = JSON.parse(fs.readFileSync(mobileManifestPath, "utf8"));

function normalizePath(assetPath) {
  if (!assetPath) return null;

  const filename = path.basename(assetPath);
  return `assets/restoration/${chapterId}/${filename}`;
}

copiedManifest.dirty_background = normalizePath(copiedManifest.dirty_background);
copiedManifest.clean_background = normalizePath(copiedManifest.clean_background);

copiedManifest.overlays = (copiedManifest.overlays || []).map((overlay) => ({
  ...overlay,
  image: normalizePath(overlay.image),
}));

fs.writeFileSync(
  mobileManifestPath,
  JSON.stringify(copiedManifest, null, 2) + "\n",
  "utf8"
);

const dataDir = path.join(repoRoot, "src", "data");
fs.mkdirSync(dataDir, { recursive: true });

const outputFile = path.join(dataDir, "generatedRestorations.ts");
const existing = fs.existsSync(outputFile)
  ? fs.readFileSync(outputFile, "utf8")
  : "";

const importedChapters = new Set(
  [...existing.matchAll(/chapter_id:\s*"([^"]+)"/g)].map((match) => match[1])
);

const allChapterDirs = fs.existsSync(path.join(repoRoot, "assets", "restoration"))
  ? fs.readdirSync(path.join(repoRoot, "assets", "restoration"))
      .filter((entry) => fs.existsSync(path.join(repoRoot, "assets", "restoration", entry, "manifest.json")))
  : [];

const entries = allChapterDirs.map((id) => {
  const chapterManifestPath = path.join(repoRoot, "assets", "restoration", id, "manifest.json");
  const chapterManifest = JSON.parse(fs.readFileSync(chapterManifestPath, "utf8"));
  const outputRel = path.relative(repoRoot, outputFile);

  const dirty = chapterManifest.dirty_background;
  const clean = chapterManifest.clean_background;

  const overlayLines = (chapterManifest.overlays || [])
    .map((overlay) => {
      const imageRequire = relativeRequire(outputFile, overlay.image);
      return `      ${JSON.stringify(overlay.id)}: require(${JSON.stringify(imageRequire)}),`;
    })
    .join("\n");

  const dirtyRequire = dirty
    ? `require(${JSON.stringify(relativeRequire(outputFile, dirty))})`
    : "undefined";
  const cleanRequire = clean
    ? `require(${JSON.stringify(relativeRequire(outputFile, clean))})`
    : "undefined";

  return `  {
    manifest: ${tsString(chapterManifest)},
    sources: {
      dirtyBackground: ${dirtyRequire},
      cleanBackground: ${cleanRequire},
      overlays: {
${overlayLines}
      },
    },
  }`;
});

const ts = `import { ImageSourcePropType } from "react-native";
import { RestorationBundle } from "@/lib/restoration-runtime";

export const RESTORATION_BUNDLES: RestorationBundle[] = [
${entries.join(",\n")}
];

export function restorationBundleByChapterId(chapterId: string) {
  return RESTORATION_BUNDLES.find((bundle) => bundle.manifest.chapter_id === chapterId);
}
`;

fs.writeFileSync(outputFile, ts, "utf8");

console.log(`Imported restoration chapter: ${chapterId}`);
console.log(`Copied files to: ${path.relative(repoRoot, destDir)}`);
console.log(`Generated: ${path.relative(repoRoot, outputFile)}`);

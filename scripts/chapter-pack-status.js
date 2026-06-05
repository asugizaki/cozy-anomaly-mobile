const path = require("path");
const {
  loadChapterPackStatus,
  formatChapterStatusLine,
  alertableStatuses,
} = require("./chapter-status-lib");

const repoRoot = process.cwd();
const statuses = loadChapterPackStatus(repoRoot);

console.log("Hidden Tanuki Chapter Pack Status");
console.log("---------------------------------");

if (!statuses.length) {
  console.log("No generated chapter packs found.");
  process.exit(0);
}

for (const item of statuses) {
  console.log(formatChapterStatusLine(item));
}

const alertable = alertableStatuses(statuses);

if (alertable.length) {
  console.log("");
  console.log("Needs attention:");
  for (const item of alertable) {
    console.log(`- ${item.title} (${item.chapterId}) is ${item.status}: buffer ${item.buffer}`);
  }
}

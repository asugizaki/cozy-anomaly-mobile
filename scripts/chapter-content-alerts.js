const fs = require("fs");
const path = require("path");
const {
  loadChapterPackStatus,
  formatChapterStatusLine,
  alertableStatuses,
} = require("./chapter-status-lib");

const repoRoot = process.cwd();
const statuses = loadChapterPackStatus(repoRoot);
const alertable = alertableStatuses(statuses);

const stateFile = path.join(repoRoot, ".chapter-alert-state.json");

function readState() {
  if (!fs.existsSync(stateFile)) return {};

  try {
    return JSON.parse(fs.readFileSync(stateFile, "utf8"));
  } catch {
    return {};
  }
}

function writeState(state) {
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2) + "\n");
}

async function sendTelegram(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId =
    process.env.TELEGRAM_ADMIN_CHAT_ID ||
    process.env.TELEGRAM_CHAT_ID ||
    process.env.TELEGRAM_GENERAL;

  if (!token || !chatId) return false;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    throw new Error(`Telegram alert failed: ${res.status} ${await res.text()}`);
  }

  return true;
}

async function sendResendEmail(message) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CHAPTER_ALERT_EMAIL_TO;
  const from = process.env.CHAPTER_ALERT_EMAIL_FROM || "Hidden Tanuki <onboarding@resend.dev>";

  if (!apiKey || !to) return false;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Hidden Tanuki chapter content warning",
      text: message,
    }),
  });

  if (!res.ok) {
    throw new Error(`Email alert failed: ${res.status} ${await res.text()}`);
  }

  return true;
}

function buildMessage(items) {
  const lines = [
    "Hidden Tanuki chapter content warning",
    "",
    ...items.map(formatChapterStatusLine),
    "",
    "Import/generate more chapter puzzles before players exhaust the chapter.",
  ];

  return lines.join("\n");
}

async function main() {
  if (!statuses.length) {
    console.log("No generated chapter packs found.");
    return;
  }

  if (!alertable.length) {
    console.log("All chapter packs have enough puzzle buffer.");
    return;
  }

  const state = readState();
  const toNotify = [];

  for (const item of alertable) {
    const key = `${item.chapterId}:${item.status}:${item.available}:${item.target}`;

    if (state[item.chapterId] !== key || process.argv.includes("--force")) {
      toNotify.push(item);
      state[item.chapterId] = key;
    }
  }

  if (!toNotify.length) {
    console.log("No new alert state. Use --force to resend.");
    return;
  }

  const message = buildMessage(toNotify);

  console.log(message);

  const sentTelegram = await sendTelegram(message);
  const sentEmail = await sendResendEmail(message);

  if (!sentTelegram && !sentEmail) {
    console.log("");
    console.log("No alert destination configured.");
    console.log("For Telegram, set TELEGRAM_BOT_TOKEN and TELEGRAM_ADMIN_CHAT_ID.");
    console.log("For email via Resend, set RESEND_API_KEY and CHAPTER_ALERT_EMAIL_TO.");
  }

  writeState(state);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

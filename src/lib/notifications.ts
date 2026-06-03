import { activeEventTasks } from "./events";
import { dailyMissions } from "./missions";
import { PlayerProgress } from "./player-progress";
import { chapterSummaries } from "./chapters";
import { readyRepairRewards } from "./restoration";
import { canUnlockSkill, SKILL_NODES } from "./skill-tree";

export type ClaimNotification = {
  id: string;
  title: string;
  message: string;
  href: string;
  emoji: string;
};

export function claimNotifications(progress?: PlayerProgress | null) {
  if (!progress) return [];

  const notifications: ClaimNotification[] = [];

  const completedDailyMissions = dailyMissions(progress).filter(
    (mission) => mission.completed && !mission.claimed
  );

  if (completedDailyMissions.length) {
    notifications.push({
      id: "daily-missions",
      title: `${completedDailyMissions.length} daily reward${
        completedDailyMissions.length === 1 ? "" : "s"
      } ready`,
      message: "Claim your completed daily mission rewards.",
      href: "/missions",
      emoji: "✅",
    });
  }

  const completedEventTasks = activeEventTasks(progress).filter(
    (task) => task.completed && !task.claimed
  );

  if (completedEventTasks.length) {
    notifications.push({
      id: "event-tasks",
      title: `${completedEventTasks.length} event reward${
        completedEventTasks.length === 1 ? "" : "s"
      } ready`,
      message: "Claim your completed event task rewards.",
      href: "/event",
      emoji: "🎉",
    });
  }

  const repairRewards = chapterSummaries(progress).flatMap((chapter) =>
    readyRepairRewards(chapter, progress).map((repair) => ({
      chapter,
      repair,
    }))
  );

  if (repairRewards.length) {
    notifications.push({
      id: "chapter-repairs",
      title: `${repairRewards.length} repair reward${
        repairRewards.length === 1 ? "" : "s"
      } ready`,
      message: "Tanuki can restore part of a chapter now.",
      href: `/chapter-detail?id=${repairRewards[0].chapter.id}`,
      emoji: "🛠",
    });
  }

  if ((progress.lootBoxes || 0) > 0) {
    notifications.push({
      id: "lootboxes",
      title: `${progress.lootBoxes} crate${
        progress.lootBoxes === 1 ? "" : "s"
      } ready`,
      message: "Open your Cozy Crate rewards.",
      href: "/lootboxes",
      emoji: "🎁",
    });
  }

  const unlockableSkills = SKILL_NODES.filter((node) =>
    canUnlockSkill(progress, node)
  );

  if (unlockableSkills.length) {
    notifications.push({
      id: "skill-tree",
      title: `${unlockableSkills.length} skill upgrade${
        unlockableSkills.length === 1 ? "" : "s"
      } available`,
      message: "Spend skill points on permanent boosts.",
      href: "/skill-tree",
      emoji: "🌳",
    });
  }

  return notifications;
}

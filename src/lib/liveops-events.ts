export const LIVEOPS_EVENTS = [
  "chapter_started",
  "chapter_completed",
  "restoration_started",
  "restoration_completed",
  "bonus_tanuki_started",
  "bonus_tanuki_completed",
  "energy_depleted",
  "energy_purchased",
  "rewarded_ad_shown",
  "rewarded_ad_completed",
];

export function trackLiveOpsEvent(name: string, payload: Record<string, any> = {}) {
  console.log("[liveops]", name, payload);
}

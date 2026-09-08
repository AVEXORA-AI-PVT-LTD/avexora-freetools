import type { ComputeFn } from "@/types/tools";
import { formatNumber, toNonNegative, toPositive } from "../format";

export const computeEngagementRate: ComputeFn = (values) => {
  const engagements = toNonNegative(values.engagements);
  const followers = toPositive(values.followers);
  const posts = toPositive(values.posts);

  if (engagements === null) return { error: "Enter total engagements (likes + comments + shares + saves)." };
  if (followers === null) return { error: "Enter your follower count (greater than zero)." };
  if (posts === null) return { error: "Enter the number of posts (at least 1)." };

  const perPost = engagements / posts;
  const rate = (perPost / followers) * 100;

  let verdict: string;
  if (rate < 1) verdict = "Low — under 1%; most accounts should aim higher with stronger hooks and CTAs.";
  else if (rate < 3) verdict = "Average — 1–3% is typical for established accounts.";
  else if (rate < 6) verdict = "Good — 3–6% beats most accounts of comparable size.";
  else verdict = "Excellent — above 6% is top-tier engagement.";

  return {
    results: [
      { label: "Engagement rate per post", value: `${rate.toFixed(2)}%`, emphasis: true },
      { label: "Engagements per post", value: formatNumber(perPost) },
      { label: "Benchmark verdict", value: verdict },
    ],
  };
};

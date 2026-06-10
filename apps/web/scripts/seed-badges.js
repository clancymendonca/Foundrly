#!/usr/bin/env node

/**
 * Wipe legacy badge data and seed leveled badge tracks from BADGE_CATALOG.
 * Run: node scripts/seed-badges.js
 */

const { createClient } = require("@sanity/client");
require("dotenv").config({ path: ".env.local" });

const BADGE_CATALOG = [
  {
    name: "Startup Forge",
    description: "Build and publish startups on Foundrly",
    category: "creator",
    icon: "🚀",
    color: "#7C3AED",
    metric: "startups_created",
    levels: [
      { tier: "bronze", target: 1, rarity: "common" },
      { tier: "silver", target: 2, rarity: "uncommon" },
      { tier: "gold", target: 5, rarity: "rare" },
      { tier: "platinum", target: 10, rarity: "epic" },
      { tier: "diamond", target: 20, rarity: "legendary" },
    ],
  },
  {
    name: "Community Voice",
    description: "Share thoughtful comments with the community",
    category: "community",
    icon: "💬",
    color: "#2563EB",
    metric: "comments_posted",
    levels: [
      { tier: "bronze", target: 10, rarity: "common" },
      { tier: "silver", target: 50, rarity: "uncommon" },
      { tier: "gold", target: 200, rarity: "rare" },
      { tier: "platinum", target: 750, rarity: "epic" },
      { tier: "diamond", target: 2500, rarity: "mythical" },
    ],
  },
  {
    name: "Thread Weaver",
    description: "Keep conversations going with replies",
    category: "community",
    icon: "🧵",
    color: "#0891B2",
    metric: "replies_posted",
    levels: [
      { tier: "bronze", target: 5, rarity: "common" },
      { tier: "silver", target: 25, rarity: "uncommon" },
      { tier: "gold", target: 100, rarity: "rare" },
      { tier: "platinum", target: 400, rarity: "epic" },
      { tier: "diamond", target: 1500, rarity: "mythical" },
    ],
  },
  {
    name: "Community Guardian",
    description: "Help keep Foundrly safe with valid reports",
    category: "community",
    icon: "🛡️",
    color: "#059669",
    metric: "reports_submitted",
    levels: [
      { tier: "bronze", target: 1, rarity: "common" },
      { tier: "silver", target: 3, rarity: "uncommon" },
      { tier: "gold", target: 8, rarity: "rare" },
      { tier: "platinum", target: 20, rarity: "epic" },
      { tier: "diamond", target: 50, rarity: "legendary" },
    ],
  },
  {
    name: "Network Builder",
    description: "Follow founders and builders across the platform",
    category: "social",
    icon: "🤝",
    color: "#7C3AED",
    metric: "users_followed",
    levels: [
      { tier: "bronze", target: 5, rarity: "common" },
      { tier: "silver", target: 25, rarity: "uncommon" },
      { tier: "gold", target: 100, rarity: "rare" },
      { tier: "platinum", target: 300, rarity: "epic" },
      { tier: "diamond", target: 750, rarity: "legendary" },
    ],
  },
  {
    name: "Rising Star",
    description: "Grow your audience and earn followers",
    category: "social",
    icon: "⭐",
    color: "#F59E0B",
    metric: "followers_gained",
    levels: [
      { tier: "bronze", target: 3, rarity: "common" },
      { tier: "silver", target: 15, rarity: "uncommon" },
      { tier: "gold", target: 50, rarity: "rare" },
      { tier: "platinum", target: 200, rarity: "epic" },
      { tier: "diamond", target: 1000, rarity: "mythical" },
    ],
  },
  {
    name: "Crowd Favorite",
    description: "Receive likes on your startups",
    category: "social",
    icon: "❤️",
    color: "#DC2626",
    metric: "likes_received",
    levels: [
      { tier: "bronze", target: 10, rarity: "common" },
      { tier: "silver", target: 50, rarity: "uncommon" },
      { tier: "gold", target: 250, rarity: "rare" },
      { tier: "platinum", target: 1000, rarity: "epic" },
      { tier: "diamond", target: 5000, rarity: "mythical" },
    ],
  },
  {
    name: "Spotlight",
    description: "Get your startups seen with views",
    category: "achievement",
    icon: "👀",
    color: "#6366F1",
    metric: "views_received",
    levels: [
      { tier: "bronze", target: 100, rarity: "common" },
      { tier: "silver", target: 500, rarity: "uncommon" },
      { tier: "gold", target: 2500, rarity: "rare" },
      { tier: "platinum", target: 10000, rarity: "epic" },
      { tier: "diamond", target: 50000, rarity: "mythical" },
    ],
  },
  {
    name: "Steadfast",
    description: "Show up consistently across active days",
    category: "achievement",
    icon: "📅",
    color: "#475569",
    metric: "days_active",
    levels: [
      { tier: "bronze", target: 7, rarity: "common" },
      { tier: "silver", target: 30, rarity: "uncommon" },
      { tier: "gold", target: 90, rarity: "rare" },
      { tier: "platinum", target: 180, rarity: "epic" },
      { tier: "diamond", target: 365, rarity: "legendary" },
    ],
  },
];

async function main() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const token = process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN;

  if (!projectId || !dataset || !token) {
    console.error(
      "Missing NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, or SANITY_API_TOKEN",
    );
    process.exit(1);
  }

  const client = createClient({
    projectId,
    dataset,
    useCdn: false,
    token,
    apiVersion: "2024-01-01",
  });

  console.log("Fetching existing badge documents…");
  const existingBadges = await client.fetch(`*[_type == "badge"]{ _id }`);
  const existingUserBadges = await client.fetch(`*[_type == "userBadge"]{ _id }`);

  console.log(
    `Deleting ${existingBadges.length} badge(s) and ${existingUserBadges.length} userBadge(s)…`,
  );

  const tx = client.transaction();
  for (const doc of [...existingBadges, ...existingUserBadges]) {
    tx.delete(doc._id);
  }
  if (existingBadges.length + existingUserBadges.length > 0) {
    await tx.commit();
  }

  console.log("Seeding badge tracks…");
  for (const track of BADGE_CATALOG) {
    await client.create({
      _type: "badge",
      name: track.name,
      description: track.description,
      category: track.category,
      icon: track.icon,
      color: track.color,
      metric: track.metric,
      criteria: { type: "count", timeframe: "all_time" },
      levels: track.levels,
      isActive: true,
    });
    console.log(`  ✓ ${track.name}`);
  }

  console.log(`\nDone. Seeded ${BADGE_CATALOG.length} badge tracks.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

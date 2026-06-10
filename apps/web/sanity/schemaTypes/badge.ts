import { defineArrayMember, defineField, defineType } from "sanity";

const tierOptions = [
  { title: "Bronze", value: "bronze" },
  { title: "Silver", value: "silver" },
  { title: "Gold", value: "gold" },
  { title: "Platinum", value: "platinum" },
  { title: "Diamond", value: "diamond" },
];

const rarityOptions = [
  { title: "Common", value: "common" },
  { title: "Uncommon", value: "uncommon" },
  { title: "Rare", value: "rare" },
  { title: "Epic", value: "epic" },
  { title: "Legendary", value: "legendary" },
  { title: "Mythical", value: "mythical" },
];

const metricOptions = [
  { title: "Startups Created", value: "startups_created" },
  { title: "Comments Posted", value: "comments_posted" },
  { title: "Replies Posted", value: "replies_posted" },
  { title: "Likes Received", value: "likes_received" },
  { title: "Followers Gained", value: "followers_gained" },
  { title: "Users Followed", value: "users_followed" },
  { title: "Views Received", value: "views_received" },
  { title: "Days Active", value: "days_active" },
  { title: "Reports Submitted", value: "reports_submitted" },
];

export const badge = defineType({
  name: "badge",
  title: "Badge Track",
  type: "document",
  icon: () => "🏆",
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      type: "string",
      options: {
        list: [
          { title: "Creator", value: "creator" },
          { title: "Community", value: "community" },
          { title: "Social", value: "social" },
          { title: "Achievement", value: "achievement" },
          { title: "Special Event", value: "special" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "icon",
      type: "string",
      description: "Emoji or icon identifier",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "color",
      type: "string",
      description: "Hex color for badge display",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "metric",
      type: "string",
      options: { list: metricOptions },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "criteria",
      type: "object",
      fields: [
        {
          name: "type",
          type: "string",
          options: {
            list: [
              { title: "Count", value: "count" },
              { title: "Streak", value: "streak" },
              { title: "Date", value: "date" },
              { title: "Combination", value: "combination" },
            ],
          },
          initialValue: "count",
        },
        {
          name: "timeframe",
          type: "string",
          options: {
            list: [
              { title: "All Time", value: "all_time" },
              { title: "Daily", value: "daily" },
              { title: "Weekly", value: "weekly" },
              { title: "Monthly", value: "monthly" },
              { title: "Yearly", value: "yearly" },
            ],
          },
          initialValue: "all_time",
        },
      ],
    }),
    defineField({
      name: "levels",
      type: "array",
      description: "Bronze through diamond thresholds for this track",
      of: [
        defineArrayMember({
          type: "object",
          name: "badgeLevel",
          fields: [
            defineField({
              name: "tier",
              type: "string",
              options: { list: tierOptions },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "target",
              type: "number",
              validation: (Rule) => Rule.required().min(1),
            }),
            defineField({
              name: "rarity",
              type: "string",
              options: { list: rarityOptions },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "description",
              type: "string",
            }),
          ],
          preview: {
            select: { tier: "tier", target: "target", rarity: "rarity" },
            prepare({ tier, target, rarity }) {
              return {
                title: `${tier ?? "?"} · ${target ?? 0}`,
                subtitle: rarity,
              };
            },
          },
        }),
      ],
      validation: (Rule) => Rule.required().min(5).max(5),
    }),
    defineField({
      name: "isActive",
      type: "boolean",
      initialValue: true,
      description: "Whether this badge track is currently active",
    }),
  ],
  preview: {
    select: {
      title: "name",
      category: "category",
      metric: "metric",
      media: "icon",
    },
    prepare(selection) {
      const { title, category, metric, media } = selection;
      return {
        title: title || "Unknown Badge",
        subtitle: [category, metric].filter(Boolean).join(" · "),
        media: () => media || "🏆",
      };
    },
  },
});

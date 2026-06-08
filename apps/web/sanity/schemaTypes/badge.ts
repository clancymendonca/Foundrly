import { defineField, defineType } from "sanity";

export const badge = defineType({
  name: "badge",
  title: "Badge",
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
      name: "rarity",
      type: "string",
      options: {
        list: [
          { title: "Common", value: "common" },
          { title: "Uncommon", value: "uncommon" },
          { title: "Rare", value: "rare" },
          { title: "Epic", value: "epic" },
          { title: "Legendary", value: "legendary" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "tier",
      type: "string",
      options: {
        list: [
          { title: "Bronze", value: "bronze" },
          { title: "Silver", value: "silver" },
          { title: "Gold", value: "gold" },
          { title: "Platinum", value: "platinum" },
          { title: "Diamond", value: "diamond" },
        ],
      },
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
        },
        {
          name: "target",
          type: "number",
          description: "Target value to achieve badge",
        },
        {
          name: "metric",
          type: "string",
          options: {
            list: [
              { title: "Startups Created", value: "startups_created" },
              { title: "Comments Posted", value: "comments_posted" },
              { title: "Likes Received", value: "likes_received" },
              { title: "Followers Gained", value: "followers_gained" },
              { title: "Users Followed", value: "users_followed" },
              { title: "Views Received", value: "views_received" },
              { title: "Days Active", value: "days_active" },
              { title: "Reports Submitted", value: "reports_submitted" },
            ],
          },
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
        },
      ],
    }),
    defineField({
      name: "isActive",
      type: "boolean",
      initialValue: true,
      description: "Whether this badge is currently active",
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "category",
      media: "icon",
    },
    prepare(selection) {
      const { title, subtitle, media } = selection;
      return {
        title: title || "Unknown Badge",
        subtitle: subtitle ? `${subtitle.charAt(0).toUpperCase() + subtitle.slice(1)} Badge` : "No category",
        media: () => media || "🏆",
      };
    },
  },
});

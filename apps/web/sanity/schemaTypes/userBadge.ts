import { defineArrayMember, defineField, defineType } from "sanity";

export const userBadge = defineType({
  name: "userBadge",
  title: "User Badge",
  type: "document",
  icon: () => "🎖️",
  fields: [
    defineField({
      name: "user",
      type: "reference",
      to: { type: "author" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "badge",
      type: "reference",
      to: { type: "badge" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "currentTier",
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
      description: "Highest tier reached on this track",
    }),
    defineField({
      name: "earnedAt",
      type: "datetime",
      description: "When the first tier was unlocked",
    }),
    defineField({
      name: "completedAt",
      type: "datetime",
      description: "Set when diamond tier is reached",
    }),
    defineField({
      name: "progress",
      type: "object",
      fields: [
        {
          name: "current",
          type: "number",
          description: "Current metric value",
        },
        {
          name: "target",
          type: "number",
          description: "Target for the next tier",
        },
        {
          name: "percentage",
          type: "number",
          description: "Progress percentage toward next tier (0-100)",
        },
      ],
    }),
    defineField({
      name: "tierHistory",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            { name: "tier", type: "string" },
            { name: "earnedAt", type: "datetime" },
          ],
        }),
      ],
    }),
    defineField({
      name: "metadata",
      type: "object",
      fields: [
        {
          name: "context",
          type: "string",
          description: "Context in which badge was earned",
        },
        {
          name: "relatedContent",
          type: "reference",
          to: [{ type: "startup" }, { type: "comment" }],
          description: "Related content that triggered badge",
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: "badge.name",
      subtitle: "user.name",
      tier: "currentTier",
      media: "badge.icon",
    },
    prepare(selection) {
      const { title, subtitle, tier, media } = selection;
      return {
        title: title || "Unknown Badge",
        subtitle: [subtitle ? `Earned by ${subtitle}` : "No user", tier]
          .filter(Boolean)
          .join(" · "),
        media: () => media || "🎖️",
      };
    },
  },
});

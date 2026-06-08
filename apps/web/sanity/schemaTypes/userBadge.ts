import { defineField, defineType } from "sanity";

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
      name: "earnedAt",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "progress",
      type: "object",
      fields: [
        {
          name: "current",
          type: "number",
          description: "Current progress toward badge",
        },
        {
          name: "target",
          type: "number",
          description: "Target value to achieve badge",
        },
        {
          name: "percentage",
          type: "number",
          description: "Progress percentage (0-100)",
        },
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
      media: "badge.icon",
    },
    prepare(selection) {
      const { title, subtitle, media } = selection;
      return {
        title: title || "Unknown Badge",
        subtitle: subtitle ? `Earned by ${subtitle}` : "No user",
        media: () => media || "🎖️",
      };
    },
  },
});

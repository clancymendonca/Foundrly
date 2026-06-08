import { defineField, defineType } from "sanity";

export const author = defineType({
  name: "author",
  title: "Author",
  type: "document",
  icon: () => "👤",
  fields: [
    defineField({
      name: "id",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "username",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "email",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "image",
      type: "string",
    }),
    defineField({
      name: "bio",
      type: "text",
    }),
    defineField({
      name: "followers",
      type: "array",
      of: [{ type: "reference", to: { type: "author" } }],
      initialValue: [],
    }),
    defineField({
      name: "following",
      type: "array",
      of: [{ type: "reference", to: { type: "author" } }],
      initialValue: [],
    }),
    defineField({
      name: "savedBy",
      type: "array",
      of: [{ type: "string" }],
      initialValue: [],
      description: "Array of user IDs who have saved this user",
    }),
    defineField({
      name: "bannedUntil",
      type: "datetime",
      description: "Timestamp until which this user is banned (null if not banned)",
    }),
    defineField({
      name: "isBanned",
      type: "boolean",
      initialValue: false,
      description: "Whether this user is currently banned",
    }),
    defineField({
      name: "banHistory",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "timestamp",
              type: "datetime",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "duration",
              type: "string",
              options: {
                list: [
                  { title: "1 Hour", value: "1h" },
                  { title: "24 Hours", value: "24h" },
                  { title: "7 Days", value: "7d" },
                  { title: "365 Days", value: "365d" },
                  { title: "Permanent", value: "perm" },
                ],
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: "reason",
              type: "string",
              description: "Reason for the ban",
            },
            {
              name: "reportId",
              type: "reference",
              to: { type: "report" },
              description: "Reference to the report that triggered this ban",
            },
            {
              name: "strikeNumber",
              type: "number",
              description: "Which strike this ban represents (1, 2, or 3 for permanent)",
            },
          ],
        },
      ],
      description: "History of all bans applied to this user",
    }),
    defineField({
      name: "strikeCount",
      type: "number",
      initialValue: 0,
      validation: (Rule) => Rule.min(0).max(3),
      description: "Current number of strikes (0-3, 3 = permanent ban)",
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "username",
      isBanned: "isBanned",
    },
    prepare(selection) {
      const { title, subtitle, isBanned } = selection;
      return {
        title: title || "Unknown Author",
        subtitle: `${subtitle ? `@${subtitle}` : "No username"}${isBanned ? " (Banned)" : ""}`,
        media: () => "👤",
      };
    },
  },
});

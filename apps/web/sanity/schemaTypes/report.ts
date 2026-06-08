import { defineField, defineType } from "sanity";
import { FlagIcon } from "lucide-react";

export const report = defineType({
  name: "report",
  title: "Report",
  type: "document",
  icon: FlagIcon,
  fields: [
    defineField({
      name: "reportedType",
      type: "string",
      options: {
        list: [
          { title: "Startup", value: "startup" },
          { title: "Comment", value: "comment" },
          { title: "User", value: "user" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "reportedRef",
      type: "reference",
      to: [
        { type: "startup" },
        { type: "comment" },
        { type: "author" },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "reason",
      type: "text",
      validation: (Rule) => Rule.required().min(10).max(1000),
    }),
    defineField({
      name: "reportedBy",
      type: "reference",
      to: { type: "author" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "timestamp",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "status",
      type: "string",
      options: {
        list: [
          { title: "Pending", value: "pending" },
          { title: "Reviewed", value: "reviewed" },
          { title: "Action Taken", value: "action-taken" },
        ],
      },
      initialValue: "pending",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "banDuration",
      type: "string",
      options: {
        list: [
          { title: "1 Hour", value: "1h" },
          { title: "24 Hours", value: "24h" },
          { title: "7 Days", value: "7d" },
          { title: "365 Days", value: "365d" },
          { title: "Permanently", value: "perm" },
        ],
      },
      description: "Ban duration (only filled by admin after action)",
    }),
    defineField({
      name: "adminNotes",
      type: "text",
      description: "Admin notes about the report and action taken",
    }),
    defineField({
      name: "deleteComment",
      type: "boolean",
      initialValue: false,
      description: "Delete the reported comment (only applies to comment reports)",
      hidden: ({ document }) => document?.reportedType !== "comment",
    }),

  ],
  preview: {
    select: {
      title: "reason",
      subtitle: "reportedType",
      media: "reportedRef",
    },
    prepare(selection) {
      const { title, subtitle, media } = selection;
      return {
        title: title ? title.substring(0, 50) + (title.length > 50 ? "..." : "") : "No reason provided",
        subtitle: `Reported ${subtitle}`,
        media: FlagIcon,
      };
    },
  },
  orderings: [
    {
      title: "Newest First",
      name: "timestampDesc",
      by: [{ field: "timestamp", direction: "desc" }],
    },
    {
      title: "Oldest First",
      name: "timestampAsc",
      by: [{ field: "timestamp", direction: "asc" }],
    },
    {
      title: "Status",
      name: "status",
      by: [{ field: "status", direction: "asc" }],
    },
  ],
}); 
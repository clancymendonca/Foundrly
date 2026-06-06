import { defineField, defineType } from "sanity";

export const moderationActivity = defineType({
  name: "moderationActivity",
  title: "Moderation Activity",
  type: "document",
  icon: () => "📊",
  fields: [
    defineField({
      name: "type",
      type: "string",
      options: {
        list: [
          { title: "Message Deleted", value: "message_deleted" },
          { title: "User Banned", value: "user_banned" },
          { title: "Warning Sent", value: "warning_sent" },
          { title: "Report Created", value: "report_created" },
          { title: "Comment Deleted", value: "comment_deleted" },
          { title: "Startup Banned", value: "startup_banned" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "timestamp",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "userId",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "userName",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "reason",
      type: "text",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "severity",
      type: "string",
      options: {
        list: [
          { title: "Low", value: "low" },
          { title: "Medium", value: "medium" },
          { title: "High", value: "high" },
          { title: "Critical", value: "critical" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "itemId",
      type: "string",
      description: "ID of the item that was moderated (optional)",
    }),
    defineField({
      name: "itemType",
      type: "string",
      description: "Type of item that was moderated (optional)",
    }),
    defineField({
      name: "source",
      type: "string",
      description: "Moderation engine source (groq or regex)",
    }),
    defineField({
      name: "model",
      type: "string",
      description: "AI model used for moderation (if applicable)",
    }),
  ],
  preview: {
    select: {
      title: "userName",
      subtitle: "reason",
      type: "type",
      severity: "severity",
      timestamp: "timestamp",
    },
    prepare(selection) {
      const { title, subtitle, type, severity, timestamp } = selection;
      const date = timestamp ? new Date(timestamp).toLocaleDateString() : "Unknown date";
      return {
        title: `${title} - ${type.replace("_", " ")}`,
        subtitle: `${subtitle} (${severity}) - ${date}`,
      };
    },
  },
}); 
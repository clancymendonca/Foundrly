import { defineField, defineType } from "sanity";

export const moderationSettings = defineType({
  name: "moderationSettings",
  title: "Moderation Settings",
  type: "document",
  icon: () => "🛡️",
  fields: [
    defineField({
      name: "enabled",
      type: "boolean",
      initialValue: true,
      description: "Enable auto-moderation system",
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
      initialValue: "medium",
      description: "Overall moderation strictness level",
    }),
    defineField({
      name: "actions",
      type: "object",
      fields: [
        {
          name: "profanity",
          type: "string",
          options: {
            list: [
              { title: "Warn", value: "warn" },
              { title: "Delete", value: "delete" },
              { title: "Ban", value: "ban" },
              { title: "Report", value: "report" },
            ],
          },
          initialValue: "delete",
        },
        {
          name: "hateSpeech",
          type: "string",
          options: {
            list: [
              { title: "Warn", value: "warn" },
              { title: "Delete", value: "delete" },
              { title: "Ban", value: "ban" },
              { title: "Report", value: "report" },
            ],
          },
          initialValue: "ban",
        },
        {
          name: "threats",
          type: "string",
          options: {
            list: [
              { title: "Warn", value: "warn" },
              { title: "Delete", value: "delete" },
              { title: "Ban", value: "ban" },
              { title: "Report", value: "report" },
            ],
          },
          initialValue: "ban",
        },
        {
          name: "spam",
          type: "string",
          options: {
            list: [
              { title: "Warn", value: "warn" },
              { title: "Delete", value: "delete" },
              { title: "Ban", value: "ban" },
              { title: "Report", value: "report" },
            ],
          },
          initialValue: "delete",
        },
        {
          name: "personalInfo",
          type: "string",
          options: {
            list: [
              { title: "Warn", value: "warn" },
              { title: "Delete", value: "delete" },
              { title: "Ban", value: "ban" },
              { title: "Report", value: "report" },
            ],
          },
          initialValue: "delete",
        },
      ],
      description: "Actions for different content types",
    }),
    defineField({
      name: "thresholds",
      type: "object",
      fields: [
        {
          name: "messageLength",
          type: "number",
          initialValue: 500,
          description: "Maximum message length in characters",
        },
        {
          name: "repetitionCount",
          type: "number",
          initialValue: 3,
          description: "Number of repeated words to flag",
        },
        {
          name: "capsRatio",
          type: "number",
          initialValue: 0.7,
          description: "Ratio of capital letters to flag (0-1)",
        },
        {
          name: "confidence",
          type: "number",
          initialValue: 0.6,
          description: "Minimum confidence level for flagging (0-1)",
        },
      ],
      description: "Detection thresholds",
    }),
    defineField({
      name: "autoBan",
      type: "object",
      fields: [
        {
          name: "enabled",
          type: "boolean",
          initialValue: true,
          description: "Enable automatic banning",
        },
        {
          name: "duration",
          type: "string",
          options: {
            list: [
              { title: "1 Hour", value: "1h" },
              { title: "24 Hours", value: "24h" },
              { title: "7 Days", value: "7d" },
              { title: "1 Year", value: "365d" },
              { title: "Permanent", value: "perm" },
            ],
          },
          initialValue: "24h",
          description: "Default ban duration",
        },
        {
          name: "strikeThreshold",
          type: "number",
          initialValue: 2,
          description: "Number of strikes before auto-ban",
        },
      ],
      description: "Automatic ban settings",
    }),
    defineField({
      name: "useModelModeration",
      type: "boolean",
      initialValue: true,
      description: "Use GROQ AI model for content moderation",
    }),
    defineField({
      name: "fallbackToRegex",
      type: "boolean",
      initialValue: true,
      description: "Fall back to regex rules if the AI model is unavailable",
    }),
    defineField({
      name: "lastUpdated",
      type: "datetime",
      readOnly: true,
      description: "When settings were last updated",
    }),
  ],
  preview: {
    select: {
      title: "enabled",
      severity: "severity",
    },
    prepare(selection) {
      const { title, severity } = selection;
      return {
        title: title ? "Moderation Enabled" : "Moderation Disabled",
        subtitle: `Severity: ${severity || "medium"}`,
        media: () => "🛡️",
      };
    },
  },
}); 
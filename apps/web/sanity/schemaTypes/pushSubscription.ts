import { defineField, defineType } from "sanity";
import { BellIcon } from "lucide-react";

export const pushSubscription = defineType({
  name: "pushSubscription",
  title: "Push Subscription",
  type: "document",
  icon: BellIcon,
  fields: [
    defineField({
      name: "userId",
      title: "User ID",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "endpoint",
      title: "Push Endpoint",
      type: "url",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "keys",
      title: "Encryption Keys",
      type: "object",
      fields: [
        defineField({
          name: "p256dh",
          title: "P-256 DH Key",
          type: "string",
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: "auth",
          title: "Auth Secret",
          type: "string",
          validation: (Rule) => Rule.required(),
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "isActive",
      title: "Is Active",
      type: "boolean",
      initialValue: true,
      description: "Whether this subscription is currently active",
    }),
  ],
  preview: {
    select: {
      title: "userId",
      subtitle: "endpoint",
      media: "isActive",
    },
    prepare(selection) {
      const { title, subtitle, media } = selection;
      return {
        title: `User: ${title}`,
        subtitle: `Endpoint: ${subtitle ? subtitle.substring(0, 50) + '...' : 'No endpoint'}`,
        media: media ? BellIcon : "🔕",
      };
    },
  },
  orderings: [
    {
      title: "Newest First",
      name: "createdAtDesc",
      by: [{ field: "createdAt", direction: "desc" }],
    },
    {
      title: "Oldest First",
      name: "createdAtAsc",
      by: [{ field: "createdAt", direction: "asc" }],
    },
    {
      title: "Active Status",
      name: "isActive",
      by: [{ field: "isActive", direction: "desc" }],
    },
  ],
}); 
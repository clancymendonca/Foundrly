import { defineField, defineType } from "sanity";

export const accountHistory = defineType({
  name: "accountHistory",
  title: "Account History",
  type: "document",
  icon: () => "📋",
  fields: [
    defineField({
      name: "userId",
      type: "string",
      validation: (Rule) => Rule.required(),
      description: "ID of the user whose account was changed"
    }),
    defineField({
      name: "userName",
      type: "string",
      validation: (Rule) => Rule.required(),
      description: "Name of the user at the time of the change"
    }),
    defineField({
      name: "changeType",
      type: "string",
      options: {
        list: [
          { title: "Profile Name Changed", value: "name_change" },
          { title: "Profile Bio Changed", value: "bio_change" },
          { title: "Profile Picture Changed", value: "image_change" },
          { title: "Startup Created", value: "startup_created" },
          { title: "Startup Updated", value: "startup_updated" },
          { title: "Startup Deleted", value: "startup_deleted" },
          { title: "Account Created", value: "account_created" },
          { title: "Email Changed", value: "email_change" },
          { title: "Username Changed", value: "username_change" },
          { title: "Privacy Setting Changed", value: "privacy_change" }
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "timestamp",
      type: "datetime",
      validation: (Rule) => Rule.required(),
      description: "When the change occurred"
    }),
    defineField({
      name: "oldValue",
      type: "string",
      description: "Previous value before the change"
    }),
    defineField({
      name: "newValue",
      type: "string",
      description: "New value after the change"
    }),
    defineField({
      name: "startupId",
      type: "string",
      description: "ID of the startup if the change is startup-related"
    }),
    defineField({
      name: "startupTitle",
      type: "string",
      description: "Title of the startup if the change is startup-related"
    }),
    defineField({
      name: "changeDetails",
      type: "object",
      fields: [
        {
          name: "field",
          type: "string",
          description: "Specific field that was changed"
        },
        {
          name: "oldData",
          type: "text",
          description: "Previous data (for complex changes)"
        },
        {
          name: "newData",
          type: "text",
          description: "New data (for complex changes)"
        }
      ],
      description: "Detailed information about the change"
    }),
    defineField({
      name: "ipAddress",
      type: "string",
      description: "IP address of the user who made the change"
    }),
    defineField({
      name: "userAgent",
      type: "string",
      description: "User agent string of the browser used"
    }),
    defineField({
      name: "sessionId",
      type: "string",
      description: "Session ID when the change was made"
    })
  ],
  preview: {
    select: {
      title: "userName",
      subtitle: "changeType",
      timestamp: "timestamp"
    },
    prepare(selection) {
      const { title, subtitle, timestamp } = selection;
      const date = timestamp ? new Date(timestamp).toLocaleDateString() : 'Unknown date';
      return {
        title: title || 'Unknown User',
        subtitle: `${subtitle} - ${date}`
      };
    }
  },
  orderings: [
    {
      title: 'Most Recent First',
      name: 'timestampDesc',
      by: [{ field: 'timestamp', direction: 'desc' }]
    },
    {
      title: 'Oldest First',
      name: 'timestampAsc',
      by: [{ field: 'timestamp', direction: 'asc' }]
    }
  ]
});

import { defineType, defineField } from 'sanity'

export const notification = defineType({
  name: 'notification',
  title: 'Notification',
  type: 'document',
  icon: () => '🔔',
  fields: [
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Follow', value: 'follow' },
          { title: 'Comment', value: 'comment' },
          { title: 'Reply', value: 'reply' },
          { title: 'Like', value: 'like' },
          { title: 'Comment Like', value: 'comment_like' },
          { title: 'Report', value: 'report' },
          { title: 'System', value: 'system' },
          { title: 'Mention', value: 'mention' },
          { title: 'Interested Submission', value: 'interested_submission' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'message',
      title: 'Message',
      type: 'text',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'recipient',
      title: 'Recipient',
      type: 'reference',
      to: [{ type: 'author' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sender',
      title: 'Sender',
      type: 'reference',
      to: [{ type: 'author' }],
    }),
    defineField({
      name: 'startup',
      title: 'Startup',
      type: 'reference',
      to: [{ type: 'startup' }],
    }),
    defineField({
      name: 'comment',
      title: 'Comment',
      type: 'reference',
      to: [{ type: 'comment' }],
    }),
    defineField({
      name: 'actionUrl',
      title: 'Action URL',
      type: 'string',
    }),
    defineField({
      name: 'interestedSubmissionId',
      title: 'Interested Submission ID',
      type: 'string',
    }),
    defineField({
      name: 'isRead',
      title: 'Is Read',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'readAt',
      title: 'Read At',
      type: 'datetime',
    }),
    defineField({
      name: 'metadata',
      title: 'Metadata',
      type: 'object',
      fields: [
        { name: 'startupTitle', type: 'string', title: 'Startup Title' },
        { name: 'commentText', type: 'string', title: 'Comment Text' },
        { name: 'userName', type: 'string', title: 'User Name' },
        { name: 'userImage', type: 'string', title: 'User Image' },
        { name: 'parentCommentText', type: 'string', title: 'Parent Comment Text' },
        { name: 'reportReason', type: 'string', title: 'Report Reason' },
        { name: 'reportStatus', type: 'string', title: 'Report Status' },
        { name: 'actionTaken', type: 'string', title: 'Action Taken' },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      type: 'type',
      isRead: 'isRead',
    },
    prepare(selection) {
      const { title, type, isRead } = selection
      return {
        title: title || 'Notification',
        subtitle: `${type || 'unknown'} ${isRead ? '(Read)' : '(Unread)'}`,
      }
    },
  },
})

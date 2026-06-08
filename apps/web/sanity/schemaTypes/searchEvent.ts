import { defineField, defineType } from 'sanity';

export const searchEvent = defineType({
  name: 'searchEvent',
  title: 'Search Event',
  type: 'document',
  fields: [
    defineField({
      name: 'userId',
      title: 'User ID',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'term',
      title: 'Search Term',
      type: 'string',
      validation: (Rule) => Rule.required().min(1).max(500),
    }),
    defineField({
      name: 'timestamp',
      title: 'Timestamp',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'userAgent',
      title: 'User Agent',
      type: 'string',
    }),
    defineField({
      name: 'ipAddress',
      title: 'IP Address',
      type: 'string',
    }),
    defineField({
      name: 'sessionId',
      title: 'Session ID',
      type: 'string',
    }),
  ],
});



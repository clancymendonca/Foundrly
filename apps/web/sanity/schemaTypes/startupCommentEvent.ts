import { defineField, defineType } from 'sanity';

export const startupCommentEvent = defineType({
  name: 'startupCommentEvent',
  title: 'Startup Comment Event',
  type: 'document',
  fields: [
    defineField({ name: 'startupId', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'userId', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'action', type: 'string', options: { list: ['comment'] }, validation: Rule => Rule.required() }),
    defineField({ name: 'timestamp', type: 'datetime', validation: Rule => Rule.required() }),
  ]
});

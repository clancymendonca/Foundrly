import { defineField, defineType } from 'sanity';

export const startupDislikeEvent = defineType({
  name: 'startupDislikeEvent',
  title: 'Startup Dislike Event',
  type: 'document',
  fields: [
    defineField({ name: 'startupId', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'userId', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'action', type: 'string', options: { list: ['dislike', 'undislike'] }, validation: Rule => Rule.required() }),
    defineField({ name: 'timestamp', type: 'datetime', validation: Rule => Rule.required() }),
  ]
});

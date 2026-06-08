import { defineField, defineType } from 'sanity';

export const startupLikeEvent = defineType({
  name: 'startupLikeEvent',
  title: 'Startup Like Event',
  type: 'document',
  fields: [
    defineField({ name: 'startupId', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'userId', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'action', type: 'string', options: { list: ['like', 'unlike'] }, validation: Rule => Rule.required() }),
    defineField({ name: 'timestamp', type: 'datetime', validation: Rule => Rule.required() }),
  ]
});

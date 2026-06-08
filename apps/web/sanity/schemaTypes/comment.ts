import { defineField, defineType } from "sanity";
import { UserIcon } from "lucide-react";

export const comment = defineType({
  name: "comment",
  title: "Comment",
  type: "document",
  icon: UserIcon,
  fields: [
    defineField({
      name: "author",
      type: "reference",
      to: { type: "author" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "text",
      type: "string",
      validation: (Rule) => Rule.required().min(1).max(1000),
    }),
    defineField({
      name: "createdAt",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "startup",
      type: "reference",
      to: { type: "startup" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "replies",
      type: "array",
      of: [{ type: "reference", to: [{ type: "comment" }] }],
      initialValue: [],
    }),
    defineField({
      name: "likes",
      type: "number",
      initialValue: 0,
    }),
    defineField({
      name: "dislikes",
      type: "number",
      initialValue: 0,
    }),
    defineField({
      name: "likedBy",
      type: "array",
      of: [{ type: "string" }],
      initialValue: [],
    }),
    defineField({
      name: "dislikedBy",
      type: "array",
      of: [{ type: "string" }],
      initialValue: [],
    }),
    defineField({
      name: "parent",
      type: "reference",
      to: [{ type: "comment" }],
    }),
    defineField({
      name: "deleted",
      type: "boolean",
      initialValue: false,
      description: "Whether this comment has been soft deleted",
    }),
    defineField({
      name: "bannedUntil",
      type: "datetime",
      description: "Timestamp until which this comment is banned (null if not banned)",
    }),
    defineField({
      name: "isBanned",
      type: "boolean",
      initialValue: false,
      description: "Whether this comment is currently banned",
    }),
  ],
}); 
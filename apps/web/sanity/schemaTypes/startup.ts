import { defineField, defineType } from "sanity";
import { UserIcon } from "lucide-react";

export const startup = defineType({
    name: "startup",
    title: "Startup",
    type: "document",
    icon: UserIcon,
    fields: [
        defineField({
            name: "title",
            type: "string",
        }),
        defineField({
            name: "slug",
            type: "slug",
            options: {
                source: "title"
            }
        }),
        defineField({
            name: "author",
            type: "reference",
            to: { type: "author" }
        }),
        defineField({
            name: "views",
            type: "number",
        }),
        defineField({
            name: "description",
            type: "text",
        }),
        defineField({
            name: "category",
            type: "string",
            validation: (Rule) => Rule.min(1).max(20).required().error("Category is required"),
        }),
        defineField({
            name: "image",
            type: "url",
            validation: (Rule) => Rule.required().error("Image is required"),
        }),
        defineField({
            name: "pitch",
            type: "markdown",
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
            name: "comments",
            type: "array",
            of: [{ type: "reference", to: [{ type: "comment" }] }],
            initialValue: [],
        }),
        defineField({
            name: "bannedUntil",
            type: "datetime",
            description: "Timestamp until which this startup is banned (null if not banned)",
        }),
        defineField({
            name: "isBanned",
            type: "boolean",
            initialValue: false,
            description: "Whether this startup is currently banned",
        }),
        defineField({
            name: "buyMeACoffeeUsername",
            type: "string",
            description: "Buy me a coffee username (optional)",
            validation: (Rule) => Rule.optional(),
        }),
        defineField({
            name: "savedBy",
            type: "array",
            of: [{ type: "string" }],
            initialValue: [],
            description: "Array of user IDs who have saved this startup",
        }),
        defineField({
            name: "interestedBy",
            type: "array",
            of: [{ type: "string" }],
            initialValue: [],
            description: "Array of user IDs who have shown interest in this startup",
        }),
    ],
});
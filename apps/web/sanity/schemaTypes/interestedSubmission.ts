import { defineField, defineType } from "sanity";
import { Heart } from "lucide-react";

export const interestedSubmission = defineType({
  name: "interestedSubmission",
  title: "Interested Submission",
  type: "document",
  icon: Heart,
  fields: [
    defineField({
      name: "startup",
      type: "reference",
      to: { type: "startup" },
      validation: (Rule) => Rule.required(),
      description: "The startup the user is interested in",
    }),
    defineField({
      name: "startupTitle",
      type: "string",
      validation: (Rule) => Rule.required(),
      description: "Title of the startup at the time of submission",
    }),
    defineField({
      name: "user",
      type: "reference",
      to: { type: "author" },
      description: "The user who submitted the interest (if logged in)",
    }),
    defineField({
      name: "userId",
      type: "string",
      description: "User ID from the session",
    }),
    defineField({
      name: "name",
      type: "string",
      validation: (Rule) => Rule.required(),
      description: "Full name of the interested person",
    }),
    defineField({
      name: "email",
      type: "string",
      validation: (Rule) => Rule.required().email(),
      description: "Email address of the interested person",
    }),
    defineField({
      name: "phone",
      type: "string",
      description: "Phone number (optional)",
    }),
    defineField({
      name: "company",
      type: "string",
      description: "Company or organization name",
    }),
    defineField({
      name: "role",
      type: "string",
      options: {
        list: [
          { title: "Investor", value: "investor" },
          { title: "Angel Investor", value: "angel-investor" },
          { title: "Venture Capitalist", value: "vc" },
          { title: "Startup Founder", value: "founder" },
          { title: "Entrepreneur", value: "entrepreneur" },
          { title: "Advisor", value: "advisor" },
          { title: "Mentor", value: "mentor" },
          { title: "Employee", value: "employee" },
          { title: "Student", value: "student" },
          { title: "Other", value: "other" },
        ],
      },
      description: "Role or title of the interested person",
    }),
    defineField({
      name: "location",
      type: "string",
      description: "Geographic location",
    }),
    defineField({
      name: "investmentAmount",
      type: "string",
      description: "Investment amount they're considering",
    }),
    defineField({
      name: "investmentType",
      type: "string",
      options: {
        list: [
          { title: "Equity Investment", value: "equity" },
          { title: "Loan/Debt", value: "loan" },
          { title: "Partnership", value: "partnership" },
          { title: "Advisory Role", value: "advisory" },
          { title: "Mentorship", value: "mentorship" },
          { title: "Collaboration", value: "collaboration" },
          { title: "Other", value: "other" },
        ],
      },
      description: "Type of investment or involvement",
    }),
    defineField({
      name: "timeline",
      type: "string",
      options: {
        list: [
          { title: "Immediate (within 1 month)", value: "immediate" },
          { title: "Short-term (1-3 months)", value: "short-term" },
          { title: "Medium-term (3-6 months)", value: "medium-term" },
          { title: "Long-term (6+ months)", value: "long-term" },
          { title: "Just exploring", value: "exploring" },
        ],
      },
      description: "Timeline for investment or involvement",
    }),
    defineField({
      name: "preferredContact",
      type: "string",
      options: {
        list: [
          { title: "Email", value: "email" },
          { title: "Phone", value: "phone" },
          { title: "LinkedIn", value: "linkedin" },
          { title: "Any method", value: "any" },
        ],
      },
      description: "Preferred method of contact",
    }),
    defineField({
      name: "linkedin",
      type: "url",
      description: "LinkedIn profile URL",
    }),
    defineField({
      name: "website",
      type: "url",
      description: "Website or portfolio URL",
    }),
    defineField({
      name: "experience",
      type: "text",
      description: "Relevant experience and background",
    }),
    defineField({
      name: "message",
      type: "text",
      validation: (Rule) => Rule.required(),
      description: "Message explaining their interest",
    }),
    defineField({
      name: "howDidYouHear",
      type: "string",
      options: {
        list: [
          { title: "Search Engine", value: "search" },
          { title: "Social Media", value: "social-media" },
          { title: "Referral", value: "referral" },
          { title: "Event/Conference", value: "event" },
          { title: "News/Media", value: "news" },
          { title: "Direct", value: "direct" },
          { title: "Other", value: "other" },
        ],
      },
      description: "How they heard about the startup",
    }),
    defineField({
      name: "consentToContact",
      type: "boolean",
      validation: (Rule) => Rule.required(),
      description: "Whether they consented to be contacted",
    }),
    defineField({
      name: "status",
      type: "string",
      options: {
        list: [
          { title: "New", value: "new" },
          { title: "Contacted", value: "contacted" },
          { title: "In Discussion", value: "in-discussion" },
          { title: "Interested", value: "interested" },
          { title: "Not Interested", value: "not-interested" },
          { title: "Closed", value: "closed" },
        ],
      },
      initialValue: "new",
      description: "Current status of the interest submission",
    }),
    defineField({
      name: "notes",
      type: "text",
      description: "Internal notes about this submission",
    }),
    defineField({
      name: "submittedAt",
      type: "datetime",
      validation: (Rule) => Rule.required(),
      description: "When the submission was made",
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "startupTitle",
      media: "startup.image",
    },
    prepare(selection) {
      const { title, subtitle, media } = selection;
      return {
        title: title || "Unknown",
        subtitle: subtitle ? `Interested in: ${subtitle}` : "No startup",
        media: () => "💼",
      };
    },
  },
  orderings: [
    {
      title: "Newest First",
      name: "newestFirst",
      by: [{ field: "submittedAt", direction: "desc" }],
    },
    {
      title: "Oldest First", 
      name: "oldestFirst",
      by: [{ field: "submittedAt", direction: "asc" }],
    },
    {
      title: "By Startup",
      name: "byStartup",
      by: [{ field: "startupTitle", direction: "asc" }],
    },
  ],
});

import { defineQuery } from "next-sanity";

// Simple test query to check if reports exist
export const TEST_REPORTS_QUERY = defineQuery(`
  *[_type == "report" && reportedBy._ref == $userId] {
    _id,
    reportedType,
    reason,
    timestamp,
    status,
    reportedRef
  }
`);

// Query to check if there are any reports at all in the database
export const ALL_REPORTS_QUERY = defineQuery(`
  *[_type == "report"] {
    _id,
    reportedType,
    reason,
    timestamp,
    status,
    reportedBy,
    reportedRef
  }
`);

// Simple query to get startup IDs from reports
export const STARTUP_IDS_FROM_REPORTS_QUERY = defineQuery(`
  *[_type == "report" && reportedBy._ref == $userId && reportedType == "startup"] {
    reportedRef
  }
`);

// Query to get all reports (both comments and startups)
export const ALL_USER_REPORTS_QUERY = defineQuery(`
  *[_type == "report" && reportedBy._ref == $userId] {
    _id,
    reason,
    timestamp,
    status,
    reportedType,
    reportedRef
  }
`);

// Simple query to fetch startups by their IDs
export const STARTUPS_BY_IDS_QUERY = defineQuery(`
  *[_type == "startup" && _id in $startupIds] {
    _id,
    title,
    slug,
    _createdAt,
    author -> {
      _id, name, image, bio
    },
    views,
    description,
    category,
    image,
    likes,
    dislikes,
    "commentsCount": count(comments)
  }
`);

// Query to fetch startups that a user has liked
export const USER_LIKED_STARTUPS_QUERY = defineQuery(`
  *[_type == "startup" && $userId in likedBy] | order(_createdAt desc) {
    _id,
    title,
    slug,
    _createdAt,
    author -> {
      _id, name, image, bio
    },
    views,
    description,
    category,
    image,
    likes,
    dislikes,
    "commentsCount": count(comments),
    "likedAt": _createdAt
  }
`);

// Query to fetch startups that a user has commented on
export const USER_COMMENTED_STARTUPS_QUERY = defineQuery(`
  *[_type == "startup" && _id in *[_type == "comment" && author._ref == $userId].startup._ref] | order(_createdAt desc) {
    _id,
    title,
    slug,
    _createdAt,
    author -> {
      _id, name, image, bio
    },
    views,
    description,
    category,
    image,
    likes,
    dislikes,
    "commentsCount": count(comments),
    "userComments": *[_type == "comment" && startup._ref == ^._id && author._ref == $userId] {
      _id,
      text,
      createdAt,
      likes,
      dislikes
    }
  }
`);

// Query to fetch startups and comments that a user has reported
export const USER_REPORTED_CONTENT_QUERY = defineQuery(`
  {
    "startups": *[_type == "startup" && _id in *[_type == "report" && reportedBy._ref == $userId && reportedType == "startup"].reportedRef._ref] {
      _id,
      title,
      slug,
      _createdAt,
      author -> {
        _id, name, image, bio
      },
      views,
      description,
      category,
      image,
      likes,
      dislikes,
      "commentsCount": count(comments),
      "userReports": *[_type == "report" && reportedRef._ref == ^._id && reportedBy._ref == $userId && reportedType == "startup"] {
        _id,
        reason,
        timestamp,
        status
      }
    },
    "comments": *[_type == "comment" && _id in *[_type == "report" && reportedBy._ref == $userId && reportedType == "comment"].reportedRef._ref] {
      _id,
      text,
      createdAt,
      likes,
      dislikes,
      startup -> {
        _id,
        title,
        slug,
        image
      },
      author -> {
        _id,
        name,
        image
      },
      "userReports": *[_type == "report" && reportedRef._ref == ^._id && reportedBy._ref == $userId && reportedType == "comment"] {
        _id,
        reason,
        timestamp,
        status
      }
    }
  }
`);

// Combined query for all user activity with date filtering
export const USER_ACTIVITY_QUERY = (activityType: string, startDate?: string, endDate?: string) => {
  let baseQuery = '';
  let dateFilter = '';
  
  if (startDate && endDate) {
    dateFilter = `&& _createdAt >= $startDate && _createdAt <= $endDate`;
  }
  
  switch (activityType) {
    case 'likes':
      baseQuery = `*[_type == "startup" && $userId in likedBy ${dateFilter}]`;
      break;
    case 'dislikes':
      baseQuery = `*[_type == "startup" && $userId in dislikedBy ${dateFilter}]`;
      break;
    case 'comments':
      baseQuery = `*[_type == "startup" && _id in *[_type == "comment" && author._ref == $userId ${dateFilter}].startup._ref]`;
      break;
    case 'reviews':
      // For reports, we need to use timestamp field instead of _createdAt
      if (startDate && endDate) {
        baseQuery = `*[_type == "startup" && _id in *[_type == "report" && reportedBy._ref == $userId && reportedType == "startup" && timestamp >= $startDate && timestamp <= $endDate].reportedRef._ref]`;
      } else {
        // Simplified query for reports
        baseQuery = `*[_type == "startup" && _id in *[_type == "report" && reportedBy._ref == $userId && reportedType == "startup"].reportedRef._ref]`;
      }
      break;
    default:
      baseQuery = `*[_type == "startup" && $userId in likedBy ${dateFilter}]`;
  }
  
  return defineQuery(`
    ${baseQuery} | order(_createdAt desc) {
      _id,
      title,
      slug,
      _createdAt,
      author -> {
        _id, name, image, bio
      },
      views,
      description,
      category,
      image,
      likes,
      dislikes,
      "commentsCount": count(comments),
      "activityType": "${activityType}",
      "userComments": *[_type == "comment" && startup._ref == ^._id && author._ref == $userId] {
        _id,
        text,
        createdAt,
        likes,
        dislikes
      },
      "userReports": *[_type == "report" && reportedRef._ref == ^._id && reportedBy._ref == $userId && reportedType == "startup"] {
        _id,
        reason,
        timestamp,
        status
      }
    }
  `);
};

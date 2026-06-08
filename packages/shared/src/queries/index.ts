export const STARTUP_CARD_FIELDS = `
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
  buyMeACoffeeUsername
`;

export const startupsSortedQuery = (sortBy: string) => {
  let orderClause = "| order(_createdAt desc)";
  switch (sortBy) {
    case "popular":
      orderClause = "| order(views desc, likes desc)";
      break;
    case "viewed":
      orderClause = "| order(views desc)";
      break;
    case "liked":
      orderClause = "| order(likes desc)";
      break;
    case "commented":
      orderClause = "| order(count(comments) desc)";
      break;
  }

  return `*[_type == "startup" && defined(slug.current) && !defined($search) || title match $search || category match $search || author->name match $search] ${orderClause} { ${STARTUP_CARD_FIELDS} }`;
};

export const STARTUP_BY_ID_QUERY = `*[_type == "startup" && _id == $id][0]{
  _id, 
  title, 
  slug,
  _createdAt,
  author -> {
    _id, name, username, image, bio
  }, 
  views,
  description,
  category,
  image,
  pitch,
  buyMeACoffeeUsername
}`;

export const AUTHOR_BY_ID_QUERY = `*[_type == "author" && _id == $id][0]{
  _id,
  id,
  name,
  username,
  email,
  image,
  bio,
  followers[]->{ _id, name, username, image },
  following[]->{ _id, name, username, image }
}`;

export const AUTHOR_BY_FIREBASE_UID_QUERY = `*[_type == "author" && id == $id][0]{
  _id,
  id,
  name,
  username,
  email,
  image,
  bio,
  followers[]->{ _id, name, username, image },
  following[]->{ _id, name, username, image }
}`;

export const AUTHOR_BY_EMAIL_QUERY = `*[_type == "author" && email == $email][0]{
  _id,
  id,
  name,
  username,
  email,
  image,
  bio
}`;

export const STARTUPS_BY_AUTHOR_QUERY = `*[_type == "startup" && author._ref == $id] | order(_createdAt desc) { ${STARTUP_CARD_FIELDS} }`;

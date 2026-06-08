export const EMOJI_REACTIONS = ["❤️", "😂", "😍", "😮", "👍", "👎"] as const;

export const EMOJI_TO_REACTION_TYPE: Record<string, string> = {
  "❤️": "heart",
  "😂": "laugh",
  "😍": "love",
  "😮": "wow",
  "👍": "thumbsup",
  "👎": "thumbsdown",
};

export const REACTION_TYPE_TO_EMOJI: Record<string, string> = {
  heart: "❤️",
  laugh: "😂",
  love: "😍",
  wow: "😮",
  thumbsup: "👍",
  thumbsdown: "👎",
};

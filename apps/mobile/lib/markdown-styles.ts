import { Platform, StyleSheet } from "react-native";
import { theme } from "./theme";

const mono = Platform.select({
  ios: "Menlo",
  default: "monospace",
});

const codeBlockStyle = {
  fontFamily: mono,
  fontSize: 14,
  lineHeight: 20,
  backgroundColor: theme.white,
  borderColor: theme.gray200,
  borderWidth: 1,
  borderRadius: 8,
  padding: 12,
  color: theme.gray700,
  marginVertical: 8,
};

export const pitchMarkdownStyles = StyleSheet.create({
  body: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 16,
    color: theme.black,
    lineHeight: 24,
  },
  heading1: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    color: theme.black,
    marginTop: 4,
    marginBottom: 10,
  },
  heading2: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
    color: theme.black,
    marginTop: 4,
    marginBottom: 8,
  },
  heading3: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 18,
    lineHeight: 24,
    color: theme.black,
    marginTop: 4,
    marginBottom: 6,
  },
  heading4: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 16,
    lineHeight: 22,
    color: theme.black,
    marginBottom: 4,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 12,
  },
  strong: {
    fontFamily: theme.fontFamily.bold,
  },
  em: {
    fontStyle: "italic",
  },
  link: {
    color: theme.primary,
    textDecorationLine: "underline",
  },
  blockquote: {
    backgroundColor: theme.white,
    borderLeftColor: theme.primary,
    borderLeftWidth: 3,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  list_item: {
    marginBottom: 6,
  },
  bullet_list_icon: {
    fontFamily: theme.fontFamily.bold,
    color: theme.primary,
    marginLeft: 4,
    marginRight: 8,
    lineHeight: 24,
  },
  ordered_list_icon: {
    fontFamily: theme.fontFamily.medium,
    color: theme.gray700,
    marginLeft: 4,
    marginRight: 8,
    lineHeight: 24,
  },
  code_inline: {
    fontFamily: mono,
    fontSize: 14,
    backgroundColor: theme.white,
    borderColor: theme.gray200,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    color: theme.gray700,
  },
  code_block: codeBlockStyle,
  fence: codeBlockStyle,
  hr: {
    backgroundColor: theme.gray200,
    height: 1,
    marginVertical: 16,
  },
});

/** Roomier markdown for startup detail / read-only pitch views. */
export const startupDetailMarkdownStyles = StyleSheet.create({
  body: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 16,
    color: theme.gray700,
    lineHeight: 26,
  },
  heading1: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 26,
    lineHeight: 32,
    color: theme.black,
    marginTop: 8,
    marginBottom: 14,
  },
  heading2: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
    color: theme.black,
    marginTop: 28,
    marginBottom: 12,
  },
  heading3: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 18,
    lineHeight: 24,
    color: theme.black,
    marginTop: 20,
    marginBottom: 10,
  },
  heading4: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 16,
    lineHeight: 22,
    color: theme.black,
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 16,
    flexWrap: "wrap",
    flexDirection: "column",
    alignItems: "flex-start",
    width: "100%",
  },
  strong: {
    fontFamily: theme.fontFamily.bold,
    color: theme.black,
  },
  em: {
    fontStyle: "italic",
  },
  link: {
    color: theme.primary,
    textDecorationLine: "underline",
  },
  blockquote: {
    backgroundColor: theme.white,
    borderLeftColor: theme.primary,
    borderLeftWidth: 3,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 8,
  },
  bullet_list: {
    marginTop: 8,
    marginBottom: 16,
  },
  ordered_list: {
    marginTop: 8,
    marginBottom: 16,
  },
  list_item: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bullet_list_icon: {
    fontFamily: theme.fontFamily.bold,
    color: theme.primary,
    marginLeft: 4,
    marginRight: 10,
    lineHeight: 26,
    marginTop: 1,
  },
  ordered_list_icon: {
    fontFamily: theme.fontFamily.medium,
    color: theme.gray700,
    marginLeft: 4,
    marginRight: 10,
    lineHeight: 26,
    marginTop: 1,
  },
  bullet_list_content: {
    flex: 1,
  },
  ordered_list_content: {
    flex: 1,
  },
  code_inline: {
    fontFamily: mono,
    fontSize: 14,
    backgroundColor: theme.white,
    borderColor: theme.gray200,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    color: theme.gray700,
  },
  code_block: {
    ...codeBlockStyle,
    marginVertical: 16,
  },
  fence: {
    ...codeBlockStyle,
    marginVertical: 16,
  },
  hr: {
    backgroundColor: theme.gray200,
    height: 1,
    marginVertical: 24,
  },
  text: {
    lineHeight: 26,
  },
  textgroup: {
    lineHeight: 26,
  },
});

import { StyleSheet } from "react-native";
import { theme } from "@/lib/theme";

export const screenStyles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: theme.tabBarHeight + 24,
  },
  loader: { marginTop: 32 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  field: { marginBottom: 16 },
  label: {
    marginBottom: 4,
    fontFamily: theme.fontFamily.medium,
    fontSize: 14,
    color: theme.black,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.gray200,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: theme.fontFamily.regular,
    fontSize: 16,
    color: theme.black,
  },
  primaryBtn: {
    borderRadius: 8,
    backgroundColor: theme.primary,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 16,
    color: theme.white,
    textAlign: "center",
  },
  card: {
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.gray100,
    padding: 16,
    backgroundColor: theme.white,
  },
  cardTitle: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 16,
    color: theme.black,
  },
  cardDesc: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.gray600,
    marginTop: 4,
  },
  empty: {
    textAlign: "center",
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.gray500,
    marginTop: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: theme.tabBarHeight + 24,
  },
});

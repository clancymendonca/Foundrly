import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { theme } from "@/lib/theme";

const FILTERS = [
  { key: "recent", label: "Most Recent" },
  { key: "popular", label: "Most Popular" },
  { key: "viewed", label: "Most Viewed" },
  { key: "liked", label: "Most Liked" },
  { key: "commented", label: "Most Commented" },
] as const;

export type FilterKey = (typeof FILTERS)[number]["key"];

export function getFilterTitle(filter: FilterKey): string {
  const match = FILTERS.find((f) => f.key === filter);
  return match ? `${match.label} Startups` : "Most Recent Startups";
}

export function FilterDropdown({
  value,
  onChange,
}: {
  value: FilterKey;
  onChange: (filter: FilterKey) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <Ionicons name="filter" size={32} color={theme.black100} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade">
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.menuAnchor}>
          <View style={styles.menu}>
            {FILTERS.map((item) => (
              <Pressable
                key={item.key}
                style={[
                  styles.item,
                  value === item.key && styles.itemActive,
                ]}
                onPress={() => {
                  onChange(item.key);
                  setOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.itemText,
                    value === item.key && styles.itemTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative" },
  trigger: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  menuAnchor: {
    position: "absolute",
    top: "40%",
    right: 24,
    alignItems: "flex-end",
  },
  menu: {
    width: 192,
    backgroundColor: theme.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.gray200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
  },
  item: { paddingHorizontal: 16, paddingVertical: 12 },
  itemActive: { backgroundColor: "#DBEAFE" },
  itemText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.gray700,
  },
  itemTextActive: {
    color: theme.primary,
    fontFamily: theme.fontFamily.semiBold,
  },
});

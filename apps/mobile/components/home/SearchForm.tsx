import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { theme } from "@/lib/theme";

export function SearchForm({
  value,
  onChangeText,
  onSubmit,
  onClear,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onClear?: () => void;
}) {
  return (
    <View style={styles.form}>
      <TextInput
        style={styles.input}
        placeholder="Search startups with AI..."
        placeholderTextColor={theme.black100}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
      />
      <View style={styles.actions}>
        {value.length > 0 && onClear && (
          <Pressable style={styles.clearBtn} onPress={onClear}>
            <Ionicons name="close" size={20} color={theme.black} />
          </Pressable>
        )}
        <Pressable style={styles.btn} onPress={onSubmit}>
          <Ionicons name="search" size={20} color={theme.white} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    width: "100%",
    maxWidth: 768,
    minHeight: 80,
    marginTop: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.white,
    borderWidth: 5,
    borderColor: theme.black,
    borderRadius: 80,
    paddingHorizontal: 20,
  },
  input: {
    flex: 1,
    fontFamily: theme.fontFamily.bold,
    fontSize: 20,
    color: theme.black,
    paddingVertical: 12,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  clearBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.gray100,
  },
  btn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.black,
    alignItems: "center",
    justifyContent: "center",
  },
});

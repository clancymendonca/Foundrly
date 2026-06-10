import { Linking, StyleSheet, Text, View } from "react-native";
import { theme } from "@/lib/theme";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function isUrl(part: string): boolean {
  return /^https?:\/\/[^\s]+$/.test(part);
}

export function LinkifiedText({
  text,
  style,
}: {
  text: string;
  style?: object;
}) {
  const parts = text.split(URL_REGEX);

  return (
    <Text style={style}>
      {parts.map((part, index) => {
        if (isUrl(part)) {
          return (
            <Text
              key={`${part}-${index}`}
              style={styles.link}
              onPress={() => Linking.openURL(part).catch(() => {})}
            >
              {part}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  link: {
    color: theme.blue500,
    textDecorationLine: "underline",
  },
});

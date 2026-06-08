import { useState } from "react";
import { Image } from "expo-image";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { resolveDisplayImageUrl } from "@/lib/chat-utils";
import { theme } from "@/lib/theme";

interface ChatAvatarProps {
  imageUrl?: string | null;
  name?: string;
  size: number;
  style?: ViewStyle;
}

export function ChatAvatar({ imageUrl, name, size, style }: ChatAvatarProps) {
  const [failed, setFailed] = useState(false);
  const uri = resolveDisplayImageUrl(imageUrl);
  const initial = name?.[0]?.toUpperCase() || "?";

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          style,
        ]}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.38 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: theme.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    fontFamily: theme.fontFamily.bold,
    color: theme.gray600,
  },
});

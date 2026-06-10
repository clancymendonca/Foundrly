import { useState } from "react";
import { Image } from "expo-image";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { resolveDisplayImageUrl } from "@/lib/chat-utils";
import { theme } from "@/lib/theme";

export type ChatAvatarShape = "round" | "rounded-square";

export function getChatAvatarRadius(
  size: number,
  shape: ChatAvatarShape = "round",
): number {
  return shape === "round" ? size / 2 : Math.round(size * 0.24);
}

interface ChatAvatarProps {
  imageUrl?: string | null;
  name?: string;
  size: number;
  style?: ViewStyle;
  online?: boolean;
  shape?: ChatAvatarShape;
}

export function ChatAvatar({
  imageUrl,
  name,
  size,
  style,
  online,
  shape = "round",
}: ChatAvatarProps) {
  const [failed, setFailed] = useState(false);
  const uri = resolveDisplayImageUrl(imageUrl);
  const initial = name?.[0]?.toUpperCase() || "?";
  const borderRadius = getChatAvatarRadius(size, shape);

  const onlineDot = online ? (
    <View
      style={[
        styles.onlineDot,
        {
          width: size * 0.26,
          height: size * 0.26,
          borderRadius: size * 0.13,
          right: -size * 0.02,
          bottom: -size * 0.02,
        },
      ]}
    />
  ) : null;

  const face = uri && !failed ? (
    <Image
      source={{ uri }}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  ) : (
    <View style={[styles.fallback, { width: size, height: size }]}>
      <Text style={[styles.initial, { fontSize: size * 0.38 }]}>{initial}</Text>
    </View>
  );

  return (
    <View style={[{ width: size, height: size, borderRadius }, style]}>
      <View style={[styles.clip, { width: size, height: size, borderRadius }]}>
        {face}
      </View>
      {onlineDot}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: "hidden",
  },
  fallback: {
    flex: 1,
    backgroundColor: theme.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    fontFamily: theme.fontFamily.bold,
    color: theme.gray600,
  },
  onlineDot: {
    position: "absolute",
    backgroundColor: theme.green500,
    borderWidth: 2,
    borderColor: theme.white,
  },
});

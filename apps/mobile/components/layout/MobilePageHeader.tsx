import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

export function MobilePageHeader({
  title,
  backHref,
}: {
  title: string;
  backHref?: string;
}) {
  const router = useRouter();

  return (
    <View className="flex-row items-center border-b border-gray-100 px-4 py-3">
      <Pressable
        onPress={() => (backHref ? router.push(backHref as any) : router.back())}
        className="mr-3 p-1"
      >
        <Ionicons name="chevron-back" size={24} color="#000" />
      </Pressable>
      <Text className="text-lg font-semibold">{title}</Text>
    </View>
  );
}

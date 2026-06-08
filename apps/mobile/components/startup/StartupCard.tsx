import { Link } from "expo-router";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";
import type { Startup } from "@foundrly/shared";
import { urlForImage } from "@/lib/sanity";

export function StartupCard({ startup }: { startup: Startup }) {
  const imageUri = urlForImage(startup.image || "");

  return (
    <Link href={`/startup/${startup._id}` as any} asChild>
      <Pressable className="mb-4 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            className="h-48 w-full"
            contentFit="cover"
          />
        ) : (
          <View className="h-48 w-full bg-gray-200" />
        )}
        <View className="p-4">
          <Text className="text-lg font-bold">{startup.title}</Text>
          <Text className="mt-1 text-sm text-gray-600" numberOfLines={2}>
            {startup.description}
          </Text>
          <View className="mt-3 flex-row items-center justify-between">
            <Text className="rounded bg-secondary px-2 py-1 text-xs font-bold uppercase">
              {startup.category}
            </Text>
            <Text className="text-xs text-gray-500">
              {startup.views ?? 0} views
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

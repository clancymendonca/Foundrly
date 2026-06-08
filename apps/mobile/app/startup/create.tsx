import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { AppShell } from "@/components/layout/AppShell";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export default function CreateStartupScreen() {
  const { user, signIn } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [link, setLink] = useState("");
  const [pitch, setPitch] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch("/api/startups", {
        method: "POST",
        body: JSON.stringify({ title, description, category, link, pitch }),
      }),
    onSuccess: (data: any) => {
      Toast.show({ type: "success", text1: "Startup created!" });
      router.push(`/startup/${data._id}` as any);
    },
    onError: (e: Error) => {
      Toast.show({ type: "error", text1: e.message });
    },
  });

  if (!user) {
    return (
      <AppShell>
        <MobilePageHeader title="Create Startup" />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="mb-4 text-center">Sign in to create a startup</Text>
          <Pressable onPress={signIn} className="rounded-lg bg-primary px-6 py-3">
            <Text className="text-white">Login with GitHub</Text>
          </Pressable>
        </View>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <MobilePageHeader title="Create Startup" />
      <ScrollView className="flex-1 p-4 pb-24">
        {[
          { label: "Title", value: title, set: setTitle },
          { label: "Description", value: description, set: setDescription, multiline: true },
          { label: "Category", value: category, set: setCategory },
          { label: "Image URL", value: link, set: setLink },
          { label: "Pitch (Markdown)", value: pitch, set: setPitch, multiline: true },
        ].map((field) => (
          <View key={field.label} className="mb-4">
            <Text className="mb-1 font-medium">{field.label}</Text>
            <TextInput
              className="rounded-lg border border-gray-200 px-4 py-3"
              value={field.value}
              onChangeText={field.set}
              multiline={field.multiline}
              numberOfLines={field.multiline ? 4 : 1}
            />
          </View>
        ))}
        <Pressable
          onPress={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="mt-4 items-center rounded-lg bg-primary py-3"
        >
          {mutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-bold text-white">Create Startup</Text>
          )}
        </Pressable>
      </ScrollView>
    </AppShell>
  );
}

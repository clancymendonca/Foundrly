import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import type { Startup } from "@foundrly/shared";

export default function EditStartupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [link, setLink] = useState("");
  const [pitch, setPitch] = useState("");

  const { data: startup, isLoading } = useQuery({
    queryKey: ["startup", id],
    queryFn: () => apiFetch<Startup>(`/api/startups/${id}`),
  });

  useEffect(() => {
    if (startup) {
      setTitle(startup.title || "");
      setDescription(startup.description || "");
      setCategory(startup.category || "");
      setLink(startup.image || "");
      setPitch(startup.pitch || "");
    }
  }, [startup]);

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/startups/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title, description, category, link, pitch }),
      }),
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Startup updated" });
      router.back();
    },
    onError: (e: Error) => Toast.show({ type: "error", text1: e.message }),
  });

  if (isLoading) {
    return (
      <AppShell>
        <ActivityIndicator className="mt-8" color="#4E71FF" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <MobilePageHeader title="Edit Startup" backHref={`/startup/${id}`} />
      <ScrollView className="flex-1 p-4 pb-24">
        {[
          { label: "Title", value: title, set: setTitle },
          { label: "Description", value: description, set: setDescription, multiline: true },
          { label: "Category", value: category, set: setCategory },
          { label: "Image URL", value: link, set: setLink },
          { label: "Pitch", value: pitch, set: setPitch, multiline: true },
        ].map((field) => (
          <View key={field.label} className="mb-4">
            <Text className="mb-1 font-medium">{field.label}</Text>
            <TextInput
              className="rounded-lg border border-gray-200 px-4 py-3"
              value={field.value}
              onChangeText={field.set}
              multiline={field.multiline}
            />
          </View>
        ))}
        <Pressable
          onPress={() => mutation.mutate()}
          className="rounded-lg bg-primary py-3"
        >
          <Text className="text-center font-bold text-white">Save changes</Text>
        </Pressable>
      </ScrollView>
    </AppShell>
  );
}

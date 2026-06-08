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
import { screenStyles } from "@/lib/screen-styles";
import { theme } from "@/lib/theme";
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
        <ActivityIndicator style={screenStyles.loader} color={theme.primary} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <MobilePageHeader title="Edit Startup" backHref={`/startup/${id}`} />
      <ScrollView style={screenStyles.scroll} contentContainerStyle={screenStyles.scrollContent}>
        {[
          { label: "Title", value: title, set: setTitle },
          { label: "Description", value: description, set: setDescription, multiline: true },
          { label: "Category", value: category, set: setCategory },
          { label: "Image URL", value: link, set: setLink },
          { label: "Pitch", value: pitch, set: setPitch, multiline: true },
        ].map((field) => (
          <View key={field.label} style={screenStyles.field}>
            <Text style={screenStyles.label}>{field.label}</Text>
            <TextInput
              style={screenStyles.input}
              value={field.value}
              onChangeText={field.set}
              multiline={field.multiline}
            />
          </View>
        ))}
        <Pressable onPress={() => mutation.mutate()} style={screenStyles.primaryBtn}>
          <Text style={screenStyles.primaryBtnText}>Save changes</Text>
        </Pressable>
      </ScrollView>
    </AppShell>
  );
}

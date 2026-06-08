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
import { screenStyles } from "@/lib/screen-styles";
import { theme } from "@/lib/theme";

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
        <View style={screenStyles.center}>
          <Text style={{ marginBottom: 16, textAlign: "center" }}>
            Sign in to create a startup
          </Text>
          <Pressable onPress={signIn} style={screenStyles.primaryBtn}>
            <Text style={screenStyles.primaryBtnText}>Sign in</Text>
          </Pressable>
        </View>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <MobilePageHeader title="Create Startup" />
      <ScrollView style={screenStyles.scroll} contentContainerStyle={screenStyles.scrollContent}>
        {[
          { label: "Title", value: title, set: setTitle },
          { label: "Description", value: description, set: setDescription, multiline: true },
          { label: "Category", value: category, set: setCategory },
          { label: "Image URL", value: link, set: setLink },
          { label: "Pitch (Markdown)", value: pitch, set: setPitch, multiline: true },
        ].map((field) => (
          <View key={field.label} style={screenStyles.field}>
            <Text style={screenStyles.label}>{field.label}</Text>
            <TextInput
              style={screenStyles.input}
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
          style={[screenStyles.primaryBtn, { marginTop: 16 }]}
        >
          {mutation.isPending ? (
            <ActivityIndicator color={theme.white} />
          ) : (
            <Text style={screenStyles.primaryBtnText}>Create Startup</Text>
          )}
        </Pressable>
      </ScrollView>
    </AppShell>
  );
}

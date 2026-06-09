import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput } from "react-native";
import Toast from "react-native-toast-message";
import { AppShell } from "@/components/layout/AppShell";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { screenStyles } from "@/lib/screen-styles";

export default function SettingsScreen() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState("");

  const saveMutation = useMutation({
    mutationFn: () =>
      apiFetch("/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify({ name, bio }),
      }),
    onSuccess: async () => {
      await refreshUser();
      Toast.show({ type: "success", text1: "Profile updated" });
    },
    onError: (e: Error) => Toast.show({ type: "error", text1: e.message }),
  });

  return (
    <AppShell>
      <MobilePageHeader title="Settings" />
      <ScrollView style={screenStyles.scroll} contentContainerStyle={screenStyles.scrollContent}>
        <Text style={screenStyles.label}>Display name</Text>
        <TextInput style={screenStyles.input} value={name} onChangeText={setName} />
        <Text style={screenStyles.label}>Bio</Text>
        <TextInput
          style={[screenStyles.input, { marginBottom: 16 }]}
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={3}
        />
        <Pressable
          onPress={() => saveMutation.mutate()}
          style={screenStyles.primaryBtn}
        >
          <Text style={screenStyles.primaryBtnText}>Save changes</Text>
        </Pressable>
      </ScrollView>
    </AppShell>
  );
}

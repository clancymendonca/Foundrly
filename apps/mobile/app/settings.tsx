import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import Toast from "react-native-toast-message";
import { AppShell } from "@/components/layout/AppShell";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

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
      <ScrollView className="flex-1 p-4 pb-24">
        <Text className="mb-1 font-medium">Display name</Text>
        <TextInput
          className="mb-4 rounded-lg border border-gray-200 px-4 py-3"
          value={name}
          onChangeText={setName}
        />
        <Text className="mb-1 font-medium">Bio</Text>
        <TextInput
          className="mb-4 rounded-lg border border-gray-200 px-4 py-3"
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={3}
        />
        <Pressable
          onPress={() => saveMutation.mutate()}
          className="rounded-lg bg-primary py-3"
        >
          <Text className="text-center font-bold text-white">Save changes</Text>
        </Pressable>
      </ScrollView>
    </AppShell>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AppShell } from "@/components/layout/AppShell";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { StartupForm } from "@/components/startup/StartupForm";
import { apiFetch } from "@/lib/api-client";
import { screenStyles } from "@/lib/screen-styles";
import { theme } from "@/lib/theme";
import type { Startup } from "@foundrly/shared";

export default function EditStartupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: startup, isLoading } = useQuery({
    queryKey: ["startup", id],
    queryFn: () => apiFetch<Startup>(`/api/startups/${id}`),
  });

  if (isLoading || !startup) {
    return (
      <AppShell>
        <ActivityIndicator style={screenStyles.loader} color={theme.primary} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <View style={{ flex: 1 }}>
        <MobilePageHeader title="Edit Startup" backHref={`/startup/${id}`} />
        <StartupForm
          mode="edit"
          startupId={id}
          initialValues={{
            title: startup.title || "",
            description: startup.description || "",
            category: startup.category || "",
            link: startup.image || "",
            pitch: startup.pitch || "",
            buyMeACoffeeUsername: startup.buyMeACoffeeUsername || "",
            hasUploadedImage: Boolean(startup.image),
          }}
        />
      </View>
    </AppShell>
  );
}

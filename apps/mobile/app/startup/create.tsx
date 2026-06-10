import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppShell } from "@/components/layout/AppShell";
import { CreateHero } from "@/components/startup/CreateHero";
import { StartupForm } from "@/components/startup/StartupForm";
import { useAuth } from "@/lib/auth-context";
import { formStyles } from "@/lib/screen-styles";
import { theme } from "@/lib/theme";

export default function CreateStartupScreen() {
  const { user, signIn } = useAuth();

  if (!user) {
    return (
      <AppShell>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <CreateHero />
          <View style={formStyles.emptyState}>
            <Ionicons name="rocket-outline" size={56} color={theme.primary} />
            <Text style={formStyles.emptyStateTitle}>Sign in to create</Text>
            <Text style={formStyles.emptyStateSubtitle}>
              Log in to share your startup pitch with the Foundrly community.
            </Text>
            <Pressable
              onPress={signIn}
              style={[formStyles.submitBtn, { width: "100%", marginTop: 24 }]}
            >
              <Text style={formStyles.submitBtnText}>Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <StartupForm mode="create" header={<CreateHero />} />
    </AppShell>
  );
}

import { useLocalSearchParams } from "expo-router";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChatThread } from "@/components/chat/ChatThread";
import { normalizeRouteParam } from "@/lib/channel-routing";
import { theme } from "@/lib/theme";

export default function ChannelScreen() {
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const id = normalizeRouteParam(channelId);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ChatThread channelId={id} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.white },
});

import { AppShell } from "@/components/layout/AppShell";
import { NewMessageScreen } from "@/components/chat/NewMessageScreen";

export default function NewMessageRoute() {
  return (
    <AppShell>
      <NewMessageScreen />
    </AppShell>
  );
}

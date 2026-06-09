import { AppShell } from "@/components/layout/AppShell";
import { MessagesInbox } from "@/components/chat/MessagesInbox";

export default function MessagesIndexScreen() {
  return (
    <AppShell>
      <MessagesInbox />
    </AppShell>
  );
}

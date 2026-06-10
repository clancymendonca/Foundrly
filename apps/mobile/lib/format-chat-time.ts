function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getMessageDayKey(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  const day = startOfLocalDay(date);
  return `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
}

/** Center label for date separators in chat threads. */
export function formatMessageDateDivider(dateStr?: string | null): string {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const startOfToday = startOfLocalDay(now);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const messageDay = startOfLocalDay(date);

  if (messageDay.getTime() === startOfToday.getTime()) {
    return "Today";
  }

  if (messageDay.getTime() === startOfYesterday.getTime()) {
    return "Yesterday";
  }

  const diffDays = Math.floor(
    (startOfToday.getTime() - messageDay.getTime()) / 86400000,
  );
  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }

  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export function formatChatTime(dateStr?: string | null): string {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 6);

  if (date >= startOfToday) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (date >= startOfYesterday) {
    return "Yesterday";
  }

  if (date >= startOfWeek) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatLastSeen(dateStr?: string | Date | null): string | null {
  if (!dateStr) return null;

  const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Active now";
  if (diffMin < 60) return `Active ${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Active ${diffHours}h ago`;

  return `Active ${formatChatTime(date.toISOString())}`;
}

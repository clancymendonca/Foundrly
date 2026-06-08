export function formatDate(date?: string) {
  if (!date) return "Unknown date";
  const dateObj = new Date(date);
  const utcDate = new Date(
    Date.UTC(
      dateObj.getUTCFullYear(),
      dateObj.getUTCMonth(),
      dateObj.getUTCDate(),
    ),
  );
  return utcDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

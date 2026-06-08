"use client";
import { useEffect, useRef } from "react";

export default function EmojiPickerClient({ onEmojiClick }: { onEmojiClick: (emoji: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let picker: any;
    let handler: any;
    let isMounted = true;

    import("emoji-picker-element").then(() => {
      if (!isMounted) return;
      picker = ref.current?.querySelector("emoji-picker");
      if (picker) {
        handler = (e: any) => onEmojiClick(e.detail.unicode);
        picker.addEventListener("emoji-click", handler);
      }
    });

    return () => {
      isMounted = false;
      if (picker && handler) {
        picker.removeEventListener("emoji-click", handler);
      }
    };
  }, [onEmojiClick]);

  return (
    <div ref={ref} style={{ width: "100%" }}>
      <emoji-picker style={{ width: "100%" }}></emoji-picker>
    </div>
  );
} 
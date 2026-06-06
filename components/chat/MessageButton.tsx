"use client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import React, { useState } from "react";
import ChatController from "./ChatController";
import { useSession } from "next-auth/react";

interface MessageButtonProps {
  profileId: string;
}

export default function MessageButton({ profileId }: MessageButtonProps) {
  const [open, setOpen] = useState(false);
  const [initialChatId, setInitialChatId] = useState<string | null>(null);
  const session = useSession();
  const currentUserId = session.data?.user?.id;
  if (!currentUserId || currentUserId === profileId) return null;
  return (
    <>
    <div className="flex justify-center mt-4">
      <Button
        variant="default"
        className={`transition-all duration-150 rounded-full px-3 py-3 shadow-md font-semibold flex items-center gap-2 text-base border-[5px] border-black bg-white text-black hover:bg-primary-100 hover:text-primary`}
        style={{ minWidth: 120 }}
          onClick={() => {
            toast({ title: "Opening messages..." });
            setInitialChatId(profileId);
            setOpen(true);
          }}
      >
        Message
      </Button>
    </div>
      <ChatController
        isOpen={open}
        onClose={() => setOpen(false)}
        currentUserId={currentUserId}
        initialChatId={initialChatId}
      />
    </>
  );
} 
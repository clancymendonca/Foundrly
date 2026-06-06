"use client";

import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import DeleteStartupButton from "./DeleteStartupButton";

interface StartupDetailActionsProps {
  startupId: string;
  startupTitle: string;
  userId: string;
  isOwner: boolean;
}

const StartupDetailActions = ({ 
  startupId, 
  startupTitle, 
  userId, 
  isOwner 
}: StartupDetailActionsProps) => {
  if (!isOwner) return null;

  return (
    <div className="action-buttons mt-5">
      <Button 
        className="edit-btn"
        asChild
      >
        <Link href={`/startup/${startupId}/edit`}>
          <Edit className="h-4 w-4" />
          Edit
        </Link>
      </Button>
      
      <DeleteStartupButton 
        startupId={startupId} 
        startupTitle={startupTitle} 
        userId={userId}
      />
    </div>
  );
};

export default StartupDetailActions; 
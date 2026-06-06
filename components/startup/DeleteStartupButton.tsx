"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { deletePitch } from "@/lib/actions";

interface DeleteStartupButtonProps {
  startupId: string;
  startupTitle: string;
  userId: string;
  iconOnly?: boolean;
}

const DeleteStartupButton = ({ startupId, startupTitle, userId, iconOnly = false }: DeleteStartupButtonProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${startupTitle}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    
    try {
      const result = await deletePitch(startupId);
      
      if (result.status === "SUCCESS") {
        toast({
          title: "Success",
          description: "Startup deleted successfully",
        });
        
        // Redirect to user profile page
        router.push(`/user/${userId}`);
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete startup",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      onClick={handleDelete}
      disabled={isDeleting}
      className={iconOnly ? "delete-btn p-2 h-9 w-9" : "delete-btn"}
      aria-label="Delete"
    >
      <Trash2 className={iconOnly ? "h-5 w-5" : "h-4 w-4"} />
      {!iconOnly && (isDeleting ? "Deleting..." : "Delete")}
    </Button>
  );
};

export default DeleteStartupButton; 
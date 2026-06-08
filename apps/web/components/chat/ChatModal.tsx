import React, { useEffect } from "react";
import { createPortal } from "react-dom";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[92vh] flex flex-col overflow-hidden relative animate-fade-in mr-8"
      >
        <div className="flex-1 flex flex-col h-full w-full">
          {children}
        </div>
      </div>
    </div>,
    typeof window !== "undefined" && document.body ? document.body : document.createElement("div")
  );
};

export default ChatModal; 
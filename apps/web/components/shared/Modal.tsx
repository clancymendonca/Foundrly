import React, { useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  panel?: boolean; // If true, use Pinterest-style panel
  wide?: boolean; // If true, use wider modal for forms
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, panel, wide }) => {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={
          panel
            ? "bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl h-[80vh] flex flex-col overflow-hidden p-0 relative animate-fade-in"
            : wide
            ? "bg-white rounded-[22px] shadow-200 border-[5px] border-black max-w-full w-full sm:w-[600px] md:w-[800px] lg:w-[1000px] xl:w-[1200px] relative animate-fade-in max-h-[90vh] overflow-y-auto"
            : "bg-white rounded-[22px] shadow-200 border-[5px] border-black max-w-full w-full sm:w-[400px] p-6 relative animate-fade-in"
        }
      >
        {children}
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
          onClick={onClose}
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>,
    typeof window !== "undefined" && document.body ? document.body : document.createElement("div")
  );
};

export default Modal; 
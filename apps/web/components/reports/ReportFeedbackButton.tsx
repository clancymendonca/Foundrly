"use client";

import * as Sentry from "@sentry/nextjs";
import { useSession } from "next-auth/react";

interface ReportFeedbackButtonProps {
  label?: string;
  className?: string;
}

export default function ReportFeedbackButton({ label = "Open Sentry Feedback", className }: ReportFeedbackButtonProps) {
  const { data: session } = useSession();

  const openFeedback = () => {
    if (session?.user) {
      Sentry.setUser({
        id: session.user.id as string,
        email: (session.user as any).email,
        username: (session.user as any).name,
      });
    }
    const anySentry = Sentry as any;
    if (typeof anySentry.feedback === "function") {
      anySentry.feedback({ showForm: true });
    } else if (typeof anySentry.showReportDialog === "function") {
      anySentry.captureMessage("User opened feedback dialog");
      anySentry.showReportDialog();
    }
  };

  return (
    <button type="button" onClick={openFeedback} className={className}>
      {label}
    </button>
  );
}

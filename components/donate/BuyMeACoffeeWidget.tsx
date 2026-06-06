"use client";

import { useEffect } from 'react';

interface BuyMeACoffeeWidgetProps {
  username: string;
  description?: string;
  message?: string;
  color?: string;
  position?: 'Left' | 'Right';
  xMargin?: number;
  yMargin?: number;
}

export default function BuyMeACoffeeWidget({
  username,
  description = "Support Foundrly",
  message = "Thank you for supporting Foundrly! Your contribution helps us keep building amazing features for the startup community.",
  color = "#4E71FF",
  position = "Right",
  xMargin = 18,
  yMargin = 18
}: BuyMeACoffeeWidgetProps) {
  useEffect(() => {
    // Load Buy Me a Coffee widget script
    const script = document.createElement('script');
    script.setAttribute('data-name', 'BMC-Widget');
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js';
    script.setAttribute('data-id', username);
    script.setAttribute('data-description', description);
    script.setAttribute('data-message', message);
    script.setAttribute('data-color', color);
    script.setAttribute('data-position', position);
    script.setAttribute('data-x_margin', xMargin.toString());
    script.setAttribute('data-y_margin', yMargin.toString());
    
    document.head.appendChild(script);

    return () => {
      // Cleanup script when component unmounts
      const existingScript = document.querySelector('script[data-name="BMC-Widget"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [username, description, message, color, position, xMargin, yMargin]);

  return null; // This component doesn't render anything visible
} 
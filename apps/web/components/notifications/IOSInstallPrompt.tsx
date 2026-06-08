'use client';

import { useState, useEffect } from 'react';

export default function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if app is already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Show prompt for iOS users who haven't installed the app
    if (iOS && !standalone) {
      // Check if user has previously dismissed the prompt
      const dismissed = localStorage.getItem('ios-install-prompt-dismissed');
      if (!dismissed) {
        // Show prompt after a delay
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleInstall = () => {
    // Instructions for iOS users
    setShowPrompt(false);
    localStorage.setItem('ios-install-prompt-dismissed', 'true');
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('ios-install-prompt-dismissed', 'true');
  };

  if (!showPrompt || !isIOS || isStandalone) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm mx-auto">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900">
            Install Foundrly
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Add to your home screen for push notifications and a better experience.
          </p>
          <div className="mt-2 flex space-x-2">
            <button
              onClick={handleInstall}
              className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}


"use client";

import BuyMeACoffeeWidget from '@/components/donate/BuyMeACoffeeWidget';
import BuyMeACoffeeButton from '@/components/donate/BuyMeACoffeeButton';

export default function DonatePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-3xl font-bold mb-4">Support Foundrly</h1>
      <p className="text-gray-600 mb-8 text-center max-w-md">
        Help us keep Foundrly free and continue building amazing features for the startup community.
      </p>
      
      {/* Buy Me a Coffee Widget */}
      <BuyMeACoffeeWidget 
        username="YOUR_BUY_ME_A_COFFEE_USERNAME"
        description="Support Foundrly"
        message="Thank you for supporting Foundrly! Your contribution helps us keep building amazing features for the startup community."
        color="#4E71FF"
        position="Right"
        xMargin={18}
        yMargin={18}
      />
      
      {/* Alternative: Direct link to Buy Me a Coffee */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 mb-4">Or visit our Buy Me a Coffee page directly:</p>
        <BuyMeACoffeeButton username="YOUR_USERNAME" className="px-6 py-3 text-lg">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 12a2 2 0 114 0 2 2 0 01-4 0z"/>
          </svg>
          Buy Me a Coffee
        </BuyMeACoffeeButton>
      </div>
    </div>
  );
} 
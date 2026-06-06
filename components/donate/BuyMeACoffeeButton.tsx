interface BuyMeACoffeeButtonProps {
  username: string;
  className?: string;
  children?: React.ReactNode;
}

export default function BuyMeACoffeeButton({ 
  username, 
  className = "",
  children 
}: BuyMeACoffeeButtonProps) {
  return (
    <a 
      href={`https://buymeacoffee.com/${username}`}
      target="_blank" 
      rel="noopener noreferrer"
      className={`inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors ${className}`}
    >
      {children || (
        <>
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 12a2 2 0 114 0 2 2 0 01-4 0z"/>
          </svg>
          Buy Me a Coffee
        </>
      )}
    </a>
  );
} 
import Image from 'next/image';
import { Heart, MessageCircle, Flag } from 'lucide-react';
import Link from 'next/link';

interface StartupData {
  _id: string;
  title: string;
  slug: { current: string };
  _createdAt: string;
  author: {
    _id: string;
    name: string;
    image?: string;
    bio?: string;
  };
  views: number;
  description: string;
  category: string;
  image?: string;
  likes: number;
  dislikes: number;
  commentsCount: number;
  activityType: string;
  userComments?: Array<{
    _id: string;
    text: string;
    createdAt: string;
    likes: number;
    dislikes: number;
  }>;
  userReports?: Array<{
    _id: string;
    reason: string;
    timestamp: string;
    status: string;
  }>;
}

type ActivityGridItemProps = {
  startup: StartupData;
  activityType: string;
};

const ActivityGridItem = ({ startup, activityType }: ActivityGridItemProps) => {
  const getActivityIcon = () => {
    switch (activityType) {
      case 'likes':
        return <Heart className="absolute top-2 right-2 h-5 w-5 text-red-500 drop-shadow-lg fill-current" />;
      case 'comments':
        return <MessageCircle className="absolute top-2 right-2 h-5 w-5 text-blue-500 drop-shadow-lg" />;
      case 'reviews':
        return <Flag className="absolute top-2 right-2 h-5 w-5 text-orange-500 drop-shadow-lg" />;
      default:
        return null;
    }
  };

  const getImageUrl = () => {
    if (startup.image) {
      return startup.image;
    }
    // Fallback to a placeholder based on the startup title
    return `https://picsum.photos/seed/${startup._id}/300/300`;
  };

  // Use _id for the URL since the startup page expects an ID parameter
  const getStartupUrl = () => {
    return `/startup/${startup._id}`;
  };

  return (
    <Link href={getStartupUrl()} className="block">
      <div className="relative aspect-square group cursor-pointer transform transition-transform duration-200 hover:scale-105">
        <Image
          src={getImageUrl()}
          alt={startup.title}
          fill={true}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover rounded-sm"
        />
        {getActivityIcon()}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 rounded-sm"></div>
        
        {/* Activity indicator overlay */}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
          {activityType === 'likes' && 'Liked'}
          {activityType === 'comments' && `${startup.userComments?.length || 0} comments`}
          {activityType === 'reviews' && `${startup.userReports?.length || 0} reports`}
        </div>
        
        {/* Startup title on hover */}
        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 max-w-[calc(100%-1rem)] truncate">
          {startup.title}
        </div>
      </div>
    </Link>
  );
};

export default ActivityGridItem;

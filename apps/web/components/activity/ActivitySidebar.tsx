'use client';

import {
  RotateCcw,
  Calendar,
  Megaphone,
  User,
  FileText,
  Image,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';

interface ActivitySidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navItems = [
  {
    id: 'interactions',
    icon: RotateCcw,
    title: 'Interactions',
    description: 'Review and delete likes, comments, and your other interactions.',
  },
  {
    id: 'account-history',
    icon: Calendar,
    title: 'Account History',
    description: "Review changes you've made to your account since you created it.",
  },
  {
    id: 'ad-activity',
    icon: Megaphone,
    title: 'Ad Activity',
    description: "See which ads you've interacted with recently.",
  },
];

const ActivitySidebar = ({ activeSection, onSectionChange }: ActivitySidebarProps) => {
  // Debug: Check if props are received correctly
  console.log('ActivitySidebar props:', { activeSection, onSectionChange: typeof onSectionChange });

  const handleSectionChange = (sectionId: string) => {
    console.log('Section change requested:', sectionId);
    if (typeof onSectionChange === 'function') {
      onSectionChange(sectionId);
    } else {
      console.error('onSectionChange is not a function:', onSectionChange);
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-96 bg-white p-8 border-r border-gray-200 pt-20 h-full overflow-y-auto scrollbar-hide flex-shrink-0">
      <h1 className="text-2xl font-bold mb-10">Your Activity</h1>
      <nav>
        <ul>
          {navItems.map((item) => (
            <li key={item.id} className="mb-8">
              <button
                onClick={() => handleSectionChange(item.id)}
                className={`w-full text-left flex items-start space-x-4 group transition-colors ${
                  activeSection === item.id ? 'text-primary' : 'text-gray-700 hover:text-primary'
                }`}
              >
                <item.icon className={`h-6 w-6 mt-1 transition-colors ${
                  activeSection === item.id ? 'text-primary' : 'text-gray-500 group-hover:text-primary'
                }`} />
                <div>
                  <h2 className={`font-semibold transition-colors ${
                    activeSection === item.id ? 'text-primary' : 'text-gray-900 group-hover:text-primary'
                  }`}>
                    {item.title}
                  </h2>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default ActivitySidebar;

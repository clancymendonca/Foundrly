'use client';

import {
  Bookmark,
  Heart,
  User,
} from 'lucide-react';

interface SavedSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navItems = [
  {
    id: 'saved-startups',
    icon: Bookmark,
    title: 'Saved Startups',
    description: 'Review and manage your saved startup pitches.',
  },
  {
    id: 'saved-users',
    icon: User,
    title: 'Saved Users',
    description: 'Manage your saved user profiles.',
  },
];

const SavedSidebar = ({ activeSection, onSectionChange }: SavedSidebarProps) => {
  const handleSectionChange = (sectionId: string) => {
    if (typeof onSectionChange === 'function') {
      onSectionChange(sectionId);
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-96 bg-white p-8 border-r border-gray-200 h-full overflow-y-auto scrollbar-hide flex-shrink-0">
      <h1 className="text-2xl font-bold mb-10">Your Saved Items</h1>
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

export default SavedSidebar;

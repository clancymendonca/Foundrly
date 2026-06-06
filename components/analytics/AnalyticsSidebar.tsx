'use client';

import { 
  BarChart3,
  Users,
} from 'lucide-react';

interface AnalyticsSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  heading?: string;
}

const navItems = [
  {
    id: 'startup-analytics',
    icon: BarChart3,
    title: 'Startup Analytics',
    description: 'Performance metrics for your startups.'
  },
  {
    id: 'engagement-audience',
    icon: Users,
    title: 'Engagement & Network',
    description: 'Explore startups by categories and track your follower network growth.'
  },
];

const AnalyticsSidebar = ({ activeSection, onSectionChange, heading }: AnalyticsSidebarProps) => {
  const handleSectionChange = (sectionId: string) => {
    if (typeof onSectionChange === 'function') {
      onSectionChange(sectionId);
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-96 bg-white p-8 border-r border-gray-200 h-full overflow-y-auto scrollbar-hide flex-shrink-0">
      <h1 className="text-2xl font-bold mb-10">{heading || 'Your Analytics'}</h1>
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

export default AnalyticsSidebar;

import { Menu, Settings, User } from 'lucide-react';
import { useSidebar } from '@/hooks/use-sidebar';
import { useMobile } from '@/hooks/use-mobile';

interface HeaderProps {
  onSettingsClick?: () => void;
  username?: string;
}

export default function Header({ onSettingsClick, username = 'User' }: HeaderProps) {
  const { toggleSidebar } = useSidebar();
  const isMobile = useMobile();
  
  // Get initials from username
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="flex items-center justify-between p-4 border-b bg-white">
      <div className="flex items-center space-x-2">
        {isMobile && (
          <button 
            onClick={toggleSidebar}
            className="text-gray-600 hover:text-gray-800 mr-2"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="text-lg font-semibold">Multi-Channel Platform</div>
      </div>
      <div className="flex items-center space-x-3">
        <button 
          onClick={onSettingsClick} 
          className="text-gray-600 hover:text-gray-800"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
        <div className="h-8 w-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-sm font-medium">
          {getInitials(username)}
        </div>
      </div>
    </header>
  );
}

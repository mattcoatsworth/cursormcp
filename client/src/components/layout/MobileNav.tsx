import { Menu, MessageSquare, Settings, BarChart3 } from 'lucide-react';
import { useSidebar } from '@/hooks/use-sidebar';

export default function MobileNav() {
  const { toggleSidebar } = useSidebar();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-4 py-3 flex justify-around">
      <button 
        onClick={toggleSidebar}
        className="flex flex-col items-center justify-center text-slate-400 hover:text-white"
      >
        <Menu className="h-6 w-6" />
        <span className="text-xs mt-1">Menu</span>
      </button>
      
      <button className="flex flex-col items-center justify-center text-blue-500 hover:text-blue-400">
        <MessageSquare className="h-6 w-6" />
        <span className="text-xs mt-1">Chat</span>
      </button>
      
      <button className="flex flex-col items-center justify-center text-slate-400 hover:text-white">
        <Settings className="h-6 w-6" />
        <span className="text-xs mt-1">Settings</span>
      </button>
      
      <button className="flex flex-col items-center justify-center text-slate-400 hover:text-white">
        <BarChart3 className="h-6 w-6" />
        <span className="text-xs mt-1">Analytics</span>
      </button>
    </div>
  );
}

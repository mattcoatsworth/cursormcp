import { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { useMobile } from './use-mobile';

interface SidebarContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  showSidebar: () => void;
  hideSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useMobile();

  // On desktop, sidebar is always open
  const effectiveSidebarOpen = isMobile ? isSidebarOpen : true;

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const showSidebar = useCallback(() => {
    setIsSidebarOpen(true);
  }, []);

  const hideSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isSidebarOpen: effectiveSidebarOpen,
        toggleSidebar,
        showSidebar,
        hideSidebar
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
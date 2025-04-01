import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import EcommerceDashboard from './EcommerceDashboard';

interface DashboardProps {
  onClose: () => void;
}

export default function Dashboard({ onClose }: DashboardProps) {
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Console log when dashboard mounts and unmounts
  useEffect(() => {
    console.log("Dashboard component mounted");
    return () => {
      console.log("Dashboard component unmounted");
    };
  }, []);

  // Close dashboard when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dashboardRef.current && !dashboardRef.current.contains(event.target as Node)) {
        console.log("Click outside dashboard detected");
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4" onClick={() => onClose()}>
      <div 
        ref={dashboardRef}
        className="w-full max-w-4xl bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-700 px-2">
            Dashboard
          </h3>
          <button 
            onClick={onClose}
            className="flex items-center justify-center rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close dashboard"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-4">
          <EcommerceDashboard />
        </div>
      </div>
    </div>
  );
}
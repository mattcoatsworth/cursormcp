import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type ApiConnection } from "@shared/schema";

interface SidebarProps {
  connections: ApiConnection[];
  isLoading: boolean;
  onToggleConnection: (id: number, isConnected: boolean) => void;
}

export default function Sidebar({ connections, isLoading, onToggleConnection }: SidebarProps) {
  return (
    <aside className="w-72 bg-white border-r border-gray-200 hidden md:flex md:flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Connected APIs</h2>
      </div>
      
      {/* API Connection Status List */}
      <div className="overflow-y-auto flex-1">
        <ul className="p-2 space-y-1">
          {isLoading ? (
            // Loading skeletons
            Array(7).fill(0).map((_, i) => (
              <li key={i} className="p-2 rounded flex items-center justify-between transition-colors">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-6 w-20" />
              </li>
            ))
          ) : (
            // API connections
            connections.map((connection) => (
              <li key={connection.id} className="p-2 rounded hover:bg-gray-100 flex items-center justify-between transition-colors">
                <div className="flex items-center">
                  <span className={`text-sm before:content-[''] before:inline-block before:w-2 before:h-2 before:rounded-full before:mr-1.5 ${connection.isConnected ? 'before:bg-green-500' : 'before:bg-red-500'}`}>
                    {connection.name}
                  </span>
                </div>
                <div 
                  className={`text-xs px-2 py-1 rounded-full ${
                    connection.isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  } cursor-pointer`}
                  onClick={() => onToggleConnection(connection.id, connection.isConnected)}
                >
                  {connection.isConnected ? 'Connected' : 'Disconnected'}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
      
      <div className="p-4 border-t border-gray-200 space-y-2">
        <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Connect New API
        </Button>
        <Button variant="ghost" className="w-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          View Documentation
        </Button>
      </div>
    </aside>
  );
}

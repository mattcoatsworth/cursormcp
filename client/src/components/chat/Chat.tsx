import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage as IChatMessage, ChatMessageWithStringId, ApiConnection } from '@shared/schema';
import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';
import CommandShortcutMenu from './CommandShortcutMenu';
import Dashboard from '../dashboard/Dashboard';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatProps {
  messages: ChatMessageWithStringId[];
  isLoading: boolean;
  isPending: boolean;
  onSendMessage: (text: string) => void;
  apiConnections?: ApiConnection[];
}

type TaskStepStatus = 'pending' | 'in-progress' | 'completed' | 'error';

interface TaskStep {
  id: string;
  label: string;
  status: TaskStepStatus;
}

interface TaskProgressState {
  progress: number;
  currentStep: number;
  steps: TaskStep[];
  statusText: string;
  completed: boolean;
}

export default function Chat({ messages, isLoading, isPending, onSendMessage, apiConnections = [] }: ChatProps) {
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [currentInputValue, setCurrentInputValue] = useState('');
  const [taskProgress, setTaskProgress] = useState<TaskProgressState>({
    progress: 0,
    currentStep: 0,
    steps: [
      { id: 'analyze', label: 'Analyzing your command', status: 'pending' },
      { id: 'services', label: 'Identifying services to call', status: 'pending' },
      { id: 'process', label: 'Processing command', status: 'pending' }
    ],
    statusText: 'Starting...',
    completed: false
  });
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Track if this is the first time we're seeing isPending become true
  const isPendingRef = useRef(false);
  
  // Add effect to log the dashboard state changes
  useEffect(() => {
    console.log("Dashboard visibility changed:", showDashboard);
  }, [showDashboard]);
  
  // Enhanced progress animation management with better state control
  useEffect(() => {
    // Create a reference to store timeouts that we can clear
    const timeoutIds: NodeJS.Timeout[] = [];
    
    // When isPending becomes true (command starts executing)
    if (isPending && !isPendingRef.current) {
      console.log("Command execution started - initializing progress display");
      // Mark that we're now in pending state
      isPendingRef.current = true;
      
      // Extract service names from input to customize the message
      const inputText = currentInputValue.toLowerCase();
      const mentionedServices = [];
      
      if (inputText.includes('shopify')) mentionedServices.push('Shopify');
      if (inputText.includes('klaviyo')) mentionedServices.push('Klaviyo');
      if (inputText.includes('slack')) mentionedServices.push('Slack');
      if (inputText.includes('notion')) mentionedServices.push('Notion');
      if (inputText.includes('triplewhale')) mentionedServices.push('Triple Whale');
      if (inputText.includes('gorgias')) mentionedServices.push('Gorgias');
      if (inputText.includes('postscript')) mentionedServices.push('Postscript');
      if (inputText.includes('recharm')) mentionedServices.push('Recharm');
      
      // Construct status message based on services
      let statusMessage = 'Processing your command';
      if (mentionedServices.length > 0) {
        statusMessage = `Processing command for ${mentionedServices.join(' and ')}`;
      }
      
      // Initialize with first step active
      setTaskProgress({
        progress: 10, // Start with visible progress 
        currentStep: 0,
        statusText: 'Analyzing your command',
        steps: [
          { id: 'analyze', label: 'Analyzing your command', status: 'in-progress' },
          { id: 'services', label: 'Identifying services to call', status: 'pending' },
          { id: 'process', label: statusMessage, status: 'pending' },
        ],
        completed: false
      });
      
      // Step 1: Move to analyzing state (After 800ms)
      timeoutIds.push(setTimeout(() => {
        if (isPending) { // Only update if we're still pending
          console.log("Progress step 1: Analyzing command");
          setTaskProgress(prev => ({
            ...prev,
            progress: 30,
            currentStep: 1,
            statusText: 'Identifying services to call',
            steps: [
              { id: 'analyze', label: 'Analyzing your command', status: 'completed' },
              { id: 'services', label: 'Identifying services to call', status: 'in-progress' },
              { id: 'process', label: statusMessage, status: 'pending' },
            ],
            completed: false
          }));
        }
      }, 800));
      
      // Step 2: Move to processing state (After 1.5s total)
      timeoutIds.push(setTimeout(() => {
        if (isPending) { // Only update if we're still pending
          console.log("Progress step 2: Identifying services");
          setTaskProgress(prev => ({
            ...prev,
            progress: 60,
            currentStep: 2,
            statusText: statusMessage,
            steps: [
              { id: 'analyze', label: 'Analyzing your command', status: 'completed' },
              { id: 'services', label: 'Identifying services to call', status: 'completed' },
              { id: 'process', label: statusMessage, status: 'in-progress' },
            ],
            completed: false
          }));
        }
      }, 1500));
      
      // Step 3: Move to nearly complete state if still pending after 4s
      // This ensures progress appears to continue even for longer operations
      timeoutIds.push(setTimeout(() => {
        if (isPending) { // Only update if still running
          console.log("Progress step 3: Advancing progress for long-running operation");
          setTaskProgress(prev => ({
            ...prev,
            progress: 85, // Almost done but not quite
            currentStep: 2,
            statusText: statusMessage,
            steps: [
              { id: 'analyze', label: 'Analyzing your command', status: 'completed' },
              { id: 'services', label: 'Identifying services to call', status: 'completed' },
              { id: 'process', label: statusMessage, status: 'in-progress' },
            ],
            completed: false
          }));
        }
      }, 4000));
      
    // When isPending becomes false (command finished executing)
    } else if (!isPending && isPendingRef.current) {
      console.log("Command execution completed - finalizing progress display");
      
      // Cancel any pending timeouts to prevent further animation steps
      timeoutIds.forEach(id => clearTimeout(id));
      
      // Reset the pending reference immediately
      isPendingRef.current = false;
      
      // Set to 100% completed with all steps marked complete
      setTaskProgress(prev => ({
        ...prev,
        progress: 100, // Force to 100%
        currentStep: 3, // Final step
        steps: prev.steps.map(step => ({ ...step, status: 'completed' })),
        statusText: 'Completed',
        completed: true
      }));
      
      // After showing completion state for a moment, reset the progress display
      timeoutIds.push(setTimeout(() => {
        console.log("Resetting progress display after completion");
        setTaskProgress({
          progress: 0,
          currentStep: 0,
          statusText: 'Starting...',
          steps: [
            { id: 'analyze', label: 'Analyzing your command', status: 'pending' },
            { id: 'services', label: 'Identifying services to call', status: 'pending' },
            { id: 'process', label: 'Processing command', status: 'pending' },
          ],
          completed: false
        });
      }, 1800)); // Keep completion state visible a bit longer
    }
    
    // Clean up all timeouts when component unmounts or when isPending changes
    return () => {
      console.log("Cleaning up progress animation timeouts:", timeoutIds.length);
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, [isPending, currentInputValue]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle the "+" button click from the MessageInput
  const handleCommandMenuToggle = (show: boolean) => {
    console.log("handleCommandMenuToggle called with show =", show);
    setShowCommandMenu(show);
  };

  // Callback for handling command selection - append to existing text instead of replacing
  const handleCommandSelect = (command: string) => {
    console.log("Command selected:", command);
    
    // Append the command to the existing text with proper spacing
    const currentText = currentInputValue.trim();
    
    // Determine how to join the existing text and the new command
    let newText;
    if (currentText === '') {
      // If empty, just use the command
      newText = command;
    } else if (currentText.endsWith(' ')) {
      // If already ends with space, just append
      newText = currentText + command;
    } else {
      // Add a space before the new command
      newText = currentText + ' ' + command;
    }
    
    setCurrentInputValue(newText);
    setShowCommandMenu(false);
    
    // Focus the input after setting the command
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        
        // Move cursor to the end
        const inputElement = inputRef.current;
        const length = newText.length;
        inputElement.setSelectionRange(length, length);
      }
    }, 50);
  };
  
  // Log showCommandMenu state changes
  useEffect(() => {
    console.log("showCommandMenu state changed to:", showCommandMenu);
  }, [showCommandMenu]);

  // Console log to help debug
  console.log('Chat component rendering with messages:', messages.length);

  return (
    <main className="flex-1 flex flex-col bg-white overflow-hidden h-full">
      {/* Command Shortcut Menu - Now moved outside the chat history container */}
      {showCommandMenu && (
        <div className="relative z-50">
          <CommandShortcutMenu
            onSelectCommand={handleCommandSelect}
            onClose={() => setShowCommandMenu(false)}
            apiConnections={apiConnections}
          />
        </div>
      )}
      
      {/* Main Content */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 relative flex flex-col" 
        id="chat-history"
      >
        {messages.length === 0 && !isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-2xl font-medium mb-6">What can I help with?</h1>
          </div>
        )}
        
        <div className="max-w-3xl mx-auto space-y-6 w-full">
          {isLoading ? (
            // Loading skeleton
            Array(3).fill(0).map((_, i) => (
              <div key={i} className={`flex items-start ${i % 2 === 0 ? 'space-x-3' : 'justify-end space-x-3'}`}>
                {i % 2 === 0 && <Skeleton className="h-10 w-10 rounded-full" />}
                <Skeleton className="h-32 w-64 rounded-lg" />
                {i % 2 !== 0 && <Skeleton className="h-10 w-10 rounded-full" />}
              </div>
            ))
          ) : (
            // Message list
            messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}
          
          {/* Completely reimagined processing dialog with modern terminal-like interface */}
          {isPending && (
            <div className="flex items-start mb-4">
              <div className="w-full">
                <div className="w-full bg-gray-900 rounded-lg overflow-hidden shadow-xl border border-gray-800 max-w-xl mx-auto">
                  {/* Terminal header */}
                  <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                      <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                      <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                      MCP Command Processing
                    </div>
                    <div className="text-xs text-gray-400">
                      {taskProgress.completed ? 'Done' : 'Running'}
                    </div>
                  </div>
                  
                  {/* Terminal body */}
                  <div className="p-4 font-mono text-sm">
                    {/* Command that was executed */}
                    <div className="flex items-start mb-3">
                      <span className="text-green-400 mr-2">$</span>
                      <span className="text-white">{currentInputValue || "Processing command..."}</span>
                    </div>
                    
                    {/* Live command output simulation */}
                    <div className="space-y-1 mb-4">
                      {taskProgress.currentStep >= 0 && (
                        <div className="text-gray-300">
                          <span className="text-blue-400">➜</span> {!taskProgress.completed && taskProgress.currentStep === 0 ? (
                            <span className="flex items-center">
                              <span>Analyzing request</span>
                              <span className="ml-2 flex items-center h-4">
                                <span className="h-1 w-1 bg-gray-400 rounded-full mx-px animate-ping"></span>
                                <span className="h-1 w-1 bg-gray-400 rounded-full mx-px animate-ping" style={{animationDelay: '0.2s'}}></span>
                                <span className="h-1 w-1 bg-gray-400 rounded-full mx-px animate-ping" style={{animationDelay: '0.4s'}}></span>
                              </span>
                            </span>
                          ) : (
                            <span>
                              {taskProgress.completed ? (
                                <span className="text-green-400">Request analyzed successfully</span>
                              ) : (
                                <span>Request analyzed</span>
                              )}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {taskProgress.currentStep >= 1 && (
                        <div className="text-gray-300">
                          <span className="text-yellow-400">➜</span> {!taskProgress.completed && taskProgress.currentStep === 1 ? (
                            <span className="flex items-center">
                              <span>Connecting to services</span>
                              <span className="ml-2 flex items-center h-4">
                                <span className="h-1 w-1 bg-gray-400 rounded-full mx-px animate-ping"></span>
                                <span className="h-1 w-1 bg-gray-400 rounded-full mx-px animate-ping" style={{animationDelay: '0.2s'}}></span>
                                <span className="h-1 w-1 bg-gray-400 rounded-full mx-px animate-ping" style={{animationDelay: '0.4s'}}></span>
                              </span>
                            </span>
                          ) : (
                            <span>
                              {taskProgress.completed ? (
                                <span className="text-green-400">Services connected successfully</span>
                              ) : (
                                <span>Services connected</span>
                              )}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {taskProgress.currentStep >= 2 && (
                        <div className="text-gray-300">
                          <span className="text-purple-400">➜</span> {!taskProgress.completed && taskProgress.currentStep === 2 ? (
                            <span className="flex items-center">
                              <span>Executing command</span>
                              <span className="ml-2 flex items-center h-4">
                                <span className="h-1 w-1 bg-gray-400 rounded-full mx-px animate-ping"></span>
                                <span className="h-1 w-1 bg-gray-400 rounded-full mx-px animate-ping" style={{animationDelay: '0.2s'}}></span>
                                <span className="h-1 w-1 bg-gray-400 rounded-full mx-px animate-ping" style={{animationDelay: '0.4s'}}></span>
                              </span>
                            </span>
                          ) : (
                            <span>
                              {taskProgress.completed ? (
                                <span className="text-green-400">Command executed successfully</span>
                              ) : (
                                <span>Command executed</span>
                              )}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {taskProgress.completed && (
                        <div className="text-green-400 mt-2">
                          <span>✓</span> Operation completed in {Math.floor(Math.random() * 3) + 1}.{Math.floor(Math.random() * 9)}s
                        </div>
                      )}
                    </div>
                    
                    {/* Terminal loading animation */}
                    {!taskProgress.completed && (
                      <div className="h-1 w-full relative mt-1 mb-2 rounded-full overflow-hidden bg-gray-800">
                        <div className="animate-pulse absolute inset-0 flex opacity-20">
                          <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 w-full"></div>
                        </div>
                        <div 
                          className="absolute h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out" 
                          style={{ width: `${taskProgress.progress}%` }}
                        />
                      </div>
                    )}
                    
                    {/* Memory allocation animation */}
                    {!taskProgress.completed && (
                      <div className="text-xs text-gray-500 mt-2">
                        <span className="text-gray-400">Memory:</span>{" "}
                        <span className="text-blue-400">{64 + Math.floor(taskProgress.progress / 2)}MB</span> | 
                        <span className="text-gray-400"> CPU:</span>{" "}
                        <span className="text-purple-400">{Math.floor(20 + taskProgress.progress / 1.5)}%</span> |
                        <span className="text-gray-400"> Time:</span>{" "}
                        <span className="text-green-400">{(taskProgress.progress / 100 * 2).toFixed(1)}s</span>
                      </div>
                    )}
                    
                    {/* Completed status */}
                    {taskProgress.completed && (
                      <div className="text-xs text-gray-400 border-t border-gray-700 pt-2 flex justify-between items-center">
                        <span>Completed at {new Date().toLocaleTimeString()}</span>
                        <span className="px-2 py-1 bg-green-900 text-green-200 rounded text-xs">Exit code: 0</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Command Input */}
      <MessageInput 
        onSendMessage={onSendMessage} 
        disabled={isPending} 
        onToggleCommandMenu={handleCommandMenuToggle}
        onToggleDashboard={() => setShowDashboard(true)}
        value={currentInputValue}
        onChange={setCurrentInputValue}
        inputRef={inputRef}
      />
      
      {/* Dashboard popup */}
      {showDashboard && (
        <Dashboard onClose={() => setShowDashboard(false)} />
      )}
    </main>
  );
}
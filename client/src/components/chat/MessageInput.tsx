import { useState, useRef, useEffect, KeyboardEvent, MutableRefObject } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CommandSuggestions from "./CommandSuggestions";
import CommandShortcutMenu from "./CommandShortcutMenu";
import { formatCommand, parseCommand } from "@/lib/slashCommands";
import { SiSlack } from "react-icons/si";
import { Globe, Mic, Plus, BarChart3 } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  onToggleCommandMenu?: (show: boolean) => void;
  onToggleDashboard?: () => void;
  value?: string;
  onChange?: (value: string) => void;
  inputRef?: MutableRefObject<HTMLInputElement | null>;
}

export default function MessageInput({ 
  onSendMessage, 
  disabled = false, 
  onToggleCommandMenu,
  onToggleDashboard,
  value,
  onChange,
  inputRef: externalInputRef
}: MessageInputProps) {
  // Use controlled or uncontrolled input based on whether value and onChange are provided
  const isControlled = value !== undefined && onChange !== undefined;
  const [internalMessage, setInternalMessage] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Use passed ref or internal ref
  const inputRef = externalInputRef || internalInputRef;
  
  // Compute the current message value
  const message = isControlled ? value : internalMessage;
  
  // Handle setting message
  const setMessage = (newValue: string) => {
    if (isControlled) {
      onChange(newValue);
    } else {
      setInternalMessage(newValue);
    }
  };

  // Handle sending message
  const handleSendMessage = () => {
    if (message.trim() && !disabled) {
      // If it's a slash command, format it before sending
      const formattedMessage = message.startsWith('/') ? formatCommand(message.trim()) : message.trim();
      onSendMessage(formattedMessage);
      setMessage("");
      setShowSuggestions(false);
    }
  };
  
  // Handler for command suggestions
  const handleCommandSuggestions = () => {
    if (!disabled) {
      setMessage("/help");
      setShowSuggestions(true);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Send on Enter
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    } 
    // Tab for command completion
    else if (e.key === "Tab" && message.startsWith("/")) {
      e.preventDefault();
      // First try to complete the command
      const { isCommand, command } = parseCommand(message);
      if (isCommand && command === "slack") {
        setMessage("/slack ");
      }
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);
    
    // Show suggestions if we're typing a command
    setShowSuggestions(newValue.startsWith('/'));
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [inputRef]);

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-4">
      <div className="max-w-3xl mx-auto">
        <form 
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          {/* Slash Command Suggestions */}
          {showSuggestions && (
            <div 
              ref={suggestionsRef}
              className="absolute bottom-full left-0 w-full mb-1 z-10"
            >
              <CommandSuggestions 
                input={message} 
                onSelectSuggestion={(suggestion) => {
                  setMessage(suggestion);
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
                className="max-h-64"
              />
            </div>
          )}
          
          <div className="w-full bg-white shadow-md rounded-full flex items-center px-4 py-2 border chat-input-container">
            <Input
              type="text"
              ref={inputRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="flex-1 border-none pr-2"
              disabled={disabled}
            />
            
            <Button 
              type="submit" 
              variant="default" 
              className="p-2 rounded-full bg-gray-900 hover:bg-black text-white flex items-center justify-center"
              disabled={!message.trim() || disabled}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="translate-x-[-2px] translate-y-[1px]">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </Button>
          </div>
          
          <div className="flex items-center justify-between px-3 py-2 mt-2">
            <div className="flex space-x-2">
              {/* "+" Button for command menu */}
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                className="flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-600"
                onClick={() => {
                  console.log("+ Button clicked, setting showCommandMenu to true");
                  onToggleCommandMenu?.(true);
                }}
                disabled={disabled}
              >
                <Plus className="h-5 w-5 mr-1" /> Commands
              </Button>
              
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                className="flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-600"
                onClick={() => {
                  console.log("Dashboard button clicked, calling onToggleDashboard");
                  onToggleDashboard?.();
                }}
                disabled={disabled}
              >
                <BarChart3 className="h-5 w-5 mr-1" /> Dashboard
              </Button>
            </div>
            
            <Button 
              type="button" 
              variant="ghost"
              size="sm"
              className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              onClick={handleCommandSuggestions}
              disabled={disabled}
            >
              <span>/commands</span>
            </Button>
          </div>
        </form>
        
        <div className="mt-3 text-xs text-center text-gray-500">
          MCP can make mistakes. Check important info.
        </div>
      </div>
    </div>
  );
}

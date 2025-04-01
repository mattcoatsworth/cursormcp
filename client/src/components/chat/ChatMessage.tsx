import { type ChatMessageWithStringId } from "@shared/schema";
import { useState } from "react";
import { CopyIcon, ThumbsUpIcon, ThumbsDownIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessageProps {
  message: ChatMessageWithStringId;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  
  // Safely check metadata properties
  const metadata = message.metadata as Record<string, any> || {};
  // Only consider a message as processing if it explicitly has isProcessing: true 
  // AND doesn't have a completed flag set to true
  const isProcessing = metadata && 
    'isProcessing' in metadata && 
    metadata.isProcessing && 
    !('completed' in metadata && metadata.completed);
  const hasDeliveryStatus = metadata && 'deliveryStatus' in metadata;
  const deliveryStatus = hasDeliveryStatus ? metadata.deliveryStatus as string : null;
  const originalCommand = metadata && 'originalCommand' in metadata ? metadata.originalCommand as string : null;
  
  // Format message content with line breaks
  // Always show content, even if it's a command
  const hasContentToShow = true; // Force display of all messages
  const isCommand = isUser && message.content.startsWith('/');
  
  // Format the content with special styling for commands
  const formattedContent = message.content.split('\n').map((line: string, i: number) => {
    if (isCommand) {
      // If it's a command, add special styling
      return (
        <p key={i} className={`font-mono ${i > 0 ? "mt-1" : ""}`}>
          <span className="text-blue-600 font-bold">{line.split(' ')[0]}</span>
          <span>{line.includes(' ') ? ' ' + line.substring(line.indexOf(' ')).trim() : ''}</span>
        </p>
      );
    } else {
      // Regular non-command message
      return <p key={i} className={i > 0 ? "mt-1" : ""}>{line}</p>;
    }
  });

  // Render processing steps if any
  const renderProcessingSteps = () => {
    if (isProcessing) {
      const steps = metadata.steps as string[] || [];
      const currentStep = metadata.currentStep as string || "Processing...";
      const animationSpeed = metadata.animationSpeed as number || 600;
      const spinnerType = metadata.spinnerType as string || "dots";
      const showStepProgress = metadata.showStepProgress as boolean || true;
      const progressPercentage = metadata.progressPercentage as number || 0;
      
      // Custom animation style based on speed
      const animationStyle = {
        animationDuration: `${animationSpeed}ms`
      };
      
      return (
        <div className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto mt-2">
          {/* Show original command if available */}
          {originalCommand && (
            <div className="mb-3 text-sm">
              <div className="text-gray-700 dark:text-gray-300 font-semibold">Command:</div>
              <div className="text-blue-600 dark:text-blue-400 font-mono">
                {originalCommand}
              </div>
            </div>
          )}
        
          {/* Progress Indicator if enabled */}
          {showStepProgress && progressPercentage > 0 && (
            <div className="mb-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full transition-all duration-300 ease-in-out" 
                style={{ width: `${progressPercentage}%` }}
                aria-valuenow={progressPercentage} 
                aria-valuemin={0} 
                aria-valuemax={100}
              ></div>
            </div>
          )}
        
          {/* Completed Steps with Checkmarks */}
          {steps.map((step: string, i: number) => (
            <div key={i} className="flex items-start mb-1.5 text-gray-700 dark:text-gray-300">
              <span className="text-green-600 dark:text-green-400 mr-1.5">✓</span>
              <span>{step}</span>
            </div>
          ))}
          
          {/* Current Step with Animated Indicator */}
          <div className="flex items-start text-gray-700 dark:text-gray-300">
            {spinnerType === "dots" && (
              <>
                <span className="text-blue-600 dark:text-blue-400 mr-1.5 processing-icon" style={animationStyle}>⟳</span>
                <span>
                  {currentStep}
                  <span className="ml-1 inline-flex items-center">
                    <span className="thinking-dot" style={animationStyle}></span>
                    <span className="thinking-dot" style={animationStyle}></span>
                    <span className="thinking-dot" style={animationStyle}></span>
                  </span>
                </span>
              </>
            )}
            
            {spinnerType === "bar" && (
              <>
                <span className="text-blue-600 dark:text-blue-400 mr-1.5">|</span>
                <span>
                  {currentStep}
                  <span className="ml-1 inline-block w-8 h-3 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                    <span className="inline-block h-full bg-blue-600 dark:bg-blue-500 w-2 animate-slide"></span>
                  </span>
                </span>
              </>
            )}
            
            {spinnerType === "pulse" && (
              <>
                <span className="text-blue-600 dark:text-blue-400 mr-1.5 animate-pulse">●</span>
                <span>
                  {currentStep}
                </span>
              </>
            )}
            
            {!["dots", "bar", "pulse"].includes(spinnerType) && (
              <>
                <span className="text-blue-600 dark:text-blue-400 mr-1.5 processing-icon">⟳</span>
                <span>
                  {currentStep}
                  <span className="ml-1 inline-flex items-center">
                    <span className="thinking-dot"></span>
                    <span className="thinking-dot"></span>
                    <span className="thinking-dot"></span>
                  </span>
                </span>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Render any result data if present
  const renderResultData = () => {
    if (!isUser && metadata && 'result' in metadata && Object.keys(metadata.result || {}).length > 0) {
      const result = metadata.result as Record<string, any>;
      
      // Example visualization for sales data
      if (result && result.type === 'sales_data') {
        return (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mt-3">
            <div className="text-2xl font-semibold text-gray-800">{result.totalRevenue}</div>
            <div className="text-sm text-gray-500">{result.dateRange}</div>
            
            {result.dailyData && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Daily breakdown</span>
                </div>
                <div className="h-20 flex items-end space-x-1">
                  {(result.dailyData as any[]).map((day: any, i: number) => (
                    <div 
                      key={i}
                      className="bg-blue-600 w-full rounded-t" 
                      style={{ height: `${day.percentage}%` }}
                      title={`${day.date}: ${day.amount}`}
                    ></div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{result.startDate}</span>
                  <span>{result.endDate}</span>
                </div>
              </div>
            )}
          </div>
        );
      }
      
      // Add other visualizations as needed
    }
    return null;
  };

  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="message flex flex-col mb-4">
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div 
          className={`bubble ${isUser ? 'user' : 'assistant'} relative max-w-[80%] rounded-[20px] ${
            isUser 
              ? message.content.startsWith('/') 
                ? 'bg-gray-100 border border-gray-300 text-gray-800' // Special styling for slash commands
                : 'bg-white border border-slate-200'
              : 'bg-white border border-slate-200 shadow-sm'
          } p-3 leading-relaxed`}
        >
          {hasContentToShow && (
            <div>
              {formattedContent}
            </div>
          )}
          
          {renderProcessingSteps()}
          {renderResultData()}
          
          {/* Render delivery status if available */}
          {isUser && hasDeliveryStatus && (
            <div className={`text-xs text-right ${hasContentToShow ? 'mt-1' : 'mt-0'}`}>
              <span className="text-gray-400">
                {deliveryStatus === 'delivered' ? 'Delivered' : 'Sending...'}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Action buttons for assistant messages */}
      {!isUser && hasContentToShow && (
        <div className="actions flex items-center mt-1 gap-3 text-gray-500 self-start ml-2">
          <button onClick={handleCopy} className="flex items-center hover:text-gray-700">
            {copied ? <CheckIcon size={14} className="text-green-500" /> : <CopyIcon size={14} />}
          </button>
          <button className="hover:text-gray-700">
            <ThumbsUpIcon size={14} />
          </button>
          <button className="hover:text-gray-700">
            <ThumbsDownIcon size={14} />
          </button>
          {copied && <span className="text-xs text-green-500">Copied!</span>}
        </div>
      )}
      
      {/* Render actions if any */}
      {!isUser && metadata && 'actions' in metadata && metadata.actions && (
        <div className="mt-2 flex space-x-2 flex-wrap self-start ml-2">
          {(metadata.actions as string[]).map((action: string, i: number) => (
            <Button key={i} variant="outline" size="sm" className="text-xs">
              {action}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

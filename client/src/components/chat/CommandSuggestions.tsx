import { useState, useEffect } from "react";
import { CommandOptionType, CommandType, getSuggestions } from "@/lib/slashCommands";

interface CommandSuggestionsProps {
  input: string;
  onSelectSuggestion: (suggestion: string) => void;
  className?: string;
}

export default function CommandSuggestions({
  input,
  onSelectSuggestion,
  className,
}: CommandSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<(CommandOptionType | CommandType)[]>([]);

  useEffect(() => {
    if (input.startsWith('/')) {
      const matchedSuggestions = getSuggestions(input);
      setSuggestions(matchedSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [input]);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-md shadow-md overflow-hidden ${className}`}>
      <div className="p-1 border-b border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500">Command suggestions</p>
      </div>
      <ul className="max-h-64 overflow-y-auto">
        {suggestions.map((suggestion) => {
          const Icon = suggestion.icon;
          
          return (
            <li
              key={suggestion.id}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-start gap-2"
              onClick={() => {
                // If we're dealing with a CommandOptionType with a prefix
                if ('prefix' in suggestion && suggestion.prefix) {
                  onSelectSuggestion(suggestion.prefix);
                } else {
                  // Otherwise, it's a root command
                  onSelectSuggestion(`/${suggestion.id} `);
                }
              }}
            >
              <div className="flex-shrink-0 mt-0.5">
                {Icon && <Icon className="h-4 w-4 text-gray-500" />}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{suggestion.title}</p>
                <p className="text-xs text-gray-500">{suggestion.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
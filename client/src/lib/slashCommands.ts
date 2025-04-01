import { FiSend, FiMessageSquare, FiUsers, FiList, FiMail, FiTag } from 'react-icons/fi';
import { SiSlack } from 'react-icons/si';

export type CommandOptionType = {
  id: string;
  title: string;
  description: string;
  icon?: React.ElementType;
  prefix: string;
  execute?: (args?: string) => string;
};

export type CommandType = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  options?: CommandOptionType[];
  execute?: (option?: string, args?: string) => string;
};

// Slack-specific commands and options
export const slackCommands: CommandOptionType[] = [
  {
    id: 'send',
    title: 'send',
    description: 'Send a message to a channel',
    icon: FiSend,
    prefix: '/slack send ',
    execute: (args) => {
      const channel = args?.split(' ')?.[0];
      const message = args?.split(' ')?.slice(1).join(' ');
      if (!channel || !message) {
        return `/slack send #channel Your message here`;
      }
      return `Send a message to ${channel}: ${message}`;
    },
  },
  {
    id: 'messages',
    title: 'messages',
    description: 'Get recent messages from a channel',
    icon: FiMessageSquare,
    prefix: '/slack messages ',
    execute: (args) => {
      const limit = args?.trim() ? parseInt(args) : 10;
      if (isNaN(limit)) {
        return `/slack messages [limit]`;
      }
      return `Get the ${limit} most recent messages from the Slack channel`;
    },
  },
  {
    id: 'list-channels',
    title: 'channels',
    description: 'List available channels',
    icon: FiList,
    prefix: '/slack channels ',
    execute: () => `List all Slack channels`,
  },
  {
    id: 'list-users',
    title: 'users',
    description: 'List users in the workspace',
    icon: FiUsers,
    prefix: '/slack users ',
    execute: () => `List all Slack users`,
  },
  {
    id: 'status',
    title: 'status',
    description: 'Get Slack connection status',
    icon: FiMessageSquare,
    prefix: '/slack status ',
    execute: () => `Get current Slack connection status`,
  }
];

// All available root commands
export const commands: CommandType[] = [
  {
    id: 'slack',
    title: 'slack',
    description: 'Interact with Slack',
    icon: SiSlack,
    options: slackCommands,
    execute: (option, args) => {
      const selectedOption = slackCommands.find(cmd => cmd.id === option);
      if (selectedOption?.execute) {
        return selectedOption.execute(args);
      }
      return `/slack ${option || ''} ${args || ''}`;
    },
  },
  // Add other integrations similarly, like:
  // {
  //   id: 'shopify',
  //   title: 'shopify',
  //   description: 'Interact with Shopify',
  //   icon: SiShopify,
  //   options: shopifyCommands,
  // }
];

// Parse the input to determine if it's a command and extract parts
export function parseCommand(input: string): {
  isCommand: boolean;
  command?: string;
  subCommand?: string;
  args?: string;
} {
  if (!input.startsWith('/')) {
    return { isCommand: false };
  }

  const parts = input.trim().slice(1).split(' ');
  const command = parts[0];
  const subCommand = parts[1];
  const args = parts.slice(2).join(' ');

  return {
    isCommand: true,
    command,
    subCommand,
    args,
  };
}

// Get command suggestions based on current input
export function getSuggestions(input: string): CommandOptionType[] | CommandType[] {
  const { isCommand, command, subCommand } = parseCommand(input);

  if (!isCommand) {
    return [];
  }

  // If we have a command but no subcommand (like "/slack ")
  if (command && !subCommand) {
    // If we match a specific command, show its options
    const matchedCommand = commands.find(
      (cmd) => cmd.id.startsWith(command)
    );
    
    if (matchedCommand?.options) {
      return matchedCommand.options;
    }
    
    // Otherwise show commands that match the partial input
    return commands.filter((cmd) => 
      cmd.id.startsWith(command)
    );
  }

  // If we have a command and partial subcommand (like "/slack s")
  if (command && subCommand) {
    const matchedCommand = commands.find((cmd) => cmd.id === command);
    if (matchedCommand?.options) {
      return matchedCommand.options.filter((opt) => 
        opt.id.startsWith(subCommand)
      );
    }
  }

  return [];
}

// Format a command for display
export function formatCommand(input: string): string {
  const { isCommand, command, subCommand, args } = parseCommand(input);
  
  if (!isCommand || !command) {
    return input;
  }

  // Get the matched command
  const matchedCommand = commands.find((cmd) => cmd.id === command);
  if (!matchedCommand) {
    return input;
  }

  // If there's a subcommand, try to execute it
  if (subCommand && matchedCommand.options) {
    const matchedOption = matchedCommand.options.find(
      (opt) => opt.id === subCommand
    );

    if (matchedOption?.execute) {
      return matchedOption.execute(args);
    }
  }

  // Otherwise use the command's execute function
  if (matchedCommand.execute) {
    return matchedCommand.execute(subCommand, args);
  }

  return input;
}
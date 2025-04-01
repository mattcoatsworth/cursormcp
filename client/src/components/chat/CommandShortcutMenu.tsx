import { useEffect, useRef, useState } from 'react';
import { SiShopify, SiSlack, SiNotion, SiTripadvisor, SiKlarna } from 'react-icons/si';
import { 
  BarChart, MessageSquare, Clipboard, LineChart, MessageCircle, 
  RefreshCcw, BrainCircuit, PieChart, TagIcon, ShoppingCart, 
  TrendingUp, CreditCard, Users, CalendarIcon, BellIcon,
  InboxIcon, BriefcaseIcon, LayoutDashboard, List, CheckCircle2,
  FileBox, Package, Mail, BarChart3, CircleDollarSign,
  Megaphone, ArrowLeft, X
} from 'lucide-react';
import { type ApiConnection } from '@shared/schema';

interface CommandShortcutOption {
  service: string;
  label: string;
  command: string;
  icon: React.ReactNode;
  isMainCommand?: boolean;
}

interface CommandShortcutMenuProps {
  onSelectCommand: (command: string) => void;
  onClose: () => void;
  apiConnections?: ApiConnection[];
}

// Service icon map for consistent representation
const getServiceIcon = (service: string, size: number = 4) => {
  const className = `h-${size} w-${size}`;
  switch(service) {
    case 'shopify': return <SiShopify className={`${className} text-green-500`} />;
    case 'slack': return <SiSlack className={`${className} text-blue-500`} />;
    case 'notion': return <SiNotion className={`${className} text-gray-900`} />;
    case 'triplewhale': return <LineChart className={`${className} text-blue-600`} />;
    case 'gorgias': return <MessageCircle className={`${className} text-cyan-500`} />;
    case 'recharm': return <RefreshCcw className={`${className} text-pink-500`} />;
    case 'prescientai': return <BrainCircuit className={`${className} text-violet-500`} />;
    case 'elevar': return <PieChart className={`${className} text-amber-500`} />;
    case 'northbeam': return <BarChart className={`${className} text-orange-500`} />;
    case 'postscript': return <MessageSquare className={`${className} text-purple-500`} />;
    case 'klaviyo': return <Clipboard className={`${className} text-green-600`} />;
    default: return null;
  }
};

const CommandShortcutMenu = ({ onSelectCommand, onClose, apiConnections = [] }: CommandShortcutMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [filteredServices, setFilteredServices] = useState<string[]>([]);

  // Determine which services are active based on API connections
  useEffect(() => {
    console.log('CommandShortcutMenu - API Connections:', apiConnections);
    
    // Extract enabled services from API connections and normalize names
    const enabledServices = apiConnections
      .filter(conn => conn.isConnected)
      .map(conn => {
        const type = conn.type?.toLowerCase() || '';
        // Remove spaces to match command option service names
        return type.replace(/\s+/g, '');
      });
    
    console.log('Enabled services (normalized):', enabledServices);
    
    // If no API connections are provided or none are enabled, show all services
    if (!apiConnections.length || !enabledServices.length) {
      console.log('No API connections or none enabled, showing all services');
      setFilteredServices([]);
    } else {
      console.log('Filtering services to only show enabled ones:', enabledServices);
      setFilteredServices(enabledServices);
    }
  }, [apiConnections]);

  // Common commands for each service with more specific shortcuts
  const commandOptions: CommandShortcutOption[] = [
    // Shopify commands - Main/preview commands
    {
      service: 'shopify',
      label: 'Today\'s Sales',
      command: '/shopify today_sales',
      icon: <CircleDollarSign className="h-4 w-4 text-green-500" />,
      isMainCommand: true
    },
    {
      service: 'shopify',
      label: 'Best Sellers',
      command: '/shopify best_sellers',
      icon: <TrendingUp className="h-4 w-4 text-green-500" />,
      isMainCommand: true
    },
    {
      service: 'shopify',
      label: 'Recent Orders',
      command: '/shopify recent_orders',
      icon: <ShoppingCart className="h-4 w-4 text-green-500" />,
      isMainCommand: true
    },
    {
      service: 'shopify',
      label: 'Inventory Low',
      command: '/shopify inventory_low',
      icon: <Package className="h-4 w-4 text-green-500" />,
      isMainCommand: true
    },
    // Shopify commands - Extended list (only shown when Shopify is selected)
    {
      service: 'shopify',
      label: 'Monthly Sales Trend',
      command: '/shopify sales_trend monthly',
      icon: <LineChart className="h-4 w-4 text-green-500" />
    },
    {
      service: 'shopify',
      label: 'Top Products',
      command: '/shopify products top',
      icon: <TrendingUp className="h-4 w-4 text-green-500" />
    },
    {
      service: 'shopify',
      label: 'Customer Acquisition',
      command: '/shopify customers new',
      icon: <Users className="h-4 w-4 text-green-500" />
    },
    {
      service: 'shopify',
      label: 'Popular Collections',
      command: '/shopify collections popular',
      icon: <LayoutDashboard className="h-4 w-4 text-green-500" />
    },
    {
      service: 'shopify',
      label: 'Abandoned Checkouts',
      command: '/shopify checkouts abandoned',
      icon: <ShoppingCart className="h-4 w-4 text-green-500" />
    },
    {
      service: 'shopify',
      label: 'Sales by Location',
      command: '/shopify sales_by_location',
      icon: <BarChart className="h-4 w-4 text-green-500" />
    },
    {
      service: 'shopify',
      label: 'Order Fulfillment Status',
      command: '/shopify orders fulfillment_status',
      icon: <Package className="h-4 w-4 text-green-500" />
    },
    {
      service: 'shopify',
      label: 'Discount Performance',
      command: '/shopify discounts performance',
      icon: <TagIcon className="h-4 w-4 text-green-500" />
    },
    {
      service: 'shopify',
      label: 'Refund Analysis',
      command: '/shopify refunds analysis',
      icon: <RefreshCcw className="h-4 w-4 text-green-500" />
    },
    {
      service: 'shopify',
      label: 'Customer Lifetime Value',
      command: '/shopify customers ltv',
      icon: <CircleDollarSign className="h-4 w-4 text-green-500" />
    },
    
    // Slack commands
    {
      service: 'slack',
      label: '#general',
      command: '/slack channel #general',
      icon: <SiSlack className="h-4 w-4 text-blue-500" />,
      isMainCommand: true
    },
    {
      service: 'slack',
      label: '#marketing',
      command: '/slack channel #marketing',
      icon: <SiSlack className="h-4 w-4 text-blue-500" />,
      isMainCommand: true
    },
    {
      service: 'slack',
      label: '#support',
      command: '/slack channel #support',
      icon: <SiSlack className="h-4 w-4 text-blue-500" />,
      isMainCommand: true
    },
    {
      service: 'slack',
      label: 'Recent Messages',
      command: '/slack recent',
      icon: <MessageCircle className="h-4 w-4 text-blue-500" />,
      isMainCommand: true
    },
    // Extended Slack commands
    {
      service: 'slack',
      label: 'Post Message',
      command: '/slack post_message',
      icon: <MessageSquare className="h-4 w-4 text-blue-500" />
    },
    {
      service: 'slack',
      label: 'Search Messages',
      command: '/slack search',
      icon: <MessageCircle className="h-4 w-4 text-blue-500" />
    },
    {
      service: 'slack',
      label: 'Channel Members',
      command: '/slack channel_members',
      icon: <Users className="h-4 w-4 text-blue-500" />
    },
    {
      service: 'slack',
      label: 'User Status',
      command: '/slack user_status',
      icon: <Users className="h-4 w-4 text-blue-500" />
    },
    
    // Notion commands
    {
      service: 'notion',
      label: 'High Priority Tasks',
      command: '/notion tasks priority:high',
      icon: <BellIcon className="h-4 w-4 text-gray-900" />,
      isMainCommand: true
    },
    {
      service: 'notion',
      label: 'Today\'s Tasks',
      command: '/notion tasks due:today',
      icon: <CalendarIcon className="h-4 w-4 text-gray-900" />,
      isMainCommand: true
    },
    {
      service: 'notion',
      label: 'Create Task',
      command: '/notion add_task',
      icon: <CheckCircle2 className="h-4 w-4 text-gray-900" />,
      isMainCommand: true
    },
    {
      service: 'notion',
      label: 'Project Database',
      command: '/notion database projects',
      icon: <BriefcaseIcon className="h-4 w-4 text-gray-900" />,
      isMainCommand: true
    },
    // Extended Notion commands
    {
      service: 'notion',
      label: 'List Databases',
      command: '/notion list_databases',
      icon: <LayoutDashboard className="h-4 w-4 text-gray-900" />
    },
    {
      service: 'notion',
      label: 'Create Page',
      command: '/notion create_page',
      icon: <FileBox className="h-4 w-4 text-gray-900" />
    },
    {
      service: 'notion',
      label: 'Search Content',
      command: '/notion search',
      icon: <FileBox className="h-4 w-4 text-gray-900" />
    },
    {
      service: 'notion',
      label: 'Weekly Tasks',
      command: '/notion tasks due:week',
      icon: <CalendarIcon className="h-4 w-4 text-gray-900" />
    },
    
    // Triple Whale commands
    {
      service: 'triplewhale',
      label: 'Performance Overview',
      command: '/triplewhale performance',
      icon: <LayoutDashboard className="h-4 w-4 text-blue-600" />,
      isMainCommand: true
    },
    {
      service: 'triplewhale',
      label: 'Ad Spend',
      command: '/triplewhale ad_spend',
      icon: <CreditCard className="h-4 w-4 text-blue-600" />,
      isMainCommand: true
    },
    {
      service: 'triplewhale',
      label: 'Customer LTV',
      command: '/triplewhale customer_ltv',
      icon: <Users className="h-4 w-4 text-blue-600" />,
      isMainCommand: true
    },
    // Extended Triple Whale commands
    {
      service: 'triplewhale',
      label: 'Revenue Attribution',
      command: '/triplewhale attribution',
      icon: <PieChart className="h-4 w-4 text-blue-600" />
    },
    {
      service: 'triplewhale',
      label: 'Facebook Ads',
      command: '/triplewhale facebook_ads',
      icon: <BarChart className="h-4 w-4 text-blue-600" />
    },
    {
      service: 'triplewhale',
      label: 'ROAS Analysis',
      command: '/triplewhale roas_analysis',
      icon: <BarChart3 className="h-4 w-4 text-blue-600" />
    },
    {
      service: 'triplewhale',
      label: 'Cohort Analysis',
      command: '/triplewhale cohort_analysis',
      icon: <Users className="h-4 w-4 text-blue-600" />
    },
    
    // Gorgias commands
    {
      service: 'gorgias',
      label: 'Open Tickets',
      command: '/gorgias tickets status:open',
      icon: <InboxIcon className="h-4 w-4 text-cyan-500" />,
      isMainCommand: true
    },
    {
      service: 'gorgias',
      label: 'Urgent Tickets',
      command: '/gorgias tickets priority:urgent',
      icon: <BellIcon className="h-4 w-4 text-red-500" />,
      isMainCommand: true
    },
    {
      service: 'gorgias',
      label: 'My Tickets',
      command: '/gorgias tickets assigned:me',
      icon: <FileBox className="h-4 w-4 text-cyan-500" />,
      isMainCommand: true
    },
    // Extended Gorgias commands
    {
      service: 'gorgias',
      label: 'Customer Satisfaction',
      command: '/gorgias satisfaction',
      icon: <Users className="h-4 w-4 text-cyan-500" />
    },
    {
      service: 'gorgias',
      label: 'Agent Performance',
      command: '/gorgias agent_stats',
      icon: <BarChart className="h-4 w-4 text-cyan-500" />
    },
    {
      service: 'gorgias',
      label: 'Create Ticket',
      command: '/gorgias create_ticket',
      icon: <FileBox className="h-4 w-4 text-cyan-500" />
    },
    {
      service: 'gorgias',
      label: 'Response Time',
      command: '/gorgias response_time',
      icon: <BarChart3 className="h-4 w-4 text-cyan-500" />
    },
    
    // Recharm commands
    {
      service: 'recharm',
      label: 'Abandoned Carts',
      command: '/recharm abandoned_carts',
      icon: <ShoppingCart className="h-4 w-4 text-pink-500" />,
      isMainCommand: true
    },
    {
      service: 'recharm',
      label: 'Active Campaigns',
      command: '/recharm active_campaigns',
      icon: <Megaphone className="h-4 w-4 text-pink-500" />,
      isMainCommand: true
    },
    // Extended Recharm commands
    {
      service: 'recharm',
      label: 'Campaign Performance',
      command: '/recharm campaign_performance',
      icon: <BarChart className="h-4 w-4 text-pink-500" />
    },
    {
      service: 'recharm',
      label: 'Email Metrics',
      command: '/recharm email_metrics',
      icon: <Mail className="h-4 w-4 text-pink-500" />
    },
    {
      service: 'recharm',
      label: 'Subscriber Growth',
      command: '/recharm subscriber_growth',
      icon: <TrendingUp className="h-4 w-4 text-pink-500" />
    },
    {
      service: 'recharm',
      label: 'Create Campaign',
      command: '/recharm create_campaign',
      icon: <Megaphone className="h-4 w-4 text-pink-500" />
    },
    
    // Prescient AI commands
    {
      service: 'prescientai',
      label: 'Sales Forecast',
      command: '/prescientai forecast sales',
      icon: <BrainCircuit className="h-4 w-4 text-violet-500" />,
      isMainCommand: true
    },
    {
      service: 'prescientai',
      label: 'Inventory Prediction',
      command: '/prescientai forecast inventory',
      icon: <Package className="h-4 w-4 text-violet-500" />,
      isMainCommand: true
    },
    // Extended Prescient AI commands
    {
      service: 'prescientai',
      label: 'Customer Behavior',
      command: '/prescientai analyze customer_behavior',
      icon: <Users className="h-4 w-4 text-violet-500" />
    },
    {
      service: 'prescientai',
      label: 'Pricing Optimization',
      command: '/prescientai optimize pricing',
      icon: <CircleDollarSign className="h-4 w-4 text-violet-500" />
    },
    {
      service: 'prescientai',
      label: 'Market Trends',
      command: '/prescientai trends market',
      icon: <TrendingUp className="h-4 w-4 text-violet-500" />
    },
    {
      service: 'prescientai',
      label: 'Demand Prediction',
      command: '/prescientai predict demand',
      icon: <LineChart className="h-4 w-4 text-violet-500" />
    },
    
    // Elevar commands
    {
      service: 'elevar',
      label: 'Analytics Overview',
      command: '/elevar analytics',
      icon: <PieChart className="h-4 w-4 text-amber-500" />,
      isMainCommand: true
    },
    {
      service: 'elevar',
      label: 'Tracking Issues',
      command: '/elevar tracking_issues',
      icon: <TagIcon className="h-4 w-4 text-amber-500" />,
      isMainCommand: true
    },
    // Extended Elevar commands
    {
      service: 'elevar',
      label: 'Conversion Metrics',
      command: '/elevar conversions',
      icon: <BarChart className="h-4 w-4 text-amber-500" />
    },
    {
      service: 'elevar',
      label: 'UTM Campaign Analysis',
      command: '/elevar utm_analysis',
      icon: <LineChart className="h-4 w-4 text-amber-500" />
    },
    {
      service: 'elevar',
      label: 'Tag Health Check',
      command: '/elevar tag_health',
      icon: <CheckCircle2 className="h-4 w-4 text-amber-500" />
    },
    {
      service: 'elevar',
      label: 'Attribution Models',
      command: '/elevar attribution_models',
      icon: <PieChart className="h-4 w-4 text-amber-500" />
    },
    
    // Northbeam commands
    {
      service: 'northbeam',
      label: 'ROAS Dashboard',
      command: '/northbeam roas',
      icon: <BarChart className="h-4 w-4 text-orange-500" />,
      isMainCommand: true
    },
    {
      service: 'northbeam',
      label: 'Channel Performance',
      command: '/northbeam channel_metrics',
      icon: <BarChart3 className="h-4 w-4 text-orange-500" />,
      isMainCommand: true
    },
    // Extended Northbeam commands
    {
      service: 'northbeam',
      label: 'Attribution Analysis',
      command: '/northbeam attribution',
      icon: <PieChart className="h-4 w-4 text-orange-500" />
    },
    {
      service: 'northbeam',
      label: 'Campaign ROI',
      command: '/northbeam campaign_roi',
      icon: <CircleDollarSign className="h-4 w-4 text-orange-500" />
    },
    {
      service: 'northbeam',
      label: 'Media Mix Model',
      command: '/northbeam media_mix',
      icon: <LineChart className="h-4 w-4 text-orange-500" />
    },
    {
      service: 'northbeam',
      label: 'Conversion Paths',
      command: '/northbeam conversion_paths',
      icon: <LayoutDashboard className="h-4 w-4 text-orange-500" />
    },
    
    // Postscript commands
    {
      service: 'postscript',
      label: 'Campaign Performance',
      command: '/postscript campaigns',
      icon: <MessageSquare className="h-4 w-4 text-purple-500" />,
      isMainCommand: true
    },
    {
      service: 'postscript',
      label: 'SMS Metrics',
      command: '/postscript metrics',
      icon: <PieChart className="h-4 w-4 text-purple-500" />,
      isMainCommand: true
    },
    // Extended Postscript commands
    {
      service: 'postscript',
      label: 'Subscriber Growth',
      command: '/postscript subscribers',
      icon: <TrendingUp className="h-4 w-4 text-purple-500" />
    },
    {
      service: 'postscript',
      label: 'Create Campaign',
      command: '/postscript create_campaign',
      icon: <MessageSquare className="h-4 w-4 text-purple-500" />
    },
    {
      service: 'postscript',
      label: 'Segment Analysis',
      command: '/postscript segments',
      icon: <Users className="h-4 w-4 text-purple-500" />
    },
    {
      service: 'postscript',
      label: 'A/B Test Results',
      command: '/postscript ab_tests',
      icon: <BarChart className="h-4 w-4 text-purple-500" />
    },
    
    // Klaviyo commands
    {
      service: 'klaviyo',
      label: 'Email Metrics',
      command: '/klaviyo email_metrics',
      icon: <Mail className="h-4 w-4 text-green-600" />,
      isMainCommand: true
    },
    {
      service: 'klaviyo',
      label: 'Top Flows',
      command: '/klaviyo flows top',
      icon: <Clipboard className="h-4 w-4 text-green-600" />,
      isMainCommand: true
    },
    // Extended Klaviyo commands
    {
      service: 'klaviyo',
      label: 'Campaign Performance',
      command: '/klaviyo campaigns performance',
      icon: <BarChart className="h-4 w-4 text-green-600" />
    },
    {
      service: 'klaviyo',
      label: 'Create Campaign',
      command: '/klaviyo campaigns create',
      icon: <Megaphone className="h-4 w-4 text-green-600" />
    },
    {
      service: 'klaviyo',
      label: 'Subscriber Growth',
      command: '/klaviyo subscribers growth',
      icon: <TrendingUp className="h-4 w-4 text-green-600" />
    },
    {
      service: 'klaviyo',
      label: 'Segment Analysis',
      command: '/klaviyo segments analysis',
      icon: <Users className="h-4 w-4 text-green-600" />
    },
    {
      service: 'klaviyo',
      label: 'Flow Performance',
      command: '/klaviyo flows performance',
      icon: <LineChart className="h-4 w-4 text-green-600" />
    },
    {
      service: 'klaviyo',
      label: 'Back-In-Stock',
      command: '/klaviyo back_in_stock',
      icon: <Package className="h-4 w-4 text-green-600" />
    },
    {
      service: 'klaviyo',
      label: 'Catalog Items',
      command: '/klaviyo catalog items',
      icon: <ShoppingCart className="h-4 w-4 text-green-600" />
    },
    {
      service: 'klaviyo',
      label: 'Recent Orders',
      command: '/klaviyo orders recent',
      icon: <ShoppingCart className="h-4 w-4 text-green-600" />
    },
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Group commands by service and filter based on enabled API connections
  const serviceGroups = commandOptions.reduce((groups, option) => {
    // Check if we should include this service
    const shouldIncludeService = 
      // If filteredServices is empty (no API connections or none enabled), show all services
      filteredServices.length === 0 || 
      // Otherwise only show services that are enabled in API connections
      filteredServices.includes(option.service);
    
    console.log(`Service ${option.service} shouldIncludeService: ${shouldIncludeService}`);
    
    if (shouldIncludeService) {
      if (!groups[option.service]) {
        groups[option.service] = [];
      }
      groups[option.service].push(option);
    }
    return groups;
  }, {} as Record<string, CommandShortcutOption[]>);

  // Filter main commands for preview
  const mainCommandGroups = Object.entries(serviceGroups).reduce((groups, [service, commands]) => {
    groups[service] = commands.filter(cmd => cmd.isMainCommand === true);
    // If no main commands are defined, use all commands up to 4
    if (groups[service].length === 0) {
      groups[service] = commands.slice(0, Math.min(commands.length, 4));
    }
    return groups;
  }, {} as Record<string, CommandShortcutOption[]>);

  // Handle service selection
  const handleServiceClick = (service: string) => {
    setSelectedService(service);
  };

  // Reset service selection
  const handleBackClick = () => {
    setSelectedService(null);
  };

  return (
    <div 
      ref={menuRef} 
      className="absolute top-0 left-0 right-0 mx-auto w-full max-w-3xl p-4 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50"
    >
      <div className="p-2 bg-gray-50 border-b border-gray-200 mb-3 flex justify-between items-center">
        <div className="flex items-center">
          {selectedService && (
            <button 
              onClick={handleBackClick}
              className="mr-2 flex items-center justify-center rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Back to all services"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <h3 className="text-sm font-medium text-gray-700">
            {selectedService 
              ? `${selectedService.charAt(0).toUpperCase() + selectedService.slice(1)} Commands` 
              : 'Quick Commands'}
          </h3>
        </div>
        <button 
          onClick={onClose} 
          className="flex items-center justify-center rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {selectedService ? (
        // Show commands for selected service
        <div className="p-2 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="grid grid-cols-1 gap-2">
            {serviceGroups[selectedService].map((option, index) => (
              <button
                key={index}
                className="w-full text-left px-3 py-2 flex items-center space-x-2 rounded-md hover:bg-gray-100 transition-colors"
                onClick={() => {
                  onSelectCommand(option.command);
                  onClose();
                }}
              >
                <span className="flex-shrink-0">{option.icon}</span>
                <span className="flex-1 text-sm text-gray-700 truncate">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 max-h-[calc(100vh-200px)] overflow-y-auto p-2">
          {Object.entries(mainCommandGroups).map(([service, commands]) => (
            <div key={service} className="mb-4">
              <div 
                className="flex items-center gap-2 p-2 mb-2 border border-gray-100 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100"
                onClick={() => handleServiceClick(service)}
              >
                {getServiceIcon(service, 5)}
                <span className="text-sm font-medium text-gray-700">{service.charAt(0).toUpperCase() + service.slice(1)}</span>
              </div>
              <div className="space-y-1">
                {commands.map((option, idx) => (
                  <button
                    key={idx}
                    className="w-full text-left px-3 py-2 flex items-center space-x-2 rounded hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      onSelectCommand(option.command);
                      onClose();
                    }}
                  >
                    <span className="flex-shrink-0">{option.icon}</span>
                    <span className="flex-1 text-sm text-gray-700 truncate">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommandShortcutMenu;
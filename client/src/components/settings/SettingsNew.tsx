import { useState, useEffect } from 'react';
import { type ApiConnection } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SiSlack, SiShopify, SiNotion, SiOpenai, SiGithub, SiGoogle, SiFigma } from 'react-icons/si';
import { Database, MessageSquare, BarChart, LineChart, MessageCircle, RefreshCcw, BrainCircuit, PieChart, Calendar, CheckSquare, FileType, Clipboard, Activity } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { apiRequest } from '@/lib/queryClient';
import { getMockModeStatus, setMockMode } from '@/lib/ApiClient';

interface SettingsProps {
  connections: ApiConnection[];
  isLoading: boolean;
  onToggleConnection: (id: number | string, isConnected: boolean, type: string) => void;
}

export default function SettingsNew({ connections, isLoading, onToggleConnection }: SettingsProps) {
  // API Connection Form State
  const [activeApiForm, setActiveApiForm] = useState<string>('');
  
  // Shared form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0); // Used to force re-fetch of connections
  
  // Mock mode state
  const [isMockMode, setIsMockMode] = useState(false);
  const [isMockLoading, setIsMockLoading] = useState(true);
  
  // State for Shopify API credentials
  const [shopifyCredentials, setShopifyCredentials] = useState({
    apiKey: '',
    apiSecretKey: '',
    accessToken: '',
    shopDomain: ''
  });
  
  // State for Slack API credentials
  const [slackCredentials, setSlackCredentials] = useState({
    botToken: '',
    channelId: '',
    appToken: ''
  });
  
  // State for Notion API credentials
  const [notionCredentials, setNotionCredentials] = useState({
    notionToken: '',
    databaseId: ''
  });
  
  // State for Klaviyo API credentials
  const [klaviyoCredentials, setKlaviyoCredentials] = useState({
    privateApiKey: '',
    publicApiKey: ''
  });
  
  // State for Postscript API credentials
  const [postscriptCredentials, setPostscriptCredentials] = useState({
    apiKey: ''
  });
  
  // State for Northbeam API credentials
  const [northbeamCredentials, setNorthbeamCredentials] = useState({
    apiKey: '',
    clientId: ''
  });
  
  // State for Triple Whale API credentials
  const [triplewhaleCredentials, setTriplewhaleCredentials] = useState({
    apiKey: '',
    pixelId: ''
  });
  
  const [openaiCredentials, setOpenaiCredentials] = useState({
    apiKey: ''
  });
  
  // Icon mapping for API types
  const apiIconMap: Record<string, JSX.Element> = {
    shopify: <SiShopify className="h-5 w-5 text-green-600" />,
    slack: <SiSlack className="h-5 w-5 text-blue-600" />,
    notion: <SiNotion className="h-5 w-5 text-gray-800" />,
    openai: <SiOpenai className="h-5 w-5 text-green-500" />,
    chatgpt: <SiOpenai className="h-5 w-5 text-green-500" />,
    github: <SiGithub className="h-5 w-5 text-gray-800" />,
    klaviyo: <Clipboard className="h-5 w-5 text-violet-600" />,
    postscript: <MessageSquare className="h-5 w-5 text-indigo-600" />,
    northbeam: <BarChart className="h-5 w-5 text-amber-600" />,
    triplewhale: <LineChart className="h-5 w-5 text-teal-600" />,
    gorgias: <MessageCircle className="h-5 w-5 text-blue-500" />,
    recharm: <RefreshCcw className="h-5 w-5 text-red-500" />,
    prescientai: <BrainCircuit className="h-5 w-5 text-purple-500" />,
    elevar: <PieChart className="h-5 w-5 text-orange-500" />,
    googlecalendar: <Calendar className="h-5 w-5 text-blue-600" />,
    asana: <CheckSquare className="h-5 w-5 text-red-600" />,
    figma: <SiFigma className="h-5 w-5 text-purple-600" />,
    gdrive: <FileType className="h-5 w-5 text-yellow-600" />,
  };
  
  // Display names for API services
  const serviceNameMap: Record<string, string> = {
    shopify: 'Shopify',
    slack: 'Slack',
    notion: 'Notion',
    openai: 'OpenAI',
    chatgpt: 'ChatGPT',
    github: 'GitHub',
    klaviyo: 'Klaviyo',
    postscript: 'Postscript',
    northbeam: 'Northbeam',
    triplewhale: 'Triple Whale',
    gorgias: 'Gorgias',
    recharm: 'Recharm',
    prescientai: 'Prescient AI',
    elevar: 'Elevar',
    googlecalendar: 'Google Calendar',
    asana: 'Asana',
    figma: 'Figma',
    gdrive: 'Google Drive',
  };
  
  // Service categories - ensure all possible services are included
  const serviceCategories: Record<string, string[]> = {
    "E-commerce": ["shopify", "klaviyo", "postscript", "gorgias"],
    "Analytics": ["northbeam", "triplewhale", "elevar"],
    "Productivity": ["slack", "notion", "googlecalendar", "asana", "github", "figma", "gdrive"],
    "AI": ["openai", "recharm", "prescientai"]
  };
  
  // Ensure all available services are assigned to a category
  Object.keys(apiIconMap).forEach(service => {
    if (!Object.values(serviceCategories).some(categoryServices => 
      categoryServices.includes(service))) {
      // If a service isn't in any category, add it to the most relevant one
      // Default to Productivity for any uncategorized service
      serviceCategories["Productivity"].push(service);
    }
  });
  
  // Create a merged list of all connections (existing + missing ones)
  const [allConnections, setAllConnections] = useState<ApiConnection[]>([]);
  
  // Handle toggle for placeholder connections
  const handleToggleConnection = async (id: string | number, isConnected: boolean, type?: string) => {
    // If it's a new/placeholder connection (id starts with "new-"), we need to create it first
    if (typeof id === 'string' && id.startsWith('new-') && type) {
      // Open the edit credentials dialog for this service
      setActiveApiForm(type);
      
      // For placeholder connections we don't toggle immediately, 
      // user needs to fill in credentials first
      return;
    }
    
    try {
      setErrorMessage('');
      setSuccessMessage('');
      
      // Import here to avoid circular dependencies
      const { toggleApiConnection } = await import('@/lib/ApiClient');
      
      // Use the API client to toggle the connection
      const result = await toggleApiConnection(id, !isConnected, type || '');
      
      if (result.success) {
        setSuccessMessage(`Successfully ${!isConnected ? 'enabled' : 'disabled'} ${type} connection`);
        
        // For existing connections, pass to parent handler
        onToggleConnection(id, !isConnected, type || '');
        
        // Force refresh the component
        setRefreshKey(prev => prev + 1);
      } else {
        setErrorMessage(result.message || `Failed to ${!isConnected ? 'enable' : 'disable'} ${type} connection`);
      }
    } catch (error) {
      console.error('Error toggling connection:', error);
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  };
  
  // Set up refresh connections event listener
  useEffect(() => {
    const handleRefreshConnections = () => {
      // Force the parent component to refresh the connections
      setRefreshKey(prev => prev + 1);
    };
    
    // Add event listener for the custom event
    window.addEventListener('refreshConnections', handleRefreshConnections);
    
    // Clean up
    return () => {
      window.removeEventListener('refreshConnections', handleRefreshConnections);
    };
  }, []);
  
  // Get mock mode status on component load
  useEffect(() => {
    const fetchMockModeStatus = async () => {
      try {
        setIsMockLoading(true);
        const response = await getMockModeStatus();
        if (response.success) {
          setIsMockMode(response.enabled);
        }
      } catch (error) {
        console.error('Error fetching mock mode status:', error);
      } finally {
        setIsMockLoading(false);
      }
    };
    
    fetchMockModeStatus();
  }, []);
  
  // Handle toggle mock mode
  const handleToggleMockMode = async () => {
    try {
      setIsMockLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
      
      const response = await setMockMode(!isMockMode);
      
      if (response.success) {
        setIsMockMode(response.enabled);
        setSuccessMessage(`Mock mode ${response.enabled ? 'enabled' : 'disabled'} successfully`);
      } else {
        setErrorMessage(response.message || 'Failed to toggle mock mode');
      }
    } catch (error) {
      console.error('Error toggling mock mode:', error);
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsMockLoading(false);
    }
  };
  
  // Merge existing connections with missing ones
  useEffect(() => {
    if (!isLoading) {
      const existingTypes = connections.map(conn => conn.type?.toLowerCase() || '');
      const allServices = Object.keys(apiIconMap);
      
      // Create merged list
      const merged = [...connections];
      
      // Add missing services
      allServices.forEach(service => {
        if (!existingTypes.includes(service)) {
          // Create a placeholder connection for this service
          const newConnection: ApiConnection = {
            id: `new-${service}` as unknown as number,
            name: serviceNameMap[service] || service,
            type: service,
            isConnected: false,
            isMock: false,
            credentials: {},
            lastConnected: null,
            createdAt: new Date().toISOString() as unknown as Date
          };
          merged.push(newConnection);
        }
      });
      
      // Sort by name
      merged.sort((a, b) => {
        return (a.name || '').localeCompare(b.name || '');
      });
      
      setAllConnections(merged);
    }
  }, [connections, isLoading, refreshKey]);
  
  // Handler for Shopify form changes
  const handleShopifyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShopifyCredentials(prev => ({ ...prev, [name]: value }));
  };
  
  // Handler for Slack form changes
  const handleSlackInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSlackCredentials(prev => ({ ...prev, [name]: value }));
  };
  
  // Handler for Notion form changes
  const handleNotionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNotionCredentials(prev => ({ ...prev, [name]: value }));
  };
  
  // Handler for Klaviyo form changes
  const handleKlaviyoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setKlaviyoCredentials(prev => ({ ...prev, [name]: value }));
  };
  
  // Handler for Postscript form changes
  const handlePostscriptInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPostscriptCredentials(prev => ({ ...prev, [name]: value }));
  };
  
  // Handler for Northbeam form changes
  const handleNorthbeamInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNorthbeamCredentials(prev => ({ ...prev, [name]: value }));
  };
  
  // Handler for Triple Whale form changes
  const handleTriplewhaleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTriplewhaleCredentials(prev => ({ ...prev, [name]: value }));
  };
  
  // Handler for OpenAI form changes
  const handleOpenaiInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOpenaiCredentials(prev => ({ ...prev, [name]: value }));
  };
  
  // Reference to DialogClose to control it programmatically
  const [dialogCloseRef, setDialogCloseRef] = useState<HTMLButtonElement | null>(null);
  
  // Handler for connecting to Shopify
  const handleConnectShopify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Validate required fields
      if (!shopifyCredentials.apiKey || !shopifyCredentials.accessToken || !shopifyCredentials.shopDomain) {
        setErrorMessage('Please fill in all required fields for Shopify connection');
        setIsSubmitting(false);
        return;
      }
      
      // Import here to avoid circular dependencies
      const { createApiConnection } = await import('@/lib/ApiClient');
      
      // Use our API client to connect to Shopify
      const response = await createApiConnection({
        type: 'shopify',
        name: 'Shopify',
        isConnected: true,
        credentials: shopifyCredentials
      });
      
      if (response.success) {
        setSuccessMessage('Successfully connected to Shopify API!');
        
        // Automatically close the dialog
        if (dialogCloseRef) {
          dialogCloseRef.click();
        }
        
        // Refresh the connections list without page reload
        setTimeout(() => {
          // Trigger a refresh of connections via the custom event
          window.dispatchEvent(new CustomEvent('refreshConnections'));
          // Force component refresh
          setRefreshKey(prev => prev + 1);
        }, 500);
      } else {
        setErrorMessage(response.message || 'Failed to connect to Shopify API. Please check your credentials and try again.');
      }
    } catch (error) {
      console.error('Error connecting to Shopify API:', error);
      
      // Provide more detailed error messages for different scenarios
      if (error instanceof Error) {
        if (error.message.includes('credentials')) {
          setErrorMessage('Database error: Failed to store API credentials. This may be due to missing the credentials column in the database.');
        } else if (error.message.includes('UNIQUE')) {
          setErrorMessage('A Shopify connection already exists. Try updating the existing connection instead.');
        } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
          setErrorMessage('Authentication failed: Please check your Shopify API credentials.');
        } else if (error.message.includes('network') || error.message.includes('timeout')) {
          setErrorMessage('Network error: Unable to connect to Shopify. Please check your internet connection.');
        } else {
          setErrorMessage('Error connecting to Shopify API: ' + error.message);
        }
      } else {
        setErrorMessage('Error connecting to Shopify API: ' + String(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handler for connecting to Slack
  const handleConnectSlack = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Import here to avoid circular dependencies
      const { createApiConnection } = await import('@/lib/ApiClient');
      
      // Use our API client to connect to Slack
      const response = await createApiConnection({
        type: 'slack',
        name: 'Slack',
        isConnected: true,
        credentials: slackCredentials
      });
      
      if (response.success) {
        setSuccessMessage('Successfully connected to Slack API!');
        
        // Automatically close the dialog
        if (dialogCloseRef) {
          dialogCloseRef.click();
        }
        
        // Refresh the connections list without page reload
        setTimeout(() => {
          // Trigger a refresh of connections via the custom event
          window.dispatchEvent(new CustomEvent('refreshConnections'));
          // Force component refresh
          setRefreshKey(prev => prev + 1);
        }, 500);
      } else {
        setErrorMessage(response.message || 'Failed to connect to Slack API');
      }
    } catch (error) {
      setErrorMessage('Error connecting to Slack API: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handler for connecting to Notion
  const handleConnectNotion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Create a notion connection using the correct endpoint
      const connectionData = {
        type: 'notion',
        name: 'Notion',
        isConnected: true,
        credentials: notionCredentials
      };
      
      const response = await apiRequest<{id: string | number}>('/api/api-connections', 'POST', connectionData);
      
      if (response && response.id) {
        setSuccessMessage('Successfully connected to Notion API!');
        
        // Automatically close the dialog
        if (dialogCloseRef) {
          dialogCloseRef.click();
        }
        
        // Refresh the connections list
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        setErrorMessage('Failed to connect to Notion API');
      }
    } catch (error) {
      setErrorMessage('Error connecting to Notion API: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handler for connecting to Klaviyo
  const handleConnectKlaviyo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Create a klaviyo connection using the correct endpoint
      const connectionData = {
        type: 'klaviyo',
        name: 'Klaviyo',
        isConnected: true,
        credentials: klaviyoCredentials
      };
      
      const response = await apiRequest<{id: string | number}>('/api/api-connections', 'POST', connectionData);
      
      if (response && response.id) {
        setSuccessMessage('Successfully connected to Klaviyo API!');
        
        // Automatically close the dialog
        if (dialogCloseRef) {
          dialogCloseRef.click();
        }
        
        // Refresh the connections list
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        setErrorMessage('Failed to connect to Klaviyo API');
      }
    } catch (error) {
      setErrorMessage('Error connecting to Klaviyo API: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handler for connecting to Postscript
  const handleConnectPostscript = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const response = await apiRequest<{success: boolean; message?: string}>('/api/connect/postscript', 'POST', postscriptCredentials);
      
      if (response.success) {
        setSuccessMessage('Successfully connected to Postscript API!');
        
        // Automatically close the dialog
        if (dialogCloseRef) {
          dialogCloseRef.click();
        }
        
        // Refresh the connections list
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        setErrorMessage(response.message || 'Failed to connect to Postscript API');
      }
    } catch (error) {
      setErrorMessage('Error connecting to Postscript API: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handler for connecting to Northbeam
  const handleConnectNorthbeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const response = await apiRequest<{success: boolean; message?: string}>('/api/connect/northbeam', 'POST', northbeamCredentials);
      
      if (response.success) {
        setSuccessMessage('Successfully connected to Northbeam API!');
        
        // Automatically close the dialog
        if (dialogCloseRef) {
          dialogCloseRef.click();
        }
        
        // Refresh the connections list
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        setErrorMessage(response.message || 'Failed to connect to Northbeam API');
      }
    } catch (error) {
      setErrorMessage('Error connecting to Northbeam API: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handler for connecting to Triple Whale
  const handleConnectTripleWhale = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const response = await apiRequest<{success: boolean; message?: string}>('/api/connect/triplewhale', 'POST', triplewhaleCredentials);
      
      if (response.success) {
        setSuccessMessage('Successfully connected to Triple Whale API!');
        
        // Automatically close the dialog
        if (dialogCloseRef) {
          dialogCloseRef.click();
        }
        
        // Refresh the connections list
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        setErrorMessage(response.message || 'Failed to connect to Triple Whale API');
      }
    } catch (error) {
      setErrorMessage('Error connecting to Triple Whale API: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handler for connecting to OpenAI
  const handleConnectOpenAI = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Validate required fields
      if (!openaiCredentials.apiKey) {
        setErrorMessage('Please provide your OpenAI API key');
        setIsSubmitting(false);
        return;
      }
      
      // Import here to avoid circular dependencies
      const { createApiConnection } = await import('@/lib/ApiClient');
      
      // Use our API client to connect to OpenAI
      const response = await createApiConnection({
        type: 'openai',
        name: 'OpenAI',
        isConnected: true,
        credentials: openaiCredentials
      });
      
      if (response.success) {
        setSuccessMessage('Successfully connected to OpenAI API!');
        
        // Automatically close the dialog
        if (dialogCloseRef) {
          dialogCloseRef.click();
        }
        
        // Trigger the refresh event
        window.dispatchEvent(new CustomEvent('refreshConnections'));
        
        // Force refresh of connections
        setRefreshKey(prev => prev + 1);
      } else {
        setErrorMessage(response.message || 'Failed to connect to OpenAI API. Please check your API key and try again.');
      }
    } catch (error) {
      console.error('Error connecting to OpenAI API:', error);
      
      // Provide more detailed error messages for different scenarios
      if (error instanceof Error) {
        if (error.message.includes('credentials')) {
          setErrorMessage('Database error: Failed to store API credentials. This may be due to missing the credentials column in the database.');
        } else if (error.message.includes('UNIQUE')) {
          setErrorMessage('An OpenAI connection already exists. Try updating the existing connection instead.');
        } else if (error.message.includes('unauthorized') || error.message.includes('401') || error.message.includes('authentication')) {
          setErrorMessage('Authentication failed: Your OpenAI API key appears to be invalid. Please check it and try again.');
        } else if (error.message.includes('network') || error.message.includes('timeout')) {
          setErrorMessage('Network error: Unable to connect to OpenAI. Please check your internet connection.');
        } else if (error.message.includes('quota') || error.message.includes('billing') || error.message.includes('exceeded')) {
          setErrorMessage('OpenAI API usage limit exceeded: Please check your OpenAI account billing status.');
        } else {
          setErrorMessage('Error connecting to OpenAI API: ' + error.message);
        }
      } else {
        setErrorMessage('Error connecting to OpenAI API: ' + String(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white h-full overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        {/* Mock Mode Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-500" />
              Mock Mode
            </CardTitle>
            <CardDescription>
              When enabled, API requests will use mock data instead of making real API calls.
              This is useful for testing and development without using real API quotas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="mock-mode"
                checked={isMockMode}
                onCheckedChange={handleToggleMockMode}
                disabled={isMockLoading}
              />
              <Label htmlFor="mock-mode">
                {isMockMode ? 'Enabled' : 'Disabled'}
              </Label>
            </div>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            {isMockLoading ? 'Loading mock mode status...' : 
              isMockMode ? 
                'Mock mode is active - using simulated data for all API requests.' : 
                'Mock mode is inactive - using real API connections.'}
          </CardFooter>
        </Card>
        
        {/* API Connections */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">API Connections</h2>
          </div>
          
          {errorMessage && (
            <div className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-md mb-4">
              {errorMessage}
            </div>
          )}
          
          {successMessage && (
            <div className="px-3 py-2 text-sm bg-green-50 text-green-600 rounded-md mb-4">
              {successMessage}
            </div>
          )}
          
          {isLoading ? (
            <p>Loading connections...</p>
          ) : (
            <div className="space-y-8">
              {/* Render connections by category */}
              {Object.entries(serviceCategories).map(([category, services]) => {
                // Filter connections that belong to this category
                const categoryConnections = allConnections.filter(
                  conn => services.includes(conn.type?.toLowerCase() || '')
                );
                
                // Only show category if it has connections
                if (categoryConnections.length === 0) return null;
                
                return (
                  <div key={category} className="space-y-3">
                    <h3 className="text-lg font-medium text-gray-800 border-b pb-2">{category}</h3>
                    <div className="grid gap-4">
                      {categoryConnections.map(connection => (
                        <div key={connection.id} className="border rounded-lg p-4 bg-gray-50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {connection.type && apiIconMap[connection.type.toLowerCase()] || <Database className="h-5 w-5 text-gray-500" />}
                            <div>
                              <h3 className="font-medium capitalize">{connection.name}</h3>
                              <p className="text-sm text-gray-500">{connection.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`connection-${connection.id}`} className="sr-only">
                              {connection.isConnected ? 'Connected' : 'Disconnected'}
                            </Label>
                            <span className={`text-sm ${connection.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                              {connection.isConnected ? 'Connected' : 'Disconnected'}
                            </span>
                            <Switch
                              id={`connection-${connection.id}`}
                              checked={connection.isConnected}
                              onCheckedChange={() => handleToggleConnection(connection.id, connection.isConnected, connection.type)}
                            />
                            
                            {/* Edit Button for credentials */}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setActiveApiForm(connection.type || '')}>
                              Edit Credentials
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {/* All connections are now categorized thanks to the auto-categorization code */}
            </div>
          )}
          
          {/* API Connection Forms - These can be rendered in a dialog */}
          <Dialog open={!!activeApiForm} onOpenChange={(open) => !open && setActiveApiForm('')}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {activeApiForm ? `Edit ${serviceNameMap[activeApiForm.toLowerCase()] || activeApiForm} API Credentials` : 'Edit API Credentials'}
                </DialogTitle>
                <DialogDescription>
                  Update your API credentials to connect to this service.
                </DialogDescription>
              </DialogHeader>
              
              {activeApiForm?.toLowerCase() === 'shopify' && (
                <form onSubmit={handleConnectShopify} className="space-y-4">
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="shopDomain">Shop Domain</Label>
                    <Input
                      id="shopDomain"
                      name="shopDomain"
                      placeholder="your-store.myshopify.com"
                      value={shopifyCredentials.shopDomain}
                      onChange={handleShopifyInputChange}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      The domain of your Shopify store.
                    </p>
                  </div>
                  
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      name="apiKey"
                      placeholder="Your Shopify API Key"
                      value={shopifyCredentials.apiKey}
                      onChange={handleShopifyInputChange}
                      required
                    />
                  </div>
                  
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="apiSecretKey">API Secret Key</Label>
                    <Input
                      id="apiSecretKey"
                      name="apiSecretKey"
                      type="password"
                      placeholder="Your Shopify API Secret Key"
                      value={shopifyCredentials.apiSecretKey}
                      onChange={handleShopifyInputChange}
                      required
                    />
                  </div>
                  
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="accessToken">Access Token</Label>
                    <Input
                      id="accessToken"
                      name="accessToken"
                      type="password"
                      placeholder="Your Shopify Access Token"
                      value={shopifyCredentials.accessToken}
                      onChange={handleShopifyInputChange}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      You can generate an access token in your Shopify admin under Apps &gt; Develop apps.
                    </p>
                  </div>
                  
                  <DialogFooter className="sm:justify-end mt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Connecting...' : 'Connect to Shopify'}
                    </Button>
                    <DialogClose ref={setDialogCloseRef} className="hidden" />
                  </DialogFooter>
                </form>
              )}
              
              {activeApiForm?.toLowerCase() === 'slack' && (
                <form onSubmit={handleConnectSlack} className="space-y-4">
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="botToken">Bot Token</Label>
                    <Input
                      id="botToken"
                      name="botToken"
                      type="password"
                      placeholder="xoxb-..."
                      value={slackCredentials.botToken}
                      onChange={handleSlackInputChange}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Your Slack Bot Token starting with xoxb-. Get it from Slack API dashboard.
                    </p>
                  </div>
                  
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="channelId">Channel ID</Label>
                    <Input
                      id="channelId"
                      name="channelId"
                      placeholder="C12345..."
                      value={slackCredentials.channelId}
                      onChange={handleSlackInputChange}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      The ID of the Slack channel. Right-click on a channel and copy the ID.
                    </p>
                  </div>
                  
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="appToken">App Token (Optional)</Label>
                    <Input
                      id="appToken"
                      name="appToken"
                      type="password"
                      placeholder="xapp-..."
                      value={slackCredentials.appToken}
                      onChange={handleSlackInputChange}
                    />
                    <p className="text-xs text-gray-500">
                      Your Slack App-level Token starting with xapp-. Used for socket mode.
                    </p>
                  </div>
                  
                  <DialogFooter className="sm:justify-end mt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Connecting...' : 'Connect to Slack'}
                    </Button>
                    <DialogClose ref={setDialogCloseRef} className="hidden" />
                  </DialogFooter>
                </form>
              )}
              
              {activeApiForm?.toLowerCase() === 'notion' && (
                <form onSubmit={handleConnectNotion} className="space-y-4">
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="notionToken">Integration Token</Label>
                    <Input
                      id="notionToken"
                      name="notionToken"
                      type="password"
                      placeholder="secret_..."
                      value={notionCredentials.notionToken}
                      onChange={handleNotionInputChange}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Your Notion Integration Token starting with secret_. Get it from Notion Integrations page.
                    </p>
                  </div>
                  
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="databaseId">Database ID (Optional)</Label>
                    <Input
                      id="databaseId"
                      name="databaseId"
                      placeholder="1234abcd..."
                      value={notionCredentials.databaseId}
                      onChange={handleNotionInputChange}
                    />
                    <p className="text-xs text-gray-500">
                      The ID of your primary Notion database. Found in the database URL.
                    </p>
                  </div>
                  
                  <DialogFooter className="sm:justify-end mt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Connecting...' : 'Connect to Notion'}
                    </Button>
                    <DialogClose ref={setDialogCloseRef} className="hidden" />
                  </DialogFooter>
                </form>
              )}
              
              {activeApiForm?.toLowerCase() === 'klaviyo' && (
                <form onSubmit={handleConnectKlaviyo} className="space-y-4">
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="privateApiKey">Private API Key</Label>
                    <Input
                      id="privateApiKey"
                      name="privateApiKey"
                      type="password"
                      placeholder="pk_..."
                      value={klaviyoCredentials.privateApiKey}
                      onChange={handleKlaviyoInputChange}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Your Klaviyo Private API Key starting with pk_. Get it from Klaviyo Account &gt; Settings &gt; API Keys.
                    </p>
                  </div>
                  
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="publicApiKey">Public API Key</Label>
                    <Input
                      id="publicApiKey"
                      name="publicApiKey"
                      placeholder="Public API Key"
                      value={klaviyoCredentials.publicApiKey}
                      onChange={handleKlaviyoInputChange}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Your Klaviyo Public API Key. Used for tracking and analytics.
                    </p>
                  </div>
                  
                  <DialogFooter className="sm:justify-end mt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Connecting...' : 'Connect to Klaviyo'}
                    </Button>
                    <DialogClose ref={setDialogCloseRef} className="hidden" />
                  </DialogFooter>
                </form>
              )}
              
              {activeApiForm?.toLowerCase() === 'postscript' && (
                <form onSubmit={handleConnectPostscript} className="space-y-4">
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      name="apiKey"
                      type="password"
                      placeholder="ps_..."
                      value={postscriptCredentials.apiKey}
                      onChange={handlePostscriptInputChange}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Your Postscript API Key. Get it from Postscript Developer settings.
                    </p>
                  </div>
                  
                  <DialogFooter className="sm:justify-end mt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Connecting...' : 'Connect to Postscript'}
                    </Button>
                    <DialogClose ref={setDialogCloseRef} className="hidden" />
                  </DialogFooter>
                </form>
              )}
              
              {activeApiForm?.toLowerCase() === 'northbeam' && (
                <form onSubmit={handleConnectNorthbeam} className="space-y-4">
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      name="apiKey"
                      type="password"
                      placeholder="nb_..."
                      value={northbeamCredentials.apiKey}
                      onChange={handleNorthbeamInputChange}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Your Northbeam API Key. Get it from the Northbeam dashboard.
                    </p>
                  </div>
                  
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="clientId">Client ID</Label>
                    <Input
                      id="clientId"
                      name="clientId"
                      placeholder="Your client ID"
                      value={northbeamCredentials.clientId}
                      onChange={handleNorthbeamInputChange}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Your Northbeam Client ID for data attribution.
                    </p>
                  </div>
                  
                  <DialogFooter className="sm:justify-end mt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Connecting...' : 'Connect to Northbeam'}
                    </Button>
                    <DialogClose ref={setDialogCloseRef} className="hidden" />
                  </DialogFooter>
                </form>
              )}
              
              {activeApiForm?.toLowerCase() === 'triplewhale' && (
                <form onSubmit={handleConnectTripleWhale} className="space-y-4">
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      name="apiKey"
                      type="password"
                      placeholder="tw_..."
                      value={triplewhaleCredentials.apiKey}
                      onChange={handleTriplewhaleInputChange}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Your Triple Whale API Key. Get it from the Triple Whale settings page.
                    </p>
                  </div>
                  
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="pixelId">Pixel ID</Label>
                    <Input
                      id="pixelId"
                      name="pixelId"
                      placeholder="Your pixel ID"
                      value={triplewhaleCredentials.pixelId}
                      onChange={handleTriplewhaleInputChange}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Your Triple Whale Pixel ID for tracking. Find it in your tracking settings.
                    </p>
                  </div>
                  
                  <DialogFooter className="sm:justify-end mt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Connecting...' : 'Connect to Triple Whale'}
                    </Button>
                    <DialogClose ref={setDialogCloseRef} className="hidden" />
                  </DialogFooter>
                </form>
              )}
              
              {activeApiForm?.toLowerCase() === 'openai' && (
                <form onSubmit={handleConnectOpenAI} className="space-y-4">
                  {/* Show an inline error message if there's one */}
                  {errorMessage && (
                    <div className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-md mb-4 border border-red-200">
                      {errorMessage}
                    </div>
                  )}
                  {successMessage && (
                    <div className="px-3 py-2 text-sm bg-green-50 text-green-600 rounded-md mb-4 border border-green-200">
                      {successMessage}
                    </div>
                  )}
                  
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      name="apiKey"
                      type="password"
                      placeholder="sk-..."
                      value={openaiCredentials.apiKey}
                      onChange={handleOpenaiInputChange}
                      required
                      className={errorMessage ? "border-red-300 focus-visible:ring-red-400" : ""}
                    />
                    <p className="text-xs text-gray-500">
                      Your OpenAI API Key starting with sk-. Get it from your OpenAI account dashboard.
                    </p>
                  </div>
                  
                  <div className="text-sm text-amber-600 bg-amber-50 rounded-md p-3 border border-amber-200">
                    <p><strong>Note:</strong> If you're experiencing issues with API key storage, this form uses a special mechanism to ensure your 
                    OpenAI API key is properly saved in the database.</p>
                  </div>
                  
                  <DialogFooter className="sm:justify-end mt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Connecting...' : 'Connect to OpenAI'}
                    </Button>
                    <DialogClose ref={setDialogCloseRef} className="hidden" />
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
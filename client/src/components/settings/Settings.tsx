import { useState, useEffect } from 'react';
import { type ApiConnection } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SiSlack, SiShopify, SiNotion, SiOpenai, SiGithub, SiGoogle, SiFigma } from 'react-icons/si';
import { FiPlus } from 'react-icons/fi';
import { Clipboard, Database, MessageSquare, BarChart, X, LogOut, LineChart, BarChart3, MessageCircle, RefreshCcw, BrainCircuit, PieChart, Calendar, Github, CheckSquare, FileType } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { disconnectWebSocket } from '@/lib/websocket';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SettingsProps {
  connections: ApiConnection[];
  isLoading: boolean;
  onToggleConnection: (id: number | string, isConnected: boolean, type: string) => void;
}

export default function Settings({ connections, isLoading, onToggleConnection }: SettingsProps) {
  // API Connection Form State
  const [activeApiForm, setActiveApiForm] = useState<string>('shopify');
  
  // Shared form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // State for Shopify API credentials
  const [shopifyCredentials, setShopifyCredentials] = useState({
    apiKey: '',
    apiSecretKey: '',
    shopDomain: '',
    accessToken: ''
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
  
  // State for Gorgias API credentials
  const [gorgiasCredentials, setGorgiasCredentials] = useState({
    apiKey: '',
    shopName: ''
  });
  
  // State for Recharm API credentials
  const [recharmCredentials, setRecharmCredentials] = useState({
    apiKey: '',
    storeId: ''
  });
  
  // State for Prescient AI API credentials
  const [prescientaiCredentials, setPrescientaiCredentials] = useState({
    apiKey: ''
  });
  
  // State for Elevar API credentials
  const [elevarCredentials, setElevarCredentials] = useState({
    apiKey: '',
    shopId: ''
  });
  
  // State for GitHub API credentials
  const [githubCredentials, setGithubCredentials] = useState({
    accessToken: '',
    username: ''
  });
  
  // State for Google Calendar API credentials
  const [googleCalendarCredentials, setGoogleCalendarCredentials] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: ''
  });
  
  // Asana credentials state
  const [asanaCredentials, setAsanaCredentials] = useState({
    accessToken: '',
    workspaceGid: ''
  });
  
  // Figma credentials state
  const [figmaCredentials, setFigmaCredentials] = useState({
    accessToken: ''
  });
  
  // Google Drive credentials state
  const [gdriveCredentials, setGdriveCredentials] = useState({
    clientId: '',
    clientSecret: '',
    refreshToken: ''
  });
  
  // Load existing credentials if available
  useEffect(() => {
    if (!isLoading && connections.length > 0) {
      const shopifyConn = connections.find(conn => conn.type && conn.type.toLowerCase() === 'shopify');
      const slackConn = connections.find(conn => conn.type && conn.type.toLowerCase() === 'slack');
      const notionConn = connections.find(conn => conn.type && conn.type.toLowerCase() === 'notion');
      const klaviyoConn = connections.find(conn => conn.type && conn.type.toLowerCase() === 'klaviyo');
      const postscriptConn = connections.find(conn => conn.type && conn.type.toLowerCase() === 'postscript');
      const northbeamConn = connections.find(conn => conn.type && conn.type.toLowerCase() === 'northbeam');
      const triplewhaleConn = connections.find(conn => conn.type && conn.type.toLowerCase() === 'triplewhale');
      const gorgiasConn = connections.find(conn => conn.type && conn.type.toLowerCase() === 'gorgias');
      const recharmConn = connections.find(conn => conn.type && conn.type.toLowerCase() === 'recharm');
      const prescientaiConn = connections.find(conn => conn.type && conn.type.toLowerCase() === 'prescientai');
      const elevarConn = connections.find(conn => conn.type && conn.type.toLowerCase() === 'elevar');
      const githubConn = connections.find(conn => conn.type && conn.type.toLowerCase() === 'github');
      const googleCalendarConn = connections.find(conn => conn.type && conn.type.toLowerCase() === 'googlecalendar');
      const asanaConn = connections.find(conn => conn.type && conn.type.toLowerCase() === 'asana');
      const figmaConn = connections.find(conn => conn.type && conn.type.toLowerCase() === 'figma');
      const gdriveConn = connections.find(conn => conn.type && conn.type.toLowerCase() === 'gdrive');
      
      if (shopifyConn?.credentials) {
        try {
          const creds = shopifyConn.credentials as any;
          setShopifyCredentials({
            apiKey: creds.apiKey || '',
            apiSecretKey: creds.apiSecretKey || '',
            shopDomain: creds.shopDomain || '',
            accessToken: creds.accessToken || ''
          });
        } catch (e) {
          console.error('Error parsing Shopify credentials:', e);
        }
      }
      
      if (slackConn?.credentials) {
        try {
          const creds = slackConn.credentials as any;
          setSlackCredentials({
            botToken: creds.botToken || '',
            channelId: creds.channelId || '',
            appToken: creds.appToken || ''
          });
        } catch (e) {
          console.error('Error parsing Slack credentials:', e);
        }
      }
      
      if (notionConn?.credentials) {
        try {
          const creds = notionConn.credentials as any;
          setNotionCredentials({
            notionToken: creds.notionToken || '',
            databaseId: creds.databaseId || ''
          });
        } catch (e) {
          console.error('Error parsing Notion credentials:', e);
        }
      }
      
      if (klaviyoConn?.credentials) {
        try {
          const creds = klaviyoConn.credentials as any;
          setKlaviyoCredentials({
            privateApiKey: creds.privateApiKey || '',
            publicApiKey: creds.publicApiKey || ''
          });
        } catch (e) {
          console.error('Error parsing Klaviyo credentials:', e);
        }
      }
      
      if (postscriptConn?.credentials) {
        try {
          const creds = postscriptConn.credentials as any;
          setPostscriptCredentials({
            apiKey: creds.apiKey || ''
          });
        } catch (e) {
          console.error('Error parsing Postscript credentials:', e);
        }
      }
      
      if (northbeamConn?.credentials) {
        try {
          const creds = northbeamConn.credentials as any;
          setNorthbeamCredentials({
            apiKey: creds.apiKey || '',
            clientId: creds.clientId || ''
          });
        } catch (e) {
          console.error('Error parsing Northbeam credentials:', e);
        }
      }
      
      if (triplewhaleConn?.credentials) {
        try {
          const creds = triplewhaleConn.credentials as any;
          setTriplewhaleCredentials({
            apiKey: creds.apiKey || '',
            pixelId: creds.pixelId || ''
          });
        } catch (e) {
          console.error('Error parsing Triple Whale credentials:', e);
        }
      }
      
      if (gorgiasConn?.credentials) {
        try {
          const creds = gorgiasConn.credentials as any;
          setGorgiasCredentials({
            apiKey: creds.apiKey || '',
            shopName: creds.shopName || ''
          });
        } catch (e) {
          console.error('Error parsing Gorgias credentials:', e);
        }
      }
      
      if (recharmConn?.credentials) {
        try {
          const creds = recharmConn.credentials as any;
          setRecharmCredentials({
            apiKey: creds.apiKey || '',
            storeId: creds.storeId || ''
          });
        } catch (e) {
          console.error('Error parsing Recharm credentials:', e);
        }
      }
      
      if (prescientaiConn?.credentials) {
        try {
          const creds = prescientaiConn.credentials as any;
          setPrescientaiCredentials({
            apiKey: creds.apiKey || ''
          });
        } catch (e) {
          console.error('Error parsing Prescient AI credentials:', e);
        }
      }
      
      if (elevarConn?.credentials) {
        try {
          const creds = elevarConn.credentials as any;
          setElevarCredentials({
            apiKey: creds.apiKey || '',
            shopId: creds.shopId || ''
          });
        } catch (e) {
          console.error('Error parsing Elevar credentials:', e);
        }
      }
      
      if (githubConn?.credentials) {
        try {
          const creds = githubConn.credentials as any;
          setGithubCredentials({
            accessToken: creds.accessToken || '',
            username: creds.username || ''
          });
        } catch (e) {
          console.error('Error parsing GitHub credentials:', e);
        }
      }
      
      if (googleCalendarConn?.credentials) {
        try {
          const creds = googleCalendarConn.credentials as any;
          setGoogleCalendarCredentials({
            clientId: creds.clientId || '',
            clientSecret: creds.clientSecret || '',
            redirectUri: creds.redirectUri || ''
          });
        } catch (e) {
          console.error('Error parsing Google Calendar credentials:', e);
        }
      }
      
      if (asanaConn?.credentials) {
        try {
          const creds = asanaConn.credentials as any;
          setAsanaCredentials({
            accessToken: creds.accessToken || '',
            workspaceGid: creds.workspaceGid || ''
          });
        } catch (e) {
          console.error('Error parsing Asana credentials:', e);
        }
      }
      
      if (figmaConn?.credentials) {
        try {
          const creds = figmaConn.credentials as any;
          setFigmaCredentials({
            accessToken: creds.accessToken || ''
          });
        } catch (e) {
          console.error('Error parsing Figma credentials:', e);
        }
      }
      
      if (gdriveConn?.credentials) {
        try {
          const creds = gdriveConn.credentials as any;
          setGdriveCredentials({
            clientId: creds.clientId || '',
            clientSecret: creds.clientSecret || '',
            refreshToken: creds.refreshToken || ''
          });
        } catch (e) {
          console.error('Error parsing Google Drive credentials:', e);
        }
      }
    }
  }, [connections, isLoading]);

  // Handle Shopify form input changes
  const handleShopifyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShopifyCredentials({
      ...shopifyCredentials,
      [name]: value
    });
  };
  
  // Handle Slack form input changes
  const handleSlackInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSlackCredentials({
      ...slackCredentials,
      [name]: value
    });
  };
  
  // Handle Notion form input changes
  const handleNotionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNotionCredentials({
      ...notionCredentials,
      [name]: value
    });
  };
  
  // Handle Klaviyo form input changes
  const handleKlaviyoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setKlaviyoCredentials({
      ...klaviyoCredentials,
      [name]: value
    });
  };
  
  // Handle Postscript form input changes
  const handlePostscriptInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPostscriptCredentials({
      ...postscriptCredentials,
      [name]: value
    });
  };
  
  // Handle Northbeam form input changes
  const handleNorthbeamInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNorthbeamCredentials({
      ...northbeamCredentials,
      [name]: value
    });
  };
  
  // Handle Triple Whale form input changes
  const handleTriplewhaleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTriplewhaleCredentials({
      ...triplewhaleCredentials,
      [name]: value
    });
  };
  
  // Handle Gorgias form input changes
  const handleGorgiasInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGorgiasCredentials({
      ...gorgiasCredentials,
      [name]: value
    });
  };
  
  // Handle Recharm form input changes
  const handleRecharmInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRecharmCredentials({
      ...recharmCredentials,
      [name]: value
    });
  };
  
  // Handle Prescient AI form input changes
  const handlePrescientaiInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPrescientaiCredentials({
      ...prescientaiCredentials,
      [name]: value
    });
  };
  
  // Handle Elevar form input changes
  const handleElevarInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setElevarCredentials({
      ...elevarCredentials,
      [name]: value
    });
  };
  
  // Handle GitHub form input changes
  const handleGithubInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGithubCredentials({
      ...githubCredentials,
      [name]: value
    });
  };
  
  // Handle Google Calendar form input changes
  const handleGoogleCalendarInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGoogleCalendarCredentials({
      ...googleCalendarCredentials,
      [name]: value
    });
  };
  
  // Handle Asana form input changes
  const handleAsanaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAsanaCredentials({
      ...asanaCredentials,
      [name]: value
    });
  };
  
  // Handle Figma form input changes
  const handleFigmaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFigmaCredentials({
      ...figmaCredentials,
      [name]: value
    });
  };
  
  // Handle Google Drive form input changes
  const handleGdriveInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGdriveCredentials({
      ...gdriveCredentials,
      [name]: value
    });
  };

  // Generic connection handler
  const handleConnectApi = async (
    e: React.FormEvent,
    type: string,
    name: string,
    credentials: any
  ) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Find existing connection
      const existingConnection = connections.find(conn => conn.type && conn.type.toLowerCase() === type.toLowerCase());
      
      if (existingConnection) {
        // Update existing connection
        const response = await apiRequest('PUT', `/api/api-connections/${existingConnection.id}`, {
          isConnected: true,
          credentials
        });
        
        if (response.ok) {
          setSuccessMessage(`${name} API connected successfully!`);
          // Refresh connections by re-fetching
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['/api/api-connections'] });
          }, 1000);
        } else {
          const error = await response.json();
          setErrorMessage(error.message || `Failed to connect to ${name} API`);
        }
      } else {
        // Create new connection
        const response = await apiRequest('POST', '/api/api-connections', {
          name,
          type,
          isConnected: true,
          credentials
        });
        
        if (response.ok) {
          setSuccessMessage(`${name} API connection created successfully!`);
          // Refresh connections by re-fetching
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['/api/api-connections'] });
          }, 1000);
        } else {
          const error = await response.json();
          setErrorMessage(error.message || `Failed to create ${name} API connection`);
        }
      }
    } catch (error) {
      setErrorMessage(`An error occurred while connecting to ${name} API`);
      console.error(`Error connecting to ${name}:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle Shopify API connection
  const handleConnectShopify = (e: React.FormEvent) => {
    return handleConnectApi(e, 'shopify', 'Shopify', shopifyCredentials);
  };
  
  // Handle Slack API connection
  const handleConnectSlack = (e: React.FormEvent) => {
    return handleConnectApi(e, 'slack', 'Slack', slackCredentials);
  };
  
  // Handle Notion API connection
  const handleConnectNotion = (e: React.FormEvent) => {
    return handleConnectApi(e, 'notion', 'Notion', notionCredentials);
  };
  
  // Handle Klaviyo API connection
  const handleConnectKlaviyo = (e: React.FormEvent) => {
    return handleConnectApi(e, 'klaviyo', 'Klaviyo', klaviyoCredentials);
  };
  
  // Handle Postscript API connection
  const handleConnectPostscript = (e: React.FormEvent) => {
    return handleConnectApi(e, 'postscript', 'Postscript', postscriptCredentials);
  };
  
  // Handle Northbeam API connection
  const handleConnectNorthbeam = (e: React.FormEvent) => {
    return handleConnectApi(e, 'northbeam', 'Northbeam', northbeamCredentials);
  };
  
  // Handle Triple Whale API connection
  const handleConnectTripleWhale = (e: React.FormEvent) => {
    return handleConnectApi(e, 'triplewhale', 'Triple Whale', triplewhaleCredentials);
  };
  
  // Handle Gorgias API connection
  const handleConnectGorgias = (e: React.FormEvent) => {
    return handleConnectApi(e, 'gorgias', 'Gorgias', gorgiasCredentials);
  };
  
  // Handle Recharm API connection
  const handleConnectRecharm = (e: React.FormEvent) => {
    return handleConnectApi(e, 'recharm', 'Recharm', recharmCredentials);
  };
  
  // Handle Prescient AI API connection
  const handleConnectPrescientAi = (e: React.FormEvent) => {
    return handleConnectApi(e, 'prescientai', 'Prescient AI', prescientaiCredentials);
  };
  
  // Handle Elevar API connection
  const handleConnectElevar = (e: React.FormEvent) => {
    return handleConnectApi(e, 'elevar', 'Elevar', elevarCredentials);
  };
  
  // Handle GitHub API connection
  const handleConnectGitHub = (e: React.FormEvent) => {
    return handleConnectApi(e, 'github', 'GitHub', githubCredentials);
  };
  
  // Handle Google Calendar API connection
  const handleConnectGoogleCalendar = (e: React.FormEvent) => {
    return handleConnectApi(e, 'googlecalendar', 'Google Calendar', googleCalendarCredentials);
  };
  
  // Handle Asana API connection
  const handleConnectAsana = (e: React.FormEvent) => {
    return handleConnectApi(e, 'asana', 'Asana', asanaCredentials);
  };
  
  // Handle Figma API connection
  const handleConnectFigma = (e: React.FormEvent) => {
    return handleConnectApi(e, 'figma', 'Figma', figmaCredentials);
  };
  
  // Handle Google Drive API connection
  const handleConnectGdrive = (e: React.FormEvent) => {
    return handleConnectApi(e, 'gdrive', 'Google Drive', gdriveCredentials);
  };

  // Map for API icons
  const apiIconMap: Record<string, React.ReactNode> = {
    shopify: <SiShopify className="h-5 w-5 text-green-500" />,
    slack: <SiSlack className="h-5 w-5 text-blue-500" />,
    notion: <SiNotion className="h-5 w-5 text-gray-900" />,
    chatgpt: <SiOpenai className="h-5 w-5 text-teal-500" />,
    northbeam: <BarChart className="h-5 w-5 text-orange-500" />,
    postscript: <MessageSquare className="h-5 w-5 text-purple-500" />,
    klaviyo: <Clipboard className="h-5 w-5 text-green-600" />,
    triplewhale: <LineChart className="h-5 w-5 text-blue-600" />,
    gorgias: <MessageCircle className="h-5 w-5 text-cyan-500" />,
    recharm: <RefreshCcw className="h-5 w-5 text-pink-500" />,
    prescientai: <BrainCircuit className="h-5 w-5 text-violet-500" />,
    elevar: <PieChart className="h-5 w-5 text-amber-500" />,
    github: <SiGithub className="h-5 w-5 text-gray-800" />,
    googlecalendar: <Calendar className="h-5 w-5 text-blue-400" />,
    asana: <CheckSquare className="h-5 w-5 text-red-500" />,
    figma: <SiFigma className="h-5 w-5 text-violet-600" />,
    gdrive: <FileType className="h-5 w-5 text-yellow-500" />,
  };
  
  // Service names mapping for display
  const serviceNameMap: Record<string, string> = {
    shopify: 'Shopify',
    slack: 'Slack',
    notion: 'Notion',
    chatgpt: 'ChatGPT',
    northbeam: 'Northbeam',
    postscript: 'Postscript',
    klaviyo: 'Klaviyo',
    triplewhale: 'Triple Whale',
    gorgias: 'Gorgias',
    recharm: 'Recharm',
    prescientai: 'Prescient AI',
    elevar: 'Elevar',
    github: 'GitHub',
    googlecalendar: 'Google Calendar',
    asana: 'Asana',
    figma: 'Figma',
    gdrive: 'Google Drive',
  };
  
  // Create a merged list of all connections (existing + missing ones)
  const [allConnections, setAllConnections] = useState<ApiConnection[]>([]);
  
  // Handle toggle for placeholder connections
  const handleToggleConnection = (id: string | number, isConnected: boolean, type?: string) => {
    // If it's a new/placeholder connection (id starts with "new-"), we need to create it first
    if (typeof id === 'string' && id.startsWith('new-') && type) {
      // Open the edit credentials dialog for this service
      setActiveApiForm(type);
      
      // For placeholder connections we don't toggle immediately, 
      // user needs to fill in credentials first
      return;
    }
    
    // For existing connections, pass to parent handler
    onToggleConnection(id, isConnected, type || '');
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
            id: `new-${service}`,
            name: serviceNameMap[service] || service,
            type: service,
            isConnected: false,
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
  }, [connections, isLoading]);

  return (
    <div className="bg-white h-full overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
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
          
          <div className="grid gap-4">
            {isLoading ? (
              <p>Loading connections...</p>
            ) : (
              allConnections.map(connection => (
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
              ))
            )}
          </div>
          
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
                      </DialogFooter>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="notion">
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
                      </DialogFooter>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="klaviyo">
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
                      </DialogFooter>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="postscript">
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
                      </DialogFooter>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="northbeam">
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
                      </DialogFooter>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="triplewhale">
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
                      </DialogFooter>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="gorgias">
                    <form onSubmit={handleConnectGorgias} className="space-y-4">
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input
                          id="apiKey"
                          name="apiKey"
                          type="password"
                          placeholder="gorg_..."
                          value={gorgiasCredentials.apiKey}
                          onChange={handleGorgiasInputChange}
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Your Gorgias API Key. Get it from the Gorgias Admin &gt; Settings &gt; REST API.
                        </p>
                      </div>
                      
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="shopName">Shop Name</Label>
                        <Input
                          id="shopName"
                          name="shopName"
                          placeholder="your-shop"
                          value={gorgiasCredentials.shopName}
                          onChange={handleGorgiasInputChange}
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Your Gorgias shop name from your subdomain (yourshop.gorgias.com).
                        </p>
                      </div>
                      
                      <DialogFooter className="sm:justify-end mt-4">
                        <DialogClose asChild>
                          <Button type="button" variant="outline">
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Connecting...' : 'Connect to Gorgias'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="recharm">
                    <form onSubmit={handleConnectRecharm} className="space-y-4">
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input
                          id="apiKey"
                          name="apiKey"
                          type="password"
                          placeholder="rc_..."
                          value={recharmCredentials.apiKey}
                          onChange={handleRecharmInputChange}
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Your Recharm API Key. Found in the Recharm dashboard under API settings.
                        </p>
                      </div>
                      
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="storeId">Store ID</Label>
                        <Input
                          id="storeId"
                          name="storeId"
                          placeholder="Your Recharm Store ID"
                          value={recharmCredentials.storeId}
                          onChange={handleRecharmInputChange}
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Your Recharm Store ID for cart recovery campaigns.
                        </p>
                      </div>
                      
                      <DialogFooter className="sm:justify-end mt-4">
                        <DialogClose asChild>
                          <Button type="button" variant="outline">
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Connecting...' : 'Connect to Recharm'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="prescientai">
                    <form onSubmit={handleConnectPrescientAi} className="space-y-4">
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input
                          id="apiKey"
                          name="apiKey"
                          type="password"
                          placeholder="pa_..."
                          value={prescientaiCredentials.apiKey}
                          onChange={handlePrescientaiInputChange}
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Your Prescient AI API Key. Required for accessing predictions and insights.
                        </p>
                      </div>
                      
                      <DialogFooter className="sm:justify-end mt-4">
                        <DialogClose asChild>
                          <Button type="button" variant="outline">
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Connecting...' : 'Connect to Prescient AI'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="elevar">
                    <form onSubmit={handleConnectElevar} className="space-y-4">
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input
                          id="apiKey"
                          name="apiKey"
                          type="password"
                          placeholder="elv_..."
                          value={elevarCredentials.apiKey}
                          onChange={handleElevarInputChange}
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Your Elevar API Key. Get it from the Elevar dashboard settings.
                        </p>
                      </div>
                      
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="shopId">Shop ID</Label>
                        <Input
                          id="shopId"
                          name="shopId"
                          placeholder="Your Elevar Shop ID"
                          value={elevarCredentials.shopId}
                          onChange={handleElevarInputChange}
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Your Elevar Shop ID for tracking data analytics.
                        </p>
                      </div>
                      
                      <DialogFooter className="sm:justify-end mt-4">
                        <DialogClose asChild>
                          <Button type="button" variant="outline">
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Connecting...' : 'Connect to Elevar'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="github">
                    <form onSubmit={handleConnectGitHub} className="space-y-4">
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="accessToken">Access Token</Label>
                        <Input
                          id="accessToken"
                          name="accessToken"
                          type="password"
                          placeholder="ghp_..."
                          value={githubCredentials.accessToken}
                          onChange={handleGithubInputChange}
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Your GitHub Personal Access Token. Generate one in GitHub Developer Settings.
                        </p>
                      </div>
                      
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="username">GitHub Username</Label>
                        <Input
                          id="username"
                          name="username"
                          placeholder="Your GitHub username"
                          value={githubCredentials.username}
                          onChange={handleGithubInputChange}
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Your GitHub username for repository access.
                        </p>
                      </div>
                      
                      <DialogFooter className="sm:justify-end mt-4">
                        <DialogClose asChild>
                          <Button type="button" variant="outline">
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Connecting...' : 'Connect to GitHub'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="googlecalendar">
                    <form onSubmit={handleConnectGoogleCalendar} className="space-y-4">
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="clientId">Client ID</Label>
                        <Input
                          id="clientId"
                          name="clientId"
                          placeholder="123456789-abcdefg.apps.googleusercontent.com"
                          value={googleCalendarCredentials.clientId}
                          onChange={handleGoogleCalendarInputChange}
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Your Google OAuth Client ID from Google Cloud Console.
                        </p>
                      </div>
                      
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="clientSecret">Client Secret</Label>
                        <Input
                          id="clientSecret"
                          name="clientSecret"
                          type="password"
                          placeholder="GOCSPX-..."
                          value={googleCalendarCredentials.clientSecret}
                          onChange={handleGoogleCalendarInputChange}
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Your Google OAuth Client Secret from Google Cloud Console.
                        </p>
                      </div>
                      
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="redirectUri">Redirect URI</Label>
                        <Input
                          id="redirectUri"
                          name="redirectUri"
                          placeholder="https://your-app.domain/auth/google/callback"
                          value={googleCalendarCredentials.redirectUri}
                          onChange={handleGoogleCalendarInputChange}
                          required
                        />
                        <p className="text-xs text-gray-500">
                          The OAuth redirect URI configured in your Google Cloud Console.
                        </p>
                      </div>
                      
                      <DialogFooter className="sm:justify-end mt-4">
                        <DialogClose asChild>
                          <Button type="button" variant="outline">
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Connecting...' : 'Connect to Google Calendar'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="asana">
                    <form onSubmit={handleConnectAsana} className="space-y-4">
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="accessToken">Access Token</Label>
                        <Input
                          id="accessToken"
                          name="accessToken"
                          type="password"
                          placeholder="Your Asana Personal Access Token"
                          value={asanaCredentials.accessToken}
                          onChange={handleAsanaInputChange}
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Your Asana Personal Access Token. Generate it from Asana Developer Console &gt; My Access Tokens.
                        </p>
                      </div>
                      
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="workspaceGid">Workspace GID (Optional)</Label>
                        <Input
                          id="workspaceGid"
                          name="workspaceGid"
                          placeholder="Your default workspace GID"
                          value={asanaCredentials.workspaceGid}
                          onChange={handleAsanaInputChange}
                        />
                        <p className="text-xs text-gray-500">
                          The ID of your default Asana workspace. You can find this in the URL when viewing your workspace.
                        </p>
                      </div>
                      
                      <DialogFooter className="sm:justify-end mt-4">
                        <DialogClose asChild>
                          <Button type="button" variant="outline">
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Connecting...' : 'Connect to Asana'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="figma">
                    <form onSubmit={handleConnectFigma} className="space-y-4">
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="accessToken">Personal Access Token</Label>
                        <Input
                          id="accessToken"
                          name="accessToken"
                          type="password"
                          placeholder="figd_..."
                          value={figmaCredentials.accessToken}
                          onChange={handleFigmaInputChange}
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Your Figma Personal Access Token. Get it from Figma Account Settings &gt; Personal Access Tokens.
                        </p>
                      </div>
                      
                      <DialogFooter className="sm:justify-end mt-4">
                        <DialogClose asChild>
                          <Button type="button" variant="outline">
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Connecting...' : 'Connect to Figma'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="gdrive">
                    <form onSubmit={handleConnectGdrive} className="space-y-4">
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="clientId">Client ID</Label>
                        <Input
                          id="clientId"
                          name="clientId"
                          placeholder="Your Google Drive Client ID"
                          value={gdriveCredentials.clientId}
                          onChange={handleGdriveInputChange}
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Your Google Drive Client ID. Get it from Google Cloud Console.
                        </p>
                      </div>
                      
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="clientSecret">Client Secret</Label>
                        <Input
                          id="clientSecret"
                          name="clientSecret"
                          type="password"
                          placeholder="Your Google Drive Client Secret"
                          value={gdriveCredentials.clientSecret}
                          onChange={handleGdriveInputChange}
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Your Google Drive Client Secret from Google Cloud Console.
                        </p>
                      </div>
                      
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="refreshToken">Refresh Token</Label>
                        <Input
                          id="refreshToken"
                          name="refreshToken"
                          type="password"
                          placeholder="Your Google Drive Refresh Token"
                          value={gdriveCredentials.refreshToken}
                          onChange={handleGdriveInputChange}
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Your Google Drive Refresh Token for OAuth2 authentication.
                        </p>
                      </div>
                      
                      <DialogFooter className="sm:justify-end mt-4">
                        <DialogClose asChild>
                          <Button type="button" variant="outline">
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Connecting...' : 'Connect to Google Drive'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid gap-4">
            {isLoading ? (
              <p>Loading connections...</p>
            ) : (
              allConnections.map(connection => (
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
                      onCheckedChange={() => onToggleConnection(connection.id, connection.isConnected, connection.type)}
                    />
                    
                    {/* Edit Button for credentials */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Edit Credentials
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Edit {connection.name} API Credentials</DialogTitle>
                          <DialogDescription>
                            Update your {connection.name} API credentials.
                          </DialogDescription>
                        </DialogHeader>
                        
                        {connection.type && connection.type && connection.type.toLowerCase() === 'shopify' && (
                          <form onSubmit={handleConnectShopify} className="space-y-4 py-4">
                            {errorMessage && (
                              <div className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-md">
                                {errorMessage}
                              </div>
                            )}
                            
                            {successMessage && (
                              <div className="px-3 py-2 text-sm bg-green-50 text-green-600 rounded-md">
                                {successMessage}
                              </div>
                            )}
                            
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
                                {isSubmitting ? 'Updating...' : 'Update Credentials'}
                              </Button>
                            </DialogFooter>
                          </form>
                        )}
                        
                        {connection.type && connection.type.toLowerCase() === 'slack' && (
                          <form onSubmit={handleConnectSlack} className="space-y-4 py-4">
                            {errorMessage && (
                              <div className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-md">
                                {errorMessage}
                              </div>
                            )}
                            
                            {successMessage && (
                              <div className="px-3 py-2 text-sm bg-green-50 text-green-600 rounded-md">
                                {successMessage}
                              </div>
                            )}
                            
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
                                {isSubmitting ? 'Updating...' : 'Update Credentials'}
                              </Button>
                            </DialogFooter>
                          </form>
                        )}
                        
                        {connection.type && connection.type.toLowerCase() === 'notion' && (
                          <form onSubmit={handleConnectNotion} className="space-y-4 py-4">
                            {errorMessage && (
                              <div className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-md">
                                {errorMessage}
                              </div>
                            )}
                            
                            {successMessage && (
                              <div className="px-3 py-2 text-sm bg-green-50 text-green-600 rounded-md">
                                {successMessage}
                              </div>
                            )}
                            
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
                                {isSubmitting ? 'Updating...' : 'Update Credentials'}
                              </Button>
                            </DialogFooter>
                          </form>
                        )}
                        
                        {connection.type && connection.type.toLowerCase() === 'klaviyo' && (
                          <form onSubmit={handleConnectKlaviyo} className="space-y-4 py-4">
                            {errorMessage && (
                              <div className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-md">
                                {errorMessage}
                              </div>
                            )}
                            
                            {successMessage && (
                              <div className="px-3 py-2 text-sm bg-green-50 text-green-600 rounded-md">
                                {successMessage}
                              </div>
                            )}
                            
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
                                {isSubmitting ? 'Updating...' : 'Update Credentials'}
                              </Button>
                            </DialogFooter>
                          </form>
                        )}
                        
                        {connection.type && connection.type.toLowerCase() === 'postscript' && (
                          <form onSubmit={handleConnectPostscript} className="space-y-4 py-4">
                            {errorMessage && (
                              <div className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-md">
                                {errorMessage}
                              </div>
                            )}
                            
                            {successMessage && (
                              <div className="px-3 py-2 text-sm bg-green-50 text-green-600 rounded-md">
                                {successMessage}
                              </div>
                            )}
                            
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
                                {isSubmitting ? 'Updating...' : 'Update Credentials'}
                              </Button>
                            </DialogFooter>
                          </form>
                        )}
                        
                        {connection.type && connection.type.toLowerCase() === 'northbeam' && (
                          <form onSubmit={handleConnectNorthbeam} className="space-y-4 py-4">
                            {errorMessage && (
                              <div className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-md">
                                {errorMessage}
                              </div>
                            )}
                            
                            {successMessage && (
                              <div className="px-3 py-2 text-sm bg-green-50 text-green-600 rounded-md">
                                {successMessage}
                              </div>
                            )}
                            
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
                                {isSubmitting ? 'Updating...' : 'Update Credentials'}
                              </Button>
                            </DialogFooter>
                          </form>
                        )}
                        
                        {connection.type && connection.type.toLowerCase() === 'triplewhale' && (
                          <form onSubmit={handleConnectTripleWhale} className="space-y-4 py-4">
                            {errorMessage && (
                              <div className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-md">
                                {errorMessage}
                              </div>
                            )}
                            
                            {successMessage && (
                              <div className="px-3 py-2 text-sm bg-green-50 text-green-600 rounded-md">
                                {successMessage}
                              </div>
                            )}
                            
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
                                {isSubmitting ? 'Updating...' : 'Update Credentials'}
                              </Button>
                            </DialogFooter>
                          </form>
                        )}
                        
                        {connection.type && connection.type.toLowerCase() === 'github' && (
                          <form onSubmit={handleConnectGitHub} className="space-y-4 py-4">
                            {errorMessage && (
                              <div className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-md">
                                {errorMessage}
                              </div>
                            )}
                            
                            {successMessage && (
                              <div className="px-3 py-2 text-sm bg-green-50 text-green-600 rounded-md">
                                {successMessage}
                              </div>
                            )}
                            
                            <div className="grid w-full gap-1.5">
                              <Label htmlFor="accessToken">Personal Access Token</Label>
                              <Input
                                id="accessToken"
                                name="accessToken"
                                type="password"
                                placeholder="ghp_..."
                                value={githubCredentials.accessToken}
                                onChange={handleGithubInputChange}
                                required
                              />
                              <p className="text-xs text-gray-500">
                                Your GitHub Personal Access Token. Generate it from GitHub Settings &gt; Developer settings &gt; Personal access tokens.
                              </p>
                            </div>
                            
                            <div className="grid w-full gap-1.5">
                              <Label htmlFor="username">GitHub Username</Label>
                              <Input
                                id="username"
                                name="username"
                                placeholder="Your GitHub username"
                                value={githubCredentials.username}
                                onChange={handleGithubInputChange}
                                required
                              />
                              <p className="text-xs text-gray-500">
                                Your GitHub username for authenticating requests.
                              </p>
                            </div>
                            
                            <DialogFooter className="sm:justify-end mt-4">
                              <DialogClose asChild>
                                <Button type="button" variant="outline">
                                  Cancel
                                </Button>
                              </DialogClose>
                              <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Updating...' : 'Update Credentials'}
                              </Button>
                            </DialogFooter>
                          </form>
                        )}
                        
                        {connection.type && connection.type.toLowerCase() === 'googlecalendar' && (
                          <form onSubmit={handleConnectGoogleCalendar} className="space-y-4 py-4">
                            {errorMessage && (
                              <div className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-md">
                                {errorMessage}
                              </div>
                            )}
                            
                            {successMessage && (
                              <div className="px-3 py-2 text-sm bg-green-50 text-green-600 rounded-md">
                                {successMessage}
                              </div>
                            )}
                            
                            <div className="grid w-full gap-1.5">
                              <Label htmlFor="clientId">Client ID</Label>
                              <Input
                                id="clientId"
                                name="clientId"
                                placeholder="Your Google Client ID"
                                value={googleCalendarCredentials.clientId}
                                onChange={handleGoogleCalendarInputChange}
                                required
                              />
                              <p className="text-xs text-gray-500">
                                Your Google OAuth 2.0 Client ID. Get it from Google Cloud Console.
                              </p>
                            </div>
                            
                            <div className="grid w-full gap-1.5">
                              <Label htmlFor="clientSecret">Client Secret</Label>
                              <Input
                                id="clientSecret"
                                name="clientSecret"
                                type="password"
                                placeholder="Your Google Client Secret"
                                value={googleCalendarCredentials.clientSecret}
                                onChange={handleGoogleCalendarInputChange}
                                required
                              />
                              <p className="text-xs text-gray-500">
                                Your Google OAuth 2.0 Client Secret.
                              </p>
                            </div>
                            
                            <div className="grid w-full gap-1.5">
                              <Label htmlFor="redirectUri">Redirect URI</Label>
                              <Input
                                id="redirectUri"
                                name="redirectUri"
                                placeholder="https://your-redirect-uri.com/callback"
                                value={googleCalendarCredentials.redirectUri}
                                onChange={handleGoogleCalendarInputChange}
                                required
                              />
                              <p className="text-xs text-gray-500">
                                Your redirect URI for OAuth flow. This must match the one in your Google Cloud Console.
                              </p>
                            </div>
                            
                            <DialogFooter className="sm:justify-end mt-4">
                              <DialogClose asChild>
                                <Button type="button" variant="outline">
                                  Cancel
                                </Button>
                              </DialogClose>
                              <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Updating...' : 'Update Credentials'}
                              </Button>
                            </DialogFooter>
                          </form>
                        )}
                        
                        {connection.type && connection.type.toLowerCase() === 'asana' && (
                          <form onSubmit={handleConnectAsana} className="space-y-4 py-4">
                            {errorMessage && (
                              <div className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-md">
                                {errorMessage}
                              </div>
                            )}
                            
                            {successMessage && (
                              <div className="px-3 py-2 text-sm bg-green-50 text-green-600 rounded-md">
                                {successMessage}
                              </div>
                            )}
                            
                            <div className="grid w-full gap-1.5">
                              <Label htmlFor="accessToken">Access Token</Label>
                              <Input
                                id="accessToken"
                                name="accessToken"
                                type="password"
                                placeholder="Your Asana Personal Access Token"
                                value={asanaCredentials.accessToken}
                                onChange={handleAsanaInputChange}
                                required
                              />
                              <p className="text-xs text-gray-500">
                                Your Asana Personal Access Token. Generate it from Asana Developer Console &gt; My Access Tokens.
                              </p>
                            </div>
                            
                            <div className="grid w-full gap-1.5">
                              <Label htmlFor="workspaceGid">Workspace GID (Optional)</Label>
                              <Input
                                id="workspaceGid"
                                name="workspaceGid"
                                placeholder="Your default workspace GID"
                                value={asanaCredentials.workspaceGid}
                                onChange={handleAsanaInputChange}
                              />
                              <p className="text-xs text-gray-500">
                                The ID of your default Asana workspace. You can find this in the URL when viewing your workspace.
                              </p>
                            </div>
                            
                            <DialogFooter className="sm:justify-end mt-4">
                              <DialogClose asChild>
                                <Button type="button" variant="outline">
                                  Cancel
                                </Button>
                              </DialogClose>
                              <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Updating...' : 'Update Credentials'}
                              </Button>
                            </DialogFooter>
                          </form>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Database Settings */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Database</h2>
          <div className="border rounded-lg p-4 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-green-500" />
              <div>
                <h3 className="font-medium">Supabase Database</h3>
                <p className="text-sm text-gray-500">Used for storing messages and connections. Mobile app compatible.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-600">
                Connected
              </span>
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
            </div>
          </div>
        </div>
        
        {/* Advanced Settings */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Advanced Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <span className="text-gray-700">Enable real-time updates</span>
              <Switch id="real-time-updates" checked={true} />
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <span className="text-gray-700">Show detailed API responses</span>
              <Switch id="detailed-responses" checked={false} />
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <span className="text-gray-700">Debug mode</span>
              <Switch id="debug-mode" checked={false} />
            </div>
          </div>
        </div>
        
        {/* User Account */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Account</h2>
          <div className="flex flex-col">
            <Button 
              variant="destructive" 
              className="flex items-center gap-2 w-full sm:w-auto" 
              disabled={isLoggingOut}
              onClick={async () => {
                try {
                  setIsLoggingOut(true);
                  
                  // First, disconnect the WebSocket connection
                  disconnectWebSocket();
                  
                  // Call the server-side logout endpoint
                  await apiRequest('POST', '/api/logout', {});
                  
                  // Clear local storage and any client-side state
                  localStorage.clear();
                  sessionStorage.clear();
                  
                  // Clear query client cache
                  queryClient.clear();
                  
                  // Force clear cookies by setting them to expire
                  document.cookie.split(";").forEach((c) => {
                    document.cookie = c
                      .replace(/^ +/, "")
                      .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
                  });
                  
                  // Set authentication status to false
                  localStorage.setItem('isAuthenticated', 'false');
                  
                  // Show a message before redirecting
                  alert('You have been logged out successfully.');
                  
                  // Redirect to the login page
                  window.location.href = '/login';
                } catch (error) {
                  console.error('Error during logout:', error);
                  alert('There was an error during logout. Please try again.');
                  setIsLoggingOut(false);
                }
              }}
            >
              {isLoggingOut ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging Out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" /> 
                  Log Out
                </>
              )}
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              Logging out will clear your local session and reset the application
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
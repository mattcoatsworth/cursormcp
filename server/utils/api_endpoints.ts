import { createClient } from '@supabase/supabase-js';

// Define types for API endpoints
interface EndpointAuth {
  type: string;
  key: string;
}

interface EndpointDetails {
  method: string;
  path: string;
  parameters?: Record<string, any>;
  auth: EndpointAuth;
  rate_limit: string;
}

interface ServiceEndpoints {
  [resource: string]: {
    [action: string]: EndpointDetails;
  };
}

interface ActionMapping {
  systems: string[];
  endpoints: string[];
}

// Define the API endpoints
const SHOPIFY_ENDPOINTS: ServiceEndpoints = {
  // ... existing Shopify endpoints
};

const KLAVIYO_ENDPOINTS: ServiceEndpoints = {
  // ... existing Klaviyo endpoints
};

const TRIPLE_WHALE_ENDPOINTS: ServiceEndpoints = {
  // ... existing Triple Whale endpoints
};

const NORTHBEAM_ENDPOINTS: ServiceEndpoints = {
  // ... existing Northbeam endpoints
};

const GORGIAS_ENDPOINTS: ServiceEndpoints = {
  // ... existing Gorgias endpoints
};

const POSTSCRIPT_ENDPOINTS: ServiceEndpoints = {
  // ... existing Postscript endpoints
};

const GOOGLE_CALENDAR_ENDPOINTS: ServiceEndpoints = {
  // ... existing Google Calendar endpoints
};

const ASANA_ENDPOINTS: ServiceEndpoints = {
  // ... existing Asana endpoints
};

const SLACK_ENDPOINTS: ServiceEndpoints = {
  // ... existing Slack endpoints
};

const NOTION_ENDPOINTS: ServiceEndpoints = {
  // ... existing Notion endpoints
};

const GOOGLE_DRIVE_ENDPOINTS: ServiceEndpoints = {
  // ... existing Google Drive endpoints
};

const FIGMA_ENDPOINTS: ServiceEndpoints = {
  // ... existing Figma endpoints
};

const ELEVAR_ENDPOINTS: ServiceEndpoints = {
  // ... existing Elevar endpoints
};

// Mapping of high-level actions to specific endpoints
const ACTION_TO_ENDPOINTS: Record<string, ActionMapping> = {
  schedule_meeting: {
    systems: ["Google Calendar"],
    endpoints: ["events.create"]
  },
  create_task: {
    systems: ["Asana"],
    endpoints: ["tasks.create"]
  },
  create_page: {
    systems: ["Notion"],
    endpoints: ["pages.create"]
  },
  upload_file: {
    systems: ["Google Drive"],
    endpoints: ["files.create"]
  },
  get_design: {
    systems: ["Figma"],
    endpoints: ["files.get", "files.get_nodes"]
  },
  send_message: {
    systems: ["Slack"],
    endpoints: ["chat.postMessage"]
  },
  create_campaign: {
    systems: ["Klaviyo", "Postscript"],
    endpoints: ["campaigns.create"]
  },
  analyze_performance: {
    systems: ["Triple Whale", "Northbeam", "Elevar"],
    endpoints: ["analytics.get_sales", "analytics.get_attribution", "analytics.get_roas"]
  },
  create_ticket: {
    systems: ["Gorgias"],
    endpoints: ["tickets.create"]
  }
};

// Function to get endpoints for a specific action
export function getEndpointsForAction(action: string): ActionMapping {
  return ACTION_TO_ENDPOINTS[action] || { systems: [], endpoints: [] };
}

// Function to get all endpoints for a service
export function getServiceEndpoints(service: string): ServiceEndpoints {
  const endpoints: Record<string, ServiceEndpoints> = {
    Shopify: SHOPIFY_ENDPOINTS,
    Klaviyo: KLAVIYO_ENDPOINTS,
    "Triple Whale": TRIPLE_WHALE_ENDPOINTS,
    Northbeam: NORTHBEAM_ENDPOINTS,
    Gorgias: GORGIAS_ENDPOINTS,
    Postscript: POSTSCRIPT_ENDPOINTS,
    "Google Calendar": GOOGLE_CALENDAR_ENDPOINTS,
    Asana: ASANA_ENDPOINTS,
    Slack: SLACK_ENDPOINTS,
    Notion: NOTION_ENDPOINTS,
    "Google Drive": GOOGLE_DRIVE_ENDPOINTS,
    Figma: FIGMA_ENDPOINTS,
    Elevar: ELEVAR_ENDPOINTS
  };
  return endpoints[service] || {};
}

// Function to store endpoints in Supabase
export async function storeEndpointsInSupabase(supabase: any) {
  const allEndpoints = [
    { service: "Shopify", endpoints: SHOPIFY_ENDPOINTS },
    { service: "Klaviyo", endpoints: KLAVIYO_ENDPOINTS },
    { service: "Triple Whale", endpoints: TRIPLE_WHALE_ENDPOINTS },
    { service: "Northbeam", endpoints: NORTHBEAM_ENDPOINTS },
    { service: "Gorgias", endpoints: GORGIAS_ENDPOINTS },
    { service: "Postscript", endpoints: POSTSCRIPT_ENDPOINTS },
    { service: "Google Calendar", endpoints: GOOGLE_CALENDAR_ENDPOINTS },
    { service: "Asana", endpoints: ASANA_ENDPOINTS },
    { service: "Slack", endpoints: SLACK_ENDPOINTS },
    { service: "Notion", endpoints: NOTION_ENDPOINTS },
    { service: "Google Drive", endpoints: GOOGLE_DRIVE_ENDPOINTS },
    { service: "Figma", endpoints: FIGMA_ENDPOINTS },
    { service: "Elevar", endpoints: ELEVAR_ENDPOINTS }
  ];

  for (const { service, endpoints } of allEndpoints) {
    for (const [resource, actions] of Object.entries(endpoints)) {
      for (const [action, details] of Object.entries(actions)) {
        const endpointData = {
          service,
          resource,
          action,
          method: details.method,
          path: details.path,
          parameters: details.parameters || {},
          auth_type: details.auth.type,
          auth_key: details.auth.key,
          rate_limit: details.rate_limit,
          created_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('api_endpoints')
          .upsert(endpointData);

        if (error) {
          console.error(`Error storing endpoint for ${service} - ${resource} - ${action}:`, error);
        }
      }
    }
  }
}

// Export all endpoints for use in other files
export {
  SHOPIFY_ENDPOINTS,
  KLAVIYO_ENDPOINTS,
  TRIPLE_WHALE_ENDPOINTS,
  NORTHBEAM_ENDPOINTS,
  GORGIAS_ENDPOINTS,
  POSTSCRIPT_ENDPOINTS,
  GOOGLE_CALENDAR_ENDPOINTS,
  ASANA_ENDPOINTS,
  SLACK_ENDPOINTS,
  NOTION_ENDPOINTS,
  GOOGLE_DRIVE_ENDPOINTS,
  FIGMA_ENDPOINTS,
  ELEVAR_ENDPOINTS
}; 
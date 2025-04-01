/**
 * Mock Data Provider
 * 
 * This module provides realistic mock data for all supported services
 * without requiring actual API connections.
 */

import { ApiConnection } from '@shared/schema';

interface MockResponse {
  success: boolean;
  data: any;
  message?: string;
}

/**
 * Mock Data Provider class
 * Handles generating consistent mock data for all services
 */
export class MockDataProvider {
  
  /**
   * Get mock data for a specific service and command
   */
  public static getMockData(service: string, command: string, params: any = {}): MockResponse {
    // Get the appropriate mock data provider based on service
    switch (service.toLowerCase()) {
      case 'shopify':
        return this.getShopifyMockData(command, params);
      case 'klaviyo':
        return this.getKlaviyoMockData(command, params);
      case 'slack':
        return this.getSlackMockData(command, params);
      case 'notion':
        return this.getNotionMockData(command, params);
      case 'postscript':
        return this.getPostscriptMockData(command, params);
      case 'northbeam':
        return this.getNorthbeamMockData(command, params);
      case 'triplewhale':
      case 'triple whale':
        return this.getTripleWhaleMockData(command, params);
      case 'gorgias':
        return this.getGorgiasMockData(command, params);
      case 'recharm':
        return this.getRecharmMockData(command, params);
      case 'prescient':
      case 'prescient ai':
        return this.getPrescientAiMockData(command, params);
      case 'elevar':
        return this.getElevarMockData(command, params);
      case 'google calendar':
      case 'googlecalendar':
        return this.getGoogleCalendarMockData(command, params);
      case 'asana':
        return this.getAsanaMockData(command, params);
      case 'gdrive':
      case 'google drive':
        return this.getGDriveMockData(command, params);
      case 'figma':
        return this.getFigmaMockData(command, params);
      case 'github':
        return this.getGithubMockData(command, params);
      default:
        return {
          success: false,
          data: null,
          message: `No mock data available for service: ${service}`
        };
    }
  }

  /**
   * Creates a mock API connection with mock credentials
   */
  public static createMockConnection(apiType: string): Partial<ApiConnection> {
    const mockCredentials: Record<string, any> = {};
    
    // Add appropriate mock credentials based on the API
    switch (apiType.toLowerCase()) {
      case 'shopify':
        mockCredentials.shop = 'mockshop.myshopify.com';
        mockCredentials.apiKey = 'mock_api_key_for_shopify';
        mockCredentials.apiSecret = 'mock_api_secret_for_shopify';
        mockCredentials.accessToken = 'mock_access_token_for_shopify';
        break;
      case 'klaviyo':
        mockCredentials.apiKey = 'mock_api_key_for_klaviyo';
        mockCredentials.privateKey = 'mock_private_key_for_klaviyo';
        break;
      case 'slack':
        mockCredentials.botToken = 'xoxb-mock-slack-bot-token';
        mockCredentials.channelId = 'C01234MOCKCH';
        break;
      case 'notion':
        mockCredentials.apiKey = 'secret_mock_notion_api_key';
        mockCredentials.databaseId = 'mock_database_id_for_notion';
        break;
      case 'postscript':
        mockCredentials.apiKey = 'mock_api_key_for_postscript';
        break;
      case 'northbeam':
        mockCredentials.apiKey = 'mock_api_key_for_northbeam';
        break;
      case 'triplewhale':
        mockCredentials.apiKey = 'mock_api_key_for_triplewhale';
        mockCredentials.pixelId = 'mock_pixel_id_for_triplewhale';
        break;
      case 'gorgias':
        mockCredentials.apiKey = 'mock_api_key_for_gorgias';
        mockCredentials.domainPrefix = 'mockshop';
        break;
      case 'recharm':
        mockCredentials.apiKey = 'mock_api_key_for_recharm';
        break;
      case 'prescient ai':
      case 'prescientai':
        mockCredentials.apiKey = 'mock_api_key_for_prescient_ai';
        break;
      case 'elevar':
        mockCredentials.apiKey = 'mock_api_key_for_elevar';
        break;
      case 'google calendar':
      case 'googlecalendar':
        mockCredentials.clientId = 'mock_client_id_for_google_calendar';
        mockCredentials.clientSecret = 'mock_client_secret_for_google_calendar';
        mockCredentials.refreshToken = 'mock_refresh_token_for_google_calendar';
        break;
      case 'asana':
        mockCredentials.accessToken = 'mock_access_token_for_asana';
        break;
      case 'gdrive':
      case 'google drive':
        mockCredentials.clientId = 'mock_client_id_for_gdrive';
        mockCredentials.clientSecret = 'mock_client_secret_for_gdrive';
        mockCredentials.refreshToken = 'mock_refresh_token_for_gdrive';
        break;
      case 'figma':
        mockCredentials.accessToken = 'mock_access_token_for_figma';
        break;
      case 'github':
        mockCredentials.accessToken = 'mock_github_access_token';
        break;
      default:
        mockCredentials.apiKey = 'mock_default_api_key';
        break;
    }
    
    return {
      name: `Mock ${apiType} Connection`,
      type: apiType.toLowerCase(),
      isConnected: true,
      isMock: true,
      credentials: mockCredentials
    };
  }

  // MOCK DATA PROVIDERS FOR EACH SERVICE
  // ===================================

  /**
   * Get mock data for Shopify
   */
  private static getShopifyMockData(command: string, params: any): MockResponse {
    switch (command.toLowerCase()) {
      case 'get_sales':
      case 'get_orders':
        return {
          success: true,
          data: {
            totalSales: 24875.50,
            orderCount: params.limit || 15,
            averageOrderValue: 243.80,
            orders: Array(params.limit || 15).fill(0).map((_, i) => ({
              id: `mock-order-${10000 + i}`,
              orderNumber: 10000 + i,
              customer: {
                firstName: `Customer${i}`,
                lastName: 'MockName',
                email: `customer${i}@example.com`
              },
              totalPrice: 150 + Math.floor(Math.random() * 200),
              createdAt: new Date(Date.now() - i * 3600000).toISOString(),
              lineItems: [
                {
                  title: 'Premium Product',
                  quantity: 1 + Math.floor(Math.random() * 3),
                  price: 89.99
                },
                {
                  title: 'Deluxe Widget',
                  quantity: 1,
                  price: 59.99
                }
              ]
            }))
          }
        };
      case 'get_products':
        return {
          success: true,
          data: {
            products: Array(params.limit || 20).fill(0).map((_, i) => ({
              id: `mock-product-${1000 + i}`,
              title: `Mock Product ${i + 1}`,
              handle: `mock-product-${i + 1}`,
              description: 'This is a high-quality mock product description.',
              price: 29.99 + (i * 10),
              compareAtPrice: i % 3 === 0 ? 49.99 + (i * 10) : null,
              inventoryQuantity: 100 - (i * 5),
              createdAt: new Date(Date.now() - i * 86400000).toISOString(),
              updatedAt: new Date(Date.now() - i * 43200000).toISOString(),
              tags: ['mock', 'sample', i % 2 === 0 ? 'best-seller' : 'new-arrival'],
              images: [
                {
                  url: `https://placekitten.com/400/${300 + i % 10}`
                }
              ]
            }))
          }
        };
      case 'get_customers':
        return {
          success: true,
          data: {
            customers: Array(params.limit || 10).fill(0).map((_, i) => ({
              id: `mock-customer-${2000 + i}`,
              firstName: `First${i}`,
              lastName: `Last${i}`,
              email: `customer${i}@example.com`,
              phone: `+1555${100 + i}${1000 + i}`,
              ordersCount: Math.floor(Math.random() * 10) + 1,
              totalSpent: Math.floor(Math.random() * 1000) + 100,
              lastOrderDate: new Date(Date.now() - i * 86400000 * 5).toISOString(),
              tags: i % 3 === 0 ? ['VIP'] : i % 2 === 0 ? ['returning'] : ['new']
            }))
          }
        };
      case 'search_products':
        return {
          success: true,
          data: {
            products: Array(Math.min(5, params.limit || 5)).fill(0).map((_, i) => ({
              id: `mock-product-${1000 + i}`,
              title: `${params.query || 'Mock'} Product ${i + 1}`,
              handle: `${params.query?.toLowerCase() || 'mock'}-product-${i + 1}`,
              description: `This is a matching product for your "${params.query || 'mock'}" search.`,
              price: 29.99 + (i * 10),
              inventoryQuantity: 100 - (i * 5),
              tags: ['mock', params.query?.toLowerCase() || 'sample']
            }))
          }
        };
      case 'get_analytics':
        return {
          success: true,
          data: {
            salesOverTime: Array(7).fill(0).map((_, i) => ({
              date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
              sales: 1000 + Math.floor(Math.random() * 5000),
              orders: 10 + Math.floor(Math.random() * 50)
            })),
            topProducts: Array(5).fill(0).map((_, i) => ({
              title: `Top Mock Product ${i + 1}`,
              sales: 5000 - (i * 800),
              quantity: 50 - (i * 8)
            })),
            customerMetrics: {
              newCustomers: 25,
              returningCustomers: 42,
              averageOrderValue: 87.50 + Math.random() * 50
            }
          }
        };
      default:
        return {
          success: false,
          data: null,
          message: `Unknown Shopify command: ${command}`
        };
    }
  }

  /**
   * Get mock data for Klaviyo
   */
  private static getKlaviyoMockData(command: string, params: any): MockResponse {
    switch (command.toLowerCase()) {
      case 'get_metrics':
        return {
          success: true,
          data: {
            metrics: [
              {
                name: 'Active on Site',
                id: 'mock_metric_1',
                value: 382,
                change: 12.4
              },
              {
                name: 'Placed Order',
                id: 'mock_metric_2',
                value: 147,
                change: 5.2
              },
              {
                name: 'Started Checkout',
                id: 'mock_metric_3',
                value: 215,
                change: -3.1
              },
              {
                name: 'Viewed Product',
                id: 'mock_metric_4',
                value: 1243,
                change: 24.7
              }
            ]
          }
        };
      case 'get_campaigns':
        return {
          success: true,
          data: {
            campaigns: Array(params.limit || 6).fill(0).map((_, i) => ({
              id: `mock-campaign-${3000 + i}`,
              name: `Mock Campaign ${i + 1}`,
              subject: `Special Offer ${i + 1} - Limited Time Only!`,
              status: i % 4 === 0 ? 'draft' : i % 3 === 0 ? 'scheduled' : 'sent',
              sendTime: i % 3 === 0 
                ? new Date(Date.now() + 86400000).toISOString() 
                : new Date(Date.now() - i * 86400000).toISOString(),
              stats: i % 3 !== 0 ? {
                opens: 200 + (i * 50),
                clicks: 75 + (i * 15),
                unsubscribes: Math.floor(Math.random() * 5),
                bounces: Math.floor(Math.random() * 8),
                recipients: 1000 + (i * 200)
              } : null
            }))
          }
        };
      case 'get_lists':
        return {
          success: true,
          data: {
            lists: [
              {
                id: 'mock_list_1',
                name: 'Newsletter Subscribers',
                memberCount: 2458
              },
              {
                id: 'mock_list_2',
                name: 'Abandoned Cart',
                memberCount: 187
              },
              {
                id: 'mock_list_3',
                name: 'VIP Customers',
                memberCount: 342
              },
              {
                id: 'mock_list_4',
                name: 'New Customers',
                memberCount: 891
              }
            ]
          }
        };
      case 'get_flows':
        return {
          success: true,
          data: {
            flows: [
              {
                id: 'mock_flow_1',
                name: 'Welcome Series',
                status: 'live',
                createdAt: new Date(Date.now() - 120 * 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
                stats: {
                  recipients: 987,
                  conversions: 124,
                  revenue: 6240.50
                }
              },
              {
                id: 'mock_flow_2',
                name: 'Abandoned Cart',
                status: 'live',
                createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
                stats: {
                  recipients: 632,
                  conversions: 108,
                  revenue: 5320.75
                }
              },
              {
                id: 'mock_flow_3',
                name: 'Win-Back Campaign',
                status: 'draft',
                createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
                stats: null
              }
            ]
          }
        };
      case 'get_subscriber':
      case 'get_profile':
        return {
          success: true,
          data: {
            profile: {
              id: params.id || params.email || 'mock_profile_default',
              email: params.email || 'mock.customer@example.com',
              firstName: 'Mock',
              lastName: 'Customer',
              phone: '+15551234567',
              location: {
                city: 'New York',
                region: 'NY',
                country: 'United States'
              },
              metrics: {
                totalOrders: 7,
                totalRevenue: 432.65,
                averageOrderValue: 61.81,
                lastOrderDate: new Date(Date.now() - 15 * 86400000).toISOString()
              },
              lists: [
                {
                  id: 'mock_list_1',
                  name: 'Newsletter Subscribers'
                },
                {
                  id: 'mock_list_3', 
                  name: 'VIP Customers'
                }
              ]
            }
          }
        };
      default:
        return {
          success: false,
          data: null,
          message: `Unknown Klaviyo command: ${command}`
        };
    }
  }

  /**
   * Get mock data for Slack
   */
  private static getSlackMockData(command: string, params: any): MockResponse {
    switch (command.toLowerCase()) {
      case 'send_message':
        return {
          success: true,
          data: {
            message: {
              ts: '1234567890.123456',
              text: params.message || 'Mock message sent successfully',
              channel: params.channel || 'general'
            }
          },
          message: 'Message sent successfully to ' + (params.channel || '#general')
        };
      case 'get_channels':
        return {
          success: true,
          data: {
            channels: [
              {
                id: 'C12345MOCK1',
                name: 'general',
                topic: 'Company-wide announcements and work-based matters',
                memberCount: 48
              },
              {
                id: 'C12345MOCK2',
                name: 'marketing',
                topic: 'Marketing team discussions',
                memberCount: 12
              },
              {
                id: 'C12345MOCK3',
                name: 'sales',
                topic: 'Sales team coordination',
                memberCount: 15
              },
              {
                id: 'C12345MOCK4',
                name: 'development',
                topic: 'Engineering and product development',
                memberCount: 23
              }
            ]
          }
        };
      case 'get_channel_history':
        return {
          success: true,
          data: {
            messages: Array(params.limit || 10).fill(0).map((_, i) => ({
              ts: (1643500000 + i * 3600).toString() + '.000000',
              text: `Mock message ${i + 1} in the channel history`,
              user: `U${1000 + i}MOCKU`,
              user_name: `User ${i + 1}`,
              reactions: i % 3 === 0 ? [
                {
                  name: 'thumbsup',
                  count: Math.floor(Math.random() * 5) + 1,
                  users: ['UMOCK1', 'UMOCK2']
                }
              ] : []
            }))
          }
        };
      case 'get_user_info':
        return {
          success: true,
          data: {
            user: {
              id: params.user || 'UMOCK12345',
              name: 'mocksername',
              real_name: 'Mock User',
              display_name: 'Mock',
              email: 'mock.user@example.com',
              is_admin: false,
              is_owner: false,
              is_bot: false,
              presence: 'active'
            }
          }
        };
      default:
        return {
          success: false,
          data: null,
          message: `Unknown Slack command: ${command}`
        };
    }
  }

  /**
   * Get mock data for Notion
   */
  private static getNotionMockData(command: string, params: any): MockResponse {
    switch (command.toLowerCase()) {
      case 'get_databases':
        return {
          success: true,
          data: {
            databases: [
              {
                id: 'mock_db_1',
                title: 'Projects Database',
                description: 'All company projects and their status',
                created_time: new Date(Date.now() - 120 * 86400000).toISOString()
              },
              {
                id: 'mock_db_2',
                title: 'Content Calendar',
                description: 'Publishing schedule for all content',
                created_time: new Date(Date.now() - 90 * 86400000).toISOString()
              },
              {
                id: 'mock_db_3',
                title: 'Customer Feedback',
                description: 'Tracking customer feedback and feature requests',
                created_time: new Date(Date.now() - 60 * 86400000).toISOString()
              },
              {
                id: 'mock_db_4',
                title: 'Team Directory',
                description: 'Company team members and contact info',
                created_time: new Date(Date.now() - 180 * 86400000).toISOString()
              }
            ]
          }
        };
      case 'query_database':
        return {
          success: true,
          data: {
            results: Array(params.limit || 10).fill(0).map((_, i) => ({
              id: `mock_page_${1000 + i}`,
              created_time: new Date(Date.now() - i * 86400000).toISOString(),
              last_edited_time: new Date(Date.now() - i * 43200000).toISOString(),
              properties: {
                Name: {
                  title: [
                    {
                      text: {
                        content: `Mock Page ${i + 1}`
                      }
                    }
                  ]
                },
                Status: {
                  select: {
                    name: i % 4 === 0 ? 'In Progress' : i % 3 === 0 ? 'Completed' : i % 2 === 0 ? 'Not Started' : 'Backlog',
                    color: i % 4 === 0 ? 'blue' : i % 3 === 0 ? 'green' : i % 2 === 0 ? 'red' : 'gray'
                  }
                },
                Priority: {
                  select: {
                    name: i % 3 === 0 ? 'High' : i % 2 === 0 ? 'Medium' : 'Low',
                    color: i % 3 === 0 ? 'red' : i % 2 === 0 ? 'yellow' : 'gray'
                  }
                },
                'Due Date': {
                  date: {
                    start: new Date(Date.now() + (i * 86400000)).toISOString().split('T')[0]
                  }
                }
              }
            }))
          }
        };
      case 'create_page':
        return {
          success: true,
          data: {
            id: 'mock_new_page_123',
            created_time: new Date().toISOString(),
            last_edited_time: new Date().toISOString(),
            parent: {
              database_id: params.database_id || 'mock_db_1'
            },
            properties: params.properties || {
              Name: {
                title: [
                  {
                    text: {
                      content: 'New Mock Page'
                    }
                  }
                ]
              }
            }
          },
          message: 'Page created successfully'
        };
      case 'update_page':
        return {
          success: true,
          data: {
            id: params.page_id || 'mock_page_123',
            last_edited_time: new Date().toISOString(),
            properties: params.properties || {}
          },
          message: 'Page updated successfully'
        };
      case 'get_page':
        return {
          success: true,
          data: {
            id: params.page_id || 'mock_page_123',
            created_time: new Date(Date.now() - 10 * 86400000).toISOString(),
            last_edited_time: new Date(Date.now() - 2 * 86400000).toISOString(),
            parent: {
              database_id: 'mock_db_1'
            },
            properties: {
              Name: {
                title: [
                  {
                    text: {
                      content: 'Mock Page Details'
                    }
                  }
                ]
              },
              Status: {
                select: {
                  name: 'In Progress',
                  color: 'blue'
                }
              },
              Priority: {
                select: {
                  name: 'Medium',
                  color: 'yellow'
                }
              },
              'Due Date': {
                date: {
                  start: new Date(Date.now() + (5 * 86400000)).toISOString().split('T')[0]
                }
              },
              Assignee: {
                people: [
                  {
                    id: 'mock_user_1',
                    name: 'Mock User'
                  }
                ]
              },
              Description: {
                rich_text: [
                  {
                    text: {
                      content: 'This is a mock page with sample content for testing purposes.'
                    }
                  }
                ]
              }
            }
          }
        };
      default:
        return {
          success: false,
          data: null,
          message: `Unknown Notion command: ${command}`
        };
    }
  }

  /**
   * Get mock data for other services
   * Using simplified implementations to save space
   */
  private static getPostscriptMockData(command: string, params: any): MockResponse {
    return {
      success: true,
      data: {
        result: `Mock Postscript data for command: ${command}`,
        command,
        params
      },
      message: 'Retrieved mock Postscript data'
    };
  }

  private static getNorthbeamMockData(command: string, params: any): MockResponse {
    return {
      success: true,
      data: {
        result: `Mock Northbeam data for command: ${command}`,
        command,
        params
      },
      message: 'Retrieved mock Northbeam data'
    };
  }

  private static getTripleWhaleMockData(command: string, params: any): MockResponse {
    return {
      success: true,
      data: {
        result: `Mock Triple Whale data for command: ${command}`,
        command,
        params
      },
      message: 'Retrieved mock Triple Whale data'
    };
  }

  private static getGorgiasMockData(command: string, params: any): MockResponse {
    return {
      success: true,
      data: {
        result: `Mock Gorgias data for command: ${command}`,
        command,
        params
      },
      message: 'Retrieved mock Gorgias data'
    };
  }

  private static getRecharmMockData(command: string, params: any): MockResponse {
    return {
      success: true,
      data: {
        result: `Mock Recharm data for command: ${command}`,
        command,
        params
      },
      message: 'Retrieved mock Recharm data'
    };
  }

  private static getPrescientAiMockData(command: string, params: any): MockResponse {
    return {
      success: true,
      data: {
        result: `Mock Prescient AI data for command: ${command}`,
        command,
        params
      },
      message: 'Retrieved mock Prescient AI data'
    };
  }

  private static getElevarMockData(command: string, params: any): MockResponse {
    return {
      success: true,
      data: {
        result: `Mock Elevar data for command: ${command}`,
        command,
        params
      },
      message: 'Retrieved mock Elevar data'
    };
  }

  private static getGoogleCalendarMockData(command: string, params: any): MockResponse {
    return {
      success: true,
      data: {
        result: `Mock Google Calendar data for command: ${command}`,
        command,
        params
      },
      message: 'Retrieved mock Google Calendar data'
    };
  }

  private static getAsanaMockData(command: string, params: any): MockResponse {
    return {
      success: true,
      data: {
        result: `Mock Asana data for command: ${command}`,
        command,
        params
      },
      message: 'Retrieved mock Asana data'
    };
  }

  private static getGDriveMockData(command: string, params: any): MockResponse {
    return {
      success: true,
      data: {
        result: `Mock Google Drive data for command: ${command}`,
        command,
        params
      },
      message: 'Retrieved mock Google Drive data'
    };
  }

  private static getFigmaMockData(command: string, params: any): MockResponse {
    return {
      success: true,
      data: {
        result: `Mock Figma data for command: ${command}`,
        command,
        params
      },
      message: 'Retrieved mock Figma data'
    };
  }

  private static getGithubMockData(command: string, params: any): MockResponse {
    return {
      success: true,
      data: {
        result: `Mock GitHub data for command: ${command}`,
        command,
        params
      },
      message: 'Retrieved mock GitHub data'
    };
  }
}
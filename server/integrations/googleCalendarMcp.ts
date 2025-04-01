import { BaseMcpClient, McpCommandResult, McpCredentials } from './baseMcp';
import { GoogleCalendar, ListEventsParams } from './googleCalendar';
import { z } from 'zod';
import OpenAI from 'openai';
import crypto from 'crypto';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Interface for Google Calendar MCP credentials
 */
interface GoogleCalendarCredentials extends McpCredentials {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  tokens?: string; // Stored as a JSON string
}

/**
 * Interface for list events command parameters
 */
interface ListEventsParams {
  calendarId?: string;
  timeMin?: string;
  timeMax?: string;
}

/**
 * Interface for create event command parameters
 */
interface CreateEventParams {
  calendarId?: string;
  summary?: string;
  description?: string;
  start?: string;
  end?: string;
  location?: string;
  attendees?: string[]; // Array of email addresses
}

/**
 * Interface for update event command parameters
 */
interface UpdateEventParams {
  calendarId?: string;
  eventId?: string;
  summary?: string;
  description?: string;
  start?: string;
  end?: string;
  location?: string;
  attendees?: string[]; // Array of email addresses
}

/**
 * Interface for delete event command parameters
 */
interface DeleteEventParams {
  calendarId?: string;
  eventId?: string;
}

// Define Zod schemas for validation
const listEventsSchema = z.object({
  calendarId: z.string().min(1, "Calendar ID is required"),
  timeMin: z.string().optional(),
  timeMax: z.string().optional(),
});

const createEventSchema = z.object({
  calendarId: z.string().min(1, "Calendar ID is required"),
  summary: z.string().min(1, "Event summary is required"),
  description: z.string().optional(),
  start: z.string().min(1, "Start time is required"),
  end: z.string().min(1, "End time is required"),
  location: z.string().optional(),
  attendees: z.array(z.string().email("Invalid email address")).optional(),
});

const updateEventSchema = z.object({
  calendarId: z.string().min(1, "Calendar ID is required"),
  eventId: z.string().min(1, "Event ID is required"),
  summary: z.string().optional(),
  description: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  location: z.string().optional(),
  attendees: z.array(z.string().email("Invalid email address")).optional(),
});

const deleteEventSchema = z.object({
  calendarId: z.string().min(1, "Calendar ID is required"),
  eventId: z.string().min(1, "Event ID is required"),
});

/**
 * Google Calendar MCP Client implementation
 */
export class GoogleCalendarMcpClient extends BaseMcpClient {
  private googleCalendar: GoogleCalendar | null = null;
  private authCallbackUrl: string = '';
  private authState: string = '';

  /**
   * Constructor
   */
  constructor() {
    super('googlecalendar');
    this.googleCalendar = new GoogleCalendar();
  }

  /**
   * Extract credentials from API connection
   */
  protected extractCredentials(connectionCredentials: any): McpCredentials {
    try {
      // Extract required fields
      const { 
        client_id, 
        client_secret, 
        redirect_uri,
        tokens 
      } = connectionCredentials || {};

      // Validate required credentials
      if (!client_id || !client_secret || !redirect_uri) {
        throw new Error("Missing required Google Calendar credentials. Please provide: client_id, client_secret, and redirect_uri.");
      }

      return {
        client_id,
        client_secret,
        redirect_uri,
        tokens
      } as GoogleCalendarCredentials;
    } catch (error) {
      console.error("Error extracting Google Calendar credentials:", error);
      throw error;
    }
  }

  /**
   * Service-specific initialization
   */
  protected async serviceInitialize(): Promise<void> {
    try {
      const credentials = this.credentials as GoogleCalendarCredentials;
      const { client_id, client_secret, redirect_uri, tokens } = credentials;

      // Parse tokens from string if available
      let parsedTokens = undefined;
      if (tokens) {
        try {
          parsedTokens = JSON.parse(tokens);
        } catch (e) {
          console.error("Error parsing Google Calendar tokens:", e);
        }
      }

      // Initialize Google Calendar client
      const initialized = await this.googleCalendar?.initialize(
        client_id,
        client_secret,
        redirect_uri,
        parsedTokens
      );

      if (!initialized) {
        console.warn("Google Calendar client not fully initialized, authentication may be required");
      }
    } catch (error) {
      console.error("Error initializing Google Calendar service:", error);
      throw new Error(`Failed to initialize Google Calendar service: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Process user command
   */
  async processCommand(command: string, params: Record<string, any> = {}): Promise<McpCommandResult> {
    try {
      // Normalize command to lowercase and remove spaces
      const normalizedCommand = command.toLowerCase().trim();

      // If client is not initialized or credentials are missing, return error
      if (!this.googleCalendar) {
        return {
          success: false,
          message: "Google Calendar client not initialized",
        };
      }

      // Handle authentication commands first as they work even without full initialization
      if (normalizedCommand === "auth" || normalizedCommand === "authenticate" || normalizedCommand === "login") {
        return await this.handleAuthCommand(params);
      }

      if (normalizedCommand === "authcallback" || normalizedCommand === "auth_callback") {
        return await this.handleAuthCallbackCommand(params);
      }

      // For all other commands, ensure we're authenticated
      if (!this.googleCalendar.isAuthenticated()) {
        return {
          success: false,
          message: "Google Calendar not authenticated. Use the 'auth' command first.",
          data: {
            needsAuth: true
          }
        };
      }

      // Process various commands
      if (normalizedCommand === "list_calendars" || normalizedCommand === "listcalendars" || normalizedCommand === "getcalendars") {
        return await this.handleListCalendarsCommand();
      }

      if (normalizedCommand === "list_events" || normalizedCommand === "listevents" || normalizedCommand === "getevents") {
        return await this.handleListEventsCommand(params);
      }

      if (normalizedCommand === "create_event" || normalizedCommand === "createevent" || normalizedCommand === "addevent" || normalizedCommand === "add_event") {
        return await this.handleCreateEventCommand(params);
      }

      if (normalizedCommand === "update_event" || normalizedCommand === "updateevent" || normalizedCommand === "editevent" || normalizedCommand === "edit_event") {
        return await this.handleUpdateEventCommand(params);
      }

      if (normalizedCommand === "delete_event" || normalizedCommand === "deleteevent" || normalizedCommand === "removeevent" || normalizedCommand === "remove_event") {
        return await this.handleDeleteEventCommand(params);
      }

      // If no specific command matched, use fallback to interpret the command
      return await this.handleFallbackCommand(command, params);
    } catch (error) {
      console.error("Error processing Google Calendar command:", error);
      return {
        success: false,
        message: `Failed to process Google Calendar command: ${error instanceof Error ? error.message : "Unknown error"}`,
        error
      };
    }
  }

  /**
   * Handle auth command to generate authentication URL
   */
  private async handleAuthCommand(params: Record<string, any>): Promise<McpCommandResult> {
    try {
      // Generate a state parameter for security
      this.authState = crypto.randomBytes(16).toString('hex');
      
      // Generate auth URL
      const authUrl = this.googleCalendar?.getAuthUrl();
      
      if (!authUrl) {
        return {
          success: false,
          message: "Failed to generate authentication URL",
        };
      }
      
      // Return auth URL to the client
      return {
        success: true,
        message: "Please visit the following URL to authenticate with Google Calendar:",
        data: {
          authUrl,
          state: this.authState
        }
      };
    } catch (error) {
      console.error("Error handling auth command:", error);
      return {
        success: false,
        message: `Failed to generate authentication URL: ${error instanceof Error ? error.message : "Unknown error"}`,
        error
      };
    }
  }

  /**
   * Handle auth callback command to complete authentication
   */
  private async handleAuthCallbackCommand(params: Record<string, any>): Promise<McpCommandResult> {
    try {
      const { code, state } = params;
      
      // Verify state parameter for security
      if (state !== this.authState) {
        return {
          success: false,
          message: "Invalid state parameter in auth callback",
        };
      }
      
      if (!code) {
        return {
          success: false,
          message: "Authorization code is required",
        };
      }
      
      // Exchange code for tokens
      const tokens = await this.googleCalendar?.getTokenFromCode(code);
      
      if (!tokens) {
        return {
          success: false,
          message: "Failed to get tokens from authorization code",
        };
      }
      
      // Update connection credentials with tokens
      const credentials = this.credentials as GoogleCalendarCredentials;
      
      await this.updateConnectionCredentials({
        ...credentials,
        tokens: JSON.stringify(tokens)
      });
      
      return {
        success: true,
        message: "Successfully authenticated with Google Calendar",
        data: {
          authenticated: true
        }
      };
    } catch (error) {
      console.error("Error handling auth callback command:", error);
      return {
        success: false,
        message: `Failed to complete authentication: ${error instanceof Error ? error.message : "Unknown error"}`,
        error
      };
    }
  }

  /**
   * Handle list calendars command
   */
  private async handleListCalendarsCommand(): Promise<McpCommandResult> {
    try {
      // List calendars
      const calendars = await this.googleCalendar?.listCalendars();
      
      if (!calendars) {
        return {
          success: false,
          message: "Failed to list calendars",
        };
      }
      
      return {
        success: true,
        message: `Found ${calendars.length} calendar(s)`,
        data: {
          calendars
        }
      };
    } catch (error) {
      console.error("Error listing calendars:", error);
      return {
        success: false,
        message: `Failed to list calendars: ${error instanceof Error ? error.message : "Unknown error"}`,
        error
      };
    }
  }

  /**
   * Handle list events command
   */
  private async handleListEventsCommand(params: ListEventsParams): Promise<McpCommandResult> {
    try {
      // Validate parameters
      const validationResult = listEventsSchema.safeParse(params);
      
      if (!validationResult.success) {
        return {
          success: false,
          message: "Invalid parameters for listing events",
          data: {
            errors: validationResult.error.format()
          }
        };
      }
      
      // Parse parameters
      const { calendarId, timeMin, timeMax } = validationResult.data;
      
      // List events
      const events = await this.googleCalendar?.listEvents({
        calendarId,
        timeMin,
        timeMax
      });
      
      if (!events) {
        return {
          success: false,
          message: "Failed to list events",
        };
      }
      
      return {
        success: true,
        message: `Found ${events.length} event(s)`,
        data: {
          events
        }
      };
    } catch (error) {
      console.error("Error listing events:", error);
      return {
        success: false,
        message: `Failed to list events: ${error instanceof Error ? error.message : "Unknown error"}`,
        error
      };
    }
  }

  /**
   * Handle create event command
   */
  private async handleCreateEventCommand(params: CreateEventParams): Promise<McpCommandResult> {
    try {
      // Validate parameters
      const validationResult = createEventSchema.safeParse(params);
      
      if (!validationResult.success) {
        return {
          success: false,
          message: "Invalid parameters for creating event",
          data: {
            errors: validationResult.error.format()
          }
        };
      }
      
      // Parse parameters
      const { calendarId, summary, description, start, end, location, attendees } = validationResult.data;
      
      // Create event
      const event = await this.googleCalendar?.createEvent({
        calendarId,
        summary,
        description,
        start,
        end,
        location,
        attendees: attendees?.map(email => ({ email }))
      });
      
      if (!event) {
        return {
          success: false,
          message: "Failed to create event",
        };
      }
      
      return {
        success: true,
        message: "Event created successfully",
        data: {
          event
        }
      };
    } catch (error) {
      console.error("Error creating event:", error);
      return {
        success: false,
        message: `Failed to create event: ${error instanceof Error ? error.message : "Unknown error"}`,
        error
      };
    }
  }

  /**
   * Handle update event command
   */
  private async handleUpdateEventCommand(params: UpdateEventParams): Promise<McpCommandResult> {
    try {
      // Validate parameters
      const validationResult = updateEventSchema.safeParse(params);
      
      if (!validationResult.success) {
        return {
          success: false,
          message: "Invalid parameters for updating event",
          data: {
            errors: validationResult.error.format()
          }
        };
      }
      
      // Parse parameters
      const { calendarId, eventId, summary, description, start, end, location, attendees } = validationResult.data;
      
      // Update event
      const event = await this.googleCalendar?.updateEvent({
        calendarId,
        eventId,
        summary,
        description,
        start,
        end,
        location,
        attendees: attendees?.map(email => ({ email }))
      });
      
      if (!event) {
        return {
          success: false,
          message: "Failed to update event",
        };
      }
      
      return {
        success: true,
        message: "Event updated successfully",
        data: {
          event
        }
      };
    } catch (error) {
      console.error("Error updating event:", error);
      return {
        success: false,
        message: `Failed to update event: ${error instanceof Error ? error.message : "Unknown error"}`,
        error
      };
    }
  }

  /**
   * Handle delete event command
   */
  private async handleDeleteEventCommand(params: DeleteEventParams): Promise<McpCommandResult> {
    try {
      // Validate parameters
      const validationResult = deleteEventSchema.safeParse(params);
      
      if (!validationResult.success) {
        return {
          success: false,
          message: "Invalid parameters for deleting event",
          data: {
            errors: validationResult.error.format()
          }
        };
      }
      
      // Parse parameters
      const { calendarId, eventId } = validationResult.data;
      
      // Delete event
      const success = await this.googleCalendar?.deleteEvent({
        calendarId,
        eventId
      });
      
      if (!success) {
        return {
          success: false,
          message: "Failed to delete event",
        };
      }
      
      return {
        success: true,
        message: "Event deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting event:", error);
      return {
        success: false,
        message: `Failed to delete event: ${error instanceof Error ? error.message : "Unknown error"}`,
        error
      };
    }
  }

  /**
   * Handle fallback command using OpenAI
   */
  private async handleFallbackCommand(command: string, params: Record<string, any>): Promise<McpCommandResult> {
    try {
      // Try to interpret the command using OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an assistant that helps translate natural language requests into structured API calls for Google Calendar. 
            Extract the key information needed for Google Calendar operations.
            
            Available commands:
            - list_calendars: List all calendars
            - list_events: List events in a calendar (requires: calendarId, optional: timeMin, timeMax)
            - create_event: Create a new event (requires: calendarId, summary, start, end, optional: description, location, attendees)
            - update_event: Update an existing event (requires: calendarId, eventId, optional: summary, description, start, end, location, attendees)
            - delete_event: Delete an event (requires: calendarId, eventId)
            
            Respond in JSON format with:
            - command: The appropriate command from the list above
            - parameters: Key-value pairs of relevant parameters for the command
            `
          },
          {
            role: "user",
            content: `Interpret this Google Calendar request: "${command}". Here are some additional details that might be relevant: ${JSON.stringify(params)}`
          }
        ],
        response_format: { type: "json_object" }
      });

      // Parse the response
      const aiResponse = JSON.parse(response.choices[0].message.content);
      
      // Get the interpreted command and parameters
      const interpretedCommand = aiResponse.command;
      const interpretedParams = aiResponse.parameters;
      
      // Execute the interpreted command
      return await this.processCommand(interpretedCommand, interpretedParams);
    } catch (error) {
      console.error("Error handling fallback command:", error);
      return {
        success: false,
        message: `Could not interpret command. Please try one of the following: list_calendars, list_events, create_event, update_event, delete_event.`,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
}
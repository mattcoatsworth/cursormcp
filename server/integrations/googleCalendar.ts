import fs from 'fs';
import path from 'path';
import { OAuth2Client } from 'google-auth-library';
import { calendar_v3, google } from 'googleapis';

/**
 * Interface for calendar list entry
 */
export interface CalendarListEntry {
  id?: string | null;
  summary?: string | null;
}

/**
 * Interface for calendar event
 */
export interface CalendarEvent {
  id?: string | null;
  summary?: string | null;
  description?: string | null;
  start?: { dateTime?: string | null; date?: string | null; };
  end?: { dateTime?: string | null; date?: string | null; };
  location?: string | null;
  attendees?: CalendarEventAttendee[] | null;
}

/**
 * Interface for calendar event attendee
 */
export interface CalendarEventAttendee {
  email?: string | null;
  responseStatus?: string | null;
}

/**
 * Interface for list events parameters
 */
export interface ListEventsParams {
  calendarId: string;
  timeMin?: string;
  timeMax?: string;
}

/**
 * Interface for create event parameters
 */
export interface CreateEventParams {
  calendarId: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: { email: string }[];
}

/**
 * Interface for update event parameters
 */
export interface UpdateEventParams {
  calendarId: string;
  eventId: string;
  summary?: string;
  description?: string;
  start?: string;
  end?: string;
  location?: string;
  attendees?: { email: string }[];
}

/**
 * Interface for delete event parameters
 */
export interface DeleteEventParams {
  calendarId: string;
  eventId: string;
}

/**
 * GoogleCalendar class for interacting with Google Calendar API
 */
export class GoogleCalendar {
  private oauth2Client: OAuth2Client | null = null;
  private calendar: calendar_v3.Calendar | null = null;
  private tokenPath: string;
  private credentialsPath: string;

  /**
   * Constructor for GoogleCalendar
   */
  constructor(tokenDirectory: string = './temp') {
    // Create the directory if it doesn't exist
    if (!fs.existsSync(tokenDirectory)) {
      fs.mkdirSync(tokenDirectory, { recursive: true });
    }

    this.tokenPath = path.join(tokenDirectory, 'google-calendar-token.json');
    this.credentialsPath = path.join(tokenDirectory, 'google-calendar-credentials.json');
  }

  /**
   * Initialize Google Calendar API client
   */
  async initialize(clientId: string, clientSecret: string, redirectUri: string, tokens?: any): Promise<boolean> {
    try {
      // Create OAuth2 client
      this.oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );

      // If tokens are provided, set them
      if (tokens) {
        this.oauth2Client.setCredentials(tokens);
        await this.saveTokens(tokens);
      } else {
        // Try to load saved tokens
        const tokenLoaded = await this.loadSavedTokens();
        if (!tokenLoaded) {
          // If no saved tokens, we need to authenticate
          return false;
        }
      }

      // Save credentials
      await this.saveCredentials({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri
      });

      // Initialize calendar API
      this.calendar = google.calendar({
        version: 'v3',
        auth: this.oauth2Client
      });

      return true;
    } catch (error) {
      console.error('Error initializing Google Calendar:', error);
      return false;
    }
  }

  /**
   * Generate authentication URL for OAuth2 flow
   */
  getAuthUrl(): string {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized. Call initialize() first.');
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  /**
   * Get tokens from authorization code
   */
  async getTokenFromCode(code: string): Promise<any> {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized. Call initialize() first.');
    }

    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    await this.saveTokens(tokens);

    // Initialize calendar API
    this.calendar = google.calendar({
      version: 'v3',
      auth: this.oauth2Client
    });

    return tokens;
  }

  /**
   * Save credentials to file
   */
  private async saveCredentials(credentials: any): Promise<void> {
    try {
      fs.writeFileSync(
        this.credentialsPath,
        JSON.stringify(credentials, null, 2)
      );
    } catch (error) {
      console.error('Error saving credentials:', error);
      throw error;
    }
  }

  /**
   * Save tokens to file
   */
  private async saveTokens(tokens: any): Promise<void> {
    try {
      fs.writeFileSync(
        this.tokenPath,
        JSON.stringify(tokens, null, 2)
      );
    } catch (error) {
      console.error('Error saving tokens:', error);
      throw error;
    }
  }

  /**
   * Load saved tokens
   */
  private async loadSavedTokens(): Promise<boolean> {
    try {
      if (fs.existsSync(this.tokenPath)) {
        const tokens = JSON.parse(fs.readFileSync(this.tokenPath, 'utf-8'));
        if (this.oauth2Client) {
          this.oauth2Client.setCredentials(tokens);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error loading saved tokens:', error);
      return false;
    }
  }

  /**
   * List calendars
   */
  async listCalendars(): Promise<CalendarListEntry[]> {
    if (!this.calendar) {
      throw new Error('Calendar API not initialized. Call initialize() first.');
    }

    try {
      const response = await this.calendar.calendarList.list();
      return (response.data.items || []) as CalendarListEntry[];
    } catch (error) {
      console.error('Error listing calendars:', error);
      throw error;
    }
  }

  /**
   * List events
   */
  async listEvents(params: ListEventsParams): Promise<CalendarEvent[]> {
    if (!this.calendar) {
      throw new Error('Calendar API not initialized. Call initialize() first.');
    }

    try {
      const { calendarId, timeMin, timeMax } = params;
      
      const options: calendar_v3.Params$Resource$Events$List = {
        calendarId,
        timeMin: timeMin || undefined,
        timeMax: timeMax || undefined,
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime'
      };

      const response = await this.calendar.events.list(options);
      return (response.data.items || []) as CalendarEvent[];
    } catch (error) {
      console.error('Error listing events:', error);
      throw error;
    }
  }

  /**
   * Create event
   */
  async createEvent(params: CreateEventParams): Promise<CalendarEvent> {
    if (!this.calendar) {
      throw new Error('Calendar API not initialized. Call initialize() first.');
    }

    try {
      const { calendarId, summary, description, start, end, location, attendees } = params;
      
      // Determine if the provided dates are all-day (date only) or specific time (dateTime)
      const isAllDay = !start.includes('T');
      
      const eventResource: calendar_v3.Schema$Event = {
        summary,
        description,
        location,
        start: isAllDay 
          ? { date: start } 
          : { dateTime: start },
        end: isAllDay 
          ? { date: end } 
          : { dateTime: end },
        attendees: attendees?.map(a => ({ email: a.email }))
      };

      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: eventResource
      });

      return response.data as CalendarEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  /**
   * Update event
   */
  async updateEvent(params: UpdateEventParams): Promise<CalendarEvent> {
    if (!this.calendar) {
      throw new Error('Calendar API not initialized. Call initialize() first.');
    }

    try {
      const { calendarId, eventId, summary, description, start, end, location, attendees } = params;
      
      const eventResource: calendar_v3.Schema$Event = {};
      
      if (summary !== undefined) eventResource.summary = summary;
      if (description !== undefined) eventResource.description = description;
      if (location !== undefined) eventResource.location = location;
      
      if (start !== undefined) {
        const isAllDay = !start.includes('T');
        eventResource.start = isAllDay ? { date: start } : { dateTime: start };
      }
      
      if (end !== undefined) {
        const isAllDay = !end.includes('T');
        eventResource.end = isAllDay ? { date: end } : { dateTime: end };
      }
      
      if (attendees !== undefined) {
        eventResource.attendees = attendees.map(a => ({ email: a.email }));
      }

      const response = await this.calendar.events.patch({
        calendarId,
        eventId,
        requestBody: eventResource
      });

      return response.data as CalendarEvent;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  /**
   * Delete event
   */
  async deleteEvent(params: DeleteEventParams): Promise<boolean> {
    if (!this.calendar) {
      throw new Error('Calendar API not initialized. Call initialize() first.');
    }

    try {
      const { calendarId, eventId } = params;
      
      await this.calendar.events.delete({
        calendarId,
        eventId
      });

      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.oauth2Client !== null && this.calendar !== null;
  }
}
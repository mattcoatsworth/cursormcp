import { BaseMcpClient, McpCommandResult, McpCredentials } from "./baseMcp";
import { storage } from "../storage";
import axios from "axios";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

/**
 * Google Drive API credentials
 */
export interface GDriveCredentials extends McpCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessToken?: string;
  expiryDate?: number;
}

/**
 * Parameters for listing files in Google Drive
 */
interface ListFilesParams {
  query?: string;
  pageSize?: number;
  folderId?: string;
  orderBy?: string;
  pageToken?: string;
}

/**
 * Parameters for getting a file by ID
 */
interface GetFileParams {
  fileId: string;
}

/**
 * Parameters for creating a folder
 */
interface CreateFolderParams {
  name: string;
  parentId?: string;
}

/**
 * Parameters for searching files
 */
interface SearchFilesParams {
  query: string;
  pageSize?: number;
  pageToken?: string;
}

/**
 * Parameters for getting file content
 */
interface GetFileContentParams {
  fileId: string;
  mimeType?: string;
}

/**
 * Parameters for sharing a file
 */
interface ShareFileParams {
  fileId: string;
  email: string;
  role: 'reader' | 'writer' | 'commenter' | 'owner';
  type?: 'user' | 'group' | 'domain' | 'anyone';
  transferOwnership?: boolean;
}

/**
 * Google Drive MCP client implementation
 */
export class GDriveMcpClient extends BaseMcpClient {
  private clientId: string = "";
  private clientSecret: string = "";
  private refreshToken: string = "";
  private accessToken: string = "";
  private tokenExpiryDate: number = 0;
  private oauthClient: OAuth2Client | null = null;
  private drive: any = null;

  constructor() {
    super("gdrive");
  }

  /**
   * Extract credentials from API connection
   */
  protected extractCredentials(connectionCredentials: any): McpCredentials {
    if (!connectionCredentials) {
      throw new Error("Google Drive credentials not found");
    }

    const clientId = connectionCredentials.clientId;
    const clientSecret = connectionCredentials.clientSecret;
    const refreshToken = connectionCredentials.refreshToken;
    const accessToken = connectionCredentials.accessToken;
    const expiryDate = connectionCredentials.expiryDate;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error("Google Drive credentials are incomplete. Please ensure you have provided clientId, clientSecret, and refreshToken.");
    }

    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.refreshToken = refreshToken;
    
    if (accessToken) {
      this.accessToken = accessToken;
    }
    
    if (expiryDate) {
      this.tokenExpiryDate = expiryDate;
    }

    return {
      clientId,
      clientSecret,
      refreshToken,
      accessToken,
      expiryDate
    };
  }

  /**
   * Initialize OAuth2 client and Drive API
   */
  protected async serviceInitialize(): Promise<void> {
    this.oauthClient = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret
    );

    this.oauthClient.setCredentials({
      refresh_token: this.refreshToken,
      access_token: this.accessToken,
      expiry_date: this.tokenExpiryDate
    });

    // Check if the token needs refreshing
    if (this.tokenExpiryDate && Date.now() > this.tokenExpiryDate) {
      await this.refreshAccessToken();
    }

    this.drive = google.drive({
      version: 'v3',
      auth: this.oauthClient
    });
  }

  /**
   * Refresh the access token
   */
  private async refreshAccessToken(): Promise<void> {
    try {
      if (!this.oauthClient) {
        throw new Error("OAuth client not initialized");
      }

      const response = await this.oauthClient.refreshAccessToken();
      const credentials = response.credentials;
      
      this.accessToken = credentials.access_token || "";
      this.tokenExpiryDate = credentials.expiry_date || 0;

      // Update the stored credentials
      const connection = await storage.getApiConnectionByType("gdrive");
      if (connection && connection.id) {
        const updatedCredentials = {
          ...connection.credentials,
          accessToken: this.accessToken,
          expiryDate: this.tokenExpiryDate
        };

        await storage.updateApiConnection(connection.id, {
          credentials: updatedCredentials
        });
      }

      this.oauthClient.setCredentials({
        refresh_token: this.refreshToken,
        access_token: this.accessToken,
        expiry_date: this.tokenExpiryDate
      });
    } catch (error) {
      console.error("Failed to refresh access token:", error);
      throw new Error(`Failed to refresh Google Drive access token: ${error.message}`);
    }
  }

  /**
   * List files in Google Drive
   */
  async listFiles(params: ListFilesParams = {}): Promise<McpCommandResult> {
    await this.initialize();

    try {
      let query = params.query || "";
      
      // If a folder ID is provided, add it to the query
      if (params.folderId) {
        query = query ? `${query} and '${params.folderId}' in parents` : `'${params.folderId}' in parents`;
      }

      // Default to files that are not in trash
      query = query ? `${query} and trashed = false` : "trashed = false";

      const response = await this.drive.files.list({
        q: query,
        pageSize: params.pageSize || 10,
        orderBy: params.orderBy || "modifiedTime desc",
        pageToken: params.pageToken,
        fields: "nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, iconLink, parents, description)"
      });

      return {
        service: "gdrive",
        command: "listFiles",
        parameters: params,
        result: {
          files: response.data.files,
          nextPageToken: response.data.nextPageToken
        },
        success: true
      };
    } catch (error) {
      console.error("Error listing Google Drive files:", error);
      return {
        service: "gdrive",
        command: "listFiles",
        parameters: params,
        result: { error: error.message },
        success: false
      };
    }
  }

  /**
   * Get a file by ID
   */
  async getFile(params: GetFileParams): Promise<McpCommandResult> {
    await this.initialize();

    try {
      const response = await this.drive.files.get({
        fileId: params.fileId,
        fields: "id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, iconLink, parents, description, md5Checksum"
      });

      return {
        service: "gdrive",
        command: "getFile",
        parameters: params,
        result: response.data,
        success: true
      };
    } catch (error) {
      console.error("Error getting Google Drive file:", error);
      return {
        service: "gdrive",
        command: "getFile",
        parameters: params,
        result: { error: error.message },
        success: false
      };
    }
  }

  /**
   * Create a folder in Google Drive
   */
  async createFolder(params: CreateFolderParams): Promise<McpCommandResult> {
    await this.initialize();

    try {
      const fileMetadata = {
        name: params.name,
        mimeType: "application/vnd.google-apps.folder",
        parents: params.parentId ? [params.parentId] : undefined
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        fields: "id, name, mimeType, webViewLink"
      });

      return {
        service: "gdrive",
        command: "createFolder",
        parameters: params,
        result: response.data,
        success: true
      };
    } catch (error) {
      console.error("Error creating Google Drive folder:", error);
      return {
        service: "gdrive",
        command: "createFolder",
        parameters: params,
        result: { error: error.message },
        success: false
      };
    }
  }

  /**
   * Search files in Google Drive
   */
  async searchFiles(params: SearchFilesParams): Promise<McpCommandResult> {
    await this.initialize();

    try {
      // Build the search query
      const query = `fullText contains '${params.query}' and trashed = false`;

      const response = await this.drive.files.list({
        q: query,
        pageSize: params.pageSize || 10,
        pageToken: params.pageToken,
        fields: "nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, iconLink)"
      });

      return {
        service: "gdrive",
        command: "searchFiles",
        parameters: params,
        result: {
          files: response.data.files,
          nextPageToken: response.data.nextPageToken
        },
        success: true
      };
    } catch (error) {
      console.error("Error searching Google Drive files:", error);
      return {
        service: "gdrive",
        command: "searchFiles",
        parameters: params,
        result: { error: error.message },
        success: false
      };
    }
  }

  /**
   * Get file content
   */
  async getFileContent(params: GetFileContentParams): Promise<McpCommandResult> {
    await this.initialize();

    try {
      // First, get the file metadata to determine the MIME type if not provided
      const fileMetadata = await this.drive.files.get({
        fileId: params.fileId,
        fields: "id, name, mimeType"
      });

      const mimeType = params.mimeType || fileMetadata.data.mimeType;
      
      // Check if this is a Google Doc/Sheet/Slide that needs export
      if (mimeType.includes("google-apps")) {
        let exportMimeType = "application/pdf"; // Default to PDF export
        
        // Adjust export MIME type based on the Google file type
        if (mimeType === "application/vnd.google-apps.document") {
          exportMimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"; // DOCX
        } else if (mimeType === "application/vnd.google-apps.spreadsheet") {
          exportMimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"; // XLSX
        } else if (mimeType === "application/vnd.google-apps.presentation") {
          exportMimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation"; // PPTX
        }

        const response = await this.drive.files.export({
          fileId: params.fileId,
          mimeType: exportMimeType
        }, { responseType: "arraybuffer" });

        const content = Buffer.from(response.data).toString("base64");

        return {
          service: "gdrive",
          command: "getFileContent",
          parameters: params,
          result: {
            content,
            mimeType: exportMimeType,
            name: fileMetadata.data.name,
            isBase64Encoded: true
          },
          success: true
        };
      } else {
        // For regular files, download the content
        const response = await this.drive.files.get({
          fileId: params.fileId,
          alt: "media"
        }, { responseType: "arraybuffer" });

        const content = Buffer.from(response.data).toString("base64");

        return {
          service: "gdrive",
          command: "getFileContent",
          parameters: params,
          result: {
            content,
            mimeType,
            name: fileMetadata.data.name,
            isBase64Encoded: true
          },
          success: true
        };
      }
    } catch (error) {
      console.error("Error getting Google Drive file content:", error);
      return {
        service: "gdrive",
        command: "getFileContent",
        parameters: params,
        result: { error: error.message },
        success: false
      };
    }
  }

  /**
   * Share a file with another user
   */
  async shareFile(params: ShareFileParams): Promise<McpCommandResult> {
    await this.initialize();

    try {
      const permissionResource = {
        type: params.type || 'user',
        role: params.role,
        emailAddress: params.email
      };

      const response = await this.drive.permissions.create({
        fileId: params.fileId,
        transferOwnership: params.transferOwnership || false,
        resource: permissionResource
      });

      return {
        service: "gdrive",
        command: "shareFile",
        parameters: params,
        result: response.data,
        success: true
      };
    } catch (error) {
      console.error("Error sharing Google Drive file:", error);
      return {
        service: "gdrive",
        command: "shareFile",
        parameters: params,
        result: { error: error.message },
        success: false
      };
    }
  }
}

// Export a singleton instance
export const gdriveMcpClient = new GDriveMcpClient();

/**
 * Process Google Drive MCP commands
 */
export async function processGDriveMcpCommand(
  command: string,
  parameters: Record<string, any>
): Promise<McpCommandResult> {
  try {
    switch (command) {
      case "listFiles":
        return await gdriveMcpClient.listFiles(parameters);
      case "getFile":
        return await gdriveMcpClient.getFile(parameters);
      case "createFolder":
        return await gdriveMcpClient.createFolder(parameters);
      case "searchFiles":
        return await gdriveMcpClient.searchFiles(parameters);
      case "getFileContent":
        return await gdriveMcpClient.getFileContent(parameters);
      case "shareFile":
        return await gdriveMcpClient.shareFile(parameters);
      default:
        return {
          service: "gdrive",
          command,
          parameters,
          result: { error: `Unknown command: ${command}` },
          success: false
        };
    }
  } catch (error) {
    console.error("Error processing Google Drive MCP command:", error);
    return {
      service: "gdrive",
      command,
      parameters,
      result: { error: error.message },
      success: false
    };
  }
}
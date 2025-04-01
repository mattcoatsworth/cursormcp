import { BaseMcpClient, McpCommandResult, McpCredentials } from "./baseMcp";
import { storage } from "../storage";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

/**
 * Figma API credentials
 */
export interface FigmaCredentials extends McpCredentials {
  accessToken: string;
}

/**
 * Parameters for getting a Figma file
 */
interface GetFileParams {
  fileKey: string;
  depth?: number;
}

/**
 * Parameters for getting a specific node
 */
interface GetNodeParams {
  fileKey: string;
  nodeId: string;
  depth?: number;
}

/**
 * Parameters for getting images from a Figma file
 */
interface GetImagesParams {
  fileKey: string;
  nodes: string[];
  format?: "jpg" | "png" | "svg" | "pdf";
  scale?: number;
}

/**
 * Parameters for getting image fills
 */
interface GetImageFillsParams {
  fileKey: string;
}

/**
 * Parameters for getting file comments
 */
interface GetCommentsParams {
  fileKey: string;
}

/**
 * Parameters for posting a comment
 */
interface PostCommentParams {
  fileKey: string;
  message: string;
  clientMeta?: {
    x: number;
    y: number;
    node_id?: string;
    node_offset?: {
      x: number;
      y: number;
    };
  };
}

/**
 * Simplified Figma node interface for design elements
 */
interface SimplifiedNode {
  id: string;
  name: string;
  type: string;
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  children?: SimplifiedNode[];
  characterStyles?: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: number;
    color?: {
      r: number;
      g: number;
      b: number;
      a: number;
    };
  };
  fills?: any[];
  strokes?: any[];
  backgroundColor?: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  characters?: string;
}

/**
 * Figma MCP client implementation
 */
export class FigmaMcpClient extends BaseMcpClient {
  private accessToken: string = "";
  private baseUrl: string = "https://api.figma.com/v1";

  constructor() {
    super("figma");
  }

  /**
   * Extract credentials from API connection
   */
  protected extractCredentials(connectionCredentials: any): McpCredentials {
    const accessToken = connectionCredentials.accessToken || connectionCredentials.access_token || connectionCredentials.personalAccessToken;

    if (!accessToken) {
      throw new Error("Figma access token is required");
    }

    this.accessToken = accessToken;

    return {
      accessToken
    };
  }

  /**
   * Service-specific initialization
   */
  protected async serviceInitialize(): Promise<void> {
    // No additional initialization needed for Figma
  }

  /**
   * Make a request to the Figma API
   */
  private async request<T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any): Promise<T> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers = {
        'X-Figma-Token': this.accessToken,
        'Content-Type': 'application/json'
      };

      const response = await axios({
        method,
        url,
        headers,
        data
      });

      return response.data;
    } catch (error) {
      console.error(`Error making request to Figma API: ${error.message}`);
      if (error.response) {
        console.error(`Status: ${error.response.status}, Data:`, error.response.data);
        throw new Error(`Figma API Error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Get a Figma file
   */
  async getFile(params: GetFileParams): Promise<McpCommandResult> {
    await this.initialize();

    try {
      const endpoint = `/files/${params.fileKey}${params.depth ? `?depth=${params.depth}` : ''}`;
      const response = await this.request(endpoint);

      // Simplify the response to make it more manageable
      const simplifiedResponse = this.simplifyFigmaResponse(response);

      return {
        service: "figma",
        command: "getFile",
        parameters: params,
        result: simplifiedResponse,
        success: true
      };
    } catch (error) {
      console.error("Error getting Figma file:", error);
      return {
        service: "figma",
        command: "getFile",
        parameters: params,
        result: { error: error.message },
        success: false
      };
    }
  }

  /**
   * Get a specific node from a Figma file
   */
  async getNode(params: GetNodeParams): Promise<McpCommandResult> {
    await this.initialize();

    try {
      const endpoint = `/files/${params.fileKey}/nodes?ids=${params.nodeId}${params.depth ? `&depth=${params.depth}` : ''}`;
      const response = await this.request(endpoint);

      // Simplify the response
      const simplifiedResponse = this.simplifyFigmaResponse(response);

      return {
        service: "figma",
        command: "getNode",
        parameters: params,
        result: simplifiedResponse,
        success: true
      };
    } catch (error) {
      console.error("Error getting Figma node:", error);
      return {
        service: "figma",
        command: "getNode",
        parameters: params,
        result: { error: error.message },
        success: false
      };
    }
  }

  /**
   * Get images from a Figma file
   */
  async getImages(params: GetImagesParams): Promise<McpCommandResult> {
    await this.initialize();

    try {
      const format = params.format || "png";
      const scale = params.scale || 1;
      
      const endpoint = `/images/${params.fileKey}?ids=${params.nodes.join(",")}&format=${format}&scale=${scale}`;
      const response = await this.request(endpoint);

      return {
        service: "figma",
        command: "getImages",
        parameters: params,
        result: response,
        success: true
      };
    } catch (error) {
      console.error("Error getting Figma images:", error);
      return {
        service: "figma",
        command: "getImages",
        parameters: params,
        result: { error: error.message },
        success: false
      };
    }
  }

  /**
   * Get image fills from a Figma file
   */
  async getImageFills(params: GetImageFillsParams): Promise<McpCommandResult> {
    await this.initialize();

    try {
      const endpoint = `/files/${params.fileKey}/images`;
      const response = await this.request(endpoint);

      return {
        service: "figma",
        command: "getImageFills",
        parameters: params,
        result: response,
        success: true
      };
    } catch (error) {
      console.error("Error getting Figma image fills:", error);
      return {
        service: "figma",
        command: "getImageFills",
        parameters: params,
        result: { error: error.message },
        success: false
      };
    }
  }

  /**
   * Get comments from a Figma file
   */
  async getComments(params: GetCommentsParams): Promise<McpCommandResult> {
    await this.initialize();

    try {
      const endpoint = `/files/${params.fileKey}/comments`;
      const response = await this.request(endpoint);

      return {
        service: "figma",
        command: "getComments",
        parameters: params,
        result: response,
        success: true
      };
    } catch (error) {
      console.error("Error getting Figma comments:", error);
      return {
        service: "figma",
        command: "getComments",
        parameters: params,
        result: { error: error.message },
        success: false
      };
    }
  }

  /**
   * Post a comment to a Figma file
   */
  async postComment(params: PostCommentParams): Promise<McpCommandResult> {
    await this.initialize();

    try {
      const endpoint = `/files/${params.fileKey}/comments`;
      const data: any = {
        message: params.message
      };

      if (params.clientMeta) {
        data.client_meta = params.clientMeta;
      }

      const response = await this.request(endpoint, 'POST', data);

      return {
        service: "figma",
        command: "postComment",
        parameters: params,
        result: response,
        success: true
      };
    } catch (error) {
      console.error("Error posting Figma comment:", error);
      return {
        service: "figma",
        command: "postComment",
        parameters: params,
        result: { error: error.message },
        success: false
      };
    }
  }

  /**
   * Download an image from Figma
   */
  async downloadImage(imageUrl: string, localPath: string, fileName: string): Promise<string> {
    try {
      // Create the directory if it doesn't exist
      if (!fs.existsSync(localPath)) {
        fs.mkdirSync(localPath, { recursive: true });
      }

      // Generate a unique filename if not provided
      if (!fileName) {
        const hash = crypto.createHash('md5').update(imageUrl).digest('hex');
        const extension = imageUrl.toLowerCase().includes('svg') ? 'svg' : 'png';
        fileName = `figma-${hash}.${extension}`;
      }

      const fullPath = path.join(localPath, fileName);
      
      // Download the image
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(fullPath, response.data);

      return fullPath;
    } catch (error) {
      console.error("Error downloading Figma image:", error);
      throw new Error(`Failed to download image: ${error.message}`);
    }
  }

  /**
   * Simplify the Figma API response to make it more manageable
   */
  private simplifyFigmaResponse(response: any): any {
    if (!response) return null;

    // Extract document from the response
    let document;
    if (response.document) {
      document = response.document;
    } else if (response.nodes) {
      // For node responses, get the first node
      const nodeId = Object.keys(response.nodes)[0];
      document = response.nodes[nodeId]?.document;
    }

    if (!document) {
      return response; // Can't simplify, return original
    }

    // Gather important metadata
    const metadata = {
      name: response.name || document.name,
      lastModified: response.lastModified,
      version: response.version,
      thumbnailUrl: response.thumbnailUrl,
      documentKey: response.key || document.key
    };

    // Simplify the document tree
    const simplifyNode = (node: any): SimplifiedNode => {
      const simplified: SimplifiedNode = {
        id: node.id,
        name: node.name,
        type: node.type
      };

      if (node.absoluteBoundingBox) {
        simplified.absoluteBoundingBox = node.absoluteBoundingBox;
      }

      // Include important style properties
      if (node.style) {
        simplified.characterStyles = {
          fontSize: node.style.fontSize,
          fontFamily: node.style.fontFamily,
          fontWeight: node.style.fontWeight
        };
      }

      // Include fills
      if (node.fills && node.fills.length > 0) {
        simplified.fills = node.fills;
      }

      // Include strokes
      if (node.strokes && node.strokes.length > 0) {
        simplified.strokes = node.strokes;
      }

      // Include text content
      if (node.characters) {
        simplified.characters = node.characters;
      }

      // Include background color
      if (node.backgroundColor) {
        simplified.backgroundColor = node.backgroundColor;
      }

      // Recursively include children
      if (node.children && node.children.length > 0) {
        simplified.children = node.children.map(simplifyNode);
      }

      return simplified;
    };

    // Create the simplified response
    const simplifiedResponse = {
      ...metadata,
      document: simplifyNode(document)
    };

    return simplifiedResponse;
  }
}

// Export a singleton instance
export const figmaMcpClient = new FigmaMcpClient();

/**
 * Process Figma MCP commands
 */
export async function processFigmaMcpCommand(
  command: string,
  parameters: Record<string, any>
): Promise<McpCommandResult> {
  try {
    switch (command) {
      case "getFile":
        return await figmaMcpClient.getFile(parameters);
      case "getNode":
        return await figmaMcpClient.getNode(parameters);
      case "getImages":
        return await figmaMcpClient.getImages(parameters);
      case "getImageFills":
        return await figmaMcpClient.getImageFills(parameters);
      case "getComments":
        return await figmaMcpClient.getComments(parameters);
      case "postComment":
        return await figmaMcpClient.postComment(parameters);
      default:
        return {
          service: "figma",
          command,
          parameters,
          result: { error: `Unknown command: ${command}` },
          success: false
        };
    }
  } catch (error) {
    console.error("Error processing Figma MCP command:", error);
    return {
      service: "figma",
      command,
      parameters,
      result: { error: error.message },
      success: false
    };
  }
}
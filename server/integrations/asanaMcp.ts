import { BaseMcpClient, McpCommandResult, McpCredentials } from "./baseMcp";
import { storage } from "../storage";
import OpenAI from "openai";
import axios from "axios";

/**
 * Asana API client credentials
 */
export interface AsanaCredentials extends McpCredentials {
  accessToken: string;
  workspaceGid?: string;
}

/**
 * Parameters for getting a list of workspaces
 */
interface GetWorkspacesParams {
  limit?: number;
}

/**
 * Parameters for getting a list of projects
 */
interface GetProjectsParams {
  workspaceGid?: string;
  limit?: number;
}

/**
 * Parameters for getting a project by GID
 */
interface GetProjectParams {
  projectGid: string;
}

/**
 * Parameters for getting a list of tasks
 */
interface GetTasksParams {
  projectGid?: string;
  workspaceGid?: string;
  assigneeGid?: string;
  completed?: boolean;
  limit?: number;
}

/**
 * Parameters for getting a task by GID
 */
interface GetTaskParams {
  taskGid: string;
}

/**
 * Parameters for creating a task
 */
interface CreateTaskParams {
  name: string;
  projectGid?: string;
  workspaceGid?: string;
  notes?: string;
  dueOn?: string;
  assigneeGid?: string;
}

/**
 * Parameters for updating a task
 */
interface UpdateTaskParams {
  taskGid: string;
  name?: string;
  notes?: string;
  dueOn?: string;
  completed?: boolean;
  assigneeGid?: string;
}

/**
 * Asana MCP client implementation
 */
export class AsanaMcpClient extends BaseMcpClient {
  private accessToken: string = "";
  private workspaceGid: string = "";
  private baseUrl: string = "https://app.asana.com/api/1.0";

  constructor() {
    super("asana");
  }

  /**
   * Extract credentials from API connection
   */
  protected extractCredentials(connectionCredentials: any): McpCredentials {
    if (!connectionCredentials || !connectionCredentials.accessToken) {
      throw new Error("Asana API credentials not found or incomplete. Please reconnect the API.");
    }

    this.accessToken = connectionCredentials.accessToken;
    
    if (connectionCredentials.workspaceGid) {
      this.workspaceGid = connectionCredentials.workspaceGid;
    }

    return {
      accessToken: this.accessToken,
      workspaceGid: this.workspaceGid
    };
  }

  /**
   * Service-specific initialization
   */
  protected async serviceInitialize(): Promise<void> {
    // No additional initialization needed
  }

  /**
   * Make an authenticated request to the Asana API
   */
  private async makeRequest<T = any>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Authorization": `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    try {
      const response = await axios({
        method,
        url,
        headers,
        data,
      });

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Asana API error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Get a list of available workspaces
   */
  async getWorkspaces(params: GetWorkspacesParams = {}): Promise<McpCommandResult> {
    await this.initialize();

    try {
      const queryParams = new URLSearchParams();
      if (params.limit) {
        queryParams.append("limit", params.limit.toString());
      }

      const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
      const workspaces = await this.makeRequest("GET", `/workspaces${query}`);

      return {
        success: true,
        data: workspaces
      };
    } catch (error) {
      console.error("Error fetching Asana workspaces:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error fetching Asana workspaces",
        error
      };
    }
  }

  /**
   * Get a list of projects in a workspace
   */
  async getProjects(params: GetProjectsParams = {}): Promise<McpCommandResult> {
    await this.initialize();

    try {
      const workspaceGid = params.workspaceGid || this.workspaceGid;
      if (!workspaceGid) {
        throw new Error("Workspace GID is required. Please specify a workspace GID or set a default workspace.");
      }

      const queryParams = new URLSearchParams();
      queryParams.append("workspace", workspaceGid);
      if (params.limit) {
        queryParams.append("limit", params.limit.toString());
      }

      const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
      const projects = await this.makeRequest("GET", `/projects${query}`);

      return {
        success: true,
        data: projects
      };
    } catch (error) {
      console.error("Error fetching Asana projects:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error fetching Asana projects",
        error
      };
    }
  }

  /**
   * Get a project by GID
   */
  async getProject(params: GetProjectParams): Promise<McpCommandResult> {
    await this.initialize();

    try {
      const { projectGid } = params;
      if (!projectGid) {
        throw new Error("Project GID is required");
      }

      const project = await this.makeRequest("GET", `/projects/${projectGid}`);

      return {
        success: true,
        data: project
      };
    } catch (error) {
      console.error("Error fetching Asana project:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error fetching Asana project",
        error
      };
    }
  }

  /**
   * Get a list of tasks
   */
  async getTasks(params: GetTasksParams = {}): Promise<McpCommandResult> {
    await this.initialize();

    try {
      const queryParams = new URLSearchParams();
      
      if (params.projectGid) {
        queryParams.append("project", params.projectGid);
      } else if (params.workspaceGid || this.workspaceGid) {
        queryParams.append("workspace", params.workspaceGid || this.workspaceGid);
      } else {
        throw new Error("Either project GID or workspace GID is required");
      }

      if (params.assigneeGid) {
        queryParams.append("assignee", params.assigneeGid);
      }

      if (params.completed !== undefined) {
        queryParams.append("completed", params.completed.toString());
      }

      if (params.limit) {
        queryParams.append("limit", params.limit.toString());
      }

      const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
      const tasks = await this.makeRequest("GET", `/tasks${query}`);

      return {
        success: true,
        data: tasks
      };
    } catch (error) {
      console.error("Error fetching Asana tasks:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error fetching Asana tasks",
        error
      };
    }
  }

  /**
   * Get a task by GID
   */
  async getTask(params: GetTaskParams): Promise<McpCommandResult> {
    await this.initialize();

    try {
      const { taskGid } = params;
      if (!taskGid) {
        throw new Error("Task GID is required");
      }

      const task = await this.makeRequest("GET", `/tasks/${taskGid}`);

      return {
        success: true,
        data: task
      };
    } catch (error) {
      console.error("Error fetching Asana task:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error fetching Asana task",
        error
      };
    }
  }

  /**
   * Create a new task
   */
  async createTask(params: CreateTaskParams): Promise<McpCommandResult> {
    await this.initialize();

    try {
      const { name, projectGid, workspaceGid, notes, dueOn, assigneeGid } = params;
      
      if (!name) {
        throw new Error("Task name is required");
      }
      
      if (!projectGid && !workspaceGid && !this.workspaceGid) {
        throw new Error("Either project GID or workspace GID is required");
      }

      const requestData: any = {
        name,
        notes: notes || "",
      };

      if (dueOn) {
        requestData.due_on = dueOn;
      }

      if (assigneeGid) {
        requestData.assignee = assigneeGid;
      }

      if (projectGid) {
        requestData.projects = [projectGid];
      }

      if (workspaceGid || this.workspaceGid) {
        requestData.workspace = workspaceGid || this.workspaceGid;
      }

      const task = await this.makeRequest("POST", "/tasks", { data: requestData });

      return {
        success: true,
        data: task
      };
    } catch (error) {
      console.error("Error creating Asana task:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error creating Asana task",
        error
      };
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(params: UpdateTaskParams): Promise<McpCommandResult> {
    await this.initialize();

    try {
      const { taskGid, name, notes, dueOn, completed, assigneeGid } = params;
      
      if (!taskGid) {
        throw new Error("Task GID is required");
      }

      const requestData: any = {};

      if (name !== undefined) {
        requestData.name = name;
      }

      if (notes !== undefined) {
        requestData.notes = notes;
      }

      if (dueOn !== undefined) {
        requestData.due_on = dueOn;
      }

      if (completed !== undefined) {
        requestData.completed = completed;
      }

      if (assigneeGid !== undefined) {
        requestData.assignee = assigneeGid;
      }

      const task = await this.makeRequest("PUT", `/tasks/${taskGid}`, { data: requestData });

      return {
        success: true,
        data: task
      };
    } catch (error) {
      console.error("Error updating Asana task:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error updating Asana task",
        error
      };
    }
  }
}

/**
 * Process Asana MCP commands
 */
export async function processAsanaMcpCommand(
  command: string, 
  parameters: any = {}
): Promise<McpCommandResult> {
  try {
    const asanaMcp = new AsanaMcpClient();
    
    switch (command.toLowerCase()) {
      case "get_workspaces":
        return await asanaMcp.getWorkspaces(parameters);
        
      case "get_projects":
        return await asanaMcp.getProjects(parameters);
        
      case "get_project":
        return await asanaMcp.getProject(parameters);
        
      case "get_tasks":
        return await asanaMcp.getTasks(parameters);
        
      case "get_task":
        return await asanaMcp.getTask(parameters);
        
      case "create_task":
        return await asanaMcp.createTask(parameters);
        
      case "update_task":
        return await asanaMcp.updateTask(parameters);
        
      default:
        return {
          success: false,
          message: `Unknown Asana command: ${command}`
        };
    }
  } catch (error) {
    console.error("Error processing Asana MCP command:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error processing Asana MCP command",
      error
    };
  }
}
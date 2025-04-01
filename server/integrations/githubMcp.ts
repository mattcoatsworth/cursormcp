import { BaseMcpClient, McpCommandResult, McpCredentials } from "./baseMcp";
import path from "path";
import fs from "fs";
import axios from "axios";
import { spawn } from "child_process";

/**
 * GitHub-specific MCP command result
 */
export interface GitHubCommandResult extends McpCommandResult {
  data?: {
    repository?: Record<string, any>;
    repositories?: Array<Record<string, any>>;
    branch?: Record<string, any>;
    branches?: Array<Record<string, any>>;
    file?: Record<string, any>;
    files?: Array<Record<string, any>>;
    issue?: Record<string, any>;
    issues?: Array<Record<string, any>>;
    pullRequest?: Record<string, any>;
    pullRequests?: Array<Record<string, any>>;
    commit?: Record<string, any>;
    commits?: Array<Record<string, any>>;
    searchResults?: Array<Record<string, any>>;
    review?: Record<string, any>;
    reviews?: Array<Record<string, any>>;
    nextCursor?: string;
    hasNextPage?: boolean;
  };
}

/**
 * GitHub MCP client implementation
 */
export class GitHubMcpClient extends BaseMcpClient {
  private githubToken: string | null = null;
  private serverProcess: any = null;
  private isServerRunning: boolean = false;

  constructor() {
    super("github");
  }

  /**
   * Extract GitHub credentials from API connection
   */
  protected extractCredentials(connectionCredentials: any): McpCredentials {
    if (!connectionCredentials.githubToken) {
      throw new Error("GitHub token not found. Please reconnect the GitHub API.");
    }

    // Return credentials in environment variable format for MCP server
    return {
      GITHUB_PERSONAL_ACCESS_TOKEN: connectionCredentials.githubToken
    };
  }

  /**
   * Initialize GitHub-specific functionality
   */
  protected async serviceInitialize(): Promise<void> {
    // Initialize the GitHub client
    if (!this.credentials.GITHUB_PERSONAL_ACCESS_TOKEN) {
      throw new Error("GitHub token not available. Cannot initialize GitHub client.");
    }

    this.githubToken = this.credentials.GITHUB_PERSONAL_ACCESS_TOKEN;
    console.log("GitHub MCP client initialized successfully");
  }

  /**
   * Run a GitHub MCP server command
   * Uses the MCP server from the temp repos if available
   */
  private async runServerCommand(toolName: string, toolArgs: Record<string, any>): Promise<GitHubCommandResult> {
    try {
      // Path to the GitHub MCP server
      const serverPath = path.join(process.cwd(), 'temp-repos', 'servers', 'src', 'github', 'index.ts');
      
      // Check if the server file exists
      if (!fs.existsSync(serverPath)) {
        throw new Error(`GitHub MCP server not found at ${serverPath}`);
      }

      // Create a unique request ID
      const requestId = Date.now().toString();
      
      // Prepare the request message in MCP format
      const requestMessage = {
        id: requestId,
        request: {
          type: "CallToolRequest",
          params: {
            name: toolName,
            arguments: toolArgs
          }
        }
      };

      // Launch the MCP server process
      const nodeExecutable = process.execPath;
      const args = ['-r', 'ts-node/register', serverPath];
      
      // Set environment variables for the process
      const processEnv: NodeJS.ProcessEnv = { ...process.env };
      
      if (this.githubToken) {
        processEnv.GITHUB_PERSONAL_ACCESS_TOKEN = this.githubToken;
      }

      return new Promise<GitHubCommandResult>((resolve, reject) => {
        const serverProcess = spawn(nodeExecutable, args, {
          env: processEnv,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let responseData = '';
        let errorData = '';

        serverProcess.stdout?.on('data', (data: Buffer) => {
          responseData += data.toString();
        });

        serverProcess.stderr?.on('data', (data: Buffer) => {
          errorData += data.toString();
          console.error(`GitHub MCP server error: ${data.toString()}`);
        });

        serverProcess.on('close', (code: number | null) => {
          if (code !== 0) {
            console.error(`GitHub MCP server exited with code ${code}`);
            console.error(`Error output: ${errorData}`);
            reject(new Error(`GitHub MCP server failed with code ${code}: ${errorData}`));
            return;
          }

          try {
            // Parse the response
            const responses = responseData.split('\n')
              .filter(line => line.trim() !== '')
              .map(line => JSON.parse(line));

            // Find the matching response by request ID
            const response = responses.find(r => r.id === requestId);

            if (!response) {
              reject(new Error('No response received from GitHub MCP server'));
              return;
            }

            // Check for errors in the response
            if (response.response?.error) {
              return resolve({
                success: false,
                message: response.response.error.message || 'GitHub operation failed',
                error: response.response.error
              });
            }

            // Extract the content text which contains the JSON result
            const resultText = response.response?.result?.content?.[0]?.text;
            
            if (!resultText) {
              return resolve({
                success: true,
                data: {} // Empty result
              });
            }

            // Parse the result text as JSON
            const resultData = JSON.parse(resultText);
            
            return resolve({
              success: true,
              data: resultData
            });
          } catch (error) {
            console.error('Error parsing GitHub MCP server response:', error);
            reject(error);
          }
        });

        // Send the request to the server
        serverProcess.stdin?.write(JSON.stringify(requestMessage) + '\n');
        serverProcess.stdin?.end();
      });
    } catch (error) {
      console.error('Error running GitHub MCP server command:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
        error
      };
    }
  }

  /**
   * Get a specific repository by owner and name
   */
  async getRepository(owner: string, repo: string): Promise<GitHubCommandResult> {
    await this.initialize();

    if (!this.githubToken) {
      return {
        success: false,
        message: "GitHub client not initialized",
        error: new Error("GitHub client not initialized")
      };
    }

    try {
      // Use direct API call
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      return {
        success: true,
        data: {
          repository: response.data
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to get repository ${owner}/${repo}`,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Search repositories based on query
   */
  async searchRepositories(query: string, page: number = 1, perPage: number = 10): Promise<GitHubCommandResult> {
    await this.initialize();

    if (!this.githubToken) {
      return {
        success: false,
        message: "GitHub client not initialized",
        error: new Error("GitHub client not initialized")
      };
    }

    try {
      // Try to use the MCP server if available
      return await this.runServerCommand('search_repositories', {
        query,
        page,
        perPage
      });
    } catch (error) {
      console.error('Failed to use GitHub MCP server for searchRepositories, falling back to direct API call:', error);
      
      // Fallback to direct API call
      try {
        const response = await axios.get('https://api.github.com/search/repositories', {
          headers: {
            'Authorization': `token ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          },
          params: {
            q: query,
            page,
            per_page: perPage
          }
        });

        return {
          success: true,
          data: {
            repositories: response.data.items,
            hasNextPage: page * perPage < response.data.total_count,
            nextCursor: (page * perPage < response.data.total_count) ? (page + 1).toString() : undefined
          }
        };
      } catch (apiError: any) {
        return {
          success: false,
          message: 'Failed to search repositories',
          error: apiError.response?.data?.message || apiError.message
        };
      }
    }
  }

  /**
   * Create a new repository
   */
  async createRepository(options: any): Promise<GitHubCommandResult> {
    await this.initialize();

    if (!this.githubToken) {
      return {
        success: false,
        message: "GitHub client not initialized",
        error: new Error("GitHub client not initialized")
      };
    }

    try {
      // Try to use the MCP server if available
      return await this.runServerCommand('create_repository', options);
    } catch (error) {
      console.error('Failed to use GitHub MCP server for createRepository, falling back to direct API call:', error);
      
      // Fallback to direct API call
      try {
        const response = await axios.post('https://api.github.com/user/repos', options, {
          headers: {
            'Authorization': `token ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        return {
          success: true,
          data: {
            repository: response.data
          }
        };
      } catch (apiError: any) {
        return {
          success: false,
          message: 'Failed to create repository',
          error: apiError.response?.data?.message || apiError.message
        };
      }
    }
  }

  /**
   * Get file contents from a repository
   */
  async getFileContents(owner: string, repo: string, path: string, branch?: string): Promise<GitHubCommandResult> {
    await this.initialize();

    if (!this.githubToken) {
      return {
        success: false,
        message: "GitHub client not initialized",
        error: new Error("GitHub client not initialized")
      };
    }

    try {
      // Try to use the MCP server if available
      return await this.runServerCommand('get_file_contents', {
        owner,
        repo,
        path,
        branch
      });
    } catch (error) {
      console.error('Failed to use GitHub MCP server for getFileContents, falling back to direct API call:', error);
      
      // Fallback to direct API call
      try {
        let url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        if (branch) {
          url += `?ref=${branch}`;
        }

        const response = await axios.get(url, {
          headers: {
            'Authorization': `token ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        return {
          success: true,
          data: {
            file: response.data
          }
        };
      } catch (apiError: any) {
        return {
          success: false,
          message: `Failed to get file contents: ${path}`,
          error: apiError.response?.data?.message || apiError.message
        };
      }
    }
  }

  /**
   * Create or update a file in a repository
   */
  async createOrUpdateFile(owner: string, repo: string, path: string, content: string, message: string, branch?: string, sha?: string): Promise<GitHubCommandResult> {
    await this.initialize();

    if (!this.githubToken) {
      return {
        success: false,
        message: "GitHub client not initialized",
        error: new Error("GitHub client not initialized")
      };
    }

    try {
      // Try to use the MCP server if available
      return await this.runServerCommand('create_or_update_file', {
        owner,
        repo,
        path,
        content,
        message,
        branch,
        sha
      });
    } catch (error) {
      console.error('Failed to use GitHub MCP server for createOrUpdateFile, falling back to direct API call:', error);
      
      // Fallback to direct API call
      try {
        // If sha is not provided, we need to check if the file exists to get its sha
        if (!sha) {
          try {
            const fileResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${path}${branch ? `?ref=${branch}` : ''}`, {
              headers: {
                'Authorization': `token ${this.githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            });
            
            if (fileResponse.data && fileResponse.data.sha) {
              sha = fileResponse.data.sha;
            }
          } catch (error) {
            // File doesn't exist, which is fine for creation
          }
        }

        // Base64 encode the content
        const encodedContent = Buffer.from(content).toString('base64');
        
        // Prepare the request body
        const requestBody: any = {
          message,
          content: encodedContent
        };
        
        if (branch) {
          requestBody.branch = branch;
        }
        
        if (sha) {
          requestBody.sha = sha;
        }

        const response = await axios.put(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, requestBody, {
          headers: {
            'Authorization': `token ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        return {
          success: true,
          data: {
            file: response.data
          }
        };
      } catch (apiError: any) {
        return {
          success: false,
          message: `Failed to create or update file: ${path}`,
          error: apiError.response?.data?.message || apiError.message
        };
      }
    }
  }

  /**
   * Push multiple files to a repository
   */
  async pushFiles(owner: string, repo: string, branch: string, files: Array<{ path: string, content: string }>, message: string): Promise<GitHubCommandResult> {
    await this.initialize();

    if (!this.githubToken) {
      return {
        success: false,
        message: "GitHub client not initialized",
        error: new Error("GitHub client not initialized")
      };
    }

    try {
      // Try to use the MCP server if available
      return await this.runServerCommand('push_files', {
        owner,
        repo,
        branch,
        files,
        message
      });
    } catch (error) {
      console.error('Failed to use GitHub MCP server for pushFiles:', error);
      return {
        success: false,
        message: 'Failed to push files, and direct API fallback is not implemented for this operation',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Create an issue in a repository
   */
  async createIssue(owner: string, repo: string, options: { title: string, body?: string, labels?: string[], assignees?: string[] }): Promise<GitHubCommandResult> {
    await this.initialize();

    if (!this.githubToken) {
      return {
        success: false,
        message: "GitHub client not initialized",
        error: new Error("GitHub client not initialized")
      };
    }

    try {
      // Try to use the MCP server if available
      return await this.runServerCommand('create_issue', {
        owner,
        repo,
        ...options
      });
    } catch (error) {
      console.error('Failed to use GitHub MCP server for createIssue, falling back to direct API call:', error);
      
      // Fallback to direct API call
      try {
        const response = await axios.post(`https://api.github.com/repos/${owner}/${repo}/issues`, options, {
          headers: {
            'Authorization': `token ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        return {
          success: true,
          data: {
            issue: response.data
          }
        };
      } catch (apiError: any) {
        return {
          success: false,
          message: 'Failed to create issue',
          error: apiError.response?.data?.message || apiError.message
        };
      }
    }
  }

  /**
   * Create a pull request
   */
  async createPullRequest(options: { owner: string, repo: string, title: string, body?: string, head: string, base: string, draft?: boolean }): Promise<GitHubCommandResult> {
    await this.initialize();

    if (!this.githubToken) {
      return {
        success: false,
        message: "GitHub client not initialized",
        error: new Error("GitHub client not initialized")
      };
    }

    try {
      // Try to use the MCP server if available
      return await this.runServerCommand('create_pull_request', options);
    } catch (error) {
      console.error('Failed to use GitHub MCP server for createPullRequest, falling back to direct API call:', error);
      
      // Fallback to direct API call
      try {
        const { owner, repo, ...pullRequestOptions } = options;
        
        const response = await axios.post(`https://api.github.com/repos/${owner}/${repo}/pulls`, pullRequestOptions, {
          headers: {
            'Authorization': `token ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        return {
          success: true,
          data: {
            pullRequest: response.data
          }
        };
      } catch (apiError: any) {
        return {
          success: false,
          message: 'Failed to create pull request',
          error: apiError.response?.data?.message || apiError.message
        };
      }
    }
  }

  /**
   * List issues in a repository
   */
  async listIssues(owner: string, repo: string, options: any = {}): Promise<GitHubCommandResult> {
    await this.initialize();

    if (!this.githubToken) {
      return {
        success: false,
        message: "GitHub client not initialized",
        error: new Error("GitHub client not initialized")
      };
    }

    try {
      // Try to use the MCP server if available
      return await this.runServerCommand('list_issues', {
        owner,
        repo,
        ...options
      });
    } catch (error) {
      console.error('Failed to use GitHub MCP server for listIssues, falling back to direct API call:', error);
      
      // Fallback to direct API call
      try {
        const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/issues`, {
          headers: {
            'Authorization': `token ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          },
          params: options
        });

        return {
          success: true,
          data: {
            issues: response.data
          }
        };
      } catch (apiError: any) {
        return {
          success: false,
          message: 'Failed to list issues',
          error: apiError.response?.data?.message || apiError.message
        };
      }
    }
  }

  /**
   * Create a branch in a repository
   */
  async createBranch(owner: string, repo: string, branch: string, fromBranch: string): Promise<GitHubCommandResult> {
    await this.initialize();

    if (!this.githubToken) {
      return {
        success: false,
        message: "GitHub client not initialized",
        error: new Error("GitHub client not initialized")
      };
    }

    try {
      // Try to use the MCP server if available
      return await this.runServerCommand('create_branch', {
        owner,
        repo,
        branch,
        from_branch: fromBranch
      });
    } catch (error) {
      console.error('Failed to use GitHub MCP server for createBranch:', error);
      return {
        success: false,
        message: 'Failed to create branch, and direct API fallback is not implemented for this operation',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Search code in GitHub repositories
   */
  async searchCode(options: { query: string, page?: number, perPage?: number }): Promise<GitHubCommandResult> {
    await this.initialize();

    if (!this.githubToken) {
      return {
        success: false,
        message: "GitHub client not initialized",
        error: new Error("GitHub client not initialized")
      };
    }

    try {
      // Try to use the MCP server if available
      return await this.runServerCommand('search_code', options);
    } catch (error) {
      console.error('Failed to use GitHub MCP server for searchCode, falling back to direct API call:', error);
      
      // Fallback to direct API call
      try {
        const response = await axios.get('https://api.github.com/search/code', {
          headers: {
            'Authorization': `token ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          },
          params: {
            q: options.query,
            page: options.page || 1,
            per_page: options.perPage || 10
          }
        });

        return {
          success: true,
          data: {
            searchResults: response.data.items,
            hasNextPage: options.page ? (options.page * (options.perPage || 10) < response.data.total_count) : (response.data.total_count > 10),
            nextCursor: options.page ? (options.page * (options.perPage || 10) < response.data.total_count ? (options.page + 1).toString() : undefined) : (response.data.total_count > 10 ? '2' : undefined)
          }
        };
      } catch (apiError: any) {
        return {
          success: false,
          message: 'Failed to search code',
          error: apiError.response?.data?.message || apiError.message
        };
      }
    }
  }

  /**
   * Process a GitHub MCP command
   */
  async processCommand(command: string, parameters: any = {}): Promise<GitHubCommandResult> {
    try {
      // Normalize the command
      const normalizedCommand = command.toLowerCase().trim();

      // Process based on command
      switch (normalizedCommand) {
        case 'get_repository':
          return await this.getRepository(parameters.owner, parameters.repo);
          
        case 'search_repositories':
          return await this.searchRepositories(parameters.query, parameters.page, parameters.perPage);
          
        case 'create_repository':
          return await this.createRepository(parameters);
          
        case 'get_file_contents':
          return await this.getFileContents(parameters.owner, parameters.repo, parameters.path, parameters.branch);
          
        case 'create_or_update_file':
          return await this.createOrUpdateFile(
            parameters.owner,
            parameters.repo,
            parameters.path,
            parameters.content,
            parameters.message,
            parameters.branch,
            parameters.sha
          );
          
        case 'push_files':
          return await this.pushFiles(
            parameters.owner,
            parameters.repo,
            parameters.branch,
            parameters.files,
            parameters.message
          );
          
        case 'create_issue':
          return await this.createIssue(
            parameters.owner,
            parameters.repo,
            parameters.options || { title: parameters.title, body: parameters.body, labels: parameters.labels, assignees: parameters.assignees }
          );
          
        case 'create_pull_request':
          return await this.createPullRequest(parameters);
          
        case 'list_issues':
          return await this.listIssues(parameters.owner, parameters.repo, parameters.options);
          
        case 'create_branch':
          return await this.createBranch(parameters.owner, parameters.repo, parameters.branch, parameters.fromBranch);
          
        case 'search_code':
          return await this.searchCode(parameters);
          
        default:
          // For any other command, try to use the MCP server directly
          try {
            // Convert camelCase to snake_case for the tool name
            const toolName = normalizedCommand.replace(/([A-Z])/g, '_$1').toLowerCase();
            return await this.runServerCommand(toolName, parameters);
          } catch (error) {
            return {
              success: false,
              message: `Unsupported command: ${command}`,
              error: error instanceof Error ? error.message : String(error)
            };
          }
      }
    } catch (error) {
      console.error(`Error processing GitHub command '${command}':`, error);
      return {
        success: false,
        message: `Failed to process command: ${command}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
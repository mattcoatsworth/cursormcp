/**
 * GitHub MCP client adapter
 * Provides a simplified interface for interacting with the GitHub MCP client
 */

import { GitHubMcpClient } from "./githubMcp";
import { githubMcpClient } from "./fixedMcpClients";

/**
 * Ensure the GitHub client is initialized
 */
async function ensureClient(): Promise<GitHubMcpClient> {
  await githubMcpClient.initialize();
  return githubMcpClient;
}

/**
 * Execute a GitHub MCP command
 */
export async function executeGitHubCommand(command: string, parameters: any = {}) {
  const client = await ensureClient();
  return await client.processCommand(command, parameters);
}

/**
 * Get repository information
 */
export async function getRepository(owner: string, repo: string) {
  const client = await ensureClient();
  return await client.getRepository(owner, repo);
}

/**
 * Search GitHub repositories
 */
export async function searchRepositories(query: string, page: number = 1, perPage: number = 10) {
  const client = await ensureClient();
  return await client.searchRepositories(query, page, perPage);
}

/**
 * Create a new repository
 */
export async function createRepository(options: any) {
  const client = await ensureClient();
  return await client.createRepository(options);
}

/**
 * Get file contents from a repository
 */
export async function getFileContents(owner: string, repo: string, path: string, branch?: string) {
  const client = await ensureClient();
  return await client.getFileContents(owner, repo, path, branch);
}

/**
 * Create or update a file in a repository
 */
export async function createOrUpdateFile(
  owner: string, 
  repo: string, 
  path: string, 
  content: string, 
  message: string, 
  branch?: string, 
  sha?: string
) {
  const client = await ensureClient();
  return await client.createOrUpdateFile(owner, repo, path, content, message, branch, sha);
}

/**
 * Push multiple files to a repository
 */
export async function pushFiles(
  owner: string,
  repo: string,
  branch: string,
  files: Array<{ path: string, content: string }>,
  message: string
) {
  const client = await ensureClient();
  return await client.pushFiles(owner, repo, branch, files, message);
}

/**
 * Create an issue in a repository
 */
export async function createIssue(
  owner: string, 
  repo: string, 
  title: string, 
  body?: string, 
  labels?: string[], 
  assignees?: string[]
) {
  const client = await ensureClient();
  return await client.createIssue(owner, repo, {
    title,
    body,
    labels,
    assignees
  });
}

/**
 * Create a pull request
 */
export async function createPullRequest(options: { 
  owner: string, 
  repo: string, 
  title: string, 
  body?: string, 
  head: string, 
  base: string, 
  draft?: boolean 
}) {
  const client = await ensureClient();
  return await client.createPullRequest(options);
}

/**
 * List issues in a repository
 */
export async function listIssues(
  owner: string, 
  repo: string, 
  options: any = {}
) {
  const client = await ensureClient();
  return await client.listIssues(owner, repo, options);
}

/**
 * Create a branch in a repository
 */
export async function createBranch(
  owner: string, 
  repo: string, 
  branch: string, 
  fromBranch: string = "main"
) {
  const client = await ensureClient();
  return await client.createBranch(owner, repo, branch, fromBranch);
}

/**
 * Search code in GitHub repositories
 */
export async function searchCode(options: { 
  query: string, 
  page?: number, 
  perPage?: number 
}) {
  const client = await ensureClient();
  return await client.searchCode(options);
}
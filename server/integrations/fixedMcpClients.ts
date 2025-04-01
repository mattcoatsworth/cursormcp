/**
 * This file fixes type import issues by providing properly initialized clients
 * for all MCP services.
 * It exports singleton instances of each client for use throughout the application.
 */

import { TripleWhaleMcpClient } from './tripleWhaleMcp';
import { PostscriptMcpClient } from './postscriptMcp';
import { NorthbeamMcpClient } from './northbeamMcp';
import { GorgiasMcpClient } from './gorgiasMcp';
import { RecharmMcpClient } from './recharmMcp';
import { PrescientAiMcpClient } from './prescientAiMcp';
import { ElevarMcpClient } from './elevarMcp';
import { GitHubMcpClient } from './githubMcp';
import { GoogleCalendarMcpClient } from './googleCalendarMcp';
import { AsanaMcpClient } from './asanaMcp';
import { GDriveMcpClient } from './gdriveMcp';
import { FigmaMcpClient } from './figmaMcp';

// Export singleton instances of each MCP client
export const tripleWhaleMcpClient = new TripleWhaleMcpClient();
export const postscriptMcpClient = new PostscriptMcpClient();
export const northbeamMcpClient = new NorthbeamMcpClient();
export const gorgiasMcpClient = new GorgiasMcpClient();
export const recharmMcpClient = new RecharmMcpClient();
export const prescientAiMcpClient = new PrescientAiMcpClient();
export const elevarMcpClient = new ElevarMcpClient();
export const githubMcpClient = new GitHubMcpClient();
export const googleCalendarMcpClient = new GoogleCalendarMcpClient();
export const asanaMcpClient = new AsanaMcpClient();
export const gdriveMcpClient = new GDriveMcpClient();
export const figmaMcpClient = new FigmaMcpClient();
/**
 * MCSManager MCP Server - STDIO Transport
 * Provides Model Context Protocol access via standard input/output streams
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { MCPClient as MCSManagerClient } from "./api-client.js";
import { handleToolCall, TOOL_DEFINITIONS } from "./tools.js";

// Get API key from environment variable
const apiKey = process.env.MCSM_API_KEY;
if (!apiKey) {
  console.error("Error: MCSM_API_KEY environment variable is required");
  process.exit(1);
}

// Get API URL from environment or use default
const apiUrl = process.env.MCSM_API_URL || "http://localhost:23333";

// Initialize MCSManager client
const mcsmClient = new MCSManagerClient({
  apiUrl,
  apiKey,
});

// Create MCP server instance
const server = new Server(
  {
    name: "@mcsmanager/mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Set up tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOL_DEFINITIONS,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  return handleToolCall(request, mcsmClient);
});

// Create STDIO transport
const transport = new StdioServerTransport();

// Connect server to transport
server.connect(transport).catch((error) => {
  console.error("MCP Server error:", error);
  process.exit(1);
});

console.log("MCSManager MCP Server (STDIO) started");
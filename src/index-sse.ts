/**
 * MCSManager MCP Server - SSE Transport
 * Provides Model Context Protocol access via Server-Sent Events
 */

import express from "express";
import cors from "cors";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { MCPClient as MCSManagerClient } from "./api-client.js";
import { handleToolCall, TOOL_DEFINITIONS } from "./tools.js";

const PORT = process.env.PORT || 3009;

// Create Express app
const app = express();
app.use(cors({
  origin: '*', // 允许所有来源，生产环境应限制
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'Cache-Control',
    'mcsm-api-key',
    'mcsm_api_key',
    'mcsm-api-url',
    'mcsm_api_url',
    'X-Requested-With'
  ],
  exposedHeaders: ['Content-Type'],
  credentials: false
}));

app.use(express.json({ limit: '10mb' }));

// 添加 MCP 特定的响应头中间件
app.use((req, res, next) => {
  // 设置所有响应的通用头
  res.setHeader('X-Powered-By', '@mcsmanager/mcp-server');
  res.setHeader('X-MCP-Version', '2024-11-05');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "mcsmanager-mcp-server" });
});

// MCP endpoint - 兼容 Inspector GET (SSE) 与 POST (HTTP JSON-RPC)
// 支持 /mcp/:apiKey 路径参数传递
app.all(["/mcp/:apiKey", "/mcp"], async (req, res) => {
  
  const reqIp = req.ip || req.connection?.remoteAddress || "unknown";
  console.log(`\n[MCP] Incoming ${req.method} request from ${reqIp}`);
  console.log(`[MCP] Request Headers:`, req.headers);
  console.log(`[MCP] Request Query:`, req.query);
  console.log(`[MCP] Request Params:`, req.params);
  console.log(`[MCP] Request URL:`, req.url);
  if (req.method === "POST") {
    console.log(`[MCP] Request Body:`, JSON.stringify(req.body, null, 2));
  }
  
  // 路径参数 -> query -> header -> ENV，依次取 apiKey、apiUrl
  const params = req.params || {};
  const query = req.query || {};
  console.log(`[MCP] Raw params:`, params);
  console.log(`[MCP] Raw query:`, query);
  const apiKeyFromParams = params['apiKey'] || params['apikey'] || params['APIKEY'] || params[0];
  const apiKeyFromQuery = query['mcsm-api-key'] || query['mcsm_api_key'] || query['MCSM_API_KEY'];
  const apiUrlFromParams = params['apiUrl'] || params['api_url'] || params['APIURL'];
  const apiUrlFromQuery = query['mcsm-api-url'] || query['mcsm_api_url'] || query['MCSM_API_URL'];
  
  let apiKey = apiKeyFromParams || apiKeyFromQuery || req.headers["mcsm-api-key"] || req.headers["mcsm_api_key"] || req.headers["authorization"];
  const isLocal = reqIp === '::1' || reqIp === '127.0.0.1' || reqIp === '::ffff:127.0.0.1';
  if (!apiKey && isLocal) {
    apiKey = "YOUR_TEST_KEY_HERE";
  }
  
  // apiUrl 取顺序同理
  let apiUrl: string | undefined;
  if (typeof apiUrlFromParams === "string") {
    apiUrl = apiUrlFromParams;
  } else if (typeof apiUrlFromQuery === "string") {
    apiUrl = apiUrlFromQuery;
  } else if (Array.isArray(apiUrlFromQuery) && typeof apiUrlFromQuery[0] === "string") {
    apiUrl = apiUrlFromQuery[0];
  } else {
    apiUrl = process.env.MCSM_API_URL || "http://localhost:23333";
  }
  
  let apiKeyValue: string | undefined;
  if (typeof apiKey === "string") {
    apiKeyValue = apiKey;
  } else if (Array.isArray(apiKey) && typeof apiKey[0] === "string") {
    apiKeyValue = apiKey[0];
  } else {
    apiKeyValue = undefined;
  }
  
  console.log(`[MCP] Extracted API Key: ${apiKeyValue ? `${apiKeyValue.substring(0, 8)}***` : 'none'}`);
  console.log(`[MCP] Extracted API URL: ${apiUrl}`);

  // Initialize MCSManager client for this connection
  const mcsmClient = new MCSManagerClient({ 
    apiUrl, 
    apiKey: apiKeyValue 
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
    console.log(`[MCP] Tools list requested from ${reqIp}`);
    return {
      tools: TOOL_DEFINITIONS,
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    console.log(`[MCP] Tool call requested from ${reqIp}: ${request.params.name}`);
    return handleToolCall(request, mcsmClient);
  });

  if (req.method === "GET") {
    // SSE endpoint for streaming responses
    console.log(`[MCP] Establishing SSE connection from ${reqIp}`);
    const transport = new SSEServerTransport("/mcp", res);
    
    try {
      await server.connect(transport);
      console.log(`[MCP] SSE connection established successfully from ${reqIp}`);
    } catch (error) {
      console.error(`[MCP] Failed to connect server to SSE transport:`, error);
      if (!res.headersSent) {
        res.status(500).json({ 
          jsonrpc: "2.0", 
          error: { code: -32603, message: "SSE connection failed" }
        });
      }
    }
    
    // Clean up when connection closes
    req.on("close", () => {
      console.log(`[MCP] SSE connection closed for ${reqIp}`);
    });
    
    req.on("error", (err) => {
      console.error(`[MCP] SSE connection error for ${reqIp}:`, err);
    });
    
    return;
  }
  
  if (req.method === "POST") {
    // POST endpoint for receiving MCP requests
    const msg = req.body;
    const requestId = msg.id || 'unknown';
    console.log(`[MCP][${requestId}] Processing ${msg.method} request from ${reqIp}`);
    
    try {
      if (!msg.method) {
        throw new Error('Missing method in request');
      }

      if (msg.method === "initialize") {
        // Use client's requested protocol version
        const clientProtocolVersion = msg.params?.protocolVersion || "2024-11-05";
        const resp = {
          jsonrpc: "2.0",
          id: msg.id,
          result: {
            protocolVersion: clientProtocolVersion,
            capabilities: {
              tools: { listChanged: true }
            },
            serverInfo: {
              name: "@mcsmanager/mcp-server",
              version: "1.0.0"
            }
          }
        };
        console.log(`[MCP][${requestId}] Responding to initialize with protocol ${clientProtocolVersion}: Success`);
        res.json(resp);
        return;
      }
      
      if (msg.method === "tools/list") {
        const resp = {
          jsonrpc: "2.0",
          id: msg.id,
          result: {
            tools: TOOL_DEFINITIONS
          }
        };
        console.log(`[MCP][${requestId}] Responding to tools/list: ${TOOL_DEFINITIONS.length} tools`);
        res.json(resp);
        return;
      }
      
      if (msg.method === "tools/call") {
        console.log(`[MCP][${requestId}] Tool call: ${msg.params?.name || 'unknown'}`);
        const callResult = await handleToolCall(msg, mcsmClient);
        const resp = { jsonrpc: "2.0", id: msg.id, result: callResult };
        console.log(`[MCP][${requestId}] Tool call completed successfully`);
        res.json(resp);
        return;
      }
      
      // For other methods, return empty result
      console.log(`[MCP][${requestId}] Unknown method: ${msg.method}, returning empty result`);
      const resp = { jsonrpc: "2.0", id: msg.id, result: {} };
      res.json(resp);
    } catch (error) {
      console.error(`[MCP][${requestId}] Error processing request from ${reqIp}:`, error);
      res.status(500).json({
        jsonrpc: "2.0",
        id: msg.id || null,
        error: {
          code: -32603,
          message: error.message || "Internal server error"
        }
      });
    }
    
    return;
  }
  
  // For other methods, return an error
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32601,
      message: "Method Not Allowed",
      data: `Only GET (SSE) and POST (JSON-RPC) methods are supported`
    }
  });
});

// Start server - listen on all interfaces (0.0.0.0) to support external connections
app.listen(PORT, '0.0.0.0', () => {
  console.log(`MCSManager MCP Server (SSE) listening on port ${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/mcp (GET)`);
  console.log(`Request endpoint: http://localhost:${PORT}/mcp (POST)`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
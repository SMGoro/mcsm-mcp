/**
 * MCSManager MCP Server - HTTP/SSE Transport
 * Provides Model Context Protocol access via HTTP Server-Sent Events
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

const PORT = parseInt(process.env.PORT || '3009', 10);

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
  if (req.method === "POST") {
    console.log(`[MCP] Request Body:`, JSON.stringify(req.body, null, 2));
  }
  
  // 路径参数 -> query -> header -> ENV，依次取 apiKey、apiUrl
  const params = req.params || {};
  const query = req.query || {};
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

  
  console.log(`[MCP] Extracted API Key: ${apiKeyValue ? `${apiKeyValue.substring(0, 8)}***` : 'none'}`);
  console.log(`[MCP] Extracted API URL: ${apiUrl}`);
  // 初始化 MCSManager client
  const mcsmClient = new MCSManagerClient({ apiUrl, apiKey: apiKeyValue });

  // 标准 MCP server 实现
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
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOL_DEFINITIONS }));
  server.setRequestHandler(CallToolRequestSchema, async (request) => handleToolCall(request, mcsmClient));

  if (req.method === "GET") {
    // 不能手动写响应头或流，让SSEServerTransport全权处理！
    console.log(`[MCP] Establishing SSE connection from ${reqIp}`);
    const transport = new SSEServerTransport("/mcp", res);
    try {
      await server.connect(transport);
      console.log(`[MCP] SSE connection established successfully from ${reqIp}`);
    } catch (e) {
      console.error('[MCP] SSE server.connect error:', e);
      if (!res.headersSent) {
        res.status(500).json({ 
          jsonrpc: "2.0", 
          error: { code: -32603, message: "SSE connection failed" }
        });
      }
    }
    req.on('close', () => { 
      console.log(`[MCP] SSE connection closed from ${reqIp}`); 
      try { res.end(); } catch(e) {} 
    });
    req.on('error', (err) => { 
      console.error('[MCP] SSE connection error:', err.message || err); 
      try { res.end(); } catch(e) {} 
    });
    return;
  }
  if (req.method === "POST") {
    const msg = req.body;
    const handle = async (message) => {
      const requestId = message.id || 'unknown';
      console.log(`[MCP][${requestId}] Processing ${message.method} request from ${reqIp}`);
      
      try {
        if (!message.method) {
          throw new Error('Missing method in request');
        }

        if (message.method === "initialize") {
          // 使用客户端请求的协议版本，保持兼容性
          const clientProtocolVersion = message.params?.protocolVersion || "2024-11-05";
          const resp = {
            jsonrpc: "2.0",
            id: message.id,
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
        
        if (message.method === "tools/list") {
          const resp = {
            jsonrpc: "2.0",
            id: message.id,
            result: {
              tools: TOOL_DEFINITIONS
            }
          };
          console.log(`[MCP][${requestId}] Responding to tools/list: ${TOOL_DEFINITIONS.length} tools`);
          res.json(resp);
          return;
        }
        
        if (message.method === "tools/call") {
          console.log(`[MCP][${requestId}] Tool call: ${message.params?.name || 'unknown'}`);
          const callResult = await handleToolCall(message, mcsmClient);
          const resp = { jsonrpc: "2.0", id: message.id, result: callResult };
          console.log(`[MCP][${requestId}] Tool call completed successfully`);
          res.json(resp);
          return;
        }
        
        // 兼容 output/initialized 和其它未知方法
        console.log(`[MCP][${requestId}] Unknown method: ${message.method}, returning empty result`);
        const resp = { jsonrpc: "2.0", id: message.id, result: {} };
        res.json(resp);
      } catch(err) {
        console.error(`[MCP][${requestId}] Error handling ${message.method}:`, {
          message: err.message,
          stack: err.stack,
          request: message
        });
        
        const errorResp = {
          jsonrpc: "2.0",
          id: message.id,
          error: {
            code: -32603, // Internal error
            message: err.message || 'Internal server error',
            data: process.env.NODE_ENV === 'development' ? err.stack : undefined
          }
        };
        res.status(500).json(errorResp);
      }
    };
    handle(msg);
    return;
  }
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
  console.log(`MCSManager MCP Server (HTTP/SSE) listening on port ${PORT}`);
  console.log(`Local endpoint: http://localhost:${PORT}/mcp`);
  console.log(`Network endpoint: http://0.0.0.0:${PORT}/mcp`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
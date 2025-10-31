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

const PORT = process.env.PORT || 3009;

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization,csrf-token,X-Captcha-Token,X-Device-Id,X-Guid,X-Project-Id,X-Client-Id,X-Session-Id,X-Peer-Id,X-User-Id,X-Request-From,user-id,session-id,account-id,peer-id,version-code,guid,credit-key,mcsm-api-key,mcsm_api_key,mcsm-api-url,mcsm_api_url,*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Expose-Headers', 'csrf-token');
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
    const transport = new SSEServerTransport("/mcp", res);
    try {
      await server.connect(transport);
    } catch (e) {
      console.error('[MCP] SSE server.connect error:', e);
    }
    req.on('close', () => { try { res.end(); } catch(e) {} });
    req.on('error', (err) => { console.error('[MCP] SSE connection error:', err); try { res.end(); } catch(e) {} });
    return;
  }
  if (req.method === "POST") {
    const msg = req.body;
    const handle = async (message) => {
      try {
        if (message.method === "initialize") {
          const resp = {
            jsonrpc: "2.0",
            id: message.id,
            result: {
              protocolVersion: "2025-06-18", // 2024-11-05
              capabilities: {
                tools: { listChanged: true }
              },
              serverInfo: {
                name: "@mcsmanager/mcp-server",
                version: "1.0.0"
              }
            }
          };
          console.log(`[MCP] Responding to initialize from ${reqIp}:`, JSON.stringify(resp, null, 2));
          res.json(resp);
          return;
        }
        if (message.method === "tools/list") {
          const resp = {
            jsonrpc: "2.0",
            id: message.id,
            result: {
              protocolVersion: "2024-11-05",
              capabilities: {
                tools: { listChanged: true }
              },
              serverInfo: {
                name: "@mcsmanager/mcp-server",
                version: "1.0.0"
              },
              tools: TOOL_DEFINITIONS
            }
          };
          console.log(`[MCP] Responding to tools/list from ${reqIp}:`, JSON.stringify(resp, null, 2));
          res.json(resp);
          return;
        }
        if (message.method === "tools/call") {
          const callResult = await handleToolCall(message, mcsmClient);
          const resp = { jsonrpc: "2.0", id: message.id, result: callResult };
          console.log(`[MCP] Responding to tools/call from ${reqIp}:`, JSON.stringify(resp, null, 2));
          res.json(resp);
          return;
        }
        // 兼容 output/initialized 和其它
        const resp = { jsonrpc: "2.0", id: message.id, result: {} };
        console.log(`[MCP] Responding to ${message.method || 'unknown'} from ${reqIp}:`, JSON.stringify(resp, null, 2));
        res.json(resp);
      } catch(err) {
        console.error(`[MCP] Error while handling ${req.method} from ${reqIp}:`, err);
        res.status(500).json({ error: 'Internal server error', detail: err.message });
      }
    };
    handle(msg);
    return;
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, mcsm-api-key, mcsm_api_key, *');
  res.status(405).json({ error: "Method Not Allowed" });
});

// Start server
app.listen(PORT, () => {
  console.log(`MCSManager MCP Server (HTTP/SSE) listening on port ${PORT}`);
  console.log(`MCP SSE endpoint: http://localhost:${PORT}/mcp`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
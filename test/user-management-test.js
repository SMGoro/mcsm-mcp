#!/usr/bin/env node

/**
 * User Management Test for MCSManager MCP Server
 * Tests the user management tools added to the MCP server
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes
const colors = {
  reset: '[0m',
  green: '[32m',
  red: '[31m',
  yellow: '[33m',
  blue: '[34m',
  cyan: '[36m',
};

class UserManagementTester {
  constructor(config) {
    this.config = config;
    this.sseConnection = null;
    this.messageBuffer = '';
    this.pendingRequests = new Map();
    this.requestId = 0;
  }

  log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
  }

  async connectSSE() {
    this.log('\n\ud83d\udd1b Connecting to SSE endpoint...', colors.cyan);
    
    return new Promise((resolve, reject) => {
      const req = http.get(
        {
          hostname: 'localhost',
          port: this.config.port,
          path: '/mcp',
          headers: {
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Authorization': this.config.apiKey,
          },
        },
        (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`SSE connection failed with status ${res.statusCode}`));
            return;
          }

          this.log('✅ SSE connection established', colors.green);
          this.sseConnection = res;

          res.on('data', (chunk) => {
            this.handleSSEData(chunk.toString());
          });

          res.on('end', () => {
            this.log('SSE connection ended', colors.yellow);
          });

          res.on('error', (error) => {
            this.log(`SSE error: ${error.message}`, colors.red);
          });

          // Give connection time to stabilize
          setTimeout(() => resolve(), 1000);
        }
      );

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('SSE connection timeout'));
      });
    });
  }

  handleSSEData(data) {
    this.messageBuffer += data;
    
    // Process complete messages
    const lines = this.messageBuffer.split('\n');
    this.messageBuffer = lines.pop() || ''; // Keep incomplete line in buffer

    let currentEvent = null;
    let currentData = '';

    for (const line of lines) {
      if (line.startsWith('event:')) {
        currentEvent = line.substring(6).trim();
      } else if (line.startsWith('data:')) {
        currentData += line.substring(5).trim();
      } else if (line === '') {
        // Empty line indicates end of message
        if (currentEvent && currentData) {
          this.handleSSEMessage(currentEvent, currentData);
          currentEvent = null;
          currentData = '';
        }
      }
    }
  }

  handleSSEMessage(event, data) {
    try {
      const message = JSON.parse(data);
      
      if (event === 'message' && message.jsonrpc === '2.0') {
        if (message.id && this.pendingRequests.has(message.id)) {
          const pending = this.pendingRequests.get(message.id);
          this.pendingRequests.delete(message.id);

          if (message.error) {
            this.log(`\n❌ Error response #${message.id}:`, colors.red);
            this.log(`   ${JSON.stringify(message.error, null, 2)}`, colors.red);
            pending.reject(new Error(message.error.message || 'Unknown error'));
          } else {
            this.log(`\n✅ Success response #${message.id}`, colors.green);
            pending.resolve(message.result);
          }
        }
      }
    } catch (error) {
      this.log(`Failed to parse SSE message: ${error.message}`, colors.red);
    }
  }

  async sendRequest(method, params = {}) {
    if (!this.sseConnection) {
      throw new Error('SSE connection not established');
    }

    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      this.pendingRequests.set(id, { resolve, reject, method });
      
      this.log(`\n📤 Sending request #${id}: ${method}`, colors.cyan);
      this.log(`   Params: ${JSON.stringify(params, null, 2)}`, colors.blue);

      // Send via POST to MCP endpoint
      const postData = JSON.stringify(request);
      const postReq = http.request(
        {
          hostname: 'localhost',
          port: this.config.port,
          path: '/mcp',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'Authorization': this.config.apiKey,
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            // Response comes via SSE, not HTTP response
          });
        }
      );

      postReq.on('error', (error) => {
        this.pendingRequests.delete(id);
        reject(error);
      });

      postReq.write(postData);
      postReq.end();

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${method}`));
        }
      }, 30000);
    });
  }

  async testUserManagementTools() {
    this.log('\n' + '='.repeat(60), colors.cyan);
    this.log('📋 Testing User Management Tools', colors.cyan);
    this.log('='.repeat(60), colors.cyan);

    try {
      // Test list users
      await this.testListUsers();
      
      this.log('\n✅ All user management tests completed', colors.green);
    } catch (error) {
      this.log(`\n❌ User management tests failed: ${error.message}`, colors.red);
      throw error;
    }
  }

  async testListUsers() {
    this.log('\n📋 Testing list_users tool...', colors.cyan);
    
    try {
      const result = await this.sendRequest('tools/call', {
        name: 'list_users',
        arguments: {
          page: 1,
          pageSize: 10,
        },
      });
      
      if (!result.content || !Array.isArray(result.content)) {
        throw new Error('Invalid response format');
      }
      
      const data = JSON.parse(result.content[0].text);
      this.log(`   Found ${data.data?.length || 0} users`, colors.green);
      return data;
    } catch (error) {
      this.log(`   Error: ${error.message}`, colors.red);
      throw error;
    }
  }

  async close() {
    if (this.sseConnection) {
      this.sseConnection.destroy();
    }
  }
}

async function runTests() {
  const config = {
    apiUrl: process.env.MCSM_API_URL || 'http://localhost:23333',
    apiKey: process.env.MCSM_API_KEY || 'd3f467e1aaed4481b6e83043dbc4bbab',
    port: process.env.TEST_PORT || '3009',
  };

  console.log('🧪 MCSManager MCP Server - User Management Test');
  console.log('===============================================');
  console.log(`API URL: ${config.apiUrl}`);
  console.log(`API Key: ${config.apiKey.substring(0, 8)}***`);
  console.log(`Port: ${config.port}`);

  const tester = new UserManagementTester(config);

  try {
    // Connect SSE
    await tester.connectSSE();

    // Test user management tools
    await tester.testUserManagementTools();

    // Close connection
    await tester.close();

    console.log('\n🎉 All tests completed successfully!');
    process.exit(0);

  } catch (error) {
    tester.log(`\n💥 Fatal error: ${error.message}`, colors.red);
    await tester.close();
    process.exit(1);
  }
}

runTests();
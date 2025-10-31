#!/usr/bin/env node

/**
 * STDIO Test Script for MCSManager MCP Server
 * Tests basic functionality in STDIO mode (local calling)
 */

import { spawn } from 'child_process';
import { join } from 'path';

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

class StdioTester {
  constructor(config) {
    this.config = config;
    this.server = null;
    this.requestId = 0;
    this.testResults = [];
  }

  log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
  }

  async startServer() {
    this.log('\n🚀 Starting MCP Server (stdio mode)...', colors.cyan);
    
    return new Promise((resolve, reject) => {
      this.server = spawn('node', [this.config.serverPath], {
        env: {
          ...process.env,
          MCSM_API_URL: this.config.apiUrl,
          MCSM_API_KEY: this.config.apiKey,
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.server.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(line => line.trim());
        for (const line of lines) {
          try {
            const response = JSON.parse(line);
            this.handleResponse(response);
          } catch (e) {
            // Ignore non-JSON output
            if (line.includes('MCSManager MCP Server (STDIO) started')) {
              this.log('✅ Server started successfully', colors.green);
              resolve();
            }
          }
        }
      });

      this.server.stderr.on('data', (data) => {
        this.log(`[stderr] ${data.toString().trim()}`, colors.yellow);
      });

      this.server.on('error', (error) => {
        this.log(`Server error: ${error.message}`, colors.red);
        reject(error);
      });

      // Timeout if server doesn't start
      setTimeout(() => {
        reject(new Error('Server failed to start within timeout'));
      }, 5000);
    });
  }

  sendRequest(method, params = {}, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      this.pendingRequests = this.pendingRequests || new Map();
      this.pendingRequests.set(id, { resolve, reject, method });
      
      const requestStr = JSON.stringify(request) + '\n';
      this.server.stdin.write(requestStr);
      
      this.log(`\n📤 Sent request #${id}: ${method}`, colors.cyan);
      this.log(`   Params: ${JSON.stringify(params, null, 2)}`, colors.blue);

      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${method}`));
        }
      }, timeout);
    });
  }

  handleResponse(response) {
    if (!response.id) return;

    const pending = this.pendingRequests.get(response.id);
    if (!pending) return;

    this.pendingRequests.delete(response.id);

    if (response.error) {
      this.log(`\n❌ Error response #${response.id}:`, colors.red);
      this.log(`   ${JSON.stringify(response.error, null, 2)}`, colors.red);
      pending.reject(new Error(response.error.message || 'Unknown error'));
    } else {
      this.log(`\n✅ Success response #${response.id}`, colors.green);
      pending.resolve(response.result);
    }
  }

  async runTest(name, testFn) {
    const startTime = Date.now();
    this.log(`\n============================================================`, colors.cyan);
    this.log(`📋 Test: ${name}`, colors.cyan);
    this.log(`============================================================`, colors.cyan);

    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name,
        status: 'passed',
        duration,
        error: null,
      });

      this.log(`\n✅ Test PASSED (${duration}ms)`, colors.green);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name,
        status: 'failed',
        duration,
        error: error.message,
      });

      this.log(`\n❌ Test FAILED (${duration}ms)`, colors.red);
      this.log(`   Error: ${error.message}`, colors.red);
      throw error;
    }
  }

  async stopServer() {
    if (this.server) {
      this.server.kill();
      this.server = null;
    }
  }

  printSummary() {
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.status === 'passed').length;
    const failed = this.testResults.filter(r => r.status === 'failed').length;

    this.log(`\n============================================================`, colors.cyan);
    this.log(`📊 TEST SUMMARY`, colors.cyan);
    this.log(`============================================================`, colors.cyan);
    this.log(`\nTotal Tests: ${total}`, colors.cyan);
    this.log(`Passed: ${passed}`, colors.green);
    this.log(`Failed: ${failed}`, failed > 0 ? colors.red : colors.green);

    this.log('\nDetailed Results:', colors.cyan);
    this.testResults.forEach((result, index) => {
      const status = result.status === 'passed' ? '✅' : '❌';
      const color = result.status === 'passed' ? colors.green : colors.red;
      this.log(`  ${index + 1}. ${status} ${result.name} (${result.duration}ms)`, color);
      if (result.error) {
        this.log(`     Error: ${result.error}`, colors.red);
      }
    });

    return { passed, failed, total };
  }
}

async function runStdioTests() {
  const config = {
    apiUrl: process.env.MCSM_API_URL || 'http://localhost:23333',
    apiKey: process.env.MCSM_API_KEY,
    serverPath: join(process.cwd(), 'dist', 'index-stdio.js'),
  };

  if (!config.apiKey) {
    console.error('❌ Error: MCSM_API_KEY environment variable is required');
    console.error('Usage: MCSM_API_KEY=your_key npm run test:stdio');
    process.exit(1);
  }

  console.log('🧪 MCSManager MCP Server - STDIO Mode Test');
  console.log('===========================================');
  console.log(`API URL: ${config.apiUrl}`);
  console.log(`API Key: ${config.apiKey.substring(0, 8)}***`);
  console.log(`Server: ${config.serverPath}`);

  const tester = new StdioTester(config);

  try {
    // Start server
    await tester.startServer();

    // Test 1: Initialize - List Tools
    await tester.runTest('Initialize: List Available Tools', async () => {
      const result = await tester.sendRequest('tools/list');
      if (!result.tools || !Array.isArray(result.tools)) {
        throw new Error('Invalid tools list response');
      }
      tester.log(`   Found ${result.tools.length} tools`, colors.green);
      return result;
    });

    // Test 2: List Nodes
    await tester.runTest('List Daemon Nodes', async () => {
      const result = await tester.sendRequest('tools/call', {
        name: 'list_nodes',
        arguments: {},
      });
      
      if (!result.content || !Array.isArray(result.content)) {
        throw new Error('Invalid response format');
      }
      
      const data = JSON.parse(result.content[0].text);
      tester.log(`   Found ${data.length} nodes`, colors.green);
      
      return data;
    });

    // Test 3: List Instances (if nodes available)
    const nodes = await tester.runTest('List Instances on First Node', async () => {
      const nodesResult = await tester.sendRequest('tools/call', {
        name: 'list_nodes',
        arguments: {},
      });
      const nodes = JSON.parse(nodesResult.content[0].text);
      
      if (nodes.length === 0) {
        throw new Error('No nodes available for testing');
      }

      const firstNode = nodes[0];
      tester.log(`   Using node: ${firstNode.uuid}`, colors.blue);

      // List instances on first node
      const instancesResult = await tester.sendRequest('tools/call', {
        name: 'list_instances',
        arguments: {
          daemonId: firstNode.uuid,
          page: 1,
          pageSize: 10,
        },
      });

      const instances = JSON.parse(instancesResult.content[0].text);
      tester.log(`   Found ${instances.data?.length || 0} instances`, colors.green);
      
      return { result: { instances, node: firstNode } };
    });

    // Test 4: Get Instance Info (if instances available)
    if (nodes.result.instances.data && nodes.result.instances.data.length > 0) {
      await tester.runTest('Get Instance Information', async () => {
        const instance = nodes.result.instances.data[0];
        const node = nodes.result.node;

        const result = await tester.sendRequest('tools/call', {
          name: 'get_instance_info',
          arguments: {
            daemonId: node.uuid,
            uuid: instance.instanceUuid,
          },
        });

        const info = JSON.parse(result.content[0].text);
        tester.log(`   Instance: ${info.config?.nickname || 'Unknown'}`, colors.green);
        tester.log(`   Status: ${info.status}`, colors.green);
        
        return info;
      });
    }

    // Test 5: List Files (if instances available)
    if (nodes.result.instances.data && nodes.result.instances.data.length > 0) {
      await tester.runTest('List Instance Files', async () => {
        const instance = nodes.result.instances.data[0];
        const node = nodes.result.node;

        const result = await tester.sendRequest('tools/call', {
          name: 'list_files',
          arguments: {
            daemonId: node.uuid,
            uuid: instance.instanceUuid,
            target: '.',
          },
        });

        const files = JSON.parse(result.content[0].text);
        tester.log(`   Found ${files.items?.length || 0} files/folders`, colors.green);
        
        return files;
      });
    }

    // Print summary
    const summary = tester.printSummary();

    // Stop server
    await tester.stopServer();

    // Exit with appropriate code
    process.exit(summary.failed > 0 ? 1 : 0);

  } catch (error) {
    tester.log(`\n💥 Fatal error: ${error.message}`, colors.red);
    await tester.stopServer();
    process.exit(1);
  }
}

runStdioTests();
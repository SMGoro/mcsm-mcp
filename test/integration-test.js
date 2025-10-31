#!/usr/bin/env node

/**
 * MCSManager MCP Server - Integration Test
 * Comprehensive test suite that validates all MCP tools
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

class IntegrationTester {
  constructor(config) {
    this.config = config;
    this.server = null;
    this.requestId = 0;
    this.pendingRequests = new Map();
    this.testResults = [];
    this.testData = {}; // Store data between tests
  }

  log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
  }

  async startServer() {
    this.log('\n🚀 Starting MCP Server...', colors.cyan);
    
    return new Promise((resolve, reject) => {
      this.server = spawn('node', [this.config.serverPath], {
        env: {
          ...process.env,
          MCSM_API_URL: this.config.apiUrl,
          MCSM_API_KEY: this.config.apiKey,
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let serverReady = false;

      this.server.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const response = JSON.parse(line);
            this.handleResponse(response);
          } catch (e) {
            // Not JSON
          }
        }
      });

      this.server.stderr.on('data', (data) => {
        const message = data.toString().trim();
        if (message.includes('MCSManager MCP Server running')) {
          serverReady = true;
          resolve();
        }
      });

      this.server.on('error', reject);

      setTimeout(() => {
        if (!serverReady) {
          resolve();
        }
      }, 2000);
    });
  }

  sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      this.pendingRequests.set(id, { resolve, reject, method });
      this.server.stdin.write(JSON.stringify(request) + '\n');

      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Timeout: ${method}`));
        }
      }, 30000);
    });
  }

  handleResponse(response) {
    if (!response.id) return;

    const pending = this.pendingRequests.get(response.id);
    if (!pending) return;

    this.pendingRequests.delete(response.id);

    if (response.error) {
      pending.reject(new Error(response.error.message || 'Unknown error'));
    } else {
      pending.resolve(response.result);
    }
  }

  async runTest(testName, testFn, options = {}) {
    const { category = 'General', skipIf = null } = options;
    
    if (skipIf && skipIf()) {
      this.log(`\n⏭️  Skipping: ${testName}`, colors.yellow);
      return null;
    }

    this.log(`\n${'─'.repeat(60)}`, colors.cyan);
    this.log(`📋 [${category}] ${testName}`, colors.cyan);
    this.log('─'.repeat(60), colors.cyan);

    const startTime = Date.now();

    try {
      const testResult = await testFn();
      const duration = Date.now() - startTime;
      
      const result = {
        name: testName,
        category,
        status: 'passed',
        duration,
        result: testResult,
      };

      this.log(`✅ PASSED (${duration}ms)`, colors.green);
      this.testResults.push(result);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      const result = {
        name: testName,
        category,
        status: 'failed',
        duration,
        error: error.message,
      };

      this.log(`❌ FAILED (${duration}ms): ${error.message}`, colors.red);
      this.testResults.push(result);
      return result;
    }
  }

  async stopServer() {
    if (this.server) {
      this.server.kill();
      await new Promise(resolve => {
        this.server.on('close', resolve);
        setTimeout(resolve, 1000);
      });
    }
  }

  printSummary() {
    this.log('\n' + '='.repeat(70), colors.magenta);
    this.log('📊 INTEGRATION TEST SUMMARY', colors.magenta);
    this.log('='.repeat(70), colors.magenta);

    const passed = this.testResults.filter(r => r.status === 'passed').length;
    const failed = this.testResults.filter(r => r.status === 'failed').length;
    const total = this.testResults.length;

    this.log(`\n📈 Overall Results:`, colors.cyan);
    this.log(`  Total Tests: ${total}`, colors.cyan);
    this.log(`  Passed: ${passed} ✅`, colors.green);
    this.log(`  Failed: ${failed} ❌`, failed > 0 ? colors.red : colors.green);
    this.log(`  Success Rate: ${((passed / total) * 100).toFixed(1)}%`, 
      passed === total ? colors.green : colors.yellow);

    // Group by category
    const categories = {};
    this.testResults.forEach(result => {
      if (!categories[result.category]) {
        categories[result.category] = { passed: 0, failed: 0, tests: [] };
      }
      categories[result.category].tests.push(result);
      if (result.status === 'passed') {
        categories[result.category].passed++;
      } else {
        categories[result.category].failed++;
      }
    });

    this.log('\n📂 Results by Category:', colors.cyan);
    Object.entries(categories).forEach(([category, stats]) => {
      const color = stats.failed === 0 ? colors.green : colors.yellow;
      this.log(`\n  ${category} (${stats.passed}/${stats.tests.length})`, color);
      stats.tests.forEach(test => {
        const icon = test.status === 'passed' ? '✅' : '❌';
        const testColor = test.status === 'passed' ? colors.green : colors.red;
        this.log(`    ${icon} ${test.name} (${test.duration}ms)`, testColor);
        if (test.error) {
          this.log(`       Error: ${test.error}`, colors.red);
        }
      });
    });

    return { passed, failed, total };
  }
}

async function runIntegrationTests() {
  const config = {
    apiUrl: process.env.MCSM_API_URL || 'http://localhost:23333',
    apiKey: process.env.MCSM_API_KEY,
    serverPath: join(__dirname, '..', 'dist', 'index.js'),
  };

  if (!config.apiKey) {
    console.error('❌ Error: MCSM_API_KEY environment variable is required');
    console.error('Usage: MCSM_API_KEY=your_key npm run test:integration');
    process.exit(1);
  }

  console.log('🧪 MCSManager MCP Server - Integration Test Suite');
  console.log('===================================================');
  console.log(`API URL: ${config.apiUrl}`);
  console.log(`API Key: ${config.apiKey.substring(0, 8)}***`);
  console.log(`Mode: STDIO`);

  const tester = new IntegrationTester(config);

  try {
    await tester.startServer();

    // ==================== INITIALIZATION TESTS ====================
    
    await tester.runTest('Initialize and list tools', async () => {
      const result = await tester.sendRequest('tools/list');
      if (!result.tools || !Array.isArray(result.tools)) {
        throw new Error('Invalid tools list');
      }
      tester.log(`  Found ${result.tools.length} tools`, colors.green);
      
      // Verify all expected tools are present
      const expectedTools = [
        'list_nodes', 'list_instances', 'get_instance_info', 'get_instance_log',
        'start_instance', 'stop_instance', 'restart_instance', 'kill_instance',
        'delete_instance', 'create_backup', 'list_backups', 'delete_backup',
        'restore_backup', 'list_files', 'create_folder', 'delete_files',
        'read_file', 'write_file', 'list_schedules', 'create_schedule',
        'delete_schedule'
      ];
      
      const toolNames = result.tools.map(t => t.name);
      const missing = expectedTools.filter(t => !toolNames.includes(t));
      
      if (missing.length > 0) {
        throw new Error(`Missing tools: ${missing.join(', ')}`);
      }
      
      tester.log(`  All ${expectedTools.length} expected tools present`, colors.green);
      return result;
    }, { category: 'Initialization' });

    // ==================== NODE MANAGEMENT TESTS ====================
    
    await tester.runTest('List daemon nodes', async () => {
      const result = await tester.sendRequest('tools/call', {
        name: 'list_nodes',
        arguments: {},
      });
      
      const nodes = JSON.parse(result.content[0].text);
      if (!Array.isArray(nodes)) {
        throw new Error('Invalid nodes response');
      }
      
      tester.log(`  Found ${nodes.length} nodes`, colors.green);
      tester.testData.nodes = nodes;
      
      if (nodes.length > 0) {
        tester.testData.firstNode = nodes[0];
        tester.log(`  First node: ${nodes[0].uuid}`, colors.blue);
        tester.log(`  Available: ${nodes[0].available}`, colors.blue);
      }
      
      return nodes;
    }, { category: 'Node Management' });

    // ==================== INSTANCE MANAGEMENT TESTS ====================
    
    await tester.runTest('List instances on first node', async () => {
      if (!tester.testData.firstNode) {
        throw new Error('No nodes available');
      }
      
      const result = await tester.sendRequest('tools/call', {
        name: 'list_instances',
        arguments: {
          daemonId: tester.testData.firstNode.uuid,
          page: 1,
          pageSize: 20,
        },
      });
      
      const instances = JSON.parse(result.content[0].text);
      tester.log(`  Found ${instances.data?.length || 0} instances`, colors.green);
      
      tester.testData.instances = instances.data || [];
      if (tester.testData.instances.length > 0) {
        tester.testData.firstInstance = tester.testData.instances[0];
        tester.log(`  First instance: ${tester.testData.firstInstance.instanceUuid}`, colors.blue);
      }
      
      return instances;
    }, { 
      category: 'Instance Management',
      skipIf: () => !tester.testData.firstNode
    });

    await tester.runTest('Get instance detailed information', async () => {
      if (!tester.testData.firstInstance) {
        throw new Error('No instances available');
      }
      
      const result = await tester.sendRequest('tools/call', {
        name: 'get_instance_info',
        arguments: {
          daemonId: tester.testData.firstNode.uuid,
          uuid: tester.testData.firstInstance.instanceUuid,
        },
      });
      
      const info = JSON.parse(result.content[0].text);
      tester.log(`  Instance: ${info.config?.nickname || 'Unknown'}`, colors.green);
      tester.log(`  Type: ${info.config?.type || 'Unknown'}`, colors.blue);
      tester.log(`  Status: ${info.status}`, colors.blue);
      
      return info;
    }, { 
      category: 'Instance Management',
      skipIf: () => !tester.testData.firstInstance
    });

    await tester.runTest('Get instance console log', async () => {
      if (!tester.testData.firstInstance) {
        throw new Error('No instances available');
      }
      
      const result = await tester.sendRequest('tools/call', {
        name: 'get_instance_log',
        arguments: {
          daemonId: tester.testData.firstNode.uuid,
          uuid: tester.testData.firstInstance.instanceUuid,
        },
      });
      
      const log = result.content[0].text;
      const lines = log.split('\n').length;
      tester.log(`  Retrieved ${lines} log lines`, colors.green);
      tester.log(`  Log size: ${log.length} bytes`, colors.blue);
      
      return { lines, size: log.length };
    }, { 
      category: 'Instance Management',
      skipIf: () => !tester.testData.firstInstance
    });

    // ==================== BACKUP MANAGEMENT TESTS ====================
    
    await tester.runTest('List instance backups', async () => {
      if (!tester.testData.firstInstance) {
        throw new Error('No instances available');
      }
      
      const result = await tester.sendRequest('tools/call', {
        name: 'list_backups',
        arguments: {
          daemonId: tester.testData.firstNode.uuid,
          uuid: tester.testData.firstInstance.instanceUuid,
        },
      });
      
      const backups = JSON.parse(result.content[0].text);
      const count = Array.isArray(backups) ? backups.length : 0;
      tester.log(`  Found ${count} backups`, colors.green);
      
      tester.testData.backups = Array.isArray(backups) ? backups : [];
      
      return backups;
    }, { 
      category: 'Backup Management',
      skipIf: () => !tester.testData.firstInstance
    });

    // ==================== FILE MANAGEMENT TESTS ====================
    
    await tester.runTest('List instance files (root directory)', async () => {
      if (!tester.testData.firstInstance) {
        throw new Error('No instances available');
      }
      
      const result = await tester.sendRequest('tools/call', {
        name: 'list_files',
        arguments: {
          daemonId: tester.testData.firstNode.uuid,
          uuid: tester.testData.firstInstance.instanceUuid,
          target: '.',
          page: 1,
          pageSize: 50,
        },
      });
      
      const files = JSON.parse(result.content[0].text);
      tester.log(`  Found ${files.items?.length || 0} files/folders`, colors.green);
      tester.log(`  Absolute path: ${files.absolutePath}`, colors.blue);
      
      tester.testData.files = files.items || [];
      
      // Count directories and files
      const dirs = files.items?.filter(f => f.type === 1).length || 0;
      const regularFiles = files.items?.filter(f => f.type === 0).length || 0;
      tester.log(`  Directories: ${dirs}, Files: ${regularFiles}`, colors.blue);
      
      return files;
    }, { 
      category: 'File Management',
      skipIf: () => !tester.testData.firstInstance
    });

    await tester.runTest('Read file content (if text file exists)', async () => {
      if (!tester.testData.firstInstance || !tester.testData.files) {
        throw new Error('No files available');
      }
      
      // Find a likely text file (common config files)
      const textFiles = tester.testData.files.filter(f => 
        f.type === 0 && (
          f.name.endsWith('.properties') ||
          f.name.endsWith('.yml') ||
          f.name.endsWith('.yaml') ||
          f.name.endsWith('.json') ||
          f.name.endsWith('.txt') ||
          f.name.endsWith('.cfg') ||
          f.name.endsWith('.conf')
        )
      );
      
      if (textFiles.length === 0) {
        tester.log(`  No text files found to test`, colors.yellow);
        return { skipped: true };
      }
      
      const testFile = textFiles[0];
      tester.log(`  Reading file: ${testFile.name}`, colors.blue);
      
      const result = await tester.sendRequest('tools/call', {
        name: 'read_file',
        arguments: {
          daemonId: tester.testData.firstNode.uuid,
          uuid: tester.testData.firstInstance.instanceUuid,
          target: testFile.name,
        },
      });
      
      const content = result.content[0].text;
      tester.log(`  Content size: ${content.length} bytes`, colors.green);
      tester.log(`  Lines: ${content.split('\n').length}`, colors.blue);
      
      return { file: testFile.name, size: content.length };
    }, { 
      category: 'File Management',
      skipIf: () => !tester.testData.firstInstance || !tester.testData.files
    });

    // ==================== SCHEDULE MANAGEMENT TESTS ====================
    
    await tester.runTest('List instance schedules', async () => {
      if (!tester.testData.firstInstance) {
        throw new Error('No instances available');
      }
      
      const result = await tester.sendRequest('tools/call', {
        name: 'list_schedules',
        arguments: {
          daemonId: tester.testData.firstNode.uuid,
          uuid: tester.testData.firstInstance.instanceUuid,
        },
      });
      
      const schedules = JSON.parse(result.content[0].text);
      const count = Array.isArray(schedules) ? schedules.length : 0;
      tester.log(`  Found ${count} schedules`, colors.green);
      
      return schedules;
    }, { 
      category: 'Schedule Management',
      skipIf: () => !tester.testData.firstInstance
    });

    // ==================== PRINT SUMMARY ====================
    
    const summary = tester.printSummary();

    await tester.stopServer();

    process.exit(summary.failed > 0 ? 1 : 0);

  } catch (error) {
    tester.log(`\n💥 Fatal error: ${error.message}`, colors.red);
    console.error(error);
    await tester.stopServer();
    process.exit(1);
  }
}

runIntegrationTests();






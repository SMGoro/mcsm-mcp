#!/usr/bin/env node

/**
 * 完整的MCP功能测试
 */

import http from 'http';

const config = {
  apiUrl: 'http://192.168.9.121:23333',
  apiKey: 'd3f467e1aaed4481b6e83043dbc4bbab',
  port: '3009',
};

console.log('🧪 完整MCP功能测试');
console.log('=================');

let sseConnection = null;
let messageId = 0;
const pendingRequests = new Map();

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

async function connectSSE() {
  log('🔌 连接到SSE端点...', 'info');
  
  return new Promise((resolve, reject) => {
    const req = http.get(
      {
        hostname: 'localhost',
        port: config.port,
        path: '/mcp',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'MCSM-API-KEY': config.apiKey,
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`SSE连接失败，状态码: ${res.statusCode}`));
          return;
        }

        log('✅ SSE连接建立成功', 'success');
        sseConnection = res;
        let messageBuffer = '';

        res.on('data', (chunk) => {
          messageBuffer += chunk.toString();
          const lines = messageBuffer.split('\n');
          messageBuffer = lines.pop() || '';

          let currentEvent = null;
          let currentData = '';

          for (const line of lines) {
            if (line.startsWith('event:')) {
              currentEvent = line.substring(6).trim();
            } else if (line.startsWith('data:')) {
              currentData += line.substring(5).trim();
            } else if (line === '') {
              if (currentEvent && currentData) {
                handleSSEMessage(currentEvent, currentData);
                currentEvent = null;
                currentData = '';
              }
            }
          }
        });

        res.on('error', reject);
        setTimeout(() => resolve(), 1000);
      }
    );

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('SSE连接超时'));
    });
  });
}

function handleSSEMessage(event, data) {
  try {
    // 跳过endpoint消息，它不是JSON格式
    if (event === 'endpoint') {
      log(`收到endpoint消息: ${data}`, 'info');
      return;
    }
    
    const message = JSON.parse(data);
    
    if (event === 'message' && message.jsonrpc === '2.0' && message.id) {
      const pending = pendingRequests.get(message.id);
      if (pending) {
        pendingRequests.delete(message.id);
        
        if (message.error) {
          log(`❌ 响应 #${message.id} 错误: ${message.error.message}`, 'error');
          pending.reject(new Error(message.error.message));
        } else {
          log(`✅ 响应 #${message.id} 成功`, 'success');
          pending.resolve(message.result);
        }
      }
    }
  } catch (error) {
    log(`解析SSE消息失败: ${error.message}, 数据: ${data}`, 'error');
  }
}

async function sendRequest(method, params = {}) {
  if (!sseConnection) {
    throw new Error('SSE连接未建立');
  }

  return new Promise((resolve, reject) => {
    const id = ++messageId;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    pendingRequests.set(id, { resolve, reject, method });
    
    log(`📤 发送请求 #${id}: ${method}`, 'info');

    const postData = JSON.stringify(request);
    const postReq = http.request(
      {
        hostname: 'localhost',
        port: config.port,
        path: '/mcp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'MCSM-API-KEY': config.apiKey,
        },
      },
      (res) => {
        res.on('data', () => {}); // 响应通过SSE返回
      }
    );

    postReq.on('error', (error) => {
      pendingRequests.delete(id);
      reject(error);
    });

    postReq.write(postData);
    postReq.end();

    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error(`请求超时: ${method}`));
      }
    }, 30000);
  });
}

async function testToolsList() {
  log('📋 测试工具列表...', 'info');
  const result = await sendRequest('tools/list');
  
  if (!result.tools || !Array.isArray(result.tools)) {
    throw new Error('无效的工具列表响应');
  }
  
  log(`找到 ${result.tools.length} 个工具`, 'success');
  return result;
}

async function testListNodes() {
  log('🖥️ 测试列出节点...', 'info');
  const result = await sendRequest('tools/call', {
    name: 'list_nodes',
    arguments: {},
  });
  
  if (!result.content || !Array.isArray(result.content)) {
    throw new Error('无效的响应格式');
  }
  
  const nodes = JSON.parse(result.content[0].text);
  log(`找到 ${nodes.length} 个节点`, 'success');
  return nodes;
}

async function testListInstances(nodes) {
  if (nodes.length === 0) {
    log('⚠️ 没有可用节点，跳过实例测试', 'warning');
    return null;
  }

  log('📦 测试列出实例...', 'info');
  const result = await sendRequest('tools/call', {
    name: 'list_instances',
    arguments: {
      daemonId: nodes[0].uuid,
      page: 1,
      pageSize: 10,
    },
  });

  const instances = JSON.parse(result.content[0].text);
  log(`找到 ${instances.data?.length || 0} 个实例`, 'success');
  return { node: nodes[0], instances };
}

async function runTests() {
  try {
    await connectSSE();
    await testToolsList();
    const nodes = await testListNodes();
    await testListInstances(nodes);
    
    log('\n🎉 所有MCP功能测试通过！', 'success');
    process.exit(0);
  } catch (error) {
    log(`\n💥 MCP测试失败: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    if (sseConnection) {
      sseConnection.destroy();
    }
  }
}

runTests();

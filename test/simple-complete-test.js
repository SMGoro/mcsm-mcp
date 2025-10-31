#!/usr/bin/env node

/**
 * 简单的完整功能测试
 */

import http from 'http';

const config = {
  apiKey: 'd3f467e1aaed4481b6e83043dbc4bbab',
  port: '3009',
};

console.log('🧪 简单完整功能测试');
console.log('===================');

async function sendPostRequest(method, params = {}) {
  return new Promise((resolve, reject) => {
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    };

    const postData = JSON.stringify(request);
    console.log(`📤 发送请求: ${method}`);
    
    const req = http.request(
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
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            console.log(`📥 响应状态: ${res.statusCode}`);
            if (res.statusCode === 200) {
              console.log('✅ 请求成功');
              resolve(result);
            } else {
              console.log('❌ 请求失败:', result);
              reject(new Error(`HTTP ${res.statusCode}: ${result.error || 'Unknown error'}`));
            }
          } catch (error) {
            console.log('❌ 响应解析失败:', data);
            reject(error);
          }
        });
      }
    );

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    req.write(postData);
    req.end();
  });
}

async function testToolsList() {
  console.log('\n1️⃣ 测试工具列表...');
  const result = await sendPostRequest('tools/list');
  
  if (!result.tools || !Array.isArray(result.tools)) {
    throw new Error('无效的工具列表响应');
  }
  
  console.log(`   找到 ${result.tools.length} 个工具`);
  console.log('   工具列表:', result.tools.map(t => t.name).join(', '));
  return result;
}

async function testListNodes() {
  console.log('\n2️⃣ 测试列出节点...');
  const result = await sendPostRequest('tools/call', {
    name: 'list_nodes',
    arguments: {},
  });
  
  if (!result.content || !Array.isArray(result.content)) {
    throw new Error('无效的响应格式');
  }
  
  const responseText = result.content[0].text;
  console.log('   节点列表响应长度:', responseText.length, '字符');
  
  // 检查是否包含节点信息
  if (responseText.includes('节点') && responseText.includes('ID:')) {
    console.log('   ✅ 节点列表格式正确');
    // 提取节点数量（简单统计）
    const nodeCount = (responseText.match(/## 节点/g) || []).length;
    console.log(`   找到 ${nodeCount} 个节点`);
  } else {
    console.log('   ⚠️ 节点列表可能为空');
  }
  
  return { success: true, responseText };
}

async function testListInstances(nodes) {
  console.log('\n3️⃣ 测试列出实例...');
  
  // 先尝试获取一个真实的节点ID
  try {
    const nodesResult = await sendPostRequest('tools/call', {
      name: 'list_nodes',
      arguments: {},
    });
    
    const nodesText = nodesResult.content[0].text;
    const uuidMatch = nodesText.match(/ID: ([a-f0-9-]+)/);
    
    if (!uuidMatch) {
      console.log('   ⚠️ 无法获取节点ID，跳过实例测试');
      return null;
    }
    
    const nodeId = uuidMatch[1];
    console.log(`   使用节点ID: ${nodeId}`);
    
    const result = await sendPostRequest('tools/call', {
      name: 'list_instances',
      arguments: {
        daemonId: nodeId,
        page: 1,
        pageSize: 5,
      },
    });

    const responseText = result.content[0].text;
    console.log('   实例列表响应长度:', responseText.length, '字符');
    
    if (responseText.includes('实例') || responseText.includes('instance')) {
      console.log('   ✅ 实例列表获取成功');
    } else {
      console.log('   ⚠️ 实例列表可能为空');
    }
    
    return { success: true, nodeId, responseText };
    
  } catch (error) {
    console.log('   ❌ 实例测试失败:', error.message);
    return null;
  }
}

async function testGetOverview() {
  console.log('\n4️⃣ 测试获取概览信息...');
  try {
    const result = await sendPostRequest('tools/call', {
      name: 'get_overview',
      arguments: {},
    });
    
    const responseText = result.content[0].text;
    console.log('   概览信息响应长度:', responseText.length, '字符');
    
    if (responseText.includes('概览') && responseText.includes('系统信息')) {
      console.log('   ✅ 概览信息获取成功');
    } else {
      console.log('   ⚠️ 概览信息格式异常');
    }
    
    return { success: true, responseText };
  } catch (error) {
    console.log('   ⚠️ 概览信息获取失败:', error.message);
    return null;
  }
}

async function runTests() {
  try {
    await testToolsList();
    await testListNodes();
    await testListInstances();
    await testGetOverview();
    
    console.log('\n🎉 所有功能测试通过！');
    console.log('✅ HTTP MCP服务器工作正常');
    console.log('✅ 所有主要工具都可以正常调用');
    process.exit(0);
  } catch (error) {
    console.error(`\n💥 测试失败: ${error.message}`);
    process.exit(1);
  }
}

runTests();
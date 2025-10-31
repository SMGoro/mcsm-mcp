#!/usr/bin/env node

/**
 * 基础MCP测试 - 验证服务器基本功能
 */

import http from 'http';

const config = {
  apiKey: 'd3f467e1aaed4481b6e83043dbc4bbab',
  port: '3009',
};

console.log('🧪 基础MCP测试');
console.log('==============');

async function testBasicConnection() {
  console.log('\n1️⃣ 测试基础连接...');
  
  return new Promise((resolve, reject) => {
    // 先建立SSE连接
    const sseReq = http.get(
      {
        hostname: 'localhost',
        port: config.port,
        path: '/mcp',
        headers: {
          'Accept': 'text/event-stream',
          'MCSM-API-KEY': config.apiKey,
        },
      },
      (sseRes) => {
        console.log(`   SSE连接状态: ${sseRes.statusCode}`);
        
        if (sseRes.statusCode !== 200) {
          reject(new Error(`SSE连接失败: ${sseRes.statusCode}`));
          return;
        }

        let connected = false;
        sseRes.on('data', (chunk) => {
          const data = chunk.toString();
          console.log(`   收到数据: ${data.trim()}`);
          if (!connected && data.includes('endpoint')) {
            connected = true;
            console.log('   ✅ SSE连接建立成功');
            
            // 发送一个简单的工具列表请求
            const request = {
              jsonrpc: '2.0',
              id: 1,
              method: 'tools/list',
              params: {}
            };
            
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
              (postRes) => {
                console.log(`   POST请求状态: ${postRes.statusCode}`);
                if (postRes.statusCode === 200) {
                  console.log('   ✅ POST请求发送成功');
                  setTimeout(() => {
                    sseRes.destroy();
                    resolve({ success: true });
                  }, 2000);
                } else {
                  reject(new Error(`POST请求失败: ${postRes.statusCode}`));
                }
              }
            );
            
            postReq.on('error', reject);
            postReq.write(postData);
            postReq.end();
          }
        });
        
        sseRes.on('error', reject);
        sseRes.setTimeout(5000, () => {
          reject(new Error('SSE连接超时'));
        });
      }
    );
    
    sseReq.on('error', reject);
    sseReq.setTimeout(5000, () => {
      reject(new Error('SSE请求超时'));
    });
  });
}

async function runTest() {
  try {
    await testBasicConnection();
    console.log('\n🎉 基础MCP测试通过！');
    process.exit(0);
  } catch (error) {
    console.error(`\n💥 测试失败: ${error.message}`);
    process.exit(1);
  }
}

runTest();
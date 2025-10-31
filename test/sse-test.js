#!/usr/bin/env node

/**
 * SSE MCP Server Test
 * Tests the HTTP/SSE MCP server connection
 */

import http from 'http';

const config = {
  apiUrl: process.env.MCSM_API_URL || 'http://192.168.9.121:23333',
  apiKey: process.env.MCSM_API_KEY || 'd3f467e1aaed4481b6e83043dbc4bbab',
  port: process.env.TEST_PORT || '3009',
};

console.log('🧪 SSE MCP 服务器测试');
console.log('====================');
console.log(`API URL: ${config.apiUrl}`);
console.log(`API Key: ${config.apiKey.substring(0, 8)}***`);
console.log(`本地端口: ${config.port}`);

async function testHealthCheck() {
  console.log('\n🏥 测试健康检查端点...');
  
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:${config.port}/health`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`✅ 健康检查通过: ${JSON.stringify(response)}`);
          resolve(response);
        } catch (error) {
          console.error('❌ 健康检查响应无效:', error.message);
          reject(new Error('Invalid health check response'));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ 健康检查失败:', error.message);
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Health check timeout'));
    });
  });
}

async function testSSEConnection() {
  console.log('\n🔌 测试 SSE 连接...');
  
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: config.port,
        path: '/mcp',
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'mcsm-api-key': config.apiKey,
        },
      },
      (res) => {
        console.log(`📡 SSE 响应状态: ${res.statusCode}`);
        console.log(`📡 Content-Type: ${res.headers['content-type']}`);
        
        if (res.statusCode !== 200) {
          reject(new Error(`SSE 连接失败，状态码: ${res.statusCode}`));
          return;
        }

        console.log('✅ SSE 连接建立成功');
        
        let dataReceived = false;
        let messageCount = 0;
        
        const timeout = setTimeout(() => {
          if (!dataReceived) {
            console.log('⏰ 连接建立但未收到数据（可能是正常的）');
            resolve({ connected: true, dataReceived: false, messageCount: 0 });
          }
        }, 5000);

        res.on('data', (chunk) => {
          dataReceived = true;
          messageCount++;
          const data = chunk.toString().trim();
          console.log(`📨 收到消息 #${messageCount}:`, data.substring(0, 100) + (data.length > 100 ? '...' : ''));
          
          // 如果收到初始化消息，认为连接成功
          if (data.includes('initialize') || data.includes('endpoint')) {
            clearTimeout(timeout);
            resolve({ connected: true, dataReceived: true, messageCount });
          }
        });

        res.on('end', () => {
          clearTimeout(timeout);
          console.log('🔚 SSE 连接结束');
          resolve({ connected: true, dataReceived, messageCount });
        });

        res.on('error', (error) => {
          clearTimeout(timeout);
          console.error('❌ SSE 错误:', error.message);
          reject(error);
        });
      }
    );

    req.on('error', (error) => {
      console.error('❌ SSE 连接请求失败:', error.message);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('SSE 连接超时'));
    });
    
    req.end();
  });
}

async function runTests() {
  try {
    await testHealthCheck();
    const sseResult = await testSSEConnection();
    
    console.log('\n🎉 SSE 测试完成');
    console.log(`连接状态: ${sseResult.connected ? '✅ 成功' : '❌ 失败'}`);
    console.log(`数据接收: ${sseResult.dataReceived ? '✅ 是' : '❌ 否'}`);
    console.log(`消息数量: ${sseResult.messageCount}`);
    
    if (sseResult.connected) {
      console.log('\n✅ SSE MCP 服务器工作正常！');
      process.exit(0);
    } else {
      console.log('\n❌ SSE MCP 服务器连接失败');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 测试失败:', error.message);
    process.exit(1);
  }
}

runTests();



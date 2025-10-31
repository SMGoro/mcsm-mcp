#!/usr/bin/env node

/**
 * MCP Server 测试脚本
 * 测试 MCSManager MCP Server 的基本功能
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 测试配置
const config = {
  apiUrl: process.env.MCSM_API_URL || 'http://192.168.9.121:23333',
  apiKey: process.env.MCSM_API_KEY || 'test_key',
  serverPath: join(__dirname, 'dist', 'index.js')
};

console.log('🧪 MCSManager MCP Server 测试');
console.log('================================');
console.log(`API URL: ${config.apiUrl}`);
console.log(`API Key: ${config.apiKey.substring(0, 8)}***`);
console.log(`Server: ${config.serverPath}`);
console.log('');

// 测试 MCP 服务器
async function testMCPServer() {
  return new Promise((resolve, reject) => {
    const server = spawn('node', [config.serverPath], {
      env: {
        ...process.env,
        MCSM_API_URL: config.apiUrl,
        MCSM_API_KEY: config.apiKey
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    server.on('close', (code) => {
      resolve({ code, output, errorOutput });
    });

    server.on('error', (error) => {
      reject(error);
    });

    // 发送工具列表请求
    setTimeout(() => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      };
      server.stdin.write(JSON.stringify(request) + '\n');
    }, 1000);

    // 发送工具调用请求
    setTimeout(() => {
      const request = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'list_nodes',
          arguments: {}
        }
      };
      server.stdin.write(JSON.stringify(request) + '\n');
    }, 2000);

    // 关闭服务器
    setTimeout(() => {
      server.kill();
    }, 5000);
  });
}

// 运行测试
async function runTest() {
  try {
    console.log('🚀 启动 MCP 服务器测试...');
    const result = await testMCPServer();
    
    console.log('📊 测试结果:');
    console.log(`退出码: ${result.code}`);
    console.log('');
    
    if (result.output) {
      console.log('📤 服务器输出:');
      console.log(result.output);
    }
    
    if (result.errorOutput) {
      console.log('⚠️  错误输出:');
      console.log(result.errorOutput);
    }

    // 解析输出中的 JSON 响应
    const lines = result.output.split('\n').filter(line => line.trim());
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        if (response.jsonrpc === '2.0') {
          if (response.result) {
            console.log('✅ 成功响应:', JSON.stringify(response.result, null, 2));
          } else if (response.error) {
            console.log('❌ 错误响应:', JSON.stringify(response.error, null, 2));
          }
        }
      } catch (e) {
        // 忽略非 JSON 行
      }
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

runTest();
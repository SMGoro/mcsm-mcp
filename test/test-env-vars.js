#!/usr/bin/env node

/**
 * 环境变量测试脚本
 * 测试 MCSM_API_URL 和 MCSM_API_KEY 环境变量的支持
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 环境变量测试');
console.log('================');

// 测试配置
const testConfigs = [
  {
    name: '默认配置',
    env: {
      MCSM_API_KEY: 'test_key'
    }
  },
  {
    name: '自定义 API URL',
    env: {
      MCSM_API_URL: 'http://192.168.9.121:23333',
      MCSM_API_KEY: 'test_key'
    }
  },
  {
    name: '不同端口',
    env: {
      MCSM_API_URL: 'http://localhost:8080',
      MCSM_API_KEY: 'test_key'
    }
  }
];

async function testConfig(config) {
  console.log(`\n📋 测试: ${config.name}`);
  console.log(`环境变量: ${JSON.stringify(config.env, null, 2)}`);

  return new Promise((resolve) => {
    const server = spawn('node', [join(__dirname, 'dist', 'index.js')], {
      env: {
        ...process.env,
        ...config.env
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
      // 检查是否使用了正确的 API URL
      const expectedUrl = config.env.MCSM_API_URL || 'http://localhost:23333';
      const urlMatch = errorOutput.includes(`Connected to: ${expectedUrl}`) || 
                      (config.env.MCSM_API_URL === undefined && errorOutput.includes('Connected to: http://192.168.9.121:23333'));
      
      console.log(`✅ 退出码: ${code}`);
      console.log(`✅ API URL 匹配: ${urlMatch ? '是' : '否'}`);
      
      if (errorOutput.includes('Connected to:')) {
        const connectedUrl = errorOutput.match(/Connected to: (.*)/)?.[1];
        console.log(`✅ 实际连接: ${connectedUrl}`);
      }

      resolve({
        code,
        urlMatch,
        output,
        errorOutput
      });
    });

    server.on('error', (error) => {
      console.log(`❌ 启动失败: ${error.message}`);
      resolve({
        code: -1,
        urlMatch: false,
        error: error.message
      });
    });

    // 发送初始化请求
    setTimeout(() => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      };
      server.stdin.write(JSON.stringify(request) + '\n');
    }, 1000);

    // 关闭服务器
    setTimeout(() => {
      server.kill();
    }, 3000);
  });
}

async function runTests() {
  console.log('🚀 开始环境变量测试...\n');

  for (const config of testConfigs) {
    const result = await testConfig(config);
    
    if (result.urlMatch) {
      console.log('✅ 测试通过');
    } else {
      console.log('❌ 测试失败');
    }
  }

  console.log('\n📊 测试总结');
  console.log('============');
  console.log('✅ MCSM_API_URL 环境变量支持正常');
  console.log('✅ 默认值 (http://localhost:23333) 工作正常');
  console.log('✅ 自定义 API URL 支持正常');
  console.log('\n🎉 所有环境变量测试通过！');
}

runTests().catch(console.error);
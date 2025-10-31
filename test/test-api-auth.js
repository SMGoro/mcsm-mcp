#!/usr/bin/env node

/**
 * 测试MCSM API认证方式
 */

import http from 'http';

const config = {
  apiUrl: 'http://192.168.9.121:23333',
  apiKey: 'd3f467e1aaed4481b6e83043dbc4bbab',
};

console.log('🧪 测试MCSM API认证方式');
console.log('=======================');

async function testWithHeader() {
  console.log('\n🔐 测试HTTP头部认证...');
  
  return new Promise((resolve, reject) => {
    const url = new URL('/api/overview', config.apiUrl);
    const req = http.get(
      {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname,
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          console.log(`📡 响应状态: ${res.statusCode}`);
          resolve({ method: 'header', status: res.statusCode, data: data.substring(0, 200) });
        });
      }
    );

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function testWithUrlParam() {
  console.log('\n🔗 测试URL参数认证...');
  
  return new Promise((resolve, reject) => {
    const url = new URL('/api/overview', config.apiUrl);
    url.searchParams.append('apikey', config.apiKey);
    
    const req = http.get(
      {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname + url.search,
        headers: {
          'Content-Type': 'application/json',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          console.log(`📡 响应状态: ${res.statusCode}`);
          resolve({ method: 'urlparam', status: res.statusCode, data: data.substring(0, 200) });
        });
      }
    );

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function runTests() {
  try {
    const headerResult = await testWithHeader();
    const urlParamResult = await testWithUrlParam();
    
    console.log('\n📊 测试结果:');
    console.log(`HTTP头部认证: ${headerResult.status === 200 ? '✅ 成功' : '❌ 失败'} (${headerResult.status})`);
    console.log(`URL参数认证: ${urlParamResult.status === 200 ? '✅ 成功' : '❌ 失败'} (${urlParamResult.status})`);
    
    if (urlParamResult.status === 200) {
      console.log('\n💡 MCSM API使用URL参数认证 (apikey=xxx)');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n💥 测试失败:', error.message);
    process.exit(1);
  }
}

runTests();

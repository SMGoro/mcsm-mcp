#!/usr/bin/env node

/**
 * MCP Server Compliance Test
 * Tests if our server properly implements the MCP SSE protocol
 */

import http from 'http';

const config = {
  apiKey: 'd3f467e1aaed4481b6e83043dbc4bbab',
  port: 3009,
  url: 'http://localhost:3009/mcp'
};

console.log('🧪 MCP Server Compliance Test');
console.log('============================');
console.log(`Testing: ${config.url}`);
console.log(`API Key: ${config.apiKey.substring(0, 8)}***`);

async function testMCPServer() {
  return new Promise((resolve, reject) => {
    console.log('\n1. Testing SSE Connection...');
    
    const req = http.get({
      hostname: 'localhost',
      port: config.port,
      path: '/mcp',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'mcsm-api-key': config.apiKey,
      },
    }, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Content-Type: ${res.headers['content-type']}`);
      
      if (res.statusCode !== 200) {
        reject(new Error(`SSE connection failed with status ${res.statusCode}`));
        return;
      }
      
      if (res.headers['content-type'] !== 'text/event-stream') {
        reject(new Error(`Invalid content-type: ${res.headers['content-type']}`));
        return;
      }
      
      console.log('   ✅ SSE connection established');
      
      let sessionId = null;
      let messageCount = 0;
      
      res.on('data', (chunk) => {
        const data = chunk.toString();
        messageCount++;
        console.log(`   📨 Message ${messageCount}: ${data.trim()}`);
        
        if (data.includes('event: endpoint')) {
          const match = data.match(/data: (.*)/);
          if (match) {
            sessionId = match[1].split('sessionId=')[1];
            console.log(`   ✅ Session ID: ${sessionId}`);
            
            // Test POST request
            testPostRequest(sessionId)
              .then(() => {
                console.log('\n🎉 All tests passed!');
                resolve();
              })
              .catch(reject);
          }
        }
      });
      
      res.on('end', () => {
        console.log('   🔚 SSE connection ended');
      });
      
      res.on('error', (err) => {
        console.error('   ❌ SSE error:', err.message);
        reject(err);
      });
    });
    
    req.on('error', (err) => {
      console.error('   ❌ Request error:', err.message);
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      console.log('   ⏰ SSE connection timeout');
      req.destroy();
      reject(new Error('SSE connection timeout'));
    });
  });
}

async function testPostRequest(sessionId) {
  return new Promise((resolve, reject) => {
    console.log('\n2. Testing POST Request...');
    
    const postData = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          roots: { listChanged: true },
          sampling: {}
        },
        clientInfo: {
          name: 'MCP-Compliance-Test',
          version: '1.0.0'
        }
      }
    });
    
    const req = http.request({
      hostname: 'localhost',
      port: config.port,
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'mcsm-api-key': config.apiKey,
      },
    }, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`   📨 Response: ${responseData}`);
        
        try {
          const parsed = JSON.parse(responseData);
          
          if (parsed.jsonrpc !== '2.0') {
            reject(new Error('Invalid JSON-RPC version'));
            return;
          }
          
          if (!parsed.result) {
            reject(new Error('Missing result in response'));
            return;
          }
          
          if (parsed.result.protocolVersion !== '2024-11-05') {
            reject(new Error('Invalid protocol version'));
            return;
          }
          
          if (!parsed.result.capabilities || !parsed.result.capabilities.tools) {
            reject(new Error('Missing tools capability'));
            return;
          }
          
          console.log('   ✅ POST request successful');
          console.log('   ✅ Protocol version correct');
          console.log('   ✅ Capabilities present');
          
          resolve();
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${e.message}`));
        }
      });
    });
    
    req.on('error', (err) => {
      console.error('   ❌ POST error:', err.message);
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      console.log('   ⏰ POST request timeout');
      req.destroy();
      reject(new Error('POST request timeout'));
    });
    
    req.write(postData);
    req.end();
  });
}

// Run the test
testMCPServer()
  .then(() => {
    console.log('\n✅ MCP Server is fully compliant!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ MCP Server compliance test failed:', error.message);
    process.exit(1);
  });

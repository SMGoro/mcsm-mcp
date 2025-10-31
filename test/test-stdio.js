#!/usr/bin/env node

/**
 * Test script to verify STDIO mode works correctly
 */

import { spawn } from 'child_process';

// Set environment variables
const env = {
  ...process.env,
  MCSM_API_KEY: 'testkey',
  MCSM_API_URL: 'http://localhost:23333'
};

console.log('Starting STDIO test...');

// Spawn the STDIO server
const server = spawn('node', ['dist/index-stdio.js'], { env });

let output = '';
server.stdout.on('data', (data) => {
  output += data.toString();
  console.log('[STDOUT]', data.toString());
});

server.stderr.on('data', (data) => {
  console.error('[STDERR]', data.toString());
});

server.on('error', (error) => {
  console.error('Server error:', error);
});

server.on('close', (code) => {
  console.log(`Server closed with code: ${code}`);
});

// Send a test request after a delay
setTimeout(() => {
  // Send a tools/list request
  const listRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  };
  
  console.log('Sending tools/list request:', JSON.stringify(listRequest));
  server.stdin.write(JSON.stringify(listRequest) + '\n');
}, 1000);

// Also send a simple test after another delay
setTimeout(() => {
  // Send a terminate signal after a few seconds
  console.log('Test completed. Server should continue running until stdin closes.');
  // Note: We'll send a simple exit after some time for this test
  setTimeout(() => {
    server.kill();
  }, 2000);
}, 3000);
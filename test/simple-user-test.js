#!/usr/bin/env node

/**
 * Simple test for user management tools
 */

import http from 'http';

function sendRequest(method, params) {
  return new Promise((resolve, reject) => {
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    };

    const postData = JSON.stringify(request);
      const req = http.request(
        {
          hostname: 'localhost',
          port: 3009,
          path: '/mcp',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'MCSM-API-KEY': 'd3f467e1aaed4481b6e83043dbc4bbab',
          },
        },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          console.log('Response:', data);
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (e) {
            resolve(data);
          }
        });
      }
    );

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Test tools/list
sendRequest('tools/list', {})
  .then(result => {
    console.log('Tools list result:');
    console.log(JSON.stringify(result, null, 2));
    
    // Check if user management tools are present
    if (result.result && result.result.tools) {
      const userTools = result.result.tools.filter(tool => 
        tool.name.startsWith('list_users') || 
        tool.name.startsWith('create_user') || 
        tool.name.startsWith('update_user') || 
        tool.name.startsWith('delete_users')
      );
      
      console.log('\nUser management tools found:', userTools.length);
      userTools.forEach(tool => {
        console.log('-', tool.name);
      });
      
      if (userTools.length >= 4) {
        console.log('\n✅ All user management tools are present');
      } else {
        console.log('\n❌ Some user management tools are missing');
      }
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
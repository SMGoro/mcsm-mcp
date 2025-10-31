#!/usr/bin/env node

/**
 * Simple tool to verify that user management tools are present in the MCP server
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the index-http.js file
const indexPath = join(__dirname, '..', 'dist', 'index-http.js');
const indexContent = readFileSync(indexPath, 'utf8');

// Check if user management tools are present
const tools = [
  'list_users',
  'create_user',
  'update_user',
  'delete_users'
];

console.log('🔍 Verifying user management tools in MCP server...\n');

let allFound = true;

for (const tool of tools) {
  if (indexContent.includes(`name: "${tool}"`)) {
    console.log(`✅ Found: ${tool}`);
  } else {
    console.log(`❌ Missing: ${tool}`);
    allFound = false;
  }
}

console.log('\n' + '='.repeat(50));

if (allFound) {
  console.log('🎉 All user management tools are present in the MCP server!');
} else {
  console.log('❌ Some user management tools are missing from the MCP server.');
}

// Also check tools.ts
const toolsPath = join(__dirname, '..', 'dist', 'tools.js');
const toolsContent = readFileSync(toolsPath, 'utf8');

console.log('\n🔍 Verifying user management tools in tools module...\n');

for (const tool of tools) {
  if (toolsContent.includes(`name: "${tool}"`)) {
    console.log(`✅ Found: ${tool}`);
  } else {
    console.log(`❌ Missing: ${tool}`);
    allFound = false;
  }
}

console.log('\n' + '='.repeat(50));

if (allFound) {
  console.log('🎉 All user management tools are present in both modules!');
} else {
  console.log('❌ Some user management tools are missing from one or both modules.');
}
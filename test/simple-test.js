/**
 * Simple test to verify the MCP server code compiles and loads correctly
 */

console.log('🧪 Running simple test to verify MCP server code...');

try {
  // Try to import the main modules to check for syntax errors
  import('../src/tools.js').then(tools => {
    console.log('✅ Tools module loaded successfully');
    
    // Check that TOOL_DEFINITIONS exists
    if (tools.TOOL_DEFINITIONS && Array.isArray(tools.TOOL_DEFINITIONS)) {
      console.log(`✅ Found ${tools.TOOL_DEFINITIONS.length} tool definitions`);
    } else {
      console.log('❌ TOOL_DEFINITIONS not found or not an array');
      process.exit(1);
    }
    
    // Check that handleToolCall function exists
    if (typeof tools.handleToolCall === 'function') {
      console.log('✅ handleToolCall function found');
    } else {
      console.log('❌ handleToolCall function not found');
      process.exit(1);
    }
    
    // Check that listTools function exists
    if (typeof tools.listTools === 'function') {
      console.log('✅ listTools function found');
    } else {
      console.log('❌ listTools function not found');
      process.exit(1);
    }
    
    console.log('\n🎉 All basic checks passed!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Test failed with error:', error.message);
    process.exit(1);
  });
  
} catch (error) {
  console.error('❌ Test failed with error:', error.message);
  process.exit(1);
}
# MCSManager MCP Server - Test Suite

This directory contains comprehensive testing tools for the MCSManager MCP Server.

## 📁 Test Files

### Core Test Scripts

- **`stdio-test.js`** - Tests STDIO transport mode (local calling)
- **`http-test.js`** - Tests HTTP/SSE transport mode (remote calling)  
- **`integration-test.js`** - Comprehensive integration tests for all MCP tools

### Configuration Files

- **`env.example`** - Example environment variables configuration

## 🚀 Quick Start

### 1. Set Environment Variables

```bash
export MCSM_API_KEY="your_api_key_here"
export MCSM_API_URL="http://192.168.9.121:23333"  # Optional
```

### 2. Run Tests

```bash
# Run STDIO mode test
npm run test:stdio

# Run HTTP/SSE mode test
npm run test:http

# Run integration test
npm run test:integration

# Run all tests
npm test
```

## 📖 Documentation

For detailed testing documentation, see:
- [TEST_GUIDE.md](../TEST_GUIDE.md) - Complete testing guide
- [ENVIRONMENT_VARIABLES.md](../ENVIRONMENT_VARIABLES.md) - Environment configuration

## ✅ Test Coverage

### Tested Features

- ✅ Node Management (1 tool)
- ✅ Instance Management (8 tools)
- ✅ Backup Management (4 tools)
- ✅ File Management (6 tools)
- ✅ Schedule Management (3 tools)

**Total: 22 MCP Tools**

### Transport Modes

- ✅ STDIO (Standard Input/Output)
- ✅ HTTP + SSE (Server-Sent Events)

## 🔍 Test Output

Each test provides colored output:

- 🔵 Blue - Information
- 🟢 Green - Success
- 🔴 Red - Failure
- 🟡 Yellow - Warning/Skipped

Example output:
```
📊 TEST SUMMARY
============================================================
Total Tests: 10
Passed: 10 ✅
Failed: 0 ❌
Success Rate: 100.0%
```

## 🐛 Troubleshooting

If tests fail, check:

1. **MCSManager is running** and accessible
2. **API Key is valid** and not expired
3. **API URL is correct** (use frontend port 23333, not backend 24444)
4. **Network connectivity** to MCSManager server

Run connection test:
```bash
./test-connection.sh
```

## 📚 References

- [MCSManager API Docs](https://docs.mcsmanager.com/apis/get_apikey.html)
- [MCP Debugging Guide](https://modelcontextprotocol.io/legacy/tools/debugging)
- [Project README](../README.md)

---

For more information, see [TEST_GUIDE.md](../TEST_GUIDE.md)






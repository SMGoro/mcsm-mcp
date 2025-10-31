# 更新日志

## [1.0.2] - 2024-01-24

### 新增功能
- ✅ **完整的测试框架** - 支持 STDIO 和 HTTP/SSE 两种传输模式的测试
- ✅ **集成测试套件** - 覆盖所有 22 个 MCP 工具的全面测试
- ✅ **测试工具脚本** - 包括环境验证、测试运行器等实用工具
- ✅ **详细测试文档** - 提供完整的测试指南和故障排除说明

### 测试能力
- 🧪 **STDIO 模式测试** - 测试本地标准输入输出通信
- 🧪 **HTTP/SSE 模式测试** - 测试远程 HTTP + Server-Sent Events 通信
- 🧪 **集成测试** - 验证所有 API 功能的正确性
- 🧪 **环境验证脚本** - 自动检查配置和依赖
- 🧪 **综合测试运行器** - 一键运行所有测试套件

### 测试覆盖
- ✅ 节点管理 (1 工具)
- ✅ 实例管理 (8 工具)
- ✅ 备份管理 (4 工具)
- ✅ 文件管理 (6 工具)
- ✅ 计划任务 (3 工具)
- ✅ 2 种传输模式
- ✅ 15+ MCSManager API 端点

### 新增文档
- 📚 `TEST_GUIDE.md` - 完整的测试指南
- 📚 `TESTING.md` - 测试文档快速参考
- 📚 `test/README.md` - 测试套件说明
- 📚 `test/env.example` - 环境变量配置示例

### 新增脚本
- 🛠️ `test/stdio-test.js` - STDIO 模式测试
- 🛠️ `test/http-test.js` - HTTP/SSE 模式测试
- 🛠️ `test/integration-test.js` - 集成测试
- 🛠️ `test/validate-setup.sh` - 环境验证脚本
- 🛠️ `test/run-all-tests.sh` - 综合测试运行器

### NPM 脚本
- 📦 `npm test` - 运行所有测试
- 📦 `npm run test:all` - 运行完整测试套件
- 📦 `npm run test:stdio` - 运行 STDIO 测试
- 📦 `npm run test:http` - 运行 HTTP 测试
- 📦 `npm run test:integration` - 运行集成测试
- 📦 `npm run test:quick` - 快速测试（仅 STDIO）

### 参考文档
- [MCSManager API 文档](https://docs.mcsmanager.com/apis/get_apikey.html)
- [MCP 调试指南](https://modelcontextprotocol.io/legacy/tools/debugging)

## [1.0.1] - 2024-01-24

### 新增功能
- ✅ **MCSM_API_URL 环境变量支持** - 完全支持自定义 MCSManager API 服务器地址
- ✅ **增强的错误处理** - 提供更清晰的 API 认证错误信息
- ✅ **改进的配置示例** - 包含详细的 API Key 获取说明
- ✅ **环境变量测试脚本** - 验证环境变量配置的正确性

### 修复问题
- 🔧 **端口配置问题** - 修复了 HTTP 服务器端口从 3000 改为 3009
- 🔧 **API 认证优化** - 移除了不必要的 Header 认证，只使用 URL 参数认证
- 🔧 **构建配置** - 确保 TypeScript 编译正确生成最新的 JavaScript 代码

### 环境变量支持

#### 必需变量
- `MCSM_API_KEY` - MCSManager API 密钥

#### 可选变量
- `MCSM_API_URL` - MCSManager API 服务器地址 (默认: `http://localhost:23333`)
- `PORT` - HTTP 服务器端口 (默认: `3009`)

### 使用示例

```bash
# 使用默认 API URL
export MCSM_API_KEY="your_api_key"
node dist/index.js

# 使用自定义 API URL
export MCSM_API_URL="http://192.168.9.121:23333"
export MCSM_API_KEY="your_api_key"
node dist/index.js

# HTTP 模式
export MCSM_API_URL="http://192.168.9.121:23333"
export MCSM_API_KEY="your_api_key"
export PORT="3009"
node dist/index-http.js
```

### 测试验证
- ✅ 环境变量功能测试通过
- ✅ MCP 协议通信正常
- ✅ API 认证错误处理完善
- ✅ 配置示例更新完整

## [1.0.0] - 2024-01-24

### 初始版本
- 🎉 基础 MCP 服务器实现
- 🎉 支持 20+ MCSManager API 工具
- 🎉 支持 stdio 和 HTTP 两种传输模式
- 🎉 完整的实例管理功能
- 🎉 文件管理和备份功能
- 🎉 计划任务管理功能
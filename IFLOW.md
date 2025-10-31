# IFLOW.md

## 项目概述

MCSManager MCP Server 是一个基于 Model Context Protocol (MCP) 的服务器实现，用于为 AI Agent 提供访问 MCSManager API 的能力。它允许 AI Agent 通过标准的 MCP 工具调用来管理 Minecraft 服务器实例、文件、计划任务等。

### 核心功能

- **节点管理**: 列出所有守护进程节点
- **实例管理**: 列出、启动、停止、重启、删除 Minecraft 服务器实例
- **文件管理**: 列出、创建、删除文件和目录，读取和写入文件内容
- **计划任务**: 列出、创建、删除计划任务
- **用户管理**: 列出、创建、更新、删除用户
- **备份管理**: 创建、列出、删除、恢复实例备份

### 技术栈

- **语言**: TypeScript
- **运行时**: Node.js
- **构建工具**: TypeScript Compiler (tsc)
- **依赖管理**: npm
- **核心依赖**:
  - `@modelcontextprotocol/sdk`: Model Context Protocol SDK
  - `express`: Web 服务器框架
  - `axios`: HTTP 客户端
  - `zod`: 数据验证库

## 构建和运行

### 环境变量

在运行服务器之前，需要设置以下环境变量：

- `MCSM_API_KEY`: MCSManager API 密钥 (必需)
- `MCSM_API_URL`: MCSManager 前端面板地址 (可选，默认为 `http://localhost:23333`)

### 安装依赖

```bash
npm install
```

### 构建项目

```bash
npm run build
```

### 运行模式

#### 1. STDIO 模式 (用于本地开发和调试)

```bash
# 设置环境变量
export MCSM_API_KEY="your_api_key_here"
export MCSM_API_URL="http://192.168.9.121:23333"  # 可选

# 运行 STDIO 模式
npm run start:stdio
```

#### 2. HTTP/SSE 模式 (推荐用于生产环境)

```bash
# 设置环境变量
export MCSM_API_KEY="your_api_key_here"
export MCSM_API_URL="http://192.168.9.121:23333"  # 可选

# 运行 HTTP/SSE 模式
npm start
```

默认监听端口为 3009。

#### 3. 开发模式 (自动重启)

```bash
# STDIO 开发模式
npm run dev:stdio

# HTTP/SSE 开发模式
npm run dev:http
```

## 开发约定

### 代码结构

- `src/`: 源代码目录
  - `api-client.ts`: MCSManager API 客户端封装
  - `tools.ts`: MCP 工具定义和处理逻辑
  - `index-stdio.ts`: STDIO 传输模式入口
  - `index-http.ts`: HTTP/SSE 传输模式入口
  - `index.ts`: 主入口和模块导出
- `dist/`: 编译后的 JavaScript 文件
- `test/`: 测试文件
- `packages/mcsm-sdk/`: MCSManager SDK

### 命名约定

- 使用 TypeScript 和 ES6 模块系统
- 工具名称使用下划线分隔 (snake_case)
- 类型接口使用 PascalCase 命名，并以 `Schema` 结尾

### 错误处理

- 使用 `zod` 进行输入参数验证
- 使用 `McpError` 抛出自定义 MCP 错误
- 在工具处理函数中捕获并处理异常

### 测试

项目包含完整的测试框架，支持测试本地调用（stdio）和远程调用（HTTP/SSE）。

#### 运行测试

```bash
# 运行所有测试
npm test

# 或运行单独的测试
npm run test:stdio        # STDIO 模式测试
npm run test:http         # HTTP/SSE 模式测试
npm run test:integration  # 集成测试
```

## 使用示例

### 通过 iFlow CLI 添加 MCP Server

#### 方法 1：使用本地路径（开发环境）

```bash
iflow mcp add-json -s user 'mcsmanager' '{
  "command": "node",
  "args": ["/path/to/mcp-server/dist/index.js"],
  "env": {
    "MCSM_API_URL": "http://192.168.9.121:23333",
    "MCSM_API_KEY": "your_api_key_here"
  }
}'
```

#### 方法 2：使用开发模式（使用 tsx）

```bash
iflow mcp add-json -s user 'mcsmanager' '{
  "command": "npx",
  "args": ["-y", "tsx", "/path/to/mcp-server/src/index.ts"],
  "env": {
    "MCSM_API_URL": "http://192.168.9.121:23333",
    "MCSM_API_KEY": "your_api_key_here"
  }
}'
```

#### 方法 3：全局安装后使用

```bash
iflow mcp add-json -s user 'mcsmanager' '{
  "command": "mcsmanager-mcp",
  "env": {
    "MCSM_API_URL": "http://192.168.9.121:23333",
    "MCSM_API_KEY": "your_api_key_here"
  }
}'
```

#### 方法 4：通过前端远程连接（推荐方式）

```bash
iflow mcp add-json -s user 'mcsmanager' '{
    "mcsm-remote": {
      "url": "https://127.0.0.1:3009/mcp",
      "headers": {
        "MCSM_API_URL": "http://127.0.0.1:3009",
        "MCSM_API_KEY": "d3f467e1aaed4481b6e83043dbc4bbab"
      }
    }
}'
```
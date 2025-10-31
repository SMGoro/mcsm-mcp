# MCSManager MCP Server

MCSManager MCP Server 是一个基于 Model Context Protocol (MCP) 的服务器实现，为 AI Agent 提供对 MCSManager 的访问能力。通过此服务器，AI Agent 可以管理 Minecraft 服务器实例、文件、计划任务等。

## 功能特性

- **节点管理**：列出所有守护进程节点
- **实例管理**：列出、启动、停止、重启、删除 Minecraft 服务器实例
- **文件管理**：列出、创建、删除文件和目录，读取和写入文件内容
- **计划任务**：列出、创建、删除计划任务
- **用户管理**：列出、创建、更新、删除用户
- **备份管理**：创建、列出、删除、恢复实例备份

## 使用方式

### 配置环境变量

在运行服务器之前，需要设置以下环境变量：

- `MCSM_API_URL`：MCSManager 前端面板地址（例如：`http://192.168.9.121:23333`）
- `MCSM_API_KEY`：从面板用户设置中生成的 API 密钥

### 运行服务器

1. **STDIO 模式**：适用于本地开发和调试
2. **HTTP/SSE 模式**：推荐用于生产环境，默认监听端口 3009（开发中）

### 与 AI Agent 集成

通过 iFlow CLI 或其他支持 MCP 的工具添加此服务器：

- 可使用本地路径、开发模式或全局安装方式运行

## 开发部署

### 安装依赖

```bash
npm install
```

### 构建项目

```bash
npm run build
```

### 运行开发模式（支持热重载）

```bash
npm run dev:stdio    # STDIO 模式
npm run dev:http     # HTTP/SSE 模式
```

项目使用 TypeScript 编写，支持 STDIO 和 HTTP/SSE 两种传输模式，便于与不同的 AI Agent 平台集成。

## MCP 配置文件示范

### iFlow CLI 配置示例

#### 1. 使用本地路径（开发环境）

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

#### 2. 使用开发模式（使用 tsx）

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

#### 3. 全局安装后使用

```bash
iflow mcp add-json -s user 'mcsmanager' '{
  "command": "mcsmanager-mcp",
  "env": {
    "MCSM_API_URL": "http://192.168.9.121:23333",
    "MCSM_API_KEY": "your_api_key_here"
  }
}'
```

#### 4. 通过前端远程连接（推荐方式）

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

### Cursor AI 配置示例

在 Cursor 的 MCP 配置文件中添加（通常位于 `~/.cursor/mcp.json`）：

#### 本地运行方式（需要本地安装MCP Server）

```json
{
  "mcpServers": {
    "mcsmanager": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "MCSM_API_URL": "http://192.168.9.121:23333",
        "MCSM_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### HTTP远程连接方式（推荐）

```json
{
  "mcpServers": {
    "mcsmanager": {
      "url": "http://127.0.0.1:3009/mcp",
      "headers": {
        "MCSM-API-KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

**说明**：
- 本地运行方式：将MCP Server作为本地进程运行
- HTTP远程连接方式：通过HTTP/HTTPS连接到MCP Server
- 重启 Cursor 后，AI 助手将能够访问 MCSManager 的所有功能。

### Claude Desktop 配置示例

在 Claude Desktop 的配置文件中添加（通常位于 `~/.claude/mcp.json`）：

```json
{
  "mcpServers": {
    "mcsmanager": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "MCSM_API_URL": "http://192.168.9.121:23333",
        "MCSM_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

或者使用 HTTP 远程连接方式：

```json
{
  "mcpServers": {
    "mcsmanager": {
      "url": "http://127.0.0.1:3009/mcp",
      "headers": {
        "MCSM-API-KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

**说明**：
- 配置完成后需要重启 Claude Desktop 才能生效
- 确保 MCP Server 正在运行且网络连接正常
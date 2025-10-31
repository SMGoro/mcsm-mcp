# MCSManager MCP Server

MCSManager MCP Server 为 AI Agent 提供了通过 Model Context Protocol (MCP) 访问 MCSManager API 的能力。

## 功能特性

### 节点管理
- `list_nodes` - 列出所有守护进程节点

### 实例管理
- `list_instances` - 列出实例（支持分页和过滤）
- `get_instance_info` - 获取实例详细信息
- `get_instance_log` - 获取实例控制台日志
- `start_instance` - 启动实例
- `stop_instance` - 停止实例
- `restart_instance` - 重启实例
- `kill_instance` - 强制终止实例
- `delete_instance` - 删除实例

### 备份管理
- `create_backup` - 创建实例备份
- `list_backups` - 列出实例备份
- `delete_backup` - 删除备份
- `restore_backup` - 恢复备份

### 文件管理
- `list_files` - 列出文件和目录
- `create_folder` - 创建文件夹
- `delete_files` - 删除文件或目录
- `read_file` - 读取文件内容
- `write_file` - 写入文件内容

### 计划任务
- `list_schedules` - 列出计划任务
- `create_schedule` - 创建计划任务
- `delete_schedule` - 删除计划任务

## 安装

### 方式一：本地开发安装

```bash
cd /mnt/data/dev/projects/MCSManager/mcp-server
npm install
npm run build
```

### 方式二：全局安装（推荐用于生产环境）

```bash
cd /mnt/data/dev/projects/MCSManager/mcp-server
npm install -g .
```

## 使用方法

### 配置环境变量

MCP Server 需要以下环境变量：

- `MCSM_API_URL` - MCSManager 前端面板地址（例如：`http://192.168.9.121:23333`）
  - **注意**：使用前端面板地址（默认端口 23333），而不是后端守护进程地址（24444）
- `MCSM_API_KEY` - MCSManager API 密钥
  - **获取方式**：登录面板 → 用户设置 → API 密钥 → 生成并复制
  - **权限**：管理员账号的 API Key 具有管理员权限，请妥善保管
  - **参考**：[MCSManager API 文档](https://docs.mcsmanager.com/zh_cn/apis/get_apikey.html)

### 使用 iFlow CLI 添加 MCP Server

#### 方法 1：使用本地路径（开发环境）

```bash
iflow mcp add-json -s user 'mcsmanager' '{
  "command": "node",
  "args": ["/mnt/data/dev/projects/MCSManager/mcp-server/dist/index.js"],
  "env": {
    "MCSM_API_URL": "http://192.168.9.121:23333",
    "MCSM_API_KEY": "your_api_key_here"
  }
}'
```

**重要提示**：
- 使用前端面板地址（默认端口 `23333`）
- API Key 从面板用户设置中生成
- 参考：[MCSManager API 文档](https://docs.mcsmanager.com/zh_cn/apis/get_apikey.html)

#### 方法 2：使用开发模式（使用 tsx）

```bash
iflow mcp add-json -s user 'mcsmanager' '{
  "command": "npx",
  "args": ["-y", "tsx", "/mnt/data/dev/projects/MCSManager/mcp-server/src/index.ts"],
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

**说明**：
- 使用前端面板的MCP远程连接地址（例如：`https://127.0.0.1:23333/mcp`）
- API Key 从面板用户设置中生成
- 通过HTTP头部传递认证信息

### 验证 MCP Server 是否安装成功

```bash
# 列出已安装的 MCP servers
iflow mcp list

# 查看 MCP server 详情
iflow mcp info mcsmanager
```

### 使用示例

安装完成后，您可以在 iFlow 中使用自然语言与 MCSManager 交互：

```
# 列出所有节点
"显示所有可用的节点"

# 列出某个节点上的实例
"列出 daemon-id 为 xxx 的所有实例"

# 获取实例信息
"获取实例 uuid 为 xxx 的详细信息"

# 启动实例
"启动实例 xxx"

# 查看实例日志
"显示实例 xxx 的日志"

# 创建备份
"为实例 xxx 创建备份"

# 列出文件
"显示实例 xxx 的根目录文件列表"

# 读取配置文件
"读取实例 xxx 的 server.properties 文件"
```

## Cursor AI 集成

在 Cursor 的 MCP 配置文件中添加（通常位于 `~/.cursor/mcp.json`）：

### 本地运行方式（需要本地安装MCP Server）

```json
{
  "mcpServers": {
    "mcsmanager": {
      "command": "node",
      "args": ["/mnt/data/dev/projects/MCSManager/mcp-server/dist/index.js"],
      "env": {
        "MCSM_API_URL": "http://192.168.9.121:23333",
        "MCSM_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### HTTP远程连接方式（推荐）

```json
{
  "mcpServers": {
    "mcsmanager": {
      "url": "http://127.0.0.1:3000/mcp",
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

## 开发和调试

### 开发模式运行

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### 监视模式（自动重新编译）

```bash
npm run watch
```

## 测试

项目包含完整的测试框架，支持测试本地调用（stdio）和远程调用（HTTP/SSE）。

### 快速测试

```bash
# 设置环境变量
export MCSM_API_KEY="your_api_key_here"
export MCSM_API_URL="http://192.168.9.121:23333"  # 可选

# 运行所有测试
npm test

# 或运行单独的测试
npm run test:stdio        # STDIO 模式测试
npm run test:http         # HTTP/SSE 模式测试
npm run test:integration  # 集成测试
```

### 测试套件

- **STDIO 模式测试** - 测试本地标准输入输出通信
- **HTTP/SSE 模式测试** - 测试远程 HTTP + Server-Sent Events 通信
- **集成测试** - 全面测试所有 22 个 MCP 工具

### 测试文档

详细的测试说明和故障排除，请参阅：
- [TEST_GUIDE.md](./TEST_GUIDE.md) - 完整测试指南
- [test/README.md](./test/README.md) - 测试套件说明

### 使用测试脚本

```bash
# 使用综合测试脚本
./test/run-all-tests.sh

# 或使用 npm 脚本
npm run test:all
```

## API 参考

### 获取 API Key

1. 登录 MCSManager 面板
2. 进入用户设置
3. 生成 API Key

### 获取 Daemon ID

通过 `list_nodes` 工具获取所有可用的守护进程节点 ID。

### 获取 Instance UUID

通过 `list_instances` 工具获取指定节点上的所有实例 UUID。

## 故障排除

### 连接失败

1. 检查 `MCSM_API_URL` 是否正确
2. 确认 MCSManager 服务正在运行
3. 验证网络连接是否正常

### 认证失败

1. 检查 `MCSM_API_KEY` 是否正确
2. 确认 API Key 是否已启用
3. 验证 API Key 权限是否足够

### 工具调用失败

1. 查看错误消息中的详细信息
2. 确认提供的参数格式正确
3. 检查实例状态是否允许该操作

## 许可证

Apache-2.0

## 相关链接

- [MCSManager 官方网站](https://mcsmanager.com/)
- [MCSManager 文档](https://docs.mcsmanager.com/)
- [Model Context Protocol 规范](https://modelcontextprotocol.io/)
- [iFlow 平台](https://platform.iflow.cn/)


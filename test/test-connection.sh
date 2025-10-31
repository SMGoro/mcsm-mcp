#!/bin/bash

# MCSManager MCP Server 连接测试脚本

echo "=========================================="
echo "MCSManager MCP Server 连接测试"
echo "=========================================="
echo ""

# 检查环境变量
if [ -z "$MCSM_API_URL" ]; then
    echo "❌ 错误: MCSM_API_URL 环境变量未设置"
    echo "请设置: export MCSM_API_URL=http://192.168.9.121:23333"
    echo "注意：使用前端面板地址（端口 23333），不是后端端口（24444）"
    exit 1
fi

if [ -z "$MCSM_API_KEY" ]; then
    echo "❌ 错误: MCSM_API_KEY 环境变量未设置"
    echo "请设置: export MCSM_API_KEY=your_api_key"
    echo "获取方式：登录面板 → 用户设置 → API 密钥"
    exit 1
fi

echo "✓ 环境变量已设置"
echo "  MCSM_API_URL: $MCSM_API_URL"
echo "  MCSM_API_KEY: ${MCSM_API_KEY:0:8}***"
echo ""

# 测试 MCSManager API 连接
echo "测试 MCSManager API 连接..."
STATUS_RESPONSE=$(curl -s -w "\n%{http_code}" "$MCSM_API_URL/api/auth/status")
HTTP_CODE=$(echo "$STATUS_RESPONSE" | tail -n1)
BODY=$(echo "$STATUS_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ MCSManager API 连接成功"
    echo "  响应: $BODY"
else
    echo "❌ MCSManager API 连接失败"
    echo "  HTTP 状态码: $HTTP_CODE"
    echo "  响应: $BODY"
    exit 1
fi
echo ""

# 测试 API Key 认证（使用 URL 参数方式）
echo "测试 API Key 认证..."
AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -H "X-Requested-With: XMLHttpRequest" -H "Content-Type: application/json; charset=utf-8" "$MCSM_API_URL/api/service/remote_services_list?apikey=$MCSM_API_KEY")
HTTP_CODE=$(echo "$AUTH_RESPONSE" | tail -n1)
BODY=$(echo "$AUTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ API Key 认证成功"
    echo "  节点列表获取成功"
else
    echo "❌ API Key 认证失败"
    echo "  HTTP 状态码: $HTTP_CODE"
    echo "  响应: $BODY"
    echo ""
    echo "🔧 故障排除步骤："
    echo "  1. 检查 API Key 是否正确："
    echo "     - 登录 MCSManager 面板: $MCSM_API_URL"
    echo "     - 点击右上角用户头像"
    echo "     - 选择 '用户设置'"
    echo "     - 找到 'API 密钥' 部分"
    echo "     - 复制生成的密钥"
    echo "  2. 检查 API Key 权限："
    echo "     - 确保 API Key 有足够的权限"
    echo "     - 检查用户角色是否允许 API 访问"
    echo "  3. 检查网络连接："
    echo "     - 确保可以访问 MCSManager 面板"
    echo "     - 检查防火墙设置"
    exit 1
fi
echo ""

# 检查 Node.js
echo "检查 Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js 已安装: $NODE_VERSION"
else
    echo "❌ Node.js 未安装"
    exit 1
fi
echo ""

# 检查 MCP Server 构建
echo "检查 MCP Server 构建..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ -f "$SCRIPT_DIR/dist/index.js" ]; then
    echo "✓ MCP Server 已构建"
else
    echo "⚠ MCP Server 未构建，正在构建..."
    cd "$SCRIPT_DIR" && npm run build
    if [ $? -eq 0 ]; then
        echo "✓ MCP Server 构建成功"
    else
        echo "❌ MCP Server 构建失败"
        exit 1
    fi
fi
echo ""

echo "=========================================="
echo "✅ 所有测试通过！"
echo "=========================================="
echo ""
echo "您现在可以使用以下命令添加 MCP Server 到 iFlow："
echo ""
echo "iflow mcp add-json -s user 'mcsmanager' '{"
echo "  \"command\": \"node\","
echo "  \"args\": [\"$SCRIPT_DIR/dist/index.js\"],"
echo "  \"env\": {"
echo "    \"MCSM_API_URL\": \"$MCSM_API_URL\","
echo "    \"MCSM_API_KEY\": \"$MCSM_API_KEY\""
echo "  }"
echo "}'"
echo ""


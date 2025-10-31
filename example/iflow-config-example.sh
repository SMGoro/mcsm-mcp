#!/bin/bash

# MCSManager MCP Server - iFlow 配置示例脚本
# 此脚本提供了多种配置 MCP Server 的方式

echo "=========================================="
echo "MCSManager MCP Server - iFlow 配置助手"
echo "=========================================="
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 默认配置（使用前端面板地址）
DEFAULT_API_URL="http://192.168.9.121:23333"
DEFAULT_API_KEY="your_api_key_here"

# 读取用户输入
echo "请输入 MCSManager API 配置信息"
echo ""

read -p "API URL [默认: $DEFAULT_API_URL]: " API_URL
API_URL=${API_URL:-$DEFAULT_API_URL}

read -p "API Key [默认: $DEFAULT_API_KEY]: " API_KEY
API_KEY=${API_KEY:-$DEFAULT_API_KEY}

echo ""
echo "配置信息："
echo "  API URL: $API_URL"
echo "  API Key: ${API_KEY}***"
echo ""

# 选择配置方式
echo "请选择配置方式："
echo "1) 生产模式 (使用编译后的 JS)"
echo "2) 开发模式 (使用 tsx 直接运行 TS)"
echo "3) 仅显示配置命令 (不执行)"
echo ""

read -p "请选择 [1-3]: " CHOICE

case $CHOICE in
    1)
        echo ""
        echo "正在添加 MCP Server (生产模式)..."
        iflow mcp add-json -s user 'mcsmanager' "{
  \"command\": \"node\",
  \"args\": [\"$SCRIPT_DIR/dist/index.js\"],
  \"env\": {
    \"MCSM_API_URL\": \"$API_URL\",
    \"MCSM_API_KEY\": \"$API_KEY\"
  }
}"
        ;;
    2)
        echo ""
        echo "正在添加 MCP Server (开发模式)..."
        iflow mcp add-json -s user 'mcsmanager-dev' "{
  \"command\": \"npx\",
  \"args\": [\"-y\", \"tsx\", \"$SCRIPT_DIR/src/index.ts\"],
  \"env\": {
    \"MCSM_API_URL\": \"$API_URL\",
    \"MCSM_API_KEY\": \"$API_KEY\"
  }
}"
        ;;
    3)
        echo ""
        echo "=== 生产模式配置命令 ==="
        echo "iflow mcp add-json -s user 'mcsmanager' '{"
        echo "  \"command\": \"node\","
        echo "  \"args\": [\"$SCRIPT_DIR/dist/index.js\"],"
        echo "  \"env\": {"
        echo "    \"MCSM_API_URL\": \"$API_URL\","
        echo "    \"MCSM_API_KEY\": \"$API_KEY\""
        echo "  }"
        echo "}'"
        echo ""
        echo "=== 开发模式配置命令 ==="
        echo "iflow mcp add-json -s user 'mcsmanager-dev' '{"
        echo "  \"command\": \"npx\","
        echo "  \"args\": [\"-y\", \"tsx\", \"$SCRIPT_DIR/src/index.ts\"],"
        echo "  \"env\": {"
        echo "    \"MCSM_API_URL\": \"$API_URL\","
        echo "    \"MCSM_API_KEY\": \"$API_KEY\""
        echo "  }"
        echo "}'"
        exit 0
        ;;
    *)
        echo "无效的选择"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ MCP Server 配置成功！"
    echo ""
    echo "验证安装："
    echo "  iflow mcp list"
    echo ""
    echo "测试连接："
    echo "  iflow chat \"显示所有可用的节点\""
    echo ""
else
    echo ""
    echo "❌ 配置失败，请检查错误信息"
    exit 1
fi


#!/bin/bash

# 示例：如何使用 list-all-instances.js 脚本

echo "MCSManager 实例查看脚本使用示例"
echo "================================"

echo ""
echo "1. 基本用法（需要设置 API 密钥）："
echo "   MCSM_API_KEY=your_api_key_here node list-all-instances.js"

echo ""
echo "2. 指定 MCSManager 地址："
echo "   MCSM_API_URL=http://your-mcsm:23333 MCSM_API_KEY=your_api_key_here node list-all-instances.js"

echo ""
echo "3. 在命令行中临时设置环境变量："
echo "   export MCSM_API_URL=http://your-mcsm:23333"
echo "   export MCSM_API_KEY=your_api_key_here"
echo "   node list-all-instances.js"

echo ""
echo "获取 API 密钥的方法："
echo "1. 登录到 MCSManager Web 界面"
echo "2. 进入'用户设置'"
echo "3. 找到'API 密钥'部分"
echo "4. 复制你的 API 密钥"
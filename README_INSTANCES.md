# 查看所有 MCSManager 实例

这个简单的脚本可以列出所有 MCSManager 节点上的实例。

## 使用方法

```bash
# 设置环境变量并运行脚本
MCSM_API_KEY=your_api_key_here node list-all-instances.js

# 或者指定 MCSManager 地址
MCSM_API_URL=http://your-mcsm:23333 MCSM_API_KEY=your_api_key_here node list-all-instances.js
```

## 获取 API Key

1. 登录到 MCSManager Web 界面
2. 进入"用户设置"
3. 找到"API 密钥"部分
4. 复制你的 API 密钥

## 环境变量

- `MCSM_API_KEY` (必需) - 你的 MCSManager API 密钥
- `MCSM_API_URL` (可选) - MCSManager API 地址，默认为 `http://localhost:23333`
# Koa LLM API 服务

![Node.js](https://img.shields.io/badge/Node.js-%3E%3D%2016.0-green.svg)
![Koa](https://img.shields.io/badge/Koa-2.15.0-blue.svg)
![Ollama](https://img.shields.io/badge/Ollama-Compatible-yellow.svg)

这是一个基于 Koa.js 构建的 LLM API 服务，用于连接本地部署的 Ollama 服务，提供统一的 RESTful API 接口供前端或其他客户端调用。

## ✨ 功能特性

- 🔄 连接本地 Ollama 服务，支持 DeepSeek、Qwen 等模型
- 📋 获取可用模型列表
- 📝 文本生成（支持普通和流式输出）
- 💬 聊天对话功能
- 📊 模型信息查询
- 🚦 健康检查接口
- 🔌 完整的错误处理和参数验证
- 🌐 支持 CORS 跨域访问
- 🎨 提供美观的测试前端界面

## 📁 项目结构

```
aidemo/
├── server.js          # Koa 应用入口文件
├── routes/
│   └── llmRoutes.js   # LLM API 路由定义
├── services/
│   └── ollamaService.js # Ollama 服务客户端
├── .env               # 环境配置文件
├── package.json       # 项目配置和依赖
├── index.html         # 测试前端界面
└── README.md          # 项目说明文档
```

## 🛠️ 安装配置

### 前置要求

- Node.js >= 16.0
- npm 或 yarn
- 本地已安装并运行 Ollama 服务

### Ollama 安装与配置

#### Windows 系统安装步骤

1. **下载 Ollama 安装包**
   - 访问 [Ollama 官方网站](https://ollama.com/download/windows)
   - 下载 Windows 版本安装包

2. **安装 Ollama**
   - 双击下载的安装包启动安装向导
   - 按照提示完成安装（默认安装路径：`C:\Program Files\Ollama`）
   - 安装完成后，Ollama 服务会自动启动

3. **下载模型**
   - 打开命令提示符（CMD）或 PowerShell
   - 下载推荐的模型（例如 DeepSeek-Coder）：
   ```bash
   ollama pull deepseek-coder
   ```
   - 或者下载其他模型：
   ```bash
   ollama pull qwen
   ollama pull llama2
   ```

4. **验证 Ollama 服务状态**
   - 访问 http://localhost:11434 查看 Ollama API 是否正常运行
   - 或在命令行中运行：
   ```bash
   ollama list
   ```
   - 如果看到已下载的模型列表，则表示 Ollama 服务运行正常

#### 手动启动 Ollama 服务

如果 Ollama 服务未自动启动，可以手动启动：

1. **通过开始菜单启动**
   - 在开始菜单中搜索并点击 "Ollama"

2. **通过命令行启动**
   ```bash
   # 使用管理员权限打开命令提示符或 PowerShell
   "C:\Program Files\Ollama\ollama.exe" serve
   ```

3. **停止 Ollama 服务**
   - 可以在任务管理器中结束 "ollama.exe" 进程
   - 或使用命令行：
   ```bash
   taskkill /IM ollama.exe /F
   ```

#### 常见问题排查

- **端口占用问题**：如果 11434 端口被占用，可以修改 Ollama 配置或关闭占用该端口的应用
- **模型下载失败**：检查网络连接，确保防火墙允许 Ollama 访问互联网
- **内存不足**：某些大型模型可能需要较多内存，请确保系统有足够的可用内存

### 安装步骤

1. **克隆项目**

```bash
# 直接使用当前目录
cd e:\前端\项目\aidemo
```

2. **安装依赖**

```bash
npm install
```

3. **配置环境变量**

创建或编辑 `.env` 文件：

```env
# Ollama 服务配置
OLLAMA_URL=http://localhost:11434
DEFAULT_MODEL=deepseek-coder

# 服务器配置
PORT=3000
NODE_ENV=development
```

## 🚀 启动服务

```bash
# 生产环境启动
npm start

# 开发环境启动（当前等同于 npm start）
npm run dev
```

服务启动后，可访问以下地址：
- **服务地址**: http://localhost:3000
- **健康检查**: http://localhost:3000/health
- **测试界面**: 直接在浏览器中打开 `index.html`

## 📡 API 接口文档

### 1. 获取模型列表

```bash
GET /api/llm/models
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "name": "deepseek-coder",
      "model": "deepseek-coder",
      "modified_at": "2024-01-01T00:00:00.000Z",
      "size": 4294967296,
      "digest": "abcdef1234567890..."
    }
  ]
}
```

### 2. 生成文本

```bash
POST /api/llm/generate
Content-Type: application/json

{
  "prompt": "请解释什么是人工智能？",
  "model": "deepseek-coder",
  "options": {
    "temperature": 0.7,
    "maxTokens": 1024
  }
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "text": "人工智能（Artificial Intelligence，简称AI）是计算机科学的一个分支..."
  }
}
```

### 3. 流式生成文本

```bash
POST /api/llm/stream
Content-Type: application/json

{
  "prompt": "编写一个简单的JavaScript函数",
  "model": "deepseek-coder"
}
```

**响应类型**: `text/event-stream`

### 4. 聊天对话

```bash
POST /api/llm/chat
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "你好" }
  ],
  "model": "deepseek-coder"
}
```

### 5. 获取模型信息

```bash
GET /api/llm/models/:model
```

### 6. 健康检查

```bash
GET /health
```

## 🎯 前端测试界面

项目提供了一个基于 HTML + Tailwind CSS 的测试界面，具有以下功能：

- 📱 响应式设计，支持移动端和桌面端
- 🎨 现代化 UI 界面，玻璃态效果
- ⚙️ 可配置模型和生成参数
- 💬 交互式聊天界面
- 🔍 实时显示 API 连接状态
- 📚 API 使用说明文档

直接在浏览器中打开 `index.html` 即可使用。

## ⚙️ 核心配置项

### 环境变量

| 变量名 | 说明 | 默认值 | 示例 |
|-------|------|-------|------|
| OLLAMA_URL | Ollama 服务地址 | http://localhost:11434 | http://localhost:11434 |
| DEFAULT_MODEL | 默认使用的模型 | deepseek-coder | qwen, llama2 |
| PORT | 服务端口号 | 3000 | 8080 |
| NODE_ENV | 运行环境 | development | production |

### 模型参数选项

- **temperature**: 控制生成文本的随机性 (0.0-2.0)
- **maxTokens**: 最大生成 token 数量
- **stop**: 停止生成的关键词列表
- **top_p**: 控制采样空间大小
- **top_k**: 控制词汇表截断大小

## 🔧 错误处理

所有 API 接口返回统一的响应格式：

```json
// 成功响应
{
  "success": true,
  "data": { /* 响应数据 */ }
}

// 错误响应
{
  "success": false,
  "error": "错误信息",
  "code": "错误码（可选）"
}
```

## 📈 性能优化

- 使用流式响应提升用户体验
- 请求参数验证，防止无效请求
- 统一错误处理，确保服务稳定性
- CORS 配置，支持跨域请求

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。详情请查看 [LICENSE](LICENSE) 文件。

## 📧 联系方式

如有问题或建议，请通过以下方式联系：

- 项目地址: e:\前端\项目\aidemo

---

Made with ❤️ Koa.js + Ollama
const Router = require('koa-router');
const ollamaService = require('../services/ollamaService');

const router = new Router();

/**
 * 获取可用的LLM模型列表
 * @route GET /api/llm/models
 * @summary 获取所有已部署的Ollama模型
 * @returns {Object} 包含模型列表的响应
 */
router.get('/models', async (ctx) => {
  try {
    const models = await ollamaService.listModels();
    ctx.body = {
      success: true,
      data: models,
      count: models.length
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

/**
 * 生成文本响应
 * @route POST /api/llm/generate
 * @summary 使用指定模型生成文本响应
 * @param {Object} ctx.request.body - 请求体
 * @param {string} ctx.request.body.prompt - 提示词
 * @param {string} ctx.request.body.model - 模型名称（可选）
 * @param {Object} ctx.request.body.options - 生成选项（可选）
 * @returns {Object} 生成的文本响应
 */
router.post('/generate', async (ctx) => {
  try {
    const { prompt, model, options = {} } = ctx.request.body;

    // 验证必要参数
    if (!prompt || typeof prompt !== 'string') {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'Prompt is required and must be a string'
      };
      return;
    }

    const result = await ollamaService.generateText(prompt, model, options);
    ctx.body = {
      success: true,
      data: {
        text: result.text,
        model: result.model
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

/**
 * 流式生成文本响应
 * @route POST /api/llm/stream
 * @summary 使用指定模型流式生成文本响应
 * @param {Object} ctx.request.body - 请求体
 * @param {string} ctx.request.body.prompt - 提示词
 * @param {string} ctx.request.body.model - 模型名称（可选）
 * @param {Object} ctx.request.body.options - 生成选项（可选）
 * @returns {Stream} 流式文本响应
 */
router.post('/stream', async (ctx) => {
  try {
    const { prompt, model, options = {} } = ctx.request.body;

    // 验证必要参数
    if (!prompt || typeof prompt !== 'string') {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'Prompt is required and must be a string'
      };
      return;
    }

    // 设置响应头，支持SSE（Server-Sent Events）
    ctx.set('Content-Type', 'text/event-stream');
    ctx.set('Cache-Control', 'no-cache');
    ctx.set('Connection', 'keep-alive');

    // 处理客户端断开连接
    const onClose = () => {
      console.log('Client disconnected');
      ctx.res.end();
    };

    ctx.req.on('close', onClose);

    // 使用流式API生成文本
    let fullResponse = '';
    await ollamaService.generateTextStream(
      prompt,
      model,
      options,
      (chunk, done) => {
        fullResponse += chunk;
        // 发送SSE格式的数据
        ctx.res.write(`data: ${JSON.stringify({ chunk, done })}\n\n`);
      }
    );

    // 发送完成事件
    ctx.res.write(`event: done\ndata: ${JSON.stringify({ text: fullResponse })}\n\n`);
    ctx.res.end();
    
    // 清理事件监听器
    ctx.req.off('close', onClose);
  } catch (error) {
    console.error('Stream generation error:', error);
    // 尝试发送错误信息
    try {
      ctx.res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
      ctx.res.end();
    } catch (writeError) {
      console.error('Failed to send error response:', writeError);
    }
  }
});

/**
 * 获取特定模型的信息
 * @route GET /api/llm/models/:model
 * @summary 获取指定模型的详细信息
 * @param {string} ctx.params.model - 模型名称
 * @returns {Object} 模型信息
 */
router.get('/models/:model', async (ctx) => {
  try {
    const { model } = ctx.params;
    const modelInfo = await ollamaService.getModelInfo(model);

    if (!modelInfo) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        error: `Model '${model}' not found`
      };
      return;
    }

    ctx.body = {
      success: true,
      data: modelInfo
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

/**
 * 检查Ollama服务连接状态
 * @route GET /api/llm/health
 * @summary 检查与Ollama服务的连接是否正常
 * @returns {Object} 连接状态
 */
router.get('/health', async (ctx) => {
  try {
    const isHealthy = await ollamaService.checkHealth();
    
    if (isHealthy) {
      ctx.body = {
        success: true,
        message: 'Connected to Ollama service',
        ollamaUrl: process.env.OLLAMA_URL
      };
    } else {
      ctx.status = 503;
      ctx.body = {
        success: false,
        error: 'Cannot connect to Ollama service',
        ollamaUrl: process.env.OLLAMA_URL
      };
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

/**
 * 聊天API
 * @route POST /api/llm/chat
 * @summary 提供聊天功能，支持多轮对话
 * @param {Object} ctx.request.body - 请求体
 * @param {Array} ctx.request.body.messages - 消息历史
 * @param {string} ctx.request.body.model - 模型名称（可选）
 * @param {Object} ctx.request.body.options - 生成选项（可选）
 * @returns {Object} 聊天响应
 */
router.post('/chat', async (ctx) => {
  try {
    const { messages, model, options = {} } = ctx.request.body;

    // 验证必要参数
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'Messages array is required and must not be empty'
      };
      return;
    }

    // 构建聊天提示词
    const chatPrompt = messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    // 调用生成文本API
    const result = await ollamaService.generateText(chatPrompt, model, options);
    
    ctx.body = {
      success: true,
      data: {
        role: 'assistant',
        content: result.text,
        model: result.model
      }
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

module.exports = router;
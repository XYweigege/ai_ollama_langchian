const Koa = require('koa');
const Router = require('koa-router');
const { koaBody } = require('koa-body');
const serve = require('koa-static');
const path = require('path');
// const cors = require('cors'); // Express版本的cors，Koa不兼容
require('dotenv').config();

// 初始化Koa应用
const app = new Koa();
const router = new Router();

// 加载路由
const llmRoutes = require('./routes/llmRoutes');

// 配置中间件 - 自定义CORS中间件
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (ctx.method === 'OPTIONS') {
    ctx.status = 204;
    return;
  }
  
  await next();
});
// 配置静态文件服务中间件
app.use(serve(path.join(__dirname, 'public')));

app.use(koaBody({
  multipart: true,
  jsonLimit: '10mb',
  formLimit: '10mb'
}));

// 健康检查路由
router.get('/health', (ctx) => {
  ctx.body = {
    status: 'ok',
    message: 'Koa LLM Service is running',
    timestamp: new Date().toISOString()
  };
});

// 注册LLM相关路由
router.use('/api/llm', llmRoutes.routes());

// 注册路由到应用
app.use(router.routes());
app.use(router.allowedMethods());

// 错误处理中间件
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    console.error('Server error:', error);
    ctx.status = error.status || 500;
    ctx.body = {
      error: {
        message: error.message || 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    };
  }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Koa LLM Service is running on http://localhost:${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});
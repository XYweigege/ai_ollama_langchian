const axios = require('axios');

/**
 * Ollama服务客户端类
 * 负责与本地Ollama服务进行通信，调用LLM模型
 */
class OllamaService {
  constructor() {
    this.baseURL = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.defaultModel = process.env.DEFAULT_MODEL || 'deepseek-coder';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 60000, // 60秒超时
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * 获取可用的模型列表
   * @returns {Promise<Array>} 模型列表
   */
  async listModels() {
    try {
      const response = await this.client.get('/api/tags');
      return response.data.models || [];
    } catch (error) {
      console.error('Error listing models:', error.message);
      throw new Error(`Failed to list models: ${error.message}`);
    }
  }

  /**
   * 生成文本响应
   * @param {string} prompt - 提示词
   * @param {string} model - 模型名称，默认为配置的默认模型
   * @param {Object} options - 可选参数
   * @returns {Promise<Object>} 生成的响应
   */
  async generateText(prompt, model = this.defaultModel, options = {}) {
    try {
      const requestData = {
        model,
        prompt,
        stream: options.stream || false,
        options: {
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 1024,
          ...options
        }
      };

      const response = await this.client.post('/api/generate', requestData);
      return {
        text: response.data.response || '',
        model: response.data.model,
        done: response.data.done
      };
    } catch (error) {
      console.error('Error generating text:', error.message);
      throw new Error(`Failed to generate text: ${error.message}`);
    }
  }

  /**
   * 流式生成文本响应
   * @param {string} prompt - 提示词
   * @param {string} model - 模型名称
   * @param {Object} options - 可选参数
   * @param {Function} onChunk - 每收到一块数据时的回调函数
   * @returns {Promise<string>} 完整的响应文本
   */
  async generateTextStream(prompt, model = this.defaultModel, options = {}, onChunk) {
    try {
      const requestData = {
        model,
        prompt,
        stream: true,
        options: {
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 1024,
          ...options
        }
      };

      // 使用流式请求
      const response = await this.client.post('/api/generate', requestData, {
        responseType: 'stream',
        timeout: 0 // 流式请求不设置超时
      });

      return new Promise((resolve, reject) => {
        let fullResponse = '';
        let isDone = false;

        response.data.on('data', (chunk) => {
          const chunkData = chunk.toString('utf8');
          // 处理流式响应，Ollama的流式响应是每行一个JSON对象
          const lines = chunkData.split('\n');
          
          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);
                const text = data.response || '';
                fullResponse += text;
                
                if (onChunk && typeof onChunk === 'function') {
                  onChunk(text, data.done);
                }
                
                if (data.done) {
                  isDone = true;
                  resolve(fullResponse);
                }
              } catch (parseError) {
                console.error('Error parsing chunk:', parseError);
              }
            }
          }
        });

        response.data.on('end', () => {
          if (!isDone) {
            resolve(fullResponse);
          }
        });

        response.data.on('error', (error) => {
          console.error('Stream error:', error);
          reject(new Error(`Stream failed: ${error.message}`));
        });
      });
    } catch (error) {
      console.error('Error setting up text stream:', error.message);
      throw new Error(`Failed to set up text stream: ${error.message}`);
    }
  }

  /**
   * 获取模型信息
   * @param {string} model - 模型名称
   * @returns {Promise<Object>} 模型信息
   */
  async getModelInfo(model) {
    try {
      const models = await this.listModels();
      return models.find(m => m.name === model) || null;
    } catch (error) {
      console.error('Error getting model info:', error.message);
      throw new Error(`Failed to get model info: ${error.message}`);
    }
  }

  /**
   * 检查Ollama服务是否可用
   * @returns {Promise<boolean>} 服务是否可用
   */
  async checkHealth() {
    try {
      await this.client.get('/');
      return true;
    } catch {
      return false;
    }
  }
}

// 导出单例实例
module.exports = new OllamaService();
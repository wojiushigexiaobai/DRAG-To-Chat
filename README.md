# DRAG to chat robot

这是一个基于RAG (Retrieval Augmented Generation) 技术的智能客服机器人Web应用。用户可以上传文档（PDF、Word或Markdown），然后机器人可以根据这些文档内容回答用户的问题。

## 功能特点

- 支持PDF、DOCX和Markdown文件上传
- 基于用户上传的文档进行知识检索和回答
- 美观的用户界面，支持实时聊天
- 使用LangChain和FAISS向量数据库实现高效检索
- 基于会话ID的用户隔离，确保数据安全
- 使用Groq API提供大语言模型支持
- 使用HuggingFace的Sentence Transformers作为嵌入模型

## 技术栈

### 后端
- FastAPI - 高性能Web框架
- LangChain - RAG实现
- FAISS - 向量检索
- Groq - 提供语言模型支持
- HuggingFace Sentence Transformers - 文本嵌入
- PyPDF2, python-docx, markdown - 文档解析
- python-dotenv - 环境变量管理

### 前端
- React - 用户界面
- Material-UI - UI组件库
- Axios - HTTP客户端
- React-Dropzone - 文件上传
- React-Markdown - Markdown渲染

## 安装步骤

### 后端

1. 确保您已安装Python 3.8+
2. 安装依赖:

```bash
pip install -r requirements.txt
```

3. 配置环境变量:
   - 复制`.env.example`文件为`.env`
   - 在`.env`文件中设置您的Groq API密钥

   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```

   或者，您也可以直接在系统环境变量中设置:

   ```bash
   # Linux/Mac
   export GROQ_API_KEY=your_groq_api_key_here
   
   # Windows PowerShell
   $env:GROQ_API_KEY="your_groq_api_key_here"
   
   # Windows CMD
   set GROQ_API_KEY=your_groq_api_key_here
   ```

4. 启动后端服务器:

```bash
cd cursorassistant/1000myweb
# python backend.py
使用终端开启uvicorn服务
uvicorn backend:app --reload
```

服务器将在http://localhost:8000运行

### 前端

1. 确保您已安装Node.js和npm
2. 安装依赖:

```bash
cd cursorassistant/1000myweb/frontend
npm install
```

3. 启动开发服务器:

```bash
npm start
```

前端将在http://localhost:3000运行

## 使用方法

1. 打开浏览器访问http://localhost:3000
2. 点击上传区域或拖放文件上传文档(PDF, DOCX或Markdown)
3. 文档处理完成后，在聊天界面输入问题
4. 系统会基于上传的文档内容回答您的问题

## 关于技术选择

### Groq
[Groq](https://groq.com/)是一个提供大语言模型API的服务，具有以下特点：
- 高速推理能力，提供极快的响应速度
- 支持流行的开源模型如Llama 2和Mixtral
- 简单易用的API，类似于OpenAI的接口设计
- 提供免费额度和合理的计费模式

您可以在[Groq官网](https://groq.com/)注册并获取API密钥。

### HuggingFace嵌入模型
本项目使用HuggingFace的Sentence Transformers作为嵌入模型：
- 开源且免费使用
- 本地运行，不需要额外API密钥
- 提供高质量的文本嵌入表示
- 默认使用的是all-MiniLM-L6-v2模型，体积小但效果好

## 安全说明

- API密钥保存在`.env`文件或环境变量中，不会被硬编码在代码中
- `.env`文件应该添加到`.gitignore`中，防止意外提交到版本控制系统
- 上传的文档会临时存储并处理，不会永久保存
- 每个用户会话使用唯一的会话ID进行隔离

## 注意事项

- 您需要提供自己的Groq API密钥
- 较大的文档处理时间可能会更长
- 默认使用的是llama2-70b-4096模型，您可以在`.env`文件中修改为其他Groq支持的模型
- 嵌入模型使用的是HuggingFace的Sentence Transformers，首次运行时会下载模型文件

## 未来改进计划

- 支持更多文档格式
- 添加持久化存储
- 实现多文档上传和管理
- 优化检索算法提高回答准确性
- 添加用户认证系统 

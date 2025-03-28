from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import shutil
import uuid
from pathlib import Path
import tempfile
import uvicorn

# RAG相关库
import PyPDF2
import docx
import markdown
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from dotenv import load_dotenv

from langchain.chat_models import init_chat_model

# model = init_chat_model("llama3-8b-8192", model_provider="groq")

# 加载环境变量
load_dotenv()

# 创建FastAPI应用
app = FastAPI(title="RAG智能客服机器人")

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 配置文件存储
UPLOAD_DIR = Path("./uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# 获取Groq API密钥（从环境变量中获取，而非硬编码）
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    print("警告：未设置GROQ_API_KEY环境变量，请确保在.env文件中或环境变量中设置它")

# 定义模型名称
groq_llm_model = os.getenv("GROQ_LLM_MODEL", "llama3-8b-8192")
# 定义embedding模型
embedding_model_name = os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")

# 存储用户知识库的字典
user_knowledge_bases = {}

# 定义请求和响应模型
class ChatRequest(BaseModel):
    session_id: str
    query: str

class ChatResponse(BaseModel):
    answer: str

class UploadResponse(BaseModel):
    session_id: str
    message: str

# 从PDF中提取文本
def extract_text_from_pdf(file_path):
    text = ""
    with open(file_path, "rb") as file:
        pdf_reader = PyPDF2.PdfReader(file)
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
    return text

# 从Word文档中提取文本
def extract_text_from_docx(file_path):
    doc = docx.Document(file_path)
    text = ""
    for para in doc.paragraphs:
        text += para.text + "\n"
    return text

# 从Markdown中提取文本
def extract_text_from_markdown(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        text = file.read()
    html = markdown.markdown(text)
    # 简单移除HTML标签
    text = html.replace("<p>", "").replace("</p>", "\n")
    text = text.replace("<h1>", "").replace("</h1>", "\n")
    text = text.replace("<h2>", "").replace("</h2>", "\n")
    text = text.replace("<h3>", "").replace("</h3>", "\n")
    text = text.replace("<h4>", "").replace("</h4>", "\n")
    text = text.replace("<h5>", "").replace("</h5>", "\n")
    text = text.replace("<h6>", "").replace("</h6>", "\n")
    text = text.replace("<ul>", "").replace("</ul>", "\n")
    text = text.replace("<li>", "- ").replace("</li>", "\n")
    return text

# 创建知识库
def create_knowledge_base(text):
    # 分割文本
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
    )
    chunks = text_splitter.split_text(text)
    
    # 创建嵌入和向量存储 - 使用HuggingFace的嵌入模型
    embeddings = HuggingFaceEmbeddings(model_name=embedding_model_name)
    knowledge_base = FAISS.from_texts(chunks, embeddings)
    
    return knowledge_base

# 文件上传端点
@app.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    # 生成会话ID
    session_id = str(uuid.uuid4())
    
    # 创建临时文件
    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        # 将上传的文件保存到临时文件
        shutil.copyfileobj(file.file, temp_file)
        temp_file_path = temp_file.name
    
    try:
        # 根据文件类型提取文本
        file_extension = file.filename.split(".")[-1].lower()
        
        if file_extension == "pdf":
            text = extract_text_from_pdf(temp_file_path)
        elif file_extension == "docx":
            text = extract_text_from_docx(temp_file_path)
        elif file_extension in ["md", "markdown"]:
            text = extract_text_from_markdown(temp_file_path)
        else:
            raise HTTPException(status_code=400, detail="不支持的文件类型，请上传PDF、DOCX或Markdown文件")
        
        # 创建知识库
        knowledge_base = create_knowledge_base(text)
        
        # 存储知识库
        user_knowledge_bases[session_id] = {
            "knowledge_base": knowledge_base,
            "memory": ConversationBufferMemory(
                memory_key="chat_history",
                return_messages=True
            )
        }
        
        return {"session_id": session_id, "message": "文件已成功上传并处理"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"处理文件时出错: {str(e)}")
    
    finally:
        # 删除临时文件
        os.unlink(temp_file_path)

# 聊天端点
@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    session_id = request.session_id
    user_query = request.query
    
    # 检查会话ID是否存在
    if session_id not in user_knowledge_bases:
        raise HTTPException(status_code=404, detail="会话不存在，请先上传文档")
    
    try:
        # 获取知识库和记忆
        knowledge_base = user_knowledge_bases[session_id]["knowledge_base"]
        memory = user_knowledge_bases[session_id]["memory"]
        
        # 创建对话链
        llm = ChatGroq(
            groq_api_key=groq_api_key,
            model_name=groq_llm_model,
            temperature=0
        )
        retriever = knowledge_base.as_retriever(search_type="similarity", search_kwargs={"k": 3})
        chain = ConversationalRetrievalChain.from_llm(
            llm=llm,
            retriever=retriever,
            memory=memory
        )
        
        # 获取答案
        response = chain.invoke({"question": user_query})
        
        return {"answer": response["answer"]}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"处理查询时出错: {str(e)}")

# 主函数
if __name__ == "__main__":
    uvicorn.run("backend:app", host="0.0.0.0", port=8000, reload=True)

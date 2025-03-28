import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    List,
    ListItem,
    Avatar,
    IconButton
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import ReactMarkdown from 'react-markdown';

// API基础URL
const API_URL = 'http://localhost:8000';

/**
 * 消息对象结构
 * @typedef {Object} Message
 * @property {string} id - 消息ID
 * @property {string} content - 消息内容
 * @property {string} sender - 消息发送者（'user' 或 'bot'）
 */

/**
 * 聊天界面组件
 * 
 * @param {Object} props 组件属性
 * @param {string} props.sessionId 会话ID
 * @param {Function} props.onError 错误处理回调函数
 * @param {Function} props.onLoadingChange 加载状态变化回调函数
 * @returns {React.ReactElement} 聊天界面组件
 */
function ChatInterface({ sessionId, onError, onLoadingChange }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);

    /**
     * 当消息列表更新时滚动到底部
     */
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    /**
     * 将聊天界面滚动到底部
     */
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    /**
     * 处理表单提交
     * @param {Event} e - 表单提交事件
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!input.trim() || !sessionId) return;

        const userMessage = {
            id: Date.now().toString(),
            content: input,
            sender: 'user'
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsSending(true);
        onLoadingChange(true);

        try {
            const response = await axios.post(`${API_URL}/chat`, {
                session_id: sessionId,
                query: input
            });

            if (response.data && response.data.answer) {
                const botMessage = {
                    id: (Date.now() + 1).toString(),
                    content: response.data.answer,
                    sender: 'bot'
                };

                setMessages(prev => [...prev, botMessage]);
            } else {
                onError('无法获取回答，请重试');
            }
        } catch (error) {
            let errorMessage = '获取回答时出错';
            if (error.response && error.response.data && error.response.data.detail) {
                errorMessage = error.response.data.detail;
            }
            onError(errorMessage);
        } finally {
            setIsSending(false);
            onLoadingChange(false);
        }
    };

    /**
     * 处理输入变化
     * @param {Event} e - 输入变化事件
     */
    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    return (
        <Box className="chat-interface" display="flex" flexDirection="column" height="100%">
            <Typography variant="h6" gutterBottom>
                与文档对话
            </Typography>

            <Paper
                elevation={0}
                sx={{
                    flexGrow: 1,
                    mb: 2,
                    p: 2,
                    backgroundColor: '#f9f9f9',
                    overflowY: 'auto',
                    maxHeight: '400px',
                    borderRadius: '8px'
                }}
            >
                {messages.length === 0 ? (
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        height="100%"
                        opacity="0.7"
                    >
                        <SmartToyIcon sx={{ fontSize: 60, color: '#1976d2', mb: 2 }} />
                        <Typography variant="body1" color="textSecondary" align="center">
                            {sessionId
                                ? '你可以开始咨询你的文档内容了'
                                : '请先上传文档以开始对话'}
                        </Typography>
                    </Box>
                ) : (
                    <List>
                        {messages.map((message) => (
                            <ListItem
                                key={message.id}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start',
                                    mb: 1
                                }}
                            >
                                <Box
                                    display="flex"
                                    flexDirection={message.sender === 'user' ? 'row-reverse' : 'row'}
                                    alignItems="flex-start"
                                    maxWidth="80%"
                                >
                                    <Avatar
                                        sx={{
                                            bgcolor: message.sender === 'user' ? '#1976d2' : '#4caf50',
                                            m: 1
                                        }}
                                    >
                                        {message.sender === 'user' ? <PersonIcon /> : <SmartToyIcon />}
                                    </Avatar>

                                    <Paper
                                        sx={{
                                            p: 2,
                                            bgcolor: message.sender === 'user' ? '#e3f2fd' : 'white',
                                            borderRadius: '12px',
                                            maxWidth: '100%',
                                            wordBreak: 'break-word'
                                        }}
                                    >
                                        {message.sender === 'bot' ? (
                                            <ReactMarkdown>{message.content}</ReactMarkdown>
                                        ) : (
                                            <Typography>{message.content}</Typography>
                                        )}
                                    </Paper>
                                </Box>
                            </ListItem>
                        ))}
                        <div ref={messagesEndRef} />
                    </List>
                )}
            </Paper>

            <Box component="form" onSubmit={handleSubmit} display="flex">
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder={sessionId ? "输入你的问题..." : "请先上传文档以开始对话"}
                    value={input}
                    onChange={handleInputChange}
                    disabled={!sessionId || isSending}
                    sx={{ mr: 1 }}
                />
                <IconButton
                    color="primary"
                    type="submit"
                    disabled={!sessionId || !input.trim() || isSending}
                    sx={{
                        p: '10px',
                        backgroundColor: '#1976d2',
                        color: 'white',
                        '&:hover': {
                            backgroundColor: '#115293',
                        },
                        '&.Mui-disabled': {
                            backgroundColor: '#e0e0e0',
                            color: '#9e9e9e',
                        }
                    }}
                >
                    <SendIcon />
                </IconButton>
            </Box>
        </Box>
    );
}

export default ChatInterface; 
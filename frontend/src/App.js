import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Divider,
    CircularProgress
} from '@mui/material';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import './App.css';

/**
 * 应用程序主组件
 * @returns {React.ReactElement} 应用程序界面
 */
function App() {
    // 状态管理
    const [sessionId, setSessionId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploadStatus, setUploadStatus] = useState('');

    // 从localStorage加载会话ID
    useEffect(() => {
        const savedSessionId = localStorage.getItem('ragChatbotSessionId');
        if (savedSessionId) {
            setSessionId(savedSessionId);
            setUploadStatus('已加载文档，可以开始聊天');
        }
    }, []);

    /**
     * 处理文件上传成功
     * @param {string} newSessionId - 新的会话ID
     */
    const handleUploadSuccess = (newSessionId) => {
        setSessionId(newSessionId);
        localStorage.setItem('ragChatbotSessionId', newSessionId);
        setUploadStatus('文档上传成功，可以开始聊天');
        setError('');
    };

    /**
     * 处理文件上传错误
     * @param {string} errorMessage - 错误信息
     */
    const handleUploadError = (errorMessage) => {
        setError(errorMessage);
        setUploadStatus('');
    };

    /**
     * 处理加载状态更新
     * @param {boolean} loading - 加载状态
     */
    const handleLoadingChange = (loading) => {
        setIsLoading(loading);
    };

    return (
        <Container maxWidth="md" className="app-container">
            <Box my={4}>
                <Typography variant="h3" component="h1" align="center" gutterBottom>
                    智能客服机器人
                </Typography>
                <Typography variant="h6" align="center" color="textSecondary" paragraph>
                    上传文档，开始智能问答
                </Typography>
            </Box>

            <Paper elevation={3} className="main-content">
                <Box p={3}>
                    <FileUpload
                        onUploadSuccess={handleUploadSuccess}
                        onUploadError={handleUploadError}
                        onLoadingChange={handleLoadingChange}
                    />

                    {isLoading && (
                        <Box display="flex" justifyContent="center" my={3}>
                            <CircularProgress />
                        </Box>
                    )}

                    {error && (
                        <Typography color="error" align="center" gutterBottom>
                            {error}
                        </Typography>
                    )}

                    {uploadStatus && (
                        <Typography color="primary" align="center" gutterBottom>
                            {uploadStatus}
                        </Typography>
                    )}
                </Box>

                <Divider />

                <Box p={3}>
                    <ChatInterface
                        sessionId={sessionId}
                        onError={handleUploadError}
                        onLoadingChange={handleLoadingChange}
                    />
                </Box>
            </Paper>
        </Container>
    );
}

export default App; 
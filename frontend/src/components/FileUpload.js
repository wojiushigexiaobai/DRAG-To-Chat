import React, { useState } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import {
    Box,
    Button,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';

// API基础URL
const API_URL = 'http://localhost:8000';

/**
 * 文件上传组件
 * 
 * @param {Object} props 组件属性
 * @param {Function} props.onUploadSuccess 上传成功回调函数
 * @param {Function} props.onUploadError 上传错误回调函数
 * @param {Function} props.onLoadingChange 加载状态变化回调函数
 * @returns {React.ReactElement} 文件上传界面
 */
function FileUpload({ onUploadSuccess, onUploadError, onLoadingChange }) {
    const [selectedFile, setSelectedFile] = useState(null);

    /**
     * 处理文件拖放
     */
    const { getRootProps, getInputProps } = useDropzone({
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/markdown': ['.md', '.markdown']
        },
        multiple: false,
        onDrop: acceptedFiles => {
            if (acceptedFiles.length > 0) {
                setSelectedFile(acceptedFiles[0]);
            }
        }
    });

    /**
     * 清除选择的文件
     */
    const handleClearFile = () => {
        setSelectedFile(null);
    };

    /**
     * 处理文件上传
     */
    const handleUpload = async () => {
        if (!selectedFile) {
            onUploadError('请先选择文件');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            onLoadingChange(true);
            const response = await axios.post(`${API_URL}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data && response.data.session_id) {
                onUploadSuccess(response.data.session_id);
                setSelectedFile(null);
            } else {
                onUploadError('上传失败，请重试');
            }
        } catch (error) {
            let errorMessage = '上传文件时出错';
            if (error.response && error.response.data && error.response.data.detail) {
                errorMessage = error.response.data.detail;
            }
            onUploadError(errorMessage);
        } finally {
            onLoadingChange(false);
        }
    };

    return (
        <Box className="file-upload-container">
            <Paper
                {...getRootProps()}
                elevation={0}
                sx={{
                    border: '2px dashed #1976d2',
                    borderRadius: '8px',
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    mb: 2,
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    }
                }}
            >
                <input {...getInputProps()} />
                <CloudUploadIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                    拖放文件到这里，或点击选择文件
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    支持的文件类型: PDF, DOCX, Markdown
                </Typography>
            </Paper>

            {selectedFile && (
                <Box mb={2}>
                    <List>
                        <ListItem
                            secondaryAction={
                                <Button
                                    startIcon={<DeleteIcon />}
                                    color="error"
                                    onClick={handleClearFile}
                                >
                                    移除
                                </Button>
                            }
                        >
                            <ListItemIcon>
                                <DescriptionIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText
                                primary={selectedFile.name}
                                secondary={`${(selectedFile.size / 1024).toFixed(2)} KB`}
                            />
                        </ListItem>
                    </List>
                </Box>
            )}

            <Box display="flex" justifyContent="center">
                <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<CloudUploadIcon />}
                    onClick={handleUpload}
                    disabled={!selectedFile}
                >
                    上传文档
                </Button>
            </Box>
        </Box>
    );
}

export default FileUpload; 
import React, { useState, useRef } from 'react';
import { Upload as UploadIcon, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FileUpload = ({ onUploadSuccess, onUploadError }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (validateFile(droppedFile)) {
            setFile(droppedFile);
        }
    };

    const validateFile = (file) => {
        if (!file) return false;
        const ext = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls'].includes(ext)) {
            onUploadError('Only Excel files (.xlsx, .xls) are allowed');
            return false;
        }
        return true;
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (validateFile(selectedFile)) {
            setFile(selectedFile);
        }
    };

    const removeFile = () => {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('excelFile', file);
            // For now, we'll use a hardcoded user ID since we haven't implemented Auth
            // In a real app, this would come from the user's state
            formData.append('userId', '65a0b1c2d3e4f5a6b7c8d9e0');

            const { timetableService } = await import('../services/api');
            const data = await timetableService.uploadExcel(formData);
            onUploadSuccess(data);
        } catch (err) {
            onUploadError(err.response?.data?.error || 'Failed to upload file');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                {!file ? (
                    <motion.div
                        key="dropzone"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`glass p-12 text-center border-2 border-dashed cursor-pointer transition-all ${isDragging ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/20'
                            }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept=".xlsx,.xls"
                            className="hidden"
                        />
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
                            <UploadIcon className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-text-muted'}`} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Drop your FFCS Excel here</h3>
                        <p className="text-text-secondary mb-0">or click to browse from your device</p>
                        <p className="text-xs text-text-muted mt-4">Supported formats: .xlsx, .xls</p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="file-preview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="glass p-6"
                    >
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold truncate max-w-[200px] md:max-w-md">{file.name}</h4>
                                    <p className="text-sm text-text-muted">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>
                            <button
                                onClick={removeFile}
                                className="p-2 hover:bg-white/5 rounded-full transition-colors"
                                disabled={isUploading}
                            >
                                <X className="w-5 h-5 text-text-muted" />
                            </button>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="btn btn-primary flex-1"
                            >
                                {isUploading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Parsing Courses...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        Process File
                                    </>
                                )}
                            </button>
                            <button
                                onClick={removeFile}
                                disabled={isUploading}
                                className="btn btn-ghost"
                            >
                                Change File
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FileUpload;

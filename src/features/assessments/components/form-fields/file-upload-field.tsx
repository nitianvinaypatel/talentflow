import React, { useRef } from 'react';
import { Button } from '../../../../components/ui/button';
import { Upload, FileText, X } from 'lucide-react';
import type { FileUploadFieldProps } from '../../types/form';
import { validateFile } from '../../utils/form-validation';

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
    question,
    value,
    onChange,
    onBlur,
    error,
    disabled = false,
    required = false,
    accept,
    maxSize = 10 * 1024 * 1024, // 10MB default
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;

        if (file) {
            // Validate file
            const validationError = validateFile(file, maxSize, accept?.split(','));
            if (validationError) {
                // You might want to show this error through a toast or other mechanism
                console.error('File validation error:', validationError);
                return;
            }
        }

        onChange(file);
    };

    const handleRemoveFile = () => {
        onChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-3">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h4 className="font-medium text-sm leading-relaxed">
                        {question.title}
                        {required && <span className="text-destructive ml-1">*</span>}
                    </h4>
                    {question.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                            {question.description}
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-3">
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    onBlur={onBlur}
                    accept={accept}
                    disabled={disabled}
                    className="hidden"
                />

                {value ? (
                    <div className="border border-border rounded-md p-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">{value.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatFileSize(value.size)}
                                    </p>
                                </div>
                            </div>
                            {!disabled && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRemoveFile}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleButtonClick}
                        disabled={disabled}
                        className="w-full"
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                    </Button>
                )}

                <div className="mt-2 text-xs text-muted-foreground">
                    <p>File upload functionality (stub implementation)</p>
                    {accept && (
                        <p>Accepted formats: {accept}</p>
                    )}
                    <p>Maximum size: {formatFileSize(maxSize)}</p>
                </div>
            </div>

            {error && (
                <p className="text-destructive text-sm mt-2">{error}</p>
            )}
        </div>
    );
};
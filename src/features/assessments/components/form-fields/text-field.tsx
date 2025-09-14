import React from 'react';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import type { TextFieldProps } from '../../types/form';

export const TextField: React.FC<TextFieldProps> = ({
    question,
    value = '',
    onChange,
    onBlur,
    error,
    disabled = false,
    required = false,
    placeholder,
    maxLength,
}) => {
    const isLongText = question.type === 'long-text';

    // Get max length from validation rules if not provided
    const effectiveMaxLength = maxLength ||
        question.validation?.find(rule => rule.type === 'max-length')?.value;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange(e.target.value);
    };

    const getPlaceholder = () => {
        if (placeholder) return placeholder;
        return isLongText
            ? 'Enter your detailed response...'
            : 'Enter your answer...';
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

            {isLongText ? (
                <Textarea
                    value={value}
                    onChange={handleChange}
                    onBlur={onBlur}
                    placeholder={getPlaceholder()}
                    disabled={disabled}
                    rows={4}
                    maxLength={effectiveMaxLength}
                    className={error ? 'border-destructive' : ''}
                />
            ) : (
                <Input
                    value={value}
                    onChange={handleChange}
                    onBlur={onBlur}
                    placeholder={getPlaceholder()}
                    disabled={disabled}
                    maxLength={effectiveMaxLength}
                    className={error ? 'border-destructive' : ''}
                />
            )}

            {effectiveMaxLength && (
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span></span>
                    <span>{value.length}/{effectiveMaxLength}</span>
                </div>
            )}

            {error && (
                <p className="text-destructive text-sm mt-2">{error}</p>
            )}
        </div>
    );
};
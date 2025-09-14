import React from 'react';
import { Input } from '../../../../components/ui/input';
import type { NumericFieldProps } from '../../types/form';

export const NumericField: React.FC<NumericFieldProps> = ({
    question,
    value,
    onChange,
    onBlur,
    error,
    disabled = false,
    required = false,
    min,
    max,
    step = 1,
}) => {
    // Get min/max from validation rules if not provided
    const numericRange = question.validation?.find(rule => rule.type === 'numeric-range')?.value;
    const effectiveMin = min ?? numericRange?.min;
    const effectiveMax = max ?? numericRange?.max;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        if (inputValue === '') {
            onChange('');
            return;
        }

        const numValue = Number(inputValue);
        if (!isNaN(numValue)) {
            onChange(numValue);
        }
    };

    const displayValue = value === '' ? '' : String(value);

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

            <Input
                type="number"
                value={displayValue}
                onChange={handleChange}
                onBlur={onBlur}
                placeholder="Enter a number..."
                disabled={disabled}
                min={effectiveMin}
                max={effectiveMax}
                step={step}
                className={error ? 'border-destructive' : ''}
            />

            {(effectiveMin !== undefined || effectiveMax !== undefined) && (
                <div className="text-xs text-muted-foreground">
                    {effectiveMin !== undefined && effectiveMax !== undefined ? (
                        <span>Range: {effectiveMin} - {effectiveMax}</span>
                    ) : effectiveMin !== undefined ? (
                        <span>Minimum: {effectiveMin}</span>
                    ) : (
                        <span>Maximum: {effectiveMax}</span>
                    )}
                </div>
            )}

            {error && (
                <p className="text-destructive text-sm mt-2">{error}</p>
            )}
        </div>
    );
};
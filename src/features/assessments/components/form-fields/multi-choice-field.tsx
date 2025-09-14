import React from 'react';
import { Checkbox } from '../../../../components/ui/checkbox';
import { Label } from '../../../../components/ui/label';
import type { MultiChoiceFieldProps } from '../../types/form';

export const MultiChoiceField: React.FC<MultiChoiceFieldProps> = ({
    question,
    value = [],
    onChange,
    onBlur,
    error,
    disabled = false,
    required = false,
}) => {
    const handleOptionChange = (option: string, checked: boolean) => {
        const currentValue = Array.isArray(value) ? value : [];

        if (checked) {
            // Add option if not already present
            if (!currentValue.includes(option)) {
                onChange([...currentValue, option]);
            }
        } else {
            // Remove option
            onChange(currentValue.filter(v => v !== option));
        }
    };

    const isOptionChecked = (option: string) => {
        return Array.isArray(value) && value.includes(option);
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

            <div className="mt-3 space-y-2">
                {question.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                            id={`${question.id}-${index}`}
                            checked={isOptionChecked(option)}
                            onCheckedChange={(checked) => handleOptionChange(option, !!checked)}
                            disabled={disabled}
                            onBlur={onBlur}
                        />
                        <Label
                            htmlFor={`${question.id}-${index}`}
                            className="text-sm cursor-pointer"
                        >
                            {option}
                        </Label>
                    </div>
                )) || (
                        <div className="text-sm text-muted-foreground italic">
                            No options configured for this question
                        </div>
                    )}
            </div>

            {error && (
                <p className="text-destructive text-sm mt-2">{error}</p>
            )}
        </div>
    );
};
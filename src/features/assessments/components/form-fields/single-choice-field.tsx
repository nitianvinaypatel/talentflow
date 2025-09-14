import React from 'react';
import { RadioGroup, RadioGroupItem } from '../../../../components/ui/radio-group';
import { Label } from '../../../../components/ui/label';
import type { SingleChoiceFieldProps } from '../../types/form';

export const SingleChoiceField: React.FC<SingleChoiceFieldProps> = ({
    question,
    value,
    onChange,
    onBlur,
    error,
    disabled = false,
    required = false,
}) => {
    const handleValueChange = (newValue: string) => {
        onChange(newValue);
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

            <RadioGroup
                value={value || ''}
                onValueChange={handleValueChange}
                disabled={disabled}
                className="mt-3"
            >
                {question.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem
                            value={option}
                            id={`${question.id}-${index}`}
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
            </RadioGroup>

            {error && (
                <p className="text-destructive text-sm mt-2">{error}</p>
            )}
        </div>
    );
};
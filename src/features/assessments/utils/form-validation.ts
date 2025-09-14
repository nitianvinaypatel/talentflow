import type { Question, ValidationRule } from '../../../types';
import type { CustomValidator } from '../types/form';

/**
 * Validates a single question response
 */
export function validateQuestionResponse(
    question: Question,
    value: unknown,
    _allResponses: Record<string, unknown>,
    isRequired: boolean = question.required
): string | null {
    // Check if required field is empty
    if (isRequired && isEmpty(value)) {
        return 'This field is required';
    }

    // If empty and not required, skip other validations
    if (isEmpty(value) && !isRequired) {
        return null;
    }

    // Apply question-specific validation rules
    if (question.validation) {
        for (const rule of question.validation) {
            const error = validateRule(rule, value);
            if (error) return error;
        }
    }

    // Apply type-specific validation
    return validateByType(question, value);
}

/**
 * Validates a validation rule
 */
function validateRule(rule: ValidationRule, value: unknown): string | null {
    switch (rule.type) {
        case 'required':
            return isEmpty(value) ? (rule.message || 'This field is required') : null;

        case 'min-length':
            if (typeof value === 'string' && value.length < (rule.value || 0)) {
                return rule.message || `Minimum length is ${rule.value} characters`;
            }
            return null;

        case 'max-length':
            if (typeof value === 'string' && value.length > (rule.value || 0)) {
                return rule.message || `Maximum length is ${rule.value} characters`;
            }
            return null;

        case 'numeric-range':
            const num = Number(value);
            if (isNaN(num)) {
                return rule.message || 'Please enter a valid number';
            }
            if (rule.value && typeof rule.value === 'object') {
                const { min, max } = rule.value;
                if (min !== undefined && num < min) {
                    return rule.message || `Value must be at least ${min}`;
                }
                if (max !== undefined && num > max) {
                    return rule.message || `Value must be at most ${max}`;
                }
            }
            return null;

        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (typeof value === 'string' && !emailRegex.test(value)) {
                return rule.message || 'Please enter a valid email address';
            }
            return null;

        case 'url':
            try {
                if (typeof value !== 'string') {
                    return rule.message || 'Please enter a valid URL';
                }
                new URL(value);
                return null;
            } catch {
                return rule.message || 'Please enter a valid URL';
            }

        default:
            console.warn(`Unknown validation rule type: ${rule.type}`);
            return null;
    }
}

/**
 * Validates based on question type
 */
function validateByType(question: Question, value: any): string | null {
    switch (question.type) {
        case 'single-choice':
            if (question.options && !question.options.includes(value)) {
                return 'Please select a valid option';
            }
            return null;

        case 'multi-choice':
            if (!Array.isArray(value)) {
                return 'Invalid selection format';
            }
            if (question.options) {
                const invalidOptions = value.filter(v => !question.options!.includes(v));
                if (invalidOptions.length > 0) {
                    return 'Please select valid options only';
                }
            }
            return null;

        case 'numeric':
            const num = Number(value);
            if (isNaN(num)) {
                return 'Please enter a valid number';
            }
            return null;

        case 'short-text':
        case 'long-text':
            if (typeof value !== 'string') {
                return 'Please enter text';
            }
            return null;

        case 'file-upload':
            // File validation is handled separately
            return null;

        default:
            return null;
    }
}

/**
 * Checks if a value is considered empty
 */
function isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}

/**
 * Validates all responses in a form
 */
export function validateAllResponses(
    assessment: any,
    responses: Record<string, any>,
    conditionalStates: Record<string, any>
): Record<string, string> {
    const errors: Record<string, string> = {};

    for (const section of assessment.sections) {
        for (const question of section.questions) {
            const state = conditionalStates[question.id];

            // Skip validation for hidden questions
            if (!state?.visible) continue;

            const value = responses[question.id];
            const error = validateQuestionResponse(
                question,
                value,
                responses,
                state.required
            );

            if (error) {
                errors[question.id] = error;
            }
        }
    }

    return errors;
}

/**
 * Validates responses for a specific section
 */
export function validateSectionResponses(
    section: any,
    responses: Record<string, any>,
    conditionalStates: Record<string, any>
): Record<string, string> {
    const errors: Record<string, string> = {};

    for (const question of section.questions) {
        const state = conditionalStates[question.id];

        // Skip validation for hidden questions
        if (!state?.visible) continue;

        const value = responses[question.id];
        const error = validateQuestionResponse(
            question,
            value,
            responses,
            state.required
        );

        if (error) {
            errors[question.id] = error;
        }
    }

    return errors;
}

/**
 * Checks if a section is complete (all required questions answered)
 */
export function isSectionComplete(
    section: any,
    responses: Record<string, any>,
    conditionalStates: Record<string, any>
): boolean {
    for (const question of section.questions) {
        const state = conditionalStates[question.id];

        // Skip hidden questions
        if (!state?.visible) continue;

        // Check if required question is answered
        if (state.required) {
            const value = responses[question.id];
            if (isEmpty(value)) {
                return false;
            }
        }
    }

    return true;
}

/**
 * Gets completion percentage for the entire assessment
 */
export function getAssessmentCompletionPercentage(
    assessment: any,
    responses: Record<string, any>,
    conditionalStates: Record<string, any>
): number {
    let totalQuestions = 0;
    let answeredQuestions = 0;

    for (const section of assessment.sections) {
        for (const question of section.questions) {
            const state = conditionalStates[question.id];

            // Only count visible questions
            if (state?.visible) {
                totalQuestions++;

                const value = responses[question.id];
                if (!isEmpty(value)) {
                    answeredQuestions++;
                }
            }
        }
    }

    return totalQuestions === 0 ? 100 : Math.round((answeredQuestions / totalQuestions) * 100);
}

/**
 * Gets completion percentage for a specific section
 */
export function getSectionCompletionPercentage(
    section: any,
    responses: Record<string, any>,
    conditionalStates: Record<string, any>
): number {
    let totalQuestions = 0;
    let answeredQuestions = 0;

    for (const question of section.questions) {
        const state = conditionalStates[question.id];

        // Only count visible questions
        if (state?.visible) {
            totalQuestions++;

            const value = responses[question.id];
            if (!isEmpty(value)) {
                answeredQuestions++;
            }
        }
    }

    return totalQuestions === 0 ? 100 : Math.round((answeredQuestions / totalQuestions) * 100);
}

/**
 * Custom validation function registry
 */
const customValidators: Record<string, CustomValidator> = {};

/**
 * Registers a custom validator
 */
export function registerCustomValidator(name: string, validator: CustomValidator): void {
    customValidators[name] = validator;
}

/**
 * Applies custom validation if registered
 */
export function applyCustomValidation(
    validatorName: string,
    value: any,
    question: Question,
    allResponses: Record<string, any>
): string | null {
    const validator = customValidators[validatorName];
    if (!validator) {
        console.warn(`Custom validator "${validatorName}" not found`);
        return null;
    }

    return validator(value, question, allResponses);
}

/**
 * File validation utilities
 */
export function validateFile(
    file: File | null,
    maxSize?: number,
    allowedTypes?: string[]
): string | null {
    if (!file) return null;

    // Check file size
    if (maxSize && file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        return `File size must be less than ${maxSizeMB}MB`;
    }

    // Check file type
    if (allowedTypes && allowedTypes.length > 0) {
        const fileType = file.type.toLowerCase();
        const isAllowed = allowedTypes.some(type => {
            if (type.includes('*')) {
                const baseType = type.split('/')[0];
                return fileType.startsWith(baseType + '/');
            }
            return fileType === type.toLowerCase();
        });

        if (!isAllowed) {
            return `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`;
        }
    }

    return null;
}
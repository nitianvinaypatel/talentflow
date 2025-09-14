import { z } from 'zod';
import type { Question, QuestionResponse, Assessment } from '../../../types';

// Base validation schema for different question types
export const questionResponseSchema = z.object({
    questionId: z.string(),
    type: z.enum(['single-choice', 'multi-choice', 'short-text', 'long-text', 'numeric', 'file-upload']),
    value: z.any(), // Will be refined based on question type
});

// Specific validation schemas for each question type
export const singleChoiceResponseSchema = questionResponseSchema.extend({
    type: z.literal('single-choice'),
    value: z.string().min(1, 'Please select an option'),
});

export const multiChoiceResponseSchema = questionResponseSchema.extend({
    type: z.literal('multi-choice'),
    value: z.array(z.string()).min(1, 'Please select at least one option'),
});

export const shortTextResponseSchema = questionResponseSchema.extend({
    type: z.literal('short-text'),
    value: z.string().min(1, 'This field is required'),
});

export const longTextResponseSchema = questionResponseSchema.extend({
    type: z.literal('long-text'),
    value: z.string().min(1, 'This field is required'),
});

export const numericResponseSchema = questionResponseSchema.extend({
    type: z.literal('numeric'),
    value: z.number({ message: 'Please enter a valid number' }),
});

export const fileUploadResponseSchema = questionResponseSchema.extend({
    type: z.literal('file-upload'),
    value: z.object({
        name: z.string(),
        size: z.number(),
        type: z.string(),
        lastModified: z.number(),
    }).nullable(),
});

// Assessment form data type
export interface AssessmentFormData {
    responses: Record<string, any>; // questionId -> response value
}

// Assessment submission data
export interface AssessmentSubmissionData {
    assessmentId: string;
    candidateId: string;
    responses: QuestionResponse[];
    submittedAt: Date;
    status: 'draft' | 'submitted';
}

// Form validation context
export interface FormValidationContext {
    assessment: Assessment;
    responses: Record<string, any>;
    currentSection?: string;
}

// Conditional logic evaluation result
export interface ConditionalEvaluationResult {
    questionId: string;
    visible: boolean;
    required: boolean;
    dependencyMet: boolean;
}

// Form state for runtime
export interface AssessmentFormState {
    responses: Record<string, any>;
    errors: Record<string, string>;
    touched: Record<string, boolean>;
    isSubmitting: boolean;
    currentSection: number;
    completedSections: Set<number>;
    conditionalStates: Record<string, ConditionalEvaluationResult>;
}

// Validation rule types
export type ValidationRuleType = 'required' | 'min-length' | 'max-length' | 'numeric-range' | 'email' | 'url';

// Custom validation function type
export type CustomValidator = (value: any, question: Question, allResponses: Record<string, any>) => string | null;

// Form field props for different question types
export interface BaseFieldProps {
    question: Question;
    value: any;
    onChange: (value: any) => void;
    onBlur: () => void;
    error?: string;
    disabled?: boolean;
    required?: boolean;
}

export interface SingleChoiceFieldProps extends BaseFieldProps {
    value: string;
    onChange: (value: string) => void;
}

export interface MultiChoiceFieldProps extends BaseFieldProps {
    value: string[];
    onChange: (value: string[]) => void;
}

export interface TextFieldProps extends BaseFieldProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    maxLength?: number;
}

export interface NumericFieldProps extends BaseFieldProps {
    value: number | '';
    onChange: (value: number | '') => void;
    min?: number;
    max?: number;
    step?: number;
}

export interface FileUploadFieldProps extends BaseFieldProps {
    value: File | null;
    onChange: (value: File | null) => void;
    accept?: string;
    maxSize?: number;
}

// Form section navigation
export interface SectionNavigationState {
    currentSection: number;
    totalSections: number;
    canGoNext: boolean;
    canGoPrevious: boolean;
    canSubmit: boolean;
}

// Assessment form configuration
export interface AssessmentFormConfig {
    allowPartialSave: boolean;
    showProgress: boolean;
    enableSectionNavigation: boolean;
    validateOnChange: boolean;
    validateOnBlur: boolean;
    autoSave: boolean;
    autoSaveInterval: number; // in milliseconds
}

// Default form configuration
export const defaultFormConfig: AssessmentFormConfig = {
    allowPartialSave: true,
    showProgress: true,
    enableSectionNavigation: true,
    validateOnChange: false,
    validateOnBlur: true,
    autoSave: true,
    autoSaveInterval: 30000, // 30 seconds
};

// Form event types
export type FormEventType =
    | 'field_change'
    | 'field_blur'
    | 'section_change'
    | 'validation_error'
    | 'submission_start'
    | 'submission_success'
    | 'submission_error'
    | 'auto_save';

export interface FormEvent {
    type: FormEventType;
    questionId?: string;
    sectionIndex?: number;
    value?: any;
    error?: string;
    timestamp: Date;
}
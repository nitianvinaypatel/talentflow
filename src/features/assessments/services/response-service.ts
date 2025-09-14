import { api } from '../../../lib/api/client';
import { AssessmentResponsesService } from '../../../lib/db/operations';
import type { AssessmentResponse, QuestionResponse } from '../../../types';

export interface CreateAssessmentResponseData {
    candidateId: string;
    assessmentId: string;
    responses: QuestionResponse[];
    status?: AssessmentResponse['status'];
}

export interface UpdateAssessmentResponseData {
    responses?: QuestionResponse[];
    status?: AssessmentResponse['status'];
}

export class AssessmentResponseService {
    /**
     * Create a new assessment response (draft or submitted)
     */
    static async createResponse(data: CreateAssessmentResponseData): Promise<AssessmentResponse> {
        try {
            // Create via API first (with write-through to IndexedDB)
            const response = await api.assessmentResponses.create({
                ...data,
                submittedAt: new Date(),
                status: data.status || 'draft'
            });

            return (response as any).data;
        } catch (error) {
            // Fallback to local storage if API fails
            console.warn('API call failed, saving locally:', error);

            const localResponse = await AssessmentResponsesService.create({
                ...data,
                submittedAt: new Date(),
                status: data.status || 'draft'
            });

            return localResponse;
        }
    }

    /**
     * Update an existing assessment response
     */
    static async updateResponse(id: string, updates: UpdateAssessmentResponseData): Promise<AssessmentResponse | null> {
        try {
            // Update via API first
            const response = await api.assessmentResponses.update(id, updates);
            return (response as any).data;
        } catch (error) {
            // Fallback to local storage if API fails
            console.warn('API call failed, updating locally:', error);

            const localResponse = await AssessmentResponsesService.update(id, updates);
            return localResponse;
        }
    }

    /**
     * Submit an assessment response (change status to submitted)
     */
    static async submitResponse(id: string): Promise<AssessmentResponse | null> {
        return this.updateResponse(id, {
            status: 'submitted',
        });
    }

    /**
     * Save assessment response as draft
     */
    static async saveDraft(data: CreateAssessmentResponseData): Promise<AssessmentResponse> {
        return this.createResponse({
            ...data,
            status: 'draft'
        });
    }

    /**
     * Get assessment responses for a candidate
     */
    static async getResponsesForCandidate(candidateId: string): Promise<AssessmentResponse[]> {
        try {
            // Try API first
            const response = await api.assessmentResponses.list({ candidateId });
            return (response as any).data || [];
        } catch (error) {
            // Fallback to local storage
            console.warn('API call failed, loading from local storage:', error);
            return await AssessmentResponsesService.getByCandidateId(candidateId);
        }
    }

    /**
     * Get assessment responses for an assessment
     */
    static async getResponsesForAssessment(assessmentId: string): Promise<AssessmentResponse[]> {
        try {
            // Try API first
            const response = await api.assessmentResponses.list({ assessmentId });
            return (response as any).data || [];
        } catch (error) {
            // Fallback to local storage
            console.warn('API call failed, loading from local storage:', error);
            return await AssessmentResponsesService.getByAssessmentId(assessmentId);
        }
    }

    /**
     * Get a specific assessment response by ID
     */
    static async getResponseById(id: string): Promise<AssessmentResponse | null> {
        try {
            // Try local storage first for better performance
            const localResponse = await AssessmentResponsesService.getById(id);
            return localResponse || null;
        } catch (error) {
            console.warn('Failed to load response from local storage:', error);
            return null;
        }
    }

    /**
     * Validate assessment response before submission
     */
    static validateResponse(
        responses: QuestionResponse[],
        assessment: any
    ): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Get all questions from all sections
        const allQuestions = assessment.sections.flatMap((section: any) => section.questions);

        // Check required questions
        for (const question of allQuestions) {
            if (question.required) {
                const response = responses.find(r => r.questionId === question.id);

                if (!response || !response.value ||
                    (Array.isArray(response.value) && response.value.length === 0) ||
                    (typeof response.value === 'string' && response.value.trim() === '')) {
                    errors.push(`Question "${question.title}" is required`);
                }
            }
        }

        // Validate response formats
        for (const response of responses) {
            const question = allQuestions.find((q: any) => q.id === response.questionId);
            if (!question) continue;

            // Validate based on question type
            switch (question.type) {
                case 'numeric':
                    if (response.value && isNaN(Number(response.value))) {
                        errors.push(`Question "${question.title}" must be a valid number`);
                    }

                    // Check numeric range validation
                    const rangeRule = question.validation?.find((rule: any) => rule.type === 'numeric-range');
                    if (rangeRule && response.value) {
                        const value = Number(response.value);
                        const { min, max } = rangeRule.value;
                        if (min !== undefined && value < min) {
                            errors.push(`Question "${question.title}" must be at least ${min}`);
                        }
                        if (max !== undefined && value > max) {
                            errors.push(`Question "${question.title}" must be at most ${max}`);
                        }
                    }
                    break;

                case 'short-text':
                case 'long-text':
                    if (response.value && typeof response.value === 'string') {
                        // Check length validation
                        const minLengthRule = question.validation?.find((rule: any) => rule.type === 'min-length');
                        const maxLengthRule = question.validation?.find((rule: any) => rule.type === 'max-length');

                        if (minLengthRule && response.value.length < minLengthRule.value) {
                            errors.push(`Question "${question.title}" must be at least ${minLengthRule.value} characters`);
                        }
                        if (maxLengthRule && response.value.length > maxLengthRule.value) {
                            errors.push(`Question "${question.title}" must be at most ${maxLengthRule.value} characters`);
                        }
                    }
                    break;

                case 'single-choice':
                    if (response.value && !question.options?.includes(response.value)) {
                        errors.push(`Question "${question.title}" has an invalid selection`);
                    }
                    break;

                case 'multi-choice':
                    if (response.value && Array.isArray(response.value)) {
                        const invalidOptions = response.value.filter(v => !question.options?.includes(v));
                        if (invalidOptions.length > 0) {
                            errors.push(`Question "${question.title}" has invalid selections: ${invalidOptions.join(', ')}`);
                        }
                    }
                    break;
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Check if candidate has already submitted response for assessment
     */
    static async hasSubmittedResponse(candidateId: string, assessmentId: string): Promise<boolean> {
        const responses = await this.getResponsesForCandidate(candidateId);
        return responses.some(r => r.assessmentId === assessmentId && r.status === 'submitted');
    }

    /**
     * Get draft response for candidate and assessment
     */
    static async getDraftResponse(candidateId: string, assessmentId: string): Promise<AssessmentResponse | null> {
        const responses = await this.getResponsesForCandidate(candidateId);
        return responses.find(r => r.assessmentId === assessmentId && r.status === 'draft') || null;
    }
}
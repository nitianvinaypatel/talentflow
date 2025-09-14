import type { Question, ConditionalRule, Assessment } from '../../../types';
import type { ConditionalEvaluationResult } from '../types/form';

/**
 * Evaluates conditional logic for a question based on current form responses
 */
export function evaluateConditionalLogic(
    question: Question,
    responses: Record<string, unknown>
): ConditionalEvaluationResult {
    const result: ConditionalEvaluationResult = {
        questionId: question.id,
        visible: true,
        required: question.required,
        dependencyMet: true,
    };

    // If no conditional logic, return default state
    if (!question.conditionalLogic || question.conditionalLogic.length === 0) {
        return result;
    }

    // Evaluate each conditional rule
    for (const rule of question.conditionalLogic) {
        const dependencyValue = responses[rule.dependsOnQuestionId];
        const ruleResult = evaluateCondition(rule, dependencyValue);

        // Apply the rule action
        switch (rule.action) {
            case 'show':
                if (!ruleResult) {
                    result.visible = false;
                    result.dependencyMet = false;
                }
                break;
            case 'hide':
                if (ruleResult) {
                    result.visible = false;
                    result.dependencyMet = false;
                }
                break;
            case 'require':
                if (ruleResult) {
                    result.required = true;
                } else {
                    result.required = question.required; // Reset to original
                }
                break;
        }
    }

    return result;
}

/**
 * Evaluates a single conditional rule
 */
function evaluateCondition(
    rule: ConditionalRule,
    actualValue: unknown
): boolean {
    // If no value provided, condition is false
    if (actualValue === undefined || actualValue === null || actualValue === '') {
        return false;
    }

    const { condition, value: expectedValue } = rule;

    switch (condition) {
        case 'equals':
            return actualValue === expectedValue;

        case 'not-equals':
            return actualValue !== expectedValue;

        case 'contains':
            if (Array.isArray(actualValue)) {
                return actualValue.includes(expectedValue);
            }
            if (typeof actualValue === 'string') {
                return actualValue.toLowerCase().includes(String(expectedValue).toLowerCase());
            }
            return false;

        case 'greater-than': {
            const numActual = Number(actualValue);
            const numExpected = Number(expectedValue);
            return !isNaN(numActual) && !isNaN(numExpected) && numActual > numExpected;
        }

        case 'less-than': {
            const numActual2 = Number(actualValue);
            const numExpected2 = Number(expectedValue);
            return !isNaN(numActual2) && !isNaN(numExpected2) && numActual2 < numExpected2;
        }

        default:
            console.warn(`Unknown conditional rule condition: ${condition}`);
            return false;
    }
}

/**
 * Evaluates conditional logic for all questions in an assessment
 */
export function evaluateAllConditionalLogic(
    assessment: Assessment,
    responses: Record<string, unknown>
): Record<string, ConditionalEvaluationResult> {
    const results: Record<string, ConditionalEvaluationResult> = {};

    for (const section of assessment.sections) {
        for (const question of section.questions) {
            results[question.id] = evaluateConditionalLogic(question, responses);
        }
    }

    return results;
}

/**
 * Gets all visible questions based on conditional logic
 */
export function getVisibleQuestions(
    assessment: Assessment,
    responses: Record<string, unknown>
): Question[] {
    const conditionalStates = evaluateAllConditionalLogic(assessment, responses);
    const visibleQuestions: Question[] = [];

    for (const section of assessment.sections) {
        for (const question of section.questions) {
            const state = conditionalStates[question.id];
            if (state.visible) {
                visibleQuestions.push(question);
            }
        }
    }

    return visibleQuestions;
}

/**
 * Gets all required questions based on conditional logic
 */
export function getRequiredQuestions(
    assessment: Assessment,
    responses: Record<string, unknown>
): Question[] {
    const conditionalStates = evaluateAllConditionalLogic(assessment, responses);
    const requiredQuestions: Question[] = [];

    for (const section of assessment.sections) {
        for (const question of section.questions) {
            const state = conditionalStates[question.id];
            if (state.visible && state.required) {
                requiredQuestions.push(question);
            }
        }
    }

    return requiredQuestions;
}

/**
 * Checks if a section has any visible questions
 */
export function isSectionVisible(
    section: { questions: Question[] },
    responses: Record<string, unknown>
): boolean {
    return section.questions.some(question => {
        const state = evaluateConditionalLogic(question, responses);
        return state.visible;
    });
}

/**
 * Gets the dependency chain for a question (questions it depends on)
 */
export function getQuestionDependencies(question: Question): string[] {
    if (!question.conditionalLogic) return [];

    return question.conditionalLogic.map(rule => rule.dependsOnQuestionId);
}

/**
 * Gets all questions that depend on a given question
 */
export function getDependentQuestions(
    questionId: string,
    assessment: Assessment
): Question[] {
    const dependentQuestions: Question[] = [];

    for (const section of assessment.sections) {
        for (const question of section.questions) {
            const dependencies = getQuestionDependencies(question);
            if (dependencies.includes(questionId)) {
                dependentQuestions.push(question);
            }
        }
    }

    return dependentQuestions;
}

/**
 * Validates that conditional logic doesn't create circular dependencies
 */
export function validateConditionalLogic(assessment: Assessment): string[] {
    const errors: string[] = [];
    const questionIds = new Set<string>();

    // Collect all question IDs
    for (const section of assessment.sections) {
        for (const question of section.questions) {
            questionIds.add(question.id);
        }
    }

    // Check each question's conditional logic
    for (const section of assessment.sections) {
        for (const question of section.questions) {
            if (!question.conditionalLogic) continue;

            for (const rule of question.conditionalLogic) {
                // Check if dependency question exists
                if (!questionIds.has(rule.dependsOnQuestionId)) {
                    errors.push(
                        `Question "${question.title}" depends on non-existent question ID: ${rule.dependsOnQuestionId}`
                    );
                }

                // Check for self-dependency
                if (rule.dependsOnQuestionId === question.id) {
                    errors.push(
                        `Question "${question.title}" cannot depend on itself`
                    );
                }
            }

            // Check for circular dependencies (basic check)
            const visited = new Set<string>();
            const hasCircularDependency = checkCircularDependency(
                question.id,
                assessment,
                visited
            );

            if (hasCircularDependency) {
                errors.push(
                    `Circular dependency detected involving question "${question.title}"`
                );
            }
        }
    }

    return errors;
}

/**
 * Helper function to detect circular dependencies
 */
function checkCircularDependency(
    questionId: string,
    assessment: Assessment,
    visited: Set<string>
): boolean {
    if (visited.has(questionId)) {
        return true; // Circular dependency found
    }

    visited.add(questionId);

    // Find the question
    let question: Question | undefined;
    for (const section of assessment.sections) {
        question = section.questions.find(q => q.id === questionId);
        if (question) break;
    }

    if (!question || !question.conditionalLogic) {
        visited.delete(questionId);
        return false;
    }

    // Check dependencies
    for (const rule of question.conditionalLogic) {
        if (checkCircularDependency(rule.dependsOnQuestionId, assessment, visited)) {
            return true;
        }
    }

    visited.delete(questionId);
    return false;
}
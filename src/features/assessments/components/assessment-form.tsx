import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Progress } from "../../../components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  AlertCircle,
} from "lucide-react";
import {
  SingleChoiceField,
  MultiChoiceField,
  TextField,
  NumericField,
  FileUploadField,
} from "./form-fields";
import { evaluateAllConditionalLogic } from "../utils/conditional-logic";
import {
  validateAllResponses,
  isSectionComplete,
  getAssessmentCompletionPercentage,
  getSectionCompletionPercentage,
  validateQuestionResponse as validateQuestion,
} from "../utils/form-validation";
import type { Assessment, Question } from "../../../types";
import type {
  AssessmentFormState,
  AssessmentFormConfig,
  SectionNavigationState,
  FormEvent,
} from "../types/form";

interface AssessmentFormProps {
  assessment: Assessment;
  initialResponses?: Record<string, unknown>;
  config?: Partial<AssessmentFormConfig>;
  onResponseChange?: (questionId: string, value: unknown) => void;
  onSectionChange?: (sectionIndex: number) => void;
  onSave?: (responses: Record<string, unknown>) => Promise<void>;
  onSubmit?: (responses: Record<string, unknown>) => Promise<void>;
  onEvent?: (event: FormEvent) => void;
  readOnly?: boolean;
  isPreview?: boolean; // Add prop to control preview styling
}

const defaultConfig: AssessmentFormConfig = {
  allowPartialSave: true,
  showProgress: true,
  enableSectionNavigation: true,
  validateOnChange: false,
  validateOnBlur: true,
  autoSave: false, // Disabled by default for this implementation
  autoSaveInterval: 30000,
};

export const AssessmentForm: React.FC<AssessmentFormProps> = ({
  assessment,
  initialResponses = {},
  config = {},
  onResponseChange,
  onSectionChange,
  onSave,
  onSubmit,
  onEvent,
  readOnly = false,
  isPreview = false,
}) => {
  const effectiveConfig = { ...defaultConfig, ...config };

  // Form state
  const [formState, setFormState] = useState<AssessmentFormState>({
    responses: initialResponses,
    errors: {},
    touched: {},
    isSubmitting: false,
    currentSection: 0,
    completedSections: new Set(),
    conditionalStates: {},
  });

  // Evaluate conditional logic whenever responses change
  const conditionalStates = useMemo(() => {
    return (
      formState.conditionalStates ||
      evaluateAllConditionalLogic(assessment, formState.responses)
    );
  }, [assessment, formState.responses, formState.conditionalStates]);

  // Initialize conditional states on mount
  useEffect(() => {
    if (
      !formState.conditionalStates ||
      Object.keys(formState.conditionalStates).length === 0
    ) {
      const initialConditionalStates = evaluateAllConditionalLogic(
        assessment,
        formState.responses
      );
      setFormState((prev) => ({
        ...prev,
        conditionalStates: initialConditionalStates,
      }));
    }
  }, [assessment, formState.responses, formState.conditionalStates]);

  // Emit events
  const emitEvent = useCallback(
    (event: Omit<FormEvent, "timestamp">) => {
      const fullEvent: FormEvent = {
        ...event,
        timestamp: new Date(),
      };
      onEvent?.(fullEvent);
    },
    [onEvent]
  );

  // Handle field changes
  const handleFieldChange = useCallback(
    (questionId: string, value: unknown) => {
      setFormState((prev) => {
        const newResponses = { ...prev.responses, [questionId]: value };

        // Re-evaluate conditional logic with new responses
        const newConditionalStates = evaluateAllConditionalLogic(
          assessment,
          newResponses
        );

        // Clear responses for questions that are now hidden
        const finalResponses = { ...newResponses };
        for (const section of assessment.sections) {
          for (const question of section.questions) {
            const state = newConditionalStates[question.id];
            if (!state?.visible && finalResponses[question.id] !== undefined) {
              delete finalResponses[question.id];
            }
          }
        }

        // Clear error for this field if it exists
        const newErrors = { ...prev.errors };
        delete newErrors[questionId];

        // Clear errors for hidden questions
        for (const section of assessment.sections) {
          for (const question of section.questions) {
            const state = newConditionalStates[question.id];
            if (!state?.visible && newErrors[question.id]) {
              delete newErrors[question.id];
            }
          }
        }

        // Validate on change if enabled
        let fieldError: string | undefined;
        if (effectiveConfig.validateOnChange) {
          const question = findQuestionById(assessment, questionId);
          if (question) {
            const state = newConditionalStates[questionId];
            fieldError =
              validateQuestionResponse(
                question,
                value,
                finalResponses,
                state?.required
              ) || undefined;
            if (fieldError) {
              newErrors[questionId] = fieldError;
            }
          }
        }

        return {
          ...prev,
          responses: finalResponses,
          errors: newErrors,
          conditionalStates: newConditionalStates,
        };
      });

      // Emit change event
      emitEvent({
        type: "field_change",
        questionId,
        value,
      });

      // Call external handler
      onResponseChange?.(questionId, value);
    },
    [assessment, effectiveConfig.validateOnChange, emitEvent, onResponseChange]
  );

  // Handle field blur
  const handleFieldBlur = useCallback(
    (questionId: string) => {
      if (!effectiveConfig.validateOnBlur) return;

      setFormState((prev) => {
        const question = findQuestionById(assessment, questionId);
        if (!question) return prev;

        const state = conditionalStates[questionId];
        const value = prev.responses[questionId];
        const error = validateQuestionResponse(
          question,
          value,
          prev.responses,
          state?.required
        );

        const newErrors = { ...prev.errors };
        const newTouched = { ...prev.touched, [questionId]: true };

        if (error) {
          newErrors[questionId] = error;
          emitEvent({
            type: "validation_error",
            questionId,
            error,
          });
        } else {
          delete newErrors[questionId];
        }

        return {
          ...prev,
          errors: newErrors,
          touched: newTouched,
        };
      });

      emitEvent({
        type: "field_blur",
        questionId,
      });
    },
    [assessment, conditionalStates, effectiveConfig.validateOnBlur, emitEvent]
  );

  // Section navigation
  const navigationState = useMemo((): SectionNavigationState => {
    const totalSections = assessment.sections.length;
    const currentSection = formState.currentSection;

    // Check if current section is complete
    const currentSectionData = assessment.sections[currentSection];
    const canGoNext =
      currentSection < totalSections - 1 &&
      isSectionComplete(
        currentSectionData,
        formState.responses,
        conditionalStates
      );

    const canGoPrevious = currentSection > 0;

    // Can submit if all sections are complete
    const allErrors = validateAllResponses(
      assessment,
      formState.responses,
      conditionalStates
    );
    const canSubmit = Object.keys(allErrors).length === 0;

    return {
      currentSection,
      totalSections,
      canGoNext,
      canGoPrevious,
      canSubmit,
    };
  }, [
    assessment,
    formState.currentSection,
    formState.responses,
    conditionalStates,
  ]);

  // Navigate to section
  const navigateToSection = useCallback(
    (sectionIndex: number) => {
      if (sectionIndex < 0 || sectionIndex >= assessment.sections.length)
        return;

      setFormState((prev) => ({
        ...prev,
        currentSection: sectionIndex,
      }));

      emitEvent({
        type: "section_change",
        sectionIndex,
      });

      onSectionChange?.(sectionIndex);
    },
    [assessment.sections.length, emitEvent, onSectionChange]
  );

  // Save form
  const handleSave = useCallback(async () => {
    if (!onSave || formState.isSubmitting) return;

    setFormState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      await onSave(formState.responses);
      emitEvent({ type: "auto_save" });
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setFormState((prev) => ({ ...prev, isSubmitting: false }));
    }
  }, [onSave, formState.responses, formState.isSubmitting, emitEvent]);

  // Submit form
  const handleSubmit = useCallback(async () => {
    if (!onSubmit || formState.isSubmitting) return;

    // Validate all responses
    const errors = validateAllResponses(
      assessment,
      formState.responses,
      conditionalStates
    );

    if (Object.keys(errors).length > 0) {
      setFormState((prev) => ({ ...prev, errors }));
      emitEvent({
        type: "validation_error",
        error: "Please fix all validation errors before submitting",
      });
      return;
    }

    setFormState((prev) => ({ ...prev, isSubmitting: true }));
    emitEvent({ type: "submission_start" });

    try {
      await onSubmit(formState.responses);
      emitEvent({ type: "submission_success" });
    } catch (error) {
      emitEvent({
        type: "submission_error",
        error: error instanceof Error ? error.message : "Submission failed",
      });
    } finally {
      setFormState((prev) => ({ ...prev, isSubmitting: false }));
    }
  }, [
    onSubmit,
    formState.responses,
    formState.isSubmitting,
    assessment,
    conditionalStates,
    emitEvent,
  ]);

  // Render question field based on type
  const renderQuestionField = useCallback(
    (question: Question) => {
      const value = formState.responses[question.id];
      const error = formState.errors[question.id];
      const state = conditionalStates[question.id];

      // Don't render hidden questions
      if (!state?.visible) return null;

      const commonProps = {
        question,
        value,
        onChange: (newValue: unknown) =>
          handleFieldChange(question.id, newValue),
        onBlur: () => handleFieldBlur(question.id),
        error,
        disabled: readOnly || formState.isSubmitting,
        required: state.required,
      };

      switch (question.type) {
        case "single-choice":
          return <SingleChoiceField key={question.id} {...commonProps} />;
        case "multi-choice":
          return <MultiChoiceField key={question.id} {...commonProps} />;
        case "short-text":
        case "long-text":
          return <TextField key={question.id} {...commonProps} />;
        case "numeric":
          return <NumericField key={question.id} {...commonProps} />;
        case "file-upload":
          return <FileUploadField key={question.id} {...commonProps} />;
        default:
          return (
            <div
              key={question.id}
              className="p-4 border border-dashed border-muted-foreground/25 rounded-md"
            >
              <p className="text-sm text-muted-foreground">
                Unsupported question type: {question.type}
              </p>
            </div>
          );
      }
    },
    [
      formState.responses,
      formState.errors,
      formState.isSubmitting,
      conditionalStates,
      readOnly,
      handleFieldChange,
      handleFieldBlur,
    ]
  );

  // Get current section
  const currentSection = assessment.sections[formState.currentSection];
  const visibleQuestions =
    currentSection?.questions.filter((q) => conditionalStates[q.id]?.visible) ||
    [];

  // Calculate progress
  const overallProgress = getAssessmentCompletionPercentage(
    assessment,
    formState.responses,
    conditionalStates
  );
  const sectionProgress = getSectionCompletionPercentage(
    currentSection,
    formState.responses,
    conditionalStates
  );

  return (
    <div
      className="space-y-6"
      style={{
        backgroundColor: "#000319",
        minHeight: isPreview ? "auto" : "100vh",
        padding: "1.5rem",
      }}
    >
      {/* Progress and Navigation */}
      {effectiveConfig.showProgress && (
        <Card style={{ backgroundColor: "#0d1025", borderColor: "#1f2937" }}>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-white">Assessment Progress</h3>
                <Badge
                  variant="outline"
                  className="border-gray-700 text-gray-300 bg-gray-800"
                >
                  {overallProgress}% Complete
                </Badge>
              </div>
              <Progress value={overallProgress} className="w-full" />

              {effectiveConfig.enableSectionNavigation && (
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>
                    Section {formState.currentSection + 1} of{" "}
                    {assessment.sections.length}
                  </span>
                  <span>{sectionProgress}% of section complete</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Section */}
      <Card style={{ backgroundColor: "#0d1025", borderColor: "#1f2937" }}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <span>
              {currentSection?.title ||
                `Section ${formState.currentSection + 1}`}
            </span>
            {visibleQuestions.length > 0 && (
              <Badge variant="secondary" className="bg-gray-800 text-gray-300">
                {visibleQuestions.length} question
                {visibleQuestions.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </CardTitle>
          {currentSection?.description && (
            <p className="text-sm text-gray-400">
              {currentSection.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {visibleQuestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>No questions to display in this section</p>
            </div>
          ) : (
            visibleQuestions.map(renderQuestionField)
          )}
        </CardContent>
      </Card>

      {/* Navigation and Actions */}
      <Card style={{ backgroundColor: "#0d1025", borderColor: "#1f2937" }}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {effectiveConfig.enableSectionNavigation && (
                <>
                  <Button
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                    onClick={() =>
                      navigateToSection(formState.currentSection - 1)
                    }
                    disabled={
                      !navigationState.canGoPrevious || formState.isSubmitting
                    }
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                    onClick={() =>
                      navigateToSection(formState.currentSection + 1)
                    }
                    disabled={
                      !navigationState.canGoNext || formState.isSubmitting
                    }
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {!readOnly && effectiveConfig.allowPartialSave && onSave && (
                <Button
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                  onClick={handleSave}
                  disabled={formState.isSubmitting}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
              )}
              {!readOnly && onSubmit && (
                <Button
                  onClick={handleSubmit}
                  disabled={
                    !navigationState.canSubmit || formState.isSubmitting
                  }
                >
                  <Send className="h-4 w-4 mr-2" />
                  {formState.isSubmitting
                    ? "Submitting..."
                    : "Submit Assessment"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function to find question by ID
function findQuestionById(
  assessment: Assessment,
  questionId: string
): Question | undefined {
  for (const section of assessment.sections) {
    const question = section.questions.find((q) => q.id === questionId);
    if (question) return question;
  }
  return undefined;
}

// Helper function for validation (imported from utils but need to use here)
function validateQuestionResponse(
  question: Question,
  value: unknown,
  allResponses: Record<string, unknown>,
  isRequired: boolean = question.required
): string | null {
  return validateQuestion(question, value, allResponses, isRequired);
}

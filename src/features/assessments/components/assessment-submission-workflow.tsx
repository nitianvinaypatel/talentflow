import React, { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Progress } from "../../../components/ui/progress";
import { Separator } from "../../../components/ui/separator";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import {
  CheckCircle,
  AlertTriangle,
  Send,
  Save,
  Clock,
  FileText,
  User,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import {
  validateAllResponses,
  getAssessmentCompletionPercentage,
} from "../utils/form-validation";
import { evaluateAllConditionalLogic } from "../utils/conditional-logic";
import type { Assessment, Candidate } from "../../../types";

interface AssessmentSubmissionWorkflowProps {
  assessment: Assessment;
  candidate: Candidate;
  responses: Record<string, unknown>;
  onSave?: (responses: Record<string, unknown>) => Promise<void>;
  onSubmit?: (responses: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  isSaving?: boolean;
}

export const AssessmentSubmissionWorkflow: React.FC<
  AssessmentSubmissionWorkflowProps
> = ({
  assessment,
  candidate,
  responses,
  onSave,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isSaving = false,
}) => {
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  // Evaluate conditional logic and validation
  const conditionalStates = evaluateAllConditionalLogic(assessment, responses);
  const validationErrors = validateAllResponses(
    assessment,
    responses,
    conditionalStates
  );
  const completionPercentage = getAssessmentCompletionPercentage(
    assessment,
    responses,
    conditionalStates
  );

  // Check if assessment can be submitted
  const canSubmit = Object.keys(validationErrors).length === 0;
  const hasResponses = Object.keys(responses).length > 0;

  // Handle save draft
  const handleSave = useCallback(async () => {
    if (!onSave || !hasResponses) return;

    try {
      await onSave(responses);
    } catch (error) {
      console.error("Failed to save draft:", error);
    }
  }, [onSave, responses, hasResponses]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!onSubmit || !canSubmit) return;

    try {
      await onSubmit(responses);
    } catch (error) {
      console.error("Failed to submit assessment:", error);
    }
  }, [onSubmit, responses, canSubmit]);

  // Get validation summary
  const getValidationSummary = () => {
    const errorCount = Object.keys(validationErrors).length;
    const totalQuestions = assessment.sections.reduce((sum, section) => {
      return (
        sum +
        section.questions.filter((q) => conditionalStates[q.id]?.visible).length
      );
    }, 0);
    const answeredQuestions = Object.keys(responses).filter((questionId) => {
      const state = conditionalStates[questionId];
      return (
        state?.visible &&
        responses[questionId] !== undefined &&
        responses[questionId] !== null &&
        responses[questionId] !== ""
      );
    }).length;

    return {
      errorCount,
      totalQuestions,
      answeredQuestions,
      missingRequired: errorCount,
    };
  };

  const validationSummary = getValidationSummary();

  return (
    <div className="space-y-6">
      {/* Assessment Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Assessment Submission
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {candidate.name}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(), "PPP")}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg">{assessment.title}</h3>
              {assessment.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {assessment.description}
                </p>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Progress</span>
                <Badge variant="outline">
                  {completionPercentage}% Complete
                </Badge>
              </div>
              <Progress value={completionPercentage} className="w-full" />
              <p className="text-xs text-muted-foreground">
                {validationSummary.answeredQuestions} of{" "}
                {validationSummary.totalQuestions} questions answered
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {canSubmit ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            )}
            Validation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {canSubmit ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  All required questions have been answered. Your assessment is
                  ready for submission.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {validationSummary.missingRequired} required question
                  {validationSummary.missingRequired !== 1 ? "s" : ""} need
                  {validationSummary.missingRequired === 1 ? "s" : ""} to be
                  answered before submission.
                </AlertDescription>
              </Alert>
            )}

            {!canSubmit && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setShowValidationDetails(!showValidationDetails)
                  }
                >
                  {showValidationDetails ? "Hide" : "Show"} Validation Details
                </Button>

                {showValidationDetails && (
                  <div className="bg-muted/50 p-4 rounded-md space-y-2">
                    <h4 className="font-medium text-sm">
                      Missing Required Responses:
                    </h4>
                    <ul className="space-y-1">
                      {Object.entries(validationErrors).map(
                        ([questionId, error]) => {
                          // Find the question
                          let questionTitle = "Unknown Question";
                          for (const section of assessment.sections) {
                            const question = section.questions.find(
                              (q) => q.id === questionId
                            );
                            if (question) {
                              questionTitle = question.title;
                              break;
                            }
                          }

                          return (
                            <li
                              key={questionId}
                              className="text-sm text-red-600"
                            >
                              • {questionTitle}: {error}
                            </li>
                          );
                        }
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onSave && hasResponses && (
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={isSaving || isSubmitting}
                >
                  {isSaving ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Draft
                    </>
                  )}
                </Button>
              )}

              {onSubmit && (
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting || isSaving}
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Assessment
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {!canSubmit && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> You can save your progress as a draft at
                any time. Complete all required questions to enable submission.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

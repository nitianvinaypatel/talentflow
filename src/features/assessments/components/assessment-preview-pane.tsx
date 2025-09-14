import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Eye, EyeOff } from "lucide-react";
import { AssessmentForm } from "./assessment-form";
import { evaluateAllConditionalLogic } from "../utils/conditional-logic";
import type { Assessment } from "../../../types";

interface AssessmentPreviewPaneProps {
  assessment: Assessment;
  responses: Record<string, unknown>;
  onResponseChange?: (questionId: string, value: unknown) => void;
  className?: string;
}

export const AssessmentPreviewPane: React.FC<AssessmentPreviewPaneProps> = ({
  assessment,
  responses,
  onResponseChange,
  className = "",
}) => {
  // Evaluate conditional logic to show/hide questions
  const conditionalStates = React.useMemo(() => {
    return evaluateAllConditionalLogic(assessment, responses);
  }, [assessment, responses]);

  // Count visible questions
  const visibleQuestionCount = React.useMemo(() => {
    let count = 0;
    for (const section of assessment.sections) {
      for (const question of section.questions) {
        if (conditionalStates[question.id]?.visible) {
          count++;
        }
      }
    }
    return count;
  }, [assessment.sections, conditionalStates]);

  // Count answered questions
  const answeredQuestionCount = React.useMemo(() => {
    let count = 0;
    for (const section of assessment.sections) {
      for (const question of section.questions) {
        const state = conditionalStates[question.id];
        if (
          state?.visible &&
          responses[question.id] !== undefined &&
          responses[question.id] !== ""
        ) {
          count++;
        }
      }
    }
    return count;
  }, [assessment.sections, conditionalStates, responses]);

  // Calculate completion percentage
  const completionPercentage =
    visibleQuestionCount > 0
      ? Math.round((answeredQuestionCount / visibleQuestionCount) * 100)
      : 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preview Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <h2>Live Preview</h2>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {answeredQuestionCount}/{visibleQuestionCount} answered
              </Badge>
              <Badge
                variant={completionPercentage === 100 ? "default" : "secondary"}
              >
                {completionPercentage}% complete
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-muted-foreground">
            This preview shows how the assessment will appear to candidates.
            Questions will show/hide based on conditional logic as you fill out
            responses.
          </div>
        </CardContent>
      </Card>

      {/* Conditional Logic Indicators */}
      {Object.values(conditionalStates).some((state) => !state.visible) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-2">
              <EyeOff className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">
                  Conditional Logic Active
                </p>
                <p className="text-amber-700">
                  Some questions are hidden based on current responses. Change
                  your answers to see different questions appear.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assessment Form Preview */}
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-1">
        <AssessmentForm
          assessment={assessment}
          initialResponses={responses}
          onResponseChange={onResponseChange}
          isPreview={true}
          config={{
            showProgress: true,
            enableSectionNavigation: true,
            validateOnBlur: true,
            allowPartialSave: false, // No save in preview
          }}
        />
      </div>
    </div>
  );
};

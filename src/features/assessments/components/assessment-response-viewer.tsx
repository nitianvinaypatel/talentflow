import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Separator } from "../../../components/ui/separator";
import { ScrollArea } from "../../../components/ui/scroll-area";
import {
  Eye,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import type {
  AssessmentResponse,
  Assessment,
  Candidate,
  Question,
} from "../../../types";

interface AssessmentResponseViewerProps {
  response: AssessmentResponse;
  assessment: Assessment;
  candidate: Candidate;
  onClose?: () => void;
}

export const AssessmentResponseViewer: React.FC<
  AssessmentResponseViewerProps
> = ({ response, assessment, candidate, onClose }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  // Expand all sections by default
  useEffect(() => {
    const sectionIds = assessment.sections.map((s) => s.id);
    setExpandedSections(new Set(sectionIds));
  }, [assessment.sections]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: AssessmentResponse["status"]) => {
    switch (status) {
      case "draft":
        return (
          <Clock className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
        );
      case "submitted":
        return (
          <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
        );
      case "reviewed":
        return <Eye className="h-4 w-4 text-blue-500 dark:text-blue-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: AssessmentResponse["status"]) => {
    switch (status) {
      case "draft":
        return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700";
      case "submitted":
        return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700";
      case "reviewed":
        return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700";
      default:
        return "bg-secondary text-secondary-foreground border-border";
    }
  };

  const findQuestionById = (questionId: string): Question | undefined => {
    for (const section of assessment.sections) {
      const question = section.questions.find((q) => q.id === questionId);
      if (question) return question;
    }
    return undefined;
  };

  const renderResponseValue = (question: Question, value: any) => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-muted-foreground italic">No response</span>;
    }

    switch (question.type) {
      case "single-choice":
        return <span className="font-medium">{value}</span>;

      case "multi-choice":
        if (Array.isArray(value)) {
          return (
            <div className="flex flex-wrap gap-1">
              {value.map((item, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          );
        }
        return <span className="font-medium">{String(value)}</span>;

      case "short-text":
        return <span className="font-medium">{value}</span>;

      case "long-text":
        return (
          <div className="bg-muted/50 p-3 rounded-md">
            <pre className="whitespace-pre-wrap text-sm font-medium">
              {value}
            </pre>
          </div>
        );

      case "numeric":
        return <span className="font-medium font-mono">{value}</span>;

      case "file-upload":
        if (typeof value === "object" && value.name) {
          return (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
              <FileText className="h-4 w-4" />
              <span className="font-medium">{value.name}</span>
              <Badge variant="outline" className="text-xs">
                {(value.size / 1024).toFixed(1)} KB
              </Badge>
            </div>
          );
        }
        return <span className="font-medium">{String(value)}</span>;

      default:
        return <span className="font-medium">{String(value)}</span>;
    }
  };

  const calculateCompletionPercentage = () => {
    const totalQuestions = assessment.sections.reduce(
      (sum, section) => sum + section.questions.length,
      0
    );
    const answeredQuestions = response.responses.length;
    return totalQuestions > 0
      ? Math.round((answeredQuestions / totalQuestions) * 100)
      : 0;
  };

  const exportResponse = () => {
    const exportData = {
      candidate: {
        name: candidate.name,
        email: candidate.email,
      },
      assessment: {
        title: assessment.title,
        description: assessment.description,
      },
      response: {
        status: response.status,
        submittedAt: response.submittedAt,
        responses: response.responses.map((r) => {
          const question = findQuestionById(r.questionId);
          return {
            question: question?.title || "Unknown Question",
            type: r.type,
            value: r.value,
          };
        }),
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assessment-response-${candidate.name}-${format(
      response.submittedAt,
      "yyyy-MM-dd"
    )}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {candidate.name}'s Assessment Response
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {assessment.title}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(response.submittedAt, "PPP")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(response.status)}>
                {getStatusIcon(response.status)}
                <span className="ml-1 capitalize">{response.status}</span>
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Completion: {calculateCompletionPercentage()}%
              </p>
              <p className="text-xs text-muted-foreground">
                {response.responses.length} of{" "}
                {assessment.sections.reduce(
                  (sum, s) => sum + s.questions.length,
                  0
                )}{" "}
                questions answered
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportResponse}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              {onClose && (
                <Button variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Sections and Responses */}
      <div className="space-y-4">
        {assessment.sections.map((section) => {
          const sectionResponses = response.responses.filter((r) =>
            section.questions.some((q) => q.id === r.questionId)
          );
          const isExpanded = expandedSections.has(section.id);

          return (
            <Card key={section.id}>
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {sectionResponses.length} / {section.questions.length}{" "}
                      answered
                    </Badge>
                    <Button variant="ghost" size="sm">
                      {isExpanded ? "Collapse" : "Expand"}
                    </Button>
                  </div>
                </div>
                {section.description && (
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                )}
              </CardHeader>

              {isExpanded && (
                <CardContent>
                  <ScrollArea className="max-h-96">
                    <div className="space-y-4">
                      {section.questions.map((question, questionIndex) => {
                        const questionResponse = response.responses.find(
                          (r) => r.questionId === question.id
                        );

                        return (
                          <div key={question.id}>
                            {questionIndex > 0 && (
                              <Separator className="my-4" />
                            )}
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <h4 className="font-medium text-sm">
                                  {question.title}
                                  {question.required && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  {question.type}
                                </Badge>
                              </div>

                              {question.description && (
                                <p className="text-xs text-muted-foreground">
                                  {question.description}
                                </p>
                              )}

                              <div className="mt-2">
                                {questionResponse ? (
                                  renderResponseValue(
                                    question,
                                    questionResponse.value
                                  )
                                ) : (
                                  <span className="text-muted-foreground italic text-sm">
                                    No response provided
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Eye,
  Download,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import type { AssessmentResponse, Assessment, Candidate } from "../../../types";

interface AssessmentResponseListProps {
  responses: AssessmentResponse[];
  assessments: Assessment[];
  candidates: Candidate[];
  onViewResponse?: (response: AssessmentResponse) => void;
  onExportResponse?: (response: AssessmentResponse) => void;
  onUpdateStatus?: (
    responseId: string,
    status: AssessmentResponse["status"]
  ) => void;
  loading?: boolean;
}

interface ResponseWithDetails extends AssessmentResponse {
  assessment?: Assessment;
  candidate?: Candidate;
}

export const AssessmentResponseList: React.FC<AssessmentResponseListProps> = ({
  responses,
  assessments,
  candidates,
  onViewResponse,
  onExportResponse,
  onUpdateStatus,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | AssessmentResponse["status"]
  >("all");
  const [assessmentFilter, setAssessmentFilter] = useState<string>("all");

  // Combine responses with assessment and candidate details
  const responsesWithDetails = useMemo((): ResponseWithDetails[] => {
    return responses.map((response) => ({
      ...response,
      assessment: assessments.find((a) => a.id === response.assessmentId),
      candidate: candidates.find((c) => c.id === response.candidateId),
    }));
  }, [responses, assessments, candidates]);

  // Filter responses
  const filteredResponses = useMemo(() => {
    return responsesWithDetails.filter((response) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const candidateName = response.candidate?.name?.toLowerCase() || "";
        const candidateEmail = response.candidate?.email?.toLowerCase() || "";
        const assessmentTitle = response.assessment?.title?.toLowerCase() || "";

        if (
          !candidateName.includes(searchLower) &&
          !candidateEmail.includes(searchLower) &&
          !assessmentTitle.includes(searchLower)
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "all" && response.status !== statusFilter) {
        return false;
      }

      // Assessment filter
      if (
        assessmentFilter !== "all" &&
        response.assessmentId !== assessmentFilter
      ) {
        return false;
      }

      return true;
    });
  }, [responsesWithDetails, searchTerm, statusFilter, assessmentFilter]);

  // Sort responses by submission date (newest first)
  const sortedResponses = useMemo(() => {
    return [...filteredResponses].sort((a, b) => {
      return (
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
    });
  }, [filteredResponses]);

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

  const calculateCompletionPercentage = (response: AssessmentResponse) => {
    const assessment = assessments.find((a) => a.id === response.assessmentId);
    if (!assessment) return 0;

    const totalQuestions = assessment.sections.reduce(
      (sum: number, section: { questions: unknown[] }) =>
        sum + section.questions.length,
      0
    );
    const answeredQuestions = response.responses.length;

    return totalQuestions > 0
      ? Math.round((answeredQuestions / totalQuestions) * 100)
      : 0;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Assessment Responses
            <Badge variant="outline" className="ml-2">
              {sortedResponses.length} response
              {sortedResponses.length !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by candidate name, email, or assessment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value: "all" | AssessmentResponse["status"]) =>
                setStatusFilter(value)
              }
            >
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={assessmentFilter}
              onValueChange={setAssessmentFilter}
            >
              <SelectTrigger className="w-full sm:w-48">
                <FileText className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by assessment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assessments</SelectItem>
                {assessments.map((assessment) => (
                  <SelectItem key={assessment.id} value={assessment.id}>
                    {assessment.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Response List */}
      <div className="space-y-4">
        {sortedResponses.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No responses found</h3>
                <p className="text-muted-foreground">
                  {responses.length === 0
                    ? "No assessment responses have been submitted yet."
                    : "No responses match your current filters."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          sortedResponses.map((response) => (
            <Card
              key={response.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-medium">
                            {response.candidate?.name || "Unknown Candidate"}
                          </h3>
                          <Badge className={getStatusColor(response.status)}>
                            {getStatusIcon(response.status)}
                            <span className="ml-1 capitalize">
                              {response.status}
                            </span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {response.candidate?.email || "No email"}
                        </p>
                      </div>
                    </div>

                    {/* Assessment Info */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {response.assessment?.title || "Unknown Assessment"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(response.submittedAt), "PPp")}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">
                            Completion
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {calculateCompletionPercentage(response)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{
                              width: `${calculateCompletionPercentage(
                                response
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {response.responses.length} responses
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {onViewResponse && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewResponse(response)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onExportResponse && (
                          <DropdownMenuItem
                            onClick={() => onExportResponse(response)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </DropdownMenuItem>
                        )}

                        {onUpdateStatus && response.status !== "reviewed" && (
                          <DropdownMenuItem
                            onClick={() =>
                              onUpdateStatus(response.id, "reviewed")
                            }
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Mark as Reviewed
                          </DropdownMenuItem>
                        )}

                        {onUpdateStatus && response.status === "reviewed" && (
                          <DropdownMenuItem
                            onClick={() =>
                              onUpdateStatus(response.id, "submitted")
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Submitted
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

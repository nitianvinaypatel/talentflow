import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import {
  FileText,
  Users,
  CheckCircle,
  Clock,
  Eye,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { AssessmentResponseList } from "../components/assessment-response-list";
import { AssessmentResponseViewer } from "../components/assessment-response-viewer";
import { AssessmentResponseService } from "../services/response-service";
import {
  AssessmentsService,
  CandidatesService,
} from "../../../lib/db/operations";
import type { AssessmentResponse, Assessment, Candidate } from "../../../types";

export const AssessmentResponsesPage: React.FC = () => {
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedResponse, setSelectedResponse] =
    useState<AssessmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [responsesData, assessmentsData, candidatesData] =
        await Promise.all([
          AssessmentResponseService.getResponsesForCandidate(""), // Get all responses
          AssessmentsService.getAll(),
          CandidatesService.getAll(),
        ]);

      // If getting all responses fails, try getting from local storage
      let allResponses = responsesData;
      if (!allResponses || allResponses.length === 0) {
        // Get all responses from all candidates
        const candidateResponses = await Promise.all(
          candidatesData.map((candidate) =>
            AssessmentResponseService.getResponsesForCandidate(candidate.id)
          )
        );
        allResponses = candidateResponses.flat();
      }

      setResponses(allResponses);
      setAssessments(assessmentsData);
      setCandidates(candidatesData);
    } catch (err) {
      console.error("Failed to load assessment responses:", err);
      setError("Failed to load assessment responses. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleViewResponse = useCallback((response: AssessmentResponse) => {
    setSelectedResponse(response);
  }, []);

  const handleCloseViewer = useCallback(() => {
    setSelectedResponse(null);
  }, []);

  const handleExportResponse = useCallback(
    (response: AssessmentResponse) => {
      const candidate = candidates.find((c) => c.id === response.candidateId);
      const assessment = assessments.find(
        (a) => a.id === response.assessmentId
      );

      if (!candidate || !assessment) {
        console.error("Cannot export: missing candidate or assessment data");
        return;
      }

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
            const question = assessment.sections
              .flatMap((s) => s.questions)
              .find((q) => q.id === r.questionId);

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
      a.download = `assessment-response-${candidate.name}-${
        new Date(response.submittedAt).toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [candidates, assessments]
  );

  const handleUpdateStatus = useCallback(
    async (responseId: string, status: AssessmentResponse["status"]) => {
      try {
        const updatedResponse = await AssessmentResponseService.updateResponse(
          responseId,
          { status }
        );

        if (updatedResponse) {
          setResponses((prev) =>
            prev.map((r) => (r.id === responseId ? updatedResponse : r))
          );
        }
      } catch (err) {
        console.error("Failed to update response status:", err);
        setError("Failed to update response status. Please try again.");
      }
    },
    []
  );

  // Filter responses by status for tabs
  const getFilteredResponses = (status?: AssessmentResponse["status"]) => {
    if (!status) return responses;
    return responses.filter((r) => r.status === status);
  };

  // Calculate statistics
  const stats = {
    total: responses.length,
    draft: responses.filter((r) => r.status === "draft").length,
    submitted: responses.filter((r) => r.status === "submitted").length,
    reviewed: responses.filter((r) => r.status === "reviewed").length,
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: "#000319", minHeight: "100vh" }}>
        <div className="container mx-auto py-8">
          <Card style={{ backgroundColor: "#0d1025", borderColor: "#1f2937" }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="text-gray-400">
                    Loading assessment responses...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#000319", minHeight: "100vh" }}>
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Assessment Responses
            </h1>
            <p className="text-gray-400 mt-2">
              View and manage candidate assessment submissions
            </p>
          </div>
          <Button
            onClick={loadData}
            variant="outline"
            className="border-gray-700 text-white hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card style={{ backgroundColor: "#0d1025", borderColor: "#1f2937" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Total Responses
              </CardTitle>
              <FileText className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <p className="text-xs text-gray-400">
                From {candidates.length} candidate
                {candidates.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: "#0d1025", borderColor: "#1f2937" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Draft
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.draft}</div>
              <p className="text-xs text-gray-400">In progress</p>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: "#0d1025", borderColor: "#1f2937" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Submitted
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.submitted}
              </div>
              <p className="text-xs text-gray-400">Awaiting review</p>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: "#0d1025", borderColor: "#1f2937" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Reviewed
              </CardTitle>
              <Eye className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.reviewed}
              </div>
              <p className="text-xs text-gray-400">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Response List with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
            <TabsTrigger
              value="all"
              className="flex items-center gap-2 text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700"
            >
              <Users className="h-4 w-4" />
              All
              <Badge
                variant="secondary"
                className="ml-1 bg-gray-700 text-gray-300"
              >
                {stats.total}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="draft"
              className="flex items-center gap-2 text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700"
            >
              <Clock className="h-4 w-4" />
              Draft
              <Badge
                variant="secondary"
                className="ml-1 bg-gray-700 text-gray-300"
              >
                {stats.draft}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="submitted"
              className="flex items-center gap-2 text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700"
            >
              <CheckCircle className="h-4 w-4" />
              Submitted
              <Badge
                variant="secondary"
                className="ml-1 bg-gray-700 text-gray-300"
              >
                {stats.submitted}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="reviewed"
              className="flex items-center gap-2 text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700"
            >
              <Eye className="h-4 w-4" />
              Reviewed
              <Badge
                variant="secondary"
                className="ml-1 bg-gray-700 text-gray-300"
              >
                {stats.reviewed}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <AssessmentResponseList
              responses={getFilteredResponses()}
              assessments={assessments}
              candidates={candidates}
              onViewResponse={handleViewResponse}
              onExportResponse={handleExportResponse}
              onUpdateStatus={handleUpdateStatus}
            />
          </TabsContent>

          <TabsContent value="draft">
            <AssessmentResponseList
              responses={getFilteredResponses("draft")}
              assessments={assessments}
              candidates={candidates}
              onViewResponse={handleViewResponse}
              onExportResponse={handleExportResponse}
              onUpdateStatus={handleUpdateStatus}
            />
          </TabsContent>

          <TabsContent value="submitted">
            <AssessmentResponseList
              responses={getFilteredResponses("submitted")}
              assessments={assessments}
              candidates={candidates}
              onViewResponse={handleViewResponse}
              onExportResponse={handleExportResponse}
              onUpdateStatus={handleUpdateStatus}
            />
          </TabsContent>

          <TabsContent value="reviewed">
            <AssessmentResponseList
              responses={getFilteredResponses("reviewed")}
              assessments={assessments}
              candidates={candidates}
              onViewResponse={handleViewResponse}
              onExportResponse={handleExportResponse}
              onUpdateStatus={handleUpdateStatus}
            />
          </TabsContent>
        </Tabs>

        {/* Response Viewer Dialog */}
        <Dialog open={!!selectedResponse} onOpenChange={handleCloseViewer}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assessment Response Details</DialogTitle>
              <DialogDescription>
                Review the candidate's responses to the assessment questions
              </DialogDescription>
            </DialogHeader>
            {selectedResponse && (
              <AssessmentResponseViewer
                response={selectedResponse}
                assessment={
                  assessments.find(
                    (a) => a.id === selectedResponse.assessmentId
                  )!
                }
                candidate={
                  candidates.find((c) => c.id === selectedResponse.candidateId)!
                }
                onClose={handleCloseViewer}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

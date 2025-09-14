import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import {
  Plus,
  Settings,
  Eye,
  FileText,
  Clock,
  BarChart,
  Users,
  TrendingUp,
  Edit,
} from "lucide-react";
import { useAppStore } from "../../../lib/store";

export const AssessmentsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { assessments, jobs, syncWithAPI, loading } = useAppStore();
  const [showJobSelectionModal, setShowJobSelectionModal] = useState(false);

  useEffect(() => {
    // Load assessments when component mounts
    const loadData = async () => {
      try {
        await syncWithAPI();
      } catch (error) {
        console.error("Failed to load assessments:", error);
      }
    };
    loadData();
  }, [syncWithAPI]);

  const handleCreateAssessment = () => {
    // Check if there are any jobs available
    const safeJobs = Array.isArray(jobs) ? jobs : [];

    // Always show job selection modal if there are jobs, allowing user to choose
    // or create a standalone assessment
    if (safeJobs.length > 0) {
      setShowJobSelectionModal(true);
    } else {
      // If no jobs exist, create a standalone assessment
      navigate("/assessments/builder");
    }
  };

  const handleJobSelection = (jobId?: string) => {
    setShowJobSelectionModal(false);
    if (jobId) {
      navigate(`/assessments/builder/${jobId}`);
    } else {
      navigate("/assessments/builder");
    }
  };

  const handleEditAssessment = (assessmentId: string, jobId?: string) => {
    if (jobId) {
      navigate(`/assessments/builder/${jobId}/${assessmentId}`);
    } else {
      navigate(`/assessments/builder/standalone/${assessmentId}`);
    }
  };

  const handlePreviewAssessment = (assessmentId: string) => {
    navigate(`/assessments/preview/${assessmentId}`);
  };

  // Ensure assessments is always an array
  const safeAssessments = Array.isArray(assessments) ? assessments : [];

  const totalResponses = safeAssessments.reduce((sum, assessment) => {
    // This would normally come from assessment responses
    return sum + assessment.sections.length * 5; // Mock response count
  }, 0);

  const averageDuration =
    safeAssessments.length > 0
      ? Math.round(
          safeAssessments.reduce((sum, assessment) => {
            return sum + assessment.sections.length * 10; // Mock duration calculation
          }, 0) / safeAssessments.length
        )
      : 0;

  const activeAssessments = safeAssessments.filter(
    (assessment) => assessment.sections.length > 0 // Consider assessments with sections as "active"
  );

  return (
    <div className="h-full" style={{ backgroundColor: "#000319" }}>
      <div className="space-y-6 p-6 h-full overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Assessment Center
            </h1>
            <p className="text-gray-400 mt-2 text-lg">
              Create and manage custom assessments for your hiring process
            </p>
          </div>
          <Button
            onClick={handleCreateAssessment}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="mr-2 h-5 w-5" />
            New Assessment
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card
            className="group hover:shadow-md transition-all duration-200 border border-gray-700"
            style={{ backgroundColor: "#0d1025" }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                Total Assessments
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <FileText className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {safeAssessments.length}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                <span className="inline-flex items-center text-green-400">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {activeAssessments.length} active
                </span>
              </p>
            </CardContent>
          </Card>

          <Card
            className="group hover:shadow-md transition-all duration-200 border border-gray-700"
            style={{ backgroundColor: "#0d1025" }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                Total Responses
              </CardTitle>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {totalResponses}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                <span className="inline-flex items-center text-green-400">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Across all assessments
                </span>
              </p>
            </CardContent>
          </Card>

          <Card
            className="group hover:shadow-md transition-all duration-200 border border-gray-700"
            style={{ backgroundColor: "#0d1025" }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                Avg. Duration
              </CardTitle>
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500">
                <Clock className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {averageDuration} min
              </div>
              <p className="text-xs text-gray-400 mt-1">
                <span className="inline-flex items-center text-amber-400">
                  <Clock className="h-3 w-3 mr-1" />
                  Estimated completion time
                </span>
              </p>
            </CardContent>
          </Card>

          <Card
            className="group hover:shadow-md transition-all duration-200 border border-gray-700"
            style={{ backgroundColor: "#0d1025" }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                Completion Rate
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">85%</div>
              <p className="text-xs text-gray-400 mt-1">
                <span className="inline-flex items-center text-green-400">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Average completion rate
                </span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Assessments List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">
              Your Assessments
            </h2>
            {loading.sync && (
              <Badge
                variant="secondary"
                className="animate-pulse bg-gray-700 text-gray-300"
              >
                Syncing...
              </Badge>
            )}
          </div>

          {safeAssessments.length === 0 ? (
            <Card
              className="border-dashed border-2 border-gray-600"
              style={{ backgroundColor: "#0d1025" }}
            >
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="h-16 w-16 text-gray-500 mb-4" />
                <h3 className="text-xl font-medium text-gray-300 mb-2">
                  No assessments yet
                </h3>
                <p className="text-gray-400 text-center mb-6 max-w-md">
                  Create your first assessment to start evaluating candidates
                  for your open positions.
                </p>
                <Button
                  onClick={handleCreateAssessment}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Assessment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {safeAssessments.map((assessment) => {
                const job = (jobs || []).find((j) => j.id === assessment.jobId);
                const totalQuestions = assessment.sections.reduce(
                  (sum, section) => sum + section.questions.length,
                  0
                );
                const estimatedDuration = totalQuestions * 2; // 2 mins per question
                const mockResponses =
                  totalQuestions > 0 ? Math.floor(Math.random() * 25) + 1 : 0;

                return (
                  <Card
                    key={assessment.id}
                    className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 border border-gray-700"
                    style={{ backgroundColor: "#0d1025" }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-xl font-semibold text-white">
                            {assessment.title}
                          </CardTitle>
                          <CardDescription className="text-base text-gray-400">
                            {assessment.description ||
                              "No description provided"}
                          </CardDescription>
                          {job ? (
                            <Badge
                              variant="outline"
                              className="w-fit bg-gray-800 border-gray-600 text-gray-300"
                            >
                              <Link
                                to={`/jobs/${job.id}`}
                                className="hover:underline"
                              >
                                {job.title}
                              </Link>
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="w-fit bg-purple-900/20 border-purple-500/30 text-purple-300"
                            >
                              🎯 Standalone Assessment
                            </Badge>
                          )}
                        </div>
                        <Badge
                          variant={
                            assessment.sections.length > 0
                              ? "default"
                              : "secondary"
                          }
                          className={
                            assessment.sections.length > 0
                              ? "bg-green-600/20 text-green-400 border-green-500/30"
                              : "bg-gray-600/20 text-gray-300 border-gray-500/30"
                          }
                        >
                          {assessment.sections.length > 0 ? "Active" : "Draft"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-8 text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>{assessment.sections.length} sections</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BarChart className="h-4 w-4" />
                            <span>{totalQuestions} questions</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>~{estimatedDuration} min</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{mockResponses} responses</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700"
                            onClick={() =>
                              handlePreviewAssessment(assessment.id)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700"
                            onClick={() =>
                              handleEditAssessment(
                                assessment.id,
                                assessment.jobId
                              )
                            }
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          {assessment.sections.length === 0 && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Settings className="mr-2 h-4 w-4" />
                              Build
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Getting Started Guide */}
        {safeAssessments.length < 3 && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-xl">
                Getting Started with Assessments
              </CardTitle>
              <CardDescription>
                Create powerful assessments in just a few steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">
                      Choose Assessment Type
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Select from technical skills, personality, or create
                      custom assessment templates
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Add Questions</h4>
                    <p className="text-sm text-muted-foreground">
                      Create multiple choice, text, or coding questions with our
                      intuitive builder
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Configure & Publish</h4>
                    <p className="text-sm text-muted-foreground">
                      Set time limits, scoring, and publish to start collecting
                      responses
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Job Selection Modal */}
        <Dialog
          open={showJobSelectionModal}
          onOpenChange={setShowJobSelectionModal}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Select Assessment Type</DialogTitle>
              <DialogDescription>
                Choose to create a job-specific assessment or a standalone
                assessment that can be used for multiple positions.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Standalone Assessment Option */}
              <Card
                className="cursor-pointer hover:shadow-md transition-shadow border-2 border-blue-200 bg-blue-50"
                onClick={() => handleJobSelection()}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-blue-900">
                        🎯 Standalone Assessment
                      </h4>
                      <p className="text-sm text-blue-700">
                        Create a general assessment that can be used for any
                        position
                      </p>
                      <Badge className="mt-1 bg-blue-600 text-white">
                        Recommended
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Job-Specific Options */}
              {Array.isArray(jobs) && jobs.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-600 border-t pt-3">
                    Or associate with a specific job:
                  </h5>
                  {jobs.map((job) => (
                    <Card
                      key={job.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleJobSelection(job.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{job.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {job.location}
                            </p>
                            <Badge
                              variant={
                                job.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                              className="mt-1"
                            >
                              {job.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowJobSelectionModal(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

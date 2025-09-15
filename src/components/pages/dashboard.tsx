import React, { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Users,
  Briefcase,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "../ui/button";
import { useAppStore } from "../../lib/store";

export const Dashboard: React.FC = () => {
  const {
    jobs,
    candidates,
    assessments,
    loading,
    errors,
    loadFromStorage,
  } = useAppStore();

  // Function to refresh data from the store
  const refreshData = async () => {
    try {
      // Load from storage first (IndexedDB)
      await loadFromStorage();
    } catch (err) {
      // Silent error handling - errors are managed by the store
    }
  };

  // Get safe arrays first with robust null checks
  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const safeCandidates = Array.isArray(candidates) ? candidates : [];
  const safeAssessments = Array.isArray(assessments) ? assessments : [];

  useEffect(() => {
    // Always refresh data when dashboard mounts
    refreshData();
  }, []); // Remove dependency to avoid infinite loops

  // Auto-refresh when candidates data changes (for real-time updates)
  useEffect(() => {
    // Data updated - component will re-render automatically
  }, [safeCandidates.length]);

  // Auto-refresh when jobs data changes
  useEffect(() => {
    // Data updated - component will re-render automatically
  }, [safeJobs.length]);

  // Check if any data is loading
  const isLoading = loading.loadFromStorage || loading.sync;
  const hasError = errors.loadFromStorage || errors.sync;

  // Calculate stats from actual data with robust null checks
  const stats = {
    totalJobs: safeJobs.length,
    activeJobs: safeJobs.filter((job) => job.status === "active").length,
    archivedJobs: safeJobs.filter((job) => job.status === "archived").length,
    totalCandidates: safeCandidates.length,
    candidatesThisWeek: safeCandidates.filter((c) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(c.appliedAt) > weekAgo;
    }).length,
    hiredCandidates: safeCandidates.filter((c) => c.stage === "hired").length,
    appliedCandidates: safeCandidates.filter((c) => c.stage === "applied").length,
    screenCandidates: safeCandidates.filter((c) => c.stage === "screen").length,
    techCandidates: safeCandidates.filter((c) => c.stage === "tech").length,
    offerCandidates: safeCandidates.filter((c) => c.stage === "offer").length,
    rejectedCandidates: safeCandidates.filter((c) => c.stage === "rejected").length,
    pendingAssessments: safeAssessments.length,
  };



  // Sort jobs by creation date (most recent first) and take top 5
  const recentJobs = safeJobs
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((job) => ({
      id: job.id,
      title: job.title,
      status: job.status,
      candidates: safeCandidates.filter((c) => c.jobId === job.id).length,
      location: job.location,
      type: job.type,
      tags: job.tags,
      createdAt: job.createdAt,
    }));

  // Sort candidates by application date (most recent first) and take top 5
  const recentCandidates = safeCandidates
    .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
    .slice(0, 5)
    .map((candidate) => {
      const job = safeJobs.find((j) => j.id === candidate.jobId);
      return {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        stage: candidate.stage,
        jobTitle: job?.title || "Unknown Position",
        appliedAt: candidate.appliedAt,
      };
    });

  // Sort assessments by creation date (most recent first) and take top 5
  const recentAssessments = safeAssessments
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 text-blue-400 animate-spin" />
          <div className="text-white text-lg">Loading Dashboard Data...</div>
          <div className="text-gray-400 text-sm">Fetching latest data from store</div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">Error loading dashboard data</div>
          <div className="text-gray-400 text-sm mb-6">{hasError}</div>
          <Button
            onClick={refreshData}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full" style={{ backgroundColor: "#000319" }}>
      <div className="space-y-6 p-6 h-full overflow-hidden">

        {/* Stats Cards with professional styling */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card
            className="group hover:shadow-md transition-all duration-200 border border-gray-700"
            style={{ backgroundColor: "#0d1025" }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                Total Jobs
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <Briefcase className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.totalJobs}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                <span className="inline-flex items-center text-green-400">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stats.activeJobs} active
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
                Total Candidates
              </CardTitle>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.totalCandidates}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                <span className="inline-flex items-center text-green-400">
                  <TrendingUp className="h-3 w-3 mr-1" />+
                  {stats.candidatesThisWeek} this week
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
                Assessment Templates
              </CardTitle>
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500">
                <FileText className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.pendingAssessments}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                <span className="inline-flex items-center text-blue-400">
                  <FileText className="h-3 w-3 mr-1" />
                  Ready to use
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
                Hired Candidates
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.hiredCandidates}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                <span className="inline-flex items-center text-green-400">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {stats.totalCandidates > 0
                    ? Math.round(
                      (stats.hiredCandidates / stats.totalCandidates) * 100
                    )
                    : 0}
                  % success rate
                </span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity with professional styling */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Recent Jobs */}
          <Card
            className="border border-gray-700"
            style={{ backgroundColor: "#0d1025" }}
          >
            <CardHeader className="pb-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-white">
                    Recent Jobs
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Your latest job postings and their status
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {recentJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No jobs found</p>
                    <p className="text-gray-500 text-sm">Create your first job to get started</p>
                  </div>
                ) : (
                  recentJobs.map((job, index) => (
                    <div
                      key={job.id}
                      className="group flex flex-col space-y-2 p-4 rounded-lg hover:bg-gray-800/50 transition-colors duration-200"
                      style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div
                            className={`w-2 h-2 rounded-full ${index === 0
                              ? "bg-green-500"
                              : index === 1
                                ? "bg-amber-500"
                                : "bg-blue-500"
                              }`}
                          ></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-white">
                              {job.title}
                            </p>
                            <p className="text-xs text-gray-400">
                              {job.location} • {job.type}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            job.status === "active" ? "default" : "secondary"
                          }
                          className={`${job.status === "active"
                            ? "bg-green-600/20 text-green-400 border-green-500/30"
                            : "bg-gray-600/20 text-gray-300 border-gray-500/30"
                            }`}
                        >
                          {job.status === "active" ? (
                            <>
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <Clock className="mr-1 h-3 w-3" />
                              Archived
                            </>
                          )}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">
                          {job.candidates} candidates
                        </span>
                        <span className="text-gray-500">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Candidates */}
          <Card
            className="border border-gray-700"
            style={{ backgroundColor: "#0d1025" }}
          >
            <CardHeader className="pb-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-white">
                    Recent Candidates
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Latest candidate applications and their status
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {recentCandidates.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No candidates found</p>
                    <p className="text-gray-500 text-sm">Candidates will appear here when they apply</p>
                  </div>
                ) : (
                  recentCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="group flex flex-col space-y-2 p-4 rounded-lg hover:bg-gray-800/50 transition-colors duration-200"
                      style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div
                            className={`w-2 h-2 rounded-full ${candidate.stage === "hired"
                              ? "bg-green-500"
                              : candidate.stage === "offer"
                                ? "bg-blue-500"
                                : candidate.stage === "rejected"
                                  ? "bg-red-500"
                                  : "bg-amber-500"
                              }`}
                          ></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-white">
                              {candidate.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {candidate.email}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            candidate.stage === "hired"
                              ? "default"
                              : candidate.stage === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                          className={`${candidate.stage === "hired"
                            ? "bg-green-600/20 text-green-400 border-green-500/30"
                            : candidate.stage === "rejected"
                              ? "bg-red-600/20 text-red-400 border-red-500/30"
                              : candidate.stage === "offer"
                                ? "bg-blue-600/20 text-blue-400 border-blue-500/30"
                                : "bg-amber-600/20 text-amber-400 border-amber-500/30"
                            }`}
                        >
                          {candidate.stage === "hired" && (
                            <CheckCircle className="mr-1 h-3 w-3" />
                          )}
                          {candidate.stage === "rejected" && (
                            <Clock className="mr-1 h-3 w-3" />
                          )}
                          {candidate.stage.charAt(0).toUpperCase() +
                            candidate.stage.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 truncate">
                          {candidate.jobTitle}
                        </span>
                        <span className="text-gray-500">
                          {new Date(candidate.appliedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Assessments */}
          <Card
            className="border border-gray-700"
            style={{ backgroundColor: "#0d1025" }}
          >
            <CardHeader className="pb-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-white">
                    Assessments
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Available assessment templates
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {recentAssessments.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No assessments found</p>
                    <p className="text-gray-500 text-sm">Create assessment templates to get started</p>
                  </div>
                ) : (
                  recentAssessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="group flex flex-col space-y-2 p-4 rounded-lg hover:bg-gray-800/50 transition-colors duration-200"
                      style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-white">
                              {assessment.title}
                            </p>
                            <p className="text-xs text-gray-400">
                              {assessment.sections.length} sections
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-blue-600/20 text-blue-400 border-blue-500/30"
                        >
                          <FileText className="mr-1 h-3 w-3" />
                          Template
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">
                          {assessment.sections.length} sections
                        </span>
                        <span className="text-gray-500">
                          {new Date(assessment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

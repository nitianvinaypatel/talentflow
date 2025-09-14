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
} from "lucide-react";
import { useAppStore } from "../../lib/store";

export const Dashboard: React.FC = () => {
  const {
    jobs,
    candidates,
    assessments,
    loadAllData,
    loading,
    loadFromStorage,
  } = useAppStore();

  useEffect(() => {
    // Initialize database and load data when Dashboard component mounts
    const initializeDashboard = async () => {
      // First load from storage which will trigger seeding if needed
      await loadFromStorage();
      // Then load all data to ensure everything is fresh
      await loadAllData();
    };

    initializeDashboard();
  }, [loadAllData, loadFromStorage]);

  // Get safe arrays first with robust null checks
  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const safeCandidates = Array.isArray(candidates) ? candidates : [];
  const safeAssessments = Array.isArray(assessments) ? assessments : [];

  // Calculate stats from actual data with robust null checks
  const stats = {
    totalJobs: safeJobs.length,
    activeJobs: safeJobs.filter((job) => job.status === "active").length,
    totalCandidates: safeCandidates.length,
    pendingAssessments: safeAssessments.length,
  };

  const recentJobs = safeJobs.slice(0, 3).map((job) => ({
    id: job.id,
    title: job.title,
    status: job.status,
    candidates: safeCandidates.filter((c) => c.jobId === job.id).length,
  }));

  // Create mock assessment data for now (since we don't have response counts) with robust checks
  const recentAssessments = safeAssessments
    .slice(0, 3)
    .map((assessment, index) => ({
      id: assessment.id,
      title: assessment.title,
      status: index % 2 === 0 ? "completed" : "pending",
      responses: Math.floor(Math.random() * 20) + 1,
    }));

  if (loading.loadJobs || loading.loadCandidates || loading.loadAssessments) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">Loading...</div>
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
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% from last month
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
                Pending Assessments
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
                <span className="inline-flex items-center text-amber-400">
                  <Clock className="h-3 w-3 mr-1" />
                  Awaiting review
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
                Hiring Rate
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">18%</div>
              <p className="text-xs text-gray-400 mt-1">
                <span className="inline-flex items-center text-green-400">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +2% from last month
                </span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity with professional styling */}
        <div className="grid gap-6 md:grid-cols-2">
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
                {recentJobs.map((job, index) => (
                  <div
                    key={job.id}
                    className="group flex items-center justify-between space-x-4 p-3 rounded-lg hover:bg-gray-800/50 transition-colors duration-200"
                    style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          index === 0
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
                          {job.candidates} candidates
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        job.status === "active" ? "default" : "secondary"
                      }
                      className={`${
                        job.status === "active"
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
                          Draft
                        </>
                      )}
                    </Badge>
                  </div>
                ))}
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
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-white">
                    Recent Assessments
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Latest assessment activities and results
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {recentAssessments.map((assessment, index) => (
                  <div
                    key={assessment.id}
                    className="group flex items-center justify-between space-x-4 p-3 rounded-lg hover:bg-gray-800/50 transition-colors duration-200"
                    style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          index === 0
                            ? "bg-green-500"
                            : index === 1
                            ? "bg-amber-500"
                            : "bg-blue-500"
                        }`}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-white">
                          {assessment.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {assessment.responses} responses
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        assessment.status === "completed"
                          ? "default"
                          : assessment.status === "active"
                          ? "secondary"
                          : "outline"
                      }
                      className={`${
                        assessment.status === "completed"
                          ? "bg-green-600/20 text-green-400 border-green-500/30"
                          : assessment.status === "active"
                          ? "bg-blue-600/20 text-blue-400 border-blue-500/30"
                          : "bg-amber-600/20 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {assessment.status === "completed" && (
                        <CheckCircle className="mr-1 h-3 w-3" />
                      )}
                      {assessment.status === "pending" && (
                        <Clock className="mr-1 h-3 w-3" />
                      )}
                      {assessment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

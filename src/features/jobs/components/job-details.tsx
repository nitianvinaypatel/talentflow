import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Archive,
  ArchiveRestore,
  Trash2,
  MapPin,
  Clock,
  Users,
  Calendar,
  Briefcase,
  Star,
  ExternalLink,
  Share2,
} from "lucide-react";
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui";
import { Loading } from "../../../components/ui/loading";
import { useJobs } from "../hooks/use-jobs";
import { JobModal } from "./job-modal";
import { formDataToJob, type JobFormData } from "../types";
import type { Job } from "../../../types";

export function JobDetails() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { getJobById, updateJob, deleteJob, toggleJobStatus } = useJobs();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadJob = useCallback(async () => {
    if (!jobId) return;

    try {
      setLoading(true);
      setError(null);
      const jobData = await getJobById(jobId);

      // Convert date strings to Date objects if they exist
      const job = {
        ...jobData,
        createdAt: jobData.createdAt ? new Date(jobData.createdAt) : new Date(),
        updatedAt: jobData.updatedAt ? new Date(jobData.updatedAt) : new Date(),
      };

      setJob(job);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load job");
    } finally {
      setLoading(false);
    }
  }, [jobId, getJobById]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const handleEdit = async (formData: JobFormData) => {
    if (!job) return;

    const jobData = formDataToJob(formData);
    await updateJob(job.id, jobData);
    // Reload job to get updated data
    await loadJob();
  };

  const handleToggleStatus = async () => {
    if (!job) return;

    setIsActionLoading(true);
    try {
      await toggleJobStatus(job.id, job.status);
      await loadJob();
    } catch (error) {
      console.error("Failed to toggle job status:", error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!job) return;

    if (
      window.confirm(
        "Are you sure you want to delete this job? This action cannot be undone."
      )
    ) {
      setIsActionLoading(true);
      try {
        await deleteJob(job.id);
        navigate("/jobs");
      } catch (error) {
        console.error("Failed to delete job:", error);
        setIsActionLoading(false);
      }
    }
  };

  const formatDate = (date: Date | string) => {
    if (!date) return "Unknown";
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return "Invalid date";

      return new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(dateObj);
    } catch {
      return "Invalid date";
    }
  };

  const getStatusColor = (status: Job["status"]) => {
    return status === "active"
      ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
      : "bg-gray-50 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hover:bg-white/60 dark:hover:bg-slate-800/60"
              >
                <Link to="/jobs">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Jobs
                </Link>
              </Button>
            </div>
            <div className="flex items-center justify-center min-h-[400px]">
              <Loading />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hover:bg-white/60 dark:hover:bg-slate-800/60"
              >
                <Link to="/jobs">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Jobs
                </Link>
              </Button>
            </div>
            <div className="flex items-center justify-center min-h-[400px]">
              <Card className="max-w-md w-full shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <Briefcase className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                    Job Not Found
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                    {error ||
                      "The job you're looking for doesn't exist or has been removed."}
                  </p>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Link to="/jobs">View All Jobs</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Enhanced Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hover:bg-blue-50 dark:hover:bg-slate-800"
              >
                <Link to="/jobs">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Jobs
                </Link>
              </Button>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
              <div>
                <h1 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Job Details
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Manage and view job information
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                disabled={isActionLoading}
                className="bg-white/60 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleStatus}
                disabled={isActionLoading}
                className="bg-white/60 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700"
              >
                {job.status === "active" ? (
                  <>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </>
                ) : (
                  <>
                    <ArchiveRestore className="h-4 w-4 mr-2" />
                    Restore
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isActionLoading}
                className="bg-white/60 dark:bg-slate-800/60 hover:bg-red-50 dark:hover:bg-red-950/30 border-slate-200 dark:border-slate-700 text-red-600 hover:text-red-700 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          {/* Job Details Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Main Content - Takes 3 columns */}
            <div className="xl:col-span-3 space-y-8">
              {/* Hero Section */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                          <Briefcase className="h-6 w-6 text-white" />
                        </div>
                        <Badge
                          className={`${getStatusColor(
                            job.status
                          )} border-0 shadow-sm`}
                        >
                          {job.status === "active" && (
                            <Star className="h-3 w-3 mr-1" />
                          )}
                          {job.status}
                        </Badge>
                      </div>
                      <h1 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">
                        {job.title}
                      </h1>
                      <div className="flex flex-wrap items-center gap-6 text-white/90">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="font-medium">{job.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm border border-white/30`}
                          >
                            {job.type?.replace("-", " ") || "Unknown"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Description and Requirements */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    Job Description
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div>
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-base">
                        {job.description}
                      </p>
                    </div>
                  </div>

                  {job.requirements && job.requirements.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-md flex items-center justify-center">
                          <Star className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        Requirements
                      </h3>
                      <div className="space-y-3">
                        {job.requirements.map((requirement, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                          >
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-slate-700 dark:text-slate-300 leading-relaxed">
                              {requirement}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {job.tags && job.tags.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-md flex items-center justify-center">
                          <Share2 className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                        </div>
                        Skills & Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {job.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40 transition-colors"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Takes 1 column */}
            <div className="xl:col-span-1 space-y-6">
              {/* Job Information */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-md flex items-center justify-center">
                      <Calendar className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    Job Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          Created
                        </p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {formatDate(job.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          Last Updated
                        </p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {formatDate(job.updatedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                        URL Slug
                      </p>
                      <p className="text-sm font-mono bg-slate-200 dark:bg-slate-700 px-3 py-2 rounded-md text-slate-800 dark:text-slate-200 break-all">
                        {job.slug}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-md flex items-center justify-center">
                      <ExternalLink className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                    </div>
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                    asChild
                  >
                    <Link to={`/candidates?jobId=${job.id}`}>
                      <Users className="h-4 w-4 mr-2" />
                      View Candidates
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full bg-white/60 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/30 border-slate-200 dark:border-slate-700"
                    asChild
                  >
                    <Link to="/assessments">
                      <Briefcase className="h-4 w-4 mr-2" />
                      View Assessments
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Edit Modal */}
          <JobModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSubmit={handleEdit}
            job={job}
            title="Edit Job"
          />
        </div>
      </div>
    </div>
  );
}

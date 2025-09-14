import { useState } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  AlertCircle,
  RefreshCw,
  Grid3X3,
  List,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui";
import { JobCard } from "./job-card";
import { JobCardSkeletonGrid } from "./job-card-skeleton";
import { JobModal } from "./job-modal";
import { JobReorderList } from "./job-reorder-list";
import { useJobs } from "../hooks/use-jobs";
import { formDataToJob, type JobFormData } from "../types";
import type { Job } from "../../../types";

export function JobsBoard() {
  const {
    jobs,
    jobsFilters,
    jobsPagination,
    jobsLoading,
    jobsError,
    createJob,
    updateJob,
    deleteJob,
    toggleJobStatus,
    reorderJobs,
    setJobsFilters,
    setJobsPagination,
  } = useJobs();

  // Ensure jobs is always an array
  const safeJobs = Array.isArray(jobs) ? jobs : [];

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [viewingJob, setViewingJob] = useState<Job | null>(null);

  const handleCreateJob = async (formData: JobFormData) => {
    const jobData = {
      ...formDataToJob(formData),
      order: safeJobs.length, // Set order to be at the end
    };
    await createJob(jobData);
  };

  const handleUpdateJob = async (formData: JobFormData) => {
    if (!editingJob) return;

    const jobData = formDataToJob(formData);
    await updateJob(editingJob.id, jobData);
    setEditingJob(null);
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
  };

  const handleDeleteJob = async (id: string) => {
    try {
      await deleteJob(id);
    } catch (error) {
      console.error("Failed to delete job:", error);
    }
  };

  const handleToggleJobStatus = async (
    id: string,
    currentStatus: Job["status"]
  ) => {
    try {
      await toggleJobStatus(id, currentStatus);
    } catch (error) {
      console.error("Failed to toggle job status:", error);
    }
  };

  const handleReorderJobs = async (fromIndex: number, toIndex: number) => {
    try {
      await reorderJobs(fromIndex, toIndex);
    } catch (error) {
      console.error("Failed to reorder jobs:", error);
    }
  };

  const handleViewJob = (job: Job) => {
    setViewingJob(job);
  };

  const handlePageChange = (newPage: number) => {
    console.log("Changing page from", jobsPagination.page, "to", newPage);
    setJobsPagination({ page: newPage });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    console.log(
      "Changing page size from",
      jobsPagination.pageSize,
      "to",
      newPageSize
    );
    setJobsPagination({ page: 1, pageSize: newPageSize });
  };

  const totalPages = Math.ceil(jobsPagination.total / jobsPagination.pageSize);

  // Debug pagination state
  console.log("Pagination Debug:", {
    currentPage: jobsPagination.page,
    pageSize: jobsPagination.pageSize,
    total: jobsPagination.total,
    totalPages,
    jobsCount: safeJobs.length,
    loading: jobsLoading,
    error: jobsError,
  });

  return (
    <div className="h-full" style={{ backgroundColor: "#000319" }}>
      <div className="space-y-6 p-6 h-full overflow-hidden">
        {/* Filters Section with enhanced styling */}
        <Card
          className="border border-gray-700"
          style={{ backgroundColor: "#0d1025" }}
        >
          <CardContent className="p-6">
            {/* Combined Search, Status Filter, and View Mode */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Search - Made shorter */}
              <div className="relative w-80">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={jobsFilters.search || ""}
                  onChange={(e) => setJobsFilters({ search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex gap-2">
                <Button
                  variant={jobsFilters.status === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setJobsFilters({ status: "all" })}
                  className={
                    jobsFilters.status === "all"
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }
                >
                  All Jobs
                </Button>
                <Button
                  variant={
                    jobsFilters.status === "active" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setJobsFilters({ status: "active" })}
                  className={
                    jobsFilters.status === "active"
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }
                >
                  Active
                </Button>
                <Button
                  variant={
                    jobsFilters.status === "archived" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setJobsFilters({ status: "archived" })}
                  className={
                    jobsFilters.status === "archived"
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }
                >
                  Archived
                </Button>
              </div>

              {/* View Mode Buttons */}
              <div className="flex gap-1 border border-gray-600 rounded-md p-1 bg-gray-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`h-8 px-3 ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`h-8 px-3 ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Create Job Button */}
              <div className="ml-auto">
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Job
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pagination with enhanced styling */}
        {!jobsLoading && !jobsError && jobsPagination.total > 0 && (
          <Card
            className="border border-gray-700"
            style={{ backgroundColor: "#0d1025" }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-300">
                    Showing{" "}
                    <span className="font-bold text-blue-400">
                      {Math.min(
                        (jobsPagination.page - 1) * jobsPagination.pageSize + 1,
                        jobsPagination.total
                      )}
                    </span>{" "}
                    to{" "}
                    <span className="font-bold text-blue-400">
                      {Math.min(
                        jobsPagination.page * jobsPagination.pageSize,
                        jobsPagination.total
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-blue-400">
                      {jobsPagination.total}
                    </span>{" "}
                    jobs
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Page Size Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-300">
                      Show:
                    </span>
                    <Select
                      value={jobsPagination.pageSize.toString()}
                      onValueChange={(value) =>
                        handlePageSizeChange(Number(value))
                      }
                    >
                      <SelectTrigger className="w-20 border-gray-600 bg-gray-800 text-white hover:border-blue-400 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Page Navigation */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(jobsPagination.page - 1)}
                      disabled={jobsPagination.page <= 1}
                      className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (jobsPagination.page <= 3) {
                            pageNum = i + 1;
                          } else if (jobsPagination.page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = jobsPagination.page - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={
                                pageNum === jobsPagination.page
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className={`w-10 h-8 ${
                                pageNum === jobsPagination.page
                                  ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                                  : "border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                              }`}
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(jobsPagination.page + 1)}
                      disabled={jobsPagination.page >= totalPages}
                      className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Area with enhanced styling */}
        <div className="space-y-6">
          {/* Error State */}
          {jobsError && (
            <Card
              className="border border-red-600"
              style={{ backgroundColor: "#0d1025" }}
            >
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="p-4 rounded-full bg-red-600 text-white shadow-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Unable to Load Jobs
                  </h3>
                  <p className="text-gray-300 mb-4">{jobsError}</p>
                  <Button
                    onClick={() => window.location.reload()}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {jobsLoading && (
            <div className="space-y-6">
              <JobCardSkeletonGrid count={jobsPagination.pageSize} />
            </div>
          )}

          {/* Jobs Content */}
          {!jobsLoading && !jobsError && (
            <>
              {safeJobs.length === 0 ? (
                <Card
                  className="border border-gray-700"
                  style={{ backgroundColor: "#0d1025" }}
                >
                  <CardContent className="p-12">
                    <div className="text-center max-w-md mx-auto">
                      <div className="p-6 rounded-full bg-blue-600 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                        <Briefcase className="h-12 w-12 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">
                        No Jobs Found
                      </h3>
                      <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                        {jobsFilters.search ||
                        jobsFilters.status !== "all" ||
                        (jobsFilters.tags && jobsFilters.tags.length > 0)
                          ? "No jobs match your current filters. Try adjusting your search criteria to discover more opportunities."
                          : "Ready to start building your team? Create your first job posting and begin attracting top talent."}
                      </p>
                      <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Create Your First Job
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Jobs Display */}
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {safeJobs.map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          onEdit={handleEditJob}
                          onToggleStatus={handleToggleJobStatus}
                          onDelete={handleDeleteJob}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card
                      className="border border-gray-700"
                      style={{ backgroundColor: "#0d1025" }}
                    >
                      <CardContent className="p-0">
                        <JobReorderList
                          jobs={safeJobs}
                          onReorder={handleReorderJobs}
                          onEdit={handleEditJob}
                          onToggleStatus={handleToggleJobStatus}
                          onDelete={handleDeleteJob}
                          onView={handleViewJob}
                          isReordering={jobsLoading}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Job Modal */}
      <JobModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateJob}
        title="Create New Job"
      />

      {/* Edit Job Modal */}
      <JobModal
        isOpen={!!editingJob}
        onClose={() => setEditingJob(null)}
        onSubmit={handleUpdateJob}
        job={editingJob}
        title="Edit Job"
      />

      {/* View Job Modal */}
      {viewingJob && (
        <JobModal
          isOpen={!!viewingJob}
          onClose={() => setViewingJob(null)}
          job={viewingJob}
          title="Job Details"
          readOnly
        />
      )}
    </div>
  );
}

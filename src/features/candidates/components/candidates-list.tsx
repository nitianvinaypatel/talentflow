import { memo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Grid3X3, List, Search, Filter, X } from "lucide-react";
import { VirtualizedCandidatesList } from "./virtualized-candidates-list";
import { CandidatesKanbanView } from "./candidates-kanban-view";
import { Loading } from "../../../components/ui/loading";
import { Button } from "../../../components/ui";
import { Input } from "../../../components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { useCandidatesData } from "../hooks/useCandidatesData";
import { useCandidatesFiltering } from "../hooks/useCandidatesFiltering";
import type { Candidate } from "../../../types";

const ITEM_HEIGHT = 160; // Height of each candidate card including padding
const LIST_HEIGHT = 600; // Height of the virtualized list

const stageLabels: Record<Candidate["stage"], string> = {
  applied: "Applied",
  screen: "Screening",
  tech: "Technical",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

const stages: Candidate["stage"][] = [
  "applied",
  "screen",
  "tech",
  "offer",
  "hired",
  "rejected",
];

export const CandidatesList = memo(() => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const {
    candidates,
    filters,
    loading,
    error,
    jobs,
    onFiltersChange,
    onStageChange,
  } = useCandidatesData();

  const { filteredCandidates } = useCandidatesFiltering(candidates, filters);

  const handleCandidateClick = useCallback(
    (candidate: Candidate) => {
      navigate(`/candidates/${candidate.id}`);
    },
    [navigate]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFiltersChange({ search: e.target.value });
    },
    [onFiltersChange]
  );

  const handleStageFilter = useCallback(
    (stage: "all" | Candidate["stage"]) => {
      onFiltersChange({ stage });
    },
    [onFiltersChange]
  );

  const handleJobFilter = useCallback(
    (jobId: string | undefined) => {
      onFiltersChange({ jobId });
    },
    [onFiltersChange]
  );

  const clearFilters = useCallback(() => {
    onFiltersChange({ search: "", stage: "all", jobId: undefined });
  }, [onFiltersChange]);

  const hasActiveFilters =
    filters.search || filters.stage !== "all" || filters.jobId;
  const selectedJob = jobs.find((job) => job.id === filters.jobId);

  if (loading) {
    return (
      <div className="h-full" style={{ backgroundColor: "#000319" }}>
        <div className="space-y-6 p-6 h-full overflow-hidden">
          <Loading />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full" style={{ backgroundColor: "#000319" }}>
        <div className="space-y-6 p-6 h-full overflow-hidden">
          <div
            className="border border-gray-700 rounded-lg p-6"
            style={{ backgroundColor: "#0d1025" }}
          >
            <p className="text-red-400 font-medium">
              Error loading candidates: {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full" style={{ backgroundColor: "#000319" }}>
      <div className="space-y-6 p-6 h-full overflow-hidden">
        {/* Controls Card */}
        <div
          className="border border-gray-700 rounded-lg p-6"
          style={{ backgroundColor: "#0d1025" }}
        >
          <div className="flex flex-wrap items-center gap-4">
            {/* Search Bar */}
            <div className="relative min-w-64">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search candidates..."
                value={filters.search}
                onChange={handleSearchChange}
                className="pl-12 h-12 bg-gray-800 border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 text-white placeholder-gray-400"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-12 px-6 bg-gray-800 border-gray-600 rounded-lg hover:bg-gray-700 transition-all duration-200 gap-2 text-gray-300 hover:text-white"
                  >
                    <Filter className="h-4 w-4" />
                    Stage:{" "}
                    {filters.stage === "all"
                      ? "All"
                      : stageLabels[filters.stage]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border border-gray-700"
                  style={{ backgroundColor: "#0d1025" }}
                >
                  <DropdownMenuItem
                    onClick={() => handleStageFilter("all")}
                    className="hover:bg-gray-700 text-gray-300 hover:text-white"
                  >
                    All Stages
                  </DropdownMenuItem>
                  {stages.map((stage) => (
                    <DropdownMenuItem
                      key={stage}
                      onClick={() => handleStageFilter(stage)}
                      className="hover:bg-gray-700 text-gray-300 hover:text-white"
                    >
                      {stageLabels[stage]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-12 px-6 bg-gray-800 border-gray-600 rounded-lg hover:bg-gray-700 transition-all duration-200 gap-2 text-gray-300 hover:text-white"
                  >
                    <Filter className="h-4 w-4" />
                    Job: {selectedJob ? selectedJob.title : "All Jobs"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="max-w-[200px] border border-gray-700"
                  style={{ backgroundColor: "#0d1025" }}
                >
                  <DropdownMenuItem
                    onClick={() => handleJobFilter(undefined)}
                    className="hover:bg-gray-700 text-gray-300 hover:text-white"
                  >
                    All Jobs
                  </DropdownMenuItem>
                  {jobs.map((job) => (
                    <DropdownMenuItem
                      key={job.id}
                      onClick={() => handleJobFilter(job.id)}
                      className="hover:bg-gray-700 text-gray-300 hover:text-white"
                    >
                      <span className="truncate">{job.title}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="h-12 px-6 text-gray-400 hover:bg-red-600/20 hover:text-red-400 rounded-lg transition-all duration-200 gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-800 rounded-lg p-1 ml-auto">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={`h-10 px-4 rounded-lg transition-all duration-200 ${viewMode === "list"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "text-gray-400 hover:bg-gray-700 hover:text-white"
                  }`}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "kanban" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("kanban")}
                className={`h-10 px-4 rounded-lg transition-all duration-200 ${viewMode === "kanban"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "text-gray-400 hover:bg-gray-700 hover:text-white"
                  }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {viewMode === "list" ? (
          <div
            className="border border-gray-700 rounded-lg overflow-hidden"
            style={{ backgroundColor: "#0d1025" }}
          >
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Candidates List
                  </h2>
                  <p className="text-gray-400 mt-1">
                    Manage and track your talent pipeline
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-300">
                    {filteredCandidates.length} result
                    {filteredCandidates.length !== 1 ? "s" : ""}
                  </div>
                  {filteredCandidates.length !== candidates.length && (
                    <p className="text-sm text-blue-400">
                      filtered from {candidates.length}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <VirtualizedCandidatesList
              candidates={filteredCandidates}
              height={LIST_HEIGHT}
              itemHeight={ITEM_HEIGHT}
              onCandidateClick={handleCandidateClick}
              onStageChange={onStageChange}
            />
          </div>
        ) : (
          <div
            className="h-[700px] w-[1600px] border border-gray-700 rounded-lg"
            style={{ backgroundColor: "#0d1025" }}
          >
            <CandidatesKanbanView />
          </div>
        )}
      </div>
    </div>
  );
});

CandidatesList.displayName = "CandidatesList";

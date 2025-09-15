import { useState, useEffect, useCallback } from "react";
import { Search, Filter, X, Grid3X3, List, Plus } from "lucide-react";
import { Button, Badge } from "../../../components/ui";
import type { JobFilters as JobFiltersType } from "../../../types";

interface JobFiltersProps {
  filters: JobFiltersType;
  onFiltersChange: (filters: Partial<JobFiltersType>) => void;
  availableTags?: string[];
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
  onCreateJob?: () => void;
}

export function JobFilters({
  filters,
  onFiltersChange,
  availableTags = [],
  viewMode = "grid",
  onViewModeChange,
  onCreateJob,
}: JobFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || "");

  // Sync local search value with filters prop
  useEffect(() => {
    setSearchValue(filters.search || "");
  }, [filters.search]);

  // Debounced search implementation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFiltersChange({ search: searchValue });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchValue, onFiltersChange]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleStatusChange = (status: JobFiltersType["status"]) => {
    onFiltersChange({ status });
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];

    onFiltersChange({ tags: newTags });
  };

  const clearFilters = () => {
    setSearchValue("");
    onFiltersChange({
      search: "",
      status: "all",
      tags: [],
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.status !== "all" ||
    (filters.tags && filters.tags.length > 0);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Search jobs by title or description..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* All Controls in One Row */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        {/* Left side - Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={filters.status === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusChange("all")}
            className={
              filters.status === "all"
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700"
            }
          >
            All Jobs
          </Button>
          <Button
            variant={filters.status === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusChange("active")}
            className={
              filters.status === "active"
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700"
            }
          >
            Active
          </Button>
          <Button
            variant={filters.status === "archived" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusChange("archived")}
            className={
              filters.status === "archived"
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700"
            }
          >
            Archived
          </Button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-1 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Right side - View Mode and Create Job */}
        <div className="flex items-center gap-2">
          {/* View Mode Buttons */}
          {onViewModeChange && (
            <div className="flex gap-1 border border-gray-600 rounded-md p-1 bg-gray-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange("grid")}
                className={`h-8 px-3 ${viewMode === "grid"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "text-gray-300 hover:bg-gray-700"
                  }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange("list")}
                className={`h-8 px-3 ${viewMode === "list"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "text-gray-300 hover:bg-gray-700"
                  }`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Create Job Button */}
          {onCreateJob && (
            <Button
              onClick={onCreateJob}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Job
            </Button>
          )}
        </div>
      </div>

      {/* Tag Filters */}
      {availableTags.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">
              Filter by tags:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const isSelected = filters.tags?.includes(tag) || false;
              return (
                <Badge
                  key={tag}
                  variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer ${isSelected
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                  {isSelected && <X className="ml-1 h-3 w-3" />}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Active filters:</span>
          {filters.search && (
            <Badge
              variant="secondary"
              className="bg-gray-700 text-gray-300 border-gray-600"
            >
              Search: "{filters.search}"
            </Badge>
          )}
          {filters.status !== "all" && (
            <Badge
              variant="secondary"
              className="bg-gray-700 text-gray-300 border-gray-600"
            >
              Status: {filters.status}
            </Badge>
          )}
          {filters.tags && filters.tags.length > 0 && (
            <Badge
              variant="secondary"
              className="bg-gray-700 text-gray-300 border-gray-600"
            >
              Tags: {filters.tags.length}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

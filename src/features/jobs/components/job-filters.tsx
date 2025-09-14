import { useState, useEffect, useCallback } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input, Button, Badge } from "../../../components/ui";
import type { JobFilters as JobFiltersType } from "../../../types";

interface JobFiltersProps {
  filters: JobFiltersType;
  onFiltersChange: (filters: Partial<JobFiltersType>) => void;
  availableTags?: string[];
}

export function JobFilters({
  filters,
  onFiltersChange,
  availableTags = [],
}: JobFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search);

  // Debounced search implementation
  const debouncedSearch = useCallback(
    (value: string) => {
      const timeoutId = setTimeout(() => {
        onFiltersChange({ search: value });
      }, 300);
      return timeoutId;
    },
    [onFiltersChange]
  );

  useEffect(() => {
    const timeoutId = debouncedSearch(searchValue);
    return () => clearTimeout(timeoutId);
  }, [searchValue, debouncedSearch]);

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
      {/* Search and Status Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search jobs by title or description..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          <Button
            variant={filters.status === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusChange("all")}
          >
            All Jobs
          </Button>
          <Button
            variant={filters.status === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusChange("active")}
          >
            Active
          </Button>
          <Button
            variant={filters.status === "archived" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusChange("archived")}
          >
            Archived
          </Button>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Tag Filters */}
      {availableTags.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
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
                  className="cursor-pointer hover:bg-muted"
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Active filters:</span>
          {filters.search && (
            <Badge variant="secondary">Search: "{filters.search}"</Badge>
          )}
          {filters.status !== "all" && (
            <Badge variant="secondary">Status: {filters.status}</Badge>
          )}
          {filters.tags && filters.tags.length > 0 && (
            <Badge variant="secondary">Tags: {filters.tags.length}</Badge>
          )}
        </div>
      )}
    </div>
  );
}

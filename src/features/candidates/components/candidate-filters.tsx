import { memo, useCallback } from 'react';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '../../../components/ui/dropdown-menu';
import { Search, Filter, X } from 'lucide-react';
import type { CandidateFiltersProps } from '../types';
import type { Candidate } from '../../../types';

const stageLabels: Record<Candidate['stage'], string> = {
    applied: 'Applied',
    screen: 'Screening',
    tech: 'Technical',
    offer: 'Offer',
    hired: 'Hired',
    rejected: 'Rejected',
};

const stages: Candidate['stage'][] = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'];

export const CandidateFilters = memo<CandidateFiltersProps>(({
    filters,
    onFiltersChange,
    jobs
}) => {
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onFiltersChange({ search: e.target.value });
    }, [onFiltersChange]);

    const handleStageFilter = useCallback((stage: 'all' | Candidate['stage']) => {
        onFiltersChange({ stage });
    }, [onFiltersChange]);

    const handleJobFilter = useCallback((jobId: string | undefined) => {
        onFiltersChange({ jobId });
    }, [onFiltersChange]);

    const clearFilters = useCallback(() => {
        onFiltersChange({ search: '', stage: 'all', jobId: undefined });
    }, [onFiltersChange]);

    const hasActiveFilters = filters.search || filters.stage !== 'all' || filters.jobId;
    const selectedJob = jobs.find(job => job.id === filters.jobId);

    return (
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card rounded-lg shadow-sm border">
            <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search candidates..."
                    value={filters.search}
                    onChange={handleSearchChange}
                    className="pl-10 h-9 bg-background border-input focus:border-ring focus:ring-1 focus:ring-ring"
                />
            </div>

            <div className="flex gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <Filter className="h-4 w-4" />
                            Stage: {filters.stage === 'all' ? 'All' : stageLabels[filters.stage]}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStageFilter('all')}>
                            All Stages
                        </DropdownMenuItem>
                        {stages.map((stage) => (
                            <DropdownMenuItem
                                key={stage}
                                onClick={() => handleStageFilter(stage)}
                            >
                                {stageLabels[stage]}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <Filter className="h-4 w-4" />
                            Job: {selectedJob ? selectedJob.title : 'All Jobs'}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="max-w-[200px]">
                        <DropdownMenuItem onClick={() => handleJobFilter(undefined)}>
                            All Jobs
                        </DropdownMenuItem>
                        {jobs.map((job) => (
                            <DropdownMenuItem
                                key={job.id}
                                onClick={() => handleJobFilter(job.id)}
                            >
                                <span className="truncate">{job.title}</span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                        <X className="h-4 w-4" />
                        Clear
                    </Button>
                )}
            </div>
        </div>
    );
});

CandidateFilters.displayName = 'CandidateFilters';
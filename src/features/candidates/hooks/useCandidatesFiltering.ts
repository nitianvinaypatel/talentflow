import { useMemo } from 'react';
import type { Candidate, CandidateFilters } from '../../../types';

export const useCandidatesFiltering = (
    candidates: Candidate[],
    filters: CandidateFilters
) => {
    const filteredCandidates = useMemo(() => {
        // Ensure candidates is always an array
        const safeCandidates = Array.isArray(candidates) ? candidates : [];
        
        // Filter out any undefined or invalid candidates first
        let filtered = safeCandidates.filter(candidate =>
            candidate &&
            candidate.id &&
            candidate.name &&
            candidate.email &&
            candidate.stage
        );

        // Early return if no valid candidates
        if (filtered.length === 0) {
            return [];
        }

        // Search filter (name and email)
        if (filters.search.trim()) {
            const searchTerm = filters.search.toLowerCase().trim();
            filtered = filtered.filter(
                (candidate) =>
                    candidate.name.toLowerCase().includes(searchTerm) ||
                    candidate.email.toLowerCase().includes(searchTerm)
            );
        }

        // Stage filter
        if (filters.stage !== 'all') {
            filtered = filtered.filter((candidate) => candidate.stage === filters.stage);
        }

        // Job filter
        if (filters.jobId) {
            filtered = filtered.filter((candidate) => candidate.jobId === filters.jobId);
        }

        // Sort by most recent first
        filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        return filtered;
    }, [candidates, filters]);

    const stats = useMemo(() => {
        const total = (candidates || []).length;
        const filtered = filteredCandidates.length;

        const stageStats = (candidates || []).reduce((acc, candidate) => {
            acc[candidate.stage] = (acc[candidate.stage] || 0) + 1;
            return acc;
        }, {} as Record<Candidate['stage'], number>);

        return {
            total,
            filtered,
            stageStats,
        };
    }, [candidates, filteredCandidates]);

    return {
        filteredCandidates,
        stats,
    };
};
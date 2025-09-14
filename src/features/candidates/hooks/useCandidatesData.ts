import { useEffect, useCallback } from 'react';
import { useAppStore } from '../../../lib/store';
import type { Candidate } from '../../../types';

export const useCandidatesData = () => {
    const {
        candidates,
        candidatesFilters,
        candidatesLoading,
        candidatesError,
        jobs,
        setCandidatesFilters,
        updateCandidate,
        loadFromStorage,
    } = useAppStore();

    // Ensure candidates and jobs are always arrays
    const safeCandidates = Array.isArray(candidates) ? candidates : [];
    const safeJobs = Array.isArray(jobs) ? jobs : [];

    // Load data on mount
    useEffect(() => {
        loadFromStorage();
    }, [loadFromStorage]);



    const handleFiltersChange = useCallback(
        (newFilters: Partial<typeof candidatesFilters>) => {
            setCandidatesFilters(newFilters);
        },
        [setCandidatesFilters]
    );

    const handleStageChange = useCallback(
        async (candidateId: string, newStage: Candidate['stage']) => {
            try {
                await updateCandidate(candidateId, { stage: newStage });
            } catch (error) {
                console.error('Failed to update candidate stage:', error);
                // Error handling is managed by the store
            }
        },
        [updateCandidate]
    );

    return {
        candidates: safeCandidates,
        filters: candidatesFilters,
        loading: candidatesLoading,
        error: candidatesError,
        jobs: safeJobs.map(job => ({ id: job.id, title: job.title })),
        onFiltersChange: handleFiltersChange,
        onStageChange: handleStageChange,
    };
};
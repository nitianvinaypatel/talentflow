import { useEffect, useCallback } from 'react';
import { useAppStore } from '../../../lib/store';
import { apiClient } from '../../../lib/api/client';
import type { Job } from '../../../types';

export function useJobs() {
    const {
        jobs,
        jobsFilters,
        jobsPagination,
        jobsLoading,
        jobsError,
        setJobs,
        setJobsFilters,
        setJobsPagination,
        setLoading,
        setError,
        createJob,
        updateJob,
        deleteJob,
        reorderJobs,
    } = useAppStore();

    const loadJobs = useCallback(async () => {
        try {
            setLoading('jobs', true);
            setError('jobs', null);

            const params = new URLSearchParams({
                page: jobsPagination.page.toString(),
                pageSize: jobsPagination.pageSize.toString(),
            });

            if (jobsFilters.status !== 'all') {
                params.append('status', jobsFilters.status);
            }

            if (jobsFilters.search) {
                params.append('search', jobsFilters.search);
            }

            if (jobsFilters.tags.length > 0) {
                params.append('tags', jobsFilters.tags.join(','));
            }

            const response = await apiClient.get<{
                data: Job[];
                pagination?: { total: number };
            }>(`/api/jobs?${params.toString()}`);

            if (response.data) {
                setJobs(response.data);
                if (response.pagination) {
                    setJobsPagination({
                        total: response.pagination.total,
                    });
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load jobs';
            setError('jobs', errorMessage);
            console.error('Failed to load jobs:', error);
        } finally {
            setLoading('jobs', false);
        }
    }, [jobsFilters, jobsPagination.page, jobsPagination.pageSize, setLoading, setError, setJobs, setJobsPagination]);

    // Load jobs on mount and when filters change
    useEffect(() => {
        loadJobs();
    }, [loadJobs]);

    const getJobById = useCallback(async (id: string) => {
        try {
            setLoading('jobDetails', true);
            setError('jobDetails', null);

            const response = await apiClient.get<{ data: Job; success: boolean }>(`/api/jobs/${id}`);
            return response.data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load job';
            setError('jobDetails', errorMessage);
            throw error;
        } finally {
            setLoading('jobDetails', false);
        }
    }, [setLoading, setError]);

    const handleCreateJob = async (jobData: Parameters<typeof createJob>[0]) => {
        await createJob(jobData);
        // Reload jobs to get updated list
        await loadJobs();
    };

    const handleUpdateJob = async (id: string, updates: Parameters<typeof updateJob>[1]) => {
        await updateJob(id, updates);
        // Reload jobs to get updated list
        await loadJobs();
    };

    const handleDeleteJob = async (id: string) => {
        await deleteJob(id);
        // Reload jobs to get updated list
        await loadJobs();
    };

    const handleToggleStatus = async (id: string, currentStatus: 'active' | 'archived') => {
        const newStatus = currentStatus === 'active' ? 'archived' : 'active';
        await handleUpdateJob(id, { status: newStatus });
    };

    return {
        // Data
        jobs,
        jobsFilters,
        jobsPagination,

        // Loading states
        jobsLoading,
        jobsError,

        // Actions
        loadJobs,
        getJobById,
        createJob: handleCreateJob,
        updateJob: handleUpdateJob,
        deleteJob: handleDeleteJob,
        toggleJobStatus: handleToggleStatus,
        reorderJobs,

        // Filter actions
        setJobsFilters,
        setJobsPagination,
    };
}
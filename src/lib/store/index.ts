import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { AppStore, Job, Candidate, Assessment } from '../../types';
import { apiClient, api } from '../api/client';
import { db } from '../db/schema';

// Helper function to ensure we always get a valid array
const safeArrayAccess = <T>(value: T[] | null | undefined): T[] => {
    if (Array.isArray(value)) return value;
    console.error('CRITICAL: Non-array value found in assessments:', {
        value,
        type: typeof value,
        constructor: (value as unknown)?.constructor?.name,
        stringified: JSON.stringify(value),
        stack: new Error().stack
    });
    // Auto-fix: If we detect a response object with .data property, extract it
    if (value && typeof value === 'object' && 'data' in value && Array.isArray((value as {data: unknown[]}).data)) {
        console.warn('Auto-fixing: Extracting data array from response object');
        return (value as {data: T[]}).data;
    }
    return [];
};

const initialState = {
    // UI State
    sidebarOpen: true,
    currentRoute: '/',
    loading: {},
    errors: {},

    // Jobs State
    jobs: [],
    jobsFilters: {
        search: '',
        status: 'all' as const,
        tags: [],
    },
    jobsPagination: {
        page: 1,
        pageSize: 10,
        total: 0,
    },
    jobsLoading: false,
    jobsError: null,

    // Candidates State
    candidates: [],
    candidatesFilters: {
        search: '',
        stage: 'all' as const,
    },
    selectedCandidate: null,
    candidatesLoading: false,
    candidatesError: null,

    // Assessments State
    assessments: [],
    currentAssessment: null,
    assessmentBuilder: {
        currentAssessment: null,
        selectedSection: null,
        selectedQuestion: null,
        previewMode: false,
    },
    assessmentsLoading: false,
    assessmentsError: null,

    // Optimistic updates
    pendingUpdates: [],
};

export const useAppStore = create<AppStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            // Loading and error management
            setLoading: (key, loading) =>
                set((state) => ({
                    loading: { ...state.loading, [key]: loading },
                })),
            setError: (key, error) =>
                set((state) => ({
                    errors: { ...state.errors, [key]: error },
                })),
            clearErrors: () => set({ errors: {} }),

            // Optimistic update management
            addPendingUpdate: (update) =>
                set((state) => ({
                    pendingUpdates: [...state.pendingUpdates, update],
                })),
            removePendingUpdate: (id) =>
                set((state) => ({
                    pendingUpdates: (state.pendingUpdates || []).filter((u) => u.id !== id),
                })),
            rollbackUpdate: (id) => {
                const state = get();
                const update = (state.pendingUpdates || []).find((u) => u.id === id);
                if (!update || !update.originalData) return;

                switch (update.entity) {
                    case 'job':
                        if (update.type === 'update') {
                            set((state) => ({
                                jobs: (state.jobs || []).map((job) =>
                                    job.id === update.originalData.id ? update.originalData : job
                                ),
                            }));
                        } else if (update.type === 'create') {
                            set((state) => ({
                                jobs: (state.jobs || []).filter((job) => job.id !== update.data.id),
                            }));
                        }
                        break;
                    case 'candidate':
                        if (update.type === 'update') {
                            set((state) => ({
                                candidates: (state.candidates || []).map((candidate) =>
                                    candidate.id === update.originalData.id ? update.originalData : candidate
                                ),
                            }));
                        } else if (update.type === 'create') {
                            set((state) => ({
                                candidates: (state.candidates || []).filter((candidate) => candidate.id !== update.data.id),
                            }));
                        }
                        break;
                    case 'assessment':
                        if (update.type === 'update') {
                            set((state) => ({
                                assessments: (Array.isArray(state.assessments) ? state.assessments : []).map((assessment) =>
                                    assessment.id === update.originalData.id ? update.originalData : assessment
                                ),
                            }));
                        } else if (update.type === 'create') {
                            set((state) => ({
                                assessments: (Array.isArray(state.assessments) ? state.assessments : []).filter((assessment) => assessment.id !== update.data.id),
                            }));
                        }
                        break;
                }

                get().removePendingUpdate(id);
            },

            // Jobs Actions with optimistic updates
            setJobs: (jobs) => set({ jobs }),
            createJob: async (jobData) => {
                const updateId = nanoid();
                const newJob: Job = {
                    ...jobData,
                    id: nanoid(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                // Optimistic update
                set((state) => ({ jobs: [...(state.jobs || []), newJob] }));
                get().addPendingUpdate({
                    id: updateId,
                    type: 'create',
                    entity: 'job',
                    data: newJob,
                    timestamp: Date.now(),
                });

                try {
                    get().setLoading('createJob', true);
                    get().setError('createJob', null);

                    const response = await apiClient.post<{data: Job, success: boolean}>('/api/jobs', newJob);

                    // Update with server response
                    set((state) => ({
                        jobs: (state.jobs || []).map((job) =>
                            job.id === newJob.id ? response.data : job
                        ),
                    }));

                    get().removePendingUpdate(updateId);
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    get().setError('createJob', errorMessage);
                    // For create operations, remove the optimistically added item
                    set((state) => ({
                        jobs: (state.jobs || []).filter((job) => job.id !== newJob.id),
                    }));
                    get().removePendingUpdate(updateId);
                    throw error;
                } finally {
                    get().setLoading('createJob', false);
                }
            },
            updateJob: async (id, updates) => {
                const updateId = nanoid();
                const state = get();
                const originalJob = (state.jobs || []).find((job) => job.id === id);
                if (!originalJob) return;

                const updatedJob = { ...originalJob, ...updates, updatedAt: new Date() };

                // Optimistic update
                set((state) => ({
                    jobs: (state.jobs || []).map((job) =>
                        job.id === id ? updatedJob : job
                    ),
                }));
                get().addPendingUpdate({
                    id: updateId,
                    type: 'update',
                    entity: 'job',
                    data: updatedJob,
                    originalData: originalJob,
                    timestamp: Date.now(),
                });

                try {
                    get().setLoading('updateJob', true);
                    get().setError('updateJob', null);

                    const response = await apiClient.patch<{data: Job, success: boolean}>(`/api/jobs/${id}`, updates);

                    // Update with server response
                    set((state) => ({
                        jobs: (state.jobs || []).map((job) =>
                            job.id === id ? response.data : job
                        ),
                    }));

                    get().removePendingUpdate(updateId);
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    get().setError('updateJob', errorMessage);
                    get().rollbackUpdate(updateId);
                    throw error;
                } finally {
                    get().setLoading('updateJob', false);
                }
            },
            deleteJob: async (id) => {
                const updateId = nanoid();
                const state = get();
                const originalJob = (state.jobs || []).find((job) => job.id === id);
                if (!originalJob) return;

                // Optimistic update
                set((state) => ({
                    jobs: (state.jobs || []).filter((job) => job.id !== id),
                }));
                get().addPendingUpdate({
                    id: updateId,
                    type: 'delete',
                    entity: 'job',
                    data: { id },
                    originalData: originalJob,
                    timestamp: Date.now(),
                });

                try {
                    get().setLoading('deleteJob', true);
                    get().setError('deleteJob', null);

                    await apiClient.delete(`/api/jobs/${id}`);
                    get().removePendingUpdate(updateId);
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    get().setError('deleteJob', errorMessage);
                    // Rollback - add the job back
                    set((state) => ({
                        jobs: [...state.jobs, originalJob],
                    }));
                    get().removePendingUpdate(updateId);
                    throw error;
                } finally {
                    get().setLoading('deleteJob', false);
                }
            },
            reorderJobs: async (fromIndex, toIndex) => {
                const updateId = nanoid();
                const state = get();
                const originalJobs = [...state.jobs];

                // Optimistic update
                const jobs = [...state.jobs];
                const [removed] = jobs.splice(fromIndex, 1);
                jobs.splice(toIndex, 0, removed);

                const updatedJobs = jobs.map((job, index) => ({
                    ...job,
                    order: index,
                    updatedAt: new Date(),
                }));

                set({ jobs: updatedJobs });
                get().addPendingUpdate({
                    id: updateId,
                    type: 'reorder',
                    entity: 'job',
                    data: { fromIndex, toIndex },
                    originalData: originalJobs,
                    timestamp: Date.now(),
                });

                try {
                    get().setLoading('reorderJobs', true);
                    get().setError('reorderJobs', null);

                    await api.jobs.reorder(fromIndex, toIndex);
                    get().removePendingUpdate(updateId);
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    get().setError('reorderJobs', errorMessage);
                    // Rollback to original order
                    set({ jobs: originalJobs });
                    get().removePendingUpdate(updateId);
                    throw error;
                } finally {
                    get().setLoading('reorderJobs', false);
                }
            },
            setJobsFilters: (filters) =>
                set((state) => ({
                    jobsFilters: { ...state.jobsFilters, ...filters },
                })),
            setJobsPagination: (pagination) =>
                set((state) => ({
                    jobsPagination: { ...state.jobsPagination, ...pagination },
                })),

            // Data Loading Actions
            loadJobs: async () => {
                try {
                    get().setLoading('loadJobs', true);
                    get().setError('loadJobs', null);

                    const response = await apiClient.get<{data: Job[], success: boolean}>('/api/jobs');
                    set({ jobs: response.data });
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to load jobs';
                    get().setError('loadJobs', errorMessage);
                    if (import.meta.env.DEV) {
                        console.error('Failed to load jobs:', error);
                    }
                } finally {
                    get().setLoading('loadJobs', false);
                }
            },

            loadCandidates: async () => {
                try {
                    get().setLoading('loadCandidates', true);
                    get().setError('loadCandidates', null);

                    const response = await apiClient.get<{data: Candidate[], success: boolean}>('/api/candidates');
                    set({ candidates: response.data });
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to load candidates';
                    get().setError('loadCandidates', errorMessage);
                    if (import.meta.env.DEV) {
                        console.error('Failed to load candidates:', error);
                    }
                } finally {
                    get().setLoading('loadCandidates', false);
                }
            },

            loadAssessments: async () => {
                try {
                    get().setLoading('loadAssessments', true);
                    get().setError('loadAssessments', null);

                    const response = await apiClient.get<{data: Assessment[], success: boolean}>('/api/assessments');
                    set({ assessments: response.data });
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to load assessments';
                    get().setError('loadAssessments', errorMessage);
                    if (import.meta.env.DEV) {
                        console.error('Failed to load assessments:', error);
                    }
                } finally {
                    get().setLoading('loadAssessments', false);
                }
            },

            loadAllData: async () => {
                await Promise.all([
                    get().loadJobs(),
                    get().loadCandidates(),
                    get().loadAssessments(),
                ]);
            },

            // Candidates Actions with optimistic updates
            setCandidates: (candidates) => set({ candidates }),
            createCandidate: async (candidateData) => {
                const updateId = nanoid();
                const newCandidate: Candidate = {
                    ...candidateData,
                    id: nanoid(),
                    appliedAt: new Date(),
                    updatedAt: new Date(),
                    notes: [],
                    assessmentResponses: [],
                };

                // Optimistic update
                set((state) => ({ candidates: [...state.candidates, newCandidate] }));
                get().addPendingUpdate({
                    id: updateId,
                    type: 'create',
                    entity: 'candidate',
                    data: newCandidate,
                    timestamp: Date.now(),
                });

                try {
                    get().setLoading('createCandidate', true);
                    get().setError('createCandidate', null);

                    const response = await apiClient.post<{data: Candidate, success: boolean}>('/api/candidates', newCandidate);

                    set((state) => ({
                        candidates: (state.candidates || []).map((candidate) =>
                            candidate.id === newCandidate.id ? response.data : candidate
                        ),
                    }));

                    get().removePendingUpdate(updateId);
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    get().setError('createCandidate', errorMessage);
                    // For create operations, remove the optimistically added item
                    set((state) => ({
                        candidates: (state.candidates || []).filter((candidate) => candidate.id !== newCandidate.id),
                    }));
                    get().removePendingUpdate(updateId);
                    throw error;
                } finally {
                    get().setLoading('createCandidate', false);
                }
            },
            updateCandidate: async (id, updates) => {
                const updateId = nanoid();
                const state = get();
                const originalCandidate = (state.candidates || []).find((candidate) => candidate.id === id);
                if (!originalCandidate) return;

                const updatedCandidate = { ...originalCandidate, ...updates, updatedAt: new Date() };

                // Optimistic update
                set((state) => ({
                    candidates: (state.candidates || []).map((candidate) =>
                        candidate.id === id ? updatedCandidate : candidate
                    ),
                }));
                get().addPendingUpdate({
                    id: updateId,
                    type: 'update',
                    entity: 'candidate',
                    data: updatedCandidate,
                    originalData: originalCandidate,
                    timestamp: Date.now(),
                });

                try {
                    get().setLoading('updateCandidate', true);
                    get().setError('updateCandidate', null);

                    const response = await apiClient.patch<{data: Candidate, success: boolean}>(`/api/candidates/${id}`, updates);

                    set((state) => ({
                        candidates: (state.candidates || []).map((candidate) =>
                            candidate.id === id ? response.data : candidate
                        ),
                    }));

                    get().removePendingUpdate(updateId);
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    get().setError('updateCandidate', errorMessage);
                    get().rollbackUpdate(updateId);
                    throw error;
                } finally {
                    get().setLoading('updateCandidate', false);
                }
            },
            deleteCandidate: async (id) => {
                const updateId = nanoid();
                const state = get();
                const originalCandidate = (state.candidates || []).find((candidate) => candidate.id === id);
                if (!originalCandidate) return;

                // Optimistic update
                set((state) => ({
                    candidates: (state.candidates || []).filter((candidate) => candidate.id !== id),
                }));
                get().addPendingUpdate({
                    id: updateId,
                    type: 'delete',
                    entity: 'candidate',
                    data: { id },
                    originalData: originalCandidate,
                    timestamp: Date.now(),
                });

                try {
                    get().setLoading('deleteCandidate', true);
                    get().setError('deleteCandidate', null);

                    await apiClient.delete(`/api/candidates/${id}`);
                    get().removePendingUpdate(updateId);
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    get().setError('deleteCandidate', errorMessage);
                    set((state) => ({
                        candidates: [...state.candidates, originalCandidate],
                    }));
                    get().removePendingUpdate(updateId);
                    throw error;
                } finally {
                    get().setLoading('deleteCandidate', false);
                }
            },
            setSelectedCandidate: (candidate) => set({ selectedCandidate: candidate }),
            setCandidatesFilters: (filters) =>
                set((state) => ({
                    candidatesFilters: { ...state.candidatesFilters, ...filters },
                })),

            // Assessments Actions with optimistic updates
            setAssessments: (assessments) => set({ assessments }),
            createAssessment: async (assessmentData) => {
                const updateId = nanoid();
                const newAssessment: Assessment = {
                    ...assessmentData,
                    id: nanoid(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                // Optimistic update
                set((state) => { 
                    const currentAssessments = safeArrayAccess(state.assessments);
                    return { assessments: [...currentAssessments, newAssessment] };
                });
                get().addPendingUpdate({
                    id: updateId,
                    type: 'create',
                    entity: 'assessment',
                    data: newAssessment,
                    timestamp: Date.now(),
                });

                try {
                    get().setLoading('createAssessment', true);
                    get().setError('createAssessment', null);

                    const response = await apiClient.post<{data: Assessment, success: boolean}>('/api/assessments', newAssessment);

                    set((state) => {
                        const currentAssessments = safeArrayAccess(state.assessments);
                        return {
                            assessments: currentAssessments.map((assessment) =>
                                assessment.id === newAssessment.id ? response.data : assessment
                            ),
                        };
                    });

                    get().removePendingUpdate(updateId);
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    get().setError('createAssessment', errorMessage);
                    // For create operations, remove the optimistically added item
                    set((state) => {
                        const currentAssessments = safeArrayAccess(state.assessments);
                        return {
                            assessments: currentAssessments.filter((assessment) => assessment.id !== newAssessment.id),
                        };
                    });
                    get().removePendingUpdate(updateId);
                    throw error;
                } finally {
                    get().setLoading('createAssessment', false);
                }
            },
            updateAssessment: async (id, updates) => {
                const updateId = nanoid();
                const state = get();
                const originalAssessment = (Array.isArray(state.assessments) ? state.assessments : []).find((assessment) => assessment.id === id);
                if (!originalAssessment) return;

                const updatedAssessment = { ...originalAssessment, ...updates, updatedAt: new Date() };

                // Optimistic update
                set((state) => ({
                    assessments: (Array.isArray(state.assessments) ? state.assessments : []).map((assessment) =>
                        assessment.id === id ? updatedAssessment : assessment
                    ),
                }));
                get().addPendingUpdate({
                    id: updateId,
                    type: 'update',
                    entity: 'assessment',
                    data: updatedAssessment,
                    originalData: originalAssessment,
                    timestamp: Date.now(),
                });

                try {
                    get().setLoading('updateAssessment', true);
                    get().setError('updateAssessment', null);

                    const response = await apiClient.patch<{data: Assessment, success: boolean}>(`/api/assessments/${id}`, updates);

                    set((state) => ({
                        assessments: (Array.isArray(state.assessments) ? state.assessments : []).map((assessment) =>
                            assessment.id === id ? response.data : assessment
                        ),
                    }));

                    get().removePendingUpdate(updateId);
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    get().setError('updateAssessment', errorMessage);
                    get().rollbackUpdate(updateId);
                    throw error;
                } finally {
                    get().setLoading('updateAssessment', false);
                }
            },
            deleteAssessment: async (id) => {
                const updateId = nanoid();
                const state = get();
                const originalAssessment = (Array.isArray(state.assessments) ? state.assessments : []).find((assessment) => assessment.id === id);
                if (!originalAssessment) return;

                // Optimistic update
                set((state) => ({
                    assessments: (Array.isArray(state.assessments) ? state.assessments : []).filter((assessment) => assessment.id !== id),
                }));
                get().addPendingUpdate({
                    id: updateId,
                    type: 'delete',
                    entity: 'assessment',
                    data: { id },
                    originalData: originalAssessment,
                    timestamp: Date.now(),
                });

                try {
                    get().setLoading('deleteAssessment', true);
                    get().setError('deleteAssessment', null);

                    await apiClient.delete(`/api/assessments/${id}`);
                    get().removePendingUpdate(updateId);
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    get().setError('deleteAssessment', errorMessage);
                    set((state) => ({
                        assessments: [...state.assessments, originalAssessment],
                    }));
                    get().removePendingUpdate(updateId);
                    throw error;
                } finally {
                    get().setLoading('deleteAssessment', false);
                }
            },
            setCurrentAssessment: (assessment) => set({ currentAssessment: assessment }),
            setAssessmentBuilder: (builderState) =>
                set((state) => ({
                    assessmentBuilder: { ...state.assessmentBuilder, ...builderState },
                })),

            // Sync and persistence
            syncWithAPI: async () => {
                try {
                    get().setLoading('sync', true);
                    get().setError('sync', null);

                    // Load fresh data from API
                    const [jobsResponse, candidatesResponse, assessmentsResponse] = await Promise.all([
                        apiClient.get<{data: Job[], success: boolean}>('/api/jobs'),
                        apiClient.get<{data: Candidate[], success: boolean}>('/api/candidates'),
                        apiClient.get<{data: Assessment[], success: boolean}>('/api/assessments'),
                    ]);

                    set({
                        jobs: jobsResponse.data,
                        candidates: candidatesResponse.data,
                        assessments: assessmentsResponse.data,
                    });

                    // Clear pending updates after successful sync
                    set({ pendingUpdates: [] });
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    get().setError('sync', errorMessage);
                    throw error;
                } finally {
                    get().setLoading('sync', false);
                }
            },
            loadFromStorage: async () => {
                try {
                    get().setLoading('loadFromStorage', true);

                    // Load data from IndexedDB
                    const [jobs, candidates, assessments] = await Promise.all([
                        db.jobs.toArray(),
                        db.candidates.toArray(),
                        db.assessments.toArray(),
                    ]);

                    // Normalize dates - IndexedDB might store them as strings
                    const normalizeDate = (date: Date | string | number | unknown): Date => {
                        if (date instanceof Date && !isNaN(date.getTime())) {
                            return date;
                        }
                        if (typeof date === 'string' || typeof date === 'number') {
                            const parsed = new Date(date);
                            if (!isNaN(parsed.getTime())) {
                                return parsed;
                            }
                        }
                        return new Date(); // Fallback to current date
                    };

                    const normalizedJobs = jobs.map(job => ({
                        ...job,
                        createdAt: normalizeDate(job.createdAt),
                        updatedAt: normalizeDate(job.updatedAt),
                        requirements: Array.isArray(job.requirements) ? job.requirements : [],
                        tags: Array.isArray(job.tags) ? job.tags : [],
                        type: job.type || 'full-time', // Ensure type field exists with default value
                    }));

                    const normalizedCandidates = candidates.map(candidate => ({
                        ...candidate,
                        appliedAt: normalizeDate(candidate.appliedAt),
                        updatedAt: normalizeDate(candidate.updatedAt),
                        notes: Array.isArray(candidate.notes) ? candidate.notes : [],
                        assessmentResponses: Array.isArray(candidate.assessmentResponses) ? candidate.assessmentResponses : [],
                        timeline: Array.isArray(candidate.timeline) ? candidate.timeline : [],
                    }));

                    const normalizedAssessments = assessments.map(assessment => ({
                        ...assessment,
                        createdAt: normalizeDate(assessment.createdAt),
                        updatedAt: normalizeDate(assessment.updatedAt),
                        sections: Array.isArray(assessment.sections) ? assessment.sections : [],
                    }));

                    // Check if data is valid and seed if empty or corrupted
                    const hasValidJobs = normalizedJobs.length > 0 && normalizedJobs.every(job =>
                        job && job.id && job.title && Array.isArray(job.requirements) && Array.isArray(job.tags)
                    );
                    const hasValidCandidates = normalizedCandidates.length === 0 || normalizedCandidates.every(candidate =>
                        candidate && candidate.id && candidate.name && candidate.email && candidate.stage && candidate.jobId
                    );

                    if (import.meta.env.DEV) {
                        console.log('Data validation:', {
                            jobsCount: normalizedJobs.length,
                            candidatesCount: normalizedCandidates.length,
                            hasValidJobs,
                            hasValidCandidates,
                            firstJob: normalizedJobs[0],
                            firstCandidate: normalizedCandidates[0]
                        });
                    }

                    if (!hasValidJobs || !hasValidCandidates) {
                        // Check if seeding was done recently or is in progress
                        const lastSeeded = localStorage.getItem('talentflow-last-seeded');
                        const seedingInProgress = localStorage.getItem('talentflow-seeding-in-progress');
                        const now = Date.now();
                        const fiveMinutesMs = 5 * 60 * 1000; // 5 minutes
                        
                        const recentlySeeded = lastSeeded && (now - parseInt(lastSeeded)) < fiveMinutesMs;
                        
                        if (seedingInProgress || recentlySeeded) {
                            if (import.meta.env.DEV) {
                                console.log('Seeding was done recently or is in progress. Using existing data or retrying...');
                            }
                            // Try to reload data one more time in case seeding just completed
                            const [retryJobs, retryCandidates, retryAssessments] = await Promise.all([
                                db.jobs.toArray(),
                                db.candidates.toArray(),
                                db.assessments.toArray(),
                            ]);
                            
                            if (retryJobs.length > 0) {
                                set({ 
                                    jobs: retryJobs.map(job => ({
                                        ...job,
                                        createdAt: normalizeDate(job.createdAt),
                                        updatedAt: normalizeDate(job.updatedAt),
                                        requirements: Array.isArray(job.requirements) ? job.requirements : [],
                                        tags: Array.isArray(job.tags) ? job.tags : [],
                                        type: job.type || 'full-time',
                                    })),
                                    candidates: retryCandidates.map(candidate => ({
                                        ...candidate,
                                        appliedAt: normalizeDate(candidate.appliedAt),
                                        updatedAt: normalizeDate(candidate.updatedAt),
                                        notes: Array.isArray(candidate.notes) ? candidate.notes : [],
                                        assessmentResponses: Array.isArray(candidate.assessmentResponses) ? candidate.assessmentResponses : [],
                                        timeline: Array.isArray(candidate.timeline) ? candidate.timeline : [],
                                    })),
                                    assessments: retryAssessments.map(assessment => ({
                                        ...assessment,
                                        createdAt: normalizeDate(assessment.createdAt),
                                        updatedAt: normalizeDate(assessment.updatedAt),
                                        sections: Array.isArray(assessment.sections) ? assessment.sections : [],
                                    }))
                                });
                                return;
                            }
                        }
                        
                        if (import.meta.env.DEV) {
                            console.log('Database is empty or has corrupted data, reseeding...');
                        }
                        
                        // Set seeding in progress flag
                        localStorage.setItem('talentflow-seeding-in-progress', 'true');
                        
                        try {
                            const { resetAndSeedDatabase } = await import('../db/seed');
                            await resetAndSeedDatabase();
                            
                            // Set completion flag
                            localStorage.setItem('talentflow-last-seeded', now.toString());

                            // Reload data after seeding
                            const [seededJobs, seededCandidates, seededAssessments] = await Promise.all([
                                db.jobs.toArray(),
                                db.candidates.toArray(),
                                db.assessments.toArray(),
                            ]);
                            
                            // Normalize the reseeded data too
                            const normalizedSeededJobs = seededJobs.map(job => ({
                                ...job,
                                createdAt: normalizeDate(job.createdAt),
                                updatedAt: normalizeDate(job.updatedAt),
                                requirements: Array.isArray(job.requirements) ? job.requirements : [],
                                tags: Array.isArray(job.tags) ? job.tags : [],
                                type: job.type || 'full-time',
                            }));

                            const normalizedSeededCandidates = seededCandidates.map(candidate => ({
                                ...candidate,
                                appliedAt: normalizeDate(candidate.appliedAt),
                                updatedAt: normalizeDate(candidate.updatedAt),
                                notes: Array.isArray(candidate.notes) ? candidate.notes : [],
                                assessmentResponses: Array.isArray(candidate.assessmentResponses) ? candidate.assessmentResponses : [],
                                timeline: Array.isArray(candidate.timeline) ? candidate.timeline : [],
                            }));

                            const normalizedSeededAssessments = seededAssessments.map(assessment => ({
                                ...assessment,
                                createdAt: normalizeDate(assessment.createdAt),
                                updatedAt: normalizeDate(assessment.updatedAt),
                                sections: Array.isArray(assessment.sections) ? assessment.sections : [],
                            }));

                            set({
                                jobs: normalizedSeededJobs,
                                candidates: normalizedSeededCandidates,
                                assessments: normalizedSeededAssessments,
                            });
                        } finally {
                            // Always clear the in-progress flag
                            localStorage.removeItem('talentflow-seeding-in-progress');
                        }
                    } else {
                        set({
                            jobs: normalizedJobs,
                            candidates: normalizedCandidates,
                            assessments: normalizedAssessments,
                        });
                    }
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    get().setError('loadFromStorage', errorMessage);
                    if (import.meta.env.DEV) {
                        console.error('Failed to load from storage:', error);
                    }
                } finally {
                    get().setLoading('loadFromStorage', false);
                }
            },

            // UI Actions
            setSidebarOpen: (open) => set({ sidebarOpen: open }),
            setCurrentRoute: (route) => set({ currentRoute: route }),

            // Reset function
            reset: () => set(initialState),

            // Force database reseed
            forceReseed: async () => {
                try {
                    get().setLoading('forceReseed', true);
                    if (import.meta.env.DEV) {
                        console.log('Force reseeding database...');
                    }

                    const { resetAndSeedDatabase } = await import('../db/seed');
                    await resetAndSeedDatabase();

                    // Reload data after seeding
                    const [jobs, candidates, assessments] = await Promise.all([
                        db.jobs.toArray(),
                        db.candidates.toArray(),
                        db.assessments.toArray(),
                    ]);

                    // Normalize dates after reseeding
                    const normalizeDate = (date: Date | string | number | unknown): Date => {
                        if (date instanceof Date && !isNaN(date.getTime())) {
                            return date;
                        }
                        if (typeof date === 'string' || typeof date === 'number') {
                            const parsed = new Date(date);
                            if (!isNaN(parsed.getTime())) {
                                return parsed;
                            }
                        }
                        return new Date(); // Fallback to current date
                    };

                    const normalizedJobs = jobs.map(job => ({
                        ...job,
                        createdAt: normalizeDate(job.createdAt),
                        updatedAt: normalizeDate(job.updatedAt),
                        requirements: Array.isArray(job.requirements) ? job.requirements : [],
                        tags: Array.isArray(job.tags) ? job.tags : [],
                        type: job.type || 'full-time', // Ensure type field exists with default value
                    }));

                    const normalizedCandidates = candidates.map(candidate => ({
                        ...candidate,
                        appliedAt: normalizeDate(candidate.appliedAt),
                        updatedAt: normalizeDate(candidate.updatedAt),
                        notes: Array.isArray(candidate.notes) ? candidate.notes : [],
                        assessmentResponses: Array.isArray(candidate.assessmentResponses) ? candidate.assessmentResponses : [],
                        timeline: Array.isArray(candidate.timeline) ? candidate.timeline : [],
                    }));

                    const normalizedAssessments = assessments.map(assessment => ({
                        ...assessment,
                        createdAt: normalizeDate(assessment.createdAt),
                        updatedAt: normalizeDate(assessment.updatedAt),
                        sections: Array.isArray(assessment.sections) ? assessment.sections : [],
                    }));

                    set({
                        jobs: normalizedJobs,
                        candidates: normalizedCandidates,
                        assessments: normalizedAssessments,
                    });

                    if (import.meta.env.DEV) {
                        console.log('Database reseeded successfully');
                    }
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    get().setError('forceReseed', errorMessage);
                    if (import.meta.env.DEV) {
                        console.error('Failed to reseed database:', error);
                    }
                } finally {
                    get().setLoading('forceReseed', false);
                }
            },
        }),
        {
            name: 'talentflow-store',
            storage: createJSONStorage(() => localStorage),
            // Only persist certain parts of the state
            partialize: (state) => ({
                sidebarOpen: state.sidebarOpen,
                jobsFilters: state.jobsFilters,
                jobsPagination: state.jobsPagination,
                candidatesFilters: state.candidatesFilters,
                assessmentBuilder: state.assessmentBuilder,
            }),
            // Ensure arrays are always arrays during hydration
            onRehydrateStorage: () => (state) => {
                if (state) {
                    if (!Array.isArray(state.jobs)) state.jobs = [];
                    if (!Array.isArray(state.candidates)) state.candidates = [];
                    if (!Array.isArray(state.assessments)) state.assessments = [];
                }
            },
        }
    )
);
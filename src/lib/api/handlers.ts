import { http, HttpResponse } from 'msw';
import { sleep } from '../utils';
import {
    JobsService,
    CandidatesService,
    AssessmentsService,
    TimelineService,
    AssessmentResponsesService,
} from '../db/operations';

// Utility function to simulate network latency and errors
async function simulateNetworkConditions(isWriteOperation = false) {
    // In production, use minimal delay for better performance
    const delay = import.meta.env.DEV ? Math.random() * 1000 + 200 : Math.random() * 100 + 50;
    await sleep(delay);

    // Only simulate errors in development
    if (import.meta.env.DEV && isWriteOperation && Math.random() < 0.075) { // 7.5% error rate
        throw new Error('Simulated server error');
    }
}

// Base handler wrapper with error simulation and write-through persistence
function withNetworkSimulation(handler: Function, isWriteOperation = false) {
    return async (request: any) => {
        try {
            await simulateNetworkConditions(isWriteOperation);
            return await handler(request);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (import.meta.env.DEV) {
                console.error('MSW Handler Error:', errorMessage);
            }
            return HttpResponse.json(
                {
                    error: 'Server error',
                    message: errorMessage,
                    success: false
                },
                { status: 500 }
            );
        }
    };
}

// Utility function to create paginated response
function createPaginatedResponse<T>(
    data: T[],
    page: number,
    pageSize: number
) {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = data.slice(startIndex, endIndex);

    return {
        data: paginatedData,
        pagination: {
            page,
            pageSize,
            total: data.length,
            totalPages: Math.ceil(data.length / pageSize),
        },
    };
}

export const handlers = [
    // Jobs endpoints
    http.get('/api/jobs', async ({ request }) => {
        try {
            await simulateNetworkConditions(false);

            const url = new URL(request.url);
            const page = parseInt(url.searchParams.get('page') || '1');
            const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
            const status = url.searchParams.get('status');
            const search = url.searchParams.get('search');
            const tags = url.searchParams.get('tags');

            let jobs = await JobsService.getAll();

            // Apply filters
            if (status && status !== 'all') {
                jobs = jobs.filter(job => job.status === status);
            }

            if (search) {
                const searchResults = await JobsService.search(search);
                jobs = jobs.filter(job =>
                    searchResults.some(result => result.id === job.id)
                );
            }

            if (tags) {
                const tagArray = tags.split(',');
                jobs = jobs.filter(job =>
                    tagArray.some(tag => job.tags.includes(tag))
                );
            }

            const response = createPaginatedResponse(jobs, page, pageSize);
            return HttpResponse.json(response);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            return HttpResponse.json(
                { error: 'Failed to fetch jobs', success: false },
                { status: 500 }
            );
        }
    }),

    // Fallback handler for /jobs (without /api prefix)
    http.get('/jobs', async ({ request }) => {
        try {
            await simulateNetworkConditions(false);
            
            const url = new URL(request.url);
            const page = parseInt(url.searchParams.get('page') || '1');
            const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
            const status = url.searchParams.get('status');
            const search = url.searchParams.get('search');
            const tags = url.searchParams.get('tags');

            let jobs = await JobsService.getAll();

            // Apply filters
            if (status && status !== 'all') {
                jobs = jobs.filter(job => job.status === status);
            }

            if (search) {
                const searchResults = await JobsService.search(search);
                jobs = jobs.filter(job =>
                    searchResults.some(result => result.id === job.id)
                );
            }

            if (tags) {
                const tagArray = tags.split(',');
                jobs = jobs.filter(job =>
                    tagArray.some(tag => job.tags.includes(tag))
                );
            }

            const response = createPaginatedResponse(jobs, page, pageSize);
            return HttpResponse.json(response);
        } catch (error) {
            console.error('Error fetching jobs (fallback):', error);
            return HttpResponse.json(
                { error: 'Failed to fetch jobs', success: false },
                { status: 500 }
            );
        }
    }),

    http.get('/api/jobs/:id', async ({ params }) => {
        try {
            await simulateNetworkConditions(false);

            const { id } = params;
            const job = await JobsService.getById(id as string);

            if (!job) {
                return HttpResponse.json(
                    { error: 'Job not found', success: false },
                    { status: 404 }
                );
            }

            return HttpResponse.json({
                data: job,
                success: true,
            });
        } catch (error) {
            console.error('Error fetching job:', error);
            return HttpResponse.json(
                { error: 'Failed to fetch job', success: false },
                { status: 500 }
            );
        }
    }),

    http.post('/api/jobs', withNetworkSimulation(async ({ request }: any) => {
        const jobData = await request.json();

        // Validate required fields
        if (!jobData.title || !jobData.slug) {
            return HttpResponse.json(
                { error: 'Title and slug are required', success: false },
                { status: 400 }
            );
        }

        // Check for unique slug
        const existingJob = await JobsService.getBySlug(jobData.slug);
        if (existingJob) {
            return HttpResponse.json(
                { error: 'Slug must be unique', success: false },
                { status: 400 }
            );
        }

        // Set default order if not provided
        if (jobData.order === undefined) {
            const allJobs = await JobsService.getAll();
            jobData.order = allJobs.length;
        }

        const newJob = await JobsService.create(jobData);

        return HttpResponse.json({
            data: newJob,
            success: true,
        });
    }, true)),

    // Reorder handler must come before the :id handler to avoid conflicts
    http.patch('/api/jobs/reorder', withNetworkSimulation(async ({ request }: any) => {
        const { fromIndex, toIndex } = await request.json();

        if (typeof fromIndex !== 'number' || typeof toIndex !== 'number') {
            return HttpResponse.json(
                { error: 'fromIndex and toIndex must be numbers', success: false },
                { status: 400 }
            );
        }

        // Get all jobs and reorder them
        const jobs = await JobsService.getAll();
        const reorderedJobs = [...jobs];
        const [movedJob] = reorderedJobs.splice(fromIndex, 1);
        reorderedJobs.splice(toIndex, 0, movedJob);

        // Update order field for all jobs
        const jobIds = reorderedJobs.map(job => job.id);
        await JobsService.reorder(jobIds);

        return HttpResponse.json({
            data: { reordered: jobIds.length },
            success: true,
        });
    }, true)),

    http.patch('/api/jobs/:id', withNetworkSimulation(async ({ params, request }: any) => {
        const { id } = params;
        const updates = await request.json();

        // Check if slug is being updated and ensure uniqueness
        if (updates.slug) {
            const existingJob = await JobsService.getBySlug(updates.slug);
            if (existingJob && existingJob.id !== id) {
                return HttpResponse.json(
                    { error: 'Slug must be unique', success: false },
                    { status: 400 }
                );
            }
        }

        const updatedJob = await JobsService.update(id, updates);

        if (!updatedJob) {
            return HttpResponse.json(
                { error: 'Job not found', success: false },
                { status: 404 }
            );
        }

        return HttpResponse.json({
            data: updatedJob,
            success: true,
        });
    }, true)),

    http.delete('/api/jobs/:id', withNetworkSimulation(async ({ params }: any) => {
        const { id } = params;
        const deleted = await JobsService.delete(id);

        if (!deleted) {
            return HttpResponse.json(
                { error: 'Job not found', success: false },
                { status: 404 }
            );
        }

        return HttpResponse.json({
            data: { deleted: true },
            success: true,
        });
    }, true)),

    // Candidates endpoints
    http.get('/api/candidates', async ({ request }) => {
        try {
            await simulateNetworkConditions(false);

            const url = new URL(request.url);
            const page = parseInt(url.searchParams.get('page') || '1');
            const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
            const stage = url.searchParams.get('stage');
            const jobId = url.searchParams.get('jobId');
            const search = url.searchParams.get('search');

            let candidates = await CandidatesService.getAll();

            // Apply filters
            if (stage && stage !== 'all') {
                candidates = candidates.filter(candidate => candidate.stage === stage);
            }

            if (jobId) {
                candidates = candidates.filter(candidate => candidate.jobId === jobId);
            }

            if (search) {
                const searchResults = await CandidatesService.search(search);
                candidates = candidates.filter(candidate =>
                    searchResults.some(result => result.id === candidate.id)
                );
            }

            const response = createPaginatedResponse(candidates, page, pageSize);
            return HttpResponse.json(response);
        } catch (error) {
            console.error('Error fetching candidates:', error);
            return HttpResponse.json(
                { error: 'Failed to fetch candidates', success: false },
                { status: 500 }
            );
        }
    }),

    http.get('/api/candidates/:id', async ({ params }) => {
        try {
            await simulateNetworkConditions(false);

            const { id } = params;
            const candidate = await CandidatesService.getById(id as string);

            if (!candidate) {
                return HttpResponse.json(
                    { error: 'Candidate not found', success: false },
                    { status: 404 }
                );
            }

            return HttpResponse.json({
                data: candidate,
                success: true,
            });
        } catch (error) {
            console.error('Error fetching candidate:', error);
            return HttpResponse.json(
                { error: 'Failed to fetch candidate', success: false },
                { status: 500 }
            );
        }
    }),

    http.post('/api/candidates', withNetworkSimulation(async ({ request }: any) => {
        const candidateData = await request.json();

        // Validate required fields
        if (!candidateData.name || !candidateData.email || !candidateData.jobId) {
            return HttpResponse.json(
                { error: 'Name, email, and jobId are required', success: false },
                { status: 400 }
            );
        }

        // Verify job exists
        const job = await JobsService.getById(candidateData.jobId);
        if (!job) {
            return HttpResponse.json(
                { error: 'Job not found', success: false },
                { status: 400 }
            );
        }

        // Set default stage if not provided
        if (!candidateData.stage) {
            candidateData.stage = 'applied';
        }

        const newCandidate = await CandidatesService.create(candidateData);

        return HttpResponse.json({
            data: newCandidate,
            success: true,
        });
    }, true)),

    http.patch('/api/candidates/:id', withNetworkSimulation(async ({ params, request }: any) => {
        const { id } = params;
        const updates = await request.json();

        const updatedCandidate = await CandidatesService.update(id, updates);

        if (!updatedCandidate) {
            return HttpResponse.json(
                { error: 'Candidate not found', success: false },
                { status: 404 }
            );
        }

        return HttpResponse.json({
            data: updatedCandidate,
            success: true,
        });
    }, true)),

    http.post('/api/candidates/:id/notes', withNetworkSimulation(async ({ params, request }: any) => {
        const { id } = params;
        const noteData = await request.json();

        if (!noteData.content || !noteData.authorName) {
            return HttpResponse.json(
                { error: 'Content and authorName are required', success: false },
                { status: 400 }
            );
        }

        const updatedCandidate = await CandidatesService.addNote(id, {
            content: noteData.content,
            authorId: noteData.authorId || 'current-user',
            authorName: noteData.authorName,
            mentions: noteData.mentions || [],
        });

        if (!updatedCandidate) {
            return HttpResponse.json(
                { error: 'Candidate not found', success: false },
                { status: 404 }
            );
        }

        return HttpResponse.json({
            data: updatedCandidate,
            success: true,
        });
    }, true)),

    http.get('/api/candidates/:id/timeline', async ({ params }) => {
        try {
            await simulateNetworkConditions(false);

            const { id } = params;
            const timeline = await TimelineService.getByCandidateId(id as string);

            return HttpResponse.json({
                data: timeline,
                success: true,
            });
        } catch (error) {
            console.error('Error fetching timeline:', error);
            return HttpResponse.json(
                { error: 'Failed to fetch timeline', success: false },
                { status: 500 }
            );
        }
    }),

    http.delete('/api/candidates/:id', withNetworkSimulation(async ({ params }: any) => {
        const { id } = params;
        const deleted = await CandidatesService.delete(id);

        if (!deleted) {
            return HttpResponse.json(
                { error: 'Candidate not found', success: false },
                { status: 404 }
            );
        }

        return HttpResponse.json({
            data: { deleted: true },
            success: true,
        });
    }, true)),

    // Assessments endpoints
    http.get('/api/assessments', async ({ request }) => {
        try {
            await simulateNetworkConditions(false);

            const url = new URL(request.url);
            const jobId = url.searchParams.get('jobId');

            let assessments;
            if (jobId) {
                assessments = await AssessmentsService.getByJobId(jobId);
            } else {
                assessments = await AssessmentsService.getAll();
            }

            return HttpResponse.json({
                data: assessments,
                success: true,
            });
        } catch (error) {
            console.error('Error fetching assessments:', error);
            return HttpResponse.json(
                { error: 'Failed to fetch assessments', success: false },
                { status: 500 }
            );
        }
    }),

    http.get('/api/assessments/:id', async ({ params }) => {
        try {
            await simulateNetworkConditions(false);

            const { id } = params;
            const assessment = await AssessmentsService.getById(id as string);

            if (!assessment) {
                return HttpResponse.json(
                    { error: 'Assessment not found', success: false },
                    { status: 404 }
                );
            }

            return HttpResponse.json({
                data: assessment,
                success: true,
            });
        } catch (error) {
            console.error('Error fetching assessment:', error);
            return HttpResponse.json(
                { error: 'Failed to fetch assessment', success: false },
                { status: 500 }
            );
        }
    }),

    http.post('/api/assessments', withNetworkSimulation(async ({ request }: any) => {
        const assessmentData = await request.json();

        // Validate required fields - only title is required now
        if (!assessmentData.title) {
            return HttpResponse.json(
                { error: 'Title is required', success: false },
                { status: 400 }
            );
        }

        // Verify job exists if jobId is provided
        if (assessmentData.jobId) {
            const job = await JobsService.getById(assessmentData.jobId);
            if (!job) {
                return HttpResponse.json(
                    { error: 'Job not found', success: false },
                    { status: 400 }
                );
            }
        }

        const newAssessment = await AssessmentsService.create(assessmentData);

        return HttpResponse.json({
            data: newAssessment,
            success: true,
        });
    }, true)),

    http.put('/api/assessments/:id', withNetworkSimulation(async ({ params, request }: any) => {
        const { id } = params;
        const assessmentData = await request.json();

        const updatedAssessment = await AssessmentsService.update(id, assessmentData);

        if (!updatedAssessment) {
            return HttpResponse.json(
                { error: 'Assessment not found', success: false },
                { status: 404 }
            );
        }

        return HttpResponse.json({
            data: updatedAssessment,
            success: true,
        });
    }, true)),

    http.delete('/api/assessments/:id', withNetworkSimulation(async ({ params }: any) => {
        const { id } = params;
        const deleted = await AssessmentsService.delete(id);

        if (!deleted) {
            return HttpResponse.json(
                { error: 'Assessment not found', success: false },
                { status: 404 }
            );
        }

        return HttpResponse.json({
            data: { deleted: true },
            success: true,
        });
    }, true)),

    // Assessment Responses endpoints
    http.get('/api/assessment-responses', async ({ request }) => {
        try {
            await simulateNetworkConditions(false);

            const url = new URL(request.url);
            const candidateId = url.searchParams.get('candidateId');
            const assessmentId = url.searchParams.get('assessmentId');

            let responses;
            if (candidateId) {
                responses = await AssessmentResponsesService.getByCandidateId(candidateId);
            } else if (assessmentId) {
                responses = await AssessmentResponsesService.getByAssessmentId(assessmentId);
            } else {
                responses = await AssessmentResponsesService.getAll();
            }

            return HttpResponse.json({
                data: responses,
                success: true,
            });
        } catch (error) {
            console.error('Error fetching assessment responses:', error);
            return HttpResponse.json(
                { error: 'Failed to fetch assessment responses', success: false },
                { status: 500 }
            );
        }
    }),

    http.post('/api/assessment-responses', withNetworkSimulation(async ({ request }: any) => {
        const responseData = await request.json();

        // Validate required fields
        if (!responseData.candidateId || !responseData.assessmentId) {
            return HttpResponse.json(
                { error: 'candidateId and assessmentId are required', success: false },
                { status: 400 }
            );
        }

        // Verify candidate and assessment exist
        const [candidate, assessment] = await Promise.all([
            CandidatesService.getById(responseData.candidateId),
            AssessmentsService.getById(responseData.assessmentId)
        ]);

        if (!candidate) {
            return HttpResponse.json(
                { error: 'Candidate not found', success: false },
                { status: 400 }
            );
        }

        if (!assessment) {
            return HttpResponse.json(
                { error: 'Assessment not found', success: false },
                { status: 400 }
            );
        }

        // Set default values
        if (!responseData.status) {
            responseData.status = 'draft';
        }
        if (!responseData.submittedAt && responseData.status === 'submitted') {
            responseData.submittedAt = new Date();
        }

        const newResponse = await AssessmentResponsesService.create(responseData);

        return HttpResponse.json({
            data: newResponse,
            success: true,
        });
    }, true)),

    http.patch('/api/assessment-responses/:id', withNetworkSimulation(async ({ params, request }: any) => {
        const { id } = params;
        const updates = await request.json();

        // Set submittedAt if status is being changed to submitted
        if (updates.status === 'submitted' && !updates.submittedAt) {
            updates.submittedAt = new Date();
        }

        const updatedResponse = await AssessmentResponsesService.update(id, updates);

        if (!updatedResponse) {
            return HttpResponse.json(
                { error: 'Assessment response not found', success: false },
                { status: 404 }
            );
        }

        return HttpResponse.json({
            data: updatedResponse,
            success: true,
        });
    }, true)),
];
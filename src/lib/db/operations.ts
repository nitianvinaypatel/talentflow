import { db } from './schema';
import type {
    Job,
    Candidate,
    Assessment,
    TimelineEvent,
    AssessmentResponse,
    Note,
} from '../../types';

// Jobs CRUD Operations
export class JobsService {
    static async getAll(): Promise<Job[]> {
        return await db.jobs.orderBy('order').toArray();
    }

    static async getById(id: string): Promise<Job | undefined> {
        return await db.jobs.get(id);
    }

    static async getBySlug(slug: string): Promise<Job | undefined> {
        return await db.jobs.where('slug').equals(slug).first();
    }

    static async create(job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> {
        const id = crypto.randomUUID();
        const newJob: Job = {
            ...job,
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.jobs.add(newJob);
        return newJob;
    }

    static async update(id: string, updates: Partial<Job>): Promise<Job | null> {
        const existingJob = await db.jobs.get(id);
        if (!existingJob) return null;

        const updatedJob = { ...existingJob, ...updates, updatedAt: new Date() };
        await db.jobs.update(id, updatedJob);
        return updatedJob;
    }

    static async delete(id: string): Promise<boolean> {
        const count = await db.jobs.where('id').equals(id).delete();
        return count > 0;
    }

    static async reorder(jobIds: string[]): Promise<void> {
        await db.transaction('rw', db.jobs, async () => {
            for (let i = 0; i < jobIds.length; i++) {
                await db.jobs.update(jobIds[i], { order: i });
            }
        });
    }

    static async getByStatus(status: Job['status']): Promise<Job[]> {
        return await db.jobs.where('status').equals(status).sortBy('order');
    }

    static async search(query: string): Promise<Job[]> {
        const lowerQuery = query.toLowerCase();
        return await db.jobs
            .filter(job =>
                job.title.toLowerCase().includes(lowerQuery) ||
                job.description.toLowerCase().includes(lowerQuery) ||
                job.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
            )
            .toArray();
    }
}

// Candidates CRUD Operations
export class CandidatesService {
    static async getAll(): Promise<Candidate[]> {
        return await db.candidates.orderBy('appliedAt').reverse().toArray();
    }

    static async getById(id: string): Promise<Candidate | undefined> {
        return await db.candidates.get(id);
    }

    static async getByJobId(jobId: string): Promise<Candidate[]> {
        return await db.candidates.where('jobId').equals(jobId).toArray();
    }

    static async getByStage(stage: Candidate['stage']): Promise<Candidate[]> {
        return await db.candidates.where('stage').equals(stage).toArray();
    }

    static async create(candidate: Omit<Candidate, 'id' | 'appliedAt' | 'updatedAt'>): Promise<Candidate> {
        const id = crypto.randomUUID();
        const newCandidate: Candidate = {
            ...candidate,
            id,
            appliedAt: new Date(),
            updatedAt: new Date(),
            notes: candidate.notes || [],
            assessmentResponses: candidate.assessmentResponses || [],
        };

        await db.candidates.add(newCandidate);

        // Create timeline event for application
        await TimelineService.create({
            candidateId: id,
            type: 'stage_change',
            description: `Applied for position`,
            timestamp: new Date(),
            metadata: { stage: candidate.stage }
        });

        return newCandidate;
    }

    static async update(id: string, updates: Partial<Candidate>): Promise<Candidate | null> {
        const existingCandidate = await db.candidates.get(id);
        if (!existingCandidate) return null;

        const updatedCandidate = { ...existingCandidate, ...updates, updatedAt: new Date() };
        await db.candidates.update(id, updatedCandidate);

        // Create timeline event for stage changes
        if (updates.stage && updates.stage !== existingCandidate.stage) {
            await TimelineService.create({
                candidateId: id,
                type: 'stage_change',
                description: `Moved to ${updates.stage}`,
                timestamp: new Date(),
                metadata: {
                    previousStage: existingCandidate.stage,
                    newStage: updates.stage
                }
            });
        }

        return updatedCandidate;
    }

    static async delete(id: string): Promise<boolean> {
        const count = await db.candidates.where('id').equals(id).delete();
        // Also delete related timeline events
        await db.candidateTimeline.where('candidateId').equals(id).delete();
        return count > 0;
    }

    static async addNote(candidateId: string, note: Omit<Note, 'id' | 'createdAt'>): Promise<Candidate | null> {
        const candidate = await db.candidates.get(candidateId);
        if (!candidate) return null;

        const newNote: Note = {
            ...note,
            id: crypto.randomUUID(),
            createdAt: new Date(),
        };

        const updatedNotes = [...candidate.notes, newNote];
        await db.candidates.update(candidateId, { notes: updatedNotes });

        // Create timeline event for note
        await TimelineService.create({
            candidateId,
            type: 'note_added',
            description: `Note added by ${note.authorName}`,
            timestamp: new Date(),
            metadata: { noteId: newNote.id }
        });

        return { ...candidate, notes: updatedNotes };
    }

    static async search(query: string): Promise<Candidate[]> {
        const lowerQuery = query.toLowerCase();
        return await db.candidates
            .filter(candidate =>
                candidate.name.toLowerCase().includes(lowerQuery) ||
                candidate.email.toLowerCase().includes(lowerQuery)
            )
            .toArray();
    }

    static async getByStageAndJob(stage: Candidate['stage'], jobId: string): Promise<Candidate[]> {
        return await db.candidates
            .where(['stage', 'jobId'])
            .equals([stage, jobId])
            .toArray();
    }
}

// Assessments CRUD Operations
export class AssessmentsService {
    static async getAll(): Promise<Assessment[]> {
        return await db.assessments.orderBy('createdAt').reverse().toArray();
    }

    static async getById(id: string): Promise<Assessment | undefined> {
        return await db.assessments.get(id);
    }

    static async getByJobId(jobId: string): Promise<Assessment[]> {
        return await db.assessments.where('jobId').equals(jobId).toArray();
    }

    static async getStandalone(): Promise<Assessment[]> {
        return await db.assessments.filter(assessment => !assessment.jobId).toArray();
    }

    static async create(assessment: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Assessment> {
        const id = crypto.randomUUID();
        const newAssessment: Assessment = {
            ...assessment,
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.assessments.add(newAssessment);
        return newAssessment;
    }

    static async update(id: string, updates: Partial<Assessment>): Promise<Assessment | null> {
        const existingAssessment = await db.assessments.get(id);
        if (!existingAssessment) return null;

        const updatedAssessment = { ...existingAssessment, ...updates, updatedAt: new Date() };
        await db.assessments.update(id, updatedAssessment);
        return updatedAssessment;
    }

    static async delete(id: string): Promise<boolean> {
        const count = await db.assessments.where('id').equals(id).delete();
        // Also delete related assessment responses
        await db.assessmentResponses.where('assessmentId').equals(id).delete();
        return count > 0;
    }
}

// Timeline CRUD Operations
export class TimelineService {
    static async getAll(): Promise<TimelineEvent[]> {
        return await db.candidateTimeline.orderBy('timestamp').reverse().toArray();
    }

    static async getByCandidateId(candidateId: string): Promise<TimelineEvent[]> {
        return await db.candidateTimeline
            .where('candidateId')
            .equals(candidateId)
            .reverse()
            .sortBy('timestamp');
    }

    static async create(event: Omit<TimelineEvent, 'id'>): Promise<TimelineEvent> {
        const id = crypto.randomUUID();
        const newEvent: TimelineEvent = {
            ...event,
            id,
        };

        await db.candidateTimeline.add(newEvent);
        return newEvent;
    }

    static async delete(id: string): Promise<boolean> {
        const count = await db.candidateTimeline.where('id').equals(id).delete();
        return count > 0;
    }
}

// Assessment Responses CRUD Operations
export class AssessmentResponsesService {
    static async getAll(): Promise<AssessmentResponse[]> {
        return await db.assessmentResponses.orderBy('submittedAt').reverse().toArray();
    }

    static async getById(id: string): Promise<AssessmentResponse | undefined> {
        return await db.assessmentResponses.get(id);
    }

    static async getByCandidateId(candidateId: string): Promise<AssessmentResponse[]> {
        return await db.assessmentResponses.where('candidateId').equals(candidateId).toArray();
    }

    static async getByAssessmentId(assessmentId: string): Promise<AssessmentResponse[]> {
        return await db.assessmentResponses.where('assessmentId').equals(assessmentId).toArray();
    }

    static async create(response: Omit<AssessmentResponse, 'id'>): Promise<AssessmentResponse> {
        const id = crypto.randomUUID();
        const newResponse: AssessmentResponse = {
            ...response,
            id,
        };

        await db.assessmentResponses.add(newResponse);

        // Create timeline event for assessment submission
        if (response.status === 'submitted') {
            await TimelineService.create({
                candidateId: response.candidateId,
                type: 'assessment_submitted',
                description: `Assessment submitted`,
                timestamp: new Date(),
                metadata: { assessmentId: response.assessmentId }
            });
        }

        return newResponse;
    }

    static async update(id: string, updates: Partial<AssessmentResponse>): Promise<AssessmentResponse | null> {
        const existingResponse = await db.assessmentResponses.get(id);
        if (!existingResponse) return null;

        const updatedResponse = { ...existingResponse, ...updates };
        await db.assessmentResponses.update(id, updatedResponse);

        // Create timeline event for status changes
        if (updates.status && updates.status !== existingResponse.status && updates.status === 'submitted') {
            await TimelineService.create({
                candidateId: existingResponse.candidateId,
                type: 'assessment_submitted',
                description: `Assessment submitted`,
                timestamp: new Date(),
                metadata: { assessmentId: existingResponse.assessmentId }
            });
        }

        return updatedResponse;
    }

    static async delete(id: string): Promise<boolean> {
        const count = await db.assessmentResponses.where('id').equals(id).delete();
        return count > 0;
    }
}

// Database utility functions
export class DatabaseService {
    static async clearAll(): Promise<void> {
        await db.transaction('rw', [
            db.jobs,
            db.candidates,
            db.assessments,
            db.candidateTimeline,
            db.assessmentResponses
        ], async () => {
            await db.jobs.clear();
            await db.candidates.clear();
            await db.assessments.clear();
            await db.candidateTimeline.clear();
            await db.assessmentResponses.clear();
        });
    }

    static async getStats(): Promise<{
        jobsCount: number;
        candidatesCount: number;
        assessmentsCount: number;
        timelineEventsCount: number;
        responsesCount: number;
    }> {
        const [jobsCount, candidatesCount, assessmentsCount, timelineEventsCount, responsesCount] = await Promise.all([
            db.jobs.count(),
            db.candidates.count(),
            db.assessments.count(),
            db.candidateTimeline.count(),
            db.assessmentResponses.count()
        ]);

        return {
            jobsCount,
            candidatesCount,
            assessmentsCount,
            timelineEventsCount,
            responsesCount
        };
    }

    static async exportData(): Promise<{
        jobs: Job[];
        candidates: Candidate[];
        assessments: Assessment[];
        timeline: TimelineEvent[];
        responses: AssessmentResponse[];
    }> {
        const [jobs, candidates, assessments, timeline, responses] = await Promise.all([
            db.jobs.toArray(),
            db.candidates.toArray(),
            db.assessments.toArray(),
            db.candidateTimeline.toArray(),
            db.assessmentResponses.toArray()
        ]);

        return { jobs, candidates, assessments, timeline, responses };
    }

    static async importData(data: {
        jobs?: Job[];
        candidates?: Candidate[];
        assessments?: Assessment[];
        timeline?: TimelineEvent[];
        responses?: AssessmentResponse[];
    }): Promise<void> {
        await db.transaction('rw', [
            db.jobs,
            db.candidates,
            db.assessments,
            db.candidateTimeline,
            db.assessmentResponses
        ], async () => {
            if (data.jobs) await db.jobs.bulkPut(data.jobs);
            if (data.candidates) await db.candidates.bulkPut(data.candidates);
            if (data.assessments) await db.assessments.bulkPut(data.assessments);
            if (data.timeline) await db.candidateTimeline.bulkPut(data.timeline);
            if (data.responses) await db.assessmentResponses.bulkPut(data.responses);
        });
    }
}
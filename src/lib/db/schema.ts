import Dexie, { type Table } from 'dexie';
import type {
    Job,
    Candidate,
    Assessment,
    TimelineEvent,
    AssessmentResponse,
} from '../../types';

export class TalentFlowDB extends Dexie {
    jobs!: Table<Job>;
    candidates!: Table<Candidate>;
    assessments!: Table<Assessment>;
    candidateTimeline!: Table<TimelineEvent>;
    assessmentResponses!: Table<AssessmentResponse>;

    constructor() {
        super('TalentFlowDB');

        this.version(1).stores({
            jobs: '++id, title, status, order, createdAt, slug',
            candidates: '++id, name, email, stage, jobId, appliedAt',
            assessments: '++id, jobId, title, createdAt',
            candidateTimeline: '++id, candidateId, timestamp, type',
            assessmentResponses: '++id, candidateId, assessmentId, submittedAt, status'
        });

        // Add hooks for automatic timestamp updates
        this.jobs.hook('creating', function (_primKey, obj, _trans) {
            obj.createdAt = new Date();
            obj.updatedAt = new Date();
        });

        this.jobs.hook('updating', function (modifications, _primKey, _obj, _trans) {
            (modifications as any).updatedAt = new Date();
        });

        this.candidates.hook('creating', function (_primKey, obj, _trans) {
            obj.appliedAt = obj.appliedAt || new Date();
            obj.updatedAt = new Date();
        });

        this.candidates.hook('updating', function (modifications, _primKey, _obj, _trans) {
            (modifications as any).updatedAt = new Date();
        });

        this.assessments.hook('creating', function (_primKey, obj, _trans) {
            obj.createdAt = new Date();
            obj.updatedAt = new Date();
        });

        this.assessments.hook('updating', function (modifications, _primKey, _obj, _trans) {
            (modifications as any).updatedAt = new Date();
        });
    }
}

// Create and export database instance
export const db = new TalentFlowDB();
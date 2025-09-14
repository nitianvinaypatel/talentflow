// Core entity types for TalentFlow application

export interface Job {
    id: string;
    title: string;
    slug: string;
    description: string;
    status: 'active' | 'archived';
    tags: string[];
    order: number;
    createdAt: Date;
    updatedAt: Date;
    requirements: string[];
    location: string;
    type: 'full-time' | 'part-time' | 'contract';
}

export interface Candidate {
    id: string;
    name: string;
    email: string;
    phone?: string;
    resume?: string;
    stage: 'applied' | 'screen' | 'tech' | 'offer' | 'hired' | 'rejected';
    jobId: string;
    appliedAt: Date;
    updatedAt: Date;
    notes: Note[];
    assessmentResponses: AssessmentResponse[];
    timeline: TimelineEvent[];
}

export interface Assessment {
    id: string;
    jobId?: string; // Made optional to allow standalone assessments
    title: string;
    description: string;
    sections: AssessmentSection[];
    createdAt: Date;
    updatedAt: Date;
}

export interface AssessmentSection {
    id: string;
    title: string;
    description?: string;
    questions: Question[];
    order: number;
}

export interface Question {
    id: string;
    type: 'single-choice' | 'multi-choice' | 'short-text' | 'long-text' | 'numeric' | 'file-upload';
    title: string;
    description?: string;
    required: boolean;
    options?: string[]; // for choice questions
    validation?: ValidationRule[];
    conditionalLogic?: ConditionalRule[];
    order: number;
}

export interface ValidationRule {
    type: 'required' | 'min-length' | 'max-length' | 'numeric-range' | 'email' | 'url';
    value?: any;
    message: string;
}

export interface ConditionalRule {
    dependsOnQuestionId: string;
    condition: 'equals' | 'not-equals' | 'contains' | 'greater-than' | 'less-than';
    value: any;
    action: 'show' | 'hide' | 'require';
}

export interface Note {
    id: string;
    content: string;
    authorId: string;
    authorName: string;
    createdAt: Date;
    mentions: Mention[];
}

export interface Mention {
    id: string;
    name: string;
    email: string;
    type: 'user' | 'candidate';
}

export interface AssessmentResponse {
    id: string;
    candidateId: string;
    assessmentId: string;
    responses: QuestionResponse[];
    submittedAt: Date;
    status: 'draft' | 'submitted' | 'reviewed';
}

export interface QuestionResponse {
    questionId: string;
    value: string | number | string[] | File;
    type: Question['type'];
}

export interface TimelineEvent {
    id: string;
    candidateId: string;
    type: 'stage_change' | 'note_added' | 'assessment_submitted' | 'interview_scheduled' | 'application_received';
    description: string;
    timestamp: Date;
    authorId?: string;
    authorName?: string;
    metadata?: {
        previousStage?: Candidate['stage'];
        newStage?: Candidate['stage'];
        noteId?: string;
        assessmentId?: string;
        [key: string]: unknown;
    };
}

// UI State types
export interface JobFilters {
    search: string;
    status: 'all' | 'active' | 'archived';
    tags: string[];
}

export interface CandidateFilters {
    search: string;
    stage: 'all' | Candidate['stage'];
    jobId?: string;
}

export interface PaginationState {
    page: number;
    pageSize: number;
    total: number;
}

export interface AssessmentBuilderState {
    currentAssessment: Assessment | null;
    selectedSection: string | null;
    selectedQuestion: string | null;
    previewMode: boolean;
}

// API Response types
export interface ApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
}

export interface ApiError {
    message: string;
    code: string;
    details?: Record<string, any>;
}

// Optimistic update types
export interface OptimisticUpdate<T> {
    id: string;
    type: 'create' | 'update' | 'delete' | 'reorder';
    entity: string;
    data: T;
    originalData?: T;
    timestamp: number;
}

export interface LoadingState {
    [key: string]: boolean;
}

export interface ErrorState {
    [key: string]: string | null;
}

// Store types
export interface AppStore {
    // UI State
    sidebarOpen: boolean;
    currentRoute: string;
    loading: LoadingState;
    errors: ErrorState;

    // Jobs State
    jobs: Job[];
    jobsFilters: JobFilters;
    jobsPagination: PaginationState;
    jobsLoading: boolean;
    jobsError: string | null;

    // Candidates State
    candidates: Candidate[];
    candidatesFilters: CandidateFilters;
    selectedCandidate: Candidate | null;
    candidatesLoading: boolean;
    candidatesError: string | null;

    // Assessments State
    assessments: Assessment[];
    currentAssessment: Assessment | null;
    assessmentBuilder: AssessmentBuilderState;
    assessmentsLoading: boolean;
    assessmentsError: string | null;

    // Optimistic updates tracking
    pendingUpdates: OptimisticUpdate<any>[];

    // Actions with optimistic updates
    setJobs: (jobs: Job[]) => void;
    updateJob: (id: string, updates: Partial<Job>) => Promise<void>;
    createJob: (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    deleteJob: (id: string) => Promise<void>;
    reorderJobs: (fromIndex: number, toIndex: number) => Promise<void>;
    setJobsFilters: (filters: Partial<JobFilters>) => void;
    setJobsPagination: (pagination: Partial<PaginationState>) => void;

    setCandidates: (candidates: Candidate[]) => void;
    updateCandidate: (id: string, updates: Partial<Candidate>) => Promise<void>;
    createCandidate: (candidate: Omit<Candidate, 'id' | 'appliedAt' | 'updatedAt' | 'notes' | 'assessmentResponses'>) => Promise<void>;
    deleteCandidate: (id: string) => Promise<void>;
    setSelectedCandidate: (candidate: Candidate | null) => void;
    setCandidatesFilters: (filters: Partial<CandidateFilters>) => void;

    setAssessments: (assessments: Assessment[]) => void;
    updateAssessment: (id: string, updates: Partial<Assessment>) => Promise<void>;
    createAssessment: (assessment: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    deleteAssessment: (id: string) => Promise<void>;
    setCurrentAssessment: (assessment: Assessment | null) => void;
    setAssessmentBuilder: (state: Partial<AssessmentBuilderState>) => void;

    // Loading and error management
    setLoading: (key: string, loading: boolean) => void;
    setError: (key: string, error: string | null) => void;
    clearErrors: () => void;

    // Data loading actions
    loadJobs: () => Promise<void>;
    loadCandidates: () => Promise<void>;
    loadAssessments: () => Promise<void>;
    loadAllData: () => Promise<void>;

    // Optimistic update management
    addPendingUpdate: (update: OptimisticUpdate<any>) => void;
    removePendingUpdate: (id: string) => void;
    rollbackUpdate: (id: string) => void;

    // UI Actions
    setSidebarOpen: (open: boolean) => void;
    setCurrentRoute: (route: string) => void;

    // Sync and persistence
    syncWithAPI: () => Promise<void>;
    loadFromStorage: () => Promise<void>;

    // Reset function
    reset: () => void;

    // Force database reseed
    forceReseed: () => Promise<void>;
}
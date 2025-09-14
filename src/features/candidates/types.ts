import type { Candidate } from '../../types';

export interface CandidateCardProps {
    candidate: Candidate;
    onClick?: (candidate: Candidate) => void;
    onStageChange?: (candidateId: string, newStage: Candidate['stage']) => void;
}

export interface CandidatesListProps {
    candidates: Candidate[];
    loading?: boolean;
    onCandidateClick?: (candidate: Candidate) => void;
    onStageChange?: (candidateId: string, newStage: Candidate['stage']) => void;
}

export interface CandidateFiltersProps {
    filters: {
        search: string;
        stage: 'all' | Candidate['stage'];
        jobId?: string;
    };
    onFiltersChange: (filters: Partial<CandidateFiltersProps['filters']>) => void;
    jobs: Array<{ id: string; title: string }>;
}

export interface VirtualizedListProps {
    candidates: Candidate[];
    height?: number; // Optional for backward compatibility
    itemHeight?: number; // Optional for backward compatibility
    onCandidateClick?: (candidate: Candidate) => void;
    onStageChange?: (candidateId: string, newStage: Candidate['stage']) => void;
}
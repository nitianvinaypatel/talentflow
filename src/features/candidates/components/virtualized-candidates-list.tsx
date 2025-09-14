import { memo, useMemo } from "react";
import { Virtuoso } from "react-virtuoso";
import { CandidateCard } from "./candidate-card";
import type { VirtualizedListProps } from "../types";

const DEFAULT_HEIGHT = 600; // Default height of the virtualized list

export const VirtualizedCandidatesList = memo<VirtualizedListProps>(({
    candidates,
    height = DEFAULT_HEIGHT,
    onCandidateClick,
    onStageChange,
}) => {
    // Ensure we have a valid candidates array
    const validCandidates = useMemo(() => {
        if (!Array.isArray(candidates)) {
            console.warn("Candidates is not an array:", candidates);
            return [];
        }

        return candidates.filter((candidate, index) => {
            if (!candidate) {
                console.warn(`Candidate at index ${index} is null/undefined`);
                return false;
            }

            const isValid =
                candidate.id &&
                candidate.name &&
                candidate.email &&
                candidate.stage &&
                candidate.jobId;

            if (!isValid) {
                console.warn(`Candidate at index ${index} missing required fields:`, {
                    id: !!candidate.id,
                    name: !!candidate.name,
                    email: !!candidate.email,
                    stage: !!candidate.stage,
                    jobId: !!candidate.jobId,
                    candidate,
                });
            }

            return isValid;
        });
    }, [candidates]);

    const renderCandidate = useMemo(() => (index: number) => {
        const candidate = validCandidates[index];
        if (!candidate) return null;

        return (
            <div className="px-4 py-2">
                <CandidateCard
                    candidate={candidate}
                    onClick={onCandidateClick}
                    onStageChange={onStageChange}
                />
            </div>
        );
    }, [validCandidates, onCandidateClick, onStageChange]);

    if (validCandidates.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <svg
                        className="w-8 h-8 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                    No candidates found
                </h3>
                <p className="text-muted-foreground max-w-sm">
                    No candidates match your current filters. Try adjusting your search
                    criteria or add new candidates.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-lg border">
            <Virtuoso
                style={{ height }}
                totalCount={validCandidates.length}
                itemContent={renderCandidate}
                className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            />
            <div className="p-4 text-center text-sm text-gray-500 border-t">
                Showing {validCandidates.length} candidate
                {validCandidates.length !== 1 ? "s" : ""} (virtualized)
            </div>
        </div>
    );
});

VirtualizedCandidatesList.displayName = "VirtualizedCandidatesList";
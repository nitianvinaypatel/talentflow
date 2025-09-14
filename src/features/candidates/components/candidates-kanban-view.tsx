import { useState } from "react";
import { KanbanBoard } from "./kanban-board";
import CandidateProfile from "./candidate-profile";
import { useAppStore } from "../../../lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import { VisuallyHidden } from "../../../components/ui/visually-hidden";
import type { Candidate } from "../../../types";

export const CandidatesKanbanView = () => {
  const { candidates } = useAppStore();
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );

  const handleCandidateClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
  };

  const handleCloseProfile = () => {
    setSelectedCandidate(null);
  };

  return (
    <div className="h-full">
      <KanbanBoard
        candidates={candidates}
        onCandidateClick={handleCandidateClick}
      />

      {/* Candidate Profile Modal */}
      <Dialog open={!!selectedCandidate} onOpenChange={handleCloseProfile}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>Candidate Profile</DialogTitle>
            </VisuallyHidden>
            <VisuallyHidden>
              <DialogDescription>
                View detailed candidate profile information
              </DialogDescription>
            </VisuallyHidden>
          </DialogHeader>
          {selectedCandidate && (
            <CandidateProfile candidate={selectedCandidate} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

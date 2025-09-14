import { memo, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { MoreHorizontal, Mail, Phone, Calendar } from "lucide-react";
import { formatDate } from "../../../lib/utils";
import type { VirtualizedListProps } from "../types";
import type { Candidate } from "@/types";

const stageColors: Record<Candidate["stage"], string> = {
  applied: "bg-blue-100 text-blue-800",
  screen: "bg-yellow-100 text-yellow-800",
  tech: "bg-purple-100 text-purple-800",
  offer: "bg-green-100 text-green-800",
  hired: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

const stageLabels: Record<Candidate["stage"], string> = {
  applied: "Applied",
  screen: "Screening",
  tech: "Technical",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

const stages: Candidate["stage"][] = [
  "applied",
  "screen",
  "tech",
  "offer",
  "hired",
  "rejected",
];

const EmptyState = () => (
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

export const CandidatesTable = memo<VirtualizedListProps>(
  ({
    candidates,
    onCandidateClick,
    onStageChange,
    // height and itemHeight are ignored for table layout
  }) => {
    // Ensure we have a valid candidates array with basic validation
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

        // Basic validation - store should handle data normalization
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

    const handleCandidateClick = (candidate: Candidate) => {
      onCandidateClick?.(candidate);
    };

    const handleStageChange = (
      candidateId: string,
      newStage: Candidate["stage"]
    ) => {
      onStageChange?.(candidateId, newStage);
    };

    if (validCandidates.length === 0) {
      return <EmptyState />;
    }

    return (
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Name</TableHead>
              <TableHead className="w-[200px]">Email</TableHead>
              <TableHead className="w-[150px]">Phone</TableHead>
              <TableHead className="w-[120px]">Stage</TableHead>
              <TableHead className="w-[120px]">Applied</TableHead>
              <TableHead className="w-[100px]">Notes</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validCandidates.map((candidate) => (
              <TableRow
                key={candidate.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleCandidateClick(candidate)}
              >
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">
                      {candidate.name}
                    </span>
                    {candidate.resume && (
                      <span className="text-xs text-muted-foreground">
                        Has resume
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground truncate">
                      {candidate.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {candidate.phone ? (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {candidate.phone}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={stageColors[candidate.stage]}>
                    {stageLabels[candidate.stage]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {formatDate(new Date(candidate.appliedAt))}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {candidate.notes.length > 0
                      ? `${candidate.notes.length} note${
                          candidate.notes.length !== 1 ? "s" : ""
                        }`
                      : "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {stages.map((stage) => (
                        <DropdownMenuItem
                          key={stage}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStageChange(candidate.id, stage);
                          }}
                          disabled={stage === candidate.stage}
                        >
                          Move to {stageLabels[stage]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="p-4 text-center text-sm text-gray-500 border-t">
          Showing {validCandidates.length} candidate
          {validCandidates.length !== 1 ? "s" : ""}
        </div>
      </div>
    );
  }
);

CandidatesTable.displayName = "CandidatesTable";

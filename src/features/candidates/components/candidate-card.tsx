import { memo } from "react";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { MoreHorizontal, Mail, Phone, Calendar, FileText } from "lucide-react";
import type { CandidateCardProps } from "../types";
import type { Candidate } from "../../../types";

const stageColors: Record<Candidate["stage"], string> = {
  applied: "bg-blue-600/20 text-blue-400 border-blue-500/30",
  screen: "bg-amber-600/20 text-amber-400 border-amber-500/30",
  tech: "bg-purple-600/20 text-purple-400 border-purple-500/30",
  offer: "bg-emerald-600/20 text-emerald-400 border-emerald-500/30",
  hired: "bg-green-600/20 text-green-400 border-green-500/30",
  rejected: "bg-red-600/20 text-red-400 border-red-500/30",
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

export const CandidateCard = memo<CandidateCardProps>(
  ({ candidate, onClick, onStageChange }) => {
    // Safety check for candidate data
    if (!candidate || !candidate.id || !candidate.name || !candidate.email) {
      return (
        <Card
          className="border border-gray-700"
          style={{ backgroundColor: "#0d1025" }}
        >
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto mb-3">
              ⚠️
            </div>
            <p className="text-red-400 font-medium">Invalid candidate data</p>
            <p className="text-sm text-gray-400 mt-1">
              Please check the data source
            </p>
          </CardContent>
        </Card>
      );
    }

    const handleCardClick = () => {
      onClick?.(candidate);
    };

    const handleStageChange = (newStage: Candidate["stage"]) => {
      onStageChange?.(candidate.id, newStage);
    };

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(date));
    };

    return (
      <Card
        className="group hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-700 hover:border-gray-600"
        style={{ backgroundColor: "#0d1025" }}
        onClick={handleCardClick}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-semibold text-lg">
                  {candidate.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                    {candidate.name}
                  </h3>
                  <Badge className={stageColors[candidate.stage]}>
                    {stageLabels[candidate.stage]}
                  </Badge>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border border-gray-700"
                style={{ backgroundColor: "#0d1025" }}
              >
                {stages.map((stage) => (
                  <DropdownMenuItem
                    key={stage}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStageChange(stage);
                    }}
                    disabled={stage === candidate.stage}
                    className="hover:bg-gray-700 text-gray-300 hover:text-white disabled:text-gray-500"
                  >
                    Move to {stageLabels[stage]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-300 group-hover:text-white transition-colors">
              <div className="p-2 rounded-full bg-blue-600/20 border border-blue-500/30">
                <Mail className="h-4 w-4 text-blue-400" />
              </div>
              <span className="truncate font-medium">{candidate.email}</span>
            </div>
            {candidate.phone && (
              <div className="flex items-center gap-3 text-sm text-gray-300 group-hover:text-white transition-colors">
                <div className="p-2 rounded-full bg-green-600/20 border border-green-500/30">
                  <Phone className="h-4 w-4 text-green-400" />
                </div>
                <span className="font-medium">{candidate.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm text-gray-300 group-hover:text-white transition-colors">
              <div className="p-2 rounded-full bg-purple-600/20 border border-purple-500/30">
                <Calendar className="h-4 w-4 text-purple-400" />
              </div>
              <span className="font-medium">
                Applied {formatDate(candidate.appliedAt)}
              </span>
            </div>
            {candidate.notes.length > 0 && (
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="p-2 rounded-full bg-amber-600/20 border border-amber-500/30">
                  <FileText className="h-4 w-4 text-amber-400" />
                </div>
                <span className="font-medium">
                  {candidate.notes.length} note
                  {candidate.notes.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

CandidateCard.displayName = "CandidateCard";

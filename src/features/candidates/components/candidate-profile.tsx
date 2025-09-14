import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Separator } from "../../../components/ui/separator";
import {
  Mail,
  Phone,
  Calendar,
  FileText,
  User,
  ClipboardList,
  Award,
  X,
} from "lucide-react";
import type { Candidate, TimelineEvent, Note, Mention } from "../../../types";
import { CandidateTimeline } from "./candidate-timeline";
import { CandidateNotes } from "./candidate-notes";

interface CandidateProfileProps {
  candidate: Candidate;
  onClose?: () => void;
}

const stageColors: Record<
  Candidate["stage"],
  { bg: string; text: string; border: string }
> = {
  applied: {
    bg: "bg-blue-50 dark:bg-blue-950/50",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  screen: {
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  tech: {
    bg: "bg-purple-50 dark:bg-purple-950/50",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
  offer: {
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  hired: {
    bg: "bg-green-50 dark:bg-green-950/50",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-800",
  },
  rejected: {
    bg: "bg-red-50 dark:bg-red-950/50",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
  },
};

const stageLabels: Record<Candidate["stage"], string> = {
  applied: "Applied",
  screen: "Screening",
  tech: "Technical Review",
  offer: "Offer Extended",
  hired: "Hired",
  rejected: "Rejected",
};

// Generate mock timeline data
const generateMockTimeline = (candidate: Candidate): TimelineEvent[] => {
  const timeline: TimelineEvent[] = [];

  // Ensure appliedAt is a valid Date
  const appliedDate =
    candidate.appliedAt instanceof Date
      ? candidate.appliedAt
      : new Date(candidate.appliedAt || Date.now());

  // Application received
  timeline.push({
    id: "1",
    candidateId: candidate.id || "unknown",
    type: "application_received",
    description: "Application received",
    timestamp: appliedDate,
    authorName: "System",
  });

  // Add some stage changes based on current stage
  const stages: Candidate["stage"][] = [
    "applied",
    "screen",
    "tech",
    "offer",
    "hired",
  ];
  const currentStageIndex = stages.indexOf(candidate.stage || "applied");

  for (let i = 1; i <= currentStageIndex; i++) {
    timeline.push({
      id: `stage-${i}`,
      candidateId: candidate.id || "unknown",
      type: "stage_change",
      description: `Stage changed to ${stages[i]}`,
      timestamp: new Date(appliedDate.getTime() + i * 2 * 24 * 60 * 60 * 1000), // 2 days apart
      authorName: "HR Team",
      metadata: {
        previousStage: stages[i - 1],
        newStage: stages[i],
      },
    });
  }

  // Add some notes
  if (currentStageIndex > 0) {
    timeline.push({
      id: "note-1",
      candidateId: candidate.id || "unknown",
      type: "note_added",
      description: "Added initial screening notes",
      timestamp: new Date(appliedDate.getTime() + 24 * 60 * 60 * 1000), // 1 day after
      authorName: "Sarah Johnson",
    });
  }

  // Add assessment submission if they're past screening
  if (
    currentStageIndex > 1 &&
    candidate.assessmentResponses &&
    candidate.assessmentResponses.length > 0 &&
    candidate.assessmentResponses[0].submittedAt
  ) {
    const submittedDate =
      candidate.assessmentResponses[0].submittedAt instanceof Date
        ? candidate.assessmentResponses[0].submittedAt
        : new Date(candidate.assessmentResponses[0].submittedAt);

    timeline.push({
      id: "assessment-1",
      candidateId: candidate.id || "unknown",
      type: "assessment_submitted",
      description: "Technical assessment completed",
      timestamp: submittedDate,
      authorName: candidate.name || "Candidate",
    });
  }

  return timeline.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

// Generate mock notes with mentions
const generateMockNotes = (candidate: Candidate): Note[] => {
  const notes: Note[] = [];

  if (candidate.notes && candidate.notes.length > 0) {
    return candidate.notes;
  }

  // Add some sample notes based on stage
  const currentStageIndex = [
    "applied",
    "screen",
    "tech",
    "offer",
    "hired",
  ].indexOf(candidate.stage || "applied");

  if (currentStageIndex > 0) {
    notes.push({
      id: "note-1",
      content: `Initial phone screening completed. Candidate shows strong technical background and good communication skills. @John Smith please review for next steps.`,
      authorId: "sarah-id",
      authorName: "Sarah Johnson",
      createdAt: new Date(candidate.appliedAt.getTime() + 24 * 60 * 60 * 1000),
      mentions: [
        {
          id: "john-id",
          name: "John Smith",
          email: "john@company.com",
          type: "user",
        },
      ],
    });
  }

  if (currentStageIndex > 1) {
    notes.push({
      id: "note-2",
      content: `Technical assessment results look promising. Scored well on algorithms and system design. Ready for technical interview round.`,
      authorId: "mike-id",
      authorName: "Mike Chen",
      createdAt: new Date(
        candidate.appliedAt.getTime() + 3 * 24 * 60 * 60 * 1000
      ),
      mentions: [],
    });
  }

  return notes.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

const CandidateProfile: React.FC<CandidateProfileProps> = ({
  candidate,
  onClose,
}) => {
  const [notes, setNotes] = useState<Note[]>(() =>
    generateMockNotes(candidate)
  );
  const [timeline] = useState<TimelineEvent[]>(() =>
    generateMockTimeline(candidate)
  );

  // Handle case where candidate is undefined or missing required properties
  if (!candidate || !candidate.stage) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <User className="h-5 w-5" />
              No Candidate Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Candidate information is not available or incomplete.
            </p>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const stageStyle = stageColors[candidate.stage] || {
    bg: "bg-gray-50 dark:bg-gray-950/50",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-200 dark:border-gray-800",
  };

  const handleAddNote = (content: string, mentions: Mention[]) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      content,
      authorId: "current-user",
      authorName: "Current User",
      createdAt: new Date(),
      mentions,
    };
    setNotes((prev) => [newNote, ...prev]);
  };

  const handleEditNote = (
    noteId: string,
    content: string,
    mentions: Mention[]
  ) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId ? { ...note, content, mentions } : note
      )
    );
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== noteId));
  };

  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-6 animate-in fade-in-50 duration-500">
      {/* Header Card */}
      <Card className="overflow-hidden border-border/50 shadow-sm">
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <CardHeader className="pb-6">
            <div className="flex items-start justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-foreground font-semibold">
                      {candidate.name || "Unknown Candidate"}
                    </CardTitle>
                    <p className="text-muted-foreground">Candidate Profile</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`${stageStyle.bg} ${stageStyle.text} ${stageStyle.border} font-medium px-3 py-1`}
                >
                  {stageLabels[candidate.stage] || candidate.stage || "Unknown"}
                </Badge>
              </div>
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5 text-primary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">
                      {candidate.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Email Address
                    </p>
                  </div>
                </div>
                {candidate.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">
                        {candidate.phone}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Phone Number
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">
                      {new Date(candidate.appliedAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Application Date
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resume */}
          {candidate.resume && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Resume & Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Resume.pdf</p>
                      <p className="text-sm text-muted-foreground">
                        Click to view document
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={candidate.resume}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      View
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assessment Responses */}
          {candidate.assessmentResponses &&
            candidate.assessmentResponses.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    Assessment Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {candidate.assessmentResponses.map((response, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
                            <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              Assessment #{index + 1}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Completed on{" "}
                              {new Date(
                                response.submittedAt || new Date()
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                        >
                          Completed
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Timeline */}
          <CandidateTimeline timeline={timeline} candidate={candidate} />
        </div>

        {/* Right Column - Notes & Stats */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Application Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Current Stage
                  </span>
                  <Badge
                    variant="outline"
                    className={`${stageStyle.bg} ${stageStyle.text} ${stageStyle.border} text-xs`}
                  >
                    {stageLabels[candidate.stage] ||
                      candidate.stage ||
                      "Unknown"}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Days Since Applied
                  </span>
                  <span className="text-sm font-medium">
                    {Math.floor(
                      (Date.now() - new Date(candidate.appliedAt).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Assessments
                  </span>
                  <span className="text-sm font-medium">
                    {candidate.assessmentResponses?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Notes</span>
                  <span className="text-sm font-medium">{notes.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Timeline Events
                  </span>
                  <span className="text-sm font-medium">{timeline.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <CandidateNotes
            notes={notes}
            onAddNote={handleAddNote}
            onEditNote={handleEditNote}
            onDeleteNote={handleDeleteNote}
          />
        </div>
      </div>
    </div>
  );
};

export default CandidateProfile;

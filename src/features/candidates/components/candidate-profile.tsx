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
import { useAppStore } from "../../../lib/store";

interface CandidateProfileProps {
  candidate: Candidate;
  onClose?: () => void;
}

const stageColors: Record<
  Candidate["stage"],
  { bg: string; text: string; border: string }
> = {
  applied: {
    bg: "bg-blue-600/20",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  screen: {
    bg: "bg-amber-600/20",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
  tech: {
    bg: "bg-purple-600/20",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
  offer: {
    bg: "bg-emerald-600/20",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  hired: {
    bg: "bg-green-600/20",
    text: "text-green-400",
    border: "border-green-500/30",
  },
  rejected: {
    bg: "bg-red-600/20",
    text: "text-red-400",
    border: "border-red-500/30",
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
  const { updateCandidate, candidates } = useAppStore();

  // Get the latest candidate data from the store
  const latestCandidate = candidates.find(c => c.id === candidate.id) || candidate;

  const [notes, setNotes] = useState<Note[]>(() =>
    latestCandidate.notes && latestCandidate.notes.length > 0 ? latestCandidate.notes : generateMockNotes(latestCandidate)
  );
  const [timeline] = useState<TimelineEvent[]>(() =>
    generateMockTimeline(latestCandidate)
  );

  // Sync notes with the latest candidate data from store
  React.useEffect(() => {
    if (latestCandidate.notes && latestCandidate.notes.length > 0) {
      setNotes(latestCandidate.notes);
    }
  }, [latestCandidate.notes]);

  // Handle case where candidate is undefined or missing required properties
  if (!candidate || !candidate.stage) {
    return (
      <div
        className="container mx-auto max-w-4xl p-6"
        style={{ backgroundColor: "#000319", minHeight: "100vh" }}
      >
        <Card
          className="border border-red-500/30"
          style={{ backgroundColor: "#0d1025" }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <User className="h-5 w-5" />
              No Candidate Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 mb-4">
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
    bg: "bg-gray-600/20",
    text: "text-gray-300",
    border: "border-gray-500/30",
  };

  const handleAddNote = async (content: string, mentions: Mention[]) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      content,
      authorId: "current-user",
      authorName: "Current User",
      createdAt: new Date(),
      mentions,
    };

    console.log('Adding note:', newNote);
    console.log('Current notes:', notes);

    // Update local state immediately for optimistic UI
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);

    console.log('Updated notes:', updatedNotes);

    try {
      // Persist to database via store
      console.log('Calling updateCandidate with notes:', updatedNotes);
      await updateCandidate(candidate.id, { notes: updatedNotes });
      console.log('Note saved successfully');
    } catch (error) {
      console.error('Failed to save note:', error);
      // Rollback on error
      setNotes(notes);
    }
  };

  const handleEditNote = async (
    noteId: string,
    content: string,
    mentions: Mention[]
  ) => {
    console.log('Editing note:', noteId, content);
    const updatedNotes = notes.map((note) =>
      note.id === noteId ? { ...note, content, mentions } : note
    );

    // Update local state immediately for optimistic UI
    setNotes(updatedNotes);

    try {
      // Persist to database via store
      console.log('Calling updateCandidate for edit with notes:', updatedNotes);
      await updateCandidate(candidate.id, { notes: updatedNotes });
      console.log('Note updated successfully');
    } catch (error) {
      console.error('Failed to update note:', error);
      // Rollback on error
      setNotes(notes);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    console.log('Deleting note:', noteId);
    const updatedNotes = notes.filter((note) => note.id !== noteId);

    // Update local state immediately for optimistic UI
    setNotes(updatedNotes);

    try {
      // Persist to database via store
      console.log('Calling updateCandidate for delete with notes:', updatedNotes);
      await updateCandidate(candidate.id, { notes: updatedNotes });
      console.log('Note deleted successfully');
    } catch (error) {
      console.error('Failed to delete note:', error);
      // Rollback on error
      setNotes(notes);
    }
  };

  return (
    <div
      className="container mx-auto max-w-7xl p-6 space-y-6 animate-in fade-in-50 duration-500"
      style={{ backgroundColor: "#000319", minHeight: "100vh" }}
    >
      {/* Header Card */}
      <Card
        className="overflow-hidden border border-gray-700 shadow-sm"
        style={{ backgroundColor: "#0d1025" }}
      >
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-gray-700">
          <CardHeader className="pb-6">
            <div className="flex items-start justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/20">
                    <User className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-white font-semibold">
                      {candidate.name || "Unknown Candidate"}
                    </CardTitle>
                    <p className="text-gray-400">Candidate Profile</p>
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
          <Card
            className="shadow-sm border border-gray-700"
            style={{ backgroundColor: "#0d1025" }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <Mail className="h-5 w-5 text-blue-400" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                >
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-white">{candidate.email}</p>
                    <p className="text-sm text-gray-400">Email Address</p>
                  </div>
                </div>
                {candidate.phone && (
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                  >
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-white">
                        {candidate.phone}
                      </p>
                      <p className="text-sm text-gray-400">Phone Number</p>
                    </div>
                  </div>
                )}
                <div
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                >
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-white">
                      {new Date(candidate.appliedAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                    <p className="text-sm text-gray-400">Application Date</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resume */}
          {candidate.resume && (
            <Card
              className="shadow-sm border border-gray-700"
              style={{ backgroundColor: "#0d1025" }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <FileText className="h-5 w-5 text-blue-400" />
                  Resume & Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-700"
                  style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20">
                      <FileText className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Resume.pdf</p>
                      <p className="text-sm text-gray-400">
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
              <Card
                className="shadow-sm border border-gray-700"
                style={{ backgroundColor: "#0d1025" }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-white">
                    <ClipboardList className="h-5 w-5 text-blue-400" />
                    Assessment Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {candidate.assessmentResponses.map((response, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-700"
                        style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/20">
                            <Award className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              Assessment #{index + 1}
                            </p>
                            <p className="text-sm text-gray-400">
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
                          className="bg-emerald-600/20 text-emerald-400 border-emerald-500/30"
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
          <Card
            className="shadow-sm border border-gray-700"
            style={{ backgroundColor: "#0d1025" }}
          >
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Application Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Current Stage</span>
                  <Badge
                    variant="outline"
                    className={`${stageStyle.bg} ${stageStyle.text} ${stageStyle.border} text-xs`}
                  >
                    {stageLabels[candidate.stage] ||
                      candidate.stage ||
                      "Unknown"}
                  </Badge>
                </div>
                <Separator className="bg-gray-700" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    Days Since Applied
                  </span>
                  <span className="text-sm font-medium text-white">
                    {Math.floor(
                      (Date.now() - new Date(candidate.appliedAt).getTime()) /
                      (1000 * 60 * 60 * 24)
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Assessments</span>
                  <span className="text-sm font-medium text-white">
                    {candidate.assessmentResponses?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Notes</span>
                  <span className="text-sm font-medium text-white">
                    {notes.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Timeline Events</span>
                  <span className="text-sm font-medium text-white">
                    {timeline.length}
                  </span>
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

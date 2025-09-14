import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import {
  Clock,
  User,
  FileText,
  MessageSquare,
  Calendar,
  TrendingUp,
} from "lucide-react";
import type { TimelineEvent, Candidate } from "../../../types";

interface CandidateTimelineProps {
  timeline: TimelineEvent[];
  candidate: Candidate;
}

const getTimelineIcon = (type: TimelineEvent["type"]) => {
  switch (type) {
    case "stage_change":
      return <TrendingUp className="h-4 w-4" />;
    case "note_added":
      return <MessageSquare className="h-4 w-4" />;
    case "assessment_submitted":
      return <FileText className="h-4 w-4" />;
    case "interview_scheduled":
      return <Calendar className="h-4 w-4" />;
    case "application_received":
      return <User className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getTimelineColor = (type: TimelineEvent["type"]) => {
  switch (type) {
    case "stage_change":
      return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/50";
    case "note_added":
      return "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/50";
    case "assessment_submitted":
      return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950/50";
    case "interview_scheduled":
      return "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50";
    case "application_received":
      return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-950/50";
    default:
      return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-950/50";
  }
};

const getStageColor = (stage: Candidate["stage"]) => {
  switch (stage) {
    case "applied":
      return "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    case "screen":
      return "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    case "tech":
      return "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800";
    case "offer":
      return "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    case "hired":
      return "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
    case "rejected":
      return "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
    default:
      return "bg-gray-100 dark:bg-gray-950/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800";
  }
};

const formatEventDescription = (event: TimelineEvent) => {
  switch (event.type) {
    case "stage_change": {
      const prevStage = event.metadata?.previousStage;
      const newStage = event.metadata?.newStage;
      if (prevStage && newStage) {
        return `Stage changed from ${prevStage} to ${newStage}`;
      }
      return event.description;
    }
    default:
      return event.description;
  }
};

export const CandidateTimeline: React.FC<CandidateTimelineProps> = ({
  timeline,
}) => {
  const sortedTimeline = [...timeline].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (!timeline || timeline.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No timeline events yet</p>
            <p className="text-sm text-muted-foreground/70">
              Events will appear here as the candidate progresses
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedTimeline.map((event, index) => (
            <div key={event.id} className="relative">
              {/* Timeline line */}
              {index < sortedTimeline.length - 1 && (
                <div className="absolute left-6 top-12 bottom-0 w-px bg-border" />
              )}

              <div className="flex gap-4">
                {/* Timeline icon */}
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-background ${getTimelineColor(
                    event.type
                  )}`}
                >
                  {getTimelineIcon(event.type)}
                </div>

                {/* Timeline content */}
                <div className="flex-1 space-y-2 pb-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {formatEventDescription(event)}
                      </p>
                      {event.authorName && (
                        <p className="text-sm text-muted-foreground">
                          by {event.authorName}
                        </p>
                      )}

                      {/* Stage change badges */}
                      {event.type === "stage_change" &&
                        event.metadata?.previousStage &&
                        event.metadata?.newStage && (
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant="outline"
                              className={getStageColor(
                                event.metadata
                                  .previousStage as Candidate["stage"]
                              )}
                            >
                              {event.metadata.previousStage}
                            </Badge>
                            <span className="text-muted-foreground">→</span>
                            <Badge
                              variant="outline"
                              className={getStageColor(
                                event.metadata.newStage as Candidate["stage"]
                              )}
                            >
                              {event.metadata.newStage}
                            </Badge>
                          </div>
                        )}
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.timestamp).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

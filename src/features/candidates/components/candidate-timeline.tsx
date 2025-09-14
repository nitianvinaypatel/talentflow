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
      return "text-blue-400 bg-blue-600/20";
    case "note_added":
      return "text-purple-400 bg-purple-600/20";
    case "assessment_submitted":
      return "text-green-400 bg-green-600/20";
    case "interview_scheduled":
      return "text-amber-400 bg-amber-600/20";
    case "application_received":
      return "text-gray-400 bg-gray-600/20";
    default:
      return "text-gray-400 bg-gray-600/20";
  }
};

const getStageColor = (stage: Candidate["stage"]) => {
  switch (stage) {
    case "applied":
      return "bg-blue-600/20 text-blue-400 border-blue-500/30";
    case "screen":
      return "bg-amber-600/20 text-amber-400 border-amber-500/30";
    case "tech":
      return "bg-purple-600/20 text-purple-400 border-purple-500/30";
    case "offer":
      return "bg-emerald-600/20 text-emerald-400 border-emerald-500/30";
    case "hired":
      return "bg-green-600/20 text-green-400 border-green-500/30";
    case "rejected":
      return "bg-red-600/20 text-red-400 border-red-500/30";
    default:
      return "bg-gray-600/20 text-gray-400 border-gray-500/30";
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
      <Card
        className="shadow-sm border border-gray-700"
        style={{ backgroundColor: "#0d1025" }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <Clock className="h-5 w-5 text-blue-400" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-300">No timeline events yet</p>
            <p className="text-sm text-gray-400">
              Events will appear here as the candidate progresses
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="shadow-sm border border-gray-700"
      style={{ backgroundColor: "#0d1025" }}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-white">
          <Clock className="h-5 w-5 text-blue-400" />
          Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedTimeline.map((event, index) => (
            <div key={event.id} className="relative">
              {/* Timeline line */}
              {index < sortedTimeline.length - 1 && (
                <div className="absolute left-6 top-12 bottom-0 w-px bg-gray-700" />
              )}

              <div className="flex gap-4">
                {/* Timeline icon */}
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-gray-700 ${getTimelineColor(
                    event.type
                  )}`}
                >
                  {getTimelineIcon(event.type)}
                </div>

                {/* Timeline content */}
                <div className="flex-1 space-y-2 pb-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-white">
                        {formatEventDescription(event)}
                      </p>
                      {event.authorName && (
                        <p className="text-sm text-gray-400">
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
                            <span className="text-gray-400">→</span>
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
                      <p className="text-sm text-gray-400">
                        {new Date(event.timestamp).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-gray-400">
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

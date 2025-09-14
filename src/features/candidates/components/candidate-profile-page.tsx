import React from "react";
import { useParams } from "react-router-dom";
import { useAppStore } from "../../../lib/store";
import CandidateProfile from "./candidate-profile";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { AlertTriangle, UserX } from "lucide-react";

export const CandidateProfilePage: React.FC = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const { candidates } = useAppStore();

  const candidate = candidates.find((c) => c.id === candidateId);

  if (!candidateId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="w-full max-w-md border-destructive/20 bg-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              No candidate ID provided in the URL
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="w-full max-w-md border-muted bg-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
              <UserX className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-foreground">
              Candidate Not Found
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              No candidate found with ID:{" "}
              <span className="font-mono text-foreground">{candidateId}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <CandidateProfile candidate={candidate} />;
};

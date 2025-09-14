import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useAppStore } from "../../../lib/store";
import { AssessmentPreview } from "../components/assessment-preview";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";
import type { Assessment } from "../../../types";

export const AssessmentPreviewPage: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const { assessments, loading } = useAppStore();
  const [assessment, setAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    if (assessmentId && assessments.length > 0) {
      const foundAssessment = assessments.find((a) => a.id === assessmentId);
      setAssessment(foundAssessment || null);
    }
  }, [assessmentId, assessments]);

  const handleBack = () => {
    navigate("/assessments");
  };

  const handleEdit = () => {
    if (assessment) {
      if (assessment.jobId) {
        navigate(`/assessments/builder/${assessment.jobId}/${assessment.id}`);
      } else {
        navigate(`/assessments/builder/standalone/${assessment.id}`);
      }
    }
  };

  if (loading.loadAssessments) {
    return (
      <div
        className="space-y-6 p-6 h-full overflow-hidden"
        style={{ backgroundColor: "#000319" }}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 bg-gray-800" />
            <Skeleton className="h-8 w-64 bg-gray-800" />
          </div>
          <Skeleton className="h-96 w-full bg-gray-800" />
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div
        className="space-y-6 p-6 h-full overflow-hidden"
        style={{ backgroundColor: "#000319" }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Assessments
            </Button>
          </div>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl text-gray-300 mb-4">
                Assessment Not Found
              </h2>
              <p className="text-gray-400 mb-6">
                The assessment you're looking for doesn't exist or has been
                removed.
              </p>
              <Button
                onClick={handleBack}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Return to Assessments
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-6 p-6 h-full overflow-hidden"
      style={{ backgroundColor: "#000319" }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Assessments
            </Button>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Assessment Preview
              </h1>
              <p className="text-gray-400">{assessment.title}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleEdit}
              className="border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Edit Assessment
            </Button>
          </div>
        </div>

        {/* Assessment Preview */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Live Preview</CardTitle>
            <p className="text-gray-400">
              This is how candidates will see your assessment
            </p>
          </CardHeader>
          <CardContent>
            <AssessmentPreview assessment={assessment} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

import React from "react";
import { useParams } from "react-router-dom";
import { AssessmentBuilder } from "../components/assessment-builder";

export const AssessmentBuilderPage: React.FC = () => {
  const { jobId, assessmentId } = useParams<{
    jobId?: string;
    assessmentId?: string;
  }>();

  // Handle standalone assessment routes
  const isStandalone = window.location.pathname.includes("/standalone/");
  const finalAssessmentId = isStandalone ? assessmentId : assessmentId;
  const finalJobId = isStandalone ? undefined : jobId;

  return (
    <div
      className="h-screen flex flex-col"
      style={{ backgroundColor: "#000319" }}
    >
      <AssessmentBuilder jobId={finalJobId} assessmentId={finalAssessmentId} />
    </div>
  );
};

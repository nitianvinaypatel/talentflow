import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "../components/layout";
import { JobsBoard, JobDetails } from "../features/jobs";
import { CandidatesList, CandidateProfilePage } from "../features/candidates";
import {
  AssessmentBuilderPage,
  AssessmentPreviewPage,
  AssessmentsListPage,
} from "../features/assessments";
import { Dashboard, AssessmentFormDemo, NotFound } from "../components/pages";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "jobs",
        element: <JobsBoard />,
      },
      {
        path: "jobs/:jobId",
        element: <JobDetails />,
      },
      {
        path: "candidates",
        element: <CandidatesList />,
      },
      {
        path: "candidates/:candidateId",
        element: <CandidateProfilePage />,
      },
      {
        path: "assessments",
        element: <AssessmentsListPage />,
      },
      {
        path: "assessments/preview/:assessmentId",
        element: <AssessmentPreviewPage />,
      },
      {
        path: "assessments/builder",
        element: <AssessmentBuilderPage />,
      },
      {
        path: "assessments/builder/:jobId",
        element: <AssessmentBuilderPage />,
      },
      {
        path: "assessments/builder/:jobId/:assessmentId",
        element: <AssessmentBuilderPage />,
      },
      {
        path: "assessments/builder/standalone/:assessmentId",
        element: <AssessmentBuilderPage />,
      },
      {
        path: "assessments/demo",
        element: <AssessmentFormDemo />,
      },
    ],
  },
]);

import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import { router } from "./lib/router";
import { startMSW } from "./lib/api/setup";
import { PageErrorBoundary } from "./components/layout/error-boundary";
import { ThemeProvider } from "./hooks/use-theme";
import "./test-seed"; // Initialize test data

// Extend window type for development root storage
declare global {
  interface Window {
    __reactRoot?: Root;
  }
}

export const App = () => (
  <ThemeProvider defaultTheme="dark" storageKey="talentflow-theme">
    <PageErrorBoundary>
      <RouterProvider router={router} />
    </PageErrorBoundary>
  </ThemeProvider>
);

// Get or create root instance to avoid multiple createRoot calls
const container = document.getElementById("root")!;
let root = window.__reactRoot;

if (!root) {
  root = createRoot(container);
  window.__reactRoot = root;
}

const renderApp = () => {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
};

// Start MSW in both development and production
startMSW()
  .then(renderApp)
  .catch((error) => {
    console.error("Failed to start MSW:", error);
    // Render app anyway if MSW fails
    renderApp();
  });

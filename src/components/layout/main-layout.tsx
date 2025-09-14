import * as React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { PageErrorBoundary, FeatureErrorBoundary } from "./error-boundary";
import { LoadingOverlay } from "../ui/loading";
import { SidebarProvider, SidebarInset } from "../ui/sidebar";

export const MainLayout: React.FC = () => {
  const [isLoading] = React.useState(false);

  return (
    <PageErrorBoundary>
      <div className="h-screen flex" style={{ backgroundColor: "#000319" }}>
        <SidebarProvider>
          <FeatureErrorBoundary>
            <Sidebar />
          </FeatureErrorBoundary>

          <SidebarInset
            className="flex flex-col h-full"
            style={{ backgroundColor: "#000319" }}
          >
            {/* Fixed Header */}
            <FeatureErrorBoundary>
              <Header />
            </FeatureErrorBoundary>

            {/* Scrollable Main Content */}
            <div
              className="flex-1 overflow-auto"
              style={{ backgroundColor: "#000319" }}
            >
              <LoadingOverlay isLoading={isLoading}>
                <div className="h-full">
                  <FeatureErrorBoundary>
                    <Outlet />
                  </FeatureErrorBoundary>
                </div>
              </LoadingOverlay>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </PageErrorBoundary>
  );
};

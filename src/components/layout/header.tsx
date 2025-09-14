import * as React from "react";
import { useLocation } from "react-router-dom";
import { SidebarTrigger } from "../ui/sidebar";
import { getPageTitle } from "../../lib/utils/page-titles";

export const Header: React.FC = () => {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <header
      className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-600 px-4"
      style={{ backgroundColor: "#000319" }}
    >
      <SidebarTrigger className="-ml-1" />
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-white">{pageTitle}</h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* User menu placeholder - will be implemented later */}
          <div className="h-8 w-8 bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-gray-300">HR</span>
          </div>
        </div>
      </div>
    </header>
  );
};

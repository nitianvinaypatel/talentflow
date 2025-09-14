import * as React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  ClipboardList,
  Home,
} from "lucide-react";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Jobs",
    href: "/jobs",
    icon: Briefcase,
  },
  {
    name: "Candidates",
    href: "/candidates",
    icon: Users,
  },
  {
    name: "Assessments",
    href: "/assessments",
    icon: ClipboardList,
  },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <ShadcnSidebar
      variant="inset"
      className="border-r border-gray-600"
      style={{ backgroundColor: "#000319" }}
    >
      <SidebarHeader
        className="border-b border-gray-600 px-6 py-4"
        style={{ backgroundColor: "#000319" }}
      >
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Home className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold tracking-tight text-white">
              TalentFlow
            </h2>
            <p className="text-xs text-gray-300">HR Management Suite</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent
        className="px-4 py-4"
        style={{ backgroundColor: "#000319" }}
      >
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="group relative"
                    >
                      <NavLink
                        to={item.href}
                        className="flex items-center gap-3"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1">{item.name}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <div
        className="border-t border-gray-600 px-6 py-4 mt-auto"
        style={{ backgroundColor: "#000319" }}
      >
        <div className="text-xs text-gray-300">
          <p className="font-medium text-white">TalentFlow v1.0.0</p>
          <p className="mt-1">© 2025 HR Solutions</p>
        </div>
      </div>
    </ShadcnSidebar>
  );
};

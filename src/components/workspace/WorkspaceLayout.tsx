import { type ReactNode } from "react";

import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { RepositoryRefreshProvider } from "@/context/repository-refresh-context";

type WorkspaceLayoutProps = {
  children: ReactNode;
};

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  return (
    <RepositoryRefreshProvider>
      <div className="flex min-h-screen bg-[#111111] text-[#f2f0eb]">
        <AppSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader />

          <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        </div>
      </div>
    </RepositoryRefreshProvider>
  );
}

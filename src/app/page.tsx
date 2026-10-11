import { RepositoryEmptyState } from "@/components/repository/RepositoryEmptyState";
import { ProjectSummary } from "@/components/project-info/ProjectSummary";

export default function Home() {
  return (
    <>
      <RepositoryEmptyState />
      <ProjectSummary />
    </>
  );
}

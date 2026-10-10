import { RepositoryChat } from "@/components/repository/RepositoryChat";

export default async function RepositoryPage(props: {
  params: Promise<{ repositoryId: string }>;
}) {
  const { repositoryId } = await props.params;

  return <RepositoryChat repositoryId={repositoryId} />;
}

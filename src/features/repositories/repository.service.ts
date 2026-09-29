import { eq } from "drizzle-orm";
import { db } from "@/db";
import { repositories } from "@/db/schema/repositories";
import { repositoryChunks } from "@/db/schema/repository-chunks";
import type { GitHubRepository } from "./github.repository";
import type { RepositoryChunk } from "./repository.chunk";

export async function findRepositoryByFullName(fullName: string) {
  const [repository] = await db
    .select()
    .from(repositories)
    .where(eq(repositories.fullName, fullName))
    .limit(1);

  return repository ?? null;
}

export async function saveRepositoryWithChunks(
  repository: GitHubRepository,
  chunks: RepositoryChunk[],
) {
  return db.transaction(async (tx) => {
    const [createdRepository] = await tx
      .insert(repositories)
      .values(repository)
      .returning();

    if (chunks.length > 0) {
      await tx.insert(repositoryChunks).values(
        chunks.map((chunk) => ({
          repositoryId: createdRepository.id,
          path: chunk.path,
          content: chunk.content,
        })),
      );
    }

    return createdRepository;
  });
}

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

export async function findRepositoryById(repositoryId: string) {
  const [repository] = await db
    .select()
    .from(repositories)
    .where(eq(repositories.id, repositoryId))
    .limit(1);

  return repository ?? null;
}

export async function findRepositoryChunks(repositoryId: string) {
  const chunks = await db
    .select()
    .from(repositoryChunks)
    .where(eq(repositoryChunks.repositoryId, repositoryId));

  return chunks;
}

export async function saveRepository(repository: GitHubRepository) {
  const [createdRepository] = await db
    .insert(repositories)
    .values(repository)
    .returning();

  return createdRepository;
}

export async function storeRepositoryChunkEmbeddings(
  repositoryId: string,
  chunks: RepositoryChunk[],
  embeddings: number[][],
) {
  return db.transaction(async (tx) => {
    const newChunks = [];
    const existingChunks = [];

    for (let index = 0; index < chunks.length; index++) {
      const chunk = chunks[index];
      const embedding = embeddings[index];

      if (chunk.id) {
        existingChunks.push({
          id: chunk.id,
          embedding,
        });
      } else {
        newChunks.push({
          repositoryId,
          path: chunk.path,
          content: chunk.content,
          embedding,
        });
      }
    }

    if (newChunks.length > 0) {
      await tx.insert(repositoryChunks).values(newChunks);
    }

    for (const chunk of existingChunks) {
      await tx
        .update(repositoryChunks)
        .set({
          embedding: chunk.embedding,
        })
        .where(eq(repositoryChunks.id, chunk.id));
    }
  });
}

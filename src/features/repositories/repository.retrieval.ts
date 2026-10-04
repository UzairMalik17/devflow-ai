import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { repositoryChunks } from "@/db/schema/repository-chunks";
import { EMBEDDING_DIMENSIONS } from "../embedding/embedding.config";

export async function findSimilarRepositoryChunks(
  repositoryId: string,
  queryEmbedding: number[],
  limit: number,
) {
  if (queryEmbedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Invalid query embedding dimensions. Expected ${EMBEDDING_DIMENSIONS}.`,
    );
  }

  const queryVector = `[${queryEmbedding.join(",")}]`;

  const distance = sql<number>`
    ${repositoryChunks.embedding} <=> ${queryVector}::vector
  `;

  const chunks = await db
    .select({
      id: repositoryChunks.id,
      path: repositoryChunks.path,
      content: repositoryChunks.content,
      distance,
    })
    .from(repositoryChunks)
    .where(eq(repositoryChunks.repositoryId, repositoryId))
    .orderBy(distance)
    .limit(limit);

  return chunks;
}

import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { repositoryChunks } from "@/db/schema/repository-chunks";
import { EMBEDDING_DIMENSIONS } from "../embedding/embedding.config";
import type { RepositoryChunk } from "./repository.service";

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

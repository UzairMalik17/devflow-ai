import { eq, sql, and, isNull, asc } from "drizzle-orm";

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

export async function storeRepositoryChunks(
  repositoryId: string,
  chunks: RepositoryChunk[],
) {
  if (chunks.length === 0) {
    return;
  }

  const newChunks = chunks.map((chunk) => ({
    repositoryId,
    path: chunk.path,
    content: chunk.content,
  }));

  await db.insert(repositoryChunks).values(newChunks);
}

export async function findRepositoryChunksWithoutEmbeddings(
  repositoryId: string,
  limit: number,
) {
  const chunks = await db
    .select()
    .from(repositoryChunks)
    .where(
      and(
        eq(repositoryChunks.repositoryId, repositoryId),
        isNull(repositoryChunks.embedding),
      ),
    )
    .orderBy(asc(repositoryChunks.id))
    .limit(limit);

  return chunks;
}

export async function storeRepositoryChunkEmbeddings(
  chunks: RepositoryChunk[],
  embeddings: number[][],
) {
  if (chunks.length !== embeddings.length) {
    throw new Error("Chunks and embeddings count do not match");
  }

  if (chunks.length === 0) {
    return;
  }

  const values = chunks.map((chunk, index) => {
    if (!chunk.id) {
      throw new Error("Cannot store embedding for a chunk without an ID");
    }

    return sql`(
      ${chunk.id},
      ${JSON.stringify(embeddings[index])}::vector
    )`;
  });

  await db.execute(sql`
    UPDATE ${repositoryChunks} AS target
    SET embedding = source.embedding
    FROM (
      VALUES ${sql.join(values, sql`, `)}
    ) AS source(id, embedding)
    WHERE target.id = source.id
  `);
}

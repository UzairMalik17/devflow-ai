import { RepositoryChunk } from "../repositories/repository.chunk";
import {
  EMBEDDING_BATCH_SIZE,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
} from "./embedding.config";

type BatchEmbeddingResponse = {
  embeddings?: Array<{
    values?: number[];
  }>;
};

export async function generateDocumentEmbeddings(
  chunks: RepositoryChunk[],
): Promise<number[][]> {
  if (chunks.length === 0) {
    return [];
  }

  if (chunks.length > EMBEDDING_BATCH_SIZE) {
    throw new Error(
      `Embedding batch cannot contain more than ${EMBEDDING_BATCH_SIZE} chunks.`,
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        requests: chunks.map((chunk) => ({
          model: `models/${EMBEDDING_MODEL}`,
          content: {
            parts: [
              {
                text: `title: ${chunk.path} | text: ${chunk.content}`,
              },
            ],
          },
          embedContentConfig: {
            outputDimensionality: EMBEDDING_DIMENSIONS,
          },
        })),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Gemini embedding request failed with status ${response.status}.`,
    );
  }

  const data = (await response.json()) as BatchEmbeddingResponse;

  const embeddings = data.embeddings?.map((embedding) => embedding.values);

  if (
    !embeddings ||
    embeddings.length !== chunks.length ||
    embeddings.some((embedding) => !embedding)
  ) {
    throw new Error("Gemini returned an invalid embedding response.");
  }

  return embeddings as number[][];
}

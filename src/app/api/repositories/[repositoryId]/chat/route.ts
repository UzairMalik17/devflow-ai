import { NextRequest } from "next/server";

import { repositoryChatInputSchema } from "@/features/repositories/repository.schema";
import { findRepositoryById } from "@/features/repositories/repository.service";
import { generateQueryEmbedding } from "@/features/embedding/embedding.service";
import { findSimilarRepositoryChunks } from "@/features/repositories/repository.retrieval";
import { generateRepositoryAnswer } from "@/features/llm/llm.service";

type RouteContext = {
  params: Promise<{
    repositoryId: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { repositoryId } = await context.params;

  if (!repositoryId) {
    return Response.json(
      {
        message: "Invalid repository ID.",
      },
      { status: 400 },
    );
  }

  const body = await request.json();

  const result = repositoryChatInputSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      {
        message: "Invalid chat input.",
      },
      { status: 400 },
    );
  }

  const repository = await findRepositoryById(repositoryId);

  if (!repository) {
    return Response.json(
      {
        message: "Repository not found.",
      },
      { status: 404 },
    );
  }

  const embedding = await generateQueryEmbedding(result.data.query);

  console.log({
    dimensions: embedding.length,
    firstValues: embedding.slice(0, 5),
  });

  const chunks = await findSimilarRepositoryChunks(repositoryId, embedding, 5);

  const repositoryAnswer = await generateRepositoryAnswer(
    result.data.query,
    chunks,
  );

  return Response.json({
    message: "Chat request received.",
    repository: {
      id: repository.id,
      fullName: repository.fullName,
    },
    query: result.data.query,
    chunks: chunks.map((chunk) => ({
      id: chunk.id,
      path: chunk.path,
      content: chunk.content,
      distance: chunk.distance,
    })),
    answer: repositoryAnswer.answer,
    sources: repositoryAnswer.sources,
  });
}

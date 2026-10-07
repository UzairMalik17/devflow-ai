import { NextRequest } from "next/server";
import { z } from "zod";
import { findRepositoryById } from "@/features/repositories/repository.service";
import { generateQueryEmbedding } from "@/features/embedding/embedding.service";
import { findSimilarRepositoryChunks } from "@/features/repositories/repository.repository";
import { generateRepositoryAnswer } from "@/features/llm/llm.service";

const repositoryChatInputSchema = z.object({
  query: z.string().trim().min(1, {
    error: "Query is required.",
  }),
});

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

  const chunks = await findSimilarRepositoryChunks(repositoryId, embedding, 5);

  const repositoryAnswer = await generateRepositoryAnswer(
    result.data.query,
    chunks,
  );

  return Response.json({
    repository: {
      id: repository.id,
      fullName: repository.fullName,
    },
    query: result.data.query,
    answer: repositoryAnswer.answer,
    sources: repositoryAnswer.sources,
  });
}

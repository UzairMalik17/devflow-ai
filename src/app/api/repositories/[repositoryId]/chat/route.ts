import { NextRequest } from "next/server";
import { z } from "zod";
import {
  chatWithRepository,
  findRepositoryById,
  RepositoryNotFoundError,
} from "@/features/repositories/repository.service";
import { IngestionStatus } from "@/constants/enums";

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

  try {
    const repository = await findRepositoryById(repositoryId);

    if (!repository) {
      throw new RepositoryNotFoundError("Repository not found.");
    }

    if (repository.ingestionStatus !== IngestionStatus.COMPLETED) {
      return Response.json(
        {
          message: "Repository ingestion is not completed yet.",
        },
        { status: 409 },
      );
    }
    const response = await chatWithRepository(repository, result.data.query);

    return Response.json(response);
  } catch (error) {
    if (error instanceof RepositoryNotFoundError) {
      return Response.json({ message: error.message }, { status: 404 });
    }

    console.error("Failed to chat with repository:", error);

    return Response.json(
      { message: "Unable to answer your question." },
      { status: 500 },
    );
  }
}

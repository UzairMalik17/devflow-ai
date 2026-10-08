import { NextRequest } from "next/server";
import { z } from "zod";
import {
  chatWithRepository,
  RepositoryNotFoundError,
} from "@/features/repositories/repository.service";

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
    const response = await chatWithRepository(repositoryId, result.data.query);

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

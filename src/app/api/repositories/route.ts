import {
  InvalidRepositoryUrlError,
  RepositoryLimitError,
  RepositoryNotFoundError,
  allRepositories,
} from "@/features/repositories/repository.service";
import { analyzeRepository } from "@/features/repositories/repository.service";
import { z } from "zod";

const repositoryInputSchema = z.object({
  repositoryUrl: z.url(),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        message: "Invalid request body.",
      },
      { status: 400 },
    );
  }

  const result = repositoryInputSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      {
        message: "Invalid repository input.",
      },
      { status: 400 },
    );
  }

  try {
    const repository = await analyzeRepository(result.data.repositoryUrl);

    return Response.json(repository, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidRepositoryUrlError) {
      return Response.json(
        {
          message: error.message,
        },
        { status: 400 },
      );
    }

    if (error instanceof RepositoryLimitError) {
      return Response.json(
        {
          message: error.message,
        },
        { status: 429 },
      );
    }

    if (error instanceof RepositoryNotFoundError) {
      return Response.json(
        {
          message: error.message,
        },
        { status: 404 },
      );
    }

    console.error("Failed to analyze repository:", error);

    return Response.json(
      {
        message: "Unable to analyze repository.",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const repositories = await allRepositories();

    return Response.json({ repositories }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch repositories:", error);

    return Response.json(
      {
        message: "Failed to fetch repositories",
      },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { repositoryInputSchema } from "@/features/repositories/repository.schema";
import {
  InvalidRepositoryUrlError,
  parseRepositoryUrl,
} from "@/features/repositories/repository.utils";
import {
  getGitHubRepository,
  GitHubRepositoryError,
} from "@/features/repositories/github.repository";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        message: "Invalid request body.",
      },
      { status: 400 },
    );
  }
  const result = repositoryInputSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        message: "Invalid repository input.",
      },
      { status: 400 },
    );
  }

  try {
    const repositoryReference = parseRepositoryUrl(result.data.repositoryUrl);

    const repository = await getGitHubRepository(
      repositoryReference.owner,
      repositoryReference.name,
    );

    return NextResponse.json({
      message: "Repository verified successfully.",
      repository,
    });
  } catch (error) {
    if (error instanceof GitHubRepositoryError) {
      if (error.status === 404) {
        return NextResponse.json(
          {
            message: "Repository not found or inaccessible.",
          },
          { status: 404 },
        );
      }

      if (error.status === 403) {
        return NextResponse.json(
          {
            message: "GitHub rejected the repository request.",
          },
          { status: 502 },
        );
      }

      if (error.status >= 500) {
        return NextResponse.json(
          {
            message: "GitHub is currently unavailable.",
          },
          { status: 502 },
        );
      }

      return NextResponse.json(
        {
          message: "Unable to verify the repository.",
        },
        { status: 502 },
      );
    }
    if (error instanceof InvalidRepositoryUrlError) {
      return NextResponse.json(
        {
          message: error.message,
        },
        { status: 400 },
      );
    }

    console.error("Failed to process repository:", error);

    return NextResponse.json(
      {
        message: "Unable to process repository.",
      },
      { status: 500 },
    );
  }
}

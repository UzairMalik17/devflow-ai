import { NextResponse } from "next/server";
import { repositoryInputSchema } from "@/features/repositories/repository.schema";
import {
  InvalidRepositoryUrlError,
  parseRepositoryUrl,
} from "@/features/repositories/repository.utils";
import {
  downloadGitHubRepositoryArchive,
  getGitHubRepository,
  GitHubRepositoryError,
} from "@/features/repositories/github.repository";
import { readRepositoryArchive } from "@/features/repositories/repository.archive";
import { chunkRepositoryFile } from "@/features/repositories/repository.chunk";
import { findRepositoryByFullName } from "@/features/repositories/repository.service";
import { saveRepositoryWithChunks } from "@/features/repositories/repository.service";

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

    const existingRepository = await findRepositoryByFullName(
      repository.fullName,
    );

    if (existingRepository) {
      return NextResponse.json({
        message: "Repository already exists.",
        repository: {
          owner: existingRepository.owner,
          name: existingRepository.name,
        },
      });
    }

    const archive = await downloadGitHubRepositoryArchive(
      repository.owner,
      repository.name,
      repository.defaultBranch,
    );

    const files = await readRepositoryArchive(archive);
    const chunks = files.flatMap((file) => chunkRepositoryFile(file));

    const createdRepository = await saveRepositoryWithChunks(
      repository,
      chunks,
    );

    return NextResponse.json({
      message: "Repository ingested successfully.",
      repository: {
        owner: createdRepository.owner,
        name: createdRepository.name,
      },
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

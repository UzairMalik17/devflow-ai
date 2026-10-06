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
import {
  canIngestRepositoryToday,
  findRepositoryByFullName,
  findRepositoryChunks,
  saveRepository,
  storeRepositoryChunkEmbeddings,
} from "@/features/repositories/repository.service";
import { generateDocumentEmbeddings } from "@/features/embedding/embedding.service";
import { EMBEDDING_BATCH_SIZE } from "@/features/embedding/embedding.config";

function wait(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

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
  const canIngest = await canIngestRepositoryToday();

  if (!canIngest) {
    return Response.json(
      {
        message:
          "Daily repository ingestion limit reached. Please try again tomorrow.",
      },
      { status: 429 },
    );
  }

  try {
    const repositoryReference = parseRepositoryUrl(result.data.repositoryUrl);

    const githubRepository = await getGitHubRepository(
      repositoryReference.owner,
      repositoryReference.name,
    );

    const existingRepository = await findRepositoryByFullName(
      githubRepository.fullName,
    );

    let repository;
    let chunks;

    if (existingRepository) {
      chunks = await findRepositoryChunks(existingRepository.id);
      repository = existingRepository;
    } else {
      const archive = await downloadGitHubRepositoryArchive(
        githubRepository.owner,
        githubRepository.name,
        githubRepository.defaultBranch,
      );

      const files = await readRepositoryArchive(archive);

      chunks = files.flatMap((file) => chunkRepositoryFile(file));

      repository = await saveRepository(githubRepository);
    }

    for (let start = 0; start < chunks.length; start += EMBEDDING_BATCH_SIZE) {
      const batch = chunks.slice(start, start + EMBEDDING_BATCH_SIZE);

      const embeddings = await generateDocumentEmbeddings(batch);

      await storeRepositoryChunkEmbeddings(repository.id, batch, embeddings);
      await wait(60_000);
    }

    return NextResponse.json({
      message: "Repository ingested successfully.",
      repository: {
        owner: repository.owner,
        name: repository.name,
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

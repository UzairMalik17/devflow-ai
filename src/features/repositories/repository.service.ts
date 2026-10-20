import { eq, and, gte, lt, desc } from "drizzle-orm";
import { db } from "@/db";
import { repositories } from "@/db/schema/repositories";
import { repositoryChunks } from "@/db/schema/repository-chunks";
import {
  getGitHubRepository,
  GitHubRepositoryError,
  type GitHubRepository,
} from "./github.repository";
import { type RepositoryFile } from "./repository.archive";
import { generateQueryEmbedding } from "../embedding/embedding.service";
import { CHUNK_OVERLAP, CHUNK_SIZE } from "./repository.config";
import { findSimilarRepositoryChunks } from "./repository.repository";
import { generateRepositoryAnswer } from "../llm/llm.service";
import { chunkingQueue } from "@/lib/queue/chunking-queue";

export type RepositoryChunk = {
  id?: string;
  path: string;
  content: string;
};

export class RepositoryLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepositoryLimitError";
  }
}

export class InvalidRepositoryUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidRepositoryUrlError";
  }
}
export class RepositoryNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepositoryNotFoundError";
  }
}

export async function analyzeRepository(repositoryUrl: string) {
  try {
    const repositoryReference = parseRepositoryUrl(repositoryUrl);

    const githubRepository = await getGitHubRepository(
      repositoryReference.owner,
      repositoryReference.name,
    );

    const existingRepository = await findRepositoryByFullName(
      githubRepository.fullName,
    );

    let repository;

    if (existingRepository) {
      repository = existingRepository;
    } else {
      const canIngest = await canIngestRepositoryToday();

      if (!canIngest) {
        throw new RepositoryLimitError(
          "Daily repository ingestion limit reached. Please try again tomorrow.",
        );
      }

      repository = await saveRepository(githubRepository);

      await chunkingQueue.add("chunk-repository", repository);
    }

    return {
      message: "Repository ingested successfully.",
      repository: {
        owner: repository.owner,
        name: repository.name,
        id: repository.id,
      },
    };
  } catch (error) {
    if (error instanceof GitHubRepositoryError) {
      if (error.status === 404) {
        throw new RepositoryNotFoundError(
          "Repository not found or inaccessible.",
        );
      }

      throw new Error("Unable to access the repository.");
    }

    if (
      error instanceof InvalidRepositoryUrlError ||
      error instanceof RepositoryLimitError
    ) {
      throw error;
    }

    console.error("Failed to process repository:", error);

    throw new Error("Unable to process repository.");
  }
}

export async function findRepositoryByFullName(fullName: string) {
  const [repository] = await db
    .select()
    .from(repositories)
    .where(eq(repositories.fullName, fullName))
    .limit(1);

  return repository ?? null;
}

export async function findRepositoryById(repositoryId: string) {
  const [repository] = await db
    .select()
    .from(repositories)
    .where(eq(repositories.id, repositoryId))
    .limit(1);

  return repository ?? null;
}

export async function findRepositoryChunks(repositoryId: string) {
  const chunks = await db
    .select()
    .from(repositoryChunks)
    .where(eq(repositoryChunks.repositoryId, repositoryId));

  return chunks;
}

export async function saveRepository(repository: GitHubRepository) {
  const [createdRepository] = await db
    .insert(repositories)
    .values(repository)
    .returning();

  return createdRepository;
}

async function canIngestRepositoryToday() {
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setUTCHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1);

  const repositoriesCreatedToday = await db
    .select({ id: repositories.id })
    .from(repositories)
    .where(
      and(
        gte(repositories.createdAt, startOfToday),
        lt(repositories.createdAt, startOfTomorrow),
      ),
    )
    .limit(1);

  return repositoriesCreatedToday.length === 0;
}

export function chunkRepositoryFile(file: RepositoryFile): RepositoryChunk[] {
  const chunks: RepositoryChunk[] = [];

  let start = 0;

  while (start < file.content.length) {
    const end = Math.min(start + CHUNK_SIZE, file.content.length);

    chunks.push({
      path: file.path,
      content: file.content.slice(start, end),
    });

    if (end === file.content.length) {
      break;
    }

    start = end - CHUNK_OVERLAP;
  }

  return chunks;
}

function parseRepositoryUrl(repositoryUrl: string) {
  const url = new URL(repositoryUrl);

  if (url.hostname !== "github.com") {
    throw new InvalidRepositoryUrlError("Repository must be hosted on GitHub.");
  }

  const pathname = url.pathname.replace(/\/$/, "");

  if (pathname.includes("//")) {
    throw new InvalidRepositoryUrlError("Invalid GitHub repository URL.");
  }

  const segments = pathname.split("/").filter(Boolean);

  if (segments.length < 2) {
    throw new InvalidRepositoryUrlError("Invalid GitHub repository URL.");
  }

  const [owner, rawName] = segments;

  const name = rawName.endsWith(".git") ? rawName.slice(0, -4) : rawName;

  if (!owner || !name) {
    throw new InvalidRepositoryUrlError("Invalid GitHub repository URL.");
  }

  return {
    owner,
    name,
  };
}

export async function chatWithRepository(repositoryId: string, query: string) {
  const repository = await findRepositoryById(repositoryId);

  if (!repository) {
    throw new RepositoryNotFoundError("Repository not found.");
  }

  const embedding = await generateQueryEmbedding(query);

  const chunks = await findSimilarRepositoryChunks(repositoryId, embedding, 5);

  const repositoryAnswer = await generateRepositoryAnswer(query, chunks);

  return {
    repository: {
      id: repository.id,
      fullName: repository.fullName,
    },
    query,
    answer: repositoryAnswer.answer,
    sources: repositoryAnswer.sources,
  };
}

export async function allRepositories() {
  return await db
    .select()
    .from(repositories)
    .orderBy(desc(repositories.createdAt));
}

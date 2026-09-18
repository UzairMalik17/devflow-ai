import type { RepositoryFile } from "./repository.archive";

export type RepositoryChunk = {
  path: string;
  content: string;
};

const CHUNK_SIZE = 4_000;
const CHUNK_OVERLAP = 400;

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

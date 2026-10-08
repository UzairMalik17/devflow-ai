import yauzl from "yauzl";
import {
  BINARY_EXTENSIONS,
  SENSITIVE_FILE_NAMES,
  EXCLUDED_DIRECTORIES,
} from "./repository.config";

export type RepositoryFile = {
  path: string;
  content: string;
};

export function readRepositoryArchive(
  archive: ArrayBuffer,
): Promise<RepositoryFile[]> {
  return new Promise((resolve, reject) => {
    const buffer = Buffer.from(archive);

    yauzl.fromBuffer(buffer, { lazyEntries: true }, (error, zipFile) => {
      if (error || !zipFile) {
        reject(error ?? new Error("Unable to read repository archive."));
        return;
      }

      const files: RepositoryFile[] = [];

      zipFile.readEntry();

      zipFile.on("entry", async (entry) => {
        if (entry.fileName.endsWith("/")) {
          zipFile.readEntry();
          return;
        }

        try {
          const path = entry.fileName.split("/").slice(1).join("/");
          if (!isRepositoryFileAllowed(path)) {
            zipFile.readEntry();
            return;
          }

          const content = await readZipEntry(zipFile, entry);

          if (content === null) {
            zipFile.readEntry();
            return;
          }

          files.push({
            path,
            content,
          });

          zipFile.readEntry();
        } catch (error) {
          zipFile.close();
          reject(error);
        }
      });

      zipFile.on("end", () => {
        resolve(files);
      });

      zipFile.on("error", reject);
    });
  });
}

function readZipEntry(
  zipFile: yauzl.ZipFile,
  entry: yauzl.Entry,
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    zipFile.openReadStream(entry, (error, readStream) => {
      if (error || !readStream) {
        reject(error ?? new Error("Unable to read ZIP entry."));
        return;
      }

      const chunks: Buffer[] = [];

      readStream.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      readStream.on("end", () => {
        const buffer = Buffer.concat(chunks);

        if (!isTextBuffer(buffer)) {
          resolve(null);
          return;
        }

        resolve(buffer.toString("utf-8"));
      });

      readStream.on("error", reject);
    });
  });
}

function isTextBuffer(buffer: Buffer): boolean {
  return !buffer.includes(0);
}

function isRepositoryFileAllowed(path: string): boolean {
  const pathSegments = path.split("/");
  const fileName = pathSegments.at(-1)?.toLowerCase();

  if (!fileName) {
    return false;
  }

  const hasExcludedDirectory = pathSegments
    .slice(0, -1)
    .some((segment) => EXCLUDED_DIRECTORIES.includes(segment.toLowerCase()));

  if (hasExcludedDirectory) {
    return false;
  }

  if (SENSITIVE_FILE_NAMES.includes(fileName)) {
    return false;
  }

  const hasBinaryExtension = BINARY_EXTENSIONS.some((extension) =>
    fileName.endsWith(extension),
  );

  if (hasBinaryExtension) {
    return false;
  }

  return true;
}

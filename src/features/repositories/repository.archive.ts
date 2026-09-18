import yauzl from "yauzl";
import { isRepositoryFileAllowed } from "@/features/repositories/repository.filter";

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
          console.log({
            path,
            allowed: isRepositoryFileAllowed(path),
          });
          if (!isRepositoryFileAllowed(path)) {
            zipFile.readEntry();
            return;
          }

          const content = await readZipEntry(zipFile, entry);

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
): Promise<string> {
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
        resolve(Buffer.concat(chunks).toString("utf-8"));
      });

      readStream.on("error", reject);
    });
  });
}

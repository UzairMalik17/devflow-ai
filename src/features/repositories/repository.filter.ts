const EXCLUDED_DIRECTORIES = [
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  "coverage",
];

const SENSITIVE_FILE_NAMES = [
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  ".env.test",
];

const BINARY_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".svg",
  ".mp3",
  ".mp4",
  ".wav",
  ".zip",
  ".tar",
  ".gz",
  ".pdf",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
];

export function isRepositoryFileAllowed(path: string): boolean {
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

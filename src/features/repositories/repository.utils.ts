type RepositoryReference = {
  owner: string;
  name: string;
};

export class InvalidRepositoryUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidRepositoryUrlError";
  }
}

export function parseRepositoryUrl(repositoryUrl: string): RepositoryReference {
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

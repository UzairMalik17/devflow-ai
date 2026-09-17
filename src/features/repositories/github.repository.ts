import { z } from "zod";
export type GitHubRepository = {
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  htmlUrl: string;
};

export class GitHubRepositoryError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "GitHubRepositoryError";
  }
}

const githubRepositoryResponseSchema = z.object({
  name: z.string(),
  full_name: z.string(),
  html_url: z.url(),
  default_branch: z.string(),
  owner: z.object({
    login: z.string(),
  }),
});

export async function getGitHubRepository(
  owner: string,
  name: string,
): Promise<GitHubRepository> {
  let response: Response;

  try {
    response = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
        },
        cache: "no-store",
      },
    );
  } catch {
    throw new GitHubRepositoryError("Unable to reach GitHub.", 503);
  }

  if (!response.ok) {
    throw new GitHubRepositoryError(
      "GitHub repository request failed.",
      response.status,
    );
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new GitHubRepositoryError(
      "GitHub returned an invalid response.",
      502,
    );
  }

  const result = githubRepositoryResponseSchema.safeParse(data);

  if (!result.success) {
    throw new GitHubRepositoryError(
      "GitHub returned an unexpected repository response.",
      502,
    );
  }

  return {
    owner: result.data.owner.login,
    name: result.data.name,
    fullName: result.data.full_name,
    defaultBranch: result.data.default_branch,
    htmlUrl: result.data.html_url,
  };
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Repository = {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
};

export function AppSidebar() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRepositories() {
      try {
        const response = await fetch("/api/repositories");

        if (!response.ok) {
          throw new Error("Failed to fetch repositories.");
        }

        const data: { repositories: Repository[] } = await response.json();

        setRepositories(data.repositories);
      } catch {
        setError("Could not load repositories.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchRepositories();
  }, []);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#171717] p-4 md:flex">
      <Link href="/" className="mb-8 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-[#f2f0eb] font-semibold text-[#171717]">
          D
        </span>

        <span className="text-lg font-semibold tracking-tight">DevFlow AI</span>
      </Link>

      <Link
        href="/#analyze-repository"
        className="flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2.5 text-sm transition-colors hover:bg-white/5"
      >
        <span aria-hidden="true" className="text-lg">
          +
        </span>
        New analysis
      </Link>

      <div className="mt-8">
        <h2 className="px-2 text-xs font-medium tracking-wider text-[#a3a3a3]">
          REPOSITORIES
        </h2>

        <div className="mt-4 space-y-1">
          {isLoading ? (
            <p className="px-2 text-sm text-[#a3a3a3]">
              Loading repositories...
            </p>
          ) : error ? (
            <p className="px-2 text-sm text-red-400">{error}</p>
          ) : repositories.length === 0 ? (
            <p className="px-2 text-sm leading-6 text-[#a3a3a3]">
              Your analyzed repositories will appear here.
            </p>
          ) : (
            repositories.map((repository) => {
              const isSelected = selectedRepositoryId === repository.id;

              return (
                <button
                  key={repository.id}
                  type="button"
                  onClick={() => setSelectedRepositoryId(repository.id)}
                  aria-pressed={isSelected}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:cursor-pointer ${
                    isSelected
                      ? "bg-white/10 text-white"
                      : "text-[#a3a3a3] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="block truncate font-medium">
                    {repository.name}
                  </span>

                  <span className="mt-1 block truncate text-xs opacity-70">
                    {repository.owner}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-auto border-t border-white/10 pt-4">
        <p className="text-sm font-medium">About this project</p>

        <p className="mt-2 text-xs leading-5 text-[#a3a3a3]">
          An evolving AI engineering project. Demo limits apply.
        </p>

        <Link
          href="/docs"
          className="mt-3 inline-flex text-sm text-[#d4d4d4] underline decoration-white/30 underline-offset-4 transition-colors hover:text-white"
        >
          Read documentation
        </Link>
      </div>
    </aside>
  );
}

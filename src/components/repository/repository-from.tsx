"use client";

import { useState } from "react";

type SubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function RepositoryForm() {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    status: "idle",
  });

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmissionState({ status: "submitting" });

    try {
      const response = await fetch("/api/repositories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repositoryUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Something went wrong");
      }

      setSubmissionState({
        status: "success",
        message: data.message,
      });
    } catch (error) {
      setSubmissionState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Something went wrong",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4">
      <div>
        <label
          htmlFor="repository-url"
          className="mb-2 block text-sm font-medium"
        >
          GitHub repository URL
        </label>

        <input
          id="repository-url"
          name="repositoryUrl"
          type="url"
          value={repositoryUrl}
          onChange={(event) => setRepositoryUrl(event.target.value)}
          placeholder="https://github.com/owner/repository"
          required
          className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
        />
      </div>

      <button
        type="submit"
        disabled={submissionState.status === "submitting"}
        className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submissionState.status === "submitting"
          ? "Analyzing..."
          : "Analyze Repository"}
      </button>

      {submissionState.status !== "idle" &&
        submissionState.status !== "submitting" && (
          <p
            role={submissionState.status === "error" ? "alert" : "status"}
            className="text-center text-sm"
          >
            {submissionState.message}
          </p>
        )}
    </form>
  );
}

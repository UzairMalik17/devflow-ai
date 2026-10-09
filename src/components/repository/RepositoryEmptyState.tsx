import { RepositoryForm } from "./repository-form";

export function RepositoryEmptyState() {
  return (
    <section
      id="analyze-repository"
      className="flex flex-1 flex-col items-center justify-center px-5 py-16 sm:px-8"
    >
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex size-12 items-center justify-center rounded-xl border border-white/10 bg-[#1d1d1d] text-xl">
          {"</>"}
        </div>

        <p className="mb-3 text-sm font-medium text-[#a3a3a3]">
          AI-POWERED REPOSITORY EXPLORATION
        </p>

        <h1 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Understand your codebase.
        </h1>

        <p className="mt-4 max-w-xl text-base leading-7 text-[#a3a3a3]">
          Analyze a public GitHub repository and ask questions about its
          implementation. Get answers grounded in the source code.
        </p>

        <div className="mt-10">
          <RepositoryForm />
        </div>

        <p className="mt-4 text-xs leading-5 text-[#a3a3a3]">
          Public GitHub repositories only. The demo currently allows one new
          repository ingestion per UTC day.
        </p>

        <div className="mt-12 grid gap-5 border-t border-white/10 pt-6 sm:grid-cols-3">
          <div>
            <p className="text-sm font-medium">Explore code</p>
            <p className="mt-1 text-sm leading-5 text-[#a3a3a3]">
              Find relevant files and implementation details.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium">Ask questions</p>
            <p className="mt-1 text-sm leading-5 text-[#a3a3a3]">
              Use natural language to investigate a codebase.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium">Trace sources</p>
            <p className="mt-1 text-sm leading-5 text-[#a3a3a3]">
              See which repository files support an answer.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

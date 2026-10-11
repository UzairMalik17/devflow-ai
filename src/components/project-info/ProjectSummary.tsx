import Link from "next/link";

export function ProjectSummary() {
  return (
    <section
      id="project-notes"
      className="border-t border-white/10 bg-[#171717] px-5 py-6 sm:px-8"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium">About DevFlow AI</p>

          <p className="mt-2 text-sm leading-6 text-[#a3a3a3]">
            This is an evolving learning and portfolio project exploring
            retrieval-augmented generation (RAG), vector search, and full-stack
            AI application development. It is not yet a production-ready
            service. Gemini quotas, ingestion limits, and processing reliability
            are known constraints.
          </p>
        </div>

        <Link
          href="/docs#architecture"
          className="shrink-0 text-sm text-[#f2f0eb] underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-white"
        >
          Architecture &amp; roadmap ↗
        </Link>
      </div>
    </section>
  );
}

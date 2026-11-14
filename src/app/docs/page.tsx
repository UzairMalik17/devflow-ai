import Link from "next/link";

const implementedFeatures = [
  {
    number: "01",
    title: "Repository ingestion",
    description:
      "Accept a GitHub repository, retrieve its source files, prepare eligible content, and create searchable repository chunks.",
    technology: "GitHub API · Next.js · PostgreSQL",
  },
  {
    number: "02",
    title: "Asynchronous processing",
    description:
      "Move repository chunking and embedding generation into background jobs instead of depending on the lifetime of an HTTP request.",
    technology: "BullMQ · Redis · Dedicated workers",
  },
  {
    number: "03",
    title: "Vector-based retrieval",
    description:
      "Generate embeddings for repository content and store vectors in PostgreSQL with pgvector for similarity-based retrieval.",
    technology: "Gemini Embeddings · PostgreSQL · pgvector",
  },
  {
    number: "04",
    title: "Repository-aware AI chat",
    description:
      "Embed a question, retrieve relevant repository context, and use a language model to generate a context-informed response.",
    technology: "RAG · Gemini API · Next.js",
  },
  {
    number: "05",
    title: "Embedding API-key management",
    description:
      "Maintain availability state for configured embedding keys and select available keys using round-robin selection.",
    technology: "TypeScript · Gemini API",
  },
  {
    number: "06",
    title: "Scheduled key recovery",
    description:
      "Use a scheduled Vercel Cron request to enqueue recovery work. The recovery worker tests unavailable keys and restores keys that respond successfully.",
    technology: "Vercel Cron · BullMQ · Redis",
  },
  {
    number: "07",
    title: "Platform-level rate limiting",
    description:
      "Use Vercel Firewall rate-limiting rules to control excessive API traffic before requests reach application handlers.",
    technology: "Vercel WAF",
  },
];

const decisions = [
  {
    title: "Next.js for the application",
    choice:
      "Keep the web interface, application routes, and server-side application logic within one Next.js application.",
    rationale:
      "This keeps the initial application architecture manageable. The frontend and API can share types, validation logic, and application functionality without introducing a separate web backend.",
    limitation:
      "Long-running processing should not depend on the lifetime of a web request. The application also needs to account for the execution model of serverless deployments.",
    next: "Keep interactive operations in Next.js and delegate long-running processing to independently running workers.",
  },
  {
    title: "PostgreSQL with pgvector",
    choice:
      "Use PostgreSQL for relational application data and pgvector for storing and searching embeddings.",
    rationale:
      "Repository metadata, chunk records, and vector representations can be managed within the same database. This avoids introducing a separate vector database before the application demonstrates a need for one.",
    limitation:
      "Vector search requires appropriate indexing, metadata filtering, query tuning, and relevance evaluation.",
    next: "Measure retrieval quality and performance before considering additional storage infrastructure.",
  },
  {
    title: "Retrieval-augmented generation",
    choice:
      "Retrieve repository context before asking the language model to answer a question.",
    rationale:
      "A general-purpose language model does not automatically know the current contents of a particular GitHub repository. Retrieval supplies relevant source material at request time.",
    limitation:
      "Retrieval can miss important code, and a language model can still generate unsupported conclusions from incomplete context.",
    next: "Improve retrieval quality, validate source references, and evaluate answer faithfulness.",
  },
  {
    title: "BullMQ and Redis for background jobs",
    choice:
      "Use BullMQ with Redis to manage asynchronous repository-processing jobs.",
    rationale:
      "Repository processing includes downloading files, chunking content, and making external embedding requests. These operations can take longer than a normal HTTP request. A queue allows the application to enqueue work and let a separate worker process it.",
    limitation:
      "A queue introduces eventual processing, duplicate-delivery considerations, retry behavior, job-state management, and additional infrastructure.",
    next: "Continue improving idempotency, job observability, failure handling, and recovery behavior.",
  },
  {
    title: "Separate chunking and embedding workers",
    choice: "Run chunking and embedding as separate BullMQ workers.",
    rationale:
      "Chunking and embedding have different responsibilities. Chunking prepares and persists source content, while embedding depends on an external API with rate limits and quota restrictions. Separating them allows each stage to be managed independently.",
    limitation:
      "The application must coordinate job transitions and handle failures between stages.",
    next: "Improve progress reporting and ensure that partially processed repositories can resume safely.",
  },
  {
    title: "Round-robin Gemini API-key management",
    choice:
      "Maintain an in-memory manager that selects available embedding API keys and tracks unavailable keys.",
    rationale:
      "A failed or quota-limited key should not repeatedly be selected for new embedding work while other configured keys remain available. Round-robin selection distributes requests across the available keys.",
    limitation:
      "The manager's availability state is stored in process memory. Restarting its Node.js process resets that state. Multiple independent processes would also maintain separate manager instances.",
    next: "Keep the current single-process coordination model explicit and consider persistent state if multiple worker processes become necessary.",
  },
  {
    title: "Scheduled API-key recovery",
    choice:
      "Use Vercel Cron to enqueue a recovery job rather than attempting to manipulate worker memory from a cron API route.",
    rationale:
      "The cron route runs in the Next.js application environment, while the API-key manager lives in the embedding worker process. Redis provides communication between them through a recovery queue. The recovery worker runs inside the embedding worker process, so it accesses the same manager instance.",
    limitation:
      "The cron schedule is a fixed UTC schedule, not an automatic interpretation of Google's local quota-reset time. The in-memory manager also loses its state on process restart.",
    next: "Verify recovery behavior after deployment, monitor failed checks, and adjust the UTC schedule when the Pacific daylight-saving offset changes.",
  },
  {
    title: "Vercel WAF for rate limiting",
    choice:
      "Use Vercel Firewall rate-limiting rules to control excessive incoming API traffic.",
    rationale:
      "Rate limiting at the platform edge can reject excessive requests before they consume application execution time or trigger expensive application operations. This avoids introducing a separate rate-limiting service for basic request protection.",
    limitation:
      "IP-based request limits do not automatically enforce per-user AI usage quotas. They also need to be configured carefully to avoid affecting legitimate users behind shared networks.",
    next: "Add identity-aware usage tracking if the application requires individual user quotas or subscription-based limits.",
  },
];

const futureImprovements = [
  {
    number: "01",
    title: "Incremental repository indexing",
    status: "Planned",
    problem:
      "Reprocessing an entire repository when only a few files have changed can waste processing time and embedding-provider capacity.",
    approach: [
      "Record the indexed Git commit SHA.",
      "Calculate and store content hashes for indexed files.",
      "Identify added, changed, renamed, and deleted files.",
      "Reprocess only affected files and remove stale chunks.",
      "Handle partial indexing and failed file processing explicitly.",
    ],
    benefit:
      "Repository updates can become more efficient while keeping indexed content associated with a known source revision.",
    tradeoff:
      "Incremental indexing requires careful handling of branch changes, deleted files, and partially failed jobs.",
  },
  {
    number: "02",
    title: "Code-aware chunking",
    status: "Planned",
    problem:
      "Arbitrary text splitting can separate functions from their imports, types, comments, and related implementation.",
    approach: [
      "Prefer function, class, method, and module boundaries where language parsers are available.",
      "Preserve file paths, language, symbol names, and line ranges.",
      "Experiment with overlapping chunks when additional surrounding context is useful.",
    ],
    benefit:
      "Retrieved passages can preserve more meaningful code context and support more precise source references.",
    tradeoff:
      "Language-aware parsing increases implementation complexity and needs to account for multiple programming languages.",
  },
  {
    number: "03",
    title: "Hybrid retrieval",
    status: "Planned",
    problem:
      "Vector similarity is useful for conceptual questions but may miss exact function names, error messages, filenames, and identifiers.",
    approach: [
      "Combine vector search with PostgreSQL full-text search.",
      "Apply repository and source-version filters.",
      "Experiment with combining lexical and semantic retrieval scores.",
    ],
    benefit:
      "The retrieval system can use both conceptual similarity and exact-token matching.",
    tradeoff:
      "Hybrid retrieval introduces additional query and ranking logic that must be evaluated.",
  },
  {
    number: "04",
    title: "Reranking and contextual retrieval",
    status: "Planned",
    problem:
      "The most similar initial results are not necessarily the most useful evidence for the question.",
    approach: [
      "Retrieve an initial set of candidate chunks.",
      "Experiment with a reranking model or scoring strategy.",
      "Retrieve neighboring chunks or related symbols when additional context is required.",
    ],
    benefit:
      "More relevant evidence may reach the language model, improving the quality of its context.",
    tradeoff:
      "Reranking can increase latency, API usage, and infrastructure costs.",
  },
  {
    number: "05",
    title: "Retrieval and answer evaluation",
    status: "Planned",
    problem:
      "A few successful demonstrations do not establish that retrieval and generated answers are consistently accurate.",
    approach: [
      "Build a representative set of repository questions.",
      "Record the expected source files and supporting code passages.",
      "Measure retrieval recall at K and ranking quality.",
      "Evaluate answer correctness, citation support, latency, and cost.",
      "Compare changes against a repeatable baseline.",
    ],
    benefit:
      "Changes to chunking, embeddings, prompts, and retrieval can be evaluated using repeatable evidence.",
    tradeoff:
      "A useful evaluation set takes time to create and needs to represent realistic repository questions.",
  },
  {
    number: "06",
    title: "Verifiable source citations",
    status: "Planned",
    problem:
      "A fluent answer can still be incorrect, incomplete, or insufficiently supported by the retrieved code.",
    approach: [
      "Preserve source line ranges and repository revision information.",
      "Validate citations against retrieved chunks.",
      "Provide clickable source references where available.",
      "Allow the model to acknowledge insufficient evidence.",
    ],
    benefit:
      "Developers can inspect the supporting code instead of relying entirely on generated explanations.",
    tradeoff:
      "Citation accuracy depends on preserving source metadata throughout ingestion and retrieval.",
  },
  {
    number: "07",
    title: "Persistent conversations",
    status: "Planned",
    problem:
      "Client-side chat state does not provide durable conversation history across refreshes or independent sessions.",
    approach: [
      "Persist conversations and messages in PostgreSQL.",
      "Associate conversations with their owners and repositories.",
      "Enforce authorization on conversation access.",
      "Define retention and deletion behavior.",
    ],
    benefit:
      "Users can return to previous discussions and continue their work.",
    tradeoff:
      "Persistence introduces ownership, authorization, storage, and data-retention responsibilities.",
  },
];

const reliabilityImprovements = [
  {
    title: "Asynchronous processing",
    description:
      "BullMQ separates repository-processing work from the lifetime of a Next.js HTTP request. Jobs can be queued and processed independently by the appropriate worker.",
  },
  {
    title: "Retry and failure handling",
    description:
      "Queue-level retry policies help handle transient failures. They do not remove the need for idempotent processing or explicit handling of permanent provider errors.",
  },
  {
    title: "Embedding API-key availability",
    description:
      "The key manager tracks available and unavailable embedding keys. Failed keys are skipped by normal selection until they are restored.",
  },
  {
    title: "Scheduled recovery",
    description:
      "A protected cron endpoint adds a job to the recovery queue. The recovery worker tests unavailable keys using the existing embedding request function and marks successful keys available.",
  },
  {
    title: "Platform rate limiting",
    description:
      "Vercel WAF rules provide an edge-level control against excessive incoming API traffic. Application-level authorization and usage quotas remain separate concerns.",
  },
];

const productionChecks = [
  {
    title: "Repository ingestion",
    detail:
      "Verify repository validation, file filtering, chunk persistence, and behavior when GitHub requests fail.",
  },
  {
    title: "Queue reliability",
    detail:
      "Test retries, duplicate jobs, worker restarts, failed jobs, and partially completed repository processing.",
  },
  {
    title: "Embedding provider limits",
    detail:
      "Test quota errors, unavailable-key selection, recovery checks, and behavior when no key is available.",
  },
  {
    title: "Cron integration",
    detail:
      "Verify CRON_SECRET validation, Vercel Cron invocation, queue insertion, and recovery-worker execution.",
  },
  {
    title: "Rate limiting",
    detail:
      "Verify WAF rules against the intended routes, counting keys, thresholds, and legitimate traffic patterns.",
  },
  {
    title: "Retrieval quality",
    detail:
      "Build a repeatable evaluation set and measure whether relevant code is retrieved for representative questions.",
  },
  {
    title: "Security",
    detail:
      "Validate repository inputs, protect secrets, enforce authorization where applicable, and treat repository content as untrusted input.",
  },
  {
    title: "Observability",
    detail:
      "Use structured logs and meaningful job identifiers to investigate slow requests, provider failures, and incomplete ingestion.",
  },
  {
    title: "Data lifecycle",
    detail:
      "Define how indexed repository content, stale chunks, and conversations are retained and deleted.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8 max-w-3xl">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-[#a3a3a3]">
        {eyebrow}
      </p>
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      <p className="mt-4 leading-7 text-[#a3a3a3]">{description}</p>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-6 text-[#b3b3b3]">
          <span
            aria-hidden="true"
            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8c8c8c]"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function FlowBox({
  title,
  description,
  muted = false,
}: {
  title: string;
  description?: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 text-center ${
        muted ? "border-white/10 bg-[#1d1d1d]" : "border-white/15 bg-[#202020]"
      }`}
    >
      <p className="text-sm font-medium text-[#e5e5e5]">{title}</p>
      {description && (
        <p className="mt-1 text-xs leading-5 text-[#a3a3a3]">{description}</p>
      )}
    </div>
  );
}

function FlowArrow() {
  return (
    <div aria-hidden="true" className="py-1 text-center text-[#777777]">
      ↓
    </div>
  );
}

function ArchitectureDiagram() {
  return (
    <div className="rounded-xl border border-white/10 bg-[#151515] p-4 sm:p-6">
      <div className="mx-auto max-w-2xl">
        <FlowBox
          title="User / Browser"
          description="Select a repository or ask a codebase question"
        />
        <FlowArrow />
        <FlowBox
          title="Next.js application"
          description="UI, API routes, input validation, and application orchestration"
        />
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[#a3a3a3]">
            A / Repository indexing
          </p>
          <p className="mt-2 text-sm leading-6 text-[#777777]">
            Long-running work is moved out of the HTTP request.
          </p>

          <div className="mt-5 space-y-1">
            <FlowBox
              title="Repository API"
              description="Validate and create repository record"
              muted
            />
            <FlowArrow />
            <FlowBox
              title="Chunking queue"
              description="BullMQ job stored in Redis"
            />
            <FlowArrow />
            <FlowBox
              title="Chunking worker"
              description="Download, parse, filter, and chunk source files"
            />
            <FlowArrow />
            <FlowBox
              title="Persist chunks"
              description="Store repository chunks in PostgreSQL"
              muted
            />
            <FlowArrow />
            <FlowBox
              title="Embedding queue"
              description="Queue embedding work in Redis"
            />
            <FlowArrow />
            <FlowBox
              title="Embedding worker"
              description="Generate embeddings in controlled batches"
            />
            <FlowArrow />
            <FlowBox
              title="Gemini Embedding API"
              description="Create vector representations"
            />
            <FlowArrow />
            <FlowBox
              title="PostgreSQL + pgvector"
              description="Persist vectors for similarity search"
            />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[#a3a3a3]">
            B / Question answering
          </p>
          <p className="mt-2 text-sm leading-6 text-[#777777]">
            Retrieve indexed evidence before generating an answer.
          </p>

          <div className="mt-5 space-y-1">
            <FlowBox title="User question" muted />
            <FlowArrow />
            <FlowBox
              title="Query embedding"
              description="Convert the question into a vector"
            />
            <FlowArrow />
            <FlowBox
              title="Vector retrieval"
              description="Search relevant chunks in pgvector"
            />
            <FlowArrow />
            <FlowBox
              title="Retrieved context"
              description="Provide relevant repository evidence"
              muted
            />
            <FlowArrow />
            <FlowBox
              title="Gemini language model"
              description="Generate a context-informed response"
            />
            <FlowArrow />
            <FlowBox
              title="Answer"
              description="Return the generated response to the user"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-white/10 p-4 sm:p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-[#a3a3a3]">
          C / API-key recovery
        </p>
        <p className="mt-2 text-sm leading-6 text-[#777777]">
          Scheduled recovery is initiated by Vercel but executed by the existing
          embedding worker process.
        </p>

        <div className="mx-auto mt-5 max-w-2xl space-y-1">
          <FlowBox
            title="Vercel Cron"
            description="Runs on the configured UTC schedule"
            muted
          />
          <FlowArrow />
          <FlowBox
            title="Protected recovery API route"
            description="Validates CRON_SECRET and enqueues a recovery job"
          />
          <FlowArrow />
          <FlowBox
            title="Recovery queue"
            description="BullMQ job transported through Redis"
          />
          <FlowArrow />
          <FlowBox
            title="Recovery worker"
            description="Runs in the embedding worker's Node.js process"
          />
          <FlowArrow />
          <FlowBox
            title="Gemini API-key manager"
            description="Selects unavailable keys and updates their availability"
          />
          <FlowArrow />
          <FlowBox
            title="Embedding health check"
            description="Tests each candidate key with a small embedding request"
            muted
          />
        </div>

        <p className="mt-4 text-xs leading-5 text-[#777777]">
          The recovery worker and embedding worker share the same in-memory
          manager because they run in the same Node.js process. Redis transports
          jobs; it does not automatically synchronize the manager&apos;s
          in-memory state across different processes.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-[#1d1d1d] p-4">
          <p className="text-sm font-medium">Chunking daemon</p>
          <p className="mt-2 text-sm leading-6 text-[#a3a3a3]">
            Runs the chunking worker independently from the Next.js request
            lifecycle.
          </p>
        </div>
        <div className="rounded-lg bg-[#1d1d1d] p-4">
          <p className="text-sm font-medium">Embedding daemon</p>
          <p className="mt-2 text-sm leading-6 text-[#a3a3a3]">
            Runs the embedding worker and the recovery worker in one Node.js
            process.
          </p>
        </div>
      </div>

      <p className="mt-5 text-xs leading-5 text-[#777777]">
        Conceptual architecture of the current design. It shows the major
        responsibilities and communication paths, not every internal function or
        database operation.
      </p>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="min-w-0 flex-1">
      <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <nav
          aria-label="Breadcrumb"
          className="mb-10 flex items-center gap-2 text-sm text-[#8f8f8f]"
        >
          <Link href="/" className="transition hover:text-white">
            Workspace
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-[#e5e5e5]">Documentation</span>
        </nav>

        <header className="border-b border-white/10 pb-12 sm:pb-16">
          <div className="mb-6 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-[#d4d4d4]">
              Engineering case study
            </span>
            <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-[#d4d4d4]">
              Architecture & implementation
            </span>
          </div>

          <p className="mb-4 text-sm text-[#a3a3a3]">
            DEVFLOW AI / ARCHITECTURE & ENGINEERING
          </p>

          <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Understanding the codebase.
            <span className="mt-2 block text-[#a3a3a3]">
              Engineering a better way to work with it.
            </span>
          </h1>

          <p className="mt-7 max-w-3xl text-lg leading-8 text-[#c4c4c4]">
            DevFlow AI is a repository-aware AI application that indexes source
            code, retrieves relevant context, and uses that context to answer
            questions about a GitHub repository. Its architecture combines
            retrieval-augmented generation, vector search, asynchronous
            processing, background workers, and external AI services.
          </p>

          <div className="mt-8 rounded-xl border border-white/10 bg-[#171717] p-5 sm:p-6">
            <p className="font-medium">Project status and scope</p>
            <p className="mt-2 text-sm leading-7 text-[#a3a3a3]">
              This document describes the implemented architecture and the
              engineering decisions behind it. It also identifies limitations
              and future improvements. A feature described as planned should not
              be interpreted as an existing capability.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <a
              href="https://github.com/UzairMalik17/devflow-ai"
              target="_blank"
              rel="noreferrer"
              className="text-[#f2f0eb] underline decoration-white/30 underline-offset-4 transition hover:decoration-white"
            >
              View source on GitHub ↗
            </a>
            <a
              href="#architecture"
              className="text-[#a3a3a3] underline decoration-white/20 underline-offset-4 transition hover:text-white"
            >
              Explore the architecture
            </a>
          </div>
        </header>

        <div className="grid gap-12 py-12 lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-12 sm:py-16">
          <aside className="h-fit lg:sticky lg:top-8">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-[#777777]">
              On this page
            </p>
            <nav aria-label="Documentation sections">
              <ul className="space-y-3 text-sm text-[#a3a3a3]">
                {[
                  ["purpose", "Project purpose"],
                  ["features", "Implemented features"],
                  ["architecture", "System architecture"],
                  ["ingestion", "Background processing"],
                  ["recovery", "API-key recovery"],
                  ["security", "Rate limiting & security"],
                  ["decisions", "Engineering decisions"],
                  ["roadmap", "Future improvements"],
                  ["readiness", "Production considerations"],
                ].map(([id, label]) => (
                  <li key={id}>
                    <a href={`#${id}`} className="transition hover:text-white">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <div className="min-w-0 space-y-16">
            <section id="purpose" className="scroll-mt-8">
              <SectionHeading
                eyebrow="01 / Purpose"
                title="What problem does DevFlow AI solve?"
                description="Understanding an unfamiliar codebase often requires locating relevant files, following relationships between functions, and piecing together behavior from multiple parts of a project."
              />

              <div className="space-y-4 leading-7 text-[#b3b3b3]">
                <p>
                  DevFlow AI explores a more direct workflow: provide a GitHub
                  repository, ask a question about its code, and retrieve
                  relevant source context to help generate an answer.
                </p>
                <p>
                  The engineering challenge is not simply connecting a chatbot
                  to a language model. It is building the pipeline that prepares
                  source code for retrieval, selects useful evidence, and
                  presents an answer that a developer can inspect.
                </p>
                <p>
                  This makes the project an exploration of practical AI
                  application engineering: data ingestion, embeddings, vector
                  search, asynchronous processing, API reliability, and
                  application-level orchestration.
                </p>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    title: "Ingest",
                    description:
                      "Retrieve repository files and prepare eligible source content for indexing.",
                  },
                  {
                    title: "Retrieve",
                    description:
                      "Search indexed code for passages relevant to a developer's question.",
                  },
                  {
                    title: "Explain",
                    description:
                      "Use retrieved context to generate an answer grounded in the selected codebase.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-lg border border-white/10 bg-[#151515] p-4"
                  >
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#a3a3a3]">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section id="features" className="scroll-mt-8">
              <SectionHeading
                eyebrow="02 / Implemented capabilities"
                title="What the application currently does"
                description="These capabilities describe the current engineering direction and implemented components, rather than a list of aspirational features."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                {implementedFeatures.map((feature) => (
                  <article
                    key={feature.number}
                    className="rounded-xl border border-white/10 bg-[#151515] p-5"
                  >
                    <p className="text-xs tabular-nums tracking-wider text-[#777777]">
                      {feature.number}
                    </p>
                    <h3 className="mt-3 font-medium">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#a3a3a3]">
                      {feature.description}
                    </p>
                    <p className="mt-4 border-t border-white/10 pt-3 text-xs leading-5 text-[#777777]">
                      {feature.technology}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section
              id="project-scope"
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8"
            >
              <div className="max-w-3xl space-y-4">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Project scope
                </span>

                <h2 className="text-xl font-semibold tracking-tight text-white">
                  Built to demonstrate practical AI engineering
                </h2>

                <p className="text-sm leading-7 text-zinc-400">
                  DevFlow AI is an actively developed software engineering
                  portfolio project focused on practical AI application
                  development. Its primary focus is repository-aware RAG,
                  asynchronous job processing, vector search, and reliable
                  integration with external AI services.
                </p>

                <p className="text-sm leading-7 text-zinc-400">
                  The current development phase prioritizes the core AI and
                  backend infrastructure. Authentication and user-level
                  authorization are planned for a future iteration, before
                  introducing multi-user access and broader production use.
                </p>
              </div>
            </section>

            <section id="architecture" className="scroll-mt-8">
              <SectionHeading
                eyebrow="03 / Architecture"
                title="How the system fits together"
                description="The architecture separates interactive application requests, repository indexing, question answering, and scheduled recovery. Each component has a focused responsibility and communicates through defined interfaces."
              />

              <ArchitectureDiagram />

              <div className="mt-8 space-y-5">
                <div>
                  <h3 className="font-medium">
                    Why separate these responsibilities?
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[#a3a3a3]">
                    A repository-processing request may involve downloading
                    files, parsing source code, generating chunks, and making
                    many external embedding requests. Running all of that inside
                    one HTTP request would couple processing to request timeouts
                    and make recovery difficult.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">
                    Why use queues between stages?
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[#a3a3a3]">
                    A queue creates a boundary between the producer of work and
                    the process that performs it. The application can enqueue
                    work and return control to the client, while a worker
                    consumes jobs independently. Separate queues also make it
                    possible to control chunking and embedding workloads
                    independently.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">
                    Why keep one application instead of microservices?
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[#a3a3a3]">
                    The application does not need a collection of independently
                    deployed business services to achieve this separation.
                    Next.js handles the interactive application, while dedicated
                    worker processes handle background jobs. This introduces the
                    separation that the workload needs without prematurely
                    adding a distributed microservice architecture.
                  </p>
                </div>
              </div>
            </section>

            <section id="ingestion" className="scroll-mt-8">
              <SectionHeading
                eyebrow="04 / Background processing"
                title="Why repository ingestion is asynchronous"
                description="Repository indexing is a multi-stage workflow involving external services and potentially large amounts of source content. It should not be tied to the lifetime of a browser request."
              />

              <div className="space-y-5">
                <article className="rounded-xl border border-white/10 bg-[#151515] p-5 sm:p-6">
                  <h3 className="font-medium">1. Chunking queue and worker</h3>
                  <p className="mt-3 text-sm leading-7 text-[#a3a3a3]">
                    The application creates the repository record and schedules
                    chunking work. The chunking worker retrieves repository
                    content, prepares eligible source files, splits the content
                    into chunks, and persists those chunks.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#a3a3a3]">
                    Once chunking is complete, embedding work can be scheduled
                    separately. This allows source chunks to exist independently
                    of whether every embedding request has succeeded.
                  </p>
                </article>

                <article className="rounded-xl border border-white/10 bg-[#151515] p-5 sm:p-6">
                  <h3 className="font-medium">2. Embedding queue and worker</h3>
                  <p className="mt-3 text-sm leading-7 text-[#a3a3a3]">
                    The embedding worker consumes jobs that generate vector
                    representations for stored chunks. Because this stage
                    depends on an external Gemini API, it must account for
                    provider quotas, request failures, and controlled batch
                    processing.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#a3a3a3]">
                    Separating embedding generation from chunk persistence means
                    an embedding failure does not necessarily require
                    downloading and chunking the repository again.
                  </p>
                </article>

                <article className="rounded-xl border border-white/10 bg-[#151515] p-5 sm:p-6">
                  <h3 className="font-medium">3. Why Redis and BullMQ?</h3>
                  <p className="mt-3 text-sm leading-7 text-[#a3a3a3]">
                    BullMQ uses Redis to coordinate jobs between the application
                    and worker processes. Redis stores queue data and job state
                    so producers and consumers do not need to run inside the
                    same process.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#a3a3a3]">
                    The queue provides job lifecycle management and retry
                    capabilities. It does not automatically make every
                    application operation exactly-once. Workers still need safe
                    handling of duplicate jobs and partially completed
                    operations.
                  </p>
                </article>

                <article className="rounded-xl border border-white/10 bg-[#151515] p-5 sm:p-6">
                  <h3 className="font-medium">
                    4. Why separate the two Vercel daemons?
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#a3a3a3]">
                    Chunking and embedding are separate workloads with different
                    external dependencies. Running them as separate daemons
                    allows each worker to be deployed, monitored, and scaled
                    independently.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#a3a3a3]">
                    The current deployment configures one instance of each
                    worker in the selected Vercel region. The embedding daemon
                    also initializes the recovery worker in the same Node.js
                    process.
                  </p>
                </article>
              </div>

              <div className="mt-6 rounded-xl border border-white/10 p-5">
                <h3 className="font-medium">
                  Important reliability considerations
                </h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-[#a3a3a3]">
                  <li>
                    <strong className="text-[#e5e5e5]">Retries:</strong>{" "}
                    transient failures may be retried according to the
                    queue&apos;s configured policy.
                  </li>
                  <li>
                    <strong className="text-[#e5e5e5]">Idempotency:</strong> a
                    retried job must not create duplicate or inconsistent
                    records.
                  </li>
                  <li>
                    <strong className="text-[#e5e5e5]">
                      Partial progress:
                    </strong>{" "}
                    chunks should remain available for embedding retries where
                    the persistence design permits it.
                  </li>
                  <li>
                    <strong className="text-[#e5e5e5]">Concurrency:</strong>{" "}
                    worker concurrency must account for database capacity and
                    external API limits.
                  </li>
                </ul>
              </div>
            </section>

            <section id="recovery" className="scroll-mt-8">
              <SectionHeading
                eyebrow="05 / Provider reliability"
                title="Gemini API-key management and recovery"
                description="External AI providers enforce request and token quotas. The embedding pipeline therefore needs to recognize unavailable keys, avoid repeatedly selecting them, and provide a way to test them again."
              />

              <div className="space-y-5">
                <article className="rounded-xl border border-white/10 bg-[#151515] p-5 sm:p-6">
                  <h3 className="font-medium">Round-robin key selection</h3>
                  <p className="mt-3 text-sm leading-7 text-[#a3a3a3]">
                    The API-key manager maintains a collection of configured
                    embedding keys and their availability state. When a worker
                    requests a key, the manager selects the next available key
                    using round-robin selection.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#a3a3a3]">
                    If a key is marked unavailable, the normal selection
                    operation skips it. This prevents the worker from
                    continually selecting a key that has already failed.
                  </p>
                </article>

                <article className="rounded-xl border border-white/10 bg-[#151515] p-5 sm:p-6">
                  <h3 className="font-medium">Scheduled recovery workflow</h3>
                  <ol className="mt-4 space-y-3 text-sm leading-6 text-[#a3a3a3]">
                    <li>
                      <strong className="text-[#e5e5e5]">1. Schedule:</strong>{" "}
                      Vercel Cron invokes the recovery API route according to
                      its configured UTC schedule.
                    </li>
                    <li>
                      <strong className="text-[#e5e5e5]">
                        2. Authenticate:
                      </strong>{" "}
                      The route validates the authorization header against the
                      configured CRON_SECRET.
                    </li>
                    <li>
                      <strong className="text-[#e5e5e5]">3. Enqueue:</strong>{" "}
                      The route adds a recovery job to the BullMQ recovery
                      queue.
                    </li>
                    <li>
                      <strong className="text-[#e5e5e5]">4. Consume:</strong>{" "}
                      The recovery worker, running in the embedding worker
                      process, consumes the job.
                    </li>
                    <li>
                      <strong className="text-[#e5e5e5]">5. Test:</strong> The
                      worker retrieves unavailable keys and sends a small
                      embedding request using each candidate key explicitly.
                    </li>
                    <li>
                      <strong className="text-[#e5e5e5]">6. Restore:</strong> A
                      successful request marks that key available again. A
                      failed request leaves it unavailable.
                    </li>
                  </ol>
                </article>

                <article className="rounded-xl border border-white/10 bg-[#151515] p-5 sm:p-6">
                  <h3 className="font-medium">
                    Why does the recovery worker run in the embedding process?
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#a3a3a3]">
                    The API-key manager is a JavaScript object stored in process
                    memory. Two independent Node.js processes do not
                    automatically share the same object, even when they import
                    the same module.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#a3a3a3]">
                    Importing the recovery worker from the embedding
                    worker&apos;s entry point initializes both BullMQ workers in
                    the same process. They therefore access the same manager
                    instance through Node.js module caching.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#a3a3a3]">
                    Redis is responsible for transporting the recovery job. The
                    API-key manager remains in application memory; the recovery
                    API route does not attempt to modify it directly.
                  </p>
                </article>

                <div className="rounded-xl border border-white/10 p-5 sm:p-6">
                  <h3 className="font-medium">Current recovery limitations</h3>
                  <BulletList
                    items={[
                      "API-key availability is in memory and resets when the embedding worker process restarts.",
                      "Separate embedding worker processes would have independent manager instances unless state coordination is introduced.",
                      "A successful small health-check request confirms that the key accepted that request; it does not guarantee that all future requests will fit within provider quotas.",
                      "The scheduled cron uses a fixed UTC expression and requires adjustment when the Pacific daylight-saving offset changes.",
                      "Provider errors should be classified carefully so authentication failures, quota errors, and temporary service failures can be handled appropriately.",
                    ]}
                  />
                </div>

                <div className="rounded-xl border border-white/10 bg-[#171717] p-5">
                  <p className="text-sm font-medium">Current cron schedule</p>
                  <p className="mt-2 text-sm leading-6 text-[#a3a3a3]">
                    The configured expression is{" "}
                    <code className="rounded bg-[#252525] px-1.5 py-0.5 text-[#e5e5e5]">
                      10 8 * * *
                    </code>
                    , which runs daily at 08:10 UTC. This is 1:10 PM in
                    Pakistan. It is ten minutes after midnight Pacific during
                    Pacific Standard Time. During Pacific Daylight Time, the
                    schedule needs to change to 07:10 UTC to preserve the same
                    delay after midnight Pacific.
                  </p>
                </div>
              </div>
            </section>

            <section id="security" className="scroll-mt-8">
              <SectionHeading
                eyebrow="06 / Traffic protection"
                title="Rate limiting and API security"
                description="Public API endpoints can be abused, intentionally or unintentionally. Expensive operations such as repository ingestion and AI chat also consume external resources, so controlling incoming traffic is part of application reliability."
              />

              <article className="rounded-xl border border-white/10 bg-[#151515] p-5 sm:p-6">
                <h3 className="font-medium">Vercel Firewall rate limiting</h3>
                <p className="mt-3 text-sm leading-7 text-[#a3a3a3]">
                  DevFlow AI uses Vercel&apos;s Web Application Firewall
                  rate-limiting rules to control excessive incoming API traffic
                  at the platform edge. This can reject requests before they
                  reach application handlers, reducing unnecessary application
                  execution and protecting expensive endpoints.
                </p>
                <p className="mt-3 text-sm leading-7 text-[#a3a3a3]">
                  This approach was selected to use the deployment
                  platform&apos;s existing infrastructure instead of introducing
                  another rate-limiting service and maintaining a separate
                  counter store for basic request protection.
                </p>
                <h4 className="mt-5 text-sm font-medium">
                  What rate limiting does not replace
                </h4>
                <BulletList
                  items={[
                    "Authentication and authorization: a rate limit does not establish who is allowed to access a resource.",
                    "Per-user quotas: IP-based rules do not automatically enforce individual AI usage allowances.",
                    "Job deduplication: rate limiting does not prevent duplicate background jobs from being submitted through different requests.",
                    "Provider quota management: Gemini's own request and token limits still need to be handled by the embedding and chat workflows.",
                  ]}
                />
              </article>

              <article className="mt-5 rounded-xl border border-white/10 p-5 sm:p-6">
                <h3 className="font-medium">
                  Additional security considerations
                </h3>
                <BulletList
                  items={[
                    "Validate repository URLs and all external input on the server.",
                    "Keep GitHub and Gemini credentials in server-side environment variables.",
                    "Protect the recovery endpoint with CRON_SECRET.",
                    "Treat repository contents as untrusted input, including instructions embedded in source files and documentation.",
                    "Avoid exposing raw provider errors, secrets, or internal stack traces to clients.",
                    "Apply authorization checks to repository and conversation resources when user accounts are introduced.",
                  ]}
                />
              </article>
            </section>

            <section id="decisions" className="scroll-mt-8">
              <SectionHeading
                eyebrow="07 / Decision record"
                title="Why these engineering choices?"
                description="The architecture evolved in response to concrete limitations. Each decision solves a particular problem while introducing trade-offs that need to be understood and managed."
              />

              <div className="space-y-4">
                {decisions.map((item, index) => (
                  <article
                    key={item.title}
                    className="rounded-xl border border-white/10 bg-[#151515] p-5 sm:p-6"
                  >
                    <p className="text-xs uppercase tracking-wider text-[#777777]">
                      Decision {String(index + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-3 text-lg font-medium">{item.title}</h3>

                    <div className="mt-5 space-y-4">
                      <div>
                        <p className="text-sm font-medium text-[#e5e5e5]">
                          Chosen approach
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#a3a3a3]">
                          {item.choice}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#e5e5e5]">
                          Why this choice?
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#a3a3a3]">
                          {item.rationale}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#e5e5e5]">
                          Trade-offs and limitations
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#a3a3a3]">
                          {item.limitation}
                        </p>
                      </div>
                      <div className="border-t border-white/10 pt-4">
                        <p className="text-sm font-medium text-[#e5e5e5]">
                          Further improvement
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#a3a3a3]">
                          {item.next}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section id="roadmap" className="scroll-mt-8">
              <SectionHeading
                eyebrow="08 / Roadmap"
                title="Where the system can improve next"
                description="The next improvements should be driven by measurable limitations in retrieval quality, indexing efficiency, and user experience rather than adding complexity for its own sake."
              />

              <div className="space-y-5">
                {futureImprovements.map((item) => (
                  <article
                    key={item.number}
                    className="rounded-xl border border-white/10 p-5 sm:p-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-wider text-[#777777]">
                        Improvement {item.number}
                      </p>
                      <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-[#a3a3a3]">
                        {item.status}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-medium">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#a3a3a3]">
                      {item.problem}
                    </p>

                    <h4 className="mt-5 text-sm font-medium">
                      Proposed implementation
                    </h4>
                    <div className="mt-3">
                      <BulletList items={item.approach} />
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-lg bg-[#171717] p-4">
                        <p className="text-sm font-medium">Expected benefit</p>
                        <p className="mt-2 text-sm leading-6 text-[#a3a3a3]">
                          {item.benefit}
                        </p>
                      </div>
                      <div className="rounded-lg bg-[#171717] p-4">
                        <p className="text-sm font-medium">Trade-off</p>
                        <p className="mt-2 text-sm leading-6 text-[#a3a3a3]">
                          {item.tradeoff}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section id="reliability" className="space-y-8">
              <SectionHeading
                eyebrow="Reliability"
                title="Reliability & operational improvements"
                description="The infrastructure improvements that make repository processing more resilient, recoverable, and controlled."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                {reliabilityImprovements.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
                  >
                    <h3 className="text-sm font-semibold text-white">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm leading-7 text-zinc-400">
                      {item.description}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section id="readiness" className="scroll-mt-8">
              <SectionHeading
                eyebrow="09 / Engineering quality"
                title="Production considerations"
                description="A successful demonstration proves that a workflow can work. Production readiness requires evidence that it remains reliable, secure, observable, and affordable when inputs are large and external services fail."
              />

              <div className="space-y-4">
                {productionChecks.map((item, index) => (
                  <article
                    key={item.title}
                    className="flex gap-4 rounded-xl border border-white/10 bg-[#151515] p-4 sm:p-5"
                  >
                    <span className="text-sm tabular-nums text-[#777777]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-sm font-medium">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#a3a3a3]">
                        {item.detail}
                      </p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-8 rounded-xl border border-white/10 p-5 sm:p-6">
                <p className="font-medium">The engineering principle</p>
                <p className="mt-3 text-sm leading-7 text-[#a3a3a3]">
                  Start with a simple, working baseline. Identify its
                  limitations. Prioritize improvements by impact, measure the
                  results, and introduce complexity only when it solves a
                  demonstrated problem. The objective is not to use the largest
                  number of technologies; it is to build a system whose behavior
                  and trade-offs can be explained and tested.
                </p>
              </div>
            </section>

            <footer className="border-t border-white/10 pt-6">
              <p className="text-sm leading-6 text-[#8f8f8f]">
                This document describes the current architecture and known
                engineering direction of DevFlow AI. Implementation details
                should be kept synchronized with the source code and deployment
                configuration. Planned improvements are not claims of completed
                functionality.
              </p>
              <div className="mt-5 flex flex-wrap gap-5 text-sm">
                <a
                  href="https://github.com/UzairMalik17/devflow-ai"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#f2f0eb] underline decoration-white/30 underline-offset-4 hover:decoration-white"
                >
                  Source repository ↗
                </a>
                <Link
                  href="/"
                  className="text-[#a3a3a3] underline decoration-white/20 underline-offset-4 hover:text-white"
                >
                  Back to workspace
                </Link>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

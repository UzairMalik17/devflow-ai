import Link from "next/link";

const decisions = [
  {
    title: "Next.js for the application",
    choice:
      "Keep the web interface and application API within one Next.js application.",
    rationale:
      "This reduces the number of moving parts and makes it faster to build and iterate on the complete user workflow.",
    limitation:
      "Long-running repository processing should not depend on the lifetime of a web request.",
    next: "Introduce a separate background worker for ingestion when durable asynchronous processing is required.",
  },
  {
    title: "PostgreSQL with pgvector",
    choice: "Use PostgreSQL for application data and vector similarity search.",
    rationale:
      "A relational database with vector support keeps the initial infrastructure relatively simple and allows repository metadata and searchable chunks to live together.",
    limitation:
      "Vector search still needs appropriate indexing, metadata filtering, query tuning, and relevance evaluation.",
    next: "Measure retrieval performance and quality before considering additional storage infrastructure.",
  },
  {
    title: "Retrieval-augmented generation",
    choice:
      "Retrieve repository context before asking the language model to answer a question.",
    rationale:
      "The model receives evidence from the selected codebase instead of relying exclusively on its general training knowledge.",
    limitation:
      "Retrieval can miss important code, and a language model can still produce unsupported conclusions from incomplete context.",
    next: "Improve retrieval, evaluate answer faithfulness, and provide verifiable source references.",
  },
  {
    title: "Initial chunking and retrieval strategy",
    choice:
      "Start with a manageable pipeline that filters files, splits source text into chunks, and searches for relevant passages.",
    rationale:
      "A simple baseline makes it possible to validate the end-to-end workflow before investing in more sophisticated indexing.",
    limitation:
      "Text boundaries may separate related code, and vector similarity alone can miss exact identifiers or cross-file dependencies.",
    next: "Introduce code-aware chunking, hybrid search, and reranking where evaluation demonstrates a benefit.",
  },
  {
    title: "Temporary chat history",
    choice: "Keep the current chat session in client-side React state.",
    rationale:
      "This supports an interactive chat experience without requiring a conversation persistence system in the initial version.",
    limitation:
      "Messages are lost when the page is refreshed or the component is remounted.",
    next: "Persist conversations and messages with explicit ownership and authorization.",
  },
];

const infrastructureImprovements = [
  {
    number: "01",
    title: "Durable background ingestion",
    problem:
      "Processing a repository involves multiple files and external API calls. It can take longer than a normal HTTP request and may fail partway through.",
    approach: [
      "Introduce a durable job queue, for example BullMQ backed by Redis.",
      "Return a job identifier and process repositories in a background worker.",
      "Track queued, processing, completed, and failed states.",
      "Retry transient failures with bounded backoff and enforce timeouts.",
      "Make processing idempotent so retries do not create duplicate or inconsistent records.",
    ],
    outcome:
      "Repository processing can continue independently of the browser request, with clearer progress reporting and recovery.",
    tradeoff:
      "A queue adds infrastructure and operational complexity. Retries, duplicate delivery, concurrency, and job cleanup need deliberate handling.",
  },
  {
    number: "02",
    title: "Incremental indexing",
    problem:
      "Reprocessing every file when only a few files change wastes processing time and embedding-provider capacity.",
    approach: [
      "Record the Git commit SHA and a content hash for each indexed file.",
      "Identify added, changed, renamed, and deleted files.",
      "Reprocess only affected files and remove stale chunks.",
      "Track per-file errors and distinguish complete indexing from partial indexing.",
    ],
    outcome:
      "Repository updates become more efficient, and answers can be tied to a known version of the source code.",
    tradeoff:
      "Incremental updates require careful handling of branch changes, deleted files, and partially failed jobs.",
  },
  {
    number: "03",
    title: "Reliability and observability",
    problem:
      "Without consistent operational signals, it is difficult to diagnose failed ingestion, slow retrieval, provider errors, or unexpected costs.",
    approach: [
      "Add structured logs and request and job identifiers.",
      "Measure ingestion duration, failure rates, retrieval latency, and model usage.",
      "Set limits for repository size, file size, processing time, and request frequency.",
      "Add monitoring, alerts, and recovery procedures.",
    ],
    outcome:
      "Failures become easier to investigate, and performance and operating costs become measurable.",
    tradeoff:
      "Monitoring requires instrumentation, sensible alert thresholds, and ongoing maintenance.",
  },
];

const ragImprovements = [
  {
    title: "Code-aware chunking",
    problem:
      "Arbitrary text splits can separate a function from its imports, types, comments, or related implementation.",
    approach:
      "Prefer function, class, method, and module boundaries when language parsers are available. Store file paths, language, symbol names, line ranges, and commit identity.",
    outcome:
      "Retrieved passages can preserve more meaningful code context and support more precise source references.",
  },
  {
    title: "Hybrid retrieval",
    problem:
      "Vector similarity is useful for semantic questions but may miss exact function names, error messages, filenames, and identifiers.",
    approach:
      "Combine vector search with lexical search, such as PostgreSQL full-text search, and apply appropriate repository and version filters.",
    outcome:
      "The system can use both conceptual similarity and exact-token matching instead of relying on a single retrieval signal.",
  },
  {
    title: "Reranking and contextual retrieval",
    problem:
      "The most similar initial results are not necessarily the most useful evidence for the question.",
    approach:
      "Experiment with reranking candidate chunks and retrieving relevant neighboring chunks or related symbols when additional context is needed.",
    outcome:
      "Relevant evidence may be ranked more effectively and presented with enough context to answer the question.",
  },
  {
    title: "Evaluation before optimization",
    problem:
      "A few successful demonstrations do not establish that retrieval and generated answers are consistently accurate.",
    approach:
      "Build a representative set of repository questions and expected evidence. Measure retrieval recall at K, ranking quality, answer correctness, citation support, latency, and cost.",
    outcome:
      "Changes to chunking, embeddings, prompts, or retrieval can be compared against a repeatable baseline.",
  },
  {
    title: "Verifiable answers",
    problem:
      "A fluent answer can still be incorrect, incomplete, or insufficiently supported by the retrieved code.",
    approach:
      "Preserve source line ranges, validate citations against retrieved chunks, and teach the answer-generation step to acknowledge insufficient evidence.",
    outcome:
      "Users can inspect the supporting code and better understand where the answer comes from.",
  },
];

const productionChecks = [
  "Automated tests for repository validation and API failure paths.",
  "Durable ingestion jobs with retries, idempotency, and recovery tests.",
  "Clear handling of partial ingestion and stale index data.",
  "A repeatable RAG evaluation benchmark with recorded results.",
  "Source references that can be verified against the indexed repository version.",
  "Authentication and authorization appropriate to the supported repository access model.",
  "Request limits, provider quota handling, and cost monitoring.",
  "Structured logs, metrics, alerts, and documented recovery procedures.",
  "Explicit retention and deletion rules for indexed content and conversations.",
  "Security testing, including malicious instructions embedded in repository files.",
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
              Evolving project
            </span>
          </div>

          <p className="mb-4 text-sm text-[#a3a3a3]">
            DEVFLOW AI / ARCHITECTURE & ENGINEERING
          </p>

          <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Understanding the codebase.
            <span className="mt-2 block text-[#a3a3a3]">
              Improving how AI understands it.
            </span>
          </h1>

          <p className="mt-7 max-w-3xl text-lg leading-8 text-[#c4c4c4]">
            DevFlow AI is a repository-aware question-answering application that
            explores how source code can be indexed, searched, and used as
            evidence for AI-generated answers. This document explains the
            architecture, the reasoning behind the initial implementation, and
            the engineering work needed to move toward production readiness.
          </p>

          <div className="mt-8 rounded-xl border border-white/10 bg-[#171717] p-5 sm:p-6">
            <p className="font-medium">Project status</p>
            <p className="mt-2 text-sm leading-7 text-[#a3a3a3]">
              This is an evolving portfolio project, not a claim of production
              readiness. The initial design prioritizes a working end-to-end
              flow and a manageable development scope. The improvement sections
              describe proposed work, not features that should be assumed to
              exist today.
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
                  ["architecture", "Architecture"],
                  ["decisions", "Engineering decisions"],
                  ["infrastructure", "Infrastructure roadmap"],
                  ["rag", "RAG roadmap"],
                  ["production", "Production readiness"],
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
                title="What problem does DevFlow AI explore?"
                description="Understanding an unfamiliar codebase often requires finding the right files, following relationships between functions, and piecing together behavior from multiple places."
              />

              <div className="space-y-4 leading-7 text-[#b3b3b3]">
                <p>
                  DevFlow AI explores a more direct workflow: provide a GitHub
                  repository, ask a question about its code, and retrieve
                  relevant source context to help generate an answer.
                </p>
                <p>
                  The engineering challenge is not simply connecting a chatbot
                  to a model. It is building the pipeline that prepares code for
                  retrieval, selects useful evidence, and presents an answer
                  that a developer can verify.
                </p>
                <p>
                  The project is designed to explore full-stack AI engineering
                  in a concrete application. Its value is both the working
                  product flow and the decisions required to improve its
                  accuracy, reliability, and maintainability.
                </p>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    title: "Ingest",
                    description:
                      "Obtain repository files and prepare eligible source content.",
                  },
                  {
                    title: "Retrieve",
                    description:
                      "Search indexed code for passages relevant to a question.",
                  },
                  {
                    title: "Explain",
                    description:
                      "Use retrieved context to generate an answer that can be checked against source code.",
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

            <section id="architecture" className="scroll-mt-8">
              <SectionHeading
                eyebrow="02 / Architecture"
                title="How the system fits together"
                description="The workflow separates repository preparation from question answering conceptually. This makes it easier to reason about data flow, failure points, and future improvements."
              />

              <div className="rounded-xl border border-white/10 bg-[#151515] p-4 sm:p-6">
                <div className="mx-auto max-w-xl space-y-2 text-center">
                  <div className="rounded-lg border border-white/10 bg-[#1d1d1d] p-4">
                    <p className="font-medium">Next.js workspace</p>
                    <p className="mt-1 text-sm text-[#a3a3a3]">
                      Repository selection and chat interface
                    </p>
                  </div>
                  <div className="text-[#777777]" aria-hidden="true">
                    ↓
                  </div>
                  <div className="rounded-lg border border-white/10 p-4">
                    <p className="font-medium">Application API</p>
                    <p className="mt-1 text-sm text-[#a3a3a3]">
                      Validation, repository operations, and question handling
                    </p>
                  </div>
                  <div className="text-[#777777]" aria-hidden="true">
                    ↓
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-white/10 p-4 sm:p-5">
                    <p className="text-xs uppercase tracking-wider text-[#8f8f8f]">
                      Indexing path
                    </p>
                    <div className="mt-4 space-y-2 text-sm">
                      {[
                        "GitHub repository",
                        "File filtering and chunking",
                        "Embedding generation",
                        "PostgreSQL + pgvector",
                      ].map((step, index) => (
                        <div key={step}>
                          <div className="rounded-md bg-[#1d1d1d] px-3 py-3 text-[#d4d4d4]">
                            {step}
                          </div>
                          {index < 3 && (
                            <p
                              className="py-1 text-center text-[#777777]"
                              aria-hidden="true"
                            >
                              ↓
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 p-4 sm:p-5">
                    <p className="text-xs uppercase tracking-wider text-[#8f8f8f]">
                      Question-answering path
                    </p>
                    <div className="mt-4 space-y-2 text-sm">
                      {[
                        "User question",
                        "Question embedding",
                        "Relevant context retrieval",
                        "Language model",
                        "Answer with source context",
                      ].map((step, index) => (
                        <div key={step}>
                          <div className="rounded-md bg-[#1d1d1d] px-3 py-3 text-[#d4d4d4]">
                            {step}
                          </div>
                          {index < 4 && (
                            <p
                              className="py-1 text-center text-[#777777]"
                              aria-hidden="true"
                            >
                              ↓
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="mt-5 text-xs leading-5 text-[#777777]">
                  Conceptual architecture. It illustrates the intended
                  responsibilities and data flow, not every deployed process or
                  a guarantee that every stage is complete.
                </p>
              </div>

              <div className="mt-6 space-y-4 text-sm leading-7 text-[#a3a3a3]">
                <p>
                  <strong className="text-[#e5e5e5]">Ingestion</strong> prepares
                  repository content for search. It includes obtaining files,
                  filtering irrelevant content, chunking source text, and
                  creating embeddings.
                </p>
                <p>
                  <strong className="text-[#e5e5e5]">Retrieval</strong> uses a
                  question to locate relevant indexed chunks. Similarity is a
                  signal of relevance, not proof that a passage fully answers
                  the question.
                </p>
                <p>
                  <strong className="text-[#e5e5e5]">Generation</strong> gives
                  the question and retrieved context to a language model. Better
                  retrieval improves the evidence available to the model, but
                  does not eliminate hallucinations.
                </p>
              </div>
            </section>

            <section id="decisions" className="scroll-mt-8">
              <SectionHeading
                eyebrow="03 / Decision record"
                title="Why the initial choices make sense"
                description="The goal was to get the complete workflow running with a manageable architecture, then identify bottlenecks using evidence rather than adding complexity prematurely."
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
                          Rationale
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#a3a3a3]">
                          {item.rationale}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#e5e5e5]">
                          Known limitation
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#a3a3a3]">
                          {item.limitation}
                        </p>
                      </div>
                      <div className="border-t border-white/10 pt-4">
                        <p className="text-sm font-medium text-[#e5e5e5]">
                          Potential next step
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

            <section id="infrastructure" className="scroll-mt-8">
              <SectionHeading
                eyebrow="04 / Roadmap"
                title="Application infrastructure improvements"
                description="The next infrastructure step is not automatically to split the application into microservices. It is to separate long-running, failure-prone work from interactive requests and give that work durable state and recovery behavior."
              />

              <div className="space-y-5">
                {infrastructureImprovements.map((item) => (
                  <article
                    key={item.number}
                    className="rounded-xl border border-white/10 p-5 sm:p-6"
                  >
                    <p className="text-xs uppercase tracking-wider text-[#777777]">
                      Improvement {item.number}
                    </p>
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
                          {item.outcome}
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

            <section id="rag" className="scroll-mt-8">
              <SectionHeading
                eyebrow="05 / Retrieval quality"
                title="How the RAG pipeline can improve"
                description="A repository assistant is only as useful as the evidence it retrieves and the reliability with which its answer reflects that evidence. These improvements should be tested against a consistent evaluation set."
              />

              <div className="space-y-4">
                {ragImprovements.map((item, index) => (
                  <article
                    key={item.title}
                    className="grid gap-4 rounded-xl border border-white/10 bg-[#151515] p-5 sm:grid-cols-[44px_1fr] sm:p-6"
                  >
                    <p className="text-sm tabular-nums text-[#777777]">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <div>
                      <h3 className="text-lg font-medium">{item.title}</h3>
                      <div className="mt-4 space-y-4 text-sm leading-6 text-[#a3a3a3]">
                        <p>
                          <strong className="text-[#e5e5e5]">Problem: </strong>
                          {item.problem}
                        </p>
                        <p>
                          <strong className="text-[#e5e5e5]">
                            Proposed approach:{" "}
                          </strong>
                          {item.approach}
                        </p>
                        <p>
                          <strong className="text-[#e5e5e5]">
                            Expected benefit:{" "}
                          </strong>
                          {item.outcome}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-6 rounded-xl border border-white/10 bg-[#171717] p-5 sm:p-6">
                <h3 className="font-medium">
                  Why evaluation comes before complexity
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#a3a3a3]">
                  Hybrid retrieval, reranking, and more advanced chunking can
                  improve results, but they also introduce latency, cost, and
                  tuning requirements. A benchmark helps determine which changes
                  actually improve the system rather than merely making the
                  architecture more complicated.
                </p>
              </div>
            </section>

            <section id="production" className="scroll-mt-8">
              <SectionHeading
                eyebrow="06 / Readiness"
                title="What production readiness would require"
                description="A successful demonstration proves that a workflow can work. Production readiness requires evidence that it remains reliable, secure, observable, and affordable when inputs are large, services fail, and usage grows."
              />

              <div className="rounded-xl border border-white/10 bg-[#151515] p-5 sm:p-6">
                <BulletList items={productionChecks} />
              </div>

              <div className="mt-6 space-y-4 text-sm leading-7 text-[#a3a3a3]">
                <p>
                  <strong className="text-[#e5e5e5]">
                    Security and access control:
                  </strong>{" "}
                  public repositories reduce some access-management complexity,
                  but arbitrary inputs, secrets, usage limits, and malicious
                  content still require attention. Private repositories would
                  introduce additional authentication and authorization
                  requirements.
                </p>
                <p>
                  <strong className="text-[#e5e5e5]">MCP and agents:</strong>{" "}
                  these are possible extensions, not requirements for a credible
                  RAG application. They should be considered only when a
                  specific multi-step task benefits from tool use and the result
                  can be evaluated.
                </p>
              </div>

              <div className="mt-8 rounded-xl border border-white/10 p-5 sm:p-6">
                <p className="font-medium">The engineering principle</p>
                <p className="mt-3 text-sm leading-7 text-[#a3a3a3]">
                  Start with a simple, working baseline. Identify its
                  limitations. Prioritize improvements by impact, measure the
                  results, and introduce complexity only when it solves a
                  demonstrated problem.
                </p>
              </div>
            </section>

            <footer className="border-t border-white/10 pt-6">
              <p className="text-sm leading-6 text-[#8f8f8f]">
                This document describes the intended architecture and
                improvement direction. Implementation status should always be
                verified against the current source code; proposed improvements
                are not claims of completed functionality.
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

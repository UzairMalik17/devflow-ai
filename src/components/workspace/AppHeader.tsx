import Link from "next/link";

const GITHUB_REPOSITORY = "https://github.com/UzairMalik17/devflow-ai";

export function AppHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 px-5 sm:px-8">
      <Link href="/" className="font-semibold tracking-tight md:hidden">
        DevFlow AI
      </Link>

      <p className="hidden text-sm text-[#a3a3a3] md:block">
        Repository workspace
      </p>

      <Link
        href={GITHUB_REPOSITORY}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-[#d4d4d4] transition-colors hover:text-white"
      >
        GitHub ↗
      </Link>
    </header>
  );
}

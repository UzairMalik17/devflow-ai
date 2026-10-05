import { gemini } from "@/lib/gemini";
import { LLM_MODEL } from "./llm.config";
import { RepositoryChunk } from "../repositories/repository.chunk";

export type RepositoryAnswer = {
  answer: string;
  sources: string[];
};

export async function generateRepositoryAnswer(
  query: string,
  chunks: RepositoryChunk[],
): Promise<RepositoryAnswer> {
  if (chunks.length === 0) {
    return {
      answer:
        "I could not find enough relevant information in the repository to answer this question.",
      sources: [],
    };
  }

  const context = chunks
    .map((chunk) => `--- File: ${chunk.path} ---\n${chunk.content}`)
    .join("\n\n");

  const prompt = `
You are DevFlow AI, an assistant that answers questions about software repositories.

Answer the user's question using only the provided repository context.

Rules:
- Base your answer on the provided repository context.
- Do not invent files, functions, behavior, or implementation details.
- If the context does not contain enough information to answer the question, say so clearly.
- When referring to code, mention the relevant file path.
- Give a concise but useful technical explanation.

Repository context:

${context}

User question:

${query}
`;

  const response = await gemini.models.generateContent({
    model: LLM_MODEL,
    contents: prompt,
  });

  const answer = response.text;

  if (!answer) {
    throw new Error("Gemini returned an empty response.");
  }

  return {
    answer,
    sources: [...new Set(chunks.map((chunk) => chunk.path))],
  };
}

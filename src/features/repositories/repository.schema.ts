import { z } from "zod";

export const repositoryInputSchema = z.object({
  repositoryUrl: z.url(),
});

export const repositoryChatInputSchema = z.object({
  query: z.string().trim().min(1, {
    error: "Query is required.",
  }),
});

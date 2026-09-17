import { z } from "zod";

export const repositoryInputSchema = z.object({
  repositoryUrl: z.url(),
});

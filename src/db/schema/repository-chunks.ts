import { pgTable, text, timestamp, uuid, vector } from "drizzle-orm/pg-core";
import { repositories } from "./repositories";

export const repositoryChunks = pgTable("repository_chunks", {
  id: uuid("id").defaultRandom().primaryKey(),

  repositoryId: uuid("repository_id")
    .notNull()
    .references(() => repositories.id),

  path: text("path").notNull(),

  content: text("content").notNull(),

  embedding: vector("embedding", {
    dimensions: 768,
  }),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

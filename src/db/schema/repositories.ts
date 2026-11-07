import { IngestionStatus } from "@/constants/enums";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const repositories = pgTable("repositories", {
  id: uuid("id").defaultRandom().primaryKey(),

  owner: text("owner").notNull(),

  name: text("name").notNull(),

  fullName: text("full_name").notNull().unique(),

  defaultBranch: text("default_branch").notNull(),

  htmlUrl: text("html_url").notNull(),

  ingestionStatus: text("ingestion_status")
    .$type<IngestionStatus>()
    .notNull()
    .default(IngestionStatus.PENDING),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export type Repository = typeof repositories.$inferSelect;

import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const repositories = pgTable("repositories", {
  id: uuid("id").defaultRandom().primaryKey(),

  owner: text("owner").notNull(),

  name: text("name").notNull(),

  fullName: text("full_name").notNull().unique(),

  defaultBranch: text("default_branch").notNull(),

  htmlUrl: text("html_url").notNull(),

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

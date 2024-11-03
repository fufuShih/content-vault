import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { pgTable, serial, text, timestamp, integer, varchar } from 'drizzle-orm/pg-core';

// Collect Item table
export const items = pgTable('items', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  author: varchar('author', { length: 255 }),
  description: text('description'),
  url: text('url').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Item = InferSelectModel<typeof items>;
export type ItemInsert = InferInsertModel<typeof items>;

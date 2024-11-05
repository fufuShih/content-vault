import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  integer, 
  varchar, 
  jsonb, 
  boolean 
} from 'drizzle-orm/pg-core';

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

export const feeds = pgTable('feeds', {
  id: serial('id').primaryKey(),
  itemId: integer('item_id').references(() => items.id),
  feedUrl: text('feed_url').notNull(),
  lastFetched: timestamp('last_fetched'),
  fetchInterval: integer('fetch_interval'), // 以分鐘為單位
  isActive: boolean('is_active').default(true),
  settings: jsonb('settings'), // 訂閱源特定設置
});

export type Item = InferSelectModel<typeof items>;
export type ItemInsert = InferInsertModel<typeof items>;

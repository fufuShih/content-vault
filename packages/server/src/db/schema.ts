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
  itemId: integer('item_id').references(() => items.id, { onDelete: 'cascade' }),
  lastFetched: timestamp('last_fetched'),
  fetchInterval: integer('fetch_interval'), // 以分鐘為單位
  isActive: boolean('is_active').default(true),
  settings: jsonb('settings').$type<Record<string, unknown>>(), // 訂閱源特定設置
});

export const rssEntries = pgTable('rss_entries', {
  id: serial('id').primaryKey(),
  itemId: integer('item_id')
    .references(() => items.id, { onDelete: 'cascade' })
    .notNull(),
  guid: text('guid'),  // RSS 項目的唯一標識符
  title: varchar('title', { length: 255 }).notNull(),
  author: varchar('author', { length: 255 }),
  description: text('description'),
  content: text('content'),
  link: text('link'),  // 原始文章的 URL
  pubDate: timestamp('pub_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type definitions
export type Item = InferSelectModel<typeof items>;
export type ItemInsert = InferInsertModel<typeof items>;
export type Feed = InferSelectModel<typeof feeds>;
export type FeedInsert = InferInsertModel<typeof feeds>;
export type RssEntry = InferSelectModel<typeof rssEntries>;
export type RssEntryInsert = InferInsertModel<typeof rssEntries>;

// feed.service.ts

import { db } from '../db';
import { items, rssEntries, type Item, type RssEntry } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import Parser from 'rss-parser';
import { sql } from 'drizzle-orm';

const parser = new Parser({
  defaultRSS: 2.0,
  customFields: {
    feed: ['language', 'copyright'],
    item: ['author', 'category', 'guid']
  }
});

interface FeedEntry {
  title: string;
  link: string;
  content: string;
  guid?: string;
  contentSnippet?: string;
  creator?: string;
  isoDate?: string;
  pubDate?: string;
}

export class FeedService {
  async addFeed(feedUrl: string, fetchInterval: number = 60) {
    try {
      // 先測試RSS源是否可用
      const feed = await parser.parseURL(feedUrl);
      
      // 創建新的 item 記錄作為 RSS feed
      const [newItem] = await db.insert(items).values({
        title: feed.title || 'Untitled Feed',
        author: feed.creator || 'Unknown',
        description: feed.description || '',
        url: feedUrl,  // 儲存 feed URL
        type: 'rss',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // 獲取並保存最新的文章
      await this.fetchAndSaveEntries(newItem.id, feedUrl);

      return newItem;
    } catch (error) {
      throw new Error(`Failed to add feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllFeeds() {
    return await db
      .select()
      .from(items)
      .where(eq(items.type, 'rss'))
      .orderBy(desc(items.updatedAt));
  }

  async deleteFeed(id: number) {
    // 由於設置了 CASCADE，刪除 item 時會自動刪除相關的 rss_entries
    const [deletedItem] = await db
      .delete(items)
      .where(and(
        eq(items.id, id),
        eq(items.type, 'rss')
      ))
      .returning();
    
    return !!deletedItem;
  }

  async refreshFeed(id: number) {
    const feed = await db
      .select()
      .from(items)
      .where(and(
        eq(items.id, id),
        eq(items.type, 'rss')
      ))
      .limit(1);

    if (!feed[0]) {
      throw new Error('Feed not found');
    }

    await this.fetchAndSaveEntries(feed[0].id, feed[0].url!);
    
    // 更新 item 的最後更新時間
    await db
      .update(items)
      .set({ updatedAt: new Date() })
      .where(eq(items.id, id));

    return true;
  }

  async refreshAllFeeds() {
    const allFeeds = await this.getAllFeeds();
    const results = await Promise.allSettled(
      allFeeds.map(feed => this.refreshFeed(feed.id))
    );

    return {
      total: allFeeds.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length
    };
  }

  async getFeedEntries(feedId: number) {
    // 確認 feed 存在
    const feed = await db
      .select()
      .from(items)
      .where(and(
        eq(items.id, feedId),
        eq(items.type, 'rss')
      ))
      .limit(1);

    if (!feed[0]) {
      throw new Error('Feed not found');
    }

    // 獲取該 feed 的所有文章
    return await db
      .select()
      .from(rssEntries)
      .where(eq(rssEntries.itemId, feedId))
      .orderBy(desc(rssEntries.pubDate));
  }

  private async fetchAndSaveEntries(itemId: number, feedUrl: string) {
    const parsedFeed = await parser.parseURL(feedUrl);
    
    // 為每個文章創建 rss_entries 記錄
    const entries = await Promise.all(parsedFeed.items.map(async (entry: FeedEntry) => {
      try {
        // 檢查是否已存在相同的文章（通過 guid 或 link）
        const existingEntry = await db
          .select()
          .from(rssEntries)
          .where(and(
            eq(rssEntries.itemId, itemId),
            entry.guid ? eq(rssEntries.guid, entry.guid) : eq(rssEntries.link, entry.link)
          ))
          .limit(1);

        if (existingEntry.length > 0) {
          // 如果文章已存在，更新它
          const [updatedEntry] = await db
            .update(rssEntries)
            .set({
              title: entry.title,
              author: entry.creator || 'Unknown',
              description: entry.contentSnippet || '',
              content: entry.content,
              updatedAt: new Date()
            })
            .where(eq(rssEntries.id, existingEntry[0].id))
            .returning();
          return updatedEntry;
        }

        // 創建新文章
        const [newEntry] = await db
          .insert(rssEntries)
          .values({
            itemId,
            guid: entry.guid,
            title: entry.title,
            author: entry.creator || 'Unknown',
            description: entry.contentSnippet || '',
            content: entry.content,
            link: entry.link,
            pubDate: entry.isoDate ? new Date(entry.isoDate) : 
                    entry.pubDate ? new Date(entry.pubDate) : 
                    new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();

        return newEntry;
      } catch (error) {
        console.error(`Failed to save entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return null;
      }
    }));

    return entries.filter(entry => entry !== null);
  }
}

export const feedService = new FeedService();

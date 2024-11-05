import { db } from '../db';
import { feeds, items, type Item } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import Parser from 'rss-parser';
import { sql } from 'drizzle-orm';

const parser = new Parser({
  defaultRSS: 2.0,
  customFields: {
    feed: ['language', 'copyright'],
    item: ['author', 'category']
  }
});

interface FeedEntry {
  title: string;
  link: string;
  content: string;
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
      
      // 創建新的feed記錄
      const [newFeed] = await db.insert(feeds).values({
        feedUrl,
        fetchInterval,
        lastFetched: new Date(),
        isActive: true,
        settings: {}
      }).returning();

      // 獲取並保存最新的文章
      await this.fetchAndSaveEntries(newFeed.id);

      return newFeed;
    } catch (error) {
      throw new Error(`Failed to add feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllFeeds() {
    return await db.select().from(feeds).orderBy(desc(feeds.lastFetched));
  }

  async deleteFeed(id: number) {
    const [deletedFeed] = await db
      .delete(feeds)
      .where(eq(feeds.id, id))
      .returning();
    
    return !!deletedFeed;
  }

  async refreshFeed(id: number) {
    const feed = await db
      .select()
      .from(feeds)
      .where(eq(feeds.id, id))
      .limit(1);

    if (!feed[0]) {
      throw new Error('Feed not found');
    }

    await this.fetchAndSaveEntries(feed[0].id);
    
    // 更新最後抓取時間
    await db
      .update(feeds)
      .set({ lastFetched: new Date() })
      .where(eq(feeds.id, id));

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
    // 確認feed存在
    const feed = await db
      .select()
      .from(feeds)
      .where(eq(feeds.id, feedId))
      .limit(1);

    if (!feed[0]) {
      throw new Error('Feed not found');
    }

    // 獲取該feed的所有文章
    const feedItems = await db
      .select()
      .from(items)
      .where(eq(items.type, 'rss'))
      .orderBy(desc(items.createdAt));

    return feedItems;
  }

  private async fetchAndSaveEntries(feedId: number) {
    const feed = await db
      .select()
      .from(feeds)
      .where(eq(feeds.id, feedId))
      .limit(1);

    if (!feed[0]) {
      throw new Error('Feed not found');
    }

    const parsedFeed = await parser.parseURL(feed[0].feedUrl);
    
    // 為每個文章創建item記錄
    const entries = await Promise.all(parsedFeed.items.map(async (entry: FeedEntry) => {
      try {
        const [newItem] = await db.insert(items).values({
          title: entry.title,
          author: entry.creator || 'Unknown',
          description: entry.contentSnippet || '',
          url: entry.link,
          type: 'rss',
          createdAt: entry.isoDate ? new Date(entry.isoDate) : new Date(),
          updatedAt: new Date()
        }).returning();

        return newItem;
      } catch (error) {
        console.error(`Failed to save entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return null;
      }
    }));

    return entries.filter(entry => entry !== null);
  }
}

export const feedService = new FeedService();

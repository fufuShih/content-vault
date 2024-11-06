import { API_BASE_URL } from './api.config';
import type { Feed, Item } from './api.types';

export class FeedsService {
  private baseUrl = `${API_BASE_URL}/items/feeds`;

  async addFeed(feedUrl: string, fetchInterval?: number): Promise<Feed> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ feedUrl, fetchInterval }),
    });

    if (!response.ok) throw new Error('Failed to add feed');
    return response.json();
  }

  async getAllFeeds(): Promise<Feed[]> {
    const response = await fetch(this.baseUrl);
    if (!response.ok) throw new Error('Failed to fetch feeds');
    return response.json();
  }

  async deleteFeed(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete feed');
  }

  async refreshFeed(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}/refresh`, {
      method: 'POST',
    });

    if (!response.ok) throw new Error('Failed to refresh feed');
  }

  async refreshAllFeeds(): Promise<{ total: number; successful: number; failed: number }> {
    const response = await fetch(`${this.baseUrl}/refresh/all`, {
      method: 'POST',
    });

    if (!response.ok) throw new Error('Failed to refresh feeds');
    return response.json();
  }

  async getFeedEntries(id: number): Promise<Item[]> {
    const response = await fetch(`${this.baseUrl}/${id}/entries`);
    if (!response.ok) throw new Error('Failed to fetch feed entries');
    return response.json();
  }
}

export const feedsService = new FeedsService();

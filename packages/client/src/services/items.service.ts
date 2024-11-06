import { API_BASE_URL } from './api.config';
import type { Item, PaginatedResponse, UploadResult } from './api.types';

export class ItemsService {
  public baseUrl = `${API_BASE_URL}/items`;

  async getItems(params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
  }): Promise<PaginatedResponse<Item>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.type) queryParams.append('type', params.type);

    const response = await fetch(`${this.baseUrl}?${queryParams}`);
    if (!response.ok) throw new Error('Failed to fetch items');
    return response.json();
  }

  async getItem(id: number): Promise<Item> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) throw new Error('Failed to fetch item');
    return response.json();
  }

  async uploadFile(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to upload file');
    return response.json();
  }

  async uploadFiles(files: File[]): Promise<{ results: UploadResult[]; summary: any }> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`${this.baseUrl}/upload/batch`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to upload files');
    return response.json();
  }

  async getResourceUrl(id: number): Promise<string> {
    return `${this.baseUrl}/${id}/resource`;
  }

  async scanDirectory(): Promise<{ added: number; updated: number; errors: string[] }> {
    const response = await fetch(`${this.baseUrl}/scan`, {
      method: 'POST',
    });
    
    if (!response.ok) throw new Error('Failed to scan directory');
    return response.json();
  }
}

export const itemsService = new ItemsService();

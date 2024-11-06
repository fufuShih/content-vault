export interface Item {
  id: number;
  title: string;
  author?: string;
  description?: string;
  url: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface Feed {
  id: number;
  itemId?: number;
  feedUrl: string;
  lastFetched?: string;
  fetchInterval: number;
  isActive: boolean;
  settings: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UploadResult {
  success: boolean;
  item?: Item;
  error?: string;
}

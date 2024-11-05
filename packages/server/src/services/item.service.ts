import { db } from '../db';
import { items, type Item, type ItemInsert } from '../db/schema';
import { eq, like, desc, sql, and } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';
import glob from 'glob-promise';
import { FILE_CONSTANTS } from '../middleware/upload.middleware';

export interface FindAllParams {
  page: number;
  limit: number;
  search?: string;
  type?: string;
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

export class ItemsService {
  private readonly dataDirectory = FILE_CONSTANTS.UPLOAD_DIR;

  constructor() {
    // Ensure data directory exists
    fs.mkdir(this.dataDirectory, { recursive: true }).catch(console.error);
  }

  async findAll({ page, limit, search, type }: FindAllParams): Promise<PaginatedResponse<Item>> {
    const offset = (page - 1) * limit;
    const whereConditions = [];

    if (search) {
      whereConditions.push(like(items.title, `%${search}%`));
    }
    if (type) {
      whereConditions.push(eq(items.type, type));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [results, countResult] = await Promise.all([
      db
        .select()
        .from(items)
        .where(whereClause)
        .orderBy(desc(items.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({
          count: sql<number>`count(*)`
        })
        .from(items)
        .where(whereClause)
    ]);

    const total = Number(countResult[0].count);

    return {
      data: results,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number): Promise<Item | null> {
    const result = await db
      .select()
      .from(items)
      .where(eq(items.id, id))
      .limit(1);

    return result[0] || null;
  }

  async create(data: Omit<ItemInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<Item> {
    const [newItem] = await db
      .insert(items)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return newItem;
  }

  async update(
    id: number, 
    data: Partial<Omit<ItemInsert, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Item | null> {
    const [updatedItem] = await db
      .update(items)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(items.id, id))
      .returning();

    return updatedItem || null;
  }

  async delete(id: number): Promise<boolean> {
    const [deletedItem] = await db
      .delete(items)
      .where(eq(items.id, id))
      .returning();

    return !!deletedItem;
  }

  async getResource(id: number): Promise<{ filePath: string; mimeType: string } | null> {
    const item = await this.findById(id);
    
    if (!item?.url) return null;

    const filePath = path.join(this.dataDirectory, item.url);

    try {
      await fs.access(filePath);
      
      const mimeType = this.getMimeType(item.type);
      return { filePath, mimeType };
    } catch (error) {
      console.error(`File not found: ${filePath}`, error);
      return null;
    }
  }

  private getMimeType(type: string): string {
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      // 可以添加其他文件類型的 mime type
    };
    return mimeTypes[type] || 'application/octet-stream';
  }

  async scanDirectory(): Promise<{ added: number; updated: number; errors: string[] }> {
    const stats = { added: 0, updated: 0, errors: [] as string[] };

    try {
      const files = await glob('**/*', {
        cwd: this.dataDirectory,
        nodir: true,
        absolute: true
      });

      await Promise.all(files.map(async (filePath) => {
        try {
          const fileStats = await fs.stat(filePath);
          const relativePath = path.relative(this.dataDirectory, filePath);
          const fileExt = path.extname(filePath).toLowerCase();
          const type = this.getFileType(fileExt);
          
          const itemData = {
            title: path.basename(filePath, fileExt),
            type,
            url: relativePath,
            updatedAt: new Date(fileStats.mtime)
          };

          const existingItems = await db
            .select()
            .from(items)
            .where(eq(items.url, relativePath))
            .limit(1);

          if (existingItems.length > 0) {
            await this.update(existingItems[0].id, itemData);
            stats.updated++;
          } else {
            await this.create(itemData);
            stats.added++;
          }
        } catch (error) {
          const errorMessage = error instanceof Error 
            ? `Failed to process ${filePath}: ${error.message}`
            : `Failed to process ${filePath}: Unknown error`;
          console.error(errorMessage);
          stats.errors.push(errorMessage);
        }
      }));
    } catch (error) {
      const errorMessage = error instanceof Error 
            ? `General scan error: ${error.message}`
            : `General scan error: Unknown error`;
      console.error(errorMessage);
      stats.errors.push(errorMessage);
    }

    return stats;
  }

  private getFileType(extension: string): string {
    const typeMap: Record<string, string> = {
      '.pdf': 'pdf'
      // 可以添加其他文件類型
    };
    return typeMap[extension] || 'unknown';
  }

  async uploadFile(file: Express.Multer.File): Promise<UploadResult> {
    try {
      const relativePath = path.relative(this.dataDirectory, file.path);
      
      const newItem = await this.create({
        title: path.basename(file.originalname, path.extname(file.originalname)),
        type: 'pdf',
        url: relativePath
      });

      return { success: true, item: newItem };
    } catch (error) {
      try {
        await fs.unlink(file.path);
      } catch (unlinkError) {
        console.error('Failed to delete file after failed upload:', unlinkError);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown Error"
      };
    }
  }

  async uploadFiles(files: Express.Multer.File[]): Promise<UploadResult[]> {
    return await Promise.all(
      files.map(file => this.uploadFile(file))
    );
  }
}

export const itemsService = new ItemsService();

import { db } from '../db';
import { items, type Item, type ItemInsert } from '../db/schema';
import { eq, like, desc, sql, and } from 'drizzle-orm';

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

export class ItemsService {
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
}

export const itemsService = new ItemsService();

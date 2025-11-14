/**
 * Category repository - Data access layer for transaction categories
 */

import { query, queryOne } from './db.js';
import type { Category, CreateCategoryInput, CategoryType } from '../types/index.js';

/**
 * Create a new category
 */
export async function createCategory(data: CreateCategoryInput): Promise<Category> {
  const sql = `
    INSERT INTO categories (user_id, name, type, color, icon, parent_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const result = await queryOne<Category>(sql, [
    data.user_id || null,
    data.name,
    data.type,
    data.color || null,
    data.icon || null,
    data.parent_id || null,
  ]);

  if (!result) {
    throw new Error('Failed to create category');
  }

  return result;
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  const sql = 'SELECT * FROM categories WHERE id = $1';
  return queryOne<Category>(sql, [id]);
}

/**
 * List categories
 */
export async function listCategories(params?: {
  userId?: string | null;
  type?: CategoryType;
  includeSystem?: boolean;
}): Promise<Category[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (params?.userId !== undefined) {
    if (params.userId === null) {
      // Get only system categories
      conditions.push('user_id IS NULL');
    } else {
      // Get user-specific and optionally system categories
      if (params.includeSystem !== false) {
        conditions.push(`(user_id = $${paramIndex} OR user_id IS NULL)`);
        values.push(params.userId);
        paramIndex++;
      } else {
        conditions.push(`user_id = $${paramIndex}`);
        values.push(params.userId);
        paramIndex++;
      }
    }
  }

  if (params?.type) {
    conditions.push(`type = $${paramIndex}`);
    values.push(params.type);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT * FROM categories
    ${whereClause}
    ORDER BY is_system DESC, name ASC
  `;

  return query<Category>(sql, values);
}

/**
 * Get system categories
 */
export async function getSystemCategories(type?: CategoryType): Promise<Category[]> {
  const sql = type
    ? 'SELECT * FROM categories WHERE is_system = true AND type = $1 ORDER BY name ASC'
    : 'SELECT * FROM categories WHERE is_system = true ORDER BY type, name ASC';

  return type ? query<Category>(sql, [type]) : query<Category>(sql);
}

/**
 * Get user categories
 */
export async function getUserCategories(
  userId: string,
  type?: CategoryType
): Promise<Category[]> {
  const sql = type
    ? 'SELECT * FROM categories WHERE user_id = $1 AND type = $2 ORDER BY name ASC'
    : 'SELECT * FROM categories WHERE user_id = $1 ORDER BY type, name ASC';

  return type ? query<Category>(sql, [userId, type]) : query<Category>(sql, [userId]);
}

/**
 * Get all categories for a user (system + user-specific)
 */
export async function getAllCategoriesForUser(
  userId: string,
  type?: CategoryType
): Promise<Category[]> {
  return listCategories({
    userId,
    type,
    includeSystem: true,
  });
}

/**
 * Update category
 */
export async function updateCategory(
  id: string,
  data: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>
): Promise<Category | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (updates.length === 0) {
    return getCategoryById(id);
  }

  values.push(id);

  const sql = `
    UPDATE categories
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex} AND is_system = false
    RETURNING *
  `;

  return queryOne<Category>(sql, values);
}

/**
 * Delete category
 */
export async function deleteCategory(id: string): Promise<void> {
  // Only allow deletion of user categories (not system categories)
  const sql = 'DELETE FROM categories WHERE id = $1 AND is_system = false';
  await query(sql, [id]);
}

/**
 * Get subcategories
 */
export async function getSubcategories(parentId: string): Promise<Category[]> {
  const sql = `
    SELECT * FROM categories
    WHERE parent_id = $1
    ORDER BY name ASC
  `;

  return query<Category>(sql, [parentId]);
}

/**
 * Check if category exists by name
 */
export async function categoryExistsByName(
  name: string,
  userId?: string | null
): Promise<boolean> {
  const sql = userId
    ? 'SELECT COUNT(*) as count FROM categories WHERE name = $1 AND (user_id = $2 OR user_id IS NULL)'
    : 'SELECT COUNT(*) as count FROM categories WHERE name = $1 AND user_id IS NULL';

  const result = userId
    ? await queryOne<{ count: string }>(sql, [name, userId])
    : await queryOne<{ count: string }>(sql, [name]);

  return Number.parseInt(result?.count || '0', 10) > 0;
}

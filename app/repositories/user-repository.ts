/**
 * User repository - Data access layer for users
 */

import { query, queryOne } from './db.js';
import type { User, CreateUserInput } from '../types/index.js';

/**
 * Create a new user
 */
export async function createUser(data: CreateUserInput): Promise<User> {
  const sql = `
    INSERT INTO users (email, name, phone)
    VALUES ($1, $2, $3)
    RETURNING *
  `;

  const result = await queryOne<User>(sql, [
    data.email,
    data.name,
    data.phone || null,
  ]);

  if (!result) {
    throw new Error('Failed to create user');
  }

  return result;
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const sql = 'SELECT * FROM users WHERE id = $1';
  return queryOne<User>(sql, [id]);
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const sql = 'SELECT * FROM users WHERE email = $1';
  return queryOne<User>(sql, [email]);
}

/**
 * Get user by phone
 */
export async function getUserByPhone(phone: string): Promise<User | null> {
  const sql = 'SELECT * FROM users WHERE phone = $1';
  return queryOne<User>(sql, [phone]);
}

/**
 * Update user
 */
export async function updateUser(
  id: string,
  data: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
): Promise<User | null> {
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
    return getUserById(id);
  }

  values.push(id);

  const sql = `
    UPDATE users
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  return queryOne<User>(sql, values);
}

/**
 * Delete user
 */
export async function deleteUser(id: string): Promise<void> {
  const sql = 'DELETE FROM users WHERE id = $1';
  await query(sql, [id]);
}

/**
 * List all users (admin function)
 */
export async function listUsers(params?: {
  page?: number;
  limit?: number;
}): Promise<{ users: User[]; total: number }> {
  const page = params?.page && params.page > 0 ? params.page : 1;
  const limit = params?.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;
  const offset = (page - 1) * limit;

  // Get total count
  const countResult = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM users');
  const total = Number.parseInt(countResult?.count || '0', 10);

  // Get paginated results
  const sql = `
    SELECT * FROM users
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
  `;

  const users = await query<User>(sql, [limit, offset]);

  return { users, total };
}

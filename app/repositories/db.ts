/**
 * Database connection and query utilities
 * Provides a pool-based PostgreSQL connection with helper functions
 */

import pg from 'pg';
import { getConfig } from '../config/env.js';

const { Pool } = pg;

let pool: pg.Pool;

/**
 * Initialize the database connection pool
 */
export function initDb(): pg.Pool {
  if (pool) {
    return pool;
  }

  const config = getConfig();

  pool = new Pool({
    connectionString: config.database.url,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
  });

  return pool;
}

/**
 * Get the database pool instance
 */
function getPool(): pg.Pool {
  if (!pool) {
    initDb();
  }
  return pool;
}

/**
 * Execute a query and return all rows
 */
export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const client = getPool();
  const result = await client.query(text, params);
  return result.rows as T[];
}

/**
 * Execute a query and return a single row (or null)
 */
export async function queryOne<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const client = getPool();
  const result = await client.query(text, params);
  return result.rows[0] as T || null;
}

/**
 * Execute a transaction with multiple queries
 * Automatically commits on success or rolls back on error
 */
export async function transaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close the database pool
 * Should be called when shutting down the application
 */
export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
  }
}

/**
 * Helper function to build WHERE clause from filters
 */
export function buildWhereClause(
  filters: Record<string, unknown>,
  startIndex = 1
): { clause: string; values: unknown[] } {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let index = startIndex;

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      conditions.push(`${key} = $${index}`);
      values.push(value);
      index++;
    }
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, values };
}

/**
 * Helper function to build pagination clause
 */
export function buildPaginationClause(params: {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}): { clause: string; offset: number; limit: number } {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;
  const offset = (page - 1) * limit;

  const sortBy = params.sort_by || 'created_at';
  const sortOrder = params.sort_order === 'asc' ? 'ASC' : 'DESC';

  const clause = `ORDER BY ${sortBy} ${sortOrder} LIMIT ${limit} OFFSET ${offset}`;

  return { clause, offset, limit };
}

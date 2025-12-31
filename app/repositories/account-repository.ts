/**
 * Account repository - Data access layer for bank accounts
 */

import { query, queryOne } from './db.js';
import type { Account, CreateAccountInput, UpdateAccountInput } from '../types/index.js';

/**
 * Create a new account
 */
export async function createAccount(data: CreateAccountInput): Promise<Account> {
  const sql = `
    INSERT INTO accounts (
      user_id, name, type, balance, currency, institution, account_number
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const result = await queryOne<Account>(sql, [
    data.user_id,
    data.name,
    data.type,
    data.balance ?? 0,
    data.currency ?? 'USD',
    data.institution || null,
    data.account_number || null,
  ]);

  if (!result) {
    throw new Error('Failed to create account');
  }

  return result;
}

/**
 * Get account by ID
 */
export async function getAccountById(id: string): Promise<Account | null> {
  const sql = 'SELECT * FROM accounts WHERE id = $1';
  return queryOne<Account>(sql, [id]);
}

/**
 * List accounts for a user
 */
export async function listAccountsByUser(
  userId: string,
  activeOnly = true
): Promise<Account[]> {
  const sql = activeOnly
    ? 'SELECT * FROM accounts WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC'
    : 'SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at DESC';

  return query<Account>(sql, [userId]);
}

/**
 * Update account
 */
export async function updateAccount(
  id: string,
  data: UpdateAccountInput
): Promise<Account | null> {
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
    return getAccountById(id);
  }

  values.push(id);

  const sql = `
    UPDATE accounts
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  return queryOne<Account>(sql, values);
}

/**
 * Update account balance
 */
export async function updateAccountBalance(
  id: string,
  newBalance: number
): Promise<Account | null> {
  const sql = `
    UPDATE accounts
    SET balance = $1
    WHERE id = $2
    RETURNING *
  `;

  return queryOne<Account>(sql, [newBalance, id]);
}

/**
 * Soft delete account
 */
export async function deactivateAccount(id: string): Promise<Account | null> {
  const sql = `
    UPDATE accounts
    SET is_active = false
    WHERE id = $1
    RETURNING *
  `;

  return queryOne<Account>(sql, [id]);
}

/**
 * Hard delete account
 */
export async function deleteAccount(id: string): Promise<void> {
  const sql = 'DELETE FROM accounts WHERE id = $1';
  await query(sql, [id]);
}

/**
 * Get total cash balance for a user
 */
export async function getTotalCashBalance(userId: string): Promise<number> {
  const sql = `
    SELECT COALESCE(SUM(balance), 0) as total
    FROM accounts
    WHERE user_id = $1 AND is_active = true
  `;

  const result = await queryOne<{ total: string }>(sql, [userId]);
  return Number.parseFloat(result?.total || '0');
}

/**
 * Get accounts summary by type
 */
export async function getAccountsSummaryByType(userId: string): Promise<
  Array<{
    type: string;
    count: number;
    total_balance: number;
  }>
> {
  const sql = `
    SELECT
      type,
      COUNT(*) as count,
      SUM(balance) as total_balance
    FROM accounts
    WHERE user_id = $1 AND is_active = true
    GROUP BY type
    ORDER BY total_balance DESC
  `;

  const results = await query<{
    type: string;
    count: string;
    total_balance: string;
  }>(sql, [userId]);

  return results.map((r) => ({
    type: r.type,
    count: Number.parseInt(r.count, 10),
    total_balance: Number.parseFloat(r.total_balance),
  }));
}

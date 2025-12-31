/**
 * Debt repository - Data access layer for debts
 */

import type { CreateDebtInput, Debt, DebtTermType } from '../types/index.js';
import { query, queryOne } from './db.js';

/**
 * Create a new debt
 */
export async function createDebt(data: CreateDebtInput): Promise<Debt> {
  const sql = `
    INSERT INTO debts (
      user_id, name, type, category, principal_amount, current_balance,
      interest_rate, minimum_payment, due_date, lender
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;

  const result = await queryOne<Debt>(sql, [
    data.user_id,
    data.name,
    data.type,
    data.category,
    data.principal_amount,
    data.current_balance,
    data.interest_rate || null,
    data.minimum_payment || null,
    data.due_date || null,
    data.lender || null,
  ]);

  if (!result) {
    throw new Error('Failed to create debt');
  }

  return result;
}

/**
 * Get debt by ID
 */
export async function getDebtById(id: string): Promise<Debt | null> {
  const sql = 'SELECT * FROM debts WHERE id = $1';
  return queryOne<Debt>(sql, [id]);
}

/**
 * List debts for a user
 */
export async function listDebtsByUser(
  userId: string,
  params?: {
    type?: DebtTermType;
    activeOnly?: boolean;
  }
): Promise<Debt[]> {
  const conditions: string[] = ['user_id = $1'];
  const values: unknown[] = [userId];
  let paramIndex = 2;

  if (params?.type) {
    conditions.push(`type = $${paramIndex}`);
    values.push(params.type);
    paramIndex++;
  }

  if (params?.activeOnly !== false) {
    conditions.push('is_active = true');
  }

  const sql = `
    SELECT * FROM debts
    WHERE ${conditions.join(' AND ')}
    ORDER BY current_balance DESC
  `;

  return query<Debt>(sql, values);
}

/**
 * Update debt
 */
export async function updateDebt(
  id: string,
  data: Partial<Omit<Debt, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<Debt | null> {
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
    return getDebtById(id);
  }

  values.push(id);

  const sql = `
    UPDATE debts
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  return queryOne<Debt>(sql, values);
}

/**
 * Update debt balance
 */
export async function updateDebtBalance(id: string, newBalance: number): Promise<Debt | null> {
  const sql = `
    UPDATE debts
    SET current_balance = $1
    WHERE id = $2
    RETURNING *
  `;

  return queryOne<Debt>(sql, [newBalance, id]);
}

/**
 * Make payment on debt
 */
export async function makeDebtPayment(id: string, paymentAmount: number): Promise<Debt | null> {
  const sql = `
    UPDATE debts
    SET current_balance = GREATEST(0, current_balance - $1)
    WHERE id = $2
    RETURNING *
  `;

  return queryOne<Debt>(sql, [paymentAmount, id]);
}

/**
 * Soft delete debt (mark as paid off)
 */
export async function deactivateDebt(id: string): Promise<Debt | null> {
  const sql = `
    UPDATE debts
    SET is_active = false
    WHERE id = $1
    RETURNING *
  `;

  return queryOne<Debt>(sql, [id]);
}

/**
 * Hard delete debt
 */
export async function deleteDebt(id: string): Promise<void> {
  const sql = 'DELETE FROM debts WHERE id = $1';
  await query(sql, [id]);
}

/**
 * Get total debt for a user
 */
export async function getTotalDebt(userId: string): Promise<number> {
  const sql = `
    SELECT COALESCE(SUM(current_balance), 0) as total
    FROM debts
    WHERE user_id = $1 AND is_active = true
  `;

  const result = await queryOne<{ total: string }>(sql, [userId]);
  return Number.parseFloat(result?.total || '0');
}

/**
 * Get debts summary by type
 */
export async function getDebtsSummaryByType(userId: string): Promise<
  Array<{
    type: DebtTermType;
    count: number;
    total_balance: number;
  }>
> {
  const sql = `
    SELECT
      type,
      COUNT(*) as count,
      SUM(current_balance) as total_balance
    FROM debts
    WHERE user_id = $1 AND is_active = true
    GROUP BY type
    ORDER BY total_balance DESC
  `;

  const results = await query<{
    type: DebtTermType;
    count: string;
    total_balance: string;
  }>(sql, [userId]);

  return results.map((r) => ({
    type: r.type,
    count: Number.parseInt(r.count, 10),
    total_balance: Number.parseFloat(r.total_balance),
  }));
}

/**
 * Get upcoming debt payments (within next 30 days)
 */
export async function getUpcomingDebtPayments(userId: string): Promise<Debt[]> {
  const sql = `
    SELECT * FROM debts
    WHERE user_id = $1
      AND is_active = true
      AND due_date IS NOT NULL
      AND due_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
    ORDER BY due_date ASC
  `;

  return query<Debt>(sql, [userId]);
}

/**
 * Get overdue debts
 */
export async function getOverdueDebts(userId: string): Promise<Debt[]> {
  const sql = `
    SELECT * FROM debts
    WHERE user_id = $1
      AND is_active = true
      AND due_date IS NOT NULL
      AND due_date < CURRENT_DATE
    ORDER BY due_date ASC
  `;

  return query<Debt>(sql, [userId]);
}

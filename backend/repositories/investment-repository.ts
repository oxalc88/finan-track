/**
 * Investment repository - Data access layer for investments
 */

import type { CreateInvestmentInput, Investment, InvestmentType } from '../types/index.js';
import { query, queryOne } from './db.js';

/**
 * Create a new investment
 */
export async function createInvestment(data: CreateInvestmentInput): Promise<Investment> {
  const sql = `
    INSERT INTO investments (
      user_id, type, name, symbol, quantity, purchase_price,
      current_value, currency, purchase_date, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;

  const result = await queryOne<Investment>(sql, [
    data.user_id,
    data.type,
    data.name,
    data.symbol || null,
    data.quantity || null,
    data.purchase_price || null,
    data.current_value,
    data.currency ?? 'USD',
    data.purchase_date || null,
    data.notes || null,
  ]);

  if (!result) {
    throw new Error('Failed to create investment');
  }

  return result;
}

/**
 * Get investment by ID
 */
export async function getInvestmentById(id: string): Promise<Investment | null> {
  const sql = 'SELECT * FROM investments WHERE id = $1';
  return queryOne<Investment>(sql, [id]);
}

/**
 * List investments for a user
 */
export async function listInvestmentsByUser(
  userId: string,
  params?: {
    type?: InvestmentType;
    activeOnly?: boolean;
  }
): Promise<Investment[]> {
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
    SELECT * FROM investments
    WHERE ${conditions.join(' AND ')}
    ORDER BY current_value DESC
  `;

  return query<Investment>(sql, values);
}

/**
 * Update investment
 */
export async function updateInvestment(
  id: string,
  data: Partial<Omit<Investment, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<Investment | null> {
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
    return getInvestmentById(id);
  }

  values.push(id);

  const sql = `
    UPDATE investments
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  return queryOne<Investment>(sql, values);
}

/**
 * Update investment current value
 */
export async function updateInvestmentValue(
  id: string,
  currentValue: number
): Promise<Investment | null> {
  const sql = `
    UPDATE investments
    SET current_value = $1
    WHERE id = $2
    RETURNING *
  `;

  return queryOne<Investment>(sql, [currentValue, id]);
}

/**
 * Soft delete investment
 */
export async function deactivateInvestment(id: string): Promise<Investment | null> {
  const sql = `
    UPDATE investments
    SET is_active = false
    WHERE id = $1
    RETURNING *
  `;

  return queryOne<Investment>(sql, [id]);
}

/**
 * Hard delete investment
 */
export async function deleteInvestment(id: string): Promise<void> {
  const sql = 'DELETE FROM investments WHERE id = $1';
  await query(sql, [id]);
}

/**
 * Get total investment value for a user
 */
export async function getTotalInvestmentValue(userId: string): Promise<number> {
  const sql = `
    SELECT COALESCE(SUM(current_value), 0) as total
    FROM investments
    WHERE user_id = $1 AND is_active = true
  `;

  const result = await queryOne<{ total: string }>(sql, [userId]);
  return Number.parseFloat(result?.total || '0');
}

/**
 * Get investments summary by type
 */
export async function getInvestmentsSummaryByType(userId: string): Promise<
  Array<{
    type: InvestmentType;
    count: number;
    total_value: number;
    total_cost: number;
    gain_loss: number;
    gain_loss_percentage: number;
  }>
> {
  const sql = `
    SELECT
      type,
      COUNT(*) as count,
      SUM(current_value) as total_value,
      SUM(COALESCE(purchase_price * quantity, 0)) as total_cost,
      SUM(current_value) - SUM(COALESCE(purchase_price * quantity, 0)) as gain_loss,
      CASE
        WHEN SUM(COALESCE(purchase_price * quantity, 0)) > 0
        THEN ((SUM(current_value) - SUM(COALESCE(purchase_price * quantity, 0))) / SUM(COALESCE(purchase_price * quantity, 0))) * 100
        ELSE 0
      END as gain_loss_percentage
    FROM investments
    WHERE user_id = $1 AND is_active = true
    GROUP BY type
    ORDER BY total_value DESC
  `;

  const results = await query<{
    type: InvestmentType;
    count: string;
    total_value: string;
    total_cost: string;
    gain_loss: string;
    gain_loss_percentage: string;
  }>(sql, [userId]);

  return results.map((r) => ({
    type: r.type,
    count: Number.parseInt(r.count, 10),
    total_value: Number.parseFloat(r.total_value),
    total_cost: Number.parseFloat(r.total_cost),
    gain_loss: Number.parseFloat(r.gain_loss),
    gain_loss_percentage: Number.parseFloat(r.gain_loss_percentage),
  }));
}

/**
 * Get investment performance
 */
export async function getInvestmentPerformance(userId: string): Promise<{
  total_value: number;
  total_cost: number;
  total_gain_loss: number;
  total_gain_loss_percentage: number;
}> {
  const sql = `
    SELECT
      SUM(current_value) as total_value,
      SUM(COALESCE(purchase_price * quantity, 0)) as total_cost,
      SUM(current_value) - SUM(COALESCE(purchase_price * quantity, 0)) as total_gain_loss,
      CASE
        WHEN SUM(COALESCE(purchase_price * quantity, 0)) > 0
        THEN ((SUM(current_value) - SUM(COALESCE(purchase_price * quantity, 0))) / SUM(COALESCE(purchase_price * quantity, 0))) * 100
        ELSE 0
      END as total_gain_loss_percentage
    FROM investments
    WHERE user_id = $1 AND is_active = true
  `;

  const result = await queryOne<{
    total_value: string;
    total_cost: string;
    total_gain_loss: string;
    total_gain_loss_percentage: string;
  }>(sql, [userId]);

  return {
    total_value: Number.parseFloat(result?.total_value || '0'),
    total_cost: Number.parseFloat(result?.total_cost || '0'),
    total_gain_loss: Number.parseFloat(result?.total_gain_loss || '0'),
    total_gain_loss_percentage: Number.parseFloat(result?.total_gain_loss_percentage || '0'),
  };
}

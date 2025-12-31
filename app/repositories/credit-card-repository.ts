/**
 * Credit card repository - Data access layer for credit cards
 */

import type { CreateCreditCardInput, CreditCard, UpdateCreditCardInput } from '../types/index.js';
import { query, queryOne } from './db.js';

/**
 * Create a new credit card
 */
export async function createCreditCard(data: CreateCreditCardInput): Promise<CreditCard> {
  const sql = `
    INSERT INTO credit_cards (
      user_id, name, last_four, issuer, current_balance, credit_limit,
      minimum_payment, due_date, statement_closing_date, apr
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;

  const result = await queryOne<CreditCard>(sql, [
    data.user_id,
    data.name,
    data.last_four || null,
    data.issuer || null,
    data.current_balance ?? 0,
    data.credit_limit,
    data.minimum_payment || null,
    data.due_date || null,
    data.statement_closing_date || null,
    data.apr || null,
  ]);

  if (!result) {
    throw new Error('Failed to create credit card');
  }

  return result;
}

/**
 * Get credit card by ID
 */
export async function getCreditCardById(id: string): Promise<CreditCard | null> {
  const sql = 'SELECT * FROM credit_cards WHERE id = $1';
  return queryOne<CreditCard>(sql, [id]);
}

/**
 * List credit cards for a user
 */
export async function listCreditCardsByUser(
  userId: string,
  activeOnly = true
): Promise<CreditCard[]> {
  const sql = activeOnly
    ? 'SELECT * FROM credit_cards WHERE user_id = $1 AND is_active = true ORDER BY name ASC'
    : 'SELECT * FROM credit_cards WHERE user_id = $1 ORDER BY name ASC';

  return query<CreditCard>(sql, [userId]);
}

/**
 * Update credit card
 */
export async function updateCreditCard(
  id: string,
  data: UpdateCreditCardInput
): Promise<CreditCard | null> {
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
    return getCreditCardById(id);
  }

  values.push(id);

  const sql = `
    UPDATE credit_cards
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  return queryOne<CreditCard>(sql, values);
}

/**
 * Update credit card balance
 */
export async function updateCreditCardBalance(
  id: string,
  newBalance: number
): Promise<CreditCard | null> {
  const sql = `
    UPDATE credit_cards
    SET current_balance = $1
    WHERE id = $2
    RETURNING *
  `;

  return queryOne<CreditCard>(sql, [newBalance, id]);
}

/**
 * Make payment on credit card
 */
export async function makeCreditCardPayment(
  id: string,
  paymentAmount: number
): Promise<CreditCard | null> {
  const sql = `
    UPDATE credit_cards
    SET current_balance = GREATEST(0, current_balance - $1)
    WHERE id = $2
    RETURNING *
  `;

  return queryOne<CreditCard>(sql, [paymentAmount, id]);
}

/**
 * Soft delete credit card
 */
export async function deactivateCreditCard(id: string): Promise<CreditCard | null> {
  const sql = `
    UPDATE credit_cards
    SET is_active = false
    WHERE id = $1
    RETURNING *
  `;

  return queryOne<CreditCard>(sql, [id]);
}

/**
 * Hard delete credit card
 */
export async function deleteCreditCard(id: string): Promise<void> {
  const sql = 'DELETE FROM credit_cards WHERE id = $1';
  await query(sql, [id]);
}

/**
 * Get upcoming credit card payments (within next 30 days)
 */
export async function getUpcomingCreditCardPayments(userId: string): Promise<CreditCard[]> {
  const sql = `
    SELECT * FROM credit_cards
    WHERE user_id = $1
      AND is_active = true
      AND due_date IS NOT NULL
      AND due_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
    ORDER BY due_date ASC
  `;

  return query<CreditCard>(sql, [userId]);
}

/**
 * Get overdue credit cards
 */
export async function getOverdueCreditCards(userId: string): Promise<CreditCard[]> {
  const sql = `
    SELECT * FROM credit_cards
    WHERE user_id = $1
      AND is_active = true
      AND due_date IS NOT NULL
      AND due_date < CURRENT_DATE
      AND current_balance > 0
    ORDER BY due_date ASC
  `;

  return query<CreditCard>(sql, [userId]);
}

/**
 * Get credit cards with high utilization (>70%)
 */
export async function getHighUtilizationCards(userId: string): Promise<CreditCard[]> {
  const sql = `
    SELECT * FROM credit_cards
    WHERE user_id = $1
      AND is_active = true
      AND utilization_percentage > 70
    ORDER BY utilization_percentage DESC
  `;

  return query<CreditCard>(sql, [userId]);
}

/**
 * Get best card to use next (lowest utilization)
 */
export async function getBestCardToUse(userId: string): Promise<CreditCard | null> {
  const sql = `
    SELECT * FROM credit_cards
    WHERE user_id = $1
      AND is_active = true
      AND available_credit > 0
    ORDER BY utilization_percentage ASC, available_credit DESC
    LIMIT 1
  `;

  return queryOne<CreditCard>(sql, [userId]);
}

/**
 * Get total credit card balances and limits
 */
export async function getCreditCardSummary(userId: string): Promise<{
  total_balance: number;
  total_limit: number;
  total_available: number;
  average_utilization: number;
  card_count: number;
}> {
  const sql = `
    SELECT
      COALESCE(SUM(current_balance), 0) as total_balance,
      COALESCE(SUM(credit_limit), 0) as total_limit,
      COALESCE(SUM(available_credit), 0) as total_available,
      COALESCE(AVG(utilization_percentage), 0) as average_utilization,
      COUNT(*) as card_count
    FROM credit_cards
    WHERE user_id = $1 AND is_active = true
  `;

  const result = await queryOne<{
    total_balance: string;
    total_limit: string;
    total_available: string;
    average_utilization: string;
    card_count: string;
  }>(sql, [userId]);

  return {
    total_balance: Number.parseFloat(result?.total_balance || '0'),
    total_limit: Number.parseFloat(result?.total_limit || '0'),
    total_available: Number.parseFloat(result?.total_available || '0'),
    average_utilization: Number.parseFloat(result?.average_utilization || '0'),
    card_count: Number.parseInt(result?.card_count || '0', 10),
  };
}

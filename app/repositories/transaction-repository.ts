/**
 * Transaction repository - Data access layer for transactions
 */

import { query, queryOne, buildPaginationClause } from './db.js';
import type {
  Transaction,
  CreateTransactionInput,
  TransactionType,
} from '../types/index.js';

/**
 * Create a new transaction
 */
export async function createTransaction(
  data: CreateTransactionInput
): Promise<Transaction> {
  const sql = `
    INSERT INTO transactions (
      user_id, account_id, category_id, invoice_id, type,
      amount, currency, description, transaction_date, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;

  const result = await queryOne<Transaction>(sql, [
    data.user_id,
    data.account_id || null,
    data.category_id || null,
    data.invoice_id || null,
    data.type,
    data.amount,
    data.currency || 'USD',
    data.description || null,
    data.transaction_date,
    data.notes || null,
  ]);

  if (!result) {
    throw new Error('Failed to create transaction');
  }

  return result;
}

/**
 * Get transaction by ID
 */
export async function getTransactionById(id: string): Promise<Transaction | null> {
  const sql = 'SELECT * FROM transactions WHERE id = $1';
  return queryOne<Transaction>(sql, [id]);
}

/**
 * List transactions for a user with filters and pagination
 */
export async function listTransactions(params: {
  user_id: string;
  account_id?: string;
  category_id?: string;
  type?: TransactionType;
  start_date?: Date;
  end_date?: Date;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}): Promise<{ transactions: Transaction[]; total: number }> {
  const conditions: string[] = ['user_id = $1'];
  const values: unknown[] = [params.user_id];
  let paramIndex = 2;

  if (params.account_id) {
    conditions.push(`account_id = $${paramIndex}`);
    values.push(params.account_id);
    paramIndex++;
  }

  if (params.category_id) {
    conditions.push(`category_id = $${paramIndex}`);
    values.push(params.category_id);
    paramIndex++;
  }

  if (params.type) {
    conditions.push(`type = $${paramIndex}`);
    values.push(params.type);
    paramIndex++;
  }

  if (params.start_date) {
    conditions.push(`transaction_date >= $${paramIndex}`);
    values.push(params.start_date);
    paramIndex++;
  }

  if (params.end_date) {
    conditions.push(`transaction_date <= $${paramIndex}`);
    values.push(params.end_date);
    paramIndex++;
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  // Get total count
  const countSql = `SELECT COUNT(*) as count FROM transactions ${whereClause}`;
  const countResult = await queryOne<{ count: string }>(countSql, values);
  const total = Number.parseInt(countResult?.count || '0', 10);

  // Get paginated results
  const { clause: paginationClause } = buildPaginationClause({
    page: params.page,
    limit: params.limit,
    sort_by: params.sort_by || 'transaction_date',
    sort_order: params.sort_order || 'desc',
  });

  const sql = `
    SELECT * FROM transactions
    ${whereClause}
    ${paginationClause}
  `;

  const transactions = await query<Transaction>(sql, values);

  return { transactions, total };
}

/**
 * Delete transaction
 */
export async function deleteTransaction(id: string): Promise<void> {
  const sql = 'DELETE FROM transactions WHERE id = $1';
  await query(sql, [id]);
}

/**
 * Get cash flow summary for a period
 */
export async function getCashFlowSummary(params: {
  user_id: string;
  start_date: Date;
  end_date: Date;
  group_by?: 'day' | 'week' | 'month' | 'year';
}): Promise<Array<{ period: string; income: number; expenses: number; net: number }>> {
  const groupByFormat = {
    day: 'YYYY-MM-DD',
    week: 'YYYY-"W"IW',
    month: 'YYYY-MM',
    year: 'YYYY',
  }[params.group_by || 'month'];

  const sql = `
    SELECT
      TO_CHAR(transaction_date, $1) as period,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses,
      SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net
    FROM transactions
    WHERE user_id = $2
      AND transaction_date >= $3
      AND transaction_date <= $4
    GROUP BY period
    ORDER BY period ASC
  `;

  const results = await query<{
    period: string;
    income: string;
    expenses: string;
    net: string;
  }>(sql, [groupByFormat, params.user_id, params.start_date, params.end_date]);

  return results.map(r => ({
    period: r.period,
    income: Number.parseFloat(r.income),
    expenses: Number.parseFloat(r.expenses),
    net: Number.parseFloat(r.net),
  }));
}

/**
 * Get category breakdown
 */
export async function getCategoryBreakdown(params: {
  user_id: string;
  start_date: Date;
  end_date: Date;
  type?: TransactionType;
}): Promise<Array<{
  category_id: string;
  category_name: string;
  amount: number;
  transaction_count: number;
}>> {
  const conditions = ['t.user_id = $1', 't.transaction_date >= $2', 't.transaction_date <= $3'];
  const values: unknown[] = [params.user_id, params.start_date, params.end_date];

  if (params.type) {
    conditions.push('t.type = $4');
    values.push(params.type);
  }

  const sql = `
    SELECT
      t.category_id,
      c.name as category_name,
      SUM(t.amount) as amount,
      COUNT(*) as transaction_count
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE ${conditions.join(' AND ')}
    GROUP BY t.category_id, c.name
    ORDER BY amount DESC
  `;

  const results = await query<{
    category_id: string;
    category_name: string;
    amount: string;
    transaction_count: string;
  }>(sql, values);

  return results.map(r => ({
    category_id: r.category_id,
    category_name: r.category_name,
    amount: Number.parseFloat(r.amount),
    transaction_count: Number.parseInt(r.transaction_count, 10),
  }));
}

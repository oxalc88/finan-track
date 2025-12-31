/**
 * Alert repository - Data access layer for notifications and alerts
 */

import type { Alert, AlertPriority, AlertType, CreateAlertInput } from '../types/index.js';
import { query, queryOne } from './db.js';

/**
 * Create a new alert
 */
export async function createAlert(data: CreateAlertInput): Promise<Alert> {
  const sql = `
    INSERT INTO alerts (
      user_id, type, priority, title, message,
      related_entity_type, related_entity_id, scheduled_for
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const result = await queryOne<Alert>(sql, [
    data.user_id,
    data.type,
    data.priority ?? 'medium',
    data.title,
    data.message,
    data.related_entity_type || null,
    data.related_entity_id || null,
    data.scheduled_for || null,
  ]);

  if (!result) {
    throw new Error('Failed to create alert');
  }

  return result;
}

/**
 * Get alert by ID
 */
export async function getAlertById(id: string): Promise<Alert | null> {
  const sql = 'SELECT * FROM alerts WHERE id = $1';
  return queryOne<Alert>(sql, [id]);
}

/**
 * List alerts for a user
 */
export async function listAlertsByUser(
  userId: string,
  params?: {
    type?: AlertType;
    priority?: AlertPriority;
    isRead?: boolean;
    limit?: number;
  }
): Promise<Alert[]> {
  const conditions: string[] = ['user_id = $1'];
  const values: unknown[] = [userId];
  let paramIndex = 2;

  if (params?.type) {
    conditions.push(`type = $${paramIndex}`);
    values.push(params.type);
    paramIndex++;
  }

  if (params?.priority) {
    conditions.push(`priority = $${paramIndex}`);
    values.push(params.priority);
    paramIndex++;
  }

  if (params?.isRead !== undefined) {
    conditions.push(`is_read = $${paramIndex}`);
    values.push(params.isRead);
    paramIndex++;
  }

  const limit = params?.limit ?? 50;
  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const sql = `
    SELECT * FROM alerts
    ${whereClause}
    ORDER BY
      CASE WHEN priority = 'high' THEN 1
           WHEN priority = 'medium' THEN 2
           ELSE 3
      END,
      created_at DESC
    LIMIT ${limit}
  `;

  return query<Alert>(sql, values);
}

/**
 * Get unread alerts for a user
 */
export async function getUnreadAlerts(userId: string): Promise<Alert[]> {
  return listAlertsByUser(userId, { isRead: false });
}

/**
 * Get upcoming alerts (scheduled but not yet sent)
 */
export async function getUpcomingAlerts(userId?: string): Promise<Alert[]> {
  const sql = userId
    ? `
      SELECT * FROM alerts
      WHERE user_id = $1
        AND is_read = false
        AND scheduled_for IS NOT NULL
        AND scheduled_for <= CURRENT_TIMESTAMP
      ORDER BY scheduled_for ASC
    `
    : `
      SELECT * FROM alerts
      WHERE is_read = false
        AND scheduled_for IS NOT NULL
        AND scheduled_for <= CURRENT_TIMESTAMP
      ORDER BY scheduled_for ASC
    `;

  return userId ? query<Alert>(sql, [userId]) : query<Alert>(sql);
}

/**
 * Mark alert as read
 */
export async function markAlertAsRead(id: string): Promise<Alert | null> {
  const sql = `
    UPDATE alerts
    SET is_read = true
    WHERE id = $1
    RETURNING *
  `;

  return queryOne<Alert>(sql, [id]);
}

/**
 * Mark all alerts as read for a user
 */
export async function markAllAlertsAsRead(userId: string): Promise<void> {
  const sql = `
    UPDATE alerts
    SET is_read = true
    WHERE user_id = $1 AND is_read = false
  `;

  await query(sql, [userId]);
}

/**
 * Delete alert
 */
export async function deleteAlert(id: string): Promise<void> {
  const sql = 'DELETE FROM alerts WHERE id = $1';
  await query(sql, [id]);
}

/**
 * Delete old read alerts (cleanup)
 */
export async function deleteOldReadAlerts(daysOld = 30): Promise<number> {
  const sql = `
    DELETE FROM alerts
    WHERE is_read = true
      AND created_at < (CURRENT_TIMESTAMP - INTERVAL '${daysOld} days')
  `;

  const result = await query(sql);
  return result.length;
}

/**
 * Get alert count by type
 */
export async function getAlertCountByType(
  userId: string
): Promise<Array<{ type: AlertType; count: number }>> {
  const sql = `
    SELECT
      type,
      COUNT(*) as count
    FROM alerts
    WHERE user_id = $1 AND is_read = false
    GROUP BY type
    ORDER BY count DESC
  `;

  const results = await query<{ type: AlertType; count: string }>(sql, [userId]);

  return results.map((r) => ({
    type: r.type,
    count: Number.parseInt(r.count, 10),
  }));
}

/**
 * Get unread alert count
 */
export async function getUnreadAlertCount(userId: string): Promise<number> {
  const sql = `
    SELECT COUNT(*) as count
    FROM alerts
    WHERE user_id = $1 AND is_read = false
  `;

  const result = await queryOne<{ count: string }>(sql, [userId]);
  return Number.parseInt(result?.count || '0', 10);
}

/**
 * Create bill reminder alert
 */
export async function createBillReminderAlert(params: {
  userId: string;
  title: string;
  message: string;
  relatedEntityType: string;
  relatedEntityId: string;
  scheduledFor?: Date;
}): Promise<Alert> {
  return createAlert({
    user_id: params.userId,
    type: 'bill_reminder',
    priority: 'high',
    title: params.title,
    message: params.message,
    related_entity_type: params.relatedEntityType,
    related_entity_id: params.relatedEntityId,
    scheduled_for: params.scheduledFor,
  });
}

/**
 * Create credit warning alert
 */
export async function createCreditWarningAlert(params: {
  userId: string;
  title: string;
  message: string;
  relatedEntityId: string;
}): Promise<Alert> {
  return createAlert({
    user_id: params.userId,
    type: 'credit_warning',
    priority: 'high',
    title: params.title,
    message: params.message,
    related_entity_type: 'credit_card',
    related_entity_id: params.relatedEntityId,
  });
}

/**
 * Create low balance alert
 */
export async function createLowBalanceAlert(params: {
  userId: string;
  accountName: string;
  balance: number;
  relatedEntityId: string;
}): Promise<Alert> {
  return createAlert({
    user_id: params.userId,
    type: 'low_balance',
    priority: 'medium',
    title: 'Low Account Balance',
    message: `Your ${params.accountName} account balance is low: $${params.balance.toFixed(2)}`,
    related_entity_type: 'account',
    related_entity_id: params.relatedEntityId,
  });
}

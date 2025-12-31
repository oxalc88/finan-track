/**
 * Zod validation schemas for API requests
 */

import { z } from 'zod';

// Common schemas
export const uuidSchema = z.string().uuid();
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/);
export const emailSchema = z.string().email();
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const currencySchema = z.string().length(3).default('USD');
export const positiveNumberSchema = z.number().positive();
export const nonNegativeNumberSchema = z.number().min(0);

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

// User schemas
export const createUserSchema = z.object({
  email: emailSchema,
  name: z.string().min(1).max(255),
  phone: phoneSchema.optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
});

// Account schemas
export const createAccountSchema = z.object({
  user_id: uuidSchema,
  name: z.string().min(1).max(255),
  type: z.enum(['checking', 'savings', 'cash', 'other']),
  balance: nonNegativeNumberSchema.optional(),
  currency: currencySchema.optional(),
  institution: z.string().max(255).optional(),
  account_number: z.string().max(100).optional(),
});

export const updateAccountSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: z.enum(['checking', 'savings', 'cash', 'other']).optional(),
  balance: nonNegativeNumberSchema.optional(),
  currency: currencySchema.optional(),
  institution: z.string().max(255).optional(),
  account_number: z.string().max(100).optional(),
  is_active: z.boolean().optional(),
});

// Investment schemas
export const createInvestmentSchema = z.object({
  user_id: uuidSchema,
  type: z.enum(['stocks', 'bonds', 'real_estate', 'crypto', 'other']),
  name: z.string().min(1).max(255),
  symbol: z.string().max(20).optional(),
  quantity: positiveNumberSchema.optional(),
  purchase_price: positiveNumberSchema.optional(),
  current_value: positiveNumberSchema,
  currency: currencySchema.optional(),
  purchase_date: dateSchema.optional(),
  notes: z.string().optional(),
});

export const updateInvestmentSchema = z.object({
  type: z.enum(['stocks', 'bonds', 'real_estate', 'crypto', 'other']).optional(),
  name: z.string().min(1).max(255).optional(),
  symbol: z.string().max(20).optional(),
  quantity: positiveNumberSchema.optional(),
  purchase_price: positiveNumberSchema.optional(),
  current_value: positiveNumberSchema.optional(),
  currency: currencySchema.optional(),
  purchase_date: dateSchema.optional(),
  notes: z.string().optional(),
  is_active: z.boolean().optional(),
});

// Debt schemas
export const createDebtSchema = z.object({
  user_id: uuidSchema,
  name: z.string().min(1).max(255),
  type: z.enum(['short_term', 'long_term']),
  category: z.enum(['loan', 'mortgage', 'student_loan', 'personal_loan', 'other']),
  principal_amount: positiveNumberSchema,
  current_balance: nonNegativeNumberSchema,
  interest_rate: nonNegativeNumberSchema.max(100).optional(),
  minimum_payment: positiveNumberSchema.optional(),
  due_date: dateSchema.optional(),
  lender: z.string().max(255).optional(),
});

export const updateDebtSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: z.enum(['short_term', 'long_term']).optional(),
  category: z.enum(['loan', 'mortgage', 'student_loan', 'personal_loan', 'other']).optional(),
  principal_amount: positiveNumberSchema.optional(),
  current_balance: nonNegativeNumberSchema.optional(),
  interest_rate: nonNegativeNumberSchema.max(100).optional(),
  minimum_payment: positiveNumberSchema.optional(),
  due_date: dateSchema.optional(),
  lender: z.string().max(255).optional(),
  is_active: z.boolean().optional(),
});

export const makePaymentSchema = z.object({
  amount: positiveNumberSchema,
});

// Credit card schemas
export const createCreditCardSchema = z.object({
  user_id: uuidSchema,
  name: z.string().min(1).max(255),
  last_four: z
    .string()
    .length(4)
    .regex(/^\d{4}$/)
    .optional(),
  issuer: z.string().max(255).optional(),
  current_balance: nonNegativeNumberSchema.optional(),
  credit_limit: positiveNumberSchema,
  minimum_payment: positiveNumberSchema.optional(),
  due_date: dateSchema.optional(),
  statement_closing_date: dateSchema.optional(),
  apr: nonNegativeNumberSchema.max(100).optional(),
});

export const updateCreditCardSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  last_four: z
    .string()
    .length(4)
    .regex(/^\d{4}$/)
    .optional(),
  issuer: z.string().max(255).optional(),
  current_balance: nonNegativeNumberSchema.optional(),
  credit_limit: positiveNumberSchema.optional(),
  minimum_payment: positiveNumberSchema.optional(),
  due_date: dateSchema.optional(),
  statement_closing_date: dateSchema.optional(),
  apr: nonNegativeNumberSchema.max(100).optional(),
  is_active: z.boolean().optional(),
});

// Category schemas
export const createCategorySchema = z.object({
  user_id: uuidSchema.optional(),
  name: z.string().min(1).max(100),
  type: z.enum(['income', 'expense']),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  icon: z.string().max(50).optional(),
  parent_id: uuidSchema.optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(['income', 'expense']).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  icon: z.string().max(50).optional(),
  parent_id: uuidSchema.optional(),
});

// Alert schemas
export const createAlertSchema = z.object({
  user_id: uuidSchema,
  type: z.enum(['bill_reminder', 'payment_confirmation', 'credit_warning', 'low_balance', 'other']),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  related_entity_type: z.string().max(50).optional(),
  related_entity_id: uuidSchema.optional(),
  scheduled_for: z.string().datetime().optional(),
});

export const updateAlertSchema = z.object({
  is_read: z.boolean().optional(),
});

// Transaction schemas (extended from existing)
export const createTransactionSchema = z.object({
  user_id: uuidSchema,
  account_id: uuidSchema.optional(),
  category_id: uuidSchema.optional(),
  invoice_id: uuidSchema.optional(),
  type: z.enum(['income', 'expense', 'transfer']),
  amount: positiveNumberSchema,
  currency: currencySchema.optional(),
  description: z.string().optional(),
  transaction_date: dateSchema,
  notes: z.string().optional(),
});

export const updateTransactionSchema = z.object({
  account_id: uuidSchema.optional(),
  category_id: uuidSchema.optional(),
  type: z.enum(['income', 'expense', 'transfer']).optional(),
  amount: positiveNumberSchema.optional(),
  currency: currencySchema.optional(),
  description: z.string().optional(),
  transaction_date: dateSchema.optional(),
  notes: z.string().optional(),
});

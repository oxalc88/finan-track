/**
 * Account service - Business logic for account management
 */

import * as accountRepo from '../repositories/account-repository.js';
import type { CreateAccountInput, UpdateAccountInput } from '../types/index.js';

/**
 * Create a new account
 */
export async function createAccount(data: CreateAccountInput) {
  return accountRepo.createAccount(data);
}

/**
 * Get account by ID
 */
export async function getAccountById(id: string) {
  const account = await accountRepo.getAccountById(id);

  if (!account) {
    throw new Error('Account not found');
  }

  return account;
}

/**
 * List accounts for a user
 */
export async function listUserAccounts(userId: string, activeOnly = true) {
  return accountRepo.listAccountsByUser(userId, activeOnly);
}

/**
 * Update account
 */
export async function updateAccount(id: string, data: UpdateAccountInput) {
  const account = await accountRepo.updateAccount(id, data);

  if (!account) {
    throw new Error('Account not found');
  }

  return account;
}

/**
 * Update account balance
 */
export async function updateBalance(id: string, newBalance: number) {
  if (newBalance < 0) {
    throw new Error('Balance cannot be negative');
  }

  const account = await accountRepo.updateAccountBalance(id, newBalance);

  if (!account) {
    throw new Error('Account not found');
  }

  return account;
}

/**
 * Deactivate account (soft delete)
 */
export async function deactivateAccount(id: string) {
  const account = await accountRepo.deactivateAccount(id);

  if (!account) {
    throw new Error('Account not found');
  }

  return account;
}

/**
 * Delete account (hard delete)
 */
export async function deleteAccount(id: string) {
  await accountRepo.deleteAccount(id);
}

/**
 * Get total cash balance for user
 */
export async function getUserCashBalance(userId: string) {
  return accountRepo.getTotalCashBalance(userId);
}

/**
 * Get accounts summary by type
 */
export async function getAccountsSummary(userId: string) {
  return accountRepo.getAccountsSummaryByType(userId);
}

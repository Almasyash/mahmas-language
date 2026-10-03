// ==============================================================================
// MAHMAS LANGUAGE — VIRTUAL CURRENCY SERVICE
// Server-authoritative virtual currency (Gems) ledger and balance management
// ==============================================================================

import { CurrencyType } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { ProgressionConfig } from './progression.config';

export class CurrencyService {
  /**
   * Authoritatively credits currency to a user with ledger record and idempotency.
   */
  async credit(params: {
    userId: string;
    type?: CurrencyType;
    amount: number;
    reason: string;
    idempotencyKey?: string;
    referenceId?: string;
  }): Promise<{ balance: number; credited: boolean }> {
    const { userId, amount, reason, idempotencyKey, referenceId } = params;
    const type = params.type || CurrencyType.GEMS;

    if (amount <= 0) {
      const balance = await this.getBalance(userId, type);
      return { balance, credited: false };
    }

    if (idempotencyKey) {
      const existing = await prisma.currencyLedger.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        const balance = await this.getBalance(userId, type);
        return { balance, credited: false };
      }
    }

    const newBalance = await prisma.$transaction(async (tx) => {
      // Find or initialize currency record
      const current = await tx.virtualCurrency.findUnique({
        where: { userId_type: { userId, type } },
      });

      const updatedBalance = (current?.balance ?? ProgressionConfig.GEM_REWARDS.INITIAL_BALANCE) + amount;

      await tx.virtualCurrency.upsert({
        where: { userId_type: { userId, type } },
        update: { balance: updatedBalance },
        create: {
          userId,
          type,
          balance: updatedBalance,
        },
      });

      await tx.currencyLedger.create({
        data: {
          userId,
          currencyType: type,
          amount,
          balanceAfter: updatedBalance,
          reason,
          referenceId,
          idempotencyKey,
        },
      });

      return updatedBalance;
    });

    return { balance: newBalance, credited: true };
  }

  /**
   * Authoritatively debits currency with balance verification and ledger record.
   */
  async debit(params: {
    userId: string;
    type?: CurrencyType;
    amount: number;
    reason: string;
    idempotencyKey?: string;
    referenceId?: string;
  }): Promise<{ balance: number; success: boolean }> {
    const { userId, amount, reason, idempotencyKey, referenceId } = params;
    const type = params.type || CurrencyType.GEMS;

    if (amount <= 0) {
      const balance = await this.getBalance(userId, type);
      return { balance, success: false };
    }

    if (idempotencyKey) {
      const existing = await prisma.currencyLedger.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        const balance = await this.getBalance(userId, type);
        return { balance, success: false };
      }
    }

    const currentBalance = await this.getBalance(userId, type);
    if (currentBalance < amount) {
      return { balance: currentBalance, success: false };
    }

    const newBalance = await prisma.$transaction(async (tx) => {
      const updatedBalance = currentBalance - amount;

      await tx.virtualCurrency.update({
        where: { userId_type: { userId, type } },
        data: { balance: updatedBalance },
      });

      await tx.currencyLedger.create({
        data: {
          userId,
          currencyType: type,
          amount: -amount,
          balanceAfter: updatedBalance,
          reason,
          referenceId,
          idempotencyKey,
        },
      });

      return updatedBalance;
    });

    return { balance: newBalance, success: true };
  }

  /**
   * Gets current currency balance for a user.
   */
  async getBalance(userId: string, type: CurrencyType = CurrencyType.GEMS): Promise<number> {
    const record = await prisma.virtualCurrency.findUnique({
      where: { userId_type: { userId, type } },
    });

    if (!record) {
      // Initialize with default initial balance
      const initial = await prisma.virtualCurrency.create({
        data: {
          userId,
          type,
          balance: ProgressionConfig.GEM_REWARDS.INITIAL_BALANCE,
        },
      });
      return initial.balance;
    }

    return record.balance;
  }
}

export const currencyService = new CurrencyService();

"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TransactionList } from "@/components/money-manager/TransactionList";
import { TransactionFilters } from "@/components/money-manager/TransactionFilters";
import { listTransactions, listCategories, listAccounts, getSettings } from "@/app/money-manager/actions";
import type { Transaction, Category, Account } from "@/types/database";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [txRes, catRes, accRes, settingsRes] = await Promise.all([
        listTransactions({ limit: 50 }),
        listCategories(),
        listAccounts(),
        getSettings(),
      ]);
      if (txRes.transactions) setTransactions(txRes.transactions);
      if (catRes.categories) setCategories(catRes.categories);
      if (accRes.accounts) setAccounts(accRes.accounts);
      if (settingsRes.settings?.currency) setCurrency(settingsRes.settings.currency);
      setLoading(false);
    }
    load();
  }, []);

  const handleFilterChange = async (filters: {
    type?: "income" | "expense" | "transfer";
    categoryId?: string;
    accountId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    setLoading(true);
    const result = await listTransactions({ ...filters, limit: 50 });
    if (result.transactions) setTransactions(result.transactions);
    setLoading(false);
  };

  return (
    <AppShell>
      <div>
        <h1 className="text-[40px] font-bold tracking-tight text-text-primary">
          Transactions
        </h1>
        <p className="mt-2 text-base text-text-secondary">
          View and manage all your financial activity.
        </p>
      </div>

      <TransactionFilters
        categories={categories}
        accounts={accounts}
        onFilterChange={handleFilterChange}
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <TransactionList
          transactions={transactions}
          categories={categories}
          accounts={accounts}
          currency={currency}
        />
      )}
    </AppShell>
  );
}

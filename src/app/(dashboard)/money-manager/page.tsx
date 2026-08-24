import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import { MonthSummary } from "@/components/money-manager/MonthSummary";
import { AccountCard } from "@/components/money-manager/AccountCard";
import { BudgetProgress } from "@/components/money-manager/BudgetProgress";
import { TransactionList } from "@/components/money-manager/TransactionList";
import { formatCurrency } from "@/lib/format";
import {
  getTransactions,
  getCategories,
  getAccounts,
  getMoneyManagerDashboard,
} from "@/services/money-manager.service";
import { ArrowRight, Plus } from "lucide-react";

export default async function MoneyManagerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const [dashboard, transactions, categories, accounts] = await Promise.all([
    getMoneyManagerDashboard(user.id),
    getTransactions(user.id, { startDate, endDate, limit: 10 }),
    getCategories(user.id),
    getAccounts(user.id),
  ]);

  const { currentMonth, budgetProgress, savingsGoals, currency } = dashboard;

  return (
    <AppShell>
      <div>
        <h1 className="text-[40px] font-bold tracking-tight text-text-primary">
          Money Manager
        </h1>
        <p className="mt-2 text-base text-text-secondary">
          Track your income, expenses, and budgets.
        </p>
      </div>

      {/* Month summary */}
      <MonthSummary
        income={currentMonth.income}
        expenses={currentMonth.expenses}
        savingsRate={currentMonth.savingsRate}
        currency={currency}
      />

      {/* Accounts */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-text-secondary">
            Accounts
          </h2>
          <Link
            href="/money-manager/accounts"
            className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent/80"
          >
            Manage <ArrowRight size={12} />
          </Link>
        </div>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
          <Link
            href="/money-manager/accounts"
            className="flex min-w-[200px] shrink-0 items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-bg-card/50 p-4 text-sm font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent"
          >
            <Plus size={16} />
            Add Account
          </Link>
        </div>
      </section>

      {/* Budget + Transactions side by side on desktop */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Budget */}
        <section>
          <BudgetProgress
            totalBudget={budgetProgress.totalBudget}
            totalSpent={budgetProgress.totalSpent}
            categories={budgetProgress.categories}
            currency={currency}
          />
        </section>

        {/* Recent Transactions */}
        <section>
          <TransactionList
            transactions={transactions}
            categories={categories}
            accounts={accounts}
            currency={currency}
          />
        </section>
      </div>

      {/* Savings Goals */}
      {savingsGoals.length > 0 && (
        <section>
          <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-text-secondary">
            Savings Goals
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {savingsGoals.map((goal) => {
              const progress = goal.target_amount > 0
                ? Math.round((goal.current_amount / goal.target_amount) * 100)
                : 0;
              return (
                <div key={goal.id} className="rounded-xl border border-border bg-bg-card p-4">
                  <p className="text-sm font-medium text-text-primary">{goal.name}</p>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-lg font-bold text-text-primary">
                      {formatCurrency(goal.current_amount, currency)}
                    </span>
                    <span className="text-xs text-text-secondary">
                      of {formatCurrency(goal.target_amount, currency)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-text-secondary">{progress}% complete</p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </AppShell>
  );
}

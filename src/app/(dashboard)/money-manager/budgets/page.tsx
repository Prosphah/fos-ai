"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import {
  listBudgets,
  setBudget,
  removeBudget,
  listCategories,
  getSettings,
} from "@/app/money-manager/actions";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import type { Category } from "@/types/database";

interface BudgetRow {
  id: string;
  category_id: string | null;
  categoryName: string | null;
  amount: number;
  spent: number;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function ProgressBar({ spent, limit }: { spent: number; limit: number }) {
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const color =
    pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-amber-500" : "bg-accent";

  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function BudgetsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [userCurrency, setUserCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState(0);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newBudgetAmount, setNewBudgetAmount] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const fetchBudgets = useCallback(async () => {
    const result = await listBudgets(month, year);
    return result.budgets ?? [];
  }, [month, year]);

  useEffect(() => {
    let active = true;
    fetchBudgets().then((rows) => {
      if (!active) return;
      setBudgets(rows);
      setLoading(false);
      setLoadedKey(`${month}-${year}`);
    }).catch(() => {
      if (!active) return;
      setLoading(false);
    });
    return () => { active = false; };
  }, [fetchBudgets, month, year]);

  const reloadBudgets = async () => {
    const rows = await fetchBudgets();
    setBudgets(rows);
  };

  useEffect(() => {
    async function loadCategories() {
      const [catResult, settingsResult] = await Promise.all([listCategories(), getSettings()]);
      if (catResult.categories) setCategories(catResult.categories);
      if (settingsResult.settings?.currency) setUserCurrency(settingsResult.settings.currency);
    }
    loadCategories();
  }, []);

  const navigateMonth = (dir: number) => {
    let newMonth = month + dir;
    let newYear = year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    setMonth(newMonth);
    setYear(newYear);
  };

  const handleSave = async (budgetId: string, amount: number) => {
    const budget = budgets.find((b) => b.id === budgetId);
    if (!budget) return;
    await setBudget({
      categoryId: budget.category_id,
      month,
      year,
      amount,
    });
    setEditingId(null);
    reloadBudgets();
  };

  const handleDelete = async (budgetId: string) => {
    await removeBudget(budgetId);
    reloadBudgets();
  };

  const handleAddBudget = async () => {
    await setBudget({
      categoryId: selectedCategoryId || null,
      month,
      year,
      amount: newBudgetAmount,
    });
    setShowAddCategory(false);
    setNewBudgetAmount(0);
    setSelectedCategoryId("");
    reloadBudgets();
  };

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  const availableCategories = categories.filter(
    (c) => c.type === "expense" || c.type === "both"
  );

  return (
    <AppShell>
      <div>
        <h1 className="text-[40px] font-bold tracking-tight text-text-primary">
          Budgets
        </h1>
        <p className="mt-2 text-base text-text-secondary">
          Set spending limits and track your progress.
        </p>
      </div>

      {/* Month navigator */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigateMonth(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-muted"
          style={{ borderRadius: "999px" }}
        >
          <ChevronLeft size={16} />
        </button>
        <div>
          <p className="text-lg font-semibold text-text-primary">
            {monthNames[month - 1]} {year}
          </p>
        </div>
        <button
          onClick={() => navigateMonth(1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-muted"
          style={{ borderRadius: "999px" }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Total budget card */}
      <div className="rounded-xl border border-border bg-bg-card p-5">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-sm font-medium text-text-secondary">Total Spent</p>
            <p className="mt-1 text-3xl font-bold text-text-primary">
              {formatCurrency(totalSpent, userCurrency)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-text-secondary">of {formatCurrency(totalBudget, userCurrency)}</p>
            <p className="mt-1 text-sm font-medium text-text-secondary">
              {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% used
            </p>
          </div>
        </div>
        <div className="mt-3">
          <ProgressBar spent={totalSpent} limit={totalBudget} />
        </div>
      </div>

      {/* Category budgets */}
      <div className="rounded-xl border border-border bg-bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">Category Budgets</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddCategory(true)}
          >
            <Plus size={14} />
            Add
          </Button>
        </div>

        {loading || loadedKey !== `${month}-${year}` ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-text-secondary">No budgets set for this month</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {budgets.map((budget) => (
              <div key={budget.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">
                      {budget.categoryName ?? "Total Budget"}
                    </span>
                    {editingId === budget.id ? (
                      <div className="flex items-center gap-2">
                        <CurrencyInput
                          value={editAmount}
                          onChange={setEditAmount}
                          className="w-24 rounded-lg border border-border bg-bg-card px-2 py-1 text-sm text-right text-text-primary outline-none focus:border-accent"
                        />
                        <Button
                          size="xs"
                          onClick={() => handleSave(budget.id, editAmount)}
                        >
                          Save
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-secondary">
                          {formatCurrency(budget.spent, userCurrency)} / {formatCurrency(budget.amount, userCurrency)}
                        </span>
                        <button
                          onClick={() => {
                            setEditingId(budget.id);
                            setEditAmount(budget.amount);
                          }}
                          className="text-xs text-accent hover:text-accent/80"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(budget.id)}
                          className="text-text-secondary hover:text-destructive"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-1.5">
                    <ProgressBar spent={budget.spent} limit={budget.amount} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add budget dialog */}
      {showAddCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-border bg-bg-card p-5 shadow-lg">
            <h3 className="text-base font-semibold text-text-primary">Add Budget</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-text-secondary">Category</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                >
                  <option value="">Total Budget (all categories)</option>
                  {availableCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary">Amount</label>
                <CurrencyInput
                  value={newBudgetAmount}
                  onChange={setNewBudgetAmount}
                  placeholder="0"
                  className="mt-1 w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddCategory(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddBudget}>
                  Add Budget
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatCurrency } from "@/lib/format";
import {
  listAccounts,
  addAccount,
  editAccount,
  removeAccount,
  getSettings,
} from "@/app/money-manager/actions";
import { Plus, Landmark, Wallet, BarChart3, CreditCard, Banknote, Trash2, Pencil, X } from "lucide-react";
import type { Account } from "@/types/database";

const typeOptions = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "savings", label: "Savings", icon: Wallet },
  { value: "investment", label: "Investment", icon: BarChart3 },
  { value: "credit", label: "Credit Card", icon: CreditCard },
  { value: "other", label: "Other", icon: Landmark },
];

const typeColors = {
  cash: "bg-accent/10 text-accent",
  savings: "bg-blue-500/10 text-blue-500",
  investment: "bg-purple-500/10 text-purple-500",
  credit: "bg-destructive/10 text-destructive",
  other: "bg-muted text-text-secondary",
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [userCurrency, setUserCurrency] = useState("USD");
  const [form, setForm] = useState({
    name: "",
    type: "savings" as Account["type"],
    balance: 0,
    currency: "USD",
    institution: "",
    accountNumberLast4: "",
  });

  const loadAccounts = async () => {
    setLoading(true);
    const [accResult, settingsResult] = await Promise.all([listAccounts(), getSettings()]);
    if (accResult.accounts) setAccounts(accResult.accounts);
    if (settingsResult.settings?.currency) {
      setUserCurrency(settingsResult.settings.currency);
      setForm((prev) => ({ ...prev, currency: settingsResult.settings!.currency }));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const resetForm = () => {
    setForm({ name: "", type: "savings", balance: 0, currency: userCurrency, institution: "", accountNumberLast4: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (account: Account) => {
    setForm({
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currency,
      institution: account.institution ?? "",
      accountNumberLast4: account.account_number_last4 ?? "",
    });
    setEditingId(account.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (editingId) {
      await editAccount({
        id: editingId,
        name: form.name,
        type: form.type,
        balance: form.balance,
        institution: form.institution || null,
        accountNumberLast4: form.accountNumberLast4 || null,
      });
    } else {
      await addAccount({
        name: form.name,
        type: form.type,
        balance: form.balance,
        currency: form.currency,
        institution: form.institution || null,
        accountNumberLast4: form.accountNumberLast4 || null,
      });
    }
    resetForm();
    loadAccounts();
  };

  const handleDelete = async (id: string) => {
    await removeAccount(id);
    loadAccounts();
  };

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);

  return (
    <AppShell>
      <div>
        <h1 className="text-[40px] font-bold tracking-tight text-text-primary">
          Accounts
        </h1>
        <p className="mt-2 text-base text-text-secondary">
          Manage your financial accounts and balances.
        </p>
      </div>

      {/* Total balance */}
      <div className="rounded-xl border border-border bg-bg-card p-5">
        <p className="text-sm font-medium text-text-secondary">Total Balance</p>
        <p className="mt-1 text-3xl font-bold text-text-primary">
          {formatCurrency(totalBalance, userCurrency)}
        </p>
        <p className="mt-1 text-xs text-text-secondary">
          Across {accounts.length} account{accounts.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Accounts grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => {
          const Icon = typeOptions.find((t) => t.value === account.type)?.icon ?? Landmark;
          return (
            <div
              key={account.id}
              className="rounded-xl border border-border bg-bg-card p-4 transition-colors hover:border-border/80"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${typeColors[account.type]}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{account.name}</p>
                    <p className="text-[11px] capitalize text-text-secondary">{account.type}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(account)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-muted hover:text-text-primary"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="mt-4 text-xl font-bold text-text-primary">
                {formatCurrency(account.balance, account.currency)}
              </p>
              {account.institution && (
                <p className="mt-1 text-[11px] text-text-secondary">{account.institution}</p>
              )}
              {account.account_number_last4 && (
                <p className="text-[11px] text-text-secondary">••{account.account_number_last4}</p>
              )}
            </div>
          );
        })}

        {/* Add account card */}
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-bg-card/50 p-4 text-sm font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent"
        >
          <Plus size={20} />
          Add Account
        </button>
      </div>

      {/* Add/Edit account modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-bg-card p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-text-primary">
                {editingId ? "Edit Account" : "Add Account"}
              </h3>
              <button onClick={resetForm} className="text-text-secondary hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-text-secondary">Account Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Main Checking"
                  className="mt-1 w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder:text-muted-foreground outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary">Type</label>
                <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                  {typeOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-medium transition-all ${
                        form.type === opt.value
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-text-secondary hover:border-border/80"
                      }`}
                    >
                      <input
                        type="radio"
                        value={opt.value}
                        className="sr-only"
                        checked={form.type === opt.value}
                        onChange={() => setForm({ ...form, type: opt.value as Account["type"] })}
                      />
                      <opt.icon size={14} />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary">Current Balance</label>
                <CurrencyInput
                  value={form.balance}
                  onChange={(v) => setForm({ ...form, balance: v })}
                  className="mt-1 w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary">Institution (optional)</label>
                <input
                  type="text"
                  value={form.institution}
                  onChange={(e) => setForm({ ...form, institution: e.target.value })}
                  placeholder="e.g. Chase Bank"
                  className="mt-1 w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder:text-muted-foreground outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary">Last 4 Digits (optional)</label>
                <input
                  type="text"
                  value={form.accountNumberLast4}
                  onChange={(e) => setForm({ ...form, accountNumberLast4: e.target.value.slice(0, 4) })}
                  placeholder="1234"
                  maxLength={4}
                  className="mt-1 w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder:text-muted-foreground outline-none focus:border-accent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={resetForm}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={!form.name}>
                  {editingId ? "Save Changes" : "Add Account"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

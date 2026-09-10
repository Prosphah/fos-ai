"use client";

import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/format";
import {
  listAccounts,
  addAccount,
  editAccount,
  removeAccount,
  getSettings,
} from "@/app/money-manager/actions";
import { Plus, Landmark, Wallet, BarChart3, CreditCard, Banknote, PiggyBank, Trash2, Pencil, X } from "lucide-react";
import type { Account } from "@/types/database";

const typeOptions = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "current", label: "Current", icon: Wallet },
  { value: "savings", label: "Savings", icon: PiggyBank },
  { value: "investment", label: "Investment", icon: BarChart3 },
  { value: "credit", label: "Credit Card", icon: CreditCard },
  { value: "other", label: "Other", icon: Landmark },
];

const typeColors = {
  cash: "bg-accent/10 text-accent",
  current: "bg-mint/10 text-mint",
  savings: "bg-blue-500/10 text-blue-500",
  investment: "bg-purple-500/10 text-purple-500",
  credit: "bg-destructive/10 text-destructive",
  other: "bg-muted text-text-secondary",
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
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
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const modalPanelRef = useRef<HTMLDivElement>(null);
  const [modalOrigin, setModalOrigin] = useState<{ x: number; y: number } | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!showForm) return;
    const btn = addButtonRef.current;
    const panel = modalPanelRef.current;
    if (!btn || !panel) return;
    const btnRect = btn.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    setModalOrigin({
      x: btnRect.left + btnRect.width / 2 - panelRect.left,
      y: btnRect.top + btnRect.height / 2 - panelRect.top,
    });
  }, [showForm]);

  const loadAccounts = async (isActive: () => boolean = () => true) => {
    const [accResult, settingsResult] = await Promise.all([listAccounts(), getSettings()]);
    if (!isActive()) return;
    if (accResult.accounts) setAccounts(accResult.accounts);
    if (settingsResult.settings?.currency) {
      setUserCurrency(settingsResult.settings.currency);
      setForm((prev) => ({ ...prev, currency: settingsResult.settings!.currency }));
    }
  };

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => loadAccounts(() => active));
    return () => { active = false; };
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

  const modalFields = (
    <>
      <div>
        <label className="text-xs font-medium text-text-secondary">Account Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Main Checking"
          className="mt-1 w-full rounded-md border border-border bg-bg-card px-3.5 py-3 text-sm text-text-primary placeholder:text-muted-foreground outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-text-secondary">Type</label>
        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
          {typeOptions.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-md border px-2 py-3 text-xs font-medium transition-all ${
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
              <opt.icon size={16} />
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
          className="mt-1 w-full rounded-md border border-border bg-bg-card px-3.5 py-3 text-sm text-text-primary outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-text-secondary">Institution (optional)</label>
        <input
          type="text"
          value={form.institution}
          onChange={(e) => setForm({ ...form, institution: e.target.value })}
          placeholder="e.g. Chase Bank"
          className="mt-1 w-full rounded-md border border-border bg-bg-card px-3.5 py-3 text-sm text-text-primary placeholder:text-muted-foreground outline-none focus:border-accent"
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
          className="mt-1 w-full rounded-md border border-border bg-bg-card px-3.5 py-3 text-sm text-text-primary placeholder:text-muted-foreground outline-none focus:border-accent"
        />
      </div>
    </>
  );

  const modalFooter = (
    <div className="flex gap-2 pt-2">
      <Button
        variant="outline"
        className="px-7"
        onClick={resetForm}
        style={{ minHeight: "44px", borderRadius: "var(--radius-sm)" }}
      >
        Cancel
      </Button>
      <Button
        size="lg"
        className="flex-1"
        style={{ minHeight: "44px", borderRadius: "var(--radius-sm)" }}
        onClick={handleSubmit}
        disabled={!form.name}
      >
        {editingId ? "Save Changes" : "Add Account"}
      </Button>
    </div>
  );

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
      <div className="rounded-xl border border-accent/20 bg-accent/10 p-5">
        <p className="text-sm font-medium text-accent">Total Balance</p>
        <p className="mt-1 text-3xl font-bold text-accent">
          {formatCurrency(totalBalance, userCurrency)}
        </p>
        <p className="mt-1 text-xs text-accent/70">
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
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${typeColors[account.type]}`}>
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">{account.name}</p>
                    <p className="text-[11px] capitalize text-text-secondary">{account.type}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
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
          ref={addButtonRef}
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-bg-card/50 p-4 text-sm font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent"
        >
          <Plus size={20} />
          Add Account
        </button>
      </div>

      {/* Add/Edit account modal */}
      {isDesktop ? (
        showForm && (
          <div className="animate-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xl">
            <div
              ref={modalPanelRef}
              className="animate-modal-panel mx-4 w-full max-w-md rounded-xl border p-5 shadow-lg"
              style={{
                borderColor: "var(--glass-border)",
                background: "var(--glass-bg)",
                backdropFilter: "blur(24px) saturate(1.5)",
                WebkitBackdropFilter: "blur(24px) saturate(1.5)",
                transformOrigin: modalOrigin ? `${modalOrigin.x}px ${modalOrigin.y}px` : "center",
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-text-primary">
                  {editingId ? "Edit Account" : "Add Account"}
                </h3>
                <button onClick={resetForm} className="text-text-secondary hover:text-text-primary">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {modalFields}
                {modalFooter}
              </div>
            </div>
          </div>
        )
      ) : (
        <Sheet open={showForm} onOpenChange={(isOpen) => !isOpen && resetForm()}>
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="rounded-t-2xl border-t"
            style={{
              borderColor: "var(--glass-border)",
              background: "var(--glass-bg)",
              backdropFilter: "blur(24px) saturate(1.5)",
              WebkitBackdropFilter: "blur(24px) saturate(1.5)",
            }}
          >
            <SheetHeader className="px-5 pt-3 pb-0">
              <div className="flex items-start justify-between">
                <div>
                  <SheetTitle style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-1)" }}>
                    {editingId ? "Edit Account" : "Add Account"}
                  </SheetTitle>
                  <SheetDescription style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
                    Manage your financial accounts and balances.
                  </SheetDescription>
                </div>
                <button
                  onClick={resetForm}
                  className="shrink-0 text-text-secondary hover:text-text-primary"
                >
                  <X size={18} />
                </button>
              </div>
            </SheetHeader>
            <div
              className="overflow-y-auto px-5 pb-8 pt-2"
              style={{ maxHeight: "calc(85vh - 80px)" }}
            >
              <div className="space-y-3">
                {modalFields}
                {modalFooter}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </AppShell>
  );
}

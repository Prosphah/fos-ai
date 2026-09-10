# Net Worth Graph: Historical Accuracy & Efficient Calculation

## Objective

Fix the net worth graph so that it reflects the user's actual net worth at each point in the selected period.

The current behavior appears to use today's/current account balances as though those balances existed throughout the historical period. For example, if a user adds an existing account containing ₦430,000 today, the graph must NOT show that ₦430,000 in April or other dates before the account was added.

**Important:** Do not assume a specific database schema. Inspect the existing schema, queries, RPCs, server actions, API routes, and net-worth calculation code first, then adapt the principles below to the project's actual architecture.

---

## 1. Core Accounting Model

There are three distinct concepts:

### A. Current account balance

This answers:

> How much money is currently in this account?

Example:

```text
GTBank = ₦430,000
```

This is current state. It cannot, by itself, answer historical questions.

### B. Cash-flow transactions

These are events that change financial balances:

```text
Salary       +₦250,000
Rent         -₦100,000
Food          -₦30,000
```

Income and expenses affect net worth through time.

### C. Account opening / initialization balance

When a user adds an account that already existed outside the application, the entered balance represents money the user already owned.

Example:

```text
Account added: August 27
Opening balance: ₦430,000
```

This is NOT income.

It is an opening balance / balance-sheet initialization event.

---

## 2. Critical Rule for New Accounts

An account must only contribute to historical net worth from its **effective opening date** onward.

If a user adds:

```text
Account: GTBank
Opening balance: ₦430,000
Effective date: August 27
```

then:

```text
Before August 27: contribution = ₦0
August 27 onward: contribution starts at ₦430,000
```

Do NOT reconstruct historical net worth by taking the current balance of every account and applying it to every historical date.

### Why

Suppose:

```text
April: user had ₦180k tracked net worth
August 27: user adds an existing account containing ₦430k
```

The graph should behave conceptually like:

```text
April      ₦180k
May        ₦180k
June       ₦180k
July       ₦180k
Aug 27     ₦610k
```

It must NOT become:

```text
April      ₦610k
May        ₦610k
June       ₦610k
July       ₦610k
Aug 27     ₦610k
```

The latter incorrectly projects a present-day account balance backward through time.

---

## 3. Do NOT Treat Account Creation as Income

Do not create an income transaction merely because a user adds an existing account with a non-zero balance.

Example:

```text
User already has ₦430,000 in a real bank account.
User installs the app today.
User adds that bank account with ₦430,000.
```

The user did not earn ₦430,000 today.

The application is simply learning about an existing asset.

Therefore:

**Account creation with opening balance = opening balance / initialization**

not:

**Account creation with opening balance = income**

### Distinguish these cases

#### Existing money introduced to the app

```text
Add account
Opening balance = ₦430k
```

Classification:

**Opening balance**

#### Money moved between two tracked accounts

```text
GTBank → Access Bank
```

Classification:

**Transfer**

It should not increase net worth.

#### Salary received

```text
Employer → GTBank
```

Classification:

**Income**

It increases net worth.

#### Expense paid

```text
GTBank → merchant
```

Classification:

**Expense**

It decreases net worth.

---

## 4. Historical Balance Formula

For each account, the historical balance at time T should conceptually be:

```text
balance_at(T)
=
opening_balance
+
sum(all balance-affecting events occurring on or before T)
```

subject to the account's effective opening date.

More explicitly:

```text
if T < account_effective_start:
    contribution = 0
else:
    contribution =
        opening_balance
        + sum(credits up to T)
        - sum(debits up to T)
```

Adapt this to the project's existing transaction model.

Do not blindly add this formula if the existing schema already derives balances differently. Reuse existing source-of-truth logic where possible.

---

## 5. Net Worth Formula

At a point in time T:

```text
Net Worth(T)
=
Total Assets(T)
-
Total Liabilities(T)
```

For assets, calculate their balance at T.

For liabilities, calculate their balance at T using the same historical principle.

Do not simply use:

```text
SUM(current account balances)
```

for historical points.

---

# 6. Efficient Graph Calculation

## Do NOT Run an Expensive Query for Every Day

A naive implementation might do:

```text
for each day:
    query all accounts
    query all transactions
    calculate net worth
```

This is inefficient and can become very expensive as users accumulate accounts and transactions.

Instead, determine the graph's time buckets first, then retrieve the relevant data in bulk.

---

## Preferred Approach: Bulk Fetch + In-Memory Calculation

The general algorithm should be:

### Step 1: Determine the selected period

Examples:

```text
7D
1M
3M
6M
1Y
ALL
```

Convert each filter into:

```text
start_date
end_date
bucket_granularity
```

For example:

```text
7D  → daily
1M  → daily
3M  → daily or weekly
6M  → weekly or monthly
1Y  → monthly
ALL → monthly or another sensible adaptive granularity
```

Do not blindly generate hundreds or thousands of daily points for long periods.

The exact bucket policy should follow the existing product UX and chart width.

---

### Step 2: Fetch accounts once

Retrieve only the fields needed to establish:

- account ID
- account type
- asset/liability classification
- effective opening date
- opening balance
- any fields required by the existing balance logic

Do not repeatedly query accounts for every graph point.

---

### Step 3: Fetch relevant transactions in one bulk query

Retrieve transactions relevant to the selected period, plus whatever historical baseline information is necessary.

Conceptually:

```text
SELECT ...
FROM transactions
WHERE transaction_date <= end_date
  AND transaction_date >= required_baseline_date
```

The exact query must account for the opening balances and any pre-period transactions required to establish the balance at the beginning of the graph.

**Important:** If the graph starts on June 1, you cannot necessarily fetch only transactions from June 1 onward.

You need the correct opening state at June 1.

There are two good strategies:

### Strategy A: Baseline + in-period events

First obtain each account's balance immediately before the graph starts:

```text
balance_at(start_date)
```

Then fetch only transactions inside the graph period.

For every subsequent bucket:

```text
previous_balance
+
events during this bucket
=
current_balance
```

This is usually the simplest robust approach.

### Strategy B: Aggregate transaction history

If the database/query architecture supports efficient cumulative aggregation, calculate historical balances directly with SQL window functions or grouped aggregates.

For example, conceptually:

```sql
SUM(amount) OVER (
  PARTITION BY account_id
  ORDER BY transaction_date
)
```

Adapt this to the project's actual transaction schema and sign conventions.

Do not copy this SQL literally without inspecting the existing schema.

---

# 7. Baseline + Delta Algorithm

For most implementations, this is the preferred graph algorithm.

Assume the graph has these buckets:

```text
June 1
June 8
June 15
June 22
June 29
```

First calculate:

```text
net_worth_at(June 1)
```

Then process only the changes between buckets.

Conceptually:

```text
net_worth(June 1)
    = baseline

net_worth(June 8)
    = net_worth(June 1)
      + net_change(June 2 ... June 8)

net_worth(June 15)
    = net_worth(June 8)
      + net_change(June 9 ... June 15)
```

And so on.

This avoids recalculating every account from scratch for every point.

---

# 8. Handle Account Additions Correctly

Account creation/opening balance must be treated as a state transition at the effective date.

Example:

```text
Existing tracked net worth: ₦180k

August 27:
New account added
Opening balance: ₦430k
```

Then:

```text
Before Aug 27:
Net worth = ₦180k

On/after Aug 27:
Net worth = ₦610k
```

The ₦430k should enter the graph at the account's effective date.

If the user records an account with a historical effective date, respect that date.

For example:

```text
Account added to app: Aug 27
Effective/opening date: Apr 15
Opening balance: ₦430k
```

Then the account should contribute from April 15, NOT August 27.

The application must distinguish:

```text
created_at
```

from:

```text
effective/opening date
```

if the existing product requirements allow users to specify historical opening dates.

If the application does not currently support historical opening dates, preserve the existing product behavior and use the account's actual effective start date.

---

# 9. Important Edge Cases

The implementation should explicitly consider:

### New account with zero balance

```text
Opening balance = ₦0
```

It contributes nothing to net worth until money enters it.

### New account with positive opening balance

```text
Opening balance = +₦430k
```

It increases tracked net worth from its effective opening date.

### New liability account

If the application supports liabilities:

```text
Credit card opening balance = ₦100k owed
```

This should reduce net worth:

```text
Net worth impact = -₦100k
```

Do not treat it as income.

### Transfers

A transfer between two tracked accounts should not change total net worth.

Example:

```text
Account A -₦100k
Account B +₦100k
```

Total:

```text
Net worth change = ₦0
```

### Income

Income increases net worth when it occurs.

### Expense

Expense decreases net worth when it occurs.

### Deleted/archived accounts

Follow the project's existing deletion semantics. Do not silently remove historical contributions if the product is expected to preserve historical net worth.

---

# 10. Period Filters

The graph should derive its points from the selected period.

Suggested conceptual mapping:

| Filter | Typical bucket |
|---|---|
| 7D | Daily |
| 1M | Daily |
| 3M | Daily or weekly |
| 6M | Weekly or monthly |
| 1Y | Monthly |
| ALL | Monthly, quarterly, or adaptive |

The exact mapping should be determined from the existing chart UX.

The important requirement is:

**The filter changes the time range and bucket boundaries, not the underlying accounting logic.**

The same historical net-worth calculation must remain correct regardless of whether the user selects 7D, 1M, 6M, 1Y, or ALL.

---

# 11. Avoid a Common "Current Balance" Trap

Do not do this:

```text
accounts.map(account => account.current_balance)
```

for every historical graph point.

That produces the exact bug being fixed.

Instead, think:

```text
account.balance_at(date)
```

and derive that historical state from the account's opening state plus subsequent balance-affecting events.

The chart should consume historical values, not current values projected backward.

---

# 12. Performance Architecture

If the application grows, consider moving from ad-hoc historical reconstruction toward a materialized historical balance layer.

A mature architecture can look like:

```text
Source of truth
    ↓
Accounts + transactions + opening balances
    ↓
Historical balance calculation
    ↓
Daily/monthly balance snapshots or materialized aggregates
    ↓
Net worth graph
```

Snapshots are an optimization, not the primary source of truth.

For example:

```text
account_daily_balances
----------------------
account_id
date
balance
```

Then net worth for a date can be obtained by aggregating the relevant account balances.

However, do not add a snapshot table prematurely if the existing dataset is small. Start with bulk retrieval + baseline + incremental deltas.

---

# 13. Recommended Implementation Strategy

Before modifying code:

1. Inspect the existing database schema.
2. Identify how accounts are stored.
3. Identify how current account balances are calculated.
4. Identify how income/expense transactions are stored.
5. Identify how transfers are represented.
6. Identify whether account creation currently stores an opening balance and/or effective date.
7. Locate the server-side function/API/RPC responsible for net-worth graph data.
8. Locate the period filter and bucket-generation logic.
9. Trace the current graph calculation end-to-end.
10. Determine exactly where current balances are being projected backward.

Then implement the smallest architectural change that makes historical balance calculation correct.

---

# 14. Acceptance Criteria

The implementation is correct when all of the following are true:

### Scenario 1: Existing account added today

User has no tracked account before today.

Today they add:

```text
Account balance = ₦430k
```

Expected:

```text
Historical dates before account effective date:
No ₦430k contribution

Account effective date:
+₦430k

Future dates:
₦430k, modified by subsequent transactions
```

### Scenario 2: Existing tracked history + new account

Existing historical net worth:

```text
April = ₦180k
May   = ₦190k
June  = ₦200k
July  = ₦210k
```

User adds a ₦430k account today.

Expected historical values remain approximately:

```text
April = ₦180k
May   = ₦190k
June  = ₦200k
July  = ₦210k
```

Then the account's ₦430k enters on its effective date.

### Scenario 3: Income

A ₦100k income transaction occurs today.

Expected:

```text
Before income: unchanged
After income: +₦100k
```

### Scenario 4: Expense

A ₦30k expense occurs today.

Expected:

```text
Before expense: unchanged
After expense: -₦30k
```

### Scenario 5: Transfer

₦100k moves from one tracked account to another.

Expected:

```text
Total net worth: unchanged
```

### Scenario 6: Period filter

Selecting 1M, 3M, 6M, 1Y, etc. must change the displayed range/buckets while preserving the same underlying historical accounting correctness.

### Scenario 7: Performance

The implementation must NOT execute one full account/transaction query per graph day.

Prefer:

```text
1 account query
+
1 baseline/balance query
+
1 bulk transaction query
+
in-memory incremental aggregation
```

or an equivalent efficient SQL aggregation/materialized-view approach.

---

# 15. Final Principle

The central rule to preserve throughout the implementation is:

> **Current balances describe the present. Transactions and opening balances describe the past.**

A historical net-worth graph must be built from historical state, not today's state projected backward.

An account added today with an existing balance is an **opening balance**, not income.

The graph should therefore answer:

> "What was the user's net worth at this point in time?"

rather than:

> "What are the user's accounts worth today, projected onto this point in time?"

Use the existing database schema and application architecture as the source of truth. Do not introduce duplicate financial concepts merely to make the chart work. If an existing table/event already represents an opening balance, reuse it. If the schema lacks the necessary temporal information, make the smallest schema change required to represent the account's effective opening state.

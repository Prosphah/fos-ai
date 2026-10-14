import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/account/export
 *
 * Returns the caller's own data as a downloadable file. With no query params
 * the whole archive is returned as JSON. With ?table=<name> the rows are
 * returned as CSV, which is what most spreadsheet tools want.
 *
 * Authorisation is enforced by RLS on every table below: the request carries
 * the caller's session, so a row belonging to someone else is not readable
 * even if the caller forges a table name. `id` is never selected, so a leaked
 * export cannot be used to probe internal identifiers.
 */

const CSV_TABLES = [
  "accounts",
  "transactions",
  "budgets",
  "savings_goals",
  "categories",
  "financial_goals",
  "notifications",
] as const;

type CsvTable = (typeof CSV_TABLES)[number];

const JSON_TABLES = [
  "financial_profiles",
  "user_settings",
  "risk_assessments",
  "accounts",
  "transactions",
  "budgets",
  "savings_goals",
  "categories",
  "financial_goals",
  "notifications",
  "feedback",
  "push_subscriptions",
  "waitlist",
] as const;

function isCsvTable(value: string): value is CsvTable {
  return (CSV_TABLES as readonly string[]).includes(value);
}

/**
 * RFC 4180 escaping, plus a guard against spreadsheet formula injection.
 *
 * A cell starting with =, +, - or @ is evaluated by Excel and Sheets, so a
 * transaction description like "=1+1" would become a formula. Prefixing an
 * apostrophe forces text. That is right for those four characters and wrong
 * for a negative number, which is ordinary data here and would otherwise be
 * imported as text and stop summing, so numbers are let through untouched.
 */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";

  // Real numbers, including negatives, must stay numeric in the spreadsheet.
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }

  let text = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (text === "") return "";

  if (/^[=+@\t\r]/.test(text)) text = `'${text}`;

  // A leading hyphen is only dangerous if what follows is not a number.
  if (text.startsWith("-") && !/^-\d*\.?\d+([eE][+-]?\d+)?$/.test(text)) {
    text = `'${text}`;
  }

  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";

  // Union of keys so a sparse first row cannot silently drop later columns.
  const columns = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row)))
  ).filter((key) => key !== "id");

  const lines = [columns.map(csvCell).join(",")];
  for (const row of rows) {
    lines.push(columns.map((col) => csvCell(row[col])).join(","));
  }
  return lines.join("\r\n");
}

function datedName(extension: string, table?: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return table
    ? `fos-ai-${table}-${stamp}.${extension}`
    : `fos-ai-export-${stamp}.${extension}`;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const table = new URL(request.url).searchParams.get("table");

  try {
    if (table) {
      if (!isCsvTable(table)) {
        return NextResponse.json(
          { error: "Unknown export table" },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("user_id", user.id)
        .limit(100_000);

      if (error) {
        return NextResponse.json(
          { error: "Could not export your data. Please try again." },
          { status: 500 }
        );
      }

      const rows = (data ?? []) as Record<string, unknown>[];
      // Drop the surrogate key and the internal user id from the export.
      for (const row of rows) {
        delete row.id;
        delete row.user_id;
      }

      return new NextResponse(toCsv(rows), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${datedName("csv", table)}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const archive: Record<string, unknown> = {
      exported_at: new Date().toISOString(),
      account: {
        email: user.email ?? null,
        created_at: user.created_at ?? null,
        last_sign_in_at: user.last_sign_in_at ?? null,
      },
      data: {},
    };

    const data = archive.data as Record<string, unknown>;
    const failures: string[] = [];

    for (const name of JSON_TABLES) {
      const { data: rows, error } = await supabase
        .from(name)
        .select("*")
        .eq("user_id", user.id)
        .limit(100_000);

      if (error) {
        // One unreadable table must not cost the caller the whole archive.
        failures.push(name);
        continue;
      }

      const cleaned = (rows ?? []) as Record<string, unknown>[];
      for (const row of cleaned) {
        delete row.id;
        delete row.user_id;
      }
      data[name] = cleaned;
    }

    if (failures.length > 0) {
      archive.incomplete = {
        tables: failures,
        note: "These tables could not be read and are missing from this export.",
      };
    }

    return new NextResponse(JSON.stringify(archive, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${datedName("json")}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not export your data. Please try again." },
      { status: 500 }
    );
  }
}
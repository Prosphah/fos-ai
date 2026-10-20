import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Jobs this app depends on, with how long a job may go without a successful
// run before we call it stale. send-reminders runs every minute, so 5 minutes
// of silence means it is gone. The recurring job is daily, so it gets slack.
const EXPECTED_JOBS = [
  { name: "send-reminders", maxSilentMinutes: 5 },
  { name: "process-recurring-transactions", maxSilentMinutes: 26 * 60 },
  // Hourly, like resend-purchase-emails. 90 minutes of slack, because a
  // silent recovery sweep does not strand a paying customer the way a silent
  // confirmation sweep does — it just means abandoned checkouts go unchased.
  { name: "abandoned-checkout-recovery", maxSilentMinutes: 90 },
];

interface CronJobRow {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
  last_run_at: string | null;
  last_status: string | null;
  last_return_message: string | null;
  is_http: boolean | null;
  last_http_status: number | null;
  last_http_body: string | null;
  last_http_at: string | null;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const CRON_SECRET = process.env.CRON_SECRET;

  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server misconfigured", detail: "SUPABASE_SERVICE_ROLE_KEY missing" },
      { status: 500 }
    );
  }

  const { data, error } = await supabase.rpc("cron_health");

  if (error) {
    return NextResponse.json(
      { error: "Failed to read cron state", detail: error.message },
      { status: 500 }
    );
  }

  const jobs = (data ?? []) as CronJobRow[];
  const now = Date.now();
  const problems: string[] = [];

  const status = EXPECTED_JOBS.map((expected) => {
    const job = jobs.find((j) => j.jobname === expected.name);

    if (!job) {
      problems.push(`${expected.name}: not registered in cron.job (re-create it)`);
      return { job: expected.name, ok: false, reason: "missing" };
    }

    if (!job.active) {
      problems.push(`${expected.name}: registered but inactive`);
      return { job: expected.name, ok: false, reason: "inactive", schedule: job.schedule };
    }

    if (!job.last_run_at) {
      problems.push(`${expected.name}: never ran`);
      return { job: expected.name, ok: false, reason: "never_ran", schedule: job.schedule };
    }

    const silentMinutes = Math.round((now - new Date(job.last_run_at).getTime()) / 60000);
    if (silentMinutes > expected.maxSilentMinutes) {
      problems.push(
        `${expected.name}: no run for ${silentMinutes}m (expected within ${expected.maxSilentMinutes}m)`
      );
      return {
        job: expected.name,
        ok: false,
        reason: "stale",
        schedule: job.schedule,
        silentMinutes,
      };
    }

    // For HTTP jobs, pg_cron's own status proves nothing. net.http_get queues
    // the request and returns, so cron reports "succeeded" even when the
    // endpoint 503s - which is exactly how a missing VAPID_* env var hid for a
    // week. Trust the recorded HTTP status instead.
    if (job.is_http) {
      const httpStatus = job.last_http_status;

      if (httpStatus == null) {
        problems.push(`${expected.name}: HTTP job but no recorded response`);
        return {
          job: expected.name,
          ok: false,
          reason: "no_http_response",
          schedule: job.schedule,
        };
      }

      if (httpStatus < 200 || httpStatus >= 300) {
        problems.push(
          `${expected.name}: HTTP ${httpStatus} - ${job.last_http_body ?? "no body"}`
        );
        return {
          job: expected.name,
          ok: false,
          reason: "http_error",
          schedule: job.schedule,
          httpStatus,
          httpBody: job.last_http_body,
          lastHttpAt: job.last_http_at,
        };
      }

      return {
        job: expected.name,
        ok: true,
        schedule: job.schedule,
        lastRunAt: job.last_run_at,
        httpStatus,
        silentMinutes,
      };
    }

    // Non-HTTP job: the cron run status is the only signal available.
    if (job.last_status && job.last_status !== "succeeded") {
      problems.push(
        `${expected.name}: last run ${job.last_status} - ${job.last_return_message ?? "no detail"}`
      );
      return {
        job: expected.name,
        ok: false,
        reason: "last_run_failed",
        schedule: job.schedule,
        lastStatus: job.last_status,
        lastReturnMessage: job.last_return_message,
      };
    }

    return {
      job: expected.name,
      ok: true,
      schedule: job.schedule,
      lastRunAt: job.last_run_at,
      lastStatus: job.last_status,
      silentMinutes,
    };
  });

  const ok = problems.length === 0;

  return NextResponse.json(
    { ok, checkedAt: new Date(now).toISOString(), problems, status },
    { status: ok ? 200 : 503 }
  );
}
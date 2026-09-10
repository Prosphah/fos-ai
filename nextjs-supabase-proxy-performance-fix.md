# Next.js + Supabase Proxy Performance Fix

## Objective

Investigate and fix unnecessary latency caused by the current Next.js `proxy.ts` + Supabase SSR session handling.

The goal is to:

1. Replace the Supabase `getUser()` call inside Proxy/session middleware with `getClaims()`.
2. Restrict Proxy matching so it does not run for static assets, images, `sw.js`, etc.
3. Preserve the existing Supabase SSR cookie-refresh behavior.
4. Do **not** blindly change application authentication or authorization logic elsewhere.
5. Measure the effect of the changes and identify any remaining application-level bottlenecks, especially on `/briefing`.
6. Avoid unnecessary architectural changes.

---

## Current implementation

### `proxy.ts`

The current Proxy is:

```ts
import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}
```

### `lib/supabase/middleware.ts`

The current implementation is:

```ts
import { createServerClient } from "@Supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  await supabase.auth.getUser();

  return response;
}
```

---

## Observed performance data

The application has produced these development logs:

```text
GET /sw.js 404 in 12.0s (next.js: 7.2s, proxy.ts: 4.0s, application-code: 889ms)
GET / 307 in 19.3s (next.js: 3.1s, proxy.ts: 3.9s, application-code: 12.2s)
GET /sw.js 404 in 1748ms (next.js: 149ms, proxy.ts: 117ms, application-code: 1482ms)
GET /briefing 200 in 10.7s (next.js: 1136ms, proxy.ts: 94ms, application-code: 9.5s)
GET /logo-192.png 404 in 2.0s (next.js: 554ms, proxy.ts: 363ms, application-code: 1114ms)
GET /logo-192.png 404 in 1500ms (next.js: 408ms, proxy.ts: 120ms, application-code: 972ms)
GET /sw.js 404 in 438ms (next.js: 75ms, proxy.ts: 27ms, application-code: 336ms)
```

An important observation has already been experimentally confirmed:

> Replacing the Proxy implementation with a simple `NextResponse.next()` makes navigation between application sections noticeably faster.

However, the logs also show that Proxy is NOT the primary bottleneck for every route.

For example:

```text
GET /briefing
total: 10.7s
proxy.ts: 94ms
application-code: 9.5s
```

Therefore, do not assume that every performance problem is caused by Proxy.

The `/briefing` route likely has a separate application-level bottleneck that should be investigated after the Proxy changes.

---

# Required changes

## 1. Replace `getUser()` inside the Supabase session middleware

Change:

```ts
await supabase.auth.getUser();
```

to:

```ts
await supabase.auth.getClaims();
```

### Important

This change applies specifically to the session/authentication check performed by the Proxy.

Do NOT globally replace every `getUser()` call in the project.

Other parts of the application may legitimately need `getUser()` when they require the current user record.

Before changing other authentication code, inspect its purpose.

The architectural intent is:

```text
Proxy
  ↓
getClaims()
  ↓
verify the authenticated identity/session
  ↓
continue request
```

while application code can still use:

```ts
supabase.auth.getUser()
```

when it genuinely needs the current user record.

Do not replace `getUser()` elsewhere unless there is a specific reason.

---

# 2. Add a restrictive Proxy matcher

The current Proxy does not show a `config.matcher`.

Add one so that Supabase session middleware does not unnecessarily execute for static assets and files that do not need authentication/session handling.

At minimum, exclude:

- `_next/static`
- `_next/image`
- `favicon.ico`
- `sw.js`
- SVG
- PNG
- JPG/JPEG
- GIF
- WebP

A suitable starting point is:

```ts
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

Do not blindly assume this matcher is perfect for the application.

Inspect the project first.

If there are other known static files or public assets that should not pass through Supabase session handling, account for them appropriately.

Do not exclude authenticated application routes.

---

# 3. Keep the Proxy thin

The Proxy should remain responsible for request-level session handling only.

Do NOT move the following into Proxy:

- database queries
- user profile queries
- business logic
- application data fetching
- role/permission database lookups
- AI calls
- expensive API requests
- unrelated redirects
- component logic

The desired architecture is:

```text
Browser request
      ↓
Next.js Proxy
      ↓
Supabase session/claims handling
      ↓
Application route
      ↓
Server Component / Server Action / Route Handler
      ↓
Application-specific data fetching
```

---

# 4. Preserve Supabase cookie handling

Do not remove or simplify the existing `cookies.getAll()` / `cookies.setAll()` implementation without understanding why it exists.

The existing logic:

```ts
cookies: {
  getAll() {
    return request.cookies.getAll();
  },
  setAll(cookiesToSet) {
    cookiesToSet.forEach(({ name, value }) => {
      request.cookies.set(name, value);
    });

    response = NextResponse.next({ request });

    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
  },
},
```

exists to correctly propagate refreshed Supabase auth cookies.

Preserve this behavior.

If the current version of `@supabase/ssr` or Supabase's current recommended Next.js pattern requires additional cache/header handling, inspect the installed package/documentation and make the smallest compatible improvement necessary.

Do not introduce speculative changes.

---

# 5. Fix or investigate `/sw.js` and `/logo-192.png`

The application is requesting:

```text
/sw.js
/logo-192.png
```

and both return 404.

Determine why these files are being requested.

Search the project for references to:

```text
sw.js
logo-192.png
serviceWorker
service-worker
manifest
apple-touch-icon
```

Possible sources include:

- PWA configuration
- service-worker registration
- `manifest.json`
- metadata
- layout files
- custom client-side code

Do not create dummy files merely to silence the 404s.

If the application intentionally uses a service worker/PWA, determine whether the files are actually supposed to exist and implement the correct solution.

If the references are obsolete and the project does not use PWA functionality, remove the unnecessary references.

The immediate performance goal is also to ensure these static asset requests do not execute the Supabase Proxy.

---

# 6. Investigate the `/briefing` bottleneck separately

After fixing Proxy, benchmark `/briefing`.

The current evidence is:

```text
GET /briefing 200 in 10.7s
next.js: 1.136s
proxy.ts: 94ms
application-code: 9.5s
```

This means Proxy is clearly NOT responsible for the majority of the `/briefing` latency.

Do not "fix" this by making arbitrary changes.

Instead, inspect the `/briefing` route and its dependency chain.

Look for:

- sequential server-side fetches
- Supabase requests
- `await` calls that could run in parallel
- AI SDK calls
- Google AI model calls
- expensive database queries
- unnecessary `getUser()` calls
- unnecessary `getSession()` calls
- large server-side computations
- expensive module imports
- synchronous work
- redirects
- duplicated data fetching
- server/client component boundaries
- unnecessary dynamic rendering
- waterfall requests

Pay particular attention to patterns like:

```ts
const a = await fetchA();
const b = await fetchB();
const c = await fetchC();
```

where independent operations could potentially be:

```ts
const [a, b, c] = await Promise.all([
  fetchA(),
  fetchB(),
  fetchC(),
]);
```

Only make such changes when the operations are actually independent and semantics remain unchanged.

Also inspect whether `/briefing` invokes an AI model during page rendering. If so, determine whether that is expected behavior and whether the request is intentionally blocking the entire page render.

Do not change product behavior just to make the page faster.

---

# 7. Check authentication duplication

Search the application for:

```text
auth.getUser(
auth.getSession(
auth.getClaims(
createServerClient(
createBrowserClient(
```

Determine whether the application is performing redundant authentication work.

A problematic pattern would be something like:

```text
Request
  ↓
Proxy
  ↓
getUser()
  ↓
Supabase
  ↓
Dashboard layout
  ↓
getUser()
  ↓
Supabase again
  ↓
Page
  ↓
getUser()
  ↓
Supabase again
```

Do not automatically eliminate every call.

Instead, identify which calls are necessary and whether they can be reused or moved to the appropriate layer.

---

# 8. Do not confuse development compilation time with application latency

The project is using:

```json
"next": "16.2.10"
```

and the observed timings are from development mode.

Keep these categories separate:

```text
next.js
proxy.ts
application-code
```

If:

```text
next.js: 5s
proxy.ts: 50ms
application-code: 100ms
```

then Proxy is not the issue.

If:

```text
next.js: 100ms
proxy.ts: 4s
application-code: 100ms
```

then Proxy/session middleware is highly suspicious.

If:

```text
next.js: 1s
proxy.ts: 100ms
application-code: 9s
```

then investigate application code.

Do not optimize the wrong layer.

---

# 9. Expected final Proxy implementation

Unless project-specific requirements dictate otherwise, the intended result should be approximately:

### `proxy.ts`

```ts
import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### `lib/supabase/middleware.ts`

```ts
import { createServerClient } from "@Supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  await supabase.auth.getClaims();

  return response;
}
```

Do not copy this blindly if inspection of the current project reveals an incompatible requirement. Adapt it while preserving the intended behavior.

---

# 10. Verification requirements

After making the changes:

1. Run the project's existing lint command:

```bash
npm run lint
```

2. Run a production build:

```bash
npm run build
```

3. Start the production server if practical:

```bash
npm run start
```

4. Test at least:

```text
/
/briefing
```

5. Verify that:

```text
/sw.js
/logo-192.png
```

are either:
- no longer requested, or
- correctly served if the application genuinely needs them.

6. Run the development server and compare Proxy timing before/after.

7. Report the observed timings for:

```text
/
/briefing
/sw.js
/logo-192.png
```

where applicable.

---

# Important constraints

- Do not rewrite the authentication architecture.
- Do not replace Supabase with another auth provider.
- Do not remove Supabase SSR.
- Do not globally replace `getUser()`.
- Do not disable authentication merely to improve performance.
- Do not add arbitrary caching that could create stale-auth/security problems.
- Do not create fake `sw.js` or image files just to eliminate 404s.
- Do not make unrelated UI or feature changes.
- Keep the diff focused.
- Preserve existing behavior.
- Prefer evidence from profiling/logs over assumptions.

---

# Final report

When finished, provide:

## Changes made

List each actual code change.

## Proxy performance

Compare the relevant before/after timings.

## `/briefing` performance

State whether the 9.5s application-code bottleneck improved.

If it did not, identify the most likely remaining bottleneck and explain where it occurs.

## Static assets

Explain what was causing `/sw.js` and `/logo-192.png` requests and what was done.

## Validation

Report the results of:

```bash
npm run lint
npm run build
```

Also mention any warnings or issues that remain.

## Files changed

Provide a concise list of modified files.

Do not make additional changes beyond this scope without reporting why they are necessary.

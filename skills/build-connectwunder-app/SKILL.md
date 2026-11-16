---
name: build-connectwunder-app
description: Build or integrate a private, externally hosted ConnectWunder workspace application with owner-approved registration, user login, scoped board reads and navigation. Use for dashboards, portals and small workspace apps; not for public feeds, autonomous workers or general ConnectWunder record maintenance.
---

# Build a ConnectWunder application

Deliver the user's first useful workflow and prove that it works. A dashboard is
one example, not a fixed application template. Keep their frontend framework and
hosting when suitable. This kit does not require a particular agent or model API.

1. Establish the purpose, intended users, selected workspace and first useful
   result. Reuse facts already provided. Ask about missing business choices and
   any additional paid service before committing to them.
2. Read [setup](references/setup.md). Inspect existing ConnectWunder capabilities
   and the target application's code. State briefly which services you will reuse
   and what application-owned state is actually needed. Do not recreate workspace
   accounts, membership, boards or supported domain operations in a parallel system.
3. Use the connected target-environment ConnectWunder tools or the documented
   owner/admin setup UI to prepare registration. Resolve IDs through authorized
   reads. Show the actual requested audience, board scope and application origin;
   obtain the required human sign-in/consent. Setup access is not runtime access.
4. Implement [authentication](references/auth.md), the minimum [data flow](references/data.md)
   and [navigation](references/navigation.md). Keep tokens server-only and exact
   environment/client/resource bindings. The registered launch route always starts
   PKCE to bind the app to the current ConnectWunder user, even with an old app session.
5. Follow [security](references/security.md) and the checks below. Do not label a
   simulated check as a real provider or hosting result. Resolve failures, then
   test the same user workflow again. Stop only for a named missing access,
   business decision or external dependency that you cannot safely resolve.
6. Report the usable URL, included behavior, actual checks, any remaining gap and
   who owns its next action. Publish or change an audience only within the user's
   authorization. Never silently make a private Sites application public.

## Small completion check

- The intended user can open the app from ConnectWunder, use the first meaningful
  feature and return to the correct workspace.
- A second opening reuses an active approved connection without another manual
  password step. Initial/changed consent and expired login remain honest user steps.
- Existing app user B cannot persist when launching from ConnectWunder user A.
- The selected boards remain the upper bound; a second user/workspace and revoked
  access are denied by server requests, not merely hidden in the interface.
- Refresh works under parallel requests; rejected refresh returns one clean 401,
  and timeouts preserve recoverable local work instead of redirecting in a loop.
- Actual browser checks cover the feature, narrow-screen layout, keyboard access,
  loading/empty/error states and visible Imprint/Privacy links.
- Source, browser JSON, screenshots, logs and published examples reveal no tokens
  or real third-party personal data. Use synthetic acceptance data.

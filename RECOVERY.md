# Deployment status

**Written for: an engineer or agent picking this repo up cold.**

Last updated 2026-10-27.

> **This repository is public.** Nothing about servers, hostnames, paths or credentials
> belongs in this file. The operational detail lives in the private backend repo at
> `docs/RECOVERY.md`. If you need it and cannot reach it, ask the owner — do not reconstruct
> it here.

## What happened

On 27 October 2026 the infrastructure that served Songdis production became unavailable
through no fault of the application. The API, this site and the admin were all affected.
Everything has been rebuilt on replacement infrastructure and is serving again.

The application code was not the cause and was not changed by the recovery.

## What this means if you are working on this repo

**Automated deployment is currently disabled in practice.** The workflows in
`.github/workflows/` still target the previous infrastructure, so a push will run a deploy
job that fails. That failure is expected. It does **not** mean your change is broken, and it
does **not** mean your change is live. Releases are being made by hand until the workflows
are repointed.

So: merging is safe, but do not assume anything you merge reaches users. Confirm with
whoever is handling releases.

**The API base URL is compiled into the bundle.** `NEXT_PUBLIC_API_URL` is a build argument,
not a runtime variable — it is baked in by `next build`. Pointing the site at a different
API means rebuilding the image, not restarting the container. The same is true of
`NEXT_PUBLIC_ANALYTICS_V2` and `NEXT_PUBLIC_AYO_URL`.

```
NEXT_PUBLIC_API_URL=https://prod.songdis.com/api
NEXT_PUBLIC_ANALYTICS_V2=true
```

Note the `/api` suffix: this app includes it in the base URL. The admin app does the
opposite and appends `/api` itself, so the two are not interchangeable — copying a value
between them will produce `/api/api/...` or a 404.

## Known user-visible problems that are not bugs in this code

Before investigating a report, check whether it is one of these:

- **Audio and artwork may not load.** A storage credential was lost in the outage and is
  being recovered. The media itself is intact. Nothing in this repo will fix it.
- **Data created shortly before the outage may be missing.** Production was restored from a
  backup, and a window of activity immediately before the failure is not in it. A release an
  artist is sure they submitted may genuinely not exist yet. This is being reconciled
  separately.
- **Features backed by third-party services may fail** — payments, identity verification and
  some analytics integrations are not yet reconfigured.

Reporting any of these as a frontend defect will waste your time.

## If you are an agent picking this up

1. Read `CLAUDE.md` in this repo first. It describes the three-repo layout, the upload flow
   and the conventions, and none of that changed.
2. Read the private backend repo's `docs/RECOVERY.md` before touching anything deployed.
3. Assume you cannot deploy. Build and typecheck locally (`npm run build` — it catches what
   `tsc` alone misses), and hand changes to whoever has infrastructure access.

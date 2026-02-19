# Staging Approval Checklist (Agency Review)

Use this checklist when sharing a preview with the agency before production release.

## 1) Deployment Strategy

### Recommended (most reliable)
- Deploy app to Vercel (Preview/Production flow).
- Use a hosted DB for staging + production (Postgres recommended).
- Protect staging with password protection.

### What this means in practice (hosted Postgres)

- Use a managed Postgres provider (Neon, Supabase, Railway, Render, RDS, etc.) instead of local SQLite for shared review.
- Create **two separate databases**:
  - `staging` (for agency review and testing)
  - `production` (live traffic only)
- Never let staging and production share the same DB.

Why Postgres is recommended:
- Better for multi-user environments than file-based SQLite.
- More reliable backups, restore options, and monitoring.
- Matches common hosting/deployment workflows and scales better.

Prisma + environment setup:
- In `schema.prisma`, use `provider = "postgresql"` when moving from SQLite.
- Keep different env vars per environment:
  - Staging: `DATABASE_URL=<staging-postgres-url>`
  - Production: `DATABASE_URL=<production-postgres-url>`
- In Vercel, set env vars separately for Preview/Staging and Production.

Migration discipline:
- Generate/test migrations in dev first.
- Apply to staging and verify.
- Apply to production only after approval.
- Use:
  - `npx prisma migrate deploy` (CI/deployed env)
  - avoid `migrate dev` in production.

Important for this repository:
- Current historical migrations were created on SQLite.
- For first Supabase bootstrap, prefer:
  - `npm run db:push` (creates schema on Postgres from current Prisma models)
  - `npm run db:seed` (optional test data)
- After bootstrap, you can keep using Prisma migrations for future schema changes.

Data safety rules:
- Enable automated daily backups (or provider snapshots).
- Before major releases, take an on-demand backup.
- Keep staging data non-sensitive when possible.

### Fast temporary option
- Keep local demo (`localhost`) + screen-share.
- Good for same-day review, but not ideal for async agency QA.

## 2) Staging Environment Setup

- Create branch: `staging`.
- Connect repo to Vercel.
- Configure environment variables in Vercel (Staging):
  - `DATABASE_URL`
  - `DIRECT_URL`
  - `JWT_SECRET`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_STORAGE_BUCKET` (example: `uploads`)
  - `NODE_ENV=production`
- Run migrations against staging DB:
  - `npx prisma migrate deploy`
- Seed staging data if needed:
  - `npm run db:seed`

## 3) Pre-Share Quality Gate

Run locally before sharing any preview:

```bash
npm run lint
npm run build
```

Manual smoke check (staging URL):
- Public: `/`, `/tours`, `/tours/[id]`, `/contact`
- Admin login and save flows: `/admin/site`
- CRM list/details load: `/admin/crm/clientes`
- Tour image roles:
  - Card image appears on cards
  - Banner image appears at detail top
  - Gallery excludes card/banner images (no repeats)

## 4) Agency Review Package (Send This)

Share one message with:
- Staging URL
- Access password (if protected)
- Test admin credentials
- Scope for this review (what changed)
- Deadline for consolidated feedback

Suggested message:

```text
Hi team,

Staging review is ready:
- URL: <staging-url>
- Password: <password>
- Admin: <email> / <password>

Scope in this round:
1) Tours card/banner/gallery image selection behavior
2) Tour detail page content and gallery
3) Admin save/edit flows

Please send consolidated feedback by <date> using this format:
Page | Issue | Requested Change | Priority (High/Med/Low) | Screenshot
```

## 5) Feedback Intake Template

Use this table in Notion/Google Sheet/Jira:

| ID | Page | Current Behavior | Requested Change | Priority | Screenshot | Status |
|---|---|---|---|---|---|---|
| 1 | /tours/[id] | Banner crops logo | Use alternate banner image | High | link | Open |

Status values:
- Open
- In Progress
- Ready for Review
- Approved

## 6) Revision Loop

- Implement only approved scope.
- Re-test changed flows.
- Redeploy staging.
- Share a short changelog:
  - Fixed
  - Deferred
  - Needs decision

## 7) Final Approval Gate (Before Production)

- Agency sign-off in writing (email or issue comment).
- No open High-priority issues.
- `npm run lint` and `npm run build` passing.
- DB migration plan confirmed for production.
- Rollback plan ready (previous deploy and DB backup).

## 8) Production Release Steps

1. Merge approved commit to `main`.
2. Deploy production.
3. Run production migrations (`prisma migrate deploy`).
4. Smoke test critical routes.
5. Send “Release Complete” note.

## 9) Post-Release (24h)

- Monitor errors and broken links.
- Track agency-reported regressions.
- Log quick patches as separate hotfixes.

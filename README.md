# dev-home

## Requirements

- Node.js `v24.13.0`
- pnpm `10.10.0`

Install, dev, build, and start commands are blocked unless both versions match exactly.

## Phase 1 Stack

- Next.js (App Router)
- Prisma ORM
- PostgreSQL
- Docker / Docker Compose

## Setup

Create your env file:

```bash
cp .env.example .env
# PowerShell:
# Copy-Item .env.example .env
```

Install dependencies:

```bash
pnpm install
```

Start PostgreSQL in Docker:

```bash
pnpm docker:up
```

Create and apply the first Prisma migration:

```bash
pnpm db:migrate
```

Generate Prisma client:

```bash
pnpm db:generate
```

Run the app locally:

```bash
pnpm dev
```

## Full Docker Dev

Run app + database in Docker:

```bash
pnpm docker:dev
```

## Other commands

```bash
pnpm lint
pnpm build
pnpm start
pnpm db:push
pnpm db:studio
pnpm docker:down
```

## Notes

- Runtime checks are implemented in `scripts/enforce-runtime.cjs`.
- `preinstall`, `predev`, `prebuild`, and `prestart` enforce the required versions.
- The app uses the Next.js App Router (`app/`).
- API helper lives in `lib/http.ts` and expects `NEXT_PUBLIC_API_BASE_URL` when calling external APIs.
- Prisma schema is at `prisma/schema.prisma`.

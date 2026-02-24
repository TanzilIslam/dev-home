# dev-home

## Requirements

- Node.js `v24.13.0`
- pnpm `10.10.0`

Install, dev, build, and start commands are blocked unless both versions match exactly.

## Getting Started

## Setup

Install dependencies:

```bash
pnpm install
```

## Run

Run the development server:

```bash
pnpm dev
```

## Other commands

```bash
pnpm lint
pnpm build
pnpm start
```

## Notes

- Runtime checks are implemented in `scripts/enforce-runtime.cjs`.
- `preinstall`, `predev`, `prebuild`, and `prestart` enforce the required versions.
- The app uses the Next.js App Router (`app/`).
- API helper lives in `lib/http.ts` and expects `NEXT_PUBLIC_API_BASE_URL` when calling external APIs.

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

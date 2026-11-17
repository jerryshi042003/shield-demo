# Shield demo

Live: https://shield-demo-nine.vercel.app

Shield is the internal sports-business reporting app I co-built at work: one Next.js product serving the LA Kings, LA Galaxy and Ontario Reign, with governed report pages and an Ask panel backed by Databricks Genie. This repository is the public portfolio demo of that app. The pages, components and layout are the same as the real product, and everything behind them has been replaced.

There is no sign-in. Visitors land on Galaxy Overview and can switch to the Kings; there are no roles, allowlists or identity headers.

There is no real data. Report numbers come from `lib/demo/fixtures/*.json`, which the seeded generator `scripts/generate-demo-fixtures.mjs` writes (`pnpm fixtures`). The API routes keep their production response shapes but read only those fixtures, and the pacing and marketing pages use clearly labeled invented scenarios. The demo makes no warehouse, storage, function-app or telemetry calls.

There are no real people. Sales representatives and the viewer are obviously fictional, such as "Casey Demo" and "Demo Viewer".

Ask is scripted. `lib/demo/genie.ts` matches a set of example questions to canned SQL and computes the answers from the fixtures, and the panel says so. Report terms such as SPOM (Salesperson of the Month), FSE (full-season equivalent) and ATP (average ticket price) are explained where they appear, and Ask answers definition questions from the same glossary.

Team names and logos belong to their clubs and are used here only to show the product as it was built. Built by Jerry Shi.

## Run locally

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build
```

Pushes to `main` deploy to Vercel automatically.

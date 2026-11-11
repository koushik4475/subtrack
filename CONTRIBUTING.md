# Contributing

1. Create a focused branch from `main`.
2. Install dependencies with `npm install`.
3. Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` and `npm run test:e2e`.
4. Add tests for billing calculations, date boundaries, data validation and persistence changes.
5. Do not commit browser databases, real financial exports, credentials, tokens or `.env` files.
6. Keep currency values in integer minor units and never add different currencies together.
7. Explain any calculation assumption or user-visible limitation in the README.

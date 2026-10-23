# Build and deploy the MySQL application

The current schema, server, and Docker Compose use MySQL. The latest MySQL migration supersedes the old Neon/PostgreSQL guides. Do not change an existing database provider or import data automatically. A PostgreSQL/Neon deployment needs a separately reviewed provider and data migration.

Use patched Node 22.23.4 (or a patched supported version allowed by package.json). From the repository root run `npm ci` then `npm run build`. Prisma client generation needs no database connection; server startup and schema commands require `DATABASE_URL=mysql://...`. Prisma client, CLI, and MariaDB adapter are locked to the same version. The driver receives the full URL, preserving encoded credentials and supported MariaDB pool/TLS options. Prisma 6 `sslaccept`, `sslcert`, and `sslidentity` parameters fail explicitly: migrate them to the MariaDB driver's verified TLS configuration before deploying remote MySQL. Never disable certificate verification to resolve a connection failure.

## Cloudflare Pages frontend

Set root directory to `client`, build command to `npm run build`, and output directory to `dist`. Set `NODE_VERSION=22.23.4`, remove an older dashboard override, and start a fresh build. With a repository-root build configuration instead, use `npm run build:client` and output `client/dist`. Install with the committed root workspace lockfile (`npm ci --workspace client --ignore-scripts` from the repository root). The frontend requires no database credentials. Set `VITE_API_URL` to the deployed backend API URL. Do not put database URLs or private server keys in Vite variables.

The CI frontend job builds from the client directory with no database environment. CI proves the source build; dashboard configuration and the final Pages deployment still require access to that account.

## Backend and Docker

Use a MySQL database matching the existing schema. On a native host, build from the repository root and start with `npm start --workspace server`. For Docker, use either the root Dockerfile or `docker/Dockerfile.server`, both with repository-root context. Both include the generated Prisma client and production dependencies. Start commands do not reset, seed, or modify the database.

Before a first deployment, back up any existing database and review the schema changes. Apply them explicitly with `npm run db:push --workspace server` (native) or `docker compose -f docker/docker-compose.yml run --rm server npm run db:push` (Docker). This command does not accept data loss; investigate any refusal instead of adding `--accept-data-loss`. The seed command intentionally wipes data and must never run against an existing production database.

Then rebuild with `docker compose -f docker/docker-compose.yml build --pull --no-cache` and recreate services with `docker compose -f docker/docker-compose.yml up -d`. Confirm Node and CA versions and the actual application's certificate rejection after deployment, following https://render.com/docs/advisory-emudhra. Native hosts must also refresh their system CA store and restart old processes. A source merge does not update a running host.

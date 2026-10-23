import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

export function createPrismaClient(databaseUrl = process.env.DATABASE_URL) {
  let url: URL;
  try {
    if (!databaseUrl) throw new Error();
    url = new URL(databaseUrl);
    if (url.protocol !== 'mysql:') throw new Error();
  } catch {
    throw new Error('DATABASE_URL must be a MySQL connection URL (mysql://).');
  }
  // These Prisma 6 options are not MariaDB driver options. Never silently drop
  // certificate settings while switching the previously incomplete Prisma 7 setup.
  if (['sslaccept', 'sslcert', 'sslidentity'].some(key => url.searchParams.has(key))) {
    throw new Error('Use MariaDB driver TLS options instead of Prisma 6 sslaccept/sslcert/sslidentity options. See BUILD_AND_DEPLOY.md.');
  }
  // Pass the original URL to the driver to preserve encoded credentials and its
  // supported pool/TLS options; the database provider and data model stay MySQL.
  return new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl!) });
}

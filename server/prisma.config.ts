import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

/**
 * Prisma 7 Configuration
 * Centralized location for defining database connection and CLI behavior.
 * This satisfies the "no URL in schema" best practice and modern architecture.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
})

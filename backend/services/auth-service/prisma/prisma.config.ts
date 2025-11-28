import { defineConfig } from 'prisma/config';

defineConfig.generator = {
  client: {
    provider: 'prisma-client-js',
    previewFeatures: ['multiSchema'],
    binaryTargets: ['native', 'linux-musl-arm64-openssl-3.0.x'],
    output: '../../../node_modules/@aaron/prisma-client-auth',
  },
};

export default defineConfig({
  datasource: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL,
    schemas: ['auth'],
  },
});

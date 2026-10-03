/**
 * Authz test bootstrap: point Prisma at the test DB, mock auth + S3.
 * Must run before any cloud / db import.
 */
import { vi } from 'vitest'
import type { User as AppUser } from '~/common/user'

process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST ??
  'postgresql://polyrecorder:polyrecorder@127.0.0.1:5434/polyrecorder_test'

/** Controlled by tests via `asUser` / `asAnon`. */
export const mockGetUserFromRequest = vi.fn<
  (request: Request) => Promise<AppUser | null>
>(() => Promise.resolve(null))

// Factory must not use Vitest's `importOriginal` — Bun's test runner doesn't
// provide it (`bun test`). Cloud code only needs `getUserFromRequest` from auth.
vi.mock('~/service/auth.server', () => ({
  getUserFromRequest: (request: Request) => mockGetUserFromRequest(request),
}))

vi.mock('~/service/s3.server', () => ({
  isS3Configured: () => true,
  createPresignedGetUrl: vi.fn(
    async ({ objectKey }: { objectKey: string }) =>
      `https://s3.test/get/${encodeURIComponent(objectKey)}`,
  ),
  createPresignedPutUrl: vi.fn(async () => ({
    url: 'https://s3.test/put',
    headers: {} as Record<string, string>,
  })),
  copyObject: vi.fn(async () => undefined),
  deleteAllObjectsForUser: vi.fn(async () => undefined),
  deleteObjectsByKeys: vi.fn(async () => undefined),
  headObject: vi.fn(async () => ({
    contentLength: 1024,
    contentType: 'audio/webm',
  })),
}))

// Dev-only API: get/set the mock time used by schedule.ts and useMockTime.ts
// GET  /api/dev/mock-time          → { iso: string }
// POST /api/dev/mock-time  { iso } → { ok: true }
//
// Patching both source files so the change survives a server restart.
// Only available in development (NODE_ENV !== 'production').

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(process.cwd())

function getScheduleFile() {
  return resolve(ROOT, 'server/api/schedule.ts')
}

function getMockTimeFile() {
  return resolve(ROOT, 'app/composables/useMockTime.ts')
}

function readCurrentIso(): string {
  const src = readFileSync(getScheduleFile(), 'utf8')
  const m = src.match(/^const MOCK_NOW_ISO = '([^']*)'/m)
  return m?.[1] ?? ''
}

function patchFile(filePath: string, pattern: RegExp, replacement: string) {
  const src = readFileSync(filePath, 'utf8')
  const patched = src.replace(pattern, replacement)
  writeFileSync(filePath, patched, 'utf8')
}

export default defineEventHandler(async (event) => {
  if (!import.meta.dev) {
    throw createError({ statusCode: 403, message: 'Not available in production' })
  }

  if (event.method === 'GET') {
    return { iso: readCurrentIso() }
  }

  if (event.method === 'POST') {
    const body = await readBody<{ iso: string }>(event)
    const iso = (body?.iso ?? '').trim()

    // Validate: must be empty string or a valid ISO date string
    if (iso && isNaN(Date.parse(iso))) {
      throw createError({ statusCode: 400, message: 'Invalid ISO date string' })
    }

    // Patch server/api/schedule.ts
    patchFile(
      getScheduleFile(),
      /^const MOCK_NOW_ISO = '.*'/m,
      `const MOCK_NOW_ISO = '${iso}'`
    )

    // Patch app/composables/useMockTime.ts
    patchFile(
      getMockTimeFile(),
      /^export const MOCK_NOW_ISO = '.*'/m,
      `export const MOCK_NOW_ISO = '${iso}'`
    )

    return { ok: true, iso }
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})

import type { LoaderFunctionArgs } from '@remix-run/node'
import { prisma } from '~/service/db.server'

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function truncate(value: string, max: number): string {
  const trimmed = value.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1).trimEnd()}…`
}

export async function loader({ params }: LoaderFunctionArgs) {
  const songId = String(params.songId ?? '')
  const song = songId
    ? await prisma.song.findFirst({
        where: { id: songId, isPublic: true },
        include: {
          tracks: {
            where: { uploadedAt: { not: null } },
            select: { id: true },
          },
        },
      })
    : null

  const title = song ? truncate(song.name, 42) : 'PolyRecorder'
  const subtitle = song
    ? song.tracks.length === 1
      ? '1 piste'
      : `${song.tracks.length} pistes`
    : 'polyrecorder.app'

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f3efe6"/>
      <stop offset="55%" stop-color="#e7e0d2"/>
      <stop offset="100%" stop-color="#d9d0bf"/>
    </linearGradient>
    <linearGradient id="ink" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1c1914"/>
      <stop offset="100%" stop-color="#3a342c"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1040" cy="90" r="180" fill="#1c1914" fill-opacity="0.05"/>
  <circle cx="160" cy="540" r="220" fill="#1c1914" fill-opacity="0.04"/>
  <rect x="72" y="72" width="1056" height="486" rx="28" fill="#fffaf2" fill-opacity="0.55" stroke="#1c1914" stroke-opacity="0.08"/>
  <text x="110" y="160" font-family="Georgia, 'Times New Roman', serif" font-size="28" font-weight="700" letter-spacing="0.08em" fill="#5c554a">POLYRECORDER</text>
  <text x="110" y="310" font-family="Georgia, 'Times New Roman', serif" font-size="72" font-weight="700" fill="url(#ink)">${escapeXml(title)}</text>
  <text x="110" y="390" font-family="Manrope, Helvetica, Arial, sans-serif" font-size="32" font-weight="600" fill="#5c554a">${escapeXml(subtitle)}</text>
  <text x="110" y="500" font-family="Manrope, Helvetica, Arial, sans-serif" font-size="24" fill="#7a7266">polyrecorder.app</text>
</svg>`

  return new Response(svg, {
    status: song ? 200 : 404,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': song
        ? 'public, max-age=300'
        : 'public, max-age=60',
    },
  })
}

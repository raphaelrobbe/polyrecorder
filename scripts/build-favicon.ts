import { Resvg } from '@resvg/resvg-js'
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import toIco from 'to-ico'

const root = join(import.meta.dirname, '..')
const publicDir = join(root, 'public')
const fontFile = join(import.meta.dirname, 'fonts', 'Nunito-ExtraBold.ttf')

const BRAND_POLY = '#F9FAFB'
const RECORDER_COLORS = [
  '#3694FF',
  '#5265FC',
  '#A346F3',
  '#D849D9',
  '#EB46B0',
  '#FD656B',
  '#FEA43B',
  '#FDAC35',
] as const

/** Mic mark (32×32 artboard) — spectrum bands + cradle mask. */
const MIC_MARK = `
  <defs>
    <mask id="logo-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32">
      <rect width="32" height="32" fill="#000000"/>
      <rect x="11" y="2.75" width="10" height="16" rx="5" fill="#ffffff"/>
      <path d="M8.125 13.75 A7.875 7.875 0 0 0 23.875 13.75" stroke="#ffffff" stroke-width="2.75" stroke-linecap="round" fill="none"/>
      <line x1="16" y1="21.625" x2="16" y2="27.125" stroke="#ffffff" stroke-width="2.75" stroke-linecap="round"/>
    </mask>
  </defs>
  <rect width="32" height="32" fill="#000000"/>
  <g mask="url(#logo-mask)">
    <rect x="0" y="2.75" width="32" height="3.5" fill="#FDAC35"/>
    <rect x="0" y="6" width="32" height="3.5" fill="#FEA43B"/>
    <rect x="0" y="9.25" width="32" height="3.5" fill="#FD656B"/>
    <rect x="0" y="12.5" width="32" height="3.5" fill="#EB46B0"/>
    <rect x="0" y="15.75" width="32" height="3.5" fill="#D849D9"/>
    <rect x="0" y="19" width="32" height="3.5" fill="#A346F3"/>
    <rect x="0" y="22.25" width="32" height="3.5" fill="#5265FC"/>
    <rect x="0" y="25.5" width="32" height="3.5" fill="#3694FF"/>
  </g>
`

/** Large app icon SVG (rasterized to PNG via Resvg + Nunito ExtraBold). */
function buildAppIconSvg(size: number): string {
  const micSize = size * 0.74
  const micX = (size - micSize) / 2
  const micTopInset = (2.75 / 32) * micSize
  // Stem tip ≈ 27.125 + half stroke (2.75/2) because of round linecaps.
  const micBottom = (28.5 / 32) * micSize
  const visualMicHeight = micBottom - micTopInset
  const fontSize = Math.round(size * 0.09)
  const gap = size * 0.04
  const stackHeight = visualMicHeight + gap + fontSize
  const stackTop = (size - stackHeight) / 2
  const micY = stackTop - micTopInset
  const scale = micSize / 32
  const textY = stackTop + visualMicHeight + gap + fontSize * 0.78
  const letterSpans = [
    `<tspan fill="${BRAND_POLY}">poly</tspan>`,
    ...[...'recorder'].map(
      (letter, i) => `<tspan fill="${RECORDER_COLORS[i]}">${letter}</tspan>`,
    ),
  ].join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img">
  <title>polyrecorder</title>
  <rect width="${size}" height="${size}" fill="#000000"/>
  <g transform="translate(${micX}, ${micY}) scale(${scale})">
    ${MIC_MARK}
  </g>
  <text
    x="${size / 2}"
    y="${textY}"
    text-anchor="middle"
    font-family="Nunito"
    font-size="${fontSize}"
    font-weight="800"
    letter-spacing="${(-0.03 * fontSize).toFixed(2)}"
  >${letterSpans}</text>
</svg>`
}

function rasterSvg(svg: string | Buffer, size: number): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    font: {
      fontFiles: [fontFile],
      loadSystemFonts: true,
      defaultFontFamily: 'Nunito',
    },
  })
  return Buffer.from(resvg.render().asPng())
}

const micSvg = readFileSync(join(publicDir, 'logo-mic.svg'))

function rasterMic(size: number): Buffer {
  const resvg = new Resvg(micSvg, {
    fitTo: { mode: 'width', value: size },
  })
  return Buffer.from(resvg.render().asPng())
}

/**
 * Mic centered on a black canvas with padding.
 * Maskable / home-screen icons need ~20%+ safe margin or Android crops the top.
 */
function buildPaddedMicSvg(size: number, contentRatio: number): string {
  const micSize = size * contentRatio
  const micX = (size - micSize) / 2
  const micY = (size - micSize) / 2
  const scale = micSize / 32
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img">
  <title>polyrecorder</title>
  <rect width="${size}" height="${size}" fill="#000000"/>
  <g transform="translate(${micX}, ${micY}) scale(${scale})">
    ${MIC_MARK}
  </g>
</svg>`
}

function rasterPaddedMic(size: number, contentRatio: number): Buffer {
  return rasterSvg(buildPaddedMicSvg(size, contentRatio), size)
}

// Small favicons: mic only (wordmark would be illegible).
const png16 = rasterMic(16)
const png32 = rasterMic(32)
writeFileSync(join(publicDir, 'favicon-16.png'), png16)
writeFileSync(join(publicDir, 'favicon-32.png'), png32)
writeFileSync(join(publicDir, 'favicon.png'), png32)
writeFileSync(join(publicDir, 'favicon.ico'), await toIco([png16, png32]))
copyFileSync(join(publicDir, 'logo-mic.svg'), join(publicDir, 'favicon.svg'))

// Large brand icons: mic + “polyrecorder” wordmark (OG / share previews).
writeFileSync(join(publicDir, 'icon-512.png'), rasterSvg(buildAppIconSvg(512), 512))
writeFileSync(join(publicDir, 'icon-192.png'), rasterSvg(buildAppIconSvg(192), 192))

// PWA "any": full-bleed mic (desktop / taskbar).
writeFileSync(join(publicDir, 'app-icon-512.png'), rasterMic(512))
writeFileSync(join(publicDir, 'app-icon-192.png'), rasterMic(192))

// Maskable: mic in the safe zone (~72%) so round Android masks don’t clip it.
const MASKABLE_RATIO = 0.72
writeFileSync(
  join(publicDir, 'app-icon-maskable-512.png'),
  rasterPaddedMic(512, MASKABLE_RATIO),
)
writeFileSync(
  join(publicDir, 'app-icon-maskable-192.png'),
  rasterPaddedMic(192, MASKABLE_RATIO),
)

// Apple touch: mild padding (iOS rounds corners).
writeFileSync(
  join(publicDir, 'apple-touch-icon.png'),
  rasterPaddedMic(180, 0.8),
)

console.log('Favicon + app icon assets written to public/')

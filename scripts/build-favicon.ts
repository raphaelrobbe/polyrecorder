import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'
import toIco from 'to-ico'

const root = join(import.meta.dirname, '..')
const publicDir = join(root, 'public')
const svg = readFileSync(join(publicDir, 'logo-mic.svg'))

function raster(size: number): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
  })
  return Buffer.from(resvg.render().asPng())
}

const png16 = raster(16)
const png32 = raster(32)
writeFileSync(join(publicDir, 'favicon-16.png'), png16)
writeFileSync(join(publicDir, 'favicon-32.png'), png32)
writeFileSync(join(publicDir, 'favicon.png'), png32)
writeFileSync(join(publicDir, 'apple-touch-icon.png'), raster(180))
writeFileSync(join(publicDir, 'icon-192.png'), raster(192))
writeFileSync(join(publicDir, 'icon-512.png'), raster(512))
writeFileSync(join(publicDir, 'favicon.ico'), await toIco([png16, png32]))
copyFileSync(join(publicDir, 'logo-mic.svg'), join(publicDir, 'favicon.svg'))

console.log('Favicon assets written to public/')

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves this repo at https://raphaelrobbe.github.io/polyrecorder/
export default defineConfig({
  base: '/polyrecorder/',
  plugins: [react(), tailwindcss()],
})

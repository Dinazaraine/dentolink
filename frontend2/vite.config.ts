import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
    assetsInclude: ['**/*.PNG'] // Ajoute la prise en charge des fichiers PNG en majuscule
})

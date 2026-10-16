import {fileURLToPath} from 'node:url'
import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Where npm installed the DSFR pictograms, whichever workspace it hoisted them to
      'dsfr-pictograms': fileURLToPath(
        import.meta.resolve('@codegouvfr/react-dsfr/dsfr/artwork/pictograms'),
      ),
    },
  },
})

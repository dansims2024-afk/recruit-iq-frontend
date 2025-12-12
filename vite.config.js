import { defineConfig } from 'vite'
    import react from '@vitejs/plugin-react'

    // https://vitejs.dev/config/
    export default defineConfig({
      plugins: [react()],
      // Crucial setting for Vercel deployment when using paths like './src/main.jsx'
      base: './', 
      
      build: {
        // Ensure Vercel knows where the build output should go
        outDir: 'dist',
        rollupOptions: {
            // Define main entry point for clarity
            input: {
                main: 'index.html'
            }
        }
      }
    })

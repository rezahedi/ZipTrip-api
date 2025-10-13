import fs from 'fs'
import dotenv from 'dotenv'

export function loadEnv(mode = process.env.NODE_ENV || 'development') {
  const envFiles = [`.env.local`, `.env.${mode}.local`, `.env.${mode}`, `.env`]

  // Load in reverse order (lowest priority first)
  envFiles.reverse().forEach((file) => {
    if (fs.existsSync(file)) {
      dotenv.config({ path: file, override: false })
      console.log(`Loaded ${file}`)
    }
  })
}

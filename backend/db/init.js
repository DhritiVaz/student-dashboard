import 'dotenv/config'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8')

pool.query(schema)
  .then(() => {
    console.log('Database schema applied successfully.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Failed to apply schema:', err)
    process.exit(1)
  })

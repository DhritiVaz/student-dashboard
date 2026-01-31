import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ...(process.env.NODE_ENV === 'production' && { ssl: { rejectUnauthorized: true } })
})

export default pool

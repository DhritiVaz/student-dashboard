import bcrypt from 'bcrypt'
import pool from './pool.js'

const DEMO_EMAIL = 'demo@university.edu'
const DEMO_PASSWORD = 'demo123'
const SALT_ROUNDS = 12

export async function seedDemoUser() {
  try {
    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [DEMO_EMAIL])
    if (existing.rows.length > 0) return
    const password_hash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS)
    await pool.query(
      `INSERT INTO users (email, password_hash, name, student_id, department, avatar)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [DEMO_EMAIL, password_hash, 'Demo Student', 'STU2024001', 'Computer Science', 'DS']
    )
    console.log('Demo user ready: demo@university.edu / demo123')
  } catch (err) {
    console.error('Seed demo user:', err.message)
  }
}

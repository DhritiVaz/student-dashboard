import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import pool from '../db/pool.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const SALT_ROUNDS = 12

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
})

function toUserRow(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    studentId: row.student_id ?? undefined,
    department: row.department ?? 'Not Specified',
    avatar: row.avatar ?? (row.name ? row.name.substring(0, 2).toUpperCase() : null),
    createdAt: row.created_at
  }
}

// POST /api/auth/signup — register (email + password required; name optional on backend but front sends it)
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, studentId, department } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    const emailNorm = String(email).toLowerCase().trim()
    if (!emailNorm.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address' })
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    const nameVal = name && String(name).trim() ? String(name).trim() : null
    if (!nameVal || nameVal.length < 2) {
      return res.status(400).json({ error: 'Name is required and must be at least 2 characters' })
    }

    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [emailNorm])
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }

    const password_hash = await bcrypt.hash(String(password), SALT_ROUNDS)
    const avatar = nameVal.substring(0, 2).toUpperCase()
    const student_id = studentId && String(studentId).trim() ? String(studentId).trim() : null
    const departmentVal = department && String(department).trim() ? String(department).trim() : 'Not Specified'

    const insert = await pool.query(
      `INSERT INTO users (email, password_hash, name, student_id, department, avatar)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, name, student_id, department, avatar, created_at`,
      [emailNorm, password_hash, nameVal, student_id, departmentVal, avatar]
    )
    const user = toUserRow(insert.rows[0])
    return res.status(201).json({ message: 'Account created successfully. Please sign in.', user })
  } catch (err) {
    console.error('Signup error:', err)
    return res.status(500).json({ error: 'Registration failed' })
  }
})

// POST /api/auth/login — login with email + password; issue JWT in HTTP-only cookie
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const emailNorm = String(email).toLowerCase().trim()
    const result = await pool.query(
      'SELECT id, email, name, student_id, department, avatar, created_at, password_hash FROM users WHERE LOWER(email) = $1',
      [emailNorm]
    )
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'No account found with this email. Please sign up first.' })
    }

    const row = result.rows[0]
    const match = await bcrypt.compare(String(password), row.password_hash)
    if (!match) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' })
    }

    const user = toUserRow(row)
    const token = jwt.sign(
      { userId: row.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )
    res.cookie('auth_token', token, cookieOptions())
    return res.status(200).json({ user })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Login failed' })
  }
})

// POST /api/auth/logout — clear auth cookie
router.post('/logout', (_req, res) => {
  res.clearCookie('auth_token', { httpOnly: true, secure: process.env.COOKIE_SECURE === 'true', sameSite: 'lax', path: '/' })
  return res.status(200).json({ message: 'Logged out' })
})

// GET /api/auth/me — return current user (protected; verifies JWT from cookie)
router.get('/me', requireAuth, (req, res) => {
  const user = toUserRow(req.user)
  return res.status(200).json({ user })
})

// PATCH /api/auth/profile — update profile (protected)
router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const { name, studentId, department } = req.body
    const updates = {}
    if (name != null && String(name).trim()) updates.name = String(name).trim()
    if (studentId != null) updates.student_id = String(studentId).trim() || null
    if (department != null) updates.department = String(department).trim() || 'Not Specified'
    if (updates.name) updates.avatar = updates.name.substring(0, 2).toUpperCase()
    if (Object.keys(updates).length === 0) {
      const user = toUserRow(req.user)
      return res.status(200).json({ user })
    }
    const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ')
    const values = Object.values(updates)
    values.push(req.user.id)
    const result = await pool.query(
      `UPDATE users SET ${setClause} WHERE id = $${values.length} RETURNING id, email, name, student_id, department, avatar, created_at`,
      values
    )
    const user = toUserRow(result.rows[0])
    return res.status(200).json({ user })
  } catch (err) {
    console.error('Profile update error:', err)
    return res.status(500).json({ error: 'Update failed' })
  }
})

export default router

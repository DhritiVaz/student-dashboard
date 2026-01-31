import jwt from 'jsonwebtoken'
import pool from '../db/pool.js'

/**
 * Protects private routes by verifying the JWT from the HTTP-only cookie.
 * Expects cookie name: auth_token (set by login).
 */
export async function requireAuth(req, res, next) {
  const token = req.cookies?.auth_token

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const result = await pool.query(
      'SELECT id, email, name, student_id, department, avatar, created_at FROM users WHERE id = $1',
      [decoded.userId]
    )
    if (result.rows.length === 0) {
      res.clearCookie('auth_token', { httpOnly: true, secure: process.env.COOKIE_SECURE === 'true', sameSite: 'lax', path: '/' })
      return res.status(401).json({ error: 'User not found' })
    }
    req.user = result.rows[0]
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      res.clearCookie('auth_token', { httpOnly: true, secure: process.env.COOKIE_SECURE === 'true', sameSite: 'lax', path: '/' })
      return res.status(401).json({ error: 'Session expired' })
    }
    res.clearCookie('auth_token', { httpOnly: true, secure: process.env.COOKIE_SECURE === 'true', sameSite: 'lax', path: '/' })
    return res.status(401).json({ error: 'Invalid token' })
  }
}

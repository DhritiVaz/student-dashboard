import { Router } from 'express'
import pool from '../db/pool.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/data — return current user's dashboard data (protected)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT courses, calendar_events, mind_space_items, timetable, files, grades, semesters, property_definitions FROM user_dashboard_data WHERE user_id = $1',
      [req.user.id]
    )
    const emptyTimetable = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] }
    if (rows.length === 0) {
      return res.status(200).json({
        courses: [],
        calendarEvents: [],
        mindSpaceItems: [],
        timetable: emptyTimetable,
        files: [],
        grades: [],
        semesters: [],
        propertyDefinitions: {}
      })
    }
    const row = rows[0]
    return res.status(200).json({
      courses: row.courses ?? [],
      calendarEvents: row.calendar_events ?? [],
      mindSpaceItems: row.mind_space_items ?? [],
      timetable: row.timetable ?? emptyTimetable,
      files: row.files ?? [],
      grades: row.grades ?? [],
      semesters: row.semesters ?? [],
      propertyDefinitions: row.property_definitions ?? {}
    })
  } catch (err) {
    console.error('GET /api/data:', err)
    return res.status(500).json({ error: 'Failed to load data' })
  }
})

// PUT /api/data — save current user's dashboard data (protected)
router.put('/', requireAuth, async (req, res) => {
  try {
    const {
      courses = [],
      calendarEvents = [],
      mindSpaceItems = [],
      timetable = {},
      files = [],
      grades = [],
      semesters = [],
      propertyDefinitions = {}
    } = req.body
    await pool.query(
      `INSERT INTO user_dashboard_data (user_id, courses, calendar_events, mind_space_items, timetable, files, grades, semesters, property_definitions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id) DO UPDATE SET
         courses = EXCLUDED.courses,
         calendar_events = EXCLUDED.calendar_events,
         mind_space_items = EXCLUDED.mind_space_items,
         timetable = EXCLUDED.timetable,
         files = EXCLUDED.files,
         grades = EXCLUDED.grades,
         semesters = EXCLUDED.semesters,
         property_definitions = EXCLUDED.property_definitions,
         updated_at = NOW()`,
      [
        req.user.id,
        JSON.stringify(courses),
        JSON.stringify(calendarEvents),
        JSON.stringify(mindSpaceItems),
        JSON.stringify(timetable),
        JSON.stringify(files),
        JSON.stringify(grades),
        JSON.stringify(semesters),
        JSON.stringify(propertyDefinitions)
      ]
    )
    return res.status(200).json({ message: 'Saved' })
  } catch (err) {
    console.error('PUT /api/data:', err)
    return res.status(500).json({ error: 'Failed to save data' })
  }
})

export default router

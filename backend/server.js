import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import dataRoutes from './routes/data.js'
import { seedDemoUser } from './db/seedDemo.js'

const app = express()
const PORT = process.env.PORT || 4000
const isProduction = process.env.NODE_ENV === 'production'

app.use(
  cors({
    origin: isProduction ? undefined : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
  })
)
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/data', dataRoutes)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Server error' })
})

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)
  await seedDemoUser()
})

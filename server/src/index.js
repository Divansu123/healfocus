require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const cookieParser = require('cookie-parser')

const logger = require('./config/logger')
const { notFound, errorHandler } = require('./middleware/errorHandler')

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth.routes')
const publicRoutes = require('./routes/public.routes')
const patientRoutes = require('./routes/patient.routes')
const hospitalRoutes = require('./routes/hospital.routes')
const adminRoutes = require('./routes/admin.routes')

const app = express()

// ─── Security Middleware ──────────────────────────────────────────────────────

// Helmet — sets secure HTTP headers
app.use(helmet())

// CORS — only allow trusted origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, Postman in dev)
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
      callback(new Error(`CORS: Origin ${origin} not allowed`))
    },
    credentials: true, // required for cookies (refresh token)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// Cookie parser (for refresh token cookie)
app.use(cookieParser())

// Global rate limiter — 100 requests per 15 min per IP
// const globalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: { success: false, message: 'Too many requests, please try again later.' },
// })
// app.use(globalLimiter)

// Stricter limiter for auth endpoints — 10 attempts per 15 min
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 10,
//   message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
// })

// ─── General Middleware ───────────────────────────────────────────────────────
app.use(compression())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// HTTP request logger
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.http(message.trim()) },
    skip: () => process.env.NODE_ENV === 'test',
  })
)

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'HealFocus API is running', timestamp: new Date().toISOString() })
})

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/public', publicRoutes)
app.use('/api/patient', patientRoutes)
app.use('/api/hospital', hospitalRoutes)
app.use('/api/admin', adminRoutes)

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  logger.info(`✅ HealFocus API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason })
  process.exit(1)
})

module.exports = app

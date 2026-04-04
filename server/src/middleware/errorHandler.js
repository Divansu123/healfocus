const logger = require('../config/logger')

// 404 handler
const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` })
}

// Global error handler
const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
  })

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'Duplicate entry: resource already exists' })
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found' })
  }

  const statusCode = err.statusCode || 500
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

module.exports = { notFound, errorHandler }

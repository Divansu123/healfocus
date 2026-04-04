const { verifyAccessToken } = require('../utils/jwt')
const { error } = require('../utils/response')
const logger = require('../config/logger')

/**
 * Middleware: Verify JWT access token
 * Attaches decoded user payload to req.user
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Access token missing or malformed', 401)
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyAccessToken(token)

    req.user = decoded // { id, role, hospitalId? }
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Token expired. Please refresh.', 401)
    }
    if (err.name === 'JsonWebTokenError') {
      return error(res, 'Invalid token', 401)
    }
    logger.error('Auth middleware error', { err: err.message })
    return error(res, 'Authentication failed', 401)
  }
}

/**
 * Middleware factory: Allow only specific roles
 * Usage: authorize('admin')  or  authorize('patient', 'hospital')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return error(res, 'Unauthenticated', 401)

    if (!roles.includes(req.user.role)) {
      return error(res, 'Forbidden: insufficient permissions', 403)
    }
    next()
  }
}

/**
 * Middleware: Hospital staff can only access their own hospital's data
 * Attach hospitalId from token and compare with route param / body
 */
const ownHospitalOnly = (req, res, next) => {
  if (req.user.role === 'admin') return next() // admin can access all

  const requestedHospitalId = parseInt(req.params.hospitalId || req.body.hospitalId)
  if (req.user.hospitalId !== requestedHospitalId) {
    return error(res, 'Access denied to this hospital resource', 403)
  }
  next()
}

/**
 * Middleware: Patient can only access their own data
 */
const ownPatientOnly = (req, res, next) => {
  if (req.user.role === 'admin') return next() // admin bypass

  const requestedPatientId = req.params.patientId || req.body.patientId
  if (req.user.patientId !== requestedPatientId) {
    return error(res, 'Access denied to this patient resource', 403)
  }
  next()
}

module.exports = { authenticate, authorize, ownHospitalOnly, ownPatientOnly }

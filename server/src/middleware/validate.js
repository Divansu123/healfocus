const { validationResult } = require('express-validator')
const { error } = require('../utils/response')

/**
 * Run after express-validator chains.
 * Returns 422 with field-level errors if validation fails.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return error(res, 'Validation failed', 422, errors.array())
  }
  next()
}

module.exports = { validate }

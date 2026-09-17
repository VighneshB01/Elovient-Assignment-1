const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT containing userId and role.
 * Used after login/signup to return to the client.
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

module.exports = generateToken;

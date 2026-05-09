const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Accept token from header  'x-auth-token' OR 'Authorization: Bearer <token>'
  const token =
    req.header('x-auth-token') ||
    (req.header('Authorization') && req.header('Authorization').replace('Bearer ', ''));

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'my_super_secret_key_123');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid or expired' });
  }
};

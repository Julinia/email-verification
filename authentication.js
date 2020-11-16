const jwt = require('jsonwebtoken');

const authGuard = (req, res, next) => {
  const token = req.cookies.jwtToken;

  if (token === undefined || token === '') {
    req.user = undefined;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) console.error(err);
    req.user = user;
    next();
  });
}

const generateToken = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '30m' });
}

module.exports = { authGuard, generateToken };

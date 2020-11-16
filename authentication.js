const jwt = require('jsonwebtoken');

const authGuard = (req, res, next) => {
  const token = req.cookies.jwtToken;

  if (token === undefined) {
    return res.redirect('/auth');
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    console.log(err)
    if (err) return res.redirect('/auth');
    req.user = user
    next()
  });
}

const generateToken = (email) => {
  return jwt.sign(email, process.env.JWT_SECRET, { expiresIn: '1800s' });
}

module.exports = { authGuard, generateToken };

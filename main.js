const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const csrf = require('csurf')
const { v4: uuidv4 } = require('uuid');
const { authGuard, generateToken } = require('./authentication');
const { initSender, sendConfirmationEmail } = require('./email')

const csrfProtection = csrf({ cookie: true })

const app = express();
require('dotenv').config();

app.set('view engine', 'pug')

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }))
app.use(helmet());

app.use(authGuard);

app.listen(process.env.SERVER_PORT, () => {
  initSender(process.env.SENDGRID_KEY);
  console.log('Listening on port ', process.env.SERVER_PORT);
})

const users = [];
const actions = [];

app.get('/', csrfProtection, (req, res) => {
  if (!req.user) {
    return res.redirect('/auth');
  }

  const user = users.find((user) => user.email === req.user.email);

  if (user === undefined) {
    res.cookie('jwtToken', '', { maxAge: 1800000, httpOnly: true });
    return res.redirect('/auth');
  }

  res.render('index', {
    pageTitle: 'Main Page',
    ...user,
    actions,
    csrfToken: req.csrfToken()
  });
});

app.post('/makeaction',
  csrfProtection,
  (err, req, res, next) => {
    if (err.code !== 'EBADCSRFTOKEN') return next(err)
    res.render('form', {
      pageTitle: 'Log In Page. You are here cause your CSRF token is invalid (-_-)',
      path: '/auth',
      altPath: '/register',
      text: 'Log In',
      altText: 'Register',
    });
  },
  (req, res) => {
  if (!req.user) {
    return res.redirect('/auth');
  }

  actions.push({
    user: req.user.email,
    value: req.body.value
  });

  res.redirect('/');
});

app.get('/logout', (req, res) => {
  res.cookie('jwtToken', '', { maxAge: 1800000, httpOnly: true });
  res.redirect('/');
});

app.route('/auth')
  .get((req, res) => {
    res.render('form', {
      pageTitle: 'Log In Page',
      path: '/auth',
      altPath: '/register',
      text: 'Log In',
      altText: 'Register',
    });
  })
  .post((req, res) => {
    const user = users.find((user) => user.email === req.body.email);

    if (user === undefined) {
      return res.redirect('/auth');
    }

    bcrypt.compare(req.body.password, user.password, (err, result) => {
      if (err) console.error(err);
      if (result === true) {
        const token = generateToken({ email: user.email });

        res.cookie('jwtToken', token, { maxAge: 1800000, httpOnly: true });
        res.redirect('/');
      } else if (result === false) {
        res.redirect('/auth');
      }
    });
  });

app.route('/register')
  .get((req, res) => {
    res.render('form', {
      pageTitle: 'Register Page',
      path: '/register',
      altPath: '/auth',
      text: 'Register',
      altText: 'Log In',
    })
  })
  .post((req, res) => {
    bcrypt.hash(req.body.password, 10, (err, hash) => {
      if (err) console.error(err);

      const uuid = uuidv4();

      const user = {
        email: req.body.email,
        password: hash,
        isConfirmed: false,
        uuid,
      };

      users.push(user);

      sendConfirmationEmail(user.email, user.uuid);

      const token = generateToken({ email: user.email });
      res.cookie('jwtToken', token, { maxAge: 1800000, httpOnly: true });

      res.redirect('/');
    });
  });

app.get('/confirm/:uuid', (req, res) => {
  const uuid = req.params.uuid;

  const userIndex = users.findIndex((user) => user.uuid === uuid);

  if (userIndex === -1) {
    return res.redirect('/');
  }

  users[userIndex].isConfirmed = true;
  users[userIndex].uuid = null;

  res.redirect('/');
});

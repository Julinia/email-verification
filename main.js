const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser')
const app = express();
require('dotenv').config();

const { authGuard } = require('./authentication');

app.set('view engine', 'pug')

app.use(cookieParser());
app.use(bodyParser.urlencoded())

app.listen(3000, () => {
  console.log('Listening on port 3000');
})

app.get('/', authGuard, (req, res) => {

  res.send('Main Page');
});


app.get('/auth', (req, res) => {

  res.send('Auth Page');
});

app.route('/register')
  .get((req, res) => {

    res.send('Register Page');
  });

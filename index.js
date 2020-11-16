const express = require('express');
const cookieParser = require('cookie-parser')
const app = express();

const server = app.listen(3000, () => {
	console.log('Listening on port 3000');
})

app.set('view engine', 'pug')

app.use(cookieParser());

app.use((req, res, next) => {
  console.log('%s %s', req.method, req.url);
  next();
});

app.get('/', (req, res) => {

  res.send('Hello');
});

import express from 'express';
import session from 'express-session';
import index from './event.js';
import login from './login.js';
import bodyParser from 'body-parser';
import mongostore from 'connect-mongo';
import client from './dbclient.js';
import admin from './admin.js';

const app = express();
app.use(
  session({
    secret: 'buffet_booking',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true },
    store: mongostore.create({
      client,
      dbName: 'buffet_booking',
      //collectionName: 'event',
    }),
    logged: false,
  })
);

app.get('/', (req, res) => {
  console.log('Redirecting');
  if (req.session.logged) {
    console.log('User already logged in');
    if (req.session.role === 'admin') {
      res.redirect('/admin-dashboard.html');
    } else {
      res.redirect('/index.html');
    }
  } else {
    console.log('User not logged in');
    res.redirect('/login.html');
  }
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/book', index);
app.use('/auth', login);
app.use('/admin', admin);
app.use('/', express.static('static'));

const PORT = 8080;
app.listen(PORT, () => {
  const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' });
  console.log(`${now}`);
  console.log(`Server started at http://127.0.0.1:${PORT}`);
});

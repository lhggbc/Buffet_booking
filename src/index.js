import express from 'express';
import session from 'express-session';
import index from './event.js';
import bodyParser from 'body-parser';
import mongostore from 'connect-mongo';
import client from './dbclient.js';

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
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/book', index);
app.use('/', express.static('static'));

app.get('/', (req, res) => {
  if (req.session.logged) {
    res.redirect('/index.html');
  } else {
    res.redirect('/login.html');
  }
});

const PORT = 8080;
app.listen(PORT, () => {
  const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' });
  console.log(`${now}`);
  console.log(`Server started at http://127.0.0.1:${PORT}`);
});

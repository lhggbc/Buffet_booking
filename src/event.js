import express from 'express';
fetch_event;
import multer from 'multer';
import { promises as fs } from 'fs';
import { fetch_events, update_event, fetch_event, event_exist } from './eventdb.js';

const form = multer();
const route = express.Router();

route.post('/login', form.none(), async (req, res) => {
  req.session.logged = req.session.logged || false;

  const { username, password } = req.body;
  const user = await validate_user(username, password);

  if (user) {
    if (!user.enabled) {
      return res.status(401).json({
        status: 'failed',
        message: `User \`${username}\` is currently disabled`,
      });
    }

    req.session.logged = true;
    req.session.user = {
      username: user.username,
      role: user.role,
      loggedAt: new Date(),
    };

    return res.json({
      status: 'success',
      user: {
        username: user.username,
        role: user.role,
      },
    });
  } else {
    return res.status(401).json({
      status: 'failed',
      message: 'Incorrect username and password',
    });
  }
});

route.post('/register', form.none(), async (req, res) => {
  const { username, password, role } = req.body;
  console.log(username);
  console.log(password);
  console.log(role);

  if (!username || !password) {
    return res.status(400).json({
      status: 'failed',
      message: 'Missing fields',
    });
  }

  if (username.length < 3) {
    return res.status(400).json({
      status: 'failed',
      message: 'Username must be at least 3 characters',
    });
  }

  const exists = await username_exist(username);
  if (exists) {
    return res.status(400).json({
      status: 'failed',
      message: `Username ${username} already exists`,
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      status: 'failed',
      message: 'Password must be at least 8 characters',
    });
  }

  if (role !== 'student' && role !== 'user') {
    return res.status(400).json({
      status: 'failed',
      message: 'Role must be either `student` or `user`',
    });
  }

  const success = await update_user(username, password, role);

  if (success) {
    return res.json({
      status: 'success',
      user: {
        username,
        role,
      },
    });
  } else {
    return res.status(500).json({
      status: 'failed',
      message: 'Account created but unable to save into the database',
    });
  }
});

route.post('/logout', (req, res) => {
  if (req.session.logged) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ status: 'failed', message: 'Could not log out' });
      }
      return res.end();
    });
  } else {
    return res.status(401).json({
      status: 'failed',
      message: 'Unauthorized',
    });
  }
});

route.get('/me', (req, res) => {
  if (req.session.logged) {
    return res.json({
      status: 'success',
      user: {
        username: req.session.user.username,
        role: req.session.user.role,
      },
    });
  } else {
    return res.status(401).json({
      status: 'failed',
      message: 'Unauthorized',
    });
  }
});

export default route;

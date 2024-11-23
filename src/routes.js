import express from 'express';
fetch_event;
import multer from 'multer';
import { promises as fs } from 'fs';
import { fetch_events, update_event, fetch_event, event_exist } from './eventdb.js';
import client from './dbclient.js';

const form = multer();
const route = express.Router();

route.get('/index', async (req, res) => {
  if (req.session.logged) {
    const events = await fetch_events(); // Fetch events asynchronously
    if (events) {
      return res.json({
        status: 'success',
        events: events, // Include fetched events in the response
      });
    } else {
      return res.status(500).json({
        status: 'failed',
        message: 'Error fetching events',
      });
    }
  } else {
    return res.status(401).json({
      status: 'failed',
      message: 'Unauthorized',
    });
  }
});

// Route to handle adding/updating events
route.post('/events', async (req, res) => {
  const { eventname, date, venue, ticketleft, description } = req.body;

  if (!eventname || !date || !venue || !ticketleft) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const events = client.db('buffet_booking').collection('events');
    const result = await events.updateOne(
      { eventname }, // Query to match the event by name
      {
        $set: {
          date,
          venue,
          ticketleft,
          description,
        },
      },
      { upsert: true } // Create if not exists
    );

    if (result.modifiedCount > 0 || result.upsertedCount > 0) {
      return res.status(200).json({ message: 'Event updated or added successfully.' });
    } else {
      return res.status(400).json({ message: 'No changes made.' });
    }
  } catch (err) {
    console.error('Unable to update the database!', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to handle deleting events
route.delete('/events/:eventname', async (req, res) => {
  const { eventname } = req.params;

  try {
    const events = client.db('buffet_booking').collection('events');
    const result = await events.deleteOne({ eventname });

    if (result.deletedCount > 0) {
      return res.status(200).json({ message: 'Event deleted successfully.' });
    } else {
      return res.status(404).json({ message: 'Event not found.' });
    }
  } catch (err) {
    console.error('Unable to delete the event!', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default route;

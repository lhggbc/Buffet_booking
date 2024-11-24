import express from 'express';
import multer from 'multer';
import { promises as fs } from 'fs';
import { fetch_events, update_event, fetch_event, event_exist } from './eventdb.js';
import { fetch_tables, update_table, fetch_table, table_exist, update_payment, fetch_payment } from './tabledb.js';
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

route.get('/event/:eventname', async (req, res) => {
  const { eventname } = req.params;
  if (req.session.logged) {
    const event = await fetch_event(eventname); // Fetch event asynchronously
    if (event) {
      return res.json({
        status: 'success',
        event: event, // Include fetched events in the response
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
      console.log('Event deleted successfully.');
      return res.status(200).json({ message: 'Event deleted successfully.' });
    } else {
      return res.status(404).json({ message: 'Event not found.' });
    }
  } catch (err) {
    console.error('Unable to delete the event!', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to fetch all tables
route.get('/tables/:eventname', async (req, res) => {
  const { eventname } = req.params; // Extract eventname from request parameters
  try {
    var tables = await fetch_tables(eventname);
    if (tables) {
      res.status(200).json(tables);
    } else {
      for (var i = 1; i <= 30; i++) {
        var price = 400;
        if (i < 11) {
          price = 400;
        } else if (i < 21) {
          price = 200;
        } else {
          price = 100;
        }
        await update_table(i, eventname, price, true);
      }
      tables = await fetch_tables(eventname);
      res.status(200).json(tables);
    }
  } catch (err) {
    console.error('Error fetching tables:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

route.post('/payment', async (req, res) => {
  const { eventname, tablesarray, totalprice, date, method = 'None', status = false } = req.body; // Destructure the request body
  const userid = req.session.user.username;

  try {
    // Call the update_payment function
    const success = await update_payment(userid, eventname, tablesarray, totalprice, date, method, status);

    if (success) {
      res.status(200).json({ message: 'Payment updated successfully' });
    } else {
      res.status(400).json({ message: 'Failed to update payment' });
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

route.post('/tables/save', async (req, res) => {
  const tableData = req.body; // Get the table data from the request body

  if (!Array.isArray(tableData)) {
    return res.status(400).json({ message: 'Invalid table data format' });
  }

  try {
    const tables = client.db('buffet_booking').collection('tables');

    // Iterate over the table data and update each table
    for (const table of tableData) {
      const { tableid, eventname, price, status } = table;
      const result = await tables.updateOne(
        { tableid, eventname },
        {
          $set: {
            price,
            status,
          },
        },
        { upsert: true }
      );
    }

    res.status(200).json({ message: 'Tables updated successfully' });
  } catch (error) {
    console.error('Error updating tables:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

route.get('/payment', async (req, res) => {
  const { eventname } = req.query;
  const userid = req.session.user.username;

  try {
    const payments = client.db('buffet_booking').collection('payments');
    const payment = await payments.findOne({ userid, eventname });

    if (payment) {
      res.status(200).json(payment);
    } else {
      res.status(404).json({ error: 'Payment not found' });
    }
  } catch (err) {
    console.error('Error fetching payment:', err);
    res.status(500).json({ error: 'Unable to fetch payment details' });
  }
});

route.get('/payments', async (req, res) => {
  try {
    const payments = client.db('buffet_booking').collection('payments');
    const payment = await payments.find({});

    if (payment) {
      res.status(200).json(payment);
    } else {
      res.status(404).json({ error: 'Payment not found' });
    }
  } catch (err) {
    console.error('Error fetching payment:', err);
    res.status(500).json({ error: 'Unable to fetch payment details' });
  }
});

export default route;

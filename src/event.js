import express from 'express';
import multer from 'multer';
import { promises as fs } from 'fs';
import { fetch_events, update_event, fetch_event, event_exist } from './eventdb.js';
import {
  fetch_tables,
  update_table,
  fetch_table,
  table_exist,
  update_payment,
  fetch_payment,
  update_tablestatus,
} from './tabledb.js';
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
  console.log(eventname);
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

route.get('/eventforpayment/:eventname', async (req, res) => {
  const { eventname } = req.params;
  console.log(eventname);
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
      console.log(eventname, 'updated');
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

    if (tables && tables.length > 0) {
      // Check if tables exist and the array is not empty
      res.status(200).json(tables);
    } else {
      // Initialize 30 tables for the event
      const totalTables = 30;
      const initializedTables = [];

      for (let i = 1; i <= totalTables; i++) {
        // Use 'let' instead of 'var' for block scoping
        let price;
        if (i <= 10) {
          price = 400;
        } else if (i <= 20) {
          price = 200;
        } else {
          price = 100;
        }

        const table = await update_table(i, eventname, price, true);
        initializedTables.push(table); // Collect initialized tables for response
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
  console.log('Session Data:', req.session);

  const {
    eventname,
    tablesarray,
    totalprice,
    datetime,
    name,
    phone,
    people,
    method = 'None',
    status = false,
  } = req.body; // Destructure the request body
  const userid = req.session?.uid;

  // Validate required fields
  if (!userid || !eventname || !tablesarray || !totalprice || !datetime || !name || !phone || !people) {
    console.error('Missing required fields:', {
      userid,
      eventname,
      tablesarray,
      totalprice,
      datetime,
      name,
      phone,
      people,
      method,
      status,
    });
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    for (const tableid of tablesarray) {
      const updateSuccess = await update_tablestatus(tableid, eventname, false);

      if (!updateSuccess) {
        console.error(`Failed to update table ${tableid} for event ${eventname}`);
        return res.status(500).json({ message: `Failed to update table ${tableid}. Please try again.` });
      }
    }
    // Call the update_payment function
    const success = await update_payment(
      userid,
      eventname,
      tablesarray,
      totalprice,
      datetime,
      name,
      phone,
      people,
      method,
      status
    );

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

  // Validate that tableData is an array
  if (!Array.isArray(tableData)) {
    return res.status(400).json({ message: 'Invalid table data format. Expected an array.' });
  }

  try {
    const tablesCollection = client.db('buffet_booking').collection('tables');

    // Prepare bulk operations for efficiency
    const bulkOps = tableData
      .map((table) => {
        const { tableid, eventname, price, status } = table;

        // Validate table fields
        if (
          typeof tableid !== 'number' ||
          typeof eventname !== 'string' ||
          typeof price !== 'number' ||
          typeof status !== 'boolean'
        ) {
          return {
            updateOne: {
              filter: { tableid: table.tableid, eventname: table.eventname },
              update: {
                $set: {
                  price: table.price,
                  status: table.status,
                },
              },
              upsert: true,
            },
          };
        } else {
          // Alternatively, skip invalid entries or handle them as needed
          console.warn(`Invalid table data encountered: ${JSON.stringify(table)}`);
          return null;
        }
      })
      .filter((op) => op !== null); // Remove null operations

    if (bulkOps.length === 0) {
      return res.status(400).json({ message: 'No valid table data to update.' });
    }

    // Execute bulk operations
    const bulkWriteResult = await tablesCollection.bulkWrite(bulkOps);

    console.log(`Bulk write operation successful:`, bulkWriteResult);

    return res.status(200).json({ message: 'Tables updated successfully.' });
  } catch (error) {
    console.error('Error updating tables:', error);
    return res.status(500).json({ message: 'Internal server error while updating tables.' });
  }
});

route.get('/payment', async (req, res) => {
  const { eventname } = req.query;
  const userid = req.session?.uid;

  try {
    console.log('Fetching payment for user:', userid, 'and event:', eventname);
    const payments = client.db('buffet_booking').collection('payments');
    const payment = await payments.findOne({ userid, eventname });

    console.log('Payment Found:', payment);

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

import fs from 'fs/promises';
import client from './dbclient.js';

async function init_db() {
  try {
    const events = client.db('buffet_booking').collection('events');

    const userCount = await events.countDocuments();
    if (userCount === 0) {
      const data = await fs.readFile('events.json', 'utf-8');
      const userProfiles = JSON.parse(data);

      const result = await events.insertMany(userProfiles);
      console.log(`Added ${result.insertedCount} events`);
    } else {
      console.log('Events collection is already populated.');
    }
  } catch (err) {
    console.error('Unable to initialize the database!', err);
  }
}

async function fetch_events() {
  try {
    const eventsCollection = client.db('buffet_booking').collection('events');
    const events = await eventsCollection.find().toArray(); // Fetch all events
    return events.length > 0 ? events : false; // Return events or false if none found
  } catch (err) {
    console.error('Unable to fetch from database!', err);
    return false;
  }
}

async function update_event(eventname, date, venue, ticketleft, description) {
  try {
    const events = client.db('buffet_booking').collection('events');
    const result = await events.updateOne(
      { eventname },
      {
        $set: {
          date,
          venue,
          ticketleft,
          description,
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      console.log('Added 1 event');
      return true;
    } else {
      console.log('Added 0 event');
      return true;
    }
  } catch (err) {
    console.error('Unable to update the database!', err);
    return false;
  }
}

async function fetch_event(eventname) {
  try {
    const events = client.db('buffet_booking').collection('events');

    const event = await events.findOne({ eventname });

    return event;
  } catch (err) {
    console.error('Unable to fetch from database!', err);
    return null;
  }
}

async function event_exist(eventname) {
  try {
    const event = await fetch_event(eventname);
    return !(event == null);
  } catch (err) {
    console.error('Unable to fetch from database!', err);
    return false;
  }
}

init_db().catch(console.dir);
export { fetch_events, update_event, fetch_event, event_exist };

import fs from 'fs/promises';
import client from './dbclient.js';

async function init_db() {
  try {
    const tables = client.db('buffet_booking').collection('tables');

    const tableCount = await tables.countDocuments();
    if (tableCount === 0) {
      const data = await fs.readFile('tables.json', 'utf-8');
      const tableProfiles = JSON.parse(data);

      const result = await tables.insertMany(tableProfiles);
      console.log(`Added ${result.insertedCount} tables`);
    } else {
      console.log('tables collection is already populated.');
    }
  } catch (err) {
    console.error('Unable to initialize the database!', err);
  }
}

async function fetch_tables(eventname) {
  try {
    const tablesCollection = client.db('buffet_booking').collection('tables');
    const tables = await tablesCollection.find({ eventname }).toArray(); // Fetch all tables
    return tables.length > 0 ? tables : false; // Return events or false if none found
  } catch (err) {
    console.error('Unable to fetch from database!', err);
    return false;
  }
}

async function update_table(tableid, eventname, price, status) {
  try {
    const tables = client.db('buffet_booking').collection('tables');
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

    if (result.upsertedCount > 0) {
      console.log('Added 1 table');
      return true;
    } else {
      console.log('Added 0 table');
      return true;
    }
  } catch (err) {
    console.error('Unable to update the database!', err);
    return false;
  }
}

async function fetch_table(tableid, eventname) {
  try {
    const tables = client.db('buffet_booking').collection('tables');

    const table = await tables.findOne({ tableid, eventname });

    return table;
  } catch (err) {
    console.error('Unable to fetch from database!', err);
    return null;
  }
}

async function table_exist(tableid, eventname) {
  try {
    const table = await fetch_table(tableid, eventname);
    return !(table == null);
  } catch (err) {
    console.error('Unable to fetch from database!', err);
    return false;
  }
}

const updateDateTime = () => {
  const formatDateTime = (date) => {
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    };
    return date.toLocaleString('en-US', options);
  };
  const now = new Date();
  return formatDateTime(now);
};

async function update_payment(
  userid,
  eventname,
  tablesarray,
  totalprice,
  datetime,
  name,
  phone,
  people,
  method = 'None',
  status = false,
  timestamp = updateDateTime()
) {
  try {
    const payments = client.db('buffet_booking').collection('payments');
    const result = await payments.updateOne(
      { userid, eventname }, // Match on user ID and event name
      {
        $set: {
          tablesarray,
          totalprice,
          datetime,
          name,
          phone,
          people,
          timestamp,
          method,
          status,
        },
      },
      { upsert: true } // Insert if no record exists
    );

    if (result.upsertedCount > 0) {
      console.log('Successfully added a new payment');
      return true;
    } else if (result.modifiedCount > 0) {
      console.log('Successfully updated an existing payment');
      return true;
    } else {
      console.log('No changes were made to the payment record');
      return true;
    }
  } catch (err) {
    console.error('Unable to update the database!', err);
    return false;
  }
}

async function fetch_payment(userid, eventname) {
  try {
    const payments = client.db('buffet_booking').collection('payments');

    const payment = await payments.findOne({ userid, eventname });

    return payment;
  } catch (err) {
    console.error('Unable to fetch from database!', err);
    return null;
  }
}

async function update_tablestatus(tableid, eventname, status) {
  try {
    const tables = client.db('buffet_booking').collection('tables');
    const result = await tables.updateOne(
      { tableid, eventname },
      {
        $set: {
          status, // Only update the status field
        },
      },
      { upsert: false } // Do not create a new document if it doesn't exist
    );

    if (result.modifiedCount > 0) {
      console.log(`Table ${tableid} status updated successfully.`);
      return true;
    } else if (result.matchedCount > 0) {
      console.log(`Table ${tableid} already has the desired status.`);
      return true;
    } else {
      console.log(`Table ${tableid} not found.`);
      return false;
    }
  } catch (err) {
    console.error('Unable to update the database!', err);
    return false;
  }
}

init_db().catch(console.dir);
export { fetch_tables, update_table, fetch_table, table_exist, update_payment, fetch_payment, update_tablestatus };

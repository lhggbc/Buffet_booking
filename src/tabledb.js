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
  date,
  method = 'None',
  status = false,
  timestamp = updateDateTime()
) {
  try {
    const payments = client.db('buffet_booking').collection('payments');
    const result = await payments.updateOne(
      { userid, eventname },
      {
        $set: {
          tablesarray,
          totalprice,
          date,
          timestamp,
          method,
          status,
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      console.log('Added 1 payment');
      return true;
    } else {
      console.log('Added 0 payment');
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

init_db().catch(console.dir);
export { fetch_tables, update_table, fetch_table, table_exist, update_payment, fetch_payment };

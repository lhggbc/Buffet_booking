// Initialize event listeners and fetch data on page load
document.addEventListener('DOMContentLoaded', async function () {
  const priceTexts = document.querySelectorAll('.tableprice');
  priceTexts.forEach((priceText) => {
    priceText.addEventListener('click', function () {
      editPrice(priceText);
    });
  });

  document.getElementById('event-select').addEventListener('change', async function () {
    const eventname = this.value;
    if (eventname) {
      await initTables(eventname); // Call initTables with the selected event name
      await fetchCustomerData(eventname);
    }
  });
});

// Function to initialize the event selector
async function initEventSelector() {
  try {
    const response = await fetch('/book/index');
    const data = await response.json(); // { status: 'success', events: [...] }

    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to fetch events.');
    }

    const eventsArray = data.events; // Access the 'events' array

    const eventSelect = document.getElementById('event-select');
    eventSelect.innerHTML = '<option value="">Select an event</option>'; // Reset options

    eventsArray.forEach((event) => {
      const option = document.createElement('option');
      option.value = event.eventname;
      option.textContent = event.eventname;
      eventSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error fetching events:', error);
  }
}

// Call this function on page load
document.addEventListener('DOMContentLoaded', initEventSelector);

// Variable to hold total price
let total = 0;
const customerData = {}; // You will fetch this data from your users collection

// Fetch customer data and payments for the selected event
async function fetchCustomerData(eventname) {
  try {
    // Fetch users
    const userResponse = await fetch('/auth/users');
    const users = await userResponse.json();

    // Fetch payments for the specified event
    const paymentResponse = await fetch(`/book/payments/${eventname}`);
    const payments = await paymentResponse.json();

    // Clear existing customerData
    Object.keys(customerData).forEach((key) => delete customerData[key]);

    // Map users by their user IDs for quick access
    const userMap = {};
    users.forEach((user) => {
      userMap[user.uid] = {
        name: user.nickname,
        contact: user.phonenum,
      };
    });

    // Iterate through payments and associate with corresponding users
    payments.forEach((payment) => {
      const userInfo = userMap[payment.userid];
      if (userInfo) {
        customerData[`Table ${payment.tableId}`] = {
          name: userInfo.name,
          contact: userInfo.contact,
        };
      }
    });
  } catch (error) {
    console.error('Error fetching customer data:', error);
  }
}

// Function to handle table selection
function selectTable(table) {
  // Check current fill color to determine the state
  if (table.style.fill === 'grey') {
    // Set to available
    table.style.fill = 'hsl(38, 61%, 73%)'; // Change to your desired available color
  } else {
    // Set to unavailable
    table.style.fill = 'grey'; // Set to grey to mark as unavailable
  }
}

// Function to show customer info for a selected table
function showCustomerInfo(table) {
  const tableName = table.querySelector('text').textContent;
  if (customerData[tableName]) {
    const info = customerData[tableName];
    alert(`Customer Name: ${info.name}\nContact: ${info.contact}`);
  }
}

// Function to edit price of a table
function editPrice(priceTextElement) {
  const currentPrice = priceTextElement.textContent.replace('$', ''); // Get the current price
  const newPrice = prompt(`Enter new price for this row:`, currentPrice);

  if (newPrice) {
    if (isNaN(newPrice) || parseFloat(newPrice) < 0) {
      alert('Please enter a valid non-negative number for the price.');
      return;
    }

    // Update the price in the text element
    priceTextElement.textContent = `$${parseFloat(newPrice).toFixed(2)}`;

    // Update all tables in the same row
    const rowNumber = priceTextElement.getAttribute('data-row'); // Get the row number from data attribute
    const tables = document.querySelectorAll(`.table-group[data-row="${rowNumber}"] .table`);

    tables.forEach((table) => {
      table.setAttribute('data-price', parseFloat(newPrice));
    });
  }
}

function save() {
  // Collect all table data to save
  const tables = document.querySelectorAll('.table');
  const eventSelect = document.getElementById('event-select');
  const selectedEvent = eventSelect.value.trim(); // Trim whitespace
  const tableData = [];

  tables.forEach((table) => {
    const tableText = table.querySelector('text');
    const tableName = tableText ? tableText.textContent.trim() : '';
    const priceAttr = table.getAttribute('data-price');
    const price = priceAttr ? parseFloat(priceAttr) : 0; // Ensure price is a number
    const status = table.style.fill !== 'grey'; // true if available, false if unavailable

    // Extract table ID safely using regex
    const tableIdMatch = tableName.match(/Table\s+(\d+)/i);
    const tableId = tableIdMatch ? parseInt(tableIdMatch[1], 10) : null;

    if (tableId !== null && selectedEvent) {
      // Ensure tableId extraction succeeded and event is selected
      tableData.push({
        tableid: tableId,
        eventname: selectedEvent,
        price: price,
        status: status,
      });
    } else {
      console.warn(`Skipping table due to invalid data. Table Name: "${tableName}", Event: "${selectedEvent}"`);
    }
  });

  // Validate selected event
  if (!selectedEvent) {
    alert('Please select an event before saving table data.');
    return;
  }

  if (tableData.length === 0) {
    alert('No valid table data to save.');
    return;
  }

  // Send table data to the server
  fetch('/book/tables/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tableData),
    credentials: 'include', // Include cookies for session-based auth if required
  })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        const errorMessage = data.message || 'Failed to save changes.';
        throw new Error(errorMessage);
      }
      return data;
    })
    .then((data) => {
      alert(data.message || 'Changes saved successfully!');
      // Optionally, re-fetch tables or update the UI as needed
    })
    .catch((error) => {
      console.error('Error saving changes:', error);
      alert(`Error: ${error.message || 'There was an error saving the changes. Please try again.'}`);
    });
}

// Function to initialize tables for the selected event
async function initTables(eventname) {
  try {
    if (!eventname) {
      throw new Error('No event name provided.');
    }

    const response = await fetch(`/book/tables/${encodeURIComponent(eventname)}`, {
      method: 'GET',
      credentials: 'include', // Include credentials for session-based auth
    });

    if (!response.ok) {
      throw new Error(`Error fetching tables: ${response.status} ${response.statusText}`);
    }

    const tables = await response.json();

    if (!Array.isArray(tables)) {
      throw new Error('Invalid table data format received from the server.');
    }

    populateTableOptions(tables); // Populate the table options based on the fetched data
  } catch (error) {
    console.error('Error initializing tables:', error);
    alert('Failed to load tables. Please try again later.');
  }
}

function populateTableOptions(tables) {
  // Assuming each row has its own group with data-row attribute
  tables.forEach((table, index) => {
    console.log('tablestatus   ', table.tableid, '   ', table.status);
    // Determine row based on tableId
    const rowNumber = determineRowNumber(table.tableid); // Implement this based on your logic
    const seatingArea = document.querySelector(`.table-group[data-row="${rowNumber}"]`);

    if (!seatingArea) return; // Skip if the group doesn't exist

    // Create table rectangle
    const tableElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    tableElement.classList.add('table');
    tableElement.setAttribute('data-price', table.price);
    tableElement.setAttribute('x', calculateX(table.tableid - 1)); // Implement calculateX
    tableElement.setAttribute('y', calculateY(rowNumber)); // Implement calculateY
    tableElement.setAttribute('width', 60);
    tableElement.setAttribute('height', 60);
    tableElement.setAttribute('onclick', 'selectTable(this)');
    tableElement.addEventListener('dblclick', () => showCustomerInfo(tableElement));

    // Set color based on availability
    tableElement.setAttribute('fill', table.status ? 'hsl(38, 61%, 73%)' : 'grey');
    //tableElement.style.cursor = table.status ? 'pointer' : 'not-allowed';

    seatingArea.appendChild(tableElement);

    // Create table label
    const tableLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    tableLabel.setAttribute('x', calculateX(table.tableid - 1) + 30); // Center the text
    tableLabel.setAttribute('y', calculateY(rowNumber) + 30); // Vertically center
    tableLabel.setAttribute('text-anchor', 'middle');
    tableLabel.setAttribute('fill', 'black');
    tableLabel.textContent = `Table ${table.tableid}`;
    seatingArea.appendChild(tableLabel);
  });
}

function determineRowNumber(tableId) {
  if (tableId <= 10) return 1;
  if (tableId <= 20) return 2;
  return 3;
}

function calculateX(index) {
  // Example: Start at 100, spacing 70 between tables
  return 100 + (index % 10) * 70;
}

function calculateY(rowNumber) {
  // Example: Row 1 at y=50, Row 2 at y=150, Row 3 at y=250
  return 70 + (rowNumber - 1) * 80;
}

document.addEventListener('DOMContentLoaded', async function () {
  // Initialize event selector
  await initEventSelector();

  // Handle event selector change
  document.getElementById('event-select').addEventListener('change', async function () {
    const eventname = this.value.trim(); // Get the selected event name
    if (eventname) {
      await initTables(eventname); // Initialize tables for the selected event
      await fetchCustomerData(eventname); // Fetch customer data for the event
    }
  });

  // Delegate `.tableprice` clicks for editing price
  document.addEventListener('click', function (event) {
    if (event.target.classList.contains('tableprice')) {
      editPrice(event.target);
    }
  });

  let clickTimeout; // Timeout to differentiate between single and double clicks

  document.addEventListener('click', function (event) {
    if (event.target.classList.contains('table')) {
      clearTimeout(clickTimeout); // Clear any pending click timeouts
      clickTimeout = setTimeout(() => {
        // Only execute if it's not a double-click
        selectTable(event.target);
      }, 250); // Delay to detect double-click
    }
  });

  document.addEventListener('dblclick', function (event) {
    if (event.target.classList.contains('table')) {
      clearTimeout(clickTimeout); // Clear click timeout to prevent single-click logic
      showCustomerInfo(event.target);
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
      if (event.eventname !== 'Grand Buffet') {
        // Check if the event name is not "Grand Buffet"
        const option = document.createElement('option');
        option.value = event.eventname;
        option.textContent = event.eventname;
        eventSelect.appendChild(option);
      }
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
    const userResponse = await fetch('/admin/account-management');
    const users = await userResponse.json();
    console.log('users', users.length);

    if (!users.length) {
      console.warn('No users found.');
    }

    const paymentResponse = await fetch(`/book/payments/${eventname}`);
    const payments = await paymentResponse.json();

    if (!payments.length) {
      console.warn('No payments found for the event:', eventname);
    }

    const userMap = users.reduce((map, user) => {
      map[user.uid] = { name: user.nickname, contact: user.phonenum };
      return map;
    }, {});
    console.log(userMap);

    payments.forEach((payment) => {
      const userInfo = userMap[payment.userid];
      if (userInfo && Array.isArray(payment.tablesarray)) {
        payment.tablesarray.forEach((tableId) => {
          customerData[tableId] = {
            uid: payment.userid,
            name: userInfo.name,
            contact: userInfo.contact,
            payment: payment.method,
          };
        });
        console.log('logged', customerData);
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
  const tableId = table.getAttribute('data-tableid');

  if (customerData[tableId]) {
    const info = customerData[tableId];
    alert(
      `UserID: ${info.uid}\nCustomer Name: ${info.name}\nContact: ${info.contact}\nMethod of Payment: ${info.payment}`
    );
  } else {
    alert(`No customer info available for Table ${tableId}.`);
  }
}

// Function to edit price of a table
function editPrice(priceTextElement) {
  const currentPrice = priceTextElement.textContent.replace('$', ''); // Get the current price
  const newPrice = prompt(`Enter new price for this row:`, currentPrice);

  if (newPrice === null) {
    return; // User canceled the prompt
  }

  if (isNaN(newPrice) || parseFloat(newPrice) < 0) {
    alert('Please enter a valid non-negative number for the price.');
    return;
  }

  if (newPrice) {
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
  let availableTablesCount = 0; // Count tables with status true
  // Collect all table data to save
  const tables = document.querySelectorAll('.table');
  const eventSelect = document.getElementById('event-select').value;
  const tableData = [];

  tables.forEach((table) => {
    const tableId = parseInt(table.getAttribute('data-tableid'), 10);
    const priceAttr = table.getAttribute('data-price');
    const price = priceAttr ? parseInt(priceAttr) : 0; // Ensure price is a number
    const status = table.style.fill !== 'grey'; // true if available, false if unavailable
    if (status) {
      availableTablesCount++; // Increment count of tables with status true
    }

    if (tableId !== null && eventSelect) {
      // Ensure tableId extraction succeeded and event is selected
      tableData.push({
        tableid: tableId,
        eventname: eventSelect,
        price: price,
        status: status,
      });
    } else {
      console.warn(`Skipping table due to invalid data. Table Name: "${tableId}", Event: "${eventSelect}"`);
    }
  });

  // Validate selected event
  if (!eventSelect) {
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
      alert(
        data.message ||
          'Changes saved successfully!\nIf tables are made available pls check corresponding payment database!'
      );
      // Optionally, re-fetch tables or update the UI as needed
      updateTicketLeft(eventSelect, availableTablesCount);
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
    // Reset the price for this row
    const priceText = seatingArea.querySelector(`.tableprice[data-row="${rowNumber}"]`);
    if (priceText) {
      priceText.textContent = `$${table.price}`; // Update the price in the legend
    }
    // Create table rectangle
    const tableElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    tableElement.classList.add('table');
    tableElement.setAttribute('data-price', table.price);
    tableElement.setAttribute('data-tableid', table.tableid);
    tableElement.setAttribute('x', calculateX(table.tableid - 1)); // Implement calculateX
    tableElement.setAttribute('y', calculateY(rowNumber)); // Implement calculateY
    tableElement.setAttribute('width', 60);
    tableElement.setAttribute('height', 60);

    // Set color based on availability
    tableElement.setAttribute('fill', table.status ? 'hsl(38, 61%, 73%)' : 'grey');
    //tableElement.style.cursor = table.status ? 'pointer' : 'not-allowed';

    seatingArea.appendChild(tableElement);

    // Create table label
    const tableLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    tableLabel.setAttribute('x', calculateX(table.tableid - 1) + 30); // Center the text
    tableLabel.setAttribute('y', calculateY(rowNumber) + 30); // Vertically center
    tableLabel.setAttribute('text-anchor', 'middle');
    tableLabel.classList.add('tablename');
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

// Function to update ticketleft for the selected event
function updateTicketLeft(eventname, availableTablesCount) {
  fetch('/book/eventtickets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventname: eventname,
      ticketleft: availableTablesCount, // Update with the counted tables
    }),
    credentials: 'include',
  })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        const errorMessage = data.message || 'Failed to update ticket count.';
        throw new Error(errorMessage);
      }
    })
    .catch((error) => {
      console.error('Error updating ticket count:', error);
      alert(`Error: ${error.message || 'There was an error updating the ticket count.'}`);
    });
}

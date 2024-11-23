async function initEventSelector() {
  try {
    const response = await fetch('/book/index');
    const events = await response.json();

    const eventSelect = document.getElementById('event-select');
    eventSelect.innerHTML = '<option value="">Select an event</option>'; // Reset options

    events.forEach((event) => {
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

let total = 0;
const customerData = {}; // You will fetch this data from your users collection

async function fetchCustomerData() {
  try {
    const response = await fetch('/auth/users');
    const data = await response.json();
    data.forEach((customer) => {
      customerData[`Table ${customer.tableId}`] = {
        name: customer.name,
        contact: customer.contact,
      };
    });
  } catch (error) {
    console.error('Error fetching customer data:', error);
  }
}

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

function showCustomerInfo(table) {
  const tableName = table.querySelector('text').textContent;
  if (customerData[tableName]) {
    const info = customerData[tableName];
    alert(`Customer Name: ${info.name}\nContact: ${info.contact}`);
  }
}

function editPrice(priceTextElement) {
  const currentPrice = priceTextElement.textContent.replace('$', ''); // Get the current price
  const newPrice = prompt(`Enter new price for this row:`, currentPrice);

  if (newPrice) {
    // Update the price in the text element
    priceTextElement.textContent = `$${newPrice}`;

    // Update all tables in the same row
    const rowNumber = priceTextElement.getAttribute('data-row'); // Get the row number from data attribute
    const tables = document.querySelectorAll(`.table-group[data-row="${rowNumber}"] .table`);

    tables.forEach((table) => {
      table.setAttribute('data-price', newPrice);
    });
  }
}

document.addEventListener('DOMContentLoaded', async function () {
  await fetchCustomerData(); // Fetch customer data on page load

  const priceTexts = document.querySelectorAll('.tableprice');
  priceTexts.forEach((priceText) => {
    priceText.addEventListener('click', function () {
      editPrice(priceText);
    });
  });
});

function save() {
  // Collect all table data to save
  const tables = document.querySelectorAll('.table');
  const eventSelect = document.getElementById('event-select');
  const selectedEvent = eventSelect.value; // Get the selected event name
  const tableData = [];

  tables.forEach((table) => {
    const tableName = table.querySelector('text').textContent;
    const price = table.getAttribute('data-price');
    const status = table.style.fill !== 'grey'; // true if available, false if unavailable
    const tableId = parseInt(tableName.split(' ')[1]); // Assuming table names are like "Table 1", "Table 2", and so on
    tableData.push({ tableId, eventname: selectedEvent, price, status });
  });

  // Send table data to the server
  fetch('/book/tables/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tableData),
  })
    .then((response) => {
      if (!response.ok) throw new Error('Failed to save changes');
      alert('Changes saved successfully!');
    })
    .catch((error) => {
      console.error('Error saving changes:', error);
      alert('There was an error saving the changes. Please try again.');
    });
}

// Initialize event listeners for all tables
document.querySelectorAll('.table').forEach((table) => {
  table.addEventListener('mouseover', () => showCustomerInfo(table));
  table.addEventListener('click', () => selectTable(table));
});

// Call this function on page load to set up the SVG tables
async function initTables() {
  try {
    const response = await fetch('/book/tables');
    const tables = await response.json();
    populateTableOptions(tables);
  } catch (error) {
    console.error('Error initializing tables:', error);
  }
}

function populateTableOptions(tables) {
  var seatingArea = document.querySelector('.table-group');
  seatingArea.innerHTML = ''; // Clear existing tables
  let x = 100;
  let y = 70;

  // Group tables by row
  let currentRow = 1;
  let tableCount = 0;

  tables.forEach((table, index) => {
    // Create a new row if we have reached 10 tables
    if (tableCount >= 10) {
      currentRow++;
      tableCount = 0;
      x = 100; // Reset x for new row
      y += 80; // Move down to the next row
    }
    if (currentRow === 1) {
      seatingArea = document.querySelector('.table-group[data-row="1"]');
    } else if (currentRow === 2) {
      seatingArea = document.querySelector('.table-group[data-row="2"]');
    } else {
      seatingArea = document.querySelector('.table-group[data-row="3"]');
    }
    const tableElement = document.createElement('rect');
    tableElement.className = 'table';
    tableElement.setAttribute('data-price', table.price);
    tableElement.setAttribute('x', x);
    tableElement.setAttribute('y', y);
    tableElement.setAttribute('width', 60);
    tableElement.setAttribute('height', 60);
    tableElement.setAttribute('onclick', 'selectTable(this)');

    // Set color based on availability
    if (!table.status) {
      tableElement.setAttribute('fill', 'grey'); // Unavailable
      tableElement.style.cursor = 'not-allowed';
    } else {
      tableElement.setAttribute('fill', 'hsl(38, 61%, 73%)'); // Available
    }

    seatingArea.appendChild(tableElement);

    const tableLabel = document.createElement('text');
    tableLabel.setAttribute('x', x + 30);
    tableLabel.setAttribute('y', y + 30);
    tableLabel.setAttribute('text-anchor', 'middle');
    tableLabel.setAttribute('fill', 'black');
    tableLabel.textContent = `Table ${index + 1}`;
    seatingArea.appendChild(tableLabel);

    // Increment positions and counts
    x += 70; // Move to the next table position
    tableCount++; // Increment table count
  });
  x = 100;
  y = 70;
}

// Initialize tables on page load
document.addEventListener('DOMContentLoaded', initTables);

// Initialize event selector on page load
document.addEventListener('DOMContentLoaded', initEventSelector);

async function initEventSelector() {
  try {
    const response = await fetch('/book/index');
    const data = await response.json();

    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to fetch events.');
    }

    const eventsArray = data.events; // Access the 'events' array
    const eventSelect = document.getElementById('event-select');

    // Populate event dropdown
    eventSelect.innerHTML = '<option value="">Select an event</option>';
    eventsArray.forEach((event) => {
      const option = document.createElement('option');
      option.value = event.eventname;
      option.textContent = event.eventname;
      eventSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    alert('Failed to load events. Please try again later.');
  }
}

// Event listener for event selection
document.getElementById('event-select').addEventListener('change', async function () {
  const eventname = this.value;

  if (eventname) {
    try {
      // Fetch event-specific tables
      const response = await fetch(`/book/tables/${eventname}`);
      const tables = await response.json();

      // Fetch event details (date, etc.)
      const eventResponse = await fetch(`/book/event/${eventname}`);
      const event = await eventResponse.json();

      // Populate table options on the UI
      populateTableOptions(tables);

      // Set the date input based on event data
      const dateInput = document.getElementById('date-time');
      if (event.event.date) {
        const formattedDate = `${event.event.date}T00:00`; // Append time
        dateInput.value = formattedDate;
      }

      // Reset state (clear selected tables and total price)
      resetSelection();
    } catch (error) {
      console.error('Error fetching event data:', error);
      alert('Failed to load event details. Please try again.');
    }
  } else {
    // Clear tables and date when no event is selected
    clearTableOptions();
    document.getElementById('date-time').value = '';
    resetSelection();
  }
});

function determineRowNumber(tableId) {
  if (tableId <= 10) return 1;
  if (tableId <= 20) return 2;
  return 3;
}

function calculateX(tableid) {
  // Calculate the column based on the tableId position in its row
  return 100 + ((tableid - 1) % 10) * 70; // Start at 100, spacing 70 between tables
}

function calculateY(rowNumber) {
  // Calculate the row position (1-based row number determines Y)
  return 70 + (rowNumber - 1) * 80; // Row 1 at y=70, Row 2 at y=150, Row 3 at y=230
}

function populateTableOptions(tables) {
  const seatingArea = document.querySelector('.table-group');

  // Ensure seatingArea exists
  if (!seatingArea) {
    console.error('Error: .table-group element not found in the DOM.');
    return;
  }

  seatingArea.innerHTML = ''; // Clear existing tables
  let x = 100; // Initial X position
  let y = 70; // Initial Y position

  // Loop through tables and create SVG elements
  tables.forEach((table, index) => {
    const rowNumber = determineRowNumber(table.tableid); // Get the row number
    const x = calculateX(table.tableid); // Calculate X position
    const y = calculateY(rowNumber); // Calculate Y position
    // Create table rectangle
    const tableElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    tableElement.classList.add('table');
    tableElement.setAttribute('data-price', table.price);
    tableElement.setAttribute('x', x);
    tableElement.setAttribute('y', y);
    tableElement.setAttribute('width', 60);
    tableElement.setAttribute('height', 60);

    // Set table status (available/unavailable)
    console.log('tablestatus   ', table.tableid, '   ', table.status);
    if (!table.status) {
      tableElement.setAttribute('fill', 'grey'); // Unavailable
      tableElement.style.cursor = 'not-allowed';
    } else {
      tableElement.setAttribute('fill', 'hsl(38, 61%, 73%)'); // Available
      tableElement.style.cursor = 'pointer';
      tableElement.setAttribute('onclick', 'selectTable(this)');
    }

    // Append table rectangle to the seating area
    seatingArea.appendChild(tableElement);

    // Create table label (Table X)
    const tableLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    tableLabel.setAttribute('x', x + 30); // Center the label in the rectangle
    tableLabel.setAttribute('y', y + 35); // Position label slightly below the rectangle center
    tableLabel.setAttribute('text-anchor', 'middle'); // Center the text
    tableLabel.setAttribute('fill', 'black'); // Text color
    tableLabel.textContent = `Table ${table.tableid}`; // Label content

    // Append table label to the seating area
    seatingArea.appendChild(tableLabel);
  });
}

// Clear tables from the UI
function clearTableOptions() {
  const seatingArea = document.querySelector('.table-group');
  seatingArea.innerHTML = '';
}

// Reset selection (clear tables and total price)
function resetSelection() {
  total = 0;
  selectedTables = [];
  document.getElementById('total-price').textContent = 'Total: $0';
}

// Handle table selection
let total = 0; // Initialize total price
let selectedTables = []; // Track selected tables

function selectTable(table) {
  const price = parseInt(table.getAttribute('data-price'), 10); // Get the table price
  const isSelected = selectedTables.includes(table); // Check if the table is already selected

  console.log('Clicked table:', table); // Debugging
  console.log('Current fill:', table.getAttribute('fill')); // Debugging

  if (isSelected) {
    // Deselect table
    table.setAttribute('fill', 'hsl(38, 61%, 73%)'); // Reset color to available (inline style)
    table.style.fill = 'hsl(38, 61%, 73%)'; // Force style change
    selectedTables = selectedTables.filter((t) => t !== table); // Remove from selected tables
    total -= price; // Decrease total price
  } else {
    // Select table
    table.setAttribute('fill', 'green'); // Mark as selected (inline style)
    table.style.fill = 'green'; // Force style change
    selectedTables.push(table); // Add to selected tables
    total += price; // Increase total price
  }

  // Update displayed total price
  document.getElementById('total-price').textContent = `Total: $${total}`;
}

async function bookTable() {
  const eventSelect = document.getElementById('event-select');
  const name = document.getElementById('name').value.trim();
  const people = document.getElementById('people').value;
  const phone = document.getElementById('phone').value.trim();
  const datetime = document.getElementById('date-time').value;

  // Validate inputs
  if (!eventSelect.value) {
    alert('Please select an event.');
    return;
  }

  if (!name) {
    alert('Please enter your name.');
    return;
  }

  if (!people || isNaN(people) || people <= 0) {
    alert('Please enter a valid number of people.');
    return;
  }

  if (!phone) {
    alert('Please enter your phone number.');
    return;
  }

  if (!datetime) {
    alert('Please select a date and time.');
    return;
  }

  if (selectedTables.length === 0) {
    alert('Please select at least one table before proceeding with the booking.');
    return;
  }

  console.log('Validation passed. Preparing booking details...');

  const tablesArray = selectedTables
    .map((table) => {
      const textElement = table.nextElementSibling;
      if (textElement && textElement.textContent.includes('Table')) {
        const match = textElement.textContent.match(/\d+/); // Extract number as a string
        if (match) {
          return parseInt(match[0], 10); // Parse the number
        }
      }
      return null; // Handle cases where no valid text is found
    })
    .filter((table) => table !== null); // Remove any null values

  const bookingDetails = {
    eventname: eventSelect.value,
    tablesarray: tablesArray,
    totalprice: total,
    datetime: datetime,
    name,
    phone,
    people,
  };

  console.log('Booking Details:', bookingDetails); // Log the booking details

  try {
    const unavailableTables = await verifyTableStatus(eventSelect.value, tablesArray);

    if (unavailableTables.length > 0) {
      alert(
        `The following table(s) have just been booked by others: ${unavailableTables.join(
          ', '
        )}. Please reselect your tables.`
      );
      return; // Stop the booking process
    }
    console.log('Sending booking details to the server...');
    const response = await fetch('/book/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingDetails),
    });

    console.log('Booking Details Sent:', bookingDetails); // Log the booking details
    console.log('Server Response:', response); // Log the server response

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Server Error:', errorData);
      throw new Error(errorData.message || 'Failed to process booking.');
    }

    alert('Your booking was successful! Redirecting to payment page...');
    window.location.href = `payment.html`;
  } catch (error) {
    console.error('Error booking table:', error.message || error);
    alert('Failed to process your booking. Please try again.');
  }
}

async function verifyTableStatus(eventname, tablesArray) {
  try {
    // Fetch the latest table statuses for the event
    const response = await fetch(`/book/tables/${eventname}`);
    if (!response.ok) {
      throw new Error('Failed to fetch table statuses.');
    }
    const tables = await response.json();

    // Check if any of the selected tables have been booked
    const unavailableTables = tablesArray.filter((tableNumber) => {
      const table = tables.find(
        (t, index) => index + 1 === tableNumber && !t.status // Match by table number and check status
      );
      return table !== undefined; // Return unavailable tables
    });

    // If there are unavailable tables, return them
    if (unavailableTables.length > 0) {
      return unavailableTables;
    }

    // If all selected tables are available, return an empty array
    return [];
  } catch (error) {
    console.error('Error verifying table status:', error);
    throw new Error('Failed to verify table status. Please try again.');
  }
}

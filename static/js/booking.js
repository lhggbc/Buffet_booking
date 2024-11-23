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

document.getElementById('event-select').addEventListener('change', async function () {
  const eventname = this.value;
  if (eventname) {
    try {
      // Fetching tables for the selected event
      const response = await fetch(`/book/tables/${eventname}`);
      const tables = await response.json();

      // Fetching event details
      const resp = await fetch(`/book/event/${eventname}`);
      const event = await resp.json();

      // Populate table options with fetched tables
      populateTableOptions(tables);

      // Set the date form to the date in the event data
      const dateInput = document.getElementById('date-time');
      if (event.event.date) {
        const formattedDate = `${event.event.date}T00:00`; // Append a default time (midnight)
        dateInput.value = formattedDate; // Set the input value to the formatted date
      }
    } catch (error) {
      console.error('Error fetching tables or event:', error);
    }
  } else {
    clearTableOptions();
    document.getElementById('date-time').value = ''; // Clear the date input if no event is selected
  }
});

function populateTableOptions(tables) {
  const seatingArea = document.querySelector('.table-group');
  seatingArea.innerHTML = ''; // Clear existing tables
  var x = 100;
  var y = 70;

  tables.forEach((table, index) => {
    if (index < 10) {
      y = 70;
      const tableElement = document.createElement('rect');
      tableElement.className = 'table';
      tableElement.setAttribute('data-price', table.price);
      tableElement.setAttribute('x', x);
      tableElement.setAttribute('y', y);
      tableElement.setAttribute('width', 60);
      tableElement.setAttribute('height', 60);
      tableElement.setAttribute('onclick', 'selectTable(this)');
      seatingArea.appendChild(tableElement);
      if (table.status === false) {
        tableElement.setAttribute('fill', 'grey'); // Set to grey if unavailable
        tableElement.style.cursor = 'not-allowed';
      } else {
        tableElement.setAttribute('fill', 'hsl(38, 61%, 73%)'); // Set to available color
        tableElement.setAttribute('onclick', 'selectTable(this)');
      }

      const tableLabel = document.createElement('text');
      tableLabel.setAttribute('x', x + 30);
      tableLabel.setAttribute('y', y + 30);
      tableLabel.setAttribute('text-anchor', 'middle');
      tableLabel.setAttribute('fill', 'black');
      tableLabel.textContent = `Table ${index + 1}`;
      seatingArea.appendChild(tableLabel);

      x += 70;
    } else if (index < 20) {
      y = 150;
      const tableElement = document.createElement('rect');
      tableElement.className = 'table';
      tableElement.setAttribute('data-price', table.price);
      tableElement.setAttribute('x', x);
      tableElement.setAttribute('y', y);
      tableElement.setAttribute('width', 60);
      tableElement.setAttribute('height', 60);
      tableElement.setAttribute('onclick', 'selectTable(this)');
      seatingArea.appendChild(tableElement);
      if (table.status === false) {
        tableElement.setAttribute('fill', 'grey'); // Set to grey if unavailable
        tableElement.style.cursor = 'not-allowed';
      } else {
        tableElement.setAttribute('fill', 'hsl(38, 61%, 73%)'); // Set to available color
        tableElement.setAttribute('onclick', 'selectTable(this)');
      }

      const tableLabel = document.createElement('text');
      tableLabel.setAttribute('x', x + 30);
      tableLabel.setAttribute('y', y + 30);
      tableLabel.setAttribute('text-anchor', 'middle');
      tableLabel.setAttribute('fill', 'black');
      tableLabel.textContent = `Table ${index + 1}`;
      seatingArea.appendChild(tableLabel);
      x += 70;
    } else {
      y = 230;
      const tableElement = document.createElement('rect');
      tableElement.className = 'table';
      tableElement.setAttribute('data-price', table.price);
      tableElement.setAttribute('x', x);
      tableElement.setAttribute('y', y);
      tableElement.setAttribute('width', 60);
      tableElement.setAttribute('height', 60);
      tableElement.setAttribute('onclick', 'selectTable(this)');
      seatingArea.appendChild(tableElement);
      if (!table.status) {
        tableElement.setAttribute('fill', 'grey'); // Set to grey if unavailable
        tableElement.style.cursor = 'not-allowed';
      } else {
        tableElement.setAttribute('fill', 'hsl(38, 61%, 73%)'); // Set to available color
        tableElement.setAttribute('onclick', 'selectTable(this)');
      }

      const tableLabel = document.createElement('text');
      tableLabel.setAttribute('x', x + 30);
      tableLabel.setAttribute('y', y + 30);
      tableLabel.setAttribute('text-anchor', 'middle');
      tableLabel.setAttribute('fill', 'black');
      tableLabel.textContent = `Table ${index + 1}`;
      seatingArea.appendChild(tableLabel);
      x += 70;
    }
    if (x > 730) {
      x = 100;
    }
  });
  y = 70;
}

function clearTableOptions() {
  const seatingArea = document.querySelector('.table-group');
  seatingArea.innerHTML = ''; // Clear existing tables
}

let total = 0; // Initialize total price
let selectedTables = []; // Array to hold selected tables

function selectTable(table) {
  const price = parseInt(table.getAttribute('data-price'));

  // Check if the table is already selected
  if (selectedTables.includes(table)) {
    // Deselect the table
    table.style.fill = table.getAttribute('data-price') === '400' ? 'hsl(38, 49%, 63%)' : 'hsl(38, 49%, 63%)'; // Reset to original color
    selectedTables = selectedTables.filter((t) => t !== table); // Remove from selected tables
    total -= price; // Decrease total
  } else {
    // Select the table
    table.style.fill = 'green'; // Mark as selected
    selectedTables.push(table); // Add to selected tables
    total += price; // Increase total
  }

  // Update the displayed total price
  document.getElementById('total-price').textContent = `Total: $${total}`;
}

async function bookTable() {
  const eventSelect = document.getElementById('event-select');
  const name = document.getElementById('name').value;
  const people = document.getElementById('people').value;
  const phone = document.getElementById('phone').value;
  const dateTime = document.getElementById('date-time').value;

  // Validate inputs
  if (!eventSelect.value || !name || !people || !phone || !dateTime || selectedTables.length === 0) {
    alert('Please fill out all fields and select at least one table.');
    return;
  }

  const tablesArray = selectedTables.map((table) => table.getAttribute('data-price')); // Collect prices of selected tables

  const paymentDetails = {
    eventname: eventSelect.value,
    tablesarray: tablesArray,
    totalprice: total,
    date: dateTime,
  };

  try {
    const response = await fetch('/book/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentDetails),
    });

    if (!response.ok) throw new Error('Failed to complete the booking');

    alert('Your booking was successful! Redirecting to payment page...');
    window.location.href = 'payment.html'; // Redirect to payment page
  } catch (error) {
    console.error('Error booking table:', error);
    alert('There was an error processing your booking. Please try again.');
  }
}

let events = []; // Global variable to store events
let editingEventId = null; // To keep track of the event being edited

document.addEventListener('DOMContentLoaded', async () => {
  await fetchEvents(); // Fetch events on page load
});

async function fetchEvents() {
  try {
    const response = await fetch('/book/index'); // Adjust the URL to your API endpoint
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    events = await response.json(); // Store events globally

    populateSlider();
    populateEventCards(); // Populate the event cards
  } catch (error) {
    console.error('Error fetching events:', error);
  }
}
function populateSlider() {
  const eventSliderContainer = document.getElementById('event');
  eventSliderContainer.innerHTML = ''; // Clear existing content for slider

  events.events.forEach((event, index) => {
    const slide = document.createElement('div');
    slide.className = 'hero-slide';
    if (index === 0) {
      slide.classList.add('active'); // Set active class only for the first slide
    }

    // Alternate between hero-slider-1 and hero-slider-2
    const imageIndex = index % 2 === 0 ? 1 : 2;
    slide.style.backgroundImage = `url('../src/images/hero-slider-${imageIndex}.jpg')`;

    slide.innerHTML = `
            <div class="hero-slide-content">
                <h1>${event.eventname}</h1>
                <p>Date: ${event.date}</p>
                <p>Time: ${event.time || 'TBD'}</p>
                <p>Venue: ${event.venue}</p>
                <p>Tickets left: ${event.ticketleft}</p>
                <a href="booking.html?event=${index + 1}" class="find-table-btn">View Description</a>
            </div>
        `;

    eventSliderContainer.appendChild(slide); // Append the slide to the slider container
  });
}
function populateEventCards() {
  const eventsListContainer = document.querySelector('.events-list');
  eventsListContainer.innerHTML = ''; // Clear existing content for event cards

  events.events.forEach((event, index) => {
    const eventCard = document.createElement('div');
    eventCard.className = 'event-card';
    eventCard.innerHTML = `
                <div class="event-image" style="background-image: url('../src/images/default-event.jpg');"> 
                    <h3>${event.eventname}</h3>
                    <p>Date: ${event.date}</p>
                    <p>Venue: ${event.venue}</p>
                    <p>Tickets left: ${event.ticketleft}</p>
                    <div class="button-group">
                        <button class="edit-btn" onclick="editEvent(${index})">Edit</button>
                        <button class="delete-btn" onclick="deleteEvent('${event.eventname}')">Delete</button>
                    </div>
                </div>
            `;
    eventsListContainer.appendChild(eventCard); // Append the card to the events list
  });
}

async function deleteEvent(eventname) {
  try {
    const response = await fetch(`/book/events/${eventname}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete event');
    events = events.filter((event) => event.eventname !== eventname); // Remove from local array
    populateEventCards(); // Re-populate cards
    populateSlider();
  } catch (error) {
    console.error('Error deleting event:', error);
  }
}

function toggleEventForm() {
  const form = document.getElementById('event-form');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';

  // Reset form fields
  if (form.style.display === 'none') {
    resetForm();
  }
}

function resetForm() {
  document.getElementById('event-title').value = '';
  document.getElementById('event-date').value = '';
  document.getElementById('event-venue').value = '';
  document.getElementById('event-tickets').value = '';
  editingEventId = null; // Reset editing ID
  document.getElementById('form-title').textContent = 'Add New Event';
}

function editEvent(index) {
  const event = events[index];
  document.getElementById('event-title').value = event.eventname;
  document.getElementById('event-date').value = event.date;
  document.getElementById('event-venue').value = event.venue;
  document.getElementById('event-tickets').value = event.ticketleft;
  editingEventId = event.eventname; // Store the name of the event being edited
  document.getElementById('form-title').textContent = 'Edit Event';
  toggleEventForm(); // Show form
}

async function addEvent() {
  const title = document.getElementById('event-title').value;
  const date = document.getElementById('event-date').value;
  const venue = document.getElementById('event-venue').value;
  const ticketLeft = document.getElementById('event-tickets').value;

  if (title && date && venue && ticketLeft) {
    const eventData = { eventname: title, date, venue, ticketleft: ticketLeft };

    try {
      const response = await fetch('/book/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) throw new Error('Failed to save event');
      const newEvent = await response.json();

      if (editingEventId) {
        // Update the local events array
        const index = events.findIndex((event) => event.eventname === editingEventId);
        events[index] = newEvent; // Replace with updated event
      } else {
        events.push(newEvent); // Add new event to the array
      }
      populateEventCards(); // Refresh cards
      resetForm(); // Reset form fields
    } catch (error) {
      console.error('Error adding/updating event:', error);
    }

    toggleEventForm(); // Hide form
  } else {
    alert('Please fill out all fields.');
  }
}

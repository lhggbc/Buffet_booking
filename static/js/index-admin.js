let events = []; // Global variable to store events
let editingEventId = null; // To keep track of the event being edited

document.addEventListener('DOMContentLoaded', async () => {
  await fetchEvents(); // Fetch events on page load
  initializeSearch(); // Initialize the search functionality
});

async function fetchEvents() {
  try {
    const response = await fetch('/book/index'); // Adjust the URL to your API endpoint
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json(); // { status: 'success', events: [...] }
    events = data; // Store the entire response

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
    const bgImage = event.bgimg
      ? `/uploads/bgimg/${event.bgimg}`
      : `./images/hero-slider-${index % 2 === 0 ? 1 : 2}.jpg`;
    slide.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),url('${bgImage}')`;

    slide.innerHTML = `
      <div class="hero-slide-content">
        <h1>${event.eventname}</h1>
        <p>Date: ${event.date}</p>
        <p>Venue: ${event.venue}</p>
        <p>Tickets left: ${event.ticketleft}</p>
        <button class="find-table-btn">${event.description}</button>
      </div>
    `;

    eventSliderContainer.appendChild(slide); // Append the slide to the slider container
  });

  // Add navigation buttons
  const slidebutton = document.createElement('div');
  slidebutton.innerHTML = `
    <button class="slider-btn prev" aria-label="slide to previous" data-prev-btn>
      <ion-icon name="chevron-back"></ion-icon>
    </button>
    <button class="slider-btn next" aria-label="slide to next" data-next-btn>
      <ion-icon name="chevron-forward"></ion-icon>
    </button>`;
  eventSliderContainer.appendChild(slidebutton);

  // Attach event listeners after slider is populated
  const prevBtn = document.querySelector('.slider-btn.prev');
  const nextBtn = document.querySelector('.slider-btn.next');

  prevBtn.addEventListener('click', prevSlide);
  nextBtn.addEventListener('click', nextSlide);

  // Update heroSlides variable after adding slides
  heroSlides = document.querySelectorAll('.hero-slide');
  currentSlide = 0; // Reset current slide index
  showSlide(currentSlide); // Show the first slide

  // Start automatic sliding
  setInterval(nextSlide, 5000);
}

function populateEventCards() {
  const eventsListContainer = document.querySelector('.events-list');
  eventsListContainer.innerHTML = ''; // Clear existing content for event cards

  events.events.forEach((event, index) => {
    const eventCard = document.createElement('div');
    eventCard.className = 'event-card';
    const bgImage = event.bgimg
      ? `/uploads/bgimg/${event.bgimg}`
      : `./images/hero-slider-${index % 2 === 0 ? 1 : 2}.jpg`;
    eventCard.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),url('${bgImage}')`;
    eventCard.innerHTML = `
      <h3>${event.eventname}</h3>
      <p>Date: ${event.date}</p>
      <p>Venue: ${event.venue}</p>
      <p>Tickets left: ${event.ticketleft}</p>
      <div class="button-group">
        <button class="edit-btn" data-index="${index}">Edit</button>
        <button class="delete-btn" data-eventname="${event.eventname}">Delete</button>
      </div>
    `;
    eventsListContainer.appendChild(eventCard); // Append the card to the events list

    // Attach event listeners directly to the buttons
    const editButton = eventCard.querySelector('.edit-btn');
    editButton.addEventListener('click', function () {
      editEvent(index);
    });

    const deleteButton = eventCard.querySelector('.delete-btn');
    deleteButton.addEventListener('click', function () {
      deleteEvent(event.eventname);
    });
  });
}

async function deleteEvent(eventname) {
  try {
    const response = await fetch(`/book/events/${eventname}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete event');

    events.events = events.events.filter((event) => event.eventname !== eventname);

    // Re-populate the event cards and slider instead of reloading
    populateEventCards();
    populateSlider();

    alert('Event deleted successfully!');
  } catch (error) {
    console.error('Error deleting event:', error);
  }
}
async function deleteevent(eventname) {
  try {
    const response = await fetch(`/book/events/${eventname}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete event');

    events.events = events.events.filter((event) => event.eventname !== eventname);

    // Re-populate the event cards and slider instead of reloading
    populateEventCards();
    populateSlider();
  } catch (error) {
    console.error('Error deleting event:', error);
  }
}

function toggleEventForm() {
  const form = document.getElementById('event-form');
  if (form.style.display === 'none' || form.style.display === '') {
    form.style.display = 'block';
  } else {
    form.style.display = 'none';
    resetForm();
  }
}

function resetForm() {
  document.getElementById('event-title').value = '';
  document.getElementById('event-date').value = '';
  document.getElementById('event-venue').value = '';
  document.getElementById('event-tickets').value = '';
  document.getElementById('event-description').value = '';
  editingEventId = null; // Reset editing ID
  document.getElementById('form-title').textContent = 'Add New Event';
}

function editEvent(index) {
  const event = events.events[index];
  if (!event) {
    console.error(`No event found at index ${index}`);
    return;
  }

  console.log('Editing Event:', event); // Debugging line

  document.getElementById('event-title').value = event.eventname;
  document.getElementById('event-date').value = event.date;
  document.getElementById('event-venue').value = event.venue;
  document.getElementById('event-tickets').value = event.ticketleft;
  document.getElementById('event-description').value = event.description;

  editingEventId = event.eventname; // Store the name of the event being edited
  document.getElementById('form-title').textContent = 'Edit Event';

  toggleEventForm(); // Show form
}

async function addEvent() {
  const title = document.getElementById('event-title').value;
  const date = document.getElementById('event-date').value;
  const venue = document.getElementById('event-venue').value;
  const ticketLeft = document.getElementById('event-tickets').value;
  const description = document.getElementById('event-description').value;
  const bgimg = document.getElementById('event-bgimg').files[0]; // Check for uploaded image file

  if (title && date && venue && ticketLeft && description) {
    const Left = parseNumberOrReturnString(ticketLeft);
    console.log(Left);
    const eventData = { eventname: title, date, venue, ticketleft: Left, description };

    try {
      const response = await fetch('/book/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) throw new Error('Failed to save event');
      const newEvent = await response.json();

      if (bgimg) {
        const formData = new FormData();
        formData.append('eventname', title); // Include the event name
        formData.append('bgimg', bgimg); // Include the uploaded image file

        const imgResponse = await fetch('/book/eventwithimg', {
          method: 'POST',
          body: formData, // Send the image data
        });

        if (!imgResponse.ok) throw new Error('Failed to upload event image');
        const imgResult = await imgResponse.json(); // Optionally handle the response
        console.log('Image upload response:', imgResult);
      }

      if (editingEventId) {
        // Update the existing event in the events array
        const index = events.events.findIndex((event) => event.eventname === editingEventId);
        if (index !== -1) {
          events.events[index] = newEvent; // Replace with updated event
        }
      } else {
        // Add the new event to the events array
        events.events.push(newEvent);
      }

      resetForm(); // Reset form fields
      populateEventCards(); // Re-populate event cards
      populateSlider(); // Re-populate slider
      alert('Event added/updated successfully!');
    } catch (error) {
      console.error('Error adding/updating event:', error);
    }

    toggleEventForm(); // Hide form
  } else {
    alert('Please fill out all fields.');
  }
}

var heroSlides = document.querySelectorAll('.hero-slide');
const prevBtn = document.querySelector('.slider-btn.prev');
const nextBtn = document.querySelector('.slider-btn.next');
let currentSlide = 0;

function showSlide(n) {
  heroSlides[currentSlide].classList.remove('active');
  currentSlide = (n + heroSlides.length) % heroSlides.length;
  heroSlides[currentSlide].classList.add('active');
}

function prevSlide() {
  showSlide(currentSlide - 1);
}

function nextSlide() {
  showSlide(currentSlide + 1);
}

setInterval(nextSlide, 5000);

let lastScrollTop = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', function () {
  let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  if (scrollTop > lastScrollTop) {
    // Scrolling down
    header.classList.add('hide');
    header.classList.remove('show'); // Ensure the show class is removed
  } else if (scrollTop == 0) {
    // Scrolling up
    header.classList.remove('hide');
    header.classList.add('show'); // Add show class to make it visible
  }
  lastScrollTop = scrollTop;
});

function initializeSearch() {
  const searchInput = document.getElementById('event-search');
  const suggestionsList = document.getElementById('suggestions');

  // Handle input in the search bar
  searchInput.addEventListener('input', function () {
    const query = this.value.trim().toLowerCase();
    suggestionsList.innerHTML = ''; // Clear previous suggestions

    if (query === '') {
      // Show all event cards if query is empty
      showAllEventCards();
      suggestionsList.classList.remove('active');
      return;
    }

    // Filter event cards based on input
    const filteredEvents = events.events.filter(
      (event) =>
        event.eventname.toLowerCase().includes(query) ||
        event.date.toLowerCase().includes(query) ||
        event.venue.toLowerCase().includes(query)
    );

    // Show or hide event cards based on the filtered results
    const allEventCards = document.querySelectorAll('.event-card');
    allEventCards.forEach((card, index) => {
      const event = events.events[index];
      if (
        event.eventname.toLowerCase().includes(query) ||
        event.date.toLowerCase().includes(query) ||
        event.venue.toLowerCase().includes(query)
      ) {
        card.style.display = 'block'; // Show matching card
      } else {
        card.style.display = 'none'; // Hide non-matching card
      }
    });

    // Populate suggestions
    const matchedSuggestions = events.events.filter((event) => event.eventname.toLowerCase().includes(query));

    if (matchedSuggestions.length > 0) {
      matchedSuggestions.forEach((event) => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.textContent = event.eventname;
        suggestionItem.onclick = () => {
          searchInput.value = event.eventname; // Fill input with selected event
          suggestionsList.innerHTML = ''; // Clear suggestions
          filterEventCards(event.eventname); // Filter event cards based on selection
        };
        suggestionsList.appendChild(suggestionItem);
      });
      suggestionsList.classList.add('active'); // Show suggestions
    } else {
      suggestionsList.classList.remove('active'); // Hide suggestions if no matches
    }
  });

  // Handle pressing 'Enter' key in the search bar
  searchInput.addEventListener('keyup', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission or page refresh
      const selectedEventName = this.value.trim();
      if (selectedEventName !== '') {
        filterEventCards(selectedEventName);
        suggestionsList.classList.remove('active'); // Hide suggestions
      }
    }
  });

  // Hide suggestions when clicking outside
  document.addEventListener('click', function (e) {
    if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
      suggestionsList.classList.remove('active'); // Hide suggestions if clicked outside
    }
  });
}

function showAllEventCards() {
  const allEventCards = document.querySelectorAll('.event-card');
  allEventCards.forEach((card) => {
    card.style.display = 'block'; // Show all cards
  });
}
function filterEventCards(eventName) {
  const allEventCards = document.querySelectorAll('.event-card');
  allEventCards.forEach((card, index) => {
    const event = events.events[index];
    if (event.eventname === eventName) {
      card.style.display = 'block'; // Show matching card
    } else {
      card.style.display = 'none'; // Hide non-matching card
    }
  });
}
function parseNumberOrReturnString(value) {
  // Check if the value is a string and represents a valid number
  if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
    return parseInt(value, 10); // Return parsed integer
  } else {
    return value; // Return the original string
  }
}

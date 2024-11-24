let events = []; // Global variable to store events

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/book/index');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    events = await response.json(); // Store events globally

    // Populate Hero Slider
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
      slide.style.backgroundImage = `url('./images/hero-slider-${imageIndex}.jpg')`;

      slide.innerHTML = `
                    <div class="hero-slide-content">
                        <h1>${event.eventname}</h1>
                        <p>Date: ${event.date}</p>
                        <p>Time: ${event.time || 'TBD'}</p>
                        <p>Venue: ${event.venue}</p>
                        <p>Tickets left: ${event.ticketleft}</p>
                       <button class="find-table-btn">${event.description}</button>
                    </div>
                `;

      eventSliderContainer.appendChild(slide);
    });

    // Add navigation buttons
    const slidebutton = document.createElement('div');
    slidebutton.innerHTML = `
    <button class="slider-btn prev" aria-label="slide to previous" data-prev-btn>
      <ion-icon name="chevron-back"></ion-icon>
    </button>
    <button class="slider-btn next" aria-label="slide to next" data-next-btn>
      <ion-icon name="chevron-forward"></ion-icon>
    </button><a href="booking.html" class="hero-btn has-after">
        <img src="./images/hero-icon.png" width="48" height="48" alt="booking icon" />

        <span class="label-2 text-center span">Book A Table</span>
      </a>`;
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

    // Populate Event Cards
    const eventsListContainer = document.querySelector('.events-list');
    eventsListContainer.innerHTML = ''; // Clear existing content for event cards

    events.forEach((event, index) => {
      const eventCard = document.createElement('div');
      eventCard.className = 'event-card';

      const eventImageIndex = index % 2 === 0 ? 1 : 2; // Alternating images for cards
      eventCard.innerHTML = `
                    <div class="event-image" style="background-image: url('./images/hero-slider-${eventImageIndex}.jpg')">
                        <h3 class="event-name">${event.eventname}</h3>
                        <p class="event-date">Date: ${event.date}</p>
                        <p class="event-venue">Venue: ${event.venue}</p>
                        <p class="event-tickets-left">Tickets left: ${event.ticketleft}</p>
                        <button class="find-table-btn">${event.description}</button>
                    </div>
                `;

      eventsListContainer.appendChild(eventCard); // Append the card to the events list
    });

    // Search Functionality
    const searchInput = document.getElementById('event-search');
    const suggestionsList = document.getElementById('suggestions');

    searchInput.addEventListener('input', function () {
      const query = this.value.toLowerCase();
      suggestionsList.innerHTML = ''; // Clear previous suggestions

      // Filter event cards based on input
      const filteredEvents = events.filter(
        (event) =>
          event.eventname.toLowerCase().includes(query) ||
          event.date.toLowerCase().includes(query) ||
          event.venue.toLowerCase().includes(query)
      );

      // Show or hide event cards based on the filtered results
      const allEventCards = document.querySelectorAll('.event-card');
      allEventCards.forEach((card, index) => {
        const eventName = events[index].eventname.toLowerCase();
        const eventDate = events[index].date.toLowerCase();
        const eventVenue = events[index].venue.toLowerCase();

        // Check if the card matches the query
        if (eventName.includes(query) || eventDate.includes(query) || eventVenue.includes(query)) {
          card.style.display = 'block'; // Show matching card
        } else {
          card.style.display = 'none'; // Hide non-matching card
        }
      });

      // Populate suggestions
      if (query) {
        const matchedSuggestions = events.filter((event) => event.eventname.toLowerCase().includes(query));
        matchedSuggestions.forEach((event) => {
          const suggestionItem = document.createElement('div');
          suggestionItem.className = 'suggestion-item';
          suggestionItem.textContent = event.eventname;
          suggestionItem.onclick = () => {
            searchInput.value = event.eventname; // Fill input with selected event
            suggestionsList.innerHTML = ''; // Clear suggestions
          };
          suggestionsList.appendChild(suggestionItem);
        });
        suggestionsList.classList.add('active'); // Show suggestions
      } else {
        suggestionsList.classList.remove('active'); // Hide suggestions if input is empty
      }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', function (e) {
      if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
        suggestionsList.classList.remove('active'); // Hide suggestions if clicked outside
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
  }
});

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

//GUO Beichen 22103456D, Li Haige 22101812D
document.addEventListener('DOMContentLoaded', async function () {
  const response = await fetch('/auth/me');
  const result = await response.json();
  if (response.ok && result.status === 'success') {
    const gender = result.user.gender;
    const prefix = gender === 'male' ? 'Mr.' : 'Ms.';
    document.getElementById('uid').textContent = '@' + result.user.uid;
    document.getElementById('nickname').textContent = 'Hello! ' + prefix + result.user.nickname;
    document.getElementById('email').textContent = result.user.email;
    document.getElementById('phonenum').textContent = result.user.phonenum;
    document.getElementById('birthdate').textContent = result.user.birthdate;
    document.getElementById('gender').textContent = result.user.gender;
    document.getElementById('avatar').setAttribute('src', result.user.avatar);
  } else {
    alert(response.error);
    alert('Please login first.');
    window.location.href = '/login.html';
  }
});

document.getElementById('searchInput').addEventListener('input', function () {
  const filter = this.value.toLowerCase();
  const bookingCards = document.querySelectorAll('.booking-card');

  bookingCards.forEach((card) => {
    const eventName = card.querySelector('.booking-header').textContent.toLowerCase();
    if (eventName.includes(filter)) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
});

async function loadPayments() {
  try {
    const response = await fetch('/auth/payments', {
      method: 'GET',
    });

    const payments = await response.json();
    console.log(payments);

    const bookingList = document.getElementById('bookingList');
    bookingList.innerHTML = '';

    payments.forEach((payment) => {
      const bookingCard = document.createElement('div');
      bookingCard.className = 'card booking-card mb-5';

      bookingCard.innerHTML = `
        <div class="booking-header">
          Buffet Event - ${payment.eventname}
          ${getStatusBadge(payment.status)}
        </div>
        <div class="booking-info">
          <div>
            <i class="bi bi-calendar icon"></i>
            <span>Date:</span> ${payment.datetime}
          </div>
          <div>
            <i class="bi bi-geo-alt icon"></i>
            <span>Method:</span> ${payment.method}
          </div>
          <div>
            <i class="bi bi-people icon"></i>
            <span>Guests:</span> ${payment.people}
          </div>
          <div>
            <i class="bi bi-cash icon"></i>
            <span>Price:</span> $${payment.totalprice}
          </div>
          <div>
            <i class="bi bi-table icon"></i>
            <span>Table No:</span> ${payment.tablesarray.join(', ')}
          </div>
        </div>
      `;

      bookingList.appendChild(bookingCard);
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
  }
}

function getStatusBadge(status) {
  switch (status) {
    case true:
      return '<span class="badge bg-success">Success</span>';
    case false:
      return '<span class="badge bg-danger">Failed</span>';
    default:
      return '';
  }
}

window.addEventListener('DOMContentLoaded', loadPayments);

document.getElementById('searchInput').addEventListener('input', function () {
  const filter = this.value.toLowerCase();
  const bookingCards = document.querySelectorAll('.booking-card');

  bookingCards.forEach((card) => {
    const eventName = card.querySelector('.booking-header').textContent.toLowerCase();
    if (eventName.includes(filter)) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
});

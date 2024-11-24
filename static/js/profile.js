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

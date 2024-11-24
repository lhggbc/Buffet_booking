document.getElementById('registerButton').addEventListener('click', async function (event) {
  event.preventDefault();
  const uid = document.getElementById('uid');
  const nickname = document.getElementById('nickname');
  const email = document.getElementById('email');
  const phonenum = document.getElementById('phonenum');
  const password = document.getElementById('password');
  const passwordConfirm = document.getElementById('password-repeat');
  const gender = document.getElementById('gender');
  const birthdate = document.getElementById('birthdate');
  const avatar = document.getElementById('avatar');

  if (
    !uid.value.trim() ||
    !nickname.value.trim() ||
    !email.value.trim() ||
    !phonenum.value.trim() ||
    !password.value.trim() ||
    !passwordConfirm.value.trim() ||
    !gender.value ||
    !birthdate.value
  ) {
    alert('All fields are required. Please fill in all the details.');
    return;
  }

  if (password.value !== passwordConfirm.value) {
    alert('Passwords mismatch!');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    alert('Invalid email format. Please enter a valid email address.');
    return;
  }

  const phoneRegex = /^[0-9]{10,15}$/;
  if (!phoneRegex.test(phonenum.value)) {
    alert('Invalid phone number. Please enter a valid phone number (10-15 digits).');
    return;
  }

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  if (!passwordRegex.test(password.value)) {
    alert('Password must be at least 8 characters long and contain both letters and numbers.');
    return;
  }
  if (gender.value !== 'male' && gender.value !== 'female') {
    alert('Invalid gender.');
    return;
  }

  const formData = new FormData();
  formData.append('uid', uid.value.trim());
  formData.append('nickname', nickname.value.trim());
  formData.append('email', email.value.trim());
  formData.append('phonenum', phonenum.value.trim());
  formData.append('password', password.value.trim());
  formData.append('gender', gender.value);
  formData.append('birthdate', birthdate.value);

  if (avatar.files.length > 0) {
    formData.append('avatar', avatar.files[0]);
  } else {
    alert('Please upload an avatar.');
    return;
  }

  try {
    const response = await fetch('/auth/register', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (response.ok && result.status === 'success') {
      alert(`Welcome, ${nickname.value}!\nYou can login with your account now!`);
      window.location.href = '/login.html';
    } else if (result.status === 'failed') {
      alert(result.message);
    } else {
      alert('An unknown error occurred. Please try again later.');
    }
  } catch (error) {
    console.error('Error during registration:', error);
    alert('Failed to register. Please check your connection and try again.');
  }
});

const avatarInput = document.getElementById('avatar');
const avatarPreviewImg = document.getElementById('avatarPreview');

avatarInput.addEventListener('change', function () {
  const file = this.files[0];

  if (file) {
    const reader = new FileReader();

    reader.onload = function (e) {
      avatarPreviewImg.setAttribute('src', e.target.result);
    };

    reader.readAsDataURL(file);
  } else {
    // 如果没有文件，重置为默认头像
    avatarPreviewImg.setAttribute('src', './images/default-avatar.jpg');
  }
});

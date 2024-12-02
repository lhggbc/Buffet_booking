//GUO Beichen 22103456D, Li Haige 22101812D
let result;

document.addEventListener('DOMContentLoaded', async function () {
  const response = await fetch('/auth/me');
  result = await response.json();
  if (response.ok && result.status === 'success') {
    const gender = result.user.gender;
    const prefix = gender === 'male' ? 'Mr.' : 'Ms.';
    document.getElementById('uid').textContent = '@' + result.user.uid;
    document.getElementById('uid-form').value = result.user.uid;
    document.getElementById('nickname').textContent = 'Hello! ' + prefix + result.user.nickname;
    document.getElementById('email').textContent = result.user.email;
    document.getElementById('phonenum').textContent = result.user.phonenum;
    document.getElementById('birthdate').textContent = result.user.birthdate;
    document.getElementById('gender').textContent = result.user.gender;
    document.getElementById('avatar').setAttribute('src', result.user.avatar);
    document.getElementById('avatar-form').setAttribute('src', result.user.avatar);
  } else {
    alert('Please login first.');
    window.location.href = '/login.html';
  }
});

document.getElementById('editProfileForm').addEventListener('submit', async function (event) {
  const isConfirmed = confirm('Are you sure you want to update your profile?');
  if (!isConfirmed) {
    return;
  }
  event.preventDefault();
  function getValueOrDefault(elementId, defaultValue) {
    const element = document.getElementById(elementId);

    const value = element ? ('value' in element ? element.value.trim() : element.textContent?.trim()) : null;
    return value ? value : defaultValue;
  }

  const uid = getValueOrDefault('uid-form', result.user.uid);
  const nickname = getValueOrDefault('nickname-form', result.user.nickname);
  const email = getValueOrDefault('email-form', result.user.email);
  const phonenum = getValueOrDefault('phonenum-form', result.user.phonenum);
  const password = getValueOrDefault('password-form', result.user.password);

  const avatarInput = document.getElementById('avatar-upload-form');
  const avatar = avatarInput && avatarInput.files.length > 0 ? avatarInput.files[0] : result.user.avatar;

  const gender = result.user.gender;
  const birthdate = result.user.birthdate;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert('Invalid email format. Please enter a valid email address.');
    return;
  }

  const phoneRegex = /^[0-9]{10,15}$/;
  if (!phoneRegex.test(phonenum)) {
    alert('Invalid phone number. Please enter a valid phone number (10-15 digits).');
    return;
  }

  let passwordChangeFlag = false;
  if (!password === result.user.password) {
    passwordChangeFlag = true;
  }

  const passwordRegex = /^(?=.*[A-Za-z]).{8,}$/;
  if (!passwordRegex.test(password.value)) {
    alert('Password must be at least 8 characters long and contain at least one letter.');
    return;
  }
  if (gender !== 'male' && gender !== 'female') {
    alert('Invalid gender.');
    return;
  }
  const formData = new FormData();
  formData.append('uid', uid.trim());
  formData.append('nickname', nickname.trim());
  formData.append('email', email.trim());
  formData.append('phonenum', phonenum.trim());
  formData.append('password', password.trim());
  formData.append('gender', gender);
  formData.append('birthdate', birthdate);
  formData.append('avatar', avatar);
  formData.append('enabled', 'true');
  formData.append('passwordChangeFlag', passwordChangeFlag);

  try {
    const response = await fetch('/auth/edit', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    if (response.ok && result.status === 'success') {
      alert('Profile updated successfully.');
      window.location.href = '/profile.html';
    } else if (result.status === 'failed') {
      alert(result.message);
    } else {
      alert('An unknown error occurred. Please try again later.');
    }
  } catch (error) {
    console.error('Error during profile update:', error);
    alert('Failed to update profile. Please check your connection and try again.');
  }
});

const avatarInput = document.getElementById('avatar-upload-form');
const avatarPreview = document.getElementById('avatar-form');

avatarInput.addEventListener('change', (event) => {
  const file = event.target.files[0];

  if (file) {
    const fileURL = URL.createObjectURL(file);
    avatarPreview.src = fileURL;

    avatarPreview.onload = () => {
      URL.revokeObjectURL(fileURL);
    };
  }
});

// const avatarLabel = document.getElementById('avatar-display-form');
// avatarLabel.addEventListener('click', () => {
//   avatarInput.click();
// });

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

    // 如果是 <input> 或 <textarea>，使用 .value；否则使用 .textContent
    const value = element
      ? 'value' in element
        ? element.value.trim() // 如果是输入框，取 .value
        : element.textContent?.trim() // 否则取 .textContent
      : null;
    // 如果值为空或不存在，返回默认值
    return value ? value : defaultValue;
  }

  const uid = getValueOrDefault('uid-form', result.user.uid);
  const nickname = getValueOrDefault('nickname-form', result.user.nickname);
  const email = getValueOrDefault('email-form', result.user.email);
  const phonenum = getValueOrDefault('phonenum-form', result.user.phonenum);
  const password = getValueOrDefault('password-form', result.user.password);

  // 处理文件上传
  const avatarInput = document.getElementById('avatar-upload-form');
  const avatar = avatarInput && avatarInput.files.length > 0 ? avatarInput.files[0] : result.user.avatar;

  // 直接使用已有值
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
      window.location.href = '/profile.html'; // 根据实际情况调整重定向页面
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

// 获取文件输入框和头像预览的 img 标签
const avatarInput = document.getElementById('avatar-upload-form');
const avatarPreview = document.getElementById('avatar-form');

// 监听文件输入框的变化事件
avatarInput.addEventListener('change', (event) => {
  const file = event.target.files[0]; // 获取用户选择的文件

  if (file) {
    // 创建文件的 URL 预览
    const fileURL = URL.createObjectURL(file);

    // 将 img 的 src 设置为文件预览 URL
    avatarPreview.src = fileURL;

    // 释放之前的 URL 对象（优化内存）
    avatarPreview.onload = () => {
      URL.revokeObjectURL(fileURL);
    };
  }
});

// 点击头像时触发文件选择框
// const avatarLabel = document.getElementById('avatar-display-form');
// avatarLabel.addEventListener('click', () => {
//   avatarInput.click();
// });

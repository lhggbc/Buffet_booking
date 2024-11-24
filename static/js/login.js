document.getElementById('loginButton').addEventListener('click', async function (event) {
  event.preventDefault();
  const uid = document.getElementById('uid').value;
  const password = document.getElementById('password').value;
  if (!uid || !password) {
    alert('uid and password cannot be empty');
    return;
  }

  const formData = new FormData();
  formData.append('uid', uid);
  formData.append('password', password);

  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    if (response.ok && result.status === 'success') {
      alert(`Logged as \`${result.user.uid}\` (${result.user.role})`);
      if (result.user.role === 'admin') {
        window.location.href = '/admin-dashboard.html';
      } else {
        window.location.href = '/index.html';
      }
    } else if (result.status === 'failed') {
      alert(result.message);
    } else {
      alert('Unknown error');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Unknown error');
  }
});

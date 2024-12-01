document.getElementById('loginButton').addEventListener('click', async function (event) {
  event.preventDefault();
  const uid = document.getElementById('uid').value;
  const password = document.getElementById('password').value;

  // Validate input
  if (!uid || !password) {
    alert('uid and password cannot be empty');
    return;
  }

  // Create form data
  const formData = new FormData();
  formData.append('uid', uid);
  formData.append('password', password);

  try {
    // Send POST request to login endpoint
    const response = await fetch('/auth/login', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    // Handle response
    if (response.ok && result.status === 'success') {
      alert(`Logged in as \`${result.user.uid}\` (${result.user.role})`);

      // Redirect based on user role
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

// Handle "Remember me" functionality
window.addEventListener('load', () => {
  const savedUid = localStorage.getItem('uid');
  if (savedUid) {
    document.getElementById('uid').value = savedUid;
    document.getElementById('rememberMe').checked = true;
  }
});

document.getElementById('loginButton').addEventListener('click', () => {
  const uid = document.getElementById('uid').value;
  const rememberMe = document.getElementById('rememberMe').checked;

  if (rememberMe) {
    localStorage.setItem('uid', uid);
  } else {
    localStorage.removeItem('uid');
  }
});

//GUO Beichen 22103456D, Li Haige 22101812D
document.getElementById('logoutButton').addEventListener('click', async function (event) {
  event.preventDefault();

  try {
    const response = await fetch('/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      if (result.status === 'success') {
        window.location.href = '/logout.html';
      } else {
        alert(result.message || 'Unknown error occurred during logout.');
      }
    } else {
      if (response.status === 401) {
        alert('Unauthorized: No active session.');
      } else if (response.status === 500) {
        alert('Server error: Logout failed.');
      } else {
        alert('Unexpected error: ' + response.statusText);
      }
    }
  } catch (error) {
    console.error('Error:', error);
    alert('A network error occurred. Please try again.');
  }
});

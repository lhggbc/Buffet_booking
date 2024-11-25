async function loadUsers() {
  try {
    const response = await fetch('/admin/account-management', {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const users = await response.json();
    const usernum = users.length;
    document.getElementById('totalUsers').textContent = usernum;

    const userList = document.getElementById('userList');
    userList.innerHTML = ''; // Clear any existing content

    users.forEach((user) => {
      if (user.uid === 'admin') {
        return; // Skip rendering the admin user
      }
      // Create user card container
      const userCard = document.createElement('div');
      userCard.className = 'card user-card mb-5';
      userCard.style.cursor = 'pointer'; // Make it look clickable

      // Set up click event to navigate to profile page
      userCard.addEventListener('click', async () => {
        const response = await fetch(`/admin/me`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json', // 必须明确指定内容类型
          },
          body: JSON.stringify({ uid: user.uid }),
        });
        window.location.href = `profile-edit-admin.html`;
      });

      // Build the card content
      userCard.innerHTML = `
          <div class="user-header">
            <h1>${user.uid}</h1>
            <img
            src="${user.avatar}"
            alt="User avatar"
            style="
              width: 80px; /* 设置图片宽度 */
              height: 80px; /* 设置图片高度 */
              border-radius: 50%; /* 将图片变成圆形 */
              object-fit: cover; /* 确保图片填满容器并裁剪 */
              border: 2px solid #ccc; /* 可选：添加边框 */
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* 可选：添加阴影 */
            "
          >
          </div>
          <div class="user-info">
          <div class="mb-2">
            ${user.enabled === 'true' ? '<span class="badge bg-info">Active</span>' : '<span class="badge bg-danger text-dark">Disabled</span>'}
          </div>
          <div></div>
            
            <div>
              <i class="bi bi-envelope-fill icon"></i>
              <span>Email:</span> ${user.email}
            </div>
            <div>
              <i class="bi bi-person-fill icon"></i>
              <span>Nickname:</span> ${user.nickname}
            </div>
            <div>
              <i class="bi bi-calendar-check-fill icon"></i>
              <span>Joined:</span> ${user.register_date}
            </div>
            <div>
              <i class="bi bi-telephone-fill icon"></i>
              <span>Phone:</span> ${user.phonenum}
            </div>
          </div>
        `;

      userList.appendChild(userCard);
    });
  } catch (error) {
    console.error('Error fetching users:', error);
  }
}

// Call the function when the page loads
window.addEventListener('DOMContentLoaded', loadUsers);

// Search functionality
document.getElementById('searchInput').addEventListener('input', function () {
  const filter = this.value.toLowerCase();
  const userCards = document.querySelectorAll('.user-card');

  userCards.forEach((card) => {
    const uid = card.querySelector('.user-header').textContent.toLowerCase();
    if (uid.includes(filter)) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
});

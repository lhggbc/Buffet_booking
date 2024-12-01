//GUO Beichen 22103456D, Li Haige 22101812D
async function loadPayments() {
  try {
    const response = await fetch('/admin/payments', {
      method: 'GET',
    });

    const payments = await response.json(); // 假设服务器返回的是 JSON 数据
    console.log(payments); // 打印服务器返回的付款信息

    const bookingList = document.getElementById('bookingList');
    bookingList.innerHTML = ''; // 清空现有内容

    payments.forEach((payment) => {
      // 创建预订卡片容器
      const bookingCard = document.createElement('div');
      bookingCard.className = 'card booking-card mb-5';

      // 构建卡片内容
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

// 辅助函数，根据支付状态返回相应的徽章
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

// 页面加载完毕后调用 loadPayments 函数
window.addEventListener('DOMContentLoaded', loadPayments);

// 搜索功能
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

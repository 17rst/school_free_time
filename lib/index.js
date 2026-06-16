const socket = io();
const RECOMMEND_API = 'http://localhost:5000/recommend?k=10';

const RAW_X_MIN = 56,  RAW_X_MAX = 820;
const RAW_Y_MIN = 220, RAW_Y_MAX = 762;
const RAW_W = RAW_X_MAX - RAW_X_MIN;
const RAW_H = RAW_Y_MAX - RAW_Y_MIN;

let allSeats = [];
let recommendedId = null;

document.getElementById('home-btn').addEventListener('click', () => {
  window.location.href = '/';
});

// 모바일 전용 툴팁
function showTooltip(seat, div) {
  if (window.innerWidth > 600) return;

  // 기존 툴팁 제거
  document.querySelectorAll('.seat-tooltip').forEach(t => t.remove());
  document.querySelectorAll('.seat.selected').forEach(s => s.classList.remove('selected'));
  div.classList.add('selected');

  const tooltip = document.createElement('div');
  tooltip.className = 'seat-tooltip';

  const statusText = seat.occupied ? '사용 중' : '빈 자리';
  const isRec = seat.id === recommendedId;
  tooltip.innerHTML = `
    <span class="tooltip-id">${seat.id}번</span>
    <span class="tooltip-status ${seat.occupied ? 'occ' : 'free'}">${statusText}</span>
    ${isRec ? '<span class="tooltip-rec">✦ 추천</span>' : ''}
  `;

  // 컨테이너 기준 위치
  const container = document.getElementById('seat-map');
  const cRect = container.getBoundingClientRect();
  const dRect = div.getBoundingClientRect();

  const left = dRect.left - cRect.left + div.offsetWidth / 2;
  const top  = dRect.top  - cRect.top  - 36;

  tooltip.style.left = left + 'px';
  tooltip.style.top  = (top < 4 ? dRect.bottom - cRect.top + 4 : top) + 'px';

  container.appendChild(tooltip);

  // 다른 곳 터치하면 닫기
  setTimeout(() => {
    document.addEventListener('touchstart', () => {
      tooltip.remove();
      div.classList.remove('selected');
    }, { once: true });
  }, 50);
}

function renderSeats() {
  const container = document.getElementById('seat-map');
  container.innerHTML = '';

  const isMobile  = window.innerWidth <= 600;
  const SEAT_SIZE = isMobile ? 13 : 24;
  const PADDING   = isMobile ? 8  : 16;

  const mapW = container.clientWidth;
  const mapH = container.clientHeight;

  function sx(raw) {
    return PADDING + ((raw - RAW_X_MIN) / RAW_W) * (mapW - PADDING * 2 - SEAT_SIZE);
  }
  function sy(raw) {
    return PADDING + ((raw - RAW_Y_MIN) / RAW_H) * (mapH - PADDING * 2 - SEAT_SIZE);
  }

  allSeats.forEach(seat => {
    const div = document.createElement('div');
    div.classList.add('seat', seat.occupied ? 'occupied' : 'free');
    if (seat.id === recommendedId) div.classList.add('recommended');
    div.dataset.id = seat.id;

    if (!isMobile) div.textContent = seat.id;

    div.style.width      = SEAT_SIZE + 'px';
    div.style.height     = SEAT_SIZE + 'px';
    div.style.lineHeight = SEAT_SIZE + 'px';
    div.style.fontSize   = isMobile ? '0' : '11px';
    div.style.left       = sx(seat.posX) + 'px';
    div.style.top        = sy(seat.posY) + 'px';

    if (isMobile) {
      div.addEventListener('touchstart', (e) => {
        e.preventDefault();
        showTooltip(seat, div);
      }, { passive: false });
    }

    container.appendChild(div);
  });
}

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(renderSeats, 100);
});

socket.emit('getSeats');

socket.on('seatsUpdated', async (seatLayout) => {
  allSeats = [];
  let freeSeats = 0;

  seatLayout.forEach(cluster => {
    cluster.seats.forEach(seat => {
      allSeats.push(seat);
      if (!seat.occupied) freeSeats++;
    });
  });

  const totalSeats = allSeats.length;
  const occSeats   = totalSeats - freeSeats;
  const pct        = totalSeats > 0 ? Math.round((occSeats / totalSeats) * 100) : 0;

  document.getElementById('stat-total').textContent = totalSeats + '석';
  document.getElementById('stat-free').textContent  = freeSeats + '석';
  document.getElementById('stat-occ').textContent   = occSeats + '석';
  document.getElementById('bar-pct').textContent    = pct + '%';
  document.getElementById('seat-count').textContent = `빈 자리 ${freeSeats}석`;

  const fill = document.getElementById('bar-fill');
  requestAnimationFrame(() => { fill.style.width = pct + '%'; });
  fill.classList.remove('low', 'mid');
  if (pct < 40) fill.classList.add('low');
  else if (pct < 70) fill.classList.add('mid');

  try {
    const res  = await fetch(RECOMMEND_API);
    const data = await res.json();
    const rec  = data.recommended;

    if (rec) {
      recommendedId = rec.id;
      document.getElementById('rec-number').textContent = rec.id + '번';
      document.getElementById('recommendation').textContent =
        'KNN 알고리즘 기반으로 분산도가 가장 높은 조용한 좌석을 추천드립니다.';
    } else {
      recommendedId = null;
      document.getElementById('rec-number').textContent = '없음';
      document.getElementById('recommendation').textContent = '현재 이용 가능한 좌석이 없습니다.';
    }
  } catch (err) {
    console.error('추천 서버 연결 실패:', err);
    recommendedId = null;
    document.getElementById('rec-number').textContent = '—';
    document.getElementById('recommendation').textContent = '추천 서버에 연결할 수 없습니다.';
  }

  requestAnimationFrame(() => requestAnimationFrame(renderSeats));
});

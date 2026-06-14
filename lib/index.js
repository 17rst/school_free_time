const socket = io();

// Python 추천 서버 주소 (recommend.py가 실행 중인 포트)
const RECOMMEND_API = 'http://localhost:5000/recommend?k=10';

socket.emit('getSeats');

socket.on('seatsUpdated', async (seatLayout) => {
  const container = document.getElementById('seat-map');
  container.innerHTML = '';
  container.style.position = 'relative'; // 자유 배치

  seatLayout.forEach(cluster => {
    cluster.seats.forEach(seat => {
      const div = document.createElement('div');
      div.classList.add('seat');
      div.classList.add(seat.occupied ? 'occupied' : 'free');
      div.textContent = seat.id;

      // 좌표 기반 배치
      div.style.position = 'absolute';
      const TiltingX = 50;
      const TiltingY = -150;
      div.style.left = seat.posX + TiltingX + 'px';
      div.style.top  = seat.posY + TiltingY + 'px';

      container.appendChild(div);
    });
  });

  // Python KNN 서버에서 추천 좌석을 받아 표시
  try {
    const res  = await fetch(RECOMMEND_API);
    const data = await res.json();
    const recommended = data.recommended;

    if (recommended) {
      // 추천 좌석 div를 id로 찾아 recommended 클래스 추가
      const seatDivs = document.querySelectorAll('.seat');
      const target = Array.from(seatDivs).find(div => div.textContent == recommended.id);
      if (target) target.classList.add('recommended');
      document.getElementById('recommendation').textContent = `추천 좌석: ${recommended.id}번`;
    } else {
      document.getElementById('recommendation').textContent = '추천 가능한 좌석이 없습니다.';
    }
  } catch (err) {
    // Python 서버가 꺼져있거나 연결 실패 시
    console.error('추천 서버 연결 실패:', err);
    document.getElementById('recommendation').textContent = '추천 서버에 연결할 수 없습니다.';
  }
});

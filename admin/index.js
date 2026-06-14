const socket = io();

socket.on('connect', () => {
  socket.emit('getSeats');
});

socket.on('seatsUpdated', (seatLayout) => {
  const container = document.getElementById('seat-map');
  container.innerHTML = '';

  seatLayout.forEach(cluster => {
    cluster.seats.forEach(seat => {
      const div = document.createElement('div');
      div.classList.add('seat');
      div.classList.add(seat.occupied ? 'occupied' : 'free');
      div.textContent = seat.id;

      // 좌표 기반 배치
      const TiltingX= 50;
      const TiltingY= -150;
      div.style.left = seat.posX+TiltingX + 'px';
      div.style.top = seat.posY+TiltingY + 'px';

      // 클릭 시 occupied 상태 토글
      div.addEventListener('click', () => {
        socket.emit('updateSeat', { id: seat.id, occupied: !seat.occupied });
      });

      container.appendChild(div);
    });
  });
});

const socket = io();

// 서버에서 ready 신호가 오면 join 이벤트 실행
socket.on('ready', () => {
    socket.emit('join');
});

socket.on('waiting', () => {
    document.getElementById('status').textContent = "상대방을 기다리는 중...";
});

socket.on('matched', () => {
    document.getElementById('status').textContent = "상대방과 연결되었습니다!";
    document.getElementById('status').className = "status-badge matched";
    document.getElementById('message-input').disabled = false;
    document.getElementById('send-btn').disabled = false;
});

socket.on('message', (msg) => {
    const div = document.createElement('div');
    div.classList.add('message', 'partner');
    div.textContent = msg;
    document.getElementById('chat-box').appendChild(div);
});

socket.on('partner_left', () => {
    document.getElementById('status').textContent = "상대방이 나갔습니다.";
    document.getElementById('status').className = "status-badge left";
    document.getElementById('message-input').disabled = true;
    document.getElementById('send-btn').disabled = true;
});

document.getElementById('send-btn').addEventListener('click', () => {
    const msg = document.getElementById('message-input').value;
    if (msg.trim() !== "") {
        socket.emit('message', msg);
        const div = document.createElement('div');
        div.classList.add('message', 'you');
        div.textContent = msg;
        document.getElementById('chat-box').appendChild(div);
        document.getElementById('message-input').value = "";
    }
});

// 메인 페이지로 이동 버튼
document.getElementById('home-btn').addEventListener('click', () => {
    window.location.href = "/";
});
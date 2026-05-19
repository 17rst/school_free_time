const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { userDB, seatDB } = require('./db');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const uploadDir = path.join(__dirname, 'img');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const port = process.env.PORT || 3000;

// 메인 UI
app.use(express.static('public'));
app.use('/chat', express.static('chat'));
app.use('/lib', express.static('lib'));
app.use('/admin', express.static('admin'));
app.use('/login', express.static('login'));
app.use('/view', express.static('view'));
app.use('/map', express.static('map'));
let waitingUser = null;
let seats = Array.from({ length: 187 }, (_, i) => ({
  id: 1+i,
  occupied: false
}));
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// multer 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const savePath = path.join(uploadDir, 'seat.jpg');
    if (fs.existsSync(savePath)) {
      return cb(new Error('기존요청이 처리중입니다.'));
    }
    cb(null, 'seat.jpg');
  }
});

const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
  res.send('파일 업로드 성공');
});

// 에러 처리
app.use((err, req, res, next) => {
  res.status(400).send(err.message);
});
function buildSeatLayout(rows) {
  const clusters = {};
  rows.forEach(r => {
    if (!clusters[r.cluster]) {
      clusters[r.cluster] = { clusterId: r.cluster, type: r.type, seats: [] };
    }
    clusters[r.cluster].seats.push({
      id: r.id,
      occupied: !!r.occupied,
      posX: r.posX,
      posY: r.posY
    });
  });
  return Object.values(clusters);
}
// 로그인 처리
io.on('connection', (socket) => {
  console.log('사용자 접속:', socket.id);

  socket.on('login', ({ username, password }) => {
    userDB.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
      if (row) {
        socket.emit('loginResult', { success: true, role: row.role });
      } else {
        socket.emit('loginResult', { success: false });
      }
    });
  });

  // 좌석 현황 요청
  socket.on('getSeats', () => {
    seatDB.all(`SELECT * FROM seats`, (err, rows) => {
      if (err) return console.error(err);
      socket.emit('seatsUpdated', buildSeatLayout(rows));
    });
  });

  // 좌석 업데이트 (관리자)
  socket.on('updateSeat', ({ id, occupied }) => {
    seatDB.run(`UPDATE seats SET occupied = ? WHERE id = ?`, [occupied ? 1 : 0, id], (err) => {
      if (err) return console.error(err);
      seatDB.all(`SELECT * FROM seats`, (err, rows) => {
        if (err) return console.error(err);
        io.emit('seatsUpdated', buildSeatLayout(rows));
      });
    });
  });
    console.log('사용자 접속:', socket.id);

    // 연결되면 자동으로 join 이벤트 실행
    socket.emit('ready');

    socket.on('join', () => {
        if (waitingUser && waitingUser !== socket) {
            const partner = waitingUser;
            waitingUser = null;

            socket.partner = partner;
            partner.partner = socket;

            socket.emit('matched', { partnerId: partner.id });
            partner.emit('matched', { partnerId: socket.id });
        } else {
            waitingUser = socket;
            socket.emit('waiting');
        }
    });

    socket.on('message', (msg) => {
        if (socket.partner) {
            socket.partner.emit('message', msg);
        }
    });

    socket.on('disconnect', () => {
        if (waitingUser === socket) {
            waitingUser = null;
        }
        if (socket.partner) {
            socket.partner.emit('partner_left');
            socket.partner.partner = null;
        }
    });
});

http.listen(port, () => {
    console.log('서버 실행 중: http://localhost');
});

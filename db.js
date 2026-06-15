const sqlite3 = require('sqlite3').verbose();

// 사용자 DB
const userDB = new sqlite3.Database('./shadow.sqlite');

// 좌석 DB
const seatDB = new sqlite3.Database('./seats.sqlite');

// 시간표 DB
const timeDB = new sqlite3.Database('./timetable.sqlite');

// 사용자 DB 초기화
userDB.serialize(() => {
  userDB.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
  )`);

  userDB.run(`INSERT OR IGNORE INTO users (username, password, role)
              VALUES ('student', 'abcd', 'user')`);//init data
});

// 좌석 DB 초기화
seatDB.serialize(() => {
  seatDB.run(`CREATE TABLE IF NOT EXISTS seats (
    id INTEGER PRIMARY KEY,
    occupied INTEGER,
    posX INTEGER,
    posY INTEGER
  )`);
  //init data
  seatDB.run(`INSERT OR IGNORE INTO seats (id, occupied, posX, posY)
              VALUES (1, 0, 120, 80)`);
});

timeDB.serialize(() => {
  timeDB.run(`CREATE TABLE IF NOT EXISTS lecture_summary (
    building TEXT,
    day TEXT,
    period INTEGER,
    total REAL
  )`);
});

module.exports = { userDB, seatDB, timeDB };

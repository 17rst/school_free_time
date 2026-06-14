document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".sidebar button");
  const images = document.querySelectorAll(".content img");

  // 초기 상태: 1층 이미지 보이기
  document.getElementById("floor1").classList.add("active");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-target");

      // 모든 이미지 숨기기
      images.forEach(img => img.classList.remove("active"));

      // 선택한 이미지 보이기
      document.getElementById(targetId).classList.add("active");
    });
  });
});
document.getElementById('home-btn').addEventListener('click', () => {
    window.location.href = "/view/index.html";
});
// ===== 다니엘관 혼잡도 박스 =====
// seats.sqlite 위치: school_free_time/seats.sqlite (이 파일 기준 ../../seats.sqlite)
const SEATS_DB_PATH = "../../seats.sqlite";
const SQL_JS_WASM = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/";
const CONGESTION_REFRESH_MS = 30000; // 30초마다 갱신

async function updateCongestion() {
  const statusEl = document.getElementById("congestion-status");
  const percentEl = document.getElementById("congestion-percent");
  const fillEl = document.getElementById("congestion-fill");
  const countEl = document.getElementById("congestion-count");
  const boxEl = document.getElementById("congestion-box");

  try {
    // sql.js 초기화 (전역 initSqlJs 는 sql-wasm.js 에서 제공)
    const SQL = await initSqlJs({ locateFile: file => SQL_JS_WASM + file });

    // seats.sqlite 읽기
    const response = await fetch(SEATS_DB_PATH);
    if (!response.ok) throw new Error("sqlite 파일을 불러올 수 없습니다.");
    const buffer = await response.arrayBuffer();
    const db = new SQL.Database(new Uint8Array(buffer));

    // 전체 좌석 수 / 사용중 좌석 수 집계
    const result = db.exec(
      "SELECT COUNT(*) AS total, COALESCE(SUM(occupied), 0) AS occupied FROM seats"
    );
    db.close();

    const total = result[0].values[0][0];
    const occupied = result[0].values[0][1];

    if (!total) {
      statusEl.textContent = "정보 없음";
      percentEl.textContent = "-";
      return;
    }

    // 혼잡도(%) = 사용중 좌석 / 전체 좌석, 최대 100
    const percent = Math.min(100, Math.round((occupied / total) * 100));

    // 33%씩 구간 분리: 0~33 여유 / 34~66 보통 / 67~100 혼잡
    let status, statusClass;
    if (percent <= 33) {
      status = "여유 있음";
      statusClass = "status-low";
    } else if (percent <= 66) {
      status = "보통";
      statusClass = "status-mid";
    } else {
      status = "혼잡";
      statusClass = "status-high";
    }

    boxEl.classList.remove("status-low", "status-mid", "status-high");
    boxEl.classList.add(statusClass);

    statusEl.textContent = status;
    percentEl.textContent = `${percent}%`;
    fillEl.style.width = `${percent}%`;
    countEl.textContent = `${occupied} / ${total}석`;
  } catch (err) {
    console.error("혼잡도 정보를 불러오지 못했습니다:", err);
    statusEl.textContent = "정보 없음";
    percentEl.textContent = "-";
  }
}

updateCongestion();
setInterval(updateCongestion, CONGESTION_REFRESH_MS);

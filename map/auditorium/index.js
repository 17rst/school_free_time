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

// ===== 대강당 혼잡도 박스 =====
// 서버 API 호출 (Express에서 제공하는 /lecture-status)
const REFRESH_MS = 30000; // 30초마다 갱신
async function updateLectureStatus() {
  const statusEl = document.getElementById("congestion-status");
  const percentEl = document.getElementById("congestion-percent");
  const fillEl = document.getElementById("congestion-fill");
  const countEl = document.getElementById("congestion-count");
  const boxEl = document.getElementById("congestion-box");

  try {
    console.log("[DEBUG] /lecture-status API 호출");
    const response = await fetch("/lecture-status");
    if (!response.ok) throw new Error("API 응답 실패");

    const list = await response.json();
    console.log("[DEBUG] API 응답 데이터:", list);

    if (!Array.isArray(list) || list.length === 0) {
      statusEl.textContent = "정보 없음";
      percentEl.textContent = "-";
      return;
    }

    // 대강당 데이터만 찾기
    const hall = list.find(item => item.building === "대강당");
    if (!hall) {
      statusEl.textContent = "대강당 정보 없음";
      percentEl.textContent = "-";
      return;
    }

    const hallCount = hall.total || 0;
    const totalCount = list.reduce((sum, item) => sum + (item.total || 0), 0);

    console.log("[DEBUG] 대강당 인원수:", hallCount);
    console.log("[DEBUG] 전체 인원수:", totalCount);

    // 혼잡도 = 대강당 인원 / 전체 인원
    let percent = 0;
    if (totalCount > 0) {
      percent = Math.round((hallCount / totalCount) * 100);
    }
    console.log("[DEBUG] 혼잡도(%):", percent);

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
    countEl.textContent = `${hallCount}명 / 전체 ${totalCount}명`;
  } catch (err) {
    console.error("강의실 정보를 불러오지 못했습니다:", err);
    statusEl.textContent = "정보 없음";
    percentEl.textContent = "-";
  }
}


updateLectureStatus();
setInterval(updateLectureStatus, REFRESH_MS);

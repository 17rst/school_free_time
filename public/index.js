document.getElementById('chat-card').addEventListener('click', () => {
  // chat 폴더의 index.html로 이동
  window.location.href = "/chat/index.html";
});
document.getElementById('liberary-card').addEventListener('click', () => {
  window.location.href = "/lib/index.html";
});
document.getElementById('profile').addEventListener('click', () => {
  window.location.href = "/login/index.html";
});
document.getElementById('place-card').addEventListener('click', () => {
  window.location.href = "/view/index.html";
});
// 혼잡도 데이터를 나중에 API로 받아올 수 있도록 구조 준비
const congestionData = {
  cafeteria: "여유 있음",
  library: "보통",
  cafe: "혼잡"
};
const predictedCount = 123;

// 추후 API 연동 시 DOM 업데이트 가능
function updateCongestion() {
  document.querySelector(".congestion-item:nth-child(2) .level").textContent = congestionData.cafeteria;
  document.querySelector(".congestion-item:nth-child(3) .level").textContent = congestionData.library;
  document.querySelector(".congestion-item:nth-child(4) .level").textContent = congestionData.cafe;
  document.querySelector(".congestion-count .number").textContent = predictedCount + "명";
}

updateCongestion();
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
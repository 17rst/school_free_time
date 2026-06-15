// 뒤로가기 버튼
document.getElementById('home-btn').addEventListener('click', () => {
    window.location.href = "/";
});

document.getElementById('building1').addEventListener('click', () => {
    window.location.href = "/map/auditorium/index.html";
});
document.getElementById('building2').addEventListener('click', () => {
    window.location.href = "/map/bawool/index.html";
});
document.getElementById('building3').addEventListener('click', () => {
    window.location.href = "/map/computer/index.html";
});
document.getElementById('building4').addEventListener('click', () => {
    window.location.href = "/map/daniel/index.html";
});
document.getElementById('building5').addEventListener('click', () => {
    window.location.href = "/lib/index.html";
});

const tooltip = document.getElementById("tooltip");

document.querySelectorAll(".building").forEach(building => {
  building.addEventListener("mouseenter", async e => {
    const name = building.alt;
    let statusText = "정보 없음";

    try {
      if (name === "도서관") {
        // 도서관일 때만 occupied-count API 호출
        const response = await fetch("/occupied-count");
        if (!response.ok) throw new Error("API 응답 실패");
        const data = await response.json();
        statusText = `1층 여유 좌석 수: ${188-data.occupiedCount}/188`;
      } else {
        // 다른 건물은 lecture-status API 호출
        const response = await fetch("/lecture-status");
        if (!response.ok) throw new Error("API 응답 실패");
        const list = await response.json();

        const hall = list.find(item => item.building === name);
        let percent = 0;

        if (hall) {
          const hallCount = hall.total || 0;
          const totalCount = list.reduce((sum, item) => sum + (item.total || 0), 0);

          if (totalCount > 0) {
            percent = Math.round((hallCount / totalCount) * 100);
          }

          if (percent <= 33) {
            statusText = `여유 있음 (${percent}%)`;
          } else if (percent <= 66) {
            statusText = `보통 (${percent}%)`;
          } else {
            statusText = `혼잡 (${percent}%)`;
          }
        }
      }

      // 말풍선 표시
      tooltip.textContent = `${name} - ${statusText}`;
      tooltip.style.left = `${e.pageX}px`;
      tooltip.style.top = `${e.pageY - 30}px`;
      tooltip.classList.add("show");

    } catch (err) {
      console.error("정보를 불러오지 못했습니다:", err);
      tooltip.textContent = `${name} - 정보 없음`;
      tooltip.style.left = `${e.pageX}px`;
      tooltip.style.top = `${e.pageY - 30}px`;
      tooltip.classList.add("show");
    }
  });

  building.addEventListener("mousemove", e => {
    tooltip.style.left = `${e.pageX}px`;
    tooltip.style.top = `${e.pageY - 30}px`;
  });

  building.addEventListener("mouseleave", () => {
    tooltip.classList.remove("show");
  });
});

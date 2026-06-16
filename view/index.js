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
    let statusLevel = ""; // 'free' | 'normal' | 'busy' | ''

    try {
      if (name === "도서관") {
        const response = await fetch("/occupied-count");
        if (!response.ok) throw new Error("API 응답 실패");
        const data = await response.json();
        const free = 188 - data.occupiedCount;
        const pct  = Math.round((data.occupiedCount / 188) * 100);
        statusText = `1층 여유 좌석 수: ${free}/188`;
        if (pct <= 33)      statusLevel = "free";
        else if (pct <= 66) statusLevel = "normal";
        else                statusLevel = "busy";
      } else {
        const response = await fetch("/lecture-status");
        if (!response.ok) throw new Error("API 응답 실패");
        const list = await response.json();

        const hall = list.find(item => item.building === name);
        let percent = 0;

        if (hall) {
          const hallCount  = hall.total || 0;
          const totalCount = list.reduce((sum, item) => sum + (item.total || 0), 0);
          if (totalCount > 0) percent = Math.round((hallCount / totalCount) * 100);

          if (percent <= 33) {
            statusText  = `여유 있음 (${percent}%)`;
            statusLevel = "free";
          } else if (percent <= 66) {
            statusText  = `보통 (${percent}%)`;
            statusLevel = "normal";
          } else {
            statusText  = `혼잡 (${percent}%)`;
            statusLevel = "busy";
          }
        }
      }
    } catch (err) {
      console.error("정보를 불러오지 못했습니다:", err);
      statusText = "정보 없음";
    }

    tooltip.textContent = `${name} — ${statusText}`;
    tooltip.className   = "tooltip show" + (statusLevel ? " " + statusLevel : "");
    tooltip.style.left  = `${e.pageX}px`;
    tooltip.style.top   = `${e.pageY - 30}px`;
  });

  building.addEventListener("mousemove", e => {
    tooltip.style.left = `${e.pageX}px`;
    tooltip.style.top  = `${e.pageY - 30}px`;
  });

  building.addEventListener("mouseleave", () => {
    tooltip.className = "tooltip";
  });
});

import cv2
import numpy as np
import sqlite3
import os
import time
import glob

# --- DB 연결 및 테이블 생성 ---
conn = sqlite3.connect("seats.sqlite")
cursor = conn.cursor()
cursor.execute("""
CREATE TABLE IF NOT EXISTS seats (
    id INTEGER PRIMARY KEY,
    occupied INTEGER,
    posX INTEGER,
    posY INTEGER
)
""")
conn.commit()
conn.close()

while True:
    files = glob.glob("./img/*.png")
    for file_path in files:  # 여러 파일 처리 가능
        print(f"{file_path} 처리 시작")
        conn = sqlite3.connect("seats.sqlite")
        cursor = conn.cursor()

        try:
            img = cv2.imread(file_path)
            if img is None:
                print("이미지를 불러오지 못했습니다.")
                continue

            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

            gray_lower = np.array([0, 0, 50])
            gray_upper = np.array([180, 50, 200])

            cursor.execute("SELECT id, posX, posY FROM seats LIMIT 188")
            rows = cursor.fetchall()

            for seat_id, x, y in rows:
                w, h = 20, 20
                # 좌표가 이미지 범위 내에 있는지 확인
                if y+h <= hsv.shape[0] and x+w <= hsv.shape[1]:
                    roi = hsv[y:y+h, x:x+w]
                    mean_color = cv2.mean(roi)[:3]

                    if (gray_lower <= mean_color).all() and (mean_color <= gray_upper).all():
                        occupied = 1
                    else:
                        occupied = 0

                    cursor.execute("UPDATE seats SET occupied=? WHERE id=?", (occupied, seat_id))
                    print(f"좌석 {seat_id}: 상태={occupied}, 좌표=({x},{y})")
                else:
                    print(f"좌표 ({x},{y})가 이미지 범위를 벗어남")

            conn.commit()
            print(f"{file_path} 처리 완료")

        finally:
            conn.close()
            if os.path.exists(file_path):
                os.remove(file_path)

    time.sleep(1)

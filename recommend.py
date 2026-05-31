"""
도서관 좌석 추천 알고리즘 서버
================================
KNN(K-Nearest Neighbors) 기반으로 사용중인 좌석과의
거리를 계산하여 최적 좌석을 추천합니다.

실행 방법:
    pip install flask flask-cors
    python recommend.py

API 엔드포인트:
    GET  /recommend        → 추천 좌석 1개 반환
    GET  /recommend/top5   → 추천 좌석 상위 5개 반환
    GET  /seats            → 전체 좌석 상태 반환
"""

import math
import sqlite3

from flask import Flask, jsonify, request
from flask_cors import CORS

# ── 앱 초기화 ──────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)  # Node.js에서 fetch 요청 시 CORS 오류 방지

import os

# recommend.py 위치를 기준으로 seats.sqlite 경로를 자동 계산합니다.
# 덕분에 로컬(Windows), 배포 서버(Linux) 어디서든 경로 수정 없이 동작합니다.
#
# 폴더 구조 (recommend.py는 seats.sqlite와 같은 폴더에 두세요):
#   school_free_time/
#     ├── seats.sqlite   ← DB
#     ├── recommend.py   ← 이 파일
#     └── lib/
#         ├── index.html
#         └── index.js
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # 이 파일이 있는 폴더
DB_PATH  = os.path.join(BASE_DIR, "seats.sqlite")      # 같은 폴더의 seats.sqlite


# ── DB 유틸 ───────────────────────────────────────────────────────
def get_seats() -> list[dict]:
    """
    DB에서 전체 좌석 정보를 읽어 리스트로 반환합니다.

    반환 형식:
        [{"id": 1, "occupied": 0, "posX": 100, "posY": 200}, ...]
    """
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id, occupied, posX, posY FROM seats")
    rows = cur.fetchall()
    conn.close()

    return [
        {"id": r[0], "occupied": r[1], "posX": r[2], "posY": r[3]}
        for r in rows
    ]


# ── 핵심 알고리즘 ─────────────────────────────────────────────────
def euclidean_distance(a: dict, b: dict) -> float:
    """
    두 좌석 사이의 유클리드 거리를 계산합니다.

    Args:
        a: 좌석 딕셔너리 (posX, posY 포함)
        b: 좌석 딕셔너리 (posX, posY 포함)

    Returns:
        두 좌석 사이의 직선 거리 (float)
    """
    return math.sqrt((a["posX"] - b["posX"]) ** 2 + (a["posY"] - b["posY"]) ** 2)


def knn_score(seat: dict, occupied_seats: list[dict], k: int) -> float:
    """
    특정 좌석에서 가장 가까운 K개 사용중 좌석까지의 가중 거리 합을 반환합니다.

    가중치 규칙:
        1번째(가장 가까운 좌석): 3.3
        2번째:                   3.0
        3번째:                   2.7
        ...이후 0.3씩 감소
        최소 가중치:             0.3 (음수 방지)

    가중치가 높을수록 가까운 사용중 좌석의 영향이 커지므로
    붐비는 구역 근처 자리는 점수가 크게 낮아집니다.
    이 값이 클수록 → 사람들과 멀리 떨어진 조용한 자리

    Args:
        seat:           점수를 계산할 빈 좌석
        occupied_seats: 현재 사용중인 좌석 목록
        k:              참고할 인접 좌석 수 (기본값 10)

    Returns:
        가장 가까운 K개 사용중 좌석까지의 가중 거리 합계 (float)
    """
    # 사용중인 모든 좌석과의 거리를 계산하여 오름차순 정렬
    distances = sorted(
        [euclidean_distance(seat, occ) for occ in occupied_seats]
    )

    # 사용중 좌석이 K개 미만이면 전체 사용
    k = min(k, len(distances))

    # 가중치: 1번째=3.3, 2번째=3.0, 3번째=2.7 ... 0.3씩 감소, 최소 0.3
    # 예) k=10이면 가중치 = [3.3, 3.0, 2.7, 2.4, 2.1, 1.8, 1.5, 1.2, 0.9, 0.6]
    weights = [max(3.3 - i * 0.3, 0.3) for i in range(k)]

    # 거리 × 가중치 합산
    weighted_sum = sum(d * w for d, w in zip(distances[:k], weights))

    return weighted_sum


def recommend(seats: list[dict], k: int = 10) -> list[dict]:
    """
    KNN 알고리즘으로 추천 좌석 목록을 정렬하여 반환합니다.
    항상 조용한 자리(사용중 좌석과 가장 멀리 떨어진 순) 기준으로 정렬합니다.

    Args:
        seats: 전체 좌석 목록
        k:     참고할 인접 사용중 좌석 수 (기본값 10)

    Returns:
        거리 합 내림차순으로 정렬된 빈 좌석 목록
        각 항목에 "score" 필드가 추가됩니다.
    """
    # 사용중 / 빈 좌석 분리
    occupied_seats = [s for s in seats if s["occupied"]]
    free_seats     = [s for s in seats if not s["occupied"]]

    # 사용중인 좌석이 없으면 전체 빈 좌석 반환 (점수 계산 불필요)
    if not occupied_seats:
        for seat in free_seats:
            seat["score"] = 0
        return free_seats

    # 빈 좌석이 없으면 빈 리스트 반환
    if not free_seats:
        return []

    # 각 빈 좌석의 KNN 점수 계산
    for seat in free_seats:
        seat["score"] = round(knn_score(seat, occupied_seats, k), 2)

    # 거리 합 내림차순 정렬 → 사용중 좌석과 가장 멀리 떨어진 자리가 1위
    free_seats.sort(key=lambda s: s["score"], reverse=True)

    return free_seats


# ── API 엔드포인트 ────────────────────────────────────────────────
@app.route("/seats", methods=["GET"])
def api_seats():
    """
    전체 좌석 상태를 반환합니다.

    Response:
        {"seats": [...], "total": 188, "occupied": 42, "free": 146}
    """
    seats = get_seats()
    occupied_count = sum(1 for s in seats if s["occupied"])

    return jsonify({
        "seats":    seats,
        "total":    len(seats),
        "occupied": occupied_count,
        "free":     len(seats) - occupied_count,
    })


@app.route("/recommend", methods=["GET"])
def api_recommend():
    """
    추천 좌석 1개를 반환합니다.
    항상 조용한 자리(사용중 좌석과 가장 멀리 떨어진 자리)를 추천합니다.

    Query Parameters:
        k (int, 기본값 10): 참고할 인접 좌석 수

    Response:
        {"recommended": {..., "score": 1234.5}, "k": 10}
    """
    # 쿼리 파라미터에서 k 읽기 (없으면 기본값 10)
    k = int(request.args.get("k", 10))

    # 유효성 검사
    if k < 1:
        return jsonify({"error": "k는 1 이상이어야 합니다."}), 400

    seats  = get_seats()
    ranked = recommend(seats, k=k)

    if not ranked:
        return jsonify({"error": "추천 가능한 빈 좌석이 없습니다."}), 404

    return jsonify({
        "recommended": ranked[0],  # 1위 좌석만 반환
        "k":           k,
    })


@app.route("/recommend/top5", methods=["GET"])
def api_recommend_top5():
    """
    추천 좌석 상위 5개를 반환합니다.
    항상 조용한 자리(사용중 좌석과 가장 멀리 떨어진 순) 기준입니다.

    Query Parameters:
        k (int, 기본값 10): 참고할 인접 좌석 수

    Response:
        {"top5": [...], "k": 10}
    """
    k = int(request.args.get("k", 10))

    seats  = get_seats()
    ranked = recommend(seats, k=k)

    return jsonify({
        "top5": ranked[:5],
        "k":    k,
    })


# ── 서버 실행 ─────────────────────────────────────────────────────
if __name__ == "__main__":
    # debug=True: 코드 수정 시 자동 재시작 (개발 단계에서만 사용)
    # port=5000: Node.js가 이 포트로 요청을 보냄
    app.run(debug=True, port=5000)

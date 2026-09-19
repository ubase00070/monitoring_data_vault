# -*- coding: utf-8 -*-
"""
patrol_watch_core.py — Slack 순찰 스레드 기반 순찰 이상 감지 프로그램 (v1.2, 로더 구조)
NCC와 완전히 무관하게 별도로 돌아가는, 특정 PC 전용 관리자용 감시 도구입니다.

⚠️ 이 파일은 공개 GitHub 레포(monitoring_data_vault)에 그대로 올라갑니다.
   loader.pyw가 실행할 때마다 이 파일을 최신본으로 받아와서 실행하는 구조라,
   관리자 PC에는 loader.pyw만 한 번 설치해두면 이 파일을 고칠 때마다
   재배포할 필요가 없습니다. 그래서 이 파일 안에는 절대로 토큰/시크릿을
   하드코딩하면 안 됩니다 — 전부 각 PC의 로컬 파일(patrol_watch_secrets.json,
   레포에는 올라가지 않음)에서 읽어옵니다.

동작 개요
---------
1) #91_다중관제_사이트_통합_배차알림 채널(C091JMYC2FP)에서, 현재 시각 기준
   최근 3시간 이내의 메시지 중
       "[사이트명][#태스크번호][기체명][뉴비 경로] ... 기체가 배정되었습니다. (코스명: ...)"
   또는
       "[사이트명][#태스크번호][기체명]...[뉴비 경로] ... 기체가 스테이션으로 이동합니다. (스테이션 이동)"
   형태의 '원본 시작 메시지'를 찾는다. (mrkdwn 링크로 감싸져 있어도 파싱함. 순찰 배정과
   순찰 종료 후 이어지는 스테이션 복귀 임무를 동일하게 새 감시 스레드로 취급한다.)
2) 기체명이 UNIT_NAME_MAP에 등록된 기체만 감시 대상으로 삼는다.
3) 각 대상 메시지의 스레드 댓글을 조회해서:
     - "시나리오가 마무리되었습니다" 문구가 있으면 → 완료된 임무로 표시(대시보드
       목록에서는 빠지지만 내부적으로는 계속 추적).
     - 아직 안 끝났으면, 스레드 안에서 가장 최근 POI 이동/도착 메시지를 찾고
       그 시각으로부터 경과 시간이 기준(기본 7분, 기체별 override 가능)을
       넘으면 '이상'으로 표시한다.
4) 화면에는 두 가지가 뜬다.
     - 상시 떠 있는 '순찰 감시 대상' 창: 지금 진행중인 감시 대상만 둥근 카드
       목록으로 보여줌(진행중/이상 상태별 색 구분).
     - 이상이 10분 이상 지속되고 최초 감지 후 한 번 더 확인됐을 때만 뜨는
       자동 소멸 토스트(우상단, 연녹색).
5) 같은 '정체 상황'에 대해 중복 팝업이 뜨지 않도록, 이미 알린 상태를
   GitHub Gist에 저장해서 재시작해도 유지되게 한다.

로컬 secrets 파일 (patrol_watch_secrets.json, 이 파일과 같은 폴더, 레포에는 올리지 않음)
-------------------------------------------------------------------------
{
  "SLACK_XOXC_TOKEN": "xoxc-...",
  "SLACK_XOXD_TOKEN": "xoxd-...",
  "GITHUB_TOKEN": "ghp_...",
  "GIST_ID": ""   ← 비워두면 최초 실행 시 자동 생성되고 이 파일에 자동으로 채워짐
}

중요 — 반드시 읽어주세요
------------------------
- SLACK_XOXC_TOKEN / SLACK_XOXD_TOKEN 은 정식 Slack Bot Token이 아니라
  Slack 웹/PWA 클라이언트가 쓰는 '개인 브라우저 세션' 인증값입니다.
    · 그 계정이 로그아웃하면 이 토큰들은 즉시 무효화됩니다.
    · Slack 내부 구현이 바뀌면 예고 없이 동작이 깨질 수 있습니다.
- 필요 패키지: pip install requests keyboard pystray pillow  (tkinter는 표준 라이브러리라
  별도 설치 불필요. keyboard는 F8 전역 단축키용, pystray/pillow는 시스템 트레이 아이콘용이며,
  없어도 나머지 기능은 정상 동작합니다.)
"""

import re
import os
import sys
import json
import time
import threading
import tkinter as tk
import tkinter.font as tkfont
from datetime import datetime, timezone, timedelta

import requests

# pyw(pythonw.exe)로 실행하면 콘솔이 없어서 sys.stdout/stderr가 None이 되고, 그 상태에서
# print()를 부르면 프로그램이 죽는다. 콘솔이 없는 경우엔 로그를 파일로 흘려보낸다.
if sys.stdout is None or sys.stderr is None:
    _log_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "patrol_watch.log")
    _log_file = open(_log_path, "a", encoding="utf-8", buffering=1)
    sys.stdout = _log_file
    sys.stderr = _log_file

# ============================== 설정 ==============================

# ── 비밀값(토큰) 로딩 ──────────────────────────────────────────────
# 이 파일은 공개 GitHub 레포에 그대로 올라가는 파일이라, 토큰을 여기 하드코딩하면
# 전 세계 누구나 볼 수 있게 됩니다. 그래서 토큰은 이 파일과 같은 폴더의
# 'patrol_watch_secrets.json' (로컬 전용, 절대 레포에 올리지 않음)에서 읽어옵니다.
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_SECRETS_PATH = os.path.join(_BASE_DIR, "patrol_watch_secrets.json")


def _load_secrets():
    try:
        with open(_SECRETS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _save_secret(key, value):
    """새로 발급/생성된 값(예: 최초 실행 시 만들어지는 GIST_ID)을 로컬 secrets 파일에
    바로 반영해서, 다음 실행 때도 같은 값을 계속 쓰도록 한다."""
    try:
        data = _load_secrets()
        data[key] = value
        with open(_SECRETS_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[secrets] {key} 저장 실패: {e}", flush=True)


_secrets = _load_secrets()
if not _secrets:
    print(f"[secrets] '{_SECRETS_PATH}' 을 못 찾았거나 비어있습니다. "
          f"patrol_watch_secrets.example.json을 복사해서 채워주세요.", flush=True)

SLACK_XOXC_TOKEN = _secrets.get("SLACK_XOXC_TOKEN", "")
SLACK_XOXD_TOKEN = _secrets.get("SLACK_XOXD_TOKEN", "")
GITHUB_TOKEN = _secrets.get("GITHUB_TOKEN", "")
GIST_ID = _secrets.get("GIST_ID", "")

CHANNEL_ID = "C091JMYC2FP"  # #91_다중관제_사이트_통합_배차알림

GIST_FILENAME = "patrol_watch_state.json"

# 창 위치/크기를 로컬에 기억해뒀다가 다음 실행 때 그대로 복원한다 (공유할 필요 없는
# 순수 UI 취향이라 Gist가 아니라 스크립트 옆 파일에 저장).
_WINDOW_STATE_PATH = os.path.join(_BASE_DIR, "patrol_watch_window.json")


def load_window_geometry():
    try:
        with open(_WINDOW_STATE_PATH, "r", encoding="utf-8") as f:
            return json.load(f).get("geometry")
    except Exception:
        return None


def save_window_geometry(geometry_str):
    try:
        with open(_WINDOW_STATE_PATH, "w", encoding="utf-8") as f:
            json.dump({"geometry": geometry_str}, f)
    except Exception:
        pass


POLL_INTERVAL_SEC = 60          # 폴링 주기(초)
POPUP_CONFIRM_DELAY_SEC = 45    # 팝업은 최초 이상 감지 후 최소 이 시간(다음 폴링 한 번)만큼
                                 # 더 지켜보고, 그래도 계속 이상이면 그때 띄운다.
                                 # 대시보드 카드 표시는 이 지연 없이 즉시 반영된다.
POPUP_MIN_STALE_MIN = 10        # 카드 경고는 각 기체 기준대로 즉시 뜨지만, 토스트는
                                 # 정체 시간이 이 값을 넘긴 것부터만 띄운다.
TOAST_AUTO_DISMISS_MS = 10000   # 팝업이 자동으로 사라지기까지의 시간(ms)
DETECTION_WINDOW_HOURS = 3      # 이보다 오래된 메시지는 아예 조회하지 않음
DEFAULT_STALE_MIN = 7           # 기본 POI 정체 허용 시간(분)

# 사이트가 넓어서 POI 간격이 원래 긴 기체만 여기에 등록 (분 단위)
# 예: "용인 고진역 힐스테이트 1호기": 7,
#     "○○○ 1호기": 10,
SLOW_POI_OVERRIDE_MIN = {
    "창원대학교 1호기": 10,
    "창원대학교 2호기": 10,
    "잠실 엘스 아파트 1호기": 7,
    "잠실 엘스 아파트 2호기": 7,
}

# 특정 기체의 특정 POI 구간(01~03)만 원래 구간보다 오래 걸려서, 그 구간에
# '현재 위치'해 있을 때는 로봇 전체 기준(위 10분)이 아니라 이 값을 대신 적용한다.
POI_SEGMENT_OVERRIDE_MIN = {
    "창원대학교 1호기": {"_01": 12, "_02": 12, "_03": 12},
    "창원대학교 2호기": {"_01": 12, "_02": 12, "_03": 12},
}

# 이 기체들은 '배정 직후 첫 POI 갱신도 없이 멈춰있는' 상태를 이상으로 보지 않는다.
# (해당 사이트는 배정 직후 오류 메시지가 뜨며 그 상태로 멈추는 경우가 있어, 그 노이즈를
#  걸러내기 위함 — 일단 POI가 한 번이라도 갱신된 뒤에 다시 멈추면 평소처럼 감지된다.)
SKIP_IF_NEVER_MOVED = {
    "평택고덕 디에트르 1호기",
    "평택고덕 디에트르 2호기",
}

# 왼쪽 = 감시 대상 기체명(원문, Slack 메시지에 찍히는 그대로)
# 오른쪽 = 화면에 표시할 짧은 이름
UNIT_NAME_MAP = {
    "용인 고진역 힐스테이트 1호기": "용인 고진",
    "경희대학교 국제캠퍼스 1호기": "경희대 1",
    "경희대학교 국제캠퍼스 2호기": "경희대 2",
    "성남시 판교역 1호기": "성남 판교",
    "성남시 서현역 １호기": "성남 서현",
    "성남시 율동공원 1호기": "성남 율동",
    "성남시 야탑역 1호기": "성남 야탑",
    "부산 EDC 호반써밋 1호기": "부산 호반 1",
    "부산 EDC 호반써밋 2호기": "부산 호반 2",
    "부산 EDC 수자인 1호기": "부산 수자인 1",
    "부산 EDC 수자인 2호기": "부산 수자인 2",
    "파주 디에트르더클래스 1호기": "파주",
    "잠실 리센츠 아파트 1호기": "리센츠 1",
    "잠실 리센츠 아파트 2호기": "리센츠 2",
    "평택고덕 디에트르 1호기": "평택 1",
    "평택고덕 디에트르 2호기": "평택 2",
    "부산 서면비스타동원 1호기": "부산 서면",
    "부천 위브 1호기": "부천 위브",
    "잠실 레이크팰리스 1호기": "잠실 레이크",
    "잠실 엘스 아파트 1호기": "엘스 1",
    "잠실 엘스 아파트 2호기": "엘스 2",
    "삼성인력개발원 1호기": "인력개발원",
    "고양 래미안 휴레스트 1호기": "고양 래미안",
    "창원대학교 1호기": "창원대 1",
    "창원대학교 2호기": "창원대 2",
    "한성대학교 1호기": "한성대",
    "김포풍무센트럴푸르지오 1호기": "김포 풍무",
    "강남 래미안블레스티지 1호기": "강남 래미안",
    "김포 캐슬앤파밀리에 1호기": "김포 1",
    "김포 캐슬앤파밀리에 2호기": "김포 2",
    "지제역 푸르지오엘리아츠 1호기": "지제",
    "부경대 1호기": "부경대",
    "부경대 2호기": "부경대",
    "DMZ 캠프 그리브스 1호기": "DMZ",
    "롯데마트부산CFC(쉴더스) 1호기": "쉴더스",
    "두루아이 3호기": "두루아이 3",
    "두루아이 4호기": "두루아이 4",
    "두루아이 5호기": "두루아이 5",
    "중앙대학교 1호기": "중앙대",
    "두루아이 2호기": "중앙대",
    "잠실 르엘 1호기": "잠실 르엘",
    "신동백 롯데캐슬 에코1단지 1호기": "신동백",
    "청담르엘 1호기": "청담 르엘",
    "전주시 전주천 1호기": "전주천",
    "인재개발원 1호기": "인재개발원",
    "아주대학교 1호기": "아주대 1",
    "아주대학교 2호기": "아주대 2",
    "서강대학교 1호기": "서강대",
    "광교 풍경채 1호기": "광교 풍경채",
    "광교풍경채(대체 기체) 1호기": "광교 풍경채",
    "동백SK아펠바움 1차 1호기": "동백SK",
    "구리역 롯데캐슬 시그니처 1호기": "구리 롯데캐슬",
    "동대문구회기동 1호기(쉴드플러스)": "동대문구 회기동",
    "더샵남천프레스티지 1호기": "더샵남천",
    "한국장애인고용공단 1호기": "장애인고용공단 1",
    "한국장애인고용공단 2호기": "장애인고용공단 2",
    "서울 양원 LH 1단지 1호기": "양원LH",
    "덕수궁 1호기": "덕수궁",
    "순천향대학교 1호기": "순천향",
}

STAFF_NAMES = [
    "지훈", "정훈", "덕진", "기완", "경환", "효선", "혜림", "윤혁", "현철", "동진",
    "민수", "한석", "지윤", "미소", "규은", "재헌", "천호", "수성", "지영", "진홍",
    "미선", "승찬", "이준", "승완", "주현", "태영", "은정", "재원", "효빈", "재윤",
    "가은", "형민", "도형", "성환", "규순", "철환", "수연", "지섭", "은선", "계원",
    "선호", "정기", "소연", "다연", "아연", "대관",
]

# ========================== Slack 호출 ==========================

SLACK_API = "https://slack.com/api/{method}"


def slack_call(method, params, retries=3):
    headers = {"Cookie": f"d={SLACK_XOXD_TOKEN}"}
    data = dict(params)
    data["token"] = SLACK_XOXC_TOKEN
    for attempt in range(retries):
        try:
            res = requests.post(SLACK_API.format(method=method), data=data, headers=headers, timeout=15)
        except requests.RequestException as e:
            print(f"[slack_call] 네트워크 오류({method}): {e}", flush=True)
            time.sleep(2 ** attempt)
            continue
        if res.status_code == 429:
            wait = int(res.headers.get("Retry-After", "5"))
            print(f"[slack_call] 레이트리밋, {wait}초 대기", flush=True)
            time.sleep(wait)
            continue
        try:
            j = res.json()
        except ValueError:
            print(f"[slack_call] 응답 파싱 실패({method})", flush=True)
            return None
        if not j.get("ok"):
            print(f"[slack_call] {method} 실패: {j.get('error')}", flush=True)
            return None
        return j
    return None


def fetch_recent_history(oldest_ts):
    messages = []
    cursor = None
    while True:
        params = {"channel": CHANNEL_ID, "oldest": oldest_ts, "limit": "100"}
        if cursor:
            params["cursor"] = cursor
        j = slack_call("conversations.history", params)
        if not j:
            break
        messages.extend(j.get("messages", []))
        cursor = j.get("response_metadata", {}).get("next_cursor")
        if not cursor:
            break
    return messages


def fetch_thread_replies(thread_ts):
    replies = []
    cursor = None
    while True:
        params = {"channel": CHANNEL_ID, "ts": thread_ts, "limit": "200"}
        if cursor:
            params["cursor"] = cursor
        j = slack_call("conversations.replies", params)
        if not j:
            break
        replies.extend(j.get("messages", []))
        cursor = j.get("response_metadata", {}).get("next_cursor")
        if not cursor:
            break
    return replies

# ========================== 메시지 파싱 ==========================

# "[텍스트](url)" 형태(마크다운 스타일)와 "<url|텍스트>" 형태(Slack 고유 mrkdwn 링크,
# 실제 원문은 이 형태로 옴 — 예: <https://ncc.neubility.ai/remote/robot/231|부산 EDC 수자인 2호기>)
# 둘 다 텍스트만 남기고 풀어준다.
LINK_RE = re.compile(r'\[([^\[\]]+)\]\((https?://[^)]+)\)')
SLACK_LINK_RE = re.compile(r'<[^|>]*\|([^>]*)>')
BRACKET_RE = re.compile(r'\[([^\[\]]+)\]')

POI_KEYWORDS = ("도착했습니다", "도착했어요", "이동합니다", "복귀합니다")

# 새 감시 스레드를 시작시키는 '기점' 메시지들. 순찰 배정뿐 아니라, 순찰이 끝난 뒤
# 이어서 부여되는 '스테이션 복귀' 임무도 똑같이 새 스레드로 감시 대상에 편입시킨다.
# (둘 다 나중에 '시나리오가 마무리되었습니다'로 똑같이 종료됨)
THREAD_START_KEYWORDS = ("기체가 배정되었습니다", "기체가 스테이션으로 이동합니다")


def extract_robot_name(text):
    """'[사이트][#태스크][기체명][뉴비 경로] 기체가 배정되었습니다...' 또는
    '...기체가 스테이션으로 이동합니다...' 에서 기체명만 뽑는다."""
    if not any(k in text for k in THREAD_START_KEYWORDS):
        return None
    flat = LINK_RE.sub(lambda m: m.group(1), text)
    flat = SLACK_LINK_RE.sub(lambda m: m.group(1), flat)
    brackets = BRACKET_RE.findall(flat)
    if len(brackets) < 3:
        return None
    return brackets[2].strip()


def clean_display_text(text):
    """POI 메시지 등을 화면에 표시할 때, 링크 마크업(꺾쇠/마크다운)을 걷어내고
    사람이 읽는 텍스트만 남긴다."""
    flat = LINK_RE.sub(lambda m: m.group(1), text)
    flat = SLACK_LINK_RE.sub(lambda m: m.group(1), flat)
    return flat.strip()


# '마무리'와 '되었습니다' 사이에 공백이 있는/없는 두 형태가 실제로 섞여 나오는 것을
# 확인했음(사이트/시나리오 종류에 따라 다름) — 공백 유무와 무관하게 잡히도록 정규식 사용.
FINISHED_RE = re.compile(r"시나리오가\s*마무리\s*되었습니다")


def is_finished_message(text):
    return bool(FINISHED_RE.search(text))


def is_poi_message(text):
    return any(k in text for k in POI_KEYWORDS)


def match_staff_from_reactions(reactions):
    """reactions: Slack이 내려주는 [{'name': 'emoji_name', 'users': [...], 'count': n}, ...]
    커스텀 이모지 이름이 ':이름_:' 형태(끝에 언더스코어)인 컨벤션을 우선 가정하되,
    ':이름:' 형태도 같이 허용한다."""
    matched = []
    if not reactions:
        return matched
    name_set = set(STAFF_NAMES)
    for r in reactions:
        rn = r.get("name", "")
        candidate = rn[:-1] if rn.endswith("_") else rn
        if candidate in name_set:
            matched.append(candidate)
    return matched


def collect_staff_from_thread(replies):
    """스레드 전체(원본+댓글)에서 이름 이모지를 '등장한 순서 그대로' 모은다.
    Slack reactions API는 반응이 찍힌 정확한 시각을 안 주기 때문에, 여기서 나오는
    순서는 완벽한 시간순 보장은 아니고 'API가 돌려주는 순서' 기준이다 — 그래서 화면
    표시에서도 '마지막 = 최신(추정) 담당자'라고 항상 같이 밝혀서 보여준다.
    같은 사람이 여러 메시지에 걸쳐 반복 등장해도 중복 없이 최초 위치 기준으로 한 번만."""
    ordered = []
    seen = set()
    for m in replies:
        for name in match_staff_from_reactions(m.get("reactions", [])):
            if name not in seen:
                seen.add(name)
                ordered.append(name)
    return ordered


# ========================== 현재 시간대 담당자(스케줄) ==========================

INSU_DATA_URL = "https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/insu_data.json"


def to_given_name(full_name):
    """성을 뗀 이름만 반환. 단, 뗀 나머지가 외자(1글자)면 식별이 애매해지므로
    성을 붙인 전체 이름을 그대로 사용한다."""
    if not full_name:
        return full_name
    return full_name[-2:] if len(full_name) >= 3 else full_name


def fetch_current_operator_name():
    """insu_data.json에서 현재 KST 정시(HH:00) 담당자의 표시용 이름을 가져온다.
    실패하면 None을 반환하고, 그 경우 '이모지 누락' 판정 자체를 하지 않는다
    (스케줄을 모르면서 누락이라고 단정하면 오히려 오탐이 되기 때문)."""
    try:
        res = requests.get(INSU_DATA_URL, timeout=10)
        if not res.ok:
            return None
        data = res.json()
        schedule = data.get("schedule", {})
        hour_key = datetime.now(tz=KST).strftime("%H:00")
        full_name = schedule.get(hour_key)
        if not full_name:
            return None
        return to_given_name(full_name)
    except Exception as e:
        print(f"[insu] 담당자 스케줄 조회 실패: {e}", flush=True)
        return None


# ========================== Gist 상태 저장 ==========================

GIST_API = "https://api.github.com/gists"


def gist_headers():
    return {"Authorization": f"Bearer {GITHUB_TOKEN}", "Accept": "application/vnd.github+json"}


def load_state():
    if not GITHUB_TOKEN:
        print("[gist] GITHUB_TOKEN이 비어있어 상태 저장 없이(재시작 시 중복 알림 방지 없이) 동작합니다.", flush=True)
        return {"alerted": []}
    if GIST_ID:
        try:
            res = requests.get(f"{GIST_API}/{GIST_ID}", headers=gist_headers(), timeout=10)
            if res.ok:
                content = res.json()["files"][GIST_FILENAME]["content"]
                return json.loads(content)
        except Exception as e:
            print(f"[gist] 상태 로드 실패, 빈 상태로 시작: {e}", flush=True)
    return {"alerted": []}


def save_state(state):
    global GIST_ID
    if not GITHUB_TOKEN:
        return
    body = {
        "description": "patrol_watch state (auto-managed by script, please don't edit by hand)",
        "public": False,
        "files": {GIST_FILENAME: {"content": json.dumps(state, ensure_ascii=False, indent=2)}},
    }
    try:
        if GIST_ID:
            requests.patch(f"{GIST_API}/{GIST_ID}", headers=gist_headers(), json=body, timeout=10)
        else:
            res = requests.post(GIST_API, headers=gist_headers(), json=body, timeout=10)
            if res.ok:
                GIST_ID = res.json()["id"]
                _save_secret("GIST_ID", GIST_ID)  # 로컬 secrets 파일에 반영 — 다음 실행부터 재사용
                print(f"[gist] 새 Secret Gist 생성됨 — patrol_watch_secrets.json에 자동 저장했습니다: {GIST_ID}", flush=True)
    except Exception as e:
        print(f"[gist] 상태 저장 실패: {e}", flush=True)

# ========================== UI 공통 (둥근 카드) ==========================

# Windows 기본 폰트 중 둥글고 깔끔한 인상의 맑은 고딕을 볼드로 사용 (별도 설치 불필요)
FONT_NAME = "맑은 고딕"

# 크림톤 팔레트
PALETTE = {
    "bg":            "#F4E8CE",   # 창 배경 (크래프트지/모래사장 느낌의 동숲톤 크림)
    "card_bg":       "#FFFDF6",   # 진행중 카드 (아이보리)
    "card_border":   "#D8BE8E",   # 진행중 카드 테두리 (나무색, 또렷하게)
    "card_bg_done":  "#E7E4C9",   # 완료 카드 (연한 카키/세이지)
    "card_border_done": "#9C8F63",  # 완료 카드 테두리 (진한 올리브 — 확실히 구별되도록)
    "card_bg_alert": "#FBDCAE",   # 이상 카드 (당근빛 주황)
    "border_alert":  "#D9822B",   # 이상 강조 테두리
    "shadow":        "#E0CC9E",   # 카드 그림자
    "text":          "#503C24",   # 기본 글자(진한 흙갈색)
    "text_dim":      "#8C7A54",   # 흐린 글자(완료 등)
    "text_alert":    "#B5541D",   # 경고 글자(테라코타)
    "accent":        "#4F8B4A",   # 진행중 상태 글자(리프 그린)
    "header":        "#3D2E1A",
}


def round_rect(canvas, x1, y1, x2, y2, r=16, **kwargs):
    points = [
        x1 + r, y1,  x2 - r, y1,  x2, y1,
        x2, y1 + r,  x2, y2 - r,  x2, y2,
        x2 - r, y2,  x1 + r, y2,  x1, y2,
        x1, y2 - r,  x1, y1 + r,  x1, y1,
    ]
    return canvas.create_polygon(points, smooth=True, **kwargs)


def round_card_with_shadow(canvas, x1, y1, x2, y2, r, fill, outline, shadow, tags=(), width=2.4, offset=3):
    """부드러운 느낌을 위해 카드 뒤에 살짝 오프셋된 그림자 도형을 먼저 깔고,
    그 위에 실제 카드를 그린다."""
    round_rect(canvas, x1 + offset, y1 + offset, x2 + offset, y2 + offset, r,
               fill=shadow, outline=shadow, tags=tags)
    round_rect(canvas, x1, y1, x2, y2, r, fill=fill, outline=outline, width=width, tags=tags)


def try_round_window_corners(win):
    """Windows 11에서 창 외곽 모서리를 실제로 둥글게. 실패해도(구버전 윈도우 등)
    조용히 무시하고 넘어간다 — 있으면 좋고 없어도 그만인 코스메틱 기능."""
    try:
        import ctypes
        win.update_idletasks()
        hwnd = ctypes.windll.user32.GetParent(win.winfo_id())
        DWMWA_WINDOW_CORNER_PREFERENCE = 33
        DWMWCP_ROUND = 2
        pref = ctypes.c_int(DWMWCP_ROUND)
        ctypes.windll.dwmapi.DwmSetWindowAttribute(
            hwnd, DWMWA_WINDOW_CORNER_PREFERENCE, ctypes.byref(pref), ctypes.sizeof(pref)
        )
    except Exception:
        pass


def hide_from_taskbar(win):
    """창은 그대로 보이게 두되, 작업표시줄/Alt+Tab 목록에서만 빠지게 한다
    (Windows 확장 스타일: WS_EX_APPWINDOW 제거 + WS_EX_TOOLWINDOW 부여).
    실패해도 조용히 무시 — 이 기능이 없어도 앱 자체는 정상 동작해야 한다."""
    try:
        import ctypes
        win.update_idletasks()
        hwnd = ctypes.windll.user32.GetParent(win.winfo_id())
        GWL_EXSTYLE = -20
        WS_EX_APPWINDOW = 0x00040000
        WS_EX_TOOLWINDOW = 0x00000080
        style = ctypes.windll.user32.GetWindowLongW(hwnd, GWL_EXSTYLE)
        style = (style & ~WS_EX_APPWINDOW) | WS_EX_TOOLWINDOW
        ctypes.windll.user32.SetWindowLongW(hwnd, GWL_EXSTYLE, style)
        # 스타일 변경이 실제로 반영되려면 한 번 감췄다 다시 보여줘야 한다.
        win.withdraw()
        win.after(10, win.deiconify)
    except Exception as e:
        print(f"[tray] 작업표시줄 숨기기 실패: {e}", flush=True)


class ScrollableFrame(tk.Frame):
    """세로 스크롤이 되는 카드 목록 컨테이너."""

    def __init__(self, parent, bg):
        super().__init__(parent, bg=bg)
        self.canvas = tk.Canvas(self, bg=bg, highlightthickness=0)
        self.scrollbar = tk.Scrollbar(self, orient="vertical", command=self.canvas.yview,
                                       bg=PALETTE["bg"], troughcolor=PALETTE["bg"],
                                       activebackground=PALETTE["card_border"],
                                       highlightthickness=0, bd=0, width=10)
        self.inner = tk.Frame(self.canvas, bg=bg)
        self.inner.bind("<Configure>", lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all")))
        self.window_id = self.canvas.create_window((0, 0), window=self.inner, anchor="nw")
        self.canvas.configure(yscrollcommand=self.scrollbar.set)
        self.canvas.pack(side="left", fill="both", expand=True)
        self.scrollbar.pack(side="right", fill="y")
        self.canvas.bind("<Configure>", lambda e: self.canvas.itemconfig(self.window_id, width=e.width))
        self.canvas.bind("<Enter>", lambda e: self.canvas.bind_all("<MouseWheel>", self._on_mousewheel))
        self.canvas.bind("<Leave>", lambda e: self.canvas.unbind_all("<MouseWheel>"))

    def _on_mousewheel(self, event):
        self.canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")


# ========================== 상시 대시보드 창 ==========================

class Dashboard:
    """최근 3시간 내 감시 대상 전체를 항상 보여주는 창.
    진행중=일반 카드 / 이상=주황 테두리 강조 / 완료=취소선 + 흐린 색으로 남겨둠."""

    def __init__(self, root):
        self.root = root
        self.queue = []
        self.lock = threading.Lock()
        self._build_window()
        self.root.after(300, self._drain)

    def _build_window(self):
        self.root.overrideredirect(True)  # 기본 창틀을 없애고 우리가 직접 타이틀바를 그린다
        self.root.configure(bg=PALETTE["bg"])

        saved_geo = load_window_geometry()
        if saved_geo:
            self.root.geometry(saved_geo)
        else:
            screen_h = self.root.winfo_screenheight()
            win_h = max(560, screen_h - 90)  # 작업표시줄/제목표시줄 여유를 뺀 거의 전체 높이 (1080p 기준 990 안팎)
            self.root.geometry(f"380x{win_h}+40+20")
        self.root.minsize(340, 320)

        def on_close():
            try:
                save_window_geometry(self.root.geometry())
            except Exception:
                pass
            os._exit(0)

        # ── 커스텀 타이틀바: 기본 창틀이 없으므로 드래그 이동 + 최소화/닫기 버튼을 직접 구현 ──
        titlebar = tk.Frame(self.root, bg=PALETTE["card_border"], height=32)
        titlebar.pack(fill="x", side="top")
        titlebar.pack_propagate(False)

        title_lbl = tk.Label(titlebar, text="🍃 순찰 감시 대상", font=(FONT_NAME, 10, "bold"),
                              bg=PALETTE["card_border"], fg=PALETTE["header"])
        title_lbl.pack(side="left", padx=10)

        # 닫기(X) 버튼을 먼저 오른쪽 끝에 배치하고, 최소화(─) 버튼을 그다음 오른쪽에
        # 붙여서 'X 버튼 좌측에 최소화'가 되도록 한다.
        close_btn = tk.Button(titlebar, text="✕", command=on_close,
                               font=(FONT_NAME, 10, "bold"), bg=PALETTE["card_border"], fg=PALETTE["header"],
                               relief="flat", bd=0, highlightthickness=0, cursor="hand2",
                               activebackground=PALETTE["border_alert"], activeforeground="#FFFFFF", padx=10)
        close_btn.pack(side="right")

        min_btn = tk.Button(titlebar, text="─", command=self.root.withdraw,
                             font=(FONT_NAME, 10, "bold"), bg=PALETTE["card_border"], fg=PALETTE["header"],
                             relief="flat", bd=0, highlightthickness=0, cursor="hand2",
                             activebackground=PALETTE["card_bg"], padx=10)
        min_btn.pack(side="right")

        def start_move(event):
            self._drag_x, self._drag_y = event.x, event.y

        def do_move(event):
            x = self.root.winfo_x() + event.x - self._drag_x
            y = self.root.winfo_y() + event.y - self._drag_y
            self.root.geometry(f"+{x}+{y}")

        titlebar.bind("<ButtonPress-1>", start_move)
        titlebar.bind("<B1-Motion>", do_move)
        title_lbl.bind("<ButtonPress-1>", start_move)
        title_lbl.bind("<B1-Motion>", do_move)

        # ── 본문 ──
        header_row = tk.Frame(self.root, bg=PALETTE["bg"])
        header_row.pack(fill="x", padx=16, pady=(14, 4))

        tk.Label(header_row, text="🍃  순찰 감시 대상 (최근 3시간)", font=(FONT_NAME, 13, "bold"),
                 bg=PALETTE["bg"], fg=PALETTE["header"]).pack(side="left")

        self.sub = tk.Label(self.root, text="대기 중...", font=(FONT_NAME, 10, "bold"),
                             bg=PALETTE["bg"], fg=PALETTE["text_dim"])
        self.sub.pack(anchor="w", padx=16, pady=(0, 8))

        self.scroll = ScrollableFrame(self.root, PALETTE["bg"])
        self.scroll.pack(fill="both", expand=True, padx=10, pady=(0, 12))

        # 대시보드 창을 닫으면: 마지막 위치/크기를 저장해두고(다음 실행 때 복원),
        # 백그라운드 폴링 스레드/팝업까지 포함해서 프로세스 전체를 그 자리에서 즉시 종료한다.
        self.root.protocol("WM_DELETE_WINDOW", on_close)  # Alt+F4 등 대비

    def push(self, records):
        with self.lock:
            self.queue.append(records)

    def toggle_visibility(self):
        """F8 단축키로 호출됨 — 숨겨져 있으면 올리고, 떠 있으면 내린다."""
        try:
            if self.root.state() == "withdrawn":
                self.show_from_tray()
            else:
                self.root.withdraw()
        except Exception:
            pass

    def show_from_tray(self):
        """트레이 아이콘 클릭/더블클릭 또는 F8로 호출 — 창을 앞으로 불러온다."""
        try:
            self.root.deiconify()
            self.root.lift()
            self.root.attributes("-topmost", True)
            self.root.after(150, lambda: self.root.attributes("-topmost", False))
            self.root.focus_force()
        except Exception:
            pass

    def _drain(self):
        with self.lock:
            items, self.queue = self.queue, []
        if items:
            self._render(items[-1])  # 최신 스냅샷만 반영
        self.root.after(300, self._drain)

    def _render(self, records):
        for child in self.scroll.inner.winfo_children():
            child.destroy()

        now_str = datetime.now(tz=KST).strftime("%H:%M:%S")
        ongoing = sum(1 for r in records if not r["finished"] and not r.get("wrong_duplicate"))
        self.sub.config(text=f"최근 갱신 {now_str}  ·  진행중 {ongoing}")

        if not records:
            tk.Label(self.scroll.inner, text="최근 3시간 내 감시 대상 기체가 없습니다.",
                     font=(FONT_NAME, 10, "bold"), bg=PALETTE["bg"], fg=PALETTE["text_dim"]).pack(pady=24)
            return

        # 완료됐거나 잘못 부여된 시나리오는 목록에서 아예 빼고, 지금 진행중인 것만 보여준다.
        active = [r for r in records if not r["finished"] and not r.get("wrong_duplicate")]

        if not active:
            tk.Label(self.scroll.inner, text="지금 진행중인 순찰이 없습니다.",
                     font=(FONT_NAME, 10, "bold"), bg=PALETTE["bg"], fg=PALETTE["text_dim"]).pack(pady=24)
            return

        for rec in sorted(active, key=lambda r: r["start_ts"], reverse=True):
            self._add_card(rec)

    def _add_card(self, rec):
        PAD_X = 18
        strike = rec["finished"] or rec.get("wrong_duplicate")

        if rec.get("wrong_duplicate"):
            bg, border = PALETTE["card_bg_done"], PALETTE["card_border_done"]
            title_color, icon = PALETTE["text_dim"], "🗑"
            status_text = "잘못 부여된 시나리오 (중복 배정 추정)"
            status_color = PALETTE["text_dim"]
        elif rec["finished"]:
            bg, border = PALETTE["card_bg_done"], PALETTE["card_border_done"]
            title_color, icon = PALETTE["text_dim"], "✅"
            status_text, status_color = "순회 완료", PALETTE["text_dim"]
        elif rec["is_anomaly"]:
            bg, border = PALETTE["card_bg_alert"], PALETTE["border_alert"]
            title_color, icon = PALETTE["text_alert"], "⚠"
            status_text = f"{rec['poi_text']}\n{rec['stale_min']}분째 POI 변동사항 없음."
            status_color = PALETTE["text_alert"]
        else:
            bg, border = PALETTE["card_bg"], PALETTE["card_border"]
            title_color, icon = PALETTE["text"], "🚗"
            status_text = rec["poi_text"] or "진행 중"
            status_color = PALETTE["accent"]

        title_font = tkfont.Font(family=FONT_NAME, size=12, weight="bold", overstrike=strike)
        meta_font = tkfont.Font(family=FONT_NAME, size=9, weight="bold")
        body_font = tkfont.Font(family=FONT_NAME, size=10, weight="bold", overstrike=strike)

        cv = tk.Canvas(self.scroll.inner, height=90, bg=PALETTE["bg"], highlightthickness=0)
        cv.pack(fill="x", padx=6, pady=3)

        # 모니터링 요원은 기체명 옆(제목 줄)에 '이름 → 이름' 형태로 붙여서 보여준다.
        staff_inline = ""
        extra_lines = []
        if not rec["finished"] and not rec.get("wrong_duplicate"):
            if rec["staff_list"]:
                staff_inline = "   " + " → ".join(rec["staff_list"])
            if rec["staff_missing"]:
                extra_lines.append((f"⚠ 현재 모니터링 요원({rec['current_operator']}) 이모지 누락", PALETTE["text_alert"]))

        def redraw(event=None, cv=cv):
            w = max(cv.winfo_width(), 300)
            if getattr(cv, "_last_w", None) == w:
                return
            cv._last_w = w
            cv.delete("card")

            lines = [(status_text, body_font, status_color)] + [(t, meta_font, c) for t, c in extra_lines]

            body_top = 50
            y = body_top
            measured = []
            for line_text, line_font, line_color in lines:
                tmp = cv.create_text(PAD_X, y, anchor="nw", text=line_text, font=line_font,
                                      width=w - PAD_X * 2 - 6)
                bbox = cv.bbox(tmp)
                cv.delete(tmp)
                bottom = bbox[3] if bbox else y + 18
                measured.append((line_text, line_font, line_color, y))
                y = bottom + 5

            card_h = max(y + 12, 84)
            cv.config(height=card_h)

            round_card_with_shadow(cv, 2, 2, w - 6, card_h - 4, r=20,
                                    fill=bg, outline=border, shadow=PALETTE["shadow"],
                                    tags="card", offset=3, width=(3.0 if rec["finished"] else 2.4))

            title_id = cv.create_text(PAD_X, 15, anchor="nw", text=f"{icon}  {rec['robot']}",
                                       font=title_font, fill=title_color, tags="card")
            if staff_inline:
                tb = cv.bbox(title_id)
                staff_x = (tb[2] + 6) if tb else PAD_X + 100
                cv.create_text(staff_x, 18, anchor="nw", text=staff_inline.strip(),
                                font=meta_font, fill=PALETTE["text_dim"], tags="card")
            cv.create_text(w - PAD_X - 6, 18, anchor="ne", text=rec["start_hhmm"],
                            font=meta_font, fill=PALETTE["text_dim"], tags="card")
            cv.create_line(PAD_X, 40, w - PAD_X - 6, 40, fill=border, width=1, tags="card")

            for line_text, line_font, line_color, ty in measured:
                cv.create_text(PAD_X, ty, anchor="nw", text=line_text, font=line_font,
                                fill=line_color, width=w - PAD_X * 2 - 6, tags="card")

        cv.bind("<Configure>", redraw)


# ========================== 이상 알림 팝업 ==========================

class PopupManager:
    def __init__(self, root):
        self.root = root
        self.queue = []
        self.lock = threading.Lock()
        self._offset = 0
        self.root.after(300, self._drain)

    def push(self, info):
        with self.lock:
            self.queue.append(info)

    def _drain(self):
        with self.lock:
            items, self.queue = self.queue, []
        for info in items:
            self._show(info)
        self.root.after(300, self._drain)

    def _show(self, info):
        PAD_X = 14
        CARD_W = 250

        # 새 창이 뜨면서 지금 작업 중이던 창(Slack/브라우저 등)의 포커스를 뺏어가지
        # 않도록, 띄우기 전의 활성 창을 기억해뒀다가 다시 되돌려준다.
        prev_hwnd = None
        try:
            import ctypes
            prev_hwnd = ctypes.windll.user32.GetForegroundWindow()
        except Exception:
            pass

        win = tk.Toplevel(self.root)
        win.overrideredirect(True)  # 진짜 토스트처럼 — 타이틀바/테두리 없이 카드만 뜬다
        win.attributes("-topmost", True)
        win.configure(bg=PALETTE["bg"])

        title_font = tkfont.Font(family=FONT_NAME, size=11, weight="bold")
        body_font = tkfont.Font(family=FONT_NAME, size=9, weight="bold")

        cv = tk.Canvas(win, width=CARD_W, height=10, bg=PALETTE["bg"], highlightthickness=0)
        cv.pack(fill="both", expand=True)

        # 토스트 전용 색상 — 연녹색 바탕에 흰색 글씨 (대시보드 카드 색과는 별개)
        TOAST_BG = "#8FC79A"
        TOAST_BORDER = "#5FA377"
        TOAST_SHADOW = "#79B58C"
        TOAST_TEXT = "#FFFFFF"

        lines = [
            (f"⚠  {info['robot']}", title_font, TOAST_TEXT),
            (info["poi_text"], body_font, TOAST_TEXT),
            (f"{info['stale_min']}분째 POI 변동사항 없음.", body_font, TOAST_TEXT),
        ]
        if info.get("staff_missing_note"):
            lines.append((f"⚠ {info['staff_missing_note']}", body_font, TOAST_TEXT))

        # 1차: 위치/높이만 계산
        y = 14
        measured = []
        for text, font_, color in lines:
            tmp = cv.create_text(PAD_X, y, anchor="nw", text=text, font=font_, width=CARD_W - PAD_X * 2)
            bbox = cv.bbox(tmp)
            cv.delete(tmp)
            bottom = bbox[3] if bbox else y + 16
            measured.append((text, font_, color, y))
            y = bottom + 4

        card_h = y + 10
        win_w = CARD_W + 8
        win_h = card_h + 8
        cv.config(width=CARD_W, height=card_h)

        # 2차: 배경을 먼저 그리고, 그 위에 텍스트를 얹는다
        round_card_with_shadow(cv, 3, 3, CARD_W - 3, card_h - 3, r=14, fill=TOAST_BG,
                                outline=TOAST_BORDER, shadow=TOAST_SHADOW, width=1.8, offset=2)
        for text, font_, color, ty in measured:
            cv.create_text(PAD_X, ty, anchor="nw", text=text, font=font_, fill=color, width=CARD_W - PAD_X * 2)

        # 클릭하면 바로 닫을 수 있게 (별도 버튼 없이 토스트 전체가 클릭 영역)
        cv.bind("<Button-1>", lambda e: win.destroy())

        # 화면 우상단에 컴팩트하게 — 여러 개 뜨면 아래로 쌓인다.
        margin = 16
        screen_w = self.root.winfo_screenwidth()
        x = screen_w - win_w - margin
        yy = margin + (self._offset % 8) * (win_h + 8)
        self._offset += 1
        win.geometry(f"{win_w}x{win_h}+{x}+{yy}")
        try_round_window_corners(win)
        hide_from_taskbar(win)

        # 방금 만든 창이 포커스를 가져갔을 수 있으니, 원래 활성 창으로 다시 돌려준다.
        if prev_hwnd:
            try:
                ctypes.windll.user32.SetForegroundWindow(prev_hwnd)
            except Exception:
                pass

        # 토스트처럼 일정 시간 뒤 자동으로 사라진다 — 클릭하면 바로 닫히고, 안 눌러도
        # 화면에 쌓이지 않는다.
        win.after(TOAST_AUTO_DISMISS_MS, lambda: win.destroy() if win.winfo_exists() else None)

# ========================== 감지 루프 ==========================

KST = timezone(timedelta(hours=9))

# 이미 '순회 시나리오가 마무리되었습니다'로 확인된 스레드의 캐시.
# thread_ts -> record. 완료된 스레드는 더 조회할 필요가 없으므로 여기 저장해두고 재사용한다.
_FINISHED_CACHE = {}

# thread_ts -> 최초로 이상이 감지된 시각. 팝업 확인 지연(C)에 사용.
_PENDING_ALERTS = {}


def fmt_hhmm(ts):
    return datetime.fromtimestamp(float(ts), tz=KST).strftime("%H:%M")


def poll_once(state, popup_mgr, dashboard):
    now = time.time()
    oldest = now - DETECTION_WINDOW_HOURS * 3600
    history = fetch_recent_history(f"{oldest:.6f}")

    current_operator = fetch_current_operator_name()  # 현재 정시(HH:00) 담당자 — 실패 시 None
    # 매시 50~00분은 교대 시간대라 이모지가 아직 안 찍혀있는 게 정상 — 이 구간엔
    # '이모지 누락' 판정 자체를 하지 않는다(오탐 방지).
    in_handover_window = datetime.now(tz=KST).minute >= 50

    alerted = set(state.get("alerted", []))
    changed = False
    records = []
    watched_count = 0
    cache_hits = 0

    for msg in history:
        text = msg.get("text", "")
        if not any(k in text for k in THREAD_START_KEYWORDS):
            continue  # 배정/스테이션 이동 시작 메시지가 아님 — 조용히 넘어감(정상)

        robot = extract_robot_name(text)
        if not robot:
            print(f"[parse] 배정 메시지인데 기체명 파싱 실패 — 원문: {text[:140]!r}", flush=True)
            continue
        if robot not in UNIT_NAME_MAP:
            print(f"[parse] 감시 목록에 없는 기체명: '{robot}' — 감시하려면 UNIT_NAME_MAP에 추가하세요", flush=True)
            continue
        watched_count += 1

        thread_ts = msg.get("thread_ts") or msg.get("ts")

        # 이미 '완료'로 확인된 스레드는 다시 바뀔 일이 없으므로 재조회하지 않고
        # 캐시된 값을 그대로 재사용한다 (API 호출 절약의 핵심 지점).
        if thread_ts in _FINISHED_CACHE:
            records.append(_FINISHED_CACHE[thread_ts])
            cache_hits += 1
            continue

        replies = fetch_thread_replies(thread_ts)
        if not replies:
            continue

        short_name = UNIT_NAME_MAP.get(robot, robot)
        finished = any(is_finished_message(r.get("text", "")) for r in replies)

        poi_msgs = [r for r in replies if is_poi_message(r.get("text", ""))]
        if poi_msgs:
            latest_poi = max(poi_msgs, key=lambda r: float(r["ts"]))
            poi_ts = float(latest_poi["ts"])
            poi_text = clean_display_text(latest_poi.get("text", ""))
            never_moved = False
        else:
            poi_ts = float(thread_ts)
            poi_text = "(아직 POI 갱신 없음)"
            never_moved = True

        stale_sec = now - poi_ts
        limit_min = SLOW_POI_OVERRIDE_MIN.get(robot, DEFAULT_STALE_MIN)
        for suffix, minutes in POI_SEGMENT_OVERRIDE_MIN.get(robot, {}).items():
            if suffix in poi_text:
                limit_min = minutes
                break
        is_anomaly = (not finished) and (stale_sec > limit_min * 60)
        if never_moved and robot in SKIP_IF_NEVER_MOVED:
            is_anomaly = False  # 배정 직후 첫 POI도 없이 멈춘 건 이 사이트 특성상 예외 처리

        # 완료된 건은 담당자 표시가 더 이상 의미 없으므로 계산하지 않는다.
        staff_list = [] if finished else collect_staff_from_thread(replies)
        staff_missing = ((not finished) and bool(current_operator)
                         and (current_operator not in staff_list) and not in_handover_window)

        rec = {
            "robot": short_name,
            "robot_key": robot,                    # UNIT_NAME_MAP 원문 키 (임계값 조회용)
            "thread_ts": thread_ts,
            "start_ts": float(thread_ts),
            "start_hhmm": fmt_hhmm(thread_ts),
            "finished": finished,
            "wrong_duplicate": False,
            "poi_text": poi_text,
            "poi_ts": poi_ts,
            "stale_min": int(stale_sec // 60),
            "is_anomaly": is_anomaly,
            "staff_list": staff_list,             # 등장 순서 그대로, 마지막 = 최신(추정) 담당자
            "staff_missing": staff_missing,        # 이모지 자체는 '누락'일 뿐, 팝업 사유는 아님
            "current_operator": current_operator,
        }
        records.append(rec)

        if finished:
            _FINISHED_CACHE[thread_ts] = rec  # 다음 폴링부터는 재조회 없이 이 값 재사용

    # ── 같은 기체에 스레드가 2개 이상 겹치는 경우: '잘못 부여된 시나리오' 감지 ──
    # 케이스 1) 하나는 최근에 POI가 갱신되며 정상 진행 중인데, 다른 하나는 10분 이상
    #          아무 갱신도 없다 → 후자는 중복/오배정으로 보고 취소선 처리.
    by_robot = {}
    for rec in records:
        if not rec["finished"]:
            by_robot.setdefault(rec["robot"], []).append(rec)

    for group in by_robot.values():
        if len(group) < 2:
            continue
        freshest = max(group, key=lambda r: r["poi_ts"])
        freshest_limit_min = SLOW_POI_OVERRIDE_MIN.get(freshest["robot_key"], DEFAULT_STALE_MIN)
        freshest_ok = (now - freshest["poi_ts"]) <= freshest_limit_min * 60
        if not freshest_ok:
            continue  # 둘 다 상태가 안 좋으면 임의로 하나를 눌러버리지 않는다
        for rec in group:
            if rec is freshest:
                continue
            if (now - rec["poi_ts"]) >= 600:  # 10분 이상 정체
                rec["wrong_duplicate"] = True
                rec["is_anomaly"] = False
                _FINISHED_CACHE[rec["thread_ts"]] = rec  # 다음부턴 재조회 없이 고정

    # 케이스 2) 시작 시각이 ±5분 이내인 같은 기체의 다른 스레드가 이미 '완료'됐다면,
    # 지금 이상으로 남아있는 이 스레드는 그 완료된 임무의 오류/유령 메시지였던 것으로
    # 보고 종료 처리한다. (진짜 임무가 아직 진행중일 때는 건드리지 않고 그대로 둔다 —
    # 그 임무가 완료되는 순간 이 판정도 자연스럽게 뒤따라간다.)
    all_by_robot = {}
    for rec in records:
        all_by_robot.setdefault(rec["robot"], []).append(rec)

    for rec in records:
        if rec["finished"] or rec.get("wrong_duplicate") or not rec["is_anomaly"]:
            continue
        for sib in all_by_robot.get(rec["robot"], []):
            if sib is rec or not sib["finished"]:
                continue
            if abs(sib["start_ts"] - rec["start_ts"]) <= 300:  # ±5분
                rec["wrong_duplicate"] = True
                rec["is_anomaly"] = False
                _FINISHED_CACHE[rec["thread_ts"]] = rec
                break

    for rec in records:
        if rec["finished"] or not rec["is_anomaly"]:
            _PENDING_ALERTS.pop(rec["thread_ts"], None)  # 회복됐으면 대기 상태도 초기화
            continue  # 완료/중복오배정/정상 범위 — 팝업 대상 아님 (목록에는 이미 반영됨)

        if rec["stale_min"] < POPUP_MIN_STALE_MIN:
            continue  # 카드에는 이미 표시됐지만, 토스트는 이 시간을 넘긴 것부터만

        robot = rec["robot_key"]
        thread_ts = rec["thread_ts"]
        alert_key = f"{robot}|{thread_ts}|{rec['poi_ts']:.0f}"
        if alert_key in alerted:
            continue  # 이미 알림 보낸 건

        # 팝업은 곧바로 띄우지 않고, 최초 감지 후 최소 한 번 더(다음 폴링) 확인해서
        # 그래도 여전히 이상이면 그때 띄운다 — 경계선에서 잠깐 걸렸다 풀리는 애매한
        # 케이스로 팝업이 남발되는 걸 줄이기 위함. 카드 표시 자체는 지연 없음.
        first_seen = _PENDING_ALERTS.get(thread_ts)
        if first_seen is None:
            _PENDING_ALERTS[thread_ts] = now
            continue
        if now - first_seen < POPUP_CONFIRM_DELAY_SEC:
            continue

        staff_display = " → ".join(rec["staff_list"]) if rec["staff_list"] else "미확인(이모지 없음/불일치)"

        popup_mgr.push({
            "robot": rec["robot"],
            "start_time": rec["start_hhmm"],
            "poi_text": rec["poi_text"],
            "stale_min": rec["stale_min"],
            "staff": staff_display,
            "staff_missing_note": (f"현재 모니터링 요원({current_operator}) 이모지 누락" if rec["staff_missing"] else None),
        })
        alerted.add(alert_key)
        changed = True

    dashboard.push(records)

    if changed:
        state["alerted"] = list(alerted)[-500:]
        save_state(state)

    now_str = datetime.now(tz=KST).strftime("%H:%M:%S")
    print(f"[{now_str}] 폴링 완료 — 조회된 배정 메시지 {len(history)}건 중 감시 대상 {watched_count}건 "
          f"(캐시로 재조회 생략 {cache_hits}건, 실제 스레드 조회 {watched_count - cache_hits}건), "
          f"이번 사이클 새 이상 감지 {int(changed)}건(누적 알림 {len(alerted)}건)", flush=True)


def poll_loop(popup_mgr, dashboard):
    print("[patrol_watch] 감시 루프 시작. Ctrl+C로 종료할 수 있습니다.", flush=True)
    state = load_state()
    while True:
        try:
            poll_once(state, popup_mgr, dashboard)
        except Exception as e:
            print(f"[poll_loop] 예외 발생, 계속 진행: {e}", flush=True)
        time.sleep(POLL_INTERVAL_SEC)

# ========================== 진입점 ==========================


# ========================== 시스템 트레이 아이콘 ==========================

def create_tray_icon(dashboard):
    """작업표시줄에는 안 뜨는 대신, 시스템 트레이에 상시 아이콘을 하나 둔다.
    좌클릭/더블클릭 → 창 보이기, 우클릭 메뉴 → 열기/종료.
    'pystray'와 'Pillow'가 필요 (pip install pystray pillow)."""
    try:
        import pystray
        from PIL import Image, ImageDraw
    except ImportError:
        print("[tray] 'pystray'/'Pillow' 패키지가 없어 시스템 트레이 아이콘을 쓸 수 없습니다. "
              "pip install pystray pillow 로 설치하면 다음 실행부터 활성화됩니다.", flush=True)
        return None

    # 슬랙 ':white_check_mark:' 이모지 느낌 — 초록 라운드 사각형 + 흰색 체크마크.
    # 작은 트레이 크기에서도 또렷하게 보이도록 글씨 대신 아이콘 형태로 그린다.
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((4, 4, 60, 60), radius=14, fill=(58, 167, 87, 255))
    d.line([(16, 34), (27, 46), (48, 20)], fill=(255, 255, 255, 255), width=7, joint="curve")

    def on_show(icon, item):
        dashboard.root.after(0, dashboard.show_from_tray)

    def on_quit(icon, item):
        icon.stop()
        os._exit(0)

    menu = pystray.Menu(
        pystray.MenuItem("열기", on_show, default=True),
        pystray.MenuItem("종료", on_quit),
    )
    icon = pystray.Icon("patrol_watch", img, "순찰 감시 대상", menu)
    threading.Thread(target=icon.run, daemon=True).start()
    print("[tray] 시스템 트레이 아이콘 등록 완료", flush=True)
    return icon


# ========================== 전역 단축키 (F8) ==========================

def setup_global_hotkey(dashboard):
    """F8 을 누르면 어느 창에 포커스가 있든(Slack/브라우저 등) 대시보드를
    올리거나 내린다. 'keyboard' 패키지가 필요 (pip install keyboard)."""
    try:
        import keyboard
    except ImportError:
        print("[hotkey] 'keyboard' 패키지가 없어 F8 단축키를 쓸 수 없습니다. "
              "pip install keyboard 로 설치하면 다음 실행부터 활성화됩니다.", flush=True)
        return

    def on_hotkey():
        # keyboard 라이브러리는 별도 스레드에서 콜백을 부르므로, Tk 조작은
        # 반드시 root.after로 메인 스레드에 넘겨서 실행해야 안전하다.
        dashboard.root.after(0, dashboard.toggle_visibility)

    try:
        keyboard.add_hotkey('f8', on_hotkey)
        print("[hotkey] F8 단축키 등록 완료 (대시보드 올리기/내리기)", flush=True)
    except Exception as e:
        print(f"[hotkey] 단축키 등록 실패: {e} (관리자 권한으로 실행하면 해결될 수 있습니다)", flush=True)


def main():
    root = tk.Tk()
    dashboard = Dashboard(root)
    hide_from_taskbar(root)
    if "--minimized" in sys.argv:
        # 윈도우 시작 시 자동 실행용 — 로그인할 때마다 창이 튀어나오지 않고
        # 바로 트레이로 들어간 상태로 조용히 시작한다.
        root.withdraw()
    popup_mgr = PopupManager(root)
    setup_global_hotkey(dashboard)
    create_tray_icon(dashboard)

    t = threading.Thread(target=poll_loop, args=(popup_mgr, dashboard), daemon=True)
    t.start()

    root.mainloop()


if __name__ == "__main__":
    main()

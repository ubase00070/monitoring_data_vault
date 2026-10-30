/* battery_board_admin.js — battery_board.js v6.9 기반 관리자판 (별도 파일). 기존 기능 유지 + 960×1040 레이아웃 / 일일 업무표 / 펼침 그리드 / 캠핑장·HW·SW. 맨 아래 'ADMIN 확장' 참고 */
/* ============================================================
   battery_board.js v6.9 [배달 통계 평균 소요시간 / 개입 통계 기본정렬·동률 규칙 / 배달 로그 하단 안내] v6.8 [개입 통계: 주간/야간 뱃지 · 동료 대비 열] v6.7 [개입 누적 통계에 점유율 열] v6.6 [이석 오늘·달력 / 누적 통계 버튼 통일 / 헤더 높이 통일 / 스테이 그린 확인 시각] v6.5 [배달 로그 '누적 통계' 추가] v6.4 [UI 전면 개편: 순찰·배달 열 + 다중/개입/이석 3분할 그리드. 로직 변경 없음 — 빠진 요소는 CSS로만 숨김] v6.3 (배경 이미지 · 방전 로그 · 이석/착석 현황 슬라이드 전환 추가 · 배달 기체 로그 · 하루 기준 07:00 · 금일 배달 건수 배지 · 고정 버튼 3종 무지개 파스텔+이모지)
   NCC 종합 모니터 — 템퍼몽키 inject
   ============================================================ */

(function () {
    'use strict';


    // 수집기가 "일부 사이트만 받은 데이터"(data-bb-partial=1)를 보내도 안전하게 처리할 수 있음을 알린다 (수집기가 이 값을 확인하고 전달)
    window.__bbPartialOk = true;

    // ══ 오프라인 모드 (NCC 통신 중단) ══════════════════════════════════════
    // 이 파일은 NCC 로 직접 요청하지 않는다. NCC 조회는 로더(뉴비고 도우미)가 하고, 이 파일은
    //   ① 토큰을 넘기고(bb_token)  ② 로더가 2분마다 쏘는 결과(bb_robots_data)를 받아 그리기만 한다.
    // 켜지면:
    //   · bb_token 을 보내지 않는다 (로더가 NCC 를 조회할 열쇠를 주지 않음)
    //   · bb_robots_data 를 무시한다 (마지막 값 그대로 두고, 로그 기록·저장 같은 파생 처리도 하지 않음)
    //   · 로더가 따를 수 있게 신호를 남긴다:  <html data-bb-offline="1">  +  document 'bb_offline' 이벤트 {offline:true|false}
    //   ※ 로더가 이 신호를 확인하도록 고쳐져 있지 않으면, 이미 토큰을 받은 로더의 조회까지는 이 파일이 막을 수 없다.
    // 켜지는 조건 (하나라도 true 면 켜짐 — 끄는 것은 모두 꺼야 함):
    //   (1) 아래 상수 BB_OFFLINE_MODE = true
    //   (2) remote_admin_config.json 의 "offline": true  — remote_logic.js 와 같은 키(한 번에 둘 다 적용), 새로고침 시 반영
    //   (3) localStorage 'neubie_offline_mode' = 'true'  — 콘솔 localStorage.setItem('neubie_offline_mode','true') 또는 bbSetOffline(true). 1초 안에 반영
    // 원복: 상수 false + 원격 키 false/삭제 + localStorage 값 'false'(또는 삭제). 토큰은 페이지당 1회만 보내므로 로더가 중복 조회 루프를 만들지 않는다.
    const BB_OFFLINE_MODE = true;
    const BB_OFFLINE_LS_KEY = 'neubie_offline_mode';
    let _bbRemoteOffline = false;
    const _bbCfgReady = (async () => {
        try {
            const res = await fetch(`https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/remote_admin_config.json?t=${Date.now()}`, { cache: 'no-store' });
            if (!res.ok) return;
            const cfg = await res.json();
            if (typeof cfg.offline === 'boolean') _bbRemoteOffline = cfg.offline;
        } catch { /* 실패 시 원격 스위치는 꺼짐으로 간주 — 지금까지와 동일하게 동작 */ }
    })();
    function bbIsOffline() {
        if (BB_OFFLINE_MODE || _bbRemoteOffline) return true;
        try { return localStorage.getItem(BB_OFFLINE_LS_KEY) === 'true'; } catch { return false; }
    }
    let _bbOfflineShown = false;     // 로더에 마지막으로 알린 상태 (시작은 '온라인' → 평소엔 이벤트가 하나도 나가지 않음)
    let _bbTokenSent = false;
    let _bbTokenPhaseDone = false;   // 최초 토큰 발송 판단이 끝났는지
    function bbSendToken() {
        console.log('[BB] 토큰은 보내지 않습니다 (수집기 방식 — 로더가 NCC 를 조회하지 않음)');
        return;
        const _token = localStorage.getItem('AccessToken');
        if (_token) {
            document.dispatchEvent(new CustomEvent('bb_token', {
                detail: JSON.stringify({ token: _token, siteIds: SITE_IDS })
            }));
            _bbTokenSent = true;
            console.log('[BB] bb_token 발송 완료');
        } else {
            console.log('[BB] AccessToken 없음');
        }
    }
    function bbSyncOffline() {
        const off = bbIsOffline();
        if (off === _bbOfflineShown) return off;
        _bbOfflineShown = off;
        const root = document.documentElement;
        if (off) root.setAttribute('data-bb-offline', '1'); else root.removeAttribute('data-bb-offline');
        try { document.dispatchEvent(new CustomEvent('bb_offline', { detail: JSON.stringify({ offline: off }) })); } catch {}
        console.log(off ? '[BB] 오프라인 모드 ON — NCC 갱신 중단' : '[BB] 오프라인 모드 OFF — NCC 갱신 재개');
        // 오프라인으로 시작했다가 풀린 경우에만 토큰을 처음 보낸다. 이미 보낸 적이 있으면 재발송하지 않는다(로더 중복 루프 방지).
        if (!off && _bbTokenPhaseDone && !_bbTokenSent) bbSendToken();
        return off;
    }
    window.bbSetOffline = (on) => {
        try { localStorage.setItem(BB_OFFLINE_LS_KEY, on ? 'true' : 'false'); } catch {}
        return bbSyncOffline();   // 반환값 = 실제 오프라인 여부 (상수/원격 스위치가 켜져 있으면 끄려 해도 true)
    };
    bbSyncOffline();   // 상수·로컬 스위치는 즉시 신호 (원격 스위치는 설정 도착 후 아래 토큰 단계에서)

    // ============================================================
    // 배경 이미지 — 기체 카드 영역부터 하단까지만 (헤더의 3가지 테마 색은 그대로 보임)
    //   레포 monitoring_data_vault/ego_trippin/snoopy_snow.jpg (1920×1080). 이미지를 바꿔 올렸다면 ?v= 숫자를 올리면 캐시가 갱신됨.
    //   투명도: 0.05(거의 안 보임) ~ 0.15(또렷) — 카드·글자를 가리지 않고 '뒤에 그림이 있구나' 정도로만 보이게 하려면 0.08~0.10
    // ============================================================
    const BB_BG_URL = 'https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/ego_trippin/snoopy_snow.jpg?v=1';
    const BB_BG_OPACITY = 0.11;
    const BB_BG_FADE_PX = 56;   // 배경 이미지 상단 경계를 부드럽게 풀어주는 구간(px). 0 이면 예전처럼 뚝 끊김, 클수록 더 길게 번짐

    // ============================================================
    // SECTION 0. 스타일
    // ============================================================
    const style = document.createElement('style');
    style.textContent = `
		@font-face {
			font-family: 'Paperlogy';
			font-weight: 400;
			font-display: swap;
			src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-4Regular.woff2') format('woff2');
		}
		@font-face {
			font-family: 'Paperlogy';
			font-weight: 700;
			font-display: swap;
			src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-7Bold.woff2') format('woff2');
		}
		@font-face {
			font-family: 'Paperlogy';
			font-weight: 900;
			font-display: swap;
			src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-9Black.woff2') format('woff2');
		}
		@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap');
        :root {
			--bg:#141519; --sur:#232630; --sur2:#2a2e3a;
			--bd:#3a3f4c; --bd2:#454b5a; --tx:#e4e6ea; --mu:#8b929c;
			--row-bd:#454b5a;   /* 기체 카드 외곽선 (--bd 보다 살짝 진하게) */
			--gn:#4d9d6d; --gn2:rgba(77,157,109,.12);
			--bl:#5b8fd1; --bl2:rgba(91,143,209,.12);
			--wh:rgba(228,230,234,.05); --gy:#5a6069;
			--rd:#d16464; --rd2:rgba(209,100,100,.14); --ye:#d1a355;
			--or:#cf8a4f; --or2:rgba(207,138,79,.12);
			--pk:#ff2d92; --pk2:rgba(255,45,146,.14);   /* 배달 = 진한 핫핑크 (카드 호버의 연핑크와 확실히 구분) */
			--offdot:#4b5563;
			--off-main:#c3c9d4; --off-date:#b3bac6; --off-sub:#9aa3b2;   /* OFF 슬롯 글자색 (다크) */
			--standby-batt:var(--tx);
			--bg-fill:linear-gradient(var(--bg), var(--bg));
			--pct-fill:rgba(240,240,255,.93);
			--pct-shadow:0 1px 3px rgba(0,0,0,.95), 0 0 6px rgba(0,0,0,.7);
		}

        #bb.bb-light {
            --bg:#f2e4c4; --off-main:#5b5442; --off-date:#635c4a; --off-sub:#736b58;   /* OFF 슬롯 글자색 (라이트: 대비 5~7:1) */ --sur:#f8f3e6; --sur2:#efe6d2;
            --bd:#cabf9d; --bd2:#b3a687; --tx:#2b2418; --mu:#7a6f5c;
            --row-bd:#bcb08e;   /* 기체 카드 외곽선 (--bd 보다 살짝 진하게) */
            --wh:rgba(0,0,0,.05);
            --gn:#22c55e; --gn2:rgba(34,197,94,.10);
            --bl:#3b82f6; --bl2:rgba(59,130,246,.10);
            --gy:#4b5563;
            --rd:#ef4444; --rd2:rgba(239,68,68,.12); --ye:#fbbf24;
            --or:#f97316; --or2:rgba(249,115,22,.12);
            --pk:#ff1493; --pk2:rgba(255,20,147,.10);
            --offdot:#b4b2a9;
            --standby-batt:#98a2ae;
            --bg-fill:linear-gradient(180deg, #cfe8f0 0%, #e8ecdc 45%, #f2e4c4 85%);
            --pct-fill:rgba(30,25,15,.95);
            --pct-shadow:0 1px 2px rgba(255,255,255,.9), 0 0 4px rgba(255,255,255,.6);
        }
        #bb.bb-light.theme-sunset  { --bg-fill:linear-gradient(180deg, #f7d4c4 0%, #f0dfc9 45%, #f2e4c4 85%); }
        #bb.bb-light.theme-blossom { --bg-fill:linear-gradient(180deg, #f6dde3 0%, #f2e2d2 45%, #f2e4c4 85%); }
        /* [주석처리: 기타 배달] #bb.bb-light .bb-delivery-title { color:#2b2418; } */
        /* [주석처리: 기타 배달] #bb.bb-light .bb-delivery-empty { color:#2b2418; } */
        #bb.bb-light .bb-mi.standby { --ac:#8a7f68; }
        #bb.bb-light .bb-chip.bat    { background:var(--sur); color:#b91c1c; }
		#bb.bb-light .bb-chip.dock   { background:var(--sur); color:#a16207; }
		#bb.bb-light .bb-chip.zombie { background:var(--sur); color:#c2410c; }
		#bb.bb-light .bb-chip.cam    { background:var(--sur); color:#c2410c; }
		#bb.bb-light .bb-chip.nomap  { background:var(--sur); color:#c2410c; }
		#bb.bb-light .bb-chip.idle   { background:var(--sur); color:#1d4ed8; }

        #bb-wrap * { box-sizing:border-box; }

        /* ── 메인 패널 ── */
        #bb {
            display:none; position:fixed; top:50%; left:50%;
            transform:translate(-50%,-50%);
            width:1714px;   /* 1490px 대비 +15% — 우측 다중 모니터링 영역 확보 */
            height:990px; max-height:100vh; overflow-y:auto; overflow-x:hidden;   /* 기본 크기 = 즐겨찾기 20대 + 안내 문구가 들어가는 높이 (955 = 104 + 20 + 774 + 51 + 6) + 여유 25px.
               즐겨찾기가 정확히 최대(20대)일 때 예전엔 여유가 0이라 카드 실측 높이가 ROW_H(33px) 가정과 1~2px만 어긋나도(줄간격 렌더링 반올림) 카드 영역(.bb-list-wrap)에 스크롤이 생겼음 — 그 여유분 */
            border:3px solid transparent; border-radius:16px;
            background-image: var(--bg-fill), linear-gradient(135deg, #d9b8ff, #9333ea);
            background-origin: border-box;
            background-clip: padding-box, border-box;
            box-shadow:0 24px 60px rgba(0,0,0,.75);
            z-index:9999999; font-family:'Paperlogy','Lato',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
			font-weight:900;
			color:var(--tx); flex-direction:column;
			        }
        #bb.bb-light { -webkit-text-stroke: 0.4px currentColor; }
        #bb.open { display:flex; }
		
		#bb, #bb * {
			font-weight: 450 !important;
		}
		
        /* ── 헤더 ── */
        .bb-hd {
            display:flex; flex-direction:column; align-items:center;
            padding:9px 14px 7px; min-height:104px; justify-content:center;   /* 124 → 104: 세로 공간을 카드 영역에 돌려줌 (동숲 주민 100px 이 들어가는 높이) */
            border-radius:16px 16px 0 0;
            flex-shrink:0; position:relative; gap:3px;
        }
        .bb-hd-titlebox {
            position:relative; display:inline-flex; flex-direction:column; align-items:center; gap:3px;
            padding:7px 28px 6px; border-radius:12px;
            border:2.5px solid transparent;
            background-image: linear-gradient(var(--bg), var(--bg)), linear-gradient(135deg, #d9b8ff, #9333ea);
            background-origin: border-box; background-clip: padding-box, border-box;
            cursor:grab;
        }
        .bb-hd-title {
            font-size:calc(24px * var(--bb-ts, 1)); font-weight:900;
            background:linear-gradient(135deg, #6366f1, #ec4899);
            -webkit-background-clip:text; background-clip:text; color:transparent;
            text-shadow:0 0 10px rgba(99,102,241,.45), 0 0 14px rgba(236,72,153,.35);
            display:flex; align-items:center; gap:7px;
        }
        .bb-hd-time { display:flex; align-items:baseline; gap:8px; }
        .bb-clock { font-family:'Paperlogy','Lato',monospace; font-size:calc(15px * var(--bb-ts, 1)); font-weight:900; color:var(--mu); letter-spacing:.8px; }
        .bb-ref   { font-size:calc(14px * var(--bb-ts, 1)); color:var(--mu); font-weight:700; }
        /* 헤더 우측 = [버튼 2줄: 테마·줌·백업·검색] (동숲 주민과 배달/방전/이상 알림 3종은 제목 박스 좌우에 따로 배치) */
        .bb-hd-rightwrap {
            position:absolute; right:14px; top:50%; transform:translateY(-50%);
            display:flex; align-items:center; gap:10px; z-index:500;
        }
        .bb-hd-right { position:relative; display:flex; flex-direction:column; align-items:stretch; gap:6px; }
        .bb-hd-right-row { display:flex; align-items:center; gap:6px; }
        .bb-hd-right-row.right { justify-content:flex-end; }   /* 2줄: 검색창을 오른쪽 끝에 (왼쪽은 비워 둠) */
        .bb-hd-right-row.spread { justify-content:space-between; }   /* 1줄: 테마 버튼(좌) ··· 백업/복원/✕(우) */
        .bb-hd-grp { display:flex; align-items:center; gap:6px; }

        .bb-hd-ico { font-size:calc(14px * var(--bb-ts, 1)); line-height:1; }
        #bb-alertlog-all-btn { background:#d6e9ff; border-color:#a5c8ef; color:#1e3a5f; }          /* 이상 알림: 파스텔 연파랑 */
        #bb-alertlog-all-btn:hover { background:#c4ddfb; border-color:#84b2e6; }

        /* 제목 박스 바로 아래 작은 범례 (기체 카드 점 / 하단 동그라미 색 = 현재 상태) */
        .bb-legend {
            position:absolute; left:50%; bottom:-2px; transform:translateX(-50%);   /* 제목 박스 테두리와 겹치지 않게 살짝 아래 (헤더 아래 여백으로 2px 걸침) */
            display:flex; align-items:center; gap:9px; white-space:nowrap;
            font-size:calc(12.5px * var(--bb-ts, 1)); line-height:14px; color:var(--mu);
        }
        .bb-legend-item { display:inline-flex; align-items:center; gap:4px; }
        .bb-legend-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }

        /* UP: CYH 전용 — 제목 박스 안, "NCC" 글자 바로 밑(시계 왼쪽 빈 자리)에 아주 작게 (CYH 모드일 때만 보임) */
        .bb-up-mini {
            position:absolute; left:30px; bottom:8px; z-index:1;
            height:15px; padding:0 5px; border-radius:5px; border:1px solid var(--bd2);
            background:var(--sur2); color:var(--mu); font-size:calc(12px * var(--bb-ts, 1)); line-height:1; font-family:inherit;
            display:inline-flex; align-items:center; cursor:pointer;
        }
        .bb-up-mini:hover { color:var(--tx); border-color:var(--mu); }

        /* 목록 백업/복원 팝업 */
        #bb-bk-pop {
            display:none; position:absolute; top:100%; right:0; margin-top:8px; z-index:600;
            padding:8px 10px 10px; border-radius:10px;
            background:var(--bg); border:2px solid var(--bd2); box-shadow:0 8px 24px rgba(0,0,0,.45);
        }
        #bb-bk-pop.open { display:block; }
        .bb-bk-title { font-size:calc(15px * var(--bb-ts, 1)); font-weight:900; color:var(--tx); margin-bottom:7px; white-space:nowrap; }
        .bb-bk-btns { display:flex; gap:6px; }
        .bb-bk-name { min-width:64px; }


        /* ── 고정 버튼 3종 (왼쪽 동숲 주민의 왼쪽): 3행 — [🔥 배터리 소모 TOP5] / [🐢 저속충전 TOP5] / [🚫 임무 OFF] ── */
        .bb-fixbtns {
            position:absolute; right:calc(50% + 261px); top:50%; transform:translateY(-50%);   /* 오른쪽 끝 = 왼쪽 동숲 주민(제목 왼쪽 151~251px)에서 10px 왼쪽 */
            width:140px; display:grid; grid-template-columns:1fr; gap:4px; z-index:50;   /* 높이 3×26 + 2×4 = 86px (헤더 104px 안) · z-index 는 카드 영역의 .bb-tools(3) 보다 높아야 함 — 안 그러면 그 안의 방전/저속충전 팝업(.bb-fbp, z-index:600)이 같은 z-index:3 인 .bb-tools 뒤로 깔림(같은 값이면 DOM 순서로 승부가 나는데 .bb-tools 가 더 뒤에 있어서 이긴다) */
        }
        /* ── 우측 3종 버튼 (오른쪽 동숲 주민의 오른쪽): 3행 — [🚫 임무 OFF] / [🪫 방전 로그] / [📋 이상 알림] — 왼쪽 고정 버튼과 같은 폭(140px)·높이(26px)·간격(4px) ── */
        .bb-rbtns {
            position:absolute; left:calc(50% + 261px); top:50%; transform:translateY(-50%);   /* 왼쪽 = 오른쪽 동숲 주민(제목 오른쪽 151~251px)에서 10px 오른쪽 */
            width:140px; display:grid; grid-template-columns:1fr; gap:4px; z-index:50;   /* 위와 같은 이유로 .bb-tools 보다 높게 */
        }
        .bb-rbtns > button, .bb-fixbtns > .bb-fb {   /* 좌·우 6개 버튼 공통: 같은 크기(140×26) · 같은 글자 크기(11px) */
            position:relative; width:100%; height:26px; padding:0 2px; gap:2px; border-radius:7px; border:1.5px solid var(--bd2);
            font-size:calc(13px * var(--bb-ts, 1)); font-weight:800;   /* 방전 로그(최근 30일) 같은 긴 이름이 140px 안에 들어가도록 (양쪽 여유 약 6px) */ font-family:inherit; white-space:nowrap; overflow:visible;
            display:inline-flex; align-items:center; justify-content:center; box-sizing:border-box; cursor:pointer;
        }
        .bb-fb {
            position:relative; height:26px; padding:0 7px; border-radius:7px; border:1.5px solid var(--bd2);
            background:var(--sur2); color:var(--tx); font-size:calc(14px * var(--bb-ts, 1)); font-weight:800; font-family:inherit;
            cursor:pointer; white-space:nowrap; box-sizing:border-box;
        }
        .bb-fb:hover { border-color:var(--mu); }
        .bb-fixbtns > .bb-fb-empty { cursor:default; }   /* 빈 버튼: 자리 유지용 (기능은 나중에 추가) */
        .bb-fixbtns > .bb-fb-empty:hover { border-color:var(--bd2); }
        .bb-fb.active { background:var(--bg); border-color:var(--tx); }
        /* 버튼 색: 옅은 무지개 (분홍 배달 → 주황 방전 → 파랑 이상 알림 / 노랑 저속충전 → 보라 임무 OFF). 목록 창이 열려 있으면(active) 같은 색을 한 톤 진하게 + 진한 테두리 */
        #bb-fb-dis  { background:#ffdcc2; border-color:#f0b98d; color:#5a3413; }
        #bb-fb-dis:hover  { background:#ffd0ae; border-color:#e59d62; }
        #bb-fb-dis.active { background:#ffc59b; border-color:#8a4a17; }
        #bb-fb-drain { background:#ffd3cc; border-color:#f0a59c; color:#5c1d16; }
        #bb-fb-drain:hover { background:#ffc4bb; border-color:#e5857a; }
        #bb-fb-drain.active { background:#ffb3a7; border-color:#8a2b1f; }
        #bb-fb-slow { background:#fff3b5; border-color:#e8d374; color:#514510; }
        #bb-fb-slow:hover { background:#ffec96; border-color:#d9bd45; }
        #bb-fb-slow.active { background:#ffe680; border-color:#7d6a0a; }
        #bb-fb-dlog { background:#e6dcff; border-color:#c4b3f0; color:#3b2b66; }
        #bb-fb-dlog:hover { background:#dccfff; border-color:#a893e6; }
        #bb-fb-neglect { background:#ffe1b8; border-color:#eab476; color:#5c3d12; }   /* 방치/미주차: 주차 표지판 느낌의 연한 주황빛 */
        #bb-fb-neglect:hover { background:#ffd394; border-color:#dd9a48; }
        #bb-fb-neglect.active { background:#ffc772; border-color:#8a5a12; }
        .bb-fb-n {   /* 버튼 모서리에 겹쳐 뜨는 숫자 배지 (폭을 차지하지 않음). 3개 버튼 모두 표시, 0 이면 연한 회색 */
            display:none; position:absolute; top:-7px; right:-5px; min-width:17px; height:17px; padding:0 4px;
            border-radius:9px; box-sizing:border-box; color:#fff; font-size:calc(12px * var(--bb-ts, 1)); font-weight:900; line-height:17px;
            text-align:center; box-shadow:0 1px 3px rgba(0,0,0,.3);
        }
        .bb-fb-n.on { display:block; }
        .bb-fb-n.r { background:#dc2626; }
        .bb-fb-n.o { background:#ea580c; }
        .bb-fb-n.b { background:#3b82f6; }
        .bb-fb-n.g { background:#16a34a; }   /* 저속충전 배지: 충전 중인 기체 중에서 감지하는 것이라 초록 */
        .bb-fb-n.y { background:#eab308; }   /* 방치/미주차 배지: 노랑 */
        .bb-fb-n.pk { background:var(--pk); }   /* 배달 로그 배지: 카드의 '배달 중' 표시와 같은 핑크 */
        .bb-fb-n.z { background:var(--sur); color:var(--mu); border:1px solid var(--bd2); line-height:15px; box-shadow:none; }   /* 0대 */

        /* 고정 버튼 목록 창 (버튼 아래에 뜸, 열어 둔 채로 2분마다 자동 갱신) */
        .bb-fbp {
            display:none; position:absolute; left:0; top:calc(100% + 10px); width:480px; max-height:560px;
            flex-direction:column; z-index:600; background:var(--bg); border:2px solid var(--bd2);
            border-radius:10px; box-shadow:0 8px 24px rgba(0,0,0,.35); overflow:hidden;
        }
        .bb-fbp.open { display:flex; }
        .bb-fbp-hd { display:flex; align-items:center; gap:8px; padding:8px 10px 8px 14px; border-bottom:1px solid var(--bd); flex-shrink:0; }
        .bb-fbp-title { font-size:calc(17px * var(--bb-ts, 1)); font-weight:900; color:var(--tx); }
        .bb-fbp-cnt { flex:1; font-size:calc(14px * var(--bb-ts, 1)); font-weight:800; color:var(--mu); }
        .bb-fbp-x {
            width:30px; height:30px; border-radius:6px; flex-shrink:0; cursor:pointer;
            background:rgba(239,68,68,.15); border:1px solid rgba(239,68,68,.3); color:var(--rd); font-size:calc(20px * var(--bb-ts, 1)); font-weight:900;
            display:flex; align-items:center; justify-content:center;
        }
        .bb-fbp-x:hover { background:rgba(239,68,68,.3); }
        .bb-fbp-body { overflow-y:auto; padding:6px 8px 8px; min-height:0; }
        .bb-fbp-note { font-size:calc(12.5px * var(--bb-ts, 1)); line-height:1.45; color:var(--mu); padding:2px 6px 8px; }
        .bb-fbp-empty { padding:22px 8px; text-align:center; font-size:calc(15px * var(--bb-ts, 1)); font-weight:700; color:var(--mu); }
        .bb-fbp-foot { font-size:calc(12.5px * var(--bb-ts, 1)); line-height:1.45; color:var(--mu); padding:6px 6px 2px; }
        .bb-fbp-row {
            display:flex; align-items:center; gap:8px; padding:7px 10px; margin-bottom:5px; border-radius:8px;
            background:var(--sur); border:1.5px solid var(--bd); cursor:pointer; color:var(--tx);
        }
        .bb-fbp-row:hover { background:#f9a8d4; }
        .bb-fbp-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
        .bb-fbp-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
        .bb-fbp-line { display:flex; align-items:center; gap:6px; min-width:0; }
        .bb-fbp-name { font-size:calc(15px * var(--bb-ts, 1)); font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bb-fbp-tag { flex-shrink:0; font-size:calc(12px * var(--bb-ts, 1)); font-weight:900; padding:1px 7px; border-radius:9px; }
        .bb-fbp-tag.sure { background:#dc2626; color:#fff; }
        .bb-fbp-tag.est { background:rgba(234,88,12,.15); color:#c2410c; border:1px solid rgba(234,88,12,.5); padding:0 6px; }
        .bb-fbp-sub { font-size:calc(13px * var(--bb-ts, 1)); color:var(--mu); white-space:nowrap; }
        .bb-fbp-now { font-size:calc(14px * var(--bb-ts, 1)); font-weight:800; white-space:nowrap; flex-shrink:0; }
        .bb-fbp-row.sc { display:block; }
        .bb-sc-l1 { display:flex; align-items:center; gap:8px; }
        .bb-sc-l1 .bb-fbp-name { flex:1; min-width:0; }
        .bb-sc-bat { font-size:calc(15px * var(--bb-ts, 1)); font-weight:900; flex-shrink:0; }
        .bb-sc-l2 { display:flex; align-items:center; gap:10px; margin-top:6px; }
        .bb-sc-bar { position:relative; flex:1; min-width:0; height:12px; border-radius:6px; background:var(--sur2); border:1px solid var(--bd2); box-sizing:border-box; overflow:hidden; }
        .bb-sc-base { position:absolute; left:0; top:0; bottom:0; background:rgba(120,110,90,.32); }   /* 충전을 시작하기 전의 배터리 (회색) */
        .bb-sc-fill { position:absolute; top:0; bottom:0; }                                            /* 충전으로 채운 구간 (색: 더딜수록 붉게) */
        .bb-sc-fill.sev-r { background:#dc2626; } .bb-sc-fill.sev-o { background:#ea580c; } .bb-sc-fill.sev-g { background:#16a34a; }
        .bb-sc-rate, .bb-sc-eta { font-size:calc(13px * var(--bb-ts, 1)); color:var(--mu); white-space:nowrap; }
        .bb-sc-l3 { margin-top:4px; font-size:calc(13px * var(--bb-ts, 1)); color:var(--mu); }
        .bb-sc-l3 b { color:var(--tx); font-weight:800; }
        .bb-sc-eta { margin-left:auto; }
        .bb-dr-st { flex-shrink:0; font-size:calc(13px * var(--bb-ts, 1)); font-weight:700; color:var(--mu); }   /* 배터리 소모 목록: 기체의 현재 상태(순찰 중/배달 중 …) */

        /* 동숲 캐릭터 (헤더: 제목 박스 오른쪽) — 캐릭터 선택/저장은 예전 그대로, 캠핑장 배경만 제외 */
        #bb-walker-wrap {   /* 우측 주민: 제목 박스 오른쪽 (좌측 주민과 좌우 대칭, 제목 박스에서 10px 띄움) */
            position:absolute; left:calc(50% + 151px); top:50%; transform:translateY(-50%);
            width:100px; height:100px; z-index:2;
        }
        #bb-walker {
            width:100%; height:100%;
            background-size:contain; background-repeat:no-repeat; background-position:center bottom;
            cursor:pointer; transition:transform .15s;
        }
        #bb-walker:active { transform:scale(0.92); }
        #bb-walker-l { width:100%; height:100%; object-fit:cover; display:block; cursor:default; border:0; }   /* 아토(토끼): <img> 로 표시해야 움짤(webp)이 계속 반복 재생됨 (배경 이미지는 브라우저에 따라 한 번만 재생될 수 있음) */
        #bb-walker-wrap-l {   /* 좌측 주민: 제목 박스 왼쪽 (제목 박스 왼쪽 끝에서 10px 띄워 오른쪽 끝을 맞춤) */
            position:absolute; right:calc(50% + 151px); top:50%; transform:translateY(-50%);
            width:100px; height:100px; z-index:1;
        }
        .bb-walker-arrow {
            position:absolute; top:50%; transform:translateY(-50%);
            width:22px; height:22px; border-radius:50%;
            background:rgba(20,20,22,.55); border:1px solid rgba(255,255,255,.2);
            color:#fff; font-size:calc(17px * var(--bb-ts, 1)); font-weight:900; line-height:1; padding:0;
            display:flex; align-items:center; justify-content:center;
            cursor:pointer; z-index:2;
            opacity:0; transition:opacity .15s, background .15s;
        }
        #bb-walker-wrap:hover .bb-walker-arrow, #bb-walker-wrap:hover #bb-walker-toggle,
        #bb-walker-wrap-l:hover #bb-walker-l-toggle { opacity:1; }   /* 좌측(아토)은 화살표가 없으므로 토글 버튼만 */
        .bb-walker-arrow.left  { left:0; }
        .bb-walker-arrow.right { right:0; }
        .bb-walker-arrow:hover { background:rgba(20,20,22,.85); }
        .bb-walker-arrow:active { transform:translateY(-50%) scale(0.9); }
        #bb-walker-toggle, #bb-walker-l-toggle {
            position:absolute; top:0; right:0; min-width:34px; height:20px; padding:0 6px;
            border-radius:6px; background:var(--sur2); border:1px solid var(--bd2);
            color:var(--tx); font-size:calc(13px * var(--bb-ts, 1)); font-weight:900; cursor:pointer;
            display:flex; align-items:center; justify-content:center;
            z-index:2; opacity:0; transition:opacity .15s, background .15s, color .15s;
        }
        #bb-walker-toggle:hover, #bb-walker-l-toggle:hover { border-color:var(--mu); }
        #bb-walker-toggle.off, #bb-walker-l-toggle.off { opacity:1; color:var(--rd); border-color:rgba(239,68,68,.3); background:rgba(239,68,68,.1); }
        /* 말풍선: 캐릭터 왼쪽으로 뜸(가운데 제목 위를 덮어도 무방). 클릭을 가로채지 않도록 pointer-events:none */
        #bb-walker-bubble {
            position:absolute; top:50%; right:calc(100% + 14px); transform:translateY(-50%);
            width:250px; min-height:50px; box-sizing:border-box;
            background:#fdf6e3; border-radius:20px; padding:10px 18px;
            font-size:calc(17px * var(--bb-ts, 1)); color:#5c4a2a; font-weight:700; line-height:1.4;
            box-shadow:0 4px 12px rgba(0,0,0,.35);
            z-index:3; display:none; pointer-events:none;
            font-family:'Paperlogy','Lato',-apple-system,sans-serif; -webkit-text-stroke:0;
        }
        #bb-walker-bubble.open { display:block; }
        #bb-walker-bubble::after {
            content:''; position:absolute; top:50%; right:-13px; transform:translateY(-50%);
            width:0; height:0;
            border-top:8px solid transparent; border-bottom:8px solid transparent;
            border-left:14px solid #fdf6e3;
        }
        #bb-walker-bubble b { font-weight:900; color:#a8460c; }

        .bb-btn {
            height:32px; padding:0 12px; border-radius:6px; border:1px solid var(--bd2);
            background:var(--sur2); color:var(--tx); font-size:calc(16px * var(--bb-ts, 1));
            font-family:inherit; font-weight:700; cursor:pointer; white-space:nowrap;
            display:inline-flex; align-items:center; justify-content:center; box-sizing:border-box;
        }
        .bb-btn:hover { border-color:var(--mu); }
        #bb-theme-btn, #bb-lighttheme-btn { min-width:38px; padding:0 8px; font-size:calc(18px * var(--bb-ts, 1)); }   /* 이모지만 표시 */
        .bb-btn.rm {
            border-color:rgba(239,68,68,.3); color:var(--rd); background:rgba(239,68,68,.15);
            min-width:76px; text-align:center;   /* ← 이 두 개 추가 */
        }
        .bb-btn.rm:hover { background:rgba(239,68,68,.25); }
        .bb-xbtn {
            width:32px; height:32px; border-radius:6px;
            background:rgba(239,68,68,.15); border:1px solid rgba(239,68,68,.3);
            color:var(--rd); font-size:calc(15px * var(--bb-ts, 1)); cursor:pointer;
            display:flex; align-items:center; justify-content:center; font-weight:900;
        }
        .bb-xbtn:hover { background:rgba(239,68,68,.3); }
        /* 글자 키우기: 본문 글자는 --bb-tg 배율 그대로, 버튼은 그 40% 만큼만(버튼이 커지지 않게), 상단 헤더는 원래 크기 유지(레이아웃 보존) */
        button, [role="button"], .bb-hd, .bb-hd * { --bb-ts: calc(1 + (var(--bb-tg, 1) - 1) * .4); }
        .bb-hd, .bb-hd * { --bb-ts: 1 !important; }
        .zoom-btn {
            padding:3px 8px; border-radius:5px; border:1px solid var(--bd2);
            background:var(--sur2); color:var(--tx); font-size:14px;
            font-weight:900; cursor:pointer; line-height:1.5; font-family:inherit;
        }
        .zoom-label { font-size:16px; color:var(--tx); font-weight:700; min-width:34px; text-align:center; }

        /* ── 알림 영역 (헤더 좌측) + 검색 ── */
        .bb-alert-zone {   /* 이 영역 안에서만 버튼이 뜸 — overflow:hidden 으로 밖으로 삐져나오지 않음 */
            position:absolute; left:14px; top:50%; transform:translateY(-50%);   /* 헤더 세로 중앙. 6칸(3줄) = 3×26 + 2×4 + 패딩 6 = 92px (오른쪽 고정 버튼 3행 86px 과 같은 줄 높이) */
            width:429px; box-sizing:border-box; padding:3px; overflow:hidden;   /* 429 = 왼쪽 동숲 주민(100px) + 고정 버튼 3행(140px) 자리를 남긴 폭 */
        }
        .bb-alert-chips { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:4px 6px; }
        .bb-chip {   /* 가로로 긴 한 줄 버튼: [아이콘 종류 N건  ··· 기체명] */
            display:flex; align-items:center; gap:6px; min-width:0;
            height:26px; padding:0 9px; box-sizing:border-box; border-radius:8px;   /* 고정 버튼(.bb-fb)과 같은 높이·글자 크기 → 3행이 오른쪽 버튼 3행과 나란히 */
            font-size:calc(14px * var(--bb-ts, 1)); font-weight:800; cursor:pointer; font-family:inherit;
            transition:filter .15s, box-shadow .15s;
        }
        .bb-chip-l1 { flex-shrink:0; white-space:nowrap; }
        .bb-chip-l2 {
            flex:1; min-width:0; font-size:calc(14px * var(--bb-ts, 1)); font-weight:500; opacity:.8;
            white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        .bb-chip:hover { filter:brightness(1.15); }
        .bb-chip.bat    { background:var(--rd2); color:var(--rd); border:2px solid rgba(239,68,68,.55); animation:chipPulse 1s infinite, chipBorder 1s infinite; }
        .bb-chip.dock   { background:rgba(251,191,36,.12); color:var(--ye); border:2px solid rgba(251,191,36,.5); animation:chipPulse 1s infinite, chipBorder 1s infinite; }
        .bb-chip.zombie { background:rgba(249,115,22,.12); color:var(--or); border:2px solid rgba(249,115,22,.5); animation:chipPulse .7s infinite, chipBorder .7s infinite; }
        .bb-chip.cam    { background:rgba(249,115,22,.12); color:var(--or); border:2px solid rgba(249,115,22,.45); animation:chipPulse 1s infinite, chipBorder 1s infinite; }
        .bb-chip.nomap  { background:rgba(249,115,22,.12); color:var(--or); border:2px solid rgba(249,115,22,.45); animation:chipPulse 1s infinite, chipBorder 1s infinite; }
        .bb-chip.idle   { background:rgba(59,130,246,.10); color:var(--bl); border:2px solid rgba(59,130,246,.45); animation:chipPulse 1.2s infinite, chipBorder 1.2s infinite; }
        #bb.bb-light .bb-chip.bat    { box-shadow:0 0 8px rgba(239,68,68,.25); }
        #bb.bb-light .bb-chip.dock   { box-shadow:0 0 6px rgba(251,191,36,.2); }
        #bb.bb-light .bb-chip.zombie { box-shadow:0 0 8px rgba(249,115,22,.2); }
        #bb.bb-light .bb-chip.cam    { box-shadow:0 0 6px rgba(249,115,22,.15); }
        #bb.bb-light .bb-chip.nomap  { box-shadow:0 0 6px rgba(249,115,22,.15); }
        #bb.bb-light .bb-chip.idle   { box-shadow:0 0 6px rgba(59,130,246,.15); }
        .bb-chip-none   { grid-column:1 / -1; font-size:calc(15px * var(--bb-ts, 1)); color:var(--mu); font-weight:700; padding:6px 4px; }
        @keyframes chipPulse { 0%,100%{opacity:1} 50%{opacity:.85} }
        @keyframes chipBorder {
            0%,100% { box-shadow:0 0 0 2px currentColor; }
            50%     { box-shadow:0 0 0 1px currentColor; }
        }

        /* 검색 */
        .bb-si-wrap { position:relative; flex:0 0 230px; min-width:230px; }   /* 폭 고정 230px (안내 문구가 잘리지 않는 폭) — 남는 자리는 채우지 않고 비워 둠 */
        .bb-si-excl {   /* 검색창 왼쪽: 요기요/성남형 배달 기체 제외 체크박스 (2줄 라벨) */
            display:flex; align-items:center; gap:5px; flex:0 0 auto; cursor:pointer; user-select:none;
            padding:3px 8px; border-radius:8px; border:1.5px solid var(--bd2); background:var(--sur2);
        }
        .bb-si-excl:hover { border-color:var(--mu); }
        .bb-si-excl input { width:14px; height:14px; margin:0; flex-shrink:0; accent-color:var(--bl); cursor:pointer; }
        .bb-si-excl .tx { display:flex; flex-direction:column; line-height:1.15; font-size:calc(12.5px * var(--bb-ts, 1)); font-weight:700; color:var(--mu); }
        .bb-si-excl input:checked ~ .tx { color:var(--tx); }
        .bb-si {
            width:100%; box-sizing:border-box; max-width:100%; background:var(--sur2); border:1px solid var(--bd2);
            border-radius:7px; padding:6px 10px 6px 26px;
            color:var(--tx); font-size:calc(16px * var(--bb-ts, 1)); outline:none; font-family:inherit;
        }
        .bb-si:focus { border-color:var(--bl); }
        .bb-si::placeholder { color:var(--mu); }
        .bb-si-icon { position:absolute; left:8px; top:50%; transform:translateY(-50%); font-size:calc(16px * var(--bb-ts, 1)); color:var(--mu); pointer-events:none; }
        #bb-dd {
            position:absolute; top:calc(100% + 4px); right:0; width:300px;   /* 입력창은 좁아도 목록은 넓게 */
            background:var(--sur2); border:1px solid var(--bd2);
            border-radius:8px; overflow:hidden;
            box-shadow:0 8px 24px rgba(0,0,0,.7); z-index:99999999; display:none;
            max-height:240px; overflow-y:auto;
        }
        #bb-dd.open { display:block; }
        .bb-di {
            padding:8px 12px; font-size:calc(16px * var(--bb-ts, 1)); font-weight:700; cursor:pointer;
            display:flex; align-items:center; gap:6px;
            border-bottom:1px solid var(--bd); color:var(--tx);
            transition:background .1s;
        }
        .bb-di:last-child { border-bottom:none; }
        .bb-di:hover, .bb-di.bb-di-focus { background:var(--bd); }
        .bb-di-name { flex:1; }
        .bb-di-icon { font-size:calc(14px * var(--bb-ts, 1)); flex-shrink:0; }
        .bb-di-plus { font-size:calc(17px * var(--bb-ts, 1)); color:var(--gn); font-weight:900; flex-shrink:0; margin-left:4px; }

        /* ── 기체 리스트 (통합 그리드: 한 줄 = 기체 1대) ── */
        /* 본문 = 좌(기체 리스트 + 퀵바) | 우(다중 모니터링 중 기체) */
        .bb-body { display:flex; align-items:stretch; flex:1 1 auto; min-height:0; }   /* 남는 높이를 차지하고, 넘치면 카드 영역이 줄어들며 그 안에서 스크롤 */
        /* 배경 이미지: 이 본문(기체 카드 영역 ~ 하단)에만 깔림. z-index:-1 = #bb 의 테마 색 배경 위, 모든 카드·글자 아래. 클릭은 통과 */
        .bb-body { position:relative; }
        .bb-body::before {
            content:''; position:absolute; inset:0; z-index:-1; pointer-events:none;
            background:url('${BB_BG_URL}') center / cover no-repeat; opacity:${BB_BG_OPACITY};
            /* 상단 경계 페이드: 맨 위는 투명 → BB_BG_FADE_PX 아래부터 완전히 보임 (헤더 테마 색과 자연스럽게 섞임). ease-out 형태로 여러 단계를 줘서 띠(밴딩) 없이 부드럽게 */
            -webkit-mask-image:linear-gradient(to bottom, transparent 0, rgba(0,0,0,.18) ${BB_BG_FADE_PX * 0.25}px, rgba(0,0,0,.5) ${BB_BG_FADE_PX * 0.55}px, rgba(0,0,0,.85) ${BB_BG_FADE_PX * 0.8}px, #000 ${BB_BG_FADE_PX}px);
                    mask-image:linear-gradient(to bottom, transparent 0, rgba(0,0,0,.18) ${BB_BG_FADE_PX * 0.25}px, rgba(0,0,0,.5) ${BB_BG_FADE_PX * 0.55}px, rgba(0,0,0,.85) ${BB_BG_FADE_PX * 0.8}px, #000 ${BB_BG_FADE_PX}px);
        }
        .bb-main { flex:0 0 1340px; min-width:0; min-height:0; display:flex; flex-direction:column; }   /* 1340 = 카드 318×4 + 간격 12×3 + 좌우 여백 16×2 (퀵바 내용이 길어져도 우측 영역을 밀지 않도록 고정) */
        /* 기체 카드 영역: 기체가 많아 창이 화면보다 커지면 창 전체가 아니라 이 영역 안에서만 스크롤 (스크롤바 = 다중 모니터링 영역 바로 왼쪽) */
        .bb-list-wrap {
            flex:1 1 auto; min-height:0; overflow-y:auto; overflow-x:hidden;
            padding:10px 8px 10px 16px; scrollbar-gutter:stable;   /* 스크롤바 자리를 항상 확보 → 생겼다 사라져도 카드가 밀리지 않음 */
        }
        .bb-list-wrap::-webkit-scrollbar { width:6px; }
        .bb-list-wrap::-webkit-scrollbar-track { background:transparent; }
        .bb-list-wrap::-webkit-scrollbar-thumb { background:var(--bd2); border-radius:3px; }
        .bb-list-wrap::-webkit-scrollbar-thumb:hover { background:var(--mu); }
        @supports not selector(::-webkit-scrollbar) { .bb-list-wrap { scrollbar-width:thin; scrollbar-color:var(--bd2) transparent; } }
        /* 카드 제거 모드: '모든 기체 카드 영역'(즐겨찾기 + 카드 목록)만 또렷하게 두르고, 나머지(헤더·퀵바·다중 모니터링/이석 패널)는 살짝 어둡게 — 지금 무엇을 골라야 하는지 한눈에 보이도록 */
        #bb.bb-rm-mode .bb-hd, #bb.bb-rm-mode .bb-quick, #bb.bb-rm-mode .bb-mm {
            opacity:.4; filter:saturate(.6); transition:opacity .25s ease, filter .25s ease;
        }
        #bb.bb-rm-mode .bb-list-wrap {
            box-shadow:inset 0 0 0 3px var(--rd), inset 0 0 22px 2px rgba(239,68,68,.35); transition:box-shadow .25s ease;
            /* 안쪽으로만 번지는 그림자(inset)를 씀 — 바깥쪽(outset) 그림자는 #bb 자체의 overflow-x:hidden 에 걸려 왼쪽이 잘려 보였음 */
            /* border-radius 는 일부러 안 씀 — overflow-y:auto 스크롤 컨테이너에 border-radius 를 같이 주면
               브라우저 네이티브 스크롤바가 둥근 모서리 자리에서 어긋나게 그려지면서(특히 스크롤 중) 빨간 테두리가
               스크롤바에 걸려 잘려 보이는 현상이 있었음. 각진 테두리로 바꿔 스크롤바와 겹치는 자리를 없앰 */
        }
        /* 카드 영역 = [즐겨찾기] [순찰 중 + 배달 중] [그 외 (2열)] — 각 영역은 '제목 줄(카드 1줄 높이) + 카드 칸'이고, 카드가 넘치면 그 영역 안에서만 스크롤됨 */
        .bb-lists { --row-h:33px; --row-gap:5px; --col-h:793px; display:flex; align-items:flex-start; gap:12px; }   /* 793 = 제목 1줄 + 카드 20줄 (33×21 + 5×20) */
        .bb-fcol, .bb-mid, .bb-oth {
            position:relative; height:var(--col-h); box-sizing:border-box; flex:0 0 auto;
            display:flex; flex-direction:column; gap:var(--row-gap);
            outline:2px solid var(--bd2); outline-offset:3px; border-radius:8px;   /* 다중 모니터링 영역(.bb-mm-box) 테두리와 같은 색·두께. 열 사이 간격 12px 안에 들어가도록 offset 3px */
        }
        /* 영역 외곽선: 각 제목 줄과 같은 색의 얇은 선 (즐겨찾기 골드 / 순찰 파랑 / 배달 핑크) */
        .bb-fcol { outline:1.5px solid #f2c230; }
        .bb-oth  { outline:1.5px solid #3b82f6; }
        .bb-mid  { outline:1.5px solid #ff1493; }
        .bb-fcol, .bb-mid { width:318px; }
        .bb-oth { width:648px; }   /* 순찰 기체 = 2·3열 */   /* 318×2 + 12 */
        .bb-scroll {   /* 영역 안의 카드 칸 — 넘치면 이 칸만 스크롤 (스크롤바는 숨기고 휠로 이동). 안쪽 여백 2px + 음수 마진 2px = 위치는 그대로, 카드 호버 테두리가 잘리지 않게 하는 용도 */
            display:grid; grid-auto-rows:var(--row-h); row-gap:var(--row-gap); align-content:start;
            box-sizing:border-box; padding:2px; margin:-2px; min-height:0; overflow-y:auto; overflow-x:hidden;
        }
        .bb-scroll::-webkit-scrollbar { width:8px; }   /* 카드가 넘칠 때만 나타남 — 나타나면 카드가 8px 좁아지며 자리를 내줌 */
        .bb-scroll::-webkit-scrollbar-track { background:rgba(0,0,0,.08); border-radius:4px; }
        .bb-scroll::-webkit-scrollbar-thumb { background:var(--mu); border-radius:4px; }
        .bb-scroll::-webkit-scrollbar-thumb:hover { background:var(--tx); }
        @supports not selector(::-webkit-scrollbar) { .bb-scroll { scrollbar-width:thin; scrollbar-color:var(--mu) rgba(0,0,0,.08); } }
        .bb-row-star { flex-shrink:0; margin-left:-2px; font-size:calc(14px * var(--bb-ts, 1)); line-height:1; color:#d4a017; }   /* 순찰/배달 열로 옮겨 간 즐겨찾기 기체 표시 */
        .bb-fcol > .bb-scroll { flex:1 1 auto; width:322px; }   /* 폭 고정: 접히는 동안 내용이 다시 배치되지 않고 잘리며 슬라이드됨 */
        .bb-fcol > .bb-colhd { width:318px; }
        /* 즐겨찾기 열 접기: 접으면 왼쪽 골드 세로줄(레일)이 되고, 오른쪽 열들이 왼쪽으로 슬라이드해서 당겨짐 */
        .bb-fcol { overflow:clip; overflow-clip-margin:4px; transition:width .3s cubic-bezier(.4,0,.2,1); }
        .bb-fcol.collapsed { width:46px; }
        .bb-fcol > .bb-colhd, .bb-fcol > .bb-scroll { visibility:visible; transition:visibility 0s; }
        .bb-fcol.collapsed > .bb-colhd, .bb-fcol.collapsed > .bb-scroll { visibility:hidden; transition:visibility 0s .3s; }   /* 접힌 뒤에는 클릭/포커스도 막음 */
        .bb-colhd.fav { position:relative; }
        .bb-fold, .bb-fold-rail .ar {
            width:24px; height:24px; padding:0; flex:none; border-radius:6px; border:1px solid rgba(63,46,0,.35);
            background:rgba(63,46,0,.12); color:#3f2e00; cursor:pointer; display:flex; align-items:center; justify-content:center;
        }
        .bb-fold:hover, .bb-fold-rail .ar:hover { background:rgba(63,46,0,.26); }
        .bb-fold svg, .bb-fold-rail .ar svg { width:14px; height:14px; display:block; }
        .bb-fold { position:absolute; left:5px; top:50%; transform:translateY(-50%); }
        .bb-fold-rail {
            position:absolute; left:0; top:0; bottom:0; width:46px; box-sizing:border-box; z-index:3;
            display:flex; flex-direction:column; align-items:center; gap:10px; padding:6px 0 10px;
            border-radius:8px; border:1.5px solid #c79a0a; background:#f2c230; color:#3f2e00; cursor:pointer;
            opacity:0; pointer-events:none; transition:opacity .12s;
        }
        .bb-fcol.collapsed .bb-fold-rail { opacity:1; pointer-events:auto; transition:opacity .2s .12s; }
        .bb-fold-rail:hover { filter:brightness(1.06); }
        .bb-fold-rail .rt { writing-mode:vertical-rl; font-size:calc(20px * var(--bb-ts, 1)); letter-spacing:3px; white-space:nowrap; }
        #bb .bb-fold-rail .rt { font-weight:700 !important; }
        .bb-fold-rail .rn { min-width:26px; height:20px; padding:0 6px; box-sizing:border-box; border-radius:10px; font-size:calc(15px * var(--bb-ts, 1)); line-height:20px; text-align:center; background:rgba(63,46,0,.15); }
        .bb-fold-rail.warn { background:#ef4444; border-color:#b91c1c; color:#fff; }
        .bb-fold-rail.warn .rn { background:rgba(255,255,255,.28); }
        .bb-fold-rail.bb-drop-over { filter:brightness(1.12); }
        /* 정렬 방식 토글 (이름순 ↔ 상태별): 두 선택지가 처음부터 나란히 보이고, 노란 알약이 현재 방식 쪽에 놓임 */
        .bb-sortseg {
            position:relative; flex:1 1 0; min-width:0; height:var(--row-h); box-sizing:border-box; padding:2px;
            display:grid; grid-template-columns:1fr 1fr; align-items:center; border-radius:8px; border:1.5px solid var(--bd2);
            background:var(--sur2); cursor:pointer; user-select:none; outline:none;
        }
        .bb-sortseg:hover, .bb-sortseg:focus-visible { border-color:var(--mu); }
        .bb-sortseg .thumb {
            position:absolute; top:2px; bottom:2px; left:2px; width:calc(50% - 2px); box-sizing:border-box; border-radius:6px;
            background:#fff3b5; border:1.5px solid #d9bd45; box-shadow:0 1px 3px rgba(0,0,0,.2);
            transition:transform .22s cubic-bezier(.4,0,.2,1);
        }
        .bb-sortseg.status .thumb { transform:translateX(100%); }
        .bb-sortseg .seg { position:relative; z-index:1; text-align:center; font-size:calc(15.5px * var(--bb-ts, 1)); white-space:nowrap; color:var(--mu); transition:color .2s; }
        #bb .bb-sortseg .seg { font-weight:700 !important; }
        .bb-sortseg:not(.status) .seg[data-mode="name"], .bb-sortseg.status .seg[data-mode="status"] { color:#4a3f0d; }
        .bb-sec-deliv { flex:1 1 auto; }   /* 배달 기체 = 4열 전체 */
        .bb-scroll:empty { align-content:center; }
        .bb-scroll:empty::after { content:attr(data-empty); text-align:center; font-size:calc(14.5px * var(--bb-ts, 1)); line-height:1.4; color:var(--mu); }
        .bb-list { grid-template-columns:repeat(2,minmax(0,1fr)); column-gap:12px; grid-auto-flow:column; }   /* 그 외: 3열 → 4열 순서로 세로 우선 채움 (행 수는 JS 가 지정) */
        .bb-scroll.bb-drop-over { background:rgba(96,165,250,.10); border-radius:8px; }
        /* 제목 줄: 카드 1줄과 같은 높이 · 글자는 크게 · 색 = 즐겨찾기 골드 / 순찰 파랑 / 배달 핑크 / 그 외 검정 */
        .bb-colhd {
            height:var(--row-h); flex:0 0 auto; box-sizing:border-box; display:flex; align-items:center; justify-content:center; gap:8px;
            border-radius:8px; border:1.5px solid; font-size:calc(20px * var(--bb-ts, 1)); letter-spacing:.3px; white-space:nowrap; overflow:hidden;
        }
        #bb .bb-colhd { font-weight:700 !important; }
        .bb-colhd .n { min-width:26px; height:20px; padding:0 7px; border-radius:10px; font-size:calc(15px * var(--bb-ts, 1)); line-height:20px; text-align:center; background:rgba(255,255,255,.28); }
        .bb-colhd.fav    { background:#f2c230; border-color:#c79a0a; color:#3f2e00; }
        .bb-colhd.fav .n { background:rgba(63,46,0,.15); }
        .bb-colhd.patrol { background:#3b82f6; border-color:#2563eb; color:#fff; }
        .bb-colhd.deliv  { background:#ff1493; border-color:#d10a77; color:#fff; }
        .bb-colhd.oth    { background:#a3a9b2; border-color:#737a85; color:#1f2328; }
        .bb-colhd.oth .n { background:rgba(255,255,255,.4); }
        .bb-colhd.warn   { background:#ef4444; border-color:#b91c1c; color:#fff; }
        .bb-oth-hd { display:grid; grid-template-columns:318px 318px; column-gap:12px; flex:0 0 auto; }   /* 3열 제목(그 외) | 4열 제목 자리(이름 순 정렬 / 카드 제거 버튼) */
        .bb-tools { display:flex; gap:6px; align-items:stretch; height:var(--row-h); }
        .bb-tool-btn { flex:1 1 0; min-width:0; height:33px; padding:0 8px; gap:6px; font-size:calc(16px * var(--bb-ts, 1)); }
        .bb-tool-btn.rm { min-width:0; }
        #bb-rmbtn { background:#dbeeff; border-color:#a9d2f5; color:#1f4a6e; }                     /* 카드 제거: 옅은 파스텔 하늘색 */
        #bb-rmbtn:hover { background:#c9e5ff; border-color:#87bff0; }
        #bb-rmbtn.rm { background:#8ec8f7; border-color:#4a9fe0; color:#0f3556; }                  /* 제거 모드(완료 대기): 진한 하늘색으로 활성 표시 */
        #bb-rmbtn.rm:hover { background:#7dbef3; }
        .bb-tool-ico { display:inline-flex; width:16px; height:16px; flex-shrink:0; }
        .bb-tool-ico svg { width:16px; height:16px; display:block; }
        .bb-list-empty {
            grid-column:1 / -1; grid-row:1; padding:56px 8px; text-align:center;
            font-size:calc(17px * var(--bb-ts, 1)); color:var(--mu);
        }

        @keyframes bb-warnBlink {
            0%,100% { border-color:var(--rd); box-shadow:0 0 0 1px var(--rd); }
            50%     { border-color:transparent; box-shadow:none; }
        }
        @keyframes bb-marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-60%)} }
        @keyframes bb-pctSlide {
            0%     { transform:translateX(0);    opacity:1; }
            42%    { transform:translateX(0);    opacity:1; }
            50%    { transform:translateX(-10px);  opacity:0; }
            50.01% { transform:translateX(8px);   opacity:0; }
            92%    { transform:translateX(8px);   opacity:0; }
            100%   { transform:translateX(0);    opacity:1; }
        }

        .bb-row {
            position:relative; display:flex; align-items:center; gap:6px;
            height:33px; padding:0 6px 0 8px;   /* 30px → 33px (+10%) */ border-radius:8px;
            background:var(--sur); border:1.5px solid var(--row-bd, var(--bd));
            cursor:grab;
            user-select:none;
            transition:background .15s, opacity .15s;   /* 외곽선(border-color/box-shadow)은 transition 없이 즉시 반응 */
        }
        .bb-row.delivering { border-color:var(--pk); box-shadow:0 0 0 1px var(--pk); }   /* 배달 중: 핫핑크 외곽선 (호버보다 먼저 선언 → 호버 시에는 연핑크로 바뀜) */
        .bb-row:hover { border-color:#f9a8d4; box-shadow:0 0 0 1px #f9a8d4; }   /* 연핑크, 1.5px → 약 2.5px */
        .bb-row:active { cursor:grabbing; }
        .bb-row.warn-bat { animation:bb-warnBlink .8s infinite; }
        .bb-row.dragging { opacity:.3; }
        .bb-row.dragover { border-color:var(--bl)!important; box-shadow:0 0 0 1px var(--bl); }
        .bb-row.selectable { cursor:pointer; }
        .bb-row.selectable:hover { border-color:rgba(239,68,68,.5); background:rgba(239,68,68,.04); box-shadow:0 0 0 1px rgba(239,68,68,.5); }
        .bb-row.selected { border-color:var(--rd)!important; background:var(--rd2)!important; }
        .bb-row.selected::after {
            content:'✕'; position:absolute; top:50%; left:50%;
            transform:translate(-50%,-50%);
            color:var(--rd); font-size:calc(20px * var(--bb-ts, 1)); font-weight:900; opacity:.9; pointer-events:none;
        }
        .bb-row-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }   /* 8 → 10px */
        .bb-row-name {
            flex:1; min-width:0; font-size:calc(17px * var(--bb-ts, 1)); font-weight:700; color:var(--tx);
            white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        .bb-row-name.bb-marquee { overflow:visible; animation:bb-marquee 3s linear 0.5s 1 forwards; }

        /* 우측 배터리 슬롯 — 폭을 고정해 모든 행의 배터리 바 위치를 열 안에서 정렬 */
        /* 전원 OFF 슬롯: 두 줄 (1줄 "OFF | 마지막 통신" / 2줄 "09/19, 17:53"), 오른쪽 정렬 */
        .bb-row-off {   /* 두 줄 모두 왼쪽 정렬 (슬롯 자체는 카드 오른쪽 끝에 붙음) */
            display:flex; flex-direction:column; align-items:flex-start; justify-content:center;
            flex-shrink:0; min-width:56px; line-height:1;
        }
        .bb-off-l1, .bb-off-l2 { display:flex; align-items:baseline; white-space:nowrap; }
        .bb-off-a { display:inline-block; min-width:29px; }   /* 두 줄의 첫 칸 폭을 맞춰 "|" 가 세로로 정렬됨 */
        .bb-off-tag { font-size:calc(13px * var(--bb-ts, 1)); font-weight:900; letter-spacing:.2px; color:var(--off-main); }
        .bb-off-sep { font-style:normal; font-size:calc(12px * var(--bb-ts, 1)); margin:0 4px; color:var(--off-sub); opacity:.55; }
        .bb-off-lbl { font-size:calc(11.5px * var(--bb-ts, 1)); color:var(--off-sub); }
        .bb-off-l2 {
            margin-top:3px; font-size:calc(12.5px * var(--bb-ts, 1)); color:var(--off-date);
            font-variant-numeric:tabular-nums; letter-spacing:.2px;
        }
        .bb-off-none { color:var(--off-date); }
        .bb-row-batt {
            position:relative; display:inline-block; width:56px; height:20px; border-radius:4px;
            background:var(--sur2); border:1.5px solid var(--bd2);
            overflow:hidden; box-sizing:border-box; vertical-align:middle; flex-shrink:0;
        }
        .bb-row-batt-fill { position:absolute; left:0; top:0; bottom:0; transition:width .5s ease; }
        .bb-row-batt-pct {
            position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
            font-size:calc(14px * var(--bb-ts, 1)); font-weight:900; font-family:'Paperlogy','Lato',monospace;   /* 11 → 12px */
            color:var(--pct-fill); text-shadow:var(--pct-shadow);
            letter-spacing:-0.3px; pointer-events:none; white-space:nowrap;
        }
        .bb-row-batt-pct.lowbat, .bb-row-pctx.lowbat { color:#dc2626; }   /* 배터리 21% 이하: 수치 글자도 빨간색으로 */
        .bb-row-pct-wrap {
            position:relative; display:inline-block; width:56px; height:20px;
            overflow:hidden; flex-shrink:0; text-align:right;
        }
        .bb-row-pct-val, .bb-row-pct-off {
            position:absolute; top:0; right:0; white-space:nowrap;
            animation:bb-pctSlide 8s ease-in-out infinite;
        }
        .bb-row-pct-val { display:flex; align-items:center; height:20px; }
        .bb-row-pct-off { font-size:calc(13px * var(--bb-ts, 1)); font-weight:900; line-height:20px; color:rgba(239,68,68,.8); animation-delay:-4s; }
        /* 카드 전체 배터리바 모드 (#bb.bb-wbatt): 카드 배경이 배터리 바가 됨 — 배터리 % 만큼 상태색으로 채워지고, 수치는 오른쪽 정렬 그대로. 두 표현을 모두 그려 두고 CSS 로만 전환 (전환할 때 다시 그리지 않음) */
        .bb-row-wbar { display:none; position:absolute; inset:0; z-index:-1; border-radius:6.5px; overflow:hidden; pointer-events:none; }
        .bb-row-wbar > i { position:absolute; left:0; top:0; bottom:0; }
        .bb-row-pctx { display:none; min-width:56px; text-align:right; font-size:calc(15px * var(--bb-ts, 1)); font-weight:900; font-family:'Paperlogy','Lato',monospace; color:var(--tx); white-space:nowrap; }
        #bb.bb-wbatt .bb-row { isolation:isolate; }   /* 채움(z-index:-1)이 카드 배경 위, 글자 아래에 깔리도록 */
        #bb.bb-wbatt .bb-row-wbar { display:block; }
        #bb.bb-wbatt .bb-row-batt { display:none; }
        #bb.bb-wbatt .bb-row-pctx { display:inline-block; }
        /* 카드 전체 모드: 상태 점이 채움과 같은 색이라 묻히므로 크림색 링 + 얇은 진한 테두리를 둘러 채움 위/빈 곳 어디서나 또렷하게 */
        #bb.bb-wbatt .bb-row-dot { box-shadow:0 0 0 1px #fffaf0, 0 0 0 1.5px rgba(43,36,24,.5); margin:0 2px 0 1px; }
        .bb-row-plug { font-size:calc(13px * var(--bb-ts, 1)); line-height:1; flex-shrink:0; }   /* 있을 때만 표시 (자리 예약 없음) — 배터리 바 왼쪽 */

        /* ── 우측: 다중 모니터링 중 기체 (세로 직사각형 영역) ── */
        .bb-mm { flex:1 1 0; min-width:0; position:relative; margin:10px 16px 10px 6px; }
        .bb-mm-box {
            position:absolute; inset:0; display:block;
            border:2px solid var(--bd2); border-radius:8px; background:var(--bg); overflow:hidden;
        }
        .bb-mm-head {
            flex:0 0 auto; padding:5px 8px 4px; text-align:center;
            background:var(--sur); border-bottom:1px solid var(--bd);
        }
        .bb-mm-title { font-size:calc(18.5px * var(--bb-ts, 1)); font-weight:900; color:var(--tx); }
        .bb-mm-count { color:var(--rd); }
        .bb-mm-note { font-size:calc(13.5px * var(--bb-ts, 1)); font-weight:400; color:var(--mu); white-space:nowrap; }
        .bb-mm-sub { margin-top:1px; font-size:calc(13.5px * var(--bb-ts, 1)); line-height:1.3; color:var(--mu); }
        .bb-mm-sub.warn { color:var(--or); }
        .bb-mm-body {
            flex:1 1 auto; min-height:0; overflow-y:auto;
            display:flex; flex-direction:column; gap:5px; padding:6px;
        }
        .bb-mm-body:empty::before {   /* 카드가 들어오면 자동으로 사라지는 빈 상태 문구 */
            content:'다중 모니터링 중인 기체 없음'; margin:auto; font-size:calc(15px * var(--bb-ts, 1)); color:var(--mu);
        }
        .bb-mm-card {   /* 기체 카드 = 기존 행(30px) 두 줄 두께 (30 + 5 + 30) */
            flex:0 0 auto; height:65px; box-sizing:border-box;
            display:flex; flex-direction:column; justify-content:center; gap:5px;
            padding:0 10px;
            background:var(--sur); border:1.5px solid var(--bd); border-radius:8px;
        }
        /* 1줄: 기체명 · 순찰 중 · 시작 시각 ··········· 요원 */
        .bb-mm-l1 { display:flex; align-items:baseline; gap:8px; min-width:0; }
        .bb-mm-name {
            flex:0 1 auto; min-width:0; font-size:calc(17px * var(--bb-ts, 1)); font-weight:700; color:var(--tx);
            white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        .bb-mm-st { flex-shrink:0; display:inline-flex; align-items:center; gap:5px; font-size:calc(15px * var(--bb-ts, 1)); color:var(--bl); white-space:nowrap; }
        .bb-mm-dot { width:8px; height:8px; border-radius:50%; background:var(--bl); }
        .bb-mm-since { flex-shrink:0; margin-left:-3px; font-size:calc(14px * var(--bb-ts, 1)); color:var(--mu); white-space:nowrap; }
        .bb-mm-staff {
            flex:0 1 auto; min-width:0; max-width:45%; margin-left:auto;
            font-size:calc(15px * var(--bb-ts, 1)); color:var(--tx); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        #bb.bb-light .bb-mm-staff { color:#000; }   /* 라이트: 검정 (굵기는 기본) — 다크는 배경이 어두워 밝은 글자색 유지 */
        /* 2줄: 현재 POI ··········· N분째 미갱신 */
        .bb-mm-l2 { display:flex; align-items:baseline; gap:6px; min-width:0; font-size:calc(15px * var(--bb-ts, 1)); }
        .bb-mm-poi { flex:0 1 auto; min-width:0; color:var(--tx); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bb-mm-act { flex-shrink:0; font-size:calc(14px * var(--bb-ts, 1)); color:var(--mu); white-space:nowrap; }
        .bb-mm-stale { flex-shrink:0; margin-left:auto; color:var(--or); white-space:nowrap; }
        .bb-mm-card.anomaly { border-color:var(--or); animation:bb-mmBlink 1s infinite; }
        #bb.bb-light .bb-mm-stale, #bb.bb-light .bb-mm-sub.warn { color:#c2410c; }
        @keyframes bb-mmBlink {
            0%,100% { border-color:var(--or); box-shadow:0 0 0 1px var(--or); }
            50%     { border-color:transparent; box-shadow:none; }
        }

        /* ══════════════════════════════════════════════════════════
           이석/착석 현황 (SECTION 17) — 다중 모니터링 영역과 좌우 슬라이드 전환
           ══════════════════════════════════════════════════════════ */
        .bb-mm-track { display:flex; width:200%; height:100%; transition:transform .32s cubic-bezier(.4,0,.2,1); }
        .bb-mm-track.att { transform:translateX(-50%); }
        .bb-mm-page { flex:0 0 50%; width:50%; min-width:0; height:100%; display:flex; flex-direction:column; position:relative; }
        .bb-mm-head { position:relative; padding-right:66px; }   /* 우측 '이석 »' 버튼 자리 */
        .bb-mm-nav {
            height:26px; padding:0 9px; border-radius:6px; border:1.5px solid var(--bd2);
            background:var(--sur2); color:var(--tx); font-size:calc(15px * var(--bb-ts, 1)); font-family:inherit;
            cursor:pointer; white-space:nowrap; display:inline-flex; align-items:center; justify-content:center; flex:none;
        }
        .bb-mm-nav:hover { border-color:var(--mu); }
        #bb-iv-all { background:#ffd9e4; border-color:#f2a7bf; color:#5c2233; }   /* 이석 현황 / 개입카드 현황의 '자세히': 카드 제거(#bb-rmbtn)와 같은 파스텔 연핑크 */
        #bb-iv-all:hover { background:#ffc9d9; border-color:#ea86a5; }
        #bb-att-detailbtn { background:#d6f5e3; border-color:#8fd3ac; color:#14532d; }   /* 이석 현황 '누적 통계': 개입카드와 같은 녹색 */
        #bb-att-detailbtn:hover { background:#c3efd5; border-color:#6fc496; }
        #bb-att-detailbtn.on { background:#9fe3bd; border-color:#4fb57d; }
        .bb-att-cal-h { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
        .bb-att-cal-h .t { font-size:calc(16px * var(--bb-ts, 1)); color:var(--tx); }
        .bb-att-cal-h button { height:24px; min-width:28px; padding:0 6px; border-radius:6px; border:1.5px solid var(--bd2); background:var(--sur2,var(--sur)); color:var(--tx); cursor:pointer; font-size:calc(16px * var(--bb-ts, 1)); line-height:1; }
        .bb-att-cal-h button[disabled] { opacity:.35; cursor:default; }
        .bb-mm-goatt { position:absolute; right:8px; top:50%; transform:translateY(-50%); height:auto; padding:5px 9px; gap:5px; }
        /* 두 줄 버튼 공통: 화살표(« »)는 글자 옆에 따로 두고, 두 줄 글자는 같은 크기 · 가운데 정렬 */
        .bb-mm-nav .ar { flex:none; font-size:calc(16px * var(--bb-ts, 1)); line-height:1; }
        .bb-mm-nav .tx { display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; font-size:calc(15px * var(--bb-ts, 1)); line-height:1.25; }
        .bb-mm-nav .tx span { font-size:calc(15px * var(--bb-ts, 1)); }
        /* 다중 모니터링에 '미갱신' 이상이 하나라도 있으면 다중 카드(.bb-mm-card.anomaly)와 같은 색·같은 점멸 */
        .bb-att-back.alert { border-color:var(--or); color:#c2410c; animation:bb-mmBlink 1s infinite; }
        /* « 다중 = 두 줄 버튼: 1줄 '« 다중', 2줄 '미갱신'(다중 모니터링에 미갱신 기체가 있을 때만) → 왜 깜빡이는지 한눈에 */
        .bb-att-back { height:auto; align-self:stretch; padding:0 7px; gap:3px; }   /* 제목이 한 줄에 들어가도록 폭을 최소화 */
        .bb-att-back .l2 { display:none; }
        .bb-att-back.alert .l2 { display:block; }

        .bb-att-head { flex:0 0 auto; position:relative; padding:6px 8px; background:var(--sur); border-bottom:1px solid var(--bd); display:grid; grid-template-columns:auto minmax(0,1fr); column-gap:8px; row-gap:6px; align-items:center; z-index:3; }
        .bb-att-back { grid-row:1 / 3; grid-column:1; }
        .bb-att-title { grid-column:2; min-width:0; text-align:left; font-size:calc(16px * var(--bb-ts, 1)); line-height:1.25; color:var(--tx); }
        .bb-att-title .n { color:var(--rd); }
        .bb-att-title .sep { color:var(--mu); }
        .bb-att-title .past { color:var(--or); }
        .bb-att-r2 { grid-column:2; min-width:0; display:flex; align-items:center; gap:5px; }
        .bb-att-mbtn { min-width:40px; padding:0 6px; }
        .bb-att-r2 .bb-mm-nav { padding:0 6px; }
        .bb-att-mbtn.on { border-color:var(--bl); color:var(--bl); background:var(--bl2); }
        .bb-att-stat { margin-left:auto; font-size:calc(13.5px * var(--bb-ts, 1)); color:var(--mu); white-space:nowrap; }
        .bb-att-stat.warn { color:#c2410c; }
        .bb-att-cal {
            display:none; position:absolute; left:8px; top:100%; margin-top:4px; width:272px; padding:10px 10px 8px;
            background:var(--sur); border:1.5px solid var(--bd2); border-radius:10px; box-shadow:0 10px 28px rgba(0,0,0,.35);
        }
        .bb-att-cal.open { display:block; }
        .bb-att-cal-title { text-align:center; font-size:calc(16px * var(--bb-ts, 1)); color:var(--tx); margin-bottom:6px; }
        .bb-att-cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:3px; }
        .bb-att-dow { font-size:calc(13.5px * var(--bb-ts, 1)); color:var(--mu); text-align:center; padding-bottom:3px; }
        .bb-att-day { position:relative; height:30px; display:flex; align-items:center; justify-content:center; border-radius:6px; font-size:calc(15px * var(--bb-ts, 1)); color:var(--mu); border:1.5px solid transparent; opacity:.55; }
        .bb-att-day.has { color:var(--tx); opacity:1; cursor:pointer; }
        .bb-att-day.has:hover { background:var(--sur2); }
        .bb-att-day.today { border-color:var(--bl); opacity:1; color:var(--tx); }
        .bb-att-day.sel { background:var(--bl); color:#fff; border-color:var(--bl); opacity:1; }
        .bb-att-day .dot { position:absolute; bottom:2px; left:50%; transform:translateX(-50%); width:3px; height:3px; border-radius:50%; background:var(--gn); }
        .bb-att-day.sel .dot { background:#fff; }

        .bb-att-body { flex:1 1 auto; min-height:0; overflow-y:auto; padding:6px; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; align-content:start; }
        .bb-att-msg { grid-column:1 / -1; padding:34px 8px; text-align:center; font-size:calc(15px * var(--bb-ts, 1)); color:var(--mu); }
        .bb-att-msg.warn { color:#c2410c; }
        .bb-att-retry { text-decoration:underline; cursor:pointer; font-weight:700; }
        .bb-att-card {
            box-sizing:border-box; min-width:0; height:64px; padding:5px 7px; border:3px solid var(--bd2); border-radius:9px; background:var(--sur);   /* 58 → 64px: 확인사항 색줄까지 3줄이 들어가면서 부족해진 세로 공간 확보 */
            display:flex; flex-direction:column; justify-content:center; gap:2px; cursor:pointer;
        }
        .bb-att-card:hover { filter:brightness(1.03); }
        /* 관리자 동그라미 버튼(이석 현황 제목 왼쪽) — 동작은 근무자 카드와 같음: 누르면 이석 로그 창, 이석 중이면 빨간 외곽선, 퇴근/미근무는 회색 */
        .bb-att-mgs { flex:0 0 auto; display:inline-flex; align-items:center; gap:4px; margin-right:6px; }
        .bb-att-mg { box-sizing:border-box; width:24px; height:24px; padding:0; border-radius:50%; border:2px solid #b79af0; background:#e9defc; color:#4c2f8f; font-family:inherit; font-size:calc(14.5px * var(--bb-ts, 1)); font-weight:900; line-height:1; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; }
        .bb-att-mg:hover { filter:brightness(1.05); }
        .bb-att-mg.sel { outline:2px solid var(--tx); outline-offset:1px; }
        .bb-att-mg.off { background:#cfc8b4; border-color:#a39b84; color:#4a4436; }
        .bb-att-mg.none { background:#cfc8b4; border-color:#a39b84; color:#4a4436; cursor:default; opacity:.7; }
        .bb-att-mg.away { border-color:#ef4444; box-shadow:0 0 8px -2px rgba(239,68,68,.6); animation:bb-att-away-blink 2s ease-in-out infinite; }
        .bb-att-card.sel { outline:2px solid var(--tx); outline-offset:1px; }
        /* 이석 중인 근무자 카드는 빨간 테두리 고정 (퇴근자는 회색, 그 외는 기본 테두리) */
        .bb-att-card.away { border-color:#ef4444; box-shadow:0 0 8px -2px rgba(239,68,68,.6); animation:bb-att-away-blink 2s ease-in-out infinite; }   /* 겹선(0 0 0 1px) 제거로 살짝 얇게 · 2초 주기로 아주 옅게만 점멸 */
        @keyframes bb-att-away-blink { 0%, 100% { opacity:1; } 50% { opacity:.72; } }
        .bb-att-card.off { background:#cfc8b4; }
        .bb-att-card.off .bb-att-name, .bb-att-card.off .bb-att-cnt, .bb-att-card.off .bb-att-tot { color:#4a4436; }
        .bb-att-l1 { display:flex; align-items:baseline; justify-content:space-between; gap:4px; min-width:0; }
        .bb-att-name { min-width:0; font-size:calc(16px * var(--bb-ts, 1)); color:var(--tx); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bb-att-cnt { flex:none; font-size:calc(14px * var(--bb-ts, 1)); color:var(--mu); }
        .bb-att-tot { font-size:calc(14.5px * var(--bb-ts, 1)); color:var(--tx); white-space:nowrap; }
        /* 확인사항 개수(0~4개) → 이석 시간 아래 얇은 색줄로 표시 (카드 테두리는 이석 중 여부만 나타내므로 건드리지 않음). 파스텔톤: 0=연두 · 1~2=연노랑 · 3=연주황 · 4=연빨강 */
        .bb-att-vbar { height:4px; flex:0 0 auto; border-radius:2px; }   /* flex-shrink:0 — 카드 높이가 빠듯해도 이 줄만 짜부라들지 않게 */
        .bb-att-vbar.v0 { background:#8fd66b; }
        .bb-att-vbar.v1 { background:#f5d442; }
        .bb-att-vbar.v2 { background:#ffab5c; }
        .bb-att-vbar.v3 { background:#ff7a68; }
        .bb-att-legend { flex:0 0 auto; display:flex; justify-content:center; align-items:center; gap:9px; padding:5px 6px 6px; border-top:1px solid var(--bd); font-size:calc(14px * var(--bb-ts, 1)); color:var(--mu); white-space:nowrap; }
        .bb-mm-legend { flex:0 0 auto; display:flex; justify-content:center; align-items:center; gap:9px; padding:5px 6px 6px; border-top:1px solid var(--bd); font-size:calc(14px * var(--bb-ts, 1)); color:var(--mu); white-space:nowrap; }   /* 다중 모니터링 하단 안내 — 이석 현황 하단(.bb-att-legend)과 같은 모양 */

        /* 카드 클릭 → 이석 로그 (다중 영역 왼쪽에 뜨는 작은 창) / 상세 로그 (화면 중앙) — 둘 다 보드 밖 최상위 패널 */
        #bb-att-pop, #bb-att-detail, #bb-att-plog {
            --bg:#f2e4c4; --sur:#f8f3e6; --sur2:#efe6d2; --bd:#cabf9d; --bd2:#b3a687; --tx:#2b2418; --mu:#7a6f5c;
            --rd:#ef4444; --or:#f97316; --pk:#ff1493; --bl:#3b82f6; --gn:#22c55e;
            display:none; position:fixed; color:var(--tx); font-family:'Paperlogy','Lato',-apple-system,sans-serif;
            border:3px solid transparent; border-radius:14px;
            background-image:linear-gradient(var(--sur),var(--sur)), linear-gradient(135deg, #d9b8ff, #9333ea);
            background-origin:border-box; background-clip:padding-box,border-box;
            box-shadow:0 18px 46px rgba(0,0,0,.55); z-index:99999998; box-sizing:border-box;
        }
        #bb-att-pop * , #bb-att-detail *, #bb-att-plog * { box-sizing:border-box; }
        #bb-att-pop.open { display:block; }
        #bb-att-pop { width:372px; max-height:min(640px, 90vh); overflow-y:auto; padding:12px 14px 12px; transform:scale(var(--bb-pop-zoom,1)); transform-origin:center center; }   /* #bb 밖 최상위 패널이라 본판 줌을 못 받으므로 별도 변수로 동기화 (80~90%로는 축소 안 함) */
        .bb-att-ph { display:flex; align-items:baseline; gap:8px; margin-bottom:8px; }
        .bb-att-ph b { font-size:calc(20px * var(--bb-ts, 1)); font-weight:900; }
        .bb-att-ph span { font-size:calc(14px * var(--bb-ts, 1)); color:var(--mu); }
        .bb-att-ph .x { margin-left:auto; cursor:pointer; color:#b91c1c; font-size:calc(18px * var(--bb-ts, 1)); font-weight:900; padding:0 4px; }
        .bb-att-vs { display:flex; flex-direction:column; gap:4px; padding:2px 0 10px; font-size:calc(16px * var(--bb-ts, 1)); }
        .bb-att-vs .hit { color:#e11d74; font-weight:900; }
        .bb-att-vs .ok { color:#9a8e6c; }
        .bb-att-lt { width:100%; border-collapse:collapse; font-size:calc(16px * var(--bb-ts, 1)); }
        .bb-att-lt th { text-align:left; font-size:calc(14.5px * var(--bb-ts, 1)); color:var(--mu); padding:4px 4px 6px; border-bottom:2px solid var(--bd); font-weight:700; }
        .bb-att-lt th:last-child, .bb-att-lt td:last-child { text-align:right; }
        .bb-att-lt td { padding:6px 4px; border-bottom:1px solid var(--bd); white-space:nowrap; font-variant-numeric:tabular-nums; }
        .bb-att-lt td.seq { color:var(--mu); }
        .bb-att-lt .tag { margin-left:4px; font-size:calc(12.5px * var(--bb-ts, 1)); color:var(--mu); }
        .bb-att-lt .tag.ed { color:#e11d74; }
        .bb-att-lt .no { color:#e11d74; font-weight:700; }
        .bb-att-lt .ing { color:var(--or); font-size:calc(14px * var(--bb-ts, 1)); margin-right:4px; }
        .bb-att-lt .long { color:#e11d74; font-weight:700; }
        .bb-att-lt .est { color:#b45309; font-style:italic; }   /* 미기입 보정치가 표시된 소요시간 칸 */

        /* 이름 클릭 → 그 달 일자별 이석 로그 (상세 로그 창 위에 뜸) */
        #bb-att-plog { top:50%; left:50%; transform:translate(-50%,-50%) scale(var(--bb-pop-zoom,1)); width:min(560px, 94vw); max-height:86vh; overflow:hidden; flex-direction:column; z-index:99999999; }
        #bb-att-plog.open { display:flex; }
        .bb-att-lh { flex:0 0 auto; display:flex; align-items:center; gap:10px; padding:13px 16px; border-bottom:1px solid var(--bd); }
        .bb-att-lh .t { flex:1 1 auto; min-width:0; font-size:calc(20px * var(--bb-ts, 1)); font-weight:900; }
        .bb-att-lh .x { flex:none; width:32px; height:32px; border-radius:8px; background:rgba(239,68,68,.18); border:1px solid rgba(239,68,68,.5); color:#b91c1c; font-size:calc(19px * var(--bb-ts, 1)); font-weight:900; cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .bb-att-lsum { flex:0 0 auto; padding:8px 16px 0; font-size:calc(15px * var(--bb-ts, 1)); color:var(--mu); }
        .bb-att-lb { flex:1 1 auto; min-height:0; overflow-y:auto; padding:2px 16px 16px; }
        .bb-att-ld { margin-top:14px; }
        .bb-att-ldh { display:flex; align-items:baseline; gap:10px; padding-bottom:4px; margin-bottom:2px; border-bottom:1px solid var(--bd); font-size:calc(17px * var(--bb-ts, 1)); font-weight:900; }
        .bb-att-ldh .c { font-size:calc(14px * var(--bb-ts, 1)); font-weight:700; color:var(--mu); }
        .bb-att-ll { padding:3px 12px; font-size:calc(16px * var(--bb-ts, 1)); font-variant-numeric:tabular-nums; }
        .bb-att-ll.over { color:#e11d74; font-weight:700; }
        .bb-att-ll.no { color:#c2410c; font-weight:700; }
        .bb-att-ll.est { color:#b45309; font-weight:400; font-style:italic; }   /* 미기입이지만 평균으로 추정치를 채운 항목 — 순수 미기입(.no)보다는 덜 강조 */
        .bb-att-ll .ed { margin-left:6px; color:var(--bl); font-weight:700; }
        .bb-att-le { padding:3px 12px; font-size:calc(15px * var(--bb-ts, 1)); font-style:italic; color:var(--mu); }

        #bb-att-detail { top:50%; left:50%; transform:translate(-50%,-50%) scale(var(--bb-pop-zoom,1)); width:min(1240px, 96vw); height:88vh; max-height:88vh; overflow:hidden; flex-direction:column; font-weight:700; }   /* 높이 고정: 이름 검색으로 표가 짧아져도 창 크기는 그대로 */   /* 폰트는 Paperlogy 맞음 — 기본(Regular 400)이 얇아 보여서 Bold(700)로 */
        #bb-att-detail.open { display:flex; }
        .bb-att-dh { flex:0 0 auto; display:flex; align-items:center; gap:14px; padding:14px 18px; border-bottom:1px solid var(--bd); }
        .bb-att-dh .t { font-size:calc(22px * var(--bb-ts, 1)); font-weight:900; white-space:nowrap; flex:0 0 auto; }   /* 제목은 줄바꿈 없이, 남는 자리에서 포디움 카드가 줄바꿈 */
        .bb-att-dh select { height:34px; padding:0 10px; border-radius:8px; border:1.5px solid var(--bd2); background:var(--sur2); color:var(--tx); font-size:calc(16px * var(--bb-ts, 1)); font-family:inherit; }
        .bb-att-dh .sr { flex:0 0 auto; width:110px; height:34px; padding:0 10px; border-radius:8px; border:1.5px solid var(--bd2); background:var(--sur2); color:var(--tx); font-size:calc(16px * var(--bb-ts, 1)); font-weight:700; font-family:inherit; outline:none; }
        .bb-att-dh .sr:focus { border-color:var(--bl); background:var(--sur); }
        .bb-att-dh .sr::placeholder { color:var(--mu); font-weight:400; }
        .bb-att-dh .mgb { flex:0 0 auto; display:inline-flex; gap:5px; }
        .bb-att-dh .mgb button { width:34px; height:34px; padding:0; border-radius:50%; border:1.5px solid #a39b84; background:#cfc8b4; color:#4a4436; font-size:calc(16px * var(--bb-ts, 1)); font-weight:900; font-family:inherit; cursor:pointer; }
        .bb-att-dh .mgb button:hover { filter:brightness(1.05); }
        .bb-att-dh .mgb button.on { background:#6b6558; color:#fff; border-color:#4a4436; }
        .bb-att-dh .x { margin-left:auto; width:34px; height:34px; border-radius:8px; background:rgba(239,68,68,.18); border:1px solid rgba(239,68,68,.5); color:#b91c1c; font-size:calc(20px * var(--bb-ts, 1)); font-weight:900; cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .bb-att-dnote { flex:0 0 auto; padding:6px 18px 0; font-size:calc(14px * var(--bb-ts, 1)); color:#c2410c; }
        .bb-att-db { flex:1 1 auto; min-height:0; overflow:auto; padding:0 12px 14px; }
        .bb-att-mt { width:100%; border-collapse:collapse; font-size:calc(17px * var(--bb-ts, 1)); font-variant-numeric:tabular-nums; }
        .bb-att-mt th { font-weight:900; position:sticky; top:0; z-index:1; background:var(--sur); padding:14px 12px; font-size:calc(16px * var(--bb-ts, 1)); color:var(--tx); text-align:right; white-space:nowrap; border-bottom:2px solid var(--bd); cursor:pointer; user-select:none; }
        .bb-att-mt th:first-child { text-align:left; cursor:default; }
        /* 이름 열 전체(헤더 ~ 마지막 근무자)를 검정 틀로 감쌈 — '이름을 클릭하면 로그가 열림'을 알려주기 위함. 표 테두리(collapse)와 상관없이 스크롤 헤더에서도 유지되도록 inset 그림자로 그림 */
        .bb-att-mt th:first-child { box-shadow:inset 2px 0 0 #111, inset -2px 0 0 #111, inset 0 2px 0 #111; }
        .bb-att-mt td:first-child { box-shadow:inset 2px 0 0 #111, inset -2px 0 0 #111; }
        .bb-att-mt tbody tr:last-child td:first-child { box-shadow:inset 2px 0 0 #111, inset -2px 0 0 #111, inset 0 -2px 0 #111; }
        .bb-att-mt th .hint { margin-left:5px; font-size:calc(13px * var(--bb-ts, 1)); font-weight:700; color:var(--mu); }
        .bb-att-mt th.sorted { background:#ffe0d6; }
        .bb-att-mt th.sorted::after { content:' ▾'; font-size:calc(13px * var(--bb-ts, 1)); }
        .bb-att-mt td { padding:11px 12px; text-align:right; white-space:nowrap; border-bottom:1px solid var(--bd); }
        .bb-att-mt td:first-child { text-align:left; }
        .bb-att-mt td .tm { margin-left:5px; font-size:calc(14px * var(--bb-ts, 1)); color:var(--mu); }
        .bb-att-mt td.bad { color:#e11d74; }
        .bb-att-mt td.warn, .bb-att-mt th.warn { background:rgba(249,115,22,.10); }
        .bb-att-mt td.warn { color:#c2410c; }
        .bb-att-mt td.nm { cursor:pointer; user-select:none; }
        .bb-att-mt tr:hover td { background:rgba(0,0,0,.035); }
        .bb-att-mt td.bar { text-align:left; width:46%; min-width:300px; }   /* 총 이석시간 막대 칸: 막대 안에 총 이석횟수, 막대 끝에 총 이석시간 */
        .bb-att-bw { display:flex; align-items:center; gap:8px; }
        .bb-att-bar { flex:none; height:22px; min-width:54px; border-radius:5px; display:flex; align-items:center; padding-left:9px; box-sizing:border-box; font-size:calc(15px * var(--bb-ts, 1)); font-weight:900; color:#2b2418; white-space:nowrap; }
        .bb-att-vt { display:inline-block; min-width:40px; text-align:center; padding:2px 9px; border-radius:999px; font-size:calc(15px * var(--bb-ts, 1)); font-weight:900; }
        .bb-att-vt.g { background:#d9efc9; color:#2d5a1a; } .bb-att-vt.y { background:#fbe3a3; color:#6b4a00; } .bb-att-vt.r { background:#f6b3a8; color:#8a1f12; }
        .bb-att-mt tr:hover td.warn { background:rgba(249,115,22,.16); }

        /* ── 하단 퀵바: 한 줄에 4개 그룹 (제목 | 켜진 기체 동그라미) ── */
        .bb-quick {
            flex-shrink:0; display:flex; flex-wrap:nowrap; align-items:stretch; gap:8px;
            padding:8px 16px 8px; border-top:1px solid var(--bd);   /* 10/14 → 8/8 */
        }
        .bb-qline {
            flex:1 1 auto; min-width:0; display:flex; align-items:stretch; min-height:34px;
            border:2px solid var(--bd2); border-radius:8px;
            background:var(--bg); overflow:hidden;
        }
        .bb-qline-title {
            flex:0 0 auto; display:flex; align-items:center; justify-content:center;
            padding:0 12px; font-size:calc(18.5px * var(--bb-ts, 1)); font-weight:900; color:var(--tx);
            background:var(--sur); border-right:1px solid var(--bd); white-space:nowrap;
        }
        .bb-qline-circles {
            flex:1; min-width:0; display:flex; flex-wrap:wrap; align-items:center;
            gap:4px; padding:2px 10px;
        }
        .bb-qline-none { font-size:calc(15px * var(--bb-ts, 1)); color:var(--mu); white-space:nowrap; }
        .bb-mi {
            width:23px; height:23px; border-radius:50%; flex-shrink:0;   /* 26 → 23px (-10%) */
            border:2px solid var(--ac,var(--gy));
            color:var(--ac,var(--gy)); font-size:calc(13.5px * var(--bb-ts, 1)); font-weight:900;
            display:flex; align-items:center; justify-content:center;
            font-family:'Paperlogy','Lato',monospace;
        }
        #bb.bb-light .bb-mi { color:#2b2418; box-shadow:0 0 4px var(--ac); }
        .bb-mi.charging   { --ac:var(--gn); }
        .bb-mi.patrolling { --ac:var(--bl); }
        .bb-mi.delivering { --ac:var(--pk); }
        .bb-mi.standby    { --ac:#c8ccd4; }
        .bb-mi.docking    { --ac:var(--ye); }

        /* [주석처리: 기타 배달] — 필요 시 이 주석만 풀면 복구
        [ 기타 배달 ]
        .bb-delivery-area {
			flex:1; display:flex; flex-direction:column; min-height:0;
			position:relative; border-radius:8px; overflow:hidden;
			background-size:cover; background-position:center;
		}
        .bb-delivery-title {
            font-size:calc(18.5px * var(--bb-ts, 1)); font-weight:900; color:var(--tx); letter-spacing:.3px;
            padding:5px 6px; border:1px solid var(--bd); background:var(--sur);
            text-align:center; border-radius:8px; flex-shrink:0;
            width:30%; box-sizing:border-box; margin:10px 0 0 8px;
        }
        .bb-delivery-chips {
            display:flex; flex-wrap:wrap; gap:4px;
            overflow-y:auto; max-height:100px; padding:7px 10px 7px 10px;
            margin-top:16px; max-width:calc(100% - 155px);
            box-sizing:border-box;
        }
        .bb-delivery-chips::-webkit-scrollbar { width:4px; }
        .bb-delivery-chips::-webkit-scrollbar-thumb { background:var(--bd2); border-radius:2px; }
        .bb-delivery-chip {
			display:flex; align-items:center; gap:4px;
			padding:3px 9px; border-radius:6px;
			background:var(--sur); border:1px solid rgba(236,72,153,.3);
			color:var(--pk); font-size:calc(16px * var(--bb-ts, 1)); font-weight:700; white-space:nowrap;
			box-shadow:0 1px 4px rgba(0,0,0,.35);
		}
        .bb-delivery-empty {
            display:inline-block;
            font-size:calc(14px * var(--bb-ts, 1)); color:var(--mu); font-weight:700;
            padding:2px 7px; border:1px solid var(--bd); background:var(--sur);
            border-radius:5px;
        }
        */

        /* ── 알림 상세 패널 ── */
        #bb-alert-panel {
            display:none; position:fixed;
            top:50%; left:50%; transform:translate(-50%,-50%);
            width:552px; max-height:86vh; overflow-y:auto;
            border:3px solid transparent; border-radius:14px;
            background-image: linear-gradient(var(--sur), var(--sur)), linear-gradient(135deg, #d9b8ff, #9333ea);
            background-origin: border-box;
            background-clip: padding-box, border-box;
            box-shadow:0 24px 64px rgba(0,0,0,.9);
            z-index:99999999;
                    }

        #bb-alertlog-all-panel {
            display:none; position:fixed;
            top:50%; left:50%; transform:translate(-50%,-50%);
            width:860px; max-height:82vh; overflow-y:auto;
            border:3px solid transparent; border-radius:14px;
            background-image: linear-gradient(var(--sur), var(--sur)), linear-gradient(135deg, #d9b8ff, #9333ea);
            background-origin: border-box;
            background-clip: padding-box, border-box;
            box-shadow:0 24px 64px rgba(0,0,0,.9);
            z-index:99999999;
                    }
        #bb-alertlog-all-panel.open { display:block; }
        #bb-dlog-panel {
            display:none; position:fixed;
            top:50%; left:50%; transform:translate(-50%,-50%);
            width:640px; min-height:420px; max-height:82vh; overflow-y:auto;   /* 최소 높이 확보 — 배달 건수가 적어 패널이 짧아지면 달력 드롭다운이 패널의 overflow-y:auto 에 잘려 스크롤이 생기던 문제 방지 */
            border:3px solid transparent; border-radius:14px;
            background-image: linear-gradient(var(--sur), var(--sur)), linear-gradient(135deg, #d9b8ff, #9333ea);
            background-origin: border-box;
            background-clip: padding-box, border-box;
            box-shadow:0 24px 64px rgba(0,0,0,.9);
            z-index:99999999;
        }
        #bb-dlog-panel.open { display:block; }
        #bb-dlog-panel .bb-ap-title { color:var(--tx); }   /* 다른 로그 패널과 달리 항상 밝은 배경이라 검정 계열 글자로 */
        .bb-dlog-head { position:relative; display:flex; align-items:center; gap:8px; padding:10px 14px; border-bottom:1px solid var(--bd); }
        .bb-dlog-date-lbl { font-size:calc(15px * var(--bb-ts, 1)); font-weight:800; color:var(--mu); margin-left:2px; }
        .bb-dlog-note { margin-left:auto; font-size:calc(13px * var(--bb-ts, 1)); font-weight:700; color:var(--mu); text-align:right; line-height:1.5; }
        .bb-dlog-note br { content:''; }
        #bb-dlog-panel .bb-fbp-row:hover { background:transparent; outline:1.5px solid var(--pk); outline-offset:-1.5px; }   /* 카드 전체 분홍 채움 대신 외곽선만 */
        .bb-dlog-kpi { display:flex; gap:8px; padding:10px 14px 4px; flex-wrap:wrap; }
        .bb-dlog-kpi > div { flex:1; min-width:88px; background:var(--sur2); border:1px solid var(--bd2); border-radius:9px; padding:8px 10px; }
        .bb-dlog-kpi .l { font-size:calc(13px * var(--bb-ts, 1)); color:var(--mu); font-weight:700; }
        .bb-dlog-kpi .v { font-size:calc(20px * var(--bb-ts, 1)); font-weight:900; color:var(--tx); margin-top:2px; }
        .bb-dlog-sub { font-size:calc(14px * var(--bb-ts, 1)); font-weight:800; color:var(--mu); padding:12px 14px 4px; }
        .bb-fbp-right { display:flex; align-items:center; gap:10px; flex-shrink:0; }
        .bb-fbp-who { font-size:calc(14px * var(--bb-ts, 1)); font-weight:800; color:var(--tx); white-space:nowrap; }
        .bb-fbp-time { display:flex; flex-direction:column; align-items:flex-end; gap:1px; flex-shrink:0; }
        .bb-fbp-time .l { font-size:calc(11.5px * var(--bb-ts, 1)); color:var(--mu); font-weight:700; white-space:nowrap; }
        .bb-fbp-time .v { font-size:calc(14px * var(--bb-ts, 1)); font-weight:800; color:var(--tx); white-space:nowrap; }
        /* 배달 로그 패널 안 텍스트만 1px씩 키움 (다른 고정 버튼 팝업 방전 로그 등과 공유하는 클래스라 여기서만 덮어씀) */
        #bb-dlog-panel .bb-fbp-name { font-size:calc(16px * var(--bb-ts, 1)); white-space:normal; line-height:1.3; }   /* 긴 '사이트 - 기체명' 이 말줄임(…)으로 잘려 호기명이 가려지지 않도록 줄바꿈 허용 */
        #bb-dlog-panel .bb-fbp-sub { font-size:calc(14px * var(--bb-ts, 1)); }
        #bb-dlog-panel .bb-fbp-who { font-size:calc(15px * var(--bb-ts, 1)); }
        #bb-dlog-panel .bb-fbp-time .l { font-size:calc(12.5px * var(--bb-ts, 1)); }
        #bb-dlog-panel .bb-fbp-time .v { font-size:calc(15px * var(--bb-ts, 1)); }
        .bb-dlog-meta { display:flex; align-items:center; gap:12px; }   /* '배정 …' 과 '주문번호 …' 사이 간격 */
        .bb-dlog-ord { display:inline-flex; align-items:center; gap:4px; }
        .bb-dlog-copy {
            display:inline-flex; align-items:center; gap:2px;
            border:none; background:transparent; cursor:pointer; line-height:1;
            padding:2px 4px; border-radius:4px; opacity:.8;
        }
        .bb-dlog-copy:hover { opacity:1; background:var(--sur2); }
        .bb-dlog-copy-ico { font-size:calc(18px * var(--bb-ts, 1)); line-height:1; }
        .bb-dlog-copy-lbl { display:none; }
        /* 진행 중 카드: 점선 분홍 테두리 + 깜빡이는 점 / 배정 대기는 연하게 */
        .bb-dlog-grp { font-size:calc(13px * var(--bb-ts, 1)); font-weight:800; color:var(--mu); padding:8px 4px 3px; }
        #bb-dlog-panel .bb-dlog-run { border-style:dashed; border-color:var(--pk); }
        #bb-dlog-panel .bb-dlog-run .bb-fbp-dot { animation:bbDlogPulse 1.4s ease-in-out infinite; }
        #bb-dlog-panel .bb-dlog-run.wait { border-color:var(--bd2); opacity:.75; }
        #bb-dlog-panel .bb-dlog-run.wait .bb-fbp-dot { animation:none; }
        .bb-dlog-tag { flex-shrink:0; font-size:calc(12px * var(--bb-ts, 1)); font-weight:800; padding:1px 7px; border-radius:8px; background:var(--pk2); color:var(--pk); }
        #bb-dlog-panel .bb-dlog-run.wait .bb-dlog-tag { background:var(--sur2); color:var(--mu); }
        @keyframes bbDlogPulse { 0%,100% { opacity:1; } 50% { opacity:.3; } }
        .bb-alertlog-day { margin-bottom:14px; }
        .bb-alertlog-day-title {
            display:flex; align-items:center; gap:10px;
            font-size:calc(19px * var(--bb-ts, 1)); font-weight:900; color:var(--tx);
            margin:14px 14px 8px;
        }
        .bb-alertlog-day-title::after { content:''; flex:1; height:1px; background:var(--bd2); }
        .bb-alertlog-day:first-child .bb-alertlog-day-title { margin-top:2px; }
        .bb-alertlog-row { display:flex; align-items:baseline; gap:8px; font-size:calc(17px * var(--bb-ts, 1)); padding:6px 14px; }
        .bb-alertlog-row:nth-child(even) { background:var(--bg); }
        .bb-alertlog-time { color:var(--mu); min-width:150px; flex-shrink:0; }
        .bb-alertlog-name { color:var(--tx); flex-shrink:0; }
        .bb-alertlog-icon { font-size:calc(22px * var(--bb-ts, 1)); line-height:1; }
        .bb-alertlog-type { font-weight:900; }

        #bb-alert-panel.open { display:block; }
        .bb-ap-hd {
            padding:14px 16px; border-bottom:1px solid #4a5070;
            background:var(--sur);
            border-radius:12px 12px 0 0;
            display:flex; justify-content:space-between; align-items:center;
            position:sticky; top:0; z-index:1;
        }
        .bb-ap-title { font-size:calc(18px * var(--bb-ts, 1)); font-weight:900; color:#ffffff; }
        .bb-ap-close {
            width:34px; height:34px; border-radius:8px;   /* 26 → 34px (알림 상세 / 알림 로그 창) */
            background:rgba(239,68,68,.25); border:1px solid rgba(239,68,68,.6);
            color:#fca5a5; font-size:calc(20px * var(--bb-ts, 1)); cursor:pointer;
            display:flex; align-items:center; justify-content:center; font-weight:900;
        }
        .bb-ap-item {
            padding:13px 16px; border-bottom:1px solid #3a3f62;
            display:flex; align-items:flex-start; gap:12px; background:var(--sur);
        }
        .bb-ap-item:last-child { border-bottom:none; }
        .bb-ap-item:hover { background:#323558; }
        .bb-ap-dot { width:14px; height:14px; border-radius:50%; flex-shrink:0; margin-top:3px; }
        .bb-ap-dot.rd { background:#f87171; }
        .bb-ap-dot.ye { background:#fcd34d; }
        .bb-ap-dot.or { background:#fb923c; }
        .bb-ap-dot.bl { background:#60a5fa; }
        .bb-ap-info { display:flex; flex-direction:column; gap:4px; flex:1; }
        .bb-ap-name { font-size:calc(19px * var(--bb-ts, 1)); font-weight:900; color:#f4f4ff; }
        .bb-ap-desc { font-size:calc(16.5px * var(--bb-ts, 1)); font-weight:700; color:#c4c8e8; line-height:1.55; }
        .bb-ap-time { font-size:calc(13px * var(--bb-ts, 1)); color:#8890b8; font-family:'Paperlogy','Lato',monospace; }
        .bb-ap-dismiss {
            display:flex; flex-shrink:0; align-self:center;
            padding:4px 11px; border-radius:6px;
            border:1px solid #4a5070; background:#3a3f62;
            color:#a0a8cc; font-size:calc(13px * var(--bb-ts, 1)); font-weight:700; cursor:pointer; font-family:inherit;
        }
        .bb-ap-empty { padding:28px 16px; text-align:center; font-size:calc(16px * var(--bb-ts, 1)); color:#8890b8; font-weight:700; background:var(--sur); border-radius:0 0 12px 12px; }

        #bb-alert-panel.bb-light {
			--bg:#f2e4c4; --sur:#f8f3e6; --sur2:#efe6d2;
			--bd:#cabf9d; --bd2:#b3a687; --tx:#2b2418; --mu:#7a6f5c;
			--wh:rgba(0,0,0,.05);
		}
		#bb-alert-panel.bb-light .bb-ap-hd { background:var(--sur); border-bottom-color:var(--bd); }
		#bb-alert-panel.bb-light .bb-ap-title { color:var(--tx); }
		#bb-alertlog-all-panel.bb-light .bb-ap-title { color:var(--tx); }
		#bb-alert-panel.bb-light .bb-ap-close { color:#b91c1c; }
		#bb-alert-panel.bb-light .bb-ap-item { background:var(--sur); border-bottom-color:var(--bd); }
		#bb-alert-panel.bb-light .bb-ap-item:hover { background:var(--sur2); }
		#bb-alert-panel.bb-light .bb-ap-name { color:var(--tx); }
		#bb-alert-panel.bb-light .bb-ap-desc { color:var(--tx); }
		#bb-alert-panel.bb-light .bb-ap-time { color:var(--mu); }
		#bb-alert-panel.bb-light .bb-ap-dismiss { background:var(--sur2); border-color:var(--bd2); color:var(--tx); }
		#bb-alert-panel.bb-light .bb-ap-empty { background:var(--sur); color:var(--mu); }

        /* ── 기체 Info 패널 ── */
        #bb-info-card-panel {
            display:none; position:fixed;
            top:50%; left:50%; transform:translate(-50%,-50%) scale(var(--bb-pop-zoom,1));
            width:840px;
            border:3px solid transparent; border-radius:12px;
            background-image: linear-gradient(var(--sur), var(--sur)), linear-gradient(135deg, #d9b8ff, #9333ea);
            background-origin: border-box;
            background-clip: padding-box, border-box;
            box-shadow:0 16px 48px rgba(0,0,0,.9);
            z-index:999999999; font-family:'Paperlogy','Lato',sans-serif;
            color:var(--tx); overflow:hidden;
                    }
        .bb-icp-flex { display:flex; align-items:stretch; }
        .bb-icp-left { flex:0 0 260px; min-width:0; }
        .bb-icp-right { flex:1; min-width:0; border-left:1px solid var(--bd); padding:10px 16px; }
        .bb-icp-wbl-log { margin-top:10px; display:flex; flex-direction:column; gap:6px; }
        .bb-icp-wbl-line { font-size:calc(17px * var(--bb-ts, 1)); line-height:1.5; color:var(--tx); }
        .bb-wbl-scroll { flex:1; min-width:0; overflow-x:auto; overflow-y:hidden; cursor:grab; scrollbar-width:thin; }
        .bb-wbl-scroll::-webkit-scrollbar { height:6px; }
        .bb-wbl-scroll::-webkit-scrollbar-thumb { background:var(--bd2); border-radius:3px; }
        #bb-info-card-panel.bb-light {
            --bg:#f2e4c4; --sur:#f8f3e6; --sur2:#efe6d2;
            --bd:#cabf9d; --bd2:#b3a687; --tx:#2b2418; --mu:#7a6f5c;
            --wh:rgba(0,0,0,.05);
            --gn:#22c55e; --gn2:rgba(34,197,94,.10);
            --bl:#3b82f6; --bl2:rgba(59,130,246,.10);
            --gy:#4b5563;
            --rd:#ef4444; --rd2:rgba(239,68,68,.12); --ye:#fbbf24;
            --or:#f97316; --or2:rgba(249,115,22,.12);
            --pk:#ff1493; --pk2:rgba(255,20,147,.10);
            --offdot:#b4b2a9;
            --standby-batt:#98a2ae;
        }  
        #bb-info-card-panel.open { display:block; }
        .bb-icp-hd {
            padding:11px 14px; background:var(--sur);
            border-bottom:1px solid var(--bd);
            display:flex; justify-content:space-between; align-items:center;
        }
        .bb-icp-asof { font-size:calc(14px * var(--bb-ts, 1)); color:var(--mu); font-weight:400; margin-left:4px; }
        .bb-icp-hd { cursor:move; }
        .bb-icp-title { font-size:calc(18px * var(--bb-ts, 1)); font-weight:900; color:var(--tx); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bb-icp-badge {
            font-size:calc(15px * var(--bb-ts, 1)); font-weight:900; padding:3px 8px;
            border-radius:5px; flex-shrink:0; margin-left:6px;
        }
        .bb-icp-badge.ok       { background:rgba(34,197,94,.15);  color:var(--gn); }
		.bb-icp-badge.warn     { background:rgba(251,191,36,.15); color:var(--ye); }
		.bb-icp-badge.crit     { background:rgba(239,68,68,.15);  color:var(--rd); }
		.bb-icp-badge.patrol   { background:rgba(59,130,246,.15); color:var(--bl); }
		.bb-icp-badge.deliver  { background:rgba(255,20,147,.15); color:var(--pk); }
		.bb-icp-badge.standby  { background:rgba(200,204,212,.15); color:#c8ccd4; }
		.bb-icp-badge.off      { background:rgba(75,85,99,.15);   color:#6b7280; }
        .bb-icp-close {
            width:30px; height:30px; border-radius:6px; flex-shrink:0;   /* 22 → 30px (기체 정보 창) */
            background:rgba(239,68,68,.15); border:1px solid rgba(239,68,68,.3);
            color:var(--rd); font-size:calc(20px * var(--bb-ts, 1)); cursor:pointer;
            display:flex; align-items:center; justify-content:center; font-weight:900;
            margin-left:6px;
        }
        .bb-icp-section {
            padding:7px 14px; border-bottom:1px solid var(--bd);
        }
        .bb-icp-section:last-child { border-bottom:none; }
        .bb-icp-section-title {
            font-size:calc(15px * var(--bb-ts, 1)); font-weight:900; color:var(--mu);
            letter-spacing:.5px; margin-bottom:4px; text-transform:uppercase;
        }
        #bb-icp-wbl-title-text { font-weight:900; font-size:calc(17px * var(--bb-ts, 1)); }
        .bb-icp-row {
            display:flex; justify-content:space-between; align-items:center;
            padding:3px 0; font-size:calc(17px * var(--bb-ts, 1));
        }
        .bb-icp-label { color:var(--mu); font-weight:700; }
        .bb-icp-value { color:var(--tx); font-weight:700; text-align:right; display:flex; align-items:center; gap:4px; }
        .bb-icp-bar { font-size:calc(15px * var(--bb-ts, 1)); color:var(--gn); letter-spacing:-1px; }

        /* ── 제거 힌트 ── */
        .bb-rmhint { font-size:calc(14px * var(--bb-ts, 1)); color:var(--rd); font-weight:700; display:none; opacity:.85; }
        .bb-rmhint.show { display:block; }

        /* ══════════════════════════════════════════════════════════
           v6.4 UI 전면 개편 — 아래는 화면 배치만 바꾸는 오버라이드 (로직은 그대로)
           · 숨김 처리한 요소(배터리 소모/저속충전/순찰 후 미주차/방전 로그/이상 로그/목록 백업·복원/제외 검색/기체 검색/
             퀵바/즐겨찾기 열/전체 배터리바 버튼/UP/갱신 카운트다운)도 DOM 에는 남아 있어 기존 로직이 그대로 동작함
           ══════════════════════════════════════════════════════════ */
        #bb .bb-fixbtns, #bb .bb-rbtns, #bb #bb-theme-btn, #bb #bb-wbl-upload-btn, #bb #bb-backup-btn, #bb #bb-restore-btn,
        #bb #bb-bk-pop, #bb .bb-hd-right-row.right, #bb .bb-quick, #bb .bb-fcol, #bb .bb-ref,
        #bb .bb-mm-goatt, #bb #bb-att-back, #bb #bb-iv-go, #bb #bb-iv-back, #bb #bb-dlog-close { display:none !important; }

        /* 헤더: 알림 칩은 왼쪽 빈 자리까지 넓히고, 남은 버튼(테마·줌·닫기)은 제목 영역 오른쪽에 붙임 */
        #bb .bb-alert-zone { width:calc(50% - 375px); }
        /* 아토 2호 / 동숲 주민 2: 기존 캐릭터(제목 박스에서 151~251px)에서 8px 띄워 바깥쪽에 배치 */
        #bb #bb-walker-wrap-l2 { position:absolute; right:calc(50% + 259px); top:50%; transform:translateY(-50%); width:100px; height:100px; z-index:1; }
        #bb #bb-walker-l2 { width:100%; height:100%; object-fit:cover; display:block; border:0; }
        #bb #bb-walker-wrap-r2 { position:absolute; left:calc(50% + 259px); top:calc(50% - 8px); transform:translateY(-50%); width:100px; height:100px; z-index:2; }
        #bb #bb-walker-r2 { width:100%; height:100%; background-size:contain; background-repeat:no-repeat; background-position:center bottom; }
        #bb .bb-mm-lap { flex-shrink:0; padding:0 7px; border-radius:999px; border:1px solid var(--bd2); background:var(--sur2); font-size:calc(13.5px * var(--bb-ts, 1)); line-height:17px; color:var(--tx); white-space:nowrap; }
        #bb-walker-wrap-r2:hover .bb-walker-arrow { opacity:1; }
        /* 테마·줌·닫기 버튼: 우상단 고정 */
        #bb .bb-hd-rightwrap { left:auto; right:14px; top:10px; transform:none; }
        #bb .bb-hd-right-row.spread { justify-content:flex-start; gap:12px; }

        /* 본문: [순찰 + 배달 열] [다중 모니터링] [개입 현황] [이석 현황] */
        /* v6.4b: 4열 동일 폭 = [배달 로그] [다중 모니터링] [개입 현황] [이석 현황] — 순찰/배달 기체 그리드는 숨김 */
        #bb .bb-body { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); column-gap:10px; padding:0 16px; }
        #bb .bb-main { flex:none; width:auto; min-width:0; }
        #bb .bb-list-wrap { display:flex; flex-direction:column; padding:10px 0; scrollbar-gutter:auto; }
        #bb .bb-lists { flex:1 1 0; min-height:0; }
        #bb .bb-oth { display:none !important; }
        #bb .bb-mid { flex:1 1 0; min-height:0; width:auto; height:auto; outline:none; }
        #bb .bb-mid > .bb-colhd, #bb .bb-mid > .bb-sec-deliv { display:none !important; }
        #bb .bb-lists { flex-direction:column; align-items:stretch; gap:12px; }
        #bb .bb-oth { width:512px; }
        #bb .bb-oth { height:380px; }
        #bb .bb-oth-hd { grid-template-columns:1fr 1fr; }
        #bb .bb-sec-deliv { flex:0 0 118px; grid-template-columns:repeat(2,minmax(0,1fr)); column-gap:12px; }

        /* 배달 로그: 팝업 → 배달 열 안에 펼쳐서 표시 */
        #bb #bb-dlog-panel {
            display:flex !important; flex-direction:column; position:relative; top:auto; left:auto; transform:none;
            width:auto; min-height:0; max-height:none; flex:1 1 0; overflow:visible; z-index:auto;
            border:2px solid var(--bd2); border-radius:8px; background:color-mix(in srgb, var(--bg) 60%, transparent); box-shadow:none;
        }
        #bb #bb-dlog-panel .bb-ap-hd { position:relative; display:grid; grid-template-columns:46px minmax(0,1fr) 46px; column-gap:8px; row-gap:6px; align-items:center; padding:6px 8px; border-bottom:1px solid var(--bd); border-radius:6px 6px 0 0; }
        #bb #bb-dlog-panel .bb-ap-title { grid-column:2; grid-row:1; text-align:center; font-size:calc(16px * var(--bb-ts, 1)); line-height:1.25; }
        #bb #bb-dlog-panel .bb-dlog-head { grid-column:2; grid-row:2; position:static; padding:0; border-bottom:0; justify-content:center; gap:5px; min-width:0; }
        #bb #bb-dlog-panel #bb-dlog-date-lbl { display:none; }
        #bb #bb-dlog-panel .bb-dlog-note { margin-left:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; line-height:1.25; font-size:calc(13.5px * var(--bb-ts, 1)); min-width:0; }
        #bb #bb-dlog-panel #bb-dl-stats-btn { grid-column:3; grid-row:1 / 3; align-self:stretch; height:auto; padding:0 6px; margin-left:0; }
        #bb #bb-dlog-panel .bb-att-cal { z-index:30; }
        #bb #bb-dlog-panel .bb-dlog-kpi { padding:6px 10px 2px; }
        #bb #bb-dlog-panel .bb-dlog-kpi .v { font-size:calc(17px * var(--bb-ts, 1)); }
        #bb #bb-dlog-panel .bb-dlog-sub { padding:6px 10px 2px; }
        #bb #bb-dlog-body { flex:1 1 auto; min-height:0; overflow-y:auto; padding:0 6px 6px; }
        #bb #bb-dlog-panel .bb-att-legend { overflow:hidden; text-overflow:ellipsis; font-size:calc(13.5px * var(--bb-ts, 1)); }

        /* 배달 내역: 주문번호는 카드 셋째 줄에 항상 표시 (끝에 복사 이모지 버튼) */

        /* 다중 / 개입 / 이석: 한 상자 안의 슬라이드 → 나란히 놓인 3개의 그리드 */
        #bb .bb-mm { grid-column:2 / span 3; margin:10px 0; }
        #bb .bb-mm-box { display:flex; gap:10px; border:0; background:none; border-radius:0; overflow:visible; }
        #bb .bb-mm-track { display:contents; transform:none !important; }
        #bb .bb-mm-page, #bb #bb-iv-page {
            flex:1 1 0; width:auto; min-width:0; height:100%; position:relative; inset:auto; z-index:auto;
            transform:none !important; visibility:visible !important; transition:none;
            border:2px solid var(--bd2); border-radius:8px; background:color-mix(in srgb, var(--bg) 60%, transparent); overflow:hidden;   /* 반투명: 비율(60%)을 낮추면 배경이 더 보임 */
        }
        #bb #bb-mm-page-multi { order:1; }
        #bb #bb-iv-page { order:2; }
        #bb #bb-mm-page-att { order:3; }
        #bb .bb-mm-head, #bb .bb-mm-head.bb-iv-hd { padding:5px 8px 4px; }
        #bb .bb-iv-head { column-gap:0; }
        #bb .bb-att-head { grid-template-columns:46px minmax(0,1fr) 46px; column-gap:8px; }
        #bb .bb-att-head .bb-att-title, #bb .bb-att-head .bb-att-r2 { grid-column:2; }
        #bb #bb-att-detailbtn { grid-column:3; grid-row:1 / 3; align-self:stretch; height:auto; padding:0 6px; }
        /* 네 그리드(배달 로그·다중·개입·이석) 제목 헤더 높이 통일 */
        #bb .bb-mm-head, #bb .bb-att-head, #bb .bb-iv-head, #bb #bb-dlog-panel .bb-ap-hd { box-sizing:border-box; height:64px; flex:0 0 auto; }
        #bb .bb-mm-head { display:flex; flex-direction:column; justify-content:center; }
        #bb .bb-att-body { grid-template-columns:repeat(3,minmax(0,1fr)); }   /* 근무자 카드 한 줄에 3명 */

        /* 개입/이석 그리드 헤더: 제목·버튼 중앙정렬 */
        #bb .bb-att-title { text-align:center; }
        #bb .bb-att-r2 { justify-content:center; }
        #bb .bb-att-stat { margin-left:6px; }
    `;
    document.head.appendChild(style);

    // ============================================================
    // SECTION 0b. HTML
    // ============================================================
    // 카드 영역 마지막 칸 버튼용 아이콘 (SVG — 글자색을 그대로 따라감)
    const ICON_SORT  = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5h9M2 8h6.5M2 12.5h4"/><path d="M12.5 3v9.5M10.2 10.3l2.3 2.5 2.3-2.5"/></svg>';
    const ICON_TRASH = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 4.2h11"/><path d="M6.2 4.2V2.6h3.6v1.6"/><path d="M4.1 4.2l.7 9h6.4l.7-9"/><path d="M6.9 6.8v4.4M9.1 6.8v4.4"/></svg>';
    const ICON_CHECK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3.2L13 4.8"/></svg>';

    const wrap = document.createElement('div');
    wrap.id = 'bb-wrap';
    wrap.innerHTML = `
        <div id="bb">
            <!-- 헤더 -->
            <div class="bb-hd">
                <!-- 좌: 알림 버튼 영역 (배터리 / 도킹 / 좀비 / 방치 / 캠 미송출 / GPS 수신 — 2열 × 3줄) -->
                <div class="bb-alert-zone" id="bb-alert-bar">
                    <div class="bb-alert-chips" id="bb-alert-chips"></div>
                </div>
                <!-- 좌: 고정 버튼 3종 (왼쪽 동숲 주민의 왼쪽) -->
                <div class="bb-fixbtns" id="bb-fixbtns">
                    <button id="bb-fb-drain" class="bb-fb" data-mode="drain" title="충전 중이 아닌 기체를 최근 6시간 안의 하락 기록으로 배터리가 빨리 닳는 순으로 (상위 5대) · 오른쪽 위 숫자 = 지금 소모 속도를 측정 중인 기체 수">🔥 배터리 소모 TOP5<b class="bb-fb-n"></b></button>
                    <button id="bb-fb-slow" class="bb-fb" data-mode="slow" title="충전 중(100% 미만)인 기체를 충전을 시작한 때부터 지금까지의 평균 속도가 더딘 순으로 (상위 5대) · 오른쪽 위 숫자 = 목록에 오른 기체 수(최대 5) · 실제 충전 중인 기체 수는 열었을 때 표시">🐢 저속충전 TOP5<b class="bb-fb-n"></b></button>
                    <button id="bb-fb-neglect" class="bb-fb" data-mode="neglect" title="순찰을 마치고 대기 중으로 바뀐 지 20분(측정 기록 2회)이 지났는데도 그대로인 기체 · 배달 전용 등 일부 기체는 빠짐 · 오른쪽 위 숫자 = 해당 기체 수">🅿️ 순찰 후 미주차<b class="bb-fb-n"></b></button>
                    <div class="bb-fbp" id="bb-fbp">
                        <div class="bb-fbp-hd">
                            <span class="bb-fbp-title" id="bb-fbp-title"></span>
                            <span class="bb-fbp-cnt" id="bb-fbp-cnt"></span>
                            <span class="bb-fbp-x" id="bb-fbp-x">✕</span>
                        </div>
                        <div class="bb-fbp-body" id="bb-fbp-body"></div>
                    </div>
                </div>
                <!-- 좌: 아토(토끼) — 제목 박스 왼쪽, ato/ato01~30.webp 중 2분마다 랜덤 표시. 캐릭터 선택 화살표 없음 -->
                <div id="bb-walker-wrap-l">
                    <img id="bb-walker-l" alt="">
                    <button id="bb-walker-l-toggle" title="아토 끄기">아토</button>
                </div>
                <!-- 좌: 아토 2호 — 아토 왼쪽에 간격을 두고 한 마리 더 (켜기/끄기는 아토와 함께) -->
                <div id="bb-walker-wrap-l2">
                    <img id="bb-walker-l2" alt="">
                </div>
                <div class="bb-hd-titlebox" id="bb-drag-handle">
                    <div class="bb-hd-title">
                        관제 센터
                        <span id="bb-cyh-tag" style="font-size:calc(18px * var(--bb-ts, 1));color:var(--mu);font-weight:400;">by CYH</span>
                    </div>
                    <div class="bb-hd-time">
                        <div class="bb-clock" id="bb-clk">00:00:00</div>
                        <div class="bb-ref" id="bb-ref">— 초 후 갱신</div>
                    </div>
                    <button id="bb-wbl-upload-btn" class="bb-up-mini" style="display:none;" title="배터리 데이터 업로드 (CYH 전용)">UP</button>
                </div>
                <!-- 제목 아래: 상태 색 범례 -->
                <!-- [UI 개편: 상태 표기 범례 주석처리] <div class="bb-legend" id="bb-legend" title="기체 카드의 점 · 하단 동그라미 색 = 기체의 현재 상태"></div> -->
                <!-- 우: 동숲 주민 1 (제목 박스 오른쪽, 말풍선 있음) -->
                <div id="bb-walker-wrap">
                    <div id="bb-walker" title="클릭: 말풍선 켜기/끄기"></div>
                    <button id="bb-walker-prev" class="bb-walker-arrow left" title="이전 캐릭터">‹</button>
                    <button id="bb-walker-next" class="bb-walker-arrow right" title="다음 캐릭터">›</button>
                    <button id="bb-walker-toggle" title="동숲 주민 끄기">동숲</button>
                    <div id="bb-walker-bubble"><span id="bb-walker-bubble-text"></span></div>
                </div>
                <!-- 우: 동숲 주민 2 — 주민 오른쪽에 같은 간격으로 한 명 더 (다음 캐릭터, 말풍선 없음, 켜기/끄기는 주민과 함께) -->
                <div id="bb-walker-wrap-r2">
                    <div id="bb-walker-r2"></div>
                    <button id="bb-walker-r2-prev" class="bb-walker-arrow left" title="이전 캐릭터">‹</button>
                    <button id="bb-walker-r2-next" class="bb-walker-arrow right" title="다음 캐릭터">›</button>
                </div>
                <!-- 우: 3종 버튼 (오른쪽 동숲 주민의 오른쪽) — 배달 로그 / 방전 로그 / 이상 알림. 왼쪽 고정 버튼 3행과 같은 폭·높이·간격 -->
                <div class="bb-rbtns" id="bb-fixbtns-r">
                    <button id="bb-fb-dlog" class="bb-fb" title="배달 로그 · 오늘(근무일) 요약이 기본, 달력 버튼으로 다른 날짜 조회 · 오른쪽 위 숫자 = 오늘 완료 건수">🚚 배달 로그<b class="bb-fb-n"></b></button>
                    <button id="bb-fb-dis" class="bb-fb" data-mode="dis" title="최근 30일 방전 기록 · 오른쪽 위 숫자 = 방전 건수(같은 기체라도 건별로 셈)">🪫 방전 로그(최근 30일)<b class="bb-fb-n"></b></button>
                    <button class="bb-btn" id="bb-alertlog-all-btn" title="최근 30일 동안의 좀비 / 캠 미노출 / 미니맵 미노출 기록"><span class="bb-hd-ico">📋</span>이상 로그(최근 30일)</button>
                </div>
                <!-- 우: 버튼 2줄 (테마/줌/백업/검색) -->
                <div class="bb-hd-rightwrap">
                    <div class="bb-hd-right" id="bb-hd-right">
                        <div class="bb-hd-right-row spread">
                            <div class="bb-hd-grp">
                                <button id="bb-theme-btn" class="bb-btn">-</button>
                                <button id="bb-lighttheme-btn" class="bb-btn" title="배경 테마 전환">☁️</button>
                                <button id="bb-zoom-out" class="zoom-btn">－</button>
                                <span id="bb-zoom-label" class="zoom-label">100%</span>
                                <button id="bb-zoom-in"  class="zoom-btn">＋</button>
                            </div>
                            <div class="bb-hd-grp">
                                <button id="bb-backup-btn" class="bb-btn">목록 백업</button>
                                <button id="bb-restore-btn" class="bb-btn">목록 복원</button>
                                <div class="bb-xbtn" id="bb-closebtn">✕</div>
                            </div>
                        </div>
                        <div class="bb-hd-right-row right">   <!-- 왼쪽은 빈 공간 (나중에 추가할 버튼용) -->
                            <label class="bb-si-excl" id="bb-si-excl-wrap" title="체크하면 하단 퀵바의 요기요/성남형 배달 기체(역삼동·송도 신도시·성수동·성남형)와 '제주 홍보용역'이 포함된 기체는 검색 결과에서 빠집니다">
                                <input type="checkbox" id="bb-si-excl">
                                <span class="tx"><span class="l1">요기요/성남형</span><span class="l2">제주 제외 검색</span></span>
                            </label>
                            <div class="bb-si-wrap" id="bb-search-wrap">
                                <span class="bb-si-icon">🔍</span>
                                <input class="bb-si" id="bb-si" placeholder="기체를 검색해서 추가하세요" title="기체명을 검색한 뒤 목록에서 클릭하면 추가됩니다" autocomplete="off">
                                <div id="bb-dd"></div>
                            </div>
                        </div>
                        <!-- 목록 백업/복원 팝업: 이름 버튼을 누르면 확인 후 실행 -->
                        <div id="bb-bk-pop">
                            <div class="bb-bk-title" id="bb-bk-title">누구 이름으로 백업하시겠습니까?</div>
                            <div class="bb-bk-btns">
                                <button class="bb-btn bb-bk-name" data-name="최윤혁">최윤혁</button>
                                <button class="bb-btn bb-bk-name" data-name="안혜림">안혜림</button>
                                <button class="bb-btn bb-bk-name" data-name="신지섭">신지섭</button>
                                <button class="bb-btn bb-bk-name" data-name="박수연">박수연</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="bb-alertlog-all-panel">
                <div class="bb-ap-hd">
                    <div class="bb-ap-title">📋 이상 로그(최근 30일)</div>
                    <div class="bb-ap-close" id="bb-alertlog-all-close">✕</div>
                </div>
                <div id="bb-alertlog-all-body"></div>
            </div>

            <!-- 본문: 좌(기체 리스트 + 하단 퀵바) | 우(다중 모니터링 중 기체) -->
            <div class="bb-body">
                <div class="bb-main">
                    <div class="bb-list-wrap">
                      <div class="bb-lists">
                        <!-- 1열: 즐겨찾기 (최대 20대) -->
                        <div class="bb-fcol" id="bb-fcol">
                            <div class="bb-colhd fav" id="bb-hd-fav">
                                <button class="bb-fold" id="bb-fold-btn" title="즐겨찾기 열 접기"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3L5 8l5 5"/></svg></button>
                                <span class="t">즐겨찾기</span><span class="n">0/20</span>
                            </div>
                            <div class="bb-scroll" id="bb-fav" data-empty="카드를 끌어다 놓으세요 (최대 20대)" title="즐겨찾기(최대 20대) — 여기에 끌어다 놓은 기체는 이 영역 안에서만 정렬됩니다"></div>
                            <div class="bb-fold-rail" id="bb-fold-rail" title="즐겨찾기 펼치기">
                                <button class="ar" tabindex="-1"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3l5 5-5 5"/></svg></button>
                                <span class="rn">0</span>
                                <span class="rt">즐겨찾기</span>
                            </div>
                        </div>
                        <!-- 2~3열: 순찰 기체 (2열 그리드) — 제목 옆 자리(3열 제목 자리)에 이름순/상태별 토글, 카드 제거 버튼 -->
                        <div class="bb-oth">
                            <div class="bb-oth-hd">
                                <div class="bb-colhd patrol" id="bb-hd-patrol"><span class="t">순찰 기체</span><span class="n">0</span></div>
                                <div class="bb-tools" id="bb-tools">
                                    <div class="bb-sortseg" id="bb-sortname-btn" role="switch" aria-checked="false" tabindex="0"><i class="thumb"></i><span class="seg" data-mode="name">이름순</span><span class="seg" data-mode="status">상태별</span></div>
                                    <button class="bb-btn bb-tool-btn" id="bb-rmbtn" title="카드를 골라서 목록에서 제거"><span class="bb-tool-ico">${ICON_TRASH}</span><span class="bb-tool-lbl">카드 제거</span></button>
                                </div>
                            </div>
                            <div class="bb-scroll bb-list" id="bb-list" data-empty="해당 기체 없음"></div>
                        </div>
                        <!-- 4열: 배달 기체 (DELIVERY_SITE_IDS + ROBOT_KIND_OVERRIDE 의 'delivery') -->
                        <div class="bb-mid">
                            <div class="bb-colhd deliv" id="bb-hd-deliv"><span class="t">배달 기체</span><span class="n">0</span></div>
                            <div class="bb-scroll bb-sec-deliv" id="bb-col-deliv" data-empty="배달 기체 없음" title="배달 기체 (사이트 기준 자동 분류)"></div>
                    <div id="bb-dlog-panel">
                        <div class="bb-ap-hd">
                            <div class="bb-ap-title" id="bb-dlog-title">🚚 배달 로그</div>
                            <div class="bb-ap-close" id="bb-dlog-close">✕</div>
                            <div class="bb-dlog-head">
                                <button class="bb-mm-nav bb-att-mbtn" id="bb-dlog-today">오늘</button>
                                <button class="bb-mm-nav bb-att-mbtn" id="bb-dlog-cal-btn">달력</button>
                                <span class="bb-dlog-date-lbl" id="bb-dlog-date-lbl"></span>
                                <span class="bb-dlog-note" id="bb-dlog-note"></span>
                                <div class="bb-att-cal" id="bb-dlog-cal"></div>
                            </div>
                        </div>
                        <div class="bb-dlog-kpi" id="bb-dlog-kpi"></div>
                        <div class="bb-dlog-sub" id="bb-dlog-sub">배달 내역</div>
                        <div id="bb-dlog-body"></div>
                        <div class="bb-att-legend">진행 중인 배달은 맨 위, 완료 건은 최신순으로 표시됩니다.</div>
                    </div>
                        </div>
                      </div>
                    </div>

                    <!-- 하단 퀵바: 역삼 | 송도 | 성수 | 삼평/서현 (켜진 기체만, 한 줄) -->
                    <div class="bb-quick" id="bb-quick"></div>
                </div>

                <!-- 다중 모니터링 중 기체 — patrol_watch_live.json 을 1분마다 받아 #bb-mm-body 에 카드 렌더 (SECTION 16)
                     ↔ 이석/착석 현황 (SECTION 17): 같은 영역 안에서 좌우 슬라이드 전환. 새로고침하면 항상 다중이 기본 -->
                <div class="bb-mm">
                    <div class="bb-mm-box">
                        <div class="bb-mm-track" id="bb-mm-track">
                            <div class="bb-mm-page" id="bb-mm-page-multi">
                                <div class="bb-mm-head">
                                    <div class="bb-mm-title" id="bb-mm-title">다중 모니터링 기체</div>
                                    <div class="bb-mm-sub" id="bb-mm-sub">불러오는 중…</div>
                                    <button class="bb-mm-nav bb-mm-goatt" id="bb-mm-goatt" title="이석 현황으로 전환"><span class="tx"><span class="l1">이석</span><span class="l2">현황</span></span><span class="ar">»</span></button>
                                </div>
                                <div class="bb-mm-body" id="bb-mm-body"></div>
                                <div class="bb-mm-legend">일정 시간 동안 POI 미변화 시 카드가 점멸합니다.</div>
                            </div>
                            <div class="bb-mm-page" id="bb-mm-page-att">
                                <div class="bb-att-head">
                                    <button class="bb-mm-nav bb-att-back" id="bb-att-back" title="다중 모니터링으로 돌아가기"><span class="ar">«</span><span class="tx"><span class="l1">다중</span><span class="l2">미갱신</span></span></button>
                                    <div class="bb-att-title" id="bb-att-title">이석 현황</div>
                                    <div class="bb-att-r2" id="bb-att-r2">
                                        <button class="bb-mm-nav bb-att-mbtn" id="bb-att-today" title="실시간 현황으로 돌아가기">오늘</button>
                                        <button class="bb-mm-nav bb-att-mbtn" id="bb-att-cal-btn" title="이전달/이번달 날짜 선택">달력</button>
                                        <span class="bb-att-stat" id="bb-att-stat"></span>
                                    </div>
                                    <button class="bb-mm-nav" id="bb-att-detailbtn" title="월별 근무자 누적 통계"><span class="tx"><span class="l1">누적</span><span class="l2">통계</span></span></button>
                                    <div class="bb-att-cal" id="bb-att-cal"></div>
                                </div>
                                <div class="bb-att-body" id="bb-att-body"></div>
                                <div class="bb-att-legend">이석 중이면 카드에 빨간 테두리가 표시됩니다.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- [주석처리: 기타 배달 기체] — 필요 시 이 주석만 풀면 복구 (.bb-quick 아래에 배치)
            <div class="bb-bottom">
                <div class="bb-delivery-area">
                    <div class="bb-delivery-title">기타 배달 기체</div>
                    <div class="bb-delivery-chips" id="bb-delivery-chips"></div>
                </div>
            </div>
            -->

        </div>

        <!-- 알림 상세 패널 -->
        <div id="bb-alert-panel">
            <div class="bb-ap-hd">
                <div class="bb-ap-title" id="bb-ap-title">🚨 상태 이상 알림</div>
                <div class="bb-ap-close" id="bb-ap-close">✕</div>
            </div>
            <div id="bb-ap-body">
                <div class="bb-ap-empty">이상 없음 ✓</div>
            </div>
        </div>

        <!-- 기체 Info 패널 -->
        <div id="bb-info-card-panel">
            <div class="bb-icp-hd">
                <div class="bb-icp-title" id="bb-icp-title">기체 정보</div>
                <div class="bb-icp-badge ok" id="bb-icp-badge">정상</div>
                <div class="bb-icp-close" id="bb-icp-close">✕</div>
            </div>
            <div id="bb-icp-body"></div>
        </div>

        <!-- 이석 로그 창(카드 클릭) / 상세 로그 창(월별 통계) — SECTION 17 -->
        <div id="bb-att-pop"></div>
        <div id="bb-att-detail">
            <div class="bb-att-dh">
                <div class="t" id="bb-att-dtitle">자세히</div>
                <select id="bb-att-dsel"></select>
                <input type="search" class="sr" id="bb-att-search" placeholder="이름 검색" autocomplete="off" spellcheck="false" title="이름을 입력하면 그 근무자만 표시 (월을 바꾸거나 창을 닫았다 열어도 유지 · 새로고침하면 초기화)">
                <div class="mgb" id="bb-att-mgb"><button type="button" data-name="안혜림" title="안혜림 로그만 보기 (다시 누르면 해제)">안</button><button type="button" data-name="박수연" title="박수연 로그만 보기 (다시 누르면 해제)">박</button><button type="button" data-name="신지섭" title="신지섭 로그만 보기 (다시 누르면 해제)">신</button></div>
                <div class="x" id="bb-att-dclose">✕</div>
            </div>
            <div class="bb-att-dnote" id="bb-att-dnote"></div>
            <div class="bb-att-db" id="bb-att-dbody"></div>
        </div>
        <div id="bb-att-plog"></div>
    `;
    document.body.appendChild(wrap);

    const bbEl = document.getElementById('bb');
    // 다크모드는 삭제됨 → 항상 라이트. (#bb-theme-btn 은 아래 '카드 배터리바 표기 방식' 버튼으로 재활용)
    const applyBbTheme = () => {
		bbEl.classList.add('bb-light');
		document.getElementById('bb-alert-panel').classList.add('bb-light');
		document.getElementById('bb-info-card-panel').classList.add('bb-light');
		document.getElementById('bb-alertlog-all-panel').classList.add('bb-light');
	};
    applyBbTheme();

    // 라이트모드 배경 테마 순환: 구름(기본) → 노을 → 벚꽃 → 구름 ...
    const LIGHT_THEME_LABELS = { cloud: '☁️', sunset: '🌇', blossom: '🌸' };                       // 버튼에는 이모지만
    const LIGHT_THEME_NAMES  = { cloud: '구름', sunset: '노을', blossom: '벚꽃' };                 // 툴팁용 이름
    const LIGHT_THEME_ORDER  = ['cloud', 'sunset', 'blossom'];
    const applyLightTheme = () => {
        const t = localStorage.getItem('bb_light_theme') || 'cloud';
        bbEl.classList.toggle('theme-sunset', t === 'sunset');
        bbEl.classList.toggle('theme-blossom', t === 'blossom');
        const ltBtn = document.getElementById('bb-lighttheme-btn');
        ltBtn.textContent = LIGHT_THEME_LABELS[t];
        ltBtn.title = `배경 테마: ${LIGHT_THEME_NAMES[t]} (클릭: 다음 테마)`;
    };
    applyLightTheme();
    document.getElementById('bb-lighttheme-btn').addEventListener('click', () => {
        const cur = localStorage.getItem('bb_light_theme') || 'cloud';
        const next = LIGHT_THEME_ORDER[(LIGHT_THEME_ORDER.indexOf(cur) + 1) % LIGHT_THEME_ORDER.length];
        localStorage.setItem('bb_light_theme', next);
        applyLightTheme();
    });


    // 카드 배터리바 표기 방식 (☁️ 테마 버튼 왼쪽 버튼): 🟩 기본 = 카드 전체가 배터리바 ↔ 🔋 = 카드 오른쪽 작은 배터리바 (선택은 로컬 스토리지 'bb_batt_mode' 에 저장. 저장된 값이 없으면 카드 전체 모드)
    const BATT_MODE_KEY = 'bb_batt_mode';
    const isWideBatt = () => { try { return localStorage.getItem(BATT_MODE_KEY) !== 'small'; } catch { return true; } };
    const applyBattMode = () => {
        const wide = isWideBatt();
        bbEl.classList.toggle('bb-wbatt', wide);
        const btn = document.getElementById('bb-theme-btn');
        btn.textContent = wide ? '🟩' : '🔋';
        btn.title = wide ? '카드 배터리 표시: 카드 전체가 배터리바 (클릭: 오른쪽 작은 배터리바로)' : '카드 배터리 표시: 오른쪽 작은 배터리바 (클릭: 카드 전체를 배터리바로)';
    };
    applyBattMode();
    document.getElementById('bb-theme-btn').addEventListener('click', () => {
        try { localStorage.setItem(BATT_MODE_KEY, isWideBatt() ? 'small' : 'wide'); } catch {}
        applyBattMode();
    });

    // ============================================================
    // SECTION 1. 상수 & 상태
    // ============================================================
    const MAX = 80;   // 기체 카드(즐겨찾기 + 일반) 최대 80대
    const LS = 'bb_ids';
    const LS_FAV = 'bb_fav_ids';   // 즐겨찾기(1열) 기체 — ids 와 겹치지 않음
    const LS_ZOMBIE = 'bb_zombie';

    const STL = { charging:'충전 중', patrolling:'순찰 중', delivering:'배달 중', standby:'대기 중', docking:'도킹 중', off:'OFF' };
    const STI = { charging:'🟢', patrolling:'🔵', delivering:'🩷', standby:'⚪', docking:'🟡', off:'⚫' };
    const BADGE_ICON = { charging:'⚡', patrolling:'🚶', delivering:'📦', standby:'💤', docking:'🅿️', off:'⏻' };

    const DELIVERY_TYPES = ['ALL', 'OPENAPI_DELIVERY', 'NB_ORDER_DELIVERY', 'DELIVERY'];
    const FORCE_PATROL_SITE_IDS = [24];   // 삼성인력개발원
	const DELIVERY_SITE_IDS = [25,27,44,47,48,53,56,65,86,109,118,141,171,180,207,241,250,256,265];

    // ============================================================
    // 기체별 순찰/배달 지정 (사이트 기본 분류보다 항상 우선)
    //  - 순찰·배달 겸용 사이트(예: 250)처럼, 사이트 단위 분류로는 맞지 않는 기체만 여기에 적는다.
    //  - 키 = 기체 id (이름이 바뀌어도 변하지 않음), 값 = 'delivery'(배달 기체 그리드) | 'patrol'(순찰 기체 그리드)
    //  - 여기에 없는 기체는 기존 규칙(FORCE_PATROL_SITE_IDS / serviceType / DELIVERY_SITE_IDS) 그대로
    //  - 예)  '12345': 'delivery',   // 250 ○○ 1호기
    //         '12346': 'patrol',     // 250 ○○ 2호기
    // ============================================================
    const ROBOT_KIND_OVERRIDE = {
        // 여기에 기체 id를 추가하세요
    };
    // → 'delivery' | 'patrol' | null(지정 없음). raw 객체 또는 기체 id(문자열/숫자) 모두 받음
    function kindOverride(rawOrId) {
        const id = (rawOrId && typeof rawOrId === 'object') ? rawOrId.id : rawOrId;
        const k = ROBOT_KIND_OVERRIDE[String(id)];
        return (k === 'delivery' || k === 'patrol') ? k : null;
    }

    // [주석처리: 퀵바/기타 배달] const QUICK_SITE_IDS = [109, 65, 56, 44, 86];
    // [주석처리: 퀵바/기타 배달] const OTHER_DELIVERY_SITE_IDS = DELIVERY_SITE_IDS.filter(id => !QUICK_SITE_IDS.includes(id));

    const SITE_IDS = [
        24,27,36,37,44,46,47,48,51,53,56,57,
        65,66,72,75,82,86,105,108,109,111,117,118,126,131,
        132,134,137,138,140,141,142,143,144,145,146,150,151,171,
        177,178,179,180,181,182,187,193,196,202,203,207,214,216,224,230,235,240,241,244,245,246,247,250,256,257,265
    ];

    // ============================================================
    // 통합 리스트 이전용 상수
    //  - 예전 "고정 그리드(무선 기체 사이트)"는 사이트별로 자동 표시되던 영역이었음.
    //  - 지금은 화면에 그룹/사이트 개념이 없고 모든 기체가 ids 하나로 관리됨.
    //  - 이 배열은 "예전에 자동 표시되던 사이트의 기체"를 ids에 1회 편입(migrateLegacyFixed)할 때만 사용.
    // ============================================================
    const LS_UNIFIED = 'bb_unified_v1';
    const LEGACY_FIXED_SITE_IDS = [142, 145, 144, 143, 150, 151, 180, 193, 132, 137];

    // 상태별 색상 (리스트 행 + 배터리 증감 그래프 공용)
    const STATUS_AC = {
        charging:'var(--gn)', patrolling:'var(--bl)', standby:'var(--standby-batt)',
        off:'var(--offdot)', delivering:'var(--pk)', docking:'var(--ye)',
    };

    // 제목 아래 범례 — STL(이름) / STATUS_AC(색)과 같은 값을 써서 실제 화면 색과 항상 일치
    (function renderLegend() {
        const el = document.getElementById('bb-legend');
        if (!el) return;
        ['charging', 'patrolling', 'delivering', 'standby', 'docking', 'off'].forEach(k => {
            const item = document.createElement('span'); item.className = 'bb-legend-item';
            const dot = document.createElement('i');   dot.className = 'bb-legend-dot'; dot.style.background = STATUS_AC[k];
            item.append(dot, document.createTextNode(STL[k]));
            el.appendChild(item);
        });
    })();

    // 하단 퀵바 그룹 — keywords가 기체명에 포함되면 해당 그룹. 켜진 기체만 표시.
    const MONITOR_GROUPS = [
        { id:'yeoksam',  label:'역삼',     full:'역삼 요기요',    keywords:['역삼동'] },
        { id:'songdo',   label:'송도',     full:'송도 요기요',    keywords:['송도 신도시'] },
        { id:'seongsu',  label:'성수',     full:'성수 요기요',    keywords:['성수동'] },
        { id:'seongnam', label:'삼평/서현', full:'성남 삼평/서현', keywords:['성남형'] },
    ];

    const CAM_LABELS = {
        isOnCamF:  'F(전면)',
        isOnCamFd: 'Fd(하단)',
        isOnCamFl: 'Fl(전면 좌측)',
        isOnCamFr: 'Fr(전면 우측)',
        isOnCamBl: 'Bl(후면 좌측)',
        isOnCamBr: 'Br(후면 우측)',
    };

    let DB = [];
    let ids = load();
    let favIds = loadFav().filter(id => !ids.includes(id));
    const FAV_MAX = 20;   // 즐겨찾기는 최대 20대 (20대 + 하단 안내 문구까지 한 화면에 들어가도록 세로 공간을 잡아 둠)
    // 20대를 넘긴 즐겨찾기(예: 저장된 값, 백업 복원)는 초과분을 일반 목록 앞쪽으로 옮김. 옮긴 대수를 반환
    function clampFav() {
        if (favIds.length <= FAV_MAX) return 0;
        const overflow = favIds.splice(FAV_MAX);
        ids = [...overflow, ...ids];
        return overflow.length;
    }
    // 카드 총 개수가 MAX(80대)를 넘으면 일반 목록의 뒤쪽부터 뺌 (기체 데이터 자체는 그대로, 필요하면 검색해서 다시 추가). 뺀 대수를 반환
    function clampTotal() {
        const over = ids.length + favIds.length - MAX;
        if (over <= 0) return 0;
        ids.splice(ids.length - over, over);
        return over;
    }
    let _trimNotice = 0;   // 시작할 때 목록을 줄였다면 그 대수 (화면이 뜬 뒤 한 번 안내)
    {
        const movedFav = clampFav();
        _trimNotice = clampTotal();
        if (movedFav || _trimNotice) save();
    }
        const LIST_COLS = 3;   // CSS(.bb-list)의 열 수와 맞출 것 (4열 중 1열은 즐겨찾기)
    const ROW_H = 33;      // 카드 한 줄 높이(px) — CSS .bb-row 와 같게
    const MAIN_ROWS = 20;  // (현재 미사용 — 더 이상 최소 행수를 강제하지 않음. 예전엔 즐겨찾기 열과 높이를 맞추는 데 썼음)
    let rmMode = false, rmSet = new Set(), isOpen = false;
    let fetchLock = false;
    let lastRaw = [];
    let topmostZ = 100000000;
    let currentAlertType = null;
    let _patrolReady = false;   // SECTION 16(다중 모니터링) 초기화 끝난 뒤 true
    let currentAlerts = [];
    // 정렬 / 열 분류 설정 (render() 가 열 때 바로 쓰므로 여기서 먼저 선언)
    const SORT_MODE_KEY = 'bb_sort_mode';
    let _sortMode = 'name';   // 'name' = 이름 순 / 'status' = 상태별
    try { if (localStorage.getItem(SORT_MODE_KEY) === 'status') _sortMode = 'status'; } catch {}
    // 이름 순 정렬 예외: 아래 묶음의 기체는 정렬해도 항상 '이 순서대로' 붙어 있음 (묶음 전체는 묶음 안에서 이름이 가장 앞서는 기체의 자리에 놓임)
    //   기체명 비교는 공백을 빼고 전각 문자(예: '１')를 반각으로 바꾼 값으로 하므로 띄어쓰기/전각 차이에 영향받지 않음. 묶음을 추가/수정하려면 여기만 고치면 됨.
    const SORT_PINNED_GROUPS = [
        ['배송 띠띠', '순찰 띠띠'],
        ['두비', '달비'],
        ['성남시 판교역 1호기', '성남시 서현역 1호기', '성남시 율동공원 1호기', '성남시 야탑역 1호기'],
    ];
    const sortNormName = n => String(n || '').normalize('NFKC').replace(/\s+/g, '');
    const sortPinInfo = (() => {   // 정규화한 기체명 → { rep: 묶음 대표 이름(묶음 내 이름순 최상위), idx: 묶음 내 순서 }
        const m = new Map();
        SORT_PINNED_GROUPS.forEach(g => {
            const rep = [...g].sort((x, y) => x.localeCompare(y, 'ko', { numeric: true }))[0];
            g.forEach((n, idx) => m.set(sortNormName(n), { rep, idx }));
        });
        return m;
    })();

    const sortStatusRank = { charging: 0, docking: 1, standby: 2, off: 3 };   // 상태별 정렬 순서: 충전 중 → 도킹 중 → 대기 중 → OFF (그 밖은 맨 뒤)
    function nameCmp(a, b) {   // 기체 객체 비교: 이름 순 (SORT_PINNED_GROUPS 묶음은 항상 지정한 순서로 붙어 있음)
        const pa = sortPinInfo.get(sortNormName(a.name)), pb = sortPinInfo.get(sortNormName(b.name));
        const c = (pa ? pa.rep : a.name).localeCompare(pb ? pb.rep : b.name, 'ko', { numeric: true });   // 1호기 < 2호기 < 10호기
        if (c !== 0) return c;
        if (pa && pb) return pa.idx - pb.idx;
        return a.name.localeCompare(b.name, 'ko', { numeric: true });
    }
    function statusCmp(a, b) { return ((sortStatusRank[a.status] ?? 4) - (sortStatusRank[b.status] ?? 4)) || nameCmp(a, b); }
    // 열 분류 예외: 이 기체는 순찰 중/배달 중이어도 해당 열에 넣지 않음 ('그 외' 또는 즐겨찾기 열에 표시)

    function loadDismissed() {
        try {
            const saved = JSON.parse(localStorage.getItem('bb_dismissed') || '[]');
            const cutoff = Date.now() - 6 * 60 * 60 * 1000;
            const valid = saved.filter(item => item.time > cutoff);
            localStorage.setItem('bb_dismissed', JSON.stringify(valid));
            return new Set(valid.map(item => item.key));
        } catch { return new Set(); }
    }
    const dismissedAlerts = loadDismissed();

    // ============================================================
    // SECTION 2. localStorage 헬퍼
    // ============================================================
    function load() {
        try {
            const s = localStorage.getItem(LS);
            if (!s) return [];
            const p = JSON.parse(s);
            return Array.isArray(p) ? p : [];
        } catch { return []; }
    }
    function loadFav() {
        try {
            const p = JSON.parse(localStorage.getItem(LS_FAV) || '[]');
            return Array.isArray(p) ? p : [];
        } catch { return []; }
    }
    function save() {
        localStorage.setItem(LS, JSON.stringify(ids));
        localStorage.setItem(LS_FAV, JSON.stringify(favIds));
    }
    function loadZombie()  { try { return JSON.parse(localStorage.getItem(LS_ZOMBIE) || '{}'); } catch { return {}; } }
    function saveZombie(d) { localStorage.setItem(LS_ZOMBIE, JSON.stringify(d)); }

    // ============================================================
    // SECTION 3. 파싱
    // ============================================================
    function parseRobotStatus(raw) {
        const rs = raw.robotStatus ?? {};
        const battery = raw.battery ?? rs.battery ?? 0;
        let status;
        if (!rs.isConnecting) {
            status = 'off';
        } else if (rs.isCharging || rs.isWirelessChargerConnected) {
            status = 'charging';
        } else if (rs.isOnWirelessChargerDock) {
            status = 'docking';
        } else if (kindOverride(raw) === 'patrol') {   // 기체별 지정(순찰)
			status = raw.currentScenario ? 'patrolling' : 'standby';
		} else if (kindOverride(raw) === 'delivery') {   // 기체별 지정(배달)
			status = raw.currentScenario ? 'delivering' : 'standby';
        } else if (FORCE_PATROL_SITE_IDS.includes(raw.site?.id) || ['PATROL','OPENAPI_PATROL'].includes(raw.service?.serviceType)) {
			status = raw.currentScenario ? 'patrolling' : 'standby';
		} else if (DELIVERY_TYPES.includes(raw.service?.serviceType)) {
			status = raw.currentScenario ? 'delivering' : 'standby';
		} else {
            status = 'standby';
        }
        return { battery: Math.round(battery), status };
    }

    // ============================================================
    // SECTION 4. 알림 감지
    // ============================================================
    function fmt(isoStr) {
        if (!isoStr) return '-';
        const d = new Date(isoStr);
        const p = x => String(x).padStart(2,'0');
        return `${p(d.getMonth()+1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
    }
    function minAgo(isoStr) {
        if (!isoStr) return 9999;
        return Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000);
    }
    function alertKey(type, id) { return `${type}::${id}`; }

    function detectAlerts(rawList) {
        const alerts = [];
        const rawAlertSignals = [];   // 알림 로그용 — dismiss 여부와 무관한 실제 발생 여부
        const now = Date.now();
        const zombie = loadZombie();

        function clearDismiss(key) {
            if (!dismissedAlerts.has(key)) return;
            dismissedAlerts.delete(key);
            try {
                const saved = JSON.parse(localStorage.getItem('bb_dismissed') || '[]');
                localStorage.setItem('bb_dismissed', JSON.stringify(saved.filter(i => i.key !== key)));
            } catch {}
        }

        rawList.forEach(raw => {
            const id   = String(raw.id);
            const name = raw.nickname || raw.name || id;
            const rs   = raw.robotStatus ?? {};
            const { status, battery } = parseRobotStatus(raw);
            const _ko = kindOverride(raw);   // 기체별 지정이 있으면 사이트 기본 분류보다 우선
            const isDelivery = _ko ? _ko === 'delivery' :
				(!FORCE_PATROL_SITE_IDS.includes(raw.site?.id) &&
				(DELIVERY_TYPES.includes(raw.service?.serviceType) ||
				 DELIVERY_SITE_IDS.includes(raw.site?.id)));

            // ── 기능1: 대기중 방치 (배터리 50% 미만인 경우에만)
            if (!isDelivery && status === 'standby') {
                const mins = minAgo(rs.lastOperatedAt);
                if (battery < 50) {
                    const key = alertKey('standby', id);
                    if (!dismissedAlerts.has(key)) alerts.push({
                        key, type:'idle', dot:'bl', name,
                        desc:`대기중 ${mins}분 | 배터리 ${battery}% | 마지막 조작: ${rs.lastOperatedUserName || '없음'} ${fmt(rs.lastOperatedAt)}`,
                        time: fmt(new Date().toISOString())
                    });
                } else {
                    clearDismiss(alertKey('standby', id));
                }
            } else {
                clearDismiss(alertKey('standby', id));
            }

            // ── 기능2: 도킹 이상
            if (status === 'docking') {
                const key = alertKey('docking', id);
                if (!dismissedAlerts.has(key)) alerts.push({
                    key, type:'dock', dot:'ye', name,
                    desc:`무선 도크 위에 있으나 충전 안 됨 | 확인 필요`,
                    time: fmt(new Date().toISOString())
                });
            } else {
                clearDismiss(alertKey('docking', id));
            }

            // ── 기능3: 배터리 21% 이하
            if (rs.isConnecting && battery > 0 && battery <= 21) {
                const key = alertKey('battery', id);
                if (!dismissedAlerts.has(key)) alerts.push({
                    key, type:'bat', dot:'ye', name,
                    desc:`배터리 ${battery}% | ${STL[status]}`,
                    time: fmt(new Date().toISOString())
                });
            } else {
                clearDismiss(alertKey('battery', id));
            }

            // ── 기능4: 좀비 상태
            {
                const isZombie =
                    rs.isConnecting === true &&
                    !raw.battery &&
                    (rs.navpvtHorzAccuracy == null || rs.navpvtHorzAccuracy === 0) &&
                    !rs.velocity;
                if (isZombie) {
                    if (!zombie[id]) zombie[id] = { count: 1, firstSeen: now };
                    else zombie[id].count++;
                } else {
                    delete zombie[id];
                    clearDismiss(alertKey('zombie', id));
                }
                if (zombie[id] && zombie[id].count >= 4) {
                    const key = alertKey('zombie', id);
                    rawAlertSignals.push({ id, name, type: 'zombie' });
                    if (!dismissedAlerts.has(key)) {
                        const mins = Math.floor((now - zombie[id].firstSeen) / 60000);
                        alerts.push({
                            key, type:'zombie', dot:'rd', name,
                            desc:`⚠️ 좀비 추정 ${mins}분째 | 현장 재부팅 필요`,
                            time: fmt(new Date().toISOString())
                        });
                    }
                }
            }

            // ── 기능5: 카메라 미노출 감지
            if (rs.isConnecting) {
                const anyCamOn = Object.keys(CAM_LABELS).some(k => rs[k] === true);
                if (anyCamOn) {
                    const offCams = Object.entries(CAM_LABELS)
                        .filter(([k]) => rs[k] === false)
                        .map(([, label]) => label);
                    if (offCams.length > 0) {
                        const key = alertKey('cam', id);
                        rawAlertSignals.push({ id, name, type: 'cam' });
                        if (!dismissedAlerts.has(key)) alerts.push({
                            key, type:'cam', dot:'or', name,
                            desc:`캠 미노출: ${offCams.join(', ')}`,
                            time: fmt(new Date().toISOString())
                        });
                    } else {
                        clearDismiss(alertKey('cam', id));
                    }
                }
            } else {
                clearDismiss(alertKey('cam', id));
            }

            // ── 기능6: 미니맵 위치 미노출 감지
            {
                const gpsZero =
                    rs.isConnecting === true &&
                    raw.battery > 0 &&
                    (rs.navpvtHorzAccuracy === 0 || rs.navpvtHorzAccuracy == null);

                if (gpsZero) {
                    if (!zombie[id + '_gps']) zombie[id + '_gps'] = { count: 1, firstSeen: now };
                    else zombie[id + '_gps'].count++;
                } else {
                    delete zombie[id + '_gps'];
                    clearDismiss(alertKey('nomap', id));
                }
                if (zombie[id + '_gps'] && zombie[id + '_gps'].count >= 4) {
                    const key = alertKey('nomap', id);
                    rawAlertSignals.push({ id, name, type: 'nomap' });
                    if (!dismissedAlerts.has(key)) alerts.push({
                        key, type:'nomap', dot:'or', name,
                        desc:`GPS 수신값 0 — 재부팅 조치 필요`,
                        time: fmt(new Date().toISOString())
                    });
                }
            }

        });

        saveZombie(zombie);
        window._bbAlerts = alerts;
        window._bbAlertLogRaw = rawAlertSignals;
        alertLogRecord(rawAlertSignals);
        return alerts;
    }

    // ============================================================
    // SECTION 5. 알림 칩 + 패널 렌더
    // ============================================================
    const ALERT_META = {
        bat:    { label:'🔋 배터리',      order:0 },
        dock:   { label:'🟡 도킹',        order:1 },
        zombie: { label:'👻 좀비',        order:2 },
        idle:   { label:'⏳ 방치',        order:3 },
        cam:    { label:'🎥 캠 미송출',   order:4 },
        nomap:  { label:'🗺️ GPS 수신', order:5 },
    };

    // 화면에 버튼으로 띄우는 알림 6종: 배터리 / 도킹 / 좀비 / 방치 / 캠 미송출 / GPS 수신 (비상정지 알림은 삭제됨)
    // 알림 영역은 2열 × 3줄 = 최대 6칸 — 6종이 모두 떠도 잘리지 않고 정확히 들어간다
    const ALERT_CHIP_TYPES = ['bat', 'dock', 'zombie', 'idle', 'cam', 'nomap'];

    function renderAlertChips(alerts) {
        currentAlerts = alerts;
        const el = document.getElementById('bb-alert-chips');
        if (!el) return;

        const groups = {};
        alerts.filter(a => ALERT_CHIP_TYPES.includes(a.type)).forEach(a => {
            if (!groups[a.type]) groups[a.type] = [];
            groups[a.type].push(a);
        });

        const types = Object.keys(groups).sort((a,b) =>
            (ALERT_META[a]?.order ?? 9) - (ALERT_META[b]?.order ?? 9)
        );

        if (!types.length) {
            el.innerHTML = '<span class="bb-chip-none">기체 이상 알림 없음 ✓</span>';
        } else {
            el.innerHTML = types.map(type => {
                const meta    = ALERT_META[type] || { label: type };
                const items   = groups[type];
                const count   = items.length;
                const preview = count === 1 ? items[0].name : `${items[0].name} 외 ${count - 1}건`;
                return `<div class="bb-chip ${type}" data-type="${type}" title="${items.map(a => a.name).join(', ')}">
                    <span class="bb-chip-l1">${meta.label} <strong>${count}건</strong></span>
                    <span class="bb-chip-l2">${preview}</span>
                </div>`;
            }).join('');

            el.querySelectorAll('.bb-chip[data-type]').forEach(chip => {
                chip.addEventListener('click', () => {
                    const panel = document.getElementById('bb-alert-panel');
                    if (panel.classList.contains('open') && currentAlertType === chip.dataset.type) {
                        panel.classList.remove('open');
                    } else {
                        openAlertPanel(chip.dataset.type, groups);
                    }
                });
            });
        }
    }

    function openAlertPanel(type, groups) {
        const panel = document.getElementById('bb-alert-panel');
        const titleEl = document.getElementById('bb-ap-title');
        const bodyEl  = document.getElementById('bb-ap-body');
        const meta    = ALERT_META[type] || { label: type };
        const items   = groups[type] || [];

        titleEl.textContent = `${meta.label} (${items.length}건)`;
        currentAlertType = type;

        bodyEl.innerHTML = items.length
            ? items.map(a => `
                <div class="bb-ap-item" data-key="${a.key}">
                    <div class="bb-ap-dot ${a.dot}"></div>
                    <div class="bb-ap-info">
                        <div class="bb-ap-name">${a.name}</div>
                        <div class="bb-ap-desc">${a.desc}</div>
                        <div class="bb-ap-time">${a.time ?? ''}</div>
                    </div>
                    <button class="bb-ap-dismiss" data-key="${a.key}">해제</button>
                </div>`).join('')
            : '<div class="bb-ap-empty">이상 없음 ✓</div>';

        bodyEl.querySelectorAll('.bb-ap-dismiss').forEach(btn => {
            btn.addEventListener('click', e => { e.stopPropagation(); dismiss(btn.dataset.key); });
        });
        bodyEl.querySelectorAll('.bb-ap-item').forEach(item => {
            item.addEventListener('contextmenu', e => { e.preventDefault(); dismiss(item.dataset.key); });
        });

        panel.classList.add('open');
        panel.style.zIndex = ++topmostZ;

        const barEl = document.getElementById('bb-alert-bar');
        if (barEl) {
            const r = barEl.getBoundingClientRect();
            const b = bbEl.getBoundingClientRect();   // 전체 보드 영역 (줌 배율 반영)
            const pw = panel.offsetWidth || 552;
            const top = r.bottom + 8;
            // 알림 영역 폭의 중앙에 맞추되, 보드의 왼쪽·오른쪽 끝을 넘지 않도록 (알림 영역이 좁아져 창이 보드 밖으로 나가던 문제)
            const left = Math.max(b.left + 8, Math.min(r.left + r.width / 2 - pw / 2, b.right - pw - 8));
            panel.style.position = 'fixed';
            panel.style.left = left + 'px';
            panel.style.top = top + 'px';
            panel.style.transform = 'none';
            if (b.bottom > top) panel.style.maxHeight = Math.max(200, b.bottom - top - 8) + 'px';   // 아래쪽도 보드 안에서 끝나게
        }
        registerAlertPanelClose();
    }

    let _alertPanelCloseHandler = null, _alertCloseTimer = null;
    function registerAlertPanelClose() {
        const panel = document.getElementById('bb-alert-panel');
        if (_alertPanelCloseHandler) {
            document.removeEventListener('mousedown', _alertPanelCloseHandler);
            _alertPanelCloseHandler = null;
        }
        clearTimeout(_alertCloseTimer);   // 100ms 안에 여러 번 눌러도 리스너가 하나만 등록되게
        _alertCloseTimer = setTimeout(() => {
            _alertPanelCloseHandler = function closeAlert(e) {
                if (!panel.contains(e.target) && !e.target.closest('.bb-chip[data-type]')) {
                    panel.classList.remove('open');
                    document.removeEventListener('mousedown', _alertPanelCloseHandler);
                    _alertPanelCloseHandler = null;
                }
            };
            document.addEventListener('mousedown', _alertPanelCloseHandler);
        }, 100);
    }

    function dismiss(key) {
        dismissedAlerts.add(key);
        try {
            const saved = JSON.parse(localStorage.getItem('bb_dismissed') || '[]');
            saved.push({ key, time: Date.now() });
            localStorage.setItem('bb_dismissed', JSON.stringify(saved));
        } catch {}
        currentAlerts = currentAlerts.filter(a => a.key !== key);

        const itemEl = document.querySelector(`.bb-ap-item[data-key="${key}"]`);
        if (itemEl) itemEl.remove();

        const titleEl = document.getElementById('bb-ap-title');
        if (titleEl && currentAlertType) {
            const meta = ALERT_META[currentAlertType] || { label: currentAlertType };
            const remaining = currentAlerts.filter(a => a.type === currentAlertType).length;
            titleEl.textContent = `${meta.label} (${remaining}건)`;
        }

        renderAlertChips(currentAlerts);

        const remainingInType = currentAlerts.filter(a => a.type === currentAlertType).length;
        if (currentAlerts.length === 0 || remainingInType === 0) {
            document.getElementById('bb-alert-panel').classList.remove('open');
        }
    }

/* [주석처리: 동숲 배경] — 필요 시 이 주석만 풀면 복구
    // ============================================================
    // SECTION 5.5 동숲 배경 - 시간대별 전환 (한국시간 기준)
    // ============================================================
    // 08~10:1  10~12:2  12~14:3  14~16:4  16~18:5
    // 18~20:5  20~22:4  22~24:3  00~02:2  02~08:1
    const CAMPING_HOUR_MAP = [2,2,1,1,1,1,1,1,1,1,2,2,3,3,4,4,5,5,5,5,4,4,3,3];
    let _lastCampingIdx = null;
    function applyCampingBackground() {
        const hour = parseInt(
            new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul', hour: '2-digit', hour12: false }),
            10
        );
        const idx = CAMPING_HOUR_MAP[hour % 24];
        if (idx === _lastCampingIdx) return;
        _lastCampingIdx = idx;
        const area = document.querySelector('.bb-delivery-area');
        if (area) {
            area.style.backgroundImage = `url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/ego_trippin/ac_camping${idx}.webp')`;
        }
    }
*/

    // ============================================================
    // SECTION 6. bb_robots_data 리스너
    // ============================================================
    // 실제 데이터 갱신 주기: 로더(뉴비고 도우미)가 2분마다 이벤트를 쏘도록 이미 바뀌었지만,
    // 혹시 모를 이중 안전장치로 여기서도 최소 UPDATE_INTERVAL_MS(2분)에 한 번만 처리
    const UPDATE_INTERVAL_MS = 2 * 60 * 1000;
    let _lastProcessedAt = 0;
    let _fbReady = false;   // SECTION 17(고정 버튼) 준비 완료 여부
    document.addEventListener('bb_robots_data', function(e) {
        // [수집기 방식] 데이터는 수집기(iframe 응답 읽기)가 보낸다 — NCC API 를 호출하지 않으므로 오프라인 모드와 무관하게 받는다.
        // (수집 중단은 수집기의 bb_collect_pause / 원격 collector_off 로 한다)
        if (fetchLock) return;
        if (Date.now() - _lastProcessedAt < UPDATE_INTERVAL_MS) return;
        _lastProcessedAt = Date.now();
        ns = RS;   // 갱신 카운트다운을 실제 데이터 처리 시점에 맞춰 리셋 (독립적으로 120초를 도는 것과 실제 주기가 조금씩 어긋나던 것 보정 — ns/RS 는 아래 SECTION 8에서 선언되지만, 이 콜백은 초기 실행이 끝난 뒤 이벤트로 나중에 호출되므로 그때는 이미 선언되어 있어 문제없음)
        fetchLock = true;
        try {
            let allRaw;
            try { allRaw = JSON.parse(e.detail); } catch { fetchLock = false; return; }
            lastRaw = allRaw;

            const seenIds = new Set();
            DB = [];
            allRaw.forEach(raw => {
                const id = String(raw.id);
                if (seenIds.has(id)) return;
                seenIds.add(id);
                const parsed = parseRobotStatus(raw);
                const siteId = raw.site?.id;
                DB.push({
                    id, name: raw.nickname || raw.name || id,
                    status: parsed.status, battery: parsed.battery,
                    loading: false, siteId,
                    canDispatch: raw.canDispatch ?? true,
                    raw,  // Info 패널용 원본 데이터
                });
            });
            // 일부 사이트만 받은 데이터(수집기가 data-bb-partial=1 로 표시)면 목록 정리/편입을 건너뛴다 — 못 받은 사이트의 기체가 목록에서 지워지지 않도록
            const _partialData = document.documentElement.getAttribute('data-bb-partial') === '1';
            if (DB.length > 0 && !_partialData) {
                migrateLegacyFixed();   // 구 고정 그리드 기체를 통합 리스트로 1회 편입
                ids = ids.filter(id => DB.some(x => x.id === id));
                favIds = favIds.filter(id => DB.some(x => x.id === id));
                save();
            }

            if (_patrolReady) { try { rebuildPatrolView(); } catch (err) { console.warn('[BB] 다중 모니터링 재구성 실패:', err); } }   // 장기 순찰 기체 카드(SECTION 16)는 NCC 상태가 갱신될 때마다 다시 판단

            logBatteryPattern(DB);
            try { dcUpdateLocal(); } catch (err) { console.error('[BB] 방전 기록 계산 오류:', err); }   // 배터리 로그 → 방전 기록 (로컬 저장, 최근 30일)
            try { sampleChargeBuffer(DB); } catch (err) { console.error('[BB] 충전 관측 오류:', err); }   // 저속충전 계산용 (2분마다 1회 기록)
            wblCyhAutoUploadTick();
            wblOthersAutoDownloadTick();
            alertLogCyhTick();
            alertLogNonCyhTick();
            alertLogDownloadTick();

            const alerts = detectAlerts(allRaw);
            renderAlertChips(alerts);

            if (document.getElementById('bb-alert-panel').classList.contains('open') && currentAlertType) {
                const groups = {};
                alerts.forEach(a => {
                    if (!groups[a.type]) groups[a.type] = [];
                    groups[a.type].push(a);
                });
                openAlertPanel(currentAlertType, groups);
            }

            renderMonitorGrid(allRaw);   // 하단 퀵바
            if (_fbReady && isOpen) refreshFixedTools();   // 고정 버튼 3종: 배지 + 열려 있는 목록 창 (2분마다, 보드가 열려 있을 때만 — 닫혀 있으면 열 때 계산)
            // [주석처리: 기타 배달/동숲]
            // renderDeliveryChips(allRaw);
            // applyCampingBackground();

            if (isOpen) {
                render();
                if (document.activeElement === document.getElementById('bb-si')) showDd();
            }
        } catch(err) {
            console.error('[BB] 처리 오류:', err);
        } finally {
            fetchLock = false;
        }
    });

    // ============================================================
    // SECTION 7. 열기/닫기
    // ============================================================
    function openBoard() {
        isOpen = true;
        document.getElementById('bb').classList.add('open');
        render();
        renderMonitorGrid(lastRaw);   // 하단 퀵바
        if (_fbReady) refreshFixedTools();
        // [주석처리: 기타 배달]
        // renderDeliveryChips(lastRaw);
        if (_patrolReady) refreshPatrolLive();   // 다시 열면 즉시 최신 정보로
        if (_attReady) attOnOpen();   // 이석 화면을 보고 있었다면 즉시 최신 정보로 (SECTION 17)
    }
    function closeBoard() {
        isOpen = false;
        document.getElementById('bb').classList.remove('open');
        window.__bbIvSpClose?.();   // 개입 통계 팝업 (SECTION 18)
        window.__bbDlSpClose?.();   // 배달 누적 통계 팝업 (SECTION 19)
        document.getElementById('bb-alert-panel').classList.remove('open');
        // (기체 정보 창은 보드를 닫아도 유지 — 창의 ✕ 로만 닫음)
        if (rmMode) { rmMode = false; rmSet.clear(); updateRmUI(); }
        hideDd();
        if (_attReady) attCloseFloating();   // 이석 로그/달력/상세 로그 창도 함께 닫음 (SECTION 17)
    }

    // 근태(Pointless) 페이지에서는 자동으로 열지 않음
    if (!/\/awayboard\.html/i.test(location.pathname)) {
        openBoard();
    }

    document.addEventListener('keydown', e => {
        if (!e.altKey || e.code !== 'KeyZ') return;
        e.preventDefault();
        const h = location.host;
        const allowed =
            ((h === 'go.neubie.ai' || h.endsWith('.neubility.ai')) && location.pathname.includes('/ko/notification')) ||
            h.endsWith('vercel.app');
        if (!allowed) return;
        isOpen ? closeBoard() : openBoard();
    });

    // ============================================================
    // SECTION 8. 시계 & 카운트다운
    // ============================================================
    function tick() {
        const n = new Date(), p = x => String(x).padStart(2,'0');
        const el = document.getElementById('bb-clk');
        if (el) el.textContent = `${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}`;
    }
    setInterval(tick, 1000); tick();

    const RS = 120; let ns = RS;
    setInterval(() => {
        ns--;
        if (ns <= 0) ns = RS;
        bbSyncOffline();
        const _off = false;   // [수집기 방식] 오프라인 모드여도 갱신은 계속되므로 '갱신 중단' 문구를 띄우지 않는다
        const m = Math.floor(ns / 60), s = ns % 60;
        const el = document.getElementById('bb-ref');
        if (_off) { if (el) el.textContent = '🔌 오프라인 · NCC 갱신 중단'; return; }
        if (el) el.textContent = m > 0 ? `${m}분 ${String(s).padStart(2,'0')}초 후 갱신` : `${s}초 후 갱신`;
    }, 1000);

    // ============================================================
    // SECTION 8b. 하단 퀵바 렌더 — 한 줄에 4개 그룹, 켜진 기체만 동그라미로 표시
    //   동그라미 색 = 현재 상태(충전/순찰/배달/대기/도킹), 숫자 = 호기, 마우스 올리면 기체명 | 상태
    // ============================================================
    function renderMonitorGrid(rawList) {
        const el = document.getElementById('bb-quick');
        if (!el) return;
        el.innerHTML = '';

        const nameOf = r => r.nickname || r.name || '';
        const numOf  = r => parseInt(nameOf(r).match(/(\d+)호기/)?.[1] || '0', 10);

        MONITOR_GROUPS.forEach(group => {
            const onRobots = rawList
                .filter(r => group.keywords.some(kw => nameOf(r).includes(kw)))
                .sort((a, b) => numOf(a) - numOf(b))
                .filter(r => parseRobotStatus(r).status !== 'off');

            const line = document.createElement('div');
            line.className = 'bb-qline';
            line.innerHTML = `<div class="bb-qline-title" title="${group.full || group.label}">${group.label}</div>`;

            const circles = document.createElement('div');
            circles.className = 'bb-qline-circles';
            if (onRobots.length === 0) {
                circles.innerHTML = '<span class="bb-qline-none">모든 기체 OFF</span>';
            }
            onRobots.forEach((r, i) => {
                const parsed = parseRobotStatus(r);
                const c = document.createElement('div');
                c.className = `bb-mi ${parsed.status}`;
                c.title = `${nameOf(r)} | ${STL[parsed.status]}`;
                c.textContent = nameOf(r).match(/(\d+)호기/)?.[1] || (i + 1);
                c.style.cursor = 'pointer';
                c.addEventListener('click', () => {   // 퀵바 동그라미 클릭 → 그 기체의 Info 패널 (카드 목록에 없어도 열림)
                    const rec = DB.find(x => x.id === String(r.id));
                    if (rec) openInfoCardPanel(rec);
                });
                circles.appendChild(c);
            });
            line.appendChild(circles);
            el.appendChild(line);
        });
    }

/* [주석처리: 기타 배달 칩 렌더(동숲 영역)] — 필요 시 이 주석만 풀면 복구
    // SECTION 8c. 기타 배달 칩 렌더
    function renderDeliveryChips(rawList) {
        const el = document.getElementById('bb-delivery-chips');
        if (!el) return;
        const others = rawList.filter(r => {
            const siteId = r.site?.id;
            const parsed = parseRobotStatus(r);
            return OTHER_DELIVERY_SITE_IDS.includes(siteId) && parsed.status === 'delivering';
        });
        if (!others.length) {
            el.innerHTML = '<span class="bb-delivery-empty">기타 배달 없음</span>';
            return;
        }
        el.innerHTML = others.map(r =>
            `<div class="bb-delivery-chip">🩷 ${r.nickname || r.name}</div>`
        ).join('');
    }
*/

    // ============================================================
    // SECTION 9. 기체 리스트 렌더 (통합 그리드: 한 줄 = 기체 1대)
    // ============================================================

    // 예전 고정 그리드 사이트의 기체를 ids 앞쪽에 편입 (이미 있는 기체는 건너뜀)
    function prependLegacyFixed() {
        const order = s => { const i = LEGACY_FIXED_SITE_IDS.indexOf(s); return i === -1 ? 999 : i; };
        const num = n => parseInt((n.match(/(\d+)호기/) || [])[1] || '0', 10);
        const legacy = DB.filter(r => LEGACY_FIXED_SITE_IDS.includes(r.siteId) && !ids.includes(r.id) && !favIds.includes(r.id))
            .sort((a, b) => (order(a.siteId) - order(b.siteId)) || (num(a.name) - num(b.name)))
            .map(r => r.id);
        if (legacy.length) ids = [...legacy, ...ids];
    }

    // 업데이트 직후 최초 1회만 실행 — 이후에는 사용자가 지운 기체가 되살아나지 않음
    function migrateLegacyFixed() {
        if (localStorage.getItem(LS_UNIFIED) === '1') return;
        prependLegacyFixed();
        save();
        localStorage.setItem(LS_UNIFIED, '1');
    }

    function render() {
        const list = document.getElementById('bb-list');
        const fav  = document.getElementById('bb-fav');
        const colD = document.getElementById('bb-col-deliv');
        if (!list || !fav || !colD) return;
        const pick = arr => arr.map(id => DB.find(x => x.id === id)).filter(Boolean);
        const favRobots = pick(favIds);
        const robots    = pick(ids);
        // 기체 종류로 자동 분류: 배달 기체 = DELIVERY_SITE_IDS 사이트 → 4열 / 그 외는 모두 순찰 기체 → 2·3열
        // 제외: 하단 퀵바 기체(MONITOR_GROUPS 키워드)는 이 열들에 표시·집계하지 않음 (제주 기체는 순찰 기체로 취급). 즐겨찾기는 항상 1열
        const inName = (r, kws) => kws.some(k => String(r.name).includes(k));
        const skip = r => MONITOR_GROUPS.some(g => inName(r, g.keywords));
        const isD = r => { const k = kindOverride(r.id); return k ? k === 'delivery' : DELIVERY_SITE_IDS.includes(r.siteId); };   // 기체별 지정 > 사이트 기본
        const cmp = _sortMode === 'status' ? statusCmp : nameCmp;   // 모든 열 공통 정렬 (이름순 ↔ 상태별)
        const favHere = favRobots.slice().sort(cmp);
        const shown = robots.filter(r => !skip(r));
        // 열 안에서는 그 열의 본업 기체(순찰 열 = 순찰 중, 배달 열 = 배달 중)가 항상 맨 앞 → 나머지는 선택한 정렬(이름순/상태별)
        const first = st => (x, y) => ((y.status === st) - (x.status === st)) || cmp(x, y);
        const deliveryRobots = shown.filter(isD).sort(first('delivering'));
        const otherRobots = shown.filter(r => !isD(r)).sort(first('patrolling'));

        const bodies = [fav, colD, list];
        const keep = bodies.map(el => el.scrollTop);   // 2분마다 다시 그려도 보던 스크롤 위치 유지
        fav.replaceChildren(...favHere.map(r => makeRow(r, true)));   // 비면 :empty 안내 문구가 보임
        colD.replaceChildren(...deliveryRobots.map(r => makeRow(r, false)));
        const setN = (id, txt) => { const n = document.querySelector(`#${id} .n`); if (n) n.textContent = txt; };
        setN('bb-hd-fav', `${favRobots.length}/${FAV_MAX}`);
        const rail = document.getElementById('bb-fold-rail');   // 접힌 즐겨찾기 레일: 등록된 대수 표시
        if (rail) { rail.querySelector('.rn').textContent = favRobots.length; rail.title = `즐겨찾기 ${favRobots.length}대 — 클릭: 펼치기`; }
        setN('bb-hd-patrol', otherRobots.length);
        setN('bb-hd-deliv', deliveryRobots.length);

        // 그 외: 2열 세로 우선 채움 (3열을 20칸 채운 뒤 4열). 40대를 넘으면 행이 늘어나고 이 영역만 스크롤
        list.style.gridTemplateRows = `repeat(${Math.max(20, Math.ceil(otherRobots.length / 2))}, ${ROW_H}px)`;
        if (robots.length === 0 && favRobots.length === 0) {
            const msg = document.createElement('div');
            msg.className = 'bb-list-empty';
            msg.textContent = DB.length === 0 ? '기체 데이터 로딩 중...' : '표시할 기체가 없습니다. 오른쪽 위 검색창에서 기체를 추가하세요.';
            list.replaceChildren(msg);
        } else {
            list.replaceChildren(...otherRobots.map(r => makeRow(r, false)));
        }
        bodies.forEach((el, i) => { el.scrollTop = keep[i]; });
    }

    // 마지막 통신 시각(ISO) → { date:'09/19', time:'17:53', short:'09/19 | 17:53', full:'2026-09-19 17:53:12' } (한국 시간 기준, 없으면 null)
    const _kstFmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    });
    function fmtLastConn(iso) {
        if (!iso) return null;
        const d = new Date(iso);
        if (isNaN(d.getTime())) return null;
        const p = Object.fromEntries(_kstFmt.formatToParts(d).map(x => [x.type, x.value]));
        const hh = p.hour === '24' ? '00' : p.hour;
        return { date: `${p.month}/${p.day}`, time: `${hh}:${p.minute}`, short: `${p.month}/${p.day} | ${hh}:${p.minute}`, full: `${p.year}-${p.month}-${p.day} ${hh}:${p.minute}:${p.second}` };
    }

    // 임무 OFF 판정: 전원 ON + 임무(배차) 불가 + 배터리 22% 이상 + 순찰/배달/대기 중이 아님. 카드의 "임무 OFF" 표시와 고정 버튼 목록이 같은 기준을 쓰도록 한 곳에서 정의
    function isMissionOff(r) {
        const off = r.status === 'off';
        const lowBat = !off && !r.loading && r.battery <= 21;
        return !r.canDispatch && !off && !r.loading && !lowBat
            && r.status !== 'patrolling' && r.status !== 'delivering' && r.status !== 'standby';
    }

    // 방치/미주차 판정: 순찰 중 → 대기 중으로 바뀐 지 배터리 로그 기록 2회(10분 간격이라 20분)가 지나도 그대로인 기체.
    //   목적: 순찰을 마치고 주차(도킹)를 안 해 다음 순찰에 지장이 가는 걸 미리 잡아내는 것 — 배달 임무 중 잠깐 대기하는 것과는 다름
    //   도킹 중(docking)은 대기 중(standby)이 아니므로 별도 상태로 구분되어 이 판정에 걸리지 않음
    const NG_MIN_RUN = 2;   // '대기 중' 기록이 이만큼(회) 연속돼야 방치로 봄
    const NG_EXCLUDE_NAMES = ['배송띠띠', '순찰띠띠', '삼성인력개발원1호기', '318호기', '319호기', '두비', '달비', '인재개발원1호기', '김포풍무센트럴푸르지오1호기', '부천위브1호기', '잠실리센츠아파트1호기', '잠실리센츠아파트2호기', '잠실엘스아파트1호기', '잠실엘스아파트2호기', '김포캐슬앤파밀리에1호기', '김포캐슬앤파밀리에2호기', '부산서면비스타동원1호기', '아주대학교1호기', '아주대학교2호기', '지제역 푸르지오엘리아츠 1호기', '용인 고진역 힐스테이트 1호기', '평택고덕 디에트르 1호기', ' 평택고덕 디에트르 2호기'];   // 이름으로 직접 제외 (공백 무시, 정확히 일치할 때만)
    const ngKey = name => String(name || '').replace(/\s+/g, '');
    function ngExcluded(r) {   // 위 이름 목록이거나, 요기요/삼평서현 등 '배달'로 설정된 기체면 카운팅 대상에서 뺌
        if (NG_EXCLUDE_NAMES.includes(ngKey(r.name))) return true;
        const k = kindOverride(r.id);   // 기체별 지정이 있으면 그대로 따름
        if (k) return k === 'delivery';
        return !FORCE_PATROL_SITE_IDS.includes(r.siteId) &&
            (DELIVERY_TYPES.includes(r.raw?.service?.serviceType) || DELIVERY_SITE_IDS.includes(r.siteId));
    }
    function ngSeriesFor(id, logs) {   // 순찰 후 미주차 판정 전용: 2분마다 쌓이는 관측(chgBuf, 충전 속도 계산용)은 섞지 않고 10분 단위 배터리 로그만 본다
        const pts = logs.get(id)?.pts;                         //   (fbSeriesFor 는 chgBuf 를 섞어서 '기록 2회'가 20분이 아니라 몇 분 만에 채워질 수 있었음 — 그게 이 버그의 원인)
        return pts ? [...pts.values()].sort((a, b) => a.ts - b.ts) : [];
    }
    function ngCheck(id, logs) {   // → 방치로 판단되면 { since:방치 시작 추정 시각, minutes:그 뒤 지난 분(추정) } / 아니면 null
        const pts = ngSeriesFor(id, logs);
        if (pts.length < NG_MIN_RUN + 1 || pts[pts.length - 1].st !== 'standby') return null;   // 최신 기록도 대기 중이어야 함 (다시 순찰 나갔으면 해제)
        let i = pts.length - 1;
        while (i > 0 && pts[i - 1].st === 'standby') i--;   // 대기 중이 시작된 지점까지 거슬러 올라감
        if (pts.length - i < NG_MIN_RUN) return null;       // 대기 중 기록이 아직 2회가 안 됨 (20분 안 지남)
        if (i === 0 || pts[i - 1].st !== 'patrolling') return null;   // 대기 중 직전 기록이 '순찰 중'이어야 함
        // since = 마지막 순찰 기록과 첫 대기 기록의 중간 시각(추정) — 로그가 10분 간격이라 실제 전환 시점은 이 두 기록 사이 어딘가에 있음.
        //   마지막 순찰 기록을 그대로 쓰면 항상 최대 10분 더 길게, 첫 대기 기록을 쓰면 항상 최대 10분 더 짧게 나와 한쪽으로 치우치므로, 중간값을 써서 오차를 양쪽 ±5분으로 줄임
        const since = (pts[i - 1].ts + pts[i].ts) / 2;
        return { since, minutes: Math.round((Date.now() - since) / 60000) };
    }
    function computeNeglect(logs) {
        const out = [];
        DB.filter(r => r.status === 'standby' && !r.loading && !ngExcluded(r)).forEach(r => {
            const hit = ngCheck(r.id, logs);
            if (hit) out.push({ r, ...hit });
        });
        return out.sort((a, b) => b.minutes - a.minutes);
    }

    function makeRow(r, isFav) {
        const ac = STATUS_AC[r.status] || 'var(--mu)';
        const off = r.status === 'off';
        const lowBat = !off && !r.loading && r.battery <= 21;
        const showMissionOff = isMissionOff(r);
        const showPlug = r.status !== 'patrolling' && r.status !== 'delivering' && !!r.raw?.robotStatus?.isWiredChargerConnected;

        const row = document.createElement('div');
        row.className = `bb-row${r.status === 'delivering' ? ' delivering' : ''}${lowBat ? ' warn-bat' : ''}${rmMode ? ' selectable' : ''}${rmSet.has(r.id) ? ' selected' : ''}`;
        row.dataset.id = r.id;
        row.dataset.fav = isFav ? '1' : '';
        const lastConn = off ? fmtLastConn(r.raw?.robotStatus?.lastConnectedAt) : null;
        row.title = `${r.name} | ${STL[r.status] || ''}` + (off ? ` | 마지막 통신 ${lastConn ? lastConn.full : '기록 없음'}` : '');

        const fillW = Math.max(0, Math.min(100, Number(r.battery) || 0));
        const wbar = off ? '' : `<span class="bb-row-wbar"><i style="width:${fillW}%;background:${ac};background:color-mix(in srgb, ${ac} 40%, transparent);box-shadow:inset -2px 0 0 ${ac};"></i></span>`;   // 카드 전체 배터리바 모드용 채움 (글자가 읽히도록 상태색을 옅게, 끝선만 진하게)
        const battInner = off
            ? `<span class="bb-row-off">
                   <span class="bb-off-l1"><b class="bb-off-a bb-off-tag">OFF</b><i class="bb-off-sep">|</i><span class="bb-off-lbl">마지막 통신</span></span>
                   <span class="bb-off-l2">${lastConn
                       ? `<span class="bb-off-a bb-off-date">${lastConn.date}</span><i class="bb-off-sep">|</i><span class="bb-off-time">${lastConn.time}</span>`
                       : '<span class="bb-off-none">기록 없음</span>'}</span>
               </span>`
            : `<span class="bb-row-batt" style="border-color:${ac};">
                   <span class="bb-row-batt-fill" style="width:${r.battery}%;background:${ac};"></span>
                   <span class="bb-row-batt-pct${lowBat ? ' lowbat' : ''}">${r.battery}%</span>
               </span><span class="bb-row-pctx${lowBat ? ' lowbat' : ''}">${r.battery}%</span>`;
        const battHtml = showMissionOff
            ? `<span class="bb-row-pct-wrap">
                   <span class="bb-row-pct-val">${battInner}</span>
                   <span class="bb-row-pct-off">임무 OFF</span>
               </span>`
            : battInner;

        row.innerHTML = `
            ${wbar}
            <span class="bb-row-dot" style="background:${ac};"></span>
            <span class="bb-row-name">${r.name}</span>
            ${showPlug ? '<span class="bb-row-plug" title="유선 충전 연결">🔌</span>' : ''}
            ${battHtml}
        `;

        if (rmMode) {
            row.onclick = () => toggleSel(r.id);
        } else {
            row.draggable = true;
            row.addEventListener('dragstart', dstart);
            row.addEventListener('dragover',  dover);
            row.addEventListener('dragleave', dleave);
            row.addEventListener('drop',      ddrop);
            row.addEventListener('dragend',   dend);
            row.addEventListener('click', e => {   // 한 번 클릭 → Info 패널 (드래그로 옮길 때는 click 이 발생하지 않음)
                e.stopPropagation();
                openInfoCardPanel(r);
            });
        }

        // 이름이 잘리면 마우스 올릴 때 한 번 흘러가며 전체 표시
        const nameEl = row.querySelector('.bb-row-name');
        row.addEventListener('mouseenter', () => {
            if (nameEl.scrollWidth > nameEl.clientWidth) nameEl.classList.add('bb-marquee');
        });
        row.addEventListener('mouseleave', () => {
            nameEl.classList.remove('bb-marquee');
            nameEl.style.transform = '';
        });
        return row;
    }

    // ============================================================
    // SECTION 9b. 기체 Info 패널
    // ============================================================
    // ============================================================
    // 배터리 증감 로그 (하루 = 07:00~익일 07:00, 24시간 연속 기록 / 날짜가 바뀌면 자동 초기화)
    // ============================================================
    const WBL_KEY = 'bb_battery_log';
    const WBL_DAY_START_H = 7;   // ★ 하루 시작 시각(시). 배터리 로그·어제 데이터·그래프가 이 값 하나를 따름 (심야 업로드 02:50 은 별개)
    const WBL_SCHEME_V = 7;      // 데이터 버전 표식 — 기준을 07:00 으로 바꾼 뒤 만들어진 데이터에만 붙음 (표식이 없으면 예전 03:00 기준 데이터로 보고 1회 정리)

    // toISOString()은 UTC 기준이라 한국 시각 새벽 0~9시대엔 날짜가 하루 밀려버림 -> 로컬 날짜를 직접 조립
    function wblLocalDateStr(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
    }

    // 'YYYY-MM-DD' -> '00월 00일'
    function wblFormatMonthDay(dayKey) {
        if (!dayKey) return '';
        const [, m, d] = dayKey.split('-');
        return `${m}월 ${d}일`;
    }

    function wblGetDayKey() {   // 로그의 하루 = 07:00 ~ 익일 07:00. 쉬는 시간대 없이 항상 값이 있음 (00~06시는 전날 것)
        const now = new Date();
        if (now.getHours() >= WBL_DAY_START_H) return wblLocalDateStr(now);
        const y = new Date(now); y.setDate(y.getDate() - 1);
        return wblLocalDateStr(y);
    }

    // 예전(03:00 기준) 데이터 → 07:00 기준으로 1회 정리: 그 하루의 앞쪽 03:00~06:59 기록은 새 기준으로는 '전날'에 속하므로 버림
    // (새 기준 데이터는 v 표식이 있어 건드리지 않음. 00:00~02:59 기록은 어느 기준이든 '그날의 뒤쪽'이라 그대로 유지)
    function wblUpgradeData(data) {
        if (!data || data.v === WBL_SCHEME_V) return false;
        const lo = 3 * 60, hi = WBL_DAY_START_H * 60;
        Object.values(data.entries || {}).forEach(e => {
            e.log = (e.log || []).filter(p => { const m = wblToMin(p.t); return m < lo || m >= hi; });
        });
        data.v = WBL_SCHEME_V;
        return true;
    }
    function wblLoad() {
        try {
            const raw = localStorage.getItem(WBL_KEY);
            if (!raw) return null;
            const d = JSON.parse(raw);
            if (wblUpgradeData(d)) wblSave(d);
            return d;
        } catch { return null; }
    }
    function wblSave(data) {
        try { localStorage.setItem(WBL_KEY, JSON.stringify(data)); } catch {}
    }
    function wblEnsureDay() {
        const dayKey = wblGetDayKey();
        if (!dayKey) return null;
        let data = wblLoad();
        if (!data || data.day !== dayKey) {
            data = { day: dayKey, v: WBL_SCHEME_V, entries: {} };   // 날짜 바뀌면 통째로 초기화(=자동 삭제)
            wblSave(data);
        }
        return data;
    }

    let _wblLastSlot = null;

    function logBatteryPattern(dbList) {
        const dayKey = wblGetDayKey();
        if (!dayKey) return;

        const now = new Date();
        const slotMin = Math.floor(now.getMinutes() / 10) * 10;
        const slotLabel = `${String(now.getHours()).padStart(2,'0')}:${String(slotMin).padStart(2,'0')}`;
        if (_wblLastSlot === slotLabel) return;   // 같은 10분 슬롯 중복 기록 방지
        _wblLastSlot = slotLabel;

        const data = wblEnsureDay();
        if (!data) return;

        dbList.forEach(r => {
            if (!data.entries[r.id]) data.entries[r.id] = { name: r.name, log: [] };
            const log = data.entries[r.id].log;
            if (log.length > 0 && log[log.length - 1].t === slotLabel) return;   // 새로고침 등으로 같은 슬롯이 이미 저장돼있으면 재기록 안 함
            log.push({
                t: slotLabel,
                status: r.status,
                battery: r.status === 'off' ? null : r.battery,
            });
        });

        wblSave(data);
    }

    const WBL_STL = { charging:'충전 중', patrolling:'순찰 중', delivering:'배달 중', standby:'대기 중', docking:'도킹 중', off:'OFF' };

    function wblToMin(hhmm) { const [h,m] = hhmm.split(':').map(Number); return h*60+m; }

    // 로그 시각을 그날 00:00 기준 분으로 변환 (하루가 07:00에 시작하므로 00:00~06:59는 다음날로 간주해 +1440)
    function wblDayAdjMin(hhmm) {
        const m = wblToMin(hhmm);
        return m < WBL_DAY_START_H*60 ? m + 1440 : m;
    }

    function wblLoadYesterdaySnapshot() {
        try {
            const raw = localStorage.getItem('bb_battery_log_yesterday');
            if (!raw) return null;
            const d = JSON.parse(raw);
            if (wblUpgradeData(d)) { try { localStorage.setItem('bb_battery_log_yesterday', JSON.stringify(d)); } catch {} }
            return d;
        } catch { return null; }
    }

    function wblGetSourceData(source) {
        if (source && typeof source === 'object') return source;   // 기체 배터리 점검(30분 간격)이 자기 데이터를 넘겨 같은 그래프를 재사용
        if (source === 'yesterday') {
            return wblLoadYesterdaySnapshot();
        }
        const dayKey = wblGetDayKey();
        if (!dayKey) return null;
        return wblEnsureDay();
    }

    // 원시 로그 포인트를 상태가 이어지는 구간(segment) 단위로 묶음
    function wblGetSegments(robotId, source) {
        const data = wblGetSourceData(source);
        const entry = data?.entries?.[robotId];
        if (!entry || entry.log.length === 0) return [];

        const sortedLog = [...entry.log].sort((a, b) => wblDayAdjMin(a.t) - wblDayAdjMin(b.t));
        const segments = [];
        sortedLog.forEach(pt => {
            const last = segments[segments.length - 1];
            if (last && last.status === pt.status) {
                last.end = pt.t;
                last.endBattery = pt.battery;
            } else {
                segments.push({ status: pt.status, start: pt.t, end: pt.t, startBattery: pt.battery, endBattery: pt.battery });
            }
        });
        return segments;
    }

    // 상태별 색상 dot + 구간 요약 텍스트(HTML) 목록 반환 — 기체 Info 패널의 "오늘 배터리 증감 추이" 로그에 사용
    function wblSummarizeToday(robotId, source) {
        const segments = wblGetSegments(robotId, source);
        if (segments.length === 0) return null;

        return segments.map(seg => {
            const durMin = Math.max(10, wblDayAdjMin(seg.end) - wblDayAdjMin(seg.start) + 10);   // 자정을 넘는 구간도 정확히
            const label = WBL_STL[seg.status] || seg.status;
            const dotColor = STATUS_AC[seg.status] || '#3b82f6';
            const dot = `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${dotColor};margin-right:5px;"></span>`;
            const head = `${dot}${label} ${seg.start}~${seg.end}`;

            if (seg.status === 'off' || seg.startBattery == null || seg.endBattery == null) {
                return head;
            }
            const delta = seg.endBattery - seg.startBattery;
            if (delta === 0) {
                return `${head} · ${seg.startBattery}% 유지`;
            }
            const rate = durMin > 0 ? (delta / durMin * 60).toFixed(1) : '0';
            return `${head} · ${seg.startBattery}%→${seg.endBattery}% (시간당 ${rate>0?'+':''}${rate}%)`;
        });
    }


    // 오늘 07:00 기준 분(min) 좌표로 SVG 선그래프 그리기 (하루 24시간) (미측정 구간은 점선으로 끊음)
    function wblRenderChartSVG(robotId, source) {
        const isLight = bbEl.classList.contains('bb-light');
        const gridEdge  = isLight ? '#b3a687' : '#3a3a40';
        const gridMid   = isLight ? '#cabf9d' : '#242428';
        const tickLine  = isLight ? '#cabf9d' : '#1c1c20';
        const labelText = isLight ? '#7a6f5c' : '#9ca3af';
        const hintText  = isLight ? '#7a6f5c' : '#6b7280';
        const dotFill   = isLight ? '#2b2418' : '#e5e7eb';
        const haloColor = isLight ? '#f8f3e6' : '#0d1117';
        const data = wblGetSourceData(source);
        if (!data) return `<div style="font-size:calc(15px * var(--bb-ts, 1));color:var(--mu);padding:30px;text-align:center;">${source==='yesterday' ? '어제' : '오늘'} 기록된 데이터 없음</div>`;
        const entry = data.entries[robotId];
        if (!entry || entry.log.length === 0) return `<div style="font-size:calc(15px * var(--bb-ts, 1));color:var(--mu);padding:30px;text-align:center;">${source==='yesterday' ? '어제' : '오늘'} 기록된 데이터 없음</div>`;

        const PX_PER_MIN = 2.9, H = 252, PADX = 19, PADT = 17, PADB = 31;
        const dayStartMin = WBL_DAY_START_H * 60;
        const own = !!(source && typeof source === 'object');
        const spanMin = (source === 'yesterday' || (own && source.full))
            ? 24 * 60   // 어제는 이미 끝난 하루(07:00~익일07:00, 24시간)이니 항상 전체 구간
            : Math.max(60, (() => { const n=new Date(); let m=n.getHours()*60+n.getMinutes(); if (n.getHours()<WBL_DAY_START_H) m += 1440; return m; })() - dayStartMin);
        const W = Math.round(spanMin * PX_PER_MIN + PADX * 2);

        const xOf = (hhmm) => {
            let m = wblToMin(hhmm);
            if (m < dayStartMin) m += 1440;
            return PADX + (m - dayStartMin) * PX_PER_MIN;
        };
        const yOf = (pct) => PADT + (1 - pct/100) * (H - PADT - PADB);

        // 실측 포인트만 모아서 연속 구간으로 쪼갬 — 미측정(off 또는 값 없음)이 나오면 선을 끊음
        const sortedLog = [...entry.log].sort((a, b) => wblDayAdjMin(a.t) - wblDayAdjMin(b.t));
        const runs = [];
        sortedLog.forEach(pt => {
            if (pt.battery == null) { runs.push(null); return; }
            const last = runs[runs.length - 1];
            if (Array.isArray(last)) last.push(pt); else runs.push([pt]);
        });
        const dataRuns = runs.filter(Array.isArray);

        // 각 run 안에서도 상태가 바뀌는 지점마다 색이 바뀌도록 다시 쪼갬(경계점은 공유해서 선은 끊기지 않게)
        const colorSegs = [];
        dataRuns.forEach(run => {
            let cur = [run[0]];
            for (let i = 1; i < run.length; i++) {
                if (run[i].status !== cur[cur.length - 1].status) {
                    cur.push(run[i]);               // 상태 바뀌는 지점을 경계점
                    colorSegs.push({ status: cur[0].status, points: cur });
                    cur = [run[i]];
                } else {
                    cur.push(run[i]);
                }
            }
            colorSegs.push({ status: cur[0].status, points: cur });
        });

        const BTC = { bt: 'var(--gn)', btl: 'var(--rd)', btz: 'var(--or)' };
        const colorOf = (status) => (own && BTC[status]) || STATUS_AC[status] || '#3b82f6';

        const polylines = colorSegs.map(seg => {
            const pts = seg.points.map(pt => `${xOf(pt.t).toFixed(1)},${yOf(pt.battery).toFixed(1)}`).join(' ');
            return `<polyline points="${pts}" fill="none" style="stroke:${colorOf(seg.status)}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`;
        });
        const areaFills = colorSegs.map(seg => {
            const pts = seg.points.map(pt => `${xOf(pt.t).toFixed(1)},${yOf(pt.battery).toFixed(1)}`).join(' ');
            const x0 = xOf(seg.points[0].t).toFixed(1), x1 = xOf(seg.points[seg.points.length-1].t).toFixed(1);
            const base = yOf(0).toFixed(1);
            return `<polygon points="${x0},${base} ${pts} ${x1},${base}" style="fill:${colorOf(seg.status)}" fill-opacity="0.12"/>`;
        });
        const dots = colorSegs.flatMap(seg => seg.points.map(pt =>
            `<circle cx="${xOf(pt.t).toFixed(1)}" cy="${yOf(pt.battery).toFixed(1)}" r="3.4" style="fill:${colorOf(pt.status)}" stroke="${haloColor}" stroke-width="1.3"/>`
        ));
        // 같은 배터리 값이 연속되면(예: 09:00~16:00 계속 100%) 중간은 점만 찍고,
        // 그 구간의 시작점과 끝점에만 숫자를 표기해서 가독성을 높임
        const dotLabels = [];
        colorSegs.forEach(seg => {
            const pts = seg.points;
            let i = 0;
            while (i < pts.length) {
                let j = i;
                while (j + 1 < pts.length && pts[j + 1].battery === pts[i].battery) j++;
                const idxToLabel = j > i ? [i, j] : [i];   // 같은 값 구간이면 시작+끝, 단일 지점이면 그 지점만
                idxToLabel.forEach(idx => {
                    const pt = pts[idx];
                    const above = pt.battery >= 92;   // 100%에 가까우면 그래프 상단에 눌려서 잘리니 아래쪽에 표기
                    const ty = yOf(pt.battery) + (above ? 13 : -7);
                    dotLabels.push(`<text x="${xOf(pt.t).toFixed(1)}" y="${ty.toFixed(1)}" font-size="10" font-weight="700"
                                text-anchor="middle" fill="${dotFill}"
                                stroke="${haloColor}" stroke-width="2.4" paint-order="stroke fill">${pt.battery}%</text>`);
                });
                i = j + 1;
            }
        });

        // x축: 정시(00분) 라벨
        const xTicks = [];
        for (let m = Math.ceil(dayStartMin/60)*60; m <= dayStartMin + spanMin; m += 60) {
            const hh = String(Math.floor((m % 1440) / 60)).padStart(2,'0');
            xTicks.push({ x: PADX + (m - dayStartMin) * PX_PER_MIN, label: `${hh}:00` });
        }

        // x축: 정시 사이 10분 단위 보조 눈금(10/20/30/40/50) — 시간대를 더 세밀하게 가늠할 수 있도록
        const xMinorTicks = [];
        for (let m = dayStartMin; m <= dayStartMin + spanMin; m += own ? 30 : 10) {
            if (m % 60 === 0) continue;   // 정시는 xTicks에서 이미 표기
            xMinorTicks.push({ x: PADX + (m - dayStartMin) * PX_PER_MIN, label: String(m % 60) });
        }

        const yLabels = [100,75,50,25,0].map(p =>
            `<div style="position:absolute;top:${(yOf(p)-8).toFixed(1)}px;left:0;font-size:calc(16px * var(--bb-ts, 1));font-weight:700;color:${labelText};">${p}</div>`
        ).join('');

        return `
            <div style="display:flex;">
                <div style="position:relative;width:31px;height:${H}px;flex-shrink:0;">${yLabels}</div>
                <div class="bb-wbl-scroll" id="bb-wbl-scroll">
                    <svg width="${W}" height="${H}" style="display:block;">
                        ${[0,25,50,75,100].map(p => `<line x1="${PADX}" y1="${yOf(p)}" x2="${W-PADX}" y2="${yOf(p)}" stroke="${p===0||p===100?gridEdge:gridMid}" stroke-width="1" stroke-dasharray="${p===0||p===100?'0':'3,3'}"/>`).join('')}
                        ${xTicks.map(t => `<line x1="${t.x.toFixed(1)}" y1="${PADT}" x2="${t.x.toFixed(1)}" y2="${H-PADB}" stroke="${tickLine}" stroke-width="1"/>`).join('')}
                        ${areaFills.join('')}
                        ${polylines.join('')}
                        ${dots.join('')}
                        ${dotLabels.join('')}
                        ${xTicks.map(t => `<text x="${t.x.toFixed(1)}" y="${H-8}" font-size="14" font-weight="700" fill="${labelText}" text-anchor="middle">${t.label}</text>`).join('')}
                        ${xMinorTicks.map(t => `<text x="${t.x.toFixed(1)}" y="${H-8}" font-size="8" font-weight="500" fill="${labelText}" fill-opacity="0.55" text-anchor="middle">${t.label}</text>`).join('')}
                    </svg>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:6px; margin-top:4px; padding:0 4px 0 30px; font-size:calc(12px * var(--bb-ts, 1)); color:${hintText};">
                ↔️ 그래프를 좌우로 드래그하면 시간대를 이동할 수 있어요
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:6px; padding:0 4px 0 30px;">
                ${(own ? ['bt', 'btl'] : Object.keys(WBL_STL)).map(st => `
                    <span style="display:flex; align-items:center; gap:4px; font-size:calc(13px * var(--bb-ts, 1)); color:var(--mu);">
                        <span style="width:10px; height:10px; border-radius:50%; background:${colorOf(st)};"></span>${own ? (st === 'bt' ? '정상' : '배터리 부족(21% 이하)') : WBL_STL[st]}
                    </span>`).join('')}
            </div>
        `;
    }
	
	function wblMergeImported(remote) {
		if (!remote || remote.day !== wblGetDayKey()) return false;
		wblUpgradeData(remote);   // 아직 예전(03:00 기준) 스크립트를 쓰는 PC 가 올린 데이터라도 07:00 기준으로 정리한 뒤 병합
		const local = wblEnsureDay();
		if (!local) return false;

		Object.keys(remote.entries).forEach(id => {
			const remoteEntry = remote.entries[id];
			if (!local.entries[id]) {
				local.entries[id] = remoteEntry;   // 로컬에 아예 없던 로봇 -> 통째로 채움
			} else {
				// CYH(원격) 데이터가 더 신뢰도 높음 -> 겹치는 시간대는 CYH 값으로 덮어쓰고,
				// 로컬에만 있는 시간대(CYH가 아직 안 올린 이후 시간대)는 그대로 유지
				const seen = new Set();
				const merged = [];
				remoteEntry.log.forEach(p => { merged.push(p); seen.add(p.t); });
				local.entries[id].log.forEach(p => { if (!seen.has(p.t)) { merged.push(p); seen.add(p.t); } });
				local.entries[id].log = merged.sort((a, b) => wblDayAdjMin(a.t) - wblDayAdjMin(b.t));
			}
		});

		wblSave(local);
		return true;
	}

	// ============================================================
	// CYH 전용 배터리 로그 업로드 / 그 외 전원 다운로드
	// - 업로드: CYH만, 접속해 있으면 24시간 매 정각 자동(단 18:00 은 17:50 으로 대신), 각 시각 1회만 시도(재시도 없음) / 수동(UP 버튼)은 언제든 가능 / 심야 업로드는 02:50 (아래)
	// - 다운로드: CYH 제외 전원, 24시간 30분 주기 자동(실패시 1분 뒤 1회 재시도) (+ 수동 강제 버튼)
	// - 병합: CYH 데이터가 겹치는 시간대는 덮어씀(더 연속적이고 정확하다고 판단)
	// - 어제 데이터: 트래킹 데이(07:00~익일07:00) 기준 하루 전 스냅샷, 세션당 1회만 로드
	// ============================================================
	const WBL_HANDOVER_NAME = '배터리 증감 추이 데이터';
	const WBL_YESTERDAY_NAME = '배터리 증감 추이 데이터_어제';

	function wblTodayStr() {
		return wblLocalDateStr(new Date());
	}

	function wblSlotLabel30(now) {
		const slotMin = Math.floor(now.getMinutes() / 30) * 30;
		return `${wblTodayStr()}_${String(now.getHours()).padStart(2,'0')}:${String(slotMin).padStart(2,'0')}`;
	}

	// 트래킹 데이 기준 "어제" 날짜 계산 (07:00~익일07:00 하루 주기를 그대로 하루 앞으로 민 것)
	function wblYesterdayDayKey() {
		const todayTrackingKey = wblGetDayKey() || wblLocalDateStr(new Date());
		const d = new Date(todayTrackingKey + 'T12:00:00');
		d.setDate(d.getDate() - 1);
		return wblLocalDateStr(d);
	}

	async function wblUploadNamed(name, data) {
		try {
			await fetch(BACKUP_BASE, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, data }),
			});
			return true;
		} catch (e) { console.log(`[BB] ${name} 업로드 실패:`, e.message); return false; }
	}

	async function wblDoUpload() {
		const data = wblLoad();
		if (!data || data.day !== wblGetDayKey()) return false;
		try {
			// 오늘 첫 업로드면, 서버에 남은 게 "어제 것"인지 확인해서 어제용 파일로 먼저 보존
			const archivedFor = localStorage.getItem('bb_wbl_archived_day');
			if (archivedFor !== data.day) {
				try {
					const existingRes = await fetch(`${BACKUP_BASE}?name=${encodeURIComponent(WBL_HANDOVER_NAME)}`);
					if (existingRes.ok) {
						const existing = await existingRes.json();
						if (existing?.data?.day && existing.data.day !== data.day) {
							await wblUploadNamed(WBL_YESTERDAY_NAME, existing.data);
							console.log('[BB] 어제자 데이터 보존 완료 (' + existing.data.day + ')');
						}
					}
				} catch (e) { console.log('[BB] 어제자 보존 시도 실패(무시하고 계속 진행):', e.message); }
				localStorage.setItem('bb_wbl_archived_day', data.day);
			}

			await fetch(BACKUP_BASE, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: WBL_HANDOVER_NAME, data }),
			});
			console.log('[BB] 배터리 로그 업로드 완료 (' + new Date().toTimeString().slice(0,5) + ')');
			return true;
		} catch (e) { console.log('[BB] 배터리 로그 업로드 실패:', e.message); return false; }
	}

	async function wblDoDownload() {
		try {
			const res = await fetch(`${BACKUP_BASE}?name=${encodeURIComponent(WBL_HANDOVER_NAME)}`);
			if (!res.ok) return false;
			const remote = await res.json();
			if (!remote?.data) return false;
			const ok = wblMergeImported(remote.data);
			if (ok) console.log('[BB] 배터리 로그 불러오기 완료 (' + new Date().toTimeString().slice(0,5) + ')');
			return ok;
		} catch (e) { console.log('[BB] 배터리 로그 불러오기 실패:', e.message); return false; }
	}

	// CYH 자동 업로드 — 접속해 있으면 24시간 매 정각(00:00~23:00), 단 18:00 대신 17:50. 각 시각마다 딱 1회만 시도하고 실패해도 재시도 없음.
	// 그 시각에 보드가 켜져 있지 않았으면(재부팅 등) 건너뜀 — 나중에 따라잡아 올리지 않음. 정각이 아닌 때 PC 를 끄려면 UP 버튼으로 수동 업로드.
	async function wblCyhAutoUploadTick() {
		if (localStorage.getItem('bb_is_cyh') !== '1') return;
		const now = new Date();
		const h = now.getHours(), m = now.getMinutes();
		let slot = null;
		if (h === 17 && m === 50) slot = '1750';                                          // 18:00 대신 17:50
		else if (m === 0 && h !== 18) slot = `${String(h).padStart(2, '0')}00`;           // 그 밖의 모든 정각 (24시간)
		if (!slot) return;
		const today = wblTodayStr();
		const doneKey = `bb_wbl_up_${today}_${slot}`;
		if (localStorage.getItem(doneKey) === '1') return;
		Object.keys(localStorage).forEach(k => { if (k.startsWith('bb_wbl_up_') && !k.startsWith(`bb_wbl_up_${today}_`)) localStorage.removeItem(k); });   // 지난 날짜 기록 정리
		localStorage.setItem(doneKey, '1');   // 시도하기 전에 기록 → 성공/실패와 무관하게 이 시각엔 1회만
		await wblDoUpload();
	}
	// 정각(그 분 안)을 놓치지 않도록 20초마다 확인 — 데이터 갱신(2분 주기)과 무관하게 동작. 이미 한 시각은 위의 기록으로 건너뜀
	setInterval(wblCyhAutoUploadTick, 20 * 1000);

	// 그 외 사용자 자동 다운로드 — 24시간, 30분 슬롯당 1회 시도, 실패시 1분 뒤 1회만 재시도
	let _wblDlRetryTimer = null;
	async function wblOthersAutoDownloadTick() {
		if (localStorage.getItem('bb_is_cyh') === '1') return;

		const last = parseInt(localStorage.getItem('bb_wbl_dl_last') || '0', 10);
		if (Date.now() - last < 30 * 60 * 1000) return;   // 마지막 시도(또는 새로고침 시 즉시 로드)로부터 30분 안 지남

		localStorage.setItem('bb_wbl_dl_last', String(Date.now()));   // 이번 시도로 30분 카운트 리셋
		const ok = await wblDoDownload();
		if (ok) return;

		// 1분 뒤 딱 1회만 재시도 (성공하든 실패하든, 다음 자동 시도는 위에서 이미 리셋해둔 30분 뒤)
		if (_wblDlRetryTimer) clearTimeout(_wblDlRetryTimer);
		_wblDlRetryTimer = setTimeout(async () => {
			await wblDoDownload();
		}, 60 * 1000);
	}

	// 새로고침(스크립트 재실행) 시점에 한 번 즉시 로드 — 그 시점부터 30분 카운트가 자연스럽게 시작됨
	function wblTriggerImmediateLoadOnRefresh() {
	    if (localStorage.getItem('bb_is_cyh') === '1') {
	        const dayKey = wblGetDayKey();
	        const local = wblLoad();
	        const hasToday = local && local.day === dayKey && Object.keys(local.entries || {}).length > 0;
	        if (!hasToday) wblDoDownload();   // 새 브라우저 등 → 서버 진행분으로 한 번 따라잡기 (병합 방식이라 안전)
	        return;
	    }
	    localStorage.setItem('bb_wbl_dl_last', String(Date.now()));
	    wblDoDownload();
	}

	// 어제자 데이터 — 이미 확보된 상태면 재조회 안 함(가벼운 guard). 성공 전이면 호출될 때마다 서버를 다시 확인.
	// _어제 이관이 아직 안 됐다면(= CYH가 아직 그날 첫 업로드를 안 한 상태), 지금 이 데이터를 확인 중인 사람이
	// WBL_HANDOVER_NAME(진행분)을 대신 확인해서 어제 것이 맞으면 직접 이관해준다.
	async function wblLoadYesterdayOnce() {
		const targetKey = wblYesterdayDayKey();
		if (localStorage.getItem('bb_wbl_yesterday_loaded_for') === targetKey) return;   // 이미 이 '어제'는 확보됨
		try {
			const res = await fetch(`${BACKUP_BASE}?name=${encodeURIComponent(WBL_YESTERDAY_NAME)}`);
			if (res.ok) {
				const remote = await res.json();
				if (remote?.data?.day === targetKey) {
					localStorage.setItem('bb_battery_log_yesterday', JSON.stringify(remote.data));
					localStorage.setItem('bb_wbl_yesterday_loaded_for', targetKey);
					console.log('[BB] 어제자 배터리 로그 로드 완료 (' + targetKey + ')');
					return;
				}
			}

			// _어제 자리에 아직 없다면 — 진행분(WBL_HANDOVER_NAME)이 어제 것인지 확인해서 대신 이관
			const handoverRes = await fetch(`${BACKUP_BASE}?name=${encodeURIComponent(WBL_HANDOVER_NAME)}`);
			if (!handoverRes.ok) return;
			const handover = await handoverRes.json();
			if (handover?.data?.day !== targetKey) return;   // 그것도 어제 게 아니면 정말 데이터 없음

			await wblUploadNamed(WBL_YESTERDAY_NAME, handover.data);
			localStorage.setItem('bb_battery_log_yesterday', JSON.stringify(handover.data));
			localStorage.setItem('bb_wbl_yesterday_loaded_for', targetKey);
			console.log('[BB] 어제자 배터리 로그 이관+로드 완료 (' + targetKey + ')');
		} catch (e) { console.log('[BB] 어제자 배터리 로그 로드 실패:', e.message); }
	}

	// ============================================================
	// SECTION 알림 로그 — 좀비/캠 미노출/미니맵 미노출 3종
	// 목적: "이거 언제부터 이랬지?"를 나중에 확인하기 위한 기록.
	// 배터리 로그와 달리 CYH 우선순위가 필요 없음 — "언제 목격했나"는 순수 사실이라
	// 여러 사람의 기록을 그냥 합치면 됨(합집합). 그래서 락도 필요 없음.
	//
	// 저장 방식: alarm/ 폴더의 단일 파일 하나(배터리_알림로그)에 최근 30일치를 다 담음.
	// 원본 시각(예: 190개 타임스탬프)을 그대로 저장하지 않고, 업로드 시점에 바로
	// "구간(시작~끝)"으로 압축해서 저장 — 장시간 상습 알림 기체가 있어도 용량이 안 불어남.
	// 매 업로드마다 30일 넘은 날짜는 자동으로 잘라내서, 파일 크기가 무한정 커지지 않음.
	// ============================================================
	const ALERT_LOG_TYPES = ['zombie', 'cam', 'nomap'];
	const ALERT_LOG_META = {
		zombie: { icon: '👻', text: '좀비',        color: 'var(--or)' },
		cam:    { icon: '🎥', text: '캠 미노출',    color: 'var(--bl)' },
		nomap:  { icon: '🗺️', text: '미니맵 미노출', color: 'var(--ye)' },
	};
	const ALERT_LOG_RETENTION_DAYS = 30;
	const ALERT_LOG_NAME = '배터리_알림로그';
	const ALERT_LOG_GAP_MIN = 10;   // 이 시간 이상 안 보이면 "끊긴 것"으로 판단(재발생 구분 기준)

	function alertLogBufKey() { return 'bb_alertlog_buffer'; }

	// 매 렌더 사이클마다 호출 — 로컬에 "이 시각에 봤다"는 원본 점만 쌓음(업로드 시점에 구간으로 압축됨)
	// 배터리 로그(wblGetDayKey)와 달리 업무일 롤백을 안 함 — 자정 넘은 알림은 실제 달력 날짜 그대로 기록
	function alertLogRecord(rawSignals) {
		if (!rawSignals || !rawSignals.length) return;
		const dayKey = wblLocalDateStr(new Date());

		let buf;
		try { buf = JSON.parse(localStorage.getItem(alertLogBufKey()) || 'null'); } catch { buf = null; }
		if (!buf || buf.day !== dayKey) buf = { day: dayKey, entries: {} };

		const now = new Date();
		const hm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

		rawSignals.forEach(({ id, name, type }) => {
			if (!buf.entries[id]) buf.entries[id] = { name, points: {} };
			buf.entries[id].name = name;
			if (!buf.entries[id].points[type]) buf.entries[id].points[type] = [];
			const arr = buf.entries[id].points[type];
			if (arr[arr.length - 1] !== hm) arr.push(hm);
		});

		try { localStorage.setItem(alertLogBufKey(), JSON.stringify(buf)); } catch {}
	}

	// 원시 점(point) 배열 -> 연속 구간(interval)으로 변환. 10분 이상 벌어지면 재발생으로 구분.
	function alertLogPointsToIntervals(points) {
		if (!points || !points.length) return [];
		const sorted = [...points].sort();
		const toMin = hm => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
		const intervals = [];
		let curStart = sorted[0], curEnd = sorted[0];
		for (let i = 1; i < sorted.length; i++) {
			const gap = toMin(sorted[i]) - toMin(curEnd);
			if (gap > ALERT_LOG_GAP_MIN) {
				intervals.push({ start: curStart, end: curEnd });
				curStart = sorted[i];
			}
			curEnd = sorted[i];
		}
		intervals.push({ start: curStart, end: curEnd });
		return intervals;
	}

	// 이미 구간(interval) 형태인 두 목록을 병합 — 서로 다른 사람이 관측한 부분 구간들이
	// 이어붙으면 하나로 합쳐지도록, 다시 갭 기준으로 재정렬-재병합함.
	function alertLogMergeIntervals(existing, fresh) {
		const toMin = hm => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
		const all = [...(existing || []), ...(fresh || [])].sort((a, b) => a.start.localeCompare(b.start));
		if (!all.length) return [];
		const merged = [all[0]];
		for (let i = 1; i < all.length; i++) {
			const last = merged[merged.length - 1];
			const gap = toMin(all[i].start) - toMin(last.end);
			if (gap <= ALERT_LOG_GAP_MIN) {
				if (all[i].end > last.end) last.end = all[i].end;
			} else {
				merged.push({ ...all[i] });
			}
		}
		return merged;
	}

	// 단일 파일 로드
	async function alertLogFetchFile() {
		try {
			const res = await fetch(`${BACKUP_BASE}?name=${encodeURIComponent(ALERT_LOG_NAME)}`);
			if (!res.ok) return { days: {} };
			const data = await res.json();
			return (data?.data && typeof data.data === 'object') ? data.data : { days: {} };
		} catch (e) { return { days: {} }; }
	}

	// 30일 넘은 날짜는 잘라냄
	function alertLogPrune(fileObj) {
		const cutoff = Math.floor(Date.now() / 86400000) - (ALERT_LOG_RETENTION_DAYS - 1);
		const days = fileObj.days || {};
		Object.keys(days).forEach(dayStr => {
			const idx = Math.floor(new Date(dayStr + 'T00:00:00Z').getTime() / 86400000);
			if (idx < cutoff) delete days[dayStr];
		});
		fileObj.days = days;
		return fileObj;
	}

	// 로컬 버퍼(오늘 원시 점)를 구간으로 압축해서 단일 파일에 병합 업로드. 버퍼 비어있으면 요청 자체를 안 보냄.
	async function alertLogUpload() {
		let buf;
		try { buf = JSON.parse(localStorage.getItem(alertLogBufKey()) || 'null'); } catch { buf = null; }
		if (!buf || !buf.day || Object.keys(buf.entries).length === 0) return true;   // 올릴 게 없음

		try {
			const fileObj = await alertLogFetchFile();
			if (!fileObj.days[buf.day]) fileObj.days[buf.day] = {};
			const todayEntries = fileObj.days[buf.day];

			Object.keys(buf.entries).forEach(id => {
				const local = buf.entries[id];
				if (!todayEntries[id]) todayEntries[id] = { name: local.name, intervals: {} };
				todayEntries[id].name = local.name;
				ALERT_LOG_TYPES.forEach(type => {
					const pts = local.points[type];
					if (!pts || !pts.length) return;
					const freshIv = alertLogPointsToIntervals(pts);
					todayEntries[id].intervals[type] = alertLogMergeIntervals(todayEntries[id].intervals[type], freshIv);
				});
			});

			alertLogPrune(fileObj);

			const ok = await wblUploadNamed(ALERT_LOG_NAME, fileObj);
			if (ok) {
				localStorage.setItem(alertLogBufKey(), JSON.stringify({ day: buf.day, entries: {} }));   // 업로드 성공한 것만 비움
				console.log('[BB] 알림 로그 업로드 완료 (' + new Date().toTimeString().slice(0,5) + ')');
			}
			return ok;
		} catch (e) { console.log('[BB] 알림 로그 업로드 실패:', e.message); return false; }
	}

	// CYH — 기존 배터리 업로드와 같은 30분 슬롯에 얹어서 시도
	async function alertLogCyhTick() {
		if (localStorage.getItem('bb_is_cyh') !== '1') return;
		const slot = wblSlotLabel30(new Date());
		if (localStorage.getItem('bb_alertlog_up_slot') === slot) return;
		localStorage.setItem('bb_alertlog_up_slot', slot);
		await alertLogUpload();
	}

	// 비CYH — 매시 50분에 한 번만 시도(그마저도 쌓인 게 있을 때만 실제 요청이 나감)
	async function alertLogNonCyhTick() {
		if (localStorage.getItem('bb_is_cyh') === '1') return;
		const now = new Date();
		if (now.getMinutes() < 50) return;
		const hourKey = `bb_alertlog_up_hr_${wblLocalDateStr(now)}_${now.getHours()}`;
		if (localStorage.getItem(hourKey) === '1') return;
		localStorage.setItem(hourKey, '1');
		await alertLogUpload();
	}

	// 30분마다 단일 파일을 통째로 받아와서 로컬 캐시 — CYH/비CYH 둘 다(당일 실시간 조회용)
	let _alertLogDlLast = 0;
	async function alertLogDownloadTick() {
		if (Date.now() - _alertLogDlLast < 30 * 60 * 1000) return;
		_alertLogDlLast = Date.now();
		const fileObj = await alertLogFetchFile();
		try { localStorage.setItem('bb_alertlog_file_cache', JSON.stringify(fileObj)); } catch {}
	}

	function alertLogCachedFile() {
		try {
			const cached = JSON.parse(localStorage.getItem('bb_alertlog_file_cache') || 'null');
			if (cached && cached.days) return cached;
		} catch {}
		return { days: {} };
	}

	// 특정 기체의 알림 로그 조회 (최신순) — 캐시된 30일치 파일에서 바로 필터링, 별도 요청 없음
	async function alertLogFetchForRobot(robotId) {
		const fileObj = alertLogCachedFile();
		const rows = [];
		Object.keys(fileObj.days || {}).forEach(day => {
			const entry = fileObj.days[day][robotId];
			if (!entry) return;
			ALERT_LOG_TYPES.forEach(type => {
				(entry.intervals?.[type] || []).forEach(iv => {
					rows.push({ day, type, start: iv.start, end: iv.end });
				});
			});
		});
		rows.sort((a, b) => (a.day + a.start).localeCompare(b.day + b.start));
		return rows.reverse();
	}

	// 전체 기체 × 전체 일자 로그 (일자별로 묶어서 반환, 최신 일자가 먼저)
	async function alertLogFetchAll() {
		const fileObj = alertLogCachedFile();
		const days = Object.keys(fileObj.days || {}).sort().reverse();
		return days.map(day => {
			const items = [];
			const entries = fileObj.days[day];
			Object.keys(entries).forEach(id => {
				const entry = entries[id];
				ALERT_LOG_TYPES.forEach(type => {
					(entry.intervals?.[type] || []).forEach(iv => {
						items.push({ robotId: id, name: entry.name, type, start: iv.start, end: iv.end });
					});
				});
			});
			items.sort((a, b) => a.start.localeCompare(b.start));
			return { day, items };
		});
	}



    let _alertLogAllCloseHandler = null;
    function registerAlertLogAllPanelClose() {
        const panel = document.getElementById('bb-alertlog-all-panel');
        if (_alertLogAllCloseHandler) {
            document.removeEventListener('mousedown', _alertLogAllCloseHandler);
            _alertLogAllCloseHandler = null;
        }
        setTimeout(() => {
            _alertLogAllCloseHandler = function closeAlertLogAll(e) {
                if (!panel.contains(e.target)) {
                    panel.classList.remove('open');
                    document.removeEventListener('mousedown', _alertLogAllCloseHandler);
                    _alertLogAllCloseHandler = null;
                }
            };
            document.addEventListener('mousedown', _alertLogAllCloseHandler);
        }, 100);
    }

    async function openAlertLogAllPanel() {
        const panel  = document.getElementById('bb-alertlog-all-panel');
        const bodyEl = document.getElementById('bb-alertlog-all-body');
        bodyEl.innerHTML = `<div class="bb-alertlog-row" style="color:var(--mu);">불러오는 중...</div>`;
        panel.classList.add('open');
        registerAlertLogAllPanelClose();

        const days = await alertLogFetchAll();
        if (!days.length) {
            bodyEl.innerHTML = `<div class="bb-alertlog-row" style="color:var(--mu);">기록된 알림 로그 없음</div>`;
            return;
        }
        bodyEl.innerHTML = days.map(d => `
            <div class="bb-alertlog-day">
                <div class="bb-alertlog-day-title">${wblFormatMonthDay(d.day)}</div>
                ${d.items.map(it => {
                    const meta = ALERT_LOG_META[it.type] || { icon:'', text:it.type, color:'var(--tx)' };
                    const timeStr = it.start === it.end ? it.start : `${it.start}~${it.end}`;
                    return `<div class="bb-alertlog-row">
                        <span class="bb-alertlog-time">${timeStr}</span>
                        <span class="bb-alertlog-name">${it.name}</span>
                        <span class="bb-alertlog-icon">${meta.icon}</span>
                        <span class="bb-alertlog-type" style="color:${meta.color};">${meta.text}</span>
                    </div>`;
                }).join('')}
            </div>
        `).join('');
    }

    try { window.__bbaWbl = { chart: wblRenderChartSVG, md: wblFormatMonthDay, dayStart: WBL_DAY_START_H, z: () => ++topmostZ }; } catch (e) { /* 무시 */ }   // [admin] 기체 배터리 점검 패널이 같은 그래프를 재사용
    function openInfoCardPanel(r) {
        const raw = r.raw;
        if (!raw) return;
        const rs = raw.robotStatus ?? {};
        const panel   = document.getElementById('bb-info-card-panel');
        const titleEl = document.getElementById('bb-icp-title');
        const badgeEl = document.getElementById('bb-icp-badge');
        const bodyEl  = document.getElementById('bb-icp-body');

        titleEl.textContent = r.name;
        const asof = document.createElement('span');   // 창이 오래 열려 있어도 언제 기준 정보인지 알 수 있게
        asof.className = 'bb-icp-asof';
        const _n = new Date(), _p = x => String(x).padStart(2, '0');
        asof.textContent = ` ${_p(_n.getHours())}:${_p(_n.getMinutes())}:${_p(_n.getSeconds())} 조회`;
        titleEl.appendChild(asof);

        // 이상 판단
        const cpu  = rs.cpuUsage ?? 0;
        const gps  = rs.navpvtHorzAccuracy ?? 0;
        const tmpL = rs.chassisLeftTemperature ?? 0;
        const tmpR = rs.chassisRightTemperature ?? 0;

        const issues = [];
        if (cpu >= 90) issues.push('warn');
		else if (cpu >= 80) issues.push('warn');
        if (tmpL < 0 || tmpR < 0) issues.push('warn');
		else if (tmpL >= 60 || tmpR >= 60) issues.push('warn');
        else if (tmpL >= 55 || tmpR >= 55) issues.push('warn');
        if (Math.abs(tmpL - tmpR) >= 10) issues.push('warn');

        const statusBadgeMap = {
			charging:   { label:'🟢 충전 중',  cls:'ok' },
			patrolling: { label:'🔵 순찰 중',  cls:'patrol' },
			delivering: { label:'🩷 배달 중',  cls:'deliver' },
			standby:    { label:'⚪ 대기 중',  cls:'standby' },
			docking:    { label:'🟡 도킹 중',  cls:'warn' },
			off:        { label:'⚫ OFF',      cls:'off' },
		};
		const badgeInfo = statusBadgeMap[r.status] || { label:r.status, cls:'ok' };
		badgeEl.className = `bb-icp-badge ${badgeInfo.cls}`;
		badgeEl.textContent = badgeInfo.label;

        // CPU 바
        const filled = Math.floor(cpu / 10);
        const cpuBar = '█'.repeat(filled) + '░'.repeat(10 - filled);
        const cpuDot = cpu >= 90 ? '🔴' : cpu >= 80 ? '🟠' : '🟢';

        // GPS 텍스트
		const gpsTxt = (gps === 0 || gps == null) ? '수신 불가 🔴'
			: gps.toLocaleString();

        // 섀시 온도
        const tmpTxt = (tmpL < 0 || tmpR < 0)
            ? `좌${tmpL}° 우${tmpR}° (센서이상)`
            : `좌${tmpL}° 우${tmpR}°`;
        const tmpDot = (tmpL < 0 || tmpR < 0) ? '🔴'
            : (tmpL >= 60 || tmpR >= 60) ? '🔴'
            : (tmpL >= 55 || tmpR >= 55) ? '🟠'
            : Math.abs(tmpL - tmpR) >= 10 ? '🟠' : '🟢';

        // ADAS
        const adasDot = rs.isOnAdas ? '🟢' : '🟠';

		function formatRelTime(isoStr) {
		    if (!isoStr) return '-';
		    const d = new Date(isoStr);
		    const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
		    const hm = d.toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit', hour12:false });
		
		    if (diffMin < 60) return `${hm} (${diffMin}분 전)`;
		    if (diffMin < 1440) return `${hm} (${Math.floor(diffMin / 60)}시간 전)`;
		
		    // 24시간(1440분) 이상이면 날짜로 표기
		    const p = x => String(x).padStart(2, '0');
		    return `${p(d.getMonth() + 1)}/${p(d.getDate())} ${hm}`;
		}
		
		// 마지막 조작
		const lastOp = rs.lastOperatedUserName || '-';
		const lastOpAt = formatRelTime(rs.lastOperatedAt);
		
		// 마지막 통신 신호
		const lastConnAt = formatRelTime(rs.lastConnectedAt);

        // SW 버전 & 하드웨어
        const swVer  = raw.version?.softwareVersion?.swVersion ?? '-';
        const swShort = swVer.split('-')[0];
        const mdVer  = raw.version?.mechanicalDesignVersion?.mdVer ?? '-';
        const relayMajor = raw.version?.relayVersion?.relayFwMajor ?? 1;
        const relayMinor = raw.version?.relayVersion?.relayFwMinor ?? 0;

        const wblChartSvg = wblRenderChartSVG(r.id, 'today');
        const wblLines = wblSummarizeToday(r.id, 'today');
        const wblHtml = wblLines
            ? wblLines.map(line => `<div class="bb-icp-wbl-line">${line}</div>`).join('')
            : `<div class="bb-icp-wbl-line" style="color:var(--mu);">오늘 기록된 데이터 없음</div>`;

        bodyEl.innerHTML = `
            <div class="bb-icp-flex">
                <div class="bb-icp-left">
                    <div class="bb-icp-section">
                        <div class="bb-icp-section-title">조작/연결 기록</div>
                        <div class="bb-icp-row">
                            <span class="bb-icp-label">마지막 조작자</span>
                            <span class="bb-icp-value">${lastOp}</span>
                        </div>
                        <div class="bb-icp-row">
                            <span class="bb-icp-label">마지막 개입</span>
                            <span class="bb-icp-value">${lastOpAt}</span>
                        </div>
                        <div class="bb-icp-row">
                            <span class="bb-icp-label">마지막 통신</span>
                            <span class="bb-icp-value">${lastConnAt}</span>
                        </div>
                    </div>
                    <div class="bb-icp-section">
                        <div class="bb-icp-section-title">기체 상태 지표</div>
                        <div class="bb-icp-row">
                            <span class="bb-icp-label">CPU</span>
                            <span class="bb-icp-value">
                                <span class="bb-icp-bar">${cpuBar}</span>${cpu}% ${cpuDot}
                            </span>
                        </div>
                        <div class="bb-icp-row">
                            <span class="bb-icp-label">GPS 정확도</span>
                            <span class="bb-icp-value">${gpsTxt}</span>
                        </div>
                        <div class="bb-icp-row">
                            <span class="bb-icp-label">섀시 온도</span>
                            <span class="bb-icp-value">${tmpTxt} ${tmpDot}</span>
                        </div>
                        <div class="bb-icp-row">
                            <span class="bb-icp-label">ADAS</span>
                            <span class="bb-icp-value">${rs.isOnAdas ? 'ON' : 'OFF'} ${adasDot}</span>
                        </div>
                    </div>
                    <div class="bb-icp-section">
                        <div class="bb-icp-section-title">하드웨어</div>
                        <div class="bb-icp-row">
                            <span class="bb-icp-label">SW 버전</span>
                            <span class="bb-icp-value">${swShort}</span>
                        </div>
                        <div class="bb-icp-row">
                            <span class="bb-icp-label">기체 세대</span>
                            <span class="bb-icp-value">${mdVer}세대</span>
                        </div>
                        <div class="bb-icp-row">
                            <span class="bb-icp-label">Relay FW</span>
                            <span class="bb-icp-value">${relayMajor}.${relayMinor}</span>
                        </div>
                    </div>
                </div>
                <div class="bb-icp-right">
                    <div class="bb-icp-section-title" style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
                        <span id="bb-icp-wbl-title-text">오늘 배터리 증감 추이${wblGetSourceData('today')?.day ? ' [' + wblFormatMonthDay(wblGetSourceData('today').day) + ']' : ''}</span>
                        <span style="display:flex;gap:6px;flex-shrink:0;">
                            <button class="bb-btn" id="bb-icp-wbl-toggle" style="font-size:calc(15px * var(--bb-ts, 1));font-weight:900;padding:3px 8px;">어제 데이터 보기</button>
                        </span>
                    </div>
                    <div id="bb-icp-wbl-chart">${wblChartSvg}</div>
                    <div class="bb-icp-wbl-log" id="bb-icp-wbl-log">${wblHtml}</div>
                </div>
            </div>
        `;

        panel.classList.add('open');
        panel.style.zIndex = ++topmostZ;
        registerInfoPanelClose();

        let wblCurrentSource = 'today';
        function wireWblScroll() {   // 그래프를 다시 그릴 때마다(오늘↔어제 전환 포함) #bb-wbl-scroll 이 새 DOM으로 교체되므로, 그때마다 휠 스크롤을 다시 붙여줘야 함
            const sc = document.getElementById('bb-wbl-scroll');
            if (!sc) return;
            sc.scrollLeft = sc.scrollWidth;
            sc.addEventListener('wheel', e => {   // 마우스 휠(세로 스크롤)로도 그래프를 좌우로 넘길 수 있게. 트랙패드처럼 이미 가로로 휠하는 경우는 브라우저 기본 동작 그대로 둠
                if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
                e.preventDefault();
                sc.scrollLeft += e.deltaY;
            }, { passive: false });
        }
        document.getElementById('bb-icp-wbl-toggle').addEventListener('click', async () => {
            wblCurrentSource = wblCurrentSource === 'today' ? 'yesterday' : 'today';
            document.getElementById('bb-icp-wbl-toggle').textContent = wblCurrentSource === 'today' ? '어제 데이터 보기' : '오늘 데이터 보기';
            if (wblCurrentSource === 'yesterday') {
                await wblLoadYesterdayOnce();   // 새로고침 없이도 방금 이관된 최신 데이터를 확인
            }
            const wblDay = wblGetSourceData(wblCurrentSource)?.day;
            const wblDateSuffix = wblDay ? ` [${wblFormatMonthDay(wblDay)}]` : '';
            document.getElementById('bb-icp-wbl-title-text').textContent = (wblCurrentSource === 'today' ? '오늘 배터리 증감 추이' : '어제 배터리 증감 추이') + wblDateSuffix;
            document.getElementById('bb-icp-wbl-chart').innerHTML = wblRenderChartSVG(r.id, wblCurrentSource);
            const lines = wblSummarizeToday(r.id, wblCurrentSource);
            document.getElementById('bb-icp-wbl-log').innerHTML = lines
                ? lines.map(line => `<div class="bb-icp-wbl-line">${line}</div>`).join('')
                : `<div class="bb-icp-wbl-line" style="color:var(--mu);">${wblCurrentSource === 'yesterday' ? '어제' : '오늘'} 기록된 데이터 없음</div>`;
            requestAnimationFrame(wireWblScroll);
        });
        requestAnimationFrame(wireWblScroll);
        }

        function closeInfoCardPanel() {
            document.getElementById('bb-info-card-panel').classList.remove('open');
        }
        // 창 바깥을 누르면 닫히는 처리는 아래(document mousedown)에서 한 번만 등록
        function registerInfoPanelClose() {}

    // ============================================================
    // SECTION 10. 정렬 & 제거
    // ============================================================
    function autoSort() {
        ids.sort((a, b) => {
            const ra = DB.find(r => r.id === a), rb = DB.find(r => r.id === b);
            if (!ra || !rb) return 0;
            return ra.name.localeCompare(rb.name, 'ko');
        });
        save(); render();
        const btn = document.getElementById('bb-sortBtn');
        btn.textContent = '✓ 정렬됨';
        setTimeout(() => { btn.textContent = '가나다 순'; }, 1200);
    }

    function toggleRm() {
        if (!rmMode) { rmMode = true; rmSet.clear(); }
        else {
            if (rmSet.size > 0) { ids = ids.filter(id => !rmSet.has(id)); favIds = favIds.filter(id => !rmSet.has(id)); save(); }
            rmMode = false; rmSet.clear();
        }
        updateRmUI(); render();
    }

    function updateRmUI() {
        const btn = document.getElementById('bb-rmbtn');
        const ico = btn.querySelector('.bb-tool-ico'), lbl = btn.querySelector('.bb-tool-lbl');
        bbEl.classList.toggle('bb-rm-mode', rmMode);   // 카드 영역만 강조 + 나머지는 어둡게 (CSS)
        if (rmMode) { btn.classList.add('rm'); lbl.textContent = '완료'; ico.innerHTML = ICON_CHECK; }
        else        { btn.classList.remove('rm'); lbl.textContent = '카드 제거'; ico.innerHTML = ICON_TRASH; }
    }

    function toggleSel(id) {
        if (rmSet.has(id)) rmSet.delete(id); else rmSet.add(id);
        render();
    }

    // ============================================================
    // SECTION 11. 드래그 앤 드롭
    // ============================================================
    let dsrc = null;
    function dstart(e) { dsrc = this.dataset.id; this.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dsrc); }
    function dover(e)  {
        e.stopPropagation();   // 영역(즐겨찾기/일반) 하이라이트와 겹치지 않게
        if (!dsrc || this.dataset.id === dsrc) return;
        e.preventDefault();
        document.querySelectorAll('.bb-row.dragover').forEach(c => { if (c !== this) c.classList.remove('dragover'); });
        this.classList.add('dragover');
    }
    function dleave(e) { if (this.contains(e.relatedTarget)) return; this.classList.remove('dragover'); }
    function ddrop(e)  {
        e.preventDefault(); e.stopPropagation();
        const tid = this.dataset.id;
        if (!dsrc || tid === dsrc) return;
        this.classList.remove('dragover');
        moveRobot(dsrc, this.dataset.fav === '1', tid);   // 놓은 카드가 속한 영역(즐겨찾기/일반)으로, 그 카드 자리에 삽입
    }
    function dend() {
        dsrc = null;
        document.querySelectorAll('.bb-row').forEach(c => c.classList.remove('dragging', 'dragover'));
        document.querySelectorAll('.bb-drop-over').forEach(c => c.classList.remove('bb-drop-over'));
    }

    // id 를 toFav 영역으로 이동. beforeId 가 있으면 그 카드 자리에, 없으면 영역 맨 끝에 넣음
    let _favWarnTimer = null;
    function flashFavFull() {   // 즐겨찾기 제목 줄을 잠깐 경고 문구로 바꿈 (2.5초)
        const el = document.getElementById('bb-hd-fav');
        if (!el) return;
        const t = el.querySelector('.t');
        t.textContent = `최대 ${FAV_MAX}대까지 등록 가능`;
        el.classList.add('warn');
        const rail = document.getElementById('bb-fold-rail');
        if (rail) rail.classList.add('warn');
        clearTimeout(_favWarnTimer);
        _favWarnTimer = setTimeout(() => { t.textContent = '즐겨찾기'; el.classList.remove('warn'); if (rail) rail.classList.remove('warn'); }, 2500);
    }
    function moveRobot(id, toFav, beforeId) {
        const srcArr = favIds.includes(id) ? favIds : ids;
        const dstArr = toFav ? favIds : ids;
        const si = srcArr.indexOf(id);
        if (si === -1) return;
        if (toFav && !favIds.includes(id) && favIds.length >= FAV_MAX) { flashFavFull(); return; }   // 가득 찼으면 등록 안 함
        const di = beforeId ? dstArr.indexOf(beforeId) : -1;
        if (beforeId && di === -1) return;
        srcArr.splice(si, 1);
        dstArr.splice(beforeId ? di : dstArr.length, 0, id);
        save(); render();
    }
    // 빈 공간에 놓기: 즐겨찾기 영역이면 즐겨찾기 맨 끝, 일반 영역이면 일반 맨 끝 (즐겨찾기 해제)
    function bindDropZone(el, toFav) {
        if (!el) return;
        el.addEventListener('dragover',  e => { if (!dsrc) return; e.preventDefault(); el.classList.add('bb-drop-over'); });
        el.addEventListener('dragleave', e => { if (el.contains(e.relatedTarget)) return; el.classList.remove('bb-drop-over'); });
        el.addEventListener('drop',      e => { e.preventDefault(); el.classList.remove('bb-drop-over'); if (dsrc) moveRobot(dsrc, toFav, null); });
    }
    bindDropZone(document.getElementById('bb-fav'),  true);
    bindDropZone(document.getElementById('bb-col-deliv'), false);
    bindDropZone(document.getElementById('bb-list'), false);
    bindDropZone(document.getElementById('bb-fold-rail'), true);   // 접힌 상태에서 카드를 레일에 놓아도 즐겨찾기로 등록

    // 즐겨찾기 열 접기/펼치기 (선택은 이 PC 에 저장 — 목록 백업과는 별개)
    const FAV_FOLD_KEY = 'bb_fav_collapsed';
    function setFavFold(collapsed) {
        const col = document.getElementById('bb-fcol');
        if (!col) return;
        col.classList.toggle('collapsed', collapsed);
        try { localStorage.setItem(FAV_FOLD_KEY, collapsed ? '1' : '0'); } catch {}
    }
    try { document.getElementById('bb-fcol').classList.toggle('collapsed', localStorage.getItem(FAV_FOLD_KEY) === '1'); } catch {}
    document.getElementById('bb-fold-btn').addEventListener('click', () => setFavFold(true));
    document.getElementById('bb-fold-rail').addEventListener('click', () => setFavFold(false));

    // ============================================================
    // SECTION 12. 검색 & 드롭다운
    // ============================================================
    let ddFocusIdx = -1;

    function showDd() {
        const siEl = document.getElementById('bb-si');
        const ddEl = document.getElementById('bb-dd');
        const q    = siEl.value.trim();
        const exclOn = document.getElementById('bb-si-excl')?.checked;
        const SI_EXTRA_EXCL_KWS = ['제주 홍보용역'];   // 요기요/성남형 외에 검색에서 추가로 빼는 이름 키워드 (하단 퀵바 MONITOR_GROUPS와는 무관)
        const exclKws = exclOn ? [...MONITOR_GROUPS.flatMap(g => g.keywords), ...SI_EXTRA_EXCL_KWS] : null;   // 요기요/성남형/제주 제외 검색: 켜져 있으면 이 키워드가 이름에 들어간 기체는 검색 결과에서 뺌
        const res  = DB.filter(r => (q===''||r.name.includes(q)) && !ids.includes(r.id) && !favIds.includes(r.id) && (!exclKws || !exclKws.some(k => r.name.includes(k))))
                       .sort((a,b) => a.name.localeCompare(b.name,'ko',{numeric:true}));

        if (ids.length + favIds.length >= MAX) {
            ddEl.innerHTML = `<div class="bb-di" style="color:var(--mu);cursor:default;">이미 최대 ${MAX}대 등록됨</div>`;
        } else if (res.length === 0) {
            ddEl.innerHTML = `<div class="bb-di" style="color:var(--mu);cursor:default;">${DB.length===0?'기체 데이터 로딩 중...':'검색 결과 없음'}</div>`;
        } else {
            ddEl.innerHTML = res.map(r =>
                `<div class="bb-di" data-rid="${r.id}">
                    <span class="bb-di-name">${r.name}</span>
                    <span class="bb-di-icon">${STI[r.status]}</span>
                </div>`
            ).join('');
            ddEl.querySelectorAll('.bb-di[data-rid]').forEach(el => {
                el.addEventListener('mousedown', e => {
                    e.preventDefault(); e.stopPropagation();
                    addRobot(el.dataset.rid);
                });
            });
        }
        ddEl.classList.add('open');
    }

    function hideDd() { const d = document.getElementById('bb-dd'); if (d) d.classList.remove('open'); }
    function addRobot(id) {
        if (ids.length + favIds.length >= MAX) return;
        if (!ids.includes(id) && !favIds.includes(id)) { ids.push(id); save(); render(); }
        showDd(); document.getElementById('bb-si').focus();
    }

    // ============================================================
    // SECTION 14. 이벤트 바인딩
    // ============================================================
    document.getElementById('bb-closebtn').addEventListener('click', closeBoard);
    document.getElementById('bb-rmbtn').addEventListener('click', toggleRm);

    document.getElementById('bb-ap-close').addEventListener('click', () => {
        document.getElementById('bb-alert-panel').classList.remove('open');
    });

    document.getElementById('bb-alertlog-all-btn').addEventListener('click', openAlertLogAllPanel);
    document.getElementById('bb-alertlog-all-close').addEventListener('click', () => {
        document.getElementById('bb-alertlog-all-panel').classList.remove('open');
        if (_alertLogAllCloseHandler) {
            document.removeEventListener('mousedown', _alertLogAllCloseHandler);
            _alertLogAllCloseHandler = null;
        }
    });

    document.getElementById('bb-icp-close').addEventListener('click', () => {
        closeInfoCardPanel();
    });
    // 창 바깥을 누르면 닫힘. 카드/목록의 기체를 눌러 다른 기체를 여는 경우엔 닫혔다가 바로 새로 열림
    document.addEventListener('mousedown', e => {
        const panel = document.getElementById('bb-info-card-panel');
        if (!panel.classList.contains('open')) return;
        if (e.target.closest && e.target.closest('#bb-info-card-panel')) return;
        panel.classList.remove('open');
    }, true);

    // ── 기체 정보 창 이동: 헤더를 잡고 끌기 (창이 계속 떠 있으므로 원하는 곳으로 옮겨 둘 수 있게)
    (function() {
        const panel = document.getElementById('bb-info-card-panel');
        const hd = panel.querySelector('.bb-icp-hd');
        let drag = null;
        hd.addEventListener('mousedown', e => {
            if (e.target.closest('#bb-icp-close, button, input')) return;
            const r = panel.getBoundingClientRect();
            panel.style.left = r.left + 'px';
            panel.style.top = r.top + 'px';
            panel.style.transform = 'none';   // 중앙 정렬(translate) 해제 후 px 좌표로 이동
            drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
            e.preventDefault();
        });
        document.addEventListener('mousemove', e => {
            if (!drag) return;
            const x = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, e.clientX - drag.dx));
            const y = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - drag.dy));   // 헤더는 항상 화면 안에
            panel.style.left = x + 'px';
            panel.style.top = y + 'px';
        });
        document.addEventListener('mouseup', () => { drag = null; });
    })();

    // ── "by CYH" 5회 연속 클릭(2초 이내) → 이 PC를 제작자(CYH) PC로 표시 ──
    (function() {
        const tag = document.getElementById('bb-cyh-tag');
        let clickTimes = [];
        function applyCyhStyle() {
            const isCyh = localStorage.getItem('bb_is_cyh') === '1';
            tag.style.color = isCyh ? '#eab308' : 'var(--mu)';
            const uploadBtn = document.getElementById('bb-wbl-upload-btn');
            if (uploadBtn) uploadBtn.style.display = isCyh ? '' : 'none';
        }
        applyCyhStyle();
        tag.addEventListener('click', () => {
            const now = Date.now();
            clickTimes.push(now);
            clickTimes = clickTimes.filter(t => now - t <= 2000);
            if (clickTimes.length >= 5) {
                clickTimes = [];
                const cur = localStorage.getItem('bb_is_cyh') === '1';
                localStorage.setItem('bb_is_cyh', cur ? '0' : '1');
                applyCyhStyle();
            }
        });
    })();

    // ── 강제 업로드/불러오기 버튼 (사이클과 무관하게 즉시 실행) ──
    document.getElementById('bb-wbl-upload-btn').addEventListener('click', async (e) => {
        if (!confirm('배터리 데이터를 업로드 하시겠습니까?')) return;
        const btn = e.currentTarget;
        const orig = btn.textContent;
        btn.textContent = '⏳'; btn.disabled = true;
        let ok = await wblDoUpload();
        btn.textContent = ok ? '✅' : '❌';
        setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1500);
    });

    // 정렬 방식 토글: 이름 순 정렬 ↔ 상태별 정렬 (선택은 저장됨). 영역(즐겨찾기/순찰/배달/그 외)은 그대로이고 각 영역 안의 순서만 바뀜
    function applySortBtn() {
        const el = document.getElementById('bb-sortname-btn');
        if (!el) return;
        const st = _sortMode === 'status';
        el.classList.toggle('status', st);
        el.setAttribute('aria-checked', st ? 'true' : 'false');
        el.title = (st ? '지금: 상태별 정렬 (충전 중 → 도킹 중 → 대기 중 → OFF, 같은 상태끼리는 이름 순 · 순찰/배달 열은 즐겨찾기 먼저)'
                       : '지금: 이름순 정렬 (모든 열을 이름 순으로)') + ' — 클릭: 정렬 방식 전환';
    }
    function setSortMode(mode) {
        if (mode === _sortMode) return;
        _sortMode = mode;
        try { localStorage.setItem(SORT_MODE_KEY, _sortMode); } catch {}
        applySortBtn();
        render();
    }
    (function() {
        const el = document.getElementById('bb-sortname-btn');
        el.addEventListener('click', e => {
            const seg = e.target.closest('.seg');
            setSortMode(seg ? seg.dataset.mode : (_sortMode === 'status' ? 'name' : 'status'));   // 글자를 직접 누르면 그 방식으로, 그 밖(여백)을 누르면 반대쪽으로
        });
        el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSortMode(_sortMode === 'status' ? 'name' : 'status'); } });
    })();
    applySortBtn();

    const siEl = document.getElementById('bb-si');
    siEl.addEventListener('click', showDd);
    siEl.addEventListener('input', () => { ddFocusIdx = -1; showDd(); });
    siEl.addEventListener('keydown', e => {
        const ddEl = document.getElementById('bb-dd');
        const items = ddEl.querySelectorAll('.bb-di[data-rid]');
        if (!items.length) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            ddFocusIdx = Math.min(ddFocusIdx + 1, items.length - 1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            ddFocusIdx = Math.max(ddFocusIdx - 1, 0);
        } else if (e.key === 'Enter' && ddFocusIdx >= 0) {
            e.preventDefault();
            addRobot(items[ddFocusIdx].dataset.rid);
            ddFocusIdx = -1;
            return;
        }
        items.forEach((el, i) => el.classList.toggle('bb-di-focus', i === ddFocusIdx));
    });

    document.addEventListener('mousedown', e => {
        if (!e.target.closest('#bb-search-wrap') && !e.target.closest('#bb-dd')) hideDd();
    });

    // 요기요/성남형 제외 검색 체크박스: 선택 상태를 저장해 두고, 열려 있으면 목록을 바로 다시 그림
    const siExclKey = 'bb_si_excl_delivery';
    const siExclEl = document.getElementById('bb-si-excl');
    siExclEl.checked = localStorage.getItem(siExclKey) === '1';
    siExclEl.addEventListener('change', () => {
        localStorage.setItem(siExclKey, siExclEl.checked ? '1' : '0');
        if (document.getElementById('bb-dd').classList.contains('open')) showDd();
    });

	// 동숲 주민 공통 데이터 (우측: 말풍선 있음 / 좌측: 말풍선 없음 — 같은 캐릭터 목록을 씀)
	const WALKER_BASE = 'https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/';
	const walkerFiles = [
			{ name: 'Walker',   variants: ['Walker.webp', 'Walker_2.webp', 'Walker_3.webp', 'Walker_4.webp', 'Walker_5.webp'] },
			{ name: 'Scoot',    variants: ['Scoot.webp', 'Scoot_2.webp', 'Scoot_3.webp', 'Scoot_4.webp', 'Scoot_5.webp'] },
			{ name: 'Octavian', variants: ['Octavian.webp', 'Octavian_2.webp', 'Octavian_3.webp'] },
			{ name: 'Bluebear', variants: ['Bluebear.webp', 'Bluebear_2.webp', 'Bluebear_3.webp'] },
			{ name: 'Bones',    variants: ['Bones.webp', 'Bones_2.webp', 'Bones_3.webp', 'Bones_4.webp', 'Bones_5.webp'] },
			{ name: 'Coco',     variants: ['Coco.webp', 'Coco_2.webp', 'Coco_3.webp', 'Coco_4.webp'] },
            { name: 'Cookie',   variants: ['Cookie.webp', 'Cookie_2.webp', 'Cookie_3.webp'] },
            { name: 'Curt',     variants: ['Curt.webp', 'Curt_2.webp', 'Curt_3.webp', 'Curt_4.webp'] },
			{ name: 'Egbert',   variants: ['Egbert.webp', 'Egbert_2.webp', 'Egbert_3.webp', 'Egbert_4.webp'] },
            { name: 'Filbert',  variants: ['Filbert.webp', 'Filbert_2.webp', 'Filbert_3.webp'] },
			{ name: 'Joey',     variants: ['Joey.webp'] },
			{ name: 'Marina',   variants: ['Marina.webp', 'Marina_2.webp', 'Marina_3.webp', 'Marina_4.webp'] },
            { name: 'Rudy',     variants: ['Rudy.webp', 'Rudy_2.webp', 'Rudy_3.webp', 'Rudy_4.webp'] },
            { name: 'Sable',    variants: ['Sable.webp', 'Sable_2.webp', 'Sable_3.webp'] },
			{ name: 'Sherb',    variants: ['Sherb.webp', 'Sherb_2.webp'] },
		];
		
	const ROTATE_MS = 2 * 60 * 60 * 1000;   // 2시간마다 배리에이션 교체 (원하는 시간으로 조정)

	// 동숲 주민 (헤더 우측) — 캐릭터 선택(bb_walker_idx)·표시 on/off(bb_walker_on)는 예전 그대로, 캠핑장 배경만 제외
	(function() {
		const WALKER_IDX_KEY = 'bb_walker_idx';   // 캐릭터 선택 (기존 키 그대로 유지 — 순서 안 바꿨으니 호환됨)
		let charIdx = parseInt(localStorage.getItem(WALKER_IDX_KEY), 10);
		if (isNaN(charIdx) || charIdx < 0 || charIdx >= walkerFiles.length) charIdx = 0;
		const WALKER_IDX2_KEY = 'bb_walker_idx2';   // [UI 개편] 두 번째 주민 캐릭터 선택 (저장)
		let charIdx2 = parseInt(localStorage.getItem(WALKER_IDX2_KEY), 10);
		if (isNaN(charIdx2) || charIdx2 < 0 || charIdx2 >= walkerFiles.length) charIdx2 = (charIdx + 1) % walkerFiles.length;

		const walkerEl = document.getElementById('bb-walker');
		const toggleEl = document.getElementById('bb-walker-toggle');

		function currentVariantFile() {
			const variants = walkerFiles[charIdx].variants;
			// 시간 기준으로 결정 — 저장할 필요 없이 항상 같은 계산이 나옴 (새로고침해도 일관됨)
			const vIdx = Math.floor(Date.now() / ROTATE_MS) % variants.length;
			return variants[vIdx];
		}

		function renderWalker() {
			walkerEl.style.backgroundImage = `url('${WALKER_BASE}${currentVariantFile()}')`;
			// [UI 개편] 오른쪽 두 번째 주민: 다음 캐릭터 (같은 시간 기준 배리에이션)
			const r2 = document.getElementById('bb-walker-r2');
			if (r2) { const c2 = walkerFiles[charIdx2].variants; r2.style.backgroundImage = `url('${WALKER_BASE}${c2[Math.floor(Date.now() / ROTATE_MS) % c2.length]}')`; }
		}
		renderWalker();

		function goToChar(delta) {
			const leftIdx = parseInt(localStorage.getItem('bb_walker_left_idx'), 10);   // (좌측이 이제 아토로 바뀌어 항상 비어있음 → 사실상 건너뜀 없이 그냥 다음 캐릭터로 이동)
			let next = charIdx;
			do { next = (next + delta + walkerFiles.length) % walkerFiles.length; } while (next === leftIdx);
			charIdx = next;
			localStorage.setItem(WALKER_IDX_KEY, String(charIdx));
			renderWalker();
		}

		const BUBBLE_KEY = 'bb_walker_bubble';   // 말풍선 켜짐 여부 저장
		walkerEl.addEventListener('click', () => {
			toggleBubble();
			localStorage.setItem(BUBBLE_KEY, bubbleVisible ? '1' : '0');
		});

		document.getElementById('bb-walker-prev').addEventListener('click', (e) => {
			e.stopPropagation();
			goToChar(-1);
		});
		document.getElementById('bb-walker-next').addEventListener('click', (e) => {
			e.stopPropagation();
			goToChar(1);
		});
		
		// ============================================================
		// 말풍선 — 알림 순차 재생 + 잡담
		// ============================================================
		const bubbleEl = document.getElementById('bb-walker-bubble');
		const bubbleTextEl = document.getElementById('bb-walker-bubble-text');
		let bubbleVisible = true;
		let bubbleTypeTimer = null;
		let bubbleNextTimer = null;
		let bubbleStepIdx = 0;

		// 캐릭터별 고유 말투(맨 끝에 붙는 접미사). 없는 캐릭터는 알림/잡담 텍스트만 표기.
		const SPEECH_SUFFIX = {
			Bluebear: '두근',
			Bones:    '옙',
            Coco:     '삐용',
            Cookie:   '초롱초롱',
			Curt:     '음',
            Egbert:   '짜잔',
			Filbert:  '예용',
			Joey:     '그래유',
            Marina:   '캬캬',
			Octavian: '쭉쭉',
            Rudy:     '그러거나',
			Scoot:    '꾸왁',
			Walker:   '컹컹',
		};
		function applySpeech(name, msg) {
			const suffix = SPEECH_SUFFIX[name];
			return {
				plain: suffix ? `${msg} ${suffix}` : msg,
				suffix: suffix || '',
			};
		}

		// 잡담
		const IDLE_LINES = [
			'예를 들어서 그러면은 만약에...',
			'팀장님아! 혜림님!',
			'콜 많아요! 대기부터 할게요!',
			'AS 잡아! AS!',
			'리센츠 기체가 수영을 했으면 좋겠어.',
			'코웨이 선생님의 ASMR이 필요해...',
			'오늘 날씨엔 순찰하기 딱이야.',
			'본사에 몰래 다녀올까 고민 중이야.',
            '영양맛점 8500원... 너무 혜자야',
            '영화는 정보를 모르고 보는 것도 재밌어',
            '시간으로 쌓은 관계는 계속 생각나는 법이야.',
            '오해가 있으면 풀면 되지',
            '우리 나이엔 건강부터 챙겨야지.',
			'동Zlㄴ 늼!',
            '인생이 치킨인 것인가, 치킨이 인생인 것인가',
            '외계인이 어딨냐고? 저기 있잖아. 달.',
            '올해가 가장 시원한 거래. 세상에',
            '안녕.',
            '파손이 있나요?',
            '서비스 중단하시죠',
			'이번 주 무값이 심상치 않아.',
			'박물관 화석 도감 아직도 다 못 채웠어...',
			'마음의 소리는 가끔 들어야 몸이 편해.',
			'커피 한 잔이면 오전이 다 풀린다니까.',
			'낙엽 밟는 소리, 이게 인생이지.',
			'책상 정리하다가 옛날 편지를 발견했어.',
			'별똥별 소원은 세 번 빌어야 진짜래.',
			'오늘의 명언: 물은 셀프.',
			'새 가구 배치 고민하다 하루가 다 갔어.',
			'달팽이도 자기 속도로는 1등이야.',
			'K.K.의 노래는 언제 들어도 좋아.',
			'잠깐 쉬었다 가는 것도 순찰이지.',
			'매미 소리 들으니까 여름이구나 싶다.',
			'구름 모양이 딱 도넛 같아.',
			'발밑 조심, 두더지 구멍이야.',
			'가끔은 멍 때리는 것도 회복이더라.',
			'섬 주민 평균 행복 지수, 오늘은 맑음.',
			'화분에 물 주는 걸 깜빡했어, 큰일이야.',
			'물고기 그림자만 봐도 심장이 뛰어.',
			'오늘의 다짐: 내일은 미루지 말자, 아마도.',
			'옷장 앞에서 30분째 고민 중이야.',
			'잔디 밟을 땐 사뿐사뿐.',
			'야간 순찰엔 별이 최고의 동료지.',
			'물때 맞춰야 조개 캐기 성공이야.',
			'누가 내 등껍질 좀 대신 메줘...',
			'오늘도 무사히, 그거면 충분해.',
			'가끔은 아무 이유 없이 그냥 좋은 날도 있어.',
			'오늘은 벌레 채집망 들고 나가볼까 해.',
			'잡초 뽑다가 손이 초록색이 됐어.',
			'사다리 없인 섬 반대편도 못 가... 슬프다.',
			'철광석 캐다가 손목이 남아나질 않아.',
			'너굴 상점 오늘 세일한다더라.',
			'유리병 편지, 오늘은 누가 보냈으려나.',
			'불꽃놀이 보러 가는 길이 제일 설레.',
			'이번 계절 과일은 아직 안 익었어.',
			'눈사람 만들다가 머리만 세 번 굴렸어.',
			'다리 놓는 공사, 언제 끝나려나.',
			'지형 정리하다가 하루가 다 갔어.',
			'너굴마일 모으는 재미, 은근 중독적이야.',
			'울타리 색깔 고르다가 밤샜어.',
			'카페 커피 한 잔이면 하루가 리셋돼.',
			'미술관 그림, 가짜인지 진짜인지 아직도 헷갈려.',
			'잡초는 뽑아도 뽑아도 끝이 없어.',
			'비 오는 날엔 집콕이 최고지.',
			'편지 쓰다가 할 말이 너무 많아졌어.',
			'벌한테 쐬였어... 안 웃겨.',
			'도구는 꼭 닳기 직전에 부러지더라.',
			'장대높이뛰기, 오늘도 실패했어.',
			'가리비 캐려고 잠수했다가 숨 넘어갈 뻔.',
			'돌 캐다가 벌한테 습격당했어.',
			'오늘의 목표: 무리하지 않기. 아마도.',
			'낚싯대 부러졌어... 오늘 운세 왜 이래.',
			'텐트 치다가 말뚝을 잃어버렸어.',
			'별자리 도감 채우는 재미, 은근 쏠쏠해.',
			'모래성 쌓다가 파도에 다 무너졌어.',
			'선물 상자 흔들어보는 거, 그거 반칙이야.',
			'오늘은 유독 매미가 시끄럽네.',
			'단풍잎 하나 주워서 책갈피로 썼어.',
			'튤립 심어놓고 매일 물 주는 중이야.',
			'뗏목 타고 무인도 다녀오는 길이야.',
			'우체통에 편지가 쌓였어, 답장부터 하자.',
			'모기한테 물렸어... 여름은 늘 그렇지.',
			'양초 만들다가 손에 다 묻었어.',
			'그물 던졌는데 장화만 걸렸어.',
			'단골 카페 자리, 오늘도 그 자리.',
			'별똥별 놓쳤어... 다음엔 꼭 본다.',
			'낙엽 쓸다가 또 놀아버렸어.',
			'오늘의 격언: 서두르면 물고기 놓친다.',
			'마음 편한 하루, 그게 최고의 하루야.',
		];

		// 현재 떠있는 알림을 종류별로 묶어서 "라벨 N건" 문자열 배열로 반환
		function getAlertGroupLines() {
			const groups = {};
			currentAlerts.filter(a => ALERT_CHIP_TYPES.includes(a.type)).forEach(a => {   // 화면 알림 버튼과 같은 4종만
				if (!groups[a.type]) groups[a.type] = [];
				groups[a.type].push(a);
			});
			return Object.keys(groups)
				.sort((a, b) => (ALERT_META[a]?.order ?? 9) - (ALERT_META[b]?.order ?? 9))
				.map(type => {
					const meta  = ALERT_META[type] || { label: type };
					const items = groups[type];
					const first = items[0]?.name || '';
					const nameText = items.length > 1 ? `${first} 등 ${items.length}대` : first;
					return `[${meta.label} ${items.length}건] ${nameText}.`;
				});
		}

		function typeBubbleText({ plain, suffix }) {
			clearInterval(bubbleTypeTimer);
			bubbleTextEl.textContent = '';
			let i = 0;
			bubbleTypeTimer = setInterval(() => {
				bubbleTextEl.textContent += plain[i];
				i++;
				if (i >= plain.length) {
					clearInterval(bubbleTypeTimer);
					if (suffix) {
						const base = plain.slice(0, plain.length - suffix.length);
						bubbleTextEl.innerHTML = `${base}<b>${suffix}</b>`;   // 타이핑 끝난 순간 접미사만 볼드로 교체
					}
					bubbleNextTimer = setTimeout(playNextBubbleStep, 5000);
				}
			}, 40);
		}

		function playNextBubbleStep() {
			if (!bubbleVisible) return;
			const lines = getAlertGroupLines();          // 매번 새로 읽음 → 중간에 알림 꺼져도 자동 반영
			const charName = walkerFiles[charIdx].name;

			if (lines.length === 0) {
				// 알림 자체가 없으면 잡담만 계속
				const line = IDLE_LINES[Math.floor(Math.random() * IDLE_LINES.length)];
				typeBubbleText(applySpeech(charName, line));
				return;
			}

			if (bubbleStepIdx < lines.length) {
				typeBubbleText(applySpeech(charName, lines[bubbleStepIdx]));
				bubbleStepIdx++;
			} else {
				// 알림 다 돌았으면 잡담 하나 → 다음엔 다시 알림 처음부터
				const line = IDLE_LINES[Math.floor(Math.random() * IDLE_LINES.length)];
				typeBubbleText(applySpeech(charName, line));
				bubbleStepIdx = 0;
			}
		}

		function toggleBubble() {
			bubbleVisible = !bubbleVisible;
			bubbleEl.classList.toggle('open', bubbleVisible);
			if (bubbleVisible) {
				bubbleStepIdx = 0;
				playNextBubbleStep();
			} else {
				clearInterval(bubbleTypeTimer);
				clearTimeout(bubbleNextTimer);
			}
		}
		
		// ── 말풍선은 기본 꺼짐 (켜두면 리스트 위쪽을 가려서). 캐릭터를 클릭하면 켜지고, 선택은 저장됨 ──
		bubbleVisible = localStorage.getItem(BUBBLE_KEY) === '1';
		bubbleEl.classList.toggle('open', bubbleVisible);
		if (bubbleVisible) { bubbleStepIdx = 0; playNextBubbleStep(); }

		// 교체 시점을 놓치지 않도록 주기적으로 재확인 (API 호출 없음, 순수 화면 갱신)
		setInterval(renderWalker, 60 * 1000);   // 1분마다 체크

		// ── 표시 on/off 토글 (기본 ON, localStorage 저장) ──
		const WALKER_TOGGLE_KEY = 'bb_walker_on';
		let walkerOn = localStorage.getItem(WALKER_TOGGLE_KEY);
		walkerOn = walkerOn === null ? true : walkerOn === '1';

		[['bb-walker-r2-prev', -1], ['bb-walker-r2-next', 1]].forEach(([id, d]) => {   // [UI 개편] 두 번째 주민 캐릭터 고르기
			const b = document.getElementById(id);
			if (b) b.addEventListener('click', e => {
				e.stopPropagation();
				charIdx2 = (charIdx2 + d + walkerFiles.length) % walkerFiles.length;
				localStorage.setItem(WALKER_IDX2_KEY, String(charIdx2));
				renderWalker();
			});
		});

		function applyWalkerToggle() {
			walkerEl.style.display = walkerOn ? '' : 'none';
			const r2w = document.getElementById('bb-walker-wrap-r2'); if (r2w) r2w.style.display = walkerOn ? '' : 'none';   // [UI 개편] 두 번째 주민도 함께
			toggleEl.classList.toggle('off', !walkerOn);
			toggleEl.textContent = walkerOn ? '동숲' : '🚫';
			toggleEl.title = walkerOn ? '동숲 주민 끄기' : '동숲 주민 켜기';
			if (!walkerOn && bubbleVisible) toggleBubble();   // 캐릭터 끌 때 말풍선/타이머도 같이 정리
		}
		
		applyWalkerToggle();

		toggleEl.addEventListener('click', () => {
			walkerOn = !walkerOn;
			localStorage.setItem(WALKER_TOGGLE_KEY, walkerOn ? '1' : '0');
			applyWalkerToggle();
		});
    })();


    // ── 아토(토끼) — 제목 박스 왼쪽 ────────────────────────────────
    //  옛 '동숲 주민 2'를 대체: 캐릭터 선택 없이 ato/ato01~30.webp 중 하나를 2분마다 무작위로 보여줌. 표시 on/off·저장은 예전과 동일.
    (function() {
        const wrapEl = document.getElementById('bb-walker-wrap-l');
        if (!wrapEl) return;
        const el = document.getElementById('bb-walker-l');
        const toggleEl = document.getElementById('bb-walker-l-toggle');
        const BUNNY_BASE = 'https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/ato/';   // 저장소 바로 아래 ato 폴더 (animal_crossing 하위 아님 — 실제 업로드 위치에 맞춤)
        const BUNNY_COUNT = 30;
        const BUNNY_INTERVAL_MS = 2 * 60 * 1000;   // 2분마다 교체
        const bunnyFile = n => 'ato' + String(n).padStart(2, '0') + '.webp';

        for (let n = 1; n <= BUNNY_COUNT; n++) { new Image().src = BUNNY_BASE + bunnyFile(n); }   // 미리 받아둬서 교체될 때 깜빡임 없이 바로 표시

        let lastN = 0;
        const el2 = document.getElementById('bb-walker-l2'), wrapEl2 = document.getElementById('bb-walker-wrap-l2');
        function render() {
            let n; do { n = 1 + Math.floor(Math.random() * BUNNY_COUNT); } while (BUNNY_COUNT > 1 && n === lastN);   // 같은 그림이 바로 연달아 나오지 않도록
            lastN = n;
            el.src = BUNNY_BASE + bunnyFile(n);
            // [UI 개편] 아토 2호: 아토와 다른 그림
            if (el2) { let m; do { m = 1 + Math.floor(Math.random() * BUNNY_COUNT); } while (BUNNY_COUNT > 1 && m === n); el2.src = BUNNY_BASE + bunnyFile(m); }
        }
        render();
        setInterval(render, BUNNY_INTERVAL_MS);

        // 애니메이션 웹피(webp)는 파일에 저장된 반복 횟수가 무한이 아니면 <img> 라도 몇 번 돌다가 멈춤(브라우저의 오래된 버그이자 흔한 인코딩 문제).
        //   src 를 지웠다가 그대로 다시 넣으면(네트워크 요청 없이 캐시에서 즉시) 애니메이션이 처음부터 다시 재생되므로,
        //   멈출 새도 없이 주기적으로 재시작시켜서 사실상 끊김 없이 반복되는 것처럼 보이게 함
        const BUNNY_RESTART_MS = 6000;
        setInterval(() => {
            if (!on || !el.src || document.hidden) return;   // 탭이 백그라운드면 리페인트할 필요 없음
            const src = el.src;
            el.src = '';
            el.src = src;
            if (el2 && el2.src) { const s2 = el2.src; el2.src = ''; el2.src = s2; }
        }, BUNNY_RESTART_MS);

        // 표시 on/off (기본 ON, 저장)
        const LEFT_ON_KEY = 'bb_walker_left_on';
        let on = localStorage.getItem(LEFT_ON_KEY);
        on = on === null ? true : on === '1';
        function applyToggle() {
            el.style.display = on ? '' : 'none';
            if (wrapEl2) wrapEl2.style.display = on ? '' : 'none';
            toggleEl.classList.toggle('off', !on);
            toggleEl.textContent = on ? '아토' : '🚫';
            toggleEl.title = on ? '아토 끄기' : '아토 켜기';
        }
        applyToggle();
        toggleEl.addEventListener('click', () => {
            on = !on;
            localStorage.setItem(LEFT_ON_KEY, on ? '1' : '0');
            applyToggle();
        });
    })();


    // ============================================================
    // SECTION 17. 고정 버튼 3종 (제목 영역, 왼쪽 동숲 주민의 왼쪽)
    //   배터리 소모 TOP5 / 저속충전 기체 TOP5 / 임무 OFF 기체 (왼쪽) + 방전 로그(최근 30일) (오른쪽 3종 버튼 중 가운데)
    //   2분마다 데이터가 갱신될 때 버튼의 숫자 배지와, 열려 있는 목록 창이 함께 새로고침됨 (창을 띄워 둔 채로도)
    //   계산량은 기체 수(≈90대)에 비례하는 반복 몇 번뿐이라 갱신 한 번에 수 ms 수준
    // ============================================================
    const FB_DISCHARGE_PCT = 2;          // 배터리가 이 값(%) 이하에 도달한 뒤 OFF 되면 "방전"
    const FB_EST_MAX_PCT = 3;            // '방전 추정': OFF 직전 마지막 기록이 이 값(%) 이하면 추정 (하락 속도 추산 없이 이 기록 하나만 봄)
    const FB_ZERO_ENTRY_PCT = 10;        // '0% 유지' 방전 확정: 0% 도달 전 FB_ZERO_ENTRY_MIN 분 안에 이 값(%) 미만으로 내려온 기록이 있어야 함 (100% 인데 잠깐 0% 로 찍히는 버그성 표기 걸러내기)
    const FB_ZERO_ENTRY_MIN = 60;
    const FB_ZERO_NEXT_MAX_MIN = 30;     // 0% 도달 기록과 '다음 10분 기록' 사이가 이보다 길면(기록 끊김) 다음 기록으로 보지 않음
    const FB_REBOOT_RECOVER_PCT = 21;    // 0% 직전·직후가 둘 다 이 값(%) 이상이면(부천 위브 1호기 사례) 방전이 아니라 재부팅 중 배터리 오표기로 보고 제외
    const FB_CHG_MIN_MIN = 20;           // 충전 속도를 재려면 연속 충전이 이만큼(분) 이상 관측돼야 함
    const FB_CHG_GAP_MIN = 40;           // 기록이 이 시간(분) 넘게 끊기면 그 사이 충전이 이어졌는지 알 수 없어 그 앞은 자름
    const FB_SLOW_TOP = 5;               // 저속충전 목록에 보여줄 기체 수
    const FB_DRAIN_TOP = 5;              // 배터리 소모 목록에 보여줄 기체 수
    const FB_DRAIN_WINDOW_H = 6;         // 배터리 소모: 최근 이 시간(h) 안의 하락 기록만 봄 (한참 전에 빨리 닳은 기록은 무시)
    const FB_DRAIN_MIN_MIN = 30;         // 소모 속도를 재려면 (충전이 아닌 상태가) 이만큼(분) 이상 관측돼야 함 — 1% 단위 표기 오차가 속도에 크게 얹히지 않도록 충전(20분)보다 조금 길게
    const FB_DRAIN_RISE_PCT = 2;         // 충전 표시가 없어도 배터리가 이 값(%)보다 크게 오른 지점이 있으면 그 앞은 다른 사이클로 보고 자름
    const FB_DRAIN_REL_R = 2.0, FB_DRAIN_REL_O = 1.4;   // 기준(전체 중앙값) 대비 이 배수 이상이면 빨강 / 주황
    const FB_DRAIN_ABS_R = 15, FB_DRAIN_ABS_O = 10;     // 기준 속도를 못 구할 때(측정된 기체가 적거나 중앙값이 ~0) 절대 속도(%/h) 기준
    const FB_CHG_PEER_PCT = 15;          // "동급" = 배터리 % 차이가 이 이내인 충전 중 기체
    const FB_CHG_PEER_MIN = 3;           // 동급이 이 수 이상이어야 그 중앙값을 기준으로 삼음 (모자라면 충전 중 전체 중앙값)
    const FB_CHG_BUF_MS = 3 * 3600 * 1000;

    const fbEsc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const fbMedian = arr => { const a = [...arr].sort((x, y) => x - y), m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };
    function fbFmtTs(ts) {
        const d = new Date(ts), p = n => String(n).padStart(2, '0');
        return `${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
    }
    // 배터리 로그 점 → 실제 시각(ms). 로그의 하루는 07:00 시작 ~ 익일 07:00 (00~06시 표기는 다음 날로 봄)
    const _fbDayBase = {};   // 날짜별 00:00 시각(ms) — 점마다 Date 를 새로 만들지 않도록 하루 한 번만 계산
    function fbPointTs(dayKey, t) {
        let base = _fbDayBase[dayKey];
        if (base === undefined) { const [y, m, d] = dayKey.split('-').map(Number); base = _fbDayBase[dayKey] = new Date(y, m - 1, d).getTime(); }
        return base + wblDayAdjMin(t) * 60000;
    }

    // ── 충전 속도 계산용: 2분마다의 관측(시각·배터리·상태)을 최근 3시간만 메모리에 보관 (10분 단위 로그를 촘촘하게 보완) ──
    const chgBuf = new Map();
    function sampleChargeBuffer(list) {
        const now = Date.now();
        list.forEach(r => {
            let a = chgBuf.get(r.id);
            if (!a) { a = []; chgBuf.set(r.id, a); }
            a.push({ ts: now, bat: r.battery, st: r.status });
            while (a.length && a[0].ts < now - FB_CHG_BUF_MS) a.shift();
        });
    }

    // ── 방전 로그(최근 30일): 배터리 로그에서 FB_DISCHARGE_PCT% 이하 → OFF 로 이어진 기체 ──
    let _fbLogCache = null;   // { rawY, rawT, logs } — 로그 원본 문자열이 그대로면 이전 결과를 재사용 (로그는 10분마다만 바뀜, 어제 로그는 하루 종일 그대로)
    function fbLoadLogs() {   // 어제 스냅샷 + 오늘 로그를 기체별 시간순 점으로 (같은 시각이 겹치면 오늘 것이 우선)
        const rawY = localStorage.getItem('bb_battery_log_yesterday') || '', rawT = localStorage.getItem(WBL_KEY) || '';
        if (_fbLogCache && _fbLogCache.rawY === rawY && _fbLogCache.rawT === rawT) return _fbLogCache.logs;
        const byId = new Map();
        [wblLoadYesterdaySnapshot(), wblLoad()].forEach(data => {
            if (!data || !data.day || !data.entries) return;
            Object.entries(data.entries).forEach(([id, e]) => {
                let o = byId.get(id);
                if (!o) { o = { name: e.name, pts: new Map() }; byId.set(id, o); }
                (e.log || []).forEach(p => { const ts = fbPointTs(data.day, p.t); o.pts.set(ts, { ts, st: p.status, bat: p.battery }); });
            });
        });
        _fbLogCache = { rawY, rawT, logs: byId };
        return byId;
    }
    // OFF 직전 마지막 기록(pts[i])이 방전인지 판정:
    //   'sure' = 2% 이하가 기록된 뒤 OFF (방전) / 'est' = 로그(10분 간격) 사이에 2%~0%를 지나친 것으로 보임 (방전 추정) / null = 방전 아님
    // 재부팅 오표기 판정: 0% 로 찍힌 지점(pts[i]) 직전 기록이 FB_REBOOT_RECOVER_PCT% 이상이었고,
    // (OFF 로 찍힌 지점은 건너뛰고) 그다음 살아난 첫 기록도 FB_REBOOT_RECOVER_PCT% 이상이면 → 방전이 아니라 재부팅 중 0% 오표기
    // 아직 살아난 기록이 없으면(막 꺼진 직후라 판단 불가) 기존대로 방전 추정 유지
    function fbIsRebootGlitch(pts, i) {
        const p = pts[i];
        if (p.bat !== 0) return false;
        const prev = pts[i - 1];
        if (!prev || prev.bat == null || prev.bat < FB_REBOOT_RECOVER_PCT) return false;
        for (let k = i + 1; k < pts.length; k++) {
            const n = pts[k];
            if (n.st === 'off') continue;
            if (n.bat == null) continue;
            return n.bat >= FB_REBOOT_RECOVER_PCT;
        }
        return false;
    }
    function fbDischargeKind(pts, i, offTs) {
        const p = pts[i];
        if (p.st === 'off' || p.bat == null) return null;
        if (p.bat <= FB_DISCHARGE_PCT) return p.bat === 0 && !fbIsRebootGlitch(pts, i) ? 'est' : (p.bat === 0 ? null : 'sure');   // 0% 로 찍힌 직후 꺼짐은 '추정' (0% 는 버그성 표기일 수 있어서) — 1~2% 까지 정직하게 내려온 뒤 꺼짐은 확정. 단, 재부팅 오표기(아래)로 확인되면 방전으로 보지 않음
        if (p.st === 'charging' || p.bat > FB_EST_MAX_PCT) return null;   // 충전 중에 꺼졌거나, OFF 직전 마지막 기록이 FB_EST_MAX_PCT% 초과면 방전으로 보지 않음
        return 'est';   // FB_EST_MAX_PCT%(3%) 이하 기록을 본 뒤 꺼졌으므로 방전 추정 (하락 속도 추산은 하지 않음)
    }
    // 0% 유지 규칙 — 꺼지지 않고 0% 로 버티는 기체 (방전 과정에서 꼭 정직하게 꺼지지는 않음)
    //   ① 0% 도달 전 1시간 안에 10% 미만으로 내려온 기록이 있고 → 0% 도달 → 바로 다음 10분 기록에도 0% 이면 = 방전 확정
    //   ② 0% 도달 → 바로 다음 10분 기록에서 OFF 이면 = 방전 추정 (fbDischargeKind 에서 처리)
    //   다음 10분 기록까지 보는 이유: 실제로는 배터리가 넉넉한데 한 번만 0% 로 찍히는 버그성 표기를 걸러내기 위해
    const fbZeroOn = p => !!p && p.bat === 0 && p.st !== 'off' && p.st !== 'charging';   // 켜져 있으면서(충전 중 아님) 0% 인 기록
    function fbZeroRunStart(pts, i) {   // 연속된 0% 기록 중 첫 번째 위치
        let s = i;
        while (s > 0 && fbZeroOn(pts[s - 1])) s--;
        return s;
    }
    function fbZeroHolds(pts) {   // → Map(0% 첫 기록 위치 → 방전 확정 이벤트). 꺼지지 않고 0% 를 유지하는 방전만 여기서 잡음
        const out = new Map();
        for (let i = 0; i < pts.length - 1; i++) {
            const p = pts[i], q = pts[i + 1];
            if (!fbZeroOn(p) || fbZeroOn(pts[i - 1])) continue;                  // 0% 가 이어질 때는 첫 기록에서만 판정
            if ((q.ts - p.ts) / 60000 > FB_ZERO_NEXT_MAX_MIN || !fbZeroOn(q)) continue;   // 바로 다음 기록도 (켜진 채) 0% 여야 함
            let entered = false;   // 0% 도달 전 1시간 안에 10% 미만(0 초과)으로 내려온 기록
            for (let k = i - 1; k >= 0 && p.ts - pts[k].ts <= FB_ZERO_ENTRY_MIN * 60000; k--) {
                const o = pts[k];
                if (o.st !== 'off' && o.st !== 'charging' && o.bat != null && o.bat > 0 && o.bat < FB_ZERO_ENTRY_PCT) { entered = true; break; }
            }
            if (entered) out.set(i, { ts: p.ts, bat: 0, exact: false, kind: 'sure', hold: true });
        }
        return out;
    }
    /* DISCHARGE-LOG-START */
    // ── 방전 로그(최근 30일) ──
    // 원본: 배터리 로그(어제+오늘, 10분 단위)에서 'FB_DISCHARGE_PCT% 이하 → OFF' 로 이어진 지점(방전) 또는 그렇게 지나친 것으로 보이는 지점(방전 추정)
    // 저장: 이 PC(bb_discharge_local)에만 — 배터리 로그는 하루가 지나면 초기화되지만 방전 기록은 30일 동안 남음 (서버 파일 업로드/다운로드는 없음)
    // 병합: 같은 기체의 90분 이내 기록은 같은 방전으로 보고 더 확실한 쪽(확정 > 추정, 정확한 시각 > 10분 슬롯 시각)을 채택
    // 공용 헬퍼 (원래 배달 로그 섹션에 있었지만 방전 로그 쪽도 그대로 가져다 씀 — 배달 로그를 지우면서 이 두 개만 여기로 옮김)
    function dvDayIdx(day) { return Math.floor(new Date(day + 'T00:00:00Z').getTime() / 86400000); }   // 'YYYY-MM-DD' → 1970-01-01 이후 며칠째 (날짜 비교·정리용)
    function dvSig(o) { const s = JSON.stringify(o); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return s.length + ':' + h; }   // 객체 내용이 바뀌었는지만 보는 간단한 서명(체크섬)

    const DC_RETENTION_DAYS = 30;
    const DC_LOCAL_KEY = 'bb_discharge_local';           // { days:{일자:{기체id:{name,ev:[{ts,bat,kind,exact}]}}}, up:{일자:마지막 업로드 서명} }
    const DC_SAME_MS = 90 * 60000;                       // 같은 기체의 이 시간(분) 이내 기록은 같은 방전
    const DC_JUST_OFF_WINDOW_MS = 24 * 3600000;          // '방금 꺼져서 로그에 OFF 칸이 아직 없는' 경우는 마지막 기록이 이 시간 안일 때만 인정
    const DC_RANK = { sure: 2, est: 1 };

    function dcDayKey(ts) { return wblLocalDateStr(new Date(ts - WBL_DAY_START_H * 3600000)); }   // 배터리 로그의 하루(07:00~익일 07:00) 기준 날짜
    function dcCutoffIdx() { return dvDayIdx(wblGetDayKey() || wblTodayStr()) - (DC_RETENTION_DAYS - 1); }
    function dcPrune(days) {   // 30일(오늘 포함) 넘은 날짜는 잘라냄
        const cutoff = dcCutoffIdx();
        Object.keys(days).forEach(d => { if (dvDayIdx(d) < cutoff) delete days[d]; });
        return days;
    }
    function dcNormEv(x) {
        if (!x || !Number.isFinite(x.ts) || !DC_RANK[x.kind]) return null;
        const o = { ts: Math.round(x.ts), bat: Number.isFinite(x.bat) ? x.bat : null, kind: x.kind, exact: !!x.exact };
        if (x.hold) o.hold = true;   // 꺼지지 않고 0% 를 유지한 방전
        return o;
    }
    function dcCombine(a, b) {   // 같은 방전의 두 기록 → 더 확실한 종류(확정 > 추정)를 쓰고, 시각은 정확한 쪽이 있으면 그것을 씀
        const hi = DC_RANK[b.kind] > DC_RANK[a.kind] ? b : a;
        const ex = a.exact ? a : (b.exact ? b : null);
        const o = { ts: ex ? ex.ts : hi.ts, bat: hi.bat, kind: hi.kind, exact: !!ex };
        if (hi.hold) o.hold = true;
        return o;
    }
    function dcMergeEvents(list, incoming) {   // list 에 incoming 을 합침. 바뀐 게 있으면 true
        let changed = false;
        (incoming || []).forEach(raw => {
            const x = dcNormEv(raw);
            if (!x) return;
            const i = list.findIndex(e => Math.abs(e.ts - x.ts) <= DC_SAME_MS);
            if (i < 0) { list.push(x); changed = true; return; }
            const m = dcCombine(list[i], x), o = list[i];
            if (m.ts !== o.ts || m.bat !== o.bat || m.kind !== o.kind || m.exact !== o.exact || !!m.hold !== !!o.hold) { list[i] = m; changed = true; }
        });
        if (changed) list.sort((a, b) => a.ts - b.ts);
        return changed;
    }
    function dcMergeDay(dst, src) {   // dst = { 기체id:{name,ev:[]} } 에 src 를 합침
        Object.keys(src || {}).forEach(id => {
            const x = src[id];
            if (!x || !Array.isArray(x.ev)) return;
            const r = dst[id] || (dst[id] = { name: x.name || id, ev: [] });
            if (!r.name) r.name = x.name || id;
            dcMergeEvents(r.ev, x.ev);
        });
        return dst;
    }

    // 배터리 로그 전체에서 방전(추정 포함) 지점을 모두 찾음 → [{ id, name, ev:{ts,bat,kind,exact} }]
    function dcExtract(logs) {
        const now = Date.now(), curById = new Map(DB.map(r => [r.id, r])), out = [];
        logs.forEach((o, id) => {
            const pts = [...o.pts.values()].sort((a, b) => a.ts - b.ts);
            const cur = curById.get(id), name = cur?.name || o.name;
            const holds = fbZeroHolds(pts);   // 꺼지지 않고 0% 를 유지한 방전 (확정)
            holds.forEach(ev => out.push({ id, name, ev }));
            for (let i = 0; i < pts.length - 1; i++) {
                const q = pts[i + 1];
                if (q.st !== 'off') continue;
                if (holds.has(fbZeroRunStart(pts, i))) continue;   // 0% 유지 방전이 이미 확정돼 있으면(뒤늦게 꺼진 것) 같은 방전을 또 넣지 않음
                const kind = fbDischargeKind(pts, i, q.ts);
                if (kind) out.push({ id, name, ev: { ts: q.ts, bat: pts[i].bat, exact: false, kind } });
            }
            // 방금 꺼져서 로그에 OFF 칸이 아직 없는 경우: 지금 OFF → 마지막 통신 시각(서버 시각)을 OFF 시각으로
            const last = pts[pts.length - 1];
            if (cur && cur.status === 'off' && last && last.st !== 'off' && last.ts >= now - DC_JUST_OFF_WINDOW_MS && !holds.has(fbZeroRunStart(pts, pts.length - 1))) {
                const lc = Date.parse(cur.raw?.robotStatus?.lastConnectedAt || '');
                const exact = !!lc && lc >= last.ts;
                const kind = fbDischargeKind(pts, pts.length - 1, exact ? lc : last.ts + 10 * 60000);
                if (kind) out.push({ id, name, ev: { ts: exact ? lc : last.ts, bat: last.bat, exact, kind } });
            }
        });
        return out;
    }

    function dcLoadLocal() {
        try { const o = JSON.parse(localStorage.getItem(DC_LOCAL_KEY) || 'null'); if (o && o.days) return { days: o.days, up: o.up || {} }; } catch {}
        return { days: {}, up: {} };
    }
    function dcSaveLocal(o) { try { localStorage.setItem(DC_LOCAL_KEY, JSON.stringify(o)); } catch {} }

    // 2분마다(데이터 갱신 때, 보드가 닫혀 있어도) 호출 — 배터리 로그에서 방전을 찾아 이 PC 의 30일 기록에 반영
    // 감지 당시엔 살아난 기록이 아직 없어 '방전 추정'으로 저장됐지만, 이후 로그가 쌓이며 재부팅 오표기였음이 뒤늦게 확인되는 경우 → 되돌려 지움
    // (서버에 이미 올라간 기록은 병합이 추가만 하고 지우지는 않아 이 정정이 자동으로 안 올라감 — 필요하면 서버 파일도 따로 정리해야 함)
    function dcPruneRebootGlitches(loc, logs) {
        let changed = false;
        Object.keys(loc.days).forEach(day => {
            const d = loc.days[day];
            Object.keys(d).forEach(id => {
                const o = logs.get(id);
                if (!o) return;
                const pts = [...o.pts.values()].sort((a, b) => a.ts - b.ts);
                const before = d[id].ev.length;
                d[id].ev = d[id].ev.filter(ev => {
                    if (ev.kind !== 'est' || ev.bat !== 0) return true;
                    const i = pts.findIndex(p => p.bat === 0 && Math.abs(p.ts - ev.ts) <= 15 * 60000);
                    return i < 0 ? true : !fbIsRebootGlitch(pts, i);
                });
                if (d[id].ev.length !== before) changed = true;
                if (!d[id].ev.length) delete d[id];
            });
            if (!Object.keys(d).length) delete loc.days[day];
        });
        return changed;
    }
    function dcUpdateLocal() {
        const logs = fbLoadLogs();
        const found = dcExtract(logs);
        const loc = dcLoadLocal(), cutoff = dcCutoffIdx();
        let changed = false;
        found.forEach(f => {
            const day = dcDayKey(f.ev.ts);
            if (dvDayIdx(day) < cutoff) return;
            const d = loc.days[day] || (loc.days[day] = {});
            const r = d[f.id] || (d[f.id] = { name: f.name, ev: [] });
            if (f.name && r.name !== f.name) { r.name = f.name; changed = true; }
            if (dcMergeEvents(r.ev, [f.ev])) changed = true;
        });
        if (dcPruneRebootGlitches(loc, logs)) changed = true;
        const nb = Object.keys(loc.days).length;
        dcPrune(loc.days);
        if (Object.keys(loc.days).length !== nb) changed = true;
        Object.keys(loc.up).forEach(d => { if (!loc.days[d]) delete loc.up[d]; });
        if (changed) dcSaveLocal(loc);
        return changed;
    }

    // 화면용: 이 PC 기록(최근 30일)을 기체별로 합쳐서(90분 이내는 같은 방전) 최근 순으로
    function dcBuildView() {
        const byRobot = new Map(), cutoff = dcCutoffIdx();
        [dcLoadLocal().days].forEach(src => {
            Object.keys(src || {}).forEach(day => {
                if (dvDayIdx(day) < cutoff) return;
                Object.keys(src[day] || {}).forEach(id => {
                    const x = src[day][id];
                    if (!x || !Array.isArray(x.ev)) return;
                    const r = byRobot.get(id) || byRobot.set(id, { name: x.name || id, ev: [] }).get(id);
                    if (x.name) r.name = x.name;   // 나중에 합치는 이 PC 기록의 이름이 우선
                    dcMergeEvents(r.ev, x.ev);
                });
            });
        });
        const curById = new Map(DB.map(r => [r.id, r])), events = [], now = Date.now();
        byRobot.forEach((r, id) => {
            if (!r.ev.length) return;
            const cur = curById.get(id);
            r.ev.forEach(e => events.push({ id, name: cur?.name || r.name, cur, n: r.ev.length, ...e }));
        });
        events.sort((a, b) => b.ts - a.ts);
        const robots = new Set(events.map(e => e.id)).size;
        return { events, robots, sure: events.filter(e => e.kind === 'sure').length, est: events.filter(e => e.kind === 'est').length,
                 recentSure: events.some(e => e.kind === 'sure' && now - e.ts < 24 * 3600000) };
    }
    /* DISCHARGE-LOG-END */

    // ── 저속충전 기체 TOP5: 충전 중(100% 미만) 기체를 "충전 중 기간 전체"의 평균 속도가 더딘 순으로 ──
    //   속도 = (지금 배터리 − 이번 충전을 시작했을 때 배터리) ÷ 충전한 시간.  60분 같은 짧은 창이 아니라 몇 시간짜리 충전 전체를 본다.
    function fbSeriesFor(id, logs) {   // 배터리 로그(어제+오늘, 10분 단위) + 최근 2분 관측을 시간순으로 합침 (같은 시각이면 2분 관측 우선)
        const m = new Map(logs.get(id)?.pts || []);
        (chgBuf.get(id) || []).forEach(p => m.set(p.ts, p));
        return [...m.values()].sort((a, b) => a.ts - b.ts);
    }
    // 지금까지 이어진 '충전 중' 구간의 시작을 찾아 평균 속도를 계산.
    //   null = 아직 재기엔 짧음(측정 중) / {full:true} = 이번 충전 중 100% 에 이미 도달한 적 있음(더딘 기체가 아님)
    function fbChargeRun(id, logs, now, curBat) {
        const pts = fbSeriesFor(id, logs);
        let start = null, prevTs = now, trunc = true, hitFull = false;
        for (let i = pts.length - 1; i >= 0; i--) {   // 최신부터 거꾸로, 충전 중이 이어지는 동안
            const p = pts[i];
            if (p.ts > now) continue;
            if (p.st !== 'charging' || p.bat == null) { trunc = false; break; }        // 충전이 아닌 지점을 만나면 거기가 시작 직전
            if (prevTs - p.ts > FB_CHG_GAP_MIN * 60000) { trunc = false; break; }      // 기록이 오래 끊겼으면 그 앞은 알 수 없음
            if (p.bat >= 100) hitFull = true;
            start = p; prevTs = p.ts;
        }
        if (!start) return null;
        if (hitFull) return { full: true };
        const dtMin = (now - start.ts) / 60000;
        if (dtMin < FB_CHG_MIN_MIN) return null;
        return { rate: (curBat - start.bat) / dtMin * 60, dtMin, startBat: start.bat, startTs: start.ts, trunc };   // rate = %/시간
    }
    function computeSlowCharge(logs) {
        const now = Date.now();
        const charging = DB.filter(r => r.status === 'charging' && !r.loading && r.battery < 100);
        const measured = [], measuring = [];
        let fullHist = 0;
        charging.forEach(r => {
            const run = fbChargeRun(r.id, logs, now, r.battery);
            if (!run) measuring.push(r);
            else if (run.full) fullHist++;
            else measured.push({ r, ...run });
        });
        measured.forEach(m => {
            // 충전 속도는 배터리가 찰수록 자연히 느려지므로, 배터리 %가 비슷한 기체끼리 비교 (동급이 모자라면 충전 중 전체와 비교)
            let pool = measured.filter(o => o !== m && Math.abs(o.r.battery - m.r.battery) <= FB_CHG_PEER_PCT);
            m.peer = pool.length >= FB_CHG_PEER_MIN;
            if (!m.peer) pool = measured.filter(o => o !== m);
            m.ref = pool.length >= FB_CHG_PEER_MIN ? fbMedian(pool.map(o => o.rate)) : null;
            m.rel = (m.ref != null && m.ref > 0.5) ? Math.max(0, m.rate) / m.ref : null;   // 기준 속도 대비 (1 = 동급 중앙값과 같음)
            m.score = m.rel != null ? m.rel : m.rate;
            m.eta = m.rate > 0.5 ? (100 - m.r.battery) / m.rate : Infinity;                 // 완충까지 시간(h)
            m.sev = m.rel != null ? (m.rel < 0.4 ? 'r' : m.rel < 0.7 ? 'o' : 'g')
                                  : (m.rate <= 0.5 ? 'r' : m.eta > 24 ? 'o' : 'g');
        });
        measured.sort((a, b) => a.score - b.score || a.rate - b.rate);
        return { top: measured.slice(0, FB_SLOW_TOP), measured: measured.length, measuring: measuring.length, fullHist, charging: charging.length,
                 severe: measured.filter(m => m.sev === 'r').length };
    }
    // ── 배터리 소모 TOP5: 충전 중이 아닌(켜져 있는) 기체를 "최근 6시간 안" 하락 속도가 빠른 순으로 (저속충전의 반대) ──
    //   속도 = (구간 시작 배터리 − 지금 배터리) ÷ 관측한 시간.  구간 = 지금까지 이어진 '충전/OFF 가 아닌' 기록, 단 최근 FB_DRAIN_WINDOW_H 시간까지만.
    //   null = 아직 재기엔 짧음(측정 중) / { rate, dtMin, startBat, startTs, cap } (cap = 6시간 창에 걸려 잘림)
    function fbDrainRun(id, logs, now, curBat) {
        const pts = fbSeriesFor(id, logs), winStart = now - FB_DRAIN_WINDOW_H * 3600000;
        let start = null, prevTs = now, newerBat = curBat, cap = false;
        for (let i = pts.length - 1; i >= 0; i--) {   // 최신부터 거꾸로, 충전/OFF 가 아닌 동안
            const p = pts[i];
            if (p.ts > now) continue;
            if (p.st === 'charging' || p.st === 'off' || p.bat == null) break;         // 충전/OFF 를 만나면 거기가 시작 직전
            if (prevTs - p.ts > FB_CHG_GAP_MIN * 60000) break;                          // 기록이 오래 끊겼으면 그 앞은 알 수 없음
            if (p.bat < newerBat - FB_DRAIN_RISE_PCT) break;                            // 충전 표시 없이 배터리가 오른 지점 → 그 앞은 다른 사이클
            if (p.ts < winStart) { cap = true; break; }                                 // 6시간보다 오래된 기록은 보지 않음
            start = p; prevTs = p.ts; newerBat = p.bat;
        }
        if (!start) return null;
        const dtMin = (now - start.ts) / 60000;
        if (dtMin < FB_DRAIN_MIN_MIN) return null;
        return { rate: (start.bat - curBat) / dtMin * 60, dtMin, startBat: start.bat, startTs: start.ts, cap };   // rate = %/시간 (양수 = 닳는 중)
    }
    function computeFastDrain(logs) {
        const now = Date.now();
        const active = DB.filter(r => r.status !== 'charging' && r.status !== 'off' && !r.loading && r.battery != null);
        const measured = [], measuring = [];
        active.forEach(r => {
            const run = fbDrainRun(r.id, logs, now, r.battery);
            if (!run) measuring.push(r); else measured.push({ r, ...run });
        });
        const ref = measured.length >= FB_CHG_PEER_MIN ? fbMedian(measured.map(m => m.rate)) : null;   // 측정된 기체 전체의 중앙값 = 이 기체들의 '보통' 소모 속도
        measured.forEach(m => {
            m.rel = (ref != null && ref > 0.5) ? m.rate / ref : null;   // 1 = 보통과 같음
            m.sev = m.rel != null ? (m.rel >= FB_DRAIN_REL_R ? 'r' : m.rel >= FB_DRAIN_REL_O ? 'o' : 'g')
                                  : (m.rate >= FB_DRAIN_ABS_R ? 'r' : m.rate >= FB_DRAIN_ABS_O ? 'o' : 'g');
            m.eta = m.rate > 0.5 ? m.r.battery / m.rate : Infinity;      // 0% 까지 남은 시간(h)
        });
        const dropping = measured.filter(m => m.rate > 0).sort((a, b) => b.rate - a.rate);   // 닳고 있는 기체만, 빠른 순
        return { top: dropping.slice(0, FB_DRAIN_TOP), dropping: dropping.length, measured: measured.length, measuring: measuring.length, active: active.length,
                 severe: measured.filter(m => m.sev === 'r').length };
    }
    function fbDurText(min) {
        const t = Math.round(min), h = Math.floor(t / 60), m = t % 60;
        return h ? `${h}시간${m ? ` ${m}분` : ''}` : `${m}분`;
    }
    function fbEtaText(h) {
        if (h < 1) return `약 ${Math.max(1, Math.round(h * 60))}분`;
        if (h > 48) return '48시간 이상';
        return `약 ${h < 10 ? h.toFixed(1) : Math.round(h)}시간`;
    }

    // ── 화면 ──
    let _fbMode = null, _fbData = null;
    function fbCompute() {
        const logs = fbLoadLogs();   // 어제+오늘 배터리 로그는 한 번만 읽어 방전/저속충전 계산에 함께 씀
        _fbData = {
            dis: dcBuildView(),   // 이 PC 기록 + 서버 기록 (최근 30일)
            sc: computeSlowCharge(logs),
            dr: computeFastDrain(logs),
            mo: DB.filter(isMissionOff).sort((a, b) => a.name.localeCompare(b.name, 'ko', { numeric: true })),
            ng: computeNeglect(logs),
        };
        return _fbData;
    }
    function fbSetBadge(btnId, n, cls) {
        const b = document.querySelector(`#${btnId} .bb-fb-n`);
        if (!b) return;
        b.textContent = n > 99 ? '99+' : String(n);
        b.className = `bb-fb-n on ${n > 0 ? cls : 'z'}`;   // 0 이어도 숫자를 보여줌 (0 은 연한 회색)
    }
    function fbStateChip(cur) {
        if (!cur) return { ac: 'var(--mu)', txt: '조회 불가' };
        return { ac: STATUS_AC[cur.status] || 'var(--mu)', txt: `${STL[cur.status] || ''}${cur.status !== 'off' ? ` ${cur.battery}%` : ''}` };
    }
    function fbHtmlDis(d) {
        const ev = d.dis.events;
        let h = `<div class="bb-fbp-note">${FB_DISCHARGE_PCT}% 이하로 확인된 뒤 꺼졌거나, 0% 가 다음 10분 기록까지 이어지면 '방전' · 0% 로 찍힌 직후 꺼졌거나, ${FB_EST_MAX_PCT}% 이하 기록을 본 뒤 꺼지면 '방전 추정'</div>`;
        if (!ev.length) h += `<div class="bb-fbp-empty">최근 30일 동안 방전된 기체가 없습니다 ✓</div>`;
        else h += ev.map(e => {
            const st = fbStateChip(e.cur);
            const est = e.kind === 'est';
            const tip = est ? (e.bat === 0 ? `${e.name} · 0% 기록 다음에 꺼짐 — 0% 표기가 버그성일 수도 있어 방전으로 추정` : `${e.name} · 마지막 기록 ${e.bat}% 다음 10분 사이에 꺼짐 — ${FB_EST_MAX_PCT}% 이하 기록을 본 뒤 꺼져 방전으로 추정`)
                : (e.hold ? `${e.name} · 10% 미만으로 내려온 뒤 0% 에 도달했고, 다음 10분 기록에서도 0% 라서 방전 확정 (꺼지지 않고 버티는 중일 수 있음)` : e.name);
            return `<div class="bb-fbp-row" data-rid="${fbEsc(e.id)}" title="${fbEsc(tip)}">
                <span class="bb-fbp-dot" style="background:${st.ac};"></span>
                <span class="bb-fbp-main">
                    <span class="bb-fbp-line"><span class="bb-fbp-name">${fbEsc(e.name)}</span><span class="bb-fbp-tag ${est ? 'est' : 'sure'}">${est ? '방전 추정' : '방전'}</span></span>
                    <span class="bb-fbp-sub">${fbFmtTs(e.ts)}${e.exact ? '' : '경'} ${e.hold ? '0% 도달 · 다음 기록도 0%' : 'OFF'}${e.bat != null && !e.hold ? ` · 마지막 배터리 ${e.bat}%` : ''}${e.n > 1 ? ` · 30일 내 ${e.n}회` : ''}</span>
                </span>
                <span class="bb-fbp-now">현재 ${fbEsc(st.txt)}</span>
            </div>`;
        }).join('');
        return h;
    }
    function fbClock(ts) {   // 오늘이면 "08:50", 다른 날이면 "09/19 23:10"
        const d = new Date(ts), p = n => String(n).padStart(2, '0');
        const same = d.toDateString() === new Date().toDateString();
        return `${same ? '' : `${p(d.getMonth() + 1)}/${p(d.getDate())} `}${p(d.getHours())}:${p(d.getMinutes())}`;
    }
    function fbHtmlSlow(d) {
        const sc = d.sc;
        let h = `<div class="bb-fbp-note">충전을 시작한 뒤 지금까지의 평균 속도가 느린 순 ${FB_SLOW_TOP}대 · 막대가 붉을수록 더딤</div>`;
        if (!sc.charging) return h + `<div class="bb-fbp-empty">현재 충전 중인 기체가 없습니다.</div>`;
        if (!sc.measured) return h + `<div class="bb-fbp-empty">아직 충전 속도를 계산할 데이터가 부족합니다<br><span style="font-size:calc(13px * var(--bb-ts, 1));font-weight:600;">충전 ${FB_CHG_MIN_MIN}분 이상 지나야 계산됩니다 · 충전 중 ${sc.charging}대</span></div>`;
        h += sc.top.map(m => {
            const r = m.r;
            const rateTxt = m.rate > 0 ? `+${m.rate.toFixed(1)}%/h` : m.rate === 0 ? '증가 없음' : `${m.rate.toFixed(1)}%/h (감소)`;
            const eta = m.eta === Infinity ? '완충 예상 불가' : `완충까지 ${fbEtaText(m.eta)}`;
            const lo = Math.min(m.startBat, r.battery), hi = Math.max(m.startBat, r.battery);
            const since = `${fbClock(m.startTs)}${m.trunc ? ' 이전' : ''}부터 충전`;
            const dur = `${fbDurText(m.dtMin)}${m.trunc ? ' 이상' : ''}째`;
            return `<div class="bb-fbp-row sc" data-rid="${fbEsc(r.id)}" title="${fbEsc(`${r.name} · ${since} · ${m.startBat}% → ${r.battery}% · 평균 ${rateTxt}`)}">
                <div class="bb-sc-l1"><span class="bb-fbp-dot" style="background:${STATUS_AC.charging};"></span><span class="bb-fbp-name">${fbEsc(r.name)}</span><span class="bb-sc-bat">${r.battery}%</span></div>
                <div class="bb-sc-l2">
                    <span class="bb-sc-bar"><i class="bb-sc-base" style="width:${lo}%;"></i><i class="bb-sc-fill sev-${m.sev}" style="left:${lo}%;width:${Math.max(1.5, hi - lo)}%;"></i></span>
                    <span class="bb-sc-rate">${rateTxt}</span>
                    <span class="bb-sc-eta">${eta}</span>
                </div>
                <div class="bb-sc-l3"><b>${since}</b> · ${dur} · ${m.startBat}% → ${r.battery}%</div>
            </div>`;
        }).join('');
        return h + `<div class="bb-fbp-foot">충전 중 ${sc.charging}대 · 측정 중 ${sc.measured}대${sc.measuring ? ` · 데이터 부족 ${sc.measuring}대` : ''}</div>`;
    }
    function fbHtmlDrain(d) {
        const dr = d.dr;
        let h = `<div class="bb-fbp-note">충전 중이 아닌 기체의 최근 ${FB_DRAIN_WINDOW_H}시간 안 하락 기록으로 소모가 빠른 순 ${FB_DRAIN_TOP}대 · 막대가 붉을수록 빠름</div>`;
        if (!dr.active) return h + `<div class="bb-fbp-empty">충전 중이 아닌 기체가 없습니다.</div>`;
        if (!dr.measured) return h + `<div class="bb-fbp-empty">아직 소모 속도를 계산할 데이터가 부족합니다<br><span style="font-size:calc(13px * var(--bb-ts, 1));font-weight:600;">충전이 끝난 뒤 ${FB_DRAIN_MIN_MIN}분 이상 지나야 계산됩니다 · 사용 중 ${dr.active}대</span></div>`;
        if (!dr.top.length) return h + `<div class="bb-fbp-empty">배터리가 줄어들고 있는 기체가 없습니다 ✓</div>` + `<div class="bb-fbp-foot">사용 중 ${dr.active}대 · 측정 중 ${dr.measured}대${dr.measuring ? ` · 데이터 부족 ${dr.measuring}대` : ''}</div>`;
        h += dr.top.map(m => {
            const r = m.r;
            const rateTxt = `-${m.rate.toFixed(1)}%/h`;
            const eta = m.eta === Infinity ? '방전 예상 불가' : `방전까지 ${fbEtaText(m.eta)}`;
            const lo = Math.min(m.startBat, r.battery), hi = Math.max(m.startBat, r.battery);   // 막대: 회색 = 지금 남은 배터리 / 색 = 그동안 닳은 구간
            const since = m.cap ? `최근 ${FB_DRAIN_WINDOW_H}시간 기준` : `${fbClock(m.startTs)}부터 소모`;
            const dur = m.cap ? `${fbDurText(m.dtMin)} 관측` : `${fbDurText(m.dtMin)}째`;
            return `<div class="bb-fbp-row sc" data-rid="${fbEsc(r.id)}" title="${fbEsc(`${r.name} · ${since} · ${m.startBat}% → ${r.battery}% · 평균 ${rateTxt}`)}">
                <div class="bb-sc-l1"><span class="bb-fbp-dot" style="background:${STATUS_AC[r.status] || 'var(--mu)'};"></span><span class="bb-fbp-name">${fbEsc(r.name)}</span><span class="bb-dr-st">${fbEsc(STL[r.status] || '')}</span><span class="bb-sc-bat">${r.battery}%</span></div>
                <div class="bb-sc-l2">
                    <span class="bb-sc-bar"><i class="bb-sc-base" style="width:${lo}%;"></i><i class="bb-sc-fill sev-${m.sev}" style="left:${lo}%;width:${Math.max(1.5, hi - lo)}%;"></i></span>
                    <span class="bb-sc-rate">${rateTxt}</span>
                    <span class="bb-sc-eta">${eta}</span>
                </div>
                <div class="bb-sc-l3"><b>${since}</b> · ${dur} · ${m.startBat}% → ${r.battery}%</div>
            </div>`;
        }).join('');
        return h + `<div class="bb-fbp-foot">사용 중 ${dr.active}대 · 측정 중 ${dr.measured}대${dr.measuring ? ` · 데이터 부족 ${dr.measuring}대` : ''}</div>`;
    }
    function fbHtmlNeglect(d) {
        const note = `<div class="bb-fbp-note">순찰 중 → 대기 중으로 바뀐 지 20분(측정 기록 2회)이 지나도 그대로인 기체 · 배달 전용 등 일부 기체는 빠짐</div>`;
        if (!d.ng.length) return note + `<div class="bb-fbp-empty">현재 방치·미주차로 보이는 기체가 없습니다 ✓</div>`;
        return note + d.ng.map(x => {
            const r = x.r;
            return `<div class="bb-fbp-row" data-rid="${fbEsc(r.id)}" title="${fbEsc(`${r.name} · 순찰 종료~대기 전환 약 ${fbClock(x.since)} 무렵으로 추정`)}">
                <span class="bb-fbp-dot" style="background:${STATUS_AC[r.status] || 'var(--mu)'};"></span>
                <span class="bb-fbp-main"><span class="bb-fbp-name">${fbEsc(r.name)}</span></span>
                <span class="bb-fbp-now">방치 약 ${fbDurText(x.minutes)}째</span>
            </div>`;
        }).join('');
    }
    function fbRender() {
        const pop = document.getElementById('bb-fbp');
        if (!pop) return;
        document.querySelectorAll('.bb-fb[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === _fbMode));
        if (_fbMode) { const host = document.getElementById(_fbMode === 'dis' ? 'bb-fixbtns-r' : 'bb-fixbtns'); if (host && pop.parentNode !== host) host.appendChild(pop); }   // 방전 로그는 오른쪽 버튼 아래, 나머지는 왼쪽 버튼 아래에서 열림
        pop.classList.toggle('open', !!_fbMode);
        if (!_fbMode) return;
        const d = _fbData || fbCompute();
        const T = {
            dis:  ['방전 로그(최근 30일)',    `${d.dis.robots}대${d.dis.events.length !== d.dis.robots ? ` · ${d.dis.events.length}건` : ''}`],
            drain:['배터리 소모 기체 TOP5',   `사용 중 ${d.dr.active}대`],
            slow: ['저속충전 기체 TOP5',     `충전 중 ${d.sc.charging}대`],
            neglect: ['순찰 후 미주차 기체',  `${d.ng.length}대`],
        }[_fbMode];
        document.getElementById('bb-fbp-title').textContent = T[0];
        document.getElementById('bb-fbp-cnt').textContent = T[1];
        const body = document.getElementById('bb-fbp-body');
        const keep = body.scrollTop;   // 2분마다 새로 그려도 보던 위치 유지
        body.innerHTML = _fbMode === 'dis' ? fbHtmlDis(d) : _fbMode === 'drain' ? fbHtmlDrain(d) : _fbMode === 'slow' ? fbHtmlSlow(d) : fbHtmlNeglect(d);
        body.scrollTop = keep;
    }
    function refreshFixedTools() {   // 2분 갱신마다 + 열 때마다 호출: 배지와 (열려 있다면) 목록 창을 최신으로
        try {
            fbCompute();
            fbSetBadge('bb-fb-dis', _fbData.dis.events.length, _fbData.dis.recentSure ? 'r' : 'o');   // 숫자 = 최근 30일 방전 '건' 수 (같은 기체라도 건별로 셈). 최근 24시간 안에 확정 방전이 있으면 빨강, 그 밖에는 주황
            fbSetBadge('bb-fb-drain', _fbData.dr.top.length, 'b');   // 배터리 소모: 배지는 목록에 오른 기체 수 (최대 FB_DRAIN_TOP 대). 실제 대수는 버튼 툴팁에 표시
            const bdr = document.getElementById('bb-fb-drain');
            if (bdr) bdr.title = `충전 중이 아닌 기체를 최근 ${FB_DRAIN_WINDOW_H}시간 안의 하락 기록으로 배터리가 빨리 닳는 순으로 (상위 ${FB_DRAIN_TOP}대) · 오른쪽 위 숫자 = 목록에 오른 기체 수 (최대 ${FB_DRAIN_TOP}) · 소모 속도 측정 중 ${_fbData.dr.measured}대 (그중 배터리가 줄고 있는 기체 ${_fbData.dr.dropping}대)`;
            fbSetBadge('bb-fb-slow', _fbData.sc.top.length, 'g');   // 저속충전: TOP5 버튼이므로 배지는 목록에 오른 기체 수(최대 5)만. 실제 측정 대수는 열었을 때 "충전 중 ##대"로 표시
            fbSetBadge('bb-fb-neglect', _fbData.ng.length, 'y');   // 방치/미주차: 노랑
            fbRender();
        } catch (err) { console.error('[BB] 고정 버튼 갱신 오류:', err); }
    }
    document.querySelectorAll('.bb-fb[data-mode]').forEach(btn => btn.addEventListener('click', () => {
        _fbMode = _fbMode === btn.dataset.mode ? null : btn.dataset.mode;   // 같은 버튼을 다시 누르면 닫힘
        refreshFixedTools();
    }));
    document.getElementById('bb-fbp-x').addEventListener('click', () => { _fbMode = null; fbRender(); });
    document.getElementById('bb-fbp-body').addEventListener('click', e => {
        const row = e.target.closest('[data-rid]');
        if (!row) return;
        const r = DB.find(x => x.id === row.dataset.rid);
        if (r) openInfoCardPanel(r);   // 기체 정보 창(배터리 그래프 포함)
    });
    // 바깥을 누르면 닫힘. 버튼/목록 창 안쪽과, 목록에서 연 기체 정보 창 안쪽은 바깥으로 보지 않음 (그 창들을 함께 쓰는 중이므로)
    document.addEventListener('mousedown', e => {
        if (!_fbMode) return;
        if (e.target.closest && e.target.closest('#bb-fixbtns, #bb-fb-dis, #bb-fbp, #bb-info-card-panel')) return;
        _fbMode = null;
        fbRender();
    }, true);
    _fbReady = true;
    refreshFixedTools();

    // ── 줌 기능
    (function() {
        const ZOOM_KEY = 'bba_zoom', ZOOM_MIN = 0.8, ZOOM_MAX = 1.3, ZOOM_STEP = 0.1;
        let zoom = parseFloat(localStorage.getItem(ZOOM_KEY)) || 0.8;   // [admin] 기본 80%
        // 글자 키우기 배율 — 보드/버튼 크기(레이아웃)는 그대로 두고 글자(font-size)만 이 배율로 커짐. 모든 font-size 가 calc(Npx * var(--bb-ts)) 로 되어 있음. 1.0 = 예전 크기
        const TS_KEY = 'bba_ts', TS_DEFAULT = 1.2;
        let ts = parseFloat(localStorage.getItem(TS_KEY)); if (!(ts >= 0.8 && ts <= 1.6)) ts = TS_DEFAULT;
        document.documentElement.style.setProperty('--bb-tg', ts); document.documentElement.style.setProperty('--bb-ts', ts);

        function applyZoom() {
            const bb = document.getElementById('bb');
            if (!bb) return;
            const isDragged = bb.style.left !== '' && bb.style.left !== '50%';
            if (isDragged) {
                bb.style.transform = `scale(${zoom})`;
                bb.style.transformOrigin = 'top left';
            } else {
                bb.style.transform = `translate(-50%, -50%) scale(${zoom})`;
                bb.style.transformOrigin = 'center center';
            }
            document.getElementById('bb-zoom-label').textContent = Math.round(zoom * 100) + '%';
            document.getElementById('bb-zoom-in').disabled  = zoom >= ZOOM_MAX;
            document.getElementById('bb-zoom-out').disabled = zoom <= ZOOM_MIN;
            localStorage.setItem(ZOOM_KEY, zoom.toFixed(1));
            // 개입카드/다중/이석 그리드의 팝업들(#bb 밖에 떠 있는 최상위 패널)은 #bb 의 scale 변형을 상속받지 못해
            // 줌이 걸려도 그대로였음 — 이 변수로 같이 커지게 하되, 축소(80~90%)까지는 따라가지 않도록 1 밑으로는 내려가지 않게 함
            document.documentElement.style.setProperty('--bb-pop-zoom', Math.max(1, zoom));
        }
        document.getElementById('bb-zoom-in').addEventListener('click', () => {
            if (zoom < ZOOM_MAX) { zoom = Math.round((zoom + ZOOM_STEP) * 10) / 10; applyZoom(); }
        });
        document.getElementById('bb-zoom-out').addEventListener('click', () => {
            if (zoom > ZOOM_MIN) { zoom = Math.round((zoom - ZOOM_STEP) * 10) / 10; applyZoom(); }
        });
        applyZoom();
    })();

    // ── 드래그 이동
    (function() {
        const handle = document.getElementById('bb-drag-handle');
        const bb     = document.getElementById('bb');
        let dragging = false, ox = 0, oy = 0;
        handle.addEventListener('mousedown', e => {
            if (e.target.closest('button')) return;   // UP 같은 버튼 클릭은 드래그로 취급하지 않음
            dragging = true;
            const rect = bb.getBoundingClientRect();
            ox = e.clientX - rect.left;
            oy = e.clientY - rect.top;
            handle.style.cursor = 'grabbing';
            e.preventDefault();
        });
        document.addEventListener('mousemove', e => {
            if (!dragging) return;
            const zoom = parseFloat(localStorage.getItem('bba_zoom')) || 0.8;
            const w = bb.offsetWidth  * zoom;
            const h = bb.offsetHeight * zoom;
            let x = e.clientX - ox;
            let y = e.clientY - oy;
            x = Math.max(0, Math.min(window.innerWidth  - w, x));
            y = Math.max(0, Math.min(window.innerHeight - h, y));
            bb.style.left      = x + 'px';
            bb.style.top       = y + 'px';
            bb.style.transform = `scale(${zoom})`;
            bb.style.transformOrigin = 'top left';
        });
        document.addEventListener('mouseup', () => {
            dragging = false;
            handle.style.cursor = '';
        });
    })();

    // ── 백업/복원
    const BACKUP_BASE = 'https://multimonitoring.vercel.app/api/battery';

    wblTriggerImmediateLoadOnRefresh();
    wblLoadYesterdayOnce();

    const BACKUP_NAMES = ['최윤혁', '안혜림', '신지섭', '박수연'];   // 팝업 버튼 순서 (HTML #bb-bk-pop 과 동일)
    const bkPop = document.getElementById('bb-bk-pop');
    let bkMode = null;   // 'backup' | 'restore'

    function closeBkPop() { bkPop.classList.remove('open'); bkMode = null; }
    function toggleBkPop(mode) {
        if (bkMode === mode) { closeBkPop(); return; }   // 같은 버튼을 다시 누르면 닫힘
        bkMode = mode;
        document.getElementById('bb-bk-title').textContent = mode === 'backup' ? '누구 이름으로 백업하시겠습니까?' : '누구의 백업으로 복원하시겠습니까?';
        bkPop.classList.add('open');
    }
    document.getElementById('bb-backup-btn').addEventListener('click', e => { e.stopPropagation(); toggleBkPop('backup'); });
    document.getElementById('bb-restore-btn').addEventListener('click', e => { e.stopPropagation(); toggleBkPop('restore'); });
    bkPop.addEventListener('click', e => {
        const b = e.target.closest('.bb-bk-name');
        if (!b) return;
        const mode = bkMode, name = b.dataset.name;
        closeBkPop();
        if (mode === 'backup') doBackup(name); else if (mode === 'restore') doRestore(name);
    });
    document.addEventListener('mousedown', e => {   // 바깥을 누르면 닫힘
        if (!bkMode) return;
        if (bkPop.contains(e.target) || e.target.closest('#bb-backup-btn, #bb-restore-btn')) return;
        closeBkPop();
    });

    // 목록 백업 = 서버의 이름별 JSON 한 파일에 전부 저장:
    //   최윤혁 → { ids: [...전체(즐겨찾기 먼저)...], fav: [...즐겨찾기 순서...], name, savedAt }
    // (서버 api/battery 가 fav 를 함께 저장하도록 업데이트되어 있어야 함. 구버전 서버는 fav 를 버리므로 저장 후 다시 읽어 확인한다.)
    const FAV_BACKUP_PREFIX = '배터리_즐겨찾기_';   // 예전 방식(별도 기록)으로 저장된 백업을 복원할 때만 읽음

    async function postJson(body) {
        const res = await fetch(BACKUP_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        let json = {};
        try { json = await res.json(); } catch {}
        return { ok: res.ok && json.ok !== false, json };
    }
    async function fetchBackup(name) {   // 이름별 백업 기록 읽기 (없으면 null)
        try {
            const res = await fetch(`${BACKUP_BASE}?name=${encodeURIComponent(name)}`, { cache: 'no-store' });
            if (!res.ok) return null;
            return await res.json();
        } catch { return null; }
    }
    // 예전 방식: 즐겨찾기만 별도 기록({data:{fav}})으로 저장했던 백업 → 배열, 없으면 null
    async function fetchLegacyFavBackup(name) {
        const json = await fetchBackup(FAV_BACKUP_PREFIX + name);
        const fav = json?.data?.fav;
        return Array.isArray(fav) ? fav.map(String) : null;
    }

    async function doBackup(name) {
        const total = ids.length + favIds.length;
        if (!confirm(`"${name}" 이름으로 현재 목록(${total}대)을 백업하시겠습니까?`)) return;
        try {
            const main = await postJson({ ids: [...favIds, ...ids], fav: favIds, name });   // ids = 전체(구버전 호환), fav = 즐겨찾기 순서
            if (!main.ok || main.json.ok !== true) { alert('❌ 백업하지 못했습니다. 잠시 후 다시 시도해 주세요.'); return; }

            // fav 가 실제로 저장됐는지 다시 읽어서 확인 (서버가 fav 를 지원하지 않으면 조용히 버려지기 때문)
            const back = await fetchBackup(name);
            const favSaved = Array.isArray(back?.fav) && JSON.stringify(back.fav.map(String)) === JSON.stringify(favIds.map(String));

            if (favSaved) alert(`✅ 현재 목록 ${total}대(즐겨찾기 ${favIds.length}대 포함)를 "${name}" 이름으로 백업했습니다.`);
            else alert(`⚠️ 현재 목록 ${total}대는 "${name}" 이름으로 백업했지만, 즐겨찾기 정보는 저장하지 못했습니다.\n백업 서버가 즐겨찾기 저장을 지원하도록 업데이트되어 있는지 확인해 주세요.`);
        } catch { alert('❌ 네트워크 오류로 백업하지 못했습니다. 연결 상태를 확인해 주세요.'); }
    }

    async function doRestore(name) {
        if (!confirm(`"${name}" 님의 백업으로 복원하시겠습니까?\n현재 목록(${ids.length + favIds.length}대)은 백업 내용으로 교체됩니다.`)) return;
        try {
            const res = await fetch(`${BACKUP_BASE}?name=${encodeURIComponent(name)}`, { cache: 'no-store' });
            const data = await res.json();
            if (!data.ids || !data.ids.length) { alert(`❌ "${name}" 님의 백업이 저장되어 있지 않습니다.`); return; }

            const allIds = data.ids.map(String);   // 전체 목록 (즐겨찾기 + 일반)
            let favBackup = Array.isArray(data.fav) ? data.fav.map(String) : null;   // 같은 파일에 저장된 즐겨찾기 순서
            if (!favBackup) favBackup = await fetchLegacyFavBackup(name);            // 예전 방식으로 저장된 백업 호환

            if (favBackup) {
                favIds = favBackup.filter((id, i, a) => allIds.includes(id) && a.indexOf(id) === i);
            } else {
                favIds = favIds.filter(id => allIds.includes(id));   // 즐겨찾기 정보가 없는 백업 → 지금 즐겨찾기를 유지(백업에 있는 기체만)
            }
            ids = allIds.filter(id => !favIds.includes(id));
            const moved = clampFav();   // 즐겨찾기 20대 초과분은 일반 목록으로
            const trimmed = clampTotal();   // 카드 총 80대 초과분은 일반 목록의 뒤쪽부터 뺌
            const clampNote = (moved ? `\n즐겨찾기는 최대 ${FAV_MAX}대까지라서 초과한 ${moved}대는 일반 목록으로 옮겼습니다.` : '')
                + (trimmed ? `\n기체 카드는 최대 ${MAX}대까지라서 목록 뒤쪽 ${trimmed}대는 뺐습니다.` : '');
            // 통합 리스트 이전 전에 만든 백업에는 예전 고정 그리드 기체가 없음 → 하나도 없으면 앞쪽에 편입
            const hasLegacy = [...favIds, ...ids].some(id => LEGACY_FIXED_SITE_IDS.includes(DB.find(x => x.id === id)?.siteId));
            if (!hasLegacy) prependLegacyFixed();
            save(); render();

            const total = ids.length + favIds.length;
            const say = m => alert(m);
            if (favBackup) {
                say(`✅ "${name}" 님의 백업으로 복원했습니다. (현재 목록 ${total}대, 즐겨찾기 ${favIds.length}대 포함)` + clampNote);
            } else if (favIds.length) {
                say(`✅ "${name}" 님의 백업으로 복원했습니다. (현재 목록 ${total}대)\n이 백업에는 즐겨찾기 정보가 없어서, 지금 쓰시던 즐겨찾기 ${favIds.length}대를 그대로 유지했습니다.` + clampNote);
            } else {
                say(`✅ "${name}" 님의 백업으로 복원했습니다. (현재 목록 ${total}대)\n이 백업에는 즐겨찾기 정보가 없어서 모두 일반 목록으로 불러왔습니다.\n즐겨찾기를 지정한 뒤 다시 백업하시면 다음부터 함께 복원됩니다.` + clampNote);
            }
        } catch { alert('❌ 네트워크 오류로 복원하지 못했습니다. 연결 상태를 확인해 주세요.'); }
    }

    // ============================================================
    // SECTION 15. 토큰 발송
    // ============================================================
    setTimeout(async () => {
        // 원격 오프라인 스위치가 도착할 때까지 잠깐(최대 3초) 기다렸다가 판단 — 평소엔 설정이 이미 와 있어 지연이 거의 없다
        await Promise.race([_bbCfgReady, new Promise(r => setTimeout(r, 3000))]);
        bbSyncOffline();
        _bbTokenPhaseDone = true;
        if (bbIsOffline()) { console.log('[BB] 오프라인 모드 — bb_token 미발송'); return; }
        bbSendToken();
    }, 200);

    // ============================================================
    // SECTION 16. 다중 모니터링 — patrol_watch_live.json (Cloudflare Worker가 약 1분 간격으로 Gist에 게시)
    //  - 갱신 주기: 기체 데이터(bb_robots_data, 2분)와 무관하게 이 파일만 30초마다 독립적으로 받아온다.
    //    (Worker 가 파일을 새로 게시하는 주기는 약 1분 — 30초 조회는 새 게시본을 최대 30초 안에 잡아내기 위함)
    //  - 표시 대상: status 가 'ongoing' | 'anomaly' 인 기체 (finished / wrong_duplicate 는 숨김)
    //  - "N분째 POI 미갱신" 판정과 기체별 허용 시간은 Worker(index.js)가 유일한 기준이다.
    //    (기체마다 순찰 시 POI 간격이 달라 기체별 허용 시간이 다름 — 표는 Worker 의 UNITS / POI_OVERRIDE_MIN)
    //    여기서는 status('anomaly') 와 limit_min 을 그대로 표시만 한다. 판정 기준을 이 파일에 또 두면 두 파일이 어긋난다.
    // ============================================================
    //  읽는 순서: ① Cloudflare Worker /live (Durable Object — 원본, 30초 갱신) → ② 실패하면 Gist raw (미러·백업)
    //  Worker 가 실패하면 60초 동안은 Worker 를 건너뛰고 Gist 만 읽는다 (장애 중 매번 15초씩 기다리지 않도록).
    const PATROL_WORKER_URL = 'https://patrol-watch-worker.ubase00070.workers.dev/live';
    const PATROL_LIVE_URL = 'https://gist.githubusercontent.com/ubase00070/bd7773a059217fb81b0be90c961fcc22/raw/patrol_watch_live.json';   // 백업(Gist 미러)
    const PATROL_REFRESH_MS = 30 * 1000;   // 30초마다 조회 (NCC API 와 무관 — Worker/Gist 파일만 읽음)
    const PATROL_WORKER_TIMEOUT_MS = 8000;
    let _patrolWorkerFailUntil = 0;
    let _patrolSrc = '';                   // 마지막으로 읽은 곳: 'Worker' | 'Gist(대체)'

    async function fetchPatrolOne(url, ms) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), ms);
        try {
            const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            if (!data || !Array.isArray(data.records)) throw new Error('데이터 형식 오류');
            return data;
        } finally {
            clearTimeout(timer);
        }
    }

    async function fetchPatrolData() {
        if (Date.now() >= _patrolWorkerFailUntil) {
            try {
                const data = await fetchPatrolOne(`${PATROL_WORKER_URL}?t=${Date.now()}`, PATROL_WORKER_TIMEOUT_MS);
                _patrolSrc = 'Worker';
                return data;
            } catch (e) {
                _patrolWorkerFailUntil = Date.now() + 60 * 1000;
                console.warn('[BB] Worker 읽기 실패 → Gist 로 대체:', e.message);
            }
        }
        const data = await fetchPatrolOne(`${PATROL_LIVE_URL}?t=${Date.now()}`, 15000);
        _patrolSrc = 'Gist(대체)';
        return data;
    }
    let _patrolBusy = false;
    let _patrolSig = null;
    let _patrolLastUpdated = null;
    let _patrolAnomaly = { n: 0, max: 0 };   // 미갱신(이상) 카드 수 / 최대 미갱신 분 — 이석 화면의 '« 다중' 버튼 점멸에 사용 (SECTION 17)

    // ── 3시간 넘게 순찰하는 기체 (Worker 감시 창 초과 대응) ──────────────
    //  Worker 는 Slack 조회 부담 때문에 최근 3시간의 배정 메시지만 보므로, 순찰이 3시간을 넘기면 피드(patrol_watch_live.json)에서 카드가 사라진다.
    //  여기에 적은 기체는 피드에 기록이 없어도 NCC 상태가 '순찰 중'이면 보드가 카드를 대신 유지한다. (POI 는 확인할 수 없으므로 '미표기')
    //  key = NCC 기체명(전체), 값 = 카드에 표시할 이름 (Worker UNITS 의 짧은 이름과 같게)
    const PATROL_LONG_UNITS = {
        '전주천(덕진구) 1호기': '전주시 전주천',
    };
    const PATROL_KEEP_LS = 'bb_patrol_keep';            // 마지막으로 피드에서 본 시작 시각·담당자 (새로고침해도 이어서 표시)
    const PATROL_KEEP_MAX_MS = 3 * 3600 * 1000;         // 마지막으로 본 지 이보다 오래되면 그 정보는 쓰지 않음
    let _patrolKeep = (() => { try { return JSON.parse(localStorage.getItem(PATROL_KEEP_LS)) || {}; } catch { return {}; } })();
    let _patrolKeepSavedAt = 0;
    let _patrolFeed = null;   // 마지막으로 받은 피드 { records, updated_at } — NCC 상태(DB)가 갱신될 때도 카드를 다시 판단하기 위해 보관

    // ── (호환용) 간소화명 → NCC 기체명(전체) ─────────────────────────
    //  Worker 가 records[].robot_full 을 내려주므로 평소에는 쓰이지 않는다. 예전 Worker 가 게시한 JSON 이거나
    //  robot_full 이 없을 때만 카드 클릭 매칭에 사용. (같은 간소화명을 쓰는 기체가 여럿이면 배열)
    const PATROL_FULL_NAMES = {
        '용인 고진': '용인 고진역 힐스테이트 1호기',
        '경희대 1': '경희대학교 국제캠퍼스 1호기',
        '경희대 2': '경희대학교 국제캠퍼스 2호기',
        '성남 판교': '성남시 판교역 1호기',
        '성남 서현': '성남시 서현역 １호기',
        '성남 율동': '성남시 율동공원 1호기',
        '성남 야탑': '성남시 야탑역 1호기',
        '부산 호반 1': '부산 EDC 호반써밋 1호기',
        '부산 호반 2': '부산 EDC 호반써밋 2호기',
        '부산 수자인 1': '부산 EDC 수자인 1호기',
        '부산 수자인 2': '부산 EDC 수자인 2호기',
        '파주': '파주 디에트르더클래스 1호기',
        '리센츠 1': '잠실 리센츠 아파트 1호기',
        '리센츠 2': '잠실 리센츠 아파트 2호기',
        '평택 1': '평택고덕 디에트르 1호기',
        '평택 2': '평택고덕 디에트르 2호기',
        '부산 서면': '부산 서면비스타동원 1호기',
        '부천 위브': '부천 위브 1호기',
        '잠실 레이크': '잠실 레이크팰리스 1호기',
        '엘스 1': '잠실 엘스 아파트 1호기',
        '엘스 2': '잠실 엘스 아파트 2호기',
        '인력개발원': '삼성인력개발원 1호기',
        '고양 래미안': '고양 래미안 휴레스트 1호기',
        '창원대 1': '창원대학교 1호기',
        '창원대 2': '창원대학교 2호기',
        '한성대': '한성대학교 1호기',
        '김포 풍무': '김포풍무센트럴푸르지오 1호기',
        '강남 래미안': '강남 래미안블레스티지 1호기',
        '김포 1': '김포 캐슬앤파밀리에 1호기',
        '김포 2': '김포 캐슬앤파밀리에 2호기',
        '지제': '지제역 푸르지오엘리아츠 1호기',
        '부경대': ['부경대 1호기', '부경대 2호기'],
        'DMZ': 'DMZ 캠프 그리브스 1호기',
        '쉴더스': '롯데마트부산CFC(쉴더스) 1호기',
        '두루아이 3': '두루아이 3호기',
        '두루아이 4': '두루아이 4호기',
        '두루아이 5': '두루아이 5호기',
        '중앙대': ['중앙대학교 1호기'],
        '잠실 르엘': '잠실 르엘 1호기',
        '신동백': '신동백 롯데캐슬 에코1단지 1호기',
        '청담 르엘': '청담르엘 1호기',
        '전주천': '전주시 전주천 1호기',
        '인재개발원': '인재개발원 1호기',
        '아주대 1': '아주대학교 1호기',
        '아주대 2': '아주대학교 2호기',
        '서강대': '서강대학교 1호기',
        '광교 풍경채': ['광교 풍경채 1호기', '광교풍경채(대체 기체) 1호기'],
        '동백SK': '동백SK아펠바움 1차 1호기',
        '구리 롯데캐슬': '구리역 롯데캐슬 시그니처 1호기',
        '동대문구 회기동': '동대문구회기동 1호기(쉴드플러스)',
        '더샵남천': '더샵남천프레스티지 1호기',
        '장애인고용공단 1': '한국장애인고용공단 1호기',
        '장애인고용공단 2': '한국장애인고용공단 2호기',
        '양원LH': '서울 양원 LH 1단지 1호기',
        '덕수궁': '덕수궁 1호기',
        '순천향': '순천향대학교 1호기',
		'전주시 덕진구': '전주천(덕진구) 1호기',
		'수원센트럴 1': '수원센트럴 1호기',
		'수원센트럴 2': '수원센트럴 2호기',
    };
    try { window.__bbaPatrolNames = { full: PATROL_FULL_NAMES, long: PATROL_LONG_UNITS }; } catch (e) { /* 무시 */ }   // [admin] 간소화명 → NCC 기체명

    // poi_text → { poi: 현재 POI명, act: 이동 중/도착/복귀 중, unit: 기체 전체 이름(있을 때) }
    //  예) "[사이트][기체] [명덕동 코스5]로 이동합니다."  → { poi:'명덕동 코스5', act:'이동 중' }
    //      "[[SK쉴더스] 순천향대학교][순천향대학교 1호기] 대기장소에 도착했어요." → { poi:'대기장소', act:'도착' }
    //      "(아직 POI 갱신 없음)" → { poi:'아직 POI 갱신 없음', act:'' }
    function patrolParsePoi(text) {
        const raw = (text || '').trim();
        if (!raw) return { poi: '', act: '', unit: '' };
        if (/^\(.*\)$/.test(raw)) return { poi: raw.slice(1, -1), act: '', unit: '' };

        // 앞쪽 최상위 [ ] 묶음 최대 3개 = 사이트 / 기체 / POI (중첩 괄호 대응)
        let i = 0;
        const groups = [];
        while (groups.length < 3) {
            while (i < raw.length && /\s/.test(raw[i])) i++;
            if (raw[i] !== '[') break;
            let depth = 0, j = i;
            for (; j < raw.length; j++) {
                if (raw[j] === '[') depth++;
                else if (raw[j] === ']' && --depth === 0) break;
            }
            if (j >= raw.length) break;
            groups.push(raw.slice(i + 1, j));
            i = j + 1;
        }
        const rest = raw.slice(i).trim();

        let poi, tail;
        if (groups.length >= 3) {
            poi = groups[2]; tail = rest;
        } else {   // [POI] 없이 "대기장소에 도착했어요." / "스테이션에 도착했어요." 형태
            const m = /^(.*?)(?:으로|로|에)?\s*(이동합니다|도착했습니다|도착했어요|복귀합니다)/.exec(rest);
            poi = m ? m[1].trim() : rest;
            tail = m ? m[2] : '';
        }
        let act = '';
        if (/이동/.test(tail)) act = '이동 중';
        else if (/도착/.test(tail)) act = '도착';
        else if (/복귀/.test(tail)) act = '복귀 중';
        return { poi: poi.replace(/[.\s]+$/, ''), act, unit: groups[1] || '' };   // unit = 메시지의 [기체 전체 이름]
    }

    // "HH:MM(:SS)" → 하루 중 분 (잘못된 값이면 null)
    function patrolHm(str) {
        const m = /^(\d{1,2}):(\d{2})/.exec(str || '');
        return m ? (+m[1]) * 60 + (+m[2]) : null;
    }
    // 순찰 시작 후 경과 분: 기준 시각(피드 게시 시각) - 시작 시각. 자정을 넘겨도 맞도록 24시간 순환 처리
    function patrolAgeMin(startHhmm, refMin) {
        const st = patrolHm(startHhmm);
        if (st === null || refMin === null) return null;
        let age = (refMin - st + 1440) % 1440;
        if (age > 720) age -= 1440;   // 기준 시각보다 살짝 뒤(시계 오차)로 찍힌 값은 "방금 시작"으로 취급
        return age;
    }

    // records → 표시용 카드: 이상(anomaly) 먼저(오래 멈춘 순), 이상 없는 기체는 순찰 시작이 최근인 순 (위가 최신)
    function buildPatrolCards(records, refMin = null, extraCards = []) {
        const seen = new Set();
        return (records || [])
            .filter(r => r && (r.status === 'ongoing' || r.status === 'anomaly'))
            .filter(r => {   // 완전히 동일한 레코드만 중복 제거 (짧은 이름이 같은 다른 기체는 그대로 둠)
                const k = [r.robot, r.start_hhmm, r.poi_text].join('|');
                if (seen.has(k)) return false;
                seen.add(k);
                return true;
            })
            .map(r => {
                const p = patrolParsePoi(r.poi_text);
                const stale = Number.isFinite(r.stale_min) ? r.stale_min : 0;
                const limit = Number.isFinite(r.limit_min) ? r.limit_min : undefined;   // Worker 가 판정에 쓴 허용 시간(분)
                const anomaly = r.status === 'anomaly';                                  // 판정은 Worker 것을 그대로 (기준이 한 곳)

                return {
                    robot: r.robot || '(이름 없음)',
                    staff: Array.isArray(r.staff_list) ? r.staff_list : [],
                    anomaly, stale,
                    lap: Number.isFinite(r.lap) ? r.lap : null, lapTotal: Number.isFinite(r.lap_total) ? r.lap_total : null,   // 바퀴수 (Worker 의 lap / lap_total)
                    poi: p.poi || r.poi_text || '-',
                    act: p.act,
                    unit: p.unit,
                    full: r.robot_full || '',   // NCC 기체명(전체) — Worker 가 내려줌
                    start: r.start_hhmm || '',   // 순찰 시작 시각 (Worker 의 start_hhmm)
                    age: patrolAgeMin(r.start_hhmm, refMin),   // 시작 후 경과 분 (작을수록 최근)
                    tip: `${r.robot} | 시작 ${r.start_hhmm || '-'} | ${r.poi_text || ''}` + (limit !== undefined ? ` | 허용 ${limit}분` : '') + ' | 클릭: 기체 정보',
                };
            })
            .concat(extraCards)   // 장기 순찰 기체 카드(피드에 없어서 보드가 대신 만든 것)도 같은 기준으로 정렬
            .sort((a, b) => {
                if (a.anomaly !== b.anomaly) return b.anomaly - a.anomaly;
                if (a.anomaly) return (b.stale - a.stale) || a.robot.localeCompare(b.robot, 'ko', { numeric: true });
                // 이상 없음: 최근에 시작한 순찰이 위. 시작 시각 정보가 없는 카드는 맨 아래
                const aa = a.age ?? Infinity, bb = b.age ?? Infinity;
                if (aa !== bb) return aa - bb;
                // 기준 시각을 모를 때(피드에 updated_at 없음)는 시각 문자열 내림차순
                if (a.age === null && b.age === null && a.start !== b.start) return b.start.localeCompare(a.start);
                return a.robot.localeCompare(b.robot, 'ko', { numeric: true });
            });
    }

    // ── 카드 → NCC 기체(DB) 매칭 ─────────────────────────────────────
    const normName = n => String(n || '').normalize('NFKC').replace(/\s+/g, ' ').trim();   // 전각 '１호기' 등도 같게 취급

    function findPatrolRobot(c) {
        const byName = new Map(DB.map(r => [normName(r.name), r]));
        // 1) Worker 가 내려준 기체 전체 이름 (가장 정확)
        for (const name of [c.full, c.unit]) {   // 2) 없으면 POI 메시지 속 [기체 전체 이름]
            if (!name) continue;
            const hit = byName.get(normName(name));
            if (hit) return hit;
        }
        // 3) (호환) 하드코딩 표: 간소화명 → 전체 기체명
        const found = [].concat(PATROL_FULL_NAMES[c.robot] || []).map(f => byName.get(normName(f))).filter(Boolean);
        if (found.length <= 1) return found[0] || null;
        return found.find(r => r.status === 'patrolling') || found[0];   // 후보가 여럿이면 순찰 중인 기체 우선
    }

    function openPatrolRobotInfo(c) {
        const r = findPatrolRobot(c);
        if (!r) { flashPatrolNotice(`⚠ "${c.robot}" 기체를 기체 목록에서 찾지 못했습니다`); return; }
        openInfoCardPanel(r);
    }

    function renderPatrolCards(cards) {
        const body = document.getElementById('bb-mm-body');
        if (!body) return;
        const mk = (tag, cls, text) => {
            const el = document.createElement(tag);
            el.className = cls;
            if (text !== undefined) el.textContent = text;
            return el;
        };
        const frag = document.createDocumentFragment();
        cards.forEach(c => {
            const el = mk('div', 'bb-mm-card' + (c.anomaly ? ' anomaly' : ''));
            el.title = c.tip;
            el.dataset.full = c.full || '';   // [admin] NCC 기체명(전체) — 무선충전 점검에서 '순찰 중' 기체를 가려내는 데 사용

            // 1줄: 기체명 · 순찰 중 ··· 요원
            const l1 = mk('div', 'bb-mm-l1');
            const st = mk('span', 'bb-mm-st');
            st.append(mk('span', 'bb-mm-dot'), document.createTextNode('순찰 중'));
            l1.append(
                mk('span', 'bb-mm-name', c.robot),
                st,
                ...(c.start ? [mk('span', 'bb-mm-since', `${c.start}부터`)] : []),   // 예: 22:35부터 (순찰 중 옆)
                ...((c.lap && c.lapTotal) ? [mk('span', 'bb-mm-lap', `${c.lap}/${c.lapTotal} 바퀴`)] : []),   // 예: 6/21 바퀴
                mk('span', 'bb-mm-staff', c.staff.length ? c.staff.join('·') : (c.carried ? '담당 미표기' : '담당 없음'))
            );

            // 2줄: 현재 POI ··· N분째 POI 미갱신(이상일 때만, 우측)
            const l2 = mk('div', 'bb-mm-l2');
            l2.append(mk('span', 'bb-mm-poi', c.poi));
            if (c.act) l2.append(mk('span', 'bb-mm-act', c.act));
            if (c.anomaly) l2.append(mk('span', 'bb-mm-stale', `${c.stale}분째 POI 미갱신`));

            el.append(l1, l2);
            frag.appendChild(el);
        });
        body.replaceChildren(frag);   // 카드가 없으면 body 가 비어 빈 상태 문구(:empty)가 자동 표시됨
    }

    let _patrolStatus = { text: '불러오는 중…', warn: false };
    let _patrolFlashTimer = null;
    function paintPatrolStatus(text, warn) {
        const sub = document.getElementById('bb-mm-sub');
        if (sub) { sub.textContent = text; sub.classList.toggle('warn', !!warn); }
    }
    function setPatrolStatus(text, warn) {
        _patrolStatus = { text, warn: !!warn };
        if (!_patrolFlashTimer) paintPatrolStatus(text, warn);   // 안내 문구가 떠 있는 동안은 끝난 뒤 최신 상태로 복구
    }
    function flashPatrolNotice(msg) {   // 잠깐(3초) 보였다가 원래 상태 문구로 복구
        paintPatrolStatus(msg, true);
        clearTimeout(_patrolFlashTimer);
        _patrolFlashTimer = setTimeout(() => {
            _patrolFlashTimer = null;
            paintPatrolStatus(_patrolStatus.text, _patrolStatus.warn);
        }, 3000);
    }
    function setPatrolTitle(count) {
        const t = document.getElementById('bb-mm-title');
        if (!t) return;
        t.textContent = '';
        const n = document.createElement('span');
        n.className = 'bb-mm-count';   // 대수만 빨간색
        n.textContent = `${count}대`;
        t.append('다중 모니터링 기체 ', n);
    }

    // 피드에 기록이 없는데 NCC 상태가 '순찰 중'인 장기 순찰 기체 → 대신 유지하는 카드 (POI 미표기)
    function buildLongPatrolCards(records, refMin) {
        const out = [];
        for (const [full, shortName] of Object.entries(PATROL_LONG_UNITS)) {
            const key = normName(full);
            // Worker 가 이 기체의 기록(진행/완료/오배정 무엇이든)을 갖고 있으면 그쪽이 기준. 3시간이 지나 기록 자체가 없을 때만 대신 유지.
            if ((records || []).some(r => r && normName(r.robot_full) === key)) continue;
            const rb = DB.find(r => normName(r.name) === key);
            if (!rb || rb.status !== 'patrolling') continue;   // NCC 가 순찰 중으로 알려 줄 때만
            const k = _patrolKeep[full];
            const keep = (k && Date.now() - k.seenAt < PATROL_KEEP_MAX_MS) ? k : null;   // 피드에서 마지막으로 본 시작 시각·담당자
            const start = (keep && keep.start) || '';
            out.push({
                robot: shortName,
                staff: (keep && Array.isArray(keep.staff)) ? keep.staff : [],
                anomaly: false, stale: 0,
                poi: '미표기', act: '', unit: '',
                full,
                start,
                age: patrolAgeMin(start, refMin),
                carried: true,
                tip: `${shortName} | 순찰 3시간 초과 — NCC 상태가 순찰 중이라 카드 유지, POI 미표기 | 클릭: 기체 정보`,
            });
        }
        return out;
    }

    // 피드에 있는 장기 순찰 기체의 시작 시각·담당자를 기억해 둔다 (3시간이 지나 피드에서 사라진 뒤 카드에 이어서 표시)
    function rememberLongPatrol(cards) {
        let changed = false;
        for (const full of Object.keys(PATROL_LONG_UNITS)) {
            const c = cards.find(x => !x.carried && normName(x.full) === normName(full));
            if (!c) continue;
            const prev = _patrolKeep[full];
            if (!prev || prev.start !== c.start || JSON.stringify(prev.staff) !== JSON.stringify(c.staff)) changed = true;
            _patrolKeep[full] = { start: c.start, staff: c.staff, seenAt: Date.now() };   // seenAt 은 메모리에서는 매번 갱신
        }
        if (changed || (Object.keys(_patrolKeep).length && Date.now() - _patrolKeepSavedAt > 5 * 60 * 1000)) {   // 저장은 바뀔 때 + 5분에 한 번
            _patrolKeepSavedAt = Date.now();
            try { localStorage.setItem(PATROL_KEEP_LS, JSON.stringify(_patrolKeep)); } catch {}
        }
    }

    // 마지막으로 받은 피드 + 현재 NCC 상태(DB) → 카드 목록/카운트/미갱신 표시를 다시 계산해 그린다.
    // (피드는 30초마다, NCC 상태는 2분마다 갱신되므로 둘 중 어느 쪽이 바뀌어도 이 함수로 다시 판단)
    function rebuildPatrolView() {
        if (!_patrolFeed) return;
        const refMin = patrolHm(_patrolFeed.updated_at);   // 기준 = Worker 가 게시한 시각(KST)
        let longCards = [];
        try { longCards = buildLongPatrolCards(_patrolFeed.records, refMin); }
        catch (e) { console.warn('[BB] 장기 순찰 카드 계산 실패:', e.message); }
        const cards = buildPatrolCards(_patrolFeed.records, refMin, longCards);
        try { rememberLongPatrol(cards); } catch {}
        const anomalies = cards.filter(c => c.anomaly);
        _patrolAnomaly = { n: anomalies.length, max: anomalies.reduce((m, c) => Math.max(m, c.stale || 0), 0) };
        syncAttBackAlert();   // 이석 화면에 가 있어도 다중의 미갱신을 놓치지 않도록
        const sig = JSON.stringify(cards);
        if (sig !== _patrolSig) {   // 바뀐 게 없으면 다시 그리지 않음 (점멸 애니메이션/스크롤 유지)
            _patrolSig = sig;
            renderPatrolCards(cards);
        }
        setPatrolTitle(cards.length);
    }

    async function refreshPatrolLive() {
        if (_patrolBusy) return;
        _patrolBusy = true;
        try {
            const data = await fetchPatrolData();

            _patrolLastUpdated = data.updated_at || null;
            _patrolFeed = { records: data.records, updated_at: data.updated_at };
            window.__bbaPatrolRecords = data.records;   // [admin] 순찰 일정의 '순찰완료' 표기용 (같은 Worker 피드)
            rebuildPatrolView();
            setPatrolStatus(`${_patrolLastUpdated || '-'} 기준(POI 정체 감지)${_patrolSrc === 'Gist(대체)' ? ' · Gist 대체' : ''}`, false);   // 게시 시각 (Gist 로 읽었을 때만 표시)
        } catch (e) {
            console.warn('[BB] 다중 모니터링 갱신 실패:', e.message);
            setPatrolStatus(_patrolLastUpdated
                ? `⚠ 불러오기 실패 · 마지막 ${_patrolLastUpdated} 기준`
                : '⚠ 불러오기 실패', true);
        } finally {
            _patrolBusy = false;
        }
    }
    // 보드가 열려 있고 탭이 실제로 보일 때만 조회 (닫혀 있거나 백그라운드 탭이면 요청 없음). 열 때(openBoard)마다 즉시 한 번 더 조회
    setInterval(() => { if (isOpen && !document.hidden) refreshPatrolLive(); }, PATROL_REFRESH_MS);
    document.addEventListener('visibilitychange', () => { if (isOpen && !document.hidden) refreshPatrolLive(); });
    _patrolReady = true;
    if (isOpen) refreshPatrolLive();

    // ============================================================
    // SECTION 17. 이석/착석 현황 — 다중 모니터링 영역과 좌우 슬라이드 전환 (awayboard 이식)
    //  - 데이터: multimonitoring.vercel.app/api (Slack → 서버가 1분마다 수집·정리한 결과). NCC API(2분)/다중 모니터링(30초)과 완전히 별개.
    //  - 이석 화면이 실제로 보일 때만 30초마다 조회 (다중 화면이거나 보드가 닫혀 있거나 탭이 가려져 있으면 요청 없음)
    //  - 확인사항 판정 / 카드 색상 레벨(lv) / 카드 순서(근무 시작 시각순)는 서버가 계산해서 내려줌 → 여기서는 표시만 한다.
    //    (판정 기준을 이 파일에 또 두면 서버와 어긋남 — 기준은 서버 lib/attendance-core.js 한 곳)
    //  - 새로고침하면 항상 다중 화면이 기본 (전환 상태를 저장하지 않음)
    // ============================================================
    var _ivAlertHook = null;   // SECTION 18 이 등록하는 '다중 »' 버튼 점멸 동기화 함수
    var _attReady = false;   // SECTION 17 초기화가 끝난 뒤 true (openBoard 가 로딩 중에 먼저 호출되므로 var 로 선언 — _patrolReady 와 같은 방식)
    const ATT_API = 'https://multimonitoring.vercel.app/api';
    const ATT_REFRESH_MS = 30 * 1000;   // 서버는 1분 간격으로 수집 → 30초마다 확인해 새 데이터를 최대 30초 안에 반영
    const ATT_STALE_MIN = 15;           // 서버 갱신 시각(heartbeat 10분)이 이보다 오래되면 '수집 지연' 경고
    const ATT_QUIET = [3 * 60, 8 * 60]; // cron-job.org 에서 수집을 멈추는 시간대(KST 03:00~08:00) — 크론 스케줄을 바꾸면 여기도 맞출 것. 이 시간대에는 '수집 지연' 경고를 내지 않음
    const ATT_VIOL_LABELS = ['15분 초과 이석', '착석 미기입', '메시지 편집됨', '출근 60분 이내 이석'];   // '착석 60분 이내 재이석'은 '자세히' 표와 마찬가지로 근무자 카드에서도 집계·표시하지 않음
    const ATT_EXCLUDE = ['차현모', '김용욱', '이연지', '정우솔'];
    // 관리자: 업무상 자리를 자주 비워 일반 근무자와 같은 기준으로 평가할 수 없음 → 근무자 카드/누적 통계 표에서 숨기고,
    // 이석 현황 제목 왼쪽의 동그란 버튼(안·박·신) / 누적 통계 검색창 옆 버튼으로만 본다. 순서 = 버튼 순서
    const ATT_MGRS = [{ ab: '안', name: '안혜림' }, { ab: '박', name: '박수연' }, { ab: '신', name: '신지섭' }];
    const attMgrOf = s => ATT_MGRS.find(m => (s.name || '').includes(m.name) || (s.dn || '').includes(m.name)) || null;

    let _attView = 'multi';   // 'multi' | 'att'
    let _attDate = null;      // null = 실시간, 'YYYY-MM-DD' = 과거 기록
    let _attLive = null;      // 마지막으로 받은 실시간 데이터
    let _attDay = null;       // { date, stats, msg } 과거 기록
    let _attFail = false, _attBusy = false, _attSig = null;
    let _attPopId = null, _attCalWhich = null, _attDetailYm = null, _attSortKey = 'totalSec', _attPlogKey = '';
    let _attPopAvgYm = null, _attPopAvgMap = null;   // 카드 팝업(실시간 이석 로그)의 미기입 보정용 — 이번 달 사람별 평균 캐시
    let _attNameFilter = '', _attLast = null;   // 상세 로그 이름 검색어 (창을 닫았다 열어도/월을 바꿔도 유지, 새로고침하면 초기화 — 저장하지 않음) / 마지막으로 그린 월 데이터
    const _attMonthCache = {}, _attSchedCache = {}, _attDayCache = {}, _attSchedErr = {};

    const $att = id => document.getElementById(id);
    const attEl = (tag, cls, text) => {
        const el = document.createElement(tag);
        if (cls) el.className = cls;
        if (text !== undefined) el.textContent = text;
        return el;
    };
    const attPad = n => String(n).padStart(2, '0');
    const attKst = ms => new Date((ms === undefined ? Date.now() : ms) + 9 * 3600 * 1000);   // getUTC* 로 읽으면 KST
    const attYmd = d => d.getUTCFullYear() + '-' + attPad(d.getUTCMonth() + 1) + '-' + attPad(d.getUTCDate());
    const attHM = ms => { const d = attKst(ms); return attPad(d.getUTCHours()) + ':' + attPad(d.getUTCMinutes()); };
    const attKstMin = ms => { const d = attKst(ms); return d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60; };
    function attAddDays(ymd, n) { const d = new Date(ymd + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return attYmd(d); }
    function attDur(sec) {
        if (sec === null || sec === undefined) return '-';
        const t = Math.round(sec);
        return Math.floor(t / 60) + '분 ' + (t % 60) + '초';
    }
    function attDurHM(sec) {   // 60분 미만 'N분 N초', 이상 'N시간 N분'
        if (sec === null || sec === undefined) return '-';
        const m = Math.floor(sec / 60);
        return m < 60 ? attDur(sec) : (Math.floor(m / 60) + '시간 ' + (m % 60) + '분');
    }
    function attOnShift(shift, minOfDay) {   // shift = [시작분, 종료분] (자정 넘김 처리). 근무시간을 모르면 근무 중으로 취급
        if (!shift) return true;
        const s = shift[0], e = shift[1];
        if (s === e) return true;
        return s < e ? (minOfDay >= s && minOfDay < e) : (minOfDay >= s || minOfDay < e);
    }
    // 실시간 스레드 날짜 (서버가 내려준 date 우선, 아직 없으면 05:00 기준으로 추정)
    const attLiveDate = () => (_attLive && _attLive.date) || attYmd(attKst(Date.now() - 5 * 3600 * 1000));
    // [이전달, 이번달] = 'YYYY-MM' 2개 — 조회 가능한 달은 항상 이 두 개뿐
    function attMonths() {
        const p = attLiveDate().split('-').map(Number);
        const prev = new Date(Date.UTC(p[0], p[1] - 2, 1));
        return [prev.getUTCFullYear() + '-' + attPad(prev.getUTCMonth() + 1), p[0] + '-' + attPad(p[1])];
    }

    /* ───────── 화면 전환 ───────── */
    function attSetView(v) {
        _attView = v;
        $att('bb-mm-track').classList.toggle('att', v === 'att');
        // [UI 개편: 3분할 그리드라 모두 항상 보임 — inert 처리 주석처리]
        // $att('bb-mm-page-multi').inert = (v === 'att');
        // $att('bb-mm-page-att').inert = (v !== 'att');
        if (v === 'att') { attRender(); if (!_attDate) attRefreshLive(); }
        else attCloseFloating();
    }
    function attCloseFloating() { attClosePop(); attCloseCal(); attCloseDetail(); attClosePlog(); }
    // 보드를 다시 열 때 (openBoard 에서 호출)
    function attOnOpen() { if (_attView === 'att' && !_attDate) attRefreshLive(); }

    // 다중 모니터링에 '미갱신' 이상이 하나라도 있으면 « 다중 버튼이 그 카드와 같은 색·점멸 (refreshPatrolLive 에서 호출)
    function syncAttBackAlert() {
        const b = $att('bb-att-back');
        if (!b) return;
        const a = _patrolAnomaly;
        b.classList.toggle('alert', a.n > 0);
        b.title = a.n > 0 ? `다중 모니터링 ${a.n}대 POI 미갱신 (최대 ${a.max}분째) — 클릭하면 다중 화면으로` : '다중 모니터링으로 돌아가기';
        if (_ivAlertHook) _ivAlertHook();
    }

    /* ───────── 데이터 로드 ───────── */
    async function attFetchJson(url, ms = 15000) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), ms);
        try {
            const res = await fetch(url, { signal: ctrl.signal });
            if (res.status === 404) return { _404: true };
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return await res.json();
        } finally { clearTimeout(timer); }
    }

    async function attRefreshLive() {
        if (_attBusy) return;
        _attBusy = true;
        try {
            const data = await attFetchJson(ATT_API + '/attendance');
            if (!data || !Array.isArray(data.stats)) throw new Error('데이터 형식 오류');
            data.stats = data.stats.filter(s => !ATT_EXCLUDE.some(n => (s.name || '').includes(n)));
            _attLive = data; _attLive._at = Date.now(); _attFail = false;
        } catch (e) {
            console.warn('[BB] 이석 현황 갱신 실패:', e.message);
            _attFail = true;
        } finally { _attBusy = false; }
        if (_attView === 'att' && !_attDate) attRender();
    }

    async function attLoadDay(ds) {
        const hit = _attDayCache[ds];
        if (hit && Date.now() - hit.at < (ds >= attAddDays(attLiveDate(), -2) ? 5 * 60000 : 3600000)) { _attDay = hit.v; attRender(); return; }
        _attDay = { date: ds, stats: null, msg: '불러오는 중…' };
        attRender();
        try {
            const d = await attFetchJson(ATT_API + '/attendance-data?action=archive&date=' + ds);
            if (_attDate !== ds) return;   // 그 사이 다른 날짜/실시간으로 바뀜
            _attDay = d._404 ? { date: ds, stats: [], msg: '이 날짜의 기록이 없습니다' } : { date: ds, stats: d.stats || [], msg: '' };
            _attDayCache[ds] = { at: Date.now(), v: _attDay };
        } catch (e) {
            console.warn('[BB] 이석 기록 조회 실패:', e.message);
            if (_attDate !== ds) return;
            _attDay = { date: ds, stats: null, msg: '⚠ 불러오기 실패 — 날짜를 다시 선택해 주세요', warn: true };
        }
        attRender();
    }

    async function attGetDates(ym) {   // 그 달에 기록(일별 json)이 있는 날짜 목록 (5분 캐시)
        const c = _attMonthCache['d' + ym];
        if (c && Date.now() - c.at < 5 * 60000) return c.v;
        const d = await attFetchJson(ATT_API + '/attendance-data?action=dates&ym=' + ym);
        const v = (d && Array.isArray(d.dates)) ? d.dates : [];
        _attMonthCache['d' + ym] = { at: Date.now(), v };
        return v;
    }
    async function attGetMonth(ym) {   // 월별 요약 (5분 캐시). 요약이 없으면 { days:{}, missing:true }
        const c = _attMonthCache[ym];
        if (c && Date.now() - c.at < 5 * 60000) return c.v;
        const d = await attFetchJson(ATT_API + '/attendance-data?action=monthly&ym=' + ym);
        const v = d._404 ? { ym, days: {}, missing: true } : d;
        _attMonthCache[ym] = { at: Date.now(), v };
        return v;
    }
    async function attGetSchedule(ym) {   // 스케줄(근무일수 계산용, 1시간 캐시). 실패하면 null → 근무일수는 '기록이 있는 날'로 대체
        const c = _attSchedCache[ym];
        if (c && Date.now() - c.at < (c.v ? 3600000 : 5 * 60000)) return c.v;
        let v = null, err = '';
        const url = ATT_API + '/schedule?ym=' + ym;
        try {
            const d = await attFetchJson(url);
            if (d && d._404) err = '404 (경로 없음)';
            else if (!d || !Array.isArray(d.staff)) err = '응답에 staff 목록이 없음';
            else v = d;
        } catch (e) { err = e.message; }   // 'Failed to fetch' = 대부분 CORS 차단(응답에 Access-Control-Allow-Origin 없음) 또는 네트워크 오류
        if (!v) console.warn('[BB] 스케줄 조회 실패:', url, '→', err);
        _attSchedErr[ym] = err;
        _attSchedCache[ym] = { at: Date.now(), v };
        return v;
    }

    /* ───────── 카드 화면 ───────── */
    const attStats = () => _attDate ? (_attDay && _attDay.date === _attDate ? _attDay.stats : null) : (_attLive ? _attLive.stats : null);
    const attViol = s => s.v || [0, 0, 0, 0, 0];

    function attRender() {
        const live = !_attDate, stats = attStats(), now = Date.now(), nowMin = attKstMin(now);

        // 제목: 이석/착석 현황 (금일 날짜) - 현재 이석 ##명
        const ds = live ? attLiveDate() : _attDate, dp = ds.split('-').map(Number);
        const title = $att('bb-att-title');
        title.textContent = '이석 현황 (' + dp[1] + '/' + dp[2] + ')';
        if (live && stats) {
            const awayN = stats.filter(s => !attMgrOf(s) && s.lastStatus === '이석' && attOnShift(s.shift, nowMin)).length;   // 관리자는 현재 이석 인원 수에서 제외
            title.append(attEl('span', 'sep', ' - '), '현재 이석 ', attEl('span', 'n', awayN + '명'));
        } else if (!live) {
            title.append(attEl('span', 'sep', ' - '), attEl('span', 'past', '과거 기록'));
        }

        // 관리자 버튼 (2번째 줄 왼쪽): 근무자 카드와 같은 상태 규칙 — 이석 중이면 빨간 외곽선, 퇴근·미근무면 회색
        const mgWrap = attEl('span', 'bb-att-mgs');
        ATT_MGRS.forEach(m => {
            const ms = stats && stats.find(x => attMgrOf(x) === m);
            const off = !ms || (live && !attOnShift(ms.shift, nowMin));
            const away = !!ms && live && !off && ms.lastStatus === '이석';
            const b = attEl('button', 'bb-att-mg' + (!ms ? ' none' : off ? ' off' : '') + (away ? ' away' : '') + (ms && ms.userId === _attPopId ? ' sel' : ''), m.ab);
            b.type = 'button';
            if (ms) { b.dataset.uid = ms.userId; b.title = `${m.name} · 이석 ${ms.awayCount}회 · ${attDur(ms.totalAwaySec)}` + (away ? ' · 이석 중' : '') + (off ? ' · 퇴근' : ''); }
            else b.title = m.name + (stats ? ' · 기록 없음' : '');
            mgWrap.appendChild(b);
        });
        const r2 = $att('bb-att-r2'); r2.querySelectorAll('.bb-att-mgs').forEach(n => n.remove());
        r2.prepend(mgWrap);   // 제목 줄은 좁아서 줄바꿈이 생기므로 2번째 줄(오늘·달력 버튼 왼쪽)에 둠

        // 2번째 줄: 이전달/이번달 버튼 (자동 반영), 과거 조회 중이면 '오늘로'
        $att('bb-att-today').classList.toggle('on', live);
        $att('bb-att-cal-btn').classList.toggle('on', !live);

        // 상태 문구
        const st = $att('bb-att-stat');
        let text = '', warn = false;
        if (live) {
            if (!_attLive) { text = _attFail ? '⚠ 불러오기 실패' : '불러오는 중…'; warn = _attFail; }
            else {
                const upd = Date.parse(_attLive.updated || ''), nm = attKstMin(now), quiet = nm >= ATT_QUIET[0] && nm < ATT_QUIET[1];
                if (quiet && !_attFail) { text = '야간 수집 중지 (03~09시) — 09시에 이어서 반영됩니다'; }
                else if (_attFail) { text = '⚠ 불러오기 실패 · 마지막 ' + attHM(_attLive._at) + ' 기준'; warn = true; }
                else if (Number.isFinite(upd) && (now - upd) / 60000 > ATT_STALE_MIN) { text = '⚠ 수집 지연 · 서버 마지막 갱신 ' + attHM(upd); warn = true; }
                else text = attHM(_attLive._at) + ' 기준';
            }
        }
        st.title = text;   // 전체 문구는 툴팁으로 — 화면에는 좁은 자리에 맞게 짧게
        st.textContent = text.startsWith('야간 수집 중지') ? '야간 중지' : (warn ? '⚠ ' + (((text.match(/\d{2}:\d{2}/) || [])[0]) ? (text.match(/\d{2}:\d{2}/)[0] + ' 기준') : '실패') : text);
        st.classList.toggle('warn', warn);

        // 카드 (한 행에 3명, 서버가 근무 시작 시각순으로 정렬해서 내려줌)
        const body = $att('bb-att-body');
        if (!stats) {
            const m = live ? (_attFail ? '⚠ 이석 현황을 불러오지 못했습니다' : '불러오는 중…') : ((_attDay && _attDay.msg) || '불러오는 중…');
            body.replaceChildren(attEl('div', 'bb-att-msg' + ((live ? _attFail : (_attDay && _attDay.warn)) ? ' warn' : ''), m));
            attClosePop();
            return;
        }
        const regular = stats.filter(s => !attMgrOf(s));   // 관리자는 카드를 만들지 않음 (제목 옆 버튼으로)
        if (!regular.length) {
            body.replaceChildren(attEl('div', 'bb-att-msg', live ? '아직 이석 기록이 없습니다' : ((_attDay && _attDay.msg) || '기록이 없습니다')));
            attClosePop();
            return;
        }
        const frag = document.createDocumentFragment();
        regular.forEach(s => {
            const v = attViol(s), n = v.slice(0, ATT_VIOL_LABELS.length).filter(x => x > 0).length;   // 재이석60분내(v[4])는 더 이상 세지 않음
            const off = live && !attOnShift(s.shift, nowMin);
            const away = live && !off && s.lastStatus === '이석';
            const el = attEl('div', 'bb-att-card' + (off ? ' off' : '') + (away ? ' away' : '') + (s.userId === _attPopId ? ' sel' : ''));
            el.dataset.uid = s.userId;
            el.title = `${s.dn || s.name}${s.label ? ' (' + s.label + ')' : ''} · 이석 ${s.awayCount}회 · ${attDur(s.totalAwaySec)} · 확인사항 ${n}개` + (away ? ' · 이석 중' : '') + (off ? ' · 퇴근' : '');
            const l1 = attEl('div', 'bb-att-l1');
            l1.append(attEl('span', 'bb-att-name', s.dn || s.name), attEl('span', 'bb-att-cnt', s.awayCount + '회'));
            const vLv = n === 0 ? 'v0' : n <= 2 ? 'v1' : n === 3 ? 'v2' : 'v3';   // 0개=연두 · 1~2개=연노랑 · 3개=연주황 · 4~5개=연빨강
            el.append(l1, attEl('div', 'bb-att-tot', attDur(s.totalAwaySec)), attEl('div', 'bb-att-vbar ' + vLv));
            frag.appendChild(el);
        });
        body.replaceChildren(frag);
        if (_attPopId) attRenderPop(true);   // 열려 있는 이석 로그도 최신 값으로 (확인사항 실시간 반영)
    }

    /* ───────── 카드 클릭 → 이석 로그 ───────── */
    function attClosePop() {
        _attPopId = null;
        $att('bb-att-pop').classList.remove('open');
        document.querySelectorAll('.bb-att-card.sel, .bb-att-mg.sel').forEach(c => c.classList.remove('sel'));
    }
    function attTogglePop(uid) {
        if (_attPopId === uid) { attClosePop(); return; }
        attCloseCal();
        _attPopId = uid;
        document.querySelectorAll('.bb-att-card.sel, .bb-att-mg.sel').forEach(c => c.classList.remove('sel'));
        const card = document.querySelector('.bb-att-card[data-uid="' + uid + '"], .bb-att-mg[data-uid="' + uid + '"]');
        if (card) card.classList.add('sel');
        attRenderPop(true);
    }
    async function attRefreshPopAvgCache(ym) {   // 카드 팝업용 이번 달 사람별 평균 캐시 — 실패해도 조용히 넘어가고 다음 주기(2분마다)에 재시도
        try {
            const doc = await attGetDayLogs(ym);
            _attPopAvgYm = ym; _attPopAvgMap = attAvgByName(doc);
            if (_attPopId) attRenderPop(false);   // 캐시가 갱신됐으니 열려 있는 팝업을 최신 값으로 (위치는 그대로 유지)
        } catch (e) { /* 다음 주기에 재시도 */ }
    }
    function attRenderPop(place) {
        const stats = attStats(), s = stats && stats.find(x => x.userId === _attPopId);
        if (!s) { attClosePop(); return; }
        const pop = $att('bb-att-pop'), live = !_attDate, v = attViol(s);

        const hd = attEl('div', 'bb-att-ph');
        const x = attEl('div', 'x', '✕'); x.addEventListener('click', attClosePop);
        hd.append(attEl('b', '', s.dn || s.name), attEl('span', '', s.label || ''), x);

        const vs = attEl('div', 'bb-att-vs');
        ATT_VIOL_LABELS.forEach((label, i) => {
            const hit = v[i] > 0;
            vs.appendChild(attEl('div', hit ? 'hit' : 'ok', (hit ? '⚠️ ' : '✅ ') + label + (hit ? (v[i] > 1 ? ' ×' + v[i] : '') : ' 없음')));
        });

        // 미기입 보정: (a)퇴근 (b)뒤에 다른 기록 있음 (c)휴게시간 돌입 — 셋 중 하나면 확정. 과거 날짜는 항상 확정으로 봄
        const nowMin = attKstMin(Date.now()), dt = live ? attLiveDate() : _attDate;
        const ym = dt.slice(0, 7);
        if (_attPopAvgYm !== ym) attRefreshPopAvgCache(ym);   // 아직 이 달 캐시가 없으면 백그라운드로 받아옴 (도착하면 알아서 다시 그림)
        const avgSec = _attPopAvgYm === ym && _attPopAvgMap ? (_attPopAvgMap[s.dn || s.name] ?? null) : null;
        const tupleLog = (s.log || []).map(l => [l.away, l.back]);

        const log = s.log || [];
        let body;
        if (!log.length) body = attEl('div', 'bb-att-msg', '기록 없음');
        else {
            body = attEl('table', 'bb-att-lt');
            const hr = body.createTHead().insertRow();
            ['#', '이석', '착석', '소요시간'].forEach(h => hr.appendChild(attEl('th', '', h)));
            const tb = body.createTBody();
            log.forEach((l, i) => {
                const tr = tb.insertRow();
                tr.appendChild(attEl('td', 'seq', String(i + 1)));
                tr.appendChild(attEl('td', '', l.away || '-'));
                const confirmed = !l.back && l.away && attEntryConfirmed(dt, i, tupleLog, s.dn || s.name, s.shift, attLiveDate(), nowMin);
                const isLiveOngoing = live && l.away && !l.back && i === log.length - 1 && s.lastStatus === '이석' && !confirmed;   // 확정되기 전까지만 '진행중' 카운트 표시
                const canEstimate = confirmed && avgSec != null;
                const tdB = attEl('td', '');
                if (l.back) { tdB.append(l.back); if (l.durationSec === 0) tdB.appendChild(attEl('span', 'tag', '동시기입')); }
                else if (canEstimate) tdB.appendChild(attEl('span', 'no est', '미기입'));
                else tdB.appendChild(attEl('span', 'no', '미기입'));
                if (l.awayEdited || l.backEdited) tdB.appendChild(attEl('span', 'tag ed', '편집됨'));
                tr.appendChild(tdB);
                const tdD = attEl('td', '');
                if (isLiveOngoing) {   // 지금 이석 중인 마지막 줄 → 경과 시간
                    const p = l.away.split(':'), a = (+p[0]) * 60 + (+p[1]) + (+p[2]) / 60;
                    let d = attKstMin(Date.now()) - a; if (d < 0) d += 1440;
                    tdD.appendChild(attEl('span', 'ing', Math.round(d) + '분째'));
                    tdD.append(attDur(l.durationSec));
                } else if (canEstimate) {
                    tdD.append(attDur(avgSec) + ' 평균값'); tdD.className = 'est';
                } else {
                    tdD.append(attDur(l.durationSec));
                }
                if (typeof l.durationSec === 'number' && l.durationSec >= 900) tdD.className = 'long';
                tr.appendChild(tdD);
            });
        }
        pop.replaceChildren(hd, vs, body);
        pop.classList.add('open');
        if (place) attPlacePop();
    }
    // 창은 다중 영역 '왼쪽'에 띄워 카드(오른쪽)를 가리지 않는다. 줌(scale)이 걸려 있어도 화면 좌표로 계산.
    function attPlacePop() {
        const pop = $att('bb-att-pop'), card = document.querySelector('.bb-att-card.sel, .bb-att-mg.sel'), box = $att('bb-mm-page-att');   // [UI 개편] 이석 그리드 자신의 왼쪽
        if (!card || !box) return;
        const cr = card.getBoundingClientRect(), br = box.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
        let left = br.right + 10;   // [admin] 그리드가 왼쪽 절반에 있으므로 팝업은 오른쪽 우선
        if (left + w > window.innerWidth - 8) left = br.left - w - 10;
        pop.style.left = Math.max(8, left) + 'px';
        pop.style.top = Math.max(8, Math.min(cr.top, window.innerHeight - h - 8)) + 'px';
    }

    /* ───────── 이전달/이번달 날짜 선택 (미니 달력) ───────── */
    function attCloseCal() { _attCalWhich = null; $att('bb-att-cal').classList.remove('open'); }
    let _attCalYm = null;
    async function attOpenCal() {
        if (_attCalWhich) { attCloseCal(); return; }
        attClosePop();
        _attCalWhich = 'cal';
        const months = attMonths(), cur = (_attDate || attLiveDate()).slice(0, 7);
        await attShowCal(months.includes(cur) ? cur : months[1]);
    }
    async function attShowCal(ym) {
        _attCalYm = ym;
        attRenderCal(ym, null);
        let dates; try { dates = await attGetDates(ym); } catch (e) { dates = 'fail'; }
        if (_attCalWhich && _attCalYm === ym) attRenderCal(ym, dates);
    }
    // dates = 기록 있는 날짜 배열 | null(불러오는 중) | 'fail'(목록 조회 실패 → 지난 날짜는 모두 눌러볼 수 있게 함)
    function attRenderCal(ym, dates) {
        const cal = $att('bb-att-cal'), y = +ym.slice(0, 4), m = +ym.slice(5);
        const liveDate = attLiveDate(), selDate = _attDate || liveDate;
        const has = new Set(Array.isArray(dates) ? dates : []);
        const dow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(), dim = new Date(Date.UTC(y, m, 0)).getUTCDate();

        const grid = attEl('div', 'bb-att-cal-grid');
        ['일', '월', '화', '수', '목', '금', '토'].forEach(d => grid.appendChild(attEl('div', 'bb-att-dow', d)));
        for (let i = 0; i < dow; i++) grid.appendChild(attEl('div'));
        for (let d = 1; d <= dim; d++) {
            const ds = ym + '-' + attPad(d);
            // 조회 가능: 일별 기록(json)이 있는 날 + 오늘(실시간)
            const ok = has.has(ds) || ds === liveDate || (dates === 'fail' && ds < liveDate);
            const el = attEl('div', 'bb-att-day' + (ok ? ' has' : '') + (ds === liveDate ? ' today' : '') + (ds === selDate ? ' sel' : ''), String(d));
            if (ok) {
                if (ds !== liveDate) el.appendChild(attEl('span', 'dot'));
                el.addEventListener('click', () => attSelectDate(ds));
            }
            grid.appendChild(el);
        }
        const months = attMonths();
        const hd = attEl('div', 'bb-att-cal-h');
        const pv = attEl('button', '', '‹'), nx = attEl('button', '', '›');
        pv.type = nx.type = 'button';
        if (ym <= months[0]) pv.disabled = true; else pv.addEventListener('click', () => attShowCal(months[0]));
        if (ym >= months[1]) nx.disabled = true; else nx.addEventListener('click', () => attShowCal(months[1]));
        hd.append(pv, attEl('span', 't', y + '년 ' + m + '월'), nx);
        cal.replaceChildren(hd, grid);
        cal.classList.add('open');
    }
    function attSelectDate(ds) {
        attCloseCal(); attClosePop();
        if (ds === attLiveDate()) { attGoToday(); return; }
        _attDate = ds;
        attLoadDay(ds);
    }
    function attGoToday() {
        _attDate = null; _attDay = null;
        attCloseCal(); attClosePop();
        attRender();
        attRefreshLive();
    }

    /* ───────── 상세 로그 (월별 근무자 통계) ───────── */
    const attIsPresent = d => !!d && (d.present || (d.raw || '').toUpperCase().includes('OT'));   // OT 는 실제 출근으로 간주
    const attTimeLabel = wt => { const m = (wt || '').match(/(\d{2}):(\d{2})~(\d{2}):(\d{2})/); return m ? `${m[1]}${m[2]}-${m[3]}${m[4]}` : ''; };
    function attWorkShiftMin(entry) {   // 스케줄의 workTime('09:00~18:00')을 [시작분,종료분]으로
        const m = entry && (entry.workTime || '').match(/(\d{2}):(\d{2})~(\d{2}):(\d{2})/);
        return m ? [(+m[1]) * 60 + (+m[2]), (+m[3]) * 60 + (+m[4])] : null;
    }
    // 근무시간대별 휴게시간 [시작분,종료분] — [근무시작분, 근무종료분(자정 넘기면 0~1439)] 로 매칭
    const ATT_BREAK_TABLE = [
        [420, 960, 660, 720],     // 0700-1600 → 11:00-12:00
        [480, 1020, 720, 780],    // 0800-1700 → 12:00-13:00
        [540, 1080, 780, 840],    // 0900-1800 → 13:00-14:00
        [600, 1140, 840, 900],    // 1000-1900 → 14:00-15:00
        [660, 1200, 900, 960],    // 1100-2000 → 15:00-16:00
        [840, 1380, 1020, 1080],  // 1400-2300 → 17:00-18:00
        [900, 0, 1080, 1140],     // 1500-2400 → 18:00-19:00
        [1080, 180, 1320, 1380],  // 1800-0300 → 22:00-23:00
        [1140, 240, 1380, 1440],  // 1900-0400 → 23:00-00:00
        [1200, 300, 1380, 1440],  // 2000-0500 → 23:00-00:00 (최정기 예외: 아래에서 22:00-23:00 로 대체)
        [1320, 420, 60, 120],     // 2200-0700 → 01:00-02:00
        [1410, 510, 60, 120],     // 2330-0830 → 01:00-02:00
    ];
    function attBreakWindow(shiftMin, name) {
        if (!shiftMin) return null;
        if (name === '최정기' && shiftMin[0] === 1200 && shiftMin[1] === 300) return [1320, 1380];   // 2000-0500 근무자 중 최정기만 예외
        const row = ATT_BREAK_TABLE.find(r => r[0] === shiftMin[0] && r[1] === shiftMin[1]);
        return row ? [row[2], row[3]] : null;
    }
    const attElapsedSince = (min, base) => { const d = min - base; return d < 0 ? d + 1440 : d; }   // base(근무 시작) 기준으로 자정을 넘겨도 순서가 어긋나지 않게 환산
    // 미기입 보정 공용 헬퍼 (상세 로그 표 / 이름별 일자 로그 / 실시간 카드 팝업이 모두 같은 기준을 씀)
    //   daylogs 문서에서 사람별 '정상(이석+착석 모두 기록)' 평균 소요시간을 계산 — 10건을 넘어야 신뢰할 수 있다고 보고 그 전까지는 null(적용 안 함)
    function attAvgByName(doc) {
        const days = (doc && doc.days) || {}, agg = {};
        Object.keys(days).forEach(dt => Object.keys(days[dt]).forEach(name => {
            days[dt][name][2].forEach(e => {
                if (e[0] && e[1] && typeof e[2] === 'number') { const a = agg[name] || (agg[name] = { sum: 0, n: 0 }); a.sum += e[2]; a.n++; }
            });
        }));
        const out = {};
        Object.keys(agg).forEach(name => { out[name] = agg[name].n > 10 ? agg[name].sum / agg[name].n : null; });
        return out;
    }
    // 이 미기입 항목(entries[idx], 이석시각 entries[idx][0])이 '확정'됐는지 — 아래 셋 중 하나면 확정:
    //   (a) 퇴근함(근무시간 종료)  (b) 이 뒤에 다른 기록이 이어짐(= 이미 새 이석 메시지가 찍힘)  (c) 이석 이후 휴게시간이 시작됨
    // 지난 날짜(dt !== today)는 하루가 이미 마감된 것이므로 항상 확정으로 봄. shiftMin=[근무시작분,근무종료분] (모르면 null)
    function attEntryConfirmed(dt, idx, entries, name, shiftMin, today, nowMin) {
        if (dt !== today) return true;
        if (idx < entries.length - 1) return true;   // (b) 뒤에 다른 기록이 있음
        if (!attOnShift(shiftMin, nowMin)) return true;   // (a) 퇴근함
        const bw = attBreakWindow(shiftMin, name);   // (c) 휴게시간 자동 확정
        if (bw) {
            const p = (entries[idx][0] || '').split(':'), awayMin = (+p[0]) * 60 + (+p[1]) + (+p[2]) / 60;
            const base = shiftMin[0];
            if (attElapsedSince(awayMin, base) < attElapsedSince(bw[0], base) && attElapsedSince(nowMin, base) >= attElapsedSince(bw[0], base)) return true;
        }
        return false;   // 아직 미확정 — 보류
    }

    // 일별 요약 [횟수, 총이석초, 15분초과, 미기입, 편집됨, 출근60분내, 재이석60분내] + 스케줄(근무일수) → 사람별 행
    // doc(일자별 상세 로그)을 주면, 미기입 건에 사람별 평균 소요시간을 보정치로 더해 총/평균 이석시간에 반영한다 (오늘자 집계중인 건은 제외)
    function attBuildRows(dig, sched, doc) {
        const days = (dig && dig.days) || {}, dates = Object.keys(days).sort(), agg = {};
        dates.forEach(dt => Object.keys(days[dt]).forEach(name => {
            if (ATT_EXCLUDE.includes(name)) return;
            const r = days[dt][name], a = agg[name] || (agg[name] = { v: [0, 0, 0, 0, 0, 0, 0], seen: 0 });
            for (let i = 0; i < 7; i++) a.v[i] += r[i];
            a.seen++;
        }));
        const approx = !(sched && sched.staff), meta = {};
        if (!approx) {
            const keys = dates.map(d => (+d.slice(5, 7)) + '/' + (+d.slice(8, 10)));
            sched.staff.forEach((p, idx) => {
                if (ATT_EXCLUDE.includes(p.name)) return;
                let cnt = 0; keys.forEach(k => { if (attIsPresent(p.schedule && p.schedule[k])) cnt++; });
                if (cnt > 0) meta[p.name] = { days: cnt, time: attTimeLabel(p.workTime), order: idx };
            });
        } else Object.keys(agg).forEach(n => { meta[n] = { days: agg[n].seen, time: '', order: 9999 }; });
        // 미기입 보정: 사람별로 더할 초를 미리 구해둠 (doc 이 없으면 빈 채로 — 보정 없이 기존 digest 값 그대로)
        const addSec = {};
        if (doc) {
            const avgMap = attAvgByName(doc), today = attLiveDate(), nowMin = attKstMin(Date.now());
            const ddays = doc.days || {};
            Object.keys(ddays).forEach(dt => Object.keys(ddays[dt]).forEach(name => {
                if (ATT_EXCLUDE.includes(name)) return;
                const avg = avgMap[name]; if (avg == null) return;
                const shiftMin = attWorkShiftMin(sched && sched.staff ? sched.staff.find(p => p.name === name) : null);
                const entries = ddays[dt][name][2];
                entries.forEach((e, idx) => {
                    if (e[0] && !e[1] && attEntryConfirmed(dt, idx, entries, name, shiftMin, today, nowMin)) addSec[name] = (addSec[name] || 0) + avg;
                });
            }));
        }
        const rows = Object.keys(meta).map(name => {
            const a = agg[name] ? agg[name].v : [0, 0, 0, 0, 0, 0, 0], d = meta[name].days;
            const totalSec = a[1] + (addSec[name] || 0);
            return { name, time: meta[name].time, order: meta[name].order, days: d, totalCount: a[0], totalSec,
                     avgCount: d ? a[0] / d : 0, avgSec: d ? totalSec / d : 0, avgPerEvent: a[0] ? totalSec / a[0] : 0,
                     over: a[2], unfiled: a[3], edited: a[4], early: a[5], viol: a[2] + a[3] + a[4] + a[5] };
        });
        return { rows, approx, dates };
    }

    // 열 구성: 이름 | 근무일수 | 총 이석시간(막대, 막대 안에 총 이석횟수) | 일평균 이석시간 | 1회당 평균 | 확인사항(합계)
    // bar:true / viol:true 열은 attRenderDetail 에서 따로 그린다 (f 는 정렬 대신 쓰는 단순 텍스트)
    const ATT_COLS = [
        { label: '이름', key: null },
        { label: '근무일수', key: 'days', f: r => r.days + '일' },
        { label: '총 이석시간 (막대 안은 총 이석횟수)', key: 'totalSec', bar: true, cls: 'bar' },
        { label: '일평균 이석시간', key: 'avgSec', f: r => attDurHM(r.avgSec) },
        { label: '1회당 평균 이석시간', key: 'avgPerEvent', f: r => attDurHM(r.avgPerEvent) },
        { label: '확인사항', key: 'viol', viol: true }   // 15분 초과 + 미기입 + 편집됨 + 출근60분내 합계 (세부는 마우스를 올리면 표시)
    ];


    async function attOpenDetail(ym) {
        attClosePop(); attCloseCal(); attClosePlog();
        const months = attMonths();
        ym = ym || (_attDate ? _attDate.slice(0, 7) : months[1]);
        if (!months.includes(ym)) ym = months[1];
        _attDetailYm = ym;
        $att('bb-att-search').value = _attNameFilter; attSyncMgb();
        const sel = $att('bb-att-dsel');
        sel.replaceChildren(...months.map(m => { const o = attEl('option', '', m.slice(0, 4) + '년 ' + Number(m.slice(5)) + '월'); o.value = m; return o; }));
        sel.value = ym;
        $att('bb-att-detail').classList.add('open');
        $att('bb-att-dtitle').textContent = '불러오는 중…';
        $att('bb-att-dbody').replaceChildren();
        $att('bb-att-dnote').textContent = '';
        let dig, sched;
        try { [dig, sched] = await Promise.all([attGetMonth(ym), attGetSchedule(ym)]); }
        catch (e) {
            if (_attDetailYm !== ym) return;
            $att('bb-att-dtitle').textContent = ym.slice(0, 4) + '년 ' + Number(ym.slice(5)) + '월';
            $att('bb-att-dbody').replaceChildren(attEl('div', 'bb-att-msg warn', '⚠ 불러오기 실패 — 잠시 후 다시 열어 주세요'));
            return;
        }
        if (_attDetailYm !== ym) return;   // 그 사이 다른 달로 바꿈/닫음
        attRenderDetail(ym, dig, sched, null);   // 우선 빠른 데이터로 표를 바로 연다 (미기입 보정 없이)
        attGetDayLogs(ym).then(doc => {   // daylogs 는 그 달 첫 조회면 서버가 새로 만들어야 해서 최대 30초까지 걸릴 수 있어 표 열기와 분리 — 도착하면 보정치를 반영해 조용히 다시 그림
            if (_attDetailYm === ym) attRenderDetail(ym, dig, sched, doc);
        }).catch(e => console.warn('[BB] 일자별 로그(미기입 보정용) 조회 실패:', e.message));   // 실패해도 표는 이미 열려 있으니 그냥 보정 없이 둠
    }
    function attRenderDetail(ym, dig, sched, doc) {
        _attLast = { ym, dig, sched, doc };
        const built = attBuildRows(dig, sched, doc), dates = built.dates;
        const label = ym.slice(0, 4) + '년 ' + Number(ym.slice(5)) + '월';
        $att('bb-att-dtitle').textContent = dates.length
            ? `${label} (${+dates[0].slice(8)}일 ~ ${+dates[dates.length - 1].slice(8)}일, 총 ${dates.length}일간)` : label + ' (확정된 데이터 없음)';
        $att('bb-att-dnote').textContent = (dates.length && built.approx) ? '⚠ 스케줄을 불러오지 못해 근무일수를 "기록이 있는 날"로 계산했습니다 (기록이 없던 근무일은 빠짐)' + (_attSchedErr[ym] ? ' [원인: ' + _attSchedErr[ym] + ']' : '') : '';
        const body = $att('bb-att-dbody');
        if (!built.rows.length) {
            body.replaceChildren(attEl('div', 'bb-att-msg', dig && dig.missing ? '이 달의 요약 데이터가 아직 없습니다' : '확정된 기록이 없습니다'));
            return;
        }
        const q = _attNameFilter.trim().toLowerCase();   // 이름 검색어 (포함되면 표시, 대소문자 무시)
        if (!ATT_COLS.some(c => c.key === _attSortKey)) _attSortKey = 'totalSec';   // 없어진 열(총 횟수·일평균 횟수)로 정렬돼 있던 경우 기본값으로
        // 관리자(안·박·신)는 기본으로 숨김 — 검색어에 이름이 걸리거나 안/박/신 버튼으로 이름을 넣었을 때만 표시
        const rows = built.rows.filter(r => q ? r.name.toLowerCase().includes(q) : !ATT_MGRS.some(m => r.name.includes(m.name))).sort((a, b) => (b[_attSortKey] - a[_attSortKey]) || (a.order - b.order));
        if (!rows.length) {
            body.replaceChildren(attEl('div', 'bb-att-msg', `"${_attNameFilter.trim()}" 이름의 근무자가 이 달에는 없습니다`));
            return;
        }
        const table = attEl('table', 'bb-att-mt'), hr = table.createTHead().insertRow();
        ATT_COLS.forEach(c => {
            const th = attEl('th', (c.key === _attSortKey ? 'sorted ' : '') + (c.cls === 'warn' ? 'warn' : ''), c.label);
            if (c.label === '이름') th.appendChild(attEl('span', 'hint', '(클릭하여 열람)'));   // 이름 칸을 클릭하면 그 달 이석 로그가 열린다는 안내
            if (c.key) th.addEventListener('click', () => { _attSortKey = c.key; attRenderDetail(ym, dig, sched, doc); });
            hr.appendChild(th);
        });
        const tb = table.createTBody();
        const maxSec = Math.max(1, ...rows.map(r => r.totalSec));   // 막대 길이: 지금 보이는 사람 중 가장 긴 사람을 100% 로
        rows.forEach((r, ri) => {
            const tr = tb.insertRow(), td0 = attEl('td', 'nm', r.name);
            td0.dataset.name = r.name; td0.title = '클릭: 이 달 이석 로그';
            if (r.time) td0.appendChild(attEl('span', 'tm', '(' + r.time + ')'));
            tr.appendChild(td0);
            ATT_COLS.slice(1).forEach(c => {
                if (c.bar) {   // 위쪽 순위일수록 진한 주황 → 아래로 갈수록 연두 (현재 정렬 순서 기준)
                    const t = rows.length > 1 ? ri / (rows.length - 1) : 0;
                    const td = attEl('td', 'bar'), w = attEl('div', 'bb-att-bw'), bar = attEl('div', 'bb-att-bar', r.totalCount + '회');
                    bar.style.width = 'calc((100% - 100px) * ' + (r.totalSec / maxSec).toFixed(4) + ')';   // 오른쪽 시간 글자 자리(100px)를 뺀 폭에서 비율로 — 가장 긴 사람이 꽉 차도 flex 축소로 길이가 틀어지지 않게
                    bar.style.background = ATT_MGRS.some(m => r.name.includes(m.name)) ? '#c9c5ba' : 'hsl(' + Math.round(24 + 72 * t) + ',85%,' + Math.round(52 + 10 * t) + '%)';
                    w.append(bar, attEl('span', '', attDurHM(r.totalSec)));
                    td.appendChild(w); tr.appendChild(td);
                } else if (c.viol) {
                    const td = attEl('td', ''), v = r.viol, pill = attEl('span', 'bb-att-vt ' + (v <= 5 ? 'g' : v <= 14 ? 'y' : 'r'), String(v));
                    td.title = `15분 초과 ${r.over} · 미기입 ${r.unfiled} · 편집됨 ${r.edited} · 출근60분내 ${r.early}`;
                    td.appendChild(pill); tr.appendChild(td);
                } else tr.appendChild(attEl('td', c.cls || '', c.f(r)));
            });
        });
        body.replaceChildren(table);
    }
    function attCloseDetail() { _attDetailYm = null; $att('bb-att-detail').classList.remove('open'); attClosePlog(); }

    /* ───────── 이름 클릭 → 그 달 일자별 이석 로그 ─────────
       서버의 월별 집계 파일(_logs/YYYY-MM.json)이 아직 없거나 오래됐으면 매번 그 달 전체를 새로 만들어야 해서
       느려질 수 있어(최대 30초) — 대신 이미 빠르고 잘 캐시되는 하루치 archive(action=archive, 과거 날짜는 24시간 캐시)를
       그 달 날짜 수만큼 병렬로 모아 클라이언트에서 같은 형태로 조립한다. 서버의 월별 사전 집계에 기대지 않아 더 안정적으로 빠르고,
       하루치가 실패해도(404 포함) 그 날만 비고 나머지는 정상 표시됨.
       속도: 요청 하나하나가 Vercel 콜드 스타트로 ~2초씩 걸리는 게 실측 확인됨 → 8개씩 나눠 쏘면 그 2초가 파도 수만큼(예: 3번) 곱해져서
       느려지므로(읽기 전용이라 나눠 쏠 이유가 없음) 전부 한꺼번에 병렬로 쏴서 ~2초 한 번으로 끝나게 함.
       'dates' 사전 조회(약 2초)도 생략 — 그 달 1일~오늘(또는 말일)까지 날짜를 그냥 다 만들어서 같이 쏘고, 기록 없는 날은 404로 자연히 빠짐.
       동시 요청 병합: 여러 곳(상세 로그 백그라운드 프리페치 + 이름 클릭)에서 같은 달을 동시에 요청해도
       매번 새로 조립하지 않고 진행 중인 조립을 그대로 같이 기다림 */
    function attDatesGuess(ym) {   // dates 조회 없이 그 달 후보 날짜를 직접 생성 (기록 없는 날은 archive 404로 알아서 빠짐)
        const [y, m] = ym.split('-').map(Number), lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
        const today = attLiveDate();
        const n = (ym === today.slice(0, 7)) ? Math.min(lastDay, +today.slice(8, 10)) : lastDay;   // 이번 달이면 오늘까지만
        return Array.from({ length: n }, (_, i) => ym + '-' + attPad(i + 1));
    }
    let _attDayLogsPending = {};   // ym -> 진행 중인 Promise
    async function attGetDayLogs(ym) {
        const c = _attMonthCache['l' + ym];
        if (c && Date.now() - c.at < 5 * 60000) return c.v;
        if (_attDayLogsPending[ym]) return _attDayLogsPending[ym];
        const p = (async () => {
            const dates = attDatesGuess(ym), days = {};
            await Promise.all(dates.map(async d => {
                let r;
                try { r = await attFetchJson(ATT_API + '/attendance-data?action=archive&date=' + d); }
                catch (e) { console.warn('[BB] 일자별 로그: ' + d + ' 조회 실패:', e.message); return; }   // 하루치 실패는 그 날만 비우고 나머지는 계속
                if (!r || r._404 || !Array.isArray(r.stats)) return;   // 기록 없는 날(404)은 조용히 건너뜀
                const dayObj = {};
                r.stats.forEach(s => {
                    const entries = (s.log || []).map(l => [l.away || null, l.back || null, typeof l.durationSec === 'number' ? l.durationSec : null, (l.awayEdited ? 1 : 0) | (l.backEdited ? 2 : 0)]);
                    dayObj[s.dn || s.name] = [s.awayCount || 0, Math.round(s.totalAwaySec || 0), entries];
                });
                days[d] = dayObj;
            }));
            const v = { ym, days, missing: !Object.keys(days).length };
            _attMonthCache['l' + ym] = { at: Date.now(), v };
            return v;
        })();
        _attDayLogsPending[ym] = p;
        try { return await p; } finally { delete _attDayLogsPending[ym]; }
    }
    function attClosePlog() { _attPlogKey = ''; $att('bb-att-plog').classList.remove('open'); }
    // 서버 로그 형식: days[날짜][이름] = [횟수, 총초, [[이석, 착석, 소요초, 편집플래그(1=이석 메시지, 2=착석 메시지)], ...]]
    function attPlogBody(name, doc, sched) {
        const days = (doc && doc.days) || {}, dates = Object.keys(days).sort(), DOW = ['일', '월', '화', '수', '목', '금', '토'];
        const entry = sched && sched.staff ? sched.staff.find(p => p.name === name) : null;
        // 미기입 보정: 이 달 '정상(이석+착석 모두 기록)' 건이 10개를 넘으면 그 평균을 미기입 건의 추정 소요시간으로 씀
        // (10건도 안 되는 평균은 신뢰하기 어렵다고 판단 — 10건을 넘어서야 비로소 적용 시작). 오늘자는 근무 종료 전까지 보류
        const avgSec = attAvgByName(doc)[name] ?? null;
        const today = attLiveDate(), nowMin = attKstMin(Date.now()), shiftMin = attWorkShiftMin(entry);
        let cnt = 0, sec = 0, over = 0, rec = 0;
        const list = attEl('div', 'bb-att-lb');
        dates.forEach(dt => {
            const p = dt.split('-').map(Number), key = p[1] + '/' + p[2];
            const label = key + '(' + DOW[new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay()] + ')';
            const r = days[dt][name], day = attEl('div', 'bb-att-ld'), h = attEl('div', 'bb-att-ldh', label);
            if (!r) {
                if (entry && !attIsPresent(entry.schedule && entry.schedule[key])) return;   // 스케줄상 휴무일은 생략 (스케줄을 못 받았으면 생략 없이 표시)
                h.appendChild(attEl('span', 'c', '기록 없음'));
                day.append(h, attEl('div', 'bb-att-le', '이 날 이석 기록이 없어요'));
                list.appendChild(day);
                return;
            }
            rec++; cnt += r[0]; sec += r[1];
            h.appendChild(attEl('span', 'c', '이석 ' + r[0] + '회 · 총 ' + attDurHM(r[1])));
            day.appendChild(h);
            const entries = r[2];
            entries.forEach((e, idx) => {
                let cls = 'bb-att-ll', text;
                if (e[0] && e[1]) { text = e[0] + ' → ' + e[1] + '  (' + attDur(e[2]) + ')'; if (typeof e[2] === 'number' && e[2] >= 900) { cls += ' over'; over++; } }
                else if (e[0]) {
                    if (avgSec != null && attEntryConfirmed(dt, idx, entries, name, shiftMin, today, nowMin)) { text = e[0] + ' → 착석 미기입  (평균값 ' + attDur(avgSec) + ')'; cls += ' no est'; }
                    else { text = e[0] + ' → (미기입)'; cls += ' no'; }
                }
                else text = '(이석 기록 없음) → ' + e[1];
                const line = attEl('div', cls, text);
                if (e[3]) line.appendChild(attEl('span', 'ed', '[편집됨]'));
                day.appendChild(line);
            });
            list.appendChild(day);
        });
        if (!rec) {
            list.replaceChildren(attEl('div', 'bb-att-msg', doc && doc.missing ? '이 달의 이석 로그 데이터가 아직 없습니다' : '이 달 이 근무자의 이석 기록이 없어요'));
            return [list];
        }
        return [attEl('div', 'bb-att-lsum', `이 달 이석 ${cnt}회 · 총 ${attDurHM(sec)} · 15분 초과 ${over}회 · 기록 ${rec}일`), list];
    }
    async function attOpenPlog(name, ym) {
        const key = ym + '|' + name, box = $att('bb-att-plog');
        _attPlogKey = key;
        const hd = attEl('div', 'bb-att-lh'), x = attEl('div', 'x', '✕');
        x.addEventListener('click', attClosePlog);
        hd.append(attEl('div', 't', ym.slice(0, 4) + '년 ' + Number(ym.slice(5)) + '월 · ' + name + ' 이석 로그'), x);
        box.replaceChildren(hd, attEl('div', 'bb-att-msg', '불러오는 중…'));
        box.classList.add('open');
        const slowTimer = setTimeout(() => {   // 4초 넘게 걸리면 고장처럼 보이지 않도록 문구 교체 (그 달 로그를 서버가 처음 만드는 중일 수 있음 — 최대 30초)
            if (_attPlogKey === key) box.replaceChildren(hd, attEl('div', 'bb-att-msg', '이 달 로그를 서버가 처음 만드는 중이에요 — 최대 30초까지 걸릴 수 있어요…'));
        }, 4000);
        let doc, sched;
        try { [doc, sched] = await Promise.all([attGetDayLogs(ym), attGetSchedule(ym)]); }
        catch (e) {
            console.warn('[BB] 이석 로그 조회 실패:', e.message);
            if (_attPlogKey === key) {
                const msg = attEl('div', 'bb-att-msg warn', '⚠ 불러오기 실패 — ');
                const retry = attEl('span', 'bb-att-retry', '다시 시도');
                retry.addEventListener('click', () => attOpenPlog(name, ym));
                msg.appendChild(retry);
                box.replaceChildren(hd, msg);
            }
            return;
        } finally { clearTimeout(slowTimer); }
        if (_attPlogKey !== key) return;   // 그 사이 닫았거나 다른 사람으로 바꿈
        box.replaceChildren(hd, ...attPlogBody(name, doc, sched));
    }

    /* ───────── 이벤트 연결 ───────── */
    $att('bb-mm-goatt').addEventListener('click', () => attSetView('att'));
    $att('bb-att-back').addEventListener('click', () => attSetView('multi'));
    $att('bb-att-cal-btn').addEventListener('click', () => attOpenCal());
    $att('bb-att-detailbtn').addEventListener('click', () => { if ($att('bb-att-detail').classList.contains('open')) attCloseDetail(); else attOpenDetail(); });
    $att('bb-att-today').addEventListener('click', attGoToday);
    $att('bb-att-dclose').addEventListener('click', attCloseDetail);
    $att('bb-att-dsel').addEventListener('change', e => attOpenDetail(e.target.value));
    function attSyncMgb() { document.querySelectorAll('#bb-att-mgb button').forEach(b => b.classList.toggle('on', _attNameFilter.trim() === b.dataset.name)); }
    $att('bb-att-mgb').addEventListener('click', e => {   // 안·박·신: 검색창에 그 이름을 넣은 것과 같음 (같은 버튼을 다시 누르면 해제)
        const b = e.target.closest('button'); if (!b) return;
        _attNameFilter = _attNameFilter.trim() === b.dataset.name ? '' : b.dataset.name;
        $att('bb-att-search').value = _attNameFilter; attSyncMgb();
        if (_attLast && _attLast.ym === _attDetailYm) attRenderDetail(_attLast.ym, _attLast.dig, _attLast.sched, _attLast.doc);
    });
    $att('bb-att-search').addEventListener('input', e => {   // 입력할 때마다 표만 다시 그림 (서버 요청 없음)
        _attNameFilter = e.target.value; attSyncMgb();
        if (_attLast && _attLast.ym === _attDetailYm) attRenderDetail(_attLast.ym, _attLast.dig, _attLast.sched, _attLast.doc);
    });
    $att('bb-att-dbody').addEventListener('click', e => { const td = e.target.closest('td.nm'); if (td && _attDetailYm) attOpenPlog(td.dataset.name, _attDetailYm); });   // 이름 클릭 (예전엔 더블클릭)
    $att('bb-att-body').addEventListener('click', e => { const c = e.target.closest('.bb-att-card'); if (c) attTogglePop(c.dataset.uid); });
    $att('bb-att-r2').addEventListener('click', e => { const b = e.target.closest('.bb-att-mg'); if (b && b.dataset.uid) attTogglePop(b.dataset.uid); });   // 관리자 동그라미 버튼
    document.addEventListener('click', e => {   // 바깥 클릭 → 이석 로그 / 달력 닫기 (캡처 단계: 재렌더로 대상이 사라지기 전에 판단)
        if (_attPopId && !e.target.closest('#bb-att-pop') && !e.target.closest('.bb-att-card') && !e.target.closest('.bb-att-mg')) attClosePop();
        if (_attCalWhich && !e.target.closest('#bb-att-cal') && !e.target.closest('.bb-att-mbtn')) attCloseCal();
        if (_attPlogKey && !e.target.closest('#bb-att-plog')) attClosePlog();   // 이석 로그 창 바깥을 누르면 그 창만 닫힘 (상세 로그 창 안쪽을 눌렀다면 상세 로그는 유지)
        if ($att('bb-att-detail').classList.contains('open') && !e.target.closest('#bb-att-detail') && !e.target.closest('#bb-att-plog') && !e.target.closest('#bb-att-detailbtn')) attCloseDetail();   // 상세 로그 창 바깥을 누르면 닫힘
    }, true);
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        if (_attPlogKey) { attClosePlog(); return; }
        if ($att('bb-att-detail').classList.contains('open')) attCloseDetail();
        else if (_attCalWhich) attCloseCal();
        else if (_attPopId) attClosePop();
    });
    // 이석 화면이 실제로 보이고, 실시간을 보는 중이고, 탭이 보일 때만 조회
    setInterval(() => { if (isOpen && _attView === 'att' && !_attDate && !document.hidden) attRefreshLive(); }, ATT_REFRESH_MS);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && isOpen && _attView === 'att' && !_attDate) attRefreshLive(); });
    attSetView('att');   // [UI 개편] 이석 현황도 항상 표시 → 실시간 조회 유지 (기존: 'multi')
    syncAttBackAlert();
    _attReady = true;

    // ============================================================
    // SECTION 18. 개입카드 현황 — 다중 모니터링 화면의 '왼쪽'으로 슬라이드해서 들어가는 화면 (진입: 다중 모니터링 제목 왼쪽 '« 개입 현황')
    //  - 데이터: multimonitoring.vercel.app/api/intervene (서버가 GitHub 로그를 가공. 토큰은 서버에만 있음). 이석(SECTION 17)과 같은 방식.
    //  - 개입카드 화면이 실제로 보일 때만 30초마다 조회 (다른 화면이거나 보드가 닫혀 있거나 탭이 가려져 있으면 요청 없음)
    //  - 건수 = "이름이 확정된 해결 건"만. 추정/이탈/진행중/특정불가는 건수에 넣지 않고 팝업에서만 보여줌 (판정은 전부 서버 lib/intervene-core.js)
    //  - 안전장치: ① 전체가 try/catch — 여기서 오류가 나도 기존 기능은 그대로 ② 화면 요소는 이 섹션이 직접 만들어 붙임(기존 함수는 수정하지 않음)
    //    ③ 비상용 끄기: 콘솔에서 localStorage.bbIv='0' 후 새로고침
    // ============================================================
    try {
    let _ivOn = true;
    try { if (localStorage.getItem('bbIv') === '0') _ivOn = false; } catch (e) { /* 저장소 접근 불가 → 그대로 켜짐 */ }
    if (_ivOn && document.getElementById('bb-mm-page-multi') && document.querySelector('.bb-mm-box') && typeof attFetchJson === 'function') {
        // ▼▼▼ '설명' 버튼을 눌렀을 때 보이는 안내문. 문장 하나당 배열 한 줄로 적으면 됩니다(줄 끝에 <br>로 자동 연결). ▼▼▼
        const IV_HELP = [
            '개입카드 데이터 변동 시 수 분 이내로 받아옵니다.',
            '프로그램이 GPS 조치 및 기타 사유로 인한 페이지 이탈을 명확히 구분할 수 없기 때문에 개입 건수 카운팅에서 제외했습니다.',
            '근무자별로 할당된 다중/과학관/휴게시간이 빗금으로 표기됩니다.',
            'NCC에 API를 전혀 호출하지 않기 때문에, 이름 성씨 및 근무표로 개입자를 추정할 수 있습니다.',
            'NCC 개입카드 기능 자체가 이미 문제가 많은 상황입니다. 이탈 항목에서 알 수 있듯이 중복개입 또는 개입카드 점유 버그를 감안해서 카운팅 합니다.',
            '완벽한 정합성을 갖춘 데이터가 될 수는 없습니다만, 그래도 정확도는 꽤나 높은 편입니다.',
            '따라서 개개인의 개입카드 처리패턴 파악 용도로는 충분히 활용할 수 있지 않을까 기대해봅니다.',
            '근무자 퇴근 시 카드가 하단으로 재정렬됩니다.'
        ].join('<br>');
        // ▲▲▲ 여기까지 ▲▲▲
        const IV_API = ATT_API + '/intervene';
        const IV_REFRESH_MS = 30 * 1000;
        const IV_ROWS_STEP = 200;
        const IV_LONG_SEC = 180;
        // 근무시간이 07시 근무일 경계를 넘나드는 인원용 예외 처리. 이 이름의 사람은 '출근 전'으로 판정됐어도
        // 개입카드를 이미 처리한 기록(건수>0)이 있으면 '퇴근'으로 표기한다 (07시 리프레시 이후 카드 처리로 로그가 꼬이는 것 방지).
        const IV_LATE_CARD_EXCEPTIONS = new Set(['안대관']);
        function ivApplyExceptions(data) {
            if (!data || !Array.isArray(data.people)) return;
            for (const p of data.people) {
                if (IV_LATE_CARD_EXCEPTIONS.has(p.name) && p.off && p.offKind === 'before' && p.solved > 0) {
                    p.offKind = 'after';
                }
            }
        }
        let _ivOpen = false, _ivDate = null, _ivData = null, _ivBusy = false, _ivFail = false, _ivSeq = 0;
        let _ivSort = 'shift';
        try { if (localStorage.getItem('bbIvSort') === 'cnt') _ivSort = 'cnt'; } catch (e) { /* 기본값 */ }
        let _ivPopKey = null, _ivPopName = null, _ivPopFilter = 'all', _ivPopLimit = IV_ROWS_STEP, _ivDetail = null;
        let _ivDates = null, _ivDatesAt = 0, _ivCalOpen = false, _ivCalYm = null;
        const _ivDetailCache = {};

        const $iv = id => document.getElementById(id);
        const ivEl = (tag, cls, text) => { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined && text !== null) el.textContent = text; return el; };
        const ivSafe = fn => function () { try { return fn.apply(this, arguments); } catch (e) { console.warn('[BB] 개입카드 오류:', e && e.message); } };
        const ivOpDate = () => attYmd(attKst(Date.now() - 7 * 3600 * 1000));   // 근무일 = 07:00 기준
        const ivMD = ymd => { const p = ymd.split('-'); return (+p[1]) + '/' + (+p[2]); };
        const ivDur = sec => (sec == null ? '-' : Math.floor(sec / 60) + '분 ' + (Math.round(sec) % 60) + '초');
        const ivHMS = ms => { const d = attKst(ms); return attPad(d.getUTCHours()) + ':' + attPad(d.getUTCMinutes()) + ':' + attPad(d.getUTCSeconds()); };
        // 조사: 마지막 글자에 받침이 있으면 a, 없으면 b (이/가, 을/를, 은/는)
        const ivJosa = (word, a, b) => {
            const c = String(word || '').charCodeAt(String(word || '').length - 1);
            if (c < 0xAC00 || c > 0xD7A3) return b;
            return (c - 0xAC00) % 28 ? a : b;
        };
        const ivWho = x => { const nm = (x && x.n) || '다른 사람'; return nm + (x && x.k === 'i' ? '(추정)' : '') + ivJosa(nm, '이', '가'); };
        const ivGap = s => (s < 1 ? '바로 뒤' : s < 60 ? s + '초 뒤' : Math.floor(s / 60) + '분 ' + (s % 60) + '초 뒤');

        /* ───────── 스타일 (이 섹션 전용, 런타임 삽입) ───────── */
        const st = document.createElement('style');
        st.id = 'bb-iv-style';
        st.textContent = `
        .bb-mm-head.bb-iv-hd { padding-left:66px; }   /* 왼쪽 '« 개입 현황' 버튼 자리 (오른쪽 '이석 »' 버튼 자리와 대칭) */
        .bb-mm-goiv { position:absolute; left:8px; top:50%; transform:translateY(-50%); height:auto; padding:5px 9px; gap:5px; }
        #bb-iv-page { position:absolute; inset:0; z-index:6; display:flex; flex-direction:column; background:var(--sur); font-family:'Paperlogy','Lato',-apple-system,sans-serif;
            transform:translateX(-100%); visibility:hidden; transition:transform .32s cubic-bezier(.4,0,.2,1), visibility 0s linear .32s; }
        #bb-iv-page.open { transform:translateX(0); visibility:visible; transition:transform .32s cubic-bezier(.4,0,.2,1), visibility 0s; }
        .bb-iv-head { flex:0 0 auto; position:relative; padding:6px 8px; background:var(--sur); border-bottom:1px solid var(--bd); display:grid; grid-template-columns:auto minmax(0,1fr) auto; column-gap:8px; row-gap:6px; align-items:center; z-index:3; }
        .bb-iv-head .bb-att-title { grid-column:2; }
        .bb-iv-head .bb-att-r2 { grid-column:2; }
        #bb-iv-help-btn { grid-column:1; grid-row:1 / 3; align-self:stretch; height:auto; padding:0 8px; }
        #bb-iv-stats-btn { grid-column:3; grid-row:1 / 3; align-self:stretch; height:auto; padding:0 8px; }   /* '사용 설명'(왼쪽)과 좌우 대칭으로 오른쪽 */
        #bb-iv-help-btn.on { border-color:var(--bl); color:var(--bl); background:var(--bl2, #dbe8fd); }
        .bb-iv-help { display:none; position:absolute; left:8px; right:8px; top:100%; margin-top:4px; max-height:60vh; overflow-y:auto; padding:12px 14px; background:var(--sur); border:1.5px solid var(--bd2); border-radius:10px; box-shadow:0 10px 28px rgba(0,0,0,.35); font-size:calc(15px * var(--bb-ts, 1)); line-height:2.1; color:var(--tx); word-break:keep-all; overflow-wrap:anywhere; }
        .bb-iv-help.open { display:block; }
        #bb-iv-back { grid-column:3; grid-row:1 / 3; align-self:stretch; height:auto; padding:0 7px; gap:3px; }
        .bb-iv-kpis { flex:0 0 auto; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); background:var(--sur2); border-bottom:1px solid var(--bd); }
        .bb-iv-kpi { padding:6px 8px; display:flex; flex-direction:column; gap:1px; border-left:1px solid var(--bd); }
        .bb-iv-kpi:first-child { border-left:0; }
        .bb-iv-kpi .l { font-size:calc(13px * var(--bb-ts, 1)); color:var(--mu); }
        .bb-iv-kpi .v { font-size:calc(20px * var(--bb-ts, 1)); font-weight:900; white-space:nowrap; }
        .bb-iv-kpi .v small { margin-left:3px; font-size:calc(13px * var(--bb-ts, 1)); color:var(--mu); font-weight:700; }
        .bb-iv-notes { flex:0 0 auto; display:flex; flex-wrap:wrap; gap:5px; padding:5px 8px; border-bottom:1px solid var(--bd); background:var(--sur); }
        .bb-iv-notes:empty { display:none; }
        .bb-iv-note { height:22px; padding:0 9px; border-radius:999px; border:1.5px solid var(--bd2); font-size:calc(13.5px * var(--bb-ts, 1)); color:var(--tx); background:var(--sur2); cursor:pointer; display:inline-flex; align-items:center; font-family:inherit; }
        .bb-iv-sort { margin-left:auto; }
        .bb-iv-note:hover { border-color:var(--mu); }
        .bb-iv-body { flex:1 1 auto; min-height:0; overflow-y:auto; padding:6px; display:flex; flex-direction:column; gap:5px; }
        .bb-iv-row { flex:0 0 auto; box-sizing:border-box; display:grid; grid-template-columns:minmax(0,1fr) 62px; column-gap:8px; align-items:center; padding:7px 9px; border-radius:9px; border:2px solid var(--bd2); background:var(--sur); cursor:pointer; }
        .bb-iv-row:hover { border-color:#f9a8d4; box-shadow:0 0 0 1px #f9a8d4; }   /* 다중 모니터링 기체 그리드(.bb-mm-card:hover)와 같은 분홍 외곽선 */
        .bb-iv-row.sel { border-color:#f9a8d4; box-shadow:0 0 0 1px #f9a8d4; }   /* 클릭해서 상세 팝업이 뜬 카드 — 검정 outline 대신 호버와 같은 분홍 외곽선을 고정 표시 (마우스가 비켜나도 겹쳐 보이지 않게) */
        .bb-iv-row.brk { background:rgba(233,184,36,.2); }
        .bb-iv-row.off { opacity:.55; }
        .bb-iv-mid { min-width:0; display:flex; flex-direction:column; gap:4px; }
        .bb-iv-l1 { display:flex; align-items:baseline; gap:6px; min-width:0; white-space:nowrap; }
        .bb-iv-nm { font-size:calc(16.5px * var(--bb-ts, 1)); font-weight:700; color:var(--tx); }
        .bb-iv-meta { font-size:calc(13px * var(--bb-ts, 1)); color:var(--mu); overflow:hidden; text-overflow:ellipsis; }
        .bb-iv-badge { padding:0 6px; border-radius:999px; border:1px solid #d99a06; background:#fbe9a8; color:#8a5a00; font-weight:900; font-size:calc(12px * var(--bb-ts, 1)); line-height:15px; flex:none; }
        .bb-iv-badge.off { border-color:var(--bd2); background:var(--sur2); color:var(--mu); font-weight:700; }
        .bb-iv-segs { display:flex; gap:2px; height:8px; }
        .bb-iv-seg { flex:1; height:8px; border-radius:2px; box-sizing:border-box; }
        .bb-iv-seg.n0 { background:rgba(0,0,0,.06); }
        .bb-iv-seg.n1 { background:#d3d1c7; }
        .bb-iv-seg.n2 { background:#a9dc8a; }
        .bb-iv-seg.n3 { background:#22c55e; }
        .bb-iv-seg.ov-b { background:repeating-linear-gradient(135deg,#e9b824 0 3px,#f7dc6a 3px 6px); }
        .bb-iv-seg.ov-m { background:repeating-linear-gradient(135deg,#c3a6f0 0 3px,#e7dcfa 3px 6px); }
        .bb-iv-seg.ov-s { background:repeating-linear-gradient(135deg,#86bff2 0 3px,#d5eafc 3px 6px); }
        .bb-iv-seg.fut { background:transparent; border:1.5px dotted var(--bd2); }
        .bb-iv-seg.cur { box-shadow:0 0 0 1.5px var(--bl); }
        .bb-iv-cnt { text-align:right; white-space:nowrap; }
        .bb-iv-cnt .c { font-size:calc(20px * var(--bb-ts, 1)); font-weight:900; line-height:1.1; }
        .bb-iv-cnt .c small { margin-left:2px; font-size:calc(13px * var(--bb-ts, 1)); color:var(--mu); font-weight:700; }
        .bb-iv-cnt .a { font-size:calc(12.5px * var(--bb-ts, 1)); color:var(--mu); margin-top:2px; }
        .bb-iv-msg { padding:34px 8px; text-align:center; font-size:calc(15px * var(--bb-ts, 1)); color:var(--mu); }
        .bb-iv-msg.warn { color:#c2410c; }
        .bb-iv-legend { flex:0 0 auto; display:flex; justify-content:center; align-items:center; gap:10px; padding:5px 6px 6px; border-top:1px solid var(--bd); font-size:calc(13.5px * var(--bb-ts, 1)); color:var(--mu); white-space:nowrap; }
        .bb-iv-legend i { display:inline-block; width:14px; height:6px; border-radius:1px; vertical-align:middle; margin-right:4px; }
        .bb-iv-cal-h { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
        .bb-iv-cal-h .t { font-size:calc(16px * var(--bb-ts, 1)); color:var(--tx); }
        .bb-iv-cal-h button { height:24px; min-width:28px; padding:0 8px; }
        .bb-iv-cal-h button[disabled] { opacity:.35; cursor:default; }

        #bb-iv-pop {
            --bg:#f2e4c4; --sur:#f8f3e6; --sur2:#efe6d2; --bd:#cabf9d; --bd2:#b3a687; --tx:#2b2418; --mu:#7a6f5c;
            --rd:#ef4444; --or:#f97316; --bl:#3b82f6; --gn:#22c55e;
            display:none; position:fixed; width:490px; max-width:96vw; flex-direction:column; color:var(--tx); font-family:'Paperlogy','Lato',-apple-system,sans-serif;
            border:3px solid transparent; border-radius:14px;
            transform:scale(var(--bb-pop-zoom,1)); transform-origin:center center;   /* #bb 밖 최상위 패널 — 본판 줌에 맞춰 커지도록(축소는 안 함) */
            background-image:linear-gradient(var(--sur),var(--sur)), linear-gradient(135deg, #d9b8ff, #9333ea);
            background-origin:border-box; background-clip:padding-box,border-box;
            box-shadow:0 18px 46px rgba(0,0,0,.45); z-index:99999998; box-sizing:border-box; overflow:hidden;
        }
        #bb-iv-pop * { box-sizing:border-box; }
        #bb-iv-pop.open { display:flex; }
        .bb-iv-ph { flex:0 0 auto; padding:12px 16px 10px; display:flex; flex-direction:column; gap:10px; }
        .bb-iv-pt { display:flex; align-items:baseline; gap:8px; }
        .bb-iv-pt b { font-size:calc(22px * var(--bb-ts, 1)); font-weight:900; }
        .bb-iv-pt span { font-size:calc(14.5px * var(--bb-ts, 1)); color:var(--mu); }
        .bb-iv-pt .x { margin-left:auto; color:#b91c1c; font-size:calc(18px * var(--bb-ts, 1)); font-weight:900; padding:0 4px; cursor:pointer; }
        .bb-iv-pt .bg { padding:1px 8px; border-radius:999px; border:1px solid #d99a06; background:#fbe9a8; color:#8a5a00; font-size:calc(13px * var(--bb-ts, 1)); font-weight:900; }
        .bb-iv-pt .off { padding:1px 8px; border-radius:999px; border:1px solid var(--bd2); background:var(--sur2); color:var(--mu); font-size:calc(13px * var(--bb-ts, 1)); font-weight:700; }
        .bb-iv-pk { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:6px; }
        .bb-iv-pk div { padding:6px 8px; border-radius:8px; background:var(--sur2); border:1px solid var(--bd); }
        .bb-iv-pk .l { font-size:calc(13px * var(--bb-ts, 1)); color:var(--mu); border:0; padding:0; background:none; }
        .bb-iv-pk .v { font-size:calc(19px * var(--bb-ts, 1)); font-weight:900; border:0; padding:0; background:none; white-space:nowrap; }
        .bb-iv-pk .v small { margin-left:3px; font-size:calc(13px * var(--bb-ts, 1)); color:var(--mu); font-weight:700; }
        .bb-iv-hrs { display:flex; flex-direction:column; gap:4px; }
        .bb-iv-hb, .bb-iv-hl { display:flex; gap:6px; }
        .bb-iv-hb { align-items:flex-end; height:74px; }
        .bb-iv-hc { flex:1; min-width:0; height:100%; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; gap:2px; }
        .bb-iv-hc span { font-size:calc(13px * var(--bb-ts, 1)); font-weight:700; color:var(--mu); text-align:center; white-space:pre-line; line-height:1.15; }
        .bb-iv-hc div { width:100%; border-radius:3px; }
        .bb-iv-hc div.n0 { background:rgba(0,0,0,.06); }
        .bb-iv-hc div.n1 { background:#d3d1c7; }
        .bb-iv-hc div.n2 { background:#a9dc8a; }
        .bb-iv-hc div.n3 { background:#22c55e; }
        .bb-iv-hc div.ov-b { background:repeating-linear-gradient(135deg,#e9b824 0 3px,#f7dc6a 3px 6px); }
        .bb-iv-hc div.ov-m { background:repeating-linear-gradient(135deg,#c3a6f0 0 3px,#e7dcfa 3px 6px); }
        .bb-iv-hc div.ov-s { background:repeating-linear-gradient(135deg,#86bff2 0 3px,#d5eafc 3px 6px); }
        .bb-iv-hc div.fut { background:transparent; border:1.5px dashed var(--bd); }
        .bb-iv-hc.cur span { color:var(--bl); }
        .bb-iv-hl span { flex:1; text-align:center; font-size:calc(12.5px * var(--bb-ts, 1)); color:var(--mu); }
        .bb-iv-fl { display:flex; gap:5px; align-items:center; flex-wrap:wrap; }
        .bb-iv-chip { height:24px; padding:0 10px; border-radius:999px; border:1.5px solid var(--bd2); background:transparent; color:var(--tx); font-size:calc(14px * var(--bb-ts, 1)); display:inline-flex; align-items:center; cursor:pointer; font-family:inherit; }
        .bb-iv-chip.on { border-color:var(--tx); background:var(--tx); color:var(--sur); font-weight:700; }
        .bb-iv-fl .hint { margin-left:auto; font-size:calc(13px * var(--bb-ts, 1)); color:var(--mu); }
        .bb-iv-th { flex:0 0 auto; display:grid; grid-template-columns:64px minmax(0,1fr) 84px; gap:8px; padding:5px 16px; border-top:1px solid var(--bd); border-bottom:2px solid var(--bd); background:var(--sur2); font-size:calc(14px * var(--bb-ts, 1)); font-weight:700; color:var(--mu); }
        .bb-iv-th span:last-child { text-align:right; }
        .bb-iv-tb { flex:1 1 auto; min-height:0; overflow-y:auto; overflow-x:hidden; padding:0 8px 6px 16px; }
        .bb-iv-tr { display:grid; grid-template-columns:64px minmax(0,1fr) 84px; gap:8px; padding:7px 4px; border-bottom:1px solid var(--bd); align-items:center; }
        .bb-iv-tr.ab { background:rgba(249,115,22,.08); }
        .bb-iv-tr .t { font-size:calc(15px * var(--bb-ts, 1)); color:var(--mu); font-variant-numeric:tabular-nums; }
        .bb-iv-tr .m { min-width:0; }
        .bb-iv-tr .m1 { font-size:calc(16px * var(--bb-ts, 1)); font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bb-iv-tr .m2 { font-size:calc(13.5px * var(--bb-ts, 1)); color:var(--mu); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bb-iv-tr .m3 { font-size:calc(13px * var(--bb-ts, 1)); color:#c2410c; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bb-iv-tr .d { min-width:0; text-align:right; white-space:nowrap; overflow:hidden; }
        .bb-iv-tr .d1 { font-size:calc(15.5px * var(--bb-ts, 1)); font-variant-numeric:tabular-nums; }
        .bb-iv-tr .d1.long { color:#e11d74; font-weight:700; }
        .bb-iv-tr .d2 { font-size:calc(12.5px * var(--bb-ts, 1)); color:var(--mu); }
        .bb-iv-tr .d2.ab { color:#c2410c; font-weight:700; }
        .bb-iv-tr .d2.inf { color:#b45309; font-weight:700; }
        .bb-iv-tr .who { display:inline-block; margin-right:5px; padding:0 6px; border-radius:6px; background:var(--sur2); border:1px solid var(--bd); font-size:calc(13.5px * var(--bb-ts, 1)); font-weight:700; }
        .bb-iv-more { padding:9px; text-align:center; font-size:calc(14.5px * var(--bb-ts, 1)); color:var(--bl); font-weight:700; cursor:pointer; text-decoration:underline; }
        .bb-iv-pf { flex:0 0 auto; padding:5px 16px 7px; border-top:1px solid var(--bd); font-size:calc(13px * var(--bb-ts, 1)); color:var(--mu); display:flex; gap:10px; white-space:nowrap; }
        .bb-iv-pf span:last-child { margin-left:auto; }
        `;
        document.head.appendChild(st);

        /* ───────── 화면 요소 붙이기 ───────── */
        const box = document.querySelector('.bb-mm-box');
        const track = $iv('bb-mm-track');
        const page = ivEl('div'); page.id = 'bb-iv-page';
        page.innerHTML =
            '<div class="bb-iv-head">' +
              '<button class="bb-mm-nav" id="bb-iv-help-btn" title="이 화면 사용 설명"><span class="tx"><span class="l1">사용</span><span class="l2">설명</span></span></button>' +
              '<div class="bb-att-title" id="bb-iv-title">개입카드 현황</div>' +
              '<div class="bb-att-r2">' +
                '<button class="bb-mm-nav bb-att-mbtn" id="bb-iv-today">오늘</button>' +
                '<button class="bb-mm-nav bb-att-mbtn" id="bb-iv-cal-btn">달력</button>' +
                '<button class="bb-mm-nav" id="bb-iv-all" title="그날 전체 처리 내역">자세히</button>' +
                '<span class="bb-att-stat" id="bb-iv-stat"></span>' +
              '</div>' +
              '<button class="bb-mm-nav" id="bb-iv-stats-btn" title="개인별 누적 개입 건수 (근무일수 포함)"><span class="tx"><span class="l1">누적</span><span class="l2">통계</span></span></button>' +
              '<button class="bb-mm-nav bb-att-back" id="bb-iv-back" title="다중 모니터링으로 돌아가기"><span class="tx"><span class="l1">다중</span><span class="l2">미갱신</span></span><span class="ar">»</span></button>' +
              '<div class="bb-att-cal" id="bb-iv-cal"></div>' +
              '<div class="bb-iv-help" id="bb-iv-help"></div>' +
            '</div>' +
            '<div class="bb-iv-kpis" id="bb-iv-kpis"></div>' +
            '<div class="bb-iv-notes" id="bb-iv-notes"></div>' +
            '<div class="bb-iv-body" id="bb-iv-body"></div>' +
            '<div class="bb-iv-legend">' +
              '<span title="휴게시간으로 잡힌 시간대 (그 시간에 처리한 건이 있어도 카드에서는 빗금 유지, 자세히에서 건수만큼 막대가 높아짐)"><i style="background:repeating-linear-gradient(135deg,#e9b824 0 2px,#f7dc6a 2px 4px)"></i>휴게시간</span>' +
              '<span title="업무 배정표(daily_tasks)상 다중 모니터링을 하는 시간대"><i style="background:repeating-linear-gradient(135deg,#c3a6f0 0 2px,#e7dcfa 2px 4px)"></i>다중 모니터링</span>' +
              '<span title="업무 배정표(daily_tasks)상 부산국립과학관 임무를 하는 시간대"><i style="background:repeating-linear-gradient(135deg,#86bff2 0 2px,#d5eafc 2px 4px)"></i>부산국립과학관</span>' +
            '</div>';
        page.inert = true;
        box.appendChild(page);
        $iv('bb-iv-help').innerHTML = IV_HELP;   // 직접 쓴 안내문(줄바꿈 = <br>)

        const pop = ivEl('div'); pop.id = 'bb-iv-pop';
        document.body.appendChild(pop);

        // 다중 모니터링 제목 왼쪽의 진입 버튼 (오른쪽 '이석 »' 과 대칭)
        const mmHead = document.querySelector('#bb-mm-page-multi .bb-mm-head');
        if (mmHead) {
            mmHead.classList.add('bb-iv-hd');
            const go = ivEl('button', 'bb-mm-nav bb-mm-goiv'); go.id = 'bb-iv-go'; go.title = '개입카드 현황으로 전환';
            go.innerHTML = '<span class="ar">«</span><span class="tx"><span class="l1">개입</span><span class="l2">현황</span></span>';
            mmHead.appendChild(go);
        }

        /* ───────── 데이터 ───────── */
        const ivDateNow = () => _ivDate || ivOpDate();
        async function ivRefresh(force) {
            if (_ivBusy && !force) return;
            _ivBusy = true;
            const seq = ++_ivSeq, want = _ivDate;
            try {
                const d = await attFetchJson(IV_API + '?view=summary' + (want ? '&date=' + want : ''));
                if (seq !== _ivSeq) return;   // 그 사이 날짜를 바꿨음
                if (!d || d.ok !== true || !Array.isArray(d.people)) throw new Error('데이터 형식 오류');
                ivApplyExceptions(d);
                _ivData = d; _ivData._at = Date.now(); _ivFail = false;
            } catch (e) {
                if (seq !== _ivSeq) return;
                console.warn('[BB] 개입카드 갱신 실패:', e.message);
                _ivFail = true;
            } finally { _ivBusy = false; }
            ivRender();
            if (_ivPopKey && !_ivFail) ivLoadDetail(true);   // 열려 있는 팝업도 함께 갱신
        }

        /* ───────── 목록 화면 ───────── */
        function ivHourLabels(p) {
            const m = /^(\d{2})/.exec(p.shift || '');
            if (!m || !p.hours) return [];
            return p.hours.map((_, i) => (+m[1] + i) % 24);
        }
        const ivLvl = (c, scale) => (c >= scale[3] ? 'n3' : c >= scale[2] ? 'n2' : c >= scale[1] ? 'n1' : 'n0');
        // 시간 칸 구분(서버 ov): b 휴게 / m 다중 모니터링 / s 부산국립과학관. 옛 서버 응답(ov 없음)이면 brkIdx로 대신한다.
        const IV_OV_NAME = { b: '휴게시간', m: '다중 모니터링', s: '부산국립과학관' };
        const ivOv = (p, i) => (p.ov ? p.ov[i] || '' : i === p.brkIdx ? 'b' : '');
        function ivSegs(p, scale) {
            const wrap = ivEl('div', 'bb-iv-segs');
            const labels = ivHourLabels(p);
            (p.hours || []).forEach((c, i) => {
                const s = ivEl('span', 'bb-iv-seg');
                const o = ivOv(p, i);
                // 휴게·다중·과학관 칸은 그 시간에 처리한 건이 있어도 항상 빗금(칸이 좁아 색 구분이 어렵다). 건수는 툴팁/자세히에서 본다.
                if (o) s.classList.add('ov-' + o);
                else if (p.futFrom >= 0 && i >= p.futFrom) s.classList.add('fut');
                else s.classList.add(ivLvl(c, scale));
                if (i === p.curIdx) s.classList.add('cur');
                s.title = attPad(labels[i]) + '시' + (c > 0 ? ' · ' + c + '건' : '') + (o ? ' · ' + IV_OV_NAME[o] : '');
                wrap.appendChild(s);
            });
            return wrap;
        }
        // 정렬: 'shift' = 출근 시각 순(순위 없음, 기본) / 'cnt' = 처리 건수 순. 퇴근·출근 전은 어느 쪽이든 아래로.
        function ivShiftKey(p) {
            const m = /^(\d{2})(?::(\d{2}))?[–-](\d{2})/.exec(p.shift || '');
            if (!m) return [9999, 9999];
            let st = +m[1] * 60 + (+m[2] || 0);
            if (st < 420) st += 1440;                      // 07:00 시작 근무일 기준 (00~06시 시작은 뒤로)
            return [st, +m[3]];
        }
        function ivSortPeople(list) {
            if (_ivSort === 'cnt') return list.slice();    // 서버가 이미 건수순
            return list.slice().sort((a, b) => {
                const ka = ivShiftKey(a), kb = ivShiftKey(b);
                return Number(a.off) - Number(b.off) || ka[0] - kb[0] || ka[1] - kb[1] || String(a.name).localeCompare(String(b.name), 'ko');
            });
        }
        function ivRender() {
            const title = $iv('bb-iv-title'), stat = $iv('bb-iv-stat'), body = $iv('bb-iv-body'), kp = $iv('bb-iv-kpis'), nt = $iv('bb-iv-notes');
            const date = ivDateNow(), isToday = date === ivOpDate();
            $iv('bb-iv-today').classList.toggle('on', isToday);
            $iv('bb-iv-cal-btn').classList.toggle('on', !isToday);
            const d = _ivData && _ivData.date === date ? _ivData : null;
            title.replaceChildren();
            title.append('개입카드 현황 (' + ivMD(date) + ')');
            if (!d) {
                kp.replaceChildren(); nt.replaceChildren(); stat.textContent = '';
                const m = ivEl('div', 'bb-iv-msg' + (_ivFail ? ' warn' : ''), _ivFail ? '불러오지 못했습니다. ' : '불러오는 중…');
                if (_ivFail) { const r = ivEl('span', 'bb-att-retry', '다시 시도'); r.addEventListener('click', ivSafe(() => ivRefresh(true))); m.appendChild(r); }
                body.replaceChildren(m);
                return;
            }
            const T = d.totals || {};
            title.append(ivEl('span', 'sep', ' - '));
            if (isToday) title.append('오늘 ');
            else { const pst = ivEl('span', 'past', '과거 '); title.appendChild(pst); }
            const cntEl = ivEl('span', 'n', (T.solved || 0) + '건');
            cntEl.style.cssText = 'font-weight:900;color:#c2410c';
            title.appendChild(cntEl);
            // 기준 시각 = 서버에서 데이터를 실제로 받아온 시각 (갱신에 실패하면 마지막으로 받은 시각을 경고색으로)
            // 기준 시각 = 확장프로그램이 GitHub에 마지막으로 올린 시각 (화면에 보이는 데이터는 그 시각까지의 내용). 못 알면 받아온 시각에 '경'
            const up = Math.max(0, ...Object.values(d.pcs || {}).map(x => (x && x.ts) || 0));
            const stale = up > 0 && Date.now() - up > 10 * 60 * 1000;
            stat.textContent = !isToday ? '' : up > 0 ? (_ivFail || stale ? '⚠ ' : '') + attHM(up) + ' 기준' : (_ivFail ? '⚠ ' : '') + attHM(d._at || d.asOf) + ' 경';
            stat.title = up > 0 ? '확장프로그램이 데이터를 마지막으로 올린 시각 (약 3분 간격)' + (stale ? ' — 10분 넘게 올라오지 않았습니다' : '') : '이 화면이 데이터를 받아온 시각';
            stat.classList.toggle('warn', _ivFail || stale);

            const k = (l, v, u) => { const e = ivEl('div', 'bb-iv-kpi'); e.appendChild(ivEl('span', 'l', l)); const s = ivEl('span', 'v', v); if (u) s.appendChild(ivEl('small', '', u)); e.appendChild(s); return e; };
            kp.replaceChildren(k('처리 건수', String(T.solved || 0), '건'), k('처리 인원', String(T.people || 0), '명'), k('평균 처리시간', T.avgSec == null ? '-' : ivDur(T.avgSec)));

            const chips = [];
            const chip = (label, n, name, flt) => { if (n > 0) { const b = ivEl('button', 'bb-iv-note', label + ' ' + n); b.dataset.name = name; b.dataset.flt = flt; chips.push(b); } };
            chip('추정', T.inferred, '__all', 'inf');
            chip('이탈', T.abandoned, '__all', 'ab');
            chip('특정 불가', T.unresolved, '__all', 'unk');   // 세 칩 모두 같은 '자세히' 창을 열고 필터만 다르게
            const sb = ivEl('button', 'bb-iv-note bb-iv-sort', _ivSort === 'cnt' ? '건수 순' : '근무시간 순');
            sb.title = '목록 정렬 방식 바꾸기';
            sb.dataset.sort = '1';
            chips.push(sb);
            nt.replaceChildren(...chips);

            const scale = d.scale || [0, 1, 3, 6];
            const rows = [];
            ivSortPeople(d.people).forEach((p) => {
                if (!p.solved && !p.hours && !p.inferred && !p.abandoned) return;
                const r = ivEl('div', 'bb-iv-row');
                r.dataset.name = p.name;
                if (p.onBreak) r.classList.add('brk');
                if (p.off) r.classList.add('off');
                if (_ivPopName === p.name) r.classList.add('sel');
                const mid = ivEl('div', 'bb-iv-mid');
                const l1 = ivEl('div', 'bb-iv-l1');
                l1.appendChild(ivEl('span', 'bb-iv-nm', p.name));
                l1.appendChild(ivEl('span', 'bb-iv-meta', p.shift || ''));
                if (p.onBreak) l1.appendChild(ivEl('span', 'bb-iv-badge', '휴게중'));
                else if (p.off) l1.appendChild(ivEl('span', 'bb-iv-badge off', p.offKind === 'before' ? '출근 전' : '퇴근'));
                mid.appendChild(l1);
                if (p.hours) mid.appendChild(ivSegs(p, scale));
                r.appendChild(mid);
                const c = ivEl('div', 'bb-iv-cnt');
                const cc = ivEl('div', 'c', String(p.solved)); cc.appendChild(ivEl('small', '', '건'));
                c.appendChild(cc);
                c.appendChild(ivEl('div', 'a', p.avgSec == null ? '' : '평균 ' + ivDur(p.avgSec)));
                r.appendChild(c);
                rows.push(r);
            });
            if (!rows.length) rows.push(ivEl('div', 'bb-iv-msg', isToday ? '아직 기록이 없습니다.' : '이 날짜의 기록이 없습니다.'));
            const keep = body.scrollTop;
            body.replaceChildren(...rows);
            body.scrollTop = keep;
        }

        /* ───────── 달력 (이석 화면과 같은 모양 · 로그(JSON)가 있는 날만 선택 가능) ───────── */
        function ivCloseHelp() { $iv('bb-iv-help').classList.remove('open'); $iv('bb-iv-help-btn').classList.remove('on'); }
        function ivToggleHelp() {
            const h = $iv('bb-iv-help'), open = !h.classList.contains('open');
            ivCloseCal(); ivClosePop();
            h.classList.toggle('open', open);
            $iv('bb-iv-help-btn').classList.toggle('on', open);
        }
        function ivCloseCal() { _ivCalOpen = false; $iv('bb-iv-cal').classList.remove('open'); }
        async function ivOpenCal() {
            if (_ivCalOpen) { ivCloseCal(); return; }
            ivClosePop(); ivCloseHelp();
            _ivCalOpen = true;
            const p = ivDateNow().split('-').map(Number);
            _ivCalYm = { y: p[0], m: p[1] };
            $iv('bb-iv-cal').classList.add('open');
            ivRenderCal('loading');
            if (!_ivDates || Date.now() - _ivDatesAt > 60000) {
                try {
                    const d = await attFetchJson(IV_API + '?view=dates');
                    if (!d || d.ok !== true || !Array.isArray(d.dates)) throw new Error('데이터 형식 오류');
                    _ivDates = new Set(d.dates); _ivDatesAt = Date.now();
                } catch (e) { console.warn('[BB] 개입카드 날짜 목록 실패:', e.message); if (_ivCalOpen) ivRenderCal('fail'); return; }
            }
            if (_ivCalOpen) ivRenderCal();
        }
        function ivRenderCal(state) {
            const cal = $iv('bb-iv-cal');
            if (state) { cal.replaceChildren(ivEl('div', 'bb-iv-msg' + (state === 'fail' ? ' warn' : ''), state === 'fail' ? '날짜 목록을 불러오지 못했습니다.' : '불러오는 중…')); return; }
            const y = _ivCalYm.y, m = _ivCalYm.m;
            const all = [..._ivDates].sort();
            const minYm = all.length ? all[0].slice(0, 7) : null, maxYm = all.length ? all[all.length - 1].slice(0, 7) : null;
            const ym = y + '-' + attPad(m);
            const head = ivEl('div', 'bb-iv-cal-h');
            const prev = ivEl('button', 'bb-mm-nav', '‹'), next = ivEl('button', 'bb-mm-nav', '›');
            prev.dataset.mv = '-1'; next.dataset.mv = '1';
            prev.disabled = !minYm || ym <= minYm; next.disabled = !maxYm || ym >= maxYm;
            head.append(prev, ivEl('span', 't', y + '년 ' + m + '월'), next);
            const grid = ivEl('div', 'bb-att-cal-grid');
            ['일', '월', '화', '수', '목', '금', '토'].forEach(d => grid.appendChild(ivEl('div', 'bb-att-dow', d)));
            const dow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(), dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
            for (let i = 0; i < dow; i++) grid.appendChild(ivEl('div'));
            const today = ivOpDate(), sel = ivDateNow();
            for (let d = 1; d <= dim; d++) {
                const ds = ym + '-' + attPad(d);
                const cell = ivEl('div', 'bb-att-day', String(d));
                if (_ivDates.has(ds)) { cell.classList.add('has'); cell.dataset.date = ds; cell.appendChild(ivEl('span', 'dot')); }
                if (ds === today) cell.classList.add('today');
                if (ds === sel) cell.classList.add('sel');
                grid.appendChild(cell);
            }
            cal.replaceChildren(head, grid);
        }

        /* ───────── 팝업 ───────── */
        function ivPlacePop() {
            const br = page.getBoundingClientRect(), w = pop.offsetWidth;   // [UI 개편] 개입 그리드 자신의 왼쪽
            let left = br.right + 10;   // [admin] 그리드가 왼쪽 절반에 있으므로 팝업은 오른쪽 우선
            if (left + w > window.innerWidth - 8) left = br.left - w - 10;
            pop.style.left = Math.max(8, left) + 'px';
            pop.style.top = Math.max(8, br.top) + 'px';
            pop.style.height = Math.min(br.height, window.innerHeight - 16) + 'px';
        }
        function ivClosePop() {
            _ivPopKey = null; _ivPopName = null; _ivDetail = null;
            pop.classList.remove('open');
            document.querySelectorAll('.bb-iv-row.sel').forEach(e => e.classList.remove('sel'));
        }
        function ivOpenPop(name, flt) {
            if (_ivPopName === name && !flt && pop.classList.contains('open')) { ivClosePop(); return; }
            ivCloseCal(); ivCloseHelp();
            _ivPopName = name; _ivPopFilter = flt || 'all'; _ivPopLimit = IV_ROWS_STEP; _ivDetail = null;
            _ivPopKey = ivDateNow() + '|' + name;
            document.querySelectorAll('.bb-iv-row').forEach(e => e.classList.toggle('sel', e.dataset.name === name));
            pop.classList.add('open');
            ivPlacePop();
            ivRenderPop();
            ivLoadDetail(false);
        }
        async function ivLoadDetail(silent) {
            const key = _ivPopKey;
            if (!key) return;
            const cached = _ivDetailCache[key];
            if (!silent && cached && Date.now() - cached._at < 20000) { _ivDetail = cached; ivRenderPop(); return; }
            try {
                const d = await attFetchJson(IV_API + '?view=person&name=' + encodeURIComponent(_ivPopName) + '&date=' + ivDateNow());
                if (!d || d.ok !== true || !Array.isArray(d.rows)) throw new Error('데이터 형식 오류');
                d._at = Date.now();
                _ivDetailCache[key] = d;
                if (_ivPopKey !== key) return;
                _ivDetail = d;
            } catch (e) {
                console.warn('[BB] 개입카드 내역 실패:', e.message);
                if (_ivPopKey !== key) return;
                if (!silent) _ivDetail = { _fail: true };
            }
            ivRenderPop();
        }
        const ivPersonOf = name => (_ivData && _ivData.people.find(p => p.name === name)) || null;
        function ivMatch(r, f) {
            if (f === 'all') return true;
            if (f === 'ok') return r.st === 'resolved' && !r.inf;
            if (f === 'inf') return r.inf;
            if (f === 'unk') return r.n === '';
            if (f === 'ab') return !r.inf && r.n !== '' && (r.st === 'abandoned' || r.st === 'stopped');
            return true;
        }
        function ivRenderPop() {
            if (!_ivPopKey) return;
            const name = _ivPopName, special = name === '__all' || name === '__unresolved';
            const p = special ? null : ivPersonOf(name), d = _ivDetail && !_ivDetail._fail ? _ivDetail : null;
            const head = ivEl('div', 'bb-iv-ph');
            const pt = ivEl('div', 'bb-iv-pt');
            pt.appendChild(ivEl('b', '', name === '__all' ? '자세히 (' + ivMD(ivDateNow()) + (ivDateNow() === ivOpDate() ? ' 오늘' : '') + ')' : name === '__unresolved' ? '이름 특정 불가' : name));
            if (p && p.shift) pt.appendChild(ivEl('span', '', p.shift));
            if (p && p.brk) pt.appendChild(ivEl('span', 'bg', '휴게 ' + p.brk + '시'));
            if (p && p.off && p.offKind !== 'before') pt.appendChild(ivEl('span', 'off', '퇴근'));
            const x = ivEl('span', 'x', '✕'); x.dataset.act = 'close'; pt.appendChild(x);
            head.appendChild(pt);

            if (d && name !== '__unresolved') {
                const C = d.counts || {};
                const pk = ivEl('div', 'bb-iv-pk');
                const cell = (l, v, u, stl) => { const e = ivEl('div'); e.appendChild(ivEl('div', 'l', l)); const vv = ivEl('div', 'v', v); if (stl) vv.style.cssText = stl; if (u) vv.appendChild(ivEl('small', '', u)); e.appendChild(vv); return e; };
                pk.append(cell('처리', String(C.solved || 0), '건'), cell('평균', d.avgSec == null ? '-' : ivDur(d.avgSec)), cell('최장', d.maxSec == null ? '-' : ivDur(d.maxSec), '', d.maxSec >= IV_LONG_SEC ? 'color:#e11d74' : ''), cell('이탈', String(C.abandoned || 0), '건', C.abandoned ? 'color:var(--or)' : ''));
                head.appendChild(pk);
            }
            if (p && p.hours && _ivData) {
                const scale = _ivData.scale || [0, 1, 3, 6], labels = ivHourLabels(p), max = Math.max(1, ...p.hours);
                const hrs = ivEl('div', 'bb-iv-hrs'), hb = ivEl('div', 'bb-iv-hb'), hl = ivEl('div', 'bb-iv-hl');
                p.hours.forEach((c, i) => {
                    const col = ivEl('div', 'bb-iv-hc' + (i === p.curIdx ? ' cur' : ''));
                    const o = ivOv(p, i), fut = !o && p.futFrom >= 0 && i >= p.futFrom;
                    const OV_SHORT = { b: '휴게', m: '다중', s: '과학관' };
                    // 빗금 칸: 0건이면 낮은 막대(기본), 건수가 늘면 그만큼 높아진다. 라벨은 "다중(11)"(칸이 좁아 두 줄)
                    const lab = o ? OV_SHORT[o] + (c > 0 ? '\n(' + c + ')' : '') : fut ? '' : String(c);
                    col.appendChild(ivEl('span', '', lab));
                    const bar = ivEl('div', o ? 'ov-' + o : fut ? 'fut' : ivLvl(c, scale));
                    bar.style.height = (fut ? 56 : o ? Math.max(12, Math.round((c / max) * 52 + 4)) : Math.round((c / max) * 52 + 4)) + 'px';
                    if (o && !(c > 0)) bar.style.height = '12px';
                    col.title = attPad(labels[i]) + '시' + (c > 0 ? ' · ' + c + '건' : '') + (o ? ' · ' + IV_OV_NAME[o] : '');
                    col.appendChild(bar);
                    hb.appendChild(col);
                    hl.appendChild(ivEl('span', '', attPad(labels[i]) + '시'));
                });
                hrs.append(hb, hl);
                head.appendChild(hrs);
            }
            if (d && name !== '__unresolved') {
                const fl = ivEl('div', 'bb-iv-fl');
                const C = d.counts || {}, tot = d.rows.length;
                const defs = [['all', '전체', tot], ['ok', '해결', C.solved || 0], ['inf', '추정', C.inferred || 0], ['ab', '이탈', C.abandoned || 0], ['unk', '특정 불가', name === '__all' ? d.rows.filter(r => r.n === '').length : 0]];
                defs.forEach(([k, l, n]) => { if (k !== 'all' && !n && _ivPopFilter !== k) return; const c = ivEl('button', 'bb-iv-chip' + (_ivPopFilter === k ? ' on' : ''), l + ' ' + n); c.dataset.flt = k; fl.appendChild(c); });
                fl.appendChild(ivEl('span', 'hint', '3분 이상 처리 시 분홍 텍스트'));
                head.appendChild(fl);
            }

            const th = ivEl('div', 'bb-iv-th');
            th.append(ivEl('span', '', '시작'), ivEl('span', '', special ? '이름 · 카드 · 사유' : '카드 · 사유'), ivEl('span', '', '소요시간'));
            const tb = ivEl('div', 'bb-iv-tb');
            const foot = ivEl('div', 'bb-iv-pf');
            if (!_ivDetail) tb.appendChild(ivEl('div', 'bb-iv-msg', '불러오는 중…'));
            else if (_ivDetail._fail) {
                const m = ivEl('div', 'bb-iv-msg warn', '불러오지 못했습니다. ');
                const r = ivEl('span', 'bb-att-retry', '다시 시도'); r.dataset.act = 'retry'; m.appendChild(r); tb.appendChild(m);
            } else {
                const list = d.rows.filter(r => ivMatch(r, _ivPopFilter));
                list.slice(0, _ivPopLimit).forEach(r => tb.appendChild(ivRowEl(r, special)));
                if (!list.length) tb.appendChild(ivEl('div', 'bb-iv-msg', '해당하는 내역이 없습니다.'));
                if (list.length > _ivPopLimit) { const m = ivEl('div', 'bb-iv-more', '더 보기 (' + (list.length - _ivPopLimit) + '건 남음)'); m.dataset.act = 'more'; tb.appendChild(m); }
                foot.append(ivEl('span', '', list.length + '건 중 ' + Math.min(list.length, _ivPopLimit) + '건 표시'), ivEl('span', '', '추정 · 이탈은 건수 제외'));
            }
            const keep = pop.querySelector('.bb-iv-tb'), top = keep ? keep.scrollTop : 0;
            pop.replaceChildren(head, th, tb, foot);
            tb.scrollTop = top;
            ivPlacePop();
        }
        // 추정 근거를 한 줄로 (서버 문구 → 짧은 표현)
        const ivBasisShort = b => (/한 명/.test(b || '') ? '이니셜로 추정' : /근무표/.test(b || '') ? '근무표로 추정' : '근무시간으로 추정');
        function ivRowEl(r, special) {
            const row = ivEl('div', 'bb-iv-tr' + (r.st === 'abandoned' || r.st === 'stopped' ? ' ab' : ''));
            row.appendChild(ivEl('span', 't', ivHMS(r.t)));
            const m = ivEl('div', 'm');
            const m1 = ivEl('div', 'm1');
            if (special) m1.appendChild(ivEl('span', 'who', r.n ? r.n + (r.inf ? '?' : '') : '?'));
            m1.append(r.card || '(카드 정보 숨김)');
            m.appendChild(m1);
            m.appendChild(ivEl('div', 'm2', r.why || ''));
            if (r.c && r.c.length) m.appendChild(ivEl('div', 'm2', '후보: ' + r.c.join(', ')));
            if (r.nx) m.appendChild(ivEl('div', 'm3', '같은 기체 · ' + ivGap(r.nx.s) + ' ' + ivWho(r.nx) + ' 점유'));
            if (r.pv) m.appendChild(ivEl('div', 'm3', '같은 기체 · 직전에 ' + ivWho(r.pv) + ' 이탈'));
            row.appendChild(m);
            const dd = ivEl('div', 'd');
            const sec = r.e ? Math.round((r.e - r.t) / 1000) : null;
            const d1 = ivEl('div', 'd1', r.st === 'ongoing' ? '진행중' : sec == null ? '-' : (r.approx ? '~' : '') + ivDur(sec));
            if (sec != null && sec >= IV_LONG_SEC && r.st === 'resolved') d1.classList.add('long');
            dd.appendChild(d1);
            const tag = r.inf ? ivBasisShort(r.basis) : r.st === 'abandoned' ? '이탈' : r.st === 'stopped' ? '수집중단' : '';
            if (tag) dd.appendChild(ivEl('div', 'd2 ' + (r.inf ? 'inf' : 'ab'), tag));
            row.appendChild(dd);
            return row;
        }

        /* ───────── 전환 / 이벤트 ───────── */
        // 열기: 개입 화면이 왼쪽에서 들어오고, 다중 화면은 오른쪽으로 밀려남 (이석 화면 전환과 같은 방향감)
        function ivSetOpen(v) {
            _ivOpen = v;
            page.classList.toggle('open', v);
            page.inert = !v;
            // [UI 개편: 3분할 그리드라 슬라이드/inert 처리 주석처리]
            // track.style.transform = v ? 'translateX(50%)' : '';
            // const multi = $iv('bb-mm-page-multi');
            // if (multi) multi.inert = v;
            if (v) { ivRender(); if (!_ivData || _ivData.date !== ivDateNow() || Date.now() - (_ivData._at || 0) > 10000) ivRefresh(true); }   // 왔다 갔다 해도 10초 안이면 다시 요청하지 않음
            else { ivClosePop(); ivCloseCal(); ivCloseHelp(); }
        }
        function ivSetDate(d) {
            ivCloseCal();
            if (d === ivOpDate()) d = null;
            if (_ivDate === d && _ivData && _ivData.date === ivDateNow()) return;
            _ivDate = d; _ivData = null; _ivFail = false; ivClosePop();
            ivRender(); ivRefresh(true);
        }
        $iv('bb-iv-go').addEventListener('click', ivSafe(() => ivSetOpen(true)));
        $iv('bb-iv-back').addEventListener('click', ivSafe(() => ivSetOpen(false)));
        $iv('bb-iv-today').addEventListener('click', ivSafe(() => ivSetDate(null)));
        $iv('bb-iv-help-btn').addEventListener('click', ivSafe(() => ivToggleHelp()));
        $iv('bb-iv-cal-btn').addEventListener('click', ivSafe(() => ivOpenCal()));
        $iv('bb-iv-cal').addEventListener('click', ivSafe(e => {
            const mv = e.target.closest('button[data-mv]');
            if (mv && !mv.disabled) { const t = _ivCalYm.y * 12 + (_ivCalYm.m - 1) + Number(mv.dataset.mv); _ivCalYm = { y: Math.floor(t / 12), m: (t % 12) + 1 }; ivRenderCal(); return; }
            const day = e.target.closest('.bb-att-day.has');
            if (day) ivSetDate(day.dataset.date);
        }));
        $iv('bb-iv-all').addEventListener('click', ivSafe(() => ivOpenPop('__all')));
        $iv('bb-iv-body').addEventListener('click', ivSafe(e => { const r = e.target.closest('.bb-iv-row'); if (r) ivOpenPop(r.dataset.name); }));
        $iv('bb-iv-notes').addEventListener('click', ivSafe(e => { const b = e.target.closest('.bb-iv-note'); if (!b) return; if (b.dataset.sort) { _ivSort = _ivSort === 'cnt' ? 'shift' : 'cnt'; try { localStorage.setItem('bbIvSort', _ivSort); } catch (x) { /* 저장 못 해도 이번엔 적용 */ } ivRender(); return; } ivOpenPop(b.dataset.name, b.dataset.flt); }));
        pop.addEventListener('click', ivSafe(e => {
            const c = e.target.closest('.bb-iv-chip'), a = e.target.closest('[data-act]');
            if (c) { _ivPopFilter = c.dataset.flt; _ivPopLimit = IV_ROWS_STEP; ivRenderPop(); }
            else if (a) {
                if (a.dataset.act === 'close') ivClosePop();
                else if (a.dataset.act === 'more') { _ivPopLimit += IV_ROWS_STEP; ivRenderPop(); }
                else if (a.dataset.act === 'retry') { _ivDetail = null; ivRenderPop(); ivLoadDetail(false); }
            }
        }));
        document.addEventListener('click', ivSafe(e => {   // 바깥 클릭 → 팝업/달력 닫기
            if (_ivPopKey && !e.target.closest('#bb-iv-pop') && !e.target.closest('.bb-iv-row') && !e.target.closest('.bb-iv-note') && !e.target.closest('#bb-iv-all')) ivClosePop();
            if (_ivCalOpen && !e.target.closest('#bb-iv-cal') && !e.target.closest('#bb-iv-cal-btn')) ivCloseCal();
            if ($iv('bb-iv-help').classList.contains('open') && !e.target.closest('#bb-iv-help') && !e.target.closest('#bb-iv-help-btn')) ivCloseHelp();
        }), true);
        document.addEventListener('keydown', ivSafe(e => { if (e.key === 'Escape') { if (_ivPopKey) ivClosePop(); else if (_ivCalOpen) ivCloseCal(); else ivCloseHelp(); } }));

        /* ───────── 통계: 개인별 누적 개입 건수 (헤더의 '통계' 버튼 → 팝업) ─────────
           · 건수: 날짜 목록(view=dates) + 날짜별 요약(view=summary&date=…) 을 서버에서 받아 합산. 건수 = 서버가 '이름 확정'으로 센 처리 건수(p.solved)
           · 근무일: 월별 근무표 JSON(monitoring_data_vault/monthly_schedule/schedule_for_mobile_YYYY-MM.json)에서 개입 기록 기간의 날짜만 대조.
                    present===true 인 날 = 근무일 (연차 제외, 반차는 1일). 근무표에 없는 날/이름은 기록 기반(처리 건수 또는 근무시간)으로 대체하고 '*' 표시.
                    근무표에는 없는 날에 처리 건수가 있으면 그 날도 근무일로 본다(근무 교대 등).
           · 저장(localStorage): 지난 날짜 요약(bbIvStatsV2)과 지난 달 근무표(bbIvSchedV1)는 변하지 않으므로 다시 받지 않는다.
             최근 3일 요약과 이번 달 근무표(6시간 지나면)만 다시 받는다. '새로 집계' = 저장분 버리고 전부 다시 받기. */
        const IV_SP_KEY = 'bbIvStatsV2';
        const IV_SCH_KEY = 'bbIvSchedV1';
        const IV_SCH_BASE = 'https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/monthly_schedule/schedule_for_mobile_';
        const IV_SCH_TTL = 6 * 3600 * 1000;   // 이번 달 근무표를 다시 받는 간격
        const IV_SP_CONC = 3;     // 동시 요청 수
        const IV_SP_REFETCH_DAYS = 3;   // 오늘 포함 이 일수만큼은 매번 다시 받음
        const spSt = document.createElement('style');
        spSt.id = 'bb-sp-style';
        spSt.textContent = `
        #bb-iv-stats-btn { background:#d6f5e3; border-color:#8fd3ac; color:#14532d; }
        #bb-iv-stats-btn.on { background:#9fe3bd; border-color:#4fb57d; }
        #bb-iv-sp {
            --bg:#f2e4c4; --sur:#f8f3e6; --sur2:#efe6d2; --bd:#cabf9d; --bd2:#b3a687; --tx:#2b2418; --mu:#7a6f5c; --bl:#3b82f6;
            display:none; position:fixed; width:545px; max-width:96vw; flex-direction:column; color:var(--tx); font-family:'Paperlogy','Lato',-apple-system,sans-serif;
            border:3px solid transparent; border-radius:14px;
            transform:scale(var(--bb-pop-zoom,1)); transform-origin:center center;
            background-image:linear-gradient(var(--sur),var(--sur)), linear-gradient(135deg, #d9b8ff, #9333ea);
            background-origin:border-box; background-clip:padding-box,border-box;
            box-shadow:0 18px 46px rgba(0,0,0,.45); z-index:99999998; box-sizing:border-box; overflow:hidden;
        }
        #bb-iv-sp * { box-sizing:border-box; }
        #bb-iv-sp.open { display:flex; }
        .bb-sp-h { flex:0 0 auto; padding:12px 16px 8px; display:flex; flex-direction:column; gap:4px; }
        .bb-sp-t { display:flex; align-items:baseline; gap:10px; }
        .bb-sp-t b { font-size:calc(22px * var(--bb-ts, 1)); font-weight:900; }
        .bb-sp-t .rf { margin-left:2px; font-size:calc(13.5px * var(--bb-ts, 1)); color:var(--bl); cursor:pointer; text-decoration:underline; }
        .bb-sp-t .x { margin-left:auto; color:#b91c1c; font-size:calc(18px * var(--bb-ts, 1)); font-weight:900; padding:0 4px; cursor:pointer; }
        .bb-sp-sub { font-size:calc(13.5px * var(--bb-ts, 1)); color:var(--mu); }
        .bb-sp-sub.warn { color:#c2410c; font-weight:700; }
        .bb-sp-th, .bb-sp-row { display:grid; grid-template-columns:28px minmax(0,1fr) 66px 56px 60px 66px 54px; gap:6px; align-items:center; padding:0 16px; }
        .bb-sp-th { flex:0 0 auto; font-size:calc(13px * var(--bb-ts, 1)); color:var(--mu); padding-top:5px; padding-bottom:5px; border-bottom:1px solid var(--bd); background:var(--sur2); }
        .bb-sp-th span:nth-child(n+3), .bb-sp-row > div:nth-child(n+3) { text-align:right; }
        .bb-sp-body { flex:1 1 auto; min-height:0; overflow-y:auto; }
        .bb-sp-row { padding-top:7px; padding-bottom:7px; border-bottom:1px solid var(--bd); }
        .bb-sp-rk { font-size:calc(15px * var(--bb-ts, 1)); font-weight:900; color:var(--mu); text-align:center; }
        .bb-sp-row.top .bb-sp-rk { color:#c2410c; }
        .bb-sp-nm { min-width:0; }
        .bb-sp-nm .n { font-size:calc(17px * var(--bb-ts, 1)); font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bb-sp-nm .bb-sp-bdg { display:inline-block; margin-left:6px; padding:0 6px; border-radius:999px; font-size:calc(12.5px * var(--bb-ts, 1)); font-weight:800; line-height:16px; vertical-align:2px; }
        .bb-sp-bdg.bd-d { background:#fde047; color:#713f12; }   /* 주간 = 노랑 */
        .bb-sp-bdg.bd-n { background:#60a5fa; color:#0b2a5b; }   /* 야간 = 파랑 */
        .bb-sp-bar { height:5px; margin-top:4px; border-radius:3px; background:rgba(0,0,0,.07); overflow:hidden; }
        .bb-sp-bar i { display:block; height:100%; background:#f97316; border-radius:3px; }
        .bb-sp-c { font-size:calc(19px * var(--bb-ts, 1)); font-weight:900; color:#c2410c; font-variant-numeric:tabular-nums; }
        .bb-sp-c small { margin-left:2px; font-size:calc(13px * var(--bb-ts, 1)); color:var(--mu); font-weight:700; }
        .bb-sp-d, .bb-sp-a { font-size:calc(15.5px * var(--bb-ts, 1)); font-variant-numeric:tabular-nums; }
        .bb-sp-a { color:var(--mu); }
        .bb-sp-th span[data-sort] { cursor:pointer; user-select:none; }
        .bb-sp-th span[data-sort]:hover { color:var(--tx); }
        .bb-sp-th span.cur { color:#c2410c; font-weight:800 !important; }
        .bb-sp-msg { padding:34px 16px; text-align:center; color:var(--mu); font-size:calc(15px * var(--bb-ts, 1)); }
        .bb-sp-ft { flex:0 0 auto; padding:6px 16px 9px; border-top:1px solid var(--bd); font-size:calc(12.5px * var(--bb-ts, 1)); line-height:1.55; color:var(--mu); }
        `;
        document.head.appendChild(spSt);

        const spPop = ivEl('div'); spPop.id = 'bb-iv-sp';
        document.body.appendChild(spPop);

        let _spSort = { k: 'avg', dir: -1 };   // 정렬 기준(누적/일평균/근무일/이름)과 방향(-1 내림차순)
        let _spOpen = false, _spSeq = 0, _spView = { dates: [], days: {}, sched: {}, state: null };

        const spShift = (ymd, n) => {
            const p = ymd.split('-').map(Number), t = new Date(Date.UTC(p[0], p[1] - 1, p[2] + n));
            return t.getUTCFullYear() + '-' + attPad(t.getUTCMonth() + 1) + '-' + attPad(t.getUTCDate());
        };
        // 근무일 판정 (바꾸고 싶으면 여기만): 근무시간(시각 숫자가 든 shift 또는 hours 배열)이 잡혀 있거나, 처리 건수가 있으면 근무한 날
        const spWorked = p => (Array.isArray(p.hours) && p.hours.length > 0) || (+p.solved || 0) > 0 || /\d/.test(String(p.shift || ''));
        const spCompact = d => {   // 하루 요약 → { 이름: [처리건수, 기록상 근무(1/0)] }
            const o = {};
            (d.people || []).forEach(p => { if (p && p.name) { const sv = +p.solved || 0, w = spWorked(p) ? 1 : 0; o[p.name] = [sv, w]; } });
            return o;
        };
        const spNorm = n => String(n || '').replace(/\s+/g, '');
        const spLoadSch = () => { try { const s = JSON.parse(localStorage.getItem(IV_SCH_KEY) || 'null'); if (s && s.months && typeof s.months === 'object') return s; } catch (e) { /* 없으면 새로 */ } return { months: {} }; };
        const spSaveSch = s => { try { localStorage.setItem(IV_SCH_KEY, JSON.stringify(s)); } catch (e) { /* 저장 못 해도 이번 화면에는 지장 없음 */ } };
        // 근무표 JSON → { 이름: { 'M/D': 1(근무)|0(비근무) } }
        function spParseSch(j) {
            const out = {}, win = {};
            (j && Array.isArray(j.staff) ? j.staff : []).forEach(st => {
                if (!st || !st.name || !st.schedule) return;
                const m = {};
                const wm = String(st.workTime || '').match(/(\d{1,2}):(\d{2})\s*~\s*(\d{1,2}):(\d{2})/);   // '15:00~24:00A' 처럼 뒤에 글자가 붙어도 시각만 읽음
                if (wm) { const a = (+wm[1]) * 60 + (+wm[2]); let b = (+wm[3]) * 60 + (+wm[4]); if (b <= a) b += 1440; if (b - a > 0 && b - a <= 960) win[spNorm(st.name)] = [a, b]; }   // 자정 넘기면 +24h, 16시간 넘는 값은 오타로 보고 무시
                Object.keys(st.schedule).forEach(k => { const v = st.schedule[k]; if (v && typeof v === 'object' && v.status !== 'empty') m[k] = v.present === true ? 1 : 0; });
                out[spNorm(st.name)] = m;
            });
            return { p: out, w: win };
        }
        // 필요한 달의 근무표를 확보 (저장분 우선). 반환: { 'YYYY-MM': {p:{이름:{M/D:0|1}}} | null(받지 못함) }
        async function spLoadSched(months, force) {
            const store = force ? { months: {} } : spLoadSch(), cur = ivOpDate().slice(0, 7), res = {};
            await Promise.all(months.map(async mo => {
                const c = store.months[mo];
                if (c && c.p && c.w && (mo < cur || Date.now() - c.at < (Object.keys(c.p).length ? IV_SCH_TTL : 30 * 60 * 1000))) { res[mo] = c; return; }   // c.w 가 없는 예전 저장분(근무시간 미포함)은 다시 받음 · 파일이 아직 없던 달은 30분마다 재시도
                try {
                    const r = await fetch(IV_SCH_BASE + mo + '.json', { cache: 'no-cache' });
                    if (r.status === 404) { store.months[mo] = { at: Date.now(), p: {}, w: {} }; res[mo] = store.months[mo]; return; }   // 그 달 근무표 없음
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    const ps = spParseSch(await r.json()), rec = { at: Date.now(), p: ps.p, w: ps.w };
                    store.months[mo] = rec; res[mo] = rec;
                } catch (e) {
                    console.warn('[BB] 근무표 불러오기 실패', mo, e && e.message);
                    res[mo] = c && c.p ? c : null;   // 실패해도 예전에 받은 게 있으면 그걸 사용
                }
            }));
            spSaveSch(store);
            return res;
        }
        // 이름 매칭: 공백 제거 후 같은 이름 → 없으면 한쪽이 다른 쪽을 포함하고 후보가 딱 하나일 때만
        function spFindKey(p, name) {
            const k = spNorm(name);
            if (p[k]) return k;
            if (k.length < 2) return null;
            const c = Object.keys(p).filter(x => x.includes(k) || k.includes(x));
            return c.length === 1 ? c[0] : null;
        }
        function spFindSch(p, name) { const k = spFindKey(p, name); return k == null ? null : p[k]; }

        // 점유율: 그날 '내 근무시간대에 같이 근무한 사람들이 처리한 건' 중 내가 처리한 비율.
        //  - 하루 요약에는 시간대별 건수가 없으므로, 각자 처리 건수를 본인 근무시간에 고르게 분포한다고 보고 내 근무시간과 겹치는 만큼만 더함
        //  - 근무시간(workTime)을 모르는 사람은 비교 대상에서 빠짐 · 근무시간을 모르는 본인은 그날 계산 제외
        function spShareDay(day, sc, w, md) {
            const pp = [];   // { key, sv, win }
            const seen = new Set();
            Object.keys(day).forEach(nm => {
                const key = spFindKey(sc, nm), sv = day[nm][0] || 0, v = key != null ? sc[key][md] : undefined;
                if (key != null) seen.add(key);
                const worked = v === 1 || (v === 0 ? sv > 0 : !!day[nm][1]);
                if (!worked) return;
                pp.push({ nm, sv, win: key != null ? w[key] : null });
            });
            Object.keys(sc).forEach(key => { if (!seen.has(key) && sc[key][md] === 1) pp.push({ nm: null, key, sv: 0, win: w[key] || null }); });
            const out = {};
            pp.forEach(a => {
                if (!a.nm || !a.win) return;
                let pool = 0, rateSum = 0, ovSum = 0;
                pp.forEach(b => {
                    if (!b.win) return;
                    const ov = Math.min(a.win[1], b.win[1]) - Math.max(a.win[0], b.win[0]);
                    if (ov <= 0) return;
                    const rb = b.sv / (b.win[1] - b.win[0]);   // 시간당(분당) 처리량
                    pool += b.sv * ov / (b.win[1] - b.win[0]);
                    rateSum += rb * ov; ovSum += ov;           // 겹친 시간만큼 가중한 동료 평균 처리량 (본인·건수 0인 동료 포함)
                });
                if (pool > 0) out[a.nm] = [Math.min(1, a.sv / pool), (a.sv / (a.win[1] - a.win[0])) / (rateSum / ovSum)];
            });
            return out;
        }

        const spLoadStore = () => { try { const s = JSON.parse(localStorage.getItem(IV_SP_KEY) || 'null'); if (s && s.days && typeof s.days === 'object') return s; } catch (e) { /* 없으면 새로 */ } return { days: {}, at: 0 }; };
        const spSaveStore = s => { try { localStorage.setItem(IV_SP_KEY, JSON.stringify(s)); } catch (e) { /* 저장 못 해도 이번 화면에는 지장 없음 */ } };

        function spAgg(dates, days, sched) {
            const m = {};
            dates.forEach(d => {
                const day = days[d]; if (!day) return;
                const mo = d.slice(0, 7), md = ivMD(d), sc = sched && sched[mo] && sched[mo].p;
                let shr = {}; try { shr = sc ? spShareDay(day, sc, (sched[mo].w || {}), md) : {}; } catch (e) { shr = {}; }   // 계산이 실패해도 나머지 통계는 그대로
                Object.keys(day).forEach(nm => {
                    const a = m[nm] || (m[nm] = { name: nm, solved: 0, days: 0, est: 0, sh: 0, shn: 0, rl: 0, win: null });
                    const [sv, w] = day[nm];
                    a.solved += sv;
                    if (shr[nm] != null) { a.sh += shr[nm][0]; a.shn++; if (isFinite(shr[nm][1])) { a.rl += shr[nm][1]; a.rln = (a.rln || 0) + 1; } }
                    { const wk = sc && sched[mo].w ? spFindKey(sc, nm) : null; if (wk != null && sched[mo].w[wk]) a.win = sched[mo].w[wk]; }   // 가장 최근 날짜의 근무시간 (주간/야간 뱃지용)
                    const mine = sc && spFindSch(sc, nm), v = mine ? mine[md] : undefined;
                    if (v === 1) a.days += 1;                       // 근무표상 근무
                    else if (v === 0) { if (sv > 0) a.days += 1; }  // 근무표상 비근무(휴무·연차)인데 처리 건수가 있으면 근무로 봄
                    else if (w) { a.days += 1; a.est += 1; }        // 근무표에 없음 → 기록 기반 (추정)
                });
            });
            // 근무표상 근무일이지만 그 날 요약에 이름이 없는(건수 0·기록 없음) 사람의 근무일도 채움
            Object.keys(m).forEach(nm => {
                const a = m[nm];
                dates.forEach(d => {
                    const day = days[d]; if (!day || day[nm]) return;
                    const mo = d.slice(0, 7), sc = sched && sched[mo] && sched[mo].p, mine = sc && spFindSch(sc, nm);
                    if (mine && mine[ivMD(d)] === 1) a.days += 1;
                });
            });
            return Object.values(m).sort((a, b) => b.solved - a.solved || b.days - a.days || String(a.name).localeCompare(String(b.name), 'ko'));
        }

        function spRender() {
            if (!_spOpen) return;
            const { dates, days, sched, state } = _spView;
            const have = dates.filter(d => days[d]);
            const rows = spAgg(have, days, sched);
            const avgOf = x => x.days > 0 ? x.solved / x.days : -1;
            const shOf = x => x.shn > 0 ? x.sh / x.shn : -1;
            const rlOf = x => x.rln > 0 ? x.rl / x.rln : -1;
            const val = { solved: x => x.solved, avg: avgOf, share: shOf, rel: rlOf, days: x => x.days }[_spSort.k];
            const shPct = x => x.shn > 0 ? Math.round(x.sh / x.shn * 100) : -1;          // 화면에 보이는 값(정수 %) 기준으로 동률 판정
            const rlTen = x => x.rln > 0 ? Math.round(x.rl / x.rln * 10) : -1;           // 동료 대비도 보이는 값(소수 1자리) 기준
            rows.sort((a, b) => _spSort.k === 'name'
                ? _spSort.dir * String(a.name).localeCompare(String(b.name), 'ko')
                : _spSort.k === 'share'
                    ? (shPct(a) - shPct(b)) * _spSort.dir || rlTen(b) - rlTen(a) || a.days - b.days || b.solved - a.solved || String(a.name).localeCompare(String(b.name), 'ko')   // 점유율 같으면 동료 대비 높은 쪽, 그것도 같으면 근무일 적은 쪽이 위
                    : (val(a) - val(b)) * _spSort.dir || b.solved - a.solved || String(a.name).localeCompare(String(b.name), 'ko'));
            const head = ivEl('div', 'bb-sp-h');
            const t = ivEl('div', 'bb-sp-t');
            t.appendChild(ivEl('b', '', '개입 통계 (누적)'));
            const rf = ivEl('span', 'rf', '새로 집계'); rf.dataset.act = 'refresh'; rf.title = '저장해 둔 날짜별 기록을 버리고 전부 다시 받아 집계합니다';
            const x = ivEl('span', 'x', '✕'); x.dataset.act = 'close';
            t.append(rf, x);   // '새로 집계'는 제목(누적) 바로 오른쪽, ✕ 는 맨 오른쪽
            head.appendChild(t);
            let sub = have.length ? ivMD(have[0]) + ' ~ ' + ivMD(have[have.length - 1]) + ' · ' + have.length + '일치 · 총 ' + rows.reduce((s, r) => s + r.solved, 0) + '건' : '';
            let warn = false;
            if (state && state.phase === 'loading') { sub += (sub ? ' · ' : '') + '집계 중… ' + state.done + '/' + state.total; }
            else if (state && state.phase === 'fail') { sub = '날짜 목록을 불러오지 못했습니다.'; warn = true; }
            else if (state && state.failed) { sub += ' · ⚠ ' + state.failed + '일 불러오지 못함 (열 때 다시 시도)'; warn = true; }
            if (state && state.phase !== 'loading' && state.phase !== 'fail' && sched) {
                const bad = Object.keys(sched).filter(k => !sched[k] || !Object.keys(sched[k].p || {}).length);
                if (bad.length) { sub += ' · ⚠ 근무표 ' + bad.join(', ') + ' 없음/실패 → 기록 기반(*)'; warn = true; }
            }
            head.appendChild(ivEl('div', 'bb-sp-sub' + (warn ? ' warn' : ''), sub || ' '));

            const th = ivEl('div', 'bb-sp-th');
            [['#', ''], ['이름', 'name'], ['누적', 'solved'], ['일평균', 'avg'], ['점유율', 'share'], ['동료 대비', 'rel'], ['근무일', 'days']].forEach(([lb, k]) => {
                const sp = ivEl('span', k && _spSort.k === k ? 'cur' : '', lb + (k && _spSort.k === k ? (_spSort.dir < 0 ? ' ▼' : ' ▲') : ''));
                if (k) { sp.dataset.sort = k; sp.title = '눌러서 정렬 (다시 누르면 오름/내림차순 전환)'; }
                th.appendChild(sp);
            });
            const body = ivEl('div', 'bb-sp-body');
            if (!rows.length) {
                body.appendChild(ivEl('div', 'bb-sp-msg', state && state.phase === 'loading' ? '불러오는 중…' : state && state.phase === 'fail' ? '다시 열어 주세요.' : '집계할 기록이 없습니다.'));
            } else {
                const max = Math.max(1, rows[0].solved);
                rows.forEach((r, i) => {
                    const row = ivEl('div', 'bb-sp-row' + ((_spSort.k === 'solved' || _spSort.k === 'avg') && _spSort.dir < 0 && i < 3 && r.solved > 0 ? ' top' : ''));
                    row.appendChild(ivEl('div', 'bb-sp-rk', String(i + 1)));
                    const nm = ivEl('div', 'bb-sp-nm'), nmN = ivEl('div', 'n', r.name);
                    if (r.win) { const night = r.win[0] >= 14 * 60; const bd = ivEl('span', 'bb-sp-bdg ' + (night ? 'bd-n' : 'bd-d'), night ? '야간' : '주간'); bd.title = '근무 ' + attPad(Math.floor(r.win[0] / 60)) + ':' + attPad(r.win[0] % 60) + ' 시작 (14:00 이후 시작 = 야간)'; nmN.appendChild(bd); }   // 근무표 시간이 없는 사람은 뱃지 없음
                    nm.appendChild(nmN);
                    const bar = ivEl('div', 'bb-sp-bar'), fill = ivEl('i'); fill.style.width = Math.round(r.solved / max * 100) + '%'; bar.appendChild(fill); nm.appendChild(bar);
                    row.appendChild(nm);
                    const c = ivEl('div', 'bb-sp-c', String(r.solved)); c.appendChild(ivEl('small', '', '건')); row.appendChild(c);
                    row.appendChild(ivEl('div', 'bb-sp-a', r.days > 0 ? (r.solved / r.days).toFixed(1) : '-'));
                    const shc = ivEl('div', 'bb-sp-a', r.shn > 0 ? Math.round(r.sh / r.shn * 100) + '%' : '-');
                    shc.title = r.shn > 0 ? '근무시간대에 같이 근무한 사람들이 처리한 건 중 본인 비율의 평균 (' + r.shn + '일 기준)' : '근무시간 정보가 없어 계산하지 못함';
                    row.appendChild(shc);
                    const rlc = ivEl('div', 'bb-sp-a', r.rln > 0 ? (r.rl / r.rln).toFixed(1) + '배' : '-');
                    rlc.title = r.rln > 0 ? '같은 시간대에 근무한 동료의 평균 시간당 처리량 대비 본인 처리량 (1.0배 = 동료 평균, ' + r.rln + '일 기준)' : '근무시간 정보가 없어 계산하지 못함';
                    row.appendChild(rlc);
                    row.appendChild(ivEl('div', 'bb-sp-d', r.days + '일' + (r.est ? '*' : '')));
                    body.appendChild(row);
                });
            }
            const ft = ivEl('div', 'bb-sp-ft', '건수 = 이름이 확정된 처리 건만 (추정·이탈·특정 불가 제외, 개입카드 화면과 같은 기준) · 근무일 = 월별 근무표에서 출근으로 표시된 날(연차 제외·반차 1일) · * = 근무표에 없는 날이 있어 처리·근무시간 기록으로 대체 · 일평균 = 누적 ÷ 근무일 · 점유율 = (내 근무시간과 겹치는 시간 동안 같이 근무한 사람들의 처리 건 중 내가 처리한 비율)의 일별 평균 — 건수는 각자 근무시간에 고르게 분포한다고 보고 추정 · 동료 대비 = 내 시간당 처리량 ÷ 겹친 시간 동료들의 평균 시간당 처리량(1.0배 = 동료 평균, 인원·발생량 차이 보정) · 뱃지: 근무 시작 14:00 이후 = 야간, 그 전 = 주간 · 근무시간 미등록자는 비교·뱃지에서 제외');
            const keep = spPop.querySelector('.bb-sp-body'), keepTop = keep ? keep.scrollTop : 0;
            spPop.replaceChildren(head, th, body, ft);
            body.scrollTop = keepTop;
        }

        function spPlace() {
            const br = page.getBoundingClientRect(), w = spPop.offsetWidth;   // 개입 그리드 자신의 왼쪽 (공간이 없으면 오른쪽)
            let left = br.right + 10;   // [admin] 그리드가 왼쪽 절반에 있으므로 팝업은 오른쪽 우선
            if (left + w > window.innerWidth - 8) left = br.left - w - 10;
            spPop.style.left = Math.max(8, left) + 'px';
            spPop.style.top = Math.max(8, br.top) + 'px';
            spPop.style.height = Math.min(br.height, window.innerHeight - 16) + 'px';
        }
        function spClose() {
            _spOpen = false; _spSeq++;   // 진행 중이던 집계는 결과를 버림
            spPop.classList.remove('open');
            const b = $iv('bb-iv-stats-btn'); if (b) b.classList.remove('on');
        }
        const IV_SP_FRESH_MS = 5 * 60 * 1000;   // 마지막 전체 집계가 이 시간 이내면 네트워크 생략
        async function spLoad(force) {
            const seq = ++_spSeq;
            const store = force ? { days: {}, at: 0 } : spLoadStore();
            _spView = { dates: Object.keys(store.days).sort(), days: store.days, sched: spLoadSch().months, state: { phase: 'loading', done: 0, total: 0, failed: 0 } };   // 저장분을 먼저 보여주고 그 위에 갱신
            spRender();
            if (!force && store.at && Date.now() - store.at < IV_SP_FRESH_MS) {   // 방금 집계한 저장분 → 바로 완료 표시
                _spView.state = { phase: 'done', done: 0, total: 0, failed: 0 };
                spRender();
                return;
            }
            let dates, srvRevs = null;
            try {
                const dd = await attFetchJson(IV_API + '?view=dates');
                if (!dd || dd.ok !== true || !Array.isArray(dd.dates)) throw new Error('데이터 형식 오류');
                srvRevs = (dd.revs && typeof dd.revs === 'object') ? dd.revs : null;   // 서버가 날짜별 원본 지문(rev)을 주면 바뀐 날만 다시 받음
                dates = dd.dates.filter(x => /^\d{4}-\d{2}-\d{2}$/.test(x)).sort();
            } catch (e) {
                console.warn('[BB] 개입 통계 날짜 목록 실패:', e && e.message);
                if (seq === _spSeq) { _spView.state = { phase: 'fail' }; spRender(); }
                return;
            }
            if (seq !== _spSeq) return;
            Object.keys(store.days).forEach(d => { if (!dates.includes(d)) delete store.days[d]; });   // 서버에서 사라진 날짜는 버림
            if (store.revs) Object.keys(store.revs).forEach(d => { if (!dates.includes(d)) delete store.revs[d]; });
            const today = ivOpDate();
            const cut = spShift(today, -(IV_SP_REFETCH_DAYS - 1));
            // rev 가 있으면: 없는 날 + 오늘 + rev 달라진 날만. rev 가 없으면(폴백): 최근 N일 재수신
            const todo = dates.filter(d => !store.days[d] || d === today || (srvRevs ? (store.revs || {})[d] !== srvRevs[d] : d >= cut));
            console.log('[BB] 개입 통계: 받을 날짜', todo.length, '/', dates.length, '· revs', srvRevs ? '있음' : '없음(폴백)', todo.slice(0, 5));
            const st = { phase: 'loading', done: 0, total: todo.length, failed: 0 };
            _spView = { dates, days: store.days, sched: _spView.sched, state: st };
            spRender();
            const months = [...new Set(dates.map(d => d.slice(0, 7)))];
            const schP = spLoadSched(months, force);   // 근무표는 요약 받기와 동시에
            let idx = 0, sinceSave = 0;
            const worker = async () => {
                while (idx < todo.length) {
                    if (seq !== _spSeq) return;
                    const d = todo[idx++];
                    try {
                        const j = await attFetchJson(IV_API + '?view=summary&date=' + d);
                        if (j && j._404) { delete store.days[d]; if (store.revs) delete store.revs[d]; }
                        else if (!j || j.ok !== true || !Array.isArray(j.people)) throw new Error('데이터 형식 오류');
                        else { store.days[d] = spCompact(j); if (srvRevs && srvRevs[d]) (store.revs || (store.revs = {}))[d] = srvRevs[d]; }
                    } catch (e) { st.failed++; }
                    st.done++;
                    if (++sinceSave >= 10) { sinceSave = 0; spSaveStore(store); }   // 중간 저장 — 닫아도 받은 만큼은 남음
                    if (seq === _spSeq && (st.done % 3 === 0 || st.done === st.total)) spRender();
                }
            };
            await Promise.all(Array.from({ length: Math.min(IV_SP_CONC, todo.length) }, worker));
            if (seq !== _spSeq) { spSaveStore(store); return; }   // 중단돼도 받은 분 저장 (at 은 갱신하지 않음)
            const sched = await schP;
            if (seq !== _spSeq) { spSaveStore(store); return; }
            _spView.sched = sched;
            store.at = Date.now();
            spSaveStore(store);
            st.phase = 'done';
            spRender();
        }
        function spOpen() {
            if (_spOpen) { spClose(); return; }
            ivClosePop(); ivCloseCal(); ivCloseHelp();
            _spOpen = true;
            $iv('bb-iv-stats-btn').classList.add('on');
            spPop.classList.add('open');
            spPlace();
            spLoad(false);
            spPlace();
        }
        window.__bbIvSpClose = spClose;   // 보드를 닫을 때 같이 닫음 (closeBoard 에서 호출)
        $iv('bb-iv-stats-btn').addEventListener('click', ivSafe(() => spOpen()));
        spPop.addEventListener('click', ivSafe(e => {
            const so = e.target.closest('[data-sort]');
            if (so) { const k = so.dataset.sort; _spSort = _spSort.k === k ? { k, dir: -_spSort.dir } : { k, dir: k === 'name' ? 1 : -1 }; spRender(); return; }
            const a = e.target.closest('[data-act]'); if (!a) return;
            if (a.dataset.act === 'close') spClose();
            else if (a.dataset.act === 'refresh') spLoad(true);
        }));
        document.addEventListener('click', ivSafe(e => {   // 바깥 클릭 → 닫기
            if (_spOpen && !e.target.closest('#bb-iv-sp') && !e.target.closest('#bb-iv-stats-btn')) spClose();
        }), true);
        document.addEventListener('keydown', ivSafe(e => { if (e.key === 'Escape' && _spOpen) spClose(); }));
        window.addEventListener('resize', ivSafe(() => { if (_spOpen) spPlace(); }));

        const ivVisible = () => isOpen && _ivOpen && !document.hidden;
        setInterval(ivSafe(() => {
            if (!isOpen && (_ivPopKey || _ivCalOpen)) { ivClosePop(); ivCloseCal(); }   // 보드를 닫으면 팝업/달력도 닫음
            if (ivVisible() && !_ivDate) ivRefresh(false);
        }), IV_REFRESH_MS);
        document.addEventListener('visibilitychange', ivSafe(() => { if (ivVisible() && !_ivDate) ivRefresh(false); }));
        window.addEventListener('resize', ivSafe(() => { if (_ivPopKey) ivPlacePop(); }));
        // 다중 모니터링에 '미갱신' 이상이 있으면 « 다중 버튼과 똑같이 '다중 »' 버튼도 점멸 (syncAttBackAlert 에서 호출)
        _ivAlertHook = ivSafe(() => {
            const b = $iv('bb-iv-back');
            if (!b) return;
            const a = _patrolAnomaly;
            b.classList.toggle('alert', a.n > 0);
            b.title = a.n > 0 ? `다중 모니터링 ${a.n}대 POI 미갱신 (최대 ${a.max}분째) — 클릭하면 다중 화면으로` : '다중 모니터링으로 돌아가기';
        });
        _ivAlertHook();
        ivSetOpen(true);   // [UI 개편] 개입 현황 항상 표시
        console.log('[BB] 개입카드 현황 켜짐 (SECTION 18)');
    }
    } catch (e) { console.warn('[BB] 개입카드 초기화 실패 — 기존 기능에는 영향 없음:', e && e.message); }

    // ============================================================
    // SECTION 19. 배달 로그 — 옛 '임무 OFF' 자리(오른쪽 고정 버튼)에서 여는 패널
    //  - 데이터: multimonitoring.vercel.app/api/delivery-poll?view=... (크론 폴링과 같은 엔드포인트를 조회 전용으로 겸용 — api/ 폴더를 늘리지 않으려고 합침)
    //            GitHub 레포 delivery/YYYY-MM/YYYY-MM-DD.json 에 확정 저장된 값을 서버가 읽어서 돌려줌. 오늘 근무일은 아직 확정 전이면 Gist 의 진행 중 상태를 대신 보여줌)
    //  - 달력 모양·동작은 개입카드(SECTION 18) 의 ivOpenCal/ivRenderCal 로직을 그대로 옮겨왔다 (같은 CSS 클래스 bb-att-cal*, bb-iv-cal-h, bb-iv-msg 재사용)
    //  - 안전장치: 전체가 try/catch — 여기서 오류가 나도 기존 기능(배터리 카드 등)에는 영향 없음
    // ============================================================
    try {
    if (document.getElementById('bb-fb-dlog') && document.getElementById('bb-dlog-panel') && typeof attFetchJson === 'function') {
        const DL_API = ATT_API + '/delivery-poll';   // 크론 폴링과 같은 엔드포인트 — ?view=... 가 있으면 조회 전용으로 동작(인증 불필요), api/ 폴더 개수를 늘리지 않기 위함
        // 읽는 시점: 1분마다(08:00~23:00) — 서버 크론이 2분마다(08:00~22:58) 갱신하고, 응답은 60초(DELIVERY_VIEW_CACHE_SEC) 엣지 캐시됨
        const $dl = id => document.getElementById(id);
        const dlEl = (tag, cls, text) => { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined && text !== null) el.textContent = text; return el; };
        const dlOpDate = () => attYmd(attKst(Date.now() - 7 * 3600 * 1000));   // 근무일 = 07:00 기준 (개입카드와 동일한 방식)
        const dlHMS = ms => { const d = new Date(ms), p = n => String(n).padStart(2, '0'); return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()); };   // 'HH:MM:SS'

        let _dlOpen = false, _dlDate = null, _dlData = null, _dlFail = false, _dlSeq = 0;
        let _dlDates = null, _dlDatesAt = 0, _dlCalOpen = false, _dlCalYm = null;
        const dlDateNow = () => _dlDate || dlOpDate();

        // ── 마감 처리 (08:00 ~ 23:00 만 조회) ──
        //  · 운영 시간(dlInSchedule) 밖에서는 '오늘' 데이터를 다시 조회하지 않는다 (타이머뿐 아니라 탭 복귀·패널 열기·초기 로드 등 모든 경로에 적용).
        //  · 단, 23:00 이후(또는 08:00 이전)에 읽은 값은 서버 크론(22:58 종료)이 멈춘 뒤의 '마감 확정본'이므로 _final 로 표시하고 그 값을 그대로 보여준다.
        //    마감 후 처음 열었는데 받아 둔 데이터가 없으면 확정본을 딱 1회만 받아온다. 08:00 이 되면 타이머가 자동으로 조회를 재개한다.
        //  · 과거 날짜(달력으로 고른 날)는 마감과 무관하게 조회 가능.
        const DL_OPEN_MIN = 8 * 60, DL_CLOSE_MIN = 23 * 60;
        const dlNowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
        const dlInSchedule = () => { const m = dlNowMin(); return m >= DL_OPEN_MIN && m <= DL_CLOSE_MIN; };   // 08:00 ~ 23:00 (23:00 의 마지막 읽기까지 포함)
        const dlPastClose = () => { const m = dlNowMin(); return m >= DL_CLOSE_MIN || m < DL_OPEN_MIN; };       // 23:00 이후 ~ 다음날 08:00 전 = 서버 폴링 종료 후
        let _dlRefMs = Date.now();      // 진행 중 카드 경과 시간 계산 기준 시각 (dlRender 가 설정)
        let _dlBadgeFinalDate = null;   // 배지용 조회로 마감 확정본을 이미 받은 근무일
        function dlHasFinal(date) { return !!(_dlData && _dlData.date === date && _dlData._final); }
        function dlMayFetchToday() {    // 오늘(근무일) 데이터를 지금 조회해도 되는가
            if (dlInSchedule()) return true;
            const today = dlOpDate();
            return !dlHasFinal(today) && _dlBadgeFinalDate !== today;
        }

        function dlClosePanel() {
            _dlOpen = false; _dlCalOpen = false;
            $dl('bb-dlog-panel').classList.remove('open');
            $dl('bb-dlog-cal').classList.remove('open');
        }
        function dlOpenPanel() {
            if (_dlOpen) { dlClosePanel(); return; }
            _dlOpen = true;
            $dl('bb-dlog-panel').classList.add('open');
            dlRender();
            if (!_dlData || _dlData.date !== dlDateNow() || Date.now() - (_dlData._at || 0) > 30000) dlRefresh();
        }
        async function dlRefresh() {
            const seq = ++_dlSeq, date = dlDateNow();
            if (date === dlOpDate() && !dlInSchedule() && dlHasFinal(date)) { dlRender(); return; }   // 마감 후: 이미 받아 둔 마감 확정본이 있으면 재조회하지 않고 화면만 갱신
            if (!_dlData || _dlData.date !== date) { _dlData = null; dlRender(); }
            const closedAtStart = date === dlOpDate() && dlPastClose();   // 조회 시작 시점이 마감 후면 이 응답이 확정본
            try {
                const d = await attFetchJson(DL_API + '?view=day&date=' + date);
                if (seq !== _dlSeq) return;
                if (!d || d.ok !== true) throw new Error('데이터 형식 오류');
                d.date = date; d._at = Date.now(); d._final = closedAtStart;
                _dlData = d; _dlFail = false;
                if (date === dlOpDate()) fbSetBadge('bb-fb-dlog', (d.summary && d.summary.completed) || 0, 'pk');   // 오늘 데이터면 버튼 배지도 같은 응답으로 갱신 (조회를 따로 한 번 더 하지 않음)
            } catch (e) {
                console.warn('[BB] 배달 로그 갱신 실패:', e.message);
                if (seq === _dlSeq) _dlFail = true;
            }
            if (_dlOpen && seq === _dlSeq) dlRender();
        }
        function dlSetDate(d) {
            dlCloseCal();
            if (d === dlOpDate()) d = null;
            if (_dlDate === d) return;
            _dlDate = d; _dlData = null;
            dlRender(); dlRefresh();
        }

        // 배달 건 하나의 표시용 제목 ("사이트 · 배정 기체명" — 가게명은 사이트명과 사실상 중복이라 기체 호기명으로 대체. 기체명이 없으면 가게명, 그것도 없으면 사이트명만)
        // 배달 건 제목 = '사이트 - 기체명'. 사이트 = 슬랙 알림의 첫 대괄호, 기체명 = '뉴비 경로' 바로 왼쪽 칸 (서버 delivery-core 가 뽑아 site / robot 으로 내려줌).
        //  기체명이 이미 사이트 이름으로 시작하면('역삼동 (요기요) 3호기') 앞부분을 떼어 '역삼동 (요기요) - 3호기' 로 — 사이트가 두 번 나오지 않게.
        //  한쪽이 없으면 있는 것만(옛 서버 응답 포함), 둘 다 없으면 가게명 → '(기체 정보 없음)'.
        const dlSiteLabel = r => {
            const site = String(r.site || '').trim(), robot = String(r.robot || '').trim();
            if (site && robot) {
                const rest = robot.startsWith(site) ? robot.slice(site.length).replace(/^[\s\-·]+/, '') : robot;
                return site + ' - ' + (rest || robot);
            }
            return robot || site || String(r.store || '').trim() || '(기체 정보 없음)';
        };
        // 수행자 표시 — 이름이 하나면 그 이름만, 인계·대리 등으로 여럿 걸치면 "길동 → 꺽정" 식으로 이어붙임
        //  (예전엔 대리 수행 시 이름 뒤에 "(대리)"라는 직함 같은 꼬리표를 붙였는데, 어색해서 제거하고
        //   proxyBy 에 이름이 실려 오면 그 이름도 그냥 화살표 체인에 끼워 넣는 방식으로 통일)
        const dlWhoLabel = r => {
            const chain = [];
            if (typeof r.proxyBy === 'string' && r.proxyBy.trim()) chain.push(r.proxyBy.trim());
            if (Array.isArray(r.handoverFrom)) chain.push(...r.handoverFrom);
            if (r.performer) chain.push(r.performer);
            return chain.length ? chain.join(' → ') : '미확인';
        };
        // 주문번호 표시 (끝에 📋 복사 버튼 → 클릭하면 ✔️ 로 바뀌며 복사) — 완료/진행 중 카드 공용
        function dlOrdEl(r) {
            if (!r.orderNo) return dlEl('span', '', '주문번호 없음');
            const ordWrap = dlEl('span', 'bb-dlog-ord');
            ordWrap.appendChild(dlEl('span', '', '주문번호 ' + r.orderNo));
            const copyBtn = dlEl('button', 'bb-dlog-copy');
            copyBtn.type = 'button'; copyBtn.title = '주문번호 복사';
            const copyIco = dlEl('span', 'bb-dlog-copy-ico', '📋');
            copyBtn.append(copyIco);
            copyBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                try { await navigator.clipboard.writeText(r.orderNo); copyIco.textContent = '✔️'; }
                catch (err) { copyIco.textContent = '⚠️'; }
                setTimeout(() => { copyIco.textContent = '📋'; }, 1200);
            });
            ordWrap.appendChild(copyBtn);
            return ordWrap;
        }
        // 카드 한 줄. run=false: 완료 건 / run=true: 진행 중 건 (status 'RUNNING' = 배달 중, 그 외 = 기체 배정 전 '배정 대기')
        //  진행 중 카드는 오른쪽 시간 칸이 '배달 소요시간' 대신 '경과 시간'(배정 시각부터) / '대기 시간'(주문 접수부터) — 조회 시점 기준이라 다음 조회 때 갱신됨
        function dlMakeRow(r, run) {
            const waiting = run && r.status !== 'RUNNING';
            const row = dlEl('div', 'bb-fbp-row' + (run ? ' bb-dlog-run' + (waiting ? ' wait' : '') : ''));
            const dot = dlEl('span', 'bb-fbp-dot'); dot.style.background = waiting ? 'var(--mu)' : 'var(--pk)';
            const main = dlEl('span', 'bb-fbp-main');
            const nameEl = dlEl('span', 'bb-fbp-name', dlSiteLabel(r)); nameEl.title = nameEl.textContent;
            main.appendChild(nameEl);
            const meta = dlEl('span', 'bb-fbp-sub bb-dlog-meta');
            if (run) meta.appendChild(dlEl('span', 'bb-dlog-tag', waiting ? '배정 대기' : '배달 중'));
            meta.appendChild(dlEl('span', '', waiting ? '주문 접수 ' + (r.receivedAt || '-') : '기체 배정 ' + (r.assignedAt || '-')));
            main.appendChild(meta);
            const ordLine = dlEl('span', 'bb-fbp-sub bb-dlog-meta');   // 셋째 줄: 주문번호 + 복사 버튼
            ordLine.appendChild(dlOrdEl(r));
            main.appendChild(ordLine);
            const right = dlEl('span', 'bb-fbp-right');
            right.appendChild(dlEl('span', 'bb-fbp-who', dlWhoLabel(r)));
            const time = dlEl('span', 'bb-fbp-time');
            if (run) {
                const since = parseFloat(waiting ? r.threadTs : (r.assignedTs || r.threadTs));   // 옛 서버 응답(필드 없음)이면 '-'
                time.appendChild(dlEl('span', 'l', waiting ? '대기 시간' : '경과 시간'));
                time.appendChild(dlEl('span', 'v', since > 0 ? attDurHM(Math.max(0, Math.round(_dlRefMs / 1000 - since))) : '-'));
            } else {
                time.appendChild(dlEl('span', 'l', '배달 소요시간'));
                time.appendChild(dlEl('span', 'v', r.durationSec != null ? attDurHM(r.durationSec) : '-'));
            }
            right.appendChild(time);
            row.append(dot, main, right);
            return row;
        }
        function dlRender() {
            const lbl = $dl('bb-dlog-date-lbl'), kpi = $dl('bb-dlog-kpi'), body = $dl('bb-dlog-body');
            const isToday = !_dlDate;
            lbl.textContent = isToday ? '오늘 (' + dlDateNow() + ')' : dlDateNow();
            const dlTitle = $dl('bb-dlog-title'), dlDp = dlDateNow().split('-');
            dlTitle.textContent = '🚚 배달 로그 (' + Number(dlDp[1]) + '/' + Number(dlDp[2]) + ')';
            $dl('bb-dlog-today').classList.toggle('on', isToday);
            $dl('bb-dlog-cal-btn').classList.toggle('on', !isToday);
            if (!_dlData) {
                kpi.replaceChildren();
                body.innerHTML = '<div class="bb-att-msg' + (_dlFail ? ' warn' : '') + '">' + (_dlFail ? '불러오지 못했습니다.' : '불러오는 중…') + '</div>';
                return;
            }
            const s = _dlData.summary || { completed: 0, byPerformer: {} };
            const deliveries = Array.isArray(_dlData.deliveries) ? _dlData.deliveries : [];
            const pending = (_dlData.inProgress ? _dlData.inProgress.length : 0) + (_dlData.incomplete ? _dlData.incomplete.length : 0);
            const kCell = (l, v) => { const e = dlEl('div'); e.appendChild(dlEl('div', 'l', l)); e.appendChild(dlEl('div', 'v', v)); return e; };
            const perf = s.byPerformer || {};
            const topName = Object.keys(perf).sort((a, b) => (perf[b].count || 0) - (perf[a].count || 0))[0];
            const topTxt = topName ? (topName + ' (' + perf[topName].count + '건)') : '-';
            const cells = [kCell('완료 건수', String(s.completed || 0) + '건')];
            if (isToday && pending > 0) cells.push(kCell('확인 중', pending + '건'));   // 폴링(서버 2분 + 보드 1분) 특성상, 다음 조회 전까지는 실제로 끝났어도 여기 잡혀 있을 수 있음
            cells.push(kCell('최다 배달자', topTxt));
            kpi.replaceChildren(...cells);
            const closedNow = isToday && !dlInSchedule();   // 마감 후(23:00~08:00): 더 이상 조회하지 않고 마지막 값을 그대로 보여줌
            _dlRefMs = (closedNow && _dlData._at) ? _dlData._at : Date.now();   // 마감 후에는 진행 중 카드의 경과/대기 시간이 계속 늘어나지 않도록 마지막 조회 시각에 고정
            dlTitle.append(' - ' + (isToday ? '오늘 ' : '과거 '));
            { const c = dlEl('span', '', String(s.completed || 0) + '건'); c.style.color = '#c2410c'; c.style.fontWeight = '700'; dlTitle.appendChild(c); }
            const dlNoteTxt = !isToday
                ? '확정된 기록'
                : closedNow
                    ? '마감 · 08:00 재개 · ' + (_dlData._at ? dlHMS(_dlData._at) : '--:--:--') + ' 기준'
                    : '08:00~23:00 · ' + (_dlData._at ? dlHMS(_dlData._at) : '--:--:--') + ' 업데이트';
            $dl('bb-dlog-note').textContent = dlNoteTxt; $dl('bb-dlog-note').title = dlNoteTxt;   // 업데이트 시각 = 이 화면이 서버에서 마지막으로 '성공적으로' 받아온 시각 (조회가 실패하면 마지막 성공 시각 그대로 남음)
            // 진행 중(아직 완료 신호가 없는 건)은 오늘 화면에서만 맨 위에 카드로: 배달 중(최신 배정 순) → 배정 대기(최신 접수 순)
            const running = (isToday && Array.isArray(_dlData.inProgress)) ? _dlData.inProgress.slice() : [];
            const sinceOf = r => parseFloat(r.assignedTs || r.threadTs) || 0;
            running.sort((x, y) => ((x.status === 'RUNNING' ? 0 : 1) - (y.status === 'RUNNING' ? 0 : 1)) || (sinceOf(y) - sinceOf(x)));
            if (!deliveries.length && !running.length) { body.innerHTML = '<div class="bb-att-msg">이 날짜의 배달 완료 기록이 없습니다.' + (isToday && pending ? ' (확인 중 ' + pending + '건)' : '') + '</div>'; return; }
            // 완료 건은 07시부터 시간순으로 쌓인 걸 최신이 맨 위로 오게 뒤집어서 보여줌 (아래 줄에 배정 시각·주문번호, 오른쪽엔 수행자 · 소요시간)
            const nodes = [];
            if (running.length) nodes.push(dlEl('div', 'bb-dlog-grp', '진행 중 ' + running.length + '건'), ...running.map(r => dlMakeRow(r, true)));
            if (deliveries.length) {
                if (running.length) nodes.push(dlEl('div', 'bb-dlog-grp', '완료 ' + deliveries.length + '건'));   // 진행 중 카드가 있을 때만 구분 제목
                nodes.push(...deliveries.slice().reverse().map(r => dlMakeRow(r, false)));
            }
            body.replaceChildren(...nodes);
        }

        /* ───────── 달력 (개입카드와 같은 모양 · 로그(JSON)가 있는 날만 선택 가능) ───────── */
        function dlCloseCal() { _dlCalOpen = false; $dl('bb-dlog-cal').classList.remove('open'); }
        async function dlOpenCal() {
            if (_dlCalOpen) { dlCloseCal(); return; }
            _dlCalOpen = true;
            const p = dlDateNow().split('-').map(Number);
            _dlCalYm = { y: p[0], m: p[1] };
            $dl('bb-dlog-cal').classList.add('open');
            dlRenderCal('loading');
            if (!_dlDates || Date.now() - _dlDatesAt > 60000) {
                try {
                    const d = await attFetchJson(DL_API + '?view=dates');
                    if (!d || d.ok !== true || !Array.isArray(d.dates)) throw new Error('데이터 형식 오류');
                    _dlDates = new Set(d.dates); _dlDatesAt = Date.now();
                } catch (e) { console.warn('[BB] 배달 로그 날짜 목록 실패:', e.message); if (_dlCalOpen) dlRenderCal('fail'); return; }
            }
            if (_dlCalOpen) dlRenderCal();
        }
        function dlRenderCal(state) {
            const cal = $dl('bb-dlog-cal');
            if (state) { cal.replaceChildren(dlEl('div', 'bb-iv-msg' + (state === 'fail' ? ' warn' : ''), state === 'fail' ? '날짜 목록을 불러오지 못했습니다.' : '불러오는 중…')); return; }
            const y = _dlCalYm.y, m = _dlCalYm.m;
            const all = [..._dlDates].sort();
            const minYm = all.length ? all[0].slice(0, 7) : null, maxYm = all.length ? all[all.length - 1].slice(0, 7) : null;
            const ym = y + '-' + attPad(m);
            const head = dlEl('div', 'bb-iv-cal-h');
            const prev = dlEl('button', 'bb-mm-nav', '‹'), next = dlEl('button', 'bb-mm-nav', '›');
            prev.dataset.mv = '-1'; next.dataset.mv = '1';
            prev.disabled = !minYm || ym <= minYm; next.disabled = !maxYm || ym >= maxYm;
            head.append(prev, dlEl('span', 't', y + '년 ' + m + '월'), next);
            const grid = dlEl('div', 'bb-att-cal-grid');
            ['일', '월', '화', '수', '목', '금', '토'].forEach(d => grid.appendChild(dlEl('div', 'bb-att-dow', d)));
            const dow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(), dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
            for (let i = 0; i < dow; i++) grid.appendChild(dlEl('div'));
            const today = dlOpDate(), sel = dlDateNow();
            for (let d = 1; d <= dim; d++) {
                const ds = ym + '-' + attPad(d);
                const cell = dlEl('div', 'bb-att-day', String(d));
                if (_dlDates.has(ds)) { cell.classList.add('has'); cell.dataset.date = ds; cell.appendChild(dlEl('span', 'dot')); }
                if (ds === today) cell.classList.add('today');
                if (ds === sel) cell.classList.add('sel');
                grid.appendChild(cell);
            }
            cal.replaceChildren(head, grid);
        }

        /* ───────── 이벤트 ───────── */
        document.getElementById('bb-fb-dlog').addEventListener('click', () => dlOpenPanel());
        $dl('bb-dlog-close').addEventListener('click', () => dlClosePanel());
        $dl('bb-dlog-today').addEventListener('click', () => dlSetDate(null));
        $dl('bb-dlog-cal-btn').addEventListener('click', () => dlOpenCal());
        $dl('bb-dlog-cal').addEventListener('click', e => {
            const mv = e.target.closest('button[data-mv]');
            if (mv && !mv.disabled) { const t = _dlCalYm.y * 12 + (_dlCalYm.m - 1) + Number(mv.dataset.mv); _dlCalYm = { y: Math.floor(t / 12), m: (t % 12) + 1 }; dlRenderCal(); return; }
            const day = e.target.closest('.bb-att-day.has');
            if (day) dlSetDate(day.dataset.date);
        });
        document.addEventListener('mousedown', e => {
            if (_dlCalOpen && !e.target.closest('#bb-dlog-cal') && !e.target.closest('#bb-dlog-cal-btn')) dlCloseCal();
            // [UI 개편: 배달 로그는 항상 펼쳐져 있으므로 바깥 클릭으로 닫지 않음] else if (_dlOpen && !e.target.closest('#bb-dlog-panel') && !e.target.closest('#bb-fb-dlog')) dlClosePanel();
        });
        document.addEventListener('keydown', e => {
            if (e.key !== 'Escape') return;
            if (_dlCalOpen) dlCloseCal();
            // [UI 개편] else if (_dlOpen) dlClosePanel();
        });
        // 버튼 배지 = 오늘(근무일) 완료 건수 (다른 고정 버튼과 같은 fbSetBadge 재사용). 오늘 데이터 응답은 dlRefresh 와 같은 주소라 엣지 캐시를 공유함
        async function dlRefreshBadge() {
            if (!dlMayFetchToday()) return;   // 마감 후 확정본을 이미 받았으면 조회하지 않음
            const date = dlOpDate(), closedAtStart = dlPastClose();
            try {
                const d = await attFetchJson(DL_API + '?view=day&date=' + date);
                if (!d || d.ok !== true) return;
                if (closedAtStart) _dlBadgeFinalDate = date;   // 마감 후 받은 값 = 확정본
                fbSetBadge('bb-fb-dlog', (d.summary && d.summary.completed) || 0, 'pk');
            } catch (e) { /* 배지 갱신 실패는 조용히 무시 (다음 주기에 다시 시도됨) */ }
        }
        // ── 1분마다 조회 (08:00 ~ 23:00) ──
        // 서버 크론이 2분마다 갱신하므로 그 절반 주기(1분)로 읽어야, 크론 주기와 엇갈려도 새 값이 최대 1분 안에 보인다. (2분 주기로 읽으면 크론 직전에 읽는 경우가 계속 생겨 한 주기씩 늦어짐)
        // 서버가 응답을 60초 엣지 캐시하므로 보드가 여러 대여도 GitHub 호출은 늘지 않는다. 주소에 &t=Date.now() 같은 값을 붙이지 말 것 (캐시가 매번 빗나감).
        const DL_POLL_MS = 60 * 1000;
        function dlPollToday() {   // 마감 후에는 확정본이 없을 때 1회만 실제 조회 (dlRefresh / dlRefreshBadge 안에서 판단)   // 오늘 데이터는 한 번만 받아서 패널과 배지에 같이 반영 (패널이 닫혀 있거나 다른 날짜를 보는 중이면 배지만)
            return (_dlOpen && !_dlDate) ? dlRefresh() : dlRefreshBadge();
        }
        function dlScheduleNext() {
            setTimeout(() => {
                if (!document.hidden) dlPollToday();   // 08:00~23:00 에는 매분 조회, 그 밖에는 위 마감 처리에 따라 확정본 1회 외에는 조회하지 않음
                dlScheduleNext();
            }, DL_POLL_MS + Math.floor(Math.random() * 3000));   // 보드가 여러 대여도 같은 초에 몰리지 않도록 0~3초 지터
        }
        dlScheduleNext();
        // 탭이 다시 보이면 한 번 조회 (마지막 조회가 30초 안이면 생략)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && (!_dlData || Date.now() - (_dlData._at || 0) > 30000)) dlPollToday();
        });
        dlRefreshBadge();   // 처음 열었을 때 1회 (패널 자체의 첫 조회는 아래 dlOpenPanel 이 담당)

        /* ───────── 누적 통계: 사이트별 배달 건수 + 주중(월~목) vs 주말(금~일) + 시간대별 ─────────
           · 건수 = 완료된 배달(deliveries)만. 진행 중/확인 중은 제외. 요일은 근무일(07시 기준 날짜) 기준.
           · 데이터: 날짜 목록(view=dates) + 날짜별(view=day&date=…) 을 받아 {사이트: [0~23시 건수, 24=시각 미상]} 로 압축해 저장.
           · 저장(localStorage bbDlStatsV1): 지난 날짜는 변하지 않으므로 다시 받지 않음. 최근 DLS_REFETCH_DAYS 일만 다시 받음.
             '새로 집계' = 저장분 버리고 전부 다시 받기. 저장값은 읽을 때마다 형식 검증, 이상하면 버림.
           · 방어: 진행 중 중복 실행 방지(시퀀스 번호) · 동시 요청 3개 제한 · 실패한 날은 저장하지 않고 '불러오지 못함'으로 표시 · 전체 try/catch */
        try {
        const DLS_KEY = 'bbDlStatsV1';
        const DLS_CONC = 3;
        const DLS_REFETCH_DAYS = 2;
        const DLS_MAX_DAYS = 400;
        const DLS_UNK = 24;
        const DLS_HOURS = [7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,0,1,2,3,4,5,6];   // 근무일 순서 (07시 시작)
        const dlsSafe = fn => function () { try { return fn.apply(this, arguments); } catch (e) { console.warn('[BB] 배달 누적 통계 오류:', e && e.message); } };

        const dsSt = document.createElement('style');
        dsSt.id = 'bb-ds-style';
        dsSt.textContent = `
        #bb-dl-stats-btn { background:#d6f5e3; border-color:#8fd3ac; color:#14532d; }
        #bb-dl-stats-btn:hover { background:#c3efd5; border-color:#6fc496; }
        #bb-dl-stats-btn.on { background:#9fe3bd; border-color:#4fb57d; }
        #bb-ds {
            --bg:#f2e4c4; --sur:#f8f3e6; --sur2:#efe6d2; --bd:#cabf9d; --bd2:#b3a687; --tx:#2b2418; --mu:#7a6f5c; --bl:#3b82f6;
            display:none; position:fixed; width:660px; max-width:96vw; flex-direction:column; color:var(--tx); font-family:'Paperlogy','Lato',-apple-system,sans-serif;
            border:3px solid transparent; border-radius:14px;
            transform:scale(var(--bb-pop-zoom,1)); transform-origin:center center;
            background-image:linear-gradient(var(--sur),var(--sur)), linear-gradient(135deg, #d9b8ff, #9333ea);
            background-origin:border-box; background-clip:padding-box,border-box;
            box-shadow:0 18px 46px rgba(0,0,0,.45); z-index:99999998; box-sizing:border-box; overflow:hidden;
        }
        #bb-ds * { box-sizing:border-box; }
        #bb-ds.open { display:flex; }
        .bb-ds-h { flex:0 0 auto; padding:12px 16px 6px; display:flex; flex-direction:column; gap:4px; }
        .bb-ds-t { display:flex; align-items:baseline; gap:10px; }
        .bb-ds-t b { font-size:calc(22px * var(--bb-ts, 1)); font-weight:900; }
        .bb-ds-t .rf { font-size:calc(13.5px * var(--bb-ts, 1)); color:var(--bl); cursor:pointer; text-decoration:underline; }
        .bb-ds-t .x { margin-left:auto; color:#b91c1c; font-size:calc(18px * var(--bb-ts, 1)); font-weight:900; padding:0 4px; cursor:pointer; }
        .bb-ds-sub { font-size:calc(13.5px * var(--bb-ts, 1)); color:var(--mu); }
        .bb-ds-sub.warn { color:#c2410c; font-weight:700; }
        .bb-ds-cards { flex:0 0 auto; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; padding:4px 16px 8px; }
        .bb-ds-card { padding:6px 9px; border-radius:9px; background:var(--sur2); border:1px solid var(--bd); border-left-width:5px; }
        .bb-ds-card.wd { border-left-color:#5b8fd1; }
        .bb-ds-card.we { border-left-color:#f08a4b; }
        .bb-ds-card .l { font-size:calc(13px * var(--bb-ts, 1)); color:var(--mu); }
        .bb-ds-card .v { font-size:calc(19px * var(--bb-ts, 1)); font-weight:900; white-space:nowrap; }
        .bb-ds-card .v small { margin-left:3px; font-size:calc(13px * var(--bb-ts, 1)); color:var(--mu); font-weight:700; }
        .bb-ds-card .s { font-size:calc(13px * var(--bb-ts, 1)); color:var(--mu); margin-top:1px; }
        .bb-ds-ch { flex:0 0 auto; padding:2px 16px 8px; border-top:1px solid var(--bd); }
        .bb-ds-chh { display:flex; align-items:center; gap:8px; padding:6px 0 4px; font-size:calc(14.5px * var(--bb-ts, 1)); font-weight:800; }
        .bb-ds-chh .lg { display:inline-flex; align-items:center; gap:4px; font-size:calc(13px * var(--bb-ts, 1)); color:var(--mu); font-weight:700; }
        .bb-ds-chh .lg i { width:10px; height:10px; border-radius:2px; display:inline-block; }
        .bb-ds-chh .tg { margin-left:auto; display:inline-flex; gap:3px; }
        .bb-ds-chip { height:22px; padding:0 9px; border-radius:999px; border:1.5px solid var(--bd2); background:transparent; color:var(--tx); font-size:calc(13.5px * var(--bb-ts, 1)); cursor:pointer; font-family:inherit; }
        .bb-ds-chip.on { border-color:var(--tx); background:var(--tx); color:var(--sur); }
        .bb-ds-bars { display:flex; align-items:flex-end; gap:2px; height:104px; }
        .bb-ds-hc { flex:1; min-width:0; height:100%; display:flex; align-items:flex-end; justify-content:center; gap:1px; }
        .bb-ds-hc i { flex:1; min-width:2px; max-width:9px; border-radius:2px 2px 0 0; display:block; }
        .bb-ds-hc i.wd { background:#5b8fd1; }
        .bb-ds-hc i.we { background:#f08a4b; }
        .bb-ds-hl { display:flex; gap:2px; margin-top:2px; }
        .bb-ds-hl span { flex:1; text-align:center; font-size:calc(11.5px * var(--bb-ts, 1)); color:var(--mu); }
        .bb-ds-th, .bb-ds-row { display:grid; grid-template-columns:28px minmax(0,1fr) 60px 74px 74px 92px; gap:6px; align-items:center; padding:0 16px; }
        .bb-ds-th { flex:0 0 auto; font-size:calc(13px * var(--bb-ts, 1)); color:var(--mu); padding-top:5px; padding-bottom:5px; border-top:1px solid var(--bd); border-bottom:1px solid var(--bd); background:var(--sur2); }
        .bb-ds-th span:nth-child(n+3), .bb-ds-row > div:nth-child(n+3) { text-align:right; }
        .bb-ds-th span[data-sort] { cursor:pointer; user-select:none; }
        .bb-ds-th span[data-sort]:hover { color:var(--tx); }
        .bb-ds-th span.cur { color:#c2410c; font-weight:800; }
        .bb-ds-body { flex:1 1 auto; min-height:0; overflow-y:auto; }
        .bb-ds-row { padding-top:6px; padding-bottom:6px; border-bottom:1px solid var(--bd); cursor:pointer; }
        .bb-ds-row:hover { background:rgba(0,0,0,.035); }
        .bb-ds-row.sel { background:#d6f5e3; }
        .bb-ds-rk { font-size:calc(15px * var(--bb-ts, 1)); font-weight:900; color:var(--mu); text-align:center; }
        .bb-ds-row.top .bb-ds-rk { color:#c2410c; }
        .bb-ds-nm { min-width:0; }
        .bb-ds-nm .n { font-size:calc(15.5px * var(--bb-ts, 1)); font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bb-ds-bar { height:5px; margin-top:4px; border-radius:3px; background:rgba(0,0,0,.07); overflow:hidden; }
        .bb-ds-bar i { display:block; height:100%; background:#22a05a; border-radius:3px; }
        .bb-ds-c { font-size:calc(18px * var(--bb-ts, 1)); font-weight:900; color:#14532d; font-variant-numeric:tabular-nums; }
        .bb-ds-c small { margin-left:2px; font-size:calc(13px * var(--bb-ts, 1)); color:var(--mu); font-weight:700; }
        .bb-ds-a { font-size:calc(15px * var(--bb-ts, 1)); font-variant-numeric:tabular-nums; }
        .bb-ds-msg { padding:30px 16px; text-align:center; color:var(--mu); font-size:calc(15px * var(--bb-ts, 1)); }
        .bb-ds-ft { flex:0 0 auto; padding:6px 16px 9px; border-top:1px solid var(--bd); font-size:calc(12.5px * var(--bb-ts, 1)); line-height:1.55; color:var(--mu); }
        `;
        document.head.appendChild(dsSt);

        // 제목 줄 우측에 버튼 삽입 (닫기 ✕ 는 숨김 상태라 이 버튼이 맨 오른쪽에 놓임)
        const dsBtn = dlEl('button', 'bb-mm-nav');
        dsBtn.innerHTML = '<span class="tx"><span class="l1">누적</span><span class="l2">통계</span></span>';
        dsBtn.id = 'bb-dl-stats-btn'; dsBtn.type = 'button'; dsBtn.title = '사이트별 배달 건수 · 주중(월~목) vs 주말(금~일) · 시간대별';
        const dsHd = document.querySelector('#bb-dlog-panel .bb-ap-hd');
        if (dsHd) dsHd.appendChild(dsBtn);

        const dsPop = dlEl('div'); dsPop.id = 'bb-ds';
        document.body.appendChild(dsPop);

        let _dsOpen = false, _dsSeq = 0, _dsSite = null, _dsMode = 'avg';
        let _dsSort = { k: 'total', dir: -1 };
        let _dsView = { dates: [], days: {}, state: null };

        const dsRound = n => (Math.round(n * 10) / 10).toFixed(1);
        const dsGroup = ymd => { const w = new Date(ymd + 'T12:00:00Z').getUTCDay(); return (w >= 1 && w <= 4) ? 'wd' : 'we'; };   // 월~목 = 주중, 금·토·일 = 주말
        const dsShift = (ymd, n) => { const p = ymd.split('-').map(Number), t = new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)); return t.getUTCFullYear() + '-' + attPad(t.getUTCMonth() + 1) + '-' + attPad(t.getUTCDate()); };
        const dsIsYmd = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

        function dsSite(r) {
            const v = String(r.site || '').replace(/\s+/g, ' ').trim() || String(r.robot || '').replace(/\s+/g, ' ').trim() || String(r.store || '').replace(/\s+/g, ' ').trim();
            return v || '(사이트 미상)';
        }
        function dsHour(r) {
            for (const s of [r.assignedAt, r.receivedAt]) {
                const m = /(\d{1,2}):(\d{2})/.exec(String(s || ''));
                if (m && +m[1] < 24) return +m[1];
            }
            for (const t of [r.assignedTs, r.threadTs]) {
                const f = parseFloat(t);
                if (f > 0) return new Date(f * 1000 + 9 * 3600 * 1000).getUTCHours();
            }
            return DLS_UNK;
        }
        function dsCompact(d) {   // 하루 응답 → { 사이트: [25칸] }
            const out = {}, seen = new Set();
            (Array.isArray(d.deliveries) ? d.deliveries : []).forEach(r => {
                if (!r || typeof r !== 'object') return;
                if (r.orderNo) { const k = String(r.orderNo); if (seen.has(k)) return; seen.add(k); }   // 같은 날 같은 주문번호 중복 방지
                const nm = dsSite(r), a = out[nm] || (out[nm] = new Array(27).fill(0));   // [0~23]=시간대별 건수, [24]=시각 미상, [25]=소요시간 합(초), [26]=소요시간이 있는 건수
                a[dsHour(r)]++;
                const du = Number(r.durationSec);
                if (r.durationSec != null && Number.isFinite(du) && du > 0 && du <= 86400) { a[25] += du; a[26]++; }   // 비정상 값(0 이하·하루 초과)은 평균에서 제외
            });
            return out;
        }
        function dsLoadStore() {   // 저장값 검증: 형식이 이상한 날짜는 버림
            const empty = { v: 2, days: {}, at: 0 };   // v2: 사이트별 배열이 25칸 → 27칸(소요시간 합·건수 추가). v1 저장분은 형식이 달라 버리고 새로 받음
            try {
                const s = JSON.parse(localStorage.getItem(DLS_KEY) || 'null');
                if (!s || s.v !== 2 || !s.days || typeof s.days !== 'object') return empty;
                const days = {};
                Object.keys(s.days).forEach(d => {
                    const day = s.days[d];
                    if (!dsIsYmd(d) || !day || typeof day !== 'object') return;
                    const ok = {};
                    Object.keys(day).forEach(nm => { const a = day[nm]; if (Array.isArray(a) && a.length === 27 && a.every(x => Number.isFinite(x) && x >= 0)) ok[nm] = a; });
                    days[d] = ok;
                });
                return { v: 2, days, at: +s.at || 0 };
            } catch (e) { return empty; }
        }
        const dsSaveStore = s => { try { localStorage.setItem(DLS_KEY, JSON.stringify(s)); } catch (e) { /* 저장 못 해도 이번 화면에는 지장 없음 */ } };

        function dsAgg(dates, days) {
            const g = { wd: { days: 0, total: 0 }, we: { days: 0, total: 0 } }, sites = new Map();
            const all = { wd: new Array(24).fill(0), we: new Array(24).fill(0) };
            let unk = 0;
            dates.forEach(d => {
                const day = days[d]; if (!day) return;
                const k = dsGroup(d); g[k].days++;
                Object.keys(day).forEach(nm => {
                    const a = day[nm];
                    let s = sites.get(nm);
                    if (!s) sites.set(nm, s = { name: nm, wd: 0, we: 0, dsum: 0, dcnt: 0, hrs: { wd: new Array(24).fill(0), we: new Array(24).fill(0) } });
                    for (let h = 0; h < 24; h++) { s[k] += a[h]; s.hrs[k][h] += a[h]; all[k][h] += a[h]; g[k].total += a[h]; }
                    s[k] += a[DLS_UNK]; g[k].total += a[DLS_UNK]; unk += a[DLS_UNK];
                    s.dsum += a[25]; s.dcnt += a[26];
                });
            });
            return { g, sites: [...sites.values()], all, unk };
        }

        function dsRender() {
            if (!_dsOpen) return;
            const { dates, days, state } = _dsView;
            const have = dates.filter(d => days[d]);
            const A = dsAgg(have, days), g = A.g;
            const avg = k => g[k].days ? g[k].total / g[k].days : 0;
            const grand = g.wd.total + g.we.total;

            const head = dlEl('div', 'bb-ds-h');
            const t = dlEl('div', 'bb-ds-t');
            t.appendChild(dlEl('b', '', '배달 통계 (누적)'));
            const rf = dlEl('span', 'rf', '새로 집계'); rf.dataset.act = 'refresh'; rf.title = '저장해 둔 날짜별 기록을 버리고 전부 다시 받아 집계합니다';
            const x = dlEl('span', 'x', '✕'); x.dataset.act = 'close';
            t.append(rf, x);
            head.appendChild(t);
            let sub = have.length ? have[0].slice(5).replace('-', '/') + ' ~ ' + have[have.length - 1].slice(5).replace('-', '/') + ' · ' + have.length + '일치 · 총 ' + grand + '건' : '';
            let warn = false;
            if (state && state.phase === 'loading') sub += (sub ? ' · ' : '') + '집계 중… ' + state.done + '/' + state.total;
            else if (state && state.phase === 'fail') { sub = '날짜 목록을 불러오지 못했습니다.'; warn = true; }
            else if (state && state.failed) { sub += ' · ⚠ ' + state.failed + '일 불러오지 못함 (열 때 다시 시도)'; warn = true; }
            head.appendChild(dlEl('div', 'bb-ds-sub' + (warn ? ' warn' : ''), sub || ' '));

            const card = (cls, l, v, u, s) => { const e = dlEl('div', 'bb-ds-card ' + cls); e.appendChild(dlEl('div', 'l', l)); const vv = dlEl('div', 'v', v); if (u) vv.appendChild(dlEl('small', '', u)); e.appendChild(vv); e.appendChild(dlEl('div', 's', s)); return e; };
            const ratio = avg('wd') > 0 ? avg('we') / avg('wd') : null;
            const cards = dlEl('div', 'bb-ds-cards');
            cards.append(
                card('wd', '주중 (월~목)', String(g.wd.total), '건', g.wd.days + '일 · 일평균 ' + dsRound(avg('wd')) + '건'),
                card('we', '주말 (금~일)', String(g.we.total), '건', g.we.days + '일 · 일평균 ' + dsRound(avg('we')) + '건'),
                card('', '일평균 비교', ratio == null ? '-' : '×' + ratio.toFixed(2), '', ratio == null ? '비교할 데이터 없음' : ratio >= 1 ? '주말이 주중보다 ' + Math.round((ratio - 1) * 100) + '% 많음' : '주말이 주중보다 ' + Math.round((1 - ratio) * 100) + '% 적음')
            );

            // 시간대별 (선택한 사이트가 있으면 그 사이트만)
            const sel = _dsSite ? A.sites.find(s => s.name === _dsSite) : null;
            if (_dsSite && !sel) _dsSite = null;
            const hrs = sel ? sel.hrs : A.all;
            const val = (k, h) => (_dsMode === 'avg' ? (g[k].days ? hrs[k][h] / g[k].days : 0) : hrs[k][h]);
            let max = 0; DLS_HOURS.forEach(h => { max = Math.max(max, val('wd', h), val('we', h)); });
            const ch = dlEl('div', 'bb-ds-ch');
            const chh = dlEl('div', 'bb-ds-chh');
            chh.appendChild(dlEl('span', '', '시간대별 ' + (_dsMode === 'avg' ? '일평균' : '누적') + ' · ' + (sel ? sel.name : '전체')));
            const lg1 = dlEl('span', 'lg'), lg2 = dlEl('span', 'lg');
            const i1 = dlEl('i'); i1.style.background = '#5b8fd1'; const i2 = dlEl('i'); i2.style.background = '#f08a4b';
            lg1.append(i1, '주중'); lg2.append(i2, '주말');
            const tg = dlEl('span', 'tg');
            [['avg', '일평균'], ['sum', '누적']].forEach(([k, l]) => { const c = dlEl('button', 'bb-ds-chip' + (_dsMode === k ? ' on' : ''), l); c.dataset.mode = k; c.type = 'button'; tg.appendChild(c); });
            chh.append(lg1, lg2, tg);
            const bars = dlEl('div', 'bb-ds-bars'), hl = dlEl('div', 'bb-ds-hl');
            DLS_HOURS.forEach(h => {
                const col = dlEl('div', 'bb-ds-hc');
                ['wd', 'we'].forEach(k => {
                    const b = dlEl('i', k), v = val(k, h);
                    b.style.height = max > 0 ? Math.max(v > 0 ? 2 : 0, Math.round(v / max * 100)) + '%' : '0';
                    b.title = String(h).padStart(2, '0') + '시 · ' + (k === 'wd' ? '주중 ' : '주말 ') + (_dsMode === 'avg' ? dsRound(v) + '건/일' : v + '건');
                    col.appendChild(b);
                });
                bars.appendChild(col);
                hl.appendChild(dlEl('span', '', String(h).padStart(2, '0')));
            });
            ch.append(chh, bars, hl);

            // 사이트별 표
            const wdAvg = s => g.wd.days ? s.wd / g.wd.days : 0, weAvg = s => g.we.days ? s.we / g.we.days : 0;
            const durOf = s => s.dcnt > 0 ? s.dsum / s.dcnt : -1;
            const key = { total: s => s.wd + s.we, wd: wdAvg, we: weAvg, dur: durOf }[_dsSort.k];
            const rows = A.sites.slice().sort((a, b) => _dsSort.k === 'name'
                ? _dsSort.dir * a.name.localeCompare(b.name, 'ko')
                : (key(a) - key(b)) * _dsSort.dir || (b.wd + b.we) - (a.wd + a.we) || a.name.localeCompare(b.name, 'ko'));
            const th = dlEl('div', 'bb-ds-th');
            [['#', ''], ['사이트', 'name'], ['누적', 'total'], ['주중 일평균', 'wd'], ['주말 일평균', 'we'], ['평균 소요시간', 'dur']].forEach(([lb, k]) => {
                const sp = dlEl('span', k && _dsSort.k === k ? 'cur' : '', lb + (k && _dsSort.k === k ? (_dsSort.dir < 0 ? ' ▼' : ' ▲') : ''));
                if (k) { sp.dataset.sort = k; sp.title = '눌러서 정렬 (다시 누르면 오름/내림차순 전환)'; }
                th.appendChild(sp);
            });
            const body = dlEl('div', 'bb-ds-body');
            if (!rows.length) {
                body.appendChild(dlEl('div', 'bb-ds-msg', state && state.phase === 'loading' ? '불러오는 중…' : state && state.phase === 'fail' ? '다시 열어 주세요.' : '집계할 배달 기록이 없습니다.'));
            } else {
                const mx = Math.max(1, ...rows.map(s => s.wd + s.we));
                rows.forEach((s, i) => {
                    const tot = s.wd + s.we;
                    const row = dlEl('div', 'bb-ds-row' + (_dsSort.k === 'total' && _dsSort.dir < 0 && i < 3 ? ' top' : '') + (_dsSite === s.name ? ' sel' : ''));
                    row.dataset.site = s.name;
                    row.title = s.name + ' — 클릭: 이 사이트만 시간대별 그래프로 보기 (다시 클릭하면 해제)';
                    row.appendChild(dlEl('div', 'bb-ds-rk', String(i + 1)));
                    const nm = dlEl('div', 'bb-ds-nm'); nm.appendChild(dlEl('div', 'n', s.name));
                    const bar = dlEl('div', 'bb-ds-bar'), f = dlEl('i'); f.style.width = Math.round(tot / mx * 100) + '%'; bar.appendChild(f); nm.appendChild(bar);
                    row.appendChild(nm);
                    const c = dlEl('div', 'bb-ds-c', String(tot)); c.appendChild(dlEl('small', '', '건')); row.appendChild(c);
                    row.appendChild(dlEl('div', 'bb-ds-a', g.wd.days ? dsRound(wdAvg(s)) : '-'));
                    row.appendChild(dlEl('div', 'bb-ds-a', g.we.days ? dsRound(weAvg(s)) : '-'));
                    const dur = dlEl('div', 'bb-ds-a', s.dcnt > 0 ? attDurHM(s.dsum / s.dcnt) : '-');
                    dur.title = s.dcnt > 0 ? '배달 1건당 평균 소요시간 (소요시간이 기록된 ' + s.dcnt + '건 기준)' : '소요시간 기록이 없음';
                    row.appendChild(dur);
                    body.appendChild(row);
                });
            }
            const ft = dlEl('div', 'bb-ds-ft', '건수 = 완료된 배달만 (진행 중·확인 중 제외) · 요일은 근무일(07시 기준) 기준 · 주중 = 월~목, 주말 = 금~일 · 일평균 = 건수 ÷ 해당 요일군 일수 · 평균 소요시간 = 배달 1건당 소요시간 평균(기록된 건만) · 시간대는 기체 배정 시각 기준' + (A.unk ? ' · 시각 미상 ' + A.unk + '건은 그래프에서 제외' : ''));
            const keepEl = dsPop.querySelector('.bb-ds-body'), keep = keepEl ? keepEl.scrollTop : 0;
            dsPop.replaceChildren(head, cards, ch, th, body, ft);
            body.scrollTop = keep;
        }

        function dsPlace() {
            const p = document.getElementById('bb-dlog-panel'); if (!p) return;
            const br = p.getBoundingClientRect(), w = dsPop.offsetWidth;
            let left = br.right + 10;   // [admin] 그리드가 왼쪽 절반에 있으므로 팝업은 오른쪽 우선
            if (left + w > window.innerWidth - 8) left = br.left - w - 10;
            dsPop.style.left = Math.max(8, left) + 'px';
            dsPop.style.top = Math.max(8, br.top) + 'px';
            dsPop.style.height = Math.min(Math.max(br.height, 600), window.innerHeight - 16) + 'px';
        }
        function dsClose() {
            _dsOpen = false; _dsSeq++;   // 진행 중이던 집계는 결과를 버림
            dsPop.classList.remove('open');
            dsBtn.classList.remove('on');
        }
        const DLS_FRESH_MS = 5 * 60 * 1000;   // 마지막 전체 집계가 이 시간 이내면 네트워크 생략
        async function dsLoad(force) {
            const seq = ++_dsSeq;
            const store = force ? { v: 2, days: {}, at: 0 } : dsLoadStore();
            _dsView = { dates: Object.keys(store.days).sort(), days: store.days, state: { phase: 'loading', done: 0, total: 0, failed: 0 } };   // 저장분 먼저 표시
            dsRender();
            if (!force && store.at && Date.now() - store.at < DLS_FRESH_MS) {   // 방금 집계한 저장분 → 바로 완료 표시
                _dsView.state = { phase: 'done', done: 0, total: 0, failed: 0 };
                dsRender();
                return;
            }
            let dates;
            try {
                const dd = await attFetchJson(DL_API + '?view=dates');
                if (!dd || dd.ok !== true || !Array.isArray(dd.dates)) throw new Error('데이터 형식 오류');
                dates = dd.dates.filter(dsIsYmd).sort().slice(-DLS_MAX_DAYS);
            } catch (e) {
                console.warn('[BB] 배달 통계 날짜 목록 실패:', e && e.message);
                if (seq === _dsSeq) { _dsView.state = { phase: seq === _dsSeq ? 'fail' : '' }; dsRender(); }
                return;
            }
            if (seq !== _dsSeq) return;
            Object.keys(store.days).forEach(d => { if (!dates.includes(d)) delete store.days[d]; });   // 서버에서 사라진 날짜는 버림
            const cut = dsShift(dlOpDate(), -(DLS_REFETCH_DAYS - 1));   // 오늘(+어제 여유)만 다시 받음
            const todo = dates.filter(d => !store.days[d] || d >= cut);
            console.log('[BB] 배달 통계: 받을 날짜', todo.length, '/', dates.length, todo.slice(0, 5));
            const st = { phase: 'loading', done: 0, total: todo.length, failed: 0 };
            _dsView = { dates, days: store.days, state: st };
            dsRender();
            let idx = 0, sinceSave = 0;
            const worker = async () => {
                while (idx < todo.length) {
                    if (seq !== _dsSeq) return;
                    const d = todo[idx++];
                    try {
                        const j = await attFetchJson(DL_API + '?view=day&date=' + d);
                        if (j && j._404) delete store.days[d];
                        else if (!j || j.ok !== true) throw new Error('데이터 형식 오류');
                        else store.days[d] = dsCompact(j);
                    } catch (e) { st.failed++; }   // 실패한 날은 저장하지 않음 (예전 저장분이 있으면 그대로 유지)
                    st.done++;
                    if (++sinceSave >= 10) { sinceSave = 0; dsSaveStore(store); }   // 중간 저장
                    if (seq === _dsSeq && (st.done % 3 === 0 || st.done === st.total)) dsRender();
                }
            };
            await Promise.all(Array.from({ length: Math.min(DLS_CONC, todo.length) }, worker));
            if (seq !== _dsSeq) { dsSaveStore(store); return; }   // 중단돼도 받은 분 저장 (at 은 갱신하지 않음)
            store.at = Date.now();
            dsSaveStore(store);
            _dsView.dates = Object.keys(store.days).sort();
            st.phase = 'done';
            dsRender();
        }
        function dsOpen() {
            if (_dsOpen) { dsClose(); return; }
            if (typeof dlCloseCal === 'function') dlCloseCal();
            _dsOpen = true; _dsSite = null;
            dsBtn.classList.add('on');
            dsPop.classList.add('open');
            dsPlace();
            dsLoad(false);
            dsPlace();
        }
        window.__bbDlSpClose = dsClose;   // 보드를 닫을 때 같이 닫음 (closeBoard 에서 호출)
        dsBtn.addEventListener('click', dlsSafe(() => dsOpen()));
        dsPop.addEventListener('click', dlsSafe(e => {
            const so = e.target.closest('[data-sort]');
            if (so) { const k = so.dataset.sort; _dsSort = _dsSort.k === k ? { k, dir: -_dsSort.dir } : { k, dir: k === 'name' ? 1 : -1 }; dsRender(); return; }
            const md = e.target.closest('[data-mode]');
            if (md) { _dsMode = md.dataset.mode === 'sum' ? 'sum' : 'avg'; dsRender(); return; }
            const a = e.target.closest('[data-act]');
            if (a) { if (a.dataset.act === 'close') dsClose(); else if (a.dataset.act === 'refresh') dsLoad(true); return; }
            const row = e.target.closest('.bb-ds-row');
            if (row) { _dsSite = _dsSite === row.dataset.site ? null : row.dataset.site; dsRender(); }
        }));
        document.addEventListener('click', dlsSafe(e => {   // 바깥 클릭 → 닫기
            if (_dsOpen && !e.target.closest('#bb-ds') && !e.target.closest('#bb-dl-stats-btn')) dsClose();
        }), true);
        document.addEventListener('keydown', dlsSafe(e => { if (e.key === 'Escape' && _dsOpen) dsClose(); }));
        window.addEventListener('resize', dlsSafe(() => { if (_dsOpen) dsPlace(); }));
        } catch (e) { console.warn('[BB] 배달 누적 통계 초기화 실패 — 기존 기능에는 영향 없음:', e && e.message); }

        dlOpenPanel();   // [UI 개편] 배달 로그 항상 표시
        console.log('[BB] 배달 로그 켜짐 (SECTION 19)');
    }
    } catch (e) { console.warn('[BB] 배달 로그 초기화 실패 — 기존 기능에는 영향 없음:', e && e.message); }


    // ============================================================
    // (SECTION 20 '임무받기 현황 카드' 삭제 — 서버 파일 '임무받기_현황' 조회·캐시·폴링 로직 전부 제거. 헤더의 알림 칩 영역 위치만 기존 그대로 유지)
    // ============================================================
    try {
        const st = document.createElement('style');
        st.textContent = '#bb .bb-alert-zone { left:256px; width:calc(50% - 375px - 242px); }';
        document.head.appendChild(st);
        try { localStorage.removeItem('bb_mw_cache_v1'); } catch (e) { /* 무시 */ }
    } catch (e) { /* 무시 */ }

    render();
    if (_trimNotice) {
        alert(`기체 카드는 최대 ${MAX}대까지라서, 저장돼 있던 목록에서 뒤쪽 ${_trimNotice}대를 뺐습니다.\n필요한 기체는 오른쪽 위 검색창에서 다시 추가해 주세요.`);
        _trimNotice = 0;
    }
    // [주석처리: 동숲] applyCampingBackground();

})();

// ════════════════════════════════════════════════════════════════════════════
// ADMIN 확장 (battery_board_admin.js 전용) — 위 보드 코드는 건드리지 않고, 화면 배치만 다시 짠다.
//   · 960×1040(1080p 스냅 절반) 에 맞춰 #bb 를 1200×1300 으로 만들고 기본 줌 80% 로 표시
//   · 배달 로그 / 개입카드 현황 / 이석 현황 그리드: 헤더 아래 버튼으로 펼치고 접음 (그리드 DOM 은 그대로 옮겨 붙임)
//   · 위쪽: 일일 업무표(daily_tasks.json) + 체크/취소선 (이 브라우저에만 저장, 업무일 07:00 에 초기화)
//   · 아래쪽: 다중 모니터링 기체(좌) / 캠핑장 점검 · HW 이슈 · SW 이슈(우)
//   · 기존 기체 리스트(.bb-body)는 화면 밖으로 치워 두고 계속 동작시킴 (알림·로그 로직 유지)
//   · 비상용 끄기: 콘솔에서 localStorage.bbaOff='1' 후 새로고침 → 이 확장만 꺼짐
//   · 이 확장이 실패해도 위 보드 기능에는 영향 없음 (전체 try/catch)
// ════════════════════════════════════════════════════════════════════════════
(function () {
    'use strict';
    try {
        if (localStorage.getItem('bbaOff') === '1') return;
    } catch (e) { /* 저장소 접근 불가 → 그대로 진행 */ }
    try {
        const bb = document.getElementById('bb');
        if (!bb) return;
        const $ = id => document.getElementById(id);
        const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        const pad = n => String(n).padStart(2, '0');
        const lsGet = (k, f) => { try { const v = localStorage.getItem(k); return v === null ? f : v; } catch (e) { return f; } };
        const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* 무시 */ } };

        const TASKS_URL = 'https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/daily_tasks.json';
        const TASKS_FULL_URL = 'https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/daily_tasks_full.json';   // admin 전용: 휴무·관리자 행까지 포함한 일일 업무 전체 행 (GAS 가 기록)
        const TASKS_REFRESH_MS = 5 * 60 * 1000;
        const WD0 = 7 * 60;                       // 업무일 시작 07:00
        const LATE_GRACE = 10;                    // 종료 시각 + 10분이 지나도 미확인이면 '지연'
        const CAMPS = ['아산', '가평', 'LIT청주', '인력개발원', '대관령', '진천', '파주LGD', '충남대병원'];   // 사이트 점검 목록
        // ── 사이트 점검 자동 확인 (정각에 숨김 iframe 으로 NCC 를 열어 확인) ──
        //  id = NCC 주소 번호 · mode 'any' = 기체 중 하나라도 '전원 켜짐 + 임무관리 ON' 이면 OK / mode 'chg' = 전원 ON + 충전중(⚡) + 배터리 수치가 보이면 OK
        //  stopOnOk = 한 번이라도 OK 면 그날은 더 점검하지 않음 · slots = 점검 시각(정각) — 시각이 지났는데 안 했으면 CAMP_MAX_LATE 안에서만 따라잡음
        const CAMP_SLOTS_AG = ['08:30', '10:00', '12:00', '14:00', '16:00', '17:30'];   // 아산·가평·LIT청주 자동 점검 시각 (아산·가평은 조건이 맞으면 그날 종료)
        const CAMP_NOTE = { '대관령': '직접 확인 — 기체 화면에 접속해서 확인', '진천': '직접 확인 — 기체 화면에 접속해서 확인', '파주LGD': '직접 확인 — 기체 화면에 접속해서 확인', '충남대병원': '직접 확인 — 기체 화면에 접속해서 확인' };
        const CAMP_AUTO = {
            '아산': { id: 27, mode: 'duty', stopOnOk: true, slots: CAMP_SLOTS_AG, units: ['스테이 그린 1호기', '스테이 그린 2호기'] },
            '가평': { id: 47, mode: 'duty', stopOnOk: true, slots: CAMP_SLOTS_AG, units: ['가평 니모 캠핑장 1호기', '가평 니모 캠핑장 2호기'] },
            '인력개발원': { id: 24, mode: 'power', stopOnOk: false, weekdayOnly: true, slots: ['09:50', '12:50', '14:50'], units: ['삼성인력개발원 1호기'] },   // 평일만 · 전원 ON/OFF 여부만 확인 (주소 24)
            'LIT청주': { id: 267, mode: 'info', stopOnOk: false, slots: CAMP_SLOTS_AG, units: ['두루아이 4호기'] },
        };
        const CAMP_MAX_LATE = 30 * 60 * 1000;     // 점검 시각에서 이만큼 지나 처음 보게 되면 그 회차는 건너뜀 (아산·가평은 오늘 한 번도 못 했으면 90분까지 따라잡음)
        const CAMP_RETRY_MS = 3 * 60 * 1000;      // 페이지를 못 읽은 경우(로딩 실패 등)만 한 번 더 확인하기까지
        const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

        // ───────── 임무 ON/OFF 자동 점검 설정 (여기만 고치면 됩니다) ─────────
        const AUTO_DIM_FROM = 18 * 60;            // 이 시각 이후에 시작하는 업무(18:00~ 및 자정~07:00)는 체크박스 없이 흐리게만 표시 (점검·완료 집계 제외)
        const AUTO_RANGE_AT = 'end';              // [시작~끝] 업무의 점검 기준: 'end' = 끝 시각 +1분 / 'start' = 시작 시각 +1분 (시각이 하나뿐인 업무는 그 시각 +1분)
        const AUTO_DELAY_MIN = 1;                 // 기준 시각 + 몇 분에 점검할지
        const AUTO_RETRY_MS = 60 * 1000;          // 맞지 않으면 이 시간 뒤 다시 점검
        const CHG_RETRY_MS = 5 * 60 * 1000;       // 무선충전 점검에서 통과 못 한 기체를 다시 점검하기까지 (충전 시작 직후일 수 있어 길게)
        const CHG_STALE_MS = 20 * 60 * 1000;      // 충전 점검은 예정 시각에서 20분 넘게 지나 처음 시작하게 되면 생략(직접 확인)
        const AUTO_MAX_TRIES = 2;                 // 최대 점검 횟수 (이 횟수까지 안 맞으면 ✕ 로 표시)
        const AUTO_SKIP_RE = /(?!)/;   // 이 단어가 들어간 임무 ON/OFF 업무는 자동 점검하지 않음 (수동 확인)
        const PROBE_W = 1440, PROBE_H = 1800;     // 점검용 숨김 iframe 의 가상 화면 크기 (NCC 화면이 이 크기로 그려짐)
        const PROBE_TIMEOUT_MS = 30 * 1000;       // 사이트 한 곳 점검 제한 시간
        const PROBE_STABLE_MS = 1800;             // 스위치 값이 이 시간 동안 같아야 '확정' (로딩 중 깜빡임 방지)
        const normTxt = s => String(s == null ? '' : s).normalize('NFKC').replace(/[\s ]+/g, '');
        const U = (n, extra) => Object.assign({ n, m: [normTxt(n)] }, extra || {});   // 기체: n=표시 이름, m=카드 글자에서 찾을 이름들(공백 무시), g=주간/야간 묶음
        // k=사이트 이름 · id=NCC 모니터링 주소 번호(/ko/monitoring/<id>) · kw=업무 문구에서 이 사이트를 알아보는 글자 · units=점검할 기체
        // powerOnly=전원이 켜진 기체만 ON 확인 · dayUntil=주/야간 구분이 없는 업무를 주간으로 볼 마지막 시각 (그 이후 업무는 야간 기체)
        const AUTO_SITES = [
            { k: '파주 LGD', id: 118, kw: /파주\s*LGD/i, units: [U('파주 LGD 1호기'), U('파주 LGD 2호기')] },
            { k: '수원 푸르지오', id: 265, kw: /푸르지오/, powerOnly: true, units: [U('318호기'), U('319호기')] },
            { k: '수원 바로고', id: 256, kw: /바로고/, dayUntil: 15 * 60, units: [
                U('229호기', { g: '주간' }), U('230호기', { g: '주간' }),   // 카드는 '바로고 1호기 [229호기]' 형태 → 대괄호 안 번호로만 찾는다 (번호는 겹치지 않음)
                U('231호기', { g: '야간' }), U('232호기', { g: '야간' })] },
            { k: '성남 서현동', id: 86, kw: /서현동/, units: [U('성남형 로봇배달 서현동 1호기', { m: ['성남형로봇배달서현동1호기', '서현동1호기'] })] },
            // 성수동1가 요기요: 오전(10:30)은 1·2호기 ON / 그 이후(15:30~16:00)는 1호기 OFF, 2·3호기 ON / OFF 업무면 전부 OFF  (def: 기본 점검 대상 — 팝업에서 바꿀 수 있음)
            { k: '성수동1가 요기요', id: 56, kw: /성수\s*(?:동)?\s*1가/, plan: 'front',
              def: t => (t.dirs[0].w === 'off' ? [{ i: 0, w: 'off' }, { i: 1, w: 'off' }, { i: 2, w: 'off' }]
                  : t.s < 13 * 60 ? [{ i: 0, w: 'on' }, { i: 1, w: 'on' }] : [{ i: 0, w: 'off' }, { i: 1, w: 'on' }, { i: 2, w: 'on' }]),
              units: [1, 2, 3].map(n => U('성수동 1가 (요기요) ' + n + '호기', { m: ['성수동1가(요기요)' + n + '호기', '성수동1가요기요' + n + '호기'] })) },
            // 성남 삼평동 '출근 임무' 업무: 7호기의 '임무 진행'이 비어 있지 않으면(무언가 진행 중) 출근 임무를 수행 중으로 보고 확인. ※ id(NCC 주소 번호)를 채워야 동작
            { k: '성남 삼평동', id: 44, kw: /삼평동/, prog: /출근\s*임무\s*$/, units: [U('성남형 로봇배달 삼평동 7호기', { m: ['성남형로봇배달삼평동7호기', '삼평동7호기'] })] },
            // 송도요기요(65): 오전(10:30~11:00) 1~6호기 ON / 오후(교대) 1~6호기 OFF + 7·10·11·13·14·15호기 ON. 현장 준비 시간이 걸려 첫 점검은 +1분, 안 맞으면 재점검은 5분 뒤(retryMs)
            { k: '송도요기요', id: 65, kw: /송도/, retryMs: 5 * 60 * 1000,
              def: t => { const am = t.s < 13 * 60, ids = [1, 2, 3, 4, 5, 6, 7, 10, 11, 13, 14, 15], on = am ? [1, 2, 3, 4, 5, 6] : [7, 10, 11, 13, 14, 15];
                  return ids.map((n, i) => ({ i, w: on.includes(n) ? 'on' : 'off' })).filter(x => !am || on.includes(ids[x.i])); },
              units: [1, 2, 3, 4, 5, 6, 7, 10, 11, 13, 14, 15].map(n => U('송도 신도시(요기요) ' + n + '호기', { m: ['송도신도시(요기요)' + n + '호기', '송도신도시요기요' + n + '호기'] })) },
            // 역삼요기요(109): 오전(09:30~10:00) 3·4·12호기 ON / 오후(15:30~16:00) 3·4·12호기 OFF + 6·7·9호기 ON. 기체가 앞쪽 시간에 맞춰 준비되므로 점검은 '시작' 시각 +1분(at:'start')
            { k: '역삼요기요', id: 109, kw: /역삼/, plan: 'front',
              def: t => { const am = t.s < 13 * 60, ids = [3, 4, 12, 6, 7, 9], on = am ? [3, 4, 12] : [6, 7, 9];
                  return ids.map((n, i) => ({ i, w: on.includes(n) ? 'on' : 'off' })).filter(x => !am || on.includes(ids[x.i])); },
              units: [3, 4, 12, 6, 7, 9].map(n => U('역삼동 (요기요) ' + n + '호기', { m: ['역삼동(요기요)' + n + '호기', '역삼동요기요' + n + '호기'] })) },
            // 성남 삼평동 '임무 ON/OFF' 업무(예: [삼평동,서현동] 출근 체크 후 임무 ON): 1·7·8호기가 문구의 ON/OFF 와 같아야 통과 (같은 주소 44)
            { k: '성남 삼평동 임무', id: 44, kw: /삼평동/, units: [1, 7, 8].map(n => U('성남형 로봇배달 삼평동 ' + n + '호기', { m: ['성남형로봇배달삼평동' + n + '호기', '삼평동' + n + '호기'] })) },
        ];

        // ───────── 무선충전 기체 주차 상태(충전중 ⚡) 확인 ─────────
        // 업무 문구에 '무선충전 기체 주차 상태'가 있으면 아래 모든 사이트의 기체를 점검한다. 통과 조건: 로봇 전원 '켜짐' + 배터리 수치 + 번개(⚡) 표시.
        //  · 전원 꺼짐 → 제외 · 해당 주소에 기체 카드가 하나도 없음 → '입고됨'으로 보고 제외 · 다중 모니터링에서 순찰 중인 기체 → 제외
        //  · any:true 인 주소는 기체 중 하나라도 켜짐+충전 확인이면 통과
        const CHG_RE = /무선\s*충전\s*기체\s*주차\s*상태/;
        const CHG_EMPTY_MS = 12 * 1000;   // 기체 목록 틀은 보이는데 카드가 하나도 없는 채로 이 시간이 지나면 '입고됨'
        const CHG_SRC = [
            [178, ['강남 래미안블레스티지 1호기']], [132, ['경희대학교 국제캠퍼스 1호기', '경희대학교 국제캠퍼스 2호기']], [117, ['고양 래미안 휴레스트 1호기']],
            [224, ['동대문구회기동 1호기(쉴드플러스)']], [216, ['동백SK아펠바움 1차1호기']], [235, ['두루아이 3호기']], [230, ['더샵남천프레스티지 1호기']],
            [151, ['부산 EDC 수자인 1호기', '부산 EDC 수자인 2호기']], [150, ['부산 EDC 호반써밋 1호기', '부산 EDC 호반써밋 2호기']], [138, ['서강대학교 1호기']],
            [145, ['성남시 서현역 1호기']], [143, ['성남시 야탑역 1호기']], [144, ['성남시 율동공원 1호기']], [142, ['성남시 판교역 1호기']],
            [134, ['롯데마트부산CFC(쉴더스) 1호기']], [146, ['신동백 롯데캐슬 에코1단지 1호기']], [111, ['인재개발원 1호기'], false, true], [181, ['잠실 레이크팰리스 1호기']],
            [187, ['잠실 르엘 1호기']], [182, ['전주시 전주천 1호기']], [240, ['전주천(덕진구) 1호기']], [193, ['창원대학교 1호기', '창원대학교 2호기']],
            [177, ['청담르엘 1호기']], [57, ['파주 디에트르더클래스 1호기']], [137, ['한국장애인고용공단 1호기', '한국장애인고용공단 2호기']], [179, ['한성대학교 1호기']],
            [202, ['중앙대학교 1호기', '두루아이 5호기']], [246, ['서울 양원 LH 1단지 1호기']], [244, ['덕수궁 1호기']], [245, ['순천향대학교 1호기']],
            [247, ['수원센트럴 1호기', '수원센트럴 2호기']], [252, ['강동현대홈타운 1호기']], [267, ['두루아이 4호기']],
            [261, ['수원 힐스테이트푸르지오 1호기', '수원 힐스테이트푸르지오 2호기']], [258, ['더샵지제역센트럴파크 1호기', '더샵지제역센트럴파크 2호기']], [250, ['트리니원 1호기', '트리니원 2호기']],
        ];
        const CHG_SITES = CHG_SRC.map(([id, names, any, batOnly]) => ({ k: '충전 ' + id, id, chg: true, any: !!any, batOnly: !!batOnly, label: names[0].replace(/\s*\d+호기.*$/, ''), kw: /(?!)/, units: names.map(n => U(n)) }));
        CHG_SITES.forEach(S => AUTO_SITES.push(S));

        // ───────── 스타일 ─────────
        const st = document.createElement('style');
        st.id = 'bba-style';
        st.textContent = `
        #bb { width:1200px; height:1300px; max-height:none; overflow:hidden; }
        /* 기존 기체 리스트 본문: 화면 밖에 치워 두되 레이아웃은 유지(로직이 크기를 재는 경우 대비) */
        #bb .bb-body { position:absolute; left:-40000px; top:0; width:1100px; height:760px; visibility:hidden; pointer-events:none; }
        /* 헤더: 동숲/아토/고정 버튼 제외, 알림 칩 · 임무받기 · 제목 · 우측 버튼만 */
        #bb .bb-hd { min-height:0; padding:4px 14px 2px; flex:0 0 auto; }
        #bb #bb-walker-wrap-l, #bb #bb-walker-wrap-l2, #bb #bb-walker-wrap, #bb #bb-walker-wrap-r2 { display:none !important; }
        #bb .bb-hd .bb-alert-zone { left:14px; width:420px; top:4px; transform:none; max-height:62px; overflow-y:auto; }   /* 2줄까지 보이고 그 이상은 스크롤 */
        #bb #bb-mw { display:none !important; }   /* 아산 스테이그린 임무받기 카드는 admin 에서 숨김 */
        #bb .bba-root { position:relative; flex:1 1 0; min-height:0; display:flex; flex-direction:column; gap:6px; padding:0 14px 12px; }
        #bb .bba-bar { flex:0 0 auto; display:flex; align-items:center; gap:8px; }
        #bb .bb-hd { position:relative; }
        #bb .bba-bar.inhd { position:absolute; left:14px; top:50%; transform:translateY(-50%); z-index:3; gap:6px; }
        #bb .bba-bar.inhd .bba-note { display:none; }   /* '업무표 갱신' 문구는 제목 줄에서 숨김 (업무표 머리글에 이미 표시) */
        #bb .bba-bar.inhd .bba-dbtn { height:auto; min-height:40px; padding:3px 8px; font-size:calc(17px * var(--bb-ts, 1)); }
        #bb .bba-dbtn { flex-direction:column; justify-content:center; gap:0 !important; line-height:1.25; }
        #bb .bba-dbtn .l1 { display:inline-flex; align-items:center; gap:7px; }
        #bb .bba-dbtn .l2 { font-size:calc(15.5px * var(--bb-ts, 1)); font-weight:800 !important; opacity:.85; letter-spacing:.2px; }
        #bb .bba-dbtn .l2.warn { color:#d93a35; opacity:1; }
        #bb .bba-dbtn.on .l2.warn { color:#ffb4b0; }
        #bb .bba-hdr2 { position:absolute; left:calc(50% + 118px); top:50%; transform:translateY(-50%); display:flex; flex-direction:column; align-items:stretch; gap:3px; z-index:3; }   /* 글자가 커져도 오른쪽 줌 버튼과 겹치지 않게 세로로 쌓음 */
        #bb .bba-hdr2 .bba-mmb { margin:0; height:27px; padding:0 8px; font-size:calc(16px * var(--bb-ts, 1)); }   /* 글자를 키워도 오른쪽 줌 버튼과 겹치지 않게 */
        #bb .bba-mmb.sim { border-color:#9db4ff; }
        #bb #bba-sim { position:absolute; left:14px; right:14px; top:6px; bottom:12px; z-index:32; display:none; flex-direction:column; min-height:0; box-sizing:border-box; padding:10px 12px 12px; background:var(--bg); border:2px solid var(--bd2); border-radius:12px; box-shadow:0 10px 28px rgba(0,0,0,.35); }
        #bb #bba-sim.open { display:flex; }
        #bb #bba-sim .mh { display:flex; align-items:center; gap:8px; margin-bottom:4px; flex-wrap:wrap; }
        #bb #bba-sim .mh b { font-size:calc(18px * var(--bb-ts, 1)); font-weight:700 !important; }
        #bb #bba-sim .mh .sp { margin-left:auto; display:flex; gap:6px; align-items:center; }
        #bb #bba-sim .meta { font-size:calc(14px * var(--bb-ts, 1)); color:var(--mu); margin-bottom:6px; line-height:1.45; }
        #bb #bba-sim .meta.sum { margin-top:-2px; padding:4px 9px; border-radius:8px; background:var(--sur2); border:1.5px solid var(--bd2); color:var(--tx); }
        #bb #bba-sim .meta b { color:var(--tx); font-weight:700 !important; }
        #bb #bba-sim .meta .warn { color:var(--rd); font-weight:700 !important; }
        #bb #bba-sim .sb { flex:1; min-height:0; display:grid; grid-template-columns:minmax(200px,.28fr) minmax(0,1fr); gap:10px; }
        #bb #bba-sim .col { min-height:0; overflow:auto; border:1.5px solid var(--bd2); border-radius:10px; background:var(--sur); }
        #bb #bba-sim .gh { position:sticky; top:0; z-index:2; display:grid; gap:8px; padding:5px 8px; background:var(--sur2); border-bottom:2px solid var(--bd2); font-size:calc(14px * var(--bb-ts, 1)); font-weight:700 !important; color:var(--mu); }
        #bb #bba-sim .gr { display:grid; gap:8px; align-items:center; padding:2px 8px; min-height:26px; border-bottom:1px solid var(--bd); }
        #bb #bba-sim .c1 .gh, #bb #bba-sim .c1 .gr { grid-template-columns:50px minmax(0,1fr) minmax(0,1fr); }
        #bb #bba-sim .c2 .gh, #bb #bba-sim .c2 .gr { grid-template-columns:112px minmax(0,1fr) minmax(150px,.62fr); }
        #bb #bba-sim .tm { font-size:calc(14.5px * var(--bb-ts, 1)); font-weight:700 !important; color:var(--mu); font-variant-numeric:tabular-nums; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        #bb #bba-sim .tk { font-size:calc(14.5px * var(--bb-ts, 1)); min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        #bb #bba-sim .nm { height:22px; border-radius:6px; display:grid; place-items:center; font-weight:600 !important; font-size:calc(14.5px * var(--bb-ts, 1)); color:#1e1a12; background:hsl(var(--h) 58% var(--l,84%)); white-space:nowrap; overflow:hidden; padding:0 6px; }
        #bb #bba-sim .nm.none { background:var(--sur2); color:var(--mu); border:1px dashed var(--bd2); }
        #bb #bba-sim .em { color:var(--mu); font-size:calc(14px * var(--bb-ts, 1)); text-align:center; }
        #bb #bba-sim .gr.chg { background:#e3eeff; }
        #bb #bba-sim .gr.chg .nm { box-shadow:0 0 0 2px #3b82f6; }
        #bb #bba-sim .asg { display:flex; align-items:center; gap:6px; min-width:0; }
        #bb #bba-sim .asg .nm { flex:0 0 auto; min-width:60px; }
        #bb #bba-sim .asg .was { font-size:calc(13px * var(--bb-ts, 1)); color:#2a5db0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; }
        #bb #bba-sim .gr.fx { opacity:.6; }
        #bb #bba-sim .cpm { margin-bottom:6px; padding:5px 9px; border-radius:8px; background:#e3f6e6; border:1.5px solid #5cb96b; color:#1d4a26; font-size:calc(14px * var(--bb-ts, 1)); line-height:1.45; }
        #bb #bba-sim .cpm b { font-weight:700 !important; }
        #bb #bba-sim .cpm .warn { color:var(--rd); font-weight:700 !important; }
        #bb #bba-sim .cpm textarea { display:block; width:100%; box-sizing:border-box; margin-top:4px; font-size:calc(14px * var(--bb-ts, 1)); line-height:1.4; font-family:inherit; }
        #bb #bba-sim .foot { margin-top:6px; font-size:calc(13.5px * var(--bb-ts, 1)); color:var(--mu); }
        #bb #bba-sim .seg2 { display:inline-flex; border:1.5px solid var(--bd2); border-radius:8px; overflow:hidden; }
        #bb #bba-sim .seg2 button { height:26px; padding:0 10px; border:0; background:var(--sur2); color:var(--mu); font-family:inherit; font-size:calc(14px * var(--bb-ts, 1)); font-weight:700 !important; cursor:pointer; }
        #bb #bba-sim .seg2 button.on { background:var(--tx); color:var(--sur); }
        #bb .bba-root.hdbar #bba-dr, #bb .bba-root.hdbar #bba-mmp { top:6px; }
        #bb .bba-dbtn { height:32px; padding:0 14px; border-radius:9px; border:2px solid var(--bd2); background:var(--sur2); color:var(--tx); font-family:inherit; font-size:calc(16px * var(--bb-ts, 1)); cursor:pointer; display:inline-flex; align-items:center; gap:7px; font-weight:700 !important; }
        #bb .bba-dbtn:hover { border-color:var(--mu); }
        #bb .bba-dbtn[data-k="dl"] { border-color:#ff7ab8; } #bb .bba-dbtn[data-k="iv"] { border-color:#8fb6ff; } #bb .bba-dbtn[data-k="at"] { border-color:#f0c36a; }
        #bb .bba-dbtn.on { background:var(--tx); color:var(--sur); }
        #bb .bba-dbtn .n { min-width:22px; height:18px; padding:0 6px; border-radius:9px; background:rgba(0,0,0,.12); font-size:calc(13.5px * var(--bb-ts, 1)); line-height:18px; text-align:center; }
        #bb .bba-dbtn.on .n { background:rgba(255,255,255,.25); }
        #bb .bba-dbtn .n.hot { background:#d93a35; color:#fff; }
        #bb .bba-dbtn .ar { font-size:calc(12px * var(--bb-ts, 1)); }
        #bb .bba-note { margin-left:auto; font-size:calc(14px * var(--bb-ts, 1)); color:var(--mu); }
        #bb .bba-mmb { margin-left:auto; height:28px; padding:0 12px; border-radius:9px; border:2px solid #8fd6c0; background:var(--sur2); color:var(--tx); font-family:inherit; font-size:calc(15px * var(--bb-ts, 1)); font-weight:700 !important; cursor:pointer; } #bb .bba-mmb.on { background:var(--tx); color:var(--sur); }
        #bb .bba-mmb + .bba-note { margin-left:4px; }
        /* 다중·서브·과학관 근무자 (보드 오른쪽 절반을 덮는 오버레이) */
        #bb #bba-mmp { position:absolute; right:14px; width:calc(50% - 18px); top:40px; bottom:12px; z-index:31; display:none; flex-direction:column; min-height:0; box-sizing:border-box; padding:10px 12px 12px; background:var(--bg); border:2px solid var(--bd2); border-radius:12px; box-shadow:0 10px 28px rgba(0,0,0,.35); }
        #bb #bba-mmp.open { display:flex; }
        #bb #bba-mmp .mh { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
        #bb #bba-mmp .mh b { font-size:calc(18px * var(--bb-ts, 1)); font-weight:700 !important; }
        #bb #bba-mmp .mh .sp { margin-left:auto; font-size:calc(13.5px * var(--bb-ts, 1)); color:var(--mu); }
        #bb #bba-mmp .mx { width:26px; height:26px; border-radius:7px; border:1.5px solid var(--bd2); background:var(--sur2); color:var(--tx); cursor:pointer; font-family:inherit; line-height:1; }
        #bb #bba-mmp .mb { position:relative; flex:1; min-height:0; overflow:auto; border:1.5px solid var(--bd2); border-radius:10px; background:var(--sur); }
        #bb #bba-mmp .mg { display:grid; grid-template-columns:62px minmax(0,1fr) minmax(0,1fr) 12px minmax(0,1.35fr); grid-template-rows:auto repeat(24, minmax(24px, 1fr)); align-items:stretch; min-height:100%; }   /* 24개 시간대가 패널 높이에 맞춰 나눠 가짐 → 위아래 스크롤 없음 */
        #bb #bba-mmp .mg > div { padding:2px 7px; border-bottom:1px solid var(--bd); display:flex; flex-direction:column; justify-content:center; gap:2px; min-width:0; }
        #bb #bba-mmp .mg .hd { padding-top:4px; padding-bottom:4px; position:sticky; top:0; z-index:2; background:var(--sur2); font-size:calc(14px * var(--bb-ts, 1)); font-weight:700 !important; color:var(--mu); text-align:center; border-bottom:2px solid var(--bd2); align-items:center; }
        #bb #bba-mmp .mg .hd.mc { background:#dff3ee; color:#1c6a57; } #bb #bba-mmp .mg .hd.sc { background:#e7e9fb; color:#3b3f96; }
        #bb #bba-mmp .mg .tm { font-size:calc(15px * var(--bb-ts, 1)); font-weight:700 !important; color:var(--mu); text-align:center; font-variant-numeric:tabular-nums; }
        #bb #bba-mmp .mg .gap { padding:0; border-bottom:none; background:var(--bg); }
        #bb #bba-mmp .mg .cur { background:#fff3c4; } #bb #bba-mmp .mg .cur.tm { color:#8a5a00; }
        #bb #bba-mmp .mg .past { opacity:.55; }
        #bb #bba-mmp .mg .nm { height:20px; border-radius:6px; display:grid; place-items:center; font-weight:700 !important; font-size:calc(15px * var(--bb-ts, 1)); color:#1e1a12; background:hsl(var(--h) 58% var(--l,84%)); white-space:nowrap; overflow:hidden; }
        #bb #bba-mmp .mg .nm.none { background:var(--sur2); color:var(--mu); border:1px dashed var(--bd2); }
        #bb #bba-mmp .mg .sci { display:flex; align-items:center; gap:5px; min-width:0; }
        #bb #bba-mmp .mg .sci .nm { flex:1 1 0; min-width:0; padding:0 6px; }   /* 담당자가 여럿이면 한 줄에 나란히 (행 높이 = 다중/서브와 동일) */
        #bb #bba-mmp .mg .sci .tx { font-size:calc(13.5px * var(--bb-ts, 1)); color:var(--mu); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; }
        #bb #bba-mmp .mg .em { color:var(--mu); text-align:center; font-size:calc(14px * var(--bb-ts, 1)); }
        /* 펼침 영역 */
        /* 펼침 그리드: 버튼 줄 아래 보드 전체(좌우 끝~하단)를 덮는 오버레이 */
        #bb #bba-dr { position:absolute; left:14px; width:calc(50% - 18px); top:40px; bottom:12px; z-index:30; display:flex; gap:10px; min-height:0; padding:8px; background:var(--bg); border:2px solid var(--bd2); border-radius:10px; box-shadow:0 10px 28px rgba(0,0,0,.35); box-sizing:border-box; }
        #bb #bba-dr.none { display:none; }
        #bb #bba-dr > .bba-p, #bb #bba-mmw > .bba-p {
            flex:1 1 0; width:auto; min-width:0; height:100%; position:relative; inset:auto; z-index:auto; display:flex !important; flex-direction:column;
            transform:none !important; visibility:visible !important; transition:none;
            border:2px solid var(--bd2); border-radius:8px; background:color-mix(in srgb, var(--bg) 60%, transparent); overflow:hidden;
        }
        #bb #bba-dr > .bba-off { display:none !important; }
        #bb #bba-mmw { min-height:0; display:flex; }
        /* 공통 구역 */
        #bb .bba-zone { border:2px solid var(--bd2); border-radius:8px; background:var(--sur); display:flex; flex-direction:column; min-height:0; min-width:0; }
        #bb .bba-zh { display:flex; align-items:center; gap:8px; padding:6px 10px; border-bottom:1px solid var(--bd); flex:0 0 auto; flex-wrap:wrap; }
        #bb .bba-zh h2 { margin:0; font-size:calc(17px * var(--bb-ts, 1)); margin-right:auto; font-weight:700 !important; color:var(--tx); }
        #bb .bba-tasks .bba-zh { flex-wrap:nowrap; }   /* 일일 업무표 헤더는 항상 한 줄 — 긴 글자는 … 로 줄인다 */
        #bb .bba-tasks .bba-zh > * { flex:0 0 auto; }
        #bb .bba-tasks .bba-zh #bba-wd { flex:0 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        #bb .bba-tasks .bba-zh .bba-pill.au { display:block; flex:0 1 auto; min-width:60px; max-width:210px; line-height:24px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        #bb .bba-zb { overflow:auto; min-height:0; flex:1; }
        #bb .bba-cnt { font-size:calc(14px * var(--bb-ts, 1)); color:var(--mu); font-weight:700 !important; }
        #bb .bba-pill { display:inline-flex; align-items:center; height:26px; padding:0 10px; border-radius:999px; border:1px solid var(--bd2); background:var(--sur2); font-size:calc(14px * var(--bb-ts, 1)); font-weight:700 !important; white-space:nowrap; color:var(--tx); }
        #bb .bba-pill.late { border-color:var(--rd); color:var(--rd); }
        #bb .bba-btn { height:26px; padding:0 10px; border-radius:8px; border:1.5px solid var(--bd2); background:var(--sur2); color:var(--tx); font-family:inherit; font-size:calc(14px * var(--bb-ts, 1)); font-weight:700 !important; cursor:pointer; white-space:nowrap; }
        #bb .bba-btn:hover { border-color:var(--mu); }
        #bb .bba-btn.on { background:var(--tx); color:var(--sur); border-color:var(--tx); }
        #bb .bba-top { flex:0.25 0 372px; display:flex; gap:8px; min-height:0; }   /* 제목줄 + 헤더 + 10줄 */
        #bb .bba-top > .bba-tasks { flex:1 1 0; min-width:0; }   /* 업무표를 좁혀서 '당일배정 현황' 열을 좌측으로 당김 */
        #bb .bba-top > .bba-campz { flex:0 0 20.7%; min-width:0; }   /* 남은 우측 빈 공간 = 사이트 점검 */
        #bb .bba-bottom { flex:1 1 0; min-height:150px; display:grid; grid-template-columns:minmax(0,5fr) minmax(0,6fr); gap:8px; }
        /* 업무표 */
        #bb .bba-th, #bb .bba-row { display:grid; grid-template-columns:28px minmax(0,1fr) 120px; gap:8px; align-items:center; padding:0 10px; }
        #bb .bba-th { position:sticky; top:0; z-index:2; background:var(--sur2); border-bottom:1px solid var(--bd); height:26px; font-size:calc(15px * var(--bb-ts, 1)); color:var(--mu); }
        #bb .bba-th span:last-child { text-align:center; }
        #bb .bba-row { min-height:30px; border-bottom:1px solid var(--bd); position:relative; }
        #bb .bba-row:hover { background:var(--sur2); }
        #bb .bba-row.cur { background:#fff3b5; }
        #bb .bba-row.late::before { content:""; position:absolute; left:0; top:0; bottom:0; width:4px; background:var(--rd); }
        #bb .bba-chk { padding:0; cursor:pointer; font-family:inherit; width:22px; height:22px; border-radius:6px; border:2px solid var(--bd2); background:var(--sur); display:grid; place-items:center; font-size:calc(16px * var(--bb-ts, 1)); line-height:1; color:transparent; }
        #bb .bba-row.done .bba-chk { background:#22a05a; border-color:#22a05a; color:#fff; }
        #bb .bba-txt { min-width:0; padding:4px 0; line-height:1.35; font-size:calc(16.5px * var(--bb-ts, 1)); color:var(--tx); }
        #bb .bba-txt .tm { color:var(--mu); font-variant-numeric:tabular-nums; }
        #bb .bba-txt .tag { color:var(--mu); font-size:calc(15px * var(--bb-ts, 1)); }
        #bb .bba-row.done .bba-txt { text-decoration:line-through; text-decoration-thickness:1.5px; color:var(--mu); }
        #bb .bba-txt .meta { font-size:calc(14px * var(--bb-ts, 1)); font-weight:700 !important; margin-left:6px; color:var(--rd); }
        #bb .bba-row.done .bba-txt .meta { color:#22a05a; }
        /* 임무 ON/OFF 자동 점검 표시 */
        #bb .bba-row.done.manfail .bba-chk { background:#f2b705; border-color:#d49b00; color:#fff; }
        #bb .bba-row.done.manfail .bba-txt .meta { color:#b07a00; }
        #bb .bba-row.done.byauto .bba-chk { box-shadow:0 0 0 2px #bfe8cf; }
        #bb .bba-row.bad .bba-chk { background:#d93a35; border-color:#d93a35; color:#fff; font-size:calc(17px * var(--bb-ts, 1)); }
        #bb .bba-row.bad { background:#fdecea; }
        #bb .bba-row.bad.cur { background:#fff3b5; }
        #bb .bba-row.bad .bba-txt .meta { color:#d93a35; }
        #bb .bba-row.retry .bba-chk { border-color:#d98a1c; color:#d98a1c; font-size:calc(17px * var(--bb-ts, 1)); }
        #bb .bba-row.retry .bba-txt .meta { color:#c97a10; }
        #bb .bba-row.run .bba-chk { border-color:#3b82f6; color:#3b82f6; font-size:calc(17px * var(--bb-ts, 1)); animation:bbaPulse 1s ease-in-out infinite; }
        #bb .bba-row.run .bba-txt .meta { color:#2563eb; }
        #bb .bba-row.sup .bba-chk { color:var(--mu); font-size:calc(17px * var(--bb-ts, 1)); }
        #bb .bba-row.sup .bba-txt .meta { color:var(--mu); }
        #bb .bba-row .meta.sch { color:var(--mu); font-weight:450 !important; }
        @keyframes bbaPulse { 50% { opacity:.35; } }
        #bb .bba-row.auto { user-select:none; -webkit-user-select:none; }
        #bb .bba-row .ach { display:inline-block; margin-left:5px; font-size:calc(14px * var(--bb-ts, 1)); line-height:1; padding:1px 4px; border-radius:6px; background:#e6efe1; color:#2c6b3f; cursor:help; }
        #bb .bba-row .ach.cfg { background:#fde9c8; color:#8a5a0a; }
        #bb .bba-row .ach.off { background:var(--sur2); color:var(--mu); }
        #bb .bba-row.dim { opacity:.4; }
        #bb .bba-row.dim:hover { background:transparent; }
        #bb .bba-row.dim .bba-who { filter:grayscale(.6); }
        #bb .bba-pill.bad { border-color:#d93a35; color:#d93a35; }
        #bb .bba-pill.au { cursor:pointer; max-width:230px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        #bb .bba-pill.au.off { color:var(--mu); border-style:dashed; }
        #bb .bba-pill.au.run { border-color:#3b82f6; color:#2563eb; }
        #bb #bba-ap { position:absolute; z-index:40; width:372px; box-sizing:border-box; padding:10px 12px 12px; border-radius:12px; border:2px solid var(--bd2); background:var(--sur); box-shadow:0 8px 26px rgba(40,30,10,.32); font-size:calc(15px * var(--bb-ts, 1)); color:var(--tx); display:none; }
        #bb #bba-ap.open { display:block; }
        #bb #bba-btcfg { position:absolute; z-index:41; width:372px; box-sizing:border-box; padding:10px 12px 12px; border-radius:12px; border:2px solid var(--bd2); background:var(--sur); box-shadow:0 8px 26px rgba(40,30,10,.32); font-size:calc(15px * var(--bb-ts, 1)); color:var(--tx); display:none; }
        #bb #bba-btcfg.open { display:block; }
        #bb #bba-btcfg .ph { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
        #bb #bba-btcfg .ph b { flex:1; font-size:calc(16px * var(--bb-ts, 1)); font-weight:700 !important; }
        #bb #bba-btcfg .px { width:24px; height:24px; border-radius:6px; border:1.5px solid var(--bd2); background:var(--sur2); color:var(--tx); cursor:pointer; font-family:inherit; line-height:1; }
        #bb #bba-btcfg .ul { max-height:300px; overflow:auto; margin-top:4px; padding:2px 4px; border:1px solid var(--bd); border-radius:8px; }
        #bb #bba-btcfg label { display:flex; align-items:center; gap:7px; min-height:28px; cursor:pointer; }
        #bb #bba-btcfg .u { padding:0 2px; border-radius:6px; }
        #bb #bba-btcfg .u:hover { background:var(--sur2); }
        #bb #bba-btcfg .u.dis { color:var(--mu); }
        #bb #bba-btcfg .u .nm { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        #bb #bba-btcfg .tm { margin-top:8px; color:var(--mu); font-size:calc(14px * var(--bb-ts, 1)); line-height:1.45; }
        #bb #bba-btcfg .pb { display:flex; gap:6px; margin-top:8px; justify-content:flex-end; }
        #bb #bba-ap.wide { width:560px; }
        #bb #bba-ap .ul { max-height:210px; overflow:auto; margin-top:4px; padding:2px 4px; border:1px solid var(--bd); border-radius:8px; }
        #bb #bba-ap.wide .rs { max-height:260px; }
        #bb #bba-ap .rs div > b { font-weight:700 !important; display:inline-block; margin-top:5px; }
        #bb #bba-ap .ph { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
        #bb #bba-ap .ph b { flex:1; font-size:calc(16px * var(--bb-ts, 1)); font-weight:700 !important; }
        #bb #bba-ap .px { width:24px; height:24px; border-radius:6px; border:1.5px solid var(--bd2); background:var(--sur2); color:var(--tx); cursor:pointer; font-family:inherit; line-height:1; }
        #bb #bba-ap .pt { color:var(--mu); font-size:calc(14px * var(--bb-ts, 1)); line-height:1.4; margin-bottom:8px; max-height:34px; overflow:hidden; }
        #bb #bba-ap .sh { margin:8px 0 3px; font-size:calc(14px * var(--bb-ts, 1)); font-weight:700 !important; color:#2c6b3f; }
        #bb #bba-ap label { display:flex; align-items:center; gap:7px; min-height:28px; cursor:pointer; }
        #bb #bba-ap .u { padding:0 2px; border-radius:6px; }
        #bb #bba-ap .u:hover { background:var(--sur2); }
        #bb #bba-ap .u .nm { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        #bb #bba-ap .seg { display:inline-flex; border:1.5px solid var(--bd2); border-radius:7px; overflow:hidden; }
        #bb #bba-ap .seg button { border:0; background:var(--sur2); color:var(--mu); font-family:inherit; font-size:calc(14px * var(--bb-ts, 1)); font-weight:700 !important; padding:2px 10px; cursor:pointer; }
        #bb #bba-ap .seg button.on[data-w="on"] { background:#22a05a; color:#fff; }
        #bb #bba-ap .seg button.on[data-w="off"] { background:#d93a35; color:#fff; }
        #bb #bba-ap .u.dis .seg { opacity:.45; }
        #bb #bba-ap .seg button.on.run { background:#3b82f6; color:#fff; cursor:default; }
        #bb #bba-ap .lgt { display:flex; gap:4px; flex-wrap:wrap; margin-bottom:6px; }
        #bb #bba-ap .lgt button { height:24px; padding:0 8px; border-radius:7px; border:1.5px solid var(--bd2); background:var(--sur); color:var(--mu); font-family:inherit; font-size:calc(13.5px * var(--bb-ts, 1)); font-weight:700 !important; cursor:pointer; }
        #bb #bba-ap .lgt button.on { background:var(--tx); color:var(--sur); border-color:var(--tx); }
        #bb #bba-ap .pb .cf { font-size:calc(14.5px * var(--bb-ts, 1)); font-weight:700 !important; margin-right:auto; align-self:center; }
        #bb #bba-ap .tm { margin-top:8px; color:var(--mu); font-size:calc(14px * var(--bb-ts, 1)); line-height:1.45; }
        #bb #bba-ap .rs { margin-top:6px; padding:6px 8px; border-radius:8px; background:var(--sur2); font-size:calc(14px * var(--bb-ts, 1)); line-height:1.5; max-height:150px; overflow:auto; }
        #bb #bba-ap .rs .g { color:#22a05a; } #bb #bba-ap .rs .r { color:#d93a35; } #bb #bba-ap .rs .m { color:var(--mu); }
        #bb #bba-ap .pb { display:flex; gap:6px; margin-top:8px; justify-content:flex-end; }
        #bb .bba-who { height:26px; border-radius:6px; display:grid; place-items:center; font-weight:600 !important; font-size:calc(16px * var(--bb-ts, 1)); color:#1e1a12; background:hsl(var(--h) 58% var(--l,84%)); white-space:nowrap; overflow:hidden; }
        #bb .bba-empty { padding:24px 10px; text-align:center; color:var(--mu); }
        /* 우측 구역 */
        #bb .bba-right { display:grid; grid-template-rows:minmax(0,1fr); gap:8px; min-height:0; min-width:0; }
        #bb .bba-camp { display:flex; flex-wrap:wrap; gap:6px; padding:8px 10px; }
        #bb .bba-cb { display:inline-flex; align-items:center; gap:6px; height:28px; padding:0 11px 0 8px; border-radius:999px; border:1.5px solid var(--bd2); background:var(--sur2); color:var(--tx); font-family:inherit; font-size:calc(14.5px * var(--bb-ts, 1)); font-weight:700 !important; cursor:pointer; }
        #bb .bba-cb i { width:16px; height:16px; border-radius:5px; border:2px solid var(--bd2); background:var(--sur); display:grid; place-items:center; font-style:normal; font-size:calc(13px * var(--bb-ts, 1)); line-height:1; color:transparent; }
        #bb .bba-cb.on { background:#d6f5e3; border-color:#8fd3ac; color:#14532d; }
        #bb .bba-cb.on i { background:#22a05a; border-color:#22a05a; color:#fff; }
        #bb .bba-cb .cn { display:flex; flex-direction:column; align-items:flex-start; line-height:1.15; min-width:0; }
        #bb .bba-cb .n1 { white-space:nowrap; }
        #bb .bba-cb .t { font-size:calc(11.5px * var(--bb-ts, 1)); font-weight:400 !important; white-space:nowrap; opacity:.85; }
        #bb .bba-cb.two { height:auto; min-height:28px; padding:3px 12px 3px 8px; border-radius:15px; }
        #bb .bba-cb.bad { background:#fdecea; border-color:#e8a29f; color:#9b1c18; }
        #bb .bba-cb.bad i { background:#d93a35; border-color:#d93a35; color:#fff; font-size:calc(12px * var(--bb-ts, 1)); }
        #bb .bba-cb.manfail { background:#fff4c2; border-color:#e6c04a; color:#6b4f00; }
        #bb .bba-cb.manfail i { background:#f2b705; border-color:#d49b00; color:#fff; }
        #bb .bba-cb.run { border-style:dashed; color:var(--mu); }
        #bb .bba-cb.run i { color:var(--mu); }
        #bb .bba-btz { min-height:0; position:relative; }
        #bb .bba-pill:empty { display:none !important; }
        #bb .bba-btz .bba-zh { flex-wrap:nowrap; }
        #bb .bba-btz .bba-zh > * { flex:0 0 auto; }
        #bb .bba-btz .bba-cnt { flex:0 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        #bb .bba-btz .bba-pill { display:block; max-width:190px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; line-height:24px; }
        #bb #bba-bt-gh.bad { color:var(--rd); border-color:var(--rd); }
        #bb .bba-btg { flex:1; min-height:0; overflow-y:auto; display:grid; grid-template-columns:1fr 1fr; grid-auto-rows:32px; gap:5px 6px; padding:8px 10px; align-content:start; }
        #bb .bba-btg .bt { position:relative; display:flex; align-items:center; gap:0; height:32px; padding:0 9px; border-radius:8px; border:1.5px solid var(--row-bd, var(--bd)); background:var(--sur); overflow:hidden; min-width:0; box-sizing:border-box; font-size:calc(15px * var(--bb-ts, 1)); font-weight:700; color:var(--tx); }
        #bb .bba-btg .bt i { position:absolute; left:0; top:0; bottom:0; opacity:.35; background:var(--gn); box-shadow:inset -2px 0 0 var(--gn); }
        #bb .bba-btg .bt .nm { position:relative; flex:0 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        #bb .bba-btg .bt .sp { position:relative; flex:0 0 auto; white-space:pre; color:var(--mu); font-weight:500; }
        #bb .bba-btg .bt .v { position:relative; flex:0 0 auto; white-space:nowrap; font-weight:900; font-family:'Paperlogy','Lato',sans-serif; }
        #bb .bba-btg .bt.low { border-color:var(--rd); animation:bb-warnBlink .8s infinite; }
        #bb .bba-btg .bt.low i { background:var(--rd); box-shadow:inset -2px 0 0 var(--rd); }
        #bb .bba-btg .bt.low .v { color:#dc2626; }
        #bb .bba-btg .bt.zb { background:rgba(249,115,22,.12); border:2px solid rgba(249,115,22,.55); color:var(--or); animation:chipPulse .7s infinite, chipBorder .7s infinite; }
        #bb .bba-btg .bt.off, #bb .bba-btg .bt.in, #bb .bba-btg .bt.wait { color:var(--mu); }
        #bb .bba-btg .bt.off .v { color:var(--off-main); }
        #bb .bba-btg .bt.unk { border-style:dashed; color:var(--mu); }
        #bb .bba-btg .bt { cursor:pointer; }
        #bb .bba-btg .bt.over { border-color:var(--bl); box-shadow:0 0 0 2px var(--bl); }
        #bb .bba-btg .bt.now { box-shadow:0 0 0 2px var(--bl); }
        #bb .bba-memo { display:flex; flex-direction:column; flex:1; min-height:0; padding:8px 10px; gap:4px; }
        #bb .bba-memo textarea { flex:1; min-height:0; resize:none; border:1.5px solid var(--bd2); border-radius:8px; background:var(--sur2); color:var(--tx); padding:8px 10px; line-height:1.5; font-family:inherit; font-size:calc(15.5px * var(--bb-ts, 1)); box-sizing:border-box; }
        #bb .bba-memo textarea:focus { outline:2px solid #3b82f6; outline-offset:1px; }
        #bb .bba-memo .sv { font-size:calc(13px * var(--bb-ts, 1)); color:var(--mu); min-height:14px; }
        /* 순찰 일정 (다중 모니터링 제목 우측 버튼 + 카드형 일정) */
        #bb #bb-mm-page-multi .bb-mm-head { padding:5px 112px 4px; text-align:center; }
        #bb #bb-mm-page-multi .bb-mm-title, #bb #bb-mm-page-multi .bb-mm-sub { text-align:center; }
        #bb .bba-sbtn { position:absolute; right:8px; top:50%; transform:translateY(-50%); height:30px; padding:0 12px; border-radius:8px; border:1.5px solid #c98a2b; background:#f1e6ce; color:var(--tx); font-family:inherit; font-size:calc(15px * var(--bb-ts, 1)); cursor:pointer; font-weight:700 !important; white-space:nowrap; }
        #bb .bba-sbtn:hover { background:#ebcf96; }
        #bb .bba-sbtn.left { right:auto; left:8px; border-color:#d16a8a; background:#f6dde3; }
        #bb .bba-sbtn.left:hover { background:#f2c6d3; }
        #bb .bba-hr .bd.sp { color:#c2375f; }
        #bb .bba-hr > .pls { display:flex; flex-wrap:wrap; gap:6px; }
        #bb .bba-pl.skip { opacity:.5; border-style:dashed; }
        #bb .bba-pl.fin { opacity:.82; }
        #bb .bba-pl.fin .nm { padding-top:13px; }
        #bb .bba-pl .fb { position:absolute; top:2px; right:3px; padding:1px 6px; border-radius:8px; background:#6b7280; color:#fff; font-size:calc(12px * var(--bb-ts, 1)); line-height:1.3; font-weight:700 !important; white-space:nowrap; }
        #bb .bba-pl.mon { border-color:#22a05a; outline:2px solid #22a05a; outline-offset:0; }
        #bb #bba-btask { position:absolute; inset:0; z-index:50; display:flex; align-items:center; justify-content:center; pointer-events:none; }
        #bb #bba-btask .bx { pointer-events:auto; background:var(--sur); color:var(--tx); border:2px solid var(--bd2); border-radius:12px; padding:18px 22px; min-width:300px; text-align:center; box-shadow:0 12px 36px rgba(0,0,0,.5); }
        #bb #bba-btask .m { font-size:calc(16px * var(--bb-ts, 1)); font-weight:800; line-height:1.5; margin-bottom:14px; }
        #bb #bba-btask .b { display:flex; gap:10px; justify-content:center; }
        #bb #bba-btask .b .bba-btn { height:32px; padding:0 22px; font-size:calc(15px * var(--bb-ts, 1)); }
        #bb, #bb * , #bb button, #bb input, #bb textarea, #bb select { font-family:'Paperlogy','Lato',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
        #bb #bba-right { position:relative; }
        #bb #bba-sch { position:absolute; inset:0; z-index:6; display:none; flex-direction:column; border:2px solid var(--bd2); border-radius:8px; background:var(--bg); overflow:hidden; }
        #bb #bba-sch.open { display:flex; }
        #bb #bba-sb { padding:8px 10px; display:flex; flex-direction:column; gap:8px; }
        #bb .bba-hr { border:1.5px solid var(--bd2); border-radius:12px; background:var(--sur); padding:8px 12px 10px; }
        #bb .bba-hr .hh { display:flex; align-items:baseline; gap:8px; margin-bottom:6px; }
        #bb .bba-hr .hh b { font-size:calc(26px * var(--bb-ts, 1)); font-weight:700 !important; color:var(--tx); }
        #bb .bba-hr .bd { font-size:calc(14.5px * var(--bb-ts, 1)); font-weight:700 !important; color:#2e9a80; }
        #bb .bba-hr .bd.nx { color:#c98a2b; }
        #bb .bba-hr .sls { position:relative; display:flex; flex-direction:column; gap:8px; padding-left:20px; }
        #bb .bba-hr .sls::before { content:""; position:absolute; left:4px; top:8px; bottom:6px; width:2px; background:var(--bd2); }
        #bb .bba-sl { position:relative; display:flex; flex-direction:column; gap:4px; }
        #bb .bba-sl::before { content:""; position:absolute; left:-20px; top:4px; width:11px; height:11px; border-radius:50%; background:#c98a2b; border:2px solid var(--sur); box-sizing:border-box; }
        #bb .bba-sl .lb { font-size:calc(15.5px * var(--bb-ts, 1)); font-weight:700 !important; color:#c98a2b; font-variant-numeric:tabular-nums; }
        #bb .bba-sl .pls { display:flex; flex-wrap:wrap; gap:6px; }
        #bb .bba-pl { display:flex; flex-direction:column; min-width:80px; overflow:hidden; border:1.5px solid #8f8670; border-radius:8px; background:#e0dacb; text-align:center; position:relative; }
        #bb .bba-pl .nm { padding:3px 9px 2px; font-size:calc(16px * var(--bb-ts, 1)); line-height:1.2; font-weight:700 !important; white-space:nowrap; color:#2b2418; }
        #bb .bba-pl .tg { padding:1px 8px; font-size:calc(13px * var(--bb-ts, 1)); line-height:1.3; font-weight:700 !important; white-space:nowrap; border-top:1.5px solid #8f8670; }
        #bb #bba-memo { position:absolute; right:0; bottom:0; width:50%; z-index:8; display:none; flex-direction:column; border:2px solid var(--bd2); border-radius:8px; background:var(--bg); overflow:hidden; box-shadow:-6px 0 18px rgba(0,0,0,.18); }
        #bb #bba-memo.open { display:flex; }
        #bb #bba-memo .bba-zh .bba-cnt { white-space:normal; line-height:1.3; text-align:right; flex:1 1 140px; }
        #bb #bba-memo-cf { padding:8px 10px; border-bottom:1px solid var(--bd); background:#ffe2b8; color:#4a2a00; font-size:calc(16px * var(--bb-ts, 1)); display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
        #bb #bba-memo-ta { flex:1 1 auto; width:100%; box-sizing:border-box; border:0; outline:0; resize:none; padding:12px 14px; font-family:inherit; font-size:calc(18px * var(--bb-ts, 1)); line-height:1.55; background:var(--sur); color:var(--tx); }
        #bb .bb-hd-rightwrap { overflow:visible; }
        #bb #bba-killask { display:none; position:absolute; top:calc(100% + 6px); right:0; z-index:8; padding:10px 12px; border:2px solid #e11d48; border-radius:10px; background:var(--sur); box-shadow:0 8px 22px rgba(40,30,10,.35); white-space:nowrap; }
        #bb #bba-killask.open { display:block; }
        #bb #bba-killask .m { font-size:calc(15px * var(--bb-ts, 1)); font-weight:700 !important; margin-bottom:8px; }
        #bb #bba-killask .b { display:flex; gap:8px; justify-content:flex-end; }
        #bb #bba-killask .b .bba-btn { height:28px; padding:0 16px; }
        #bb #bba-killask .b .bba-btn[data-v="1"] { border-color:#e11d48; color:#b4123c; }
        #bb #bba-killb:disabled { opacity:1; background:#e11d48; color:#fff; cursor:default; }
        /* 커스텀 점검 */
        #bb .bba-campft { flex:0 0 auto; margin-top:auto; padding:8px 10px; border-top:1px solid var(--bd); }
        #bb #bba-cu-open { width:100%; height:32px; border-radius:9px; border:1.5px dashed var(--bd2); background:var(--sur2); color:var(--tx); font-family:inherit; font-size:calc(15px * var(--bb-ts, 1)); font-weight:700 !important; cursor:pointer; }
        #bb #bba-cu-open:hover { border-style:solid; background:#fff7dd; }
        #bb #bba-cu-open.run { border:1.5px solid #3b82f6; color:#2563eb; animation:bbaPulse 1.4s ease-in-out infinite; }
        #bb #bba-cu-bg { display:none; position:absolute; inset:0; z-index:58; background:rgba(30,24,12,.40); border-radius:inherit; }
        #bb #bba-cu { display:none; position:absolute; z-index:59; left:50%; top:50%; transform:translate(-50%,-50%); width:min(1040px, 95%); height:min(800px, 92%); box-sizing:border-box; flex-direction:column; border:2px solid var(--bd2); border-radius:16px; background:var(--bg, var(--sur)); box-shadow:0 20px 56px rgba(0,0,0,.5); overflow:hidden; }
        #bb #bba-cu.open, #bb #bba-cu-bg.open { display:flex; }
        #bb #bba-cu * { box-sizing:border-box; }
        #bb #bba-cu .hd { flex:0 0 auto; display:flex; align-items:center; gap:12px; padding:12px 16px; border-bottom:2px solid var(--bd2); background:var(--sur2); }
        #bb #bba-cu .hd b { font-size:calc(20px * var(--bb-ts, 1)); font-weight:900 !important; }
        #bb #bba-cu .hd .sub { font-size:calc(14px * var(--bb-ts, 1)); color:var(--mu); }
        #bb #bba-cu .hd .st { margin-left:auto; font-size:calc(14px * var(--bb-ts, 1)); font-weight:700 !important; color:var(--mu); }
        #bb #bba-cu .hd .st.run { color:#2563eb; }
        #bb #bba-cu .bd { flex:1 1 0; min-height:0; display:grid; grid-template-columns:392px minmax(0,1fr); }
        #bb #bba-cu .lf { min-height:0; overflow:auto; padding:14px; border-right:1.5px solid var(--bd2); display:flex; flex-direction:column; gap:16px; }
        #bb #bba-cu .rt { min-height:0; overflow:auto; padding:14px 16px; }
        #bb #bba-cu .sec .t { display:flex; align-items:center; gap:8px; margin-bottom:8px; font-size:calc(15px * var(--bb-ts, 1)); font-weight:800 !important; }
        #bb #bba-cu .sec .t i { display:inline-grid; place-items:center; width:22px; height:22px; border-radius:50%; background:var(--tx); color:var(--sur); font-style:normal; font-size:calc(13px * var(--bb-ts, 1)); }
        #bb #bba-cu .sec .t small { margin-left:auto; color:var(--mu); font-weight:600 !important; font-size:calc(13px * var(--bb-ts, 1)); }
        #bb #bba-cu .ad { display:flex; gap:6px; }
        #bb #bba-cu .ad input { flex:1; min-width:0; height:34px; padding:0 12px; border-radius:9px; border:1.5px solid var(--bd2); background:var(--sur); color:var(--tx); font-family:inherit; font-size:calc(15px * var(--bb-ts, 1)); font-weight:600 !important; outline:none; }
        #bb #bba-cu .ad input:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.18); }
        #bb #bba-cu .ad .bba-btn { height:34px; padding:0 14px; }
        #bb #bba-cu .sug { display:flex; flex-direction:column; gap:3px; margin-top:6px; }
        #bb #bba-cu .sug button { display:flex; align-items:center; gap:8px; padding:5px 10px; border-radius:8px; border:1px solid var(--bd); background:var(--sur); color:var(--tx); font-family:inherit; font-size:calc(14px * var(--bb-ts, 1)); text-align:left; cursor:pointer; }
        #bb #bba-cu .sug button:hover { background:#fff7dd; border-color:var(--bd2); }
        #bb #bba-cu .sug b { color:var(--mu); font-variant-numeric:tabular-nums; }
        #bb #bba-cu .sug span { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        #bb #bba-cu .hint { margin-top:6px; font-size:calc(13px * var(--bb-ts, 1)); color:var(--mu); line-height:1.4; }
        #bb #bba-cu .cs { margin-top:8px; border:1.5px solid var(--bd2); border-radius:11px; background:var(--sur); overflow:hidden; }
        #bb #bba-cu .cs .ch { display:flex; align-items:center; gap:8px; padding:6px 10px; background:var(--sur2); }
        #bb #bba-cu .cs .ch .id { font-variant-numeric:tabular-nums; color:var(--mu); font-size:calc(14px * var(--bb-ts, 1)); }
        #bb #bba-cu .cs .ch .nm { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:calc(15px * var(--bb-ts, 1)); font-weight:800 !important; }
        #bb #bba-cu .tg { padding:0 8px; border-radius:999px; font-size:calc(12px * var(--bb-ts, 1)); font-weight:800 !important; line-height:18px; }
        #bb #bba-cu .tg.k { background:#d9f2e3; color:#14532d; }
        #bb #bba-cu .tg.n { background:#e0e7ff; color:#312e81; }
        #bb #bba-cu .cs .x { width:24px; height:24px; padding:0; border-radius:6px; border:0; background:transparent; color:var(--mu); font-family:inherit; cursor:pointer; }
        #bb #bba-cu .cs .x:hover { background:#fdecea; color:#b4123c; }
        #bb #bba-cu .cs .cu { display:grid; grid-template-columns:1fr 1fr; gap:2px 8px; padding:7px 10px 8px; }
        #bb #bba-cu .cs .cu label { display:flex; align-items:center; gap:6px; min-width:0; font-size:calc(14px * var(--bb-ts, 1)); cursor:pointer; }
        #bb #bba-cu .cs .cu label span { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        #bb #bba-cu .cs .cn { padding:7px 10px 9px; font-size:calc(13.5px * var(--bb-ts, 1)); color:var(--mu); }
        #bb #bba-cu .ck { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
        #bb #bba-cu .ck label { display:flex; align-items:flex-start; gap:7px; padding:7px 9px; border-radius:10px; border:1.5px solid var(--bd); background:var(--sur); cursor:pointer; user-select:none; }
        #bb #bba-cu .ck label.on { border-color:#22a05a; background:#e8f7ee; }
        #bb #bba-cu .ck label input { margin-top:3px; }
        #bb #bba-cu .ck label b { display:block; font-size:calc(14.5px * var(--bb-ts, 1)); font-weight:800 !important; }
        #bb #bba-cu .ck label small { display:block; margin-top:1px; font-size:calc(12px * var(--bb-ts, 1)); color:var(--mu); line-height:1.3; font-weight:500 !important; }
        #bb #bba-cu .empty { padding:46px 10px; text-align:center; color:var(--mu); font-size:calc(15px * var(--bb-ts, 1)); line-height:1.7; }
        #bb #bba-cu .sm { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-bottom:12px; }
        #bb #bba-cu .sm .k { display:flex; flex-direction:column; align-items:center; min-width:76px; padding:6px 12px; border-radius:11px; border:1.5px solid var(--bd2); background:var(--sur); }
        #bb #bba-cu .sm .k b { font-size:calc(22px * var(--bb-ts, 1)); font-weight:900 !important; line-height:1.1; }
        #bb #bba-cu .sm .k span { font-size:calc(12.5px * var(--bb-ts, 1)); color:var(--mu); }
        #bb #bba-cu .sm .k.bad { border-color:#e11d48; } #bb #bba-cu .sm .k.bad b { color:#b4123c; }
        #bb #bba-cu .sm .k.ins { border-color:#d98a1c; } #bb #bba-cu .sm .k.ins b { color:#8a5a0a; }
        #bb #bba-cu .sm label { margin-left:auto; display:flex; align-items:center; gap:6px; font-size:calc(14px * var(--bb-ts, 1)); cursor:pointer; }
        #bb #bba-cu .rs { margin-bottom:12px; border:1.5px solid var(--bd2); border-radius:12px; overflow:hidden; background:var(--sur); }
        #bb #bba-cu .rs .sh { display:flex; align-items:center; gap:8px; padding:7px 12px; background:var(--sur2); font-size:calc(15px * var(--bb-ts, 1)); font-weight:800 !important; }
        #bb #bba-cu .rs .sh .id { color:var(--mu); font-size:calc(13.5px * var(--bb-ts, 1)); font-variant-numeric:tabular-nums; }
        #bb #bba-cu .rs .sh .ct { margin-left:auto; font-size:calc(13.5px * var(--bb-ts, 1)); color:var(--mu); font-weight:700 !important; }
        #bb #bba-cu .rs .er { padding:9px 12px; color:#b4123c; font-size:calc(14.5px * var(--bb-ts, 1)); font-weight:700 !important; }
        #bb #bba-cu .rr { display:grid; grid-template-columns:minmax(130px,.9fr) minmax(0,2fr); gap:10px; align-items:center; padding:6px 12px; border-top:1px solid var(--bd); }
        #bb #bba-cu .rr.bad { background:#fdecea; }
        #bb #bba-cu .rr.ins { background:#fff4dc; }
        #bb #bba-cu .rr .n { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:calc(14.5px * var(--bb-ts, 1)); font-weight:700 !important; }
        #bb #bba-cu .c { display:inline-block; margin:2px 5px 2px 0; padding:1px 9px; border-radius:999px; font-size:calc(13px * var(--bb-ts, 1)); font-weight:700 !important; line-height:20px; white-space:nowrap; }
        #bb #bba-cu .c.ok { background:#d9f2e3; color:#14532d; }
        #bb #bba-cu .c.warn { background:#fbd5d0; color:#9f1239; }
        #bb #bba-cu .c.mid { background:#fdebc8; color:#8a5a0a; }
        #bb #bba-cu .c.mu { background:var(--sur2); color:var(--mu); }
        #bb #bba-cu .ft { flex:0 0 auto; display:flex; align-items:center; gap:8px; padding:10px 16px; border-top:2px solid var(--bd2); background:var(--sur2); }
        #bb #bba-cu .ft .msg { flex:1; min-width:0; font-size:calc(14px * var(--bb-ts, 1)); color:#b4123c; font-weight:700 !important; }
        #bb #bba-cu .ft .bba-btn { height:34px; padding:0 14px; }
        #bb #bba-cu .ft .bba-btn.go { padding:0 24px; border-color:#1b8a4c; background:#22a05a; color:#fff; }
        #bb #bba-cu .ft .bba-btn.go.stop { border-color:#b4123c; background:#e11d48; }
        #bb #bba-memorow { position:absolute; top:calc(100% + 5px); right:0; display:flex; gap:6px; z-index:4; }
        #bb #bba-memob, #bb #bba-killb { height:26px; padding:0 10px; border-radius:8px; border:1.5px solid var(--bd2); background:var(--sur2); color:var(--tx); font-family:inherit; font-size:calc(16px * var(--bb-ts, 1)); font-weight:700 !important; cursor:pointer; white-space:nowrap; }
        #bb #bba-killb { border-color:#e11d48; color:#b4123c; }
        #bb #bba-killb:hover { background:#e11d48; color:#fff; }
        #bb #bba-memob.on { background:#c9f0d6; color:#14532d; border-color:#7fcf9a; }
        #bb #bba-memob.warn { border-color:#e11d48; color:#b4123c; animation:bbaPatBtn 2.4s ease-in-out infinite; }
        #bb .bba-pr { display:flex; align-items:center; flex-wrap:wrap; gap:4px 6px; padding:5px 4px; border-top:1px solid var(--bd); }
        #bb .bba-pr:first-of-type { border-top:0; }
        #bb .bba-pr .n { min-width:104px; font-size:calc(15px * var(--bb-ts, 1)); font-weight:700 !important; color:var(--tx); }
        #bb .bba-pr .sub { font-size:calc(12.5px * var(--bb-ts, 1)); color:var(--mu); }
        #bb .bba-pr .c { padding:1px 8px; border-radius:8px; font-size:calc(13px * var(--bb-ts, 1)); line-height:1.4; font-weight:700 !important; white-space:nowrap; border:1.5px solid transparent; }
        #bb .bba-pr .c.ok { background:#c9f0d6; color:#14532d; border-color:#7fcf9a; }
        #bb .bba-pr .c.warn { background:#ffe2b8; color:#6b3a00; border-color:#e0a24d; }
        #bb .bba-pr .c.off { background:#e5e7eb; color:#374151; border-color:#aab0ba; }
        #bb .bba-pr .c.err { background:#ffd0d6; color:#7a1226; border-color:#e08a98; }
        #bb .bba-pr .c.mu { color:var(--mu); }
        #bb .bba-pr .rsn { margin-left:auto; font-size:calc(12.5px * var(--bb-ts, 1)); color:var(--mu); max-width:40%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        #bb .bba-pl.sus.new { outline:3px solid #e11d48; outline-offset:-1px; animation:bbaPatBlink 2.4s ease-in-out infinite; }
        @keyframes bbaPatBlink { 0%,100% { outline-color:rgba(225,29,72,0); } 50% { outline-color:#e11d48; } }
        #bb .bba-pr.new { background:rgba(225,29,72,.07); border-radius:6px; }
        #bb .bba-btn.alert { border-color:#e11d48; color:#b4123c; animation:bbaPatBtn 2.4s ease-in-out infinite; }
        @keyframes bbaPatBtn { 0%,100% { box-shadow:0 0 0 0 rgba(225,29,72,0); } 50% { box-shadow:0 0 0 3px rgba(225,29,72,.45); } }
        #bb .bba-pl.sus { background:#ffc4d4; max-width:150px; }
        #bb .bba-pl.sus .nm { color:#4a0f2b; overflow:hidden; text-overflow:ellipsis; }
        #bb .bba-pl.sus .rs { padding:1px 8px; font-size:calc(12.5px * var(--bb-ts, 1)); line-height:1.3; font-weight:700 !important; color:#4a0f2b; background:#ff9db7; border-top:1.5px solid #8f8670; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        #bb .bba-pl.sus::before { content:""; position:absolute; inset:0; pointer-events:none; background:
            linear-gradient(to top right, transparent calc(50% - 1.5px), rgba(30,26,60,.32) calc(50% - 1.5px), rgba(30,26,60,.32) calc(50% + 1.5px), transparent calc(50% + 1.5px)),
            linear-gradient(to top left, transparent calc(50% - 1.5px), rgba(30,26,60,.32) calc(50% - 1.5px), rgba(30,26,60,.32) calc(50% + 1.5px), transparent calc(50% + 1.5px)); }
        `;
        document.head.appendChild(st);

        // ───────── 뼈대 ─────────
        const root = document.createElement('div');
        root.className = 'bba-root';
        root.innerHTML =
            '<div class="bba-bar">' +
              '<button class="bba-dbtn" data-k="dl" aria-expanded="false"><span class="l1">🚚 배달 로그 <span class="n" id="bba-n-dl">-</span><span class="ar">▾</span></span><span class="l2" id="bba-t-dl">--:-- 기준</span></button>' +
              '<button class="bba-dbtn" data-k="iv" aria-expanded="false"><span class="l1">🧑‍💻 개입 현황 <span class="ar">▾</span></span><span class="l2" id="bba-t-iv">--:-- 기준</span></button>' +
              '<button class="bba-dbtn" data-k="at" aria-expanded="false"><span class="l1">🪑 이석 현황 <span class="n" id="bba-n-at" title="현재 이석 인원">-</span><span class="ar">▾</span></span><span class="l2" id="bba-t-at">--:-- 기준</span></button>' +
              '<button class="bba-mmb" id="bba-mmb" title="다중 · 서브 모니터링, 부산 국립과학관 시간대별 담당자">👥 다중/과학관</button>' +
              '<span class="bba-note" id="bba-src"></span>' +
            '</div>' +
            '<div id="bba-dr" class="none"></div>' +
            '<div class="bba-top">' +
            '<section class="bba-zone bba-tasks">' +
              '<div class="bba-zh">' +
                '<h2>일일 업무표</h2>' +
                '<span class="bba-cnt" id="bba-wd"></span>' +
                '<span class="bba-pill" id="bba-prog">완료 0/0</span>' +
                '<span class="bba-pill late" id="bba-late" style="display:none"></span>' +
                '<span class="bba-pill bad" id="bba-bad" style="display:none"></span>' +
                '<span class="bba-pill au" id="bba-auto"></span>' +
                '<button class="bba-btn" id="bba-reload" title="daily_tasks.json 다시 받기">새로고침</button>' +
              '</div>' +
              '<div class="bba-zb" id="bba-tb"><div class="bba-th"><span></span><span>기체 관리 : [HH:MM~HH:MM] 시간 사이트 / N호기 / 내용 / [요일]</span><span>당일배정 현황</span></div><div id="bba-rows"></div></div>' +
            '</section>' +
            '<section class="bba-zone bba-campz"><div class="bba-zh"><h2>사이트 점검</h2><span class="bba-cnt" id="bba-campn"></span></div><div class="bba-camp" id="bba-camp"></div><div class="bba-campft"><button type="button" id="bba-cu-open" title="주소를 직접 정해 기체 카드를 읽고, 고른 항목만 점검합니다">🧪 커스텀 점검</button></div></section>' +
            '</div>' +
            '<div class="bba-bottom">' +
              '<div id="bba-mmw"></div>' +
              '<div class="bba-right" id="bba-right">' +
                '<section class="bba-zone bba-btz"><div class="bba-zh"><h2>🔋 무선 기체</h2><span class="bba-cnt" id="bba-bt-last" title="마지막으로 점검이 끝난 시각"></span><button class="bba-btn" id="bba-bt-cfg" title="점검할 기체 선택">🔍</button><span class="bba-cnt" id="bba-bt-cnt"></span><span class="bba-pill" id="bba-bt-st"></span><button class="bba-btn" id="bba-bt-sort" title="정렬 바꾸기: 상태순 → 이름순 → 내 배치">정렬</button><button class="bba-btn" id="bba-bt-now" title="무선 기체 배터리 점검을 지금 시작">지금 점검</button><button class="bba-btn" id="bba-bt-gh" title="GitHub 저장">☁</button></div><div class="bba-btg" id="bba-btg"></div></section>' +
              '</div>' +
            '</div>';
        bb.appendChild(root);
        // 버튼 줄을 '관제 센터' 제목 줄로 올림: 배달 로그·개입·이석 = 제목 박스 왼쪽, 다중/과학관 = 오른쪽 → 아래 그리드가 그만큼 길어짐
        try {
            const hd = bb.querySelector('.bb-hd');
            if (hd) { const bar = root.querySelector('.bba-bar'), mb = $('bba-mmb'); const hb = document.createElement('div'); hb.className = 'bba-hdr2'; hd.appendChild(bar); hd.appendChild(hb); hb.appendChild(mb); const sb = document.createElement('button'); sb.className = 'bba-mmb sim'; sb.id = 'bba-simb'; sb.title = '새 수식(시뮬레이터)을 적용했을 때의 일일 업무 배정 결과 — 시뮬레이션이며 실제 업무표는 바뀌지 않습니다'; sb.textContent = '📋 일일 업무 배정표'; hb.appendChild(sb); bar.classList.add('inhd'); mb.classList.add('inhd'); root.classList.add('hdbar'); }
        } catch (e) { /* 무시 */ }

        // 아산 스테이그린 임무받기 카드 제거 (admin 전용)

        // 화면 높이에 맞춰 보드 높이를 줄여 위/아래가 잘리지 않게 함 (최대 1300, 줌 반영)
        function fitHeight() {
            try {
                const z = parseFloat(lsGet('bba_zoom', '0.8')) || 0.8;
                bb.style.height = Math.max(1000, Math.min(1300, Math.floor((window.innerHeight - 6) / z))) + 'px';
                bb.style.width = Math.max(1100, Math.min(2400, Math.floor(((document.documentElement.clientWidth || window.innerWidth) - 6) / z))) + 'px';   // 가로도 창 폭에 딱 맞춤 (반창 스냅 등)
            } catch (e) { /* 무시 */ }
        }
        fitHeight();
        window.addEventListener('resize', fitHeight);
        ['bb-zoom-in', 'bb-zoom-out'].forEach(id => { const b = $(id); if (b) b.addEventListener('click', () => setTimeout(fitHeight, 0)); });

        // ───────── 기존 그리드 옮겨 붙이기 ─────────
        const dr = $('bba-dr');
        const PANELS = [['dl', 'bb-dlog-panel'], ['iv', 'bb-iv-page'], ['at', 'bb-mm-page-att']];
        PANELS.forEach(([k, id]) => {
            const el = $(id);
            if (!el) { const b = bb.querySelector('.bba-dbtn[data-k="' + k + '"]'); if (b) { b.disabled = true; b.title = '이 그리드를 찾지 못했습니다'; } return; }
            el.classList.add('bba-p', 'bba-off');
            el.dataset.bba = k;
            try { el.inert = false; } catch (e) { /* 무시 */ }
            dr.appendChild(el);
        });
        const mm = $('bb-mm-page-multi');
        if (mm) { mm.classList.add('bba-p'); $('bba-mmw').appendChild(mm); }

        // 펼침 상태 (여러 개를 동시에 열 수 있음 — 나란히 표시)
        let open = [];
        try { open = JSON.parse(lsGet('bba_open', '[]')).filter(k => PANELS.some(p => p[0] === k)); } catch (e) { open = []; }
        open = open.slice(0, 1);
        function applyOpen() {
            PANELS.forEach(([k, id]) => { const el = $(id); if (el) el.classList.toggle('bba-off', !open.includes(k)); });
            bb.querySelectorAll('.bba-dbtn').forEach(b => {
                const on = open.includes(b.dataset.k);
                b.classList.toggle('on', on); b.setAttribute('aria-expanded', on);
                b.querySelector('.ar').textContent = on ? '▴' : '▾';
            });
            dr.classList.toggle('none', !open.length);
            lsSet('bba_open', JSON.stringify(open));
        }
        bb.querySelector('.bba-bar').addEventListener('click', e => {
            const b = e.target.closest('.bba-dbtn'); if (!b || b.disabled) return;
            const k = b.dataset.k;
            open = open.includes(k) ? [] : [k];   // 한 번에 하나만 열림
            applyOpen();
        });
        applyOpen();

        // 배달 로그 버튼의 건수 = 기존(숨겨진) 배달 로그 버튼의 숫자
        function syncDlCount() {
            try { const b = document.querySelector('#bb-fb-dlog b'); const n = $('bba-n-dl'); if (b && n) n.textContent = (b.textContent || '').trim() || '-'; } catch (e) { /* 무시 */ }
        }
        function syncAtCount() {   // 이석 현황 버튼의 '현재 이석 N명' = 이석 현황 제목에 이미 계산돼 있는 값
            try { const t = document.querySelector('#bb-att-title .n'); const n = $('bba-n-at'); if (n) { n.textContent = t ? (t.textContent || '').trim() : '-'; n.classList.toggle('hot', !!t && parseInt(t.textContent, 10) > 0); } } catch (e) { /* 무시 */ }
        }
        // 버튼 아래 줄: '##:## 기준' = 각 현황 화면이 이미 표시 중인 마지막 갱신 시각을 그대로 읽어 옴 (눌러 보지 않아도 실시간 갱신 여부 확인)
        function syncAsof() {
            [['dl', 'bb-dlog-note'], ['iv', 'bb-iv-stat'], ['at', 'bb-att-stat']].forEach(([k, id]) => {
                try {
                    const t = $('bba-t-' + k), src = document.getElementById(id); if (!t) return;
                    const tx = src ? (src.textContent || '').trim() : '', m = [...tx.matchAll(/(\d{1,2}):(\d{2})/g)].pop();   // 문구 앞쪽의 '08:00~23:00' 같은 운영시간이 아니라 마지막 시각을 사용
                    const warn = /⚠/.test(tx) || (src && src.classList.contains('warn'));
                    t.textContent = (warn ? '⚠ ' : '') + (m ? m[1].padStart(2, '0') + ':' + m[2] + ' 기준' : /야간|마감/.test(tx) ? tx.slice(0, 8) : '--:-- 기준');
                    t.classList.toggle('warn', !!warn);
                    t.title = tx || '아직 받은 데이터가 없습니다';
                } catch (e) { /* 무시 */ }
            });
        }
        syncDlCount(); syncAtCount(); syncAsof(); setInterval(() => { syncDlCount(); syncAtCount(); syncAsof(); }, 3000);

        // ───────── 순찰 일정 (다중 모니터링 제목 우측 버튼 → 카드형 일정 보기) ─────────
        //   관제 도우미(index.html)의 '현 시각 일정 / 다음 시간대' 카드 모양을 그대로 옮김 (보기 전용)
        //   데이터: patrol_timetable.json(시간대별 예정/출차예정/배차방식) + patrol_status.json(순찰중단 기체)
        const TT_URL = 'https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/patrol_timetable.json';
        const PS_URL = 'https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/patrol_status.json';
        const DISPATCH_TYPES = [
            { key: 'auto_dispatch', label: '자동출차', bg: '#B6E2FF', color: '#0E2A44' },
            { key: 'reserved_dispatch', label: '예약배차', bg: '#DDD0FF', color: '#2A1560' },
            { key: 'control_dispatch', label: '관제실배차', bg: '#FFD0A0', color: '#4A2600' },
            { key: 'site_dispatch', label: '사이트배차', bg: '#FFC0DA', color: '#4A0F2B' },
            { key: 'random_site_dispatch', label: '랜덤사이트배차', bg: '#D0F79B', color: '#1D3A00' },
        ];
        const OUT_TAG = { label: '출차예정', bg: '#FFE68B', color: '#3F2E00' };
        const OUT_PATROL_TAG = { label: '출차 및 순찰', bg: '#FFE68B', color: '#3F2E00' };
        const NIGHT_TAG = { label: '유선기체', bg: '#E3E6EA', color: '#2B3138' };

        // ───────── 순찰중단 '지금 점검' ─────────
        //   순찰중단 목록의 기체마다 NCC 사이트 주소(/ko/monitoring/<번호>)를 숨김 iframe 으로 열어 '기체 카드가 있는지 · 전원 · 임무받기 ON/OFF' 를 읽는다.
        //   버튼을 눌렀을 때만 동작 · 사이트 단위로 한 곳씩(같은 주소의 기체는 한 번에) · 자동 점검과는 동시에 돌지 않음
        //   ※ 새 사이트/기체를 추가하려면: PAT_NAME_MAP 에 '기체 풀네임': '순찰 목록 이름' 을 넣고, 주소 번호는 CHG_SRC(무선충전 목록)나 PAT_EXTRA_ID 에 넣는다
        const PAT_NAME_MAP = {
            '용인 고진역 힐스테이트 1호기': '용인 고진', '경희대학교 국제캠퍼스 1호기': '경희대 1', '경희대학교 국제캠퍼스 2호기': '경희대 2',
            '성남시 판교역 1호기': '성남 판교', '성남시 서현역 1호기': '성남 서현', '성남시 율동공원 1호기': '성남 율동', '성남시 야탑역 1호기': '성남 야탑',
            '부산 EDC 호반써밋 1호기': '부산 호반 1', '부산 EDC 호반써밋 2호기': '부산 호반 2', '부산 EDC 수자인 1호기': '부산 수자인 1', '부산 EDC 수자인 2호기': '부산 수자인 2',
            '파주 디에트르더클래스 1호기': '파주', '잠실 리센츠 아파트 1호기': '리센츠 1', '잠실 리센츠 아파트 2호기': '리센츠 2',
            '평택고덕 디에트르 1호기': '평택 1', '평택고덕 디에트르 2호기': '평택 2', '부산 서면비스타동원 1호기': '부산 서면', '부천 위브 1호기': '부천 위브',
            '잠실 레이크팰리스 1호기': '잠실 레이크', '잠실 엘스 아파트 1호기': '엘스 1', '잠실 엘스 아파트 2호기': '엘스 2', '삼성인력개발원 1호기': '인력개발원',
            '고양 래미안 휴레스트 1호기': '고양 래미안', '강동현대홈타운 1호기': '강동현대홈타운', '창원대학교 1호기': '창원대 1', '창원대학교 2호기': '창원대 2',
            '한성대학교 1호기': '한성대', '김포풍무센트럴푸르지오 1호기': '김포 풍무', '강남 래미안블레스티지 1호기': '강남 래미안',
            '김포 캐슬앤파밀리에 1호기': '김포 1', '김포 캐슬앤파밀리에 2호기': '김포 2', '지제역 푸르지오엘리아츠 1호기': '지제',
            '부경대 1호기': '부경대', '부경대 2호기': '부경대', '롯데마트부산CFC(쉴더스) 1호기': '쉴더스',
            '두루아이 3호기': '두루아이 3', '두루아이 4호기': '두루아이 4', '두루아이 5호기': '두루아이 5', '중앙대학교 1호기': '중앙대',
            '잠실 르엘 1호기': '잠실 르엘', '신동백 롯데캐슬 에코1단지 1호기': '신동백', '청담르엘 1호기': '청담 르엘', '전주시 전주천 1호기': '전주천',
            '인재개발원 1호기': '인재개발원', '아주대학교 1호기': '아주대 1', '아주대학교 2호기': '아주대 2', '서강대학교 1호기': '서강대',
            '동백SK아펠바움 1차 1호기': '동백SK', '동대문구회기동 1호기(쉴드플러스)': '동대문구 회기동', '더샵남천프레스티지 1호기': '더샵남천',
            '한국장애인고용공단 1호기': '장애인고용공단 1', '한국장애인고용공단 2호기': '장애인고용공단 2', '서울 양원 LH 1단지 1호기': '양원LH',
            '덕수궁 1호기': '덕수궁', '순천향대학교 1호기': '순천향', '전주천(덕진구) 1호기': '전주천(덕진구)',
            '수원센트럴 1호기': '수원센트럴 1', '수원센트럴 2호기': '수원센트럴 2', '수원 힐스테이트푸르지오 1호기': '수원 힐스 1', '수원 힐스테이트푸르지오 2호기': '수원 힐스 2',
            '더샵지제역센트럴파크 1호기': '더샵지제 1', '더샵지제역센트럴파크 2호기': '더샵지제 2', '신대양제지반월2공장 1호기': '신대양',
            'DMZ 캠프 그리브스 1호기': 'DMZ', '광교 풍경채 1호기': '광교 풍경채', '광교풍경채(대체 기체) 1호기': '광교 풍경채'
        };
        const PAT_ALIAS = { '엘스': ['엘스 1', '엘스 2'] };   // 순찰 목록의 이름이 위 표와 번호 표기만 다른 것
        const PAT_SKIP = ['구리 롯데캐슬', '광교 풍경채'];      // 철수한 사이트 — 점검하지 않음
        const PAT_EXTRA_ID = {   // 무선충전 목록(CHG_SRC)에 없는 사이트의 NCC 주소 번호
            '용인 고진역 힐스테이트 1호기': 131, '잠실 리센츠 아파트 1호기': 46, '잠실 리센츠 아파트 2호기': 46, '평택고덕 디에트르 1호기': 105, '평택고덕 디에트르 2호기': 105,
            '부산 서면비스타동원 1호기': 66, '부천 위브 1호기': 72, '잠실 엘스 아파트 1호기': 75, '잠실 엘스 아파트 2호기': 75, '김포풍무센트럴푸르지오 1호기': 196,
            '김포 캐슬앤파밀리에 1호기': 108, '김포 캐슬앤파밀리에 2호기': 108, '부경대 1호기': 37, '부경대 2호기': 37, '지제역 푸르지오엘리아츠 1호기': 126,
            '아주대학교 1호기': 36, '아주대학교 2호기': 36, 'DMZ 캠프 그리브스 1호기': 82, '삼성인력개발원 1호기': 24, '신대양제지반월2공장 1호기': 229
        };
        const PAT_ID = {}, PAT_FULLS = {};   // PAT_ID[정규화한 풀네임] = 주소 번호 · PAT_FULLS[정규화한 짧은 이름] = [풀네임...]
        CHG_SRC.forEach(([id, names]) => names.forEach(n => { PAT_ID[normTxt(n)] = id; }));
        Object.keys(PAT_EXTRA_ID).forEach(n => { PAT_ID[normTxt(n)] = PAT_EXTRA_ID[n]; });
        Object.keys(PAT_NAME_MAP).forEach(f => { const k = normTxt(PAT_NAME_MAP[f]); (PAT_FULLS[k] = PAT_FULLS[k] || []).push(f); });
        const PAT_KEY = 'bba_pat_res';   // 마지막 점검 결과 (새로고침해도 유지)
        let patBusy = false, patMsg = '', patRes = (() => { try { const o = JSON.parse(lsGet(PAT_KEY, 'null')); if (o && o.at && Array.isArray(o.rows)) return { at: o.at, i: 0, n: 0, rows: o.rows, names: o.names || o.rows.map(r => r.short) }; } catch (e) { /* 무시 */ } return { at: 0, i: 0, n: 0, rows: [], names: [] }; })();
        function patNew() {   // 마지막 점검 이후 새로 순찰중단에 오른 기체 (점검 기록이 아직 없으면 비교할 기준이 없으니 비움)
            if (!patRes.at) return new Set();
            const done = new Set(patRes.names || []);
            return new Set(Object.keys(unitNotes).filter(n => !done.has(n)));
        }
        function patTargets(shorts) {   // 순찰중단 이름들 → { sites: [{id, units:[{short, full}]}], rows: [점검 결과 행] }
            const sites = {}, rows = [];
            shorts.forEach(short => {
                const row = { short, items: [], note: '' }; rows.push(row);
                if (PAT_SKIP.includes(short)) { row.note = '철수 — 점검 제외'; return; }
                const k = normTxt(short), fulls = [].concat(PAT_FULLS[k] || [], (PAT_ALIAS[short] || []).reduce((a, x) => a.concat(PAT_FULLS[normTxt(x)] || []), []));
                if (!fulls.length) { row.note = '이름 연결 없음'; return; }
                fulls.forEach(full => {
                    const id = PAT_ID[normTxt(full)];
                    if (!id) { row.note = '주소 미등록'; return; }
                    (sites[id] = sites[id] || { id, units: [] }).units.push({ short, full, row });
                });
            });
            return { sites: Object.keys(sites).map(id => sites[id]), rows };
        }
        async function patRun() {
            if (patBusy) return;
            const l = lockGet();
            if (autoBusy || campBusy || (l && l.tab !== TABID && Date.now() - l.t < 150000)) { patMsg = '다른 점검이 진행 중입니다. 끝난 뒤 다시 눌러 주세요'; renderSched(); return; }
            const shorts = Object.keys(unitNotes).sort((a, b) => a.localeCompare(b, 'ko'));
            if (!shorts.length) { patMsg = '점검할 순찰중단 기체가 없습니다'; renderSched(); return; }
            patMsg = ''; patBusy = true;
            const plan = patTargets(shorts);
            const prevRes = patRes, g3 = killGen; let killedP = false;
            patRes = { at: 0, i: 0, n: plan.sites.length, rows: plan.rows, names: shorts };
            renderSched();
            try {
                for (const site of plan.sites) {
                    if (g3 !== killGen) { killedP = true; break; }
                    const S = { k: '순찰 ' + site.id, id: site.id, pat: true, kw: /(?!)/, units: [] };
                    const units = site.units.map(x => U(x.full));
                    let R; try { R = await probeSite(S, units); } catch (e) { R = { err: 'noread', units: {}, cards: 0 }; }
                    if (R.err === 'killed' || g3 !== killGen) { killedP = true; break; }
                    site.units.forEach(x => { x.row.items.push({ full: x.full, id: site.id, err: R.err || null, cards: R.cards || 0, r: (R.units && R.units[x.full]) || { found: false } }); });
                    patRes.i++; renderSched(); await sleep(400);
                }
            } finally {
                patBusy = false; if (killedP) { patRes = prevRes; patMsg = '점검을 중단했습니다'; renderSched(); return; }   // Kill All — 지난 결과 그대로 둠
                patRes.at = Date.now();
                try { lsSet(PAT_KEY, JSON.stringify({ at: patRes.at, names: patRes.names, rows: patRes.rows.map(r => ({ short: r.short, note: r.note, items: r.items.map(x => ({ full: x.full, id: x.id, err: x.err, cards: x.cards, r: { found: !!(x.r && x.r.found), on: x.r ? x.r.on : null, pw: x.r ? x.r.pw : null } })) })) })); } catch (e) { /* 무시 */ }
                renderSched();
            }
        }
        function patHtml() {
            if (!patBusy && !patRes.at && !patMsg) return '<section class="bba-hr"><div class="hh"><b>점검 결과</b><span class="bd nx">아직 점검 기록이 없습니다 · 위의 \'지금 점검\'을 눌러 주세요</span></div></section>';
            const ERR = { timeout: '시간 초과', login: '로그인 필요', xorigin: '접근 불가', noread: '읽지 못함' };
            const chip = (c, t) => '<span class="c ' + c + '">' + esc(t) + '</span>';
            const sw = (v, lb) => v === true ? chip('ok', lb + ' ON') : v === false ? chip('warn', lb + ' OFF') : chip('mu', lb + ' ?');
            let h = '<section class="bba-hr"><div class="hh"><b>점검 결과</b><span class="bd nx">' +
                (patBusy ? '점검 중 ' + patRes.i + '/' + patRes.n + ' 사이트' : patRes.at ? '마지막 점검 ' + (new Date(patRes.at).toDateString() === new Date().toDateString() ? '' : (new Date(patRes.at).getMonth() + 1) + '/' + new Date(patRes.at).getDate() + ' ') + pad(new Date(patRes.at).getHours()) + ':' + pad(new Date(patRes.at).getMinutes()) : '') + '</span></div>';
            if (patMsg) h += '<div class="bba-empty" style="padding:8px">' + esc(patMsg) + '</div>';
            const isNew = patNew(), byName = {}; patRes.rows.forEach(r => { byName[r.short] = r; });
            const names = patBusy ? patRes.rows.map(r => r.short) : Object.keys(unitNotes).sort((a, b) => a.localeCompare(b, 'ko'));   // 지금 순찰중단인 기체만 (풀린 기체의 지난 결과는 숨김)
            h += names.map(nm => byName[nm] || { short: nm, items: [], note: '', fresh: true }).map(row => {
                let c = '';
                if (row.fresh) c = chip('err', '미점검 · 새로 추가됨');
                else if (row.note && !row.items.length) c = chip('mu', row.note);
                else if (!row.items.length) c = chip('mu', patBusy ? '대기 중…' : '—');
                else {
                    const found = row.items.filter(x => x.r && x.r.found), multi = row.items.length > 1;
                    if (found.length) c = found.map(x => (multi ? '<span class="sub">' + esc(x.full) + '</span>' : '') +
                        (x.r.pw === true ? chip('ok', '전원 ON') : x.r.pw === false ? chip('off', '전원 OFF') : chip('mu', '전원 ?')) + sw(x.r.on, '임무받기')).join('');
                    else if (row.items.some(x => x.err)) c = chip('err', '읽지 못함 · ' + (ERR[row.items.find(x => x.err).err] || row.items.find(x => x.err).err));
                    else c = chip('err', row.items.every(x => !x.cards) ? '카드 없음 (입고)' : '카드 없음');
                    if (row.note) c += chip('mu', row.note);
                }
                return '<div class="bba-pr' + (isNew.has(row.short) ? ' new' : '') + '"><span class="n">' + esc(row.short) + '</span>' + c + '<span class="rsn" title="' + esc(unitNotes[row.short] || '') + '">' + esc(unitNotes[row.short] || '') + '</span></div>';
            }).join('');
            return h + '</section>';
        }
        let timeTable = {}, unitNotes = {}, unitHourNotes = {}, schedAt = '', psAt = '', schMode = 'sched';
        function suspReason(name, hh) {
            const clean = String(name || '').replace(/\s+/g, '');
            const gk = Object.keys(unitNotes).find(k => k.replace(/\s+/g, '') === clean);
            if (gk) return unitNotes[gk] || '순회 보류';
            const hk = Object.keys(unitHourNotes).find(k => k.replace(/\s+/g, '') === clean);
            if (hk && (unitHourNotes[hk].hours || []).includes(hh)) return unitHourNotes[hk].reason || '순찰 보류';
            return null;
        }
        // 요일/시간에 따라 일정에서 빼는 기체 (관제 도우미의 filterHoliday 와 같은 규칙)
        function holidayOk(name) {
            const now = new Date(), d = now.getDay(), h = now.getHours(), t = name.replace(/\s+/g, ''), wk = d === 0 || d === 6;
            if (t.includes('잠실레이크')) { if (d === 1 && h >= 13 && h < 17) return false; if (d === 2 && h < 12) return false; }
            if (d >= 1 && d <= 5 && t.includes('고양래미안') && (h === 13 || h === 14)) return false;
            if (wk && (t.includes('인력개발원') || t.includes('구리롯데캐슬') || t.includes('장애인고용공단1') || t.includes('장애인고용공단2') || t.includes('동대문구회기동'))) return false;
            return true;
        }
        function applyStatus(ps) {
            unitNotes = {}; unitHourNotes = {};
            const map = (ps && ps.unitStatusMap) || {};
            Object.keys(map).forEach(k => {
                const info = map[k]; if (!info) return;
                if (info.hourly && Array.isArray(info.hourly.hours) && info.hourly.hours.length) unitHourNotes[k] = info.hourly;
                if (info.status === 'suspended') unitNotes[k] = info.reason || '순회 보류';
            });
        }
        async function loadSched() {
            let tt = null, ps = null;
            try { const r = await fetch(TT_URL + '?t=' + Date.now(), { cache: 'no-store' }); if (r.ok) { const tx = await r.text(); tt = JSON.parse(tx); lsSet('bba_tt_cache', tx); } } catch (e) { /* 캐시 사용 */ }
            if (!tt) { try { tt = JSON.parse(lsGet('bba_tt_cache', 'null')); } catch (e) { tt = null; } }
            try { const r = await fetch(PS_URL + '?t=' + Date.now(), { cache: 'no-store' }); if (r.ok) { const tx = await r.text(); ps = JSON.parse(tx); lsSet('bba_ps_cache', tx); } } catch (e) { /* 캐시 사용 */ }
            if (!ps) { try { ps = JSON.parse(lsGet('bba_ps_cache', 'null')); } catch (e) { ps = null; } }
            if (tt) timeTable = tt;
            applyStatus(ps);
            psAt = (ps && ps.updatedAt) || '';
            schedAt = pad(new Date().getHours()) + ':' + pad(new Date().getMinutes());
            renderSched();
        }
        // 다중 모니터링 그리드(#bb-mm-body)에 떠 있는 기체 이름 — 일정의 이름('엘스')이 '엘스 1/2' 처럼 번호 붙은 기체와도 맞도록 비교
        function monitoredNames() {
            return Array.from(document.querySelectorAll('#bb-mm-body .bb-mm-card .bb-mm-name')).map(e => (e.textContent || '').trim()).filter(Boolean);
        }
        // 다중 모니터링 카드의 이름 + 시작 시각('10:05부터') — 시각이 지난 시간대의 일정 카드를 계속 보여주기 위해 사용
        function monitoredCards() {
            return Array.from(document.querySelectorAll('#bb-mm-body .bb-mm-card')).map(c => {
                const n = ((c.querySelector('.bb-mm-name') || {}).textContent || '').trim(), m = /(\d{1,2}):(\d{2})/.exec((c.querySelector('.bb-mm-since') || {}).textContent || '');
                return n && m ? { n, h: +m[1], t: pad(+m[1]) + ':' + m[2] } : null;
            }).filter(Boolean);
        }
        let _monNames = [];
        function isMonitored(name) {
            const c = name.replace(/\s+/g, '');
            return _monNames.some(n => n === name || n.startsWith(name + ' ') || n.replace(/\s+/g, '') === c);
        }
        // Worker 피드(window.__bbaPatrolRecords)에서 기체별 기록을 모아, 이번 시(hour)에 순찰이 끝났는지 판정 (관제 도우미와 같은 규칙)
        //  · 이름 '엘스' ↔ 기록 '엘스 1/2' 처럼 번호 붙은 기체 포함, 그 기체들의 기록이 모두 finished 이고 하나라도 이번 시 시작 이후 종료
        let _recIdx = {};
        function buildRecIdx() {
            const idx = {}, rank = r => (r.status === 'anomaly' ? 3 : r.status === 'ongoing' ? 2 : 1);
            (window.__bbaPatrolRecords || []).forEach(r => {
                const nm = r && String(r.robot || '').trim();
                if (!nm) return;
                const cur = idx[nm];
                if (!cur || rank(r) > rank(cur) || (rank(r) === rank(cur) && (r.end_ts || 0) > (cur.end_ts || 0))) idx[nm] = r;
            });
            _recIdx = idx;
        }
        function isFinishedThisHour(name) {
            const recs = Object.keys(_recIdx).filter(k => k === name || k.startsWith(name + ' ') || k.replace(/\s+/g, '') === name.replace(/\s+/g, '')).map(k => _recIdx[k]);
            if (!recs.length) return false;
            const d = new Date(); d.setMinutes(0, 0, 0);
            const hourStart = d.getTime() / 1000;
            return recs.every(r => r.status === 'finished') && recs.some(r => (r.end_ts || 0) >= hourStart);
        }
        function schedGroupHtml(hh, isCur) {
            const data = timeTable[hh] || {};
            const tagMap = new Map();
            [...DISPATCH_TYPES].reverse().forEach(dt => (Array.isArray(data[dt.key]) ? data[dt.key] : []).forEach(n => tagMap.set(n, dt)));
            const outPatrol = Array.isArray(data.out_patrol) ? data.out_patrol : [];
            outPatrol.forEach(n => tagMap.set(n, OUT_PATROL_TAG));
            const planTimes = data.planTimes || {}, outTimes = data.outTimes || {};
            const tl = (v, fb) => (Array.isArray(v) && v.length ? v : (typeof v === 'string' && v ? [v] : [fb]));
            const entries = [];
            (Array.isArray(data.plan) ? data.plan : []).forEach(n => tl(planTimes[n], hh + ':00').forEach(t => entries.push({ n, k: 'plan', t })));
            (Array.isArray(data.out) ? data.out : []).forEach(n => tl(outTimes[n], hh + ':50').forEach(t => entries.push({ n, k: 'out', t })));
            const nightOff = new Set();
            (Array.isArray(data.night_excluded) ? data.night_excluded : []).forEach(m => {
                const n = String(m).replace(/\s*\(.*$/, '').trim();
                if (!n || entries.some(e => e.k === 'plan' && e.n === n)) return;
                nightOff.add(n); tl(planTimes[n], hh + ':00').forEach(t => entries.push({ n, k: 'plan', t }));
            });
            entries.sort((a, b) => a.t.localeCompare(b.t));
            const slots = [];
            entries.forEach(e => { let s = slots.find(x => x.t === e.t); if (!s) { s = { t: e.t, items: [] }; slots.push(s); } s.items.push(e); });
            let body = '';
            const nowHM = pad(new Date().getHours()) + ':' + pad(new Date().getMinutes()), lastStart = {};   // 같은 기체가 한 시간에 여러 번 나오면, 이미 시작된 일정 중 가장 최근 것만 '진행 중' 표시
            if (isCur) entries.forEach(e => { if (e.k === 'plan' && e.t <= nowHM && (!lastStart[e.n] || e.t > lastStart[e.n])) lastStart[e.n] = e.t; });
            slots.forEach(s => {
                let pills = '';
                s.items.forEach(({ n, k }) => {
                    const skipDay = !holidayOk(n);   // 요일/시간 규칙상 오늘은 빠지는 일정도 숨기지 않고 흐리게 표시
                    const rs = suspReason(n, hh);
                    if (rs) { pills += '<div class="bba-pl sus"><span class="nm">' + esc(n) + '</span><span class="rs">' + esc(rs) + '</span></div>'; return; }
                    let tag = k === 'plan' ? tagMap.get(n) : (outPatrol.includes(n) ? OUT_PATROL_TAG : OUT_TAG);
                    if (!tag && k === 'plan' && nightOff.has(n)) tag = NIGHT_TAG;
                    const monNow = isCur && k === 'plan' && lastStart[n] === s.t && isMonitored(n);   // 지금 다중 모니터링 목록에서 순찰 중인 기체
                    const finNow = isCur && k === 'plan' && !monNow && lastStart[n] === s.t && isFinishedThisHour(n);   // 이번 시(hour) 안에 순찰이 끝난 기체 (Worker 기록)
                    pills += '<div class="bba-pl' + (monNow ? ' mon' : '') + (finNow ? ' fin' : '') + (skipDay ? ' skip' : '') + '"' +
                        (monNow ? ' title="현재 모니터링 중"' : finNow ? ' title="이번 시간대에 순찰이 끝난 기체입니다"' : skipDay ? ' title="요일·시간 규칙상 오늘 이 시각에는 제외되는 일정입니다"' : '') + '>' +
                        (finNow ? '<span class="fb">순찰완료</span>' : '') + '<span class="nm">' + esc(n) + '</span><span class="tg"' + (tag ? ' style="background:' + tag.bg + ';color:' + tag.color + '"' : '') + '>' + esc(tag ? tag.label : '') + '</span></div>';
                });
                if (pills) body += '<div class="bba-sl"><div class="lb">' + esc(s.t) + '</div><div class="pls">' + pills + '</div></div>';
            });
            return '<section class="bba-hr"><div class="hh"><b>' + hh + '시</b><span class="bd' + (isCur ? '' : ' nx') + '">' + (isCur ? '현 시각 일정' : '다음 시간대') + '</span></div>' +
                (body ? '<div class="sls">' + body + '</div>' : '<div class="bba-empty">일정이 없습니다</div>') + '</section>';
        }
        // 지금 모니터링 중인데 '현 시각 일정'에 없는 기체:
        //  · 이전 시간대 일정의 연장 — A/B 코스를 도는 기체(예: 엘스는 10:30 일정인데 11:00에 B코스 시작)는 그 일정 시각으로부터 PREV_MAX_MIN 분 안에 시작했을 때만 그 시간대 카드로 보여준다.
        //  · 그 밖의 기체(예: 07시 일정이 끝난 뒤 10:58에 불시에 다시 시작한 경희대)는 일정과 무관하게 나타난 '예외 기체'로 맨 아래에 따로 모은다.
        const PREV_MAX_MIN = 90;
        const samePlan = (p, c) => c === p || c.startsWith(p + ' ') || c.replace(/\s+/g, '') === p.replace(/\s+/g, '');
        const planHas = (hh, n) => { const d = timeTable[pad(hh)]; return !!(d && Array.isArray(d.plan) && d.plan.some(x => samePlan(x, n))); };
        function prevSlot(hh, c) {   // 시간대 hh 의 일정에 이 기체가 있고, 그 일정 시각 직후(PREV_MAX_MIN 분 이내)에 시작했다면 {p, slot}
            const d = timeTable[pad(hh)], p = d && Array.isArray(d.plan) ? d.plan.find(x => samePlan(x, c.n)) : null; if (!p) return null;
            const v = (d.planTimes || {})[p], arr = Array.isArray(v) ? v : (typeof v === 'string' && v ? [v] : [pad(hh) + ':00']), st = c.h * 60 + (+c.t.slice(3));
            let best = null;
            arr.forEach(t => { const m = /(\d{1,2}):(\d{2})/.exec(t); if (!m) return; const diff = ((st - (+m[1] * 60 + +m[2]) + 1440 + 15) % 1440) - 15;   // 시작 − 일정 시각 (−15 ~ 1424분)
                if (diff <= PREV_MAX_MIN && (best === null || Math.abs(diff) < Math.abs(best.diff))) best = { p, diff, slot: pad(+m[1]) + ':' + m[2] }; });
            return best;
        }
        function schedPrevHtml(hh, items) {
            const data = timeTable[pad(hh)] || {}, outPatrol = Array.isArray(data.out_patrol) ? data.out_patrol : [];
            const tagFor = n => (outPatrol.includes(n) ? OUT_PATROL_TAG : (DISPATCH_TYPES.find(dt => (Array.isArray(data[dt.key]) ? data[dt.key] : []).includes(n)) || null));
            const slots = {};
            items.forEach(x => { (slots[x.slot] = slots[x.slot] || []).push({ n: x.c.n, st: x.c.t, tag: tagFor(x.p) }); });
            return '<section class="bba-hr"><div class="hh"><b>' + pad(hh) + '시</b><span class="bd nx">이전 시간대 일정 · 아직 모니터링 중</span></div><div class="sls">' + slotsHtml(slots) + '</div></section>';
        }
        function slotsHtml(slots) {
            return Object.keys(slots).sort().map(t => '<div class="bba-sl"><div class="lb">' + esc(t) + '</div><div class="pls">' + slots[t].map(x =>
                '<div class="bba-pl mon" title="현재 모니터링 중 (' + esc(x.st) + '부터)"><span class="nm">' + esc(x.n) + '</span><span class="tg"' + (x.tag ? ' style="background:' + x.tag.bg + ';color:' + x.tag.color + '"' : '') + '>' + esc(x.tag ? x.tag.label : '') + '</span></div>').join('') + '</div></div>').join('');
        }
        function schedExceptHtml(cards) {   // 일정 없이 나타난 예외 기체 — 시작 시각별
            const slots = {}; cards.forEach(c => { (slots[c.t] = slots[c.t] || []).push({ n: c.n, st: c.t, tag: null }); });
            return '<section class="bba-hr exc"><div class="hh"><b>예외 기체</b><span class="bd sp">일정과 무관하게 시작 · 모니터링 중</span></div><div class="sls">' + slotsHtml(slots) + '</div></section>';
        }
        function suspPill(n, reason, isNew) {
            return '<div class="bba-pl sus' + (isNew ? ' new' : '') + '"' + (isNew ? ' title="마지막 점검 이후 새로 순찰중단된 기체 — 지금 점검으로 다시 확인하세요"' : '') + '><span class="nm">' + esc(n) + '</span><span class="rs" title="' + esc(reason) + '">' + esc(reason) + '</span></div>';
        }
        function suspHtml() {
            const glob = Object.keys(unitNotes).sort((a, b) => a.localeCompare(b, 'ko')), patNewSet = patNew();
            const hourly = Object.keys(unitHourNotes).filter(k => !(k in unitNotes)).sort((a, b) => a.localeCompare(b, 'ko'));
            let h = '<section class="bba-hr"><div class="hh"><b>순찰중단</b><span class="bd sp">' + glob.length + '대</span></div>' +
                (glob.length ? '<div class="pls">' + glob.map(n => suspPill(n, unitNotes[n], patNewSet.has(n))).join('') + '</div>' : '<div class="bba-empty">현재 순찰중단 기체가 없습니다</div>') + '</section>' + patHtml();
            if (hourly.length) {
                h += '<section class="bba-hr"><div class="hh"><b>시간대 한정 보류</b><span class="bd nx">' + hourly.length + '대</span></div><div class="pls">' +
                    hourly.map(n => { const o = unitHourNotes[n]; return suspPill(n, (o.reason || '순찰 보류') + ' (' + (o.hours || []).join('·') + '시)'); }).join('') + '</div></section>';
            }
            return h;
        }
        function renderSched() {
            const box = $('bba-sb'); if (!box) return;
            const keep = box.scrollTop;
            const pb = $('bba-spc'); if (pb) { pb.style.display = schMode === 'susp' ? '' : 'none'; pb.disabled = patBusy; pb.textContent = patBusy ? '점검 중…' : '지금 점검'; pb.classList.toggle('alert', !patBusy && patNew().size > 0); }
            if (schMode === 'susp') {
                box.innerHTML = Object.keys(unitNotes).length || Object.keys(unitHourNotes).length || psAt ? suspHtml() : '<div class="bba-empty">순찰중단 데이터를 받지 못했습니다</div>';
                $('bba-sth').textContent = '⛔ 순찰중단';
                const u = $('bba-sat'); if (u) u.textContent = psAt ? '시트 갱신 ' + psAt : '';
            } else {
                _monNames = monitoredNames();
                buildRecIdx();
                const h = new Date().getHours(), cur = pad(h), nxt = pad((h + 1) % 24);
                box.innerHTML = Object.keys(timeTable).some(k => /^\d{2}$/.test(k))
                    ? schedGroupHtml(cur, true) + schedGroupHtml(nxt, false) + (() => {
                        const g = {}, un = [];
                        monitoredCards().forEach(c => {
                            if (planHas(h, c.n)) return;   // 현 시각 일정에서 이미 초록으로 표시됨
                            let hit = null;
                            for (let k = 0; k < 3 && !hit; k++) { const x = (c.h - k + 24) % 24, r = prevSlot(x, c); if (r) hit = { x, c, p: r.p, slot: r.slot }; }
                            if (hit) (g[hit.x] = g[hit.x] || []).push(hit); else un.push(c);
                        });
                        return Object.keys(g).map(Number).sort((a, b) => ((h - a + 24) % 24) - ((h - b + 24) % 24)).map(x => schedPrevHtml(x, g[x])).join('') + (un.length ? schedExceptHtml(un) : '');   // 가까운 시간대부터, 예외 기체는 맨 아래
                    })()
                    : '<div class="bba-empty">순찰 일정 데이터를 받지 못했습니다</div>';
                $('bba-sth').textContent = '📅 순찰 일정';
                const u = $('bba-sat'); if (u) u.textContent = schedAt ? schedAt + ' 기준 · 초록 = 모니터링 중' : '';
            }
            box.scrollTop = keep;
        }
        const schEl = document.createElement('div');
        schEl.id = 'bba-sch';
        schEl.innerHTML = '<div class="bba-zh"><h2 id="bba-sth">📅 순찰 일정</h2><span class="bba-cnt" id="bba-sat"></span><button class="bba-btn" id="bba-spc" style="display:none" title="순찰중단 기체의 사이트를 열어 기체 카드 유무 · 전원 · 임무받기 ON/OFF 를 확인합니다">지금 점검</button><button class="bba-btn" id="bba-sre">새로고침</button><button class="bba-btn" id="bba-scl">✕ 닫기</button></div><div class="bba-zb" id="bba-sb"></div>';
        $('bba-right').appendChild(schEl);   // 사이트 점검 / HW / SW 그리드 자리에 겹쳐서 표시
        function openSch(mode) {
            const isOpen = schEl.classList.contains('open');
            if (isOpen && schMode === mode) { schEl.classList.remove('open'); return; }
            schMode = mode; schEl.classList.add('open'); renderSched(); loadSched();
        }
        const mmHead = mm && mm.querySelector('.bb-mm-head');
        if (mmHead) {
            const sb = document.createElement('button');
            sb.id = 'bba-sbtn'; sb.className = 'bba-sbtn'; sb.textContent = '📅 순찰 일정'; sb.title = '현 시각 / 다음 시간대 순찰 일정 보기';
            mmHead.appendChild(sb);
            sb.addEventListener('click', () => openSch('sched'));
            const xb = document.createElement('button');
            xb.id = 'bba-xbtn'; xb.className = 'bba-sbtn left'; xb.textContent = '⛔ 순찰중단'; xb.title = '현재 순찰중단된 기체와 사유 보기';
            mmHead.appendChild(xb);
            xb.addEventListener('click', () => openSch('susp'));
        }
        $('bba-scl').addEventListener('click', () => schEl.classList.remove('open'));
        $('bba-sre').addEventListener('click', () => loadSched());
        $('bba-spc').addEventListener('click', () => patRun());
        loadSched();
        setInterval(() => { if (schEl.classList.contains('open')) renderSched(); }, 10 * 1000);   // 시간대 변경 · 모니터링 기체 변화 반영 (조회 없음, 화면만 다시 그림)
        try {   // 다중 모니터링 카드가 바뀌면 곧바로 반영
            const mmBody = $('bb-mm-body'); let mt = null;
            if (mmBody) new MutationObserver(() => { clearTimeout(mt); mt = setTimeout(() => { if (schEl.classList.contains('open') && schMode === 'sched') renderSched(); }, 300); }).observe(mmBody, { childList: true, subtree: true });
        } catch (e) { /* 무시 */ }
        setInterval(loadSched, 5 * 60 * 1000);


        // ───────── 메모 (집 ↔ 회사 PC 넘겨받기) ─────────
        //   · 쓰는 동안은 이 PC 의 localStorage 에만 저장 (키 bba_memo).
        //   · 레포(monitoring_no_limit/bb_backup_memo.json — vercel api/battery 경유)에는 매일 07:30 · 17:30 에만 올린다 (그 사이 이 PC 에서 바꾼 내용이 있을 때만).
        //   · 메모 버튼을 열면 레포 파일을 읽어, 다른 PC 가 올린 더 새로운 메모가 있으면 가져온다. 양쪽이 모두 바뀌었으면 덮어쓰지 않고 어느 쪽을 쓸지 묻는다.
        //   · 시각이 지난 뒤에 보드를 켜도 바로 따라잡는다 (가장 최근 07:30/17:30 회차를 아직 못 했으면 실행).
        const MEMO_API = 'https://multimonitoring.vercel.app/api/battery', MEMO_NAME = 'memo', MEMO_KEY = 'bba_memo', MEMO_SLOTS = [[7, 30], [17, 30]], MEMO_MAX = 200000, MEMO_RETRY_MS = 5 * 60 * 1000;
        let memo = (() => { try { const o = JSON.parse(lsGet(MEMO_KEY, 'null')); if (o && typeof o.text === 'string') return { text: o.text, edited: +o.edited || 0, base: +o.base || 0, slot: +o.slot || 0 }; } catch (e) { /* 무시 */ } return { text: '', edited: 0, base: 0, slot: 0 }; })();
        let memoConf = null, memoBusy = false, memoMsg = '', memoTryAt = 0, memoIsOpen = false, memoTimer = null;   // memoConf = 충돌 시 레포의 메모 {text, at}
        const memoSave = () => { lsSet(MEMO_KEY, JSON.stringify(memo)); };
        const memoDirty = () => memo.edited > memo.base;
        const memoFmt = t => { if (!t) return '—'; const d = new Date(t); return (d.toDateString() === new Date().toDateString() ? '' : (d.getMonth() + 1) + '/' + d.getDate() + ' ') + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
        function memoSlotTs(now, dir) {   // dir -1: 가장 최근에 지난 회차 · +1: 다음 회차
            const d = new Date(now); let best = dir < 0 ? 0 : Infinity;
            for (let k = -1; k <= 1; k++) MEMO_SLOTS.forEach(([h, m]) => {
                const t = new Date(d.getFullYear(), d.getMonth(), d.getDate() + k, h, m, 0, 0).getTime();
                if (dir < 0 ? (t <= now && t > best) : (t > now && t < best)) best = t;
            });
            return best;
        }
        async function memoRemote() {   // 레포의 메모 → { text, at(수정 시각) } | null(파일 없음)
            const r = await fetch(MEMO_API + '?name=' + MEMO_NAME, { cache: 'no-store' });
            if (!r.ok) throw new Error('읽기 ' + r.status);
            const j = await r.json(), d = j && j.data;
            return d && typeof d.text === 'string' ? { text: d.text, at: +d.updatedAt || 0 } : null;
        }
        async function memoPush() {
            const sent = { text: memo.text, at: memo.edited };
            const r = await fetch(MEMO_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: MEMO_NAME, data: { v: 1, text: sent.text, updatedAt: sent.at } }) });
            let j = {}; try { j = await r.json(); } catch (e) { /* 무시 */ }
            if (!r.ok || j.ok === false) throw new Error('저장 ' + r.status);
            memo.base = Math.max(memo.base, sent.at); memoSave();   // 보내는 동안 더 쓴 내용은 아직 '변경 있음'으로 남는다
        }
        // push=true 면 이 PC 에서 바꾼 내용이 있을 때 레포에 올림. 항상 먼저 레포를 읽어 더 새로운 메모를 놓치지 않는다.
        async function memoSync(push) {
            if (memoBusy) return false; memoBusy = true; memoMsg = ''; memoDraw();
            let ok = false;
            try {
                const rem = await memoRemote();
                if (rem && rem.at > memo.base) {   // 이 PC 가 아직 못 본 더 새로운 메모가 레포에 있음
                    if (rem.text === memo.text) { memo.base = rem.at; memo.edited = Math.min(memo.edited, rem.at) || rem.at; memoSave(); memoConf = null; }
                    else if (!memoDirty()) { memo.text = rem.text; memo.base = memo.edited = rem.at; memoSave(); memoConf = null; memoFill(); }
                    else { memoConf = rem; throw new Error('충돌'); }
                }
                if (push && memoDirty()) await memoPush();
                memoConf = null; ok = true;
            } catch (e) { if (!memoConf) memoMsg = '네트워크 오류 (' + ((e && e.message) || '') + ')'; }
            finally { memoBusy = false; memoDraw(); }
            return ok;
        }
        function memoTick() {   // 30초마다: 가장 최근 07:30/17:30 회차를 아직 못 했으면 실행
            try { const o = JSON.parse(lsGet(MEMO_KEY, 'null')); if (o && +o.slot > memo.slot) memo.slot = +o.slot; } catch (e) { /* 무시 */ }
            const now = Date.now(), T = memoSlotTs(now, -1);
            if (memo.slot >= T || memoBusy || memoConf || now < memoTryAt) return;
            memoTryAt = now + MEMO_RETRY_MS;   // 실패하면 5분 뒤 다시
            memoSync(true).then(ok => { if (ok) { memo.slot = T; memoSave(); memoDraw(); } });
        }
        const memoEl = document.createElement('div');
        memoEl.id = 'bba-memo';
        memoEl.innerHTML = '<div class="bba-zh"><h2>📝 메모</h2><span class="bba-cnt" id="bba-memo-st"></span><button class="bba-btn" id="bba-memo-save" title="07:30 · 17:30 을 기다리지 않고 지금 레포에 올립니다">지금 저장</button><button class="bba-btn" id="bba-memo-cl">✕ 닫기</button></div>' +
            '<div id="bba-memo-cf" style="display:none"></div><textarea id="bba-memo-ta" spellcheck="false" maxlength="' + MEMO_MAX + '" placeholder="여기에 메모를 적으세요. 이 PC 에 바로 저장되고, 매일 07:30 · 17:30 에 레포로 올라가 다른 PC 에서 이어서 볼 수 있습니다."></textarea>';
        $('bb').appendChild(memoEl);
        function memoFill() { const ta = $('bba-memo-ta'); if (ta && document.activeElement !== ta && ta.value !== memo.text) ta.value = memo.text; }
        function memoDraw() {
            const st = $('bba-memo-st'), cf = $('bba-memo-cf'), btn = $('bba-memob'), sv = $('bba-memo-save');
            if (btn) { btn.classList.toggle('warn', !!memoConf); btn.classList.toggle('on', memoIsOpen); btn.textContent = memoConf ? '📝 메모 ⚠' : '📝 메모'; }
            if (!st) return;
            const nx = memoSlotTs(Date.now(), 1);
            st.textContent = (memoBusy ? '레포 확인 중… · ' : '') + '레포 저장본 ' + memoFmt(memo.base) + (memoDirty() ? ' · ● 변경 있음 (다음 자동 저장 ' + memoFmt(nx) + ')' : ' · 저장본과 같음') + (memoMsg ? ' · ' + memoMsg : '');
            if (sv) sv.disabled = memoBusy;
            if (memoConf) {
                cf.style.display = '';
                cf.innerHTML = '<b>다른 PC 에서 저장한 메모(' + memoFmt(memoConf.at) + ')와 이 PC 의 메모가 모두 바뀌었습니다.</b> 어느 쪽을 쓸까요?' +
                    '<button class="bba-btn" id="bba-memo-mine">이 PC 것으로 덮어쓰기</button><button class="bba-btn" id="bba-memo-theirs">레포 것 가져오기 (이 PC 것은 따로 보관)</button>';
                $('bba-memo-mine').onclick = async () => { memo.edited = Math.max(Date.now(), memoConf.at + 1); memo.base = memoConf.at; memoSave(); memoConf = null; await memoSync(true); };
                $('bba-memo-theirs').onclick = () => { try { lsSet('bba_memo_backup', JSON.stringify({ text: memo.text, at: Date.now() })); } catch (e) { /* 무시 */ } memo.text = memoConf.text; memo.base = memo.edited = memoConf.at; memoSave(); memoConf = null; memoFill(); memoDraw(); };
            } else { cf.style.display = 'none'; cf.innerHTML = ''; }
        }
        function openMemo() {
            memoIsOpen = !memoIsOpen;
            memoEl.classList.toggle('open', memoIsOpen);
            if (memoIsOpen) {
                const hd = document.querySelector('#bb .bb-hd'); memoEl.style.top = (hd ? hd.offsetTop + hd.offsetHeight : 64) + 'px';   // 헤더(줌·닫기 버튼)는 가리지 않고 그 아래 오른쪽 절반
                memoFill(); const ta = $('bba-memo-ta'); if (ta) ta.value = memo.text;
                memoSync(false).then(() => { memoFill(); try { $('bba-memo-ta').focus(); } catch (e) { /* 무시 */ } });   // 열 때 레포 파일을 읽어 더 새로운 메모가 있으면 가져옴
            }
            memoDraw();
        }
        (() => {
            const ta = $('bba-memo-ta'); let t = null;
            ['keydown', 'keyup', 'keypress'].forEach(ev => ta.addEventListener(ev, e => e.stopPropagation()));   // 보드/NCC 의 단축키와 겹치지 않게
            ta.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { memo.text = ta.value; memo.edited = Math.max(Date.now(), memo.base + 1); memoSave(); memoDraw(); }, 250); });
            $('bba-memo-cl').addEventListener('click', () => { if (memoIsOpen) openMemo(); });
            $('bba-memo-save').addEventListener('click', () => { memoMsg = ''; memoSync(true).then(ok => { if (ok) { memoMsg = '저장됨 ' + memoFmt(Date.now()); memoDraw(); } }); });
            const wrap = document.querySelector('#bb .bb-hd-rightwrap');
            if (wrap) { const row = document.createElement('div'); row.id = 'bba-memorow'; wrap.appendChild(row); const kb = document.createElement('button'); kb.id = 'bba-killb'; kb.textContent = '⛔ Kill All'; kb.title = '진행 중인 모든 점검(iframe)을 즉시 중지'; const b = document.createElement('button'); b.id = 'bba-memob'; b.textContent = '📝 메모'; b.title = '메모 — 집/회사 PC 에서 이어 쓰기 (이 PC 에 바로 저장 · 매일 07:30 / 17:30 에 레포로 올림)'; row.appendChild(b); row.appendChild(kb); b.addEventListener('click', openMemo);
                const ka = document.createElement('div'); ka.id = 'bba-killask'; ka.innerHTML = '<div class="m">진행 중인 모든 점검을 중지할까요?</div><div class="b"><button type="button" class="bba-btn" data-v="0">아니오</button><button type="button" class="bba-btn" data-v="1">예</button></div>'; row.appendChild(ka);
                kb.addEventListener('click', e => { e.stopPropagation(); ka.classList.toggle('open'); });
                ka.addEventListener('click', e => {
                    const bt = e.target.closest && e.target.closest('button[data-v]'); if (!bt) return;
                    ka.classList.remove('open');
                    if (bt.dataset.v !== '1') return;
                    killAll(); kb.textContent = 'Killed'; kb.disabled = true;
                    setTimeout(() => { kb.textContent = '⛔ Kill All'; kb.disabled = false; }, 2000);
                });
                document.addEventListener('mousedown', e => { if (ka.classList.contains('open') && !ka.contains(e.target) && e.target !== kb) ka.classList.remove('open'); }, true);
            }
            window.addEventListener('storage', e => { if (e.key !== MEMO_KEY) return; try { const o = JSON.parse(e.newValue || 'null'); if (o && typeof o.text === 'string') { memo = { text: o.text, edited: +o.edited || 0, base: +o.base || 0, slot: +o.slot || 0 }; memoFill(); memoDraw(); } } catch (x) { /* 무시 */ } });   // 같은 PC 의 다른 보드 탭에서 쓴 내용 반영
            memoDraw();
            memoTimer = setInterval(memoTick, 30 * 1000); setTimeout(memoTick, 6000);   // 켜자마자 지난 회차를 못 했으면 따라잡기
        })();

        // ───────── 업무일 / 저장 ─────────
        const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
        function workDay() { const d = new Date(); if (nowMin() < WD0) d.setDate(d.getDate() - 1); return d; }
        const wdKey = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
        const rel = m => (m - WD0 + 1440) % 1440;
        let curKey = '', chk = {}, camp = {}, auto = {}, campAuto = {};
        function loadDay() {
            const k = wdKey(workDay());
            if (k === curKey) return false;
            curKey = k;
            try { chk = JSON.parse(lsGet('bba_chk_' + k, '{}')) || {}; } catch (e) { chk = {}; }
            try { camp = JSON.parse(lsGet('bba_camp_' + k, '{}')) || {}; } catch (e) { camp = {}; }
            try { const LEG = { '아산 스테이그린': '아산', '가평 니모': '가평', '대관령 솔내음': '대관령', '파주 LGD': '파주LGD', '진천 힐사이드': '진천' }; Object.keys(LEG).forEach(o => { if (camp[o]) { if (!camp[LEG[o]]) camp[LEG[o]] = camp[o]; delete camp[o]; } }); } catch (e) { /* 무시 */ }   // 이름을 줄이기 전에 눌러 둔 오늘 기록 이어받기
            try { auto = JSON.parse(lsGet('bba_auto_' + k, '{}')) || {}; } catch (e) { auto = {}; }
            try { campAuto = JSON.parse(lsGet('bba_campauto_' + k, '{}')) || {}; } catch (e) { campAuto = {}; }
            try { migrateIds(); } catch (e) { /* 무시 */ }
            try {   // 지난 업무일 기록 정리 (최근 3일만 유지)
                const keep = new Date(k).getTime();
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const key = localStorage.key(i) || '';
                    const m = /^bba_(?:chk|camp|auto|campauto)_(\d{4}-\d{2}-\d{2})$/.exec(key);
                    if (m && keep - new Date(m[1]).getTime() > 3 * 864e5) localStorage.removeItem(key);
                }
            } catch (e) { /* 무시 */ }
            return true;
        }

        // ───────── daily_tasks.json ─────────
        const hm = s => { const m = /(\d{1,2}):(\d{2})/.exec(s || ''); return m ? (+m[1]) * 60 + (+m[2]) : null; };
        const HUEMAP = {};   // 근무자 이름 → '색상;--l:밝기%' (오늘 업무표에 나오는 이름끼리는 서로 다른 파스텔이 되도록 배정)
        const hue = n => { n = String(n); if (HUEMAP[n]) return HUEMAP[n]; let h = 0; for (const ch of n) h = (h * 31 + ch.charCodeAt(0)) % 360; return h + ';--l:84%'; };
        function buildHues(names) {   // 색상환을 N등분하고, 이름순으로 이웃한 사람끼리는 색이 멀어지도록 건너뛰며 배정 + 3단계 밝기로 한 번 더 구분
            Object.keys(HUEMAP).forEach(k => delete HUEMAP[k]);
            const ns = [...new Set(names.filter(x => x && !/없음/.test(x)))].sort((a, b) => a.localeCompare(b, 'ko')), N = ns.length; if (!N) return;
            const gcd = (a, b) => b ? gcd(b, a % b) : a; let step = Math.max(1, Math.round(N * 0.382)); while (gcd(step, N) !== 1) step++;
            const LV = [86, 78, 92];
            ns.forEach((n, i) => { const slot = (i * step) % N; HUEMAP[n] = (Math.round(slot * 360 / N + 8) % 360) + ';--l:' + LV[i % 3] + '%'; });
        }
        const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
        let tasks = [];
        let monRows = [], sciTasks = [];   // 다중/서브 모니터링 시간대 행, 부산 국립과학관 업무 (업무표에는 안 나오고 '담당자 보기'에서만 사용)
        function parseTasks(arr) {
            const out = [], monTmp = [], sciTmp = [], occ = {};
            (Array.isArray(arr) ? arr : []).forEach(t => {
                if (t && t.type === 'monitoring') { const mn = hm(t.rawTime); if (mn != null) monTmp.push({ s: mn, u: String(t.user == null ? '' : t.user).trim(), sub: String(t.subUser == null ? '' : t.subUser).trim() }); return; }   // 다중(user)·서브(subUser) 시간대 행은 업무표에서 제외
                if (!t) return;
                const c = String(t.content || ''), isSci = /부산\s*(국립\s*)?과학관/.test(c);   // 부산(국립)과학관 업무는 업무표에 표시하지 않음
                const r = /^\[(\d{1,2}:\d{2})(?:\s*~\s*(\d{1,2}:\d{2}))?\]/.exec(c);
                const s = r ? hm(r[1]) : hm(t.rawTime);
                if (s == null) return;
                const e = r && r[2] ? hm(r[2]) : s;
                const m = /\[([^\]]*)\]\s*$/.exec(c);
                const isTag = m && /평일|주말|매일|^\s*[월화수목금토일](\s*,\s*[월화수목금토일])*\s*$/.test(m[1]);
                const tag = isTag ? m[1].trim() : '';
                let days = null;
                if (tag === '평일') days = [1, 2, 3, 4, 5];
                else if (tag === '주말') days = [0, 6];
                else if (tag && tag !== '매일') days = tag.split(',').map(x => DAYS.indexOf(x.trim())).filter(x => x >= 0);
                let body = r ? c.slice(r[0].length) : c;
                if (isTag) body = body.replace(/\s*\[[^\]]*\]\s*$/, '');
                const u0 = String(t.user == null ? '' : t.user).trim();
                if (isSci) { sciTmp.push({ s, e, u: u0, body: body.replace(/부산\s*(국립\s*)?과학관/g, '').replace(/\s+/g, ' ').trim(), days }); return; }
                const bd = body.trim(), prog = AUTO_SITES.filter(S => S.prog && S.kw.test(bd) && S.prog.test(bd));   // '임무 진행 중인지' 확인형 업무
                const chg = CHG_RE.test(bd);   // 무선충전 기체 주차 상태(충전중) 확인 업무
                const dirs = chg ? [{ g: null, w: 'chg' }] : prog.length ? [{ g: null, w: 'run' }] : parseDirs(bd), sites = chg ? CHG_SITES : prog.length ? prog : AUTO_SITES.filter(S => !S.prog && S.kw.test(bd));
                const oc = occ[c] = (occ[c] || 0) + 1;   // id 는 담당자와 무관하게 '업무 문구(+같은 문구 순번)' 로만 만든다 — 당일 배정자가 바뀌어도 체크/점검 기록이 사라지지 않도록
                out.push({ id: hash('c|' + c + '|' + oc), lid: hash(u0 + '|' + c), u: u0, head: r ? r[0] : '', body: bd, tag: tag ? '[' + tag + ']' : '', s, e, days, dirs, sites, chg,
                    auto: dirs.length > 0 && sites.length > 0 && (chg || prog.length > 0 || !AUTO_SKIP_RE.test(bd)) });   // 임무 ON/OFF 가 적힌 업무 중 점검 가능한 사이트(제외 단어 없음, 18시 이전)
            });
            out.sort((a, b) => rel(a.s) - rel(b.s));
            tasks = out; monRows = monTmp; sciTasks = sciTmp;
            try { buildHues(out.map(t => t.u)); } catch (e) { /* 색 배정 실패 시 기본 해시 색 */ }
            try { migrateIds(); } catch (e) { /* 무시 */ }
        }
        function migrateIds() {   // 예전 id(담당자 포함)로 저장된 오늘의 체크·점검 기록을 새 id 로 이어받기
            if (!curKey) return;
            let c1 = false, a1 = false, cs = {}, as = {};
            try { cs = JSON.parse(lsGet('bba_chk_' + curKey, '{}')) || {}; as = JSON.parse(lsGet('bba_auto_' + curKey, '{}')) || {}; } catch (e) { return; }
            tasks.forEach(t => { if (t.lid && t.lid !== t.id) { if (cs[t.lid] && !cs[t.id]) { cs[t.id] = cs[t.lid]; c1 = true; } if (as[t.lid] && !as[t.id]) { as[t.id] = as[t.lid]; a1 = true; } } });
            if (c1) lsSet('bba_chk_' + curKey, JSON.stringify(cs)); if (a1) lsSet('bba_auto_' + curKey, JSON.stringify(as));
            if (c1 || a1) { try { reloadChk(); reloadAuto(); } catch (e) { /* 무시 */ } }
        }
        let srcMsg = '';
        async function loadTasks() {
            try {
                const res = await fetch(TASKS_URL + '?t=' + Date.now(), { cache: 'no-store' });
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const txt = await res.text();
                const json = JSON.parse(txt);
                lsSet('bba_tasks_cache', txt);
                try {   // admin 전용 전체 행 파일 (없거나 실패해도 기존 기능에는 영향 없음)
                    const rf = await fetch(TASKS_FULL_URL + '?t=' + Date.now(), { cache: 'no-store' });
                    if (rf.ok) { const ft = await rf.text(); JSON.parse(ft); lsSet('bba_tasks_full', ft); }
                } catch (ef) { /* 무시 */ }
                parseTasks(json);
                try { if (typeof simOnNewJson === 'function') simOnNewJson(txt); } catch (e2) { /* 무시 */ }
                srcMsg = '업무표 ' + pad(new Date().getHours()) + ':' + pad(new Date().getMinutes()) + ' 갱신';
            } catch (e) {
                try { parseTasks(JSON.parse(lsGet('bba_tasks_cache', '[]'))); } catch (e2) { tasks = []; }
                srcMsg = '업무표 불러오기 실패 — ' + (tasks.length ? '저장본 표시' : '데이터 없음');
                console.warn('[BBA] daily_tasks.json 불러오기 실패:', e && e.message);
            }
            const el = $('bba-src'); if (el) el.textContent = srcMsg;
            renderTasks(); try { drawMmp(); } catch (e) { /* 아직 준비 전 */ }
            setTimeout(autoTick, 1500);   // 업무표를 새로 받았으면 점검할 것이 있는지 바로 확인
        }

        // ───────── 임무 ON/OFF 자동 점검: 업무 문구 분석 · 저장 ─────────
        const siteByKey = k => AUTO_SITES.find(s => s.k === k) || null;
        const dimOf = t => false;   // 18시 이후 업무도 다른 업무처럼 체크·집계
        function parseDirs(body) {
            const re = /(?:(주간|야간)\s*)?임무(?:\s*받기)?\s*(ON|OFF)\b/gi, out = []; let m;
            while ((m = re.exec(body))) out.push({ g: m[1] || null, w: m[2].toLowerCase() });
            return out;
        }
        const cfgAll = () => { try { return JSON.parse(lsGet('bba_auto_cfg', '{}')) || {}; } catch (e) { return {}; } };   // 업무별 기체 선정 (날짜와 무관하게 유지)
        function defaultsFor(t) {   // 설정을 저장하기 전의 기본 점검 대상: 사이트 기체 전부 + 문구의 ON/OFF (주/야간 묶음이 있는 사이트는 문구/시각에 맞는 묶음만)
            const res = [], seen = new Set(), put = (S, u, w) => { const key = S.k + '|' + u.n; if (!seen.has(key)) { seen.add(key); res.push({ k: S.k, n: u.n, w }); } };
            t.sites.forEach(S => {
                if (S.def) { S.def(t).forEach(x => put(S, S.units[x.i], x.w)); }
                else if (S.units.some(u => u.g)) {
                    t.dirs.forEach(d => {
                        const g = d.g || (t.s < (S.dayUntil || 15 * 60) ? '주간' : '야간');
                        S.units.filter(u => u.g === g).forEach(u => put(S, u, d.w));
                    });
                } else {
                    const ws = [...new Set(t.dirs.map(d => d.w))];
                    if (ws.length === 1) S.units.forEach(u => put(S, u, ws[0]));
                }
            });
            return res;
        }
        function effOf(t) {   // 이 업무에 실제로 적용되는 점검 설정 {on, u:[{k,n,w}], pw}
            const c = cfgAll()[t.id];
            let u = c && Array.isArray(c.u) ? c.u : defaultsFor(t);
            u = u.filter(x => { const S = siteByKey(x.k); return S && S.id && S.units.some(y => y.n === x.n) && (x.w === 'on' || x.w === 'off' || x.w === 'run' || x.w === 'chg'); });
            return { on: !(c && c.on === false), u, pw: c && typeof c.pw === 'boolean' ? c.pw : null, custom: !!c };
        }
        const pwRule = (e, S) => (e.pw === null ? !!S.powerOnly : e.pw);
        const dayStartTs = () => { const d = workDay(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };
        function timingOf(t) { const S = t.sites.find(x => x.at || x.extra); return { at: (S && S.at) || AUTO_RANGE_AT, delay: AUTO_DELAY_MIN + ((S && S.extra) || 0) }; }   // 사이트별 점검 기준(시작/끝)과 추가 지연
        // 재점검까지의 시간: 충전 점검 5분 / 사이트에 retryMs 가 있으면 그 시간 / 그 밖에는 AUTO_RETRY_MS
        const retryMsOf = t => (t.chg ? CHG_RETRY_MS : ((t.sites.find(x => x.retryMs) || {}).retryMs || AUTO_RETRY_MS));
        // plan:'front' 사이트(역삼·성수 요기요): 앞시각 +1분, 앞시각 +5분, 그래도 안 되면 뒷시각 정각에 마지막 1회 (뒷시각이 없는 단일 시각 업무는 앞의 2회까지)
        function attemptsOf(t) {
            if (t.chg) return [t.s + 1, t.s + 5].map(m => dayStartTs() + m * 60000);   // 무선충전(⚡) 점검: +1분, +5분 딱 두 번 (+5분은 +1분에 통과 못 한 기체만)
            if (!t.sites.some(x => x.plan === 'front')) return null;
            let e = t.e; if (e < t.s) e += 1440;
            const a = [t.s + 1, t.s + 5]; if (e > t.s + 5) a.push(e);
            return a.map(m => dayStartTs() + m * 60000);
        }
        const maxTriesOf = t => { const a = attemptsOf(t); return a ? a.length : AUTO_MAX_TRIES; };
        function dueTs(t) {
            const at = attemptsOf(t); if (at) return at[0]; const tm = timingOf(t); let m = tm.at === 'start' ? t.s : t.e; if (m < t.s) m += 1440; return dayStartTs() + (m + tm.delay) * 60000; }
        const todayOk = t => !t.days || t.days.includes(workDay().getDay());
        const hmOf = ts => { const d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
        const autoKey = () => 'bba_auto_' + curKey;
        function reloadAuto() { try { auto = JSON.parse(lsGet(autoKey(), '{}')) || {}; } catch (e) { auto = {}; } }
        function reloadChk() { try { chk = JSON.parse(lsGet('bba_chk_' + curKey, '{}')) || {}; } catch (e) { /* 그대로 */ } }
        function autoPut(id, rec) { reloadAuto(); if (rec === null) delete auto[id]; else auto[id] = rec; lsSet(autoKey(), JSON.stringify(auto)); }
        const autoEnabled = () => lsGet('bba_auto_on', '1') !== '0' && lsGet('bbaAutoOff', '') !== '1';
        const sleep = ms => new Promise(r => setTimeout(r, ms));
        // 여러 보드 탭이 같은 PC 에서 열려 있어도 점검 iframe 은 한 번에 하나만 (잠금은 localStorage, 150초 안 갱신되면 무효)
        const TABID = Math.random().toString(36).slice(2);
        const lockGet = () => { try { return JSON.parse(lsGet('bba_auto_lock', 'null')); } catch (e) { return null; } };
        function lockTake(ids, site) {
            const l = lockGet(), now = Date.now();
            if (l && l.tab !== TABID && now - l.t < 150000) return false;
            lsSet('bba_auto_lock', JSON.stringify({ tab: TABID, t: now, ids, site: site || '' }));
            const v = lockGet(); return !!(v && v.tab === TABID);
        }
        function lockFree() { const l = lockGet(); if (l && l.tab === TABID) { try { localStorage.removeItem('bba_auto_lock'); } catch (e) { /* 무시 */ } } }
        const runningIds = () => {   // 점검 중인 업무 — 잠금이 최근(90초) 것이고, 이 탭의 잠금이면 실제로 이 탭이 점검 중일 때만
            const l = lockGet(); if (!l || !l.ids || Date.now() - l.t >= 90000) return [];
            if (l.tab === TABID && !autoBusy && !campBusy) { lockFree(); return []; }
            return l.ids;
        };

        // ───────── 점검용 숨김 iframe: 사이트 페이지를 열어 기체 카드의 임무받기 스위치 · 전원을 읽는다 ─────────
        const NCC_ORIGIN = /(^|\.)neubility\.ai$/.test(location.hostname) ? location.origin : 'https://ncc.neubility.ai';
        function cardMatches(txt, u) {   // 카드 글자(공백 제거) 안에 기체 이름이 있고, 앞뒤가 숫자가 아닐 것 (1호기 ↔ 11호기 혼동 방지)
            return u.m.some(tok => {
                const t = normTxt(tok); if (!t) return false;
                for (let i = txt.indexOf(t); i >= 0; i = txt.indexOf(t, i + 1)) {
                    if (!/\d/.test(txt.charAt(i - 1) || ' ') && !/\d/.test(txt.charAt(i + t.length) || ' ')) return true;
                }
                return false;
            });
        }
        function readSwitch(sw) {
            const input = sw.querySelector('input[type="checkbox"]');
            if (input) return input.checked;
            const aria = sw.querySelector('[role="switch"],[aria-checked]');
            if (aria) return aria.getAttribute('aria-checked') === 'true';
            const ds = sw.querySelector('[data-state]');
            if (ds) return ds.getAttribute('data-state') === 'checked';
            return null;
        }
        function readPower(card) {   // '로봇 전원' 행: 꺼짐 → false, 켜짐 → true, 못 읽음 → null
            let best = null, bestLen = Infinity;
            card.querySelectorAll('div,span,p,li').forEach(el => {
                const t = el.textContent.replace(/\s+/g, ' ').trim();
                if (!t.startsWith('로봇 전원') || t.length <= 5) return;
                if (t.length < bestLen) { best = t; bestLen = t.length; }
            });
            if (best === null) return null;
            const raw = best.replace(/^로봇 전원\s*/, '');
            return raw.includes('꺼짐') ? false : raw.includes('켜짐') ? true : null;
        }
        function readCharge(card) {   // '로봇 전원' 행에서 번개(⚡) 표시와 배터리 수치를 읽는다 → {ch, bat, row}
            let best = null, bl = Infinity;
            card.querySelectorAll('div,span,p,li').forEach(el => {
                const t = el.textContent.replace(/\s+/g, ' ').trim();
                if (!t.startsWith('로봇 전원') || t.length <= 5) return;
                if (t.length < bl) { best = el; bl = t.length; }
            });
            if (!best) return null;
            const txt = best.textContent.replace(/\s+/g, ' ').trim(), m = /배터리\s*(\d{1,3})\s*%/.exec(txt);
            const ch = /⚡|충전/.test(txt) || /icon-bolt|bolt-wireless/i.test(best.innerHTML);   // NCC 의 무선충전 아이콘: <svg> 안의 clip-path id 'icon-bolt-wireless_svg__a' (다른 종류의 svg 는 충전 표시로 보지 않음)
            return { ch, bat: m ? +m[1] : null, row: best.outerHTML.slice(0, 600) };
        }
        function readGps(card) {   // 'GPS 수신' 행의 값 ('-'·빈 값이면 '') — 행을 못 찾으면 null
            const rows = [...card.querySelectorAll('div,span,p,li,dd,dt')].filter(el => /^GPS\s*수신/.test(el.textContent.replace(/\s+/g, ' ').trim()));
            if (!rows.length) return null;
            rows.sort((a, b) => a.textContent.length - b.textContent.length);
            const L = rows[0], strip = x => x.replace(/\s+/g, ' ').trim().replace(/^GPS\s*수신\s*/, '').trim();
            let v = strip(L.textContent);
            if (!v) { if (L.nextElementSibling) v = strip(L.nextElementSibling.textContent); else if (L.parentElement && L.parentElement.children.length <= 3) v = strip(L.parentElement.textContent); }
            return /^[-–—~]*$/.test(v) ? '' : v;
        }
        function patrolFulls() {   // 지금 다중 모니터링 그리드에서 순찰 중인 기체의 NCC 기체명(정규화) 집합
            const set = new Set(), M = window.__bbaPatrolNames || {};
            document.querySelectorAll('#bb-mm-body .bb-mm-card').forEach(c => {
                const short = ((c.querySelector('.bb-mm-name') || {}).textContent || '').trim(), full = (c.dataset.full || '').trim();
                let names = full ? [full] : [].concat((M.full && M.full[short]) || []);
                if (!names.length && M.long) Object.keys(M.long).forEach(f => { if (M.long[f] === short) names.push(f); });
                if (!names.length && short) names.push(short);
                names.forEach(n => set.add(normTxt(n)));
            });
            return set;
        }
        function readProgress(card) {   // '임무 진행' 행의 값 글자 (비어 있거나 '-'·'없음'이면 '') — 행을 못 찾으면 null
            const rows = [...card.querySelectorAll('div,span,p,li,dd,dt,label')].filter(el => /^임무\s*진행/.test(el.textContent.replace(/\s+/g, ' ').trim()));
            if (!rows.length) return null;
            rows.sort((a, b) => a.textContent.length - b.textContent.length);
            const L = rows[0], strip = x => x.replace(/\s+/g, ' ').trim().replace(/^임무\s*진행\s*/, '').trim();
            let v = strip(L.textContent);
            if (!v) {   // 라벨만 있는 요소 → 값은 다음 형제 칸이나 같은 행(부모)에 있을 수 있음
                if (L.nextElementSibling) v = strip(L.nextElementSibling.textContent);
                else if (L.parentElement && L.parentElement.children.length <= 3) v = strip(L.parentElement.textContent);
            }
            return /^(?:[-–—~]+|없음|없다|n\/?a|none|null)?$/i.test(v) ? '' : v;
        }
        function scrollers(doc, win, card) {   // 카드 목록이 들어 있는 스크롤 영역(기체 카드 그리드)과 문서 자체
            const out = [];
            for (let el = card && card.parentElement; el && el !== doc.documentElement; el = el.parentElement) {
                let oy = ''; try { oy = win.getComputedStyle(el).overflowY; } catch (e) { /* 무시 */ }
                if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 8) out.push(el);
            }
            if (doc.scrollingElement && doc.scrollingElement.scrollHeight > doc.scrollingElement.clientHeight + 8) out.push(doc.scrollingElement);
            return out;
        }
        // 점검 1건은 무슨 일이 있어도 PROBE_TIMEOUT_MS+15초 안에 끝낸다 (타이머 지연·iframe 멈춤 대비) + 진행 상황 표시용 기록
        let probeInfo = null, lastBeat = Date.now(), btInfo = null, btBeat = Date.now();
        // ── Kill All: 진행 중인 모든 점검(iframe)을 즉시 멈춘다. killGen 이 바뀌면 각 점검 루프는 결과를 기록하지 않고 빠져나온다.
        let killGen = 0, killUntil = 0; const probeFins = new Set(); const KILL_COOL_MS = 2 * 60 * 1000;   // 멈춘 직후 2분 동안은 예약된 자동 점검이 바로 되살아나지 않게 쉼
        function killAll() {
            const wasPat = patBusy, wasCu = cuBusy; killGen++; killUntil = Date.now() + KILL_COOL_MS;
            [...probeFins].forEach(f => { try { f('killed'); } catch (e) { /* 무시 */ } });   // 열려 있는 점검 iframe 을 모두 닫고 점검 약속을 '중단'으로 끝냄
            try { document.querySelectorAll('iframe[title="bba-probe"]').forEach(x => x.remove()); } catch (e) { /* 무시 */ }
            // 화면에는 즉시 반영 (각 루프는 다음 순간 스스로 빠져나옴)
            autoBusy = false; campBusy = false; patBusy = false; btBusy = false; btCur = null; btInfo = null; probeInfo = null; curSiteTxt = ''; curProg = '';
            try { forced.clear(); campForce.clear(); } catch (e) { /* 무시 */ }
            try { lockFree(); lsSet('bba_auto_lock', 'null'); btLockFree(); } catch (e) { /* 무시 */ }
            try { drawAutoPill(); } catch (e) { /* 무시 */ }
            try { renderTasks(); } catch (e) { /* 무시 */ }
            try { drawCamp(); } catch (e) { /* 무시 */ }
            try { drawBt(); } catch (e) { /* 무시 */ }
            try { if (wasCu) { cuBusy = false; cuCur = null; cuMsg = '점검을 중단했습니다'; if (cuRes) { cuRes.busy = false; cuRes.stopped = true; cuRes.at = cuRes.at || Date.now(); cuSaveRes(); } } cuDraw(); cuDrawBtn(); } catch (e) { /* 무시 */ }
            try { if (wasPat) patMsg = '점검을 중단했습니다'; renderSched(); } catch (e) { /* 무시 */ }
            console.warn('[BBA] Kill All — 모든 점검을 중단했습니다');
        }
        function probeSite(S, units) {
            const info = { k: S.k || S.label || String(S.id), t0: Date.now() };
            if (S.pat || S.cu) { /* 순찰중단·커스텀 수동 점검 — 자동 점검 표시/감시와 분리 */ } else if (S.bt) btInfo = info; else { probeInfo = info; lastBeat = info.t0; }
            return new Promise(resolve => {
                let end = false;
                const out = r => { if (end) return; end = true; clearTimeout(hard); if (S.pat || S.cu) { /* 없음 */ } else if (S.bt) { btBeat = Date.now(); if (btInfo === info) btInfo = null; } else { lastBeat = Date.now(); if (probeInfo === info) probeInfo = null; } resolve(r); };
                const hard = setTimeout(() => {
                    console.warn('[BBA] 점검 강제 종료(응답 없음):', info.k);
                    try { document.querySelectorAll('iframe[title="bba-probe"]').forEach(x => x.remove()); } catch (e) { /* 무시 */ }
                    out({ err: 'timeout', units: {}, names: [], cards: 0 });
                }, PROBE_TIMEOUT_MS + 15000);
                probeSite0(S, units).then(out, () => out({ err: 'noread', units: {}, names: [], cards: 0 }));
            });
        }
        function cardName(card) {   // 기체 카드의 이름 글자: 카드 안 첫 번째 '이름처럼 보이는' 글자
            const lab = /^(로봇\s*전원|임무|GPS|배터리|현재|위치|상태|순찰|충전)/;
            for (const e of card.querySelectorAll('*')) {
                if (e.children.length) continue;
                const t = (e.textContent || '').replace(/\s+/g, ' ').trim();
                if (t.length >= 2 && !lab.test(t) && !/^[-–—\d%.:\s]+$/.test(t)) return t.slice(0, 40);
            }
            return (card.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24);
        }
        function probeSite0(S, units) {   // → Promise<{err?, units:{[n]:{found,on,pw}}, names:[...]}>
            return new Promise(resolve => {
                const f = document.createElement('iframe');
                f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1; f.title = 'bba-probe';
                // 화면 안쪽(투명·클릭 불가)에 둔다: 화면 밖이면 NCC 화면의 '보일 때만 그리기'가 멈출 수 있어서. 크게 그린 뒤 축소해서 작게 놓는다.
                f.style.cssText = 'position:fixed;left:0;top:0;width:' + PROBE_W + 'px;height:' + PROBE_H + 'px;border:0;transform:scale(.3);transform-origin:0 0;opacity:0;pointer-events:none;z-index:-1;';
                const seen = {}, names = new Set(), allSeen = {}; let lastCnt = 0, cntAt = 0, done = false, t0 = Date.now(), cardsAt = 0, listAt = 0, cardN = 0, scrollDone = false, lastScroll = 0, iv = null, mo = null, to = null, lastScan = 0, docRef = null;
                const fin = err => {
                    if (done) return; done = true; probeFins.delete(fin);
                    clearInterval(iv); clearTimeout(to); try { mo && mo.disconnect(); } catch (e) { /* 무시 */ }
                    try { f.src = 'about:blank'; } catch (e) { /* 무시 */ }
                    setTimeout(() => { try { f.remove(); } catch (e) { /* 무시 */ } }, 30);
                    const res = {}; units.forEach(u => { res[u.n] = seen[u.n] ? { found: true, on: seen[u.n].on, pw: seen[u.n].pw, pg: seen[u.n].pg, ch: seen[u.n].ch, bat: seen[u.n].bat, gp: seen[u.n].gp, row: seen[u.n].row } : { found: false }; });
                    resolve({ err: err || null, units: res, cards: cardN, names: [...names].slice(0, 30), ms: Date.now() - t0, all: S.cu ? Object.keys(allSeen).map(k => allSeen[k]) : undefined });
                };
                probeFins.add(fin); if (S.cu) S.kill = fin;
                const scan = () => {
                    if (done) return;
                    lastScan = Date.now();
                    let doc, win;
                    try { win = f.contentWindow; doc = f.contentDocument; void (doc && doc.body); } catch (e) { return fin('xorigin'); }
                    if (!doc || !doc.body || !win) return;
                    const path = (win.location && win.location.pathname) || '';
                    if (path === 'blank' || /^about:/.test(win.location && win.location.href || '')) return;
                    if (/\/(login|signin|sign-in|auth)\b/i.test(path) || doc.querySelector('input[type="password"]')) return fin('login');
                    const now = Date.now();
                    const cards = doc.querySelectorAll('[data-qk="robot-card"]');
                    if (cards.length && !cardsAt) cardsAt = now;
                    if (cards.length) cardN = cards.length;
                    if ((S.chg || S.bt || S.pat || S.cu) && !cards.length) {   // 기체 목록 틀(검색창)은 그려졌는데 카드가 하나도 없는 채로 일정 시간 → 입고됨
                        if (doc.querySelector('[data-qk="search-robot-card-list-wrapper"]') && !listAt) listAt = now;
                        if (listAt && now - listAt > CHG_EMPTY_MS) return fin(null);
                    }
                    cards.forEach(card => {
                        const txt = normTxt(card.textContent);
                        if (names.size < 40) names.add(txt.slice(0, 26));
                        if (S.cu) {   // 커스텀 점검: 화면의 카드를 전부 읽어 둔다 (스크롤로 사라진 카드도 남도록 누적)
                            const nm = cardName(card), key = normTxt(nm) || txt.slice(0, 24), sw0 = card.querySelector('[data-qk="mission-available-switch"]'), cg0 = readCharge(card);
                            const v = { name: nm, txt: txt.slice(0, 200), on: sw0 ? readSwitch(sw0) : null, pw: readPower(card), bat: cg0 ? cg0.bat : null, ch: !!(cg0 && cg0.ch), gp: readGps(card), pg: readProgress(card) }, c0 = allSeen[key];
                            if (!c0) allSeen[key] = Object.assign(v, { since: now, at: now });
                            else if (['on', 'pw', 'bat', 'ch', 'gp', 'pg'].some(f => c0[f] !== v[f])) Object.assign(c0, v, { since: now });
                        }
                        units.forEach(u => {
                            if (!cardMatches(txt, u)) return;
                            const sw = card.querySelector('[data-qk="mission-available-switch"]');
                            const on = sw ? readSwitch(sw) : null, pw = readPower(card), pg = S.prog || S.chg ? readProgress(card) : undefined, cg = S.chg || S.rch || S.bt ? readCharge(card) : null, ch = cg ? cg.ch : undefined, bat = cg ? cg.bat : undefined, gp = S.bt ? ((g0) => g0 === null || g0 === '' ? g0 : 'y')(readGps(card)) : undefined;   // GPS 값은 실시간으로 계속 바뀌므로 '있음(y)/없음('')'만 비교 — 숫자를 그대로 비교하면 값이 안정되지 않아 매번 시간 초과까지 기다리게 됨
                            const c = seen[u.n];
                            if (!c) seen[u.n] = { on, pw, pg, ch, bat, gp, row: cg ? cg.row : '', since: now, at: now };
                            else if (c.on !== on || c.pw !== pw || c.pg !== pg || c.ch !== ch || c.bat !== bat || c.gp !== gp) { c.on = on; c.pw = pw; c.pg = pg; c.ch = ch; c.bat = bat; c.gp = gp; c.row = cg ? cg.row : ''; c.since = now; }
                        });
                    });
                    const okVal = c => (S.prog || S.chg || S.rch || S.bt || S.cu ? true : (c.on !== null || (S.pat && c.pw === false)));   // 임무 진행 확인형 사이트는 스위치 값이 필요 없음
                    const need = units.filter(u => !(seen[u.n] && okVal(seen[u.n])));
                    const rdyF = u => {
                        const c = seen[u.n]; if (!c || !okVal(c)) return false;
                        const stab = S.bt ? (c.pw === true && (c.bat === null || c.bat === undefined) ? 4500 : 1500) : S.prog && c.pg === '' ? 4000 : (S.chg || S.rch) && c.pw === true && !c.ch ? 3500 : PROBE_STABLE_MS;   // 아직 값이 안 채워졌을 수 있는 경우(진행 비어 있음 / 켜짐인데 ⚡ 없음)는 더 오래 같아야 확정   // '비어 있음'은 아직 안 채워진 것일 수 있어 더 오래 같은 값이어야 확정
                        const loaded = S.prog ? c.pg !== null : c.pw !== null;
                        return now - c.since >= stab && (loaded || now - c.at > 4500);
                    };
                    const ks = S.cu ? Object.keys(allSeen) : [];
                    if (S.cu && ks.length !== lastCnt) { lastCnt = ks.length; cntAt = now; }
                    const ready = S.cu ? (ks.length > 0 && scrollDone && now - cntAt > 3000 && ks.every(k => now - allSeen[k].since >= (allSeen[k].pw === true && allSeen[k].bat == null ? 4500 : 1500))) : (S.pick1 ? units.some(rdyF) : units.every(rdyF));   // 커스텀: 카드가 더 늘지 않고 값이 안정되면 끝
                    if (ready) return fin(null);
                    if ((need.length || S.cu) && cards.length && now - cardsAt > 2500 && !scrollDone && now - lastScroll > 600) {   // 못 찾은 기체가 있으면 카드 그리드를 스크롤하며 찾는다 (스크롤이 있거나 화면 밖 카드는 아직 안 그려져 있을 수 있음)
                        lastScroll = now;
                        let moved = false;
                        scrollers(doc, win, cards[0]).forEach(sc => {
                            if (sc.scrollTop + sc.clientHeight < sc.scrollHeight - 4) { sc.scrollTop = Math.min(sc.scrollHeight, sc.scrollTop + Math.max(120, sc.clientHeight * 0.8)); moved = true; }
                        });
                        if (!moved) scrollDone = true;
                    }
                    if (need.length && cardsAt && (scrollDone || now - cardsAt > 20000) && now - cardsAt > (S.bt ? 5000 : 9000)) return fin(null);   // 끝까지 찾아도 없으면 '못 찾음'
                };
                f.addEventListener('load', () => {
                    if (done) return; scan();
                    try {
                        const d = f.contentDocument; if (d && d !== docRef) {
                            docRef = d; if (mo) mo.disconnect();
                            mo = new MutationObserver(() => { if (Date.now() - lastScan > 250) scan(); });   // 타이머는 백그라운드 탭에서 느려질 수 있어 DOM 변화로도 확인
                            mo.observe(d.documentElement, { childList: true, subtree: true, attributes: true });
                        }
                    } catch (e) { fin('xorigin'); }
                });
                iv = setInterval(scan, 500);
                to = setTimeout(() => fin(cardsAt ? null : (lastScan && Date.now() - t0 > 3000 ? 'timeout' : 'timeout')), PROBE_TIMEOUT_MS);
                f.src = NCC_ORIGIN + '/ko/monitoring/' + S.id;
                document.body.appendChild(f);
            });
        }

        // ───────── 점검 실행 ─────────
        const forced = new Set();
        let autoBusy = false, curSiteTxt = '', curProg = '';   // curProg = '현재/전체' 번째 사이트
        function buildAll() {   // 오늘 점검 대상 업무와 설정
            return tasks.filter(t => t.auto && todayOk(t)).map(t => ({ t, e: effOf(t), due: dueTs(t) }));
        }
        function pickDue(now) {
            reloadAuto(); reloadChk();
            const all = buildAll().sort((a, b) => a.due - b.due || a.t.s - b.t.s);
            const active = all.filter(x => x.e.on && x.e.u.length);
            const out = [];
            all.forEach(it => {
                if (forced.has(it.t.id) && it.e.u.length) { out.push(Object.assign({ force: true }, it)); return; }
                if (it.t.chg) return;   // 무선충전 점검은 수동 — '지금 점검' 버튼으로만
                if (!it.e.on || !it.e.u.length || it.due > now || chk[it.t.id]) return;
                const a = auto[it.t.id];
                if (it.t.chg && !a && now - it.due > CHG_STALE_MS) { autoPut(it.t.id, { st: 'sup', stale: 1, at: now, due: it.due, by: '' }); return; }   // 점검 시각이 한참 지난 충전 점검은 지금 보면 의미가 없으니 하지 않음
                if (a && (a.st === 'ok' || a.st === 'fail' || a.st === 'sup')) return;
                if (a && a.st === 'retry' && now < a.next) return;
                out.push(it);
            });
            return { out, active };
        }
        function evalUnits(it, ev, readings, pre, keep) {   // → {ok, det:[...]}  (keep = 재점검 때 이미 통과해서 그대로 두는 기체 결과)
            const det = [];
            ev.forEach(u => {
                const S = siteByKey(u.k), R = readings[u.k], x = R && !R.err ? R.units[u.n] : null;
                const d = { k: u.k, n: u.n, w: u.w, got: null, pw: null, r: '' };
                if (u.w === 'chg') {   // 무선충전: 전원 켜짐 + 배터리 수치 + ⚡ 이면 통과 / 순찰 중·전원 꺼짐·입고됨은 제외
                    const why = pre && pre[u.k + '|' + u.n];
                    if (why) { d.r = 'skip'; d.why = why; }
                    else if (!R || R.err) { d.r = 'err'; d.e = R ? R.err : 'noread'; }
                    else if (R.cards === 0) { d.r = 'skip'; d.why = 'in'; }
                    else if (!x || !x.found) { d.r = 'skip'; d.why = 'in'; }   // 같은 주소의 다른 기체 카드는 보이는데 이 기체 카드만 없음 = 입고됨 (전원 꺼짐이 아니라 카드 자체가 없음) → 제외, 재점검 대상 아님
                    else if (x.pw === null || x.pw === undefined) d.r = 'unk';
                    else if (x.pw === false) { d.r = 'skip'; d.why = 'off'; d.pw = false; }
                    else if (x.pg && /순찰|순회/.test(x.pg)) { d.r = 'skip'; d.why = 'patrol'; d.pw = true; d.bat = x.bat; }   // NCC 카드의 '임무 진행'이 순찰 중 → 충전소에 없음
                    else {
                        const hasBat = x.bat !== null && x.bat !== undefined; d.pw = true; d.bat = x.bat;
                        if (S.batOnly) { d.got = 'bat'; d.r = hasBat ? 'ok' : 'bad'; }   // 현장에서 나중에 충전하는 곳: 배터리 수치만 확인
                        else { d.got = x.ch ? 'chg' : 'nochg'; d.r = x.ch && hasBat ? 'ok' : 'bad'; }
                        if (d.r === 'bad' && x.row) d.row = String(x.row).slice(0, 350);   // 원인 확인용: 그 줄의 HTML (bbaAuto.state() 에서 볼 수 있음)
                    }
                }
                else if (!R || R.err) { d.r = 'err'; d.e = R ? R.err : 'noread'; }
                else if (!x || !x.found) d.r = 'miss';
                else if (u.w === 'run') {   // '임무 진행'이 비어 있지 않으면(무언가 진행 중) 일치
                    if (x.pg === null || x.pg === undefined) d.r = 'unk';
                    else { d.got = x.pg ? 'run' : 'idle'; d.pgTxt = x.pg; d.pw = x.pw; d.r = x.pg ? 'ok' : 'bad'; }
                }
                else if (x.on === null) d.r = 'unk';
                else {
                    d.got = x.on ? 'on' : 'off'; d.pw = x.pw;
                    if (u.w === 'on' && pwRule(it.e, S) && x.pw === false) d.r = 'exempt';
                    else d.r = d.got === u.w ? 'ok' : 'bad';
                }
                det.push(d);
            });
            const all = (keep || []).concat(det);
            AUTO_SITES.filter(S => S.any).forEach(S => {   // 같은 주소의 기체 중 하나라도 충전 확인되면 나머지는 통과 못 해도 괜찮음
                const g = all.filter(d => d.k === S.k && d.w === 'chg');
                if (g.some(d => d.r === 'ok')) g.forEach(d => { if (d.r === 'bad' || d.r === 'miss' || d.r === 'unk' || d.r === 'err') { d.r = 'skip'; d.why = 'any'; } });
            });
            const fails = all.filter(d => d.r === 'bad' || d.r === 'miss' || d.r === 'unk' || d.r === 'err').length;
            return { ok: !fails, det: all };
        }
        const wTxt = w => (w === 'run' ? '진행 중' : w === 'chg' ? '충전중' : String(w).toUpperCase());
        const gTxt = g => (g === 'idle' ? '비어 있음' : g === 'run' ? '진행 중' : g === 'chg' ? '충전중(⚡)' : g === 'nochg' ? '⚡ 없음' : String(g || '').toUpperCase());
        const ERR_TXT = { xorigin: '다른 도메인이라 읽을 수 없음', login: 'NCC 로그인이 필요함', timeout: '페이지 로드 시간 초과', noread: '읽지 못함' };
        const SKIP_TXT = { patrol: '순찰 중(다중 모니터링 또는 NCC 임무 진행)이라 제외', off: '로봇 전원 꺼짐 — 제외', in: '입고됨(카드 없음) — 제외', any: '같은 주소의 다른 기체가 충전 확인됨' };
        const dLab = d => { const S = siteByKey(d.k); return (S && S.chg ? '[' + S.id + '] ' : '') + d.n; };
        function failWhy(d) {
            if (d.r === 'err') return ERR_TXT[d.e] || d.e || '오류';
            if (d.r === 'miss') return '기체 카드를 찾지 못함';
            if (d.r === 'unk') return d.w === 'chg' ? '전원 상태를 읽지 못함' : '스위치를 읽지 못함';
            if (d.w === 'chg') return d.got === 'bat' ? '배터리 수치를 읽지 못함' : d.got === 'chg' ? '⚡는 있는데 배터리 수치 없음' : '충전 표시(⚡) 없음 · 켜짐' + (d.bat !== null && d.bat !== undefined ? ' · 배터리 ' + d.bat + '%' : '');
            return gTxt(d.got) + ' (기대 ' + wTxt(d.w) + ')';
        }
        function detMsg(det) {
            return det.filter(d => d.r === 'bad' || d.r === 'miss' || d.r === 'unk' || d.r === 'err').map(d => dLab(d) + ' — ' + failWhy(d)).join(' / ');
        }
        async function runBatch(items, active) {
            const g0 = killGen; let killedRun = false;
            const now = Date.now();
            const latest = {};   // 기체별로 '지금까지 시각이 된 가장 최근 업무' — 오래된 업무는 이미 이후 업무가 상태를 바꿨을 수 있어 그 기체는 점검하지 않는다
            active.forEach(x => { if (x.due > now) return; x.e.u.forEach(u => { const key = u.k + '|' + u.n, c = latest[key]; if (!c || x.due > c.due || (x.due === c.due && x.t.s >= c.s)) latest[key] = { due: x.due, id: x.t.id, s: x.t.s, tm: x.t.head }; }); });
            const run = [];
            items.forEach(it => {
                const prev = auto[it.t.id];
                let ev = it.force ? it.e.u.slice() : it.e.u.filter(u => { const c = latest[u.k + '|' + u.n]; return !c || c.id === it.t.id; }), keep = [];
                if (it.t.chg && prev && (prev.st === 'retry' || (it.force && prev.st === 'fail')) && Array.isArray(prev.det) && prev.det.length) {   // 재점검 · '지금 점검': 지난번에 통과 못 한 기체만 다시 확인 (통과·제외한 기체 결과는 그대로 둠)
                    const bad = new Set(prev.det.filter(d => d.r === 'bad' || d.r === 'miss' || d.r === 'unk' || d.r === 'err').map(d => d.k + '|' + d.n)), again = ev.filter(u => bad.has(u.k + '|' + u.n));
                    if (again.length) { keep = prev.det.filter(d => !bad.has(d.k + '|' + d.n)); ev = again; }
                }
                if (!ev.length) {
                    const by = latest[it.e.u[0].k + '|' + it.e.u[0].n];
                    autoPut(it.t.id, { st: 'sup', at: now, due: it.due, by: by ? by.tm : '' });
                } else run.push({ it, ev, keep, pre: {} });
            });
            renderTasks();
            if (!run.length) return;
            if (run.some(r => r.it.t.chg)) {   // 다중 모니터링에서 순찰 중인 기체는 충전소에 없으니 점검에서 제외 (그 사이트만 남으면 iframe 도 열지 않음)
                const pat = patrolFulls();
                run.forEach(r => { if (r.it.t.chg) r.ev.forEach(u => { if (pat.has(normTxt(u.n))) r.pre[u.k + '|' + u.n] = 'patrol'; }); });
            }
            const bySite = {};
            run.forEach(r => r.ev.forEach(u => { if (r.pre[u.k + '|' + u.n]) return; (bySite[u.k] = bySite[u.k] || new Set()).add(u.n); }));
            const readings = {}, keys = Object.keys(bySite).sort((a, b) => (siteByKey(a).chg ? 1 : 0) - (siteByKey(b).chg ? 1 : 0));   // 일반 임무 점검을 먼저, 오래 걸리는 충전 점검은 뒤에
            const finish = list => {   // 점검한 업무의 결과를 확정·기록
                const fin = Date.now();
                list.forEach(({ it, ev, keep, pre }) => {
                    reloadAuto();
                    const prev = auto[it.t.id], n = it.force ? maxTriesOf(it.t) : ((prev && prev.n) || 0) + 1;
                    const r = evalUnits(it, ev, readings, pre, keep), late = now - it.due > 3 * 60000;   // 점검 '시작'이 예정보다 3분 넘게 늦었는가 (충전 점검처럼 오래 걸려도 지연으로 치지 않도록)
                    const rec = { st: r.ok ? 'ok' : (n >= maxTriesOf(it.t) ? 'fail' : 'retry'), n, at: fin, due: it.due, det: r.det, msg: r.ok ? '' : detMsg(r.det), late, forced: !!it.force };
                    if (rec.st === 'retry' && attemptsOf(it.t)) { const at = attemptsOf(it.t); rec.next = Math.max(at[Math.min(n, at.length - 1)], fin + 60000); }   // 다음 점검 시각(앞시각 +5분 → 뒷시각 정각), 이미 지났으면 1분 뒤
                    else if (rec.st === 'retry') { const rm = retryMsOf(it.t); rec.next = it.t.chg || rm === AUTO_RETRY_MS ? fin + rm : Math.max(it.due + rm, fin + 60000); }   // 사이트별 재점검(송도): 첫 점검 예정 시각 + 5분 (11:01 → 11:06), 이미 늦었으면 1분 뒤
                    if (it.t.chg) {   // 무선충전 점검 기록: +1분 · +5분 · 지금 점검 (지금 점검은 가장 최근 1개만) — 최대 3개
                        const kind = it.force ? 'now' : (n <= 1 ? 'p1' : 'p2'), lg = ((prev && prev.logs) || []).filter(x => x.k !== kind);
                        lg.push({ k: kind, at: fin, st: rec.st, n, next: rec.next || 0, det: rec.det, msg: rec.msg });
                        lg.sort((x, y) => x.at - y.at); rec.logs = lg;
                    }
                    autoPut(it.t.id, rec);
                    forced.delete(it.t.id);
                    console.log('[BBA] 자동 점검', it.t.head, rec.st, rec.msg || '');
                });
            };
            const batchIds = new Set(run.map(r => r.it.t.id));
            let regDone = false;
            let ci = 0; const cn = keys.filter(k => siteByKey(k).chg).length;
            for (const k of keys) {
                if (g0 !== killGen) { killedRun = true; break; }
                const S = siteByKey(k);
                if (S.chg && !regDone) {   // 일반 임무 점검 결과는 오래 걸리는 충전 점검을 기다리지 않고 먼저 확정
                    regDone = true; const reg = run.filter(r => !r.it.t.chg); if (reg.length) { finish(reg); renderTasks(); }
                }
                if (S.chg && ci >= 1) {   // 충전 점검 사이사이: 그동안 시각이 된 일반 업무가 있으면 그것부터 먼저 점검
                    try { const pk = pickDue(Date.now()), ex = pk.out.filter(x => !x.t.chg && !batchIds.has(x.t.id)); if (ex.length) { ex.forEach(x => batchIds.add(x.t.id)); await runBatch(ex, pk.active); } }
                    catch (e) { console.warn('[BBA] 충전 점검 중 일반 점검 실패:', e && e.message); }
                    try { await campCheck(); } catch (e) { console.warn('[BBA] 충전 점검 중 사이트 점검 실패:', e && e.message); }
                }
                if (S.chg) ++ci; curProg = (keys.indexOf(k) + 1) + '/' + keys.length;
                curSiteTxt = S.chg ? '충전 ' + ci + '/' + cn + ' · ' + S.label : S.k;
                lockTake(run.map(r => r.it.t.id), S.k); drawAutoPill(); if (!S.chg || ci === 1) renderTasks();
                try { readings[k] = await probeSite(S, [...bySite[k]].map(n => S.units.find(y => y.n === n))); }
                catch (e) { readings[k] = { err: 'noread', units: {}, names: [] }; console.warn('[BBA] 점검 오류:', e && e.message); }
                if (readings[k].err === 'killed' || g0 !== killGen) { killedRun = true; break; }
                if (readings[k].err || Object.values(readings[k].units).some(x => !x.found)) console.warn('[BBA] 자동 점검 —', S.k, '(' + S.id + ')', readings[k].err || '', '화면 카드:', readings[k].names);
                await sleep(800);
            }
            curSiteTxt = ''; curProg = '';
            if (killedRun) return;   // Kill All — 아직 확정하지 않은 점검은 기록하지 않음
            finish(regDone ? run.filter(r => r.it.t.chg) : run);
        }
        let busySince = 0;
        async function autoTick() {
            if (patBusy) return;   // 순찰중단 수동 점검 중에는 자동 점검을 쉰다 (끝나면 다음 틱에서 이어서)
            if (autoBusy && Date.now() - lastBeat > 150000) {   // 2분 반 동안 아무 진전이 없으면 멈춘 것으로 보고 풀어준다
                console.warn('[BBA] 자동 점검이 멈춘 것으로 보여 초기화합니다');
                try { document.querySelectorAll('iframe[title="bba-probe"]').forEach(x => x.remove()); } catch (e) { /* 무시 */ }
                autoBusy = false; campBusy = false; probeInfo = null; curSiteTxt = ''; curProg = ''; lockFree(); lsSet('bba_auto_lock', 'null'); forced.clear();
                drawAutoPill(); renderTasks();
            }
            if (autoBusy) { drawAutoPill(); try { const l = lockGet(); if (l && l.tab === TABID) lsSet('bba_auto_lock', JSON.stringify(Object.assign(l, { t: Date.now() }))); } catch (e) { /* 무시 */ } return; }
            const cool = Date.now() < killUntil;   // Kill All 직후에는 예약 점검을 쉬고, '지금 점검'(강제)만 허용
            if ((!autoEnabled() || cool) && !forced.size && !campForce.size) { drawAutoPill(); return; }
            autoBusy = true; lastBeat = Date.now(); const g1 = killGen;
            try {
                for (let guard = 0; guard < 8 && tasks.length; guard++) {
                    if (g1 !== killGen) break;
                    const { out, active } = pickDue(Date.now());
                    const list = (autoEnabled() && !cool) ? out : out.filter(x => x.force);
                    if (!list.length) break;
                    if (!lockTake(list.map(x => x.t.id), '')) break;
                    try { await runBatch(list, active); }
                    catch (e) {
                        console.warn('[BBA] 자동 점검 실패:', e && e.message);
                        list.forEach(x => { forced.delete(x.t.id); autoPut(x.t.id, { st: 'fail', n: AUTO_MAX_TRIES, at: Date.now(), due: x.due, det: [], msg: '점검 중 오류: ' + (e && e.message) }); });
                    }
                }
                if (g1 === killGen) { try { await campCheck(); } catch (e) { console.warn('[BBA] 사이트 점검 실패:', e && e.message); } }
            } finally { autoBusy = false; curSiteTxt = ''; curProg = ''; lockFree(); renderTasks(); }
        }
        function drawAutoPill() {
            const el = $('bba-auto'); if (!el) return;
            let txt, cls = 'bba-pill au', ttl = '임무 ON/OFF 자동 점검 (클릭: 켜기/끄기). 업무 시각 +1분에 숨김 iframe 으로 NCC 사이트를 열어 기체의 임무받기 상태를 확인합니다.';
            if (!autoEnabled()) { txt = '⏸ 자동점검 꺼짐'; cls += ' off'; }
            else if (autoBusy || runningIds().length) {
                txt = '🔍 점검 중' + (curProg ? ' ' + curProg : '') + (curSiteTxt || probeInfo ? ' · ' + (probeInfo ? probeInfo.k + ' ' + Math.round((Date.now() - probeInfo.t0) / 1000) + '초' : curSiteTxt) : ''); cls += ' run';
                ttl = (curProg ? '현재 ' + curProg.replace('/', ' / ') + '번째 사이트 점검 중\n' : '') + (probeInfo ? probeInfo.k + ' · ' + Math.round((Date.now() - probeInfo.t0) / 1000) + '초째' : curSiteTxt) + '\n\n' + ttl;
            }
            else {
                reloadAuto(); const now = Date.now(); let nx = null, nm = '';
                buildAll().forEach(x => {
                    if (x.t.chg || !x.e.on || !x.e.u.length || chk[x.t.id]) return;
                    const a = auto[x.t.id]; if (a && (a.st === 'ok' || a.st === 'fail' || a.st === 'sup')) return;
                    const at = a && a.st === 'retry' ? a.next : x.due;
                    if (at > now - 1 && (nx === null || at < nx)) { nx = at; nm = x.t.body.slice(0, 12); }
                });
                try {   // 사이트 점검(캠핑장)의 다음 정각 시각도 후보에 넣음
                    reloadCampAuto(); const wd = workDay();
                    Object.keys(CAMP_AUTO).forEach(c => { const cf = CAMP_AUTO[c], r = campAuto[c] || {}; if (cf.stopOnOk && r.done) return; if (cf.weekdayOnly && (wd.getDay() === 0 || wd.getDay() === 6)) return; cf.slots.forEach(sl => { const p = sl.split(':'), t = new Date(wd.getFullYear(), wd.getMonth(), wd.getDate(), +p[0], +p[1]).getTime(); if (t > now - 1 && (nx === null || t < nx)) { nx = t; nm = '사이트 ' + c; } }); });
                } catch (e) { /* 무시 */ }
                txt = nx ? '🔍 다음 점검 ' + hmOf(nx) : '🔍 자동점검 대기';
                if (nx) ttl += '\n다음: ' + hmOf(nx) + ' ' + nm;
            }
            el.className = cls; el.textContent = txt; el.title = ttl;
        }

        // ───────── 업무표 렌더 ─────────
        let onlyDay = true, onlyOpen = false, lastCurId = null;
        const chgFails = a => (a.det || []).filter(d => d.r === 'bad' || d.r === 'miss' || d.r === 'unk' || d.r === 'err').length;
        function chgCnt(a, withSkip) { const det = a.det || [], ok = det.filter(d => d.r === 'ok').length, sk = det.filter(d => d.r === 'skip').length; return ' · 충전 ' + ok + '대' + (withSkip && sk ? ' · 제외 ' + sk + '대' : ''); }
        function rowInfo(t, nr, now) {
            const a = auto[t.id], man = chk[t.id], run = runningIds().includes(t.id);
            const o = { cls: '', box: '✓', ttl: '완료 확인', meta: '', tip: '', done: false };
            if (man && a && a.st === 'fail') { o.cls = 'done manfail'; o.ttl = '직접 확인됨(자동 점검은 실패했음) — 누르면 해제'; o.meta = '✓ ' + man + ' 직접 확인 (자동 점검 실패)'; o.done = true; }   // 자동 점검이 실패해서 사람이 직접 확인한 업무는 노란 체크
            else if (man) { o.cls = 'done'; o.ttl = '완료 취소'; o.meta = '✓ ' + man + ' 확인'; o.done = true; }
            else if (a && a.st === 'ok' && !a.clr) { o.cls = 'done byauto'; o.ttl = '자동 확인됨 — 누르면 해제 (다시 누르면 자동 확인 시각으로 복원)'; o.meta = '✓ ' + hmOf(a.at) + ' 자동 확인' + (t.chg ? chgCnt(a, true) : '') + (a.late ? ' (지연 점검)' : ''); o.done = true; }
            else if (a && a.st === 'fail') { o.cls = 'bad'; o.box = '✕'; o.ttl = '자동 점검에서 확인되지 않음 — 직접 확인한 뒤 누르면 체크됩니다'; o.meta = '✕ ' + hmOf(a.at) + (t.chg ? ' 충전 미확인 ' + chgFails(a) + '대' : a.det && a.det.some(d => d.r === 'bad') ? ' 자동 점검 불일치' : ' 자동 점검 실패(확인 못 함)') + ' · 직접 확인'; o.tip = a.msg || ''; }
            else if (a && a.st === 'retry') { o.cls = 'retry'; o.box = '↻'; o.meta = '↻ ' + hmOf(a.next) + ' 재점검 예정 (' + (t.chg ? '충전 미확인 ' + chgFails(a) + '대' : (a.msg || '불일치')) + ')'; o.tip = a.msg || ''; }
            else if (a && a.st === 'sup') { o.cls = 'sup'; o.box = '–'; o.ttl = '이후 업무가 같은 기체를 바꿔서 지금 상태로는 확인할 수 없음 — 직접 확인 후 체크'; o.meta = a.stale ? '– 점검 시각이 지나 자동 점검 생략 — 직접 확인' : '– ' + (a.by || '이후 업무') + ' 업무로 대체되어 점검 생략'; }
            if (run && !man) { o.cls += ' run'; o.box = '…'; o.meta = '… 점검 중'; }
            return o;
        }
        function renderTasks(scrollToCur) {
            const dayChanged = loadDay();
            if (dayChanged) { drawCamp(); scrollToCur = true; }
            reloadChk(); reloadAuto();
            const nowTs = Date.now(), n = nowMin(), nr = rel(n), wd = workDay(), dow = wd.getDay();
            $('bba-wd').textContent = '업무일 ' + (wd.getMonth() + 1) + '/' + wd.getDate() + '(' + DAYS[dow] + ') · 매일 07:00 초기화';
            let list = tasks.filter(t => !onlyDay || !t.days || t.days.includes(dow));
            const live = list.filter(t => !dimOf(t));               // 18:00 이후 업무는 집계·지연 판단에서 제외
            const infos = {}; live.forEach(t => { infos[t.id] = rowInfo(t, nr, nowTs); });
            const isDone = t => !!(infos[t.id] && infos[t.id].done);
            const done = live.filter(isDone).length;
            const late = live.filter(t => !isDone(t) && rel(t.e) + LATE_GRACE < nr);
            const badN = live.filter(t => infos[t.id].cls.startsWith('bad')).length;
            $('bba-prog').textContent = '완료 ' + done + '/' + live.length;
            const L = $('bba-late'); L.style.display = late.length ? '' : 'none'; L.textContent = '⚠ 지연 미확인 ' + late.length;
            const B = $('bba-bad'); B.style.display = badN ? '' : 'none'; B.textContent = '✕ 자동점검 불일치 ' + badN;
            if (onlyOpen) list = list.filter(t => !dimOf(t) && !isDone(t));
            const cur = list.find(t => !dimOf(t) && !isDone(t) && rel(t.e) + LATE_GRACE >= nr) || null;
            const box = $('bba-tb'), keep = box ? box.scrollTop : 0;
            $('bba-rows').innerHTML = list.length ? list.map(t => {
                if (dimOf(t)) {   // 18:00 이후: 체크박스 없이 흐리게 표시만
                    return '<div class="bba-row dim" data-id="' + esc(t.id) + '"><span></span>' +
                        '<span class="bba-txt"><span class="tm">' + esc(t.head) + '</span> ' + esc(t.body) + (t.tag ? ' <span class="tag">' + esc(t.tag) + '</span>' : '') + '</span>' +
                        '<span class="bba-who" style="--h:' + hue(t.u) + '">' + esc(t.u) + '</span></div>';
                }
                const o = infos[t.id], isLate = !o.done && !o.cls.startsWith('bad') && rel(t.e) + LATE_GRACE < nr, isCur = cur && cur.id === t.id;
                let chip = '', sch = '';
                if (t.auto && todayOk(t)) {
                    const e = effOf(t);
                    if (!e.on) chip = '<span class="ach off" title="이 업무는 자동 점검을 끔 (더블클릭: 설정)">⏸</span>';
                    else if (!e.u.length) chip = '<span class="ach cfg" title="' + (t.sites.some(S => !S.id) ? '사이트 번호(id)가 설정되지 않아 점검할 수 없음 — 파일 상단 AUTO_SITES 의 id 를 채워 주세요' : '점검할 기체가 정해지지 않음 — 더블클릭해서 선택') + '">⚙</span>';
                    else {
                        chip = '<span class="ach" title="자동 점검 대상 (' + esc(hmOf(dueTs(t))) + ' 점검) · 더블클릭: 기체 선정">🔍</span>';
                        if (!o.meta && t.chg) sch = '<span class="meta sch">✋ 수동 점검 (지금 점검 버튼)</span>';
                        else if (!o.meta && dueTs(t) > nowTs) sch = '<span class="meta sch">' + hmOf(dueTs(t)) + ' 점검 예정</span>';
                    }
                }
                return '<div class="bba-row' + (t.auto && todayOk(t) ? ' auto' : '') + (o.cls ? ' ' + o.cls : '') + (isLate ? ' late' : '') + (isCur ? ' cur' : '') + '" data-id="' + esc(t.id) + '"' + (t.auto && todayOk(t) ? ' title="더블클릭: 임무 ON/OFF 자동 점검 설정"' : '') + '>' +
                    '<button type="button" class="bba-chk" role="checkbox" aria-checked="' + o.done + '" title="' + esc(o.ttl) + '">' + o.box + '</button>' +
                    '<span class="bba-txt"' + (o.tip ? ' title="' + esc(o.tip) + '"' : '') + '><span class="tm">' + esc(t.head) + '</span> ' + esc(t.body) + (t.tag ? ' <span class="tag">' + esc(t.tag) + '</span>' : '') + chip +
                    (o.meta ? '<span class="meta">' + esc(o.meta) + '</span>' : isLate ? '<span class="meta">미확인</span>' : sch) + '</span>' +
                    '<span class="bba-who" style="--h:' + hue(t.u) + '">' + esc(t.u) + '</span></div>';
            }).join('') : '<div class="bba-empty">' + (tasks.length ? '표시할 업무가 없습니다' : '업무표 데이터를 받지 못했습니다') + '</div>';
            if (box) box.scrollTop = keep;
            if (scrollToCur || (cur && lastCurId === null)) { const c = $('bba-rows').querySelector('.bba-row.cur'); if (c && box) box.scrollTop = Math.max(0, c.offsetTop - box.clientHeight / 3); }
            lastCurId = cur ? cur.id : '';
            drawAutoPill();
            if (popTask) refreshPop();
        }
        function toggleTask(id) {
            reloadChk();
            if (chk[id]) delete chk[id]; else { const d = new Date(); chk[id] = pad(d.getHours()) + ':' + pad(d.getMinutes()); }
            lsSet('bba_chk_' + curKey, JSON.stringify(chk)); renderTasks();
        }
        function onBoxClick(id) {   // 자동으로 확인된 업무를 누르면 해제, ✕ 나 빈 칸을 누르면 직접 확인으로 체크
            reloadChk(); reloadAuto();
            const a = auto[id];
            if (!chk[id] && a && a.st === 'ok') { if (a.clr) delete a.clr; else a.clr = 1; autoPut(id, a); renderTasks(); return; }   // 자동 확인된 업무: 해제 ↔ 다시 누르면 원래 자동 확인 시각으로 복원 (직접 확인 업무는 그대로 현재 시각 기록)
            toggleTask(id);
        }
        $('bba-rows').addEventListener('click', e => {   // 체크박스를 눌러야만 체크/해제 (행의 다른 곳은 무시)
            if (!e.target.closest('.bba-chk')) return;
            const r = e.target.closest('.bba-row'); if (r && !r.classList.contains('dim')) onBoxClick(r.dataset.id);
        });
        $('bba-rows').addEventListener('dblclick', e => {   // 체크박스 이외를 더블클릭 → 자동 점검 기체 선정 창
            if (e.target.closest('.bba-chk')) return;
            const r = e.target.closest('.bba-row'); if (!r || r.classList.contains('dim')) return;
            const t = tasks.find(x => x.id === r.dataset.id); if (t && t.auto && todayOk(t)) openPop(t, r);
        });
        $('bba-reload').addEventListener('click', () => loadTasks());
        $('bba-auto').addEventListener('click', () => {
            lsSet('bba_auto_on', autoEnabled() ? '0' : '1'); drawAutoPill(); if (autoEnabled()) autoTick();
        });
        window.addEventListener('storage', e => { if (e.key && /^bba_(chk|auto|auto_lock|auto_cfg|auto_on)/.test(e.key)) { clearTimeout(storT); storT = setTimeout(() => renderTasks(), 200); } });
        let storT = null;

        // ───────── 기체 선정 창 (업무 행 더블클릭) ─────────
        const pop = document.createElement('div'); pop.id = 'bba-ap'; root.appendChild(pop);
        let popTask = null, popWk = null;
        const closePop = () => { pop.classList.remove('open'); popTask = null; };
        function popSave() {
            if (!popTask) return;
            const c = cfgAll(), u = [];
            popWk.units.forEach(x => { if (x.on) u.push({ k: x.k, n: x.n, w: x.w }); });
            c[popTask.id] = { on: popWk.on, u }; if (popWk.pw !== null) c[popTask.id].pw = popWk.pw;
            lsSet('bba_auto_cfg', JSON.stringify(c));
        }
        function resultHtml(a) {
            if (!a) return '<span class="m">아직 점검 기록 없음</span>';
            const head = a.st === 'ok' ? '<span class="g">✓ ' + hmOf(a.at) + ' 자동 확인됨</span>' : a.st === 'fail' ? '<span class="r">✕ ' + hmOf(a.at) + ' 불일치 (' + a.n + '회 점검)</span>' : a.st === 'retry' ? '<span class="r">↻ ' + hmOf(a.at) + ' 불일치 — ' + hmOf(a.next) + ' 재점검 예정</span>' : '<span class="m">– 이후 업무로 대체됨(' + esc(a.by || '') + ')</span>';
            if ((a.det || []).some(d => d.w === 'chg')) {   // 무선충전 점검: 통과 못 한 기체 → 제외된 기체(사유별) → 충전 확인 기체
                const det = a.det, part = [head], bad = det.filter(d => d.r === 'bad' || d.r === 'miss' || d.r === 'unk' || d.r === 'err');
                if (bad.length) part.push('<div class="r"><b>통과 못 한 기체 ' + bad.length + '대</b></div>' + bad.map(d => '<div class="r">✕ ' + esc(dLab(d)) + ' — ' + esc(failWhy(d)) + '</div>').join(''));
                ['patrol', 'off', 'in', 'any'].forEach(w => {
                    const l = det.filter(d => d.r === 'skip' && d.why === w); if (!l.length) return;
                    part.push('<div class="m"><b>' + esc(SKIP_TXT[w]) + ' ' + l.length + '대</b></div><div class="m">' + l.map(d => esc(dLab(d))).join(' · ') + '</div>');
                });
                const okl = det.filter(d => d.r === 'ok');
                if (okl.length) part.push('<div class="g"><b>충전 확인 ' + okl.length + '대</b></div><div class="m">' + okl.map(d => esc(dLab(d)) + (d.bat !== null && d.bat !== undefined ? ' ' + d.bat + '%' : '')).join(' · ') + '</div>');
                return part.join('');
            }
            const rows = (a.det || []).map(d => {
                const lb = { ok: '<span class="g">일치</span>', exempt: '<span class="m">전원 꺼짐 — 제외</span>', bad: '<span class="r">불일치</span>', miss: '<span class="r">카드 없음</span>', unk: '<span class="r">읽지 못함</span>', err: '<span class="r">' + esc(ERR_TXT[d.e] || d.e || '오류') + '</span>' }[d.r] || '';
                return '<div>' + esc(d.n) + ' · 기대 ' + wTxt(d.w) + (d.got ? ' / 실제 ' + gTxt(d.got) + (d.pgTxt ? ' (' + esc(d.pgTxt) + ')' : '') + (d.pw === false && d.w !== 'run' ? ' (전원 꺼짐)' : '') : '') + ' · ' + lb + '</div>';
            }).join('');
            return head + rows;
        }
        function buildPop() {
            const t = popTask, wk = popWk;
            pop.classList.toggle('wide', !!t.chg);
            if (t.chg) {   // 무선충전 점검: 기체 목록(체크로 점검 대상 선택) + 마지막 결과
                let h = '<div class="ph"><b>🔍 무선충전 자동 점검 (⚡)</b><button class="px" data-a="x" title="닫기">✕</button></div><div class="pt">' + esc(t.head + ' ' + t.body) + '</div>' +
                    '<label><input type="checkbox" data-a="on"' + (wk.on ? ' checked' : '') + '> 이 업무 자동 점검 사용</label><div class="ul">';
                t.sites.forEach(S => wk.units.filter(x => x.k === S.k).forEach(x => {
                    h += '<label class="u' + (x.on ? '' : ' dis') + '"><input type="checkbox" data-a="u" data-k="' + esc(x.k) + '" data-n="' + esc(x.n) + '"' + (x.on ? ' checked' : '') + '><span class="nm">[' + S.id + '] ' + esc(x.n) + (S.any ? ' (택1)' : '') + (S.batOnly ? ' (배터리만)' : '') + '</span></label>';
                }));
                h += '</div><div class="tm">점검 시각 ' + hmOf(dueTs(t)) + ' · 통과: 전원 켜짐 + 배터리 수치 + ⚡ · 제외: 순찰 중 / 전원 꺼짐 / 입고됨(카드 없음) · 못 찾으면 ' + Math.round(CHG_RETRY_MS / 60000) + '분 뒤 그 기체만 한 번 더 → ✕ · 인재개발원은 배터리 수치만 확인</div>' +
                    '<div class="rs" id="bba-ap-rs">' + popRs(t) + '</div>' +
                    '<div class="pb"><button class="bba-btn" data-a="def" title="기본 설정으로 되돌리기">기본값</button><button class="bba-btn on" data-a="now" title="지금 바로 이 업무를 점검">지금 점검</button></div>';
                pop.innerHTML = h; return;
            }
            let h = '<div class="ph"><b>🔍 임무 ON/OFF 자동 점검</b><button class="px" data-a="x" title="닫기">✕</button></div>' +
                '<div class="pt">' + esc(t.head + ' ' + t.body) + '</div>' +
                '<label><input type="checkbox" data-a="on"' + (wk.on ? ' checked' : '') + '> 이 업무 자동 점검 사용</label>';
            t.sites.forEach(S => {
                h += '<div class="sh">' + esc(S.k) + ' · ' + (S.id ? '/monitoring/' + S.id : '사이트 번호 미설정 (AUTO_SITES 의 id)') + '</div>';
                wk.units.filter(x => x.k === S.k).forEach(x => {
                    h += '<label class="u' + (x.on ? '' : ' dis') + '"><input type="checkbox" data-a="u" data-k="' + esc(x.k) + '" data-n="' + esc(x.n) + '"' + (x.on ? ' checked' : '') + '><span class="nm">' + esc(x.n) + '</span>' +
                        (S.prog ? '<span class="seg"><button type="button" class="on run" disabled>진행 중</button></span>' : '<span class="seg"><button type="button" data-a="w" data-w="on" data-k="' + esc(x.k) + '" data-n="' + esc(x.n) + '" class="' + (x.w === 'on' ? 'on' : '') + '">ON</button><button type="button" data-a="w" data-w="off" data-k="' + esc(x.k) + '" data-n="' + esc(x.n) + '" class="' + (x.w === 'off' ? 'on' : '') + '">OFF</button></span>') + '</label>';
                });
            });
            const anyPo = t.sites.some(S => S.powerOnly), pwv = wk.pw === null ? anyPo : wk.pw;
            h += (t.sites.some(S => !S.prog) ? '<label><input type="checkbox" data-a="pw"' + (pwv ? ' checked' : '') + '> ON 확인은 전원이 켜진 기체만</label>' : '') +
                '<div class="tm">점검 시각 ' + (attemptsOf(t) ? attemptsOf(t).map(hmOf).join(' → ') + (t.chg ? ' (+1분 · +5분, +5분에는 통과 못 한 기체만) · 그래도 안 맞으면 ✕' : ' (앞시각 +1분 · +5분 · 뒷시각 정각, 안 맞으면 다음 점검) · 모두 안 맞으면 ✕') : hmOf(dueTs(t)) + ' (' + (t.e === t.s ? '업무' : timingOf(t).at === 'start' ? '시작' : '끝') + ' 시각 +' + timingOf(t).delay + '분) · 안 맞으면 ' + Math.round(retryMsOf(t) / 60000) + '분 뒤 한 번 더 → 그래도 안 맞으면 ✕') + '</div>' +
                '<div class="rs" id="bba-ap-rs">' + resultHtml(auto[t.id]) + '</div>' +
                '<div class="pb"><button class="bba-btn" data-a="def" title="기본 설정으로 되돌리기">기본값</button><button class="bba-btn on" data-a="now" title="지금 바로 이 업무를 점검">지금 점검</button></div>';
            pop.innerHTML = h;
        }
        let popLogI = null, popLogFor = '';
        const LG_NAME = { p1: '+1분', p2: '+5분', now: '지금 점검' };
        function popRs(t) {   // 팝업의 점검 결과 영역: 충전 점검은 점검 때마다 남긴 기록(+1분 / +5분 / 지금 점검)을 탭으로 볼 수 있음
            const a = auto[t.id];
            if (!t.chg || !a || !a.logs || !a.logs.length) return resultHtml(a);
            if (popLogFor !== t.id) { popLogFor = t.id; popLogI = null; }
            const lg = a.logs, i = popLogI != null && lg[popLogI] ? popLogI : lg.length - 1, e = lg[i];
            const tabs = '<div class="lgt">' + lg.map((x, j) => '<button type="button" data-a="lg" data-i="' + j + '" class="' + (j === i ? 'on' : '') + '">' + LG_NAME[x.k] + ' ' + hmOf(x.at) + ' ' + (x.st === 'ok' ? '✓' : x.st === 'fail' ? '✕' : '↻') + '</button>').join('') + '</div>';
            return tabs + resultHtml({ st: e.st, n: e.n, at: e.at, next: e.next, det: e.det, msg: e.msg });
        }
        function refreshPop() { const el = $('bba-ap-rs'); if (el && popTask) el.innerHTML = popRs(popTask); }
        function openPop(t, rowEl) {
            const e = effOf(t), first = (t.dirs[0] && t.dirs[0].w) || 'on';
            popTask = t;
            popWk = { on: e.on, pw: e.pw, units: [] };
            t.sites.forEach(S => S.units.forEach(u => {
                const f = e.u.find(x => x.k === S.k && x.n === u.n);
                popWk.units.push({ k: S.k, n: u.n, on: !!f, w: f ? f.w : first });
            }));
            pop.classList.toggle('wide', !!t.chg); buildPop(); pop.classList.add('open');
            const rr = rowEl.getBoundingClientRect(), br = root.getBoundingClientRect(), sc = br.width / root.offsetWidth || 1;
            let top = (rr.bottom - br.top) / sc + 4; const h = pop.offsetHeight;
            if (top + h > root.offsetHeight - 6) top = Math.max(4, (rr.top - br.top) / sc - h - 4);
            pop.style.top = top + 'px'; pop.style.left = Math.min(Math.max(8, (rr.left - br.left) / sc + 34), Math.max(8, root.offsetWidth - (t.chg ? 570 : 380))) + 'px';
        }
        pop.addEventListener('click', e => {
            const b = e.target.closest('[data-a]'); if (!b || !popTask) return;
            const a = b.dataset.a;
            if (a === 'x') return closePop();
            if (a === 'w') { const x = popWk.units.find(v => v.k === b.dataset.k && v.n === b.dataset.n); if (x) { x.w = b.dataset.w; popSave(); buildPop(); } return; }
            if (a === 'def') { const c = cfgAll(); delete c[popTask.id]; lsSet('bba_auto_cfg', JSON.stringify(c)); const t = popTask, r = $('bba-rows').querySelector('.bba-row[data-id="' + t.id + '"]'); closePop(); if (r) openPop(t, r); renderTasks(); return; }
            if (a === 'lg') { popLogI = +b.dataset.i; refreshPop(); return; }
            if (a === 'now') { const pb = b.closest('.pb'); if (pb) { pb.dataset.h = pb.innerHTML; pb.innerHTML = '<span class="cf">지금 점검을 진행할까요?</span><button class="bba-btn on" data-a="nowy">예</button><button class="bba-btn" data-a="non">아니오</button>'; } return; }
            if (a === 'non') { const pb = b.closest('.pb'); if (pb && pb.dataset.h) pb.innerHTML = pb.dataset.h; return; }
            if (a === 'nowy') { const pb = b.closest('.pb'); if (pb && pb.dataset.h) pb.innerHTML = pb.dataset.h; const t = popTask; popSave(); forced.add(t.id); $('bba-ap-rs').innerHTML = '<span class="m">점검 요청됨 — 잠시 후 결과가 표시됩니다…</span>'; autoTick(); return; }
        });
        pop.addEventListener('change', e => {
            const b = e.target.closest('[data-a]'); if (!b || !popTask) return;
            const a = b.dataset.a;
            if (a === 'on') popWk.on = b.checked;
            else if (a === 'u') { const x = popWk.units.find(v => v.k === b.dataset.k && v.n === b.dataset.n); if (x) x.on = b.checked; }
            else if (a === 'pw') popWk.pw = b.checked;
            popSave(); buildPop(); renderTasks();
        });
        document.addEventListener('mousedown', e => { if (popTask && !pop.contains(e.target) && !(e.target.closest && e.target.closest('.bba-row.auto'))) closePop(); }, true);
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && popTask) closePop(); });

        // ───────── 사이트 점검 (캠핑장) — 직접 체크 + 정각 자동 확인 ─────────
        //  표시: 자동 확인 성공 = 초록 ✓ · 자동 확인 실패 = 빨강 ✕ · 실패한 것을 직접 확인해 누르면 노란 ✓ (다음 점검 시각에 자동 확인이 다시 덮어씀)
        const campForce = new Set(); let campBusy = false;
        function reloadCampAuto() { try { campAuto = JSON.parse(lsGet('bba_campauto_' + curKey, '{}')) || {}; } catch (e) { /* 그대로 */ } }
        function campPut(c, rec) { reloadCampAuto(); campAuto[c] = rec; lsSet('bba_campauto_' + curKey, JSON.stringify(campAuto)); }
        const campSites = {};
        function campSite(c) {
            const cf = CAMP_AUTO[c];
            return campSites[c] || (campSites[c] = { k: '사이트 ' + c, id: cf.id, rch: cf.mode === 'chg' || cf.mode === 'info', units: cf.units.map(n => U(n)) });
        }
        function campView(c) {   // → { cls, box, t, ttl, done }
            const r = campAuto[c] || null, cur = r && r.cur, o = { cls: '', box: '✓', t: '', ttl: '', done: false };
            const hist = r && r.slots ? Object.keys(r.slots).sort().map(sl => { const x = r.slots[sl]; return sl + ' ' + (x.st === 'ok' ? '✓ 정상' + (x.pwr ? ' · 전원ON' : '') + (x.mis ? ' · 임무ON' : '') + (x.bat != null ? ' · ' + (x.ch ? '충전중 ' : '') + '배터리 ' + x.bat + '%' : '') : x.st === 'skip' ? '− ' + (x.msg || '판단 보류') : x.st === 'retry' ? '↻ 읽지 못해 ' + hmOf(x.next) + ' 재확인' : '✕ ' + (x.msg || '확인 실패')); }).join('\n') : '';
            if (cur && cur.st === 'fail') {
                if (r.man) { o.cls = ' on manfail'; o.t = r.man; o.done = true; o.ttl = '직접 확인함 (자동 확인은 ' + hmOf(cur.at) + ' 실패: ' + (cur.msg || '') + ') — 누르면 해제'; }
                else { o.cls = ' bad'; o.box = '✕'; o.t = hmOf(cur.at) + (cur.lbl ? ' · ' + cur.lbl : ''); o.ttl = '자동 확인 실패 (' + hmOf(cur.at) + '): ' + (cur.msg || '') + ' — 직접 확인한 뒤 누르면 노란 체크'; }
            } else if (cur && cur.st === 'ok' && !r.clr && !camp[c]) {
                o.cls = ' on byauto'; o.t = hmOf(cur.at) + (cur.pwr ? ' · 전원ON' : '') + (cur.mis ? ' · 임무ON' : '') + (cur.bat != null ? ' · ' + (cur.ch ? '⚡' : '🔋') + cur.bat + '%' : ''); o.done = true; o.ttl = '자동 확인 정상 (' + hmOf(cur.at) + ') — 누르면 해제';
            } else if (camp[c]) { o.cls = ' on'; o.t = camp[c]; o.done = true; o.ttl = '직접 확인함 — 누르면 해제'; }
            else if (cur && cur.st === 'ok') o.ttl = '자동 확인 정상이었지만 해제됨 — 누르면 복원';
            if (!CAMP_AUTO[c] && CAMP_NOTE[c]) o.ttl = (o.ttl ? o.ttl + '\n' : '') + CAMP_NOTE[c];
            if (CAMP_AUTO[c]) o.ttl = (o.ttl ? o.ttl + '\n' : '') + (CAMP_AUTO[c].stopOnOk ? '자동 확인: ' : '자동 확인(매 회차): ') + CAMP_AUTO[c].slots.join(' · ') + (hist ? '\n' + hist : '');
            return o;
        }
        function drawCamp() {
            reloadCampAuto();
            const runIds = runningIds(); let nDone = 0;
            $('bba-camp').innerHTML = CAMPS.map((c, i) => {
                const o = campView(c), run = runIds.includes('camp:' + c) && !o.done;
                if (o.done) nDone++;
                const two = !!(o.t && !run);   // 시각·전원·임무 같은 결과 글자가 있으면 이름 아래 둘째 줄에 작게
                return '<button class="bba-cb' + o.cls + (run ? ' run' : '') + (two ? ' two' : '') + '" data-c="' + i + '" aria-pressed="' + o.done + '" title="' + esc(run ? '자동 확인 중…' : o.ttl) + '"><i>' + (run ? '…' : o.box) + '</i><span class="cn"><span class="n1">' + esc(c) + '</span>' + (two ? '<span class="t">' + esc(o.t) + '</span>' : '') + '</span></button>';
            }).join('');
            $('bba-campn').textContent = '점검 ' + nDone + '/' + CAMPS.length + ' · 매일 07:00 초기화';
        }
        $('bba-camp').addEventListener('click', e => {
            const b = e.target.closest('.bba-cb'); if (!b) return;
            const c = CAMPS[+b.dataset.c], d = new Date(), now = pad(d.getHours()) + ':' + pad(d.getMinutes());
            reloadCampAuto(); const r = campAuto[c], cur = r && r.cur;
            if (cur && cur.st === 'fail') { if (r.man) delete r.man; else r.man = now; campPut(c, r); }   // 자동 확인이 실패한 곳을 직접 확인 → 노란 체크
            else if (cur && cur.st === 'ok' && !camp[c]) { if (r.clr) delete r.clr; else r.clr = 1; campPut(c, r); }   // 자동 확인된 것: 해제 ↔ 복원
            else { if (camp[c]) delete camp[c]; else camp[c] = now; lsSet('bba_camp_' + curKey, JSON.stringify(camp)); }
            drawCamp();
        });
        function campDue(now) {   // 지금 점검해야 할 사이트 (정각 회차)
            reloadCampAuto();
            const wd = workDay(), y = wd.getFullYear(), mo = wd.getMonth(), dd = wd.getDate(), out = [], on = autoEnabled();
            Object.keys(CAMP_AUTO).forEach(c => {
                const cf = CAMP_AUTO[c], r = campAuto[c] || {};
                if (campForce.has(c)) { out.push({ c, slot: hmOf(now), forced: true }); return; }
                if (!on || (cf.stopOnOk && r.done)) return;
                if (cf.weekdayOnly && (wd.getDay() === 0 || wd.getDay() === 6)) return;   // 평일만
                const past = cf.slots.map(sl => { const p = sl.split(':'); return { sl, t: new Date(y, mo, dd, +p[0], +p[1]).getTime() }; }).filter(x => x.t <= now);
                if (!past.length) return;
                const L = past[past.length - 1], rs = r.slots && r.slots[L.sl];
                if (rs) { if (rs.st === 'retry' && now >= rs.next) out.push({ c, slot: L.sl, retry: true }); return; }
                const noTry = !r.slots || !Object.keys(r.slots).length;
                const endT = new Date(y, mo, dd, ...cf.slots[cf.slots.length - 1].split(':').map(Number)).getTime();
                if (now - L.t <= CAMP_MAX_LATE || (noTry && now <= endT + CAMP_MAX_LATE)) out.push({ c, slot: L.sl });   // 오늘 한 번도 못 했으면(스크립트를 늦게 켠 경우) 마지막 점검 시각 +30분까지는 켜자마자 바로 점검
            });
            return out;
        }
        const shortU = n => n.replace(/^.*?(\d+호기)$/, '$1');
        function campEval(c, R) {   // → { st:'ok'|'fail'|'err', msg, bat }
            const cf = CAMP_AUTO[c];
            if (!R || R.err) return { st: 'err', msg: ERR_TXT[R && R.err] || (R && R.err) || ERR_TXT.noread };
            const U0 = campSite(c).units, rd = U0.map(u => ({ n: u.n, x: R.units[u.n] }));
            if (cf.mode === 'chg') {
                const x = rd[0] && rd[0].x;
                if (!x || !x.found) return { st: 'err', msg: '기체 카드를 찾지 못함' };
                if (x.pw === null || x.pw === undefined) return { st: 'err', msg: '전원 상태를 읽지 못함' };
                const bat = x.bat !== null && x.bat !== undefined ? x.bat : null;
                if (x.pw === false) return { st: 'fail', msg: '전원 꺼짐' + (bat !== null ? ' · 배터리 ' + bat + '%' : ''), bat };
                if (bat === null) return { st: 'fail', msg: '켜짐 · 배터리 수치를 읽지 못함' + (x.ch ? ' (⚡ 있음)' : ''), bat };
                if (!x.ch) return { st: 'fail', msg: '켜짐 · 충전 표시(⚡) 없음 · 배터리 ' + bat + '%', bat };
                return { st: 'ok', msg: '', bat };
            }
            if (cf.mode === 'power') {   // 전원 ON/OFF 여부만 확인
                const x = rd[0] && rd[0].x;
                if (!x || !x.found) return { st: 'err', msg: '기체 카드를 찾지 못함' };
                if (x.pw === null || x.pw === undefined) return { st: 'err', msg: '전원 상태를 읽지 못함' };
                if (!x.pw) return { st: 'fail', msg: '전원 꺼짐', lbl: '전원OFF' };
                if (x.on === null || x.on === undefined) return { st: 'err', msg: '임무 상태를 읽지 못함' };
                return x.on ? { st: 'ok', msg: '', pwr: true, mis: true } : { st: 'fail', msg: '전원 켜짐 · 임무 OFF (알림만 — 재점검 없음)', lbl: '임무OFF', pwr: true };   // 결과만 알려줌
            }
            if (cf.mode === 'info') {   // LIT청주: 합격/불합격 없이 충전 여부와 배터리 %만 기록
                const x = rd[0] && rd[0].x;
                if (!x || !x.found) return { st: 'err', msg: '기체 카드를 찾지 못함' };
                if (x.pw === null || x.pw === undefined) return { st: 'err', msg: '전원 상태를 읽지 못함' };
                const bat = x.bat !== null && x.bat !== undefined ? x.bat : null;
                if (x.pw === false) return { st: 'fail', msg: '전원 꺼짐' + (bat !== null ? ' · 배터리 ' + bat + '%' : ''), bat };
                if (bat === null) return { st: 'fail', msg: '켜짐 · 배터리 수치를 읽지 못함', bat };
                return { st: 'ok', msg: '', bat, ch: !!x.ch };
            }
            const found = rd.filter(d => d.x && d.x.found);
            if (!found.length) return { st: 'err', msg: '기체 카드를 찾지 못함' };
            if (cf.mode === 'duty') {   // 아산·가평: 전원 ON 인 기체만 임무 확인 (전원 OFF 는 제외 → 다음 점검으로 넘김)
                if (found.some(d => d.x.pw === null || d.x.pw === undefined)) return { st: 'err', msg: '전원 상태를 읽지 못함' };
                const pwr = found.filter(d => d.x.pw === true);
                if (!pwr.length) return { st: 'skip', msg: '전원 꺼짐 — 다음 점검으로 넘김', lbl: '전원OFF' };
                if (pwr.some(d => d.x.on === null || d.x.on === undefined)) return { st: 'err', msg: '임무 상태를 읽지 못함' };
                const bad = pwr.filter(d => d.x.on === false);
                if (bad.length) return { st: 'fail', msg: bad.map(d => shortU(d.n) + ' 임무 OFF').join(' / ') + (found.length > pwr.length ? ' · 전원 꺼진 기체 제외' : '') };
                return { st: 'ok', msg: '', mis: true };
            }
            const good = found.find(d => d.x.pw === true && d.x.on === true);
            if (good) return { st: 'ok', msg: '', unit: good.n };
            if (found.some(d => d.x.pw === null || d.x.pw === undefined || d.x.on === null || d.x.on === undefined)) return { st: 'err', msg: '전원/임무관리 상태를 읽지 못함' };
            return { st: 'fail', msg: rd.map(d => shortU(d.n) + ' ' + (!d.x || !d.x.found ? '카드 없음' : d.x.pw === false ? '전원 꺼짐' : '전원 켜짐 · 임무관리 OFF')).join(' / ') };
        }
        async function campRun(list) {
            const ids = list.map(x => 'camp:' + x.c), g2 = killGen;
            for (const it of list) {
                if (g2 !== killGen) break;
                const cf = CAMP_AUTO[it.c], S = campSite(it.c);
                curProg = (list.indexOf(it) + 1) + '/' + list.length; lockTake(ids, S.k); curSiteTxt = S.k; drawAutoPill(); drawCamp();
                let R; try { R = await probeSite(S, S.units); } catch (e) { R = { err: 'noread', units: {}, cards: 0 }; console.warn('[BBA] 사이트 점검 오류:', e && e.message); }
                if (R.err === 'killed' || g2 !== killGen) break;
                const res = campEval(it.c, R);
                reloadCampAuto();
                const r = campAuto[it.c] || {}; r.slots = r.slots || {};
                const prev = r.slots[it.slot] || { tries: 0 }, fin = Date.now();
                const s = { tries: (prev.tries || 0) + 1, at: fin, st: '', msg: res.msg || '', bat: res.bat !== undefined ? res.bat : null, ch: !!res.ch, mis: !!res.mis, pwr: !!res.pwr, lbl: res.lbl || '' };
                if (res.st === 'err' && s.tries < 2 && !it.forced) { s.st = 'retry'; s.next = fin + CAMP_RETRY_MS; }   // 읽지 못한 경우만 한 번 더
                else {
                    s.st = res.st === 'ok' ? 'ok' : res.st === 'skip' ? 'skip' : 'fail';   // skip = 전원이 꺼져 판단 보류(다음 점검 시각으로 넘김) — 점검은 수행했으므로 화면에는 ✕ 로 표시
                    r.cur = { slot: it.slot, st: s.st === 'ok' ? 'ok' : 'fail', at: fin, msg: s.msg, bat: s.bat, ch: s.ch, mis: s.mis, pwr: s.pwr, lbl: s.lbl };
                    delete r.man; delete r.clr;   // 새 점검 결과가 나오면 지난 직접 체크 표시는 지우고 자동 결과로 덮어씀
                    if (camp[it.c]) { delete camp[it.c]; lsSet('bba_camp_' + curKey, JSON.stringify(camp)); }
                    if (s.st === 'ok' && cf.stopOnOk) r.done = true;
                }
                r.slots[it.slot] = s; campPut(it.c, r); campForce.delete(it.c);
                console.log('[BBA] 사이트 점검', it.c, it.slot, s.st, s.msg || '');
                drawCamp(); await sleep(800);
            }
            curSiteTxt = ''; curProg = '';
        }
        async function campCheck() {
            if (campBusy) return; if (Date.now() < killUntil && !campForce.size) return; const list = campDue(Date.now()); if (!list.length) return;
            campBusy = true;
            try { if (!lockTake(list.map(x => 'camp:' + x.c), '')) return; await campRun(list); } finally { campBusy = false; lockFree(); drawAutoPill(); drawCamp(); }
        }

        // ───────── 무선 기체 점검 (2번째 트랙) ─────────
        //  무선충전 점검 사이트(CHG_SRC)에서 🔍로 고른 기체만 1시간마다(±2분 지터) 한 곳씩 열어 [배터리 · 전원 · GPS 수신]만 읽고 바로 닫는다.
        //  일일 업무 점검(자동점검)과는 잠금이 따로라 iframe 이 동시에 2개까지 돌 수 있다(일일 업무 1 + 배터리 1).
        //  결과: 이 브라우저(bba_bt_data)에 72시간 보관 + vercel 함수(api/battery) 경유로 GitHub(monitoring_no_limit/bb_backup_battery_status.json) 한 파일에 저장.
        //  상태: o 정상(배터리 수치) · z 좀비 의심(전원 켜짐 + 배터리 '-' + GPS '-') · f 전원 꺼짐 · i 입고(카드 없음) · u 읽지 못함
        const BT_INT_MS = 60 * 60 * 1000, BT_JIT_MS = 2 * 60 * 1000, BT_KEEP_MS = 72 * 3600 * 1000;
        const BT_API = 'https://multimonitoring.vercel.app/api/battery', BT_NAME = 'battery_status';   // 내 vercel 함수(api/battery)가 monitoring_no_limit 저장소의 bb_backup_battery_status.json 으로 저장
        const BT_SITES = CHG_SRC.map(([id, names]) => {
            const nm = names;   // (두루아이 5호기는 202 로 옮겨 감 — 235 는 3호기만)
            return { k: '배터리 ' + id, id, bt: true, pick1: false, label: names[0].replace(/\s*\d+호기.*$/, ''), kw: /(?!)/, units: nm.map(n => U(n)) };
        }).concat([[268, '가평자이 1호기'], [229, '신대양제지반월2공장 1호기']].map(([id, n]) => ({ k: '배터리 ' + id, id, bt: true, pick1: false, label: n.replace(/\s*\d+호기.*$/, ''), kw: /(?!)/, units: [U(n)] })));   // 무선 기체 전용 추가 (무선충전 목록에는 없음)
        const BT_UNITS = BT_SITES.reduce((a, S) => a.concat(S.pick1 ? [S.units[0]] : S.units), []).length;   // 표시 기체 수
        // ── 🔍 점검할 기체 선택: 체크 해제한 기체 이름만 저장(bba_bt_off) → 새로 생긴 기체는 기본으로 점검 대상. (pick1 사이트가 있으면 첫 기체 이름 하나로 사이트 전체를 켜고 끈다 — 현재 해당 없음) ──
        const btOffSet = () => { try { const a = JSON.parse(lsGet('bba_bt_off', '[]')); return new Set(Array.isArray(a) ? a : []); } catch (e) { return new Set(); } };
        const btActiveUnits = (S, off) => { off = off || btOffSet(); return S.pick1 ? (off.has(S.units[0].n) ? [] : S.units) : S.units.filter(u => !off.has(u.n)); };
        const btActiveSites = () => { const off = btOffSet(); return BT_SITES.filter(S => btActiveUnits(S, off).length); };
        let btData = {}, btBusy = false, btCur = null, btDone = 0, btTotal = 0, btUp = { st: '', t: 0, msg: '' };
        try { btData = JSON.parse(lsGet('bba_bt_data', '{}')) || {}; } catch (e) { btData = {}; }
        if (!btData.robots) btData = { robots: {} };
        const BTL = { gp: 'bba_bt_lock' };
        const btLockGet = () => { try { return JSON.parse(lsGet(BTL.gp, 'null')); } catch (e) { return null; } };
        const btLockTake = () => { const l = btLockGet(), now = Date.now(); if (l && l.tab !== TABID && now - l.t < 150000) return false; lsSet(BTL.gp, JSON.stringify({ tab: TABID, t: now })); const v = btLockGet(); return !!(v && v.tab === TABID); };
        const btLockFree = () => { const l = btLockGet(); if (l && l.tab === TABID) { try { localStorage.removeItem(BTL.gp); } catch (e) { /* 무시 */ } } };
        function btClassify(R, u) {   // → {s, b?}
            if (!R || R.err) return { s: 'u' };
            const x = R.units[u.n];
            if (R.cards === 0 || !x || !x.found) return { s: 'i' };
            if (x.pw === false) return { s: 'f' };
            if (x.pw === null || x.pw === undefined) return { s: 'u' };
            if (x.bat !== null && x.bat !== undefined) return { s: 'o', b: x.bat };
            if (x.gp === '') return { s: 'z' };
            return { s: 'u' };
        }
        function btPut(name, id, rec) {   // rec = [t(초), 배터리|null, 상태]
            const r = btData.robots[name] || (btData.robots[name] = { id, h: [] });
            r.id = id; r.h.push(rec);
        }
        function btPrune() {
            const lim = Math.floor((Date.now() - BT_KEEP_MS) / 1000);
            Object.keys(btData.robots).forEach(n => { const r = btData.robots[n]; r.h = (r.h || []).filter(x => x[0] >= lim); if (!r.h.length) delete btData.robots[n]; });
        }
        const btSave = () => { btPrune(); lsSet('bba_bt_data', JSON.stringify(btData)); };
        function btLatest() {   // 표시용: 기체별 가장 최근 기록 (pick1 사이트는 후보 중 최근 기록 하나)
            const out = [], off = btOffSet();
            BT_SITES.forEach(S => {
                if (!btActiveUnits(S, off).length) return;
                const us = S.pick1 ? [S.units.slice().map(u => ({ u, h: (btData.robots[u.n] || {}).h || [] })).sort((a, b) => ((b.h[b.h.length - 1] || [0])[0]) - ((a.h[a.h.length - 1] || [0])[0]))[0].u] : btActiveUnits(S, off);
                us.forEach(u => { const h = (btData.robots[u.n] || {}).h || [], l = h[h.length - 1]; out.push({ n: u.n, id: S.id, rec: l || null }); });
            });
            return out;
        }
        async function btRound(manual) {
            if (btBusy) return;
            if (!btLockTake()) return;
            btBusy = true; btBeat = Date.now(); btDone = 0; lsSet('bba_bt_last', String(Date.now()));
            const t0 = Date.now(), g = killGen; let nOk = 0, killed = false;
            const offNow = btOffSet(), plan = BT_SITES.map(S => ({ S, us: btActiveUnits(S, offNow) })).filter(x => x.us.length);
            btTotal = plan.length;
            try {
                for (const { S, us } of plan) {
                    if (g !== killGen) { killed = true; break; }   // Kill All
                    btCur = S; drawBt(); btLockTake(); btBeat = Date.now();
                    let R; try { R = await probeSite(S, us); } catch (e) { R = { err: 'noread', units: {}, cards: 0 }; }
                    if (R.err === 'killed' || g !== killGen) { killed = true; break; }
                    const t = Math.floor(Date.now() / 1000);
                    if (S.pick1) {   // 5호기가 보이면 5호기, 아니면 3호기
                        const c = S.units.map(u => ({ u, c: btClassify(R, u) }));
                        const pick = c.find(x => x.c.s !== 'i' && x.c.s !== 'u') || c.find(x => x.c.s === 'u') || c[0];
                        btPut(pick.u.n, S.id, [t, pick.c.b === undefined ? null : pick.c.b, pick.c.s]);
                    } else us.forEach(u => { const c = btClassify(R, u); btPut(u.n, S.id, [t, c.b === undefined ? null : c.b, c.s]); });
                    btDone++; btSave(); drawBt(); await sleep(250);
                }
                nOk = killed ? 0 : 1; if (!killed) lsSet('bba_bt_done', String(Date.now()));
            } catch (e) { console.warn('[BBA] 배터리 점검 오류:', e && e.message); }
            finally { btBusy = false; btCur = null; btInfo = null; btLockFree(); btSave(); drawBt(); }
            console.log('[BBA] 배터리 점검 완료', Math.round((Date.now() - t0) / 1000) + '초');
            if (nOk) btSync();
        }
        function btTick() {
            const now = Date.now();
            if (btBusy && now - btBeat > 150000) {   // 멈춤 방지: 2분 반 진전이 없으면 풀어줌
                console.warn('[BBA] 배터리 점검이 멈춘 것으로 보여 초기화합니다');
                try { document.querySelectorAll('iframe[title="bba-probe"]').forEach(x => x.remove()); } catch (e) { /* 무시 */ }
                btBusy = false; btCur = null; btInfo = null; btLockFree(); drawBt();
            }
            if (btBusy) { btLockTake(); drawBt(); return; }
            drawBt();   // 자동 점검은 없음 — '지금 점검' 버튼으로만 시작
        }
        // ── 저장: 내 vercel 함수(BACKUP_BASE)가 GitHub 토큰을 가지고 있어 이 파일에는 토큰이 없다 ──
        function btMerge(a, b) {   // 두 robots 묶음을 시각(초) 기준으로 합침
            const out = {};
            [a, b].forEach(src => Object.keys(src || {}).forEach(n => {
                const r = src[n], o = out[n] || (out[n] = { id: r.id, h: [] }), seen = new Set(o.h.map(x => x[0]));
                (r.h || []).forEach(x => { if (!seen.has(x[0])) { o.h.push(x); seen.add(x[0]); } });
            }));
            Object.keys(out).forEach(n => out[n].h.sort((x, y) => x[0] - y[0]));
            return out;
        }
        let btSyncing = false;
        async function btSync() {
            if (btSyncing) return; btSyncing = true;
            try {
                let remote = {};
                try {
                    const g = await fetch(BT_API + '?name=' + encodeURIComponent(BT_NAME), { cache: 'no-store' });
                    if (g.ok) { const j = await g.json(); remote = (j && j.data && j.data.robots) || {}; }
                } catch (e) { /* 처음이거나 읽기 실패 — 이 PC 기록만으로 저장 */ }
                btData.robots = btMerge(remote, btData.robots); btPrune(); lsSet('bba_bt_data', JSON.stringify(btData));
                const latest = {}; Object.keys(btData.robots).forEach(n => { const h = btData.robots[n].h; latest[n] = h[h.length - 1]; });
                const data = { v: 1, fmt: '[unix초, 배터리%|null, 상태(o정상 z좀비의심 f꺼짐 i입고 u읽기실패)]', updated: new Date().toISOString(), keepHours: 72, intervalMin: 30, latest, robots: btData.robots };
                const p = await fetch(BT_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: BT_NAME, data }) });
                let j = {}; try { j = await p.json(); } catch (e) { /* 무시 */ }
                if (p.ok && j.ok !== false) btUp = { st: 'ok', t: Date.now(), msg: '' };
                else throw new Error('저장 ' + p.status);
            } catch (e) { btUp = { st: 'err', t: Date.now(), msg: (e && e.message) || '네트워크 오류' }; console.warn('[BBA] 배터리 저장 실패:', e && e.message); }
            finally { btSyncing = false; drawBt(); }
        }
        // ── 기체 카드 클릭 → 기체 정보 창의 '배터리 증감 추이' 그래프 재사용 (점은 점검한 실제 시각, 보조 눈금은 30분 — 점검 주기는 1시간) ──
        function btOpenPanel(name) {
            const panel = document.getElementById('bb-info-card-panel'), titleEl = document.getElementById('bb-icp-title'), badgeEl = document.getElementById('bb-icp-badge'), bodyEl = document.getElementById('bb-icp-body');
            const W = window.__bbaWbl; if (!panel || !bodyEl || !W) return;
            const rec = btData.robots[name], h = rec ? rec.h : [], last = h[h.length - 1], p2 = x => String(x).padStart(2, '0');
            const hmS = t => { const d = new Date(t * 1000); return p2(d.getHours()) + ':' + p2(d.getMinutes()); };
            const stTxt = { o: '정상', z: '좀비 의심 👻', f: '전원 꺼짐', i: '입고 (카드 없음)', u: '확인 불가' };
            titleEl.textContent = name;
            const asof = document.createElement('span'); asof.className = 'bb-icp-asof'; asof.textContent = last ? ' ' + hmS(last[0]) + ' 점검' : ' 기록 없음'; titleEl.appendChild(asof);
            const bd = !last ? { l: '기록 없음', c: 'standby' } : last[2] === 'o' ? { l: '🟢 ' + last[1] + '%', c: last[1] <= BT_LOW ? 'warn' : 'ok' } : last[2] === 'z' ? { l: '👻 좀비 의심', c: 'warn' } : last[2] === 'f' ? { l: '⚫ 전원 꺼짐', c: 'off' } : last[2] === 'i' ? { l: '입고', c: 'standby' } : { l: '확인 불가', c: 'warn' };
            badgeEl.className = 'bb-icp-badge ' + bd.c; badgeEl.textContent = bd.l;
            const bats = h.filter(x => x[2] === 'o').map(x => x[1]), cntS = k => h.filter(x => x[2] === k).length;
            const row = (a, b) => '<div class="bb-icp-row"><span class="bb-icp-label">' + a + '</span><span class="bb-icp-value">' + b + '</span></div>';
            const dayBase = off => { const n = new Date(), d = new Date(n); if (n.getHours() < W.dayStart) d.setDate(d.getDate() - 1); d.setHours(W.dayStart, 0, 0, 0); d.setDate(d.getDate() - off); return d; };
            const dayData = off => {
                const d0 = dayBase(off), s0 = d0.getTime(), e0 = s0 + 86400000;
                const log = h.filter(x => x[0] * 1000 >= s0 && x[0] * 1000 < e0).map(x => ({ t: hmS(x[0]), battery: x[2] === 'o' ? x[1] : null, status: x[2] === 'o' ? (x[1] <= BT_LOW ? 'btl' : 'bt') : x[2] === 'z' ? 'btz' : x[2] === 'f' ? 'off' : 'btu', k: x[2], ts: x[0] }));
                for (let i = log.length - 1; i > 0; i--) if (log[i].ts - log[i - 1].ts > 150 * 60) log.splice(i, 0, { t: hmS(log[i - 1].ts + 1), battery: null, status: 'btu', k: 'gap', ts: log[i - 1].ts + 1 });   // 일시중지 등으로 150분(2.5회분) 넘게 비면 선을 끊음
                return { entries: { [name]: { log } }, full: off > 0, day: d0.getFullYear() + '-' + p2(d0.getMonth() + 1) + '-' + p2(d0.getDate()), log };
            };
            function lines(log) {
                if (!log.filter(pt => pt.k !== 'gap').length) return '<div class="bb-icp-wbl-line" style="color:var(--mu);">이 날 점검 기록 없음</div>';
                const out = []; let cur = null;
                log.filter(pt => pt.k !== 'gap').sort((a, b) => a.ts - b.ts).forEach(pt => { const k = pt.k === 'o' ? (pt.battery <= BT_LOW ? 'low' : 'ok') : pt.k; if (!cur || cur.k !== k) { cur = { k, a: pt, b: pt }; out.push(cur); } else cur.b = pt; });
                const col = { ok: 'var(--gn)', low: 'var(--rd)', z: 'var(--or)', f: 'var(--offdot)', i: 'var(--mu)', u: 'var(--mu)' }, lab = { ok: '정상', low: '배터리 부족', z: '좀비 의심 👻', f: '전원 꺼짐', i: '입고', u: '확인 불가' };
                return out.map(g => {
                    const dot = '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + col[g.k] + ';margin-right:5px;"></span>';
                    let t = dot + lab[g.k] + ' ' + g.a.t + (g.b.t !== g.a.t ? '~' + g.b.t : '');
                    if ((g.k === 'ok' || g.k === 'low') && g.a.battery != null) {
                        const d = g.b.battery - g.a.battery, hrs = (g.b.ts - g.a.ts) / 3600;
                        t += d === 0 || hrs <= 0 ? ' · ' + g.a.battery + '% 유지' : ' · ' + g.a.battery + '%→' + g.b.battery + '% (시간당 ' + (d / hrs > 0 ? '+' : '') + (d / hrs).toFixed(1) + '%)';
                    }
                    return '<div class="bb-icp-wbl-line">' + t + '</div>';
                }).join('');
            }
            let off = 0;
            bodyEl.innerHTML = '<div class="bb-icp-flex"><div class="bb-icp-left">' +
                '<div class="bb-icp-section"><div class="bb-icp-section-title">현재 상태</div>' + row('상태', last ? stTxt[last[2]] + (last[2] === 'o' ? ' · ' + last[1] + '%' : '') : '기록 없음') + row('마지막 점검', last ? hmS(last[0]) : '-') + row('사이트 번호', rec ? rec.id : '-') + '</div>' +
                '<div class="bb-icp-section"><div class="bb-icp-section-title">최근 72시간</div>' + row('점검 횟수', h.length + '회 (약 1시간 간격)') + row('배터리 범위', bats.length ? Math.min.apply(null, bats) + '% ~ ' + Math.max.apply(null, bats) + '%' : '-') + row('좀비 의심', cntS('z') + '회') + row('전원 꺼짐', cntS('f') + '회') + row('확인 불가', cntS('u') + '회') + '</div></div>' +
                '<div class="bb-icp-right"><div class="bb-icp-section-title" style="display:flex;align-items:center;justify-content:space-between;gap:6px;"><span id="bt-p-title"></span><span style="display:flex;gap:6px;flex-shrink:0;"><button class="bb-btn" id="bt-p-prev" style="font-size:calc(15px * var(--bb-ts, 1));font-weight:900;padding:3px 8px;">◀ 이전 날</button><button class="bb-btn" id="bt-p-next" style="font-size:calc(15px * var(--bb-ts, 1));font-weight:900;padding:3px 8px;">다음 날 ▶</button></span></div>' +
                '<div id="bt-p-chart"></div><div class="bb-icp-wbl-log" id="bt-p-log"></div></div></div>';
            function show() {
                const d = dayData(off);
                document.getElementById('bt-p-title').textContent = (off === 0 ? '오늘' : off === 1 ? '어제' : off + '일 전') + ' 배터리 증감 추이 [' + W.md(d.day) + ']';
                document.getElementById('bt-p-chart').innerHTML = W.chart(name, d);
                document.getElementById('bt-p-log').innerHTML = lines(d.log);
                document.getElementById('bt-p-prev').disabled = off >= 3; document.getElementById('bt-p-next').disabled = off <= 0;
                requestAnimationFrame(() => {
                    const sc = document.getElementById('bb-wbl-scroll'); if (!sc) return; sc.scrollLeft = off === 0 ? sc.scrollWidth : 0;
                    sc.addEventListener('wheel', e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; e.preventDefault(); sc.scrollLeft += e.deltaY; }, { passive: false });
                });
            }
            document.getElementById('bt-p-prev').addEventListener('click', () => { if (off < 3) { off++; show(); } });
            document.getElementById('bt-p-next').addEventListener('click', () => { if (off > 0) { off--; show(); } });
            panel.classList.add('open'); panel.style.zIndex = W.z();
            show();
        }
        // ── 화면: 기체별 한 줄 카드 2열 ──
        const BT_LOW = 21;
        let btSortMode = lsGet('bba_bt_sort', 'sev'), btShown = [], btDrag = null;
        const btOrder = () => { try { const a = JSON.parse(lsGet('bba_bt_order', '[]')); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
        const btSev = (r) => { if (!r) return 6; const s = r[2]; return s === 'z' ? 0 : s === 'o' && r[1] <= BT_LOW ? 1 : s === 'u' ? 2 : s === 'f' ? 3 : s === 'o' ? 4 : 5; };
        function drawBt() {
            const g = $('bba-btg'); if (!g) return;
            const byName = (a, b) => a.n.localeCompare(b.n, 'ko', { numeric: true });
            const list = btLatest();
            if (btSortMode === 'name') list.sort(byName);
            else if (btSortMode === 'mine') { const od = btOrder(), ix = n => { const i = od.indexOf(n); return i < 0 ? 1e6 : i; }; list.sort((a, b) => ix(a.n) - ix(b.n) || byName(a, b)); }
            else list.sort((a, b) => btSev(a.rec) - btSev(b.rec) || ((a.rec && a.rec[1] != null ? a.rec[1] : 999) - (b.rec && b.rec[1] != null ? b.rec[1] : 999)) || byName(a, b));
            btShown = list.map(x => x.n);
            const sb = $('bba-bt-sort'); if (sb) sb.textContent = btSortMode === 'name' ? '이름순' : btSortMode === 'mine' ? '내 배치' : '상태순';
            let nz = 0, nl = 0, nf = 0;
            const html = list.map(x => {
                const r = x.rec, s = r ? r[2] : '', b = r ? r[1] : null; let cls = 'bt', v = '대기', fill = 0, ttl = x.n;
                if (s === 'o') { v = b + '%'; fill = Math.max(0, Math.min(100, b)); if (b <= BT_LOW) { cls += ' low'; nl++; } else cls += ' ok'; }
                else if (s === 'z') { v = '좀비 의심 👻'; cls += ' zb'; nz++; }
                else if (s === 'f') { v = '전원 꺼짐'; cls += ' off'; nf++; }
                else if (s === 'i') { v = '입고'; cls += ' in'; }
                else if (s === 'u') { v = '확인 불가'; cls += ' unk'; }
                else cls += ' wait';
                if (r) { const d = new Date(r[0] * 1000); ttl += ' · ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ' 확인'; }
                if (btCur && btCur.id === x.id && btBusy) cls += ' now';
                return '<div class="' + cls + '" draggable="true" data-n="' + esc(x.n) + '" title="' + esc(ttl) + '">' + (fill ? '<i style="width:' + fill + '%"></i>' : '') + '<span class="nm">' + esc(x.n) + '</span><span class="sp"> - </span><span class="v">' + esc(v) + '</span></div>';
            }).join('');
            if (!btDrag) g.innerHTML = html;
            const cnt = $('bba-bt-cnt'); if (cnt) cnt.textContent = list.length + '대';
            const lt = $('bba-bt-last'); if (lt) { const t = +lsGet('bba_bt_done', '0') || 0, d = new Date(t), p2 = n => String(n).padStart(2, '0'); lt.textContent = t ? (d.getMonth() + 1) + '/' + d.getDate() + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) : ''; }
            const st = $('bba-bt-st');
            if (st) {
                let txt; const hm = t => { const d = new Date(t); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
                if (btBusy) txt = '🔋 점검 중 ' + btDone + '/' + (btTotal || btActiveSites().length) + (btCur ? ' · ' + btCur.label : ''); else txt = '';
                const nb = $('bba-bt-now'); if (nb) nb.disabled = !!btBusy;
                st.textContent = txt; st.style.display = txt ? '' : 'none'; st.className = 'bba-pill' + (btBusy ? ' au run' : '');
            }
            const up = $('bba-bt-gh');
            if (up) { up.textContent = btUp.st === 'ok' ? '☁✓' : btUp.st === 'err' ? '☁✕' : '☁'; up.title = btUp.st === 'ok' ? 'GitHub 저장됨 ' + new Date(btUp.t).toLocaleTimeString('ko-KR', { hour12: false }) + ' (클릭: 지금 저장)' : btUp.st === 'err' ? 'GitHub 저장 실패: ' + btUp.msg + ' (클릭: 다시 저장)' : (btUp.msg || 'GitHub 저장 (한 바퀴가 끝날 때마다 자동 · 클릭: 지금 저장)'); up.classList.toggle('bad', btUp.st === 'err'); }
        }
        const btSortEl = $('bba-bt-sort');
        if (btSortEl) btSortEl.addEventListener('click', () => {
            const seq = btOrder().length ? ['sev', 'name', 'mine'] : ['sev', 'name'];
            btSortMode = seq[(seq.indexOf(btSortMode) + 1) % seq.length]; lsSet('bba_bt_sort', btSortMode); drawBt();
        });
        (function () {   // 한 줄 카드 끌어서 놓기 = 두 카드 위치 맞바꾸기 → '내 배치'로 저장
            const g = $('bba-btg'); if (!g) return;
            g.addEventListener('dragstart', e => { const c = e.target.closest && e.target.closest('.bt'); if (!c) return; btDrag = c.dataset.n; try { e.dataTransfer.setData('text/plain', btDrag); e.dataTransfer.effectAllowed = 'move'; } catch (er) { /* 무시 */ } c.style.opacity = '.35'; });
            g.addEventListener('dragover', e => { if (!btDrag) return; const c = e.target.closest && e.target.closest('.bt'); if (c) { e.preventDefault(); g.querySelectorAll('.bt.over').forEach(x => x.classList.remove('over')); c.classList.add('over'); } });
            g.addEventListener('dragleave', e => { const c = e.target.closest && e.target.closest('.bt'); if (c) c.classList.remove('over'); });
            g.addEventListener('drop', e => {
                const c = e.target.closest && e.target.closest('.bt'); if (!c || !btDrag) return; e.preventDefault();
                const a = btShown.indexOf(btDrag), b = btShown.indexOf(c.dataset.n);
                if (a >= 0 && b >= 0 && a !== b) { const arr = btShown.slice(); const t = arr[a]; arr[a] = arr[b]; arr[b] = t; lsSet('bba_bt_order', JSON.stringify(arr)); btSortMode = 'mine'; lsSet('bba_bt_sort', 'mine'); }
                btDrag = null; drawBt();
            });
            g.addEventListener('dragend', () => { btDrag = null; drawBt(); });
            g.addEventListener('dblclick', e => { const c = e.target.closest && e.target.closest('.bt'); if (c) btOpenPanel(c.dataset.n); });
        })();
        // ── 🔍 점검할 기체 선택 창 (무선충전 상세 설정과 같은 모양: 체크한 기체만 점검·표시) ──
        const btCfg = document.createElement('div'); btCfg.id = 'bba-btcfg'; root.appendChild(btCfg);
        function btCfgBuild() {
            const off = btOffSet(); let tot = 0, on = 0;
            const rows = BT_SITES.map(S => {
                const us = S.pick1 ? [S.units[0]] : S.units;
                return us.map(u => { tot++; const ck = !off.has(u.n); if (ck) on++; return '<label class="u' + (ck ? '' : ' dis') + '"><input type="checkbox" data-n="' + esc(u.n) + '"' + (ck ? ' checked' : '') + '><span class="nm">[' + S.id + '] ' + esc(u.n) + (S.pick1 ? ' (없으면 3호기)' : '') + '</span></label>'; }).join('');
            }).join('');
            btCfg.innerHTML = '<div class="ph"><b>🔍 무선 기체 점검 대상</b><button class="px" data-a="x" title="닫기">✕</button></div>' +
                '<div class="ul">' + rows + '</div>' +
                '<div class="tm">' + on + ' / ' + tot + '대 선택 · 체크한 기체만 점검하고 목록에 표시합니다 (체크를 풀어도 기록은 보관됨) · 자동 점검은 없고 [지금 점검]을 누를 때만 점검합니다</div>' +
                '<div class="pb"><button class="bba-btn" data-a="all">전체 선택</button><button class="bba-btn" data-a="none">전체 해제</button><button class="bba-btn on" data-a="now">지금 점검</button></div>';
        }
        function btCfgOpen(btn) {
            btCfgBuild(); btCfg.classList.add('open');
            const rr = btn.getBoundingClientRect(), br = root.getBoundingClientRect(), sc = br.width / root.offsetWidth || 1;
            let top = (rr.bottom - br.top) / sc + 4; const h = btCfg.offsetHeight;
            if (top + h > root.offsetHeight - 6) top = Math.max(4, root.offsetHeight - h - 6);
            btCfg.style.top = top + 'px'; btCfg.style.left = Math.min(Math.max(8, (rr.left - br.left) / sc - 4), Math.max(8, root.offsetWidth - 380)) + 'px';
        }
        const btCfgClose = () => btCfg.classList.remove('open');
        const btCfgEl = $('bba-bt-cfg');
        if (btCfgEl) btCfgEl.addEventListener('click', () => { if (btCfg.classList.contains('open')) btCfgClose(); else btCfgOpen(btCfgEl); });
        btCfg.addEventListener('change', e => {
            const c = e.target.closest('input[type="checkbox"][data-n]'); if (!c) return;
            const off = btOffSet(); if (c.checked) off.delete(c.dataset.n); else off.add(c.dataset.n);
            lsSet('bba_bt_off', JSON.stringify([...off])); const keep = (btCfg.querySelector('.ul') || {}).scrollTop || 0; btCfgBuild(); btCfg.querySelector('.ul').scrollTop = keep; drawBt();
        });
        btCfg.addEventListener('click', e => {
            const b = e.target.closest('button[data-a]'); if (!b) return; const a = b.dataset.a;
            if (a === 'x') return btCfgClose();
            if (a === 'all') { lsSet('bba_bt_off', '[]'); btCfgBuild(); drawBt(); return; }
            if (a === 'none') { lsSet('bba_bt_off', JSON.stringify(BT_SITES.map(S => S.units[0].n).concat(BT_SITES.filter(S => !S.pick1).reduce((r, S) => r.concat(S.units.slice(1).map(u => u.n)), [])))); btCfgBuild(); drawBt(); return; }
            if (a === 'now') { btCfgClose(); btNowAsk(); }
        });
        document.addEventListener('mousedown', e => { if (btCfg.classList.contains('open') && !btCfg.contains(e.target) && !(e.target.closest && e.target.closest('#bba-bt-cfg'))) btCfgClose(); }, true);
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && btCfg.classList.contains('open')) btCfgClose(); });
        function btAsk(msg, cb) {
            const old = $('bba-btask'); if (old) old.remove();
            const w = document.createElement('div'); w.id = 'bba-btask';
            w.innerHTML = '<div class="bx"><div class="m">' + msg + '</div><div class="b"><button type="button" class="bba-btn" data-v="0">아니오</button><button type="button" class="bba-btn" data-v="1" style="border-color:#22a05a">예</button></div></div>';
            const done = v => { w.remove(); cb(v); };
            w.addEventListener('mousedown', e => e.preventDefault());   // 다른 창/입력의 포커스를 가져가지 않음
            w.addEventListener('click', e => { const b = e.target.closest && e.target.closest('button[data-v]'); if (b) done(b.dataset.v === '1'); });
            ($('bba-btg') && $('bba-btg').closest('.bba-btz') || $('bb') || document.body).appendChild(w);
        }
        function btNowAsk() {
            if (btBusy) return;
            btAsk('무선 기체 배터리 점검을<br>지금 시작할까요?', ok => { if (ok) btRound(true); });
        }
        const btNowEl = $('bba-bt-now'); if (btNowEl) btNowEl.addEventListener('click', btNowAsk);
        const btGhEl = $('bba-bt-gh');
        if (btGhEl) btGhEl.addEventListener('click', () => btSync());
        drawBt();
        setInterval(btTick, 20 * 1000);   // 멈춤 감시·화면 갱신만 (점검 자체는 자동으로 시작하지 않음)

        // ───────── 커스텀 점검: 주소(사이트 번호)를 직접 정해 그 안의 기체 카드를 읽고, 미리 고른 항목만 검사 ─────────
        //  · 주소: 사이트 번호(예: 178)·NCC 주소(…/monitoring/178)·이름 검색. 코드에 들어 있는 주소면 기체 카드가 나오고 체크로 고를 수 있음. 없는 주소면 열어서 카드를 전부 읽음.
        //  · 항목: 전원 · 배터리 · 충전 · 임무관리 · 좀비 의심 · 입고 추정 · GPS · 임무 진행 — 체크한 것만 결과에 표시/판정
        //  · 설정(주소·체크)과 마지막 결과는 localStorage 에 저장. 창을 닫아도 점검은 계속되고, 다시 열면 진행/결과가 보임.
        const CU_CFG = 'bba_cu_cfg', CU_RES = 'bba_cu_res';
        const CU_CHECKS = [
            ['pw', '🔌', '전원 켜짐/꺼짐', '로봇 전원이 켜져 있는지'],
            ['bat', '🔋', '배터리', '수치 표시 · 20% 이하는 경고'],
            ['chg', '⚡', '충전 중', '무선충전 중인지'],
            ['mis', '🎯', '임무관리', '임무받기 스위치 ON/OFF'],
            ['zom', '🧟', '좀비 의심', '전원 켜짐 + 배터리·GPS 없음'],
            ['ins', '📦', '입고 추정', '카드가 사라짐 (등록된 기체만)'],
            ['gps', '📡', 'GPS 수신', 'GPS 수신 값'],
            ['prg', '🚦', '임무 진행', '임무 진행 칸의 값'],
        ];
        const CU_DEF = { pw: 1, bat: 1, mis: 1, zom: 1, ins: 1, chg: 0, gps: 0, prg: 0 };
        let cuCfg = (() => {
            try { const o = JSON.parse(lsGet(CU_CFG, 'null')); if (o && Array.isArray(o.sites)) return { sites: o.sites.filter(x => x && +x.id > 0).map(x => ({ id: +x.id, off: Array.isArray(x.off) ? x.off : [] })), chk: Object.assign({}, CU_DEF, o.chk || {}) }; } catch (e) { /* 무시 */ }
            return { sites: [], chk: Object.assign({}, CU_DEF) };
        })();
        let cuRes = (() => { try { const o = JSON.parse(lsGet(CU_RES, 'null')); if (o && Array.isArray(o.sites)) { o.busy = false; return o; } } catch (e) { /* 무시 */ } return null; })();
        let cuBusy = false, cuProg = { i: 0, n: 0, cur: '' }, cuMsg = '', cuOnlyBad = false, cuCur = null, cuStopReq = false, _cuReg = null, cuIsOpen = false;
        const cuSaveCfg = () => lsSet(CU_CFG, JSON.stringify(cuCfg));
        const cuSaveRes = () => { try { lsSet(CU_RES, JSON.stringify(cuRes)); } catch (e) { /* 무시 */ } };
        function cuReg() {   // 코드에 들어 있는 주소 → { id, label, names[] }
            if (_cuReg) return _cuReg;
            const m = {}, lab = n => String(n).replace(/\s*\d+호기.*$/, '').trim();
            const add = (id, names, label) => { id = +id; if (!id) return; const e = m[id] || (m[id] = { id, label: '', names: [] }); if (label && !e.label) e.label = label; names.forEach(n => { if (n && !e.names.includes(n)) e.names.push(n); }); };
            try { CHG_SRC.forEach(r => add(r[0], r[1], lab(r[1][0]))); } catch (e) { /* 무시 */ }
            try { BT_SITES.forEach(S => add(S.id, S.units.map(u => u.n), S.label)); } catch (e) { /* 무시 */ }
            try { Object.keys(PAT_EXTRA_ID).forEach(n => add(PAT_EXTRA_ID[n], [n], lab(n))); } catch (e) { /* 무시 */ }
            try { AUTO_SITES.forEach(S => add(S.id, S.units.map(u => u.n), S.k)); } catch (e) { /* 무시 */ }
            return (_cuReg = m);
        }
        function cuParse(txt) { const t = String(txt || '').trim(), m = t.match(/monitoring\/(\d{1,6})/) || t.match(/^#?(\d{1,6})$/); return m ? +m[1] : 0; }
        function cuSearch(q) {
            const k = normTxt(q); if (!k) return [];
            return Object.values(cuReg()).filter(e => String(e.id) === String(q).trim() || normTxt(e.label).includes(k) || e.names.some(n => normTxt(n).includes(k))).slice(0, 6);
        }
        function cuAddSite(id) {
            if (!id) return false;
            if (!cuCfg.sites.some(x => x.id === id)) { cuCfg.sites.push({ id, off: [] }); cuSaveCfg(); }
            return true;
        }
        const cuZombie = c => c.pw === true && c.bat == null && c.gp === '';
        const cuBad = (c, k) => !!((k.pw && c.pw === false) || (k.mis && c.on === false) || (k.bat && c.bat != null && c.bat <= 20) || (k.zom && cuZombie(c)));
        function cuChips(c, k) {
            const ch = (cls, t) => '<span class="c ' + cls + '">' + esc(t) + '</span>';
            let h = '';
            if (k.pw) h += c.pw === true ? ch('ok', '전원 ON') : c.pw === false ? ch('warn', '전원 OFF') : ch('mu', '전원 ?');
            if (k.bat) h += c.bat == null ? ch('mu', '🔋 -') : ch(c.bat <= 20 ? 'warn' : c.bat <= 50 ? 'mid' : 'ok', '🔋 ' + c.bat + '%');
            if (k.chg) h += c.ch ? ch('ok', '⚡ 충전 중') : ch('mu', '⚡ -');
            if (k.mis) h += c.on === true ? ch('ok', '임무 ON') : c.on === false ? ch('warn', '임무 OFF') : ch('mu', '임무 ?');
            if (k.zom && cuZombie(c)) h += ch('warn', '🧟 좀비 의심');
            if (k.gps) h += ch('mu', '📡 ' + (c.gp ? c.gp : '-'));
            if (k.prg) h += ch('mu', '🚦 ' + (c.pg ? c.pg : '-'));
            return h;
        }
        const cuFmt = t => { const d = new Date(t), p = n => String(n).padStart(2, '0'); return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); };
        // 한 사이트의 점검 결과 → 저장용 (등록된 주소면 체크한 기체만 · 새 주소면 읽은 카드 전부)
        function cuMake(s, e, names, S, R) {
            const all = (R.all || []).map(c => ({ n: c.name, txt: c.txt, pw: c.pw, bat: c.bat, ch: c.ch ? 1 : 0, on: c.on, gp: c.gp, pg: c.pg }));
            let cards = [], miss = [];
            if (e) { S.units.forEach(u => { const c = all.find(x => cardMatches(x.txt, u)); if (c) cards.push(Object.assign({}, c, { n: u.n })); else miss.push(u.n); }); }
            else cards = all;
            cards.forEach(c => { delete c.txt; });
            return { id: s.id, label: e ? e.label : '', known: !!e, err: R.err || null, cards, miss: R.err ? [] : miss };
        }
        async function cuRun() {
            if (cuBusy) return;
            if (!cuCfg.sites.length) { cuMsg = '점검할 주소를 먼저 추가해 주세요'; cuDraw(); return; }
            if (!Object.values(cuCfg.chk).some(Boolean)) { cuMsg = '점검 항목을 하나 이상 골라 주세요'; cuDraw(); return; }
            const sites = cuCfg.sites.map(x => ({ id: x.id, off: x.off.slice() })), g = killGen, res = { at: 0, busy: true, chk: Object.assign({}, cuCfg.chk), sites: [] };
            cuBusy = true; cuStopReq = false; cuMsg = ''; cuRes = res; cuProg = { i: 0, n: sites.length, cur: '' }; cuSaveRes(); cuDraw(); cuDrawBtn();
            try {
                for (const s of sites) {
                    if (g !== killGen || cuStopReq) break;
                    const e = cuReg()[s.id], names = e ? e.names.filter(n => !s.off.includes(n)) : [];
                    cuProg.cur = (e && e.label) || ('#' + s.id); cuProg.i++; cuDraw(); cuDrawBtn();
                    const S = { k: '커스텀 ' + s.id, id: s.id, cu: true, kw: /(?!)/, units: names.map(n => U(n)) };
                    cuCur = S;
                    let R; try { R = await probeSite(S, S.units); } catch (er) { R = { err: 'noread', units: {}, cards: 0, all: [] }; }
                    cuCur = null;
                    if (R.err === 'killed' || g !== killGen || cuStopReq) break;
                    res.sites.push(cuMake(s, e, names, S, R));
                    if (cuRes === res) { cuSaveRes(); cuDraw(); cuDrawBtn(); }
                    await sleep(300);
                }
            } finally {
                res.busy = false;
                if (g === killGen && !cuStopReq) res.at = Date.now(); else { res.stopped = true; res.at = res.at || Date.now(); }
                if (cuRes === res) { cuBusy = false; cuCur = null; cuSaveRes(); cuDraw(); cuDrawBtn(); }
            }
        }
        function cuStop() { cuStopReq = true; try { if (cuCur && cuCur.kill) cuCur.kill('killed'); } catch (e) { /* 무시 */ } }
        // ── 화면 ──
        const cuBg = document.createElement('div'); cuBg.id = 'bba-cu-bg';
        const cuEl = document.createElement('div'); cuEl.id = 'bba-cu';
        cuEl.innerHTML =
            '<div class="hd"><b>🧪 커스텀 점검</b><span class="sub">주소 고르기 → 항목 정하기 → 한 번에 점검</span><span class="st" id="bba-cu-st"></span><button type="button" class="bba-btn" data-a="close" title="닫기 (점검 중이면 계속 진행됩니다)">✕</button></div>' +
            '<div class="bd"><div class="lf">' +
              '<div class="sec"><div class="t"><i>1</i>점검할 주소<small id="bba-cu-sn"></small></div>' +
                '<div class="ad"><input id="bba-cu-in" type="text" placeholder="번호 · 주소 · 이름" autocomplete="off" spellcheck="false"><button type="button" class="bba-btn" data-a="add">추가</button></div>' +
                '<div class="sug" id="bba-cu-sug"></div><div class="hint">번호(예: 178)나 NCC 주소를 넣으면 등록된 주소는 기체 목록이 나오고, 처음 보는 주소는 점검할 때 카드를 전부 읽습니다.</div><div id="bba-cu-sites"></div></div>' +
              '<div class="sec"><div class="t"><i>2</i>무엇을 점검할까요<small>카드 유무는 기본</small></div><div class="ck" id="bba-cu-ck"></div></div>' +
            '</div><div class="rt" id="bba-cu-res"></div></div>' +
            '<div class="ft"><span class="msg" id="bba-cu-msg"></span><button type="button" class="bba-btn" data-a="clear">주소 비우기</button><button type="button" class="bba-btn" data-a="defaults">항목 기본값</button><button type="button" class="bba-btn go" id="bba-cu-go" data-a="go">▶ 점검 시작</button></div>';
        bb.appendChild(cuBg); bb.appendChild(cuEl);
        function cuDrawSites() {
            const w = $('bba-cu-sites'); if (!w) return;
            w.innerHTML = cuCfg.sites.map(s => {
                const e = cuReg()[s.id];
                return '<div class="cs" data-id="' + s.id + '"><div class="ch"><span class="id">#' + s.id + '</span><span class="nm">' + esc(e ? (e.label || '등록된 주소') : '새 주소') + '</span><span class="tg ' + (e ? 'k' : 'n') + '">' + (e ? '등록됨' : '새 주소') + '</span><button type="button" class="x" data-a="rm" title="빼기">✕</button></div>' +
                    (e ? '<div class="cu">' + e.names.map(n => '<label title="' + esc(n) + '"><input type="checkbox" data-a="un" data-n="' + esc(n) + '"' + (s.off.includes(n) ? '' : ' checked') + '><span>' + esc(n) + '</span></label>').join('') + '</div>' : '<div class="cn">점검할 때 이 주소의 기체 카드를 모두 읽습니다</div>') + '</div>';
            }).join('');
            const sn = $('bba-cu-sn'); if (sn) sn.textContent = cuCfg.sites.length ? cuCfg.sites.length + '곳' : '';
        }
        function cuDrawChecks() {
            const w = $('bba-cu-ck'); if (!w) return;
            w.innerHTML = CU_CHECKS.map(c => '<label class="' + (cuCfg.chk[c[0]] ? 'on' : '') + '"><input type="checkbox" data-k="' + c[0] + '"' + (cuCfg.chk[c[0]] ? ' checked' : '') + '><span><b>' + c[1] + ' ' + c[2] + '</b><small>' + c[3] + '</small></span></label>').join('');
        }
        function cuDrawSug() {
            const w = $('bba-cu-sug'), inp = $('bba-cu-in'); if (!w || !inp) return;
            const q = inp.value.trim(), id = cuParse(q), list = q && !id ? cuSearch(q) : (id && cuReg()[id] ? [cuReg()[id]] : []);
            w.innerHTML = list.map(e => '<button type="button" data-a="sug" data-id="' + e.id + '"><b>#' + e.id + '</b><span>' + esc(e.label || e.names[0]) + ' · ' + e.names.length + '대</span></button>').join('') +
                (q && !list.length && !id ? '<div class="hint">등록된 이름이 아니에요 — 번호나 NCC 주소로 넣어 주세요</div>' : '');
        }
        function cuDrawRes() {
            const w = $('bba-cu-res'); if (!w) return;
            const r = cuRes;
            if (!r || (!r.sites.length && !r.busy)) { w.innerHTML = '<div class="empty">아직 점검 결과가 없습니다<br>왼쪽에서 주소와 항목을 고르고 <b>점검 시작</b>을 눌러 주세요</div>'; return; }
            const k = r.chk || cuCfg.chk;
            let total = 0, bad = 0, ins = 0;
            r.sites.forEach(s => { total += s.cards.length; s.cards.forEach(c => { if (cuBad(c, k)) bad++; }); if (k.ins) ins += s.miss.length; });
            let h = '<div class="sm"><div class="k"><b>' + total + '</b><span>읽은 기체</span></div><div class="k' + (bad ? ' bad' : '') + '"><b>' + bad + '</b><span>이상</span></div>' + (k.ins ? '<div class="k' + (ins ? ' ins' : '') + '"><b>' + ins + '</b><span>입고 추정</span></div>' : '') +
                '<label><input type="checkbox" data-a="onlybad"' + (cuOnlyBad ? ' checked' : '') + '>이상만 보기</label></div>';
            r.sites.forEach(s => {
                const rows = s.cards.filter(c => !cuOnlyBad || cuBad(c, k)), nb = s.cards.filter(c => cuBad(c, k)).length;
                h += '<div class="rs"><div class="sh"><span class="id">#' + s.id + '</span><span>' + esc(s.label || (s.known ? '' : '새 주소')) + '</span><span class="ct">' + s.cards.length + '대' + (nb ? ' · 이상 ' + nb : '') + (k.ins && s.miss.length ? ' · 입고 ' + s.miss.length : '') + '</span></div>';
                if (s.err) h += '<div class="er">' + esc({ timeout: '시간 초과 — 카드를 읽지 못했습니다', login: '로그인이 필요합니다', xorigin: '접근할 수 없는 화면입니다', noread: '화면을 읽지 못했습니다' }[s.err] || s.err) + '</div>';
                else if (!s.cards.length && !(k.ins && s.miss.length)) h += '<div class="er" style="color:var(--mu)">기체 카드가 없습니다</div>';
                rows.forEach(c => { h += '<div class="rr' + (cuBad(c, k) ? ' bad' : '') + '"><span class="n" title="' + esc(c.n) + '">' + esc(c.n) + '</span><span class="cp">' + cuChips(c, k) + '</span></div>'; });
                if (k.ins) s.miss.forEach(n => { h += '<div class="rr ins"><span class="n" title="' + esc(n) + '">' + esc(n) + '</span><span class="cp"><span class="c mid">📦 입고 추정 · 카드 없음</span></span></div>'; });
                h += '</div>';
            });
            if (r.busy) h += '<div class="empty" style="padding:14px">점검 중… ' + cuProg.i + '/' + cuProg.n + ' · ' + esc(cuProg.cur) + '</div>';
            w.innerHTML = h;
        }
        function cuDrawStatus() {
            const st = $('bba-cu-st'), go = $('bba-cu-go'), msg = $('bba-cu-msg');
            if (st) { st.className = 'st' + (cuBusy ? ' run' : ''); st.textContent = cuBusy ? '🔍 점검 중 ' + cuProg.i + '/' + cuProg.n + ' · ' + cuProg.cur : cuRes && cuRes.at ? (cuRes.stopped ? '중단됨 ' : '마지막 점검 ') + cuFmt(cuRes.at) : ''; }
            if (go) { go.textContent = cuBusy ? '■ 중단' : '▶ 점검 시작'; go.classList.toggle('stop', cuBusy); }
            if (msg) msg.textContent = cuMsg;
        }
        function cuDraw() { if (!cuIsOpen) return; cuDrawRes(); cuDrawStatus(); }
        function cuDrawAll() { cuDrawSites(); cuDrawChecks(); cuDrawSug(); cuDraw(); }
        function cuDrawBtn() {
            const b = $('bba-cu-open'); if (!b) return;
            b.textContent = cuBusy ? '🧪 커스텀 점검 · ' + cuProg.i + '/' + cuProg.n : '🧪 커스텀 점검'; b.classList.toggle('run', cuBusy);
        }
        function cuOpen(on) {
            cuIsOpen = on; cuEl.classList.toggle('open', on); cuBg.classList.toggle('open', on);
            if (on) { cuMsg = ''; cuDrawAll(); setTimeout(() => { const i = $('bba-cu-in'); if (i) i.focus(); }, 30); }
        }
        const cuOpenBtn = $('bba-cu-open'); if (cuOpenBtn) cuOpenBtn.addEventListener('click', () => cuOpen(!cuIsOpen));
        cuBg.addEventListener('mousedown', () => cuOpen(false));
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && cuIsOpen && !(e.target && e.target.id === 'bba-cu-in' && e.target.value)) cuOpen(false); });
        cuEl.addEventListener('click', e => {
            const b = e.target.closest && e.target.closest('[data-a]'); if (!b || b.tagName === 'INPUT') return;
            const a = b.dataset.a;
            if (a === 'close') return cuOpen(false);
            if (a === 'add') {
                const inp = $('bba-cu-in'), q = inp.value.trim(), id = cuParse(q) || ((cuSearch(q)[0] || {}).id || 0);
                if (!q) { cuMsg = ''; return cuDraw(); }
                if (!id) { cuMsg = '번호나 NCC 주소로 넣어 주세요 (이름은 등록된 기체만 찾을 수 있어요)'; return cuDraw(); }
                cuAddSite(id); inp.value = ''; cuMsg = ''; return cuDrawAll();
            }
            if (a === 'sug') { cuAddSite(+b.dataset.id); const inp = $('bba-cu-in'); inp.value = ''; cuMsg = ''; return cuDrawAll(); }
            if (a === 'rm') { const id = +b.closest('.cs').dataset.id; cuCfg.sites = cuCfg.sites.filter(x => x.id !== id); cuSaveCfg(); return cuDrawSites(); }
            if (a === 'clear') { cuCfg.sites = []; cuSaveCfg(); cuMsg = ''; return cuDrawAll(); }
            if (a === 'defaults') { cuCfg.chk = Object.assign({}, CU_DEF); cuSaveCfg(); return cuDrawChecks(); }
            if (a === 'go') { if (cuBusy) cuStop(); else { cuMsg = ''; cuRun(); } }
        });
        cuEl.addEventListener('change', e => {
            const t = e.target;
            if (t.dataset.k) { cuCfg.chk[t.dataset.k] = t.checked ? 1 : 0; cuSaveCfg(); const l = t.closest('label'); if (l) l.classList.toggle('on', t.checked); return; }
            if (t.dataset.a === 'un') { const id = +t.closest('.cs').dataset.id, s = cuCfg.sites.find(x => x.id === id), n = t.dataset.n; if (!s) return; s.off = s.off.filter(x => x !== n); if (!t.checked) s.off.push(n); cuSaveCfg(); return; }
            if (t.dataset.a === 'onlybad') { cuOnlyBad = t.checked; cuDrawRes(); }
        });
        cuEl.addEventListener('input', e => { if (e.target.id === 'bba-cu-in') cuDrawSug(); });
        cuEl.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'bba-cu-in') { e.preventDefault(); const b = cuEl.querySelector('[data-a="add"]'); if (b) b.click(); } });
        cuDrawBtn();

        // ───────── 다중 · 서브 모니터링 / 부산 국립과학관 시간대별 근무자 ─────────
        const mmp = document.createElement('div'); mmp.id = 'bba-mmp'; root.appendChild(mmp);
        function sciCovers(t, relH) {   // 과학관 업무가 이 시(hour, 업무일 기준 분)에 걸치는가
            const a = rel(t.s), len = t.e > t.s ? t.e - t.s : t.e < t.s ? t.e + 1440 - t.s : 0;
            return len ? (a < relH + 60 && a + len > relH) : (a >= relH && a < relH + 60);
        }
        function drawMmp() {
            if (!mmp.classList.contains('open')) return;
            const dow = workDay().getDay(), curH = new Date().getHours(), now = nowMin();
            const nmChip = n => n ? '<span class="nm' + (/없음/.test(n) ? ' none' : '') + '" style="--h:' + hue(n) + '">' + esc(n) + '</span>' : '<span class="em">-</span>';
            let g = '<div class="mg"><div class="hd">시간</div><div class="hd mc">다중 모니터링</div><div class="hd sc">서브 모니터링</div><div class="gap hd" style="background:var(--bg);border:none"></div><div class="hd">🏛 부산 국립과학관</div>';
            for (let i = 0; i < 24; i++) {
                const hh = (WD0 / 60 + i) % 24, relH = i * 60, cur = hh === curH, cls = (cur ? ' cur' : '') + (i * 60 + 59 < rel(now) ? ' past' : '');
                const r = monRows.find(x => Math.floor(x.s / 60) === hh);
                const sc = sciTasks.filter(t => (!t.days || t.days.includes(dow)) && sciCovers(t, relH));
                g += '<div class="tm' + cls + '"' + (cur ? ' id="bba-mm-cur"' : '') + '>' + pad(hh) + ':00</div>' +
                    '<div class="' + cls.trim() + '">' + nmChip(r && r.u) + '</div><div class="' + cls.trim() + '">' + nmChip(r && r.sub) + '</div><div class="gap"></div>' +
                    '<div class="' + cls.trim() + '">' + (sc.length ? '<div class="sci" title="' + esc(sc.map(t => pad(Math.floor(t.s / 60)) + ':' + pad(t.s % 60) + (t.e !== t.s ? '~' + pad(Math.floor(t.e / 60)) + ':' + pad(t.e % 60) : '') + ' ' + t.body).join(' / ')) + '">' + [...new Set(sc.map(t => t.u))].map(nmChip).join('') + '</div>' : '<span class="em">-</span>') + '</div>';
            }
            const keep = (mmp.querySelector('.mb') || {}).scrollTop;
            mmp.innerHTML = '<div class="mh"><b>👥 다중/과학관 시간대별 근무자</b><span class="sp">' + esc(srcMsg || '') + (monRows.length || sciTasks.length ? '' : ' · 데이터 없음') + '</span><button class="mx" title="닫기">✕</button></div><div class="mb">' + g + '</div></div>';
            const mb = mmp.querySelector('.mb');
            if (keep == null) { const c = $('bba-mm-cur'); if (c) mb.scrollTop = Math.max(0, c.offsetTop - 70); } else mb.scrollTop = keep;
            mmp.querySelector('.mx').addEventListener('click', () => { mmp.classList.remove('open'); $('bba-mmb').classList.remove('on'); });
        }
        function closeMmp() { mmp.classList.remove('open'); $('bba-mmb').classList.remove('on'); }
        // ───────── 일일 업무 배정표: '새 수식(시뮬레이터)'을 적용했을 때의 배정 결과 (dailytaskssim.html 의 로직 이식) ─────────
        //  · 입력 = 지금 받아온 daily_tasks.json (다중/서브 · 업무 목록) → 규칙(가중치 2.0 이하, 다중 포함 3개 이하, 부산 하루 1회, 시간·휴게·다중 겹침 금지 등)에 맞게 다시 배정한 결과만 보여준다.
        //  · 시뮬레이션일 뿐 — 일일 업무표(실제 배정자)는 JSON 이 바뀌기 전까지 절대 바뀌지 않는다.
        //  · JSON 내용이 바뀐 것을 받는 즉시(07시 갱신 등) 한 번 계산해 결과(시드)를 고정 → 열 때마다 같은 결과. '다시 뽑기'로만 바뀜.
        const SIM = (function () {
        const STAFF_DATA=[["김지훈", "07:00~16:00", "WWWOOWWOOAWWWWOOWWWWWOOWWWWWOOO"], ["오정훈", "07:00~16:00", "OWWHOOWWHAAOOWWWWOOWWWWWOOOWWWO"], ["호덕진", "07:00~16:00", "WOOWWOOWWWWWOOWWAOWWWWWOOOOWWWW"], ["이기완", "07:00~16:00", "WOOWWOOOWWWWWOOAWWWWWOOWWWWWOOW"], ["김경환", "08:00~17:00", "OWWOOWWWWWOOWWWWOOWWWWWOOWOOWWW"], ["박효선", "08:00~17:00", "WOOWWWWWOOWWWWOOWWWWWOOOOWWWWWO"], ["최윤혁", "09:00~18:00", "WWOAAOWWWOAAOWWWWWOOOWWWWOOWWOO"], ["신현철", "09:00~18:00", "WOOWWHWWOOWWOOWWWWWOWWOOHWWOOAW"], ["이민수", "09:00~18:00", "WWWOOWWOOWWWWOOWWWOWWWAOOWWWWOO"], ["김한석", "09:00~18:00", "WWOOAWWWWWOOWWWWOOOWWWWWOOWWWOO"], ["이지윤", "09:00~18:00", "OOWhhhhOOOWWWWOOWWWWOOWWWWWOOWW"], ["김미소", "09:00~18:00", "WWOOWWWWWOOWOWWWWWOOOWWWWOOWWWO"], ["이규은", "09:00~18:00", "OOWWWWWOOOWWWWWOOWWWWWOOWWWWWOO"], ["유재헌", "09:00~18:00", "OOWWWWWOOWWOWWOOWWWWWOOWWWWOOWW"], ["조천호", "09:00~18:00", "WWOOWWWWOOOWWWWWOOWWWWOOWWWOOWW"], ["이수성", "09:00~18:00", "OOWWWWOOWWWWWOOWWWWWOWWWOOWWOOW"], ["백진홍", "09:00~18:00", "WWOOOWWWWWOWOWWWWWOOWWWOWOOOWWW"], ["임미선", "09:00~18:00", "OWWOOOOOWWWWWOWWWWWOOWWWOWWWWWO"], ["이현경", "09:00~18:00", "WWOOOWWWWOOWWOOWWWWWOOWWWWWOOWW"], ["석승찬", "10:00~19:00", "WHOWWWOWWOOHWWWWOOOWWWWOOOOWWWW"], ["이준", "10:00~19:00", "WWWWOOWOWWWWOWOOWWOWWOOWWWWWOOW"], ["한승완", "10:00~19:00", "OWWWWOOWWWOWWOWWWWWOOWWWOWWWOOO"], ["김동진", "11:00~20:00", "WWWWOOOWWWOOWWWWOOAAWWWOOOOWWWW"], ["송주현", "11:00~20:00", "WAOOWWOOWWWOOWWWWWOOOWWWWOOWWWW"], ["송태영", "11:00~20:00", "WWWOOWWHWWOOOWWWOOWWOOWWAOWWWWO"], ["신은정", "11:00~20:00", "WOOWWWWOOWWWWWOOWWWOOWWOOWWOWWW"], ["장재원", "11:00~20:00", "OWWWOOWWWOOWWWWWOOWWWOOWWWWWOOW"], ["박효빈", "14:00~23:00", "OOWWWOOWWWOOOWWWWOOWWWWOOWWWWWW"], ["권재윤", "14:00~23:00", "WWOOWWWWOOWWWWOOWWWWOOWWWOOWWWO"], ["김가은", "15:00~24:00", "WWWOOOWWWWOOWWWWOOWWWWOOWWWOOWW"], ["서형민", "15:00~24:00", "WWWWOOWWWOOWWWWWOOWWOOWWWWWOOOW"], ["김도형", "15:00~24:00", "OWWWWWOOWWWWWOOWWWWOOWWOOOWWWWO"], ["최성환", "15:00~24:00", "OOWWOOOOOWWOOOOOWWOOOOOWWOOOOOW"], ["이규순", "18:00~03:00", "WWOOWWWWWOWWOOWWOOOWWWWWOOAWWOA"], ["강철환", "18:00~03:00", "OOWWHWWOOWWWWWOOWWWWWOOOWWWOOWW"], ["박은선", "19:00~04:00", "WWOOWWWOOWWWOOOWWWOOOWWWWOAWWWW"], ["박계원", "19:00~04:00", "OOWWWOAWWWWOAOWWWWOOWWWOOWWWOOW"], ["최정기", "20:00~05:00", "OOWWOWWWWOOOWWWWOOWWWWWOOOWWWWW"], ["최선호", "20:00~05:00", "WWOWWWOOWWWWWWOOWWWWOOOWWWOOWWO"], ["김소연", "22:00~07:00", "WWWOOWWWWWOOOWWOOWWWWOOWWWOOWWW"], ["임다연", "22:00~07:00", "WWWWWOOWWWOOWWWWWOOWWWWWOOWWOOO"], ["임아연", "22:00~07:00", "WWOOOWWWOOWWWWWOOWWWWWOOWWWWWOO"], ["안대관", "23:30~08:30", "OOWWWWWOOWWWWOOWWWWOOOWWWWWOOWW"]];
        const DOW_KO = ['일', '월', '화', '수', '목', '금', '토'];
        const dowOf = d => (4 + d - 1) % 7;            // 2026-10-01 = 목
        const ov = (a, b, c, d) => a < d && c < b;
        const tmin = s => { const m = String(s).match(/(\d{1,2}):(\d{2})/); return +m[1] * 60 + +m[2]; };
        const fmt = m => { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
        const GAP = 15;
        const BREAK = { 420: [650, 710], 480: [710, 770], 540: [770, 830], 600: [830, 890], 660: [890, 950], 840: [1010, 1070], 900: [1010, 1070], 1080: [1310, 1370], 1140: [1310, 1370], 1200: [1310, 1370], 1320: [1490, 1550], 1410: [1550, 1610] };   // 휴게는 :50 ~ :50 (예: 09~18시 근무 → 12:50~13:50)
        let STAFF = [], BYNAME = {}, RSRC = 'none';   // 근무자 목록 — 월별 근무표 파일(schedule_for_mobile_YYYY-MM.json)에서 받아 채움. 못 받으면 아래 내장 10월 표로 대체
        function mkStaff(list) {
          STAFF = list.map(([name, time, sc]) => {
            const a = tmin(time.split('~')[0]); let b = tmin(time.split('~')[1]); if (b <= a) b += 1440;
            return { name, time, start: a, end: b, brk: BREAK[a] || null, g: a <= 540 ? 0 : a <= 660 ? 1 : a < 1080 ? 2 : 3, sc };
          });
          BYNAME = Object.fromEntries(STAFF.map(p => [p.name, p]));
        }
        /* 월별 근무표 JSON → [이름, 'HH:MM~HH:MM', 날짜별 문자열(W 출근 · H 반차 · A 연차 · O 휴무/빈칸)]. 근무시간이 비었거나 읽을 수 없으면 내장 표의 시간으로 보충, 그것도 없으면(관리자·신입 등) 제외 */
        const ADMINS = ['김용욱', '차현모', '안혜림', '박수연', '신지섭'];   // 관리자 — 근무표 파일에는 있지만 일일 업무 배정에서는 제외 (관리자가 바뀌면 여기만 고치면 됨)
        function parseSchedule(js, y, m) {
          if (!js || !Array.isArray(js.staff)) throw new Error('근무표 형식이 아님');
          const emb = Object.fromEntries(STAFF_DATA.map(r => [r[0], r[1]])), nd = new Date(y, m, 0).getDate(), out = [];
          js.staff.forEach(x => {
            if (!x || !x.name || /^신입/.test(x.name) || ADMINS.includes(x.name)) return;   // 관리자·신입은 업무 배정 대상이 아님
            const mm = String(x.workTime || '').replace(/;/g, ':').match(/(\d{1,2}):(\d{2})\s*~\s*(\d{1,2}):(\d{2})/);
            const time = mm ? mm[1].padStart(2, '0') + ':' + mm[2] + '~' + mm[3].padStart(2, '0') + ':' + mm[4] : (emb[x.name] || '');
            if (!time) return;
            let sc = ''; for (let d = 1; d <= nd; d++) { const st = x.schedule && x.schedule[m + '/' + d] ? x.schedule[m + '/' + d].status : ''; sc += st === 'work' ? 'W' : (st === 'half' || st === 'half-half') ? 'H' : st === 'annual' ? 'A' : 'O'; }
            out.push([x.name, time, sc]);
          });
          if (out.length < 10) throw new Error('근무표에서 읽은 사람이 너무 적음');
          return out;
        }
        mkStaff(STAFF_DATA); RSRC = 'embedded';
        const GROUPS = ['07·08·09시 출근', '10·11시 출근', '14·15시 출근', '18시 이후 출근'];
        let MONTH_OK = false;   // 10월(근무표가 있는 달)일 때만 근무표(sc)로 출근자를 추림 — 그 외 달은 JSON 에 나온 이름으로 대체
        const present = d => MONTH_OK ? STAFF.filter(p => p.sc[d - 1] === 'W') : [];
        function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
        const SUB_STRICT = 1080;   // 18:00 이후 슬롯의 서브는 일일 업무와 겹치면 안 됨 (그 전은 겹쳐도 무방)
        const mkTask = (t, bold, fixed, i) => {
          const m = t.match(/^\[(\d{1,2}:\d{2})(?:~(\d{1,2}:\d{2}))?\]/); const s = tmin(m[1]), e = m[2] ? tmin(m[2]) : s + 10;
          const z = t.replace(/\s/g, ''); let days = 'all';
          if (z.includes('[평일]')) days = 'wd'; else if (z.includes('[주말]')) days = 'we'; else if (z.includes('화,수,목,금,토,일')) days = 'nm';
          const sci = t.includes('부산국립과학관'), nh = t.includes('대기장소2 주간기체 출근');
          let w = 0;
          if (sci) w = 1; else if (t.includes('무선충전') && t.includes('재시작') && s === 600) w = 0.5; else if (t.includes('송도요기요')) w = 0.5; else if (nh) w = 0.5;
          return { i, t, bold: !!bold, fixed: fixed || '', s, e, days, slot: Math.floor(s / 60) * 60, sci, hub: t.includes('HUB B 출근'), nh, nt: /\[삼평동,\s*서현동\]\s*기체 출근 체크/.test(t), w };
        };
        const TASKS = [];
        function rowState(t, d, holiday) {
          if (t.fixed) return 'fixed';
          const w = dowOf(d), we = holiday || w === 0 || w === 6;
          const on = t.days === 'all' || (t.days === 'wd' && !we) || (t.days === 'we' && we) || (t.days === 'nm' && w !== 1);
          return on ? 'on' : 'off';
        }
        function buildUnits(d, bundled, holiday, TL) {
          TL = TL || TASKS;
          const st = TL.map(t => TL === TASKS ? rowState(t, d, holiday) : (t.fixed ? 'fixed' : 'on')), U = [], skip = new Set();
          TL.forEach((t, i) => {
            if (st[i] !== 'on' || skip.has(i)) return;
            if (t.hub) {
              if (!bundled) return;
              const j = TL.findIndex(x => x.sci && x.s === 540);
              if (j >= 0 && st[j] === 'on') { skip.add(j); U.push({ rows: [i, j], s: 530, e: 600, slot: 540, w: 1, cnt: 1, sci: true, label: '부산 08:50 + 09:00 묶음' }); return; }
            }
            if (bundled && t.nh) {
              const j = TL.findIndex(x => x.nt);
              if (j >= 0 && st[j] === 'on') { skip.add(j); U.push({ rows: [i, j], s: 600, e: 660, slot: 600, w: 0.5, cnt: 2, sci: false, label: '성남 삼평동 10:00 + 10:30 묶음' }); return; }
            }
            U.push({ rows: [i], s: t.s, e: t.e, slot: t.slot, w: t.w, cnt: 1, sci: t.sci, label: t.t });
          });
          return U;
        }
        /* 시간대 경향(강제 아님): 값이 클수록 후순위 */
        function tendency(p, u, mid, late) {
          const s = u.s, g = p.g;
          if (s < 660) return 0;
          if (s < 960) return mid * [1, 0, 0.5, 0.5][g];
          if (s < 1080) return late * (g === 3 ? 1 : 0);
          if (s < 1320) return late * [0.3, 0, 0, 1][g];
          return late * (g === 2 ? 0 : 0.5);
        }
        const orderFor = s => s < 720 ? [0, 1, 2, 3] : s < 1020 ? [1, 0, 2, 3] : [2, 1, 0, 3];
        const DEFAULTS = { gp: 0.1, cw: 0.4, cap: 3, holiday: false, sciPen: 1, grace: 1, tMid: 0.15, tLate: 0.3 };
        const RELAX_TXT = ['', '가중치 2.0 상한을 풀어 배정', '다중 포함 개수 상한까지 풀어 배정', '다중과 연속 금지까지 풀어 배정'];
        /* [규칙] 07~16시 근무자 중 07·08·09시 다중이 없는 사람은 '부산 08:50 HUB B 출근 + 09~10시 과학관' 을 우선 맡는다 (안 그러면 09~18시 근무자가 받기 쉬움) */
        const isHubU = u => /HUB B 출근|부산 08:50/.test(u.label || '');
        const earlyFree = s => !!(s && s.p && s.p.start === 420 && s.p.end === 960 && ![420, 480, 540].some(H => s.mons.includes(H)));
        /* [선호] 07~16시·08~17시 근무자는 퇴근 1시간 전(15~16시 · 16~17시)의 과학관 1시간 업무를 가급적 피함 */
        const lastHrSci = (p, u) => !!(u.sci && p && (p.start === 420 || p.start === 480) && p.end === u.slot + 60);
        /* [선호] 14-23·15-24 근무자('오후조'): 오후→야간으로 갈수록 업무를 더 맡고, 20:30 이후 업무는 가능하면 먼저 맡는다 (18시 이후 출근하는 야간조는 다중 월간 개수가 많아 일일 업무라도 덜 배정). 강제는 아님 */
        const isPm = p => !!p && (p.start === 840 || p.start === 900);
        const EVE_FROM0 = 20 * 60 + 30;   // (기본값) 20:30 요기요 영업종료 — 실제로는 아래 eveFromOf 로 그날의 '마지막 4건'이 시작되는 시각을 씀
        const eveFromOf = (UU, fixedOf) => { const L = UU.filter(u => u.s >= 1080 && !fixedOf(u)).map(u => u.s).sort((a, b) => a - b); return L.length ? L[Math.max(0, L.length - 4)] : EVE_FROM0; };   // 하루의 마지막 4건 업무가 시작되는 시각 (평일 20:30 · 주말 18:40 수원 힐스테이트 푸르지오 OFF)
        const pmRamp = (s, ef) => s <= 900 ? 0 : Math.min(1, (s - 900) / Math.max(60, ef - 900));   // 15:00 = 0 → 마지막 4건 시작 시각 = 1 (직선으로 상승)
        const firstHrSci = (p, u) => !!(u.sci && isPm(p) && p.start === u.slot);   // 출근하자마자(14시·15시) 맡는 과학관 — 가급적 자제
        const canPm = (p, u) => isPm(p) && p.start <= u.s && p.end >= u.e && !(p.brk && ov(u.s, u.e, p.brk[0], p.brk[1]));
        function assign(variant, d, M, rng, optIn) {
          const opt = Object.assign({}, DEFAULTS, optIn || {});
          const LV = opt.live || null, ex = new Set(LV ? LV.exclude || [] : []);
          const people = LV ? LV.people.filter(p => !ex.has(p.name)) : present(d), mons = LV ? LV.main : (M.main[d] || {}), subs = LV ? LV.sub : (M.sub[d] || {}), S = {};
          people.forEach(p => { const Hs = Object.entries(mons).filter(([h, n]) => n === p.name).map(([h]) => +h); const sb = Object.entries(subs).filter(([h, n]) => n === p.name).map(([h]) => +h); S[p.name] = { p, mons: Hs, subAll: sb, subs: sb.filter(H => H >= SUB_STRICT), W: Hs.length, Ct: 0, tasks: [], sciT: [], sci: false, slots: new Set(), rows: 0 }; });
          const base = variant === 'base', lite = variant === 'lite', cm = variant === 'cnt', nv = variant === 'new' || variant === 'newF' || variant === 'newL' || variant === 'newH', U0 = buildUnits(d, nv || cm, opt.holiday, LV ? LV.tasks : null).map(u => nv && opt.grace && u.rows.length === 1 && /무선충전/.test(u.label) && /재시작/.test(u.label) && u.s === 600 ? { ...u, e: 630 } : u), U = variant === 'newH' ? [...U0.filter(u => u.sci).map(u => ({ ...u, restrict: true })), ...U0.filter(u => !u.sci)] : variant === 'newF' ? [...U0.filter(u => u.sci), ...U0.filter(u => !u.sci)] : variant === 'newL' ? [...U0.filter(u => !u.sci), ...U0.filter(u => u.sci)] : (variant === 'new' ? [...U0.filter(isHubU), ...U0.filter(u => u.sci && !isHubU(u)), ...U0.filter(u => !u.sci && !isHubU(u))] : U0), out = [];
          const eveF = eveFromOf(U, u => !!(LV && LV.tasks && LV.tasks[u.rows[0]] && LV.tasks[u.rows[0]].fixed));
          const UU = opt.names ? (opt.evalOnly ? U : [...U.filter(u => opt.keep.has(u.rows[0])), ...U.filter(u => !opt.keep.has(u.rows[0]))]) : U;
          for (const u of UU) {
            let chosen = null, tierUsed = null;
            const pre = opt.names && (opt.evalOnly || opt.keep.has(u.rows[0])) ? (opt.names[u.rows[0]] || null) : undefined;
            if (pre !== undefined) {
              if (pre && S[pre]) { chosen = S[pre].p; tierUsed = 0; }
              else { out.push({ u, name: pre, tier: 0, absent: !!pre }); continue; }
            } else if (base) {
              let c = people.filter(p => {
                const s = S[p.name];
                if (!(p.start <= u.slot && u.slot + 60 <= p.end)) return false;
                if (p.brk && ov(u.s, u.e, p.brk[0], p.brk[1])) return false;
                if (s.slots.has(u.slot)) return false;
                if (s.mons.some(H => H === u.slot)) return false;
                if (u.sci && s.mons.some(H => H === u.slot + 60)) return false;
                if (s.rows >= 3) return false;
                if (u.sci && s.sci) return false;
                return true;
              });
              if (u.sci) { const c2 = c.filter(p => !S[p.name].mons.some(H => H === u.slot - 60)); if (c2.length) c = c2; }
              if (c.length) { chosen = c[Math.floor(rng() * c.length)]; tierUsed = 0; }
            } else if (lite) {
              const edge = /^\s*\[\d{1,2}:5\d|~\d{1,2}:00\]/.test(u.label);
              for (let tier = 0; tier < 4; tier++) {
                let c = people.filter(p => {
                  const s = S[p.name];
                  if (!(p.start <= u.slot && u.slot + 60 <= p.end)) return false;
                  if (p.brk && ov(u.s, u.e, p.brk[0], p.brk[1])) return false;
                  if (u.sci && s.sci) return false;
                  if (tier < 3) {
                    if (s.slots.has(u.slot)) return false;
                    if (s.mons.some(H => H === u.slot)) return false;
                    if (u.sci && s.mons.some(H => H === u.slot + 60)) return false;
                    if (edge && s.mons.some(H => H === u.slot + 60)) return false;
                  }
                  if (tier < 1 && s.W + Math.max(u.w, 1e-6) > 2 + 1e-9) return false;
                  if (tier < 2 && s.mons.length + s.Ct + 1 > opt.cap) return false;
                  return true;
                });
                if (!c.length) continue;
                if (u.sci) { const c2 = c.filter(p => !S[p.name].mons.some(H => H === u.slot - 60)); if (c2.length) c = c2; }
                const sc = p => S[p.name].W + 0.4 * S[p.name].Ct;
                const m = Math.min(...c.map(sc)), pool = c.filter(p => sc(p) < m + 1e-9);
                chosen = pool[Math.floor(rng() * pool.length)]; tierUsed = Math.min(tier, 3); break;
              }
            } else {
              for (let tier = 0; tier < (u.restrict ? 1 : 4); tier++) {
                let c = people.filter(p => {
                  const s = S[p.name];
                  if (u.restrict && s.mons.length > 0) return false;
                  if (!(p.start <= u.slot && u.slot + 60 <= p.end)) return false;
                  if (p.brk && ov(u.s, u.e, p.brk[0], p.brk[1])) return false;
                  if (s.mons.some(H => ov(H - 10, H + 50, u.s, u.e))) return false;
                  if (s.subs.some(H => ov(H - 10, H + 50, u.s, u.e))) return false;
                  if (s.tasks.some(([a, b]) => ov(a, b, u.s, u.e))) return false;
                  if (tier < 3 && (u.sci ? s.tasks : s.sciT).some(([a, b]) => ov(a, b, u.s - 10, u.e + 10))) return false;   // 과학관은 정각 교대 — 앞뒤로 다른 업무가 바로 붙으면 안 됨
                  if (u.sci && s.sci) return false;
                  if (tier < 3 && u.sci && s.mons.some(H => ov(H - 10, H + 50 + GAP, u.s - GAP, u.e + GAP))) return false;
                  if (tier < 1 && !cm && s.W + Math.max(u.w, 1e-6) > 2 + 1e-9) return false;
                  if (tier < 2 && s.mons.length + s.Ct + u.cnt > opt.cap) return false;
                  return true;
                });
                if (!c.length) continue;
                if (nv && u.s >= eveF) { const pc = c.filter(isPm); if (pc.length) c = pc; }   // 20:30 이후 업무는 배정 가능하면 14-23·15-24 근무자가 먼저 — 못 맡는 업무만 기존 방식
                if (nv && isHubU(u)) { const pc = c.filter(p => earlyFree(S[p.name])); if (pc.length) c = pc; }   // 07~16시 근무자 중 07·08·09시 다중이 없는 사람 우선
                if (nv && u.sci) { const pc = c.filter(p => !S[p.name].mons.length); if (pc.length) c = pc; }   // 과학관은 다중이 없는 사람에게 먼저 — 그 사람들로 안 되는 시간대(휴게·근무시간·1일 1회)만 다중 있는 사람에게
                const od = orderFor(u.s);
                const pen = p => {
                  const s = S[p.name]; if (u.sci) return 0;
                  return (s.mons.some(H => ov(H - 10, H + 50, u.s - GAP, u.e + GAP)) || s.tasks.some(([a, b]) => ov(a, b, u.s - GAP, u.e + GAP))) ? 1 : 0;
                };
                const sc = p => (cm ? S[p.name].mons.length + 0.5 * S[p.name].Ct : S[p.name].W + opt.cw * S[p.name].Ct) + opt.gp * od.indexOf(p.g) + 0.25 * pen(p) + (lastHrSci(p, u) ? 0.8 : 0) + (firstHrSci(p, u) ? 0.8 : 0) - (nv && !cm && isPm(p) ? PM_RAMP_A * pmRamp(u.s, eveF) : 0) + (!cm && opt.sciPen && u.sci && S[p.name].mons.length > 0 ? opt.sciPen : 0) + (!cm && (opt.tMid || opt.tLate) ? tendency(p, u, opt.tMid || 0, opt.tLate || 0) : 0);
                const m = Math.min(...c.map(sc)), pool = c.filter(p => sc(p) < m + 1e-9);
                chosen = pool[Math.floor(rng() * pool.length)]; tierUsed = tier; break;
              }
            }
            if (!chosen && u.restrict) { U.push({ ...u, restrict: false }); continue; }
            if (!chosen) { out.push({ u, name: null, tier: 9 }); continue; }
            const s = S[chosen.name];
            s.W += u.w; s.Ct += u.cnt; s.rows += 1; s.tasks.push([u.s, u.e]); if (u.sci) s.sciT.push([u.s, u.e]); s.slots.add(u.slot); s.sci = s.sci || u.sci;
            out.push({ u, name: chosen.name, tier: tierUsed });
          }
          if (opt.names) out.sort((a, b) => a.u.rows[0] - b.u.rows[0]);
          return { S, out, U };
        }

        function evaluate(S, out, rowNames) {
          const flags = {}, run = {}, core = {};
          const m = { flagged: 0, n4: 0, overW: 0, wRule: 0, timeConflict: 0, none: 0, other: 0, zero: 0, std: 0, nUnits: out.length };
          for (const n in S) run[n] = { W: S[n].mons.length, C: S[n].mons.length, tasks: [], sciT: [], sci: false };
          out.forEach((o, i) => {
            if (!o.name) { flags[i] = ['후보 없음 (근무·휴게·다중 시간이 모두 겹침)']; core[i] = 1; m.none++; return; }
            if (o.absent) { flags[i] = ['오늘 근무표에 없는 사람(또는 제외 지정)']; core[i] = 1; m.other++; return; }
            const r = run[o.name], s = S[o.name], u = o.u, why = [];
            const ucnt = rowNames && u.rows.length > 1 ? Math.min(u.cnt, u.rows.filter(rr => rowNames[rr] === rowNames[u.rows[0]]).length) : u.cnt;   // 묶음의 둘째 줄을 다른 사람이 맡고 있으면 그 줄은 첫 줄 담당자의 건수에 넣지 않음 (둘째 줄 불일치는 따로 표시)
            if (r.W + Math.max(u.w, 1e-6) > 2 + 1e-9) { why.push('가중치 2.0을 넘겨 배정'); m.wRule++; }
            if (r.C + ucnt > 3) why.push('다중 포함 ' + (r.C + ucnt) + '건째 배정 (다중 ' + s.mons.length + ' + 앞선 업무 ' + (r.C - s.mons.length) + ' + 이번 ' + (ucnt > 1 ? ucnt + '줄 묶음' : '1건') + ' · 서브는 제외)');
            if (s.mons.some(H => ov(H - 10, H + 50, u.s, u.e))) { why.push('다중 교대 시간과 겹침'); m.timeConflict++; }
            else if (u.sci && s.mons.some(H => ov(H - 10, H + 50 + GAP, u.s - GAP, u.e + GAP))) { why.push('다중과 연달아 배정 (부산)'); m.timeConflict++; }
            if (s.subs.some(H => ov(H - 10, H + 50, u.s, u.e))) { why.push('18시 이후 서브 시간과 겹침'); m.timeConflict++; }
            if (!(s.p.start <= u.slot && u.slot + 60 <= s.p.end)) { why.push('근무시간 밖 (' + fmt(s.p.start) + '~' + fmt(s.p.end) + ' 근무)'); m.other++; }
            if (s.p.brk && ov(u.s, u.e, s.p.brk[0], s.p.brk[1])) { why.push('휴게시간과 겹침'); m.other++; }
            if (r.tasks.some(t => ov(t[0], t[1], u.s, u.e))) { why.push('본인 다른 업무와 겹침'); m.other++; }
            if (u.sci && r.sci) { why.push('부산 하루 2회'); m.other++; }
            if ((u.sci ? r.tasks : r.sciT).some(t => ov(t[0], t[1], u.s - 10, u.e + 10))) { why.push('과학관(정각 교대)과 다른 업무가 바로 붙음'); m.timeConflict++; }
            if (isHubU(u) && !earlyFree(s) && Object.values(S).some(x => earlyFree(x) && x.mons.length + Math.max(u.w, 1e-6) <= 2 + 1e-9 && x.mons.length + u.cnt <= 3 && !x.mons.some(H => ov(H - 10, H + 50 + GAP, u.s - GAP, u.e + GAP)))) { why.push('07~16시 근무자 중 07·08·09시 다중이 없는 사람이 있는데 부산 08:50을 다른 사람이 받음'); m.other++; }
            r.W += u.w; r.C += ucnt; r.tasks.push([u.s, u.e]); if (u.sci) r.sciT.push([u.s, u.e]); r.sci = r.sci || u.sci;
            if (why.length) { flags[i] = why; if (why.some(x => !x.startsWith('가중치'))) core[i] = 1; }
          });
          // 이미 가중치 2.0(다중+과학관 등)인 사람이 가중치 0짜리 일반 업무까지 받으면 위반 — 순서와 상관없이 최종 합계로 판단
          const zr = {}; out.forEach((o, i) => { if (o.name && !o.absent && !(o.u.w > 0)) (zr[o.name] = zr[o.name] || []).push(i); });
          for (const n in zr) { const r = run[n]; if (r && r.W >= 2 - 1e-9 && r.W <= 2 + 1e-9) zr[n].forEach(i => { (flags[i] = flags[i] || []).push('가중치 2.0(다중+과학관 등)인 사람에게 일반 업무까지 배정'); m.wRule++; }); }
          m.flagged = Object.keys(flags).length;
          const loads = [];
          for (const n in S) {
            const r = run[n]; if (r.C > 3) m.n4++; if (r.W > 2 + 1e-9) m.overW++; if (r.C === 0) m.zero++;
            loads.push(r.W + 0.4 * (r.C - S[n].mons.length));
          }
          const mean = loads.reduce((a, b) => a + b, 0) / (loads.length || 1);
          m.std = Math.sqrt(loads.reduce((a, b) => a + (b - mean) ** 2, 0) / (loads.length || 1));
          m.clean = m.flagged === 0 ? 1 : 0; m.cleanCore = Object.keys(core).length === 0 ? 1 : 0;
          return { m, flags, run };
        }

        const hmin = s => { const m = String(s).match(/(\d{1,2}):(\d{2})/); if (!m) return null; let v = +m[1] * 60 + +m[2]; if (v < 420) v += 1440; return v; };
        const fmtM = m => { m = m % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
        const isFixedName = n => !n || n === '관리자' || n === '-' || /휴무/.test(n);
        const ADMIN_ONLY_RE = /\[송도\]\s*뉴비\s*대기장소\s*설정/;   // 관리자 전용 업무 — 시트가 07시에 일반 직원 이름을 넣어 두어도 배정 대상에서 빼고 '고정 (관리자)'로 둔다
        function liveParse(arr) {
          if (!Array.isArray(arr)) throw new Error('JSON이 목록(배열) 형태가 아닙니다');
          const warn = [], main = {}, sub = {}, TL = [], rowUser = [];
          arr.forEach(x => {
            if (!x || typeof x !== 'object') return;
            if (x.type === 'monitoring') {
              const t = hmin(x.rawTime); if (t == null) { warn.push('다중 시각을 읽지 못함: ' + x.rawTime); return; }
              main[t] = x.user; if (x.subUser && x.subUser !== '후보 없음') sub[t] = x.subUser; else if (x.subUser) warn.push(fmtM(t) + ' 서브: 시트에서 \'후보 없음\' 으로 나옴');
            } else if (x.type === 'task' && x.content) {
              const t = String(x.content).replace(/ /g, ' ');
              if (!/^\s*\[\d{1,2}:\d{2}/.test(t)) { warn.push('시각 없는 업무 제외: ' + t.slice(0, 30)); return; }
              const i = TL.length; const adm = ADMIN_ONLY_RE.test(t); TL.push(mkTask(t, 0, (adm || (isFixedName(x.user) && x.user !== '후보 없음') || (x.user && x.user !== '후보 없음' && !BYNAME[x.user])) ? '관리자' : '', i)); rowUser.push(adm ? '관리자' : x.user === '후보 없음' ? '' : (x.user || ''));
            }
          });
          if (!Object.keys(main).length) warn.push('다중 모니터링 항목이 없음');
          if (!TL.length) warn.push('업무 항목이 없음');
          return { main, sub, TL, rowUser, warn };
        }

        const SCI_PRIO_W = 30;   // 다중 없는 사람에게 과학관 우선배정 — 어기면 칸당 30점: 균형 항목(수~수십)보다 크고, 가중치 2.0 초과(100)·다중 포함 4건 이상(40)·규칙 위반(1000)보다는 작음 = 상한을 지키는 범위 안에서 최대한 우선
        /* 다중 없는 사람이 맡을 수 있는 과학관 칸의 최대 개수(근무시간·휴게시간 안, 한 사람 하루 1칸) = 이분 매칭 → 나머지 칸은 다중 보유자가 받을 수밖에 없는 하한 */
        function sciFloor(ctx, d) {
          if (ctx._sciFloor !== undefined) return ctx._sciFloor;
          const monSet = new Set(Object.values(ctx.main)), U = buildUnits(d, true, false, ctx.tasks).filter(u => u.sci && !ctx.tasks[u.rows[0]].fixed), P = ctx.people.filter(p => !monSet.has(p.name));
          const can = (p, u) => p.start <= u.s && p.end >= u.e && !(p.brk && ov(u.s, u.e, p.brk[0], p.brk[1])), owner = {};
          const aug = (ui, seen) => { for (let pi = 0; pi < P.length; pi++) { if (seen[pi] || !can(P[pi], U[ui])) continue; seen[pi] = true; if (owner[pi] === undefined || aug(owner[pi], seen)) { owner[pi] = ui; return true; } } return false; };
          let match = 0; for (let ui = 0; ui < U.length; ui++) if (aug(ui, {})) match++;
          return (ctx._sciFloor = U.length - match);
        }
        const PM_RAMP_A = 0.5, PM_RAMP_W = 2, EVE_PM_W = 20;   // 오후조 시간 경사(배정 시 W 단위 0.5 · 점수 2점) / 20:30 이후 업무를 야간조가 맡으면 건당 20점 (균형 항목보다 크고 상한 위반 40·100·1000 보다는 작음)
        const EARLY_SCI09_BONUS = 6;   // 09:00 과학관을 07·08시 출근자가 맡으면 점수에서 이만큼 뺌(작은 선호) — 위반(1000)·균형(수~수십)보다 훨씬 작아 강제력은 없음
        const LIVE_LOCK_BEFORE = 9 * 60;   // 이 시각(분) 전에 시작하는 업무는 live 재배정에서 고정
        function liveCtx(P, d, excl) {
          const names = new Set();   // 후보 = 07시 JSON(다중·서브·업무 행)에 배정자로 들어 있는 사람 — 07시 배정이 출근자를 제대로 반영한다고 신뢰. 근무표 파일은 근무시간·휴게시간을 알려주는 용도(보험)
          const all = [...Object.values(P.main), ...Object.values(P.sub), ...P.rowUser.filter((n, i) => !P.TL[i].fixed)].filter(n => !isFixedName(n));
          all.forEach(n => { if (BYNAME[n]) names.add(n); });
          const unknown = [...new Set(all.filter(n => !BYNAME[n]))];
          const lock = new Set();   // 09시 이전에 시작하는 업무(출근 처리 등)는 관리자가 09시 전에 미리 준비해야 하므로 07시 배정 그대로 고정 — 09:00 정각 이후 업무만 수식으로 다시 배분
          P.TL.forEach((t, i) => { if (!t.fixed && t.s < LIVE_LOCK_BEFORE && P.rowUser[i]) lock.add(i); });
          return { people: STAFF.filter(p => names.has(p.name)), main: P.main, sub: P.sub, tasks: P.TL, exclude: excl || [], unknown, lock };
        }

        /* 행별 이름(배열) → 평가. 묶음 업무는 첫 줄 담당자 기준으로 채점하고, 둘째 줄이 다르면 '불일치'로 표시 */
        function liveEval(ctx, d, rowNames) {
          const U = buildUnits(d, true, false, ctx.tasks);
          const R = assign('new', d, null, mulberry(1), { live: ctx, names: rowNames, evalOnly: true });
          const ev = evaluate(R.S, R.out, rowNames);
          const bad = new Set(), why = {};
          R.out.forEach((o, i) => {
            const f = ev.flags[i]; if (!f) return;
            bad.add(o.u.rows[0]); why[o.u.rows[0]] = f;   // 가중치가 0인 업무라도, 이미 2.0(다중+과학관 등)인 사람에게 더 얹으면 위반
          });
          U.forEach(u => { if (u.rows.length > 1) { const lead = rowNames[u.rows[0]]; u.rows.slice(1).forEach(r => { if (rowNames[r] !== lead) { bad.add(r); why[r] = ['묶음 업무인데 첫 줄(' + (lead || '없음') + ')과 담당자가 다름']; } }); } });
          return { R, ev, bad, why, U };
        }

        function liveMetrics(ctx, d, rowNames) {
          const e = liveEval(ctx, d, rowNames);
          return { prob: e.bad.size, n4: e.ev.m.n4, overW: e.ev.m.overW, std: e.ev.m.std, bad: e.bad, why: e.why };
        }

        /* 묶음의 둘째 줄까지 첫 줄 담당자로 맞춘 행별 이름 만들기 */
        function namesFromOut(ctx, d, out, base) {
          const names = base.slice();
          out.forEach(o => { o.u.rows.forEach(r => { names[r] = o.name || null; }); });
          return names;
        }

        function liveRepair(ctx, d, A, seed) {
          const e = liveEval(ctx, d, A);
          const keep = new Set(e.U.filter(u => (!e.bad.has(u.rows[0]) || (ctx.lock && ctx.lock.has(u.rows[0]))) && A[u.rows[0]]).map(u => u.rows[0]));
          const R = assign('new', d, null, mulberry(seed | 0), { live: ctx, names: A, keep });
          return namesFromOut(ctx, d, R.out, A);
        }
        function liveFull(ctx, d, A, seed) {
          const lk = ctx.lock && ctx.lock.size ? ctx.lock : null;
          const R = lk ? assign('new', d, null, mulberry(seed | 0), { live: ctx, names: A, keep: lk }) : assign('new', d, null, mulberry(seed | 0), { live: ctx });
          return namesFromOut(ctx, d, R.out, A);
        }
        /* 사람별 업무 현황: 업무 건수(t) · 업무 가중치(own) · 다중 횟수(m) · 가중치 합(w, 다중 포함) · 가장 긴 연속(앞 업무 끝~다음 시작 30분 이내) */
        function liveStats(ctx, d, X) {
          const U = buildUnits(d, true, false, ctx.tasks), by = {}, mons = {};
          Object.values(ctx.main).forEach(n => { mons[n] = (mons[n] || 0) + 1; });
          U.forEach(u => { const n = X[u.rows[0]]; if (!n) return; const l = ctx.tasks[u.rows[u.rows.length - 1]]; const ec = u.rows.length > 1 ? Math.min(u.cnt, u.rows.filter(rr => X[rr] === n).length) : u.cnt; (by[n] = by[n] || []).push({ s: ctx.tasks[u.rows[0]].s, e: Math.max(l.e, l.s + 10), w: u.w, c: ec });
            u.rows.slice(1).forEach(rr => { const n2 = X[rr]; if (n2 && n2 !== n) { const t2 = ctx.tasks[rr]; (by[n2] = by[n2] || []).push({ s: t2.s, e: Math.max(t2.e, t2.s + 10), w: 0, c: 1 }); } }); });
          return ctx.people.map(p => {
            const l = (by[p.name] || []).sort((a, b) => a.s - b.s); let run = l.length ? 1 : 0, best = run;
            for (let i = 1; i < l.length; i++) { if (l[i].s - l[i - 1].e <= 30) { run++; best = Math.max(best, run); } else run = 1; }
            const own = l.reduce((a, b) => a + b.w, 0), t = l.reduce((a, b) => a + b.c, 0), m = mons[p.name] || 0;
            return { n: p.name, g: p.g, m, t, own, w: own + m, chain: best };
          });
        }
        /* 배정안 점수(작을수록 좋음): ① 규칙 위반·2.0 초과·다중 포함 4개 이상(가장 크게) ② 낮·저녁조 건수 편차 · 1건 이하 · 3건 이상 · 3건 연속 · 가중치 편차 · 야간조 업무 ③ 바뀐 칸 수(아주 약하게) */
        function liveScore(ctx, d, X, A) {
          const m = liveMetrics(ctx, d, X), per = liveStats(ctx, d, X), day = per.filter(p => p.g <= 2), cs = day.map(p => p.t + p.m);
          const mean = cs.reduce((a, b) => a + b, 0) / (cs.length || 1), sd = Math.sqrt(cs.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (cs.length || 1));
          const low = cs.filter(c => c <= 1).length, high = cs.filter(c => c >= 3).length, chains = per.filter(p => p.chain >= 3).length, night = per.filter(p => p.g === 3).reduce((a, p) => a + p.t, 0);
          const changes = X.filter((n, i) => (n || null) !== (A[i] || null)).length;
          const UU = buildUnits(d, true, false, ctx.tasks), monSet = new Set(Object.values(ctx.main)), lastHr = UU.filter(u => u.sci && lastHrSci(BYNAME[X[u.rows[0]]], u)).length, sciMon = UU.filter(u => u.sci && X[u.rows[0]] && monSet.has(X[u.rows[0]])).length;   // sciMon: 다중이 있는 사람이 받은 과학관 칸 수   // 퇴근 1시간 전 과학관(07~16·08~17시 근무자) 건수
          const sciMin = sciFloor(ctx, d), sciEx = Math.max(0, sciMon - sciMin);   // sciMin: 다중 없는 사람이 맡을 수 있는 만큼 다 맡았을 때 다중 보유자가 어쩔 수 없이 받아야 하는 과학관 칸 수 / sciEx: 그보다 더 받은 칸(= 우선배정을 어긴 칸)
          const early09 = UU.filter(u => u.sci && u.slot === 540 && X[u.rows[0]] && ((q) => !!q && (q.start === 420 || q.start === 480))(BYNAME[X[u.rows[0]]])).length;   // 09:00 과학관을 07·08시 출근자가 받은 칸 수 — 09시 출근자가 오기 전에 이미 준비되는 업무라 '가능하면' 먼저 출근한 사람이 맡도록 (강제 아님, 보너스 EARLY_SCI09_BONUS 점)
          const ef = eveFromOf(UU, u => !!ctx.tasks[u.rows[0]].fixed), eveU = UU.filter(u => u.s >= ef && !ctx.tasks[u.rows[0]].fixed), asg = u => BYNAME[X[u.rows[0]]];
          const eveFeas = eveU.filter(u => ctx.people.some(q => canPm(q, u))), eveNon = eveFeas.filter(u => asg(u) && !isPm(asg(u))).length, pmN = eveU.filter(u => isPm(asg(u))).length;   // 오후조가 맡을 수 있는데 야간조가 맡은 20:30 이후 업무 수
          const pmRampSum = UU.filter(u => u.s > 900 && u.s < ef && !ctx.tasks[u.rows[0]].fixed && isPm(asg(u))).reduce((a, u) => a + pmRamp(u.s, ef), 0), firstHr = UU.filter(u => firstHrSci(asg(u), u)).length;
          const score = m.prob * 1000 + m.overW * 100 + m.n4 * 40 + sd * 10 + low * 4 + high * 1.2 + chains * 3 + m.std * 5 + night * 2 + changes * 1 + lastHr * 5 + sciMon * 5 + sciEx * SCI_PRIO_W - early09 * EARLY_SCI09_BONUS + firstHr * 5 + eveNon * EVE_PM_W - pmRampSum * PM_RAMP_W;
          return { score, lastHr, firstHr, eveNon, eveN: eveU.length, pmN, pmRampSum, sciMon, sciMin, sciEx, early09, m, per, sd, mn: cs.length ? Math.min(...cs) : 0, mx: cs.length ? Math.max(...cs) : 0, nDay: cs.length, low, high, chains, night, maxW: Math.max(0, ...per.map(p => p.w)), changes };
        }
        /* 한 칸씩 담당자를 바꿔 보며 점수가 좋아지면 채택(언덕 오르기) — 바뀐 칸 수에도 점수를 매기므로 '꼭 필요한 수정'만 남는다 */
        function liveClimber(ctx, d, X0, A) {
          const U = buildUnits(d, true, false, ctx.tasks).filter(u => !ctx.tasks[u.rows[0]].fixed && !(ctx.lock && ctx.lock.has(u.rows[0])));
          let X = X0.slice(), cur = liveScore(ctx, d, X, A).score, ui = 0, idle = 0, evals = 0, done = !U.length, swap = false, si = 0, sj = 1;
          return {
            get X() { return X; }, get cur() { return cur; }, get done() { return done; }, get evals() { return evals; },
            step() {
              if (done) return;
              if (!swap) {   // 1) 한 칸의 담당자를 다른 사람으로
                const u = U[ui], old = X[u.rows[0]]; let bestY = null, bs = cur - 1e-9;
                for (const p of ctx.people) { if (p.name === old) continue; const Y = X.slice(); u.rows.forEach(r => { Y[r] = p.name; }); const s = liveScore(ctx, d, Y, A).score; evals++; if (s < bs) { bs = s; bestY = Y; } }
                if (bestY) { X = bestY; cur = bs; idle = 0; } else idle++;
                ui = (ui + 1) % U.length; if (idle >= U.length) { swap = true; si = 0; sj = 1; }
              } else {       // 2) 더 안 풀리면 두 칸의 담당자를 서로 맞바꿈 — 개선되면 다시 1)로
                if (sj >= U.length) { si++; sj = si + 1; } if (si >= U.length - 1) { done = true; return; }
                const a = U[si], b = U[sj++], na = X[a.rows[0]], nb = X[b.rows[0]]; if (na === nb) return;
                const Y = X.slice(); a.rows.forEach(r => { Y[r] = nb; }); b.rows.forEach(r => { Y[r] = na; }); const s = liveScore(ctx, d, Y, A).score; evals++;
                if (s < cur - 1e-9) { X = Y; cur = s; swap = false; idle = 0; ui = 0; }
              }
            }
          };
        }
            return {
                liveParse, liveCtx, liveMetrics, liveRepair, liveFull, liveScore, liveClimber, buildUnits, fmt,
                setMonth: v => { MONTH_OK = !!v; if (!v) { RSRC = 'none'; } },
                setRoster: list => { mkStaff(list); MONTH_OK = true; RSRC = 'file'; },
                useEmbedded: () => { mkStaff(STAFF_DATA); MONTH_OK = true; RSRC = 'embedded'; },
                parseSchedule, rosterSrc: () => RSRC,
            };
        })();
        // 계산 결과는 '스냅샷'(계산에 쓴 JSON 원문 + 시드 + 방식 + 업무일)으로 저장해 두고 그대로 보여준다 → 이후 JSON 이 바뀌어도 배정표가 저절로 달라지지 않음
        const SIMCFG_KEY = 'bba_sim_snap';
        let simRes = null, simErr = '', simBusy = false;
        const simCfg = () => { try { return JSON.parse(lsGet(SIMCFG_KEY, 'null')) || null; } catch (e) { return null; } };
        const simSave = c => lsSet(SIMCFG_KEY, JSON.stringify(c));
        // ── 근무표(월별 JSON) ── 재배정하기를 누를 때 해당 월 파일을 받아 저장해 두고, 이후 계산은 저장본을 씀. 11월부터는 같은 위치에 schedule_for_mobile_2026-11.json 만 올리면 됨
        const SIM_SCH_BASE = 'https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/monthly_schedule/schedule_for_mobile_', SIM_RK = 'bba_sim_roster_';
        const simRKey = wd => SIM_RK + wd.getFullYear() + '-' + String(wd.getMonth() + 1).padStart(2, '0');
        function simRoster(wd) {
          let list = null; try { list = JSON.parse(lsGet(simRKey(wd), 'null')); } catch (e) { list = null; }
          if (Array.isArray(list) && list.length >= 10) SIM.setRoster(list);
          else SIM.useEmbedded();   // 파일을 못 받았으면 내장 표(10월분)의 근무시간으로 — 근무표에 없는 사람은 배정 후보에서 빠지고 그 칸은 그대로 둠
        }
        async function simFetchRoster() {
          const wd = workDay(), y = wd.getFullYear(), m = wd.getMonth() + 1;
          try {
            const ac = new AbortController(), tm = setTimeout(() => ac.abort(), 8000);
            const res = await fetch(SIM_SCH_BASE + y + '-' + String(m).padStart(2, '0') + '.json?t=' + Date.now(), { cache: 'no-store', signal: ac.signal }); clearTimeout(tm);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            lsSet(simRKey(wd), JSON.stringify(SIM.parseSchedule(JSON.parse(await res.text()), y, m)));
          } catch (e) { console.warn('[BBA] 근무표 받기 실패 — 저장본/내장 표로 계산:', e && e.message); }
        }
        function simCompute(snap) {
            const arr = JSON.parse(snap.txt), wd = workDay();
            simRoster(wd);   // 근무표: 받아 둔 월별 파일 → 없으면 내장 10월 표 → 그것도 없으면 JSON 에 나온 이름으로 대체
            const d = wd.getDate(), P = SIM.liveParse(arr), ctx = SIM.liveCtx(P, d, []), A = P.rowUser.map(n => n || null);   // 다중/서브는 07시에 이미 정해진 값 그대로(건드리지 않음), 일일 업무 칸만 다시 배정
            const B = Array.isArray(snap.X) && snap.X.length === A.length ? snap.X.slice() : SIM.liveFull(ctx, d, A, snap.seed);   // 저장된 최적안(담당자 목록) 그대로 — 옛 저장본은 시드로 다시 만든다
            const follow = new Set(); SIM.buildUnits(d, true, false, ctx.tasks).forEach(u => { if (u.rows.length > 1) follow.add(u.rows[1]); });
            return { P, d, ctx, A, B, mA: SIM.liveMetrics(ctx, d, A), mB: SIM.liveMetrics(ctx, d, B), sA: SIM.liveScore(ctx, d, A, A), sB: SIM.liveScore(ctx, d, B, A), follow, cfg: snap, wd };
        }
        function simRun(snap) { try { simRes = simCompute(snap); simErr = ''; } catch (e) { simRes = null; simErr = (e && e.message) || String(e); console.warn('[BBA] 일일 업무 배정표 계산 실패:', simErr); } }
        /* 최적안 찾기: 1초씩 5번(총 5초) 동안 시드를 바꿔 가며 수천 가지 배정을 만들어 보고, 점수(규칙 위반 → 2.0 초과 → 고른 정도)가 가장 좋은 안을 확정 */
        let simSearching = false, simProg = '';
        const SIM_ROUNDS = 5, SIM_ROUND_MS = 1000;
        async function simSearch(txt, mode) {
            const arr = JSON.parse(txt), wd = workDay();
            simRoster(wd);   // 근무표: 받아 둔 월별 파일 → 없으면 내장 10월 표 → 그것도 없으면 JSON 에 나온 이름으로 대체
            const d = wd.getDate(), P = SIM.liveParse(arr), ctx = SIM.liveCtx(P, d, []), A = P.rowUser.map(n => n || null), t0 = performance.now(), total = SIM_ROUNDS * SIM_ROUND_MS;
            const pool = []; let tries = 0;
            const prog = () => { simProg = '최적안 찾는 중 ' + Math.min(SIM_ROUNDS, Math.floor((performance.now() - t0) / SIM_ROUND_MS) + 1) + '/' + SIM_ROUNDS + ' · ' + tries + '가지 확인'; simDraw(); };
            // 1단계(앞 40%): 규칙에 맞는 안을 무작위로 많이 만들어 점수 좋은 후보 몇 개를 추림 — 현재 배정을 최대한 살리는 '부분 수정' 안과 '전체 다시 배정' 안을 섞어서
            while (performance.now() - t0 < total * 0.4 || !pool.length) {
                const sl = performance.now(), slice = document.hidden ? 700 : 40;
                do {
                    const seed = 1 + Math.floor(Math.random() * 1e9), kind = tries % 2, B = kind ? SIM.liveFull(ctx, d, A, seed) : SIM.liveRepair(ctx, d, A, seed), sc = SIM.liveScore(ctx, d, B, A).score, key = B.join('|');
                    tries++; if (!pool.some(x => x.key === key)) { pool.push({ B, key, kind, score: sc }); pool.sort((a, b) => a.score - b.score); [0, 1].forEach(k => { let n = 0; for (let i = 0; i < pool.length; i++) if (pool[i].kind === k && ++n > (k ? 1 : 2)) pool.splice(i--, 1); }); }   // 부분 수정 안 2개 + 전체 재배정 안 1개를 따로 보관 (점수만 보면 전체 재배정 안이 먼저 차지함)
                } while (performance.now() - sl < slice && performance.now() - t0 < total * 0.4);
                prog(); await new Promise(r => setTimeout(r, 0));
            }
            // 2단계: 후보마다 한 칸씩 바꿔 보며 더 좋아지면 채택 (남은 시간 동안)
            const cl = pool.map(x => SIM.liveClimber(ctx, d, x.B, A));
            while (performance.now() - t0 < total && cl.some(c => !c.done)) {
                const sl = performance.now(), slice = document.hidden ? 700 : 40;
                do { cl.forEach(c => { if (!c.done) { const e0 = c.evals; c.step(); tries += c.evals - e0; } }); } while (performance.now() - sl < slice && performance.now() - t0 < total && cl.some(c => !c.done));
                prog(); await new Promise(r => setTimeout(r, 0));
            }
            let best = { X: pool[0].B, score: pool[0].score };
            cl.forEach(c => { if (c.cur < best.score) best = { X: c.X, score: c.cur }; });
            return { X: best.X, seed: 0, tries, score: best.score };
        }
        async function simDo(txt, mode) {   // 현재 JSON 으로 새로 재배정 (최적안 찾기 후 확정)
            if (simSearching) return; simSearching = true; simBusy = true; simProg = '최적안 찾는 중 1/' + SIM_ROUNDS; simDraw();
            try {
                await simFetchRoster();
                const r = await simSearch(txt, 'full');
                const snap = { txt, X: r.X, seed: r.seed, mode: 'best', at: Date.now(), day: curKey, tries: r.tries, score: r.score };
                simSave(snap); simRun(snap);
            } catch (e) { simRes = null; simErr = (e && e.message) || String(e); console.warn('[BBA] 일일 업무 배정표 계산 실패:', simErr); }
            finally { simSearching = false; simBusy = false; simProg = ''; simDraw(); }
        }
        function simOnNewJson(txt) {   // 수동 방식: daily_tasks.json 을 받아도 자동 계산은 하지 않는다 — 저장된 결과를 다시 그리기만 함 (계산은 '재배정하기' 버튼에서만)
            try { const c = simCfg(); if (!simRes && c && c.day === curKey) simRun(c); simDraw(); } catch (e) { console.warn('[BBA] 일일 업무 배정표:', e && e.message); }
        }
        const simp = document.createElement('div'); simp.id = 'bba-sim'; root.appendChild(simp);
        const simNm = n => n ? '<span class="nm' + (/없음/.test(n) ? ' none' : '') + '" style="--h:' + hue(n) + '">' + esc(n) + '</span>' : '<span class="nm none">후보 없음</span>';
        const simRange = t => SIM.fmt(t.s) + (t.e - t.s > 10 ? '~' + SIM.fmt(t.e) : '');
        function simDraw() {
            if (!simp.classList.contains('open')) return;
            const txt = lsGet('bba_tasks_cache', ''), cfg = simCfg();
            if (cfg && !simRes && cfg.day === curKey) simRun(cfg);
            const R = (cfg && cfg.day === curKey) ? simRes : null, keep = (simp.querySelector('.col.c2') || {}).scrollTop;
            const head = '<div class="mh"><b title="새 수식으로 계산한 시뮬레이션입니다 — 실제 업무표는 바뀌지 않습니다">📋 일일 업무 배정표</b><span class="sp">' +
                '<button class="bba-btn cp" data-a="cp" title="아래 \'새 수식 배정자\' 결과를 시트 행 순서 그대로 한 열(줄바꿈으로 구분)로 복사합니다 — 시트의 배정자 칸에 값만 붙여넣기">📋 배정자 1열 복사</button>' +
                '<button class="bba-btn on" data-a="re" title="지금의 daily_tasks.json 으로 일일 업무 배정을 다시 찾습니다 (다중/서브는 그대로)">' + (simBusy ? (simProg || '받아오는 중…') : '재배정하기') + '</button><button class="bba-btn" data-a="x">✕ 닫기</button></span></div>';
            if (!R) { simp.innerHTML = head + '<div class="meta">' + (simBusy ? (simProg || '최적안을 찾는 중입니다…') : (!cfg || cfg.day !== curKey) ? '아직 계산하지 않았습니다. <b>재배정하기</b>를 누르면 최신 daily_tasks.json 을 받아 최적안을 찾습니다.' : '계산하지 못했습니다: ' + esc(simErr || '알 수 없는 오류')) + '</div>'; return; }
            const { P, A, B, mA, mB, ctx, follow, d, wd } = R, at = new Date(cfg.at), dow = '일월화수목금토'[wd.getDay()], stale = hash(cfg.txt) !== hash(txt);
            const chg = P.TL.filter((t, i) => !t.fixed && (B[i] || null) !== (A[i] || null)).length;
            const sB = R.sB, warns = [];
            if (stale) warns.push('⚠ 지금의 daily_tasks.json 이 계산 때와 다릅니다 — 재배정하기를 누르세요');
            P.warn.filter(w => !/서브: 시트에서/.test(w)).forEach(w => warns.push(esc(w)));
            if (SIM.rosterSrc() !== 'file') warns.push('월별 근무표 파일을 받지 못해 내장 10월 표의 근무시간으로 계산'); if (ctx.unknown.length) warns.push('근무표에 없는 이름: ' + esc(ctx.unknown.join(', ')));
            const meta = '<div class="meta sum">' + (cfg.tries ? '✅ <b>최적안</b> (' + cfg.tries.toLocaleString() + '가지 중)' : '시뮬레이션') + ' · ' + pad(at.getHours()) + ':' + pad(at.getMinutes()) + ' 계산 · 바뀐 칸 <b>' + chg + '</b> · 규칙 문제 칸 ' + mA.prob + ' → <b>' + mB.prob + '</b><br>' +
                '가중치 2.0 ' + (sB.m.overW === 0 ? '모두 지킴(최대 ' + sB.maxW.toFixed(1) + ')' : '<span class="warn">' + sB.m.overW + '명 초과(최대 ' + sB.maxW.toFixed(1) + ')</span>') + ' · 업무+다중 ' + sB.mn + '~' + sB.mx + '건 (1건 이하 ' + sB.low + '명, 3건 이상 ' + sB.high + '명) · 연속 3건 ' + (sB.chains ? '<span class="warn">' + sB.chains + '명</span>' : '없음') +
                (sB.eveN ? '<br>🌆 20:30 이후 ' + sB.eveN + '건: 오후조(14-23·15-24) <b>' + sB.pmN + '</b>건' + (sB.eveNon ? ' <span class="warn">⚠ 오후조가 맡을 수 있는 ' + sB.eveNon + '건을 야간조가 맡음</span>' : ' ✔') : '') + (sB.firstHr ? '<br>⚠ 출근 직후 과학관 ' + sB.firstHr + '건 (오후조)' : '') +
                '<br>🔬 과학관 다중 無 우선: 다중 보유자 ' + R.sA.sciMon + ' → <b>' + sB.sciMon + '</b>칸 (최소 ' + sB.sciMin + '칸)' + (sB.sciEx ? ' <span class="warn">⚠ ' + sB.sciEx + '칸 더 줄일 수 있음</span>' : ' ✔') + (ctx.lock && ctx.lock.size ? '<br>🔒 09시 이전 업무 ' + ctx.lock.size + '건은 07시 배정 그대로 고정' : '') + (warns.length ? '<br><span class="warn">' + warns.join(' · ') + '</span>' : '') + '</div>';
            const mons = Object.keys(P.main).map(Number).sort((a, b) => a - b);
            const c1 = '<div class="col c1"><div class="gh"><span>시각</span><span>다중</span><span>서브</span></div>' + mons.map(t => '<div class="gr"><span class="tm">' + SIM.fmt(t) + '</span><span>' + simNm(P.main[t]) + '</span><span>' + (P.sub[t] ? simNm(P.sub[t]) : '<span class="em">–</span>') + '</span></div>').join('') + '</div>';
            const c2 = '<div class="col c2"><div class="gh"><span>시각</span><span>일일 업무</span><span>새 수식 배정자</span></div>' + (() => { const M = simMerge(R); return M && !M.bad ? M.items : P.TL.map((t, i) => ({ i, user: A[i] || '', content: t.t })); })().map(it => {   // 전체 행 파일이 있으면 휴무·관리자 행도 시트 순서 그대로 함께 표시
                const i = it.i, t = P.TL[i];
                if (i < 0) { const m = simNorm(it.content).match(/^\[([^\]]*)\]\s*(.*)$/); return '<div class="gr fx"><span class="tm">' + esc(m ? m[1] : '') + '</span><span class="tk" title="' + esc(it.content) + '">' + esc(m ? m[2] : it.content) + '</span><span class="em">고정 (' + esc(it.user || '비어 있음') + ')</span></div>'; }
                if (t.fixed) return '<div class="gr fx"><span class="tm">' + simRange(t) + '</span><span class="tk" title="' + esc(t.t) + '">' + esc(t.t.replace(/^\s*\[[^\]]*\]\s*/, '')) + '</span><span class="em">고정 (' + esc(A[i] || '관리자') + ')</span></div>';
                const ch = (B[i] || null) !== (A[i] || null), why = (mA.why[i] || []).join(' · ') || (follow.has(i) ? '첫 줄 담당자 변경에 맞춤' : '다른 칸 수정에 따른 재조정');
                return '<div class="gr' + (ch ? ' chg' : '') + '"><span class="tm">' + simRange(t) + '</span><span class="tk" title="' + esc(t.t) + '">' + (follow.has(i) ? '🔗 ' : '') + esc(t.t.replace(/^\s*\[[^\]]*\]\s*/, '')) + '</span><span class="asg">' + simNm(B[i]) + (ch ? '<span class="was" title="' + esc(why) + '">← 현재 ' + esc(A[i] || '후보 없음') + ' · ' + esc(why) + '</span>' : '') + '</span></div>';
            }).join('') + '</div>';
            const cpm = (simMsg ? '<div class="cpm">' + simMsg + '</div>' : '') + (simBox ? '<div class="cpm">자동 복사가 막혀 있어요. 아래 글자를 직접 복사(Ctrl+A → Ctrl+C)하세요.<textarea readonly rows="4">' + esc(simBox) + '</textarea></div>' : '');
            simp.innerHTML = head + meta + cpm + '<div class="sb">' + c1 + c2 + '</div><div class="foot">시트에 붙여넣기: 배정자 열의 첫 업무 행 클릭 → 값만 붙여넣기(Ctrl+Shift+V) · 파란 칸 = 바뀐 칸 · 🔗 = 묶음 업무</div>';
            const c2e = simp.querySelector('.col.c2'); if (c2e && keep) c2e.scrollTop = keep;
        }
        /* 시트에 값만 붙여넣기용 '배정자 1열' — 받아온 daily_tasks.json 의 일일 업무 행 순서 그대로(휴무·관리자 고정 행·시각 없는 행도 원래 값으로 자리 유지) 한 줄에 한 칸 */
        /* 시트의 일일 업무 행 전체(휴무·관리자·빈 담당자 행 포함, 시트 순서 그대로) — GAS 가 daily_tasks_full.json 에 따로 기록. daily_tasks.json 에는 이런 행이 빠져 있음 */
        const simNorm = s => String(s || '').replace(/\s+/g, ' ').trim(), SIM_EXCL = /배정\s*현황|휴무|다중관제|관리자|이름|담당자|보류/;
        function simFullData() { try { const f = JSON.parse(lsGet('bba_tasks_full', 'null')); return f && Array.isArray(f.rows) && f.rows.length && f.workday === curKey ? f : null; } catch (e) { return null; } }
        function simMerge(R) {   // → null(전체 행 파일 없음) | { items:[{i(JSON 업무 번호, 없으면 -1), user, content}], bad:'' | 불일치 사유 }
            const f = simFullData(); if (!f) return null;
            const q = {}; R.P.TL.forEach((t, i) => { (q[simNorm(t.t)] = q[simNorm(t.t)] || []).push(i); });
            const used = new Set(), items = []; let bad = '';
            f.rows.forEach(r => {
                const k = simNorm(r.content), u = String(r.user == null ? '' : r.user).trim(), a = r.fixed === true ? null : q[k], i = a && a.length ? a.shift() : -1;   // fixed=true(휴무·관리자 등)는 JSON 에 없는 행
                if (i >= 0) used.add(i); else if (r.fixed !== true && !(r.fixed === undefined && (!u || u.length < 2 || SIM_EXCL.test(u))) && !bad) bad = '전체 행 파일에는 담당자가 있는 행인데 daily_tasks.json 에는 없는 업무가 있습니다 (' + k.slice(0, 20) + '…)';
                items.push({ i, user: u, content: r.content });
            });
            if (!bad) { const miss = R.P.TL.findIndex((t, i) => !used.has(i)); if (miss >= 0) bad = 'daily_tasks.json 에는 있는데 전체 행 파일에는 없는 업무가 있습니다 (' + simNorm(R.P.TL[miss].t).slice(0, 20) + '…)'; }
            return { items, bad: bad ? bad + ' — 두 파일이 갱신된 시점이 달라서일 수 있어요. 1~2분 뒤 재배정하기를 다시 누르세요.' : '' };
        }
        function simColumn(R) {
            const M = simMerge(R); if (!M) throw new Error('NOFULL'); if (M.bad) throw new Error(M.bad);
            const names = M.items.map(it => (it.i >= 0 && !R.P.TL[it.i].fixed ? (R.B[it.i] || '후보 없음') : it.user).replace(/[\r\n\t]+/g, ' ').trim()), heads = M.items.map(it => simNorm(it.content));
            return { names, heads, text: names.join('\n') };   // 끝에 줄바꿈을 붙이지 않음(붙이면 시트에 빈 칸 한 줄이 더 덮어써짐)
        }
        async function simCopyText(text) {
            try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* 아래 대체 방법 */ }
            try { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return !!ok; } catch (e) { return false; }
        }
        let simMsg = '', simMsgT = 0, simBox = '';
        function simClose() { simp.classList.remove('open'); const b = $('bba-simb'); if (b) b.classList.remove('on'); }
        simp.addEventListener('click', e => {
            const b = e.target.closest('[data-a]'); if (!b) return;
            const a = b.dataset.a;
            if (a === 'x') return simClose();
            if (a === 'cp') {   // 배정자 1열 복사
                const show = m => { simMsg = m; clearTimeout(simMsgT); simMsgT = setTimeout(() => { simMsg = ''; simDraw(); }, 12000); simDraw(); };
                simBox = '';
                if (simBusy) return show('<span class="warn">최적안을 찾는 중입니다 — 끝난 뒤 복사하세요.</span>');
                const cfg = simCfg(), R = (cfg && cfg.day === curKey) ? simRes : null;
                if (!R) return show('<span class="warn">복사할 배정표가 없습니다 — 재배정하기를 먼저 누르세요.</span>');
                if (hash(cfg.txt) !== hash(lsGet('bba_tasks_cache', ''))) return show('<span class="warn">⚠ 지금의 daily_tasks.json 이 이 배정표와 달라 줄이 어긋날 수 있습니다. 재배정하기를 누른 뒤 복사하세요.</span>');
                let col; try { col = simColumn(R); } catch (e) { return show('<span class="warn">' + (e.message === 'NOFULL' ? '⚠ 휴무·관리자 행까지 담긴 daily_tasks_full.json 을 받지 못했습니다. daily_tasks.json 에는 그 행들이 빠져 있어서, 이 상태로 복사하면 시트와 줄이 밀립니다. (GAS 수정 후 다음 동기화가 끝나면 사용 가능)' : '복사 데이터를 만들지 못했습니다: ' + esc(e.message)) + '</span>'); }
                simCopyText(col.text).then(ok => {
                    if (!ok) simBox = col.text;
                    const cut = s => esc(s.length > 26 ? s.slice(0, 26) + '…' : s), L = col.names.length;
                    show((ok ? '✔ <b>' + L + '줄</b> 복사됨' : '복사 실패') + ' · 첫 줄 <b>' + esc(col.names[0] || '') + '</b> (' + cut(col.heads[0] || '') + ') · 끝 줄 <b>' + esc(col.names[L - 1] || '') + '</b> (' + cut(col.heads[L - 1] || '') + ') — 시트 첫 행·끝 행과 맞는지 확인하세요');
                });
                return;
            }
            if (a === 're') {   // 재배정하기: 최신 daily_tasks.json 을 받아(실패하면 저장본) 그 값으로 일일 업무 배정을 다시 돌림
                if (simBusy) return; simBusy = true; simProg = '최신 업무표 받는 중…'; simDraw();
                (async () => {
                    try { await loadTasks(); } catch (e) { /* 저장본 사용 */ }
                    try { const txt = lsGet('bba_tasks_cache', ''); if (txt) await simDo(txt); } finally { simBusy = false; simProg = ''; simDraw(); }
                })();
            }
        });
        $('bba-simb').addEventListener('click', () => {
            const o = !simp.classList.contains('open');
            if (o) { closeMmp(); open = []; applyOpen(); simp.classList.add('open'); simDraw(); } else simClose();
            $('bba-simb').classList.toggle('on', o);
        });
        setInterval(() => { if (simp.classList.contains('open')) simDraw(); }, 60 * 1000);

        // 다른 레이아웃 영역을 누르면 열려 있는 패널(배달 로그 · 개입 현황 · 이석 현황 · 근무자)을 닫는다
        document.getElementById('bb').addEventListener('click', e => {
            const t = e.target; if (!(t instanceof Element)) return;
            if (mmp.classList.contains('open') && !t.closest('#bba-mmp, #bba-mmb')) closeMmp();
            if (simp.classList.contains('open') && !t.closest('#bba-sim, #bba-simb')) simClose();
            if (!open.length || t.closest('#bba-dr, .bba-bar, #bba-ap, [id*="-pop"], [class*="-pop"], #bb-fbp')) return;
            // 업무표·다중 모니터링·오른쪽 영역은 어디를 눌러도 닫고, 그 밖(관제 센터 머리글 등)은 빈 영역을 눌렀을 때만 닫는다 (버튼·입력칸은 제외)
            if (t.closest('.bba-tasks, #bb-mm-page-multi, #bba-right, #bba-mmp, #bba-mmb') || !t.closest('button, a, input, select, textarea, label')) { open = []; applyOpen(); }
        }, true);
        $('bba-mmb').addEventListener('click', () => { if (!mmp.classList.contains('open')) simClose(); const o = mmp.classList.toggle('open'); $('bba-mmb').classList.toggle('on', o); if (o) { mmp.innerHTML = ''; drawMmp(); } });
        setInterval(drawMmp, 30 * 1000);

        // ───────── 시작 ─────────
        loadDay(); drawCamp();
        try { parseTasks(JSON.parse(lsGet('bba_tasks_cache', '[]'))); } catch (e) { tasks = []; }
        renderTasks(true);            // 저장본으로 먼저 그려 두고
        loadTasks();                  // 최신본을 받아 다시 그림
        setInterval(() => renderTasks(), 30 * 1000);       // 지연/현재 표시 + 07:00 초기화 감지
        setInterval(loadTasks, TASKS_REFRESH_MS);
        // 자동 점검: 15초마다 '시각이 된 업무가 있는가'만 로컬에서 확인 (평소엔 요청·iframe 없음). 켜자마자 밀린 업무가 있으면 시각 순서대로 한 사이트씩 점검
        setTimeout(autoTick, 4000);
        setInterval(autoTick, 15 * 1000);
        document.addEventListener('visibilitychange', () => { if (!document.hidden) autoTick(); });
        window.bbaAuto = {   // 콘솔 도구: bbaAuto.state() 점검 기록 · bbaAuto.run(업무 일부 글자) 지금 점검 · bbaAuto.reset() 오늘 점검 기록 지우기
            state: () => { reloadAuto(); return JSON.parse(JSON.stringify(auto)); },
            list: () => buildAll().map(x => ({ 시각: x.t.head, 업무: x.t.body, 점검: hmOf(x.due), 기체: x.e.u.map(u => u.n + ' ' + wTxt(u.w)).join(', '), 사용: x.e.on })),
            run: q => { const t = tasks.find(x => x.auto && (x.head + x.body).includes(q)); if (!t) return '일치하는 점검 업무 없음'; forced.add(t.id); autoTick(); return t.head + ' ' + t.body; },
            camp: c => { if (!CAMP_AUTO[c]) return '등록된 사이트 점검이 아님: ' + Object.keys(CAMP_AUTO).join(', '); campForce.add(c); autoTick(); return c + ' 지금 점검'; },
            campState: () => JSON.parse(JSON.stringify(campAuto)),
            reset: () => { try { localStorage.removeItem(autoKey()); } catch (e) { /* 무시 */ } reloadAuto(); renderTasks(); },
            probe: id => { const S = AUTO_SITES.find(x => x.id === +id); return S ? probeSite(S, S.units) : '등록된 사이트 번호가 아님'; },
        };
        console.log('[BBA] 관리자 확장 켜짐 (일일 업무표 · 펼침 그리드 · 캠핑장/HW/SW)');
    } catch (e) {
        console.warn('[BBA] 관리자 확장 초기화 실패 — 기존 보드 기능에는 영향 없음:', e && e.message);
    }
})();

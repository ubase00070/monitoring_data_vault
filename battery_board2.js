/* ============================================================
   battery_board.js v5.4 (방전 추정 · 저속충전 배터리 바 · 바깥 클릭 닫기 · 알림 카드 크기 통일)
   NCC 종합 모니터 — 템퍼몽키 inject
   ============================================================ */

(function () {
    'use strict';

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
            height:955px; max-height:100vh; overflow-y:auto; overflow-x:hidden;   /* 기본 크기 = 즐겨찾기 20대 + 안내 문구가 들어가는 높이 (955 = 104 + 20 + 774 + 51 + 6) */
            border:3px solid transparent; border-radius:16px;
            background-image: var(--bg-fill), linear-gradient(135deg, #6366f1, #ec4899);
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
            background-image: linear-gradient(var(--bg), var(--bg)), linear-gradient(135deg, rgba(99,102,241,.7), rgba(236,72,153,.7));
            background-origin: border-box; background-clip: padding-box, border-box;
            cursor:grab;
        }
        .bb-hd-title {
            font-size:22px; font-weight:900;
            background:linear-gradient(135deg, #6366f1, #ec4899);
            -webkit-background-clip:text; background-clip:text; color:transparent;
            text-shadow:0 0 10px rgba(99,102,241,.45), 0 0 14px rgba(236,72,153,.35);
            display:flex; align-items:center; gap:7px;
        }
        .bb-hd-time { display:flex; align-items:baseline; gap:8px; }
        .bb-clock { font-family:'Lato',monospace; font-size:13px; font-weight:900; color:var(--mu); letter-spacing:.8px; }
        .bb-ref   { font-size:12px; color:var(--mu); font-weight:700; }
        /* 헤더 우측 = [버튼 2줄] (동숲 주민은 제목 박스 좌우에 따로 배치) */
        .bb-hd-rightwrap {
            position:absolute; right:14px; top:50%; transform:translateY(-50%);
            display:flex; align-items:center; gap:10px; z-index:500;
        }
        .bb-hd-right { position:relative; display:flex; flex-direction:column; align-items:stretch; gap:6px; }
        .bb-hd-right-row { display:flex; align-items:center; gap:6px; }
        .bb-hd-right-row.spread { justify-content:space-between; }   /* 1줄: 테마 버튼(좌) ··· 정보/백업/복원/✕(우) */
        .bb-hd-grp { display:flex; align-items:center; gap:6px; }

        /* 제목 박스 바로 아래 작은 범례 (기체 카드 점 / 하단 동그라미 색 = 현재 상태) */
        .bb-legend {
            position:absolute; left:50%; bottom:-2px; transform:translateX(-50%);   /* 제목 박스 테두리와 겹치지 않게 살짝 아래 (헤더 아래 여백으로 2px 걸침) */
            display:flex; align-items:center; gap:9px; white-space:nowrap;
            font-size:10.5px; line-height:14px; color:var(--mu);
        }
        .bb-legend-item { display:inline-flex; align-items:center; gap:4px; }
        .bb-legend-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }

        /* UP: CYH 전용 — 제목 박스 안, "NCC" 글자 바로 밑(시계 왼쪽 빈 자리)에 아주 작게 (CYH 모드일 때만 보임) */
        .bb-up-mini {
            position:absolute; left:30px; bottom:8px; z-index:1;
            height:15px; padding:0 5px; border-radius:5px; border:1px solid var(--bd2);
            background:var(--sur2); color:var(--mu); font-size:10px; line-height:1; font-family:inherit;
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
        .bb-bk-title { font-size:13px; font-weight:900; color:var(--tx); margin-bottom:7px; white-space:nowrap; }
        .bb-bk-btns { display:flex; gap:6px; }
        .bb-bk-name { min-width:64px; }


        /* ── 고정 버튼 3종 (왼쪽 동숲 주민의 왼쪽): 3행 — [최근 방전 기체(24H)] / [저속충전 기체 TOP5] / [임무 OFF 기체] ── */
        .bb-fixbtns {
            position:absolute; right:calc(50% + 261px); top:50%; transform:translateY(-50%);   /* 오른쪽 끝 = 왼쪽 동숲 주민(제목 왼쪽 151~251px)에서 10px 왼쪽 */
            width:140px; display:grid; grid-template-columns:1fr; gap:4px; z-index:3;   /* 높이 3×26 + 2×4 = 86px (헤더 104px 안) */
        }
        .bb-fb {
            position:relative; height:26px; padding:0 7px; border-radius:7px; border:1.5px solid var(--bd2);
            background:var(--sur2); color:var(--tx); font-size:12px; font-weight:800; font-family:inherit;
            cursor:pointer; white-space:nowrap; box-sizing:border-box;
        }
        .bb-fb:hover { border-color:var(--mu); }
        .bb-fb.active { background:var(--bg); border-color:var(--tx); }
        .bb-fb-n {   /* 버튼 모서리에 겹쳐 뜨는 숫자 배지 (폭을 차지하지 않음, 0이면 숨김) */
            display:none; position:absolute; top:-7px; right:-5px; min-width:17px; height:17px; padding:0 4px;
            border-radius:9px; box-sizing:border-box; color:#fff; font-size:10px; font-weight:900; line-height:17px;
            text-align:center; box-shadow:0 1px 3px rgba(0,0,0,.3);
        }
        .bb-fb-n.on { display:block; }
        .bb-fb-n.r { background:#dc2626; }
        .bb-fb-n.o { background:#ea580c; }

        /* 고정 버튼 목록 창 (버튼 아래에 뜸, 열어 둔 채로 2분마다 자동 갱신) */
        .bb-fbp {
            display:none; position:absolute; left:0; top:calc(100% + 10px); width:480px; max-height:560px;
            flex-direction:column; z-index:600; background:var(--bg); border:2px solid var(--bd2);
            border-radius:10px; box-shadow:0 8px 24px rgba(0,0,0,.35); overflow:hidden;
        }
        .bb-fbp.open { display:flex; }
        .bb-fbp-hd { display:flex; align-items:center; gap:8px; padding:8px 10px 8px 14px; border-bottom:1px solid var(--bd); flex-shrink:0; }
        .bb-fbp-title { font-size:15px; font-weight:900; color:var(--tx); }
        .bb-fbp-cnt { flex:1; font-size:12px; font-weight:800; color:var(--mu); }
        .bb-fbp-x {
            width:30px; height:30px; border-radius:6px; flex-shrink:0; cursor:pointer;
            background:rgba(239,68,68,.15); border:1px solid rgba(239,68,68,.3); color:var(--rd); font-size:18px; font-weight:900;
            display:flex; align-items:center; justify-content:center;
        }
        .bb-fbp-x:hover { background:rgba(239,68,68,.3); }
        .bb-fbp-body { overflow-y:auto; padding:6px 8px 8px; min-height:0; }
        .bb-fbp-note { font-size:10.5px; line-height:1.45; color:var(--mu); padding:2px 6px 8px; }
        .bb-fbp-empty { padding:22px 8px; text-align:center; font-size:13px; font-weight:700; color:var(--mu); }
        .bb-fbp-foot { font-size:10.5px; line-height:1.45; color:var(--mu); padding:6px 6px 2px; }
        .bb-fbp-row {
            display:flex; align-items:center; gap:8px; padding:7px 10px; margin-bottom:5px; border-radius:8px;
            background:var(--sur); border:1.5px solid var(--bd); cursor:pointer; color:var(--tx);
        }
        .bb-fbp-row:hover { background:#f9a8d4; }
        .bb-fbp-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
        .bb-fbp-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
        .bb-fbp-line { display:flex; align-items:center; gap:6px; min-width:0; }
        .bb-fbp-name { font-size:13px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bb-fbp-tag { flex-shrink:0; font-size:10px; font-weight:900; padding:1px 7px; border-radius:9px; }
        .bb-fbp-tag.sure { background:#dc2626; color:#fff; }
        .bb-fbp-tag.est { background:rgba(234,88,12,.15); color:#c2410c; border:1px solid rgba(234,88,12,.5); padding:0 6px; }
        .bb-fbp-sub { font-size:11px; color:var(--mu); white-space:nowrap; }
        .bb-fbp-now { font-size:12px; font-weight:800; white-space:nowrap; flex-shrink:0; }
        .bb-fbp-row.sc { display:block; }
        .bb-sc-l1 { display:flex; align-items:center; gap:8px; }
        .bb-sc-l1 .bb-fbp-name { flex:1; min-width:0; }
        .bb-sc-bat { font-size:13px; font-weight:900; flex-shrink:0; }
        .bb-sc-l2 { display:flex; align-items:center; gap:10px; margin-top:6px; }
        .bb-sc-bar { position:relative; flex:1; min-width:0; height:12px; border-radius:6px; background:var(--sur2); border:1px solid var(--bd2); box-sizing:border-box; overflow:hidden; }
        .bb-sc-base { position:absolute; left:0; top:0; bottom:0; background:rgba(120,110,90,.32); }   /* 충전을 시작하기 전의 배터리 (회색) */
        .bb-sc-fill { position:absolute; top:0; bottom:0; }                                            /* 충전으로 채운 구간 (색: 더딜수록 붉게) */
        .bb-sc-fill.sev-r { background:#dc2626; } .bb-sc-fill.sev-o { background:#ea580c; } .bb-sc-fill.sev-g { background:#16a34a; }
        .bb-sc-rate, .bb-sc-eta { font-size:11px; color:var(--mu); white-space:nowrap; }
        .bb-sc-l3 { margin-top:4px; font-size:11px; color:var(--mu); }
        .bb-sc-l3 b { color:var(--tx); font-weight:800; }
        .bb-sc-eta { margin-left:auto; }

        /* 동숲 캐릭터 (헤더: 제목 박스 오른쪽) — 캐릭터 선택/저장은 예전 그대로, 캠핑장 배경만 제외 */
        #bb-walker-wrap {   /* 우측 주민: 제목 박스 오른쪽 (좌측 주민과 좌우 대칭, 제목 박스에서 10px 띄움) */
            position:absolute; left:calc(50% + 151px); top:50%; transform:translateY(-50%);
            width:100px; height:100px; z-index:2;
        }
        #bb-walker, #bb-walker-l {
            width:100%; height:100%;
            background-size:contain; background-repeat:no-repeat; background-position:center bottom;
            cursor:pointer; transition:transform .15s;
        }
        #bb-walker:active { transform:scale(0.92); }
        #bb-walker-l { cursor:default; }   /* 좌측 주민은 말풍선이 없어 클릭 동작 없음 */
        #bb-walker-wrap-l {   /* 좌측 주민: 제목 박스 왼쪽 (제목 박스 왼쪽 끝에서 10px 띄워 오른쪽 끝을 맞춤) */
            position:absolute; right:calc(50% + 151px); top:50%; transform:translateY(-50%);
            width:100px; height:100px; z-index:1;
        }
        .bb-walker-arrow {
            position:absolute; top:50%; transform:translateY(-50%);
            width:22px; height:22px; border-radius:50%;
            background:rgba(20,20,22,.55); border:1px solid rgba(255,255,255,.2);
            color:#fff; font-size:15px; font-weight:900; line-height:1; padding:0;
            display:flex; align-items:center; justify-content:center;
            cursor:pointer; z-index:2;
            opacity:0; transition:opacity .15s, background .15s;
        }
        #bb-walker-wrap:hover .bb-walker-arrow, #bb-walker-wrap:hover #bb-walker-toggle,
        #bb-walker-wrap-l:hover .bb-walker-arrow, #bb-walker-wrap-l:hover #bb-walker-l-toggle { opacity:1; }
        .bb-walker-arrow.left  { left:0; }
        .bb-walker-arrow.right { right:0; }
        .bb-walker-arrow:hover { background:rgba(20,20,22,.85); }
        .bb-walker-arrow:active { transform:translateY(-50%) scale(0.9); }
        #bb-walker-toggle, #bb-walker-l-toggle {
            position:absolute; top:0; right:0; min-width:34px; height:20px; padding:0 6px;
            border-radius:6px; background:var(--sur2); border:1px solid var(--bd2);
            color:var(--tx); font-size:11px; font-weight:900; cursor:pointer;
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
            font-size:15px; color:#5c4a2a; font-weight:700; line-height:1.4;
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
            background:var(--sur2); color:var(--tx); font-size:14px;
            font-family:inherit; font-weight:700; cursor:pointer; white-space:nowrap;
            display:inline-flex; align-items:center; justify-content:center; box-sizing:border-box;
        }
        .bb-btn:hover { border-color:var(--mu); }
        #bb-theme-btn, #bb-lighttheme-btn { min-width:38px; padding:0 8px; font-size:16px; }   /* 이모지만 표시 */
        .bb-btn.rm {
            border-color:rgba(239,68,68,.3); color:var(--rd); background:rgba(239,68,68,.15);
            min-width:76px; text-align:center;   /* ← 이 두 개 추가 */
        }
        .bb-btn.rm:hover { background:rgba(239,68,68,.25); }
        .bb-xbtn {
            width:32px; height:32px; border-radius:6px;
            background:rgba(239,68,68,.15); border:1px solid rgba(239,68,68,.3);
            color:var(--rd); font-size:13px; cursor:pointer;
            display:flex; align-items:center; justify-content:center; font-weight:900;
        }
        .bb-xbtn:hover { background:rgba(239,68,68,.3); }
        .zoom-btn {
            padding:3px 8px; border-radius:5px; border:1px solid var(--bd2);
            background:var(--sur2); color:var(--tx); font-size:12px;
            font-weight:900; cursor:pointer; line-height:1.5; font-family:inherit;
        }
        .zoom-label { font-size:14px; color:var(--tx); font-weight:700; min-width:34px; text-align:center; }

        /* ── 알림 영역 (헤더 좌측) + 검색 ── */
        .bb-alert-zone {   /* 이 영역 안에서만 버튼이 뜸 — overflow:hidden 으로 밖으로 삐져나오지 않음 */
            position:absolute; left:14px; top:50%; transform:translateY(-50%);   /* 헤더 세로 중앙. 6칸(3줄) = 3×26 + 2×4 + 패딩 6 = 92px (오른쪽 고정 버튼 3행 86px 과 같은 줄 높이) */
            width:429px; box-sizing:border-box; padding:3px; overflow:hidden;   /* 429 = 왼쪽 동숲 주민(100px) + 고정 버튼 3행(140px) 자리를 남긴 폭 */
        }
        .bb-alert-chips { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:4px 6px; }
        .bb-chip {   /* 가로로 긴 한 줄 버튼: [아이콘 종류 N건  ··· 기체명] */
            display:flex; align-items:center; gap:6px; min-width:0;
            height:26px; padding:0 9px; box-sizing:border-box; border-radius:8px;   /* 고정 버튼(.bb-fb)과 같은 높이·글자 크기 → 3행이 오른쪽 버튼 3행과 나란히 */
            font-size:12px; font-weight:800; cursor:pointer; font-family:inherit;
            transition:filter .15s, box-shadow .15s;
        }
        .bb-chip-l1 { flex-shrink:0; white-space:nowrap; }
        .bb-chip-l2 {
            flex:1; min-width:0; font-size:12px; font-weight:500; opacity:.8;
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
        .bb-chip-none   { grid-column:1 / -1; font-size:13px; color:var(--mu); font-weight:700; padding:6px 4px; }
        @keyframes chipPulse { 0%,100%{opacity:1} 50%{opacity:.85} }
        @keyframes chipBorder {
            0%,100% { box-shadow:0 0 0 2px currentColor; }
            50%     { box-shadow:0 0 0 1px currentColor; }
        }

        /* 검색 */
        .bb-si-wrap { position:relative; flex:1 1 230px; min-width:230px; }   /* 2줄에서 남는 폭을 채움 (최소 230px — 안내 문구가 잘리지 않는 폭) */
        .bb-si {
            width:100%; box-sizing:border-box; max-width:100%; background:var(--sur2); border:1px solid var(--bd2);
            border-radius:7px; padding:6px 10px 6px 26px;
            color:var(--tx); font-size:14px; outline:none; font-family:inherit;
        }
        .bb-si:focus { border-color:var(--bl); }
        .bb-si::placeholder { color:var(--mu); }
        .bb-si-icon { position:absolute; left:8px; top:50%; transform:translateY(-50%); font-size:14px; color:var(--mu); pointer-events:none; }
        #bb-dd {
            position:absolute; top:calc(100% + 4px); right:0; width:300px;   /* 입력창은 좁아도 목록은 넓게 */
            background:var(--sur2); border:1px solid var(--bd2);
            border-radius:8px; overflow:hidden;
            box-shadow:0 8px 24px rgba(0,0,0,.7); z-index:99999999; display:none;
            max-height:240px; overflow-y:auto;
        }
        #bb-dd.open { display:block; }
        .bb-di {
            padding:8px 12px; font-size:14px; font-weight:700; cursor:pointer;
            display:flex; align-items:center; gap:6px;
            border-bottom:1px solid var(--bd); color:var(--tx);
            transition:background .1s;
        }
        .bb-di:last-child { border-bottom:none; }
        .bb-di:hover, .bb-di.bb-di-focus { background:var(--bd); }
        .bb-di-name { flex:1; }
        .bb-di-icon { font-size:12px; flex-shrink:0; }
        .bb-di-plus { font-size:15px; color:var(--gn); font-weight:900; flex-shrink:0; margin-left:4px; }

        /* ── 기체 리스트 (통합 그리드: 한 줄 = 기체 1대) ── */
        /* 본문 = 좌(기체 리스트 + 퀵바) | 우(다중 모니터링 중 기체) */
        .bb-body { display:flex; align-items:stretch; flex:1 1 auto; min-height:0; }   /* 남는 높이를 차지하고, 넘치면 카드 영역이 줄어들며 그 안에서 스크롤 */
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
        .bb-lists { display:flex; align-items:stretch; gap:12px; min-height:420px; min-height:max(420px, 100%); }   /* 즐겨찾기 테두리가 카드 끝까지 이어지도록 내용 높이만큼 늘어남 */
        /* 1열 = 즐겨찾기: 여기에 끌어다 놓으면 이름 순 정렬을 해도 일반 기체와 섞이지 않고 이 영역 안에서만 정렬됨 */
        .bb-fav {
            flex:0 0 318px; width:318px; box-sizing:border-box;
            display:flex; flex-direction:column; gap:5px;
            outline:2px solid var(--bd2); outline-offset:5px; border-radius:8px;   /* 다중 모니터링 영역(.bb-mm-box) 테두리와 같은 색(--bd2)·두께(2px). outline 이라 카드 폭에 영향 없음 */
        }
        .bb-fav:empty::before {
            content:'즐겨찾기 — 카드를 끌어다 놓으세요'; margin:auto; padding:0 12px;
            text-align:center; font-size:13px; color:var(--mu);
        }
        .bb-fav:not(:empty)::after {   /* 기체가 들어 있을 때: 영역 하단에 작은 안내 (비어 있을 때는 위의 가운데 문구) */
            content:var(--fav-note, '즐겨찾기 — 카드를 끌어다 놓으세요');   /* 가득 찼을 때는 JS 가 --fav-note 로 경고 문구를 잠깐 씀 */
            position:sticky; bottom:4px; margin-top:auto; padding-top:2px;   /* 영역이 길어 스크롤돼도 보이는 하단에 고정 */
            text-align:center; font-size:10px; line-height:12px; color:var(--mu); opacity:.85;
            text-shadow:0 0 3px var(--bg), 0 0 3px var(--bg);   /* 카드 위에 걸쳐도 읽히도록 */
            pointer-events:none;
        }
        .bb-fav.warn::after { color:var(--rd); opacity:1; font-weight:700; }
        .bb-list {   /* 일반 기체: 3열 (세로 우선 채움 → 이름순 정렬 시 위→아래로 읽힘, 행 수는 JS가 지정) */
            flex:0 0 auto; display:grid; align-content:start;
            grid-template-columns:repeat(3,318px);
            grid-auto-flow:column;
            gap:5px 12px;
        }
        .bb-fav.bb-drop-over, .bb-list.bb-drop-over { background:rgba(99,102,241,.08); border-radius:8px; }
        .bb-list-empty {
            grid-column:1 / -1; padding:56px 0; text-align:center;
            font-size:15px; color:var(--mu);
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
            background:var(--sur); border:1.5px solid var(--bd);
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
            color:var(--rd); font-size:18px; font-weight:900; opacity:.9; pointer-events:none;
        }
        .bb-row-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }   /* 8 → 10px */
        .bb-row-name {
            flex:1; min-width:0; font-size:15px; font-weight:700; color:var(--tx);
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
        .bb-off-tag { font-size:11px; font-weight:900; letter-spacing:.2px; color:var(--off-main); }
        .bb-off-sep { font-style:normal; font-size:10px; margin:0 4px; color:var(--off-sub); opacity:.55; }
        .bb-off-lbl { font-size:9.5px; color:var(--off-sub); }
        .bb-off-l2 {
            margin-top:3px; font-size:10.5px; color:var(--off-date);
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
            font-size:12px; font-weight:900; font-family:'Paperlogy','Lato',monospace;   /* 11 → 12px */
            color:var(--pct-fill); text-shadow:var(--pct-shadow);
            letter-spacing:-0.3px; pointer-events:none; white-space:nowrap;
        }
        .bb-row-pct-wrap {
            position:relative; display:inline-block; width:56px; height:20px;
            overflow:hidden; flex-shrink:0; text-align:right;
        }
        .bb-row-pct-val, .bb-row-pct-off {
            position:absolute; top:0; right:0; white-space:nowrap;
            animation:bb-pctSlide 8s ease-in-out infinite;
        }
        .bb-row-pct-val { display:flex; align-items:center; height:20px; }
        .bb-row-pct-off { font-size:11px; font-weight:900; line-height:20px; color:rgba(239,68,68,.8); animation-delay:-4s; }
        .bb-row-plug { font-size:11px; line-height:1; flex-shrink:0; }   /* 있을 때만 표시 (자리 예약 없음) — 배터리 바 왼쪽 */

        /* ── 우측: 다중 모니터링 중 기체 (세로 직사각형 영역) ── */
        .bb-mm { flex:1 1 0; min-width:0; position:relative; margin:10px 16px 10px 6px; }
        .bb-mm-box {
            position:absolute; inset:0; display:flex; flex-direction:column;
            border:2px solid var(--bd2); border-radius:8px; background:var(--bg); overflow:hidden;
        }
        .bb-mm-head {
            flex:0 0 auto; padding:5px 8px 4px; text-align:center;
            background:var(--sur); border-bottom:1px solid var(--bd);
        }
        .bb-mm-title { font-size:16.5px; font-weight:900; color:var(--tx); }
        .bb-mm-count { color:var(--rd); }
        .bb-mm-note { font-size:11.5px; font-weight:400; color:var(--mu); white-space:nowrap; }
        .bb-mm-sub { margin-top:1px; font-size:11.5px; line-height:1.3; color:var(--mu); }
        .bb-mm-sub.warn { color:var(--or); }
        .bb-mm-body {
            flex:1 1 auto; min-height:0; overflow-y:auto;
            display:flex; flex-direction:column; gap:5px; padding:6px;
        }
        .bb-mm-body:empty::before {   /* 카드가 들어오면 자동으로 사라지는 빈 상태 문구 */
            content:'다중 모니터링 중인 기체 없음'; margin:auto; font-size:13px; color:var(--mu);
        }
        .bb-mm-card {   /* 기체 카드 = 기존 행(30px) 두 줄 두께 (30 + 5 + 30) */
            flex:0 0 auto; height:65px; box-sizing:border-box;
            display:flex; flex-direction:column; justify-content:center; gap:5px;
            padding:0 10px;
            background:var(--sur); border:1.5px solid var(--bd); border-radius:8px;
            cursor:pointer;   /* 클릭하면 기체 정보 창 */
        }
        .bb-mm-card:hover { border-color:#f9a8d4; box-shadow:0 0 0 1px #f9a8d4; }
        /* 1줄: 기체명 · 순찰 중 · 시작 시각 ··········· 요원 */
        .bb-mm-l1 { display:flex; align-items:baseline; gap:8px; min-width:0; }
        .bb-mm-name {
            flex:0 1 auto; min-width:0; font-size:15px; font-weight:700; color:var(--tx);
            white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        .bb-mm-st { flex-shrink:0; display:inline-flex; align-items:center; gap:5px; font-size:13px; color:var(--bl); white-space:nowrap; }
        .bb-mm-dot { width:8px; height:8px; border-radius:50%; background:var(--bl); }
        .bb-mm-since { flex-shrink:0; margin-left:-3px; font-size:12px; color:var(--mu); white-space:nowrap; }
        .bb-mm-staff {
            flex:0 1 auto; min-width:0; max-width:45%; margin-left:auto;
            font-size:13px; color:var(--tx); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        #bb.bb-light .bb-mm-staff { color:#000; }   /* 라이트: 검정 (굵기는 기본) — 다크는 배경이 어두워 밝은 글자색 유지 */
        /* 2줄: 현재 POI ··········· N분째 미갱신 */
        .bb-mm-l2 { display:flex; align-items:baseline; gap:6px; min-width:0; font-size:13px; }
        .bb-mm-poi { flex:0 1 auto; min-width:0; color:var(--tx); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bb-mm-act { flex-shrink:0; font-size:12px; color:var(--mu); white-space:nowrap; }
        .bb-mm-stale { flex-shrink:0; margin-left:auto; color:var(--or); white-space:nowrap; }
        .bb-mm-card.anomaly { border-color:var(--or); animation:bb-mmBlink 1s infinite; }
        #bb.bb-light .bb-mm-stale, #bb.bb-light .bb-mm-sub.warn { color:#c2410c; }
        @keyframes bb-mmBlink {
            0%,100% { border-color:var(--or); box-shadow:0 0 0 1px var(--or); }
            50%     { border-color:transparent; box-shadow:none; }
        }

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
            padding:0 12px; font-size:16.5px; font-weight:900; color:var(--tx);
            background:var(--sur); border-right:1px solid var(--bd); white-space:nowrap;
        }
        .bb-qline-circles {
            flex:1; min-width:0; display:flex; flex-wrap:wrap; align-items:center;
            gap:4px; padding:2px 10px;
        }
        .bb-qline-none { font-size:13px; color:var(--mu); white-space:nowrap; }
        .bb-mi {
            width:23px; height:23px; border-radius:50%; flex-shrink:0;   /* 26 → 23px (-10%) */
            border:2px solid var(--ac,var(--gy));
            color:var(--ac,var(--gy)); font-size:11.5px; font-weight:900;
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
            font-size:16.5px; font-weight:900; color:var(--tx); letter-spacing:.3px;
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
			color:var(--pk); font-size:14px; font-weight:700; white-space:nowrap;
			box-shadow:0 1px 4px rgba(0,0,0,.35);
		}
        .bb-delivery-empty {
            display:inline-block;
            font-size:12px; color:var(--mu); font-weight:700;
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
            background-image: linear-gradient(var(--sur), var(--sur)), linear-gradient(135deg, #6366f1, #ec4899);
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
            background-image: linear-gradient(var(--sur), var(--sur)), linear-gradient(135deg, #6366f1, #ec4899);
            background-origin: border-box;
            background-clip: padding-box, border-box;
            box-shadow:0 24px 64px rgba(0,0,0,.9);
            z-index:99999999;
                    }
        #bb-alertlog-all-panel.open { display:block; }
        .bb-alertlog-day { margin-bottom:14px; }
        .bb-alertlog-day-title {
            display:flex; align-items:center; gap:10px;
            font-size:17px; font-weight:900; color:var(--tx);
            margin:14px 14px 8px;
        }
        .bb-alertlog-day-title::after { content:''; flex:1; height:1px; background:var(--bd2); }
        .bb-alertlog-day:first-child .bb-alertlog-day-title { margin-top:2px; }
        .bb-alertlog-row { display:flex; align-items:baseline; gap:8px; font-size:15px; padding:6px 14px; }
        .bb-alertlog-row:nth-child(even) { background:var(--bg); }
        .bb-alertlog-time { color:var(--mu); min-width:150px; flex-shrink:0; }
        .bb-alertlog-name { color:var(--tx); flex-shrink:0; }
        .bb-alertlog-icon { font-size:20px; line-height:1; }
        .bb-alertlog-type { font-weight:900; }

        #bb-alert-panel.open { display:block; }
        .bb-ap-hd {
            padding:14px 16px; border-bottom:1px solid #4a5070;
            background:var(--sur);
            border-radius:12px 12px 0 0;
            display:flex; justify-content:space-between; align-items:center;
            position:sticky; top:0; z-index:1;
        }
        .bb-ap-title { font-size:16px; font-weight:900; color:#ffffff; }
        .bb-ap-close {
            width:34px; height:34px; border-radius:8px;   /* 26 → 34px (알림 상세 / 알림 로그 창) */
            background:rgba(239,68,68,.25); border:1px solid rgba(239,68,68,.6);
            color:#fca5a5; font-size:18px; cursor:pointer;
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
        .bb-ap-name { font-size:17px; font-weight:900; color:#f4f4ff; }
        .bb-ap-desc { font-size:14.5px; font-weight:700; color:#c4c8e8; line-height:1.55; }
        .bb-ap-time { font-size:11px; color:#8890b8; font-family:'Lato',monospace; }
        .bb-ap-dismiss {
            display:flex; flex-shrink:0; align-self:center;
            padding:4px 11px; border-radius:6px;
            border:1px solid #4a5070; background:#3a3f62;
            color:#a0a8cc; font-size:11px; font-weight:700; cursor:pointer; font-family:inherit;
        }
        .bb-ap-empty { padding:28px 16px; text-align:center; font-size:14px; color:#8890b8; font-weight:700; background:var(--sur); border-radius:0 0 12px 12px; }

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
            top:50%; left:50%; transform:translate(-50%,-50%);
            width:840px;
            border:3px solid transparent; border-radius:12px;
            background-image: linear-gradient(var(--sur), var(--sur)), linear-gradient(135deg, #6366f1, #ec4899);
            background-origin: border-box;
            background-clip: padding-box, border-box;
            box-shadow:0 16px 48px rgba(0,0,0,.9);
            z-index:999999999; font-family:'Lato',sans-serif;
            color:var(--tx); overflow:hidden;
                    }
        #bb-info-card-panel.search-mode { width:588px; }
        .bb-icp-flex { display:flex; align-items:stretch; }
        .bb-icp-left { flex:0 0 260px; min-width:0; }
        .bb-icp-right { flex:1; min-width:0; border-left:1px solid var(--bd); padding:10px 16px; }
        .bb-icp-wbl-log { margin-top:10px; display:flex; flex-direction:column; gap:6px; }
        .bb-icp-wbl-line { font-size:15px; line-height:1.5; color:var(--tx); }
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
        .bb-icp-asof { font-size:12px; color:var(--mu); font-weight:400; margin-left:4px; }
        .bb-icp-hd { cursor:move; }
        .bb-icp-title { font-size:16px; font-weight:900; color:var(--tx); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bb-icp-badge {
            font-size:13px; font-weight:900; padding:3px 8px;
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
            color:var(--rd); font-size:18px; cursor:pointer;
            display:flex; align-items:center; justify-content:center; font-weight:900;
            margin-left:6px;
        }
        .bb-icp-section {
            padding:7px 14px; border-bottom:1px solid var(--bd);
        }
        .bb-icp-section:last-child { border-bottom:none; }
        .bb-icp-section-title {
            font-size:13px; font-weight:900; color:var(--mu);
            letter-spacing:.5px; margin-bottom:4px; text-transform:uppercase;
        }
        #bb-icp-wbl-title-text { font-weight:900; font-size:15px; }
        .bb-icp-row {
            display:flex; justify-content:space-between; align-items:center;
            padding:3px 0; font-size:15px;
        }
        .bb-icp-label { color:var(--mu); font-weight:700; }
        .bb-icp-value { color:var(--tx); font-weight:700; text-align:right; display:flex; align-items:center; gap:4px; }
        .bb-icp-bar { font-size:13px; color:var(--gn); letter-spacing:-1px; }

        /* ── 제거 힌트 ── */
        .bb-rmhint { font-size:12px; color:var(--rd); font-weight:700; display:none; opacity:.85; }
        .bb-rmhint.show { display:block; }
    `;
    document.head.appendChild(style);

    // ============================================================
    // SECTION 0b. HTML
    // ============================================================
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
                    <button id="bb-fb-dis" class="bb-fb" data-mode="dis" title="최근 24시간 배터리 로그에서 2% 이하에 도달한 뒤 OFF 된 기체">최근 방전 기체(24H)<b class="bb-fb-n"></b></button>
                    <button id="bb-fb-slow" class="bb-fb" data-mode="slow" title="충전 중(100% 미만)인 기체를 충전을 시작한 때부터 지금까지의 평균 속도가 더딘 순으로 (상위 5대)">저속충전 기체 TOP5<b class="bb-fb-n"></b></button>
                    <button id="bb-fb-moff" class="bb-fb" data-mode="moff" title="현재 임무가 OFF 인 기체">임무 OFF 기체<b class="bb-fb-n"></b></button>
                    <div class="bb-fbp" id="bb-fbp">
                        <div class="bb-fbp-hd">
                            <span class="bb-fbp-title" id="bb-fbp-title"></span>
                            <span class="bb-fbp-cnt" id="bb-fbp-cnt"></span>
                            <span class="bb-fbp-x" id="bb-fbp-x">✕</span>
                        </div>
                        <div class="bb-fbp-body" id="bb-fbp-body"></div>
                    </div>
                </div>
                <!-- 좌: 동숲 주민 2 (제목 박스 왼쪽, 말풍선 없음, 우측 주민과 다른 캐릭터) -->
                <div id="bb-walker-wrap-l">
                    <div id="bb-walker-l"></div>
                    <button id="bb-walker-l-prev" class="bb-walker-arrow left" title="이전 캐릭터">‹</button>
                    <button id="bb-walker-l-next" class="bb-walker-arrow right" title="다음 캐릭터">›</button>
                    <button id="bb-walker-l-toggle" title="동숲 주민 끄기">동숲</button>
                </div>
                <div class="bb-hd-titlebox" id="bb-drag-handle">
                    <div class="bb-hd-title">
                        NCC 종합 모니터
                        <span id="bb-cyh-tag" style="font-size:16px;color:var(--mu);font-weight:400;">by CYH</span>
                    </div>
                    <div class="bb-hd-time">
                        <div class="bb-clock" id="bb-clk">00:00:00</div>
                        <div class="bb-ref" id="bb-ref">— 초 후 갱신</div>
                    </div>
                    <button id="bb-wbl-upload-btn" class="bb-up-mini" style="display:none;" title="배터리 데이터 업로드 (CYH 전용)">UP</button>
                </div>
                <!-- 제목 아래: 상태 색 범례 -->
                <div class="bb-legend" id="bb-legend" title="기체 카드의 점 · 하단 동그라미 색 = 기체의 현재 상태"></div>
                <!-- 우: 동숲 주민 1 (제목 박스 오른쪽, 말풍선 있음) -->
                <div id="bb-walker-wrap">
                    <div id="bb-walker" title="클릭: 말풍선 켜기/끄기"></div>
                    <button id="bb-walker-prev" class="bb-walker-arrow left" title="이전 캐릭터">‹</button>
                    <button id="bb-walker-next" class="bb-walker-arrow right" title="다음 캐릭터">›</button>
                    <button id="bb-walker-toggle" title="동숲 주민 끄기">동숲</button>
                    <div id="bb-walker-bubble"><span id="bb-walker-bubble-text"></span></div>
                </div>
                <!-- 우: 버튼 2줄 -->
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
                                <button class="bb-btn" id="bb-inforequest-btn">정보 조회</button>
                                <button id="bb-backup-btn" class="bb-btn">목록 백업</button>
                                <button id="bb-restore-btn" class="bb-btn">목록 복원</button>
                                <div class="bb-xbtn" id="bb-closebtn">✕</div>
                            </div>
                        </div>
                        <div class="bb-hd-right-row">
                            <button class="bb-btn" id="bb-sortname-btn">이름 순 정렬</button>
                            <button class="bb-btn" id="bb-rmbtn">카드 제거</button>
                            <button class="bb-btn" id="bb-alertlog-all-btn">📋 알림 로그</button>
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
                    <div class="bb-ap-title">📋 최근 15일 알림 로그</div>
                    <div class="bb-ap-close" id="bb-alertlog-all-close">✕</div>
                </div>
                <div id="bb-alertlog-all-body"></div>
            </div>

            <!-- 본문: 좌(기체 리스트 + 하단 퀵바) | 우(다중 모니터링 중 기체) -->
            <div class="bb-body">
                <div class="bb-main">
                    <div class="bb-list-wrap">
                      <div class="bb-lists">
                        <div class="bb-fav" id="bb-fav" title="즐겨찾기(최대 20대) — 여기에 끌어다 놓은 기체는 이 영역 안에서만 정렬됩니다"></div>
                        <div class="bb-list" id="bb-list"></div>
                      </div>
                    </div>

                    <!-- 하단 퀵바: 역삼 | 송도 | 성수 | 삼평/서현 (켜진 기체만, 한 줄) -->
                    <div class="bb-quick" id="bb-quick"></div>
                </div>

                <!-- 다중 모니터링 중 기체 — patrol_watch_live.json 을 1분마다 받아 #bb-mm-body 에 카드 렌더 (SECTION 16) -->
                <div class="bb-mm">
                    <div class="bb-mm-box">
                        <div class="bb-mm-head">
                            <div class="bb-mm-title" id="bb-mm-title">다중 모니터링 기체</div>
                            <div class="bb-mm-sub" id="bb-mm-sub">불러오는 중…</div>
                        </div>
                        <div class="bb-mm-body" id="bb-mm-body"></div>
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
    `;
    document.body.appendChild(wrap);

    const bbEl = document.getElementById('bb');
    // 다크모드는 삭제됨 → 항상 라이트. (#bb-theme-btn 은 나중에 재활용하려고 자리만 남겨 두고 "-" 만 표시, 동작 없음)
    const applyBbTheme = () => {
		bbEl.classList.add('bb-light');
		document.getElementById('bb-alert-panel').classList.add('bb-light');
		document.getElementById('bb-info-card-panel').classList.add('bb-light');
		document.getElementById('bb-alertlog-all-panel').classList.add('bb-light');
		document.getElementById('bb-theme-btn').textContent = '-';
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
	const DELIVERY_SITE_IDS = [25,27,44,47,48,53,56,65,86,109,118,141,171,180,207,241,265];

    // [주석처리: 퀵바/기타 배달] const QUICK_SITE_IDS = [109, 65, 56, 44, 86];
    // [주석처리: 퀵바/기타 배달] const OTHER_DELIVERY_SITE_IDS = DELIVERY_SITE_IDS.filter(id => !QUICK_SITE_IDS.includes(id));

    const SITE_IDS = [
        24,27,36,37,44,46,47,48,51,53,56,57,
        65,66,72,75,82,86,105,108,109,111,117,118,126,131,
        132,134,137,138,140,141,142,143,144,145,146,150,151,171,
        177,178,179,180,181,182,187,193,196,202,203,207,214,216,224,230,235,241,244,245,246,257,265
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

    // 하단 퀵바 그룹 — keywords가 기체명에 포함되면 해당 그룹. 켜진 기체만 표시됨.
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
    let rmMode = false, rmSet = new Set(), isOpen = false;
    let fetchLock = false;
    let lastRaw = [];
    let topmostZ = 100000000;
    let currentAlertType = null;
    let _patrolReady = false;   // SECTION 16(다중 모니터링) 초기화 끝난 뒤 true
    // 정보 조회 창: 조회(검색) 창이 열려 있는 동안 true → 기체 정보를 ✕ 로 닫으면 조회 목록으로 돌아감 (검색어/스크롤도 유지)
    let _infoSearchActive = false, _infoSearchQuery = '', _infoSearchScroll = 0;
    let currentAlerts = [];

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
            const isDelivery =
				!FORCE_PATROL_SITE_IDS.includes(raw.site?.id) &&
				(DELIVERY_TYPES.includes(raw.service?.serviceType) ||
				 DELIVERY_SITE_IDS.includes(raw.site?.id));

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
            panel.style.position = 'fixed';
            panel.style.top = (r.bottom + 8) + 'px';
            panel.style.left = (r.left + r.width / 2) + 'px';
            panel.style.transform = 'translateX(-50%)';
        }
        registerAlertPanelClose();
    }

    let _alertPanelCloseHandler = null;
    function registerAlertPanelClose() {
        const panel = document.getElementById('bb-alert-panel');
        if (_alertPanelCloseHandler) {
            document.removeEventListener('mousedown', _alertPanelCloseHandler);
            _alertPanelCloseHandler = null;
        }
        setTimeout(() => {
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
        if (fetchLock) return;
        if (Date.now() - _lastProcessedAt < UPDATE_INTERVAL_MS) return;
        _lastProcessedAt = Date.now();
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
            if (DB.length > 0) {
                migrateLegacyFixed();   // 구 고정 그리드 기체를 통합 리스트로 1회 편입
                ids = ids.filter(id => DB.some(x => x.id === id));
                favIds = favIds.filter(id => DB.some(x => x.id === id));
                save();
            }

            logBatteryPattern(DB);
            try { sampleChargeBuffer(DB); } catch (err) { console.error('[BB] 충전 관측 오류:', err); }   // 저속충전 계산용 (2분마다 1회 기록)
            wblCyhAutoUploadTick();
            wblOthersAutoDownloadTick();
            wblNightUploadTick();
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
            if (_fbReady) refreshFixedTools();   // 고정 버튼 3종: 배지 + 열려 있는 목록 창 (2분마다)
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
    }
    function closeBoard() {
        isOpen = false;
        document.getElementById('bb').classList.remove('open');
        document.getElementById('bb-alert-panel').classList.remove('open');
        // (기체 정보 창은 보드를 닫아도 유지 — 창의 ✕ 로만 닫음)
        if (rmMode) { rmMode = false; rmSet.clear(); updateRmUI(); }
        hideDd();
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
        const m = Math.floor(ns / 60), s = ns % 60;
        const el = document.getElementById('bb-ref');
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
    const LIST_COLS = 3;   // CSS(.bb-list)의 열 수와 맞출 것 (4열 중 1열은 즐겨찾기)
    const MAIN_ROWS = 20;  // 한 열의 행 수 = 즐겨찾기 열(최대 20대)과 같은 높이. 한 열을 끝까지 채운 뒤 다음 열로 넘어감

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
        if (!list || !fav) return;
        const pick = arr => arr.map(id => DB.find(x => x.id === id)).filter(Boolean);
        const favRobots = pick(favIds);
        const robots    = pick(ids);

        fav.replaceChildren(...favRobots.map(r => makeRow(r, true)));   // 비면 :empty 안내 문구가 보임

        list.innerHTML = '';
        if (robots.length === 0) {
            list.style.gridTemplateRows = '';
            if (favRobots.length === 0) {
                list.innerHTML = `<div class="bb-list-empty">${DB.length === 0
                    ? '기체 데이터 로딩 중...'
                    : '표시할 기체가 없습니다. 오른쪽 위 검색창에서 기체를 추가하세요.'}</div>`;
            }
            return;
        }
        // 세로 우선 흐름: 열당 행 수를 지정해야 위→아래로 채워짐. 한 열을 MAIN_ROWS(20)행까지 다 채우고 다음 열로 (3열 × 20행 = 60대를 넘으면 행 수를 늘려 3열 안에 맞춤)
        list.style.gridTemplateRows = `repeat(${Math.max(MAIN_ROWS, Math.ceil(robots.length / LIST_COLS))}, auto)`;
        robots.forEach(r => list.appendChild(makeRow(r, false)));
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

        const battInner = off
            ? `<span class="bb-row-off">
                   <span class="bb-off-l1"><b class="bb-off-a bb-off-tag">OFF</b><i class="bb-off-sep">|</i><span class="bb-off-lbl">마지막 통신</span></span>
                   <span class="bb-off-l2">${lastConn
                       ? `<span class="bb-off-a bb-off-date">${lastConn.date}</span><i class="bb-off-sep">|</i><span class="bb-off-time">${lastConn.time}</span>`
                       : '<span class="bb-off-none">기록 없음</span>'}</span>
               </span>`
            : `<span class="bb-row-batt" style="border-color:${ac};">
                   <span class="bb-row-batt-fill" style="width:${r.battery}%;background:${ac};"></span>
                   <span class="bb-row-batt-pct">${r.battery}%</span>
               </span>`;
        const battHtml = showMissionOff
            ? `<span class="bb-row-pct-wrap">
                   <span class="bb-row-pct-val">${battInner}</span>
                   <span class="bb-row-pct-off">임무 OFF</span>
               </span>`
            : battInner;

        row.innerHTML = `
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
    // 배터리 증감 로그 (하루 = 03:00~익일 03:00, 24시간 연속 기록 / 날짜가 바뀌면 자동 초기화)
    // ============================================================
    const WBL_KEY = 'bb_battery_log';

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

    function wblGetDayKey() {   // 로그의 하루 = 03:00 ~ 익일 03:00. 쉬는 시간대 없이 항상 값이 있음 (00~02시는 전날 것)
        const now = new Date();
        if (now.getHours() >= 3) return wblLocalDateStr(now);
        const y = new Date(now); y.setDate(y.getDate() - 1);
        return wblLocalDateStr(y);
    }

    function wblLoad() {
        try { const raw = localStorage.getItem(WBL_KEY); return raw ? JSON.parse(raw) : null; }
        catch { return null; }
    }
    function wblSave(data) {
        try { localStorage.setItem(WBL_KEY, JSON.stringify(data)); } catch {}
    }
    function wblEnsureDay() {
        const dayKey = wblGetDayKey();
        if (!dayKey) return null;
        let data = wblLoad();
        if (!data || data.day !== dayKey) {
            data = { day: dayKey, entries: {} };   // 날짜 바뀌면 통째로 초기화(=자동 삭제)
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

    // 로그 시각을 그날 00:00 기준 분으로 변환 (하루가 03:00에 시작하므로 00:00~02:59는 다음날로 간주해 +1440)
    function wblDayAdjMin(hhmm) {
        const m = wblToMin(hhmm);
        return m < 3*60 ? m + 1440 : m;
    }

    function wblLoadYesterdaySnapshot() {
        try { const raw = localStorage.getItem('bb_battery_log_yesterday'); return raw ? JSON.parse(raw) : null; }
        catch { return null; }
    }

    function wblGetSourceData(source) {
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


    // 오늘 03:00 기준 분(min) 좌표로 SVG 선그래프 그리기 (하루 24시간) (미측정 구간은 점선으로 끊음)
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
        if (!data) return `<div style="font-size:13px;color:var(--mu);padding:30px;text-align:center;">${source==='yesterday' ? '어제' : '오늘'} 기록된 데이터 없음</div>`;
        const entry = data.entries[robotId];
        if (!entry || entry.log.length === 0) return `<div style="font-size:13px;color:var(--mu);padding:30px;text-align:center;">${source==='yesterday' ? '어제' : '오늘'} 기록된 데이터 없음</div>`;

        const PX_PER_MIN = 2.9, H = 252, PADX = 19, PADT = 17, PADB = 31;
        const dayStartMin = 3 * 60;
        const spanMin = source === 'yesterday'
            ? 24 * 60   // 어제는 이미 끝난 하루(03:00~익일03:00, 24시간)이니 항상 전체 구간
            : Math.max(60, (() => { const n=new Date(); let m=n.getHours()*60+n.getMinutes(); if (n.getHours()<3) m += 1440; return m; })() - dayStartMin);
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

        const colorOf = (status) => STATUS_AC[status] || '#3b82f6';

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
        for (let m = dayStartMin; m <= dayStartMin + spanMin; m += 10) {
            if (m % 60 === 0) continue;   // 정시는 xTicks에서 이미 표기
            xMinorTicks.push({ x: PADX + (m - dayStartMin) * PX_PER_MIN, label: String(m % 60) });
        }

        const yLabels = [100,75,50,25,0].map(p =>
            `<div style="position:absolute;top:${(yOf(p)-8).toFixed(1)}px;left:0;font-size:14px;font-weight:700;color:${labelText};">${p}</div>`
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
            <div style="display:flex; align-items:center; gap:6px; margin-top:4px; padding:0 4px 0 30px; font-size:10px; color:${hintText};">
                ↔️ 그래프를 좌우로 드래그하면 시간대를 이동할 수 있어요
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:6px; padding:0 4px 0 30px;">
                ${Object.keys(WBL_STL).map(st => `
                    <span style="display:flex; align-items:center; gap:4px; font-size:11px; color:var(--mu);">
                        <span style="width:10px; height:10px; border-radius:50%; background:${colorOf(st)};"></span>${WBL_STL[st]}
                    </span>`).join('')}
            </div>
        `;
    }
	
	function wblMergeImported(remote) {
		if (!remote || remote.day !== wblGetDayKey()) return false;
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
	// - 업로드: CYH만, 08:00~17:30 자동(30분 주기, 실패시 1분 뒤 1회 재시도) / 수동은 언제든 가능 / 심야 업로드는 02:50 (아래)
	// - 다운로드: CYH 제외 전원, 24시간 30분 주기 자동(실패시 1분 뒤 1회 재시도) (+ 수동 강제 버튼)
	// - 병합: CYH 데이터가 겹치는 시간대는 덮어씀(더 연속적이고 정확하다고 판단)
	// - 어제 데이터: 트래킹 데이(03:00~익일03:00) 기준 하루 전 스냅샷, 세션당 1회만 로드
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

	// 트래킹 데이 기준 "어제" 날짜 계산 (03:00~익일03:00 하루 주기를 그대로 하루 앞으로 민 것)
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

	// CYH 자동 업로드 — 08:00~17:30만, 30분 슬롯당 1회 시도, 실패시 1분 뒤 1회만 재시도
	let _wblUpRetryTimer = null;
	async function wblCyhAutoUploadTick() {
		if (localStorage.getItem('bb_is_cyh') !== '1') return;
		const now = new Date();
		const h = now.getHours(), m = now.getMinutes();

        if (h === 17 && m >= 50) {
			const exKey = `bb_wbl_up_1750_${wblTodayStr()}`;
			if (localStorage.getItem(exKey) !== '1') {
				localStorage.setItem(exKey, '1');
				await wblDoUpload();
			}
			return;
		}
        
		const minsSince8 = (h - 8) * 60 + m;
		if (minsSince8 < 0 || minsSince8 > 570) return;   // 08:00~17:30 범위 밖

		const slot = wblSlotLabel30(now);
		if (localStorage.getItem('bb_wbl_up_slot') === slot) return;

		const ok = await wblDoUpload();
		if (ok) {
			localStorage.setItem('bb_wbl_up_slot', slot);
			return;
		}
		// 1분 뒤 딱 1회만 재시도 (그 결과와 무관하게 이번 슬롯은 종료 처리 -> 다음 슬롯부터 재개)
		if (_wblUpRetryTimer) clearTimeout(_wblUpRetryTimer);
		_wblUpRetryTimer = setTimeout(async () => {
			await wblDoUpload();
			localStorage.setItem('bb_wbl_up_slot', slot);
		}, 60 * 1000);
	}

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

	// 야간 업로드(02:50) — CYH가 자리를 비웠을 때를 대비해, 그 시간에 접속해있는 아무나(비-CYH)가 대신 최종본을 올려줌.
	// 별도 역할 설정 없음: 그냥 02:50에 켜져있는 PC가 시도. 두 명이 동시에 켜져있어도 서버 "락" 파일로 한쪽만 실제 업로드.
	// (완전한 원자적 락은 아니지만, 랜덤 지연 + 2명뿐인 상황이라 실질적으로 충분 — 설령 겹쳐도 데이터가 깨지는 구조는 아님)
	const WBL_NIGHT_LOCK_NAME = '배터리_야간업로드_락';
	async function wblNightUploadTick() {
		if (localStorage.getItem('bb_is_cyh') === '1') return;   // CYH는 본인 낮 로직으로 이미 커버
		const now = new Date();
		if (now.getHours() !== 2 || now.getMinutes() < 50) return;   // 02:50 이후에만

		const dayKey = wblGetDayKey();
		if (!dayKey) return;

		const doneKey = `bb_wbl_night_up_${dayKey}`;
		if (localStorage.getItem(doneKey) === '1') return;   // 이 PC는 오늘치 이미 시도함(성공/스킵 무관, 1회만)
		localStorage.setItem(doneKey, '1');

		// 여러 PC가 동시에 02:50을 맞이해도 정확히 같은 순간에 몰리지 않도록 짧게 랜덤 대기
		await new Promise(r => setTimeout(r, Math.random() * 5000));

		try {
			const lockRes = await fetch(`${BACKUP_BASE}?name=${encodeURIComponent(WBL_NIGHT_LOCK_NAME)}`);
			if (lockRes.ok) {
				const lockData = await lockRes.json();
				if (lockData?.data?.day === dayKey) {
					console.log('[BB] 야간 업로드: 이미 다른 PC가 처리함, 스킵');
					return;
				}
			}
		} catch (e) { /* 락 확인 실패 시엔 없는 셈 치고 계속 진행 */ }

		await wblUploadNamed(WBL_NIGHT_LOCK_NAME, { day: dayKey, claimedAt: Date.now() });   // 락 선점

		await wblDoDownload();   // 혹시 그 사이 CYH가 막판에 올린 게 있으면 먼저 반영
		const ok = await wblDoUpload();
		console.log('[BB] 야간 업로드(02:50)', ok ? '완료' : '실패');
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
	// 저장 방식: alarm/ 폴더의 단일 파일 하나(배터리_알림로그)에 최근 15일치를 다 담음.
	// 원본 시각(예: 190개 타임스탬프)을 그대로 저장하지 않고, 업로드 시점에 바로
	// "구간(시작~끝)"으로 압축해서 저장 — 장시간 상습 알림 기체가 있어도 용량이 안 불어남.
	// 매 업로드마다 15일 넘은 날짜는 자동으로 잘라내서, 파일 크기가 무한정 커지지 않음.
	// ============================================================
	const ALERT_LOG_TYPES = ['zombie', 'cam', 'nomap'];
	const ALERT_LOG_META = {
		zombie: { icon: '👻', text: '좀비',        color: 'var(--or)' },
		cam:    { icon: '🎥', text: '캠 미노출',    color: 'var(--bl)' },
		nomap:  { icon: '🗺️', text: '미니맵 미노출', color: 'var(--ye)' },
	};
	const ALERT_LOG_RETENTION_DAYS = 15;
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

	// 15일 넘은 날짜는 잘라냄
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

	// 특정 기체의 알림 로그 조회 (최신순) — 캐시된 15일치 파일에서 바로 필터링, 별도 요청 없음
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


    // 그래프 좌우 드래그(패닝) — 전역에 한 번만 등록해서 패널 열 때마다 리스너가 쌓이지 않게 함
    let _wblDragEl = null, _wblDragStartX = 0, _wblDragStartScroll = 0;
    document.addEventListener('mousedown', (e) => {
        const el = e.target.closest('.bb-wbl-scroll');
        if (!el) return;
        _wblDragEl = el;
        _wblDragStartX = e.pageX;
        _wblDragStartScroll = el.scrollLeft;
        el.style.cursor = 'grabbing';
        e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
        if (!_wblDragEl) return;
        _wblDragEl.scrollLeft = _wblDragStartScroll - (e.pageX - _wblDragStartX);
    });
    document.addEventListener('mouseup', () => {
        if (_wblDragEl) { _wblDragEl.style.cursor = ''; _wblDragEl = null; }
    });
	document.addEventListener('wheel', (e) => {
		const el = e.target.closest('.bb-wbl-scroll');
		if (!el) return;
		el.scrollLeft += e.deltaY;
		e.preventDefault();
	}, { passive: false });


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

    function openInfoCardPanel(r) {
        const raw = r.raw;
        if (!raw) return;
        const rs = raw.robotStatus ?? {};
        const panel   = document.getElementById('bb-info-card-panel');
        const titleEl = document.getElementById('bb-icp-title');
        const badgeEl = document.getElementById('bb-icp-badge');
        const bodyEl  = document.getElementById('bb-icp-body');

        panel.classList.remove('search-mode');
        badgeEl.style.display = '';   // 검색 모드에서 숨겨 둔 배지 복구
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
                            <button class="bb-btn" id="bb-icp-wbl-toggle" style="font-size:13px;font-weight:900;padding:3px 8px;">어제 데이터 보기</button>
                            <button class="bb-btn" id="bb-icp-alertlog-toggle" style="font-size:13px;font-weight:900;padding:3px 8px;">알림 로그 보기</button>
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
        });
        requestAnimationFrame(() => {
            const sc = document.getElementById('bb-wbl-scroll');
            if (sc) sc.scrollLeft = sc.scrollWidth;
        });

        let alertLogViewOn = false;
        document.getElementById('bb-icp-alertlog-toggle').addEventListener('click', async () => {
            alertLogViewOn = !alertLogViewOn;
            const toggleBtn   = document.getElementById('bb-icp-alertlog-toggle');
            const wblToggleBtn= document.getElementById('bb-icp-wbl-toggle');
            const titleTextEl = document.getElementById('bb-icp-wbl-title-text');
            const chartEl     = document.getElementById('bb-icp-wbl-chart');
            const logEl       = document.getElementById('bb-icp-wbl-log');

            if (alertLogViewOn) {
                toggleBtn.textContent = '배터리 그래프 보기';
                wblToggleBtn.style.display = 'none';
                titleTextEl.textContent = '알림 로그';
                chartEl.style.display = 'none';
                logEl.style.cssText = 'margin-top:10px; display:flex; flex-direction:column; gap:6px; max-height:340px; overflow-y:auto;';
                logEl.innerHTML = `<div class="bb-icp-wbl-line" style="color:var(--mu);">불러오는 중...</div>`;
                const rows = await alertLogFetchForRobot(r.id);
                if (!rows.length) {
                    logEl.innerHTML = `<div class="bb-icp-wbl-line" style="color:var(--mu);">기록된 알림 로그 없음</div>`;
                } else {
                    const byDay = {};
                    rows.forEach(row => { (byDay[row.day] ||= []).push(row); });
                    logEl.innerHTML = Object.keys(byDay).sort().reverse().map(day => `
                        <div class="bb-alertlog-day">
                            <div class="bb-alertlog-day-title">${wblFormatMonthDay(day)}</div>
                            ${byDay[day].map(row => {
                                const meta = ALERT_LOG_META[row.type] || { icon:'', text:row.type, color:'var(--tx)' };
                                const timeStr = row.start === row.end ? row.start : `${row.start}~${row.end}`;
                                return `<div class="bb-alertlog-row"><span class="bb-alertlog-time">${timeStr}</span><span class="bb-alertlog-icon">${meta.icon}</span><span class="bb-alertlog-type" style="color:${meta.color};">${meta.text}</span></div>`;
                            }).join('')}
                        </div>
                    `).join('');
                }
            } else {
                toggleBtn.textContent = '알림 로그 보기';
                wblToggleBtn.style.display = '';
                chartEl.style.display = '';
                logEl.style.cssText = '';
                const wblDay = wblGetSourceData('today')?.day;
                titleTextEl.textContent = '오늘 배터리 증감 추이' + (wblDay ? ` [${wblFormatMonthDay(wblDay)}]` : '');
                chartEl.innerHTML = wblRenderChartSVG(r.id, 'today');
                const lines = wblSummarizeToday(r.id, 'today');
                logEl.innerHTML = lines
                    ? lines.map(line => `<div class="bb-icp-wbl-line">${line}</div>`).join('')
                    : `<div class="bb-icp-wbl-line" style="color:var(--mu);">오늘 기록된 데이터 없음</div>`;
            }
        });
        }

        function closeInfoCardPanel() {
            const panel = document.getElementById('bb-info-card-panel');
            if (_infoSearchActive && !panel.classList.contains('search-mode')) {
                openInfoSearchMode(true);   // 기체 정보만 닫고 조회 목록은 남김 → 다음 기체를 바로 고를 수 있음
                return;
            }
            _infoSearchActive = false;      // 조회 목록(또는 조회 없이 연 기체 정보)에서 ✕ → 완전히 닫음
            panel.classList.remove('open');
        }
        // 창 바깥을 누르면 닫히는 처리는 아래(document mousedown)에서 한 번만 등록
        function registerInfoPanelClose() {}

        function openInfoSearchMode(keep) {   // keep=true: 기체 정보에서 돌아올 때 검색어/스크롤 유지
            _infoSearchActive = true;
            if (!keep) { _infoSearchQuery = ''; _infoSearchScroll = 0; }
            const panel   = document.getElementById('bb-info-card-panel');
            const titleEl = document.getElementById('bb-icp-title');
            const badgeEl = document.getElementById('bb-icp-badge');
            const bodyEl  = document.getElementById('bb-icp-body');

            titleEl.textContent = '기체 정보 조회';
            badgeEl.style.display = 'none';
            panel.classList.add('search-mode');

            let searchFocusIdx = -1;

            function renderList(query) {
                _infoSearchQuery = query;
                const q = query.trim();
                const res = DB.filter(r => q === '' || r.name.includes(q))
                            .sort((a,b) => a.name.localeCompare(b.name, 'ko'));
                const listEl = bodyEl.querySelector('#bb-info-search-list');
                if (!listEl) return;

                if (res.length === 0) {
                    listEl.innerHTML = `<div class="bb-di" style="color:var(--mu);cursor:default;">${DB.length===0 ? '기체 데이터 로딩 중...' : '검색 결과 없음'}</div>`;
                    return;
                }
                listEl.innerHTML = res.map(r =>
                    `<div class="bb-di" data-rid="${r.id}">
                        <span class="bb-di-name">${r.name}</span>
                        <span class="bb-di-icon">${STI[r.status]}</span>
                    </div>`
                ).join('');
                listEl.querySelectorAll('.bb-di[data-rid]').forEach(el => {
                    el.addEventListener('mousedown', e => {
                        e.preventDefault(); e.stopPropagation();
                        const robot = DB.find(x => x.id === el.dataset.rid);
                        if (robot) {
                            badgeEl.style.display = '';
                            openInfoCardPanel(robot);
                        }
                    });
                });
            }

            bodyEl.innerHTML = `
                <div style="padding:10px 14px;">
                    <div class="bb-si-wrap" style="position:relative;">
                        <span class="bb-si-icon" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);font-size:14px;color:var(--mu);">🔍</span>
                        <input class="bb-si" id="bb-info-search-input" placeholder="기체명 검색" autocomplete="off"
                            style="width:100%; background:var(--sur2); border:1px solid var(--bd2); border-radius:7px; padding:6px 10px 6px 26px; color:var(--tx); font-size:12px; outline:none; font-family:inherit; box-sizing:border-box;">
                    </div>
                    <div id="bb-info-search-list" style="height:240px; overflow-y:auto; margin-top:8px;"></div>
                </div>
            `;

            const inputEl = bodyEl.querySelector('#bb-info-search-input');
            const listBoxEl = bodyEl.querySelector('#bb-info-search-list');
            inputEl.value = _infoSearchQuery;
            renderList(_infoSearchQuery);
            listBoxEl.scrollTop = _infoSearchScroll;
            listBoxEl.addEventListener('scroll', () => { _infoSearchScroll = listBoxEl.scrollTop; });
            inputEl.focus();

            inputEl.addEventListener('input', () => { searchFocusIdx = -1; renderList(inputEl.value); });
            inputEl.addEventListener('keydown', e => {
                const listEl = bodyEl.querySelector('#bb-info-search-list');
                const items = listEl.querySelectorAll('.bb-di[data-rid]');
                if (!items.length) return;
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    searchFocusIdx = Math.min(searchFocusIdx + 1, items.length - 1);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    searchFocusIdx = Math.max(searchFocusIdx - 1, 0);
                } else if (e.key === 'Enter' && searchFocusIdx >= 0) {
                    e.preventDefault();
                    const robot = DB.find(x => x.id === items[searchFocusIdx].dataset.rid);
                    if (robot) {
                        badgeEl.style.display = '';
                        openInfoCardPanel(robot);
                    }
                    return;
                }
                items.forEach((el, i) => el.classList.toggle('bb-di-focus', i === searchFocusIdx));
            });

            panel.classList.add('open');
            panel.style.zIndex = ++topmostZ;
            registerInfoPanelClose();
        }

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
        if (rmMode) { btn.classList.add('rm'); btn.textContent = '완료'; }
        else        { btn.classList.remove('rm'); btn.textContent = '카드 제거'; }
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
    function flashFavFull() {   // 하단 안내 문구를 잠깐 경고로 바꿈 (2.5초)
        const el = document.getElementById('bb-fav');
        if (!el) return;
        el.style.setProperty('--fav-note', `'즐겨찾기는 최대 ${FAV_MAX}대까지 등록할 수 있습니다'`);
        el.classList.add('warn');
        clearTimeout(_favWarnTimer);
        _favWarnTimer = setTimeout(() => { el.style.removeProperty('--fav-note'); el.classList.remove('warn'); }, 2500);
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
    bindDropZone(document.getElementById('bb-list'), false);

    // ============================================================
    // SECTION 12. 검색 & 드롭다운
    // ============================================================
    let ddFocusIdx = -1;

    function showDd() {
        const siEl = document.getElementById('bb-si');
        const ddEl = document.getElementById('bb-dd');
        const q    = siEl.value.trim();
        const res  = DB.filter(r => (q===''||r.name.includes(q)) && !ids.includes(r.id) && !favIds.includes(r.id))
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
    // 창 바깥을 누르면 닫힘 (조회 목록 상태도 함께 정리). 카드/목록의 기체를 눌러 다른 기체를 여는 경우엔 닫혔다가 바로 새로 열림
    document.addEventListener('mousedown', e => {
        const panel = document.getElementById('bb-info-card-panel');
        if (!panel.classList.contains('open')) return;
        if (e.target.closest && e.target.closest('#bb-info-card-panel')) return;
        _infoSearchActive = false;
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
        const ok = await wblDoUpload();
        btn.textContent = ok ? '✅' : '❌';
        setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1500);
    });
    document.getElementById('bb-inforequest-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openInfoSearchMode();
    });

    document.getElementById('bb-sortname-btn').addEventListener('click', () => {
        const byName = (a, b) => {
            const ra = DB.find(x => x.id === a);
            const rb = DB.find(x => x.id === b);
            return (ra?.name || '').localeCompare(rb?.name || '', 'ko', { numeric: true });   // 1호기 < 2호기 < 10호기
        };
        ids.sort(byName);      // 일반 영역
        favIds.sort(byName);   // 즐겨찾기 영역 — 서로 섞이지 않고 각자 정렬
        save();
        render();
    });

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
		}
		renderWalker();

		function goToChar(delta) {
			const leftIdx = parseInt(localStorage.getItem('bb_walker_left_idx'), 10);   // 좌측 주민이 쓰는 캐릭터는 건너뜀
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

		function applyWalkerToggle() {
			walkerEl.style.display = walkerOn ? '' : 'none';
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


    // ── 동숲 주민 2 (제목 박스 왼쪽) ────────────────────────────────
    //  우측 주민과 같은 기능(캐릭터 선택 ‹ ›, 표시 on/off, 선택 저장) — 말풍선만 없음.
    //  우측 주민과 같은 캐릭터는 고를 수 없음: 서로가 쓰는 캐릭터를 건너뛰며 선택하고, 저장값이 겹치면 좌측이 양보.
    (function() {
        const wrapEl = document.getElementById('bb-walker-wrap-l');
        if (!wrapEl) return;
        const el = document.getElementById('bb-walker-l');
        const toggleEl = document.getElementById('bb-walker-l-toggle');
        const N = walkerFiles.length;
        const LEFT_IDX_KEY = 'bb_walker_left_idx', LEFT_ON_KEY = 'bb_walker_left_on';

        const rightIdx = () => {   // 우측 주민의 현재 캐릭터 (우측과 같은 규칙으로 읽음)
            const v = parseInt(localStorage.getItem('bb_walker_idx'), 10);
            return (isNaN(v) || v < 0 || v >= N) ? 0 : v;
        };
        let idx = parseInt(localStorage.getItem(LEFT_IDX_KEY), 10);
        if (isNaN(idx) || idx < 0 || idx >= N || idx === rightIdx()) idx = (rightIdx() + 1) % N;   // 처음이거나 겹치면 우측 다음 캐릭터
        localStorage.setItem(LEFT_IDX_KEY, String(idx));   // 저장해 두어야 우측이 이 캐릭터를 건너뜀

        function variantFile() {   // 우측과 같은 방식: 시간 기준 배리에이션 교체
            const variants = walkerFiles[idx].variants;
            return variants[Math.floor(Date.now() / ROTATE_MS) % variants.length];
        }
        function render() { el.style.backgroundImage = `url('${WALKER_BASE}${variantFile()}')`; }
        render();
        setInterval(render, 60 * 1000);

        function go(delta) {
            let next = idx;
            do { next = (next + delta + N) % N; } while (next === rightIdx());
            idx = next;
            localStorage.setItem(LEFT_IDX_KEY, String(idx));
            render();
        }
        document.getElementById('bb-walker-l-prev').addEventListener('click', e => { e.stopPropagation(); go(-1); });
        document.getElementById('bb-walker-l-next').addEventListener('click', e => { e.stopPropagation(); go(1); });

        // 표시 on/off (기본 ON, 저장)
        let on = localStorage.getItem(LEFT_ON_KEY);
        on = on === null ? true : on === '1';
        function applyToggle() {
            el.style.display = on ? '' : 'none';
            toggleEl.classList.toggle('off', !on);
            toggleEl.textContent = on ? '동숲' : '🚫';
            toggleEl.title = on ? '동숲 주민 끄기' : '동숲 주민 켜기';
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
    //   최근 방전 기체(24H) / 저속충전 기체 TOP5 / 임무 OFF 기체
    //   2분마다 데이터가 갱신될 때 버튼의 숫자 배지와, 열려 있는 목록 창이 함께 새로고침됨 (창을 띄워 둔 채로도)
    //   계산량은 기체 수(≈90대)에 비례하는 반복 몇 번뿐이라 갱신 한 번에 수 ms 수준
    // ============================================================
    const FB_DISCHARGE_PCT = 2;          // 배터리가 이 값(%) 이하에 도달한 뒤 OFF 되면 "방전"
    const FB_DISCHARGE_WINDOW_H = 24;    // 최근 24시간
    const FB_EST_MAX_PCT = 10;           // '방전 추정' 후보: OFF 직전 마지막 기록이 이 값(%) 이하
    const FB_EST_FALLBACK_PCT = 5;       // 하락 속도를 알 수 없을 때는 이 값(%) 이하만 추정
    const FB_EST_MAX_GAP_MIN = 30;       // OFF 직전 기록과 OFF 확인 사이가 이보다 길면(기록 끊김) 추정하지 않음
    const FB_CHG_MIN_MIN = 20;           // 충전 속도를 재려면 연속 충전이 이만큼(분) 이상 관측돼야 함
    const FB_CHG_GAP_MIN = 40;           // 기록이 이 시간(분) 넘게 끊기면 그 사이 충전이 이어졌는지 알 수 없어 그 앞은 자름
    const FB_SLOW_TOP = 5;               // 저속충전 목록에 보여줄 기체 수
    const FB_CHG_PEER_PCT = 15;          // "동급" = 배터리 % 차이가 이 이내인 충전 중 기체
    const FB_CHG_PEER_MIN = 3;           // 동급이 이 수 이상이어야 그 중앙값을 기준으로 삼음 (모자라면 충전 중 전체 중앙값)
    const FB_CHG_BUF_MS = 3 * 3600 * 1000;

    const fbEsc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const fbMedian = arr => { const a = [...arr].sort((x, y) => x - y), m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };
    function fbFmtTs(ts) {
        const d = new Date(ts), p = n => String(n).padStart(2, '0');
        return `${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
    }
    // 배터리 로그 점 → 실제 시각(ms). 로그의 하루는 03:00 시작 ~ 익일 03:00 (00~02시 표기는 다음 날로 봄)
    function fbPointTs(dayKey, t) {
        const [y, m, d] = dayKey.split('-').map(Number);
        return new Date(y, m - 1, d).getTime() + wblDayAdjMin(t) * 60000;
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

    // ── 최근 방전 기체(24H): 배터리 로그에서 FB_DISCHARGE_PCT% 이하 → OFF 로 이어진 기체 ──
    function fbLoadLogs() {   // 어제 스냅샷 + 오늘 로그를 기체별 시간순 점으로 (같은 시각이 겹치면 오늘 것이 우선)
        const byId = new Map();
        [wblLoadYesterdaySnapshot(), wblLoad()].forEach(data => {
            if (!data || !data.day || !data.entries) return;
            Object.entries(data.entries).forEach(([id, e]) => {
                let o = byId.get(id);
                if (!o) { o = { name: e.name, pts: new Map() }; byId.set(id, o); }
                (e.log || []).forEach(p => { const ts = fbPointTs(data.day, p.t); o.pts.set(ts, { ts, st: p.status, bat: p.battery }); });
            });
        });
        return byId;
    }
    // OFF 직전 마지막 기록(pts[i])이 방전인지 판정:
    //   'sure' = 2% 이하가 기록된 뒤 OFF (방전) / 'est' = 로그(10분 간격) 사이에 2%~0%를 지나친 것으로 보임 (방전 추정) / null = 방전 아님
    function fbDischargeKind(pts, i, offTs) {
        const p = pts[i];
        if (p.st === 'off' || p.bat == null) return null;
        if (p.bat <= FB_DISCHARGE_PCT) return 'sure';
        if (p.st === 'charging' || p.bat > FB_EST_MAX_PCT) return null;   // 충전 중에 꺼졌거나 아직 배터리가 넉넉하면 방전으로 보지 않음
        const gapMin = (offTs - p.ts) / 60000;
        if (gapMin > FB_EST_MAX_GAP_MIN) return null;                       // 기록이 오래 끊겼으면 알 수 없음
        let rate = 0;                                                       // 이 기체의 직전(40분 이내) 하락 속도 (%/분)
        for (let k = i - 1; k >= 0 && p.ts - pts[k].ts <= 40 * 60000; k--) {
            const o = pts[k];
            if (o.st === 'off' || o.st === 'charging' || o.bat == null) break;
            const r = (o.bat - p.bat) / ((p.ts - o.ts) / 60000);
            if (r > 0) rate = r;
        }
        if (rate > 0) return p.bat - rate * gapMin <= FB_DISCHARGE_PCT ? 'est' : null;   // 그 속도라면 OFF 시점엔 2% 이하가 됐을까
        return p.bat <= FB_EST_FALLBACK_PCT ? 'est' : null;                              // 속도를 모르면 5% 이하만
    }
    function computeDischarged(logs) {
        const now = Date.now(), from = now - FB_DISCHARGE_WINDOW_H * 3600000;
        const curById = new Map(DB.map(r => [r.id, r]));
        const events = [];
        let earliest = Infinity;
        logs.forEach((o, id) => {
            const pts = [...o.pts.values()].sort((a, b) => a.ts - b.ts);
            if (pts.length && pts[0].ts < earliest) earliest = pts[0].ts;
            const cur = curById.get(id);
            let ev = null, count = 0;
            for (let i = 0; i < pts.length - 1; i++) {
                const p = pts[i], q = pts[i + 1];
                if (q.ts < from || q.st !== 'off') continue;
                const kind = fbDischargeKind(pts, i, q.ts);
                if (kind) { ev = { ts: q.ts, lastBat: p.bat, exact: false, kind }; count++; }
            }
            // 방금 꺼져서 로그에 OFF 칸이 아직 없는 경우: 지금 OFF → 마지막 통신 시각(서버 시각)을 OFF 시각으로
            const last = pts[pts.length - 1];
            if (cur && cur.status === 'off' && last && last.st !== 'off' && last.ts >= from) {
                const lc = Date.parse(cur.raw?.robotStatus?.lastConnectedAt || '');
                const exact = !!lc && lc >= last.ts;
                const kind = fbDischargeKind(pts, pts.length - 1, exact ? lc : last.ts + 10 * 60000);
                if (kind) { ev = { ts: exact ? lc : last.ts, lastBat: last.bat, exact, kind }; count++; }
            }
            if (ev) events.push({ id, name: cur?.name || o.name, cur, count, ...ev });
        });
        events.sort((a, b) => b.ts - a.ts);
        return { events, earliest, from, sure: events.filter(e => e.kind === 'sure').length, est: events.filter(e => e.kind === 'est').length };
    }

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
            dis: computeDischarged(logs),
            sc: computeSlowCharge(logs),
            mo: DB.filter(isMissionOff).sort((a, b) => a.name.localeCompare(b.name, 'ko', { numeric: true })),
        };
        return _fbData;
    }
    function fbSetBadge(btnId, n, cls) {
        const b = document.querySelector(`#${btnId} .bb-fb-n`);
        if (!b) return;
        b.textContent = n > 99 ? '99+' : String(n);
        b.className = 'bb-fb-n' + (n > 0 ? ` on ${cls}` : '');
    }
    function fbStateChip(cur) {
        if (!cur) return { ac: 'var(--mu)', txt: '조회 불가' };
        return { ac: STATUS_AC[cur.status] || 'var(--mu)', txt: `${STL[cur.status] || ''}${cur.status !== 'off' ? ` ${cur.battery}%` : ''}` };
    }
    function fbHtmlDis(d) {
        const ev = d.dis.events;
        let h = `<div class="bb-fbp-note">최근 24시간 로그에서 <b>${FB_DISCHARGE_PCT}% 이하까지 떨어진 뒤 꺼진</b> 기체입니다. 10분 기록 사이에 지나친 것으로 보이면 <b>방전 추정</b>으로 표시합니다.</div>`;
        if (!ev.length) h += `<div class="bb-fbp-empty">최근 24시간 동안 방전된 기체가 없습니다 ✓</div>`;
        else h += ev.map(e => {
            const st = fbStateChip(e.cur);
            const est = e.kind === 'est';
            const tip = est ? `${e.name} · 마지막 기록 ${e.lastBat}% 다음 10분 사이에 꺼짐 — 하락 속도로 보면 0%에 도달했을 가능성이 커서 방전으로 추정` : e.name;
            return `<div class="bb-fbp-row" data-rid="${fbEsc(e.id)}" title="${fbEsc(tip)}">
                <span class="bb-fbp-dot" style="background:${st.ac};"></span>
                <span class="bb-fbp-main">
                    <span class="bb-fbp-line"><span class="bb-fbp-name">${fbEsc(e.name)}</span><span class="bb-fbp-tag ${est ? 'est' : 'sure'}">${est ? '방전 추정' : '방전'}</span></span>
                    <span class="bb-fbp-sub">${fbFmtTs(e.ts)}${e.exact ? '' : '경'} OFF · 마지막 배터리 ${e.lastBat}%${e.count > 1 ? ` · 24시간 내 ${e.count}회` : ''}</span>
                </span>
                <span class="bb-fbp-now">현재 ${fbEsc(st.txt)}</span>
            </div>`;
        }).join('');
        let foot = '※ 시각은 10분 간격 로그 기준이라 "경"으로 표시됩니다.';
        if (isFinite(d.dis.earliest) && d.dis.earliest > d.dis.from + 3600000) foot = `※ 로그가 있는 범위: ${fbFmtTs(d.dis.earliest)}부터. ` + foot;
        return h + `<div class="bb-fbp-foot">${foot}</div>`;
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
        if (!sc.measured) return h + `<div class="bb-fbp-empty">충전 속도를 측정 중입니다<br><span style="font-size:11px;font-weight:600;">충전 ${FB_CHG_MIN_MIN}분 이상 지나야 계산됩니다 · 충전 중 ${sc.charging}대</span></div>`;
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
        return h + `<div class="bb-fbp-foot">충전 중 ${sc.charging}대 · 측정 ${sc.measured}대${sc.measuring ? ` · 측정 중 ${sc.measuring}대` : ''}</div>`;
    }
    function fbHtmlMoff(d) {
        if (!d.mo.length) return `<div class="bb-fbp-empty">현재 임무 OFF 인 기체가 없습니다 ✓</div>`;
        return d.mo.map(r => {
            const st = fbStateChip(r);
            return `<div class="bb-fbp-row" data-rid="${fbEsc(r.id)}" title="${fbEsc(r.name)}">
                <span class="bb-fbp-dot" style="background:${st.ac};"></span>
                <span class="bb-fbp-main"><span class="bb-fbp-name">${fbEsc(r.name)}</span></span>
                <span class="bb-fbp-now">${fbEsc(st.txt)}</span>
            </div>`;
        }).join('');
    }
    function fbRender() {
        const pop = document.getElementById('bb-fbp');
        if (!pop) return;
        document.querySelectorAll('#bb-fixbtns .bb-fb').forEach(b => b.classList.toggle('active', b.dataset.mode === _fbMode));
        pop.classList.toggle('open', !!_fbMode);
        if (!_fbMode) return;
        const d = _fbData || fbCompute();
        const T = {
            dis:  ['최근 방전 기체 (24H)',   `${d.dis.events.length}대${d.dis.est ? ` (추정 ${d.dis.est}대 포함)` : ''}`],
            slow: ['저속충전 기체 TOP5',     `충전 중 ${d.sc.charging}대`],
            moff: ['임무 OFF 기체',          `${d.mo.length}대`],
        }[_fbMode];
        document.getElementById('bb-fbp-title').textContent = T[0];
        document.getElementById('bb-fbp-cnt').textContent = T[1];
        const body = document.getElementById('bb-fbp-body');
        const keep = body.scrollTop;   // 2분마다 새로 그려도 보던 위치 유지
        body.innerHTML = _fbMode === 'dis' ? fbHtmlDis(d) : _fbMode === 'slow' ? fbHtmlSlow(d) : fbHtmlMoff(d);
        body.scrollTop = keep;
    }
    function refreshFixedTools() {   // 2분 갱신마다 + 열 때마다 호출: 배지와 (열려 있다면) 목록 창을 최신으로
        try {
            fbCompute();
            fbSetBadge('bb-fb-dis', _fbData.dis.events.length, _fbData.dis.sure > 0 ? 'r' : 'o');   // 확정 방전이 있으면 빨강, 추정만 있으면 주황
            fbSetBadge('bb-fb-slow', _fbData.sc.severe, 'r');
            fbSetBadge('bb-fb-moff', _fbData.mo.length, 'o');
            fbRender();
        } catch (err) { console.error('[BB] 고정 버튼 갱신 오류:', err); }
    }
    document.querySelectorAll('#bb-fixbtns .bb-fb').forEach(btn => btn.addEventListener('click', () => {
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
        if (e.target.closest && e.target.closest('#bb-fixbtns, #bb-info-card-panel')) return;
        _fbMode = null;
        fbRender();
    }, true);
    _fbReady = true;
    refreshFixedTools();

    // ── 줌 기능
    (function() {
        const ZOOM_KEY = 'bb_zoom', ZOOM_MIN = 0.8, ZOOM_MAX = 1.3, ZOOM_STEP = 0.1;
        let zoom = parseFloat(localStorage.getItem(ZOOM_KEY)) || 1.0;

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
            const zoom = parseFloat(localStorage.getItem('bb_zoom')) || 1.0;
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
    setTimeout(() => {
        const _token = localStorage.getItem('AccessToken');
        if (_token) {
            document.dispatchEvent(new CustomEvent('bb_token', {
                detail: JSON.stringify({ token: _token, siteIds: SITE_IDS })
            }));
            console.log('[BB] bb_token 발송 완료');
        } else {
            console.log('[BB] AccessToken 없음');
        }
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
    const PATROL_LIVE_URL = 'https://gist.githubusercontent.com/ubase00070/bd7773a059217fb81b0be90c961fcc22/raw/patrol_watch_live.json';
    const PATROL_REFRESH_MS = 30 * 1000;   // 30초마다 조회 (NCC API 와 무관 — gist 파일만 읽음)
    let _patrolBusy = false;
    let _patrolSig = null;
    let _patrolLastUpdated = null;

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
        '중앙대': ['중앙대학교 1호기', '두루아이 2호기'],
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
    };

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
    function buildPatrolCards(records, refMin = null) {
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
                    poi: p.poi || r.poi_text || '-',
                    act: p.act,
                    unit: p.unit,
                    full: r.robot_full || '',   // NCC 기체명(전체) — Worker 가 내려줌
                    start: r.start_hhmm || '',   // 순찰 시작 시각 (Worker 의 start_hhmm)
                    age: patrolAgeMin(r.start_hhmm, refMin),   // 시작 후 경과 분 (작을수록 최근)
                    tip: `${r.robot} | 시작 ${r.start_hhmm || '-'} | ${r.poi_text || ''}` + (limit !== undefined ? ` | 허용 ${limit}분` : '') + ' | 클릭: 기체 정보',
                };
            })
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

            // 1줄: 기체명 · 순찰 중 ··· 요원
            const l1 = mk('div', 'bb-mm-l1');
            const st = mk('span', 'bb-mm-st');
            st.append(mk('span', 'bb-mm-dot'), document.createTextNode('순찰 중'));
            l1.append(
                mk('span', 'bb-mm-name', c.robot),
                st,
                ...(c.start ? [mk('span', 'bb-mm-since', `${c.start}부터`)] : []),   // 예: 22:35부터 (순찰 중 옆)
                mk('span', 'bb-mm-staff', c.staff.length ? c.staff.join('·') : '담당 없음')
            );

            // 2줄: 현재 POI ··· N분째 POI 미갱신(이상일 때만, 우측)
            const l2 = mk('div', 'bb-mm-l2');
            l2.append(mk('span', 'bb-mm-poi', c.poi));
            if (c.act) l2.append(mk('span', 'bb-mm-act', c.act));
            if (c.anomaly) l2.append(mk('span', 'bb-mm-stale', `${c.stale}분째 POI 미갱신`));

            el.append(l1, l2);
            el.addEventListener('click', () => openPatrolRobotInfo(c));   // 클릭 → 기체 정보 창
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
        const note = document.createElement('span');
        note.className = 'bb-mm-note';   // 대수 옆 작은 설명
        note.textContent = ' (POI 정체 감지 중)';
        t.append('다중 모니터링 기체 ', n, note);
    }

    async function refreshPatrolLive() {
        if (_patrolBusy) return;
        _patrolBusy = true;
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 15000);
        try {
            const res = await fetch(`${PATROL_LIVE_URL}?t=${Date.now()}`, { cache: 'no-store', signal: ctrl.signal });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            if (!data || !Array.isArray(data.records)) throw new Error('데이터 형식 오류');

            _patrolLastUpdated = data.updated_at || null;
            const cards = buildPatrolCards(data.records, patrolHm(data.updated_at));   // 기준 = Worker 가 게시한 시각(KST)
            const sig = JSON.stringify(cards);
            if (sig !== _patrolSig) {   // 바뀐 게 없으면 다시 그리지 않음 (점멸 애니메이션/스크롤 유지)
                _patrolSig = sig;
                renderPatrolCards(cards);
            }
            setPatrolTitle(cards.length);
            setPatrolStatus(`${_patrolLastUpdated || '-'} 기준`, false);   // 게시 시각만 그대로 표시
        } catch (e) {
            console.warn('[BB] 다중 모니터링 갱신 실패:', e.message);
            setPatrolStatus(_patrolLastUpdated
                ? `⚠ 불러오기 실패 · 마지막 ${_patrolLastUpdated} 기준`
                : '⚠ 불러오기 실패', true);
        } finally {
            clearTimeout(timer);
            _patrolBusy = false;
        }
    }
    // 보드가 열려 있을 때만 조회 (닫혀 있으면 요청 없음). 열 때(openBoard)마다 즉시 한 번 더 조회
    setInterval(() => { if (isOpen) refreshPatrolLive(); }, PATROL_REFRESH_MS);
    _patrolReady = true;
    if (isOpen) refreshPatrolLive();

    render();
    if (_trimNotice) {
        alert(`기체 카드는 최대 ${MAX}대까지라서, 저장돼 있던 목록에서 뒤쪽 ${_trimNotice}대를 뺐습니다.\n필요한 기체는 오른쪽 위 검색창에서 다시 추가해 주세요.`);
        _trimNotice = 0;
    }
    // [주석처리: 동숲] applyCampingBackground();

})();

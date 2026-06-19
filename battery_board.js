/* ============================================================
   battery_board.js v2.0
   뉴비고 배터리 현황판 — 템퍼몽키 inject용
   알림 기능 추가: 대기중 이상 / 배터리 부족 / ON/OFF 반복 / 좀비 상태
   ============================================================ */

(function () {
    'use strict';

    // ============================================================
    // SECTION 0. 스타일
    // ============================================================
    const style = document.createElement('style');
    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&family=Noto+Sans+KR:wght@400;500;700&display=swap');
        :root {
            --bg:#0d0d0f; --sur:#141416; --sur2:#1a1a1e;
            --bd:#242428; --bd2:#2e2e34; --tx:#e8e8f0; --mu:#52525e;
            --gn:#22c55e; --gn2:rgba(34,197,94,.10);
            --bl:#3b82f6; --bl2:rgba(59,130,246,.10);
            --wh:rgba(240,240,255,.06); --gy:#4b5563; --gy2:rgba(75,85,99,.12);
            --rd:#ef4444; --rd2:rgba(239,68,68,.12); --ye:#fbbf24;
            --or:#f97316; --or2:rgba(249,115,22,.12);
            --pk:#ec4899; --pk2:rgba(236,72,153,.10);
        }
        #bb-wrap * { box-sizing:border-box; }

        /* ── 메인 패널 ── */
        #bb {
            display:none; position:fixed; top:50%; left:50%;
            transform:translate(-50%,-50%);
            width:920px; background:var(--bg);
            border:1px solid var(--bd2); border-radius:16px;
            box-shadow:0 24px 60px rgba(0,0,0,.75);
            z-index:9999999; font-family:'Lato','Noto Sans KR',sans-serif;
            color:var(--tx); flex-direction:column;
        }
        #bb.open { display:flex; }
        .bb-hd {
            display:flex; flex-direction:column; align-items:center;
            padding:11px 14px 9px; border-bottom:1px solid var(--bd);
            background:var(--sur); border-radius:16px 16px 0 0;
            flex-shrink:0; position:relative; gap:3px;
        }
        @keyframes bb-pink-flow {
            0%   { background-position: 0% 50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .bb-title-gradient {
            background: linear-gradient(90deg, #fce7f3, #ec4899, #db2777, #ec4899, #fce7f3);
            background-size: 200% 200%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: bb-pink-flow 3s ease infinite;
        }
        .bb-hd-title { font-size:20px; font-weight:900; color:var(--tx); display:flex; align-items:center; gap:7px; }
        .bb-dot { width:7px; height:7px; border-radius:50%; background:var(--gn); animation:bb-blink 2s infinite; }
        .bb-dot.err { background:var(--rd); }
        @keyframes bb-blink { 0%,100%{opacity:1} 50%{opacity:.2} }
        .bb-hd-time { display:flex; align-items:baseline; gap:8px; }
        .bb-clock { font-family:'Lato',monospace; font-size:13px; font-weight:900; color:var(--mu); letter-spacing:.8px; }
        .bb-ref   { font-size:12px; color:var(--mu); font-weight:700; }
        .bb-hd-right { position:absolute; right:14px; top:50%; transform:translateY(-50%); display:flex; align-items:center; gap:7px; }
        .bb-hd-left  { position:absolute; left:14px; top:50%; transform:translateY(-50%); display:flex; align-items:center; }

        /* ── 알림 버튼 ── */
        .bb-alert-btn {
            padding:5px 10px; border-radius:6px;
            border:1px solid var(--bd2); background:var(--sur2);
            color:var(--mu); font-size:15px; font-weight:700;
            font-family:'Lato','Noto Sans KR',sans-serif;
            cursor:pointer; transition:all .15s;
            display:flex; align-items:center; gap:5px;
        }
        .bb-alert-btn.has-alert {
            border-color:var(--rd); color:var(--rd); background:var(--rd2);
            animation:bb-alertPulse 1s infinite;
        }
        @keyframes bb-alertPulse {
            0%,100% { border-color:var(--rd); box-shadow:0 0 0 1px var(--rd); }
            50%     { border-color:transparent; box-shadow:none; }
        }
        .bb-alert-count {
            background:var(--rd); color:#fff; border-radius:9px;
            padding:0 5px; font-size:14px; font-weight:900;
            min-width:18px; text-align:center;
        }
        .bb-alert-btn:not(.has-alert) .bb-alert-count { background:var(--bd2); color:var(--tx); }

        /* ── 공통 버튼 ── */
        .bb-src-badge { font-size:12px; font-weight:700; padding:2px 7px; border-radius:4px; letter-spacing:.4px; }
        .bb-src-badge.rest { background:rgba(34,197,94,.15); color:var(--gn); border:1px solid rgba(34,197,94,.3); }
        .bb-src-badge.idle { background:var(--gy2); color:var(--mu); border:1px solid rgba(75,85,99,.3); }
        .bb-src-badge.err  { background:var(--rd2); color:var(--rd); border:1px solid rgba(239,68,68,.3); }
        .bb-btn {
            padding:5px 14px; border-radius:6px; border:1px solid var(--bd2);
            background:var(--sur2); color:var(--tx); font-size:12px;
            font-family:'Lato','Noto Sans KR',sans-serif;
            font-weight:700; cursor:pointer; transition:all .15s; white-space:nowrap;
        }
        .bb-btn:hover { border-color:var(--mu); background:var(--bd); }
        .bb-btn.rm { border-color:var(--rd); color:var(--rd); background:var(--rd2); }
        .bb-btn.rm:hover { background:rgba(239,68,68,.25); }
        .bb-btn.so { border-color:rgba(251,191,36,.4); color:var(--ye); background:rgba(251,191,36,.08); }
        .bb-btn.so:hover { background:rgba(251,191,36,.18); }
        .bb-xbtn {
            width:24px; height:24px; border-radius:6px;
            background:rgba(239,68,68,.15); border:1px solid rgba(239,68,68,.3);
            color:var(--rd); font-size:13px; cursor:pointer;
            display:flex; align-items:center; justify-content:center;
            font-weight:900; transition:background .15s;
        }
        .bb-xbtn:hover { background:rgba(239,68,68,.3); }

        /* ── 검색창 ── */
        .bb-sb { padding:7px 12px; border-bottom:1px solid var(--bd); flex-shrink:0; background:var(--bg); position:relative; overflow:visible; z-index:100; }
        .bb-si {
            width:100%; background:var(--sur2); border:1px solid var(--bd2);
            border-radius:7px; padding:6px 10px 6px 28px;
            color:var(--tx); font-size:13px;
            font-family:'Lato','Noto Sans KR',sans-serif;
            outline:none; transition:border-color .2s;
        }
        .bb-si:focus { border-color:var(--bl); }
        .bb-si::placeholder { color:var(--mu); }
        .bb-si-icon { position:absolute; left:21px; top:50%; transform:translateY(-50%); font-size:13px; color:var(--mu); pointer-events:none; }
        #bb-dd {
            position:absolute; top:100%; left:0; right:0;
            background:var(--sur2); border:1px solid var(--bd2);
            border-radius:0 0 8px 8px; max-height:240px; overflow-y:auto;
            z-index:999999999; display:none; box-shadow:0 8px 24px rgba(0,0,0,.7);
        }
        #bb-dd.open { display:block; }
        .bb-di {
            padding:8px 13px; font-size:13px; font-weight:700; cursor:pointer;
            display:flex; justify-content:space-between; align-items:center;
            border-bottom:1px solid var(--bd); transition:background .1s;
        }
        .bb-di:last-child { border-bottom:none; }
        .bb-di:hover { background:var(--bd); }
        .bb-di-plus { font-size:17px; color:var(--gn); font-weight:900; line-height:1; }
        .bb-di.bb-di-focus { background:var(--bd); color:var(--tx); }

        /* ── 카드 그리드 ── */
        .bb-gw { padding:10px 12px; flex-shrink:0; }
        .bb-gr { display:grid; grid-template-columns:repeat(5,1fr); gap:6px; }
        .bb-ca {
            height:76px; background:var(--sur); border:1px solid var(--bd);
            border-radius:9px; padding:8px 11px;
            cursor:grab; transition:border-color .2s,background .2s,opacity .15s;
            position:relative; overflow:hidden;
            display:flex; flex-direction:column; justify-content:space-between;
        }
        .bb-ca:active { cursor:grabbing; }
        .bb-ca::before {
            content:''; position:absolute; top:0; left:0; right:0; height:2px;
            background:var(--ac,var(--gy)); border-radius:9px 9px 0 0;
        }
        .bb-ca:hover { border-color:var(--bd2); }
        .bb-ca.dragging { opacity:.3; }
        .bb-ca.dragover { border-color:var(--bl)!important; box-shadow:0 0 0 1px var(--bl); }
        .bb-ca.selectable { cursor:pointer; }
        .bb-ca.selectable:hover { border-color:rgba(239,68,68,.5); background:rgba(239,68,68,.04); }
        .bb-ca.selected { border-color:var(--rd)!important; background:var(--rd2)!important; box-shadow:0 0 0 1px var(--rd); }
        .bb-ca.selected::after {
            content:'✕'; position:absolute; top:50%; left:50%;
            transform:translate(-50%,-50%);
            color:var(--rd); font-size:22px; font-weight:900; opacity:.9; pointer-events:none;
        }
        .bb-ca.charging   { --ac:var(--gn); background:var(--gn2); }
        .bb-ca.patrolling { --ac:var(--bl); background:var(--bl2); }
        .bb-ca.standby    { --ac:#c8ccd4;  background:var(--wh); }
        .bb-ca.off { --ac:#4b5563; background:#17171c; }
        .bb-ca.loading    { --ac:#52525e;  background:var(--sur); opacity:0.5; }
        .bb-ca.delivering { --ac:var(--pk); background:var(--pk2); }
        .bb-ca.warn-bat   { animation:bb-warnBlink 0.8s infinite; }
        @keyframes bb-warnBlink {
            0%,100% { border-color:var(--rd); box-shadow:0 0 0 1px var(--rd); }
            50%     { border-color:transparent; box-shadow:none; }
        }
        .bb-ca-name { font-size:15px; font-weight:900; color:var(--tx); line-height:1.1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; letter-spacing:-.2px; }
   	  .bb-ca-name.bb-marquee { overflow:visible; animation:bb-marquee 3s linear 0.5s 1 forwards; }
   	  @keyframes bb-marquee {
   		   0%   { transform:translateX(0); }
   			100% { transform:translateX(-60%); }
   	  }
        .bb-ca-mid  { display:flex; justify-content:space-between; align-items:center; }
        .bb-ca-st   { font-size:11px; font-weight:700; color:var(--ac,var(--mu)); display:flex; align-items:center; gap:3px; opacity:.9; }
        .bb-ca-bat  { font-family:'Lato',monospace; font-size:15px; font-weight:900; color:var(--ac,var(--mu)); line-height:1; white-space:nowrap; }
        .bb-ca-bar  { height:4px; background:rgba(255,255,255,.07); border-radius:2px; overflow:hidden; }
        .bb-ca-fill { height:100%; border-radius:2px; background:var(--ac,var(--gy)); transition:width .6s ease; }

        /* ── 푸터 ── */
        .bb-ft {
            padding:8px 14px; border-top:1px solid var(--bd);
            display:flex; justify-content:space-between; align-items:center;
            flex-shrink:0; background:var(--sur); border-radius:0 0 16px 16px;
        }
        .bb-leg { display:flex; gap:12px; }
        .bb-li  { display:flex; align-items:center; gap:4px; font-size:13px; color:var(--mu); font-weight:700; }
        .bb-ld  { width:6px; height:6px; border-radius:50%; }
        .bb-rmhint { font-size:13px; color:var(--rd); font-weight:700; display:none; opacity:.85; }
        .bb-rmhint.show { display:block; }
        /* ── 고정 모니터링 그리드 ── */
        .bb-mg { padding:6px 12px; border-top:1px solid var(--bd); flex-shrink:0; background:var(--bg); }
        .bb-mg-row { display:flex; align-items:center; gap:5px; padding:3px 0; border-bottom:1px solid rgba(255,255,255,.06); }
        .bb-mg-row:last-child { border-bottom:none; }
        .bb-mg-label { font-size:15px; font-weight:900; color:var(--tx); width:140px; flex-shrink:0; letter-spacing:.3px; }
        .bb-mg-icons { display:flex; gap:5px; flex-wrap:wrap; }
        .bb-mi {
            width:30px; height:30px; border-radius:50%;
            border:2px solid var(--ac,var(--gy));
            color:var(--ac,var(--gy)); font-size:12px; font-weight:900;
            display:flex; align-items:center; justify-content:center;
            font-family:'Lato',monospace;
            opacity:0.35; /* OFF 기본값 */
        }

        /* ON 상태 강조 */
        .bb-mi.charging,
        .bb-mi.patrolling,
        .bb-mi.delivering,
        .bb-mi.standby {
            opacity:1;
            border-width:3px;
            box-shadow:0 0 6px var(--ac);
        }

        .bb-mi.off {
            opacity:0.12;
        }
        .bb-mi.charging   { --ac:var(--gn); }
        .bb-mi.patrolling { --ac:var(--bl); }
        .bb-mi.delivering { --ac:var(--pk); }
        .bb-mi.standby    { --ac:#c8ccd4; }

        /* ── 알림 패널 ── */
        #bb-alert-panel {
            display:none; position:fixed;
            top:16px; left:50%; transform:translateX(-50%);
            width:500px; max-height:65vh; overflow-y:auto;
            background:var(--bg); border:1px solid var(--bd2);
            border-radius:12px; box-shadow:0 16px 48px rgba(0,0,0,.85);
            z-index:99999999; font-family:'Lato','Noto Sans KR',sans-serif;
        }
        #bb-alert-panel.open { display:block; }
        .bb-ap-hd {
            padding:11px 14px; border-bottom:1px solid var(--bd);
            background:var(--sur); border-radius:12px 12px 0 0;
            display:flex; justify-content:space-between; align-items:center;
            position:sticky; top:0; z-index:1;
        }
        .bb-ap-title { font-size:15px; font-weight:900; color:var(--tx); }
        .bb-ap-close {
            width:22px; height:22px; border-radius:5px;
            background:rgba(239,68,68,.15); border:1px solid rgba(239,68,68,.3);
            color:var(--rd); font-size:12px; cursor:pointer;
            display:flex; align-items:center; justify-content:center; font-weight:900;
        }
        .bb-ap-section-title {
            padding:8px 14px 4px; font-size:10px; font-weight:900;
            color:var(--mu); letter-spacing:.6px;
        }
        .bb-ap-item {
            padding:9px 14px; display:flex; align-items:center; gap:10px;
            border-bottom:1px solid var(--bd); position:relative;
            transition:background .1s; cursor:default;
        }
        .bb-ap-time {
            font-size:13px; color:var(--mu);
            font-family:'Lato',monospace; white-space:nowrap;
            margin-right:6px;
        }
        .bb-ap-item:last-child { border-bottom:none; }
        .bb-ap-item:hover { background:var(--sur2); }
        .bb-ap-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .bb-ap-dot.rd { background:var(--rd); }
        .bb-ap-dot.ye { background:var(--ye); }
        .bb-ap-dot.or { background:var(--or); }
        .bb-ap-info { display:flex; flex-direction:column; gap:2px; flex:1; }
        .bb-ap-name { font-size:14px; font-weight:900; color:var(--tx); }
        .bb-ap-desc { font-size:13px; color:var(--mu); font-weight:700; }
        .bb-ap-dismiss {
            display:none; padding:3px 8px; border-radius:4px;
            font-size:11px; font-weight:700;
            background:var(--rd2); color:var(--rd);
            border:1px solid rgba(239,68,68,.3); cursor:pointer;
            white-space:nowrap;
        }
        .bb-ap-item:hover .bb-ap-dismiss { display:block; }
        .bb-ap-empty { padding:24px; text-align:center; font-size:13px; color:var(--mu); font-weight:700; }
        .bb-info-btn {
            width:22px; height:22px; border-radius:50%;
            border:1.5px solid var(--mu); color:var(--mu);
            background:transparent; font-size:12px; font-weight:900;
            cursor:pointer; display:flex; align-items:center; justify-content:center;
            transition:all .15s; flex-shrink:0;
        }
        .bb-info-btn:hover { border-color:var(--tx); color:var(--tx); }

        #bb-info-panel {
            display:none; position:absolute; top:0; left:0; right:0; bottom:0;
            background:var(--sur2); border:1px solid var(--bd2);
            border-radius:12px; box-shadow:0 16px 48px rgba(0,0,0,.85);
            z-index:9999999999; padding:16px; overflow-y:auto;
            font-size:15px; line-height:1.8; color:var(--tx);
        }
        #bb-info-panel.open { display:block; }
        .bb-info-hd {
            display:flex; justify-content:space-between; align-items:center;
            margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid var(--bd);
        }
        .bb-info-title { font-size:17px; font-weight:900; }

        /* ── 히스토리 버튼 ── */
        .bb-hist-btn {
            padding:5px 10px; border-radius:6px;
            border:1px solid var(--bd2); background:var(--sur2);
            color:var(--mu); font-size:12px; font-weight:700;
            font-family:'Lato','Noto Sans KR',sans-serif;
            cursor:pointer; transition:all .15s;
            display:flex; align-items:center; gap:5px;
        }
        .bb-hist-btn:hover { border-color:var(--mu); color:var(--tx); }

        /* ── 히스토리 패널 ── */
        #bb-hist-panel {
            display:none; position:fixed;
            top:16px; left:50%; transform:translateX(-50%);
            width:500px; max-height:60vh; overflow-y:auto;
            background:var(--bg); border:1px solid var(--bd2);
            border-radius:12px; box-shadow:0 16px 48px rgba(0,0,0,.85);
            z-index:99999998; font-family:'Lato','Noto Sans KR',sans-serif;
        }
        #bb-hist-panel.open { display:block; }
        .bb-hp-hd {
            padding:11px 14px; border-bottom:1px solid var(--bd);
            background:var(--sur); border-radius:12px 12px 0 0;
            display:flex; justify-content:space-between; align-items:center;
            position:sticky; top:0; z-index:1;
        }
        .bb-hp-title { font-size:13px; font-weight:900; color:var(--tx); }
        .bb-hp-close {
            width:22px; height:22px; border-radius:5px;
            background:rgba(239,68,68,.15); border:1px solid rgba(239,68,68,.3);
            color:var(--rd); font-size:12px; cursor:pointer;
            display:flex; align-items:center; justify-content:center; font-weight:900;
        }
        .bb-hp-menu { padding:8px 14px; display:flex; gap:8px; border-bottom:1px solid var(--bd); flex-wrap:wrap; }
        .bb-hp-menu-btn {
            padding:5px 12px; border-radius:6px; border:1px solid var(--bd2);
            background:var(--sur2); color:var(--mu); font-size:12px; font-weight:700;
            cursor:pointer; transition:all .15s;
        }
        .bb-hp-menu-btn:hover { border-color:var(--mu); color:var(--tx); }
        .bb-hp-menu-btn.active { border-color:var(--bl); color:var(--bl); background:var(--bl2); }
        .bb-hp-body { padding:10px 14px; }
        .bb-hp-month {
            margin-bottom:6px; border:1px solid var(--bd2); border-radius:8px; overflow:hidden;
        }
        .bb-hp-month-hd {
            padding:9px 13px; background:var(--sur2);
            display:flex; justify-content:space-between; align-items:center;
            cursor:pointer; font-size:12px; font-weight:900; color:var(--tx);
            user-select:none;
        }
        .bb-hp-month-hd:hover { background:var(--bd); }
        .bb-hp-month-arrow { font-size:10px; color:var(--mu); transition:transform .2s; }
        .bb-hp-month-arrow.open { transform:rotate(180deg); }
        .bb-hp-month-body { display:none; border-top:1px solid var(--bd); }
        .bb-hp-month-body.open { display:block; }
        .bb-hp-day { padding:7px 13px; border-bottom:1px solid var(--bd); }
        .bb-hp-day:last-child { border-bottom:none; }
        .bb-hp-day-title { font-size:11px; font-weight:900; color:var(--mu); margin-bottom:4px; letter-spacing:.3px; }
        .bb-hp-entry {
            padding:5px 0; display:flex; align-items:center; gap:8px;
            border-bottom:1px solid rgba(255,255,255,.04);
        }
        .bb-hp-entry:last-child { border-bottom:none; }
        .bb-hp-entry-hour { font-size:11px; font-weight:900; color:var(--bl); font-family:'Lato',monospace; width:38px; flex-shrink:0; }
        .bb-hp-entry-name { font-size:12px; font-weight:700; color:var(--tx); flex:1; }
        .bb-hp-entry-badge {
            font-size:10px; font-weight:900; padding:2px 7px; border-radius:4px;
            background:var(--rd2); color:var(--rd); border:1px solid rgba(239,68,68,.3);
        }
        .bb-hp-entry-badge.misplaced {
            background:rgba(251,191,36,.10); color:var(--ye);
            border:1px solid rgba(251,191,36,.3);
        }
        .bb-hp-empty { padding:24px; text-align:center; font-size:12px; color:var(--mu); font-weight:700; }
        .bb-hp-loading { padding:16px; text-align:center; font-size:12px; color:var(--mu); }
        .bb-hp-day.today {
            border: 1px solid rgba(255,255,255,0.35);
            border-radius: 7px;
            padding: 7px 9px;
            margin: 4px 0;
        }
        .bb-hp-day.today .bb-hp-day-title {
            color: #fff;
            font-weight: 900;
        }
    `;
    document.head.appendChild(style);

    // ============================================================
    // SECTION 0b. HTML
    // ============================================================
    const wrap = document.createElement('div');
    wrap.id = 'bb-wrap';
    wrap.innerHTML = `
        <div id="bb">
            <div class="bb-hd">
                <div class="bb-hd-left" style="display:flex;align-items:center;gap:7px;">
                   <button class="bb-alert-btn" id="bb-alertBtn">
                       <span>🚨 알림</span>
                       <span class="bb-alert-count" id="bb-alertCount">0건</span>
                   </button>
                   <button id="bb-zoom-out" style="padding:2px 7px;border-radius:5px;border:1px solid var(--bd2);background:var(--sur2);color:var(--mu);font-size:11px;font-weight:900;cursor:pointer;line-height:1.6;">－</button>
                   <span id="bb-zoom-label" style="font-size:11px;color:var(--mu);font-weight:700;min-width:32px;text-align:center;">100%</span>
                   <button id="bb-zoom-in"  style="padding:2px 7px;border-radius:5px;border:1px solid var(--bd2);background:var(--sur2);color:var(--mu);font-size:11px;font-weight:900;cursor:pointer;line-height:1.6;">＋</button>
               </div>
                <div class="bb-hd-title" id="bb-drag-handle" style="cursor:grab;">
                    <div class="bb-dot" id="bb-dot"></div>
                    <span class="bb-title-gradient">관리자용 배터리 현황판</span><span style="font-size:16px; color:var(--mu);">by CYH</span>
                    <span class="bb-src-badge idle" id="bb-srcBadge">대기</span>
                </div>
                <div class="bb-hd-time">
                    <div class="bb-clock" id="bb-clk">00:00:00</div>
                    <div class="bb-ref" id="bb-ref">— 초 후 갱신</div>
                </div>
                <div class="bb-hd-right">
					<button id="bb-backup-btn" style="padding:2px 8px;border-radius:5px;border:1px solid var(--bd2);background:var(--sur2);color:var(--mu);font-size:11px;font-weight:700;cursor:pointer;">백업</button>
					<button id="bb-restore-btn" style="padding:2px 8px;border-radius:5px;border:1px solid var(--bd2);background:var(--sur2);color:var(--mu);font-size:11px;font-weight:700;cursor:pointer;">복원</button>
                    <button class="bb-btn so" id="bb-sortBtn">가나다 순</button>
                    <button class="bb-btn" id="bb-rmbtn">제거</button>
                    <div class="bb-xbtn" id="bb-closebtn">✕</div>
                </div>
            </div>
            <div class="bb-sb" id="bb-sb">
                <span class="bb-si-icon">🔍</span>
                <input class="bb-si" id="bb-si" placeholder="기체명 검색 후 클릭하여 추가" autocomplete="off">
                <div id="bb-dd"></div>
            </div>
            <div class="bb-gw"><div class="bb-gr" id="bb-gr"></div></div>
            <div class="bb-mg" id="bb-mg">
                <div class="bb-mg-row">
                    <div class="bb-mg-label">역삼 요기요</div>
                    <div class="bb-mg-icons" id="bb-mg-yeoksam"></div>
                </div>
                <div class="bb-mg-row">
                    <div class="bb-mg-label">송도 요기요</div>
                    <div class="bb-mg-icons" id="bb-mg-songdo"></div>
                </div>
                <div class="bb-mg-row">
                    <div class="bb-mg-label">성수 요기요</div>
                    <div class="bb-mg-icons" id="bb-mg-seongsu"></div>
                </div>
                <div class="bb-mg-row">
                    <div class="bb-mg-label">성남 삼평/서현</div>
                    <div class="bb-mg-icons" id="bb-mg-seongnam"></div>
                </div>
            </div>
            <div class="bb-ft">
                <div class="bb-leg">
                    <div class="bb-li"><div class="bb-ld" style="background:#22c55e"></div>충전 중</div>
                    <div class="bb-li"><div class="bb-ld" style="background:#3b82f6"></div>순찰 중</div>
                    <div class="bb-li"><div class="bb-ld" style="background:#c8ccd4"></div>대기 중</div>
                    <div class="bb-li"><div class="bb-ld" style="background:#ec4899"></div>배달 중</div>
                    <div class="bb-li"><div class="bb-ld" style="background:#eab308;"></div>도킹 중</div>
                    <div class="bb-li"><div class="bb-ld" style="background:#4b5563"></div>OFF</div>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <div class="bb-rmhint" id="bb-rmhint">카드 선택 → 완료로 제거</div>
                    <button class="bb-info-btn" id="bb-infobtn" title="사용 설명서">i</button>
                </div>
            </div>
            <div id="bb-info-panel">
                <div class="bb-info-hd">
                    <div class="bb-info-title">📖 사용 설명서</div>
                    <div class="bb-xbtn" id="bb-info-close">✕</div>
                </div>
                <div id="bb-info-body">
                    <!-- 설명서 내용 작성 -->
                    * 첫 로딩 시에만 10~20초 데이터 전송 시간 필요(오직 '알림 센터' 페이지에서만 작동함)<br>
                    * 다른 페이지로 이동했다면 재접속 또는 새로고침 필수<br>
                    * 추가한 기체 카드와 배치는 로컬 스토리지에 저장됨(최대 24대. 드래그로 배치 변경가능)<br>
                    * 알림 전송 조건<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- 배터리 21% 이하 기체<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- 배달 사이트 기체가 아닌데 120분이상 ~ 360분 미만 대기 상태로 방치된 경우(배터리 50% 미만이면 360분 지났어도 알림 발생)<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- 순찰 시간이 유동적인 사이트 기체가 순찰 시작 시간대에 10분이상 머무는 경우(ex. 리센츠, 엘스 등)<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- 무선 도킹됨 상태 기체<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- 최근 10분 동안 ON/OFF를 3회 이상 반복한 경우<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- 전원ON인데 배터리, GPS 수신값이 잡히지 않는 경우(좀비 의심)<br>
                    * 하단 고정 바: 역삼, 송도, 성수, 삼평서현 ON/OFF 및 상태 확인용 퀵메뉴<br>
                    * 개선 피드백 받습니다(수정 시 자동 실시간 반영).
                </div>
            </div>
        </div>

        <!-- 알림 패널 -->
        <div id="bb-alert-panel">
            <div class="bb-ap-hd">
                <div class="bb-ap-title">🚨 상태 이상 알림</div>
                <div class="bb-ap-close" id="bb-ap-close">✕</div>
            </div>
            <div id="bb-ap-body">
                <div class="bb-ap-empty">이상 없음 ✓</div>
            </div>
        </div>

        <!-- 히스토리 패널 -->
        <div id="bb-hist-panel">
            <div class="bb-hp-hd">
                <div class="bb-hp-title">📋 히스토리</div>
                <div class="bb-hp-close" id="bb-hp-close">✕</div>
            </div>
            <div class="bb-hp-menu">
                <button class="bb-hp-menu-btn active" id="bb-hp-btn-video">다중 영상</button>
                <button class="bb-hp-menu-btn" id="bb-hp-btn-hw">뉴비슈 HW</button>
                <button class="bb-hp-menu-btn" id="bb-hp-btn-sw">뉴비슈 SW</button>
            </div>
            <div class="bb-hp-body" id="bb-hp-body">
            </div>
        </div>
    `;
    document.body.appendChild(wrap);

    // ============================================================
    // SECTION 1. 상수 & 상태
    // ============================================================
    const MAX = 30;
    const LS         = 'bb_ids';  // 터치 금지
    const LS_TOGGLE  = 'bb_toggles'; // 터치 금지
    const LS_ZOMBIE  = 'bb_zombie'; // 터치 금지
    const STL = { charging:'충전 중', patrolling:'순찰 중', delivering:'배달 중', standby:'대기 중', docking:'도킹 중', off:'OFF' };
    const STI = { charging:'🟢', patrolling:'🔵', delivering:'🩷', standby:'⚪', docking:'🟡', off:'⚫' };
    const DELIVERY_TYPES = ['ALL', 'OPENAPI_DELIVERY', 'NB_ORDER_DELIVERY', 'DELIVERY'];
    const DELIVERY_SITE_IDS = [
        25,27,44,47,48,53,56,65,86,109,118,141,180,
    ];
    const SITE_IDS = [
        24,25,27,36,37,40,42,44,45,46,47,48,50,53,56,57,62,64,
        65,66,72,75,82,86,100,105,108,109,111,117,118,126,131,
        132,134,138,140,141,142,143,144,145,146,150,151,171,
        177,179,180,181,182,187,193,196,202,203,214,216,221,224,
    ];

    const MONITOR_GROUPS = [
        { id:'yeoksam',  label:'역삼 요기요',      keywords:['역삼 요기요'] },
        { id:'songdo',   label:'송도 요기요',      keywords:['송도 요기요'] },
        { id:'seongsu',  label:'성수 요기요',      keywords:['성수 요기요'] },
        { id:'seongnam', label:'성남 삼평&서현', keywords:['성남시'] },
    ];

    let DB = [];
    let ids = load();
    let rmMode = false, rmSet = new Set(), isOpen = false, dataSource = 'idle';
    let fetchLock = false;
    let lastRaw = [];

    let topmostZ = 100000000;

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
    let currentAlerts = [];

    // ============================================================
    // SECTION 2. localStorage 헬퍼
    // ============================================================
    function load() {
        try {
            const s = localStorage.getItem(LS);
            if (!s) return [];
            const p = JSON.parse(s);
            return Array.isArray(p) ? p.slice(0, MAX) : [];
        } catch { return []; }
    }
    function save() { localStorage.setItem(LS, JSON.stringify(ids)); }

    function loadToggles() { try { return JSON.parse(localStorage.getItem(LS_TOGGLE) || '{}'); } catch { return {}; } }
    function saveToggles(d) { localStorage.setItem(LS_TOGGLE, JSON.stringify(d)); }
    function loadZombie()  { try { return JSON.parse(localStorage.getItem(LS_ZOMBIE)  || '{}'); } catch { return {}; } }
    function saveZombie(d) { localStorage.setItem(LS_ZOMBIE, JSON.stringify(d)); }

    // 1시간 이전 토글 로그 자동 정리
    function cleanToggles() {
        const cutoff = Date.now() - 60 * 60 * 1000;
        const t = loadToggles();
        Object.keys(t).forEach(id => {
            t[id] = t[id].filter(x => x.time > cutoff);
            if (!t[id].length) delete t[id];
        });
        saveToggles(t);
    }

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
        } else if (['PATROL','OPENAPI_PATROL'].includes(raw.service?.serviceType)) {
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

    // ── 기능7: 순찰 미시작 감지 전역 상태 ──────────────────
    const posHistory = new Map();
    // { "robotId": { lat, lon, count, alertedAt } }

    const PATROL_SCHEDULE = {
        46 : [9, 14, 19],
        66 : [9, 15, 21],
        72 : [9, 14, 20],
        75 : [10, 16, 19, 0],
        105: [9, 14, 16, 22, 2],
        108: [14, 1],
        126: [17, 20, 23, 2, 5],
    };

    function getDistanceMeters(lat1, lon1, lat2, lon2) {
        const R    = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a    = Math.sin(dLat/2) ** 2 +
                    Math.cos(lat1 * Math.PI/180) *
                    Math.cos(lat2 * Math.PI/180) *
                    Math.sin(dLon/2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    function isPatrolTime(siteId) {
        const hours = PATROL_SCHEDULE[Number(siteId)];
        if (!hours) return false;
        const now  = new Date();
        const nowM = now.getHours() * 60 + now.getMinutes();
        return hours.some(h => {
            const targetM = h * 60;
            const diff    = Math.abs(nowM - targetM);
            const diffW   = Math.min(diff, 1440 - diff); // 자정 경계 처리
            return diffW <= 30;
        });
    }

    function detectAlerts(rawList) {
        const alerts = [];
        const now = Date.now();
        const toggles = loadToggles();
        const zombie  = loadZombie();

        rawList.forEach(raw => {
            const id   = String(raw.id);
            const name = raw.nickname || raw.name || id;
            const rs   = raw.robotStatus ?? {};
            const { status, battery } = parseRobotStatus(raw);
            const isDelivery = 
                DELIVERY_TYPES.includes(raw.service?.serviceType) ||
                DELIVERY_SITE_IDS.includes(raw.site?.id);

            // ── 기능1: 대기중 30분 이상 (배달용 제외) ─────────────
            if (!isDelivery && status === 'standby') {
                const mins = minAgo(rs.lastOperatedAt);
                if (mins >= 120) {
                    // 360분 초과 + 배터리 50% 이상 → 충전 후 대기 중인 기체(야간/경비실 보관) → 알림 제외
                    const isResting = mins >= 360 && battery >= 50;
                    if (!isResting) {
                        const key = alertKey('standby', id);
                        if (!dismissedAlerts.has(key)) alerts.push({
                            key, type:'standby', dot:'rd', name,
                            desc:`대기중 ${mins}분 | 마지막 조작: ${rs.lastOperatedUserName || '없음'} ${fmt(rs.lastOperatedAt)}`,
                            time: fmt(new Date().toISOString())
                        });
                    }
                }
            }

            // ── 기능2: 도킹됐는데 충전 안 되는 경우 ──
            if (status === 'docking') {
                const key = alertKey('docking', id);
                if (!dismissedAlerts.has(key)) alerts.push({
                    key, type:'docking', dot:'ye', name,
                    desc:`무선 도크 위에 있으나 충전 안 됨 | 확인 필요`,
                    time: fmt(new Date().toISOString())
                });
            }

            // ── 기능3: 배터리 21% 이하 (전 기체) ──────────────────
            if (rs.isConnecting && battery > 0 && battery <= 21) {
                const key = alertKey('battery', id);
                if (!dismissedAlerts.has(key)) alerts.push({
                    key, type:'battery', dot:'ye', name,
                    desc:`배터리 ${battery}% | ${STL[status]}`,
                    time: fmt(new Date().toISOString())
                });
            }

            // ── 기능4: ON/OFF 반복 (10분 내 6회 전환) ─────────────
            {
                const prev = toggles[id];
                const prevState = prev?.length ? prev[prev.length - 1].state : null;
                const curState  = rs.isConnecting ? 'on' : 'off';

                if (!prevState) {
                    toggles[id] = [{ state: curState, time: now }];
                } else if (prevState !== curState) {
                    toggles[id] = toggles[id] || [];
                    toggles[id].push({ state: curState, time: now });
                    // 10분 이내만 유지
                    const cutoff10 = now - 10 * 60 * 1000;
                    toggles[id] = toggles[id].filter(t => t.time > cutoff10);
                }

                if (toggles[id] && toggles[id].length >= 6) {
                    const key = alertKey('toggle', id);
                    if (!dismissedAlerts.has(key)) {
                        const lastT = fmt(new Date(toggles[id][toggles[id].length - 1].time).toISOString());
                        alerts.push({
                            key, type:'toggle', dot:'or', name,
                            desc:`ON/OFF 반복 ${Math.floor(toggles[id].length / 2)}회 | 최근 ${lastT}`,
                            time: fmt(new Date(toggles[id][0].time).toISOString())
                        });
                    }
                }
            }

            // ── 기능5: 좀비 상태 (켜짐인데 battery/GPS/속도 없음) ─
            {
                const isZombie =
                    rs.isConnecting === true &&
                    // 배터리: null, undefined, 0 모두 포함
                    !raw.battery &&
                    // GPS: null, undefined 모두 포함 (0은 유효한 값일 수 있음)
                    (rs.navpvtHorzAccuracy == null || rs.navpvtHorzAccuracy === 0) &&
                    // 속도: null, undefined, 0 모두 포함
                    !rs.velocity;

                if (isZombie) {
                    if (!zombie[id]) zombie[id] = { count: 1, firstSeen: now };
                    else zombie[id].count++;
                } else {
                    delete zombie[id];
                }

                // 4회(약 2분) 이상
                if (zombie[id] && zombie[id].count >= 4) {
                    const key = alertKey('zombie', id);
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

            // ── 기능6: 탐지 센서 이상 (가스/열원/객체 등) ──────────
            if (Array.isArray(raw.robotAddons)) {
                const triggered = raw.robotAddons.some(addon =>
                    addon.addonConfig &&
                    Object.keys(addon.addonConfig).length > 0
                );
                if (triggered) {
                    const key = alertKey('detection', id);
                    if (!dismissedAlerts.has(key)) alerts.push({
                        key, type:'detection', dot:'ye', name,
                        desc:`탐지 센서 이상 감지 | 즉시 확인 필요`,
                        time: fmt(new Date().toISOString())
                    });
                }
            }

            // ── 기능7: 순찰 미시작 감지 (좌표 고정 10분) ──────────
            const siteId = raw.site?.id;
            if (
                PATROL_SCHEDULE[siteId] &&          // 감시 대상 사이트
                rs.isConnecting === true &&          // 전원 ON
                isPatrolTime(siteId) &&              // 순찰 시간대
                typeof rs.navpvtHorzAccuracy === 'number' &&
                rs.navpvtHorzAccuracy < 50000 &&    // 야외 판정
                typeof rs.latitude === 'number' &&
                typeof rs.longitude === 'number'
            ) {
                const prev = posHistory.get(id);
                const curLat = rs.latitude;
                const curLon = rs.longitude;

                if (!prev) {
                    // 첫 체크: 기준 좌표 저장, 카운트 0
                    posHistory.set(id, { lat: curLat, lon: curLon, count: 0 });
                } else {
                    const dist = getDistanceMeters(prev.lat, prev.lon, curLat, curLon);
                    if (dist > 10) {
                        // 10m 초과 이동 → 카운트 초기화, 새 좌표 저장
                        posHistory.set(id, { lat: curLat, lon: curLon, count: 0 });
                        dismissedAlerts.delete(alertKey('patrol-fix', id));
                    } else {
                        // 10m 이내 → 카운트 누적
                        prev.count += 1;
                        // 20체크 = 약 10분
                        if (prev.count >= 20) {
                            const key = alertKey('patrol-fix', id);
                            if (!dismissedAlerts.has(key)) alerts.push({
                                key, type:'patrol-fix', dot:'ye', name,
                                desc:`순찰 미시작 의심 — 10분 이상 위치 고정`,
                                time: fmt(new Date().toISOString())
                            });
                        }
                    }
                }
            } else if (!PATROL_SCHEDULE[raw.site?.id]) {
                // 감시 대상 아닌 기체는 이력 삭제 (메모리 정리)
                posHistory.delete(id);
            }
        });

        saveToggles(toggles);
        saveZombie(zombie);
        cleanToggles();
        window._bbAlerts = alerts;
        return alerts;
    }

    // ============================================================
    // SECTION 5. 알림 패널 렌더
    // ============================================================
    function renderAlertPanel(alerts) {
        currentAlerts = alerts;
        const btn   = document.getElementById('bb-alertBtn');
        const count = document.getElementById('bb-alertCount');
        const body  = document.getElementById('bb-ap-body');

        count.textContent = `${alerts.length}건`;
        if (alerts.length > 0) btn.classList.add('has-alert');
        else btn.classList.remove('has-alert');

        if (!document.getElementById('bb-alert-panel').classList.contains('open')) return;

        if (alerts.length === 0) {
            body.innerHTML = '<div class="bb-ap-empty">이상 없음 ✓</div>';
            return;
        }

        const order = { zombie:0, docking:1, standby:2, toggle:3, battery:4 };
        const sorted = [...alerts].sort((a, b) => (order[a.type]??9) - (order[b.type]??9));

        const sections = {
            zombie:  { title:'🔴 좀비 추정', items:[] },
            docking: { title:'🟡 무선 도킹 이상', items:[] },
            standby: { title:'🔴 대기중 이상', items:[] },
            toggle:  { title:'🟠 ON/OFF 반복', items:[] },
            battery: { title:'🟡 배터리 부족', items:[] },
        };
        sorted.forEach(a => { if (sections[a.type]) sections[a.type].items.push(a); });

        body.innerHTML = Object.values(sections)
            .filter(s => s.items.length > 0)
            .map(s => `
                <div class="bb-ap-section-title">${s.title} (${s.items.length}건)</div>
                ${s.items.map(a => `
                    <div class="bb-ap-item" data-key="${a.key}">
                        <div class="bb-ap-dot ${a.dot}"></div>
                        <div class="bb-ap-info">
                            <div class="bb-ap-name">${a.name}</div>
                            <div class="bb-ap-desc">${a.desc}</div>
                        </div>
                        <span class="bb-ap-time">${a.time ?? ''}</span>
                        <button class="bb-ap-dismiss" data-key="${a.key}">해제</button>
                    </div>
                `).join('')}
            `).join('');

        // 해제 버튼 (클릭 or 우클릭)
        body.querySelectorAll('.bb-ap-dismiss').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                dismiss(btn.dataset.key);
            });
        });
        body.querySelectorAll('.bb-ap-item').forEach(item => {
            item.addEventListener('contextmenu', e => {
                e.preventDefault();
                dismiss(item.dataset.key);
            });
        });
    }

    function dismiss(key) {
        dismissedAlerts.add(key);
        // localStorage에 시각과 함께 저장
        try {
            const saved = JSON.parse(localStorage.getItem('bb_dismissed') || '[]');
            saved.push({ key, time: Date.now() });
            localStorage.setItem('bb_dismissed', JSON.stringify(saved));
        } catch {}
        currentAlerts = currentAlerts.filter(a => a.key !== key);
        renderAlertPanel(currentAlerts);
    }

    // ============================================================
    // SECTION 6. bb_robots_data 상시 리스너
    // ============================================================
    document.addEventListener('bb_robots_data', function(e) {
        if (fetchLock) return;
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
                DB.push({ id, name: raw.nickname || raw.name || id, status: parsed.status, battery: parsed.battery, loading: false });
            });
            if (DB.length > 0) {
                ids = ids.filter(id => DB.some(r => r.id === id));
                save();
            }

            const alerts = detectAlerts(allRaw);
            renderAlertPanel(alerts);

            setDataSource('rest');

            renderMonitorGrid(allRaw);

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
        renderMonitorGrid(lastRaw);
        setDataSource(DB.length > 0 ? 'rest' : 'idle');
    }
    function closeBoard() {
        isOpen = false;
        document.getElementById('bb').classList.remove('open');
        document.getElementById('bb-alert-panel').classList.remove('open');
        document.getElementById('bb-hist-panel').classList.remove('open');
        if (rmMode) { rmMode = false; rmSet.clear(); updateRmUI(); }
        hideDd();
    }

    document.addEventListener('keydown', e => {
        if (!e.altKey || e.code !== 'KeyZ') return;
        e.preventDefault();
        const h = location.host;
        const allowed =
            (h === 'go.neubie.ai' && location.pathname.includes('/ko/notification')) ||
            h.endsWith('vercel.app');
        if (!allowed) return;
        isOpen ? closeBoard() : openBoard();
    });

    let _hCount = 0, _hTimer;
    document.addEventListener('keydown', e => {
        if (e.key === 'h' || e.key === 'H') {
            if (_hCount === 0) {
                _hTimer = setTimeout(() => _hCount = 0, 2000); // 2초
            }
            _hCount++;
            if (_hCount >= 5) {
                clearTimeout(_hTimer);
                _hCount = 0;
                const panel = document.getElementById('bb-hist-panel');
                panel.classList.toggle('open');
                if (panel.classList.contains('open')) {
                    panel.style.zIndex = ++topmostZ;
                    histActiveMenu = 'video';
                    ['bb-hp-btn-video','bb-hp-btn-hw','bb-hp-btn-sw'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.classList.remove('active');
                    });
                    document.getElementById('bb-hp-btn-video').classList.add('active');
                    loadHistoryPanel();
                }
            }
        } else {
            // h 아닌 다른 키 누르면 초기화
            clearTimeout(_hTimer);
            _hCount = 0;
        }
    });

    document.getElementById('bb-alertBtn').addEventListener('click', () => {
        const panel = document.getElementById('bb-alert-panel');
        panel.classList.toggle('open');
        if (panel.classList.contains('open')) {
            panel.style.zIndex = ++topmostZ;
            renderAlertPanel(currentAlerts);
        }
    });
    document.getElementById('bb-ap-close').addEventListener('click', () => {
        document.getElementById('bb-alert-panel').classList.remove('open');
    });

    document.getElementById('bb-hp-close').addEventListener('click', () => {
        document.getElementById('bb-hist-panel').classList.remove('open');
    });

    document.getElementById('bb-hp-btn-video').addEventListener('click', () => {
        histActiveMenu = 'video';
        ['bb-hp-btn-video','bb-hp-btn-hw','bb-hp-btn-sw'].forEach(id => {
            document.getElementById(id).classList.remove('active');
        });
        document.getElementById('bb-hp-btn-video').classList.add('active');
        loadVideoHistory();
    });

    // 뉴비슈 HW 버튼
    document.getElementById('bb-hp-btn-hw').addEventListener('click', () => {
        histActiveMenu = 'hw';
        ['bb-hp-btn-video','bb-hp-btn-hw','bb-hp-btn-sw'].forEach(id => {
            document.getElementById(id).classList.remove('active');
        });
        document.getElementById('bb-hp-btn-hw').classList.add('active');
        loadNeubieIssues('hw');
    });

    // 뉴비슈 SW 버튼
    document.getElementById('bb-hp-btn-sw').addEventListener('click', () => {
        histActiveMenu = 'sw';
        ['bb-hp-btn-video','bb-hp-btn-hw','bb-hp-btn-sw'].forEach(id => {
            document.getElementById(id).classList.remove('active');
        });
        document.getElementById('bb-hp-btn-sw').classList.add('active');
        loadNeubieIssues('sw');
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

    const RS = 30; let ns = RS;
    setInterval(() => {
        ns--;
        if (ns <= 0) ns = RS;
        const m = Math.floor(ns / 60), s = ns % 60;
        const el = document.getElementById('bb-ref');
        if (el) el.textContent = m > 0 ? `${m}분 ${String(s).padStart(2,'0')}초 후 갱신` : `${s}초 후 갱신`;
    }, 1000);

    // ============================================================
    // SECTION 8b. 고정 모니터링 그리드 렌더
    // ============================================================
    function renderMonitorGrid(rawList) {
        MONITOR_GROUPS.forEach(group => {
            const el = document.getElementById(`bb-mg-${group.id}`);
            if (!el) return;

            // 키워드로 필터링
            const robots = rawList.filter(r => {
                const name = r.nickname || r.name || '';
                return group.keywords.some(kw => name.includes(kw));
            }).sort((a, b) => {
                const na = a.nickname || a.name || '';
                const nb = b.nickname || b.name || '';
                // 이름에서 숫자 추출해서 정렬
                const na_num = parseInt(na.match(/\d+/)?.[0] || '0');
                const nb_num = parseInt(nb.match(/\d+/)?.[0] || '0');
                return na_num - nb_num;
            });

            el.innerHTML = robots.map((r, i) => {
                const parsed = parseRobotStatus(r);
                const num = r.nickname?.match(/\d+/)?.[0] || (i + 1);
                return `<div class="bb-mi ${parsed.status}" title="${r.nickname || r.name} | ${STL[parsed.status]}">${num}</div>`;
            }).join('');
        });
    }

    // ============================================================
    // SECTION 9. 카드 렌더
    // ============================================================
    function render() {
        const gr = document.getElementById('bb-gr');
        if (!gr) return;
        gr.innerHTML = '';
        ids.forEach(id => {
            const r = DB.find(x => x.id === id);
            if (!r) return;
            gr.appendChild(makeCard(r));
        });
    }

    function makeCard(r) {
        const off    = r.status === 'off';
        const lowBat = !r.loading && !off && r.battery <= 21;
        const c = document.createElement('div');
        c.className = `bb-ca ${r.loading ? 'loading' : r.status}${lowBat ? ' warn-bat' : ''}`;
        c.dataset.id = r.id;
        if (rmMode) c.classList.add('selectable');
        if (rmSet.has(r.id)) c.classList.add('selected');
        c.innerHTML = `
            <div class="bb-ca-name">${r.name}</div>
            <div class="bb-ca-mid">
                <div class="bb-ca-st">${r.loading ? '⏳ 로딩 중' : STI[r.status]+' '+STL[r.status]}</div>
                <div class="bb-ca-bat">${(off||r.loading)?'- %':r.battery+'%'}</div>
            </div>
            <div class="bb-ca-bar"><div class="bb-ca-fill" style="width:${(off||r.loading)?0:r.battery}%"></div></div>
        `;
        if (rmMode) {
            c.onclick = () => toggleSel(r.id);
        } else {
            c.draggable = true;
            c.addEventListener('dragstart', dstart);
            c.addEventListener('dragover',  dover);
            c.addEventListener('dragleave', dleave);
            c.addEventListener('drop',      ddrop);
            c.addEventListener('dragend',   dend);
        }

        // 이름이 잘린 경우에만 호버 마퀴 적용
        const nameEl = c.querySelector('.bb-ca-name');
        c.addEventListener('mouseenter', () => {
            if (nameEl.scrollWidth > nameEl.clientWidth) {
                nameEl.classList.add('bb-marquee');
            }
        });
        c.addEventListener('mouseleave', () => {
            nameEl.classList.remove('bb-marquee');
            // 애니메이션 리셋
            nameEl.style.transform = '';
        });
        return c;
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
        setTimeout(() => { btn.textContent = '가나다 순 정렬'; }, 1200);
    }

    function toggleRm() {
        if (!rmMode) { rmMode = true; rmSet.clear(); }
        else {
            if (rmSet.size > 0) { ids = ids.filter(id => !rmSet.has(id)); save(); }
            rmMode = false; rmSet.clear();
        }
        updateRmUI(); render();
    }

    function updateRmUI() {
        const btn  = document.getElementById('bb-rmbtn');
        const hint = document.getElementById('bb-rmhint');
        if (rmMode) { btn.classList.add('rm'); btn.textContent = '완료'; hint.classList.add('show'); }
        else        { btn.classList.remove('rm'); btn.textContent = '제거'; hint.classList.remove('show'); }
    }

    function toggleSel(id) {
        if (rmSet.has(id)) rmSet.delete(id); else rmSet.add(id);
        render();
    }

    // ============================================================
    // SECTION 11. 드래그앤드롭
    // ============================================================
    let dsrc = null;
    function dstart(e) { dsrc = this.dataset.id; this.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dsrc); }
    function dover(e)  { if (!dsrc || this.dataset.id === dsrc) return; e.preventDefault(); document.querySelectorAll('.bb-ca.dragover').forEach(c => { if (c !== this) c.classList.remove('dragover'); }); this.classList.add('dragover'); }
    function dleave(e) { if (this.contains(e.relatedTarget)) return; this.classList.remove('dragover'); }
    function ddrop(e)  { e.preventDefault(); const tid = this.dataset.id; if (!dsrc || tid === dsrc) return; this.classList.remove('dragover'); const si = ids.indexOf(dsrc), di = ids.indexOf(tid); if (si===-1||di===-1) return; ids.splice(si,1); ids.splice(di,0,dsrc); save(); render(); }
    function dend()    { dsrc = null; document.querySelectorAll('.bb-ca').forEach(c => c.classList.remove('dragging','dragover')); }

    // ============================================================
    // SECTION 12. 검색 & 드롭다운
    // ============================================================
    function showDd() {
        const siEl = document.getElementById('bb-si');
        const ddEl = document.getElementById('bb-dd');
        const q    = siEl.value.trim();
        const res  = DB.filter(r => (q===''||r.name.includes(q)) && !ids.includes(r.id)).sort((a,b) => a.name.localeCompare(b.name,'ko'));

        if (ids.length >= MAX) {
            ddEl.innerHTML = `<div class="bb-di" style="color:var(--mu);cursor:default;">이미 최대 ${MAX}대 등록됨</div>`;
        } else if (res.length === 0) {
            ddEl.innerHTML = `<div class="bb-di" style="color:var(--mu);cursor:default;">${DB.length===0?'기체 데이터 로딩 중...':'검색 결과 없음'}</div>`;
        } else {
            ddEl.innerHTML = res.map(r => `<div class="bb-di" data-rid="${r.id}"><span>${r.name}</span><span class="bb-di-plus">+</span></div>`).join('');
            ddEl.querySelectorAll('.bb-di[data-rid]').forEach(el => {
                el.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); addRobot(el.dataset.rid); });
            });
        }
        ddEl.classList.add('open');
    }

    function hideDd() { const d = document.getElementById('bb-dd'); if (d) d.classList.remove('open'); }
    function addRobot(id) {
        if (ids.length >= MAX) return;
        if (!ids.includes(id)) { ids.push(id); save(); render(); }
        showDd(); document.getElementById('bb-si').focus();
    }

    // ============================================================
    // SECTION 13. 배지
    // ============================================================
    function setDataSource(src) {
        dataSource = src;
        const badge = document.getElementById('bb-srcBadge');
        const dot   = document.getElementById('bb-dot');
        const labels = { rest:'REST API', idle:'대기', err:'연결 실패' };
        if (badge) { badge.className = `bb-src-badge ${src}`; badge.textContent = labels[src] ?? src; }
        if (dot)   { dot.className = 'bb-dot' + (src==='err'?' err':''); }
    }

    // ============================================================
    // SECTION 14. 이벤트 바인딩
    // ============================================================
    document.getElementById('bb-closebtn').addEventListener('click', closeBoard);
    document.getElementById('bb-sortBtn').addEventListener('click', autoSort);
    document.getElementById('bb-rmbtn').addEventListener('click', toggleRm);

    document.getElementById('bb-infobtn').addEventListener('click', () => {
    document.getElementById('bb-info-panel').classList.toggle('open');
    });
    document.getElementById('bb-info-close').addEventListener('click', () => {
        document.getElementById('bb-info-panel').classList.remove('open');
    });

    const siEl = document.getElementById('bb-si');
    siEl.addEventListener('click', showDd);
    siEl.addEventListener('input', showDd);

    // ── 줌 기능 ──────────────────────────────────────────
    (function() {
        const ZOOM_KEY  = 'bb_zoom';
        const ZOOM_MIN  = 1.0;
        const ZOOM_MAX  = 2.0;
        const ZOOM_STEP = 0.1;

        let zoom = parseFloat(localStorage.getItem(ZOOM_KEY)) || 1.0;

        function applyZoom() {
            const bb = document.getElementById('bb');
            if (!bb) return;

            // 드래그로 이동한 상태인지 확인
            const isDragged = bb.style.left !== '' && bb.style.left !== '50%';

            if (isDragged) {
                // 드래그 상태: translate 없이 scale만, transformOrigin은 top left
                bb.style.transform       = `scale(${zoom})`;
                bb.style.transformOrigin = 'top left';
            } else {
                // 초기 중앙 상태
                bb.style.transform       = `translate(-50%, -50%) scale(${zoom})`;
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

    // ── 드래그 이동 기능 ──────────────────────────────────
    (function() {
        const handle = document.getElementById('bb-drag-handle');
        const bb     = document.getElementById('bb');
        let dragging = false, ox = 0, oy = 0;

        handle.addEventListener('mousedown', e => {
            dragging = true;
            // 현재 bb 위치 기준으로 마우스 오프셋 계산
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
            // 화면 밖으로 나가지 않도록 제한
            x = Math.max(0, Math.min(window.innerWidth  - w, x));
            y = Math.max(0, Math.min(window.innerHeight - h, y));
            bb.style.left      = x + 'px';
            bb.style.top       = y + 'px';
            bb.style.transform = `scale(${zoom})`;
            bb.style.transformOrigin = 'top left';
        });

        document.addEventListener('mouseup', () => {
            dragging = false;
            handle.style.cursor = 'grab';
        });
    })();
	
	// ── 백업/복원 ──────────────────────────────────────────
    const BACKUP_BASE = 'https://multimonitoring.vercel.app/api/board?type=bb_backup';

    document.getElementById('bb-backup-btn').addEventListener('click', async () => {
        const name = prompt('백업 이름을 입력하세요 (예: 최윤혁)');
        if (!name || !name.trim()) return;
        try {
            const res = await fetch(BACKUP_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids, name: name.trim() })
            });
            const data = await res.json();
            if (data.ok) alert(`✅ "${name.trim()}" 백업 완료 (${ids.length}대)`);
            else alert('❌ 백업 실패');
        } catch(e) {
            alert('❌ 백업 실패 (네트워크 오류)');
        }
    });

    document.getElementById('bb-restore-btn').addEventListener('click', async () => {
        try {
            // 목록 조회
            const listRes = await fetch('https://multimonitoring.vercel.app/api/board?type=bb_backup_list');
            const listData = await listRes.json();
            const names = listData.names || [];
            if (!names.length) { alert('❌ 저장된 백업 없음'); return; }

            // 선택 팝업
            const choice = prompt(`복원할 백업을 선택하세요:\n\n${names.map((n,i) => `${i+1}. ${n}`).join('\n')}\n\n번호 또는 이름 입력:`);
            if (!choice) return;

            // 번호 또는 이름으로 매칭
            const num = parseInt(choice);
            const name = (!isNaN(num) && num >= 1 && num <= names.length)
                ? names[num - 1]
                : names.find(n => n === choice.trim());

            if (!name) { alert('❌ 해당 백업 없음'); return; }

            // 복원
            const res = await fetch(`${BACKUP_BASE}&name=${encodeURIComponent(name)}`);
            const data = await res.json();
            if (!data.ids || !data.ids.length) { alert('❌ 백업 데이터 없음'); return; }

            if (!confirm(`"${name}" 백업으로 복원하시겠습니까?\n현재 목록(${ids.length}대)이 교체됩니다.`)) return;

            ids.length = 0;
            data.ids.forEach(id => ids.push(id));
            save();
            render();
            alert(`✅ "${name}" 복원 완료 (${data.ids.length}대)`);
        } catch(e) {
            alert('❌ 복원 실패 (네트워크 오류)');
        }
    });

    // 검색어 바뀌면 포커스 인덱스 초기화
    siEl.addEventListener('input', () => { ddFocusIdx = -1; });

    document.addEventListener('mousedown', e => {
        if (!e.target.closest('#bb-sb') && !e.target.closest('#bb-dd') && !e.target.closest('#bb-alert-panel')) hideDd();
    });

    // ── 히스토리 버튼 & 패널 ──────────────────────────────────────
    const MONITOR_DATA_URL = 'https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/swordfish.css';
    const NEUBIE_BASE_URL = 'https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/';
    const MONTH_NAMES = { '01':'jan','02':'feb','03':'mar','04':'apr','05':'may','06':'jun','07':'jul','08':'aug','09':'sep','10':'oct','11':'nov','12':'dec' };

    let histVideoOpen = false;
    let histActiveMenu = 'video';

    async function loadHistoryPanel() {
        await loadVideoHistory();
    }

    async function loadVideoHistory() {
        const body = document.getElementById('bb-hp-body');
        body.innerHTML = '';

        try {
            const res  = await fetch(MONITOR_DATA_URL + '?t=' + Date.now());
            const text = await res.text();
            const json = JSON.parse(text.slice(text.indexOf('{')));
            const history = json.history || {};
            const realtime = json.realtime || [];

            const now = new Date();
            const todayStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;

            const currentHour = now.getHours();
            const lastSlot = currentHour >= 2 ? currentHour - 2 : 0;

            const displayHistory = { ...history };
            const validRealtime = realtime.filter(e => parseInt(e.hour) <= lastSlot);
            displayHistory[todayStr] = validRealtime;
            
            if (Object.keys(history).length === 0 && validRealtime.length === 0) {
                body.innerHTML = '<div class="bb-hp-empty">누락 기록 없음 ✓</div>';
                return;
            }

            const byMonth = {};
            Object.entries(displayHistory).forEach(([dateStr, entries]) => {
                const y = dateStr.slice(0,4), m = dateStr.slice(4,6);
                const monthKey = `${y}-${m}`;
                if (!byMonth[monthKey]) byMonth[monthKey] = {};
                byMonth[monthKey][dateStr] = entries;
            });

            const sortedMonths = Object.keys(byMonth).sort((a,b) => b.localeCompare(a));

            body.innerHTML = sortedMonths.map(monthKey => {
                const [y, m] = monthKey.split('-');
                const label  = `${y}년 ${parseInt(m)}월`;
                const days   = Object.keys(byMonth[monthKey]).sort();

                const daysHtml = days.map(dateStr => {
                    const entries = byMonth[monthKey][dateStr];
                    if (!entries || entries.length === 0) {
                         const isToday = dateStr === todayStr;
                         const d = `${parseInt(dateStr.slice(4,6))}/${parseInt(dateStr.slice(6,8))}`;
                         const todayLabel = isToday ? ' 🔴 실시간' : '';
                         return `
                             <div class="bb-hp-day ${isToday ? 'today' : ''}">
                                 <div class="bb-hp-day-title">📅 ${d}${todayLabel} (0건)</div>
                                 <div style="padding:6px 0; font-size:11px; color:var(--gn); font-weight:700;">✓ 누락 없음</div>
                             </div>
                         `;
                    }
                    const d = `${parseInt(dateStr.slice(4,6))}/${parseInt(dateStr.slice(6,8))}`;
                    const sorted = [...entries].sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

                    const isToday = dateStr === todayStr;
                    const todayLabel = isToday ? ' 🔴 실시간' : '';

                    const entriesHtml = sorted.map(e => `
                        <div class="bb-hp-entry">
                            <div class="bb-hp-entry-hour">${e.hour}</div>
                            <div class="bb-hp-entry-name">${e.name}</div>
                            <div class="bb-hp-entry-badge ${e.status !== '미업로드' ? 'misplaced' : ''}">${e.status}</div>
                        </div>
                    `).join('');

                    return `
                        <div class="bb-hp-day ${isToday ? 'today' : ''}">
                            <div class="bb-hp-day-title">📅 ${d}${todayLabel} (${entries.length}건)</div>
                            ${entriesHtml}
                        </div>
                    `;
                }).join('');

                return `
                    <div class="bb-hp-month">
                        <div class="bb-hp-month-hd" onclick="this.nextElementSibling.classList.toggle('open');this.querySelector('.bb-hp-month-arrow').classList.toggle('open')">
                            <span>${label} 영상 업로드 기록 (휴먼에러 감안)</span>
                            <span class="bb-hp-month-arrow">▼</span>
                        </div>
                        <div class="bb-hp-month-body">
                            ${daysHtml || '<div class="bb-hp-empty">이 달 누락 없음 ✓</div>'}
                        </div>
                    </div>
                `;
            }).join('');

        } catch(err) {
            body.innerHTML = '<div class="bb-hp-empty">데이터 로드 실패 ❌</div>';
            console.error('[BB-HIST]', err);
        }
    }

    async function loadNeubieIssues(type) {
        // type: 'hw' | 'sw'
        const body = document.getElementById('bb-hp-body');
        const now   = new Date();

        // 월별 드롭다운 생성 (1월~현재월)
        const currentMonthNum = now.getMonth() + 1;
        const months = [];
        const START_MONTH = 5;
        for (let m = START_MONTH; m <= currentMonthNum; m++) {
            const mm = String(m).padStart(2, '0');
            months.push({ num: mm, name: MONTH_NAMES[mm], label: `${m}월` });
        }

        body.innerHTML = months.reverse().map(mo => `
            <div class="bb-hp-month" id="bb-ni-month-${type}-${mo.num}">
                <div class="bb-hp-month-hd" onclick="window._bbToggleNeubie('${type}','${mo.num}','${mo.name}',this)">
                    <span>📊 ${mo.label} 뉴비슈 현황 (내림차순)</span>
                    <span class="bb-hp-month-arrow">▼</span>
                </div>
                <div class="bb-hp-month-body" id="bb-ni-body-${type}-${mo.num}">
                    <div class="bb-hp-loading">▼ 클릭하여 로드</div>
                </div>
            </div>
        `).join('');
    }

    window._bbToggleNeubie = async function(type, monthNum, monthName, hdEl) {
        const bodyEl  = document.getElementById(`bb-ni-body-${type}-${monthNum}`);
        const arrowEl = hdEl.querySelector('.bb-hp-month-arrow');
        const isOpen  = bodyEl.classList.contains('open');

        if (isOpen) {
            bodyEl.classList.remove('open');
            arrowEl.classList.remove('open');
            return;
        }

        bodyEl.classList.add('open');
        arrowEl.classList.add('open');

        // 이미 로드된 경우 스킵
        if (bodyEl.dataset.loaded === '1') return;

        bodyEl.innerHTML = '<div class="bb-hp-loading">로딩 중...</div>';

        const filename = `neubie_issue_${type}_${monthName}.json`;
        const url = NEUBIE_BASE_URL + filename + '?t=' + Date.now();

        try {
            const res  = await fetch(url);
            if (!res.ok) throw new Error('not found');
            const json = await res.json();

            // 새 포맷 { issues, meta } 또는 구 포맷 flat array
            const meta    = json.meta || null;
            const summary = meta ? meta.summary : null;

            if (!summary || summary.length === 0) {
                bodyEl.innerHTML = '<div class="bb-hp-empty">summary 데이터 없음</div>';
                bodyEl._issueData = json.issues || [];
                bodyEl.dataset.loaded = '1';
                return;
            }

            bodyEl.innerHTML = `
                <div style="padding:8px 13px; font-size:11px; color:var(--mu); font-weight:700; border-bottom:1px solid var(--bd);">
                    전체 ${meta.total_issues}건 / ${meta.total_robots}개 기체
                    <span style="float:right; color:var(--mu);">생성: ${meta.generated_at ? meta.generated_at.slice(0,10) : '-'}</span>
                </div>
                <div style="max-height:320px; overflow-y:auto;">
                    ${summary.map((s, si) => {
                        const phList = Object.entries(s.phenomena || {})
                            .sort((a,b) => b[1]-a[1])
                            .map(([ph,cnt]) => `<span style="color:var(--mu)">${ph} ${cnt}건</span>`)
                            .join(' <span style="color:var(--bd2)">|</span> ');
                        return `
                            <div style="padding:7px 13px; border-bottom:1px solid var(--bd); font-size:12px; line-height:1.6; display:flex; justify-content:space-between; align-items:flex-start;">
                                <div style="flex:1;">
                                    <div style="font-weight:900; color:var(--tx);">${s.site} / ${s.robot}
                                        <span style="font-size:11px; color:var(--${type==='hw'?'rd':'bl'}); margin-left:6px;">총 ${s.total}건</span>
                                    </div>
                                    <div style="font-size:11px; margin-top:2px;">${phList}</div>
                                </div>
                                <button onclick="window._bbShowIssueDetail('${type}','${monthNum}','${s.robot.replace(/['"\\]/g,'')}',${si})"
                                    style="flex-shrink:0; margin-left:8px; padding:3px 9px; border-radius:5px;
                                    border:1px solid var(--bd2); background:var(--sur2); color:var(--mu);
                                    font-size:11px; font-weight:700; cursor:pointer; white-space:nowrap;">
                                    보기
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            bodyEl._issueData = json.issues || [];
            bodyEl.dataset.loaded = '1';
        } catch(err) {
            bodyEl.innerHTML = '<div class="bb-hp-empty">데이터 로드 실패 ❌</div>';
            console.error('[BB-NEUBIE]', err);
        }
    };

    window._bbShowIssueDetail = function(type, monthNum, robot, summaryIdx) {
        // 이미 로드된 JSON 데이터에서 해당 기체 issues 추출
        const bodyElId = `bb-ni-body-${type}-${monthNum}`;
        const bodyEl = document.getElementById(bodyElId);
        if (!bodyEl || !bodyEl._issueData) return;

        const issues = bodyEl._issueData.filter(r => r.robot === robot);
        if (!issues.length) return;

        // 기존 팝업 제거
        const prev = document.getElementById('bb-issue-detail-panel');
        if (prev) prev.remove();

        const panel = document.createElement('div');
        panel.id = 'bb-issue-detail-panel';
        panel.style.cssText = `
            position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
            width:460px; max-height:70vh; overflow-y:auto;
            background:var(--bg); border:1px solid var(--bd2);
            border-radius:12px; box-shadow:0 16px 48px rgba(0,0,0,.9);
            z-index:999999999; font-family:'Lato','Noto Sans KR',sans-serif;
        `;

        const accentColor = type === 'hw' ? 'var(--rd)' : 'var(--bl)';
        const accentBg    = type === 'hw' ? 'rgba(239,68,68,.08)' : 'rgba(59,130,246,.08)';
        const accentBd    = type === 'hw' ? 'rgba(239,68,68,.3)' : 'rgba(59,130,246,.3)';

        const issuesHtml = issues.map((r, i) => `
            <div style="border-bottom:2px solid var(--bd2); font-size:13px; line-height:1.9;">

                <!-- 건 구분 헤더 -->
                <div style="
                    padding:7px 16px;
                    background:${accentBg};
                    border-left:3px solid ${accentColor};
                    border-bottom:1px solid ${accentBd};
                    display:flex; align-items:center; gap:8px;">
                    <span style="font-size:12px; font-weight:900; color:${accentColor};">[${i+1}/${issues.length}]</span>
                    <span style="font-size:12px; font-weight:900; color:var(--tx);">${r.date || '-'}</span>
                    <span style="font-size:11px; color:var(--mu); margin-left:auto;">${r.priority || ''}</span>
                </div>

                <!-- 본문 -->
                <div style="padding:10px 16px;">
                    <div style="color:#a0a0b0; font-size:11px; font-weight:700; margin-bottom:2px;">긴급도 / 심각도 / 이슈 현상</div>
                    <div style="color:var(--tx); margin-bottom:8px;">
                        ${r.urgency || '-'} &nbsp;·&nbsp; ${r.severity || '-'}<br>
                        <span style="color:${accentColor}; font-weight:900;">${r.phenomenon || '-'}</span>
                    </div>

                    <div style="border-top:1px solid var(--bd); margin:6px 0;"></div>

                    <div style="color:#a0a0b0; font-size:11px; font-weight:700; margin-bottom:2px;">사이트 / 로봇 / 작성자</div>
                    <div style="color:var(--tx); margin-bottom:8px;">
                        ${r.site || '-'} &nbsp;/&nbsp; ${r.robot || '-'} &nbsp;/&nbsp; ${r.author || '-'}
                    </div>

                    <div style="border-top:1px solid var(--bd); margin:6px 0;"></div>

                    <div style="color:#a0a0b0; font-size:11px; font-weight:700; margin-bottom:2px;">초동 조치${r.auto ? ' / 자율주행' : ''}</div>
                    <div style="color:var(--tx); margin-bottom:8px;">
                        ${r.action || '-'}${r.auto ? ` &nbsp;/&nbsp; ${r.auto}` : ''}
                    </div>

                    <div style="border-top:1px solid var(--bd); margin:6px 0;"></div>

                    <div style="color:#a0a0b0; font-size:11px; font-weight:700; margin-bottom:4px;">내용</div>
                    <div style="color:var(--tx); font-size:12px; line-height:1.8;
                        background:var(--sur2); border-radius:6px; padding:8px 10px;">
                        ${r.content || '-'}
                    </div>
                </div>
            </div>
        `).join('');

        panel.innerHTML = `
            <div style="padding:11px 16px; border-bottom:1px solid var(--bd);
                background:var(--sur); border-radius:12px 12px 0 0;
                display:flex; justify-content:space-between; align-items:center;
                position:sticky; top:0; z-index:1;">
                <div style="font-size:14px; font-weight:900; color:var(--tx);">
                    ${robot} 이슈 상세 
                    <span style="font-size:12px; color:var(--${type==='hw'?'rd':'bl'}); margin-left:6px;">
                        ${issues.length}건
                    </span>
                </div>
                <div onclick="document.getElementById('bb-issue-detail-panel').remove()"
                    style="width:22px; height:22px; border-radius:5px;
                    background:rgba(239,68,68,.15); border:1px solid rgba(239,68,68,.3);
                    color:var(--rd); font-size:12px; cursor:pointer;
                    display:flex; align-items:center; justify-content:center; font-weight:900;">✕</div>
            </div>
            ${issuesHtml}
        `;

        document.body.appendChild(panel);

        // 바깥 클릭 시 닫기
        setTimeout(() => {
            document.addEventListener('mousedown', function closeDetail(e) {
                if (!panel.contains(e.target)) {
                    panel.remove();
                    document.removeEventListener('mousedown', closeDetail);
                }
            });
        }, 100);
    };

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

    render();

})();

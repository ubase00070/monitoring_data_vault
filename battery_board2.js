/* ============================================================
   battery_board.js v3.0
   뉴비고 배터리 현황판 — 템퍼몽키 inject용
   레이아웃 v8 이식 버전
   제거: 기능4(ON/OFF반복), 기능6(탐지센서), 기능7(순찰미시작)
   ============================================================ */

(function () {
    'use strict';

    // ============================================================
    // SECTION 0. 스타일
    // ============================================================
    const style = document.createElement('style');
    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap');
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
            width:960px; background:var(--bg);
            border:1px solid var(--bd2); border-radius:16px;
            box-shadow:0 24px 60px rgba(0,0,0,.75);
            z-index:9999999; font-family:'Lato',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
            color:var(--tx); flex-direction:column;
        }
        #bb.open { display:flex; }

        /* ── 헤더 ── */
        .bb-hd {
            display:flex; flex-direction:column; align-items:center;
            padding:11px 14px 9px; border-bottom:1px solid var(--bd);
            background:var(--sur); border-radius:16px 16px 0 0;
            flex-shrink:0; position:relative; gap:3px;
        }
        .bb-hd-title {
            font-size:20px; font-weight:900; color:#e2b82c;
            display:flex; align-items:center; gap:7px; cursor:grab;
        }
        .bb-hd-time { display:flex; align-items:baseline; gap:8px; }
        .bb-clock { font-family:'Lato',monospace; font-size:13px; font-weight:900; color:var(--mu); letter-spacing:.8px; }
        .bb-ref   { font-size:12px; color:var(--mu); font-weight:700; }
        .bb-hd-left  { position:absolute; left:14px; top:50%; transform:translateY(-50%); display:flex; align-items:center; gap:6px; }
        .bb-hd-right { position:absolute; right:14px; top:50%; transform:translateY(-50%); display:flex; align-items:center; gap:10px; }

        .bb-btn {
            padding:5px 12px; border-radius:6px; border:1px solid var(--bd2);
            background:var(--sur2); color:var(--tx); font-size:12px;
            font-family:inherit; font-weight:700; cursor:pointer; white-space:nowrap;
        }
        .bb-btn:hover { border-color:var(--mu); }
        .bb-btn.rm { border-color:rgba(239,68,68,.3); color:var(--rd); background:var(239,68,68,.3); }
        .bb-btn.rm:hover { background:rgba(239,68,68,.25); }
        .bb-btn.info { border-color:rgba(156,163,175,.2); color:var(--tx); background:var(--sur2); font-size:12px; padding:5px 10px; }
        .bb-xbtn {
            width:24px; height:24px; border-radius:6px;
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
        .zoom-label { font-size:11px; color:var(--tx); font-weight:700; min-width:34px; text-align:center; }

        /* ── 알림바 + 검색 ── */
        .bb-alert-row {
            display:flex; align-items:stretch;
            border-bottom:1px solid var(--bd); flex-shrink:0; min-height:44px;
            position:relative;
        }
        .bb-alert-bar {
            flex:1; display:flex; align-items:center; gap:8px;
            padding:6px 12px; background:var(--sur2);
        }
        .bb-alert-label {
            font-size:13px; font-weight:900; color:var(--tx);
            flex-shrink:0; white-space:nowrap;
        }
        .bb-alert-chips { display:flex; gap:5px; flex-wrap:wrap; flex:1; align-items:center; }
        .bb-chip {
            display:flex; align-items:center; gap:4px;
            padding:5px 12px; border-radius:10px;
            font-size:12px; font-weight:700; cursor:pointer;
            white-space:nowrap; font-family:inherit;
            transition:filter .15s, box-shadow .15s;
        }
        .bb-chip:hover { filter:brightness(1.15); }
        .bb-chip.bat    { background:var(--rd2); color:var(--rd); border:2px solid rgba(239,68,68,.55); box-shadow:0 0 8px rgba(239,68,68,.25); animation:chipPulse 1s infinite; }
        .bb-chip.dock   { background:rgba(251,191,36,.12); color:var(--ye); border:2px solid rgba(251,191,36,.5); box-shadow:0 0 6px rgba(251,191,36,.2); }
        .bb-chip.zombie { background:rgba(249,115,22,.12); color:var(--or); border:2px solid rgba(249,115,22,.5); box-shadow:0 0 8px rgba(249,115,22,.2); animation:chipPulse .7s infinite; }
        .bb-chip.cam { background:rgba(249,115,22,.12); color:var(--or); border:2px solid rgba(249,115,22,.45); box-shadow:0 0 6px rgba(249,115,22,.15); }
        .bb-chip.nomap { background:rgba(249,115,22,.12); color:var(--or); border:2px solid rgba(249,115,22,.45); box-shadow:0 0 6px rgba(249,115,22,.15); }
        .bb-chip.idle   { background:rgba(59,130,246,.10); color:var(--bl); border:2px solid rgba(59,130,246,.45); box-shadow:0 0 6px rgba(59,130,246,.15); }
        .bb-chip-none   { font-size:12px; color:var(--mu); font-weight:700; }
        @keyframes chipPulse { 0%,100%{opacity:1} 50%{opacity:.55} }

        /* 검색 */
        .bb-search-wrap {
            width:280px; flex-shrink:0; padding:6px 10px;
            border-left:1px solid var(--bd); background:var(--bg);
            position:relative; display:flex; align-items:center;
        }
        .bb-si-wrap { position:relative; width:100%; }
        .bb-si {
            width:100%; background:var(--sur2); border:1px solid var(--bd2);
            border-radius:7px; padding:6px 10px 6px 26px;
            color:var(--tx); font-size:12px; outline:none; font-family:inherit;
        }
        .bb-si:focus { border-color:var(--bl); }
        .bb-si::placeholder { color:var(--mu); }
        .bb-si-icon { position:absolute; left:8px; top:50%; transform:translateY(-50%); font-size:12px; color:var(--mu); pointer-events:none; }
        #bb-dd {
            position:absolute; top:calc(100% + 4px); left:0; right:0;
            background:var(--sur2); border:1px solid var(--bd2);
            border-radius:8px; overflow:hidden;
            box-shadow:0 8px 24px rgba(0,0,0,.7); z-index:200; display:none;
            max-height:240px; overflow-y:auto;
        }
        #bb-dd.open { display:block; }
        .bb-di {
            padding:8px 12px; font-size:12px; font-weight:700; cursor:pointer;
            display:flex; align-items:center; gap:6px;
            border-bottom:1px solid var(--bd); color:var(--tx);
            transition:background .1s;
        }
        .bb-di:last-child { border-bottom:none; }
        .bb-di:hover, .bb-di.bb-di-focus { background:var(--bd); }
        .bb-di-name { flex:1; }
        .bb-di-icon { font-size:12px; flex-shrink:0; }
        .bb-di-plus { font-size:15px; color:var(--gn); font-weight:900; flex-shrink:0; margin-left:4px; }

        /* ── 카드 그리드 ── */
        .bb-gw { padding:10px 12px; flex-shrink:0; }
        .bb-gr { display:grid; grid-template-columns:repeat(5,1fr); gap:6px; }
        .bb-ca {
            height:80px; background:var(--sur);
            border-radius:9px; padding:8px 11px;
            cursor:grab; position:relative; overflow:hidden;
            display:flex; flex-direction:column; justify-content:space-between;
            border:1px solid var(--ac-border,var(--bd));
            transition:border-color .2s, background .2s, opacity .15s;
        }
        .bb-ca:active { cursor:grabbing; }
        .bb-ca::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:var(--ac,var(--gy)); border-radius:9px 9px 0 0; }
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
        .bb-ca.charging   { --ac:var(--gn); --ac-border:rgba(34,197,94,.35);  background:var(--gn2); }
        .bb-ca.patrolling { --ac:var(--bl); --ac-border:rgba(59,130,246,.35); background:var(--bl2); }
        .bb-ca.standby    { --ac:#c8ccd4;  --ac-border:rgba(200,204,212,.2);  background:var(--wh); }
        .bb-ca.off        { --ac:#4b5563; --ac-border:rgba(75,85,99,.25);     background:#17171c; }
        .bb-ca.delivering { --ac:var(--pk); --ac-border:rgba(236,72,153,.35); background:var(--pk2); }
        .bb-ca.docking    { --ac:var(--ye); --ac-border:rgba(251,191,36,.35); background:rgba(251,191,36,.08); }
        .bb-ca.loading    { --ac:#52525e; --ac-border:rgba(75,85,99,.2); background:var(--sur); opacity:.5; }
        .bb-ca.warn-bat   { animation:bb-warnBlink .8s infinite; }
        @keyframes bb-warnBlink {
            0%,100% { border-color:var(--rd); box-shadow:0 0 0 1px var(--rd); }
            50%     { border-color:transparent; box-shadow:none; }
        }
        .bb-ca-name { font-size:15px; font-weight:900; color:var(--tx); line-height:1.1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; letter-spacing:-.2px; }
        .bb-ca-name.bb-marquee { overflow:visible; animation:bb-marquee 3s linear 0.5s 1 forwards; }
        @keyframes bb-marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-60%)} }
        .bb-ca-mid  { display:flex; justify-content:space-between; align-items:center; }
        .bb-ca-st   { font-size:11px; font-weight:700; color:var(--ac,var(--mu)); opacity:.9; }
        .bb-mission-off { font-size:10px; font-weight:900; color:rgba(239,68,68,.8); }
        .bb-ca-bar-wrap { position:relative; }
        .bb-ca-bar  { height:14px; background:rgba(255,255,255,.07); border-radius:4px; overflow:hidden; }
        .bb-ca-fill { height:100%; border-radius:4px; background:var(--ac,var(--gy)); transition:width .6s ease; }

        /* ── 하단 영역 ── */
        .bb-bottom {
            display:flex; border-top:1px solid var(--bd);
            background:var(--bg); flex-shrink:0; border-radius:0 0 16px 16px;
        }

        /* 퀵바 */
        .bb-mg { display:flex; flex-direction:row; gap:5px; padding:7px 8px; border-right:1px solid var(--bd); flex-shrink:0; }
        .bb-mg-col { display:flex; flex-direction:column; border:1px solid var(--bd2); border-radius:8px; background:var(--sur2); overflow:hidden; }
        .bb-mg-col-title {
            padding:5px 6px; font-size:12px; font-weight:900; color:var(--tx);
            border-bottom:1px solid var(--bd); background:var(--sur);
            text-align:center; white-space:nowrap;
        }
        .bb-mg-grid {
            padding:5px; display:grid;
            grid-template-columns:repeat(4,1fr);
            grid-template-rows:repeat(4,1fr);
            gap:3px; width:120px; height:120px;
        }
        .bb-mi {
            width:100%; aspect-ratio:1; border-radius:50%;
            border:2px solid var(--ac,var(--gy));
            color:var(--ac,var(--gy)); font-size:11px; font-weight:900;
            display:flex; align-items:center; justify-content:center;
            font-family:'Lato',monospace; box-shadow:0 0 4px var(--ac);
        }
        .bb-mi.empty { border-color:var(--bd2); color:transparent; box-shadow:none; opacity:.12; }
        .bb-mi.charging   { --ac:var(--gn); }
        .bb-mi.patrolling { --ac:var(--bl); }
        .bb-mi.delivering { --ac:var(--pk); }
        .bb-mi.standby    { --ac:#c8ccd4; }
        .bb-mi.docking    { --ac:var(--ye); }
        .bb-mi.off        { opacity:.12; }

        /* 기타 배달 */
        .bb-delivery-area { flex:1; padding:7px 10px; display:flex; flex-direction:column; gap:5px; min-height:0; }
        .bb-delivery-title { font-size:12px; font-weight:900; color:var(--mu); letter-spacing:.3px; flex-shrink:0; }
        .bb-delivery-chips {
            display:flex; flex-wrap:wrap; gap:4px;
            overflow-y:auto; max-height:100px; padding-right:2px;
        }
        .bb-delivery-chips::-webkit-scrollbar { width:4px; }
        .bb-delivery-chips::-webkit-scrollbar-thumb { background:var(--bd2); border-radius:2px; }
        .bb-delivery-chip {
            display:flex; align-items:center; gap:4px;
            padding:3px 9px; border-radius:6px;
            background:var(--pk2); border:1px solid rgba(236,72,153,.3);
            color:var(--pk); font-size:11px; font-weight:700; white-space:nowrap;
        }
        .bb-delivery-empty { font-size:11px; color:var(--mu); font-weight:700; }

        /* ── 알림 상세 패널 ── */
        #bb-alert-panel {
            display:none; position:fixed;
            top:50%; left:50%; transform:translate(-50%,-50%);
            width:460px; max-height:72vh; overflow-y:auto;
            background:#2c2f4a;
            border:2px solid #6c72a8;
            border-radius:14px;
            box-shadow:0 0 0 1px rgba(255,255,255,.18), 0 24px 64px rgba(0,0,0,.9);
            z-index:99999999; font-family:inherit;
        }
        #bb-alert-panel.open { display:block; }
        .bb-ap-hd {
            padding:14px 16px; border-bottom:1px solid #4a5070;
            background:#363a5c; border-radius:12px 12px 0 0;
            display:flex; justify-content:space-between; align-items:center;
            position:sticky; top:0; z-index:1;
        }
        .bb-ap-title { font-size:16px; font-weight:900; color:#ffffff; }
        .bb-ap-close {
            width:26px; height:26px; border-radius:7px;
            background:rgba(239,68,68,.25); border:1px solid rgba(239,68,68,.6);
            color:#fca5a5; font-size:14px; cursor:pointer;
            display:flex; align-items:center; justify-content:center; font-weight:900;
        }
        .bb-ap-item {
            padding:13px 16px; border-bottom:1px solid #3a3f62;
            display:flex; align-items:flex-start; gap:12px; background:#2c2f4a;
        }
        .bb-ap-item:last-child { border-bottom:none; }
        .bb-ap-item:hover { background:#323558; }
        .bb-ap-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; margin-top:5px; }
        .bb-ap-dot.rd { background:#f87171; }
        .bb-ap-dot.ye { background:#fcd34d; }
        .bb-ap-dot.or { background:#fb923c; }
        .bb-ap-dot.bl { background:#60a5fa; }
        .bb-ap-info { display:flex; flex-direction:column; gap:4px; flex:1; }
        .bb-ap-name { font-size:15px; font-weight:900; color:#f4f4ff; }
        .bb-ap-desc { font-size:13px; font-weight:700; color:#c4c8e8; line-height:1.55; }
        .bb-ap-time { font-size:11px; color:#8890b8; font-family:'Lato',monospace; }
        .bb-ap-dismiss {
            display:none; flex-shrink:0; align-self:center;
            padding:4px 11px; border-radius:6px;
            border:1px solid #4a5070; background:#3a3f62;
            color:#a0a8cc; font-size:11px; font-weight:700; cursor:pointer; font-family:inherit;
        }
        .bb-ap-item:hover .bb-ap-dismiss { display:block; }
        .bb-ap-empty { padding:28px 16px; text-align:center; font-size:14px; color:#8890b8; font-weight:700; background:#2c2f4a; border-radius:0 0 12px 12px; }

        /* ── 사용 설명서 패널 ── */
        #bb-info-panel {
            display:none; position:absolute; top:0; left:0; right:0; bottom:0;
            background:var(--sur2); border:1px solid var(--bd2);
            border-radius:12px; box-shadow:0 16px 48px rgba(0,0,0,.85);
            z-index:9999999999; padding:16px; overflow-y:auto;
            font-size:14px; line-height:1.8; color:var(--tx);
        }
        #bb-info-panel.open { display:block; }
        .bb-info-hd {
            display:flex; justify-content:space-between; align-items:center;
            margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid var(--bd);
        }
        .bb-info-title { font-size:17px; font-weight:900; }

        /* ── 히스토리 패널 ── */
        #bb-hist-panel {
            display:none; position:fixed;
            top:16px; left:50%; transform:translateX(-50%);
            width:500px; max-height:60vh; overflow-y:auto;
            background:var(--bg); border:1px solid var(--bd2);
            border-radius:12px; box-shadow:0 16px 48px rgba(0,0,0,.85);
            z-index:99999998; font-family:inherit;
        }
        #bb-hist-panel.open { display:block; }
        .bb-hp-hd {
            padding:11px 14px; border-bottom:1px solid var(--bd);
            background:var(--sur); border-radius:12px 12px 0 0;
            display:flex; justify-content:space-between; align-items:center;
            position:sticky; top:0; z-index:1;
        }
        .bb-hp-title { font-size:13px; font-weight:900; color:var(--tx); }
        .bb-hp-close { width:22px; height:22px; border-radius:5px; background:rgba(239,68,68,.15); border:1px solid rgba(239,68,68,.3); color:var(--rd); font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:900; }
        .bb-hp-menu { padding:8px 14px; display:flex; gap:8px; border-bottom:1px solid var(--bd); flex-wrap:wrap; }
        .bb-hp-menu-btn { padding:5px 12px; border-radius:6px; border:1px solid var(--bd2); background:var(--sur2); color:var(--mu); font-size:12px; font-weight:700; cursor:pointer; }
        .bb-hp-menu-btn:hover { border-color:var(--mu); color:var(--tx); }
        .bb-hp-menu-btn.active { border-color:var(--bl); color:var(--bl); background:var(--bl2); }
        .bb-hp-body { padding:10px 14px; }
        .bb-hp-month { margin-bottom:6px; border:1px solid var(--bd2); border-radius:8px; overflow:hidden; }
        .bb-hp-month-hd { padding:9px 13px; background:var(--sur2); display:flex; justify-content:space-between; align-items:center; cursor:pointer; font-size:12px; font-weight:900; color:var(--tx); user-select:none; }
        .bb-hp-month-hd:hover { background:var(--bd); }
        .bb-hp-month-arrow { font-size:10px; color:var(--mu); transition:transform .2s; }
        .bb-hp-month-arrow.open { transform:rotate(180deg); }
        .bb-hp-month-body { display:none; border-top:1px solid var(--bd); }
        .bb-hp-month-body.open { display:block; }
        .bb-hp-day { padding:7px 13px; border-bottom:1px solid var(--bd); }
        .bb-hp-day:last-child { border-bottom:none; }
        .bb-hp-day-title { font-size:11px; font-weight:900; color:var(--mu); margin-bottom:4px; letter-spacing:.3px; }
        .bb-hp-entry { padding:5px 0; display:flex; align-items:center; gap:8px; border-bottom:1px solid rgba(255,255,255,.04); }
        .bb-hp-entry:last-child { border-bottom:none; }
        .bb-hp-entry-hour { font-size:11px; font-weight:900; color:var(--bl); font-family:'Lato',monospace; width:38px; flex-shrink:0; }
        .bb-hp-entry-name { font-size:12px; font-weight:700; color:var(--tx); flex:1; }
        .bb-hp-entry-badge { font-size:10px; font-weight:900; padding:2px 7px; border-radius:4px; background:var(--rd2); color:var(--rd); border:1px solid rgba(239,68,68,.3); }
        .bb-hp-entry-badge.misplaced { background:rgba(251,191,36,.10); color:var(--ye); border:1px solid rgba(251,191,36,.3); }
        .bb-hp-empty { padding:24px; text-align:center; font-size:12px; color:var(--mu); font-weight:700; }
        .bb-hp-loading { padding:16px; text-align:center; font-size:12px; color:var(--mu); }
        .bb-hp-day.today { border:1px solid rgba(255,255,255,.35); border-radius:7px; padding:7px 9px; margin:4px 0; }
        .bb-hp-day.today .bb-hp-day-title { color:#fff; font-weight:900; }

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
                <div class="bb-hd-left">
                    <button class="bb-btn info" id="bb-infobtn">사용 설명서</button>
                    <button class="bb-btn" id="bb-sortBtn">가나다 순</button>
                    <button id="bb-zoom-out" class="zoom-btn">－</button>
                    <span id="bb-zoom-label" class="zoom-label">100%</span>
                    <button id="bb-zoom-in"  class="zoom-btn">＋</button>
                </div>
                <div class="bb-hd-title" id="bb-drag-handle">
                    관리자용 배터리 현황판
                    <span style="font-size:16px;color:var(--mu);font-weight:400;">by CYH</span>
                </div>
                <div class="bb-hd-time">
                    <div class="bb-clock" id="bb-clk">00:00:00</div>
                    <div class="bb-ref" id="bb-ref">— 초 후 갱신</div>
                </div>
                <div class="bb-hd-right">
                    <button id="bb-backup-btn" class="bb-btn">백업</button>
                    <button id="bb-restore-btn" class="bb-btn">복원</button>
                    <button class="bb-btn rm" id="bb-rmbtn">제거</button>
                    <div class="bb-xbtn" id="bb-closebtn">✕</div>
                </div>
            </div>

            <!-- 알림바 + 검색 -->
            <div class="bb-alert-row">
                <div class="bb-alert-bar">
                    <span class="bb-alert-label">🚨 알림</span>
                    <div class="bb-alert-chips" id="bb-alert-chips"></div>
                </div>
                <div class="bb-search-wrap">
                    <div class="bb-si-wrap">
                        <span class="bb-si-icon">🔍</span>
                        <input class="bb-si" id="bb-si" placeholder="기체명 검색 후 클릭하여 추가" autocomplete="off">
                        <div id="bb-dd"></div>
                    </div>
                </div>
            </div>

            <!-- 카드 그리드 -->
            <div class="bb-gw"><div class="bb-gr" id="bb-gr"></div></div>

            <!-- 하단: 퀵바 + 기타 배달 -->
            <div class="bb-bottom">
                <div class="bb-mg" id="bb-mg"></div>
                <div class="bb-delivery-area">
                    <div class="bb-delivery-title">🚗 배달 중 (캠핑장 및 기타)</div>
                    <div class="bb-delivery-chips" id="bb-delivery-chips"></div>
                </div>
            </div>

            <!-- 사용 설명서 패널 -->
            <div id="bb-info-panel">
                <div class="bb-info-hd">
                    <div class="bb-info-title">📖 사용 설명서</div>
                    <div class="bb-xbtn" id="bb-info-close">✕</div>
                </div>
                <div id="bb-info-body">
                    * 오직 '알림 센터' 페이지에서만 작동<br>
                    * 추가한 기체 카드와 배치는 로컬 스토리지에 저장됨(최대 30대. 드래그로 배치 변경 가능)<br>
                    * 알림 전송 조건<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;- 배터리 부족(21% 이하)<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;- 무선 도킹됨<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;- 120분 이상 방치(배달 사이트 제외)<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;- 좀비: 전원 ON인데 배터리·GPS 수신값이 잡히지 않는 경우<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;- 캠 미노출(F, Fd, Fl, Fr, Bl, Br)<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;- 미니맵 기체 위치 미노출<br>
                    * 하단 퀵바: 역삼·송도·성수·삼평서현 ON/OFF 및 상태 확인용<br>
                    * 기타 배달: 퀵바 외 배달 사이트 기체 실시간 표시<br>
                    * Alt+Z: 현황판 열기/닫기<br>
                    * 개선 피드백 받습니다(수정 시 자동 실시간 반영).
                </div>
            </div>
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

        <!-- 히스토리 패널 -->
        <div id="bb-hist-panel">
            <div class="bb-hp-hd">
                <div class="bb-hp-title">📋 히스토리</div>
                <div class="bb-hp-close" id="bb-hp-close">✕</div>
            </div>
            <div class="bb-hp-menu">
                <button class="bb-hp-menu-btn active" id="bb-hp-btn-video">다중 영상</button>
                <button class="bb-hp-menu-btn" id="bb-hp-btn-hw">버튼 2</button>
                <button class="bb-hp-menu-btn" id="bb-hp-btn-sw">버튼 3</button>
            </div>
            <div class="bb-hp-body" id="bb-hp-body"></div>
        </div>
    `;
    document.body.appendChild(wrap);

    // ============================================================
    // SECTION 1. 상수 & 상태
    // ============================================================
    const MAX = 30;
    const LS = 'bb_ids';
    const LS_ZOMBIE = 'bb_zombie';

    const STL = { charging:'충전 중', patrolling:'순찰 중', delivering:'배달 중', standby:'대기 중', docking:'도킹 중', off:'OFF' };
    const STI = { charging:'🟢', patrolling:'🔵', delivering:'🩷', standby:'⚪', docking:'🟡', off:'⚫' };

    const DELIVERY_TYPES = ['ALL', 'OPENAPI_DELIVERY', 'NB_ORDER_DELIVERY', 'DELIVERY'];
    const DELIVERY_SITE_IDS = [25,27,44,47,48,53,56,65,86,109,118,141,180];

    const QUICK_SITE_IDS = [109, 65, 56, 44, 86];
    // 기타 배달 = DELIVERY_SITE_IDS 에 있지만 QUICK_SITE_IDS 에 없는 것
    const OTHER_DELIVERY_SITE_IDS = DELIVERY_SITE_IDS.filter(id => !QUICK_SITE_IDS.includes(id));

    const SITE_IDS = [
        24,25,27,36,37,40,42,44,45,46,47,48,50,53,56,57,62,64,
        65,66,72,75,82,86,100,105,108,109,111,117,118,126,131,
        132,134,138,140,141,142,143,144,145,146,150,151,171,
        177,179,180,181,182,187,193,196,202,203,214,216,221,224,
    ];

    const MONITOR_GROUPS = [
        { id:'yeoksam',  label:'역삼 요기요',    keywords:['역삼 요기요'] },
        { id:'songdo',   label:'송도 요기요',    keywords:['송도 요기요'] },
        { id:'seongsu',  label:'성수 요기요',    keywords:['성수 요기요'] },
        { id:'seongnam', label:'성남 삼평/서현', keywords:['성남시'] },
    ];

    let DB = [];
    let ids = load();
    let rmMode = false, rmSet = new Set(), isOpen = false;
    let fetchLock = false;
    let lastRaw = [];
    let topmostZ = 100000000;
    let currentAlertType = null;
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
            return Array.isArray(p) ? p.slice(0, MAX) : [];
        } catch { return []; }
    }
    function save() { localStorage.setItem(LS, JSON.stringify(ids)); }
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
    // SECTION 4. 알림 감지 (기능4·6·7 제거)
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
        const now = Date.now();
        const zombie = loadZombie();

        rawList.forEach(raw => {
            const id   = String(raw.id);
            const name = raw.nickname || raw.name || id;
            const rs   = raw.robotStatus ?? {};
            const { status, battery } = parseRobotStatus(raw);
            const isDelivery =
                DELIVERY_TYPES.includes(raw.service?.serviceType) ||
                DELIVERY_SITE_IDS.includes(raw.site?.id);

            // ── 기능1: 대기중 방치 (배달용 제외) ──────────────────
            if (!isDelivery && status === 'standby') {
                const mins = minAgo(rs.lastOperatedAt);
                if (mins >= 120) {
                    const isResting = mins >= 360 && battery >= 50;
                    if (!isResting) {
                        const key = alertKey('standby', id);
                        if (!dismissedAlerts.has(key)) alerts.push({
                            key, type:'idle', dot:'bl', name,
                            desc:`대기중 ${mins}분 | 마지막 조작: ${rs.lastOperatedUserName || '없음'} ${fmt(rs.lastOperatedAt)}`,
                            time: fmt(new Date().toISOString())
                        });
                    }
                }
            }

            // ── 기능2: 도킹 이상 ───────────────────────────────────
            if (status === 'docking') {
                const key = alertKey('docking', id);
                if (!dismissedAlerts.has(key)) alerts.push({
                    key, type:'dock', dot:'ye', name,
                    desc:`무선 도크 위에 있으나 충전 안 됨 | 확인 필요`,
                    time: fmt(new Date().toISOString())
                });
            }

            // ── 기능3: 배터리 21% 이하 ─────────────────────────────
            if (rs.isConnecting && battery > 0 && battery <= 21) {
                const key = alertKey('battery', id);
                if (!dismissedAlerts.has(key)) alerts.push({
                    key, type:'bat', dot:'ye', name,
                    desc:`배터리 ${battery}% | ${STL[status]}`,
                    time: fmt(new Date().toISOString())
                });
            }

            // ── 기능4: 좀비 상태 ───────────────────────────────────
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
                }
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

            // ── 기능5: 카메라 미노출 감지 ─────────────────────────────
            if (rs.isConnecting) {
                const CAM_LABELS = {
                    isOnCamF:  'F(전면)',
                    isOnCamFd: 'Fd(하단)',
                    isOnCamFl: 'Fl(전면 좌측)',
                    isOnCamFr: 'Fr(전면 우측)',
                    isOnCamBl: 'Bl(후면 좌측)',
                    isOnCamBr: 'Br(후면 우측)',
                };
                // 전체 false면 초기화 중으로 판단 — 제외
                const anyCamOn = Object.keys(CAM_LABELS).some(k => rs[k] === true);
                if (anyCamOn) {
                    const offCams = Object.entries(CAM_LABELS)
                        .filter(([k]) => rs[k] === false)
                        .map(([, label]) => label);
                    if (offCams.length > 0) {
                        const key = alertKey('cam', id);
                        if (!dismissedAlerts.has(key)) alerts.push({
                            key, type:'cam', dot:'or', name,
                            desc:`캠 미노출: ${offCams.join(', ')}`,
                            time: fmt(new Date().toISOString())
                        });
                    }
                }
            }

            // ── 기능6: 미니맵 위치 미노출 감지 ────────────────────────
            {
                const gpsZero =
                    rs.isConnecting === true &&
                    raw.battery > 0 &&   // 배터리는 정상 (좀비 아님)
                    (rs.navpvtHorzAccuracy === 0 || rs.navpvtHorzAccuracy == null);

                if (gpsZero) {
                    if (!zombie[id + '_gps']) zombie[id + '_gps'] = { count: 1, firstSeen: now };
                    else zombie[id + '_gps'].count++;
                } else {
                    delete zombie[id + '_gps'];
                }
                if (zombie[id + '_gps'] && zombie[id + '_gps'].count >= 4) {
                    const key = alertKey('nomap', id);
                    if (!dismissedAlerts.has(key)) alerts.push({
                        key, type:'nomap', dot:'or', name,
                        desc:`GPS 수신값 0 — 미니맵 위치 미노출 | 현장 재부팅 필요`,
                        time: fmt(new Date().toISOString())
                    });
                }
            }
        });

        saveZombie(zombie);
        window._bbAlerts = alerts;
        return alerts;
    }

    // ============================================================
    // SECTION 5. 알림 칩 + 패널 렌더
    // ============================================================
    // 알림 타입별 메타
    const ALERT_META = {
        bat:    { label:'🔋 배터리', order:0 },
        dock:   { label:'🟡 도킹',   order:1 },
        zombie: { label:'👻 좀비',   order:2 },
        idle:   { label:'⏳ 방치',   order:3 },
        cam:    { label:'🎥 캠', order:4 },
        nomap:  { label:'🗺️ 미노출', order:5 },
    };

    function renderAlertChips(alerts) {
        currentAlerts = alerts;
        const el = document.getElementById('bb-alert-chips');
        if (!el) return;

        // 타입별 그룹핑
        const groups = {};
        alerts.forEach(a => {
            if (!groups[a.type]) groups[a.type] = [];
            groups[a.type].push(a);
        });

        const types = Object.keys(groups).sort((a,b) =>
            (ALERT_META[a]?.order ?? 9) - (ALERT_META[b]?.order ?? 9)
        );

        if (!types.length) {
            el.innerHTML = '<span class="bb-chip-none">이상 없음 ✓</span>';
        } else {
            el.innerHTML = types.map(type => {
                const meta  = ALERT_META[type] || { label: type };
                const count = groups[type].length;
                const first = groups[type][0];
                return `<div class="bb-chip ${type}" data-type="${type}">
                    ${meta.label} <strong>${count}건</strong>
                </div>`;
            }).join('');

            el.querySelectorAll('.bb-chip[data-type]').forEach(chip => {
                chip.addEventListener('click', () => openAlertPanel(chip.dataset.type, groups));
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
    }

    function dismiss(key) {
        dismissedAlerts.add(key);
        try {
            const saved = JSON.parse(localStorage.getItem('bb_dismissed') || '[]');
            saved.push({ key, time: Date.now() });
            localStorage.setItem('bb_dismissed', JSON.stringify(saved));
        } catch {}
        currentAlerts = currentAlerts.filter(a => a.key !== key);
        renderAlertChips(currentAlerts);
    }

    // ============================================================
    // SECTION 6. bb_robots_data 리스너
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
                const siteId = raw.site?.id;
                DB.push({
                    id, name: raw.nickname || raw.name || id,
                    status: parsed.status, battery: parsed.battery,
                    loading: false, siteId,
                    canDispatch: raw.canDispatch ?? true,
                });
            });
            if (DB.length > 0) {
                ids = ids.filter(id => DB.some(r => r.id === id));
                save();
            }

            const alerts = detectAlerts(allRaw);
            renderAlertChips(alerts);
            renderMonitorGrid(allRaw);
            renderDeliveryChips(allRaw);

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
        renderDeliveryChips(lastRaw);
    }
    function closeBoard() {
        isOpen = false;
        document.getElementById('bb').classList.remove('open');
        document.getElementById('bb-alert-panel').classList.remove('open');
        document.getElementById('bb-hist-panel').classList.remove('open');
        if (rmMode) { rmMode = false; rmSet.clear(); updateRmUI(); }
        hideDd();
    }

    // 페이지 진입 시 자동 열림
    openBoard();

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
            if (_hCount === 0) _hTimer = setTimeout(() => _hCount = 0, 2000);
            _hCount++;
            if (_hCount >= 5) {
                clearTimeout(_hTimer); _hCount = 0;
                const panel = document.getElementById('bb-hist-panel');
                panel.classList.toggle('open');
                if (panel.classList.contains('open')) {
                    panel.style.zIndex = ++topmostZ;
                    histActiveMenu = 'video';
                    ['bb-hp-btn-video','bb-hp-btn-hw','bb-hp-btn-sw'].forEach(id => {
                        document.getElementById(id)?.classList.remove('active');
                    });
                    document.getElementById('bb-hp-btn-video').classList.add('active');
                    loadHistoryPanel();
                }
            }
        } else {
            clearTimeout(_hTimer); _hCount = 0;
        }
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
    // SECTION 8b. 퀵바 렌더 (4×4=16슬롯)
    // ============================================================
    function renderMonitorGrid(rawList) {
        const mgEl = document.getElementById('bb-mg');
        mgEl.innerHTML = '';

        MONITOR_GROUPS.forEach(group => {
            const robots = rawList.filter(r => {
                const name = r.nickname || r.name || '';
                return group.keywords.some(kw => name.includes(kw));
            }).sort((a, b) => {
                const na = parseInt((a.nickname || a.name || '').match(/\d+/)?.[0] || '0');
                const nb = parseInt((b.nickname || b.name || '').match(/\d+/)?.[0] || '0');
                return na - nb;
            });

            // OFF 기체 제외한 ON 기체만
            const onRobots = robots.filter(r => parseRobotStatus(r).status !== 'off');
            const SLOTS = 16;

            const col = document.createElement('div');
            col.className = 'bb-mg-col';
            col.innerHTML = `<div class="bb-mg-col-title">${group.label}</div>`;
            const grid = document.createElement('div');
            grid.className = 'bb-mg-grid';

            for (let i = 0; i < SLOTS; i++) {
                const r = onRobots[i];
                const el = document.createElement('div');
                if (r) {
                    const parsed = parseRobotStatus(r);
                    const num = (r.nickname || r.name || '').match(/\d+/)?.[0] || (i + 1);
                    el.className = `bb-mi ${parsed.status}`;
                    el.title = `${r.nickname || r.name} | ${STL[parsed.status]}`;
                    el.textContent = num;
                } else {
                    el.className = 'bb-mi empty';
                }
                grid.appendChild(el);
            }
            col.appendChild(grid);
            mgEl.appendChild(col);
        });
    }

    // ============================================================
    // SECTION 8c. 기타 배달 칩 렌더
    // ============================================================
    function renderDeliveryChips(rawList) {
        const el = document.getElementById('bb-delivery-chips');
        if (!el) return;
        const others = rawList.filter(r => {
            const siteId = r.site?.id;
            const parsed = parseRobotStatus(r);
            return OTHER_DELIVERY_SITE_IDS.includes(siteId) && parsed.status === 'delivering';
        });
        if (!others.length) {
            el.innerHTML = '<span class="bb-delivery-empty">배달 중인 기타 기체 없음</span>';
            return;
        }
        el.innerHTML = others.map(r =>
            `<div class="bb-delivery-chip">🩷 ${r.nickname || r.name}</div>`
        ).join('');
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
        const pct    = (off || r.loading) ? 0 : r.battery;
        const inside = pct >= 28;
        const showMissionOff = !r.canDispatch && !off && !r.loading;

        const batColor  = 'rgba(240,240,255,.93)';
        const batShadow = inside
            ? '0 0 4px rgba(0,0,0,.8)'
            : '0 1px 3px rgba(0,0,0,.95), 0 0 6px rgba(0,0,0,.7)';

        const c = document.createElement('div');
        c.className = `bb-ca ${r.loading ? 'loading' : r.status}${lowBat ? ' warn-bat' : ''}`;
        c.dataset.id = r.id;
        if (rmMode) c.classList.add('selectable');
        if (rmSet.has(r.id)) c.classList.add('selected');

        c.innerHTML = `
            <div class="bb-ca-name">${r.name}</div>
            <div class="bb-ca-mid">
                <div class="bb-ca-st">${r.loading ? '⏳ 로딩 중' : STI[r.status]+' '+STL[r.status]}</div>
                ${showMissionOff ? '<div class="bb-mission-off">임무 OFF</div>' : ''}
            </div>
            <div class="bb-ca-bar-wrap">
                <div class="bb-ca-bar">
                    <div class="bb-ca-fill" style="width:${pct}%"></div>
                </div>
                ${(off || r.loading) ? '' : `
                    <span style="position:absolute;
                        ${inside
                            ? 'right:5px;top:50%;transform:translateY(-50%);'
                            : `left:calc(${pct}% + 5px);top:50%;transform:translateY(-50%);`}
                        font-size:10px;font-weight:900;
                        color:${batColor};
                        font-family:'Lato',monospace;
                        text-shadow:${batShadow};
                        line-height:1;pointer-events:none;">${r.battery}%</span>
                `}
            </div>
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

        // 이름이 잘린 경우만 호버 마퀴
        const nameEl = c.querySelector('.bb-ca-name');
        c.addEventListener('mouseenter', () => {
            if (nameEl.scrollWidth > nameEl.clientWidth) nameEl.classList.add('bb-marquee');
        });
        c.addEventListener('mouseleave', () => {
            nameEl.classList.remove('bb-marquee');
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
        setTimeout(() => { btn.textContent = '가나다 순'; }, 1200);
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
        const btn = document.getElementById('bb-rmbtn');
        if (rmMode) { btn.classList.add('rm'); btn.textContent = '완료'; }
        else        { btn.classList.remove('rm'); btn.textContent = '제거'; }
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
    let ddFocusIdx = -1;

    function showDd() {
        const siEl = document.getElementById('bb-si');
        const ddEl = document.getElementById('bb-dd');
        const q    = siEl.value.trim();
        const res  = DB.filter(r => (q===''||r.name.includes(q)) && !ids.includes(r.id))
                       .sort((a,b) => a.name.localeCompare(b.name,'ko'));

        if (ids.length >= MAX) {
            ddEl.innerHTML = `<div class="bb-di" style="color:var(--mu);cursor:default;">이미 최대 ${MAX}대 등록됨</div>`;
        } else if (res.length === 0) {
            ddEl.innerHTML = `<div class="bb-di" style="color:var(--mu);cursor:default;">${DB.length===0?'기체 데이터 로딩 중...':'검색 결과 없음'}</div>`;
        } else {
            ddEl.innerHTML = res.map(r =>
                `<div class="bb-di" data-rid="${r.id}">
                    <span class="bb-di-name">${r.name}</span>
                    <span class="bb-di-icon">${STI[r.status]}</span>
                    <span class="bb-di-plus">＋</span>
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
        if (ids.length >= MAX) return;
        if (!ids.includes(id)) { ids.push(id); save(); render(); }
        showDd(); document.getElementById('bb-si').focus();
    }

    // ============================================================
    // SECTION 14. 이벤트 바인딩
    // ============================================================
    document.getElementById('bb-closebtn').addEventListener('click', closeBoard);
    document.getElementById('bb-sortBtn').addEventListener('click', autoSort);
    document.getElementById('bb-rmbtn').addEventListener('click', toggleRm);

    document.getElementById('bb-ap-close').addEventListener('click', () => {
        document.getElementById('bb-alert-panel').classList.remove('open');
    });

    document.getElementById('bb-infobtn').addEventListener('click', () => {
        document.getElementById('bb-info-panel').classList.toggle('open');
    });
    document.getElementById('bb-info-close').addEventListener('click', () => {
        document.getElementById('bb-info-panel').classList.remove('open');
    });

    document.getElementById('bb-hp-close').addEventListener('click', () => {
        document.getElementById('bb-hist-panel').classList.remove('open');
    });
    document.getElementById('bb-hp-btn-video').addEventListener('click', () => {
        histActiveMenu = 'video';
        ['bb-hp-btn-video','bb-hp-btn-hw','bb-hp-btn-sw'].forEach(id => document.getElementById(id).classList.remove('active'));
        document.getElementById('bb-hp-btn-video').classList.add('active');
        loadVideoHistory();
    });
    document.getElementById('bb-hp-btn-hw').addEventListener('click', () => {
        ['bb-hp-btn-video','bb-hp-btn-hw','bb-hp-btn-sw'].forEach(id => document.getElementById(id).classList.remove('active'));
        document.getElementById('bb-hp-btn-hw').classList.add('active');
        document.getElementById('bb-hp-body').innerHTML = '<div class="bb-hp-empty">준비 중입니다.</div>';
    });
    document.getElementById('bb-hp-btn-sw').addEventListener('click', () => {
        ['bb-hp-btn-video','bb-hp-btn-hw','bb-hp-btn-sw'].forEach(id => document.getElementById(id).classList.remove('active'));
        document.getElementById('bb-hp-btn-sw').classList.add('active');
        document.getElementById('bb-hp-body').innerHTML = '<div class="bb-hp-empty">준비 중입니다.</div>';
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
        if (!e.target.closest('.bb-search-wrap') && !e.target.closest('#bb-dd')) hideDd();
    });

    // ── 줌 기능 ──────────────────────────────────────────────────
    (function() {
        const ZOOM_KEY = 'bb_zoom', ZOOM_MIN = 1.0, ZOOM_MAX = 2.0, ZOOM_STEP = 0.1;
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

    // ── 드래그 이동 ──────────────────────────────────────────────
    (function() {
        const handle = document.getElementById('bb-drag-handle');
        const bb     = document.getElementById('bb');
        let dragging = false, ox = 0, oy = 0;
        handle.addEventListener('mousedown', e => {
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
            handle.style.cursor = 'grab';
        });
    })();

    // ── 백업/복원 ────────────────────────────────────────────────
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
        } catch { alert('❌ 백업 실패 (네트워크 오류)'); }
    });

    document.getElementById('bb-restore-btn').addEventListener('click', async () => {
        try {
            const listRes = await fetch('https://multimonitoring.vercel.app/api/board?type=bb_backup_list');
            const listData = await listRes.json();
            const names = listData.names || [];
            if (!names.length) { alert('❌ 저장된 백업 없음'); return; }
            const choice = prompt(`복원할 백업을 선택하세요:\n\n${names.map((n,i) => `${i+1}. ${n}`).join('\n')}\n\n번호 또는 이름 입력:`);
            if (!choice) return;
            const num = parseInt(choice);
            const name = (!isNaN(num) && num >= 1 && num <= names.length)
                ? names[num - 1]
                : names.find(n => n === choice.trim());
            if (!name) { alert('❌ 해당 백업 없음'); return; }
            const res = await fetch(`${BACKUP_BASE}&name=${encodeURIComponent(name)}`);
            const data = await res.json();
            if (!data.ids || !data.ids.length) { alert('❌ 백업 데이터 없음'); return; }
            if (!confirm(`"${name}" 백업으로 복원하시겠습니까?\n현재 목록(${ids.length}대)이 교체됩니다.`)) return;
            ids.length = 0;
            data.ids.forEach(id => ids.push(id));
            save(); render();
            alert(`✅ "${name}" 복원 완료 (${data.ids.length}대)`);
        } catch { alert('❌ 복원 실패 (네트워크 오류)'); }
    });

    // ============================================================
    // SECTION HIST. 히스토리 패널 로직
    // ============================================================
    const MONITOR_DATA_URL = 'https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/swordfish.css';
    const MONTH_NAMES = { '01':'jan','02':'feb','03':'mar','04':'apr','05':'may','06':'jun','07':'jul','08':'aug','09':'sep','10':'oct','11':'nov','12':'dec' };
    let histActiveMenu = 'video';

    async function loadHistoryPanel() { await loadVideoHistory(); }

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
            const lastSlot = now.getHours() >= 2 ? now.getHours() - 2 : 0;
            const displayHistory = { ...history };
            displayHistory[todayStr] = realtime.filter(e => parseInt(e.hour) <= lastSlot);
            if (Object.keys(history).length === 0 && displayHistory[todayStr].length === 0) {
                body.innerHTML = '<div class="bb-hp-empty">누락 기록 없음 ✓</div>';
                return;
            }
            const byMonth = {};
            Object.entries(displayHistory).forEach(([dateStr, entries]) => {
                const monthKey = `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}`;
                if (!byMonth[monthKey]) byMonth[monthKey] = {};
                byMonth[monthKey][dateStr] = entries;
            });
            const sortedMonths = Object.keys(byMonth).sort((a,b) => b.localeCompare(a));
            body.innerHTML = sortedMonths.map(monthKey => {
                const [y, m] = monthKey.split('-');
                const label = `${y}년 ${parseInt(m)}월`;
                const days  = Object.keys(byMonth[monthKey]).sort();
                const daysHtml = days.map(dateStr => {
                    const entries = byMonth[monthKey][dateStr];
                    const isToday = dateStr === todayStr;
                    const todayLabel = isToday ? ' 🔴 실시간' : '';
                    const d = `${parseInt(dateStr.slice(4,6))}/${parseInt(dateStr.slice(6,8))}`;
                    if (!entries || entries.length === 0) return `
                        <div class="bb-hp-day ${isToday?'today':''}">
                            <div class="bb-hp-day-title">📅 ${d}${todayLabel} (0건)</div>
                            <div style="padding:6px 0;font-size:11px;color:var(--gn);font-weight:700;">✓ 누락 없음</div>
                        </div>`;
                    const sorted = [...entries].sort((a,b) => parseInt(a.hour)-parseInt(b.hour));
                    return `
                        <div class="bb-hp-day ${isToday?'today':''}">
                            <div class="bb-hp-day-title">📅 ${d}${todayLabel} (${entries.length}건)</div>
                            ${sorted.map(e => `
                                <div class="bb-hp-entry">
                                    <div class="bb-hp-entry-hour">${e.hour}</div>
                                    <div class="bb-hp-entry-name">${e.name}</div>
                                    <div class="bb-hp-entry-badge ${e.status !== '미업로드' ? 'misplaced' : ''}">${e.status}</div>
                                </div>`).join('')}
                        </div>`;
                }).join('');
                return `
                    <div class="bb-hp-month">
                        <div class="bb-hp-month-hd" onclick="this.nextElementSibling.classList.toggle('open');this.querySelector('.bb-hp-month-arrow').classList.toggle('open')">
                            <span>${label} 영상 업로드 기록</span>
                            <span class="bb-hp-month-arrow">▼</span>
                        </div>
                        <div class="bb-hp-month-body">${daysHtml}</div>
                    </div>`;
            }).join('');
        } catch(err) {
            body.innerHTML = '<div class="bb-hp-empty">데이터 로드 실패 ❌</div>';
            console.error('[BB-HIST]', err);
        }
    }

    window._bbToggleNeubie = async function(type, monthNum, monthName, hdEl) {
        const bodyEl  = document.getElementById(`bb-ni-body-${type}-${monthNum}`);
        const arrowEl = hdEl.querySelector('.bb-hp-month-arrow');
        const isOpen  = bodyEl.classList.contains('open');
        if (isOpen) { bodyEl.classList.remove('open'); arrowEl.classList.remove('open'); return; }
        bodyEl.classList.add('open'); arrowEl.classList.add('open');
        if (bodyEl.dataset.loaded === '1') return;
        bodyEl.innerHTML = '<div class="bb-hp-loading">로딩 중...</div>';
        const url = NEUBIE_BASE_URL + `neubie_issue_${type}_${monthName}.json?t=` + Date.now();
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('not found');
            const json = await res.json();
            const meta    = json.meta || null;
            const summary = meta ? meta.summary : null;
            if (!summary || !summary.length) {
                bodyEl.innerHTML = '<div class="bb-hp-empty">summary 데이터 없음</div>';
                bodyEl._issueData = json.issues || [];
                bodyEl.dataset.loaded = '1';
                return;
            }
            bodyEl.innerHTML = `
                <div style="padding:8px 13px;font-size:11px;color:var(--mu);font-weight:700;border-bottom:1px solid var(--bd);">
                    전체 ${meta.total_issues}건 / ${meta.total_robots}개 기체
                    <span style="float:right;color:var(--mu);">생성: ${meta.generated_at ? meta.generated_at.slice(0,10) : '-'}</span>
                </div>
                <div style="max-height:320px;overflow-y:auto;">
                    ${summary.map((s, si) => {
                        const phList = Object.entries(s.phenomena || {})
                            .sort((a,b) => b[1]-a[1])
                            .map(([ph,cnt]) => `<span style="color:var(--mu)">${ph} ${cnt}건</span>`)
                            .join(' <span style="color:var(--bd2)">|</span> ');
                        return `
                            <div style="padding:7px 13px;border-bottom:1px solid var(--bd);font-size:12px;line-height:1.6;display:flex;justify-content:space-between;align-items:flex-start;">
                                <div style="flex:1;">
                                    <div style="font-weight:900;color:var(--tx);">${s.site} / ${s.robot}
                                        <span style="font-size:11px;color:var(--${type==='hw'?'rd':'bl'});margin-left:6px;">총 ${s.total}건</span>
                                    </div>
                                    <div style="font-size:11px;margin-top:2px;">${phList}</div>
                                </div>
                                <button onclick="window._bbShowIssueDetail('${type}','${monthNum}','${s.robot.replace(/['"\\]/g,'')}',${si})"
                                    style="flex-shrink:0;margin-left:8px;padding:3px 9px;border-radius:5px;border:1px solid var(--bd2);background:var(--sur2);color:var(--mu);font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;">
                                    보기
                                </button>
                            </div>`;
                    }).join('')}
                </div>`;
            bodyEl._issueData = json.issues || [];
            bodyEl.dataset.loaded = '1';
        } catch(err) {
            bodyEl.innerHTML = '<div class="bb-hp-empty">데이터 로드 실패 ❌</div>';
            console.error('[BB-NEUBIE]', err);
        }
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

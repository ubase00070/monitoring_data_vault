/* ============================================================
   battery_board.js v3.1
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
			--pk:#d1729a; --pk2:rgba(209,114,154,.12);
			--offdot:#4b5563;
			--standby-batt:var(--tx);
			--bg-fill:linear-gradient(var(--bg), var(--bg));
			--pct-fill:rgba(240,240,255,.93);
			--pct-shadow:0 1px 3px rgba(0,0,0,.95), 0 0 6px rgba(0,0,0,.7);
		}

        #bb.bb-light {
            --bg:#f2e4c4; --sur:#f8f3e6; --sur2:#efe6d2;
            --bd:#cabf9d; --bd2:#b3a687; --tx:#2b2418; --mu:#7a6f5c;
            --wh:rgba(0,0,0,.05);
            --gn:#22c55e; --gn2:rgba(34,197,94,.10);
            --bl:#3b82f6; --bl2:rgba(59,130,246,.10);
            --gy:#4b5563;
            --rd:#ef4444; --rd2:rgba(239,68,68,.12); --ye:#fbbf24;
            --or:#f97316; --or2:rgba(249,115,22,.12);
            --pk:#ec4899; --pk2:rgba(236,72,153,.10);
            --offdot:#b4b2a9;
            --standby-batt:#98a2ae;
            --bg-fill:linear-gradient(180deg, #cfe8f0 0%, #e8ecdc 45%, #f2e4c4 85%);
            --pct-fill:rgba(30,25,15,.95);
            --pct-shadow:0 1px 2px rgba(255,255,255,.9), 0 0 4px rgba(255,255,255,.6);
        }
        #bb.bb-light.theme-sunset  { --bg-fill:linear-gradient(180deg, #f7d4c4 0%, #f0dfc9 45%, #f2e4c4 85%); }
        #bb.bb-light.theme-blossom { --bg-fill:linear-gradient(180deg, #f6dde3 0%, #f2e2d2 45%, #f2e4c4 85%); }
        #bb.bb-light .bb-delivery-title { color:#2b2418; }
        #bb.bb-light .bb-delivery-empty { color:#2b2418; }
        #bb.bb-light .bb-ca.standby { --ac:#8a7f68; --ac-border:rgba(138,127,104,.35); }
		#bb.bb-light .bb-mi.standby { --ac:#8a7f68; }
        #bb.bb-light .bb-mi:not(.empty) { color:#2b2418; }
        #bb.bb-light .bb-chip.estop { background:var(--sur); color:#dc2626; }
        #bb.bb-light .bb-chip.bat    { background:var(--sur); color:#b91c1c; }
		#bb.bb-light .bb-chip.dock   { background:var(--sur); color:#a16207; }
		#bb.bb-light .bb-chip.zombie { background:var(--sur); color:#c2410c; }
		#bb.bb-light .bb-chip.cam    { background:var(--sur); color:#c2410c; }
		#bb.bb-light .bb-chip.nomap  { background:var(--sur); color:#c2410c; }
		#bb.bb-light .bb-chip.idle   { background:var(--sur); color:#1d4ed8; }
		#bb.bb-light .bb-cluster-group { background:var(--sur); }
		#bb.bb-light .bb-cluster-group-label { color:#a16207; }
		#bb.bb-light .bb-cluster-row:hover { background:rgba(0,0,0,.05); border-color:rgba(0,0,0,.12); }

        #bb-wrap * { box-sizing:border-box; }

        /* ── 메인 패널 ── */
        #bb {
            display:none; position:fixed; top:50%; left:50%;
            transform:translate(-50%,-50%);
            width:1490px;
            max-height:100vh; overflow-y:auto; overflow-x:hidden;
            border:3px solid transparent; border-radius:16px;
            background-image: var(--bg-fill), linear-gradient(135deg, #6366f1, #ec4899);
            background-origin: border-box;
            background-clip: padding-box, border-box;
            box-shadow:0 24px 60px rgba(0,0,0,.75);
            z-index:9999999; font-family:'Paperlogy','Lato',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
			font-weight:900;
			color:var(--tx); flex-direction:column;
			cursor:url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/cur_default.png') 4 4, auto;
        }
        #bb.bb-light { -webkit-text-stroke: 0.4px currentColor; }
        #bb.open { display:flex; }
		
		#bb, #bb * {
			font-weight: 450 !important;
		}
		
        /* ── 헤더 ── */
        .bb-hd {
            display:flex; flex-direction:column; align-items:center;
            padding:9px 14px 7px;
            border-radius:16px 16px 0 0;
            flex-shrink:0; position:relative; gap:3px;
        }
        .bb-hd-titlebox {
            display:inline-flex; flex-direction:column; align-items:center; gap:3px;
            padding:7px 28px 6px; border-radius:12px;
            border:2.5px solid transparent;
            background-image: linear-gradient(var(--bg), var(--bg)), linear-gradient(135deg, rgba(99,102,241,.7), rgba(236,72,153,.7));
            background-origin: border-box; background-clip: padding-box, border-box;
            cursor:url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/cur_grab.png') 32 32, grab;
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
        .bb-hd-left  { position:absolute; left:14px; top:50%; transform:translateY(-50%); display:flex; align-items:center; gap:6px; }
        .bb-hd-right { position:absolute; right:14px; top:50%; transform:translateY(-50%); display:flex; flex-direction:column; align-items:flex-end; gap:6px; z-index:500; }
        .bb-hd-right-row { display:flex; align-items:center; justify-content:flex-end; gap:6px; }

        .bb-btn {
            height:32px; padding:0 12px; border-radius:6px; border:1px solid var(--bd2);
            background:var(--sur2); color:var(--tx); font-size:14px;
            font-family:inherit; font-weight:700; cursor:url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/cur_pointer.png') 4 4, pointer; white-space:nowrap;
            display:inline-flex; align-items:center; justify-content:center; box-sizing:border-box;
        }
        .bb-btn:hover { border-color:var(--mu); }
        #bb:not(.bb-light) #bb-lighttheme-btn { cursor:not-allowed; opacity:.45; }
        #bb:not(.bb-light) #bb-lighttheme-btn:hover { border-color:var(--bd2); }
        .bb-btn.rm {
            border-color:rgba(239,68,68,.3); color:var(--rd); background:rgba(239,68,68,.15);
            min-width:76px; text-align:center;   /* ← 이 두 개 추가 */
        }
        .bb-btn.rm:hover { background:rgba(239,68,68,.25); }
        .bb-btn.info { border-color:var(--bd2); color:var(--tx); background:var(--sur2); font-size:14px; padding:0 10px; }
        .bb-xbtn {
            width:32px; height:32px; border-radius:6px;
            background:rgba(239,68,68,.15); border:1px solid rgba(239,68,68,.3);
            color:var(--rd); font-size:13px; cursor:url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/cur_pointer.png') 4 4, pointer;
            display:flex; align-items:center; justify-content:center; font-weight:900;
        }
        .bb-xbtn:hover { background:rgba(239,68,68,.3); }
        .zoom-btn {
            padding:3px 8px; border-radius:5px; border:1px solid var(--bd2);
            background:var(--sur2); color:var(--tx); font-size:12px;
            font-weight:900; cursor:url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/cur_pointer.png') 4 4, pointer; line-height:1.5; font-family:inherit;
        }
        .zoom-label { font-size:14px; color:var(--tx); font-weight:700; min-width:34px; text-align:center; }

        /* ── 알림바 + 검색 ── */
        .bb-alert-row {
		    display:flex; align-items:stretch;
		    flex-shrink:0; height:80px;
		    position:relative;
		    border-bottom:1px solid var(--bd);
		}
        .bb-alert-bar {
            flex:1; display:flex; align-items:center; gap:10px;
            padding:8px 12px;
        }
        .bb-alert-label {
            font-size:17px; font-weight:900; color:var(--tx);
            flex-shrink:0; white-space:nowrap;
        }
        .bb-alert-chips { display:flex; gap:5px; flex-wrap:wrap; flex:1; align-items:center; min-width:0; }
        .bb-chip {
            display:flex; flex-direction:column; gap:1px;
            padding:3px 16px; border-radius:10px;
            font-size:15px; font-weight:700; cursor:url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/cur_pointer.png') 4 4, pointer;
            font-family:inherit; max-width:198px;
            transition:filter .15s, box-shadow .15s;
        }
        .bb-chip-l1 { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
        .bb-chip-l2 {
            font-size:13px; font-weight:500; opacity:.8;
            white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        .bb-chip:hover { filter:brightness(1.15); }
        .bb-chip.estop { background:var(--rd2); color:var(--rd); border:2px solid rgba(239,68,68,.7); animation:chipPulse .5s infinite, chipBorder .5s infinite; }
        .bb-chip.bat    { background:var(--rd2); color:var(--rd); border:2px solid rgba(239,68,68,.55); animation:chipPulse 1s infinite, chipBorder 1s infinite; }
        .bb-chip.dock   { background:rgba(251,191,36,.12); color:var(--ye); border:2px solid rgba(251,191,36,.5); animation:chipPulse 1s infinite, chipBorder 1s infinite; }
        .bb-chip.zombie { background:rgba(249,115,22,.12); color:var(--or); border:2px solid rgba(249,115,22,.5); animation:chipPulse .7s infinite, chipBorder .7s infinite; }
        .bb-chip.cam    { background:rgba(249,115,22,.12); color:var(--or); border:2px solid rgba(249,115,22,.45); animation:chipPulse 1s infinite, chipBorder 1s infinite; }
        .bb-chip.nomap  { background:rgba(249,115,22,.12); color:var(--or); border:2px solid rgba(249,115,22,.45); animation:chipPulse 1s infinite, chipBorder 1s infinite; }
        .bb-chip.idle   { background:rgba(59,130,246,.10); color:var(--bl); border:2px solid rgba(59,130,246,.45); animation:chipPulse 1.2s infinite, chipBorder 1.2s infinite; }
        #bb.bb-light .bb-chip.estop  { box-shadow:0 0 10px rgba(239,68,68,.4); }
        #bb.bb-light .bb-chip.bat    { box-shadow:0 0 8px rgba(239,68,68,.25); }
        #bb.bb-light .bb-chip.dock   { box-shadow:0 0 6px rgba(251,191,36,.2); }
        #bb.bb-light .bb-chip.zombie { box-shadow:0 0 8px rgba(249,115,22,.2); }
        #bb.bb-light .bb-chip.cam    { box-shadow:0 0 6px rgba(249,115,22,.15); }
        #bb.bb-light .bb-chip.nomap  { box-shadow:0 0 6px rgba(249,115,22,.15); }
        #bb.bb-light .bb-chip.idle   { box-shadow:0 0 6px rgba(59,130,246,.15); }
        .bb-chip-none   { font-size:12px; color:var(--mu); font-weight:700; }
        @keyframes chipPulse { 0%,100%{opacity:1} 50%{opacity:.85} }
        @keyframes chipBorder {
            0%,100% { box-shadow:0 0 0 2px currentColor; }
            50%     { box-shadow:0 0 0 1px currentColor; }
        }

        /* 검색 */
        .bb-si-wrap { position:relative; }
        .bb-si { cursor:url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/cur_default.png') 4 4, auto; }
        .bb-si {
            width:26.5ch; max-width:100%; background:var(--sur2); border:1px solid var(--bd2);
            border-radius:7px; padding:6px 10px 6px 26px;
            color:var(--tx); font-size:14px; outline:none; font-family:inherit;
        }
        .bb-si:focus { border-color:var(--bl); }
        .bb-si::placeholder { color:var(--mu); }
        .bb-si-icon { position:absolute; left:8px; top:50%; transform:translateY(-50%); font-size:14px; color:var(--mu); pointer-events:none; }
        #bb-dd {
            position:absolute; top:calc(100% + 4px); left:0; right:0;
            background:var(--sur2); border:1px solid var(--bd2);
            border-radius:8px; overflow:hidden;
            box-shadow:0 8px 24px rgba(0,0,0,.7); z-index:99999999; display:none;
            max-height:240px; overflow-y:auto;
        }
        #bb-dd.open { display:block; }
        .bb-di {
            padding:8px 12px; font-size:14px; font-weight:700; cursor:url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/cur_pointer.png') 4 4, pointer;
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
        .bb-gw { padding:10px 12px; flex:1; min-height:566px; }
        .bb-gr { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:6px; }

        .bb-main-split { display:flex; gap:10px; min-height:0; padding-left:14px; margin-top:8px; }
        .bb-main-right { flex:1; min-width:0; display:flex; flex-direction:column; gap:8px; }

        .bb-cluster-side {
            width:300px; flex-shrink:0; display:flex; flex-direction:column; gap:5px;
            overflow-y:auto; padding-top:10px; padding-right:10px;
            border-right:1px solid var(--bd);
        }
		.bb-cluster-plug { font-size:10px; line-height:1; flex-shrink:0; }

        .bb-cluster-group {
            background:var(--sur2); border:2px solid var(--bd2); border-radius:12px;
            padding:6px 8px 4px; flex-shrink:0;
        }
        .bb-cluster-group-label {
            font-size:13px; font-weight:900; color:#c9a24a; margin-bottom:3px; padding-left:3px;
            padding-bottom:5px; border-bottom:1px solid var(--bd2);
            display:flex; align-items:baseline; min-width:0;
        }
        .bb-cluster-group-title { flex-shrink:0; }
        .bb-cluster-missing-wrap { flex:1; min-width:0; overflow:hidden; margin-left:5px; }
        .bb-cluster-missing { display:inline-block; white-space:nowrap; font-size:10px; font-weight:500; color:var(--mu); }
        .bb-cluster-missing.bb-marquee { animation:bb-marquee 3s linear 0.5s 1 forwards; }
        .bb-cluster-row {
            display:flex; align-items:center; gap:7px; padding:2px 5px; border-radius:6px; cursor:url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/cur_pointer.png') 4 4, pointer;
            border:1px solid transparent; user-select:none; margin-bottom:1px;
        }
        .bb-cluster-row:last-child { margin-bottom:0; }
        .bb-cluster-row.warn-bat { animation:bb-warnBlink .8s infinite; }
        .bb-cluster-row:hover { background:rgba(255,255,255,.07); border-color:rgba(255,255,255,.18); }
        .bb-cluster-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .bb-cluster-name { flex:1; min-width:0; font-size:15px; font-weight:700; color:var(--tx); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bb-cluster-name.bb-marquee { overflow:visible; animation:bb-marquee 3s linear 0.5s 1 forwards; }
        .bb-cluster-pct { font-size:12px; font-weight:900; font-family:'Paperlogy','Lato',monospace; flex-shrink:0; }
        .bb-cluster-batt {
            position:relative; display:inline-block; width:48px; height:16px; border-radius:4px;
            background:var(--sur2); border:1.5px solid var(--bd2);
            overflow:hidden; box-sizing:border-box; vertical-align:middle; flex-shrink:0;
        }
        .bb-cluster-batt-fill { position:absolute; left:0; top:0; bottom:0; transition:width .5s ease; }
        .bb-cluster-batt-pct {
            position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
            font-size:11px; font-weight:900; font-family:'Paperlogy','Lato',monospace;
            color:var(--pct-fill); text-shadow:var(--pct-shadow);
            letter-spacing:-0.3px; pointer-events:none; white-space:nowrap;
        }
        .bb-cluster-plug { font-size:11px; margin-left:3px; flex-shrink:0; }
        .bb-cluster-pct-wrap {
            position:relative; display:inline-block; width:50px; height:16px;
            overflow:hidden; flex-shrink:0; text-align:right;
        }
        .bb-cluster-pct-val, .bb-cluster-pct-off {
            position:absolute; top:0; right:0; white-space:nowrap;
            animation:bb-pctSlide 8s ease-in-out infinite;
        }
        .bb-cluster-pct-val { font-size:12px; font-weight:900; font-family:'Paperlogy','Lato',monospace; }
        .bb-cluster-pct-off { font-size:11px; font-weight:900; color:rgba(239,68,68,.8); animation-delay:-4s; }
        @keyframes bb-pctSlide {
            0%     { transform:translateX(0);    opacity:1; }
            42%    { transform:translateX(0);    opacity:1; }
            50%    { transform:translateX(-10px);  opacity:0; }
            50.01% { transform:translateX(8px);   opacity:0; }
            92%    { transform:translateX(8px);   opacity:0; }
            100%   { transform:translateX(0);    opacity:1; }
        }
        .bb-ca {
			height:86px; background:var(--sur);
			border-radius:16px; padding:0;
			cursor:url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/cur_grab.png') 32 32, grab; position:relative; overflow:hidden;
			display:flex; flex-direction:column; justify-content:space-between;
			border:4px solid var(--ac-border,var(--bd));
			box-shadow:inset 0 0 0 1px rgba(255,255,255,.06);
			transform:translateZ(0);
			backface-visibility:hidden;
			will-change:transform;
			transition:transform .25s cubic-bezier(.34,1.56,.64,1),
					   box-shadow .25s cubic-bezier(.34,1.56,.64,1),
					   border-color .2s, background .2s, opacity .15s;
		}
		.bb-ca:hover {
			transform:translateY(-3px) scale(1.03) translateZ(0);
			box-shadow:inset 0 0 0 1px rgba(255,255,255,.06), 0 6px 0 rgba(0,0,0,.2);
		}
		.bb-ca:active { cursor:url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/cur_hold.png') 32 32, grabbing; transform:translateY(-1px) scale(0.99); }
        .bb-ca.dragging { opacity:.3; }
        .bb-ca.dragover { border-color:var(--bl)!important; box-shadow:inset 0 0 0 1px rgba(255,255,255,.06), 0 0 0 1px var(--bl); }
        .bb-ca.selectable { cursor:url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/cur_pointer.png') 4 4, pointer; }
        .bb-ca.selectable:hover { border-color:rgba(239,68,68,.5); background:rgba(239,68,68,.04); }
        .bb-ca.selected { border-color:var(--rd)!important; background:var(--rd2)!important; box-shadow:inset 0 0 0 1px rgba(255,255,255,.06), 0 0 0 1px var(--rd); }
        .bb-ca.selected::after {
            content:'✕'; position:absolute; top:50%; left:50%;
            transform:translate(-50%,-50%);
            color:var(--rd); font-size:22px; font-weight:900; opacity:.9; pointer-events:none;
        }
        .bb-ca.charging   { --ac:var(--gn); --ac-border:var(--gn);  --ac-tint:var(--gn2); background:var(--sur); }
		.bb-ca.patrolling { --ac:var(--bl); --ac-border:var(--bl); --ac-tint:var(--bl2); background:var(--sur); }
		.bb-ca.standby    { --ac:#c8ccd4;  --ac-border:rgba(200,204,212,.3);  --ac-tint:rgba(200,204,212,.08); background:var(--sur); }
		.bb-ca.off        { --ac:#4b5563; --ac-border:rgba(75,85,99,.3);     --ac-tint:rgba(75,85,99,.08); background:var(--sur); }
		.bb-ca.delivering { --ac:var(--pk); --ac-border:var(--pk); --ac-tint:var(--pk2); background:var(--sur); }
		.bb-ca.docking    { --ac:var(--ye); --ac-border:var(--ye); --ac-tint:rgba(209,163,85,.12); background:var(--sur); }
		.bb-ca.loading    { --ac:#52525e; --ac-border:rgba(75,85,99,.2); --ac-tint:rgba(75,85,99,.06); background:var(--sur); opacity:.5; }
        .bb-ca.warn-bat   { animation:bb-warnBlink .8s infinite; }
        @keyframes bb-warnBlink {
            0%,100% { border-color:var(--rd); box-shadow:inset 0 0 0 1px rgba(255,255,255,.06), 0 0 0 1px var(--rd); }
            50%     { border-color:transparent; box-shadow:none; }
        }
        .bb-ca-badge {
            position:absolute; top:6px; right:7px; width:20px; height:20px; border-radius:50%;
            background:var(--ac,var(--gy)); box-shadow:0 0 0 2px var(--sur);
            display:flex; align-items:center; justify-content:center;
            font-size:11px; line-height:1; z-index:1;
        }
        .bb-ca-head {
            background:var(--ac-tint,transparent); padding:7px 30px 5px 10px;
            border-bottom:1px solid var(--ac-border,var(--bd));
        }
        .bb-ca-name { 
		    font-size:16px; font-weight:900; color:var(--tx); line-height:1.1; 
		    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
		}
        .bb-ca-name.bb-marquee { overflow:visible; animation:bb-marquee 3s linear 0.5s 1 forwards; }
        @keyframes bb-marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-60%)} }
        .bb-ca-mid  { display:flex; justify-content:space-between; align-items:center; margin-top:2px; }
        .bb-ca-st   { font-size:13px; font-weight:700; color:var(--ac,var(--mu)); opacity:.95; }
        .bb-mission-off { font-size:11px; font-weight:900; color:rgba(239,68,68,.8); }
        .bb-ca-batt-row { padding:6px 10px 8px; }
        .bb-ca-bar {
            position:relative; width:100%; height:16px; border-radius:8px;
            border:2px solid var(--ac,var(--bd2)); overflow:hidden; background:rgba(255,255,255,.05);
        }
        .bb-ca-bar-fill {
            position:absolute; top:0; left:0; bottom:0; background:var(--ac);
            transition:width .5s ease;
        }
        .bb-ca-bar-fill.charging-pulse { animation:bb-fullCharge 1.8s ease-in-out infinite; }
        @keyframes bb-fullCharge {
            0%, 100% { opacity:1; }
            50%      { opacity:.55; }
        }
        .bb-ca-bar-pct {
            position:relative; display:block; text-align:center; font-size:11px; font-weight:900;
            line-height:12px; color:#fff; text-shadow:0 1px 2px rgba(0,0,0,.65);
            font-family:'Paperlogy','Lato',monospace;
        }

        /* ── 하단 영역 ── */
        .bb-bottom {
            display:flex; border-top:1px solid var(--bd);
            background:var(--bg); flex-shrink:0; border-radius:0 0 16px 16px;
        }

        /* 퀵바 */
        .bb-mg { display:flex; flex-direction:row; gap:5px; padding:10px 8px; border-right:1px solid var(--bd); flex-shrink:0; }
        .bb-mg-col { display:flex; flex-direction:column; border:2px solid var(--bd2); border-radius:8px; background:var(--bg); overflow:hidden; }
        .bb-mg-col-title {
            padding:5px 6px; font-size:16.5px; font-weight:900; color:var(--tx);
            border-bottom:1px solid var(--bd); background:var(--sur);
            text-align:center; white-space:nowrap;
        }
        .bb-mg-grid {
            padding:5px; display:grid;
            grid-template-columns:repeat(4,1fr);
            grid-template-rows:repeat(4,1fr);
            gap:3px; width:135px; flex:1;
        }
        .bb-mi {
            width:100%; aspect-ratio:1; border-radius:50%;
            border:2px solid var(--ac,var(--gy));
            color:var(--ac,var(--gy)); font-size:13px; font-weight:900;
            display:flex; align-items:center; justify-content:center;
            font-family:'Paperlogy','Lato',monospace;
        }
        #bb.bb-light .bb-mi:not(.empty) { box-shadow:0 0 4px var(--ac); }
        .bb-mi.empty { border-color:var(--bd2); color:transparent; box-shadow:none; opacity:.12; }
        .bb-mi.charging   { --ac:var(--gn); }
        .bb-mi.patrolling { --ac:var(--bl); }
        .bb-mi.delivering { --ac:var(--pk); }
        .bb-mi.standby    { --ac:#c8ccd4; }
        .bb-mi.docking    { --ac:var(--ye); }
        .bb-mi.off        { opacity:.12; }

        /* 기타 배달 */
        .bb-delivery-area {
			flex:1; display:flex; flex-direction:column; min-height:0;
			position:relative; border-radius:8px; overflow:hidden;
			background-size:cover; background-position:center;
		}
		#bb-walker-wrap {
			position:absolute;
			bottom:4px; right:-4px;
			width:145px; height:145px;
			z-index:1;
		}
		#bb-walker {
			width:100%; height:100%;
			background-size:contain;
			background-repeat:no-repeat;
			background-position:center;
			cursor:url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/cur_pointer.png') 4 4, pointer;
			transition:transform .15s;
		}
		#bb-walker:active { transform:scale(0.92); }

		.bb-walker-arrow {
			position:absolute; top:50%; transform:translateY(-50%);
			width:25px; height:25px; border-radius:50%;
			background:rgba(20,20,22,.55); border:1px solid rgba(255,255,255,.2);
			color:#fff; font-size:16px; font-weight:900; line-height:1; padding:0;
			display:flex; align-items:center; justify-content:center;
			cursor:url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/cur_pointer.png') 4 4, pointer; z-index:2;
			opacity:0; transition:opacity .15s, background .15s;
		}
		#bb-walker-wrap:hover .bb-walker-arrow { opacity:1; }
		.bb-walker-arrow.left  { left:2px; }
		.bb-walker-arrow.right { right:2px; }
		.bb-walker-arrow:hover { background:rgba(20,20,22,.85); }
		.bb-walker-arrow:active { transform:translateY(-50%) scale(0.9); }

		#bb-walker-bubble {
			position:absolute; top:6px; left:190px; width:250px; min-height:50px;
			background:#fdf6e3; border-radius:20px; padding:10px 18px;
			font-size:16px; color:#5c4a2a; font-weight:700; line-height:1.4;
			box-shadow:0 4px 12px rgba(0,0,0,.35);
			z-index:3; display:none;
			font-family:'Paperlogy','Lato',-apple-system,sans-serif; -webkit-text-stroke:0;
		}
		#bb-walker-bubble.open { display:block; }
		#bb-walker-bubble::after {
			content:''; position:absolute; top:50%; right:-13px; transform:translateY(-50%);
			width:0; height:0;
			border-top:8px solid transparent;
			border-bottom:8px solid transparent;
			border-left:14px solid #fdf6e3;
		}
		#bb-walker-bubble b {
			font-weight:900;      /* 본문(700)보다 한 단계 더 굵게 */
			color:#a8460c;        /* 색까지 살짝 다르게 줘서 구분 */
		}

        #bb-walker-toggle {
            position:absolute; top:6px; right:8px;
            min-width:38px; height:22px; padding:0 7px;
            border-radius:6px;
            background:var(--sur2); border:1px solid var(--bd2);
            color:var(--tx); font-size:12px; font-weight:900; cursor:url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/cur_pointer.png') 4 4, pointer;
            display:flex; align-items:center; justify-content:center;
            z-index:2; transition:background .15s, color .15s;
        }
        #bb-walker-toggle:hover { border-color:var(--mu); }
        #bb-walker-toggle.off {
            color:var(--rd); border-color:rgba(239,68,68,.3); background:rgba(239,68,68,.1);
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
            cursor:url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/cur_default.png') 4 4, auto;
        }

        #bb-top5-panel {
            display:none; position:fixed;
            top:50%; left:50%; transform:translate(-50%,-50%);
            width:720px; max-height:86vh; overflow-y:auto;
            border:3px solid transparent; border-radius:14px;
            background-image: linear-gradient(var(--sur), var(--sur)), linear-gradient(135deg, #6366f1, #ec4899);
            background-origin: border-box;
            background-clip: padding-box, border-box;
            box-shadow:0 24px 64px rgba(0,0,0,.9);
            z-index:99999999;
            cursor:url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/cur_default.png') 4 4, auto;
        }
        #bb-top5-panel.open { display:block; }
        .bb-top5-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:14px; }
        .bb-top5-col { background:var(--bg); border-radius:12px; padding:12px; }
        .bb-top5-col-title { font-size:14px; font-weight:900; margin-bottom:8px; }
        .bb-top5-row {
            display:flex; align-items:center; gap:8px; padding:6px 4px;
            border-bottom:1px solid var(--bd); cursor:url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/cur_pointer.png') 4 4, pointer;
        }
        .bb-top5-row:last-child { border-bottom:none; }
        .bb-top5-row:hover { background:rgba(255,255,255,.05); }
        .bb-top5-name { flex:1; font-size:14px; font-weight:700; color:var(--tx); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bb-top5-rate { font-size:13px; font-weight:900; font-family:'Paperlogy','Lato',monospace; flex-shrink:0; }
        .bb-top5-empty { font-size:13px; color:var(--mu); padding:10px 0; }
        #bb-top5-panel.bb-light {
			--bg:#f2e4c4; --sur:#f8f3e6; --sur2:#efe6d2;
			--bd:#cabf9d; --bd2:#b3a687; --tx:#2b2418; --mu:#7a6f5c;
		}
		#bb-top5-panel.bb-light .bb-top5-col { background:var(--sur); }
        #bb-top5-panel.bb-light .bb-top5-row { border-bottom-color:var(--bd); }
        #bb-top5-panel.bb-light .bb-top5-row:hover { background:var(--sur2); }
        #bb-top5-panel.bb-light .bb-top5-col-title { color:#a16207; }
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
            width:26px; height:26px; border-radius:7px;
            background:rgba(239,68,68,.25); border:1px solid rgba(239,68,68,.6);
            color:#fca5a5; font-size:14px; cursor:url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/cur_pointer.png') 4 4, pointer;
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
            color:#a0a8cc; font-size:11px; font-weight:700; cursor:url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/cur_pointer.png') 4 4, pointer; font-family:inherit;
        }
        .bb-ap-empty { padding:28px 16px; text-align:center; font-size:14px; color:#8890b8; font-weight:700; background:var(--sur); border-radius:0 0 12px 12px; }

        #bb-alert-panel.bb-light {
			--bg:#f2e4c4; --sur:#f8f3e6; --sur2:#efe6d2;
			--bd:#cabf9d; --bd2:#b3a687; --tx:#2b2418; --mu:#7a6f5c;
			--wh:rgba(0,0,0,.05);
		}
		#bb-alert-panel.bb-light .bb-ap-hd { background:var(--sur); border-bottom-color:var(--bd); }
		#bb-alert-panel.bb-light .bb-ap-title { color:var(--tx); }
		#bb-top5-panel.bb-light .bb-ap-title { color:var(--tx); }
		#bb-alert-panel.bb-light .bb-ap-close { color:#b91c1c; }
		#bb-alert-panel.bb-light .bb-ap-item { background:var(--sur); border-bottom-color:var(--bd); }
		#bb-alert-panel.bb-light .bb-ap-item:hover { background:var(--sur2); }
		#bb-alert-panel.bb-light .bb-ap-name { color:var(--tx); }
		#bb-alert-panel.bb-light .bb-ap-desc { color:var(--tx); }
		#bb-alert-panel.bb-light .bb-ap-time { color:var(--mu); }
		#bb-alert-panel.bb-light .bb-ap-dismiss { background:var(--sur2); border-color:var(--bd2); color:var(--tx); }
		#bb-alert-panel.bb-light .bb-ap-empty { background:var(--sur); color:var(--mu); }

        /* ── 사용 설명서 패널 ── */
        #bb-info-panel {
            display:none; position:fixed;
            top:50%; left:50%; transform:translate(-50%,-50%);
            width:745px; max-height:100vh;
            background-image: linear-gradient(var(--sur2), var(--sur2)), linear-gradient(135deg, #6366f1, #ec4899);
            background-origin: border-box;
            background-clip: padding-box, border-box;
            border:3px solid transparent;
            border-radius:12px; box-shadow:0 16px 48px rgba(0,0,0,.85);
            z-index:9999999999; padding:16px; overflow-y:auto;
            font-size:16px; line-height:1.85; color:var(--tx);
            cursor:url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/cur_default.png') 4 4, auto;
        }
        #bb-info-panel.open { display:block; }
        .bb-info-hd {
            display:flex; justify-content:space-between; align-items:center;
            margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid var(--bd);
        }
        .bb-info-title { font-size:17px; font-weight:900; }

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
            cursor:url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/cur_default.png') 4 4, auto;
        }
        #bb-info-card-panel.search-mode { width:588px; }
        .bb-icp-flex { display:flex; align-items:stretch; }
        .bb-icp-left { flex:0 0 260px; min-width:0; }
        .bb-icp-right { flex:1; min-width:0; border-left:1px solid var(--bd); padding:10px 16px; }
        .bb-icp-wbl-log { margin-top:10px; display:flex; flex-direction:column; gap:6px; }
        .bb-icp-wbl-line { font-size:13px; line-height:1.5; color:var(--tx); }
        .bb-wbl-scroll { flex:1; min-width:0; overflow-x:auto; overflow-y:hidden; cursor:url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/cur_grab.png') 32 32, grab; scrollbar-width:thin; }
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
            --pk:#ec4899; --pk2:rgba(236,72,153,.10);
            --offdot:#b4b2a9;
            --standby-batt:#98a2ae;
        }  
        #bb-info-card-panel.open { display:block; }
        .bb-icp-hd {
            padding:11px 14px; background:var(--sur);
            border-bottom:1px solid var(--bd);
            display:flex; justify-content:space-between; align-items:center;
        }
        .bb-icp-title { font-size:16px; font-weight:900; color:var(--tx); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bb-icp-badge {
            font-size:13px; font-weight:900; padding:3px 8px;
            border-radius:5px; flex-shrink:0; margin-left:6px;
        }
        .bb-icp-badge.ok       { background:rgba(34,197,94,.15);  color:var(--gn); }
		.bb-icp-badge.warn     { background:rgba(251,191,36,.15); color:var(--ye); }
		.bb-icp-badge.crit     { background:rgba(239,68,68,.15);  color:var(--rd); }
		.bb-icp-badge.patrol   { background:rgba(59,130,246,.15); color:var(--bl); }
		.bb-icp-badge.deliver  { background:rgba(236,72,153,.15); color:var(--pk); }
		.bb-icp-badge.standby  { background:rgba(200,204,212,.15); color:#c8ccd4; }
		.bb-icp-badge.off      { background:rgba(75,85,99,.15);   color:#6b7280; }
        .bb-icp-close {
            width:22px; height:22px; border-radius:5px; flex-shrink:0;
            background:rgba(239,68,68,.15); border:1px solid rgba(239,68,68,.3);
            color:var(--rd); font-size:14px; cursor:url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/cur_pointer.png') 4 4, pointer;
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
                <div class="bb-hd-left">
                    <button class="bb-btn info" id="bb-infobtn">사용 설명서</button>
                    <button id="bb-theme-btn" class="bb-btn">다크</button>
                    <button id="bb-lighttheme-btn" class="bb-btn">☁️ 구름</button>
                    <button id="bb-zoom-out" class="zoom-btn">－</button>
                    <span id="bb-zoom-label" class="zoom-label">100%</span>
                    <button id="bb-zoom-in"  class="zoom-btn">＋</button>
                    <button class="bb-btn" id="bb-wbl-upload-btn" style="display:none;">📤 UP</button>
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
                </div>
                <div class="bb-hd-right" id="bb-hd-right">
                    <div class="bb-hd-right-row">
                        <button id="bb-top5-btn" class="bb-btn">🔥 배터리 증감 추이</button>
                        <button class="bb-btn" id="bb-wbl-download-btn">📥 배터리 값 로드</button>
                        <button id="bb-backup-btn" class="bb-btn">기체 목록 백업</button>
                        <button id="bb-restore-btn" class="bb-btn">기체 목록 복원</button>
                        <div class="bb-xbtn" id="bb-closebtn">✕</div>
                    </div>
                    <div class="bb-hd-right-row" id="bb-search-wrap">
                        <button class="bb-btn" id="bb-inforequest-btn">기체 정보 조회</button>
                        <button class="bb-btn" id="bb-sortname-btn">이름 순 정렬</button>
                        <button class="bb-btn" id="bb-rmbtn">카드 제거</button>
                        <div class="bb-si-wrap">
                            <span class="bb-si-icon">🔍</span>
                            <input class="bb-si" id="bb-si" placeholder="기체명 검색 후 클릭하여 추가" autocomplete="off">
                            <div id="bb-dd"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 알림바 -->
            <div class="bb-alert-row">
                <div class="bb-alert-bar" id="bb-alert-bar">
                    <span class="bb-alert-label">🚨 알림</span>
                    <div class="bb-alert-chips" id="bb-alert-chips"></div>
                </div>
            </div>

            <!-- 메인 영역: 좌측 묶음 리스트 -->
            <div class="bb-main-split">
                <div class="bb-cluster-side" id="bb-cluster-side"></div>
                <div class="bb-main-right">
                    <!-- 카드 그리드 -->
                    <div class="bb-gw"><div class="bb-gr" id="bb-gr"></div></div>

                    <!-- 하단: 퀵바 + 기타 배달 -->
                    <div class="bb-bottom">
                        <div class="bb-mg" id="bb-mg"></div>
                        <div class="bb-delivery-area">
                            <div class="bb-delivery-title">기타 배달 기체</div>
                            <div class="bb-delivery-chips" id="bb-delivery-chips"></div>
                            <div id="bb-walker-bubble"><span id="bb-walker-bubble-text"></span></div>
                            <button id="bb-walker-toggle" title="동숲 주민 표시/숨김"></button>
                            <div id="bb-walker-wrap">
                                <div id="bb-walker"></div>
                                <button id="bb-walker-prev" class="bb-walker-arrow left" title="이전 캐릭터">‹</button>
                                <button id="bb-walker-next" class="bb-walker-arrow right" title="다음 캐릭터">›</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 사용 설명서 패널 -->
            <div id="bb-info-panel">
                <div class="bb-info-hd">
                    <div class="bb-info-title">📖 사용 설명서</div>
                    <div class="bb-xbtn" id="bb-info-close">✕</div>
                </div>
                <div id="bb-info-body">
                    * '알림 센터' 페이지 새로고침 시 자동으로 레이아웃 열림(ALT+Z로 열고 닫기)<br>
                    * 기체 카드와 배치는 로컬 스토리지에 저장됨(최대 30대. 드래그로 배치 변경 가능)<br>
                    * 카드 더블클릭/기체정보 검색창: 기체 상세 Info 패널 / 배터리 증감 추이 그래프<br>
                    * 배터리 증감 추이 기능<br>
					&nbsp;&nbsp;&nbsp;&nbsp;- 08:00 ~ 다음 날 03:00까지 10분 간격으로 배터리 수치 기록<br> 
					&nbsp;&nbsp;&nbsp;&nbsp;- 오늘/어제 자 데이터 까지만 보존<br> 
					&nbsp;&nbsp;&nbsp;&nbsp;- 배터리 소모 속도 빠른 순 / 느린 순 5대 표기(시간당 소모량 확인 가능)<br> 
					* 알림 전송 조건<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;- 비상정지 버튼 눌림<br> 
                    &nbsp;&nbsp;&nbsp;&nbsp;- 배터리 부족(21% 이하)<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;- 무선 도킹됨<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;- 대기 중 배터리 50% 미만(배달 사이트 기체 제외)<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;- 좀비: 전원 ON인데 배터리·GPS 수신값이 잡히지 않는 경우<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;- 캠 미노출(F, Fd, Fl, Fr, Bl, Br)<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;- GPS 미수신<br>
                    * 하단 퀵바: 역삼·송도·성수·삼평서현 ON/OFF 및 상태 확인용<br>
                    * 기타 배달: 퀵바 외 배달 사이트 기체 실시간 표시<br>
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

        <!-- 배터리 증감 추이 브리핑 패널 -->
        <div id="bb-top5-panel">
            <div class="bb-ap-hd">
                <div class="bb-ap-title">🔥 배터리 증감 추이 TOP5</div>
                <div class="bb-ap-close" id="bb-top5-close">✕</div>
            </div>
            <div id="bb-top5-body" class="bb-top5-grid"></div>
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
    const applyBbTheme = () => {
		const theme = localStorage.getItem('neubie_bb_theme') || 'light';
		bbEl.classList.toggle('bb-light', theme === 'light');
		document.getElementById('bb-alert-panel').classList.toggle('bb-light', theme === 'light');
		document.getElementById('bb-info-card-panel').classList.toggle('bb-light', theme === 'light');
		document.getElementById('bb-top5-panel').classList.toggle('bb-light', theme === 'light');
		document.getElementById('bb-theme-btn').textContent = theme === 'light' ? '☀️ 라이트' : '🌙 다크';
	};
    applyBbTheme();

    // 라이트모드 배경 테마 순환: 구름(기본) → 노을 → 벚꽃 → 구름 ...
    const LIGHT_THEME_LABELS = { cloud: '☁️ 구름', sunset: '🌇 노을', blossom: '🌸 벚꽃' };
    const LIGHT_THEME_ORDER  = ['cloud', 'sunset', 'blossom'];
    const applyLightTheme = () => {
        const t = localStorage.getItem('bb_light_theme') || 'cloud';
        bbEl.classList.toggle('theme-sunset', t === 'sunset');
        bbEl.classList.toggle('theme-blossom', t === 'blossom');
        document.getElementById('bb-lighttheme-btn').textContent = LIGHT_THEME_LABELS[t];
    };
    applyLightTheme();
    document.getElementById('bb-lighttheme-btn').addEventListener('click', () => {
        if (!bbEl.classList.contains('bb-light')) return;   // 다크모드에서는 비활성 (라이트모드 전용 기능)
        const cur = localStorage.getItem('bb_light_theme') || 'cloud';
        const next = LIGHT_THEME_ORDER[(LIGHT_THEME_ORDER.indexOf(cur) + 1) % LIGHT_THEME_ORDER.length];
        localStorage.setItem('bb_light_theme', next);
        applyLightTheme();
    });

    document.getElementById('bb-theme-btn').addEventListener('click', () => {
        const next = (localStorage.getItem('neubie_bb_theme') || 'light') === 'light' ? 'dark' : 'light';
        localStorage.setItem('neubie_bb_theme', next);
        applyBbTheme();
        render();
    });

    // ============================================================
    // SECTION 1. 상수 & 상태
    // ============================================================
    const MAX = 30;
    const LS = 'bb_ids';
    const LS_ZOMBIE = 'bb_zombie';

    const STL = { charging:'충전 중', patrolling:'순찰 중', delivering:'배달 중', standby:'대기 중', docking:'도킹 중', off:'OFF' };
    const STI = { charging:'🟢', patrolling:'🔵', delivering:'🩷', standby:'⚪', docking:'🟡', off:'⚫' };
    const BADGE_ICON = { charging:'⚡', patrolling:'🧭', delivering:'📦', standby:'💤', docking:'🅿️', off:'⏻' };

    const DELIVERY_TYPES = ['ALL', 'OPENAPI_DELIVERY', 'NB_ORDER_DELIVERY', 'DELIVERY'];
    const FORCE_PATROL_SITE_IDS = [24];   // 삼성인력개발원
	const DELIVERY_SITE_IDS = [25,27,44,47,48,53,56,65,86,109,118,141,171,180,207];

    const QUICK_SITE_IDS = [109, 65, 56, 44, 86];
    const OTHER_DELIVERY_SITE_IDS = DELIVERY_SITE_IDS.filter(id => !QUICK_SITE_IDS.includes(id));

    const SITE_IDS = [
        24,27,36,37,44,46,47,48,53,56,57,
        65,66,72,75,82,86,105,108,109,111,117,118,126,131,
        132,134,137,138,140,141,142,143,144,145,146,150,151,171,
        177,178,179,180,181,182,187,193,196,202,203,207,214,216,224,230,235,244,246,
    ];

    // ============================================================
    // 묶음 그리드 설정 — siteIds 또는 names로 매칭. 배열 순서대로 표시됨.
    // ============================================================
    const CLUSTER_GROUPS = [
        { siteIds: [142, 145, 144, 143], label: '성남시 순찰', expectedNames: ['성남시 판교역 1호기', '성남시 서현역 １호기', '성남시 율동공원 1호기', '성남시 야탑역 1호기'] },
        { siteIds: [150, 151], label: '부산 EDC', expectedNames: ['부산 EDC 호반써밋 1호기', '부산 EDC 호반써밋 2호기', '부산 EDC 수자인 1호기', '부산 EDC 수자인 2호기'] },
        { siteIds: [180], label: '부산 국립과학관', expectedNames: ['배송 띠띠', '순찰 띠띠'] },
        { siteIds: [193], label: '창원대학교', expectedNames: ['창원대학교 1호기', '창원대학교 2호기'] },
        { siteIds: [132], label: '경희대학교', expectedNames: ['경희대학교 국제캠퍼스 1호기', '경희대학교 국제캠퍼스 2호기'] },
        { siteIds: [137], label: '한국장애인고용공단', expectedNames: ['한국장애인고용공단 1호기', '한국장애인고용공단 2호기'] },
    ];
    const CLUSTER_AC = {
        charging:'var(--gn)', patrolling:'var(--bl)', standby:'var(--standby-batt)',
        off:'var(--offdot)', delivering:'var(--pk)', docking:'var(--ye)',
    };

    const MONITOR_GROUPS = [
        { id:'yeoksam',  label:'역삼 요기요',    keywords:['역삼동'] },
        { id:'songdo',   label:'송도 요기요',    keywords:['송도 신도시'] },
        { id:'seongsu',  label:'성수 요기요',    keywords:['성수동'] },
        { id:'seongnam', label:'성남 삼평/서현', keywords:['성남형'] },
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
                    if (!dismissedAlerts.has(key)) alerts.push({
                        key, type:'nomap', dot:'or', name,
                        desc:`GPS 수신값 0 — 재부팅 조치 필요`,
                        time: fmt(new Date().toISOString())
                    });
                }
            }

            // ── 기능7: 비상정지
            if (raw.isEmergency === true) {
                const key = alertKey('estop', id);
                if (!dismissedAlerts.has(key)) alerts.push({
                    key, type:'estop', dot:'rd', name,
                    desc:`🚨 비상정지 버튼 눌림 | 현장 해제 필요`,
                    time: fmt(new Date().toISOString())
                });
            } else {
                clearDismiss(alertKey('estop', id));
            }
        });

        saveZombie(zombie);
        window._bbAlerts = alerts;
        return alerts;
    }

    // ============================================================
    // SECTION 5. 알림 칩 + 패널 렌더
    // ============================================================
    const ALERT_META = {
        estop:  { label:'🆘 비상정지',    order:-1 },
        bat:    { label:'🔋 배터리',      order:0 },
        dock:   { label:'🟡 도킹',        order:1 },
        zombie: { label:'👻 좀비',        order:2 },
        idle:   { label:'⏳ 방치',        order:3 },
        cam:    { label:'🎥 캠 미송출',   order:4 },
        nomap:  { label:'🗺️ GPS 수신', order:5 },
    };

    function renderAlertChips(alerts) {
        currentAlerts = alerts;
        const el = document.getElementById('bb-alert-chips');
        if (!el) return;

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
                const meta   = ALERT_META[type] || { label: type };
                const items  = groups[type];
                const count  = items.length;
                let previewLines;
                if (count <= 2) {
                    previewLines = items.map(a => `<div class="bb-chip-l2">${a.name}</div>`).join('');
                } else {
                    previewLines = items.slice(0, 2).map(a => `<div class="bb-chip-l2">${a.name}</div>`).join('')
                        + `<div class="bb-chip-l2">외 ${count - 2}건</div>`;
                }
                return `<div class="bb-chip ${type}" data-type="${type}">
                    <div class="bb-chip-l1">${meta.label} <strong>${count}건</strong></div>
                    ${previewLines}
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

    // ============================================================
    // SECTION 6. bb_robots_data 리스너
    // ============================================================
    // 실제 데이터 갱신 주기: 로더(뉴비고 도우미)가 2분마다 이벤트를 쏘도록 이미 바뀌었지만,
    // 혹시 모를 이중 안전장치로 여기서도 최소 UPDATE_INTERVAL_MS(2분)에 한 번만 처리
    const UPDATE_INTERVAL_MS = 2 * 60 * 1000;
    let _lastProcessedAt = 0;
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
                ids = ids.filter(id => {
                    const r = DB.find(x => x.id === id);
                    return r && !isClusterMember(r);
                });
                save();
            }

            logBatteryPattern(DB);
            wblCyhAutoUploadTick();
            wblOthersAutoDownloadTick();
            wblNightUploadTick();
            wblMidnightCleanupTick();

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

            renderMonitorGrid(allRaw);
            renderDeliveryChips(allRaw);
            applyCampingBackground();

            if (isOpen) {
                render();
                renderClusterGrid();
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
        document.getElementById('bb-info-card-panel').classList.remove('open');
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
    // SECTION 8b. 퀵바 렌더
    // ============================================================
    function renderMonitorGrid(rawList) {
        const mgEl = document.getElementById('bb-mg');
        mgEl.innerHTML = '';

        MONITOR_GROUPS.forEach(group => {
            const robots = rawList.filter(r => {
                const name = r.nickname || r.name || '';
                return group.keywords.some(kw => name.includes(kw));
            }).sort((a, b) => {
                const na = parseInt((a.nickname || a.name || '').match(/(\d+)호기/)?.[1] || '0');
                const nb = parseInt((b.nickname || b.name || '').match(/(\d+)호기/)?.[1] || '0');
                return na - nb;
            });

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
                    const num = (r.nickname || r.name || '').match(/(\d+)호기/)?.[1] || (i + 1);
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
            el.innerHTML = '<span class="bb-delivery-empty">기타 배달 없음</span>';
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

    function matchesClusterGroup(r, group) {
        return (group.siteIds && group.siteIds.includes(r.siteId)) ||
               (group.names && group.names.includes(r.name));
    }
    function isClusterMember(r) {
        return CLUSTER_GROUPS.some(g => matchesClusterGroup(r, g));
    }

    function renderClusterGrid() {
        const wrap = document.getElementById('bb-cluster-side');
        if (!wrap) return;
        wrap.innerHTML = '';

        CLUSTER_GROUPS.forEach((group) => {
            const members = DB.filter(r => matchesClusterGroup(r, group))
                .sort((a, b) => {
                    const ia = group.siteIds ? group.siteIds.indexOf(a.siteId) : (group.names?.indexOf(a.name) ?? 0);
                    const ib = group.siteIds ? group.siteIds.indexOf(b.siteId) : (group.names?.indexOf(b.name) ?? 0);
                    if (ia !== ib) return ia - ib;
                    const na = parseInt(a.name.match(/(\d+)호기/)?.[1] || '0', 10);
                    const nb = parseInt(b.name.match(/(\d+)호기/)?.[1] || '0', 10);
                    return na - nb;
                });
            if (members.length === 0 && !(group.expectedNames && group.expectedNames.length)) return;

            const groupEl = document.createElement('div');
            groupEl.className = 'bb-cluster-group';

            const labelEl = document.createElement('div');
            labelEl.className = 'bb-cluster-group-label';
            const memberNames = members.map(m => m.name);
            const missingNames = (group.expectedNames || []).filter(n => !memberNames.includes(n));
            labelEl.innerHTML = `<span class="bb-cluster-group-title">${group.label}</span>` + (missingNames.length
                ? `<span class="bb-cluster-missing-wrap"><span class="bb-cluster-missing">(${missingNames.join(', ')} 입고)</span></span>`
                : '');
            groupEl.appendChild(labelEl);

            if (missingNames.length) {
                const missingWrapEl = labelEl.querySelector('.bb-cluster-missing-wrap');
                const missingEl = labelEl.querySelector('.bb-cluster-missing');
                labelEl.addEventListener('mouseenter', () => {
                    if (missingEl.scrollWidth > missingWrapEl.clientWidth) missingEl.classList.add('bb-marquee');
                });
                labelEl.addEventListener('mouseleave', () => {
                    missingEl.classList.remove('bb-marquee');
                    missingEl.style.transform = '';
                });
            }

            members.forEach(r => {
                const ac = CLUSTER_AC[r.status] || 'var(--mu)';
                const off = r.status === 'off';
                const lowBat = !off && r.battery <= 21;
                const showMissionOff = !r.canDispatch && !off && !r.loading && !lowBat
				    && r.status !== 'patrolling' && r.status !== 'delivering' && r.status !== 'standby'
                const showPlug = r.status !== 'patrolling' && r.status !== 'delivering' && !!r.raw?.robotStatus?.isWiredChargerConnected;
				const row = document.createElement('div');
                row.className = `bb-cluster-row${lowBat ? ' warn-bat' : ''}${showMissionOff ? ' mission-off' : ''}`;
                const plugHtml = showPlug ? '<span class="bb-cluster-plug">🔌</span>' : '';
                const battInner = off
                    ? `<span class="bb-cluster-pct" style="color:${ac};">OFF</span>`
                    : `<span class="bb-cluster-batt" style="border-color:${ac};">
                           <span class="bb-cluster-batt-fill" style="width:${r.battery}%;background:${ac};"></span>
                           <span class="bb-cluster-batt-pct">${r.battery}%</span>
                       </span>`;
                const pctHtml = showMissionOff
                    ? `<span class="bb-cluster-pct-wrap">
                           <span class="bb-cluster-pct-val">${battInner}</span>
                           <span class="bb-cluster-pct-off">임무 OFF</span>
                       </span>${plugHtml}`
                    : `${battInner}${plugHtml}`;
                row.innerHTML = `
                    <span class="bb-cluster-dot" style="background:${ac};"></span>
					<span class="bb-cluster-name" title="${STL[r.status] || ''}">${r.name}</span>
                    ${pctHtml}
                `;
                row.addEventListener('dblclick', e => {
                    e.stopPropagation();
                    openInfoCardPanel(r);
                });
                const clusterNameEl = row.querySelector('.bb-cluster-name');
                row.addEventListener('mouseenter', () => {
                    if (clusterNameEl.scrollWidth > clusterNameEl.clientWidth) clusterNameEl.classList.add('bb-marquee');
                });
                row.addEventListener('mouseleave', () => {
                    clusterNameEl.classList.remove('bb-marquee');
                    clusterNameEl.style.transform = '';
                });
                groupEl.appendChild(row);
            });

            wrap.appendChild(groupEl);
        });
    }

    function makeCard(r) {
        const off    = r.status === 'off';
        const lowBat = !r.loading && !off && r.battery <= 21;
        const chargingPulse = !r.loading && !off && r.status === 'charging' && r.battery < 100;
        const pct    = (off || r.loading) ? 0 : r.battery;
        const showMissionOff = !r.canDispatch && !off && !r.loading && !lowBat
		    && r.status !== 'patrolling' && r.status !== 'delivering' && r.status !== 'standby'
		const showPlug = r.status !== 'patrolling' && r.status !== 'delivering' && !!r.raw?.robotStatus?.isWiredChargerConnected;
        const showWireless = !r.loading && !off && r.status === 'charging' && !r.raw?.robotStatus?.isWiredChargerConnected;
        const barColor  = lowBat ? 'var(--rd)' : 'var(--ac,var(--gy))';
        const badgeIcon = r.loading ? '⏳' : (BADGE_ICON[r.status] || '•');

        const c = document.createElement('div');
        c.className = `bb-ca ${r.loading ? 'loading' : r.status}${lowBat ? ' warn-bat' : ''}`;
        c.dataset.id = r.id;
        if (rmMode) c.classList.add('selectable');
        if (rmSet.has(r.id)) c.classList.add('selected');

        c.innerHTML = `
            <div class="bb-ca-badge" style="background:${barColor}">${badgeIcon}</div>
            <div class="bb-ca-head">
                <div class="bb-ca-name">${r.name}</div>
                <div class="bb-ca-mid">
                    <div class="bb-ca-st">${r.loading ? '⏳ 로딩 중' : STI[r.status]+' '+STL[r.status]}${showPlug ? ' 🔌' : ''}${showWireless ? ' ⚡' : ''}</div>
                    ${showMissionOff ? '<div class="bb-mission-off">임무 OFF</div>' : ''}
                </div>
            </div>
            <div class="bb-ca-batt-row" style="${(off || r.loading) ? 'visibility:hidden' : ''}">
                <div class="bb-ca-bar" style="border-color:${barColor}">
                    <div class="bb-ca-bar-fill${chargingPulse ? ' charging-pulse' : ''}" style="width:${pct}%;background:${barColor}"></div>
                    <span class="bb-ca-bar-pct">${r.battery}%</span>
                </div>
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

            // 더블클릭 → Info 패널
            c.addEventListener('dblclick', e => {
                e.stopPropagation();
                openInfoCardPanel(r);
            });
        }

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
    // SECTION 9b. 기체 Info 패널
    // ============================================================
    // ============================================================
    // 배터리 증감 로그 (당일 08:00~익일 03:00만 보관, 자동 초기화)
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

    function wblGetDayKey() {
        const now = new Date();
        const h = now.getHours();
        if (h >= 8) return wblLocalDateStr(now);
        if (h < 3) {
            const y = new Date(now); y.setDate(y.getDate() - 1);
            return wblLocalDateStr(y);
        }
        return null;   // 03~08시: 비활성 구간
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

    // 08:00~익일 03:00 하루 주기를 반영한 분(min) 값 -- 00~02시대는 "그날의 끝자락"이라 +1440(하루)를 더해 정렬/좌표 계산에 씀
    function wblDayAdjMin(hhmm) {
        const m = wblToMin(hhmm);
        return m < 8 * 60 ? m + 1440 : m;
    }

    // 연속된 같은 상태를 하나의 구간으로 묶기
    // source: 'today'(기본) 또는 'yesterday' — 각각 알맞은 저장소에서 그날 데이터 반환, 없으면 null
    function wblGetSourceData(source) {
        if (source === 'yesterday') {
            try {
                const data = JSON.parse(localStorage.getItem('bb_battery_log_yesterday') || 'null');
                if (!data || data.day !== wblYesterdayDayKey()) return null;
                return data;
            } catch { return null; }
        }
        const dayKey = wblGetDayKey();
        if (!dayKey) return null;
        const data = wblLoad();
        if (!data || data.day !== dayKey) return null;
        return data;
    }

    function wblGetSegments(robotId, source) {
        const data = wblGetSourceData(source);
        if (!data) return [];
        const entry = data.entries[robotId];
        if (!entry || entry.log.length === 0) return [];
        const sortedLog = [...entry.log].sort((a, b) => wblDayAdjMin(a.t) - wblDayAdjMin(b.t));

        const segments = [];
        sortedLog.forEach(pt => {
            const last = segments[segments.length - 1];
            if (last && last.status === pt.status) {
                last.end = pt.t;
                last.endBattery = pt.battery;
                last.points.push(pt);
            } else {
                segments.push({ status: pt.status, start: pt.t, end: pt.t, startBattery: pt.battery, endBattery: pt.battery, points: [pt] });
            }
        });
        return segments;
    }

    function wblSummarizeToday(robotId, source) {
        const segments = wblGetSegments(robotId, source);
        if (segments.length === 0) return null;

        return segments.map(seg => {
            const durMin = Math.max(10, wblToMin(seg.end) - wblToMin(seg.start) + 10);
            const label = WBL_STL[seg.status] || seg.status;
            const dotColor = CLUSTER_AC[seg.status] || 'var(--mu)';
            const dot = `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${dotColor};margin-right:2px;vertical-align:1px;"></span>`;
            const head  = `${dot} ${label} ${seg.start}~${seg.end}`;

            if (seg.status === 'off' || seg.startBattery == null || seg.endBattery == null) {
                return `${head}`;
            }
            const delta = seg.endBattery - seg.startBattery;
            if (delta === 0) {
                return `${head} · ${seg.startBattery}% 유지`;
            }
            const rate = durMin > 0 ? (delta / durMin * 60).toFixed(1) : '0';
            return `${head} · ${seg.startBattery}%→${seg.endBattery}% (시간당 ${rate>0?'+':''}${rate}%)`;
        });
    }

    // 오늘 08:00 기준 분(min) 좌표로 SVG 선그래프 그리기 (미측정 구간은 점선으로 끊음)
    function wblRenderChartSVG(robotId, source) {
        const isLight = bbEl.classList.contains('bb-light');
        const gridEdge  = isLight ? '#b3a687' : '#3a3a40';
        const gridMid   = isLight ? '#cabf9d' : '#242428';
        const tickLine  = isLight ? '#cabf9d' : '#1c1c20';
        const labelText = isLight ? '#7a6f5c' : '#9ca3af';
        const hintText  = isLight ? '#7a6f5c' : '#6b7280';
        const dotFill   = isLight ? '#2b2418' : '#e5e7eb';
        const haloColor = isLight ? '#f8f3e6' : '#0d1117';
        if (source !== 'yesterday') {
            const dayKey = wblGetDayKey();
            if (!dayKey) return '<div style="font-size:13px;color:var(--mu);padding:30px;text-align:center;">비활성 시간대(03~08시)입니다</div>';
        }
        const data = wblGetSourceData(source);
        if (!data) return `<div style="font-size:13px;color:var(--mu);padding:30px;text-align:center;">${source==='yesterday' ? '어제' : '오늘'} 기록된 데이터 없음</div>`;
        const entry = data.entries[robotId];
        if (!entry || entry.log.length === 0) return `<div style="font-size:13px;color:var(--mu);padding:30px;text-align:center;">${source==='yesterday' ? '어제' : '오늘'} 기록된 데이터 없음</div>`;

        const PX_PER_MIN = 2.9, H = 252, PADX = 19, PADT = 17, PADB = 31;
        const dayStartMin = 8 * 60;
        const spanMin = source === 'yesterday'
            ? 19 * 60   // 어제는 이미 끝난 하루(08:00~익일03:00)이니 항상 전체 구간
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

        const colorOf = (status) => CLUSTER_AC[status] || '#3b82f6';

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
	// - 업로드: CYH만, 08:00~17:30 자동(30분 주기, 실패시 1분 뒤 1회 재시도) / 수동은 08:00~익일03:10 가능(03:10~08:00은 거부)
	// - 다운로드: CYH 제외 전원, 08:00~익일 03:00, 30분 주기 자동(실패시 1분 뒤 1회 재시도) (+ 수동 강제 버튼)
	// - 병합: CYH 데이터가 겹치는 시간대는 덮어씀(더 연속적이고 정확하다고 판단)
	// - 어제 데이터: 트래킹 데이(08:00~익일03:00) 기준 하루 전 스냅샷, 세션당 1회만 로드
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

	// 트래킹 데이 기준 "어제" 날짜 계산 (08:00~익일03:00 하루 주기를 그대로 하루 앞으로 민 것)
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

	// 그 외 사용자 자동 다운로드 — 08:00~익일 03:00, 30분 슬롯당 1회 시도, 실패시 1분 뒤 1회만 재시도
	let _wblDlRetryTimer = null;
	async function wblOthersAutoDownloadTick() {
		if (localStorage.getItem('bb_is_cyh') === '1') return;
		if (!wblGetDayKey()) return;   // 03~08시 비활성 구간

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
	        if (!dayKey) return;
	        const local = wblLoad();
	        const hasToday = local && local.day === dayKey && Object.keys(local.entries || {}).length > 0;
	        if (!hasToday) wblDoDownload();   // 새 브라우저 등 → 서버 진행분으로 한 번 따라잡기 (병합 방식이라 안전)
	        return;
	    }
	    if (!wblGetDayKey()) return;
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

	// 03:30 — 그날의 배터리 로그를 로컬에서 정리 (다음날 첫 접속에서도 wblEnsureDay가 자동으로 새로 시작하지만, 켜져있는 상태라면 더 일찍 정리)
	function wblMidnightCleanupTick() {
		const now = new Date();
		if (now.getHours() !== 3 || now.getMinutes() < 30) return;
		const doneKey = wblTodayStr();
		if (localStorage.getItem('bb_cleanup_done_day') === doneKey) return;
		localStorage.setItem('bb_cleanup_done_day', doneKey);
		localStorage.removeItem('bb_battery_log');
		console.log('[BB] 03:30 - 배터리 로그 정리 완료');
	}


    // 그래프 좌우 드래그(패닝) — 전역에 한 번만 등록해서 패널 열 때마다 리스너가 쌓이지 않게 함
    let _wblDragEl = null, _wblDragStartX = 0, _wblDragStartScroll = 0;
    document.addEventListener('mousedown', (e) => {
        const el = e.target.closest('.bb-wbl-scroll');
        if (!el) return;
        _wblDragEl = el;
        _wblDragStartX = e.pageX;
        _wblDragStartScroll = el.scrollLeft;
        el.style.cursor = "url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/cur_hold.png') 32 32, grabbing";
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


    function wblComputeTop5() {
        const dayKey = wblGetDayKey();
        if (!dayKey) return { drops: [], charges: [] };
        const data = wblLoad();
        if (!data || data.day !== dayKey) return { drops: [], charges: [] };

        const drops = [];   // {id, name, rate}  rate: 시간당 %, 음수
        const charges = []; // {id, name, rate}  rate: 시간당 %, 양수(작을수록 느림)

        Object.keys(data.entries).forEach(robotId => {
            const segments = wblGetSegments(robotId);
            let worstDrop = null;
            let slowestCharge = null;

            segments.forEach(seg => {
                if (seg.startBattery == null || seg.endBattery == null) return;
                const durMin = Math.max(10, wblToMin(seg.end) - wblToMin(seg.start) + 10);
                const rate = (seg.endBattery - seg.startBattery) / durMin * 60;

                if (rate < 0 && (worstDrop === null || rate < worstDrop)) worstDrop = rate;
                if (seg.status === 'charging' && rate > 0 && (slowestCharge === null || rate < slowestCharge)) slowestCharge = rate;
            });

            const name = data.entries[robotId].name;
            if (worstDrop !== null) drops.push({ id: robotId, name, rate: worstDrop });
            if (slowestCharge !== null) charges.push({ id: robotId, name, rate: slowestCharge });
        });

        drops.sort((a, b) => a.rate - b.rate);        // 더 큰 음수(급한 소모) 먼저
        charges.sort((a, b) => a.rate - b.rate);       // 더 작은 양수(느린 충전) 먼저

        return { drops: drops.slice(0, 5), charges: charges.slice(0, 5) };
    }

    let _top5CloseHandler = null;
    function registerTop5PanelClose() {
        const panel = document.getElementById('bb-top5-panel');
        if (_top5CloseHandler) {
            document.removeEventListener('mousedown', _top5CloseHandler);
            _top5CloseHandler = null;
        }
        setTimeout(() => {
            _top5CloseHandler = function closeTop5(e) {
                if (!panel.contains(e.target)) {
                    panel.classList.remove('open');
                    document.removeEventListener('mousedown', _top5CloseHandler);
                    _top5CloseHandler = null;
                }
            };
            document.addEventListener('mousedown', _top5CloseHandler);
        }, 100);
    }

    function openTop5Panel() {
        const { drops, charges } = wblComputeTop5();
        const panel = document.getElementById('bb-top5-panel');
        const bodyEl = document.getElementById('bb-top5-body');

        const row = (item, isDrop) => `
            <div class="bb-top5-row" data-id="${item.id}">
                <span class="bb-top5-name">${item.name}</span>
                <span class="bb-top5-rate" style="color:${isDrop ? '#ef4444' : '#fb923c'};">시간당 ${item.rate>0?'+':''}${item.rate.toFixed(1)}%</span>
            </div>`;

        bodyEl.innerHTML = `
            <div class="bb-top5-col">
                <div class="bb-top5-col-title" style="color:#ef4444;">🔻 배터리 소모 속도 빠른 순</div>
                ${drops.length ? drops.map(d => row(d, true)).join('') : '<div class="bb-top5-empty">오늘 기록 없음</div>'}
            </div>
            <div class="bb-top5-col">
                <div class="bb-top5-col-title" style="color:#fb923c;">🐢 배터리 충전 속도 느린 순</div>
                ${charges.length ? charges.map(c => row(c, false)).join('') : '<div class="bb-top5-empty">오늘 기록 없음</div>'}
            </div>
        `;

        bodyEl.querySelectorAll('.bb-top5-row').forEach(el => {
            el.addEventListener('click', () => {
                const r = DB.find(x => x.id === el.dataset.id);
                if (r) {
                    panel.classList.remove('open');
                    _infoPanelReturnToTop5 = true;
                    openInfoCardPanel(r);
                }
            });
        });

        panel.classList.add('open');
        registerTop5PanelClose();
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
        titleEl.textContent = r.name;

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
                    <div class="bb-icp-section-title" style="display:flex;align-items:center;justify-content:space-between;">
                        <span id="bb-icp-wbl-title-text">오늘 배터리 증감 추이${wblGetSourceData('today')?.day ? ' [' + wblFormatMonthDay(wblGetSourceData('today').day) + ']' : ''}</span>
                        <button class="bb-btn" id="bb-icp-wbl-toggle" style="font-size:13px;font-weight:900;padding:3px 8px;">어제 데이터 보기</button>
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
        }

        let _infoPanelCloseHandler = null;
        let _infoPanelReturnToTop5 = false;
        function closeInfoCardPanel() {
            document.getElementById('bb-info-card-panel').classList.remove('open');
            if (_infoPanelReturnToTop5) {
                _infoPanelReturnToTop5 = false;
                openTop5Panel();
            }
        }
        function registerInfoPanelClose() {
            const panel = document.getElementById('bb-info-card-panel');
            if (_infoPanelCloseHandler) {
                document.removeEventListener('mousedown', _infoPanelCloseHandler);
                _infoPanelCloseHandler = null;
            }
            setTimeout(() => {
                _infoPanelCloseHandler = function closeInfo(e) {
                    if (!panel.contains(e.target)) {
                        closeInfoCardPanel();
                        document.removeEventListener('mousedown', _infoPanelCloseHandler);
                        _infoPanelCloseHandler = null;
                    }
                };
                document.addEventListener('mousedown', _infoPanelCloseHandler);
            }, 100);
        }

        function openInfoSearchMode() {
            const panel   = document.getElementById('bb-info-card-panel');
            const titleEl = document.getElementById('bb-icp-title');
            const badgeEl = document.getElementById('bb-icp-badge');
            const bodyEl  = document.getElementById('bb-icp-body');

            titleEl.textContent = '기체 정보 조회';
            badgeEl.style.display = 'none';
            panel.classList.add('search-mode');

            let searchFocusIdx = -1;

            function renderList(query) {
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
            renderList('');
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
            if (rmSet.size > 0) { ids = ids.filter(id => !rmSet.has(id)); save(); }
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
        const res  = DB.filter(r => (q===''||r.name.includes(q)) && !ids.includes(r.id) && !isClusterMember(r))
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
    document.getElementById('bb-rmbtn').addEventListener('click', toggleRm);

    document.getElementById('bb-ap-close').addEventListener('click', () => {
        document.getElementById('bb-alert-panel').classList.remove('open');
    });

    document.getElementById('bb-top5-btn').addEventListener('click', openTop5Panel);
    document.getElementById('bb-top5-close').addEventListener('click', () => {
        document.getElementById('bb-top5-panel').classList.remove('open');
        if (_top5CloseHandler) {
            document.removeEventListener('mousedown', _top5CloseHandler);
            _top5CloseHandler = null;
        }
    });

    document.getElementById('bb-icp-close').addEventListener('click', () => {
        closeInfoCardPanel();
    });

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
        const _now = new Date();
        const _minutesNow = _now.getHours() * 60 + _now.getMinutes();
        if (_minutesNow >= 190 && _minutesNow < 480) { alert('❌ 지금은 업로드할 수 없는 시간대입니다 (08:00~익일 03:10 사이에 이용해주세요)'); return; }
        if (!confirm('배터리 데이터를 업로드 하시겠습니까?')) return;
        const btn = e.currentTarget;
        const orig = btn.textContent;
        btn.textContent = '⏳ 업로드 중...'; btn.disabled = true;
        const ok = await wblDoUpload();
        btn.textContent = ok ? '✅ 완료' : '❌ 실패';
        setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1500);
    });
    document.getElementById('bb-wbl-download-btn').addEventListener('click', async (e) => {
        if (!confirm('배터리 데이터를 불러오시겠습니까?')) return;
        const btn = e.currentTarget;
        const orig = btn.textContent;
        btn.textContent = '⏳ 불러오는 중...'; btn.disabled = true;
        const ok = await wblDoDownload();
        btn.textContent = ok ? '✅ 완료' : '❌ 실패(오늘 데이터 없음)';
        setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1500);
    });

    document.getElementById('bb-inforequest-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openInfoSearchMode();
    });

    document.getElementById('bb-sortname-btn').addEventListener('click', () => {
        ids.sort((a, b) => {
            const ra = DB.find(x => x.id === a);
            const rb = DB.find(x => x.id === b);
            return (ra?.name || '').localeCompare(rb?.name || '', 'ko');
        });
        save();
        render();
    });

    let _infoPanelSimpleCloseHandler = null;
    function registerInfoPanelSimpleClose() {
        const panel = document.getElementById('bb-info-panel');
        if (_infoPanelSimpleCloseHandler) {
            document.removeEventListener('mousedown', _infoPanelSimpleCloseHandler);
            _infoPanelSimpleCloseHandler = null;
        }
        setTimeout(() => {
            _infoPanelSimpleCloseHandler = function closeInfo(e) {
                if (!panel.contains(e.target)) {
                    panel.classList.remove('open');
                    document.removeEventListener('mousedown', _infoPanelSimpleCloseHandler);
                    _infoPanelSimpleCloseHandler = null;
                }
            };
            document.addEventListener('mousedown', _infoPanelSimpleCloseHandler);
        }, 100);
    }

    document.getElementById('bb-infobtn').addEventListener('click', () => {
        const panel = document.getElementById('bb-info-panel');
        const nowOpen = panel.classList.toggle('open');
        if (nowOpen) registerInfoPanelSimpleClose();
    });
    document.getElementById('bb-info-close').addEventListener('click', () => {
        document.getElementById('bb-info-panel').classList.remove('open');
        if (_infoPanelSimpleCloseHandler) {
            document.removeEventListener('mousedown', _infoPanelSimpleCloseHandler);
            _infoPanelSimpleCloseHandler = null;
        }
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

	// 동숲 주민
	(function() {
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
			charIdx = (charIdx + delta + walkerFiles.length) % walkerFiles.length;
			localStorage.setItem(WALKER_IDX_KEY, String(charIdx));
			renderWalker();
		}

		walkerEl.addEventListener('click', () => toggleBubble());

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
            '현철님은 매크로도 이겨...',
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
			currentAlerts.forEach(a => {
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
		
		// ── 기본값 ON이므로 페이지 로드 시 바로 재생 시작 ──
		bubbleEl.classList.add('open');
		bubbleStepIdx = 0;
		playNextBubbleStep();

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
            dragging = true;
            const rect = bb.getBoundingClientRect();
            ox = e.clientX - rect.left;
            oy = e.clientY - rect.top;
            handle.style.cursor = "url('https://raw.githubusercontent.com/ubase00070/monitoring_data_vault/main/animal_crossing/cur_hold.png') 32 32, grabbing";
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
			const listRes = await fetch('https://multimonitoring.vercel.app/api/battery');
			const listData = await listRes.json();
			const names = (listData.names || []).filter(n => n !== WBL_HANDOVER_NAME && n !== WBL_YESTERDAY_NAME);
			if (!names.length) { alert('❌ 저장된 백업 없음'); return; }
			const choice = prompt(`복원할 백업을 선택하세요:\n\n${names.map((n,i) => `${i+1}. ${n}`).join('\n')}\n\n번호 또는 이름 입력:`);
			if (!choice) return;

			const num = parseInt(choice);
			const name = (!isNaN(num) && num >= 1 && num <= names.length)
				? names[num - 1]
				: names.find(n => n === choice.trim());
			if (!name) { alert('❌ 해당 백업 없음'); return; }
			const res = await fetch(`${BACKUP_BASE}?name=${encodeURIComponent(name)}`);
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
    applyCampingBackground();

})();

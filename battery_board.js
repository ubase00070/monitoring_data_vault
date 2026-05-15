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
            width:740px; background:var(--bg);
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
        .bb-hd-title { font-size:16px; font-weight:900; color:var(--tx); display:flex; align-items:center; gap:7px; }
        .bb-dot { width:7px; height:7px; border-radius:50%; background:var(--gn); animation:bb-blink 2s infinite; }
        .bb-dot.err { background:var(--rd); }
        @keyframes bb-blink { 0%,100%{opacity:1} 50%{opacity:.2} }
        .bb-hd-time { display:flex; align-items:baseline; gap:8px; }
        .bb-clock { font-family:'Lato',monospace; font-size:13px; font-weight:900; color:var(--mu); letter-spacing:.8px; }
        .bb-ref   { font-size:11px; color:var(--mu); font-weight:700; }
        .bb-hd-right { position:absolute; right:14px; top:50%; transform:translateY(-50%); display:flex; align-items:center; gap:7px; }
        .bb-hd-left  { position:absolute; left:14px; top:50%; transform:translateY(-50%); display:flex; align-items:center; }

        /* ── 알림 버튼 ── */
        .bb-alert-btn {
            padding:5px 10px; border-radius:6px;
            border:1px solid var(--bd2); background:var(--sur2);
            color:var(--mu); font-size:12px; font-weight:700;
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
            padding:0 5px; font-size:10px; font-weight:900;
            min-width:18px; text-align:center;
        }
        .bb-alert-btn:not(.has-alert) .bb-alert-count { background:var(--bd2); color:var(--tx); }

        /* ── 공통 버튼 ── */
        .bb-src-badge { font-size:10px; font-weight:700; padding:2px 7px; border-radius:4px; letter-spacing:.4px; }
        .bb-src-badge.rest { background:rgba(34,197,94,.15); color:var(--gn); border:1px solid rgba(34,197,94,.3); }
        .bb-src-badge.idle { background:var(--gy2); color:var(--mu); border:1px solid rgba(75,85,99,.3); }
        .bb-src-badge.err  { background:var(--rd2); color:var(--rd); border:1px solid rgba(239,68,68,.3); }
        .bb-btn {
            padding:5px 13px; border-radius:6px; border:1px solid var(--bd2);
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
            color:var(--tx); font-size:12px;
            font-family:'Lato','Noto Sans KR',sans-serif;
            outline:none; transition:border-color .2s;
        }
        .bb-si:focus { border-color:var(--bl); }
        .bb-si::placeholder { color:var(--mu); }
        .bb-si-icon { position:absolute; left:21px; top:50%; transform:translateY(-50%); font-size:11px; color:var(--mu); pointer-events:none; }
        #bb-dd {
            position:absolute; top:100%; left:0; right:0;
            background:var(--sur2); border:1px solid var(--bd2);
            border-radius:0 0 8px 8px; max-height:240px; overflow-y:auto;
            z-index:999999999; display:none; box-shadow:0 8px 24px rgba(0,0,0,.7);
        }
        #bb-dd.open { display:block; }
        .bb-di {
            padding:8px 13px; font-size:12px; font-weight:700; cursor:pointer;
            display:flex; justify-content:space-between; align-items:center;
            border-bottom:1px solid var(--bd); transition:background .1s;
        }
        .bb-di:last-child { border-bottom:none; }
        .bb-di:hover { background:var(--bd); }
        .bb-di-plus { font-size:17px; color:var(--gn); font-weight:900; line-height:1; }

        /* ── 카드 그리드 ── */
        .bb-gw { padding:10px 12px; flex-shrink:0; }
        .bb-gr { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
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
        .bb-ca.off        { --ac:#4b5563;  background:var(--gy2); }
        .bb-ca.loading    { --ac:#52525e;  background:var(--sur); opacity:0.5; }
        .bb-ca.delivering { --ac:var(--pk); background:var(--pk2); }
        .bb-ca.warn-bat   { animation:bb-warnBlink 0.8s infinite; }
        @keyframes bb-warnBlink {
            0%,100% { border-color:var(--rd); box-shadow:0 0 0 1px var(--rd); }
            50%     { border-color:transparent; box-shadow:none; }
        }
        .bb-ca-name { font-size:16px; font-weight:900; color:var(--tx); line-height:1.1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; letter-spacing:-.2px; }
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
        .bb-li  { display:flex; align-items:center; gap:4px; font-size:11px; color:var(--mu); font-weight:700; }
        .bb-ld  { width:6px; height:6px; border-radius:50%; }
        .bb-rmhint { font-size:11px; color:var(--rd); font-weight:700; display:none; opacity:.85; }
        .bb-rmhint.show { display:block; }
        /* ── 고정 모니터링 그리드 ── */
        .bb-mg { padding:6px 12px; border-top:1px solid var(--bd); flex-shrink:0; background:var(--bg); }
        .bb-mg-row { display:flex; align-items:center; gap:6px; padding:3px 0; border-bottom:1px solid rgba(255,255,255,.04); }
        .bb-mg-row:last-child { border-bottom:none; }
        .bb-mg-label { font-size:10px; font-weight:900; color:var(--mu); width:120px; flex-shrink:0; letter-spacing:.3px; }
        .bb-mg-icons { display:flex; gap:4px; flex-wrap:wrap; }
        .bb-mi {
            width:22px; height:22px; border-radius:50%;
            border:2px solid var(--ac,var(--gy));
            color:var(--ac,var(--gy)); font-size:9px; font-weight:900;
            display:flex; align-items:center; justify-content:center;
            font-family:'Lato',monospace;
        }
        .bb-mi.charging   { --ac:var(--gn); }
        .bb-mi.patrolling { --ac:var(--bl); }
        .bb-mi.delivering { --ac:var(--pk); }
        .bb-mi.standby    { --ac:#c8ccd4; }
        .bb-mi.off        { --ac:#4b5563; }

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
        .bb-ap-title { font-size:13px; font-weight:900; color:var(--tx); }
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
            font-size:10px; color:var(--mu);
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
        .bb-ap-name { font-size:13px; font-weight:900; color:var(--tx); }
        .bb-ap-desc { font-size:11px; color:var(--mu); font-weight:700; }
        .bb-ap-dismiss {
            display:none; padding:3px 8px; border-radius:4px;
            font-size:11px; font-weight:700;
            background:var(--rd2); color:var(--rd);
            border:1px solid rgba(239,68,68,.3); cursor:pointer;
            white-space:nowrap;
        }
        .bb-ap-item:hover .bb-ap-dismiss { display:block; }
        .bb-ap-empty { padding:24px; text-align:center; font-size:12px; color:var(--mu); font-weight:700; }
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
                <div class="bb-hd-left">
                    <button class="bb-alert-btn" id="bb-alertBtn">
                        <span>🚨 알림</span>
                        <span class="bb-alert-count" id="bb-alertCount">0건</span>
                    </button>
                </div>
                <div class="bb-hd-title">
                    <div class="bb-dot" id="bb-dot"></div>
                    배터리 현황판
                    <span class="bb-src-badge idle" id="bb-srcBadge">대기</span>
                </div>
                <div class="bb-hd-time">
                    <div class="bb-clock" id="bb-clk">00:00:00</div>
                    <div class="bb-ref" id="bb-ref">— 초 후 갱신</div>
                </div>
                <div class="bb-hd-right">
                    <button class="bb-btn so" id="bb-sortBtn">이름 순 정렬</button>
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
                    <div class="bb-mg-label">성남시 삼평&서현</div>
                    <div class="bb-mg-icons" id="bb-mg-seongnam"></div>
                </div>
            </div>
            <div class="bb-ft">
                <div class="bb-leg">
                    <div class="bb-li"><div class="bb-ld" style="background:#22c55e"></div>충전 중</div>
                    <div class="bb-li"><div class="bb-ld" style="background:#3b82f6"></div>순찰 중</div>
                    <div class="bb-li"><div class="bb-ld" style="background:#c8ccd4"></div>대기 중</div>
                    <div class="bb-li"><div class="bb-ld" style="background:#ec4899"></div>배달 중</div>
                    <div class="bb-li"><div class="bb-ld" style="background:#4b5563"></div>OFF</div>
                </div>
                <div class="bb-rmhint" id="bb-rmhint">카드 선택 → 완료로 제거</div>
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
    `;
    document.body.appendChild(wrap);

    // ============================================================
    // SECTION 1. 상수 & 상태
    // ============================================================
    const MAX = 24;
    const LS         = 'bb_ids';
    const LS_TOGGLE  = 'bb_toggles';
    const LS_ZOMBIE  = 'bb_zombie';
    const STL = { charging:'충전 중', patrolling:'순찰 중', delivering:'배달 중', standby:'대기 중', off:'OFF' };
    const STI = { charging:'🟢', patrolling:'🔵', delivering:'🩷', standby:'⚪', off:'⚫' };
    const DELIVERY_TYPES = ['DELIVERY', 'NB_ORDER_DELIVERY'];

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

    // 해제된 알림 (메모리에만, 새로고침 시 초기화)
    const dismissedAlerts = new Set();
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
        } else if (rs.isCharging || (rs.isWirelessChargerConnected && rs.isOnWirelessChargerDock)) {
            status = 'charging';
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
        return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }
    function minAgo(isoStr) {
        if (!isoStr) return 9999;
        return Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000);
    }
    function alertKey(type, id) { return `${type}::${id}`; }

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
            const isDelivery = DELIVERY_TYPES.includes(raw.service?.serviceType);

            // ── 기능1: 대기중 20분 이상 (배달용 제외) ─────────────
            if (!isDelivery && status === 'standby') {
                const mins = minAgo(rs.lastOperatedAt);
                if (mins >= 20) {
                    const key = alertKey('standby', id);
                    if (!dismissedAlerts.has(key)) alerts.push({
                        key, type:'standby', dot:'rd', name,
                        desc:`대기중 ${mins}분 | 마지막 조작: ${rs.lastOperatedUserName || '없음'} ${fmt(rs.lastOperatedAt)}`,
                        time: fmt(new Date().toISOString())
                    });
                }
            }

            // ── 기능2: 배터리 21% 이하 (전 기체) ──────────────────
            if (rs.isConnecting && battery > 0 && battery <= 21) {
                const key = alertKey('battery', id);
                if (!dismissedAlerts.has(key)) alerts.push({
                    key, type:'battery', dot:'ye', name,
                    desc:`배터리 ${battery}% | ${STL[status]}`,
                    time: fmt(new Date().toISOString())
                });
            }

            // ── 기능3: ON/OFF 반복 (10분 내 6회 전환) ─────────────
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

            // ── 기능4: 좀비 상태 (켜짐인데 battery/GPS/속도 없음) ─
            {
                const isZombie =
                    rs.isConnecting === true &&
                    (raw.battery == null || raw.battery === 0) &&
                    (rs.velocity == null || rs.velocity === 0) &&
                    rs.navpvtHorzAccuracy == null;

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
        });

        saveToggles(toggles);
        saveZombie(zombie);
        cleanToggles();
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

        const order = { zombie:0, standby:1, toggle:2, battery:3 };
        const sorted = [...alerts].sort((a, b) => (order[a.type]??9) - (order[b.type]??9));

        const sections = {
            zombie:  { title:'🔴 좀비 추정', items:[] },
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

    renderMonitorGrid(allRaw);

    function dismiss(key) {
        dismissedAlerts.add(key);
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
            ids = ids.filter(id => DB.some(r => r.id === id));
            save();
            setDataSource('rest');

            const alerts = detectAlerts(allRaw);
            renderAlertPanel(alerts);
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
        if (rmMode) { rmMode = false; rmSet.clear(); updateRmUI(); }
        hideDd();
    }

    document.addEventListener('keydown', e => {
        if (!e.altKey || e.code !== 'KeyZ') return;
        e.preventDefault();
        const h = location.host;
        const allowed =
            (h === 'go.neubie.ai' && location.pathname.includes('/ko/remote/multiple/driving')) ||
            h.endsWith('vercel.app');
        if (!allowed) return;
        isOpen ? closeBoard() : openBoard();
    });

    document.getElementById('bb-alertBtn').addEventListener('click', () => {
        const panel = document.getElementById('bb-alert-panel');
        panel.classList.toggle('open');
        if (panel.classList.contains('open')) renderAlertPanel(currentAlerts);
    });
    document.getElementById('bb-ap-close').addEventListener('click', () => {
        document.getElementById('bb-alert-panel').classList.remove('open');
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
        if (!isOpen) return;
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
        setTimeout(() => { btn.textContent = '이름 순 정렬'; }, 1200);
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

    const siEl = document.getElementById('bb-si');
    siEl.addEventListener('click', showDd);
    siEl.addEventListener('input', showDd);
    siEl.addEventListener('keydown', e => { if (e.key==='Enter') e.preventDefault(); });

    document.addEventListener('mousedown', e => {
        if (!e.target.closest('#bb-sb') && !e.target.closest('#bb-dd') && !e.target.closest('#bb-alert-panel')) hideDd();
    });

    // ============================================================
    // SECTION 15. 토큰 발송
    // ============================================================
    setTimeout(() => {
        const _token = localStorage.getItem('AccessToken');
        if (_token) {
            document.dispatchEvent(new CustomEvent('bb_token', { detail: _token }));
            console.log('[BB] bb_token 발송 완료');
        } else {
            console.log('[BB] AccessToken 없음');
        }
    }, 200);

    render();

})();

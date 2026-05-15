/* ============================================================
   battery_board.js
   뉴비고 배터리 현황판 — 템퍼몽키 inject용 완성 스크립트
   GitHub: ubase00070/monitoring_data_vault
   ============================================================ */

(function () {
    'use strict';

    // ============================================================
    // SECTION 0. 스타일 & HTML inject
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
        }
        #bb-wrap * { box-sizing: border-box; }

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
        .bb-dot.warn { background:var(--ye); }
        @keyframes bb-blink { 0%,100%{opacity:1} 50%{opacity:.2} }
        .bb-hd-time { display:flex; align-items:baseline; gap:8px; }
        .bb-clock { font-family:'Lato',monospace; font-size:13px; font-weight:900; color:var(--mu); letter-spacing:.8px; }
        .bb-ref { font-size:11px; color:var(--mu); font-weight:700; }
        .bb-hd-right { position:absolute; right:14px; top:50%; transform:translateY(-50%); display:flex; align-items:center; gap:7px; }

        .bb-src-badge { font-size:10px; font-weight:700; padding:2px 7px; border-radius:4px; letter-spacing:.4px; }
        .bb-src-badge.rest  { background:rgba(34,197,94,.15);  color:var(--gn); border:1px solid rgba(34,197,94,.3); }
        .bb-src-badge.ws    { background:rgba(59,130,246,.15);  color:var(--bl); border:1px solid rgba(59,130,246,.3); }
        .bb-src-badge.dom   { background:rgba(251,191,36,.15);  color:var(--ye); border:1px solid rgba(251,191,36,.3); }
        .bb-src-badge.err   { background:var(--rd2); color:var(--rd); border:1px solid rgba(239,68,68,.3); }
        .bb-src-badge.idle  { background:var(--gy2); color:var(--mu); border:1px solid rgba(75,85,99,.3); }

        .bb-btn {
            padding:5px 13px; border-radius:6px;
            border:1px solid var(--bd2); background:var(--sur2);
            color:var(--tx); font-size:12px;
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
            z-index:999999999; display:none;
            box-shadow:0 8px 24px rgba(0,0,0,.7);
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
        .bb-ca.charging  { --ac:var(--gn); background:var(--gn2); }
        .bb-ca.patrolling{ --ac:var(--bl); background:var(--bl2); }
        .bb-ca.standby   { --ac:#c8ccd4;   background:var(--wh); }
        .bb-ca.off       { --ac:#4b5563;   background:var(--gy2); }
        .bb-ca.loading   { --ac:#52525e;   background:var(--sur); opacity:0.5; }
        .bb-ca.warn-bat  { animation:bb-warnBlink 0.8s infinite; }
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
    `;
    document.head.appendChild(style);

    const wrap = document.createElement('div');
    wrap.id = 'bb-wrap';
    wrap.innerHTML = `
        <div id="bb">
            <div class="bb-hd">
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

            <div class="bb-ft">
                <div class="bb-leg">
                    <div class="bb-li"><div class="bb-ld" style="background:#22c55e"></div>충전 중</div>
                    <div class="bb-li"><div class="bb-ld" style="background:#3b82f6"></div>순찰 중</div>
                    <div class="bb-li"><div class="bb-ld" style="background:#c8ccd4"></div>대기 중</div>
                    <div class="bb-li"><div class="bb-ld" style="background:#4b5563"></div>OFF</div>
                </div>
                <div class="bb-rmhint" id="bb-rmhint">카드 선택 → 완료로 제거</div>
            </div>
        </div>
    `;
    document.body.appendChild(wrap);

    // ============================================================
    // SECTION 1. 상수 & DB
    // ============================================================
    const MAX = 24;
    const LS  = 'bb_ids';
    const STL = { charging:'충전 중', patrolling:'순찰 중', standby:'대기 중', off:'OFF' };
    const STI = { charging:'🟢', patrolling:'🔵', standby:'⚪', off:'⚫' };

    // 확인된 전체 사이트 ID (sites/?offset=0&limit=99999 응답 기준)
    const SITE_IDS = [
        2,22,24,25,27,36,37,40,42,44,45,46,47,48,50,51,53,56,57,59,
        62,64,65,66,72,73,75,82,86,96,100,105,108,109,111,114,115,
        117,118,119,126,131,132,134,135,137,138,140,141,142,143,144,
        145,146,147,148,150,151,154,157,173,174,177,178,179,180,181,
        182,187,193,196,199,200,202,203,212,214
    ];

    // DB: API 응답을 받기 전 초기 상태
    // 실제 기체 목록은 fetchAllRobots()에서 동적으로 채워짐
    let DB = [];

    // ============================================================
    // SECTION 2. REST API — 전체 기체 조회
    // API: /core/neubie/robots/robots/?offset=0&limit=99999&sites={siteId}
    // 응답 구조:
    //   results[].id           → 기체 고유 ID (숫자)
    //   results[].nickname     → 기체 표시명 (예: "성남서현 201")
    //   results[].battery      → 배터리 % (숫자)
    //   results[].robotStatus.isCharging          → 충전 여부
    //   results[].robotStatus.isConnecting        → 연결 여부 (false = OFF)
    //   results[].robotStatus.isWirelessChargerConnected → 무선충전 여부
    //   results[].robotStatus.isOnWirelessChargerDock    → 독 도킹 여부
    //   results[].service.serviceType             → "PATROL"|"DELIVERY" 등
    // ============================================================

    function parseRobotStatus(raw) {
        const rs = raw.robotStatus ?? {};
        const battery = raw.battery ?? rs.battery ?? 0;

        let status;
        if (!rs.isConnecting) {
            status = 'off';
        } else if (rs.isCharging || (rs.isWirelessChargerConnected && rs.isOnWirelessChargerDock)) {
            status = 'charging';
        } else if (raw.service?.serviceType === 'PATROL' || raw.service?.serviceType === 'OPENAPI_PATROL') {
            // 순찰 서비스 타입이고 실제 임무 중인지 확인
            // currentScenario가 있으면 임무 중, 없으면 대기
            status = raw.currentScenario ? 'patrolling' : 'standby';
        } else if (raw.service?.serviceType === 'DELIVERY' || raw.service?.serviceType === 'NB_ORDER_DELIVERY') {
            status = raw.currentScenario ? 'patrolling' : 'standby';
        } else {
            status = 'standby';
        }

        return { battery: Math.round(battery), status };
    }

    async function fetchSiteRobots(siteId) {
        try {
            const res = await fetch(
                `/core/neubie/robots/robots/?offset=0&limit=99999&sites=${siteId}`,
                { credentials: 'include', headers: { 'Accept': 'application/json' } }
            );
            if (!res.ok) return [];
            const json = await res.json();
            return (json.results ?? []).map(raw => ({
                id:      String(raw.id),
                name:    raw.nickname || raw.name || String(raw.id),
                siteId,
                status:  'off',
                battery: 0,
                loading: true,
                _raw:    raw   // 파싱용 임시 보관
            }));
        } catch { return []; }
    }

    async function fetchAllRobots() {
        // 77개 사이트를 병렬 fetch (same-origin 쿠키 자동 포함)
        const batches = await Promise.allSettled(
            SITE_IDS.map(sid => fetchSiteRobots(sid))
        );

        const allRobots = [];
        const seenIds   = new Set();

        for (const b of batches) {
            if (b.status !== 'fulfilled') continue;
            for (const robot of b.value) {
                if (seenIds.has(robot.id)) continue; // 중복 제거
                seenIds.add(robot.id);
                allRobots.push(robot);
            }
        }

        // DB 초기화 & 상태 파싱
        DB = allRobots.map(r => {
            const parsed = parseRobotStatus(r._raw);
            return {
                id:      r.id,
                name:    r.name,
                siteId:  r.siteId,
                status:  parsed.status,
                battery: parsed.battery,
                loading: false
            };
        });

        // localStorage에 저장된 ids 중 유효하지 않은 것 정리
        ids = ids.filter(id => DB.some(r => r.id === id));
        save();

        setDataSource('rest');
        render();
    }

    // 30초마다 전체 갱신 (사이트별 재조회)
    async function refreshAll() {
        if (refreshLock) return;
        refreshLock = true;
        try {
            await fetchAllRobots();
        } finally {
            refreshLock = false;
        }
    }

    // ============================================================
    // SECTION 3. 상태 & localStorage
    // ============================================================
    function load() {
        try {
            const s = localStorage.getItem(LS);
            if (!s) return [];
            const parsed = JSON.parse(s);
            // DB가 아직 비어있을 수 있으므로 filter 생략 후 나중에 정리
            return Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
        } catch { return []; }
    }
    function save() { localStorage.setItem(LS, JSON.stringify(ids)); }

    let ids = load();
    let rmMode = false, rmSet = new Set(), isOpen = false;
    let refreshLock = false, dataSource = 'idle';

    // ============================================================
    // SECTION 4. UI — 열기/닫기
    // ============================================================
    function openBoard() {
        isOpen = true;
        document.getElementById('bb').classList.add('open');
        render();
        if (DB.length === 0) {
            // 최초 오픈 시 기체 목록 조회
            fetchAllRobots();
        } else {
            refreshAll();
        }
    }

    function closeBoard() {
        isOpen = false;
        document.getElementById('bb').classList.remove('open');
        if (rmMode) { rmMode = false; rmSet.clear(); updateRmUI(); }
        hideDd();
    }

    // Alt+Z 토글 (go.neubie.ai 또는 vercel.app에서만)
    document.addEventListener('keydown', e => {
        if (!e.altKey || e.code !== 'KeyZ') return;
        e.preventDefault();
        const h = location.host;
        const allowed =
            (h === 'go.neubie.ai' && location.pathname.includes('/ko/remote/multiple/driving')) ||
            h.endsWith('vercel.app') ||
            h === 'claude.ai';   // 테스트용
        if (!allowed) return;
        isOpen ? closeBoard() : openBoard();
    });

    // ============================================================
    // SECTION 5. 시계 & 카운트다운
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
        if (ns <= 0) { ns = RS; refreshAll(); }
        const m = Math.floor(ns / 60), s = ns % 60;
        const el = document.getElementById('bb-ref');
        if (el) el.textContent = m > 0 ? `${m}분 ${String(s).padStart(2,'0')}초 후 갱신` : `${s}초 후 갱신`;
    }, 1000);

    // ============================================================
    // SECTION 6. 카드 렌더
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
                <div class="bb-ca-st">${r.loading ? '⏳ 로딩 중' : STI[r.status] + ' ' + STL[r.status]}</div>
                <div class="bb-ca-bat">${(off || r.loading) ? '- %' : r.battery + '%'}</div>
            </div>
            <div class="bb-ca-bar"><div class="bb-ca-fill" style="width:${(off || r.loading) ? 0 : r.battery}%"></div></div>
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

    function renderCard(id) {
        const old = document.querySelector(`.bb-ca[data-id="${id}"]`);
        if (!old) return;
        const r = DB.find(x => x.id === id);
        if (!r) return;
        old.replaceWith(makeCard(r));
    }

    // ============================================================
    // SECTION 7. 정렬 & 제거
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
    // SECTION 8. 드래그앤드롭
    // ============================================================
    let dsrc = null;
    function dstart(e) {
        dsrc = this.dataset.id;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', dsrc);
    }
    function dover(e) {
        if (!dsrc || this.dataset.id === dsrc) return;
        e.preventDefault();
        document.querySelectorAll('.bb-ca.dragover').forEach(c => { if (c !== this) c.classList.remove('dragover'); });
        this.classList.add('dragover');
    }
    function dleave(e) { if (this.contains(e.relatedTarget)) return; this.classList.remove('dragover'); }
    function ddrop(e) {
        e.preventDefault();
        const tid = this.dataset.id;
        if (!dsrc || tid === dsrc) return;
        this.classList.remove('dragover');
        const si = ids.indexOf(dsrc), di = ids.indexOf(tid);
        if (si === -1 || di === -1) return;
        ids.splice(si, 1); ids.splice(di, 0, dsrc);
        save(); render();
    }
    function dend() {
        dsrc = null;
        document.querySelectorAll('.bb-ca').forEach(c => c.classList.remove('dragging', 'dragover'));
    }

    // ============================================================
    // SECTION 9. 검색 & 드롭다운
    // ============================================================
    function showDd() {
        const siEl = document.getElementById('bb-si');
        const ddEl = document.getElementById('bb-dd');
        const q    = siEl.value.trim();
        const res  = DB
            .filter(r => (q === '' || r.name.includes(q)) && !ids.includes(r.id))
            .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

        if (ids.length >= MAX) {
            ddEl.innerHTML = `<div class="bb-di" style="color:var(--mu);cursor:default;">이미 최대 ${MAX}대 등록됨</div>`;
        } else if (res.length === 0) {
            ddEl.innerHTML = `<div class="bb-di" style="color:var(--mu);cursor:default;">${DB.length === 0 ? '기체 데이터 로딩 중...' : '검색 결과 없음'}</div>`;
        } else {
            ddEl.innerHTML = res.map(r => `
                <div class="bb-di" data-rid="${r.id}">
                    <span>${r.name}</span>
                    <span class="bb-di-plus">+</span>
                </div>
            `).join('');
            ddEl.querySelectorAll('.bb-di[data-rid]').forEach(el => {
                el.addEventListener('mousedown', e => {
                    e.preventDefault(); e.stopPropagation();
                    addRobot(el.dataset.rid);
                });
            });
        }
        ddEl.classList.add('open');
    }

    function hideDd() {
        const ddEl = document.getElementById('bb-dd');
        if (ddEl) ddEl.classList.remove('open');
    }

    function addRobot(id) {
        if (ids.length >= MAX) return;
        if (!ids.includes(id)) { ids.push(id); save(); render(); }
        showDd();
        document.getElementById('bb-si').focus();
    }

    // ============================================================
    // SECTION 10. 데이터소스 배지
    // ============================================================
    function setDataSource(src) {
        dataSource = src;
        const badge  = document.getElementById('bb-srcBadge');
        const dot    = document.getElementById('bb-dot');
        const labels = { rest:'REST API', ws:'WebSocket', dom:'DOM', err:'연결 실패', idle:'대기' };
        if (badge) { badge.className = `bb-src-badge ${src}`; badge.textContent = labels[src] ?? src; }
        if (dot)   { dot.className = 'bb-dot' + (src === 'err' ? ' err' : src === 'idle' ? '' : ''); }
    }

    // ============================================================
    // SECTION 11. 이벤트 바인딩
    // ============================================================
    document.getElementById('bb-closebtn').addEventListener('click', closeBoard);
    document.getElementById('bb-sortBtn').addEventListener('click', autoSort);
    document.getElementById('bb-rmbtn').addEventListener('click', toggleRm);

    const siEl = document.getElementById('bb-si');
    siEl.addEventListener('click', showDd);
    siEl.addEventListener('input', showDd);
    siEl.addEventListener('keydown', e => { if (e.key === 'Enter') e.preventDefault(); });

    document.addEventListener('mousedown', e => {
        if (!e.target.closest('#bb-sb') && !e.target.closest('#bb-dd')) hideDd();
    });

    // 초기 렌더 (localStorage에 저장된 카드 복원)
    render();

})();

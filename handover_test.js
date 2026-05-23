(function () {
    'use strict';

    if (window.__handoverLoaded) return;
    window.__handoverLoaded = true;

    const isMonitoringPage = location.href.includes('go.neubie.ai/ko/remote/multiple')
        || location.href.includes('multimonitoring.vercel.app');

    if (!isMonitoringPage) return;

    /* ============================================================
        SECTION 1. 상수 및 유틸
    ============================================================ */
    const HANDOVER_RAW_URL  = 'https://raw.githubusercontent.com/ubase00070/monitoring_handover/main/handover.json';
    const GITHUB_API_URL    = 'https://api.github.com/repos/ubase00070/monitoring_handover/contents/handover.json';
    const MAX_SELECT        = 6;

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    // 시크릿 탭 여부
    const isIncognito = !!window.chrome?.extension?.inIncognitoContext;

    // React input 강제 입력 (from content.js)
    function setInputValue(input, value) {
        const nativeSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value'
        ).set;
        nativeSetter.call(input, value);
        input.dispatchEvent(new Event('input',  { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    }

    // 검색 결과 대기 (from content.js)
    function waitForSearchResult(unitName, timeout = 2000) {
        return new Promise(resolve => {
            const start = Date.now();
            const check = () => {
                const spans = document.querySelectorAll('span[data-qk="robot-name"]');
                const found = Array.from(spans).some(s =>
                    s.textContent.trim() === unitName ||
                    s.textContent.trim().includes(unitName)
                );
                if (found || Date.now() - start > timeout) resolve(found);
                else setTimeout(check, 50);
            };
            check();
        });
    }

    // 템퍼몽키를 통한 GitHub API 중계 호출
    function gmGithubRequest(method, url, body = null) {
        return new Promise((resolve) => {
            const requestId = Math.random().toString(36).slice(2);

            const handler = (e) => {
                if (e.detail.requestId !== requestId) return;
                window.removeEventListener('ho_github_response', handler);
                resolve({ status: e.detail.status, text: e.detail.text });
            };
            window.addEventListener('ho_github_response', handler);

            window.dispatchEvent(new CustomEvent('ho_github_request', {
                detail: { method, url, body: body ? JSON.stringify(body) : null, requestId }
            }));
        });
    }

    /* ============================================================
        SECTION 2. 상태
    ============================================================ */
    let selectedCells  = [];
    let handoverData   = null;
    let confirmLoopId  = null;

    /* ============================================================
        SECTION 3. UI 생성
    ============================================================ */
    // ── 빼꼼 탭 ──
    const peekTab = document.createElement('div');
    peekTab.id = 'ho-peek-tab';
    peekTab.textContent = '📋 인계';
    Object.assign(peekTab.style, {
        position:'fixed', top:'0', left:'50%', transform:'translateX(-50%)',
        zIndex:'2147483647', background:'rgba(240,242,248,0.96)', color:'#1a1f2e',
        padding:'4px 20px', borderRadius:'0 0 10px 10px', fontSize:'12px',
        fontWeight:'700', fontFamily:'Pretendard,sans-serif', cursor:'pointer',
        boxShadow:'0 2px 12px rgba(0,0,0,0.3)', letterSpacing:'0.04em',
        userSelect:'none', transition:'opacity 0.2s',
        border:'1px solid rgba(200,210,230,0.6)', borderTop:'none',
    });

    // ── 메인 패널 ──
    const panel = document.createElement('div');
    panel.id = 'ho-panel';
    Object.assign(panel.style, {
        position:'fixed', top:'-340px', left:'50%', transform:'translateX(-50%)',
        zIndex:'2147483646', width:'760px',
        background:'rgba(234,238,248,0.98)',
        borderRadius:'0 0 20px 20px', padding:'14px 20px 16px',
        fontFamily:'Pretendard,sans-serif',
        boxShadow:'0 10px 40px rgba(0,0,0,0.4)',
        border:'1px solid rgba(200,210,230,0.7)', borderTop:'none',
        transition:'top 0.3s cubic-bezier(0.4,0,0.2,1)', userSelect:'none',
    });

    // 바로 시작 버튼 스타일 헬퍼
    const quickBtnStyle = (active) => `
        font-size:10px; font-weight:700; padding:2px 9px;
        border-radius:6px; border:none; cursor:${active ? 'pointer' : 'not-allowed'};
        font-family:Pretendard,sans-serif;
        background:${active ? '#3b82f6' : '#cbd5e1'};
        color:${active ? '#fff' : '#94a3b8'};
        opacity:${active ? '1' : '0.45'};
        transition:background 0.15s;
    `;

    panel.innerHTML = `
        <!-- 헤더 -->
        <div style="display:flex;justify-content:space-between;align-items:center;
            margin-bottom:12px;padding-bottom:10px;border-bottom:1.5px solid rgba(0,0,0,0.08);">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:14px;font-weight:800;color:#1a1f2e;letter-spacing:0.02em;">
                    📋 인계 기체
                </span>
                <span id="ho-badge" style="
                    font-size:10px;font-weight:700;padding:2px 8px;
                    border-radius:20px;background:#e0e7ff;color:#3730a3;
                    display:none;
                "></span>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
                <span id="ho-status-text" style="font-size:11px;color:#64748b;max-width:220px;
                    overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></span>
                <button id="ho-upload-btn" style="
                    background:#f59e0b;color:#fff;border:none;
                    padding:5px 13px;border-radius:8px;font-size:12px;
                    font-weight:700;cursor:pointer;font-family:Pretendard,sans-serif;
                    transition:background 0.15s;">📤 인계 완료</button>
            </div>
        </div>

        <!-- 그리드 -->
        <div style="display:flex;gap:14px;">

            <!-- 본인 계정 (3×2) -->
            <div style="flex:1;">
                <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px;">
                    <span style="font-size:10px;font-weight:800;color:#475569;letter-spacing:0.07em;">
                        본인 계정
                    </span>
                    <button id="ho-quick-tab1" style="${quickBtnStyle(!isIncognito)}">
                        ⚡ 바로 시작
                    </button>
                </div>
                <div id="ho-grid-tab1" style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;">
                    ${Array(6).fill(0).map((_, i) => `
                        <button class="ho-cell" data-tab="1" data-idx="${i}"
                            data-unit="" data-selected="false" data-done="false"
                            style="height:54px;border-radius:11px;
                                border:1.5px dashed #c8d2e0;
                                background:rgba(255,255,255,0.45);
                                color:#b0bec5;font-size:11px;
                                font-family:Pretendard,sans-serif;cursor:default;
                                transition:all 0.15s;
                                display:flex;align-items:center;justify-content:center;
                                text-align:center;line-height:1.35;padding:5px;">—</button>
                    `).join('')}
                </div>
            </div>

            <!-- 구분선 -->
            <div style="width:1px;background:rgba(0,0,0,0.1);border-radius:1px;margin:0 1px;"></div>

            <!-- 멀티 계정 (3×2) -->
            <div style="flex:1;">
                <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px;">
                    <span style="font-size:10px;font-weight:800;color:#475569;letter-spacing:0.07em;">
                        멀티 계정
                    </span>
                    <button id="ho-quick-tab2" style="${quickBtnStyle(isIncognito)}">
                        ⚡ 바로 시작
                    </button>
                </div>
                <div id="ho-grid-tab2" style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;">
                    ${Array(6).fill(0).map((_, i) => `
                        <button class="ho-cell" data-tab="2" data-idx="${i}"
                            data-unit="" data-selected="false" data-done="false"
                            style="height:54px;border-radius:11px;
                                border:1.5px dashed #c8d2e0;
                                background:rgba(255,255,255,0.45);
                                color:#b0bec5;font-size:11px;
                                font-family:Pretendard,sans-serif;cursor:default;
                                transition:all 0.15s;
                                display:flex;align-items:center;justify-content:center;
                                text-align:center;line-height:1.35;padding:5px;">—</button>
                    `).join('')}
                </div>
            </div>
        </div>

        <!-- 하단 -->
        <div style="margin-top:12px;display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:10px;color:#94a3b8;letter-spacing:0.02em;">
                버튼 선택 후 시작하기 &nbsp;|&nbsp;
                <kbd style="background:#e8edf5;border:1px solid #c8d2e0;
                    border-radius:4px;padding:1px 5px;font-size:10px;color:#4b5563;">Alt+M</kbd>
            </span>
            <div style="display:flex;align-items:center;gap:10px;">
                <span id="ho-select-count" style="font-size:11px;font-weight:600;color:#64748b;">
                    선택 0 / ${MAX_SELECT}
                </span>
                <button id="ho-start-btn" style="
                    background:#22c55e;color:#fff;border:none;
                    padding:8px 24px;border-radius:11px;font-size:13px;
                    font-weight:800;cursor:pointer;font-family:Pretendard,sans-serif;
                    opacity:0.35;pointer-events:none;
                    transition:all 0.2s;letter-spacing:0.02em;
                    box-shadow:0 2px 8px rgba(34,197,94,0.3);">
                    🚀 시작하기
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(peekTab);
    document.body.appendChild(panel);

    /* ============================================================
        SECTION 4. 패널 토글
    ============================================================ */
    let isPanelOpen = false;

    function openPanel()  {
        isPanelOpen = true;
        panel.style.top = '0px';
        peekTab.style.opacity = '0';
        peekTab.style.pointerEvents = 'none';
    }
    function closePanel() {
        isPanelOpen = false;
        panel.style.top = '-340px';
        peekTab.style.opacity = '1';
        peekTab.style.pointerEvents = 'auto';
    }

    peekTab.addEventListener('click', openPanel);
    document.addEventListener('mousedown', e => {
        if (isPanelOpen && !panel.contains(e.target) && e.target !== peekTab) closePanel();
    });
    document.addEventListener('keydown', e => {
        if (e.altKey && (e.key === 'm' || e.key === 'M' || e.key === 'ㅡ')) {
            e.preventDefault();
            isPanelOpen ? closePanel() : openPanel();
        }
    });

    /* ============================================================
        SECTION 5. 상태 헬퍼
    ============================================================ */
    function setStatus(msg, color = '#64748b') {
        const el = document.getElementById('ho-status-text');
        if (el) { el.textContent = msg; el.style.color = color; }
    }

    function updateSelectCount() {
        const n = selectedCells.length;
        const countEl = document.getElementById('ho-select-count');
        const startBtn = document.getElementById('ho-start-btn');
        if (countEl) countEl.textContent = `선택 ${n} / ${MAX_SELECT}`;
        if (startBtn) {
            const active = n > 0;
            startBtn.style.opacity = active ? '1' : '0.35';
            startBtn.style.pointerEvents = active ? 'auto' : 'none';
        }
    }

    function setBadge(total) {
        const badge = document.getElementById('ho-badge');
        if (!badge) return;
        if (total > 0) {
            badge.textContent = `${total}대`;
            badge.style.display = 'inline-block';
            peekTab.textContent = `📋 인계 (${total})`;
        } else {
            badge.style.display = 'none';
            peekTab.textContent = '📋 인계';
        }
    }

    /* ============================================================
        SECTION 6. 셀 스타일 헬퍼
    ============================================================ */
    function cellIdle(cell) {
        Object.assign(cell.style, {
            background:'rgba(255,255,255,0.85)', color:'#1e293b',
            border:'1.5px solid #93c5fd', cursor:'pointer', fontWeight:'600',
        });
        cell.dataset.selected = 'false';
    }
    function cellSelected(cell) {
        Object.assign(cell.style, {
            background:'rgba(59,130,246,0.13)', color:'#1d4ed8',
            border:'2px solid #3b82f6', cursor:'pointer', fontWeight:'700',
        });
        cell.dataset.selected = 'true';
    }
    function cellProcessing(cell) {
        Object.assign(cell.style, {
            background:'rgba(251,191,36,0.15)', color:'#92400e',
            border:'1.5px solid #fbbf24', cursor:'default',
        });
    }
    function cellDone(cell) {
        Object.assign(cell.style, {
            background:'rgba(203,213,225,0.35)', color:'#94a3b8',
            border:'1.5px solid #cbd5e1', cursor:'default', fontWeight:'400',
        });
        cell.dataset.done = 'true';
        cell.dataset.selected = 'false';
    }
    function cellEmpty(cell) {
        cell.textContent = '—';
        Object.assign(cell.style, {
            background:'rgba(255,255,255,0.45)', color:'#b0bec5',
            border:'1.5px dashed #c8d2e0', cursor:'default', fontWeight:'400',
        });
        cell.dataset.unit = '';
        cell.dataset.selected = 'false';
        cell.dataset.done = 'false';
    }

    /* ============================================================
        SECTION 7. 그리드 렌더링
    ============================================================ */
    function renderGrid(tab1Units = [], tab2Units = []) {
        selectedCells = [];
        updateSelectCount();

        ['tab1','tab2'].forEach((tab, ti) => {
            const units = ti === 0 ? tab1Units : tab2Units;
            document.querySelectorAll(`#ho-grid-${tab} .ho-cell`).forEach((cell, i) => {
                const name = units[i] || null;
                if (name) {
                    cell.textContent = name;
                    cell.dataset.unit = name;
                    cellIdle(cell);
                } else {
                    cellEmpty(cell);
                }
            });
        });

        updateQuickBtns(tab1Units, tab2Units);
        startConfirmLoop();
    }

    function updateQuickBtns(tab1, tab2) {
        const q1 = document.getElementById('ho-quick-tab1');
        const q2 = document.getElementById('ho-quick-tab2');
        const can1 = !isIncognito && tab1.length > 0;
        const can2 =  isIncognito && tab2.length > 0;
        if (q1) q1.style.cssText = quickBtnStyle(can1);
        if (q2) q2.style.cssText = quickBtnStyle(can2);
        if (q1) q1.style.pointerEvents = can1 ? 'auto' : 'none';
        if (q2) q2.style.pointerEvents = can2 ? 'auto' : 'none';
    }

    /* ============================================================
        SECTION 8. 셀 클릭 이벤트
    ============================================================ */
    panel.addEventListener('click', e => {
        const cell = e.target.closest('.ho-cell');
        if (!cell || !cell.dataset.unit) return;
        if (cell.dataset.done === 'true') return;

        const isSelected = cell.dataset.selected === 'true';
        if (isSelected) {
            cellIdle(cell);
            selectedCells = selectedCells.filter(c => c !== cell);
        } else {
            if (selectedCells.length >= MAX_SELECT) {
                setStatus(`⚠️ 최대 ${MAX_SELECT}대까지 선택 가능`, '#f59e0b');
                return;
            }
            cellSelected(cell);
            selectedCells.push(cell);
        }
        updateSelectCount();
        setStatus('');
    });

    /* ============================================================
        SECTION 9. 시작하기 / 바로 시작
    ============================================================ */
    document.getElementById('ho-start-btn').addEventListener('click', async () => {
        if (!selectedCells.length) return;
        const units = selectedCells.map(c => c.dataset.unit).filter(Boolean);
        await runAutoSelect(units, selectedCells);
    });

    document.getElementById('ho-quick-tab1').addEventListener('click', async () => {
        if (isIncognito || !handoverData) return;
        const units = (handoverData.tab1 || []).filter(Boolean).slice(0, MAX_SELECT);
        if (!units.length) return;
        const cells = [...document.querySelectorAll('#ho-grid-tab1 .ho-cell')]
            .filter(c => c.dataset.unit && c.dataset.done !== 'true');
        selectedCells = cells;
        cells.forEach(cellSelected);
        updateSelectCount();
        await sleep(150);
        await runAutoSelect(units, cells);
    });

    document.getElementById('ho-quick-tab2').addEventListener('click', async () => {
        if (!isIncognito || !handoverData) return;
        const units = (handoverData.tab2 || []).filter(Boolean).slice(0, MAX_SELECT);
        if (!units.length) return;
        const cells = [...document.querySelectorAll('#ho-grid-tab2 .ho-cell')]
            .filter(c => c.dataset.unit && c.dataset.done !== 'true');
        selectedCells = cells;
        cells.forEach(cellSelected);
        updateSelectCount();
        await sleep(150);
        await runAutoSelect(units, cells);
    });

    /* ============================================================
        SECTION 10. 자동 선택 실행 (from content.js)
    ============================================================ */
    async function runAutoSelect(units, cells) {
        const startBtn = document.getElementById('ho-start-btn');
        if (startBtn) { startBtn.style.opacity = '0.5'; startBtn.style.pointerEvents = 'none'; }

        // 모달 대기
        let modal = document.querySelector('[data-qk="remote-multiple-select-robot-dialog"]');
        if (!modal) {
            setStatus('⏳ 모달 대기 중...', '#3b82f6');
            modal = await new Promise(resolve => {
                const t = setTimeout(() => resolve(null), 8000);
                const obs = new MutationObserver(() => {
                    const el = document.querySelector('[data-qk="remote-multiple-select-robot-dialog"]');
                    if (el) { clearTimeout(t); obs.disconnect(); resolve(el); }
                });
                obs.observe(document.body, { childList: true, subtree: true });
            });
        }

        if (!modal) {
            setStatus('⚠️ 모달이 열리지 않음', '#ef4444');
            if (startBtn) { startBtn.style.opacity = '1'; startBtn.style.pointerEvents = 'auto'; }
            return;
        }

        let ok = 0;
        for (let i = 0; i < units.length; i++) {
            const name = units[i];
            const cell = cells[i];
            setStatus(`🔍 ${name} (${i+1}/${units.length})`, '#3b82f6');
            if (cell) cellProcessing(cell);

            const result = await checkOneUnit(name);
            if (result) {
                ok++;
                if (cell) { cellDone(cell); }
            } else {
                if (cell) {
                    Object.assign(cell.style, {
                        background:'rgba(239,68,68,0.1)', color:'#dc2626',
                        border:'1.5px solid #fca5a5',
                    });
                }
            }
        }

        selectedCells = selectedCells.filter(c => c.dataset.done !== 'true');
        updateSelectCount();

        setStatus(`✅ ${ok}/${units.length}대 완료 — 시작하기`, '#22c55e');
        await sleep(300);
        await clickStartButton();
    }

    async function checkOneUnit(unitName) {
        try {
            const searchInput =
                document.querySelector('[data-qk="monitoring-robot-list-search-form-site-search-name-input-wrapper"] input') ||
                document.querySelector('[data-qk*="search-name-input"] input') ||
                document.querySelector('section input[type="text"]');
            if (!searchInput) return false;

            // 검색어 입력 + 엔터
            searchInput.focus();
            setInputValue(searchInput, unitName);
            searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
            searchInput.dispatchEvent(new KeyboardEvent('keyup',   { key: 'Enter', keyCode: 13, bubbles: true }));

            // 필터링 대기
            await sleep(500);

            // 보이는 결과에서 클릭
            const spans = Array.from(document.querySelectorAll('span[data-qk="robot-name"]'))
                .filter(s => s.offsetParent !== null);

            let clicked = false;
            for (const span of spans) {
                if (span.textContent.trim().includes(unitName)) {
                    const label = span.closest('label');
                    if (label) { label.click(); clicked = true; break; }
                }
            }

            await sleep(200);

            // 검색창 초기화
            setInputValue(searchInput, '');
            searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
            await sleep(200);

            return clicked;
        } catch (e) {
            console.error('[checkOneUnit]', e);
            return false;
        }
    }

    async function clickStartButton() {
        await sleep(200);
        const btn = Array.from(document.querySelectorAll('button'))
            .find(b => b.textContent.trim() === '시작하기' && !b.disabled);
        if (!btn) { setStatus('⚠️ 시작하기 버튼 없음 — 직접 클릭', '#f59e0b'); return false; }
        btn.click();
        setStatus('🎉 완료!', '#22c55e');
        return true;
    }

    /* ============================================================
        SECTION 11. content.js 감시 → 연결 확인 시 회색 처리
    ============================================================ */
    function startConfirmLoop() {
        if (confirmLoopId) clearInterval(confirmLoopId);
        confirmLoopId = setInterval(() => {
            try {
                const raw = document.body.getAttribute('data-last-units');
                if (!raw) return;
                const currentUnits = JSON.parse(raw).map(u => u.replace(/\s+/g,''));

                document.querySelectorAll('.ho-cell').forEach(cell => {
                    if (cell.dataset.done === 'true' || !cell.dataset.unit) return;
                    const clean = cell.dataset.unit.replace(/\s+/g,'');
                    const connected = currentUnits.some(u =>
                        u.includes(clean) || clean.includes(u)
                    );
                    if (connected) {
                        cellDone(cell);
                        selectedCells = selectedCells.filter(c => c !== cell);
                        updateSelectCount();
                    }
                });
            } catch(e) {}
        }, 1500);
    }

    /* ============================================================
        SECTION 12. 인계 받기 — 자동 + 수동
    ============================================================ */
    async function fetchHandover() {
        try {
            const res = await gmGithubRequest('GET', GITHUB_API_URL);
            if (res.status !== 200) throw new Error(`${res.status}`);
            const json = JSON.parse(res.text);
            // UTF-8 한글 정상 디코딩
            const binary = atob(json.content.replace(/\n/g, ''));
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            return JSON.parse(new TextDecoder('utf-8').decode(bytes));
        } catch (e) {
            // fallback: raw URL
            try {
                const res2 = await fetch(HANDOVER_RAW_URL + '?t=' + Date.now());
                if (res2.ok) return await res2.json();
            } catch(e2) {}
            return null;
        }
    }

    // 페이지 진입 시 자동 fetch
    async function autoFetch() {
        const data = await fetchHandover();
        if (!data) return;
        handoverData = data;
        const tab1 = data.tab1 || data.units || [];
        const tab2 = data.tab2 || [];
        const total = tab1.length + tab2.length;
        if (total === 0) return;
        renderGrid(tab1, tab2);
        setBadge(total);
        setStatus(`📋 ${total}대 (${data.handover_by || '?'})`, '#3b82f6');
    }

    // 인계 완료 — 현재 모니터링 기체 push
    document.getElementById('ho-upload-btn').addEventListener('click', async () => {
        setStatus('⏳ 인계 업로드 중...', '#f59e0b');

        // 기체: 현재 페이지 DOM에서 직접 읽기
        let allUnits = [];
        try {
            // data-last-units 시도
            const fromAttr = document.body.getAttribute('data-last-units');
            if (fromAttr) {
                allUnits = JSON.parse(fromAttr);
            }
            // 없으면 현재 모니터링 화면 DOM에서 직접 추출
            if (!allUnits.length) {
                const selector = 'span.font-size-14.max-w-fit.truncate.font-bold.text-white';
                allUnits = Array.from(document.querySelectorAll(selector))
                    .map(el => el.innerText.trim())
                    .filter(n => n.length >= 2);
            }
        } catch(e) {}

        // otherTabUnits (다른 탭 기체) → tab2
        // 현재 탭 기체 → tab1
        // 단순하게 전체를 tab1으로 넘기고 받는 쪽이 배분
        // TODO: tab 구분이 필요하면 background.js의 otherTabUnits 활용
        // 이름: localStorage에서 읽기 (remote_logic.js가 저장해둠)
        const myName = localStorage.getItem('neubie_user_name') || '알 수 없음';

        const now = new Date();
        const ts = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;

        const payload = {
            updatedAt: ts,
            handover_by: myName,
            tab1: allUnits.slice(0, MAX_SELECT),
            tab2: allUnits.slice(MAX_SELECT, MAX_SELECT * 2)
        };

        try {
            // SHA 가져오기
            let sha = '';
            try {
                const getRes = await gmGithubRequest('GET', GITHUB_API_URL);
                if (getRes.status === 200) sha = JSON.parse(getRes.text).sha;
            } catch(e) {}

            // 업로드
            const content = btoa(unescape(encodeURIComponent(JSON.stringify(payload, null, 2))));
            const putRes = await gmGithubRequest('PUT', GITHUB_API_URL, {
                message: `인계: ${myName} (${ts})`,
                content,
                ...(sha ? { sha } : {})
            });

            if (putRes.status === 200 || putRes.status === 201) {
                handoverData = payload;
                renderGrid(payload.tab1, payload.tab2);
                setBadge(payload.tab1.length + payload.tab2.length);
                setStatus(`✅ 인계 완료 (${payload.tab1.length + payload.tab2.length}대)`, '#22c55e');
            } else {
                throw new Error(`${putRes.status}`);
            }
        } catch(e) {
            setStatus(`❌ 업로드 실패 (${e.message})`, '#ef4444');
        }
    });

    /* ============================================================
        SECTION 13. URL 변경 감지 (SPA 대응)
    ============================================================ */
    let lastUrl = location.href;
    new MutationObserver(() => {
        if (location.href === lastUrl) return;
        lastUrl = location.href;
        const isTarget = location.href.includes('/ko/remote/multiple')
            || location.href.includes('multimonitoring.vercel.app');
        peekTab.style.display = isTarget ? 'block' : 'none';
        if (!isTarget) {
            closePanel();
            if (confirmLoopId) clearInterval(confirmLoopId);
        }
    }).observe(document.body, { subtree: true, childList: true });

    /* ============================================================
        SECTION 14. 초기 실행
    ============================================================ */
    startConfirmLoop();
    autoFetch(); // 페이지 진입 시 자동으로 인계 데이터 로드

})();

(function () {
    'use strict';

    if (window.__handoverLoaded) return;
    window.__handoverLoaded = true;

    const currUrl = window.location.href;
    const isMonitoringPage = currUrl.includes('go.neubie.ai/ko/remote/multiple/monitoring')
        || currUrl.includes('multimonitoring.vercel.app');

    if (!isMonitoringPage) return;

    /* ============================================================
        SECTION 1. 상수 및 유틸
    ============================================================ */
    const HANDOVER_RAW_URL = 'https://raw.githubusercontent.com/ubase00070/monitoring_handover/main/handover.json';
    const GITHUB_TOKEN = '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';
    const GITHUB_API_URL = 'https://api.github.com/repos/ubase00070/monitoring_handover/contents/handover.json';
    const MAX_SELECT = 6;

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    // 시크릿 탭 여부 감지
    const isIncognito = (() => {
        try {
            // 시크릿 탭에서는 chrome.extension.inIncognitoContext = true
            // 또는 window.chrome.runtime 감지로 우회
            return window.chrome?.extension?.inIncognitoContext === true;
        } catch (e) { return false; }
    })();

    /* ============================================================
        SECTION 2. 상태
    ============================================================ */
    let selectedCells = [];      // 현재 선택된 셀들
    let handoverData = null;     // fetch한 인계 데이터
    let confirmedUnits = [];     // content.js가 확인한 실제 연결 기체들

    /* ============================================================
        SECTION 3. 빼꼼 탭 + 패널 UI 생성
    ============================================================ */
    const peekTab = document.createElement('div');
    peekTab.id = 'ho-peek-tab';
    peekTab.innerHTML = '📋 인계';
    Object.assign(peekTab.style, {
        position: 'fixed', top: '0', left: '50%',
        transform: 'translateX(-50%)', zIndex: '2147483647',
        background: 'rgba(240,242,248,0.95)', color: '#1a1f2e',
        padding: '4px 22px', borderRadius: '0 0 10px 10px',
        fontSize: '12px', fontWeight: '700', fontFamily: 'Pretendard,sans-serif',
        cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
        letterSpacing: '0.04em', userSelect: 'none',
        transition: 'opacity 0.2s', border: '1px solid rgba(255,255,255,0.3)',
        borderTop: 'none',
    });

    const panel = document.createElement('div');
    panel.id = 'ho-panel';
    Object.assign(panel.style, {
        position: 'fixed', top: '-320px', left: '50%',
        transform: 'translateX(-50%)', zIndex: '2147483646',
        width: '740px', background: 'rgba(232,236,245,0.97)',
        borderRadius: '0 0 18px 18px', padding: '14px 18px 14px',
        fontFamily: 'Pretendard,sans-serif',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        border: '1px solid rgba(255,255,255,0.4)', borderTop: 'none',
        transition: 'top 0.3s cubic-bezier(0.4,0,0.2,1)', userSelect: 'none',
    });

    // 본인/멀티 라벨 (시크릿 여부로 활성 탭 구분)
    const tab1Label = isIncognito ? '본인 계정' : '본인 계정';
    const tab2Label = isIncognito ? '멀티 계정' : '멀티 계정';
    const tab1QuickActive = !isIncognito;  // 일반탭 = 본인계정 활성
    const tab2QuickActive = isIncognito;   // 시크릿탭 = 멀티계정 활성

    panel.innerHTML = `
        <!-- 헤더 -->
        <div style="display:flex;justify-content:space-between;align-items:center;
            margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(0,0,0,0.1);">
            <span style="font-size:13px;font-weight:700;color:#1a1f2e;letter-spacing:0.03em;">
                📋 인계 기체 현황
            </span>
            <div style="display:flex;gap:8px;align-items:center;">
                <span id="ho-status-text" style="font-size:11px;color:#64748b;"></span>
                <button id="ho-fetch-btn" style="
                    background:#3b82f6;color:#fff;border:none;
                    padding:5px 14px;border-radius:8px;font-size:12px;
                    font-weight:600;cursor:pointer;font-family:Pretendard,sans-serif;">
                    📥 인계 받기
                </button>
                <button id="ho-upload-btn" style="
                    background:#f59e0b;color:#fff;border:none;
                    padding:5px 14px;border-radius:8px;font-size:12px;
                    font-weight:600;cursor:pointer;font-family:Pretendard,sans-serif;">
                    📤 인계 완료
                </button>
            </div>
        </div>

        <!-- 그리드 영역 -->
        <div style="display:flex;gap:12px;">

            <!-- 본인 탭 (3×2) -->
            <div style="flex:1;">
                <div style="display:flex;align-items:center;justify-content:center;
                    gap:8px;margin-bottom:6px;">
                    <span style="font-size:10px;font-weight:700;color:#64748b;
                        letter-spacing:0.06em;">본인 계정</span>
                    <button id="ho-quick-tab1" style="
                        font-size:10px;font-weight:700;padding:2px 8px;
                        border-radius:6px;border:none;cursor:pointer;
                        font-family:Pretendard,sans-serif;
                        background:${tab1QuickActive ? '#3b82f6' : '#cbd5e1'};
                        color:${tab1QuickActive ? '#fff' : '#94a3b8'};
                        ${!tab1QuickActive ? 'cursor:not-allowed;opacity:0.5;' : ''}
                    ">⚡ 바로 시작</button>
                </div>
                <div id="ho-grid-tab1" style="
                    display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">
                    ${Array(6).fill(0).map((_, i) => `
                        <button class="ho-cell" data-tab="1" data-idx="${i}" style="
                            height:52px;border-radius:10px;
                            border:1.5px dashed #c0c8d8;
                            background:rgba(255,255,255,0.5);
                            color:#94a3b8;font-size:11px;
                            font-family:Pretendard,sans-serif;
                            cursor:default;transition:all 0.15s;
                            display:flex;align-items:center;justify-content:center;
                            text-align:center;line-height:1.3;padding:4px;
                        ">-</button>
                    `).join('')}
                </div>
            </div>

            <!-- 구분선 -->
            <div style="width:1px;background:rgba(0,0,0,0.12);margin:0 2px;"></div>

            <!-- 멀티 탭 (3×2) -->
            <div style="flex:1;">
                <div style="display:flex;align-items:center;justify-content:center;
                    gap:8px;margin-bottom:6px;">
                    <span style="font-size:10px;font-weight:700;color:#64748b;
                        letter-spacing:0.06em;">멀티 계정</span>
                    <button id="ho-quick-tab2" style="
                        font-size:10px;font-weight:700;padding:2px 8px;
                        border-radius:6px;border:none;cursor:pointer;
                        font-family:Pretendard,sans-serif;
                        background:${tab2QuickActive ? '#3b82f6' : '#cbd5e1'};
                        color:${tab2QuickActive ? '#fff' : '#94a3b8'};
                        ${!tab2QuickActive ? 'cursor:not-allowed;opacity:0.5;' : ''}
                    ">⚡ 바로 시작</button>
                </div>
                <div id="ho-grid-tab2" style="
                    display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">
                    ${Array(6).fill(0).map((_, i) => `
                        <button class="ho-cell" data-tab="2" data-idx="${i}" style="
                            height:52px;border-radius:10px;
                            border:1.5px dashed #c0c8d8;
                            background:rgba(255,255,255,0.5);
                            color:#94a3b8;font-size:11px;
                            font-family:Pretendard,sans-serif;
                            cursor:default;transition:all 0.15s;
                            display:flex;align-items:center;justify-content:center;
                            text-align:center;line-height:1.3;padding:4px;
                        ">-</button>
                    `).join('')}
                </div>
            </div>
        </div>

        <!-- 시작하기 버튼 + 안내 -->
        <div style="margin-top:10px;display:flex;align-items:center;justify-content:space-between;">
            <div style="font-size:10px;color:#94a3b8;letter-spacing:0.02em;">
                버튼 선택 후 시작하기 &nbsp;|&nbsp;
                <kbd style="background:#e2e8f0;border:1px solid #cbd5e1;
                    border-radius:4px;padding:1px 5px;font-size:10px;color:#475569;">
                    Alt+M
                </kbd>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span id="ho-select-count" style="font-size:11px;color:#64748b;">
                    선택 0 / ${MAX_SELECT}
                </span>
                <button id="ho-start-btn" style="
                    background:#22c55e;color:#fff;border:none;
                    padding:7px 22px;border-radius:10px;font-size:13px;
                    font-weight:700;cursor:pointer;font-family:Pretendard,sans-serif;
                    opacity:0.4;pointer-events:none;transition:all 0.15s;
                ">🚀 시작하기</button>
            </div>
        </div>
    `;

    document.body.appendChild(peekTab);
    document.body.appendChild(panel);

    /* ============================================================
        SECTION 4. 열기/닫기 토글
    ============================================================ */
    let isPanelOpen = false;

    function openPanel() {
        isPanelOpen = true;
        panel.style.top = '0px';
        peekTab.style.opacity = '0';
        peekTab.style.pointerEvents = 'none';
    }

    function closePanel() {
        isPanelOpen = false;
        panel.style.top = '-320px';
        peekTab.style.opacity = '1';
        peekTab.style.pointerEvents = 'auto';
    }

    peekTab.addEventListener('click', openPanel);

    document.addEventListener('mousedown', (e) => {
        if (isPanelOpen && !panel.contains(e.target) && e.target !== peekTab) {
            closePanel();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.altKey && (e.key === 'm' || e.key === 'M' || e.key === 'ㅡ')) {
            e.preventDefault();
            isPanelOpen ? closePanel() : openPanel();
        }
    });

    /* ============================================================
        SECTION 5. 상태 및 선택 관리
    ============================================================ */
    function setStatus(msg, color = '#64748b') {
        const el = document.getElementById('ho-status-text');
        if (el) { el.textContent = msg; el.style.color = color; }
    }

    function updateSelectCount() {
        const countEl = document.getElementById('ho-select-count');
        const startBtn = document.getElementById('ho-start-btn');
        const n = selectedCells.length;
        if (countEl) countEl.textContent = `선택 ${n} / ${MAX_SELECT}`;
        if (startBtn) {
            if (n > 0) {
                startBtn.style.opacity = '1';
                startBtn.style.pointerEvents = 'auto';
            } else {
                startBtn.style.opacity = '0.4';
                startBtn.style.pointerEvents = 'none';
            }
        }
    }

    function markCellSelected(cell) {
        cell.style.background = 'rgba(59,130,246,0.15)';
        cell.style.border = '1.5px solid #3b82f6';
        cell.style.color = '#1d4ed8';
        cell.dataset.selected = 'true';
    }

    function markCellUnselected(cell) {
        cell.style.background = 'rgba(255,255,255,0.85)';
        cell.style.border = '1.5px solid #93c5fd';
        cell.style.color = '#1e293b';
        cell.dataset.selected = 'false';
    }

    function markCellConfirmed(cell) {
        // 실제 연결 확인됨 → 회색 처리
        cell.style.background = 'rgba(203,213,225,0.4)';
        cell.style.border = '1.5px solid #94a3b8';
        cell.style.color = '#94a3b8';
        cell.style.cursor = 'default';
        cell.dataset.done = 'true';
        cell.dataset.selected = 'false';
    }

    /* ============================================================
        SECTION 6. 그리드 렌더링
    ============================================================ */
    function renderGrid(tab1Units = [], tab2Units = []) {
        selectedCells = [];
        updateSelectCount();

        ['tab1', 'tab2'].forEach((tab, tabIdx) => {
            const units = tabIdx === 0 ? tab1Units : tab2Units;
            const grid = document.getElementById(`ho-grid-${tab}`);
            if (!grid) return;

            const cells = grid.querySelectorAll('.ho-cell');
            cells.forEach((cell, i) => {
                const name = units[i] || null;
                cell.dataset.done = 'false';
                cell.dataset.selected = 'false';

                if (name) {
                    cell.textContent = name;
                    cell.style.background = 'rgba(255,255,255,0.85)';
                    cell.style.color = '#1e293b';
                    cell.style.border = '1.5px solid #93c5fd';
                    cell.style.cursor = 'pointer';
                    cell.style.fontWeight = '600';
                    cell.dataset.unit = name;
                } else {
                    cell.textContent = '-';
                    cell.style.background = 'rgba(255,255,255,0.5)';
                    cell.style.color = '#94a3b8';
                    cell.style.border = '1.5px dashed #c0c8d8';
                    cell.style.cursor = 'default';
                    cell.style.fontWeight = '400';
                    cell.dataset.unit = '';
                }
            });
        });

        // content.js 감지 루프 시작
        startConfirmLoop();
    }

    /* ============================================================
        SECTION 7. 셀 클릭 → 선택/해제
    ============================================================ */
    document.addEventListener('click', (e) => {
        const cell = e.target.closest('.ho-cell');
        if (!cell || !cell.dataset.unit) return;
        if (cell.dataset.done === 'true') return;

        const isSelected = cell.dataset.selected === 'true';

        if (isSelected) {
            // 선택 해제
            markCellUnselected(cell);
            selectedCells = selectedCells.filter(c => c !== cell);
        } else {
            // 최대 6대 제한
            if (selectedCells.length >= MAX_SELECT) {
                setStatus(`⚠️ 최대 ${MAX_SELECT}대까지만 선택 가능`, '#f59e0b');
                return;
            }
            markCellSelected(cell);
            selectedCells.push(cell);
        }

        updateSelectCount();
        setStatus('');
    });

    /* ============================================================
        SECTION 8. 시작하기 버튼
    ============================================================ */
    document.getElementById('ho-start-btn').addEventListener('click', async () => {
        if (selectedCells.length === 0) return;
        const units = selectedCells.map(c => c.dataset.unit).filter(Boolean);
        await runAutoSelect(units);
    });

    /* ============================================================
        SECTION 9. 바로 시작 버튼
    ============================================================ */
    document.getElementById('ho-quick-tab1').addEventListener('click', async () => {
        if (!tab1QuickActive || !handoverData) return;
        const units = (handoverData.tab1 || []).filter(Boolean);
        if (units.length === 0) { setStatus('⚠️ 본인 계정 기체 없음', '#f59e0b'); return; }

        // 그리드 셀 자동 선택 표시
        const grid = document.getElementById('ho-grid-tab1');
        const cells = grid.querySelectorAll('.ho-cell');
        selectedCells = [];
        cells.forEach(cell => {
            if (cell.dataset.unit && cell.dataset.done !== 'true') {
                markCellSelected(cell);
                selectedCells.push(cell);
            }
        });
        updateSelectCount();
        await sleep(200);
        await runAutoSelect(units);
    });

    document.getElementById('ho-quick-tab2').addEventListener('click', async () => {
        if (!tab2QuickActive || !handoverData) return;
        const units = (handoverData.tab2 || []).filter(Boolean);
        if (units.length === 0) { setStatus('⚠️ 멀티 계정 기체 없음', '#f59e0b'); return; }

        const grid = document.getElementById('ho-grid-tab2');
        const cells = grid.querySelectorAll('.ho-cell');
        selectedCells = [];
        cells.forEach(cell => {
            if (cell.dataset.unit && cell.dataset.done !== 'true') {
                markCellSelected(cell);
                selectedCells.push(cell);
            }
        });
        updateSelectCount();
        await sleep(200);
        await runAutoSelect(units);
    });

    /* ============================================================
        SECTION 10. 자동 선택 실행 (내일 뉴비고 DOM 연동)
    ============================================================ */
    async function runAutoSelect(units) {
        setStatus(`⏳ ${units.length}대 자동 선택 중...`, '#3b82f6');

        // TODO 내일: 실제 뉴비고 모달 DOM 조작
        // 지금은 구조 확인용 콘솔 출력
        console.log('[인계] 자동 선택할 기체:', units);

        // 임시: 0.5초 후 완료 표시
        await sleep(500);
        setStatus(`✅ ${units.length}대 선택 완료 — 시작하기 클릭`, '#22c55e');

        // TODO 내일: clickStartButton() 호출
    }

    /* ============================================================
        SECTION 11. content.js 연결 확인 루프
        content.js가 body attribute에 monitoringUnits를 주입하므로
        그걸 읽어서 실제 연결 여부 확인
    ============================================================ */
    let confirmLoopId = null;

    function startConfirmLoop() {
        if (confirmLoopId) clearInterval(confirmLoopId);

        confirmLoopId = setInterval(() => {
            try {
                const raw = document.body.getAttribute('data-last-units');
                if (!raw) return;
                const currentUnits = JSON.parse(raw);

                // 선택된 셀들 중 실제로 연결된 기체는 회색 처리
                const allCells = document.querySelectorAll('.ho-cell');
                allCells.forEach(cell => {
                    if (cell.dataset.done === 'true') return;
                    if (!cell.dataset.unit) return;

                    const unitName = cell.dataset.unit.replace(/\s+/g, '');
                    const isConnected = currentUnits.some(u =>
                        u.replace(/\s+/g, '').includes(unitName) ||
                        unitName.includes(u.replace(/\s+/g, ''))
                    );

                    if (isConnected) {
                        markCellConfirmed(cell);
                        selectedCells = selectedCells.filter(c => c !== cell);
                        updateSelectCount();
                    }
                });
            } catch (e) {}
        }, 1500); // 1.5초마다 확인
    }

    /* ============================================================
        SECTION 12. 인계 받기 (fetch)
    ============================================================ */
    document.getElementById('ho-fetch-btn').addEventListener('click', async () => {
        setStatus('⏳ 불러오는 중...', '#3b82f6');
        try {
            // TODO 내일: GitHub API로 교체 (캐시 없이)
            const res = await fetch(HANDOVER_RAW_URL + '?t=' + Date.now());
            if (!res.ok) throw new Error('fetch 실패');
            handoverData = await res.json();

            const tab1 = handoverData.tab1 || handoverData.units || [];
            const tab2 = handoverData.tab2 || [];

            renderGrid(tab1, tab2);

            // 바로 시작 버튼 활성화 상태 업데이트
            updateQuickBtnState(tab1, tab2);

            setStatus(`📋 ${tab1.length + tab2.length}대 (${handoverData.handover_by || '?'})`, '#3b82f6');
        } catch (e) {
            setStatus('❌ 불러오기 실패', '#ef4444');
        }
    });

    function updateQuickBtnState(tab1, tab2) {
        const q1 = document.getElementById('ho-quick-tab1');
        const q2 = document.getElementById('ho-quick-tab2');

        // 현재 탭에 맞는 버튼만 활성화
        // tab1QuickActive: 일반탭(본인계정), tab2QuickActive: 시크릿탭(멀티계정)
        if (q1) {
            const hasData = tab1.length > 0;
            q1.style.background = (tab1QuickActive && hasData) ? '#3b82f6' : '#cbd5e1';
            q1.style.color = (tab1QuickActive && hasData) ? '#fff' : '#94a3b8';
            q1.style.opacity = (tab1QuickActive && hasData) ? '1' : '0.5';
            q1.style.cursor = (tab1QuickActive && hasData) ? 'pointer' : 'not-allowed';
            q1.style.pointerEvents = (tab1QuickActive && hasData) ? 'auto' : 'none';
        }
        if (q2) {
            const hasData = tab2.length > 0;
            q2.style.background = (tab2QuickActive && hasData) ? '#3b82f6' : '#cbd5e1';
            q2.style.color = (tab2QuickActive && hasData) ? '#fff' : '#94a3b8';
            q2.style.opacity = (tab2QuickActive && hasData) ? '1' : '0.5';
            q2.style.cursor = (tab2QuickActive && hasData) ? 'pointer' : 'not-allowed';
            q2.style.pointerEvents = (tab2QuickActive && hasData) ? 'auto' : 'none';
        }
    }

    /* ============================================================
        SECTION 13. 인계 완료 (업로드) — 내일 본격 구현
    ============================================================ */
    document.getElementById('ho-upload-btn').addEventListener('click', async () => {
        setStatus('⏳ 업로드 중...', '#f59e0b');

        // TODO 내일: 실제 기체 목록 추출 + 권한 검증 + GitHub API push
        // 지금: 더미 데이터로 구조 테스트
        const dummyData = {
            updatedAt: new Date().toISOString(),
            handover_by: '테스트',
            tab1: ['테스트 1호기', '테스트 2호기'],
            tab2: []
        };
        renderGrid(dummyData.tab1, dummyData.tab2);
        updateQuickBtnState(dummyData.tab1, dummyData.tab2);
        setStatus('✅ 업로드 완료 (테스트)', '#22c55e');
    });

    /* ============================================================
        SECTION 14. URL 변경 감지 (SPA 대응)
    ============================================================ */
    let lastUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            const isTarget = location.href.includes('/ko/remote/multiple/monitoring')
                || location.href.includes('multimonitoring.vercel.app');
            peekTab.style.display = isTarget ? 'block' : 'none';
            if (!isTarget) {
                closePanel();
                if (confirmLoopId) clearInterval(confirmLoopId);
            }
        }
    }).observe(document.body, { subtree: true, childList: true });

    // 초기 confirmLoop (페이지 로드 시부터 감시)
    startConfirmLoop();

})();
